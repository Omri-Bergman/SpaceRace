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
const marchingCubesScrollSpeed = 0.02; // Adjust this value to change the speed

// Initialize stats
const stats = new Stats();
stats.showPanel(0);
// document.body.appendChild(stats.dom);


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

  function getTotalDocumentHeight() {
    const body = document.body;
    const html = document.documentElement;
    
    return Math.max(
      body.scrollHeight, body.offsetHeight,
      html.clientHeight, html.scrollHeight, html.offsetHeight
    );
  }

  // Create particles
  function createParticles(count, texturePath, size, scene) {
    const positions = new Float32Array(count * 3);
    const totalHeight = getTotalDocumentHeight();
    const yScale = totalHeight / window.innerHeight; // Convert document height to Three.js units
  
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * yScale * 2 * 3; // Multiply by 2 to center around zero
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
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

  const particlesCount = 700;
  particles[0] = createParticles(particlesCount, '/textures/particle1.png', 0.14, scene);
  particles[1] = createParticles(particlesCount, '/textures/particle2.png', 0.16, scene);
  particles[2] = createParticles(particlesCount, '/textures/particle3.png', 0.15, scene);

  initMarchingCubes();
}


function setupGui() {
  gui = new GUI();
  gui.hide();
  const marchingCubesFolder = gui.addFolder('Marching Cubes');

  const effectController = {
    speed: 0.15,
    numBlobs: 36,
    resolution: 14,
    isolation: 488,
    ballSize: 2.4
  };

  marchingCubesFolder.add(effectController, 'speed', 0.1, 8.0, 0.05).onChange(updateMarchingCubes);
  marchingCubesFolder.add(effectController, 'numBlobs', 1, 50, 1).onChange(updateMarchingCubes);
  marchingCubesFolder.add(effectController, 'resolution', 6, 100, 0.5).onChange((value) => {
    marchingCubesEffect.init(Math.floor(value));
  });
  marchingCubesFolder.add(effectController, 'isolation', 10, 500, 1).onChange((value) => {
    marchingCubesEffect.isolation = value;
  });
  marchingCubesFolder.add(effectController, 'ballSize', 0.1, 4).onChange(updateMarchingCubes);

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
  marchingCubesEffect.isolation = 488; // Set initial isolation value

  const section = document.getElementById('section3');
  const rect = section.getBoundingClientRect();
  
  marchingCubesEffect.position.set(0, 0, -6);
    marchingCubesEffect.scale.set(12, 12,7);
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

let currentCameraY = 0;

function updateCameraPosition(scrollY) {
  const moveSpeed = 0.004;
  const targetY = -scrollY * moveSpeed;
  currentCameraY += (targetY - currentCameraY) * 0.1; // Easing
  camera.position.y = currentCameraY;
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
  const strength = effectController.ballSize / ((Math.sqrt(numblobs) - 1) / 4 + 1);

  marchingCubesEffect.reset();

  for (let i = 0; i < numblobs; i++) {
    const ballx = Math.sin(i + 1.26 * time * effectController.speed * (1.03 + 0.5 * Math.cos(0.21 * i))) * 0.5 + 0.5;   
    
    // Modified bally calculation
    const rawBally = Math.abs(Math.cos(i + 1.12 * time * effectController.speed * Math.cos(1.22 + 0.1424 * i)));
    const bally = 0.15 + (rawBally * 0.7); // This keeps bally between 0.15 and 0.85    
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
  particles[1].rotation.y = elapsedTime * 0.03; 
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
    const section = document.getElementById('section3');
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Calculate the position of the effect
    const effectY = rect.top - viewportHeight + (viewportHeight * 0.8); // 0.5 centers it vertically
    // Set the position of the effect with slower movement
    marchingCubesEffect.position.y = -effectY * marchingCubesScrollSpeed - 3;
    // Show/hide the effect based on section visibility
    // marchingCubesEffect.visible = rect.top < viewportHeight && rect.bottom > 0;
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


document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const html = document.documentElement;

  // Define an array of RGB colors for the gradient
  const colors = [
      { r: 0, g: 0, b: 0 },       // Black
      { r: 30, g: 30, b: 86 },    // Dark Blue
      { r: 94, g: 45, b: 150 },   // Deep Blue
      { r: 214, g: 79, b: 21 },   // Dark Purple
      { r: 252, g: 192, b: 54 },  // Orangish Sky
  ];

  // Function to interpolate between two colors
  function interpolateColor(color1, color2, factor) {
    return {
      r: Math.round(color1.r + factor * (color2.r - color1.r)),
      g: Math.round(color1.g + factor * (color2.g - color1.g)),
      b: Math.round(color1.b + factor * (color2.b - color1.b))
    };
  }

  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight) - window.innerHeight;
    const scrollPercentage = scrollTop / scrollHeight;

    let startColor, endColor;

    if (scrollPercentage <= 0.2) {
      // Solid black for the first 20% of scroll
      startColor = endColor = colors[0];
    } else {
      // Adjust the scroll percentage to account for the initial 20%
      const adjustedScrollPercentage = (scrollPercentage - 0.2) / 0.8;

      if (adjustedScrollPercentage < 0.33) {
        const factor = adjustedScrollPercentage / 0.33;
        startColor = colors[0];
        endColor = interpolateColor(colors[0], colors[1], factor);
      } else if (adjustedScrollPercentage < 0.66) {
        const factor = (adjustedScrollPercentage - 0.33) / 0.33;
        startColor = interpolateColor(colors[0], colors[1], factor);
        endColor = interpolateColor(colors[1], colors[2], factor);
      } else {
        const factor = (adjustedScrollPercentage - 0.66) / 0.34;
        startColor = interpolateColor(colors[1], colors[2], factor);
        endColor = interpolateColor(colors[2], colors[3], factor);
      }
    }

    // Set the gradient colors
    document.documentElement.style.setProperty('--color-gradient-start', `rgb(${startColor.r}, ${startColor.g}, ${startColor.b})`);
    document.documentElement.style.setProperty('--color-gradient-end', `rgb(${endColor.r}, ${endColor.g}, ${endColor.b})`);
  });
});