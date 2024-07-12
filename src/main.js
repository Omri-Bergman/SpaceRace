import * as THREE from 'three';
import GUI from 'lil-gui';
import gsap from 'gsap';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { ToonShader1 } from 'three/addons/shaders/ToonShader.js';
import { BlurScrollEffect as BlurScrollEffect3 } from './effectScroll/effect-3/blurScrollEffect.js';
import { BlurScrollEffect as BlurScrollEffect4 } from './effectScroll/effect-4/blurScrollEffect.js';
import { initSmoothScrolling } from './effectScroll/smoothscroll.mjs';
import { preloadFonts } from './effectScroll/utils.js';
import Stats from 'stats.js';
import { initSecondSectionThree } from './secondSectionThree.js';
import { sketch1, sketch2 } from './p5Sketches.js';

let scene, camera, renderer;
let particles = [];
let secondSection;
let marchingCubesEffect;
const clock = new THREE.Clock();
let previousTime = 0;
let gui;

// Initialize stats
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);


async function initThreeJS() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 10;

  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas.webgl'),
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // gui = new GUI();

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(0, 0, 10);
  scene.add(pointLight);

  // Create particles
  function createParticles(count, texturePath, size, scene) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const textureLoader = new THREE.TextureLoader();
    const particleTexture = textureLoader.load(texturePath);

    const particlesMaterial = new THREE.PointsMaterial({
        sizeAttenuation: true,
        size: size,
        alphaMap: particleTexture,
        transparent: true,
        depthWrite: false
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    return particles;
  }

  const particlesCount = 350;
  particles[0] = createParticles(particlesCount, '/textures/particle1.png', 0.06, scene);
  particles[1] = createParticles(particlesCount, '/textures/particle2.png', 0.08, scene);
  particles[2] = createParticles(particlesCount, '/textures/particle3.png', 0.07, scene);

  initMarchingCubes();
}


function setupGui() {
  gui = new GUI();
  const marchingCubesFolder = gui.addFolder('Marching Cubes');

  const effectController = {
    speed: 0.15,
    numBlobs: 22,
    resolution: 14,
    isolation: 250,
  };

  marchingCubesFolder.add(effectController, 'speed', 0.1, 8.0, 0.05).onChange(updateMarchingCubes);
  marchingCubesFolder.add(effectController, 'numBlobs', 1, 50, 1).onChange(updateMarchingCubes);
  marchingCubesFolder.add(effectController, 'resolution', 14, 100, 1).onChange((value) => {
    marchingCubesEffect.init(Math.floor(value));
  });
  marchingCubesFolder.add(effectController, 'isolation', 10, 300, 1).onChange((value) => {
    marchingCubesEffect.isolation = value;
  });

  // Store effectController in a place accessible by updateMarchingCubes
  marchingCubesEffect.effectController = effectController;
}


function initMarchingCubes() {
  const resolution = 14;
  
  // Create lights first
  const pointLight = new THREE.PointLight(0xffffff, 1, 50);
  pointLight.position.set(0, 0, 5);

  const directionalLight = new THREE.DirectionalLight(0xff7c00, 0.5);
  directionalLight.position.set(5, 5, 5);

  const marchingCubesAmbientLight = new THREE.AmbientLight(0x323232, 3);

  // Now create the material using these lights
  const material = createToonMaterial(ToonShader1, directionalLight, marchingCubesAmbientLight);
  
  // Create the MarchingCubes effect
  marchingCubesEffect = new MarchingCubes(resolution, material, true, true, 100000);
  
  const section = document.getElementById('section4');
  const rect = section.getBoundingClientRect();
  
  marchingCubesEffect.position.set(0, 0, 0);
    marchingCubesEffect.scale.set(5, 5, 5);
  marchingCubesEffect.enableUvs = false;
  marchingCubesEffect.enableColors = false;
  marchingCubesEffect.renderOrder = 0;

  // Add lights to the marchingCubesEffect
  marchingCubesEffect.add(pointLight);
  marchingCubesEffect.add(directionalLight);
  marchingCubesEffect.add(marchingCubesAmbientLight);

  scene.add(marchingCubesEffect);

  // Setup GUI
  setupGui();
}

function createToonMaterial(shader, directionalLight, directionalAmbientLight) {
  const uniforms = THREE.UniformsUtils.clone(shader.uniforms);
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader
  });

  material.uniforms['uDirLightPos'].value = directionalLight.position;
  material.uniforms['uDirLightColor'].value = directionalLight.color;
  material.uniforms['uAmbientLightColor'].value = directionalAmbientLight.color;

  return material;
}

function updateCameraPosition(scrollY) {
  const totalCameraMove = 4;
  const scrollProgress = Math.min(scrollY / (window.innerHeight * 0.8), 1);
  const newY = -scrollProgress * totalCameraMove;
  camera.position.y = newY;
}

function isSectionVisible(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return false;

  const rect = section.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  
  return (rect.top <= windowHeight && rect.bottom >= 0);
}

function updateMarchingCubes(time) {
  if (!marchingCubesEffect.visible) return;

  const effectController = marchingCubesEffect.effectController;
  const numblobs = effectController.numBlobs;
  const subtract = 12;
  const strength = 1.2 / ((Math.sqrt(numblobs) - 1) / 4 + 1);

  marchingCubesEffect.reset();

  for (let i = 0; i < numblobs; i++) {
    const ballx = Math.sin(i + 1.26 * time * effectController.speed * (1.03 + 0.5 * Math.cos(0.21 * i))) * 0.27 + 0.5;
    const bally = Math.abs(Math.cos(i + 1.12 * time * effectController.speed * Math.cos(1.22 + 0.1424 * i))) * 0.77;
    const ballz = Math.cos(i + 1.32 * time * effectController.speed * 0.1 * Math.sin((0.92 + 0.53 * i))) * 0.27 + 0.5;

    marchingCubesEffect.addBall(ballx, bally, ballz, strength, subtract);
  }

  marchingCubesEffect.update();
}

function animate() {
  stats.begin();
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Animate particles
  particles[0].rotation.y = elapsedTime * 0.02;
  particles[1].rotation.y = elapsedTime * -0.03; 
  particles[2].rotation.y = elapsedTime * 0.01; 

  // Update camera position based on scroll
  updateCameraPosition(window.scrollY);

  // Update MarchingCubes position
  handleScroll();

  // Update MarchingCubes
  updateMarchingCubes(elapsedTime);

  // Final render to screen
  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(animate);
}

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleScroll() {
  const scrollY = window.scrollY;
  
  // Show/hide second section based on scroll position
  const secondSectionContainer = document.getElementById('second-section-container');
  if (secondSection && secondSection.updateScrollPosition) {
    const secondSectionTop = document.getElementById('section2').offsetTop;
    const relativeScrollY = scrollY - secondSectionTop;
    secondSection.updateScrollPosition(relativeScrollY);
  }

  // Update MarchingCubes position
  if (marchingCubesEffect) {
    const section = document.getElementById('section4');
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Calculate the position of the effect
    const effectY = rect.top - viewportHeight + (viewportHeight * 0.5); // 0.5 centers it vertically
    
    // Set the position of the effect
    marchingCubesEffect.position.y = -effectY * 0.1; // The 0.1 factor slows down the movement
    
    // Show/hide the effect based on section visibility
    marchingCubesEffect.visible = rect.top < viewportHeight && rect.bottom > 0;
  }
}
async function init() {
  await initThreeJS();

  const secondSectionContainer = document.getElementById('second-section-container');
  secondSection = initSecondSectionThree(secondSectionContainer);

  // Initialize p5 sketches
  new p5(sketch1, document.getElementById('p5-sketch-1'));
  new p5(sketch2, document.getElementById('p5-sketch-2'));

  // Event listeners
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('resize', handleResize);

  // Texts
  initSmoothScrolling();
  preloadFonts().then(() => {
    const effects = [
      { selector: '[data-effect-1]', Effect: BlurScrollEffect4 },
      { selector: '[data-effect-2]', Effect: BlurScrollEffect3 },
      { selector: '[data-effect-3]', Effect: BlurScrollEffect4 },
      { selector: '[data-effect-4]', Effect: BlurScrollEffect3 }
    ];

    effects.forEach(({ selector, Effect }) => {
      const element = document.querySelector(selector);
      if (element) {
        new Effect(element);
      }
    });
  });

  animate();
}

function cleanup() {
  // Remove event listeners
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', handleResize);

  // Dispose of Three.js objects
  scene.traverse((object) => {
    if (object.isMesh) {
      object.geometry.dispose();
      if (object.material.isMaterial) {
        object.material.dispose();
      } else {
        // an array of materials
        for (const material of object.material) material.dispose();
      }
    }
  });

  // Dispose of renderer
  renderer.dispose();

  // Cleanup second section
  if (secondSection) {
    secondSection.dispose();
  }

  // Remove GUI
  if (gui) gui.destroy();

  // Cleanup p5 sketches if necessary
  // This depends on how your p5 sketches are set up
}

document.addEventListener('DOMContentLoaded', init);

// You might want to call cleanup() when the user navigates away from the page
// or when you want to reset everything
// window.addEventListener('beforeunload', cleanup);