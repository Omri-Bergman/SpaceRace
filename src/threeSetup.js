import * as THREE from 'three';
import gsap from 'gsap';
import GUI from 'lil-gui';

let planetGroup, planet, moon, torus, particles;
let scrollY = window.scrollY;
let currentSection = 0;

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

const parameters = {
    moonColor: '#ffeded',
    planetColor: '#ffeded',
    particlesColor: '#ffeded'
};

export function initFirstSectionThree() {
    const objects = new THREE.Group(); // Group to hold all objects

    // Texture
    const textureLoader = new THREE.TextureLoader();
    const gradientTexture3 = textureLoader.load('textures/gradients/3.jpg');
    const gradientTexture5 = textureLoader.load('textures/gradients/5.jpg');
    gradientTexture3.magFilter = THREE.NearestFilter;
    gradientTexture5.magFilter = THREE.NearestFilter;
    const particleTexture = textureLoader.load('/textures/particles/star_05.png')

    // Materials
    const material3 = new THREE.MeshToonMaterial({
        color: parameters.moonColor,
        gradientMap: gradientTexture3
    });

    const material5 = new THREE.MeshToonMaterial({
        color: parameters.planetColor,
        gradientMap: gradientTexture5
    });

    // Create planet group
    const planetGroup = new THREE.Group();
    objects.add(planetGroup);

    // Create planet
    const planetGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const planet = new THREE.Mesh(planetGeometry, material5);
    planetGroup.add(planet);

    // Create orbiting moon
    const moonGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const moon = new THREE.Mesh(moonGeometry, material3);
    moon.position.set(0.8, 0, 0);
    planetGroup.add(moon);

    planetGroup.position.x = -1.5;

    // // Create particles
    // const particlesCount = 1000;
    // const positions = new Float32Array(particlesCount * 3);

    // for(let i = 0; i < particlesCount; i++) {
    //     positions[i * 3 + 0] = (Math.random() - 0.5) * 10
    //     positions[i * 3 + 1] = (Math.random() - 0.5) * 10
    //     positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    // }

    // const particlesGeometry = new THREE.BufferGeometry();
    // particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // const particlesMaterial = new THREE.PointsMaterial({
    //     color: parameters.particlesColor,
    //     sizeAttenuation: true,
    //     size: 0.1,
    //     alphaMap: particleTexture,
    //     transparent: true,
    //     depthWrite: false
    // });

    // const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    // objects.add(particles);

    // Lights
    const directionalLight = new THREE.DirectionalLight('#ffffff', 3);
    directionalLight.position.set(1, 1, 0);
    objects.add(directionalLight);

    // Setup debug GUI
    const gui = new GUI();
    gui.addColor(parameters, 'moonColor').onChange(() => {
        material3.color.set(parameters.moonColor);
    });
    gui.addColor(parameters, 'planetColor').onChange(() => {
        material5.color.set(parameters.planetColor);
    });
    gui.addColor(parameters, 'particlesColor').onChange(() => {
        particlesMaterial.color.set(parameters.particlesColor);
    });

    return {
        objects,
        planetGroup,
        planet,
        moon,
        particles,
        animate: (deltaTime, elapsedTime) => {
            // Animation logic here
            // Animate planet and moon
            planetGroup.rotation.y += deltaTime * 0.2;
                
            // Subtle movement of the planet
            planet.position.x = Math.sin(elapsedTime * 0.5) * 0.1;
            planet.position.y = Math.cos(elapsedTime * 0.3) * 0.1;

            // Moon orbit and rotation
            const moonOrbitSpeed = 0.5;
            moon.position.x = Math.cos(elapsedTime * moonOrbitSpeed) * 0.8;
            moon.position.z = Math.sin(elapsedTime * moonOrbitSpeed) * 0.8;
            moon.rotation.y += deltaTime * 0.1; // Slower rotation for the moon

            // Subtle movement of the moon
            moon.position.y = Math.sin(elapsedTime * 0.7) * 0.05;
            // Animate particles
            // particles.rotation.y = elapsedTime * 0.02;
                        // ... rest of animation logic
                }
            };
}

export function handleResize() {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// New function to trigger animations on section change
export function triggerSectionAnimation() {
    gsap.to(planetGroup.rotation, {
        duration: 1.5,
        ease: 'power2.inOut',
        x: '+=6',
        y: '+=3',
        z: '+=1.5'
    });

    gsap.to(torus.rotation, {
        duration: 1.5,
        ease: 'power2.inOut',
        x: '+=6',
        y: '+=3',
        z: '+=1.5'
    });
}