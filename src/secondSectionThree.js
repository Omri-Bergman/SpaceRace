import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import GUI from 'lil-gui';
import gsap from 'gsap';

export function initSecondSectionThree(container) {
    let particles = [];
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selectedObject = null;
    let offset = new THREE.Vector3();
    let isDragging = false;
    let previousMousePosition = {
        x: 0,
        y: 0
    };
    let resetAnimation;
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true  // This enables transparency
    });
    renderer.setClearColor(0x000000, 0); // The second parameter (alpha) is set to 0
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Camera position
    camera.position.z = 8;

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);


    function createParticles(count, texturePath, size, scene) {
        // Create particle geometry
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
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
      const particlesCount = 150;
       particles[0] = createParticles(particlesCount, '/textures/particle1.png', 0.06, scene);
       particles[1] = createParticles(particlesCount, '/textures/particle2.png', 0.08, scene);
       particles[2] = createParticles(particlesCount, '/textures/particle3.png', 0.07, scene);
      


    // Parameters
    const params = {
        enableSwoopingCamera: false,
        enableRotation: true,
        transmission: 1,
        thickness: 1,
        roughness: 0.09,
        envMapIntensity: 1.5,
        dispersion: 0.2,
        iridescence: 0.2
    };

    // HDR Environment
    const hdrEquirect = new RGBELoader().load(
        "satara_night_no_lamps_1k.hdr",
        () => {
            hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
        }
    );

    // Glass material
    const glassMaterial = new THREE.MeshPhysicalMaterial({
        transmission: params.transmission,
        thickness: params.thickness,
        roughness: params.roughness,
        envMap: hdrEquirect,
        envMapIntensity: params.envMapIntensity
    });

    // Text texture creation
    function createTextTexture(textData, width, height) {
        return new Promise((resolve) => {
            const dpr = window.devicePixelRatio || 1;
            const canvas = document.createElement('canvas');
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            const context = canvas.getContext('2d');
            context.scale(dpr, dpr);
            context.clearRect(0, 0, canvas.width, canvas.height);
            // context.fillStyle = 'red';
            // context.fillRect(0, 0, canvas.width, canvas.height);


            // Set up the default text style
            context.fillStyle = 'white';
            context.textAlign = 'right';
            context.textBaseline = 'top';
            context.imageSmoothingEnabled = false;

            // Function to wrap and render RTL text with styles
            function renderRTLText(context, textData, x, y, maxWidth, defaultLineHeight) {
                const RLO = '\u202E';  // Right-to-Left Override
                const PDF = '\u202C';  // Pop Directional Formatting

                let currentY = y;

                textData.forEach(([line, style]) => {
                    // Apply custom style
                    const fontSize = style.size || 30;
                    const fontFamily = style.font || 'davidBold';
                    context.font = `bold ${fontSize}px "${fontFamily}"`;
                    const lineHeight = style.lineHeight || defaultLineHeight;

                    // Wrap each line with RLO and PDF
                    let remainingText = line;

                    while (remainingText.length) {
                        let idx = remainingText.length;
                        while (idx > 0 && context.measureText(RLO + remainingText.slice(0, idx) + PDF).width > maxWidth) {
                            idx--;
                        }

                        if (idx === remainingText.length) {
                            context.fillText(RLO + remainingText + PDF, x, currentY);
                            break;
                        } else {
                            let lastSpace = remainingText.lastIndexOf(' ', idx);
                            if (lastSpace > 0) idx = lastSpace;

                            context.fillText(RLO + remainingText.slice(0, idx) + PDF, x, currentY);
                            remainingText = remainingText.slice(idx).trim();
                            currentY += lineHeight;
                        }
                    }
                    currentY += lineHeight;
                });
            }

            // Load the fonts before rendering
            Promise.all([
                new FontFace('david', 'url(fonts/VC_david-Medium.otf)').load(),
                new FontFace('davidBold', 'url(fonts/VC_david-Bold.otf)').load()
            ]).then(loadedFonts => {
                loadedFonts.forEach(font => document.fonts.add(font));

                // Render the text
                renderRTLText(context, textData, width - 300, 550, width - 600, 45);
                const texture = new THREE.CanvasTexture(canvas);
                texture.needsUpdate = true;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                resolve(texture);
            }).catch(error => {
                console.error('Font loading failed:', error);
                // Fallback to Arial if font loading fails
                renderRTLText(context, textData, width - 50, 50, width - 100, 100);
                const texture = new THREE.CanvasTexture(canvas);
                texture.needsUpdate = true;
                resolve(texture);
            });
        });
    }

    // Load and create background
    fetch('hebrewText.txt')
        .then(response => response.text())
        .then(text => {
            const textData = JSON.parse(text);
            return createTextTexture(textData, 2048, 2048);
        })
        .then(backgroundTexture => {
            const backgroundGeometry = new THREE.PlaneGeometry(40, 40);
            const backgroundMaterial = new THREE.MeshBasicMaterial({
                map: backgroundTexture,
                // opacity: 1,
                // blending: THREE.CustomBlending,
                // blendSrc: THREE.SrcAlphaFactor,
                // blendDst: THREE.OneMinusSrcAlphaFactor
            });
            const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);

            backgroundMesh.position.z = -5;
            scene.add(backgroundMesh);
        })
        .catch(error => console.error('Error:', error));




    // Glass model
    let glassModel;

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

    // Load and set up the glass model
    async function setupGlassModel() {
        try {
            // Load the model
            const loadedModel = await loadGlassModel('shape3D.gltf');
            console.log('Model loaded:', loadedModel);

            // Apply the glass material to the model
            loadedModel.traverse((child) => {
                if (child.isMesh) {
                    child.material = glassMaterial;
                    console.log('Applied glass material to:', child);
                }
            });

            // Adjust the model's position, rotation, and scale as needed
            loadedModel.position.set(0, 0, -1);
            loadedModel.rotation.set(0, 0, 0);
            loadedModel.scale.set(2, 2, 2);

            // Add the model to the scene
            scene.add(loadedModel);

            // Store the model for later use
            glassModel = loadedModel;
        } catch (error) {
            console.error('Failed to set up glass model:', error);
        }
    }

    // Call the setup function
    setupGlassModel();

    /**
     * Mouse
     */

    
    function clampPosition(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    window.addEventListener('mousedown', (event) => {
        const rect = container.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
        raycaster.setFromCamera({ x, y }, camera);
        const intersects = raycaster.intersectObject(glassModel, true);
    
        if (intersects.length > 0) {
            console.log("Model clicked");
            isDragging = true;
            controls.enabled = false;
            selectedObject = glassModel;
            // Kill any ongoing reset animation
            if (resetAnimation) {
                resetAnimation.kill();
            }
            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        }
    });

    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (isDragging && glassModel) {
            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };

            const movementSpeed = 0.01;
            glassModel.position.x = clampPosition(glassModel.position.x + deltaMove.x * movementSpeed, -50, 50);
            glassModel.position.y = clampPosition(glassModel.position.y - deltaMove.y * movementSpeed, -50, 50);

            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        }
    });

    window.addEventListener('mouseup', (event) => {
        if (isDragging) {
            isDragging = false;
            controls.enabled = true;
            selectedObject = null;
            // Uncomment the next line if you want the model to reset its position when released
            resetModelPosition();
        }
    });

    function resetModelPosition() {
        if (glassModel) {
            // Kill any existing animation
            if (resetAnimation) {
                resetAnimation.kill();
            }
            // Start a new animation
            resetAnimation = gsap.to(glassModel.position, {
                x: 0,
                y: 0,
                z: -1,
                duration: 5,
            });
        }
    }

    function updateScrollPosition(scrollY) {
        if (glassModel && !isDragging) {
            const scrollFactor = 0.001;
            const maxScroll = 500;
            const clampedScrollY = Math.max(0, Math.min(scrollY, maxScroll));
            glassModel.position.y = -clampedScrollY * scrollFactor;
        }
    }

    // Render target for the scene behind the glass
    const renderTarget = new THREE.WebGLRenderTarget(
        window.innerWidth,
        window.innerHeight,
        { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }
    );

    // Animation loop
    const clock = new THREE.Clock();
    let previousTime = 0;
    function animate() {
        const elapsedTime = clock.getElapsedTime();
        const deltaTime = elapsedTime - previousTime;
        previousTime = elapsedTime;

        requestAnimationFrame(animate);

        if (glassModel && params.enableRotation && !isDragging) {
            glassModel.rotation.x += 0.005;
            glassModel.rotation.y += 0.005;
        }


      // Animate particles
  particles[0].rotation.y = elapsedTime * 0.07;
  particles[1].rotation.y = elapsedTime * -0.03; 
  particles[2].rotation.y = elapsedTime * 0.01; 

        // Render the scene behind the glass to the render target
        if (glassModel) glassModel.visible = false;
        renderer.setRenderTarget(renderTarget);
        renderer.render(scene, camera);

        // Render the full scene including the glass
        if (glassModel) glassModel.visible = true;
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);

        controls.update();
    }

    // Start the animation loop
    animate();

    // Handle window resizing
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderTarget.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onWindowResize, false);

    // Return an object with methods to control the scene
    return {
        params: params,
        updateParams: (newParams) => {
            Object.assign(params, newParams);
            glassMaterial.transmission = params.transmission;
            glassMaterial.thickness = params.thickness;
            glassMaterial.roughness = params.roughness;
            glassMaterial.envMapIntensity = params.envMapIntensity;
            glassMaterial.needsUpdate = true;
            glassMaterial.iridescence = params.iridescence;
            glassMaterial.dispersion = params.iridescence;
        },
        toggleRotation: (enable) => {
            params.enableRotation = enable;
        },
        updateScrollPosition: updateScrollPosition,
        dispose: () => {
            window.removeEventListener('resize', onWindowResize);
            renderer.dispose();
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
            if (renderTarget) renderTarget.dispose();
        }
    };
}














