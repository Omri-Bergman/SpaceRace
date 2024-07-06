import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import GUI from 'lil-gui';
import gsap from 'gsap';

import { initFirstSectionThree } from './threeSetup.js';
import { initSecondSectionThree } from './secondSectionThree.js';
import { sketch1, sketch2 } from './p5Sketches.js';

let scene, camera, renderer, glassModel, particles;
let firstSectionObjects, secondSection;
const clock = new THREE.Clock();
let previousTime = 0;
let gui;

// Function to load the GLTF model
function loadGlassModel(url) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(url,
      (gltf) => {
        console.log('Model loaded successfully');
        resolve(gltf.scene);
      },
      (progress) => {
        console.log(`Loading model... ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
      },
      (error) => {
        console.error('Error loading model:', error);
        reject(error);
      }
    );
  });
}

async function initThreeJS() {
  scene = new THREE.Scene();
  // scene.background = new THREE.Color("B");
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
  const particlesCount = 1000;
  const positions = new Float32Array(particlesCount * 3);

  for (let i = 0; i < particlesCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 10
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
  }

  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const textureLoader = new THREE.TextureLoader();
  const particleTexture = textureLoader.load('/textures/particles/star_05.png')

  const particlesMaterial = new THREE.PointsMaterial({
    sizeAttenuation: true,
    size: 0.1,
    alphaMap: particleTexture,
    transparent: true,
    depthWrite: false
  });

  particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  try {
    glassModel = await loadGlassModel('box3D.gltf');
    // scene.add(glassModel);
  } catch (error) {
    console.error('Failed to load glass model:', error);
  }
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
  particles.rotation.y = elapsedTime * 0.02;

  if (firstSectionObjects && firstSectionObjects.animate) {
    firstSectionObjects.animate(deltaTime, elapsedTime);
  }

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

  if (firstSectionObjects && firstSectionObjects.onResize) {
    firstSectionObjects.onResize(window.innerWidth, window.innerHeight);
  }
}

function handleScroll() {
  const scrollY = window.scrollY;
  
  // Show/hide second section based on scroll position
  const secondSectionContainer = document.getElementById('second-section-container');
  // if (scrollY > window.innerHeight * 0.8) {
  //   secondSectionContainer.style.display = 'block';
  // } else {
  //   secondSectionContainer.style.display = 'none';
  // }
}

async function init() {
  await initThreeJS();
  
  // firstSectionObjects = initFirstSectionThree();
  // scene.add(firstSectionObjects.objects);

  const secondSectionContainer = document.getElementById('second-section-container');
  secondSection = initSecondSectionThree(secondSectionContainer);

  // Initialize p5 sketches
  new p5(sketch1, document.getElementById('p5-sketch-1'));
  new p5(sketch2, document.getElementById('p5-sketch-2'));

  // Setup GUI
  // const firstSectionFolder = gui.addFolder('First Section');
  // firstSectionFolder.add(firstSectionObjects.planetGroup.rotation, 'x', 0, Math.PI * 2).name('Rotation X');
  // firstSectionFolder.add(firstSectionObjects.planetGroup.rotation, 'y', 0, Math.PI * 2).name('Rotation Y');

  const secondSectionFolder = gui.addFolder('Second Section');
  secondSectionFolder.add(secondSection.params, 'enableRotation').name('Enable Rotation');
  secondSectionFolder.add(secondSection.params, 'transmission', 0, 1).onChange(secondSection.updateParams);
  secondSectionFolder.add(secondSection.params, 'thickness', 0, 5).onChange(secondSection.updateParams);
  secondSectionFolder.add(secondSection.params, 'roughness', 0, 1).onChange(secondSection.updateParams);
  secondSectionFolder.add(secondSection.params, 'envMapIntensity', 0, 3).onChange(secondSection.updateParams);


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



