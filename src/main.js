import * as THREE from 'three';
import GUI from 'lil-gui';
import gsap from 'gsap';

import { initSecondSectionThree } from './secondSectionThree.js';
import { sketch1, sketch2 } from './p5Sketches.js';

let scene, camera, renderer;
let particles = [];
let secondSection;
const clock = new THREE.Clock();
let previousTime = 0;
let gui;

async function initThreeJS() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 6;

  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas.webgl'),
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  gui = new GUI();

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(0, 0, 10);
  scene.add(pointLight);

  // Create particles
  // Function to create particles
function createParticles(count, texturePath, size, scene) {
  // Create particle geometry
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }

  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Load texture
  const textureLoader = new THREE.TextureLoader();
  const particleTexture = textureLoader.load(texturePath);

  // Create material
  const particlesMaterial = new THREE.PointsMaterial({
      sizeAttenuation: true,
      size: size,
      alphaMap: particleTexture,
      transparent: true,
      depthWrite: false
  });

  // Create points and add to scene
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  return particles;
}

// Usage
const particlesCount = 350;
 particles[0] = createParticles(particlesCount, '/textures/particle1.png', 0.06, scene);
 particles[1] = createParticles(particlesCount, '/textures/particle2.png', 0.08, scene);
 particles[2] = createParticles(particlesCount, '/textures/particle3.png', 0.07, scene);

}

function updateCameraPosition(scrollY) {
  const totalCameraMove = 4;
  const scrollProgress = Math.min(scrollY / (window.innerHeight * 0.8), 1);
  const newY = -scrollProgress * totalCameraMove;
  camera.position.y = newY;
}

function animate() {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Animate particles
  particles[0].rotation.y = elapsedTime * 0.02;
  particles[1].rotation.y = elapsedTime * -0.03; 
  particles[2].rotation.y = elapsedTime * 0.01; 

  // Update camera position based on scroll
  updateCameraPosition(window.scrollY);

  // Final render to screen
  renderer.render(scene, camera);

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
}

async function init() {
  await initThreeJS();

  const secondSectionContainer = document.getElementById('second-section-container');
  secondSection = initSecondSectionThree(secondSectionContainer);

  // Initialize p5 sketches
  new p5(sketch1, document.getElementById('p5-sketch-1'));
  new p5(sketch2, document.getElementById('p5-sketch-2'));

  const secondSectionFolder = gui.addFolder('Second Section');
  secondSectionFolder.add(secondSection.params, 'enableRotation').name('Enable Rotation');
  secondSectionFolder.add(secondSection.params, 'transmission', 0, 1).onChange(secondSection.updateParams);
  secondSectionFolder.add(secondSection.params, 'thickness', 0, 5).onChange(secondSection.updateParams);
  secondSectionFolder.add(secondSection.params, 'roughness', 0, 1).onChange(secondSection.updateParams);
  secondSectionFolder.add(secondSection.params, 'envMapIntensity', 0, 3).onChange(secondSection.updateParams);
  secondSectionFolder.add(secondSection.params, 'iridescence', 0, 10).onChange(secondSection.updateParams);
  secondSectionFolder.add(secondSection.params, 'dispersion', 0, 10).onChange(secondSection.updateParams);


  // Event listeners
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('resize', handleResize);

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



