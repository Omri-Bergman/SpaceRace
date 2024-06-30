import { initFirstSectionThree } from './threeSetup.js';
import { initSecondSectionThree } from './secondSectionThree.js';
import { sketch1, sketch2 } from './p5Sketches.js';
import { ScrollManager } from './scrollManager.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import GUI from 'lil-gui';

let scene, camera, renderer, glassModel;
let firstSectionObjects, secondSectionObjects;
const clock = new THREE.Clock();
let previousTime = 0;
let gui;
let scrollManager;

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
  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 6;

  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas.webgl'),
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  gui = new GUI();

  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);


   // Create particles
   const particlesCount = 1000;
   const positions = new Float32Array(particlesCount * 3);

   for(let i = 0; i < particlesCount; i++) {
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

   const particles = new THREE.Points(particlesGeometry, particlesMaterial);
   scene.add(particles);

  try {
    glassModel = await loadGlassModel('shape3D.gltf');
  } catch (error) {
    console.error('Failed to load glass model:', error);
  }
}

function updateCameraPosition(sectionScrollY, sectionStartY, sectionEndY) {
  const sectionHeight = sectionEndY - sectionStartY;
  const scrollProgress = Math.max(0, Math.min(1, sectionScrollY / sectionHeight));
  const totalCameraMove = 4;
  const newY = -scrollProgress * totalCameraMove;
  camera.position.y = newY;
}

function initScrollManager() {
  scrollManager = new ScrollManager('.scrollable-text', updateCameraPosition);

  scrollManager.addSection({
    startY: 0,
    endY: window.innerHeight,
    textScrollBehavior: 'static',
    threeJSBehavior: 'static',
    onEnter: () => {
      scene.add(firstSectionObjects.objects);
    },
    onLeave: () => {
      scene.remove(firstSectionObjects.objects);
    }
  });

  scrollManager.addSection({
    startY: window.innerHeight,
    endY: window.innerHeight * 2,
    textScrollBehavior: 'static',
    threeJSBehavior: 'scroll',
    onEnter: () => {
      scene.add(secondSectionObjects.objects);
    },
    onLeave: () => {
      scene.remove(secondSectionObjects.objects);
    },
  });
}

function animate() {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  if (firstSectionObjects && firstSectionObjects.animate) {
      firstSectionObjects.animate(deltaTime, elapsedTime);
  }

  if (secondSectionObjects && secondSectionObjects.animate) {
      secondSectionObjects.animate(deltaTime, elapsedTime);
      // Render the scene behind the glass to the render target
      if (secondSectionObjects.glassModel) secondSectionObjects.glassModel.visible = false;
      renderer.setRenderTarget(secondSectionObjects.renderTarget);
      renderer.render(scene, camera);

      // Update the glass material with the render target texture
      secondSectionObjects.glassMaterial.uniforms.tDiffuse.value = secondSectionObjects.renderTarget.texture;

      // Make glass model visible again
      if (secondSectionObjects.glassModel) secondSectionObjects.glassModel.visible = true;
  }

  // Final render to screen
  renderer.setRenderTarget(null);
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

  if (secondSectionObjects && secondSectionObjects.onResize) {
    secondSectionObjects.onResize(window.innerWidth, window.innerHeight);
  }

  scrollManager.updateSectionHeights();
}

async function init() {
  await initThreeJS();
  firstSectionObjects = initFirstSectionThree();
  scene.add(firstSectionObjects.objects);

  secondSectionObjects = initSecondSectionThree(scene, camera, renderer, glassModel, gui);
  if (secondSectionObjects.glassModel) {
      secondSectionObjects.glassModel.material = secondSectionObjects.glassMaterial;
      secondSectionObjects.objects.add(secondSectionObjects.glassModel);
  }
  initScrollManager();
  new p5(sketch1);
  new p5(sketch2);

  window.addEventListener('scroll', () => scrollManager.updateScroll(window.scrollY));
  window.addEventListener('resize', handleResize);

  animate();
}

document.addEventListener('DOMContentLoaded', init);