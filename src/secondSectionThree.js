import * as THREE from 'three';
import GUI from 'lil-gui';

export function initSecondSectionThree(scene, camera, renderer, glassModel, gui) {
    const objects = new THREE.Group();

    const glassParams = {
        thickness: 0.05,
        ior: 0.9,
        chromaticAberration: 0.005,
        roughness: 0.02,
        milkiness: 0.5
    };

    function createTextTexture(text, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');

        // Make the background transparent
        context.clearRect(0, 0, width, height);

        // Set up the text
        context.fillStyle = 'white';
        context.font = 'bold 120px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Add main text
        context.fillText(text, width / 2, height / 2);

        return new THREE.CanvasTexture(canvas);
    }

    const backgroundTexture = createTextTexture('מה אני כותב פה?', 1024, 1024);
    const backgroundGeometry = new THREE.PlaneGeometry(20, 20);
    const backgroundMaterial = new THREE.MeshBasicMaterial({
        map: backgroundTexture,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide
    });
    const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    backgroundMesh.position.z = -5;
    objects.add(backgroundMesh);

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
                glassModel.rotation.x += 0.005;
                glassModel.rotation.y += 0.005;
                glassModel.scale.set(0.5,0.5,0.5)
            }
        },
        onResize: (width, height) => {
            glassMaterial.uniforms.resolution.value.set(width, height);
            renderTarget.setSize(width, height);
        }
    };
}