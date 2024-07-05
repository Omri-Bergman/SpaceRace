import * as THREE from 'three';
import GUI from 'lil-gui';
import { Text } from 'troika-three-text'


export function initSecondSectionThree(scene, camera, renderer, glassModel, gui) {
    const objects = new THREE.Group();

    const glassParams = {
        thickness: 0.28215,
        ior: 0.9,
        chromaticAberration:0.0172,
        roughness: 0.004,
        milkiness: 0.852
    };

    function createTextMesh(text, width, height) {
        const textMesh = new Text()
        textMesh.text = text
        textMesh.fontSize = 0.12
        textMesh.color = 0xffffff
        textMesh.maxWidth = width
        textMesh.anchorX = 'right'
        textMesh.direction = 'rtl'  // Set text direction to right-to-left
        textMesh.anchorY = 'middle'
        textMesh.textAlign = 'right'
        textMesh.lineHeight = 1.4 
        textMesh.font = 'fonts/VC_david-Light.otf'  // Just specify the font name here
        textMesh.sync()
        textMesh.position.set(3,0,0)
    
        return textMesh
    }
    
    // Hebrew text about astronomy
    const hebrewText = `
    שאיפת האדם לחלל: מסע אל הבלתי נודע
    מאז ומתמיד, האנושות הביטה אל השמיים בפליאה ובתשוקה לחקור את היקום הנשגב מבינתנו.
    הכמיהה לגלות עולמות חדשים ולהרחיב את גבולות
    הידע האנושי הניעה אותנו לפתח טכנולוגיות מתקדמות.
    מחקר החלל פתח בפנינו אופקים חדשים, מאפשר לנו להבין
    טוב יותר את מקומנו ביקום האינסופי.
    תחנות החלל והלוויינים מספקים לנו מידע יקר ערך על כדור הארץ,
    מסייעים בחיזוי מזג אוויר ובניטור שינויי אקלים.
    הנחיתה על הירח הוכיחה כי אין גבול ליכולת האנושית
    כאשר אנו מאחדים כוחות למען מטרה משותפת.
    חקר החלל ממשיך לעורר השראה בקרב מדענים, מהנדסים וחולמים,
    מניע אותנו לפתור בעיות מורכבות ולחדש.
    בעוד אנו צועדים אל עבר עתיד של מסעות בין-כוכביים, אנו מגלים לא רק את סודות היקום,
    אלא גם את עוצמת הרוח האנושית.
    `;
    
    const textMesh = createTextMesh(hebrewText, 5, 0);
    textMesh.position.z = -100;
    objects.add(textMesh);


    // Render target for the scene behind the glass
    const renderTarget = new THREE.WebGLRenderTarget(
        window.innerWidth,
        window.innerHeight,
        {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            encoding: THREE.sRGBEncoding
        }
    );

    // Custom shader material for glass
    const glassMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tDiffuse: { value: renderTarget.texture },
            time: { value: 0 },
            thickness: { value: glassParams.thickness },
            ior: { value: glassParams.ior },
            chromaticAberration: { value: glassParams.chromaticAberration },
            roughness: { value: glassParams.roughness },
            milkiness: { value: glassParams.milkiness },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        },
        vertexShader: `
        varying vec3 worldNormal;
        varying vec3 viewDirection;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            worldNormal = normalize(normalMatrix * normal);
            viewDirection = normalize(cameraPosition - worldPosition.xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
        fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float thickness;
    uniform float ior;
    uniform float chromaticAberration;
    uniform float roughness;
    uniform float milkiness;
    uniform vec2 resolution;
    varying vec3 worldNormal;
    varying vec3 viewDirection;

    vec3 hash3(vec2 p) {
        vec3 q = vec3(dot(p,vec2(127.1,311.7)),
                      dot(p,vec2(269.5,183.3)),
                      dot(p,vec2(419.2,371.9)));
        return fract(sin(q)*43758.5453);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(dot(hash3(i + vec2(0.0,0.0)), vec3(f - vec2(0.0,0.0), 1.0)),
                       dot(hash3(i + vec2(1.0,0.0)), vec3(f - vec2(1.0,0.0), 1.0)), u.x),
                   mix(dot(hash3(i + vec2(0.0,1.0)), vec3(f - vec2(0.0,1.0), 1.0)),
                       dot(hash3(i + vec2(1.0,1.0)), vec3(f - vec2(1.0,1.0), 1.0)), u.x), u.y);
    }

    float smoothNoise(vec2 uv, float scale) {
        float noise1 = noise(uv * scale);
        float noise2 = noise(uv * scale * 2.0);
        float noise3 = noise(uv * scale * 4.0);
        return 0.5 * noise1 + 0.3 * noise2 + 0.2 * noise3;
    }


    void main() {
        vec3 normal = normalize(worldNormal);
        vec3 refractedR = refract(viewDirection, normal, 1.0 / (ior - chromaticAberration));
        vec3 refractedG = refract(viewDirection, normal, 1.0 / ior);
        vec3 refractedB = refract(viewDirection, normal, 1.0 / (ior + chromaticAberration));

        vec2 uv = gl_FragCoord.xy / resolution.xy;
        
        float noiseScale = 5.0;
        float noiseR = smoothNoise(refractedR.xy + time * 0.1, noiseScale) * roughness;
        float noiseG = smoothNoise(refractedG.xy + time * 0.2, noiseScale) * roughness;
        float noiseB = smoothNoise(refractedB.xy + time * 0.3, noiseScale) * roughness;

        vec2 offsetR = refractedR.xy * (thickness + noiseR);
        vec2 offsetG = refractedG.xy * (thickness + noiseG);
        vec2 offsetB = refractedB.xy * (thickness + noiseB);

        float r = texture2D(tDiffuse, uv + offsetR).r;
        float g = texture2D(tDiffuse, uv + offsetG).g;
        float b = texture2D(tDiffuse, uv + offsetB).b;

        vec3 refractedColor = vec3(r, g, b);
        
        float fresnel = pow(1.0 - dot(viewDirection, normal), 5.0);
        vec3 reflectedColor = vec3(0.9);

        vec3 milkyColor = vec3(1.0);
        float milkyNoise = smoothNoise(uv + time * 0.05, 20.0) * milkiness;
        vec3 milkyMix = mix(refractedColor, milkyColor, milkyNoise);

        vec3 finalColor = mix(milkyMix, reflectedColor, fresnel);

        float opacity = mix(0.5, 0.95, milkiness) + fresnel * 0.05;

        gl_FragColor = vec4(finalColor, opacity);
    }
    `,
        transparent: true,
    });


    if (glassModel) {
        glassModel.traverse((child) => {
            if (child.isMesh) {
                child.material = glassMaterial;
            }
        });
        objects.add(glassModel);
        glassModel.scale.set(0.45,0.45,0.45)
        glassModel.position.set(1.3,1,1)

    }

    // Add GUI controls
    const glassFolder = gui.addFolder('Glass Parameters');
    glassFolder.add(glassParams, 'thickness', 0.01, 1).onChange(value => {
        glassMaterial.uniforms.thickness.value = value;
    });
    glassFolder.add(glassParams, 'ior', 0.5, 4).onChange(value => {
        glassMaterial.uniforms.ior.value = value;
    });
    glassFolder.add(glassParams, 'chromaticAberration', 0, 0.2).onChange(value => {
        glassMaterial.uniforms.chromaticAberration.value = value;
    });
    glassFolder.add(glassParams, 'roughness', 0, 1).onChange(value => {
        glassMaterial.uniforms.roughness.value = value;
    });
    glassFolder.add(glassParams, 'milkiness', 0, 4).onChange(value => {
        glassMaterial.uniforms.milkiness.value = value;
    });

    return {
        objects,
        glassModel,
        glassMaterial,
        renderTarget,
        animate: (deltaTime, elapsedTime) => {
            if (glassModel) {
                // Rotation
                glassModel.rotation.x += 0.005;
                glassModel.rotation.y += 0.005;

        
                // Position oscillation
                const amplitudeX = 0.4; // Max distance on X axis
                const amplitudeY = 0.35; // Max distance on Y axis
                const amplitudeZ = 0.45; // Max distance on Z axis
                const frequencyX = 0.5; // Speed of oscillation on X axis
                const frequencyY = 0.5; // Speed of oscillation on Y axis
                const frequencyZ = 0.4; // Speed of oscillation on Z axis
        
                // Calculate new positions using sine waves
                const newX = Math.sin(elapsedTime * frequencyX) * amplitudeX;
                const newY = Math.sin(elapsedTime * frequencyY) * amplitudeY;
                const newZ = Math.sin(elapsedTime * frequencyZ) * amplitudeZ;
        
                // Apply the new positions
                glassModel.position.x = newX;
                glassModel.position.y = newY;
                glassModel.position.z = newZ;
            }
        },
        onResize: (width, height) => {
            glassMaterial.uniforms.resolution.value.set(width, height);
            renderTarget.setSize(width, height);
        }
    };
}