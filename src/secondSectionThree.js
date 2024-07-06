import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import GUI from 'lil-gui';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
// import { readFileSync } from 'fs';

// const hebrewText = readFileSync('hebrewText', 'utf8');

export function initSecondSectionThree(scene, camera, renderer, glassModel, gui) { return null }
// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color("black");
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// GUI setup
const gui = new GUI();
console.log('GUI created:', gui);

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

const hdrEquirect = new RGBELoader().load(
    "satara_night_no_lamps_1k.hdr",
    () => {
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
    }
);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

// Camera position
camera.position.z = 8;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);


function createTextTexture(textData, width, height) {
    return new Promise((resolve) => {
        const dpr = window.devicePixelRatio || 1;
        const canvas = document.createElement('canvas');
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        const context = canvas.getContext('2d');
        context.scale(dpr,dpr)
        // Fill the background
        // context.fillStyle = '#020203';
        // context.fillRect(0, 0, width, height);

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
                const fontSize = style.size || 60;
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
            new FontFace('david', 'url(fonts/VC_david-Light.otf)').load(),
            new FontFace('davidBold', 'url(fonts/VC_david-Bold.otf)').load()
        ]).then(loadedFonts => {
            loadedFonts.forEach(font => document.fonts.add(font));

            // Render the text
            renderRTLText(context, textData, width - 50, 50, width - 500, 80);
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

// Usage
fetch('hebrewText.txt')
  .then(response => response.text())
  .then(text => {
    const textData = JSON.parse(text);
    return createTextTexture(textData, 2048, 2048);
  })
  .then(backgroundTexture => {
    const backgroundGeometry = new THREE.PlaneGeometry(20, 20);
    const backgroundMaterial = new THREE.MeshBasicMaterial({ 
      map: backgroundTexture,
    //   transparent: true,
    });
    const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    backgroundMesh.position.z = -5;
    scene.add(backgroundMesh);
  })
  .catch(error => console.error('Error:', error));

  
const glassMaterial = new THREE.MeshPhysicalMaterial({
    transmission: params.transmission,
    thickness: params.thickness,
    roughness: params.roughness,
    envMap: hdrEquirect,
    envMapIntensity: params.envMapIntensity
});

// Create a variable to hold our glass model
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

// Add GUI controls
gui.add(params, "enableSwoopingCamera").onChange((val) => {
    controls.enabled = !val;
    controls.reset();
});

gui.add(params, "enableRotation");

gui.add(params, "transmission", 0, 1, 0.01).onChange((val) => {
    glassMaterial.transmission = val;
    glassMaterial.needsUpdate = true;
});

gui.add(params, "thickness", 0, 5, 0.1).onChange((val) => {
    glassMaterial.thickness = val;
    glassMaterial.needsUpdate = true;
});

gui.add(params, "roughness", 0, 1, 0.01).onChange((val) => {
    glassMaterial.roughness = val;
    glassMaterial.needsUpdate = true;
});

gui.add(params, "envMapIntensity", 0, 3, 0.1).onChange((val) => {
    glassMaterial.envMapIntensity = val;
    glassMaterial.needsUpdate = true;
});

gui.add(params, "dispersion", 0, 1, 0.01).onChange((val) => {
    glassMaterial.dispersion = val;
    glassMaterial.needsUpdate = true;
});

gui.add(params, "iridescence", 0, 1, 0.01).onChange((val) => {
    glassMaterial. iridescence = val;
    glassMaterial.needsUpdate = true;
});

// Render target for the scene behind the glass
const renderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth, 
    window.innerHeight, 
    { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }
);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (glassModel && params.enableRotation) {
        glassModel.rotation.x += 0.005;
        glassModel.rotation.y += 0.005;
    }

    // Render the scene behind the glass to the render target
    if (glassModel) glassModel.visible = false;
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);

    // Render the full scene including the glass
    if (glassModel) glassModel.visible = true;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    // Update GUI
    for (let i in gui.__controllers) {
        gui.__controllers[i].updateDisplay();
    }

    controls.update();
}

animate();

// Handle window resizing
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderTarget.setSize(window.innerWidth, window.innerHeight);
}

// Add GUI visibility toggle
document.addEventListener('keydown', (event) => {
    if (event.key === 'h' || event.key === 'H') {
        gui.domElement.style.display = gui.domElement.style.display === 'none' ? '' : 'none';
    }
});


// import * as THREE from 'three';
// import GUI from 'lil-gui';
// import { Text } from 'troika-three-text'
// import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';


// export function initSecondSectionThree(scene, camera, renderer, glassModel, gui) {
//     const objects = new THREE.Group();

//     const glassParams = {
//         transmission: 1,
//         thickness: 1.5,
//         roughness: 0.07,
//         envMapIntensity: 1.5
//     };

//     function createTextMesh(text, width, height) {
//         const textMesh = new Text()
//         textMesh.text = text
//         textMesh.fontSize = 0.12
//         textMesh.color = 0xffffff
//         textMesh.maxWidth = width
//         textMesh.anchorX = 'right'
//         textMesh.direction = 'rtl'  // Set text direction to right-to-left
//         textMesh.anchorY = 'middle'
//         textMesh.textAlign = 'right'
//         textMesh.lineHeight = 1.4 
//         textMesh.font = 'fonts/VC_david-Light.otf'  // Just specify the font name here
//         textMesh.sync()
//         textMesh.position.set(3,0,0)
    
//         return textMesh
//     }
    
//     // Hebrew text about astronomy
//     const hebrewText = `
//     שאיפת האדם לחלל: מסע אל הבלתי נודע
//     מאז ומתמיד, האנושות הביטה אל השמיים בפליאה ובתשוקה לחקור את היקום הנשגב מבינתנו.
//     הכמיהה לגלות עולמות חדשים ולהרחיב את גבולות
//     הידע האנושי הניעה אותנו לפתח טכנולוגיות מתקדמות.
//     מחקר החלל פתח בפנינו אופקים חדשים, מאפשר לנו להבין
//     טוב יותר את מקומנו ביקום האינסופי.
//     תחנות החלל והלוויינים מספקים לנו מידע יקר ערך על כדור הארץ,
//     מסייעים בחיזוי מזג אוויר ובניטור שינויי אקלים.
//     הנחיתה על הירח הוכיחה כי אין גבול ליכולת האנושית
//     כאשר אנו מאחדים כוחות למען מטרה משותפת.
//     חקר החלל ממשיך לעורר השראה בקרב מדענים, מהנדסים וחולמים,
//     מניע אותנו לפתור בעיות מורכבות ולחדש.
//     בעוד אנו צועדים אל עבר עתיד של מסעות בין-כוכביים, אנו מגלים לא רק את סודות היקום,
//     אלא גם את עוצמת הרוח האנושית.
//     `;
    
//     const textMesh = createTextMesh(hebrewText, 5, 0);
//     textMesh.position.z = -1;
//     objects.add(textMesh);

//     // Load HDR environment map
//     const hdrEquirect = new RGBELoader().load(
//         "satara_night_no_lamps_1k.hdr",
//         () => {
//           hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
//         }
//     );


//     // Create MeshPhysicalMaterial for glass
//     const glassMaterial = new THREE.MeshPhysicalMaterial({
//         // ... other properties ...
//         ior: 2.33, // Increased from 1.5
//         transmission: 1,
//         thickness: 0.5, // Reduced from 1.5
//         roughness: 0.01, // Reduced for a clearer effect
//         envMapIntensity: 1.5,
//         transparent: true,
//         opacity: 1, // Increased to full opacity
//         metalness: 0,
//         clearcoat: 1,
//         clearcoatRoughness: 0,
//     });
//     textMesh.position.set(3, 0, -2); // Moved further back
//     glassModel.scale.set(0.6, 0.6, 0.6); // Increased size
// glassModel.position.set(1, 0, 0); // Adjusted position
//     scene.background = new THREE.Color(0x000000); // Black background, adjust color as needed
//     scene.environment = hdrEquirect;
//     glassMaterial.envMap = hdrEquirect;
//     glassMaterial.depthWrite = false;
//     // For opaque objects (like your text)
// textMesh.renderOrder = 2;

// // For transparent objects (like your glass)
// glassModel.renderOrder = 1;
//     if (glassModel) {
//         glassModel.traverse((child) => {
//             if (child.isMesh) {
//                 child.material = glassMaterial;
//             }
//         });
//         objects.add(glassModel);
//         glassModel.scale.set(0.45, 0.45, 0.45);
//         glassModel.position.set(1.3, 1, 1);
//     }

//     // Add GUI controls
//     const glassFolder = gui.addFolder('Glass Parameters');
//     glassFolder.add(glassParams, 'transmission', 0, 1, 0.01).onChange(value => {
//         glassMaterial.transmission = value;
//     });
//     glassFolder.add(glassParams, 'thickness', 0, 5, 0.1).onChange(value => {
//         glassMaterial.thickness = value;
//     });
//     glassFolder.add(glassParams, 'roughness', 0, 1, 0.01).onChange(value => {
//         glassMaterial.roughness = value;
//     });
//     glassFolder.add(glassParams, 'envMapIntensity', 0, 3, 0.1).onChange(value => {
//         glassMaterial.envMapIntensity = value;
//     });

//     return {
//         objects,
//         glassModel,
//         glassMaterial,
//         animate: (deltaTime, elapsedTime) => {
//             if (glassModel) {
//                 const ROTATE_TIME = 10; // Time in seconds for a full rotation
//                 const xAxis = new THREE.Vector3(1, 0, 0);
//                 const yAxis = new THREE.Vector3(0, 1, 0);
//                 const rotateX = (deltaTime / ROTATE_TIME) * Math.PI * 2;
//                 const rotateY = (deltaTime / ROTATE_TIME) * Math.PI * 2;

//                 glassModel.rotateOnWorldAxis(xAxis, rotateX);
//                 glassModel.rotateOnWorldAxis(yAxis, rotateY);
//             }
//         },
//         onResize: (width, height) => {
//             // This function is no longer needed for resizing render target,
//             // but you might want to keep it for other resize operations
//         }
//     };
// }