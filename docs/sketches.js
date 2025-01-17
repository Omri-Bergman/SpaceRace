// Shared vertex shader
const vertexShader = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`;

// Shared fragment shader base
const fragmentShaderBase = `
precision mediump float;

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform sampler2D u_texture;
varying vec2 vTexCoord;

#define PI 3.1415926535897932384626433832795
#define TWO_PI 6.2831853071795864769252867665590

vec2 coord(in vec2 p) {
    p = p / u_resolution.xy;
    if (u_resolution.x > u_resolution.y) {
        p.x *= u_resolution.x / u_resolution.y;
    } else {
        p.y *= u_resolution.y / u_resolution.x;
    }
    return p;
}

#define st0 vTexCoord
#define mx vec2(u_mouse.x, u_resolution.y - u_mouse.y) / u_resolution.xy

float sdCircle(in vec2 st, in vec2 center) {
    return length(st - center) * 2.0;
}

float aastep(float threshold, float value) {
    float afwidth = 0.7 / u_resolution.y;
    return smoothstep(threshold - afwidth, threshold + afwidth, value);
}

float fill(float x, float size, float edge) {
    return 1.0 - smoothstep(size - edge, size + edge, x);
}

float stroke(float x, float size, float w, float edge) {
    float d = smoothstep(size - edge, size + edge, x + w * 0.5) - smoothstep(size - edge, size + edge, x - w * 0.5);
    return clamp(d, 0.0, 1.0);
}

// MAIN_FUNCTION_PLACEHOLDER
`;

// Function to create a sketch
function createSketch(config) {
    return (p) => {
        let sdfShader;
        let img;

        p.preload = () => {
            img = p.loadImage(config.imagePath);
        };

        p.setup = () => {
            p.createCanvas(config.canvasSize.width, config.canvasSize.height, p.WEBGL);
            p.noStroke();
            
            const fragmentShader = fragmentShaderBase.replace('// MAIN_FUNCTION_PLACEHOLDER', config.mainFunction);
            sdfShader = p.createShader(vertexShader, fragmentShader);
        };

        p.draw = () => {
            p.background(255);
            p.shader(sdfShader);

            sdfShader.setUniform('u_mouse', [p.mouseX, p.mouseY]);
            sdfShader.setUniform('u_resolution', [p.width, p.height]);
            sdfShader.setUniform('u_texture', img);
            p.rect(-p.width / 2, -p.height / 2, p.width, p.height);
        };

        p.windowResized = () => {
            p.resizeCanvas(config.canvasSize.width, config.canvasSize.height);
        };
    };
}

// Man sketch configuration
const manConfig = {
    imagePath: 'man.png',
    canvasSize: {
        width: window.innerHeight * 0.88,
        height: window.innerHeight * 0.88
    },
    mainFunction: `
    // void main() {
    //     vec2 st = vTexCoord;
    //     vec2 posMouse = mx;
        
    //     float circleSize = 0.08;
    //     float circleEdge = 0.12;
        
    //     float textMask = texture2D(u_texture, st).r;

    //     float sdfCircle = fill(
    //         sdCircle(st, posMouse),
    //         circleSize,
    //         circleEdge
    //     );
    //     float textStroke = stroke(textMask, 0.42, 0.2, sdfCircle*0.7) * 4.0;
    //     gl_FragColor = vec4(vec3(textStroke, textStroke * 0.8, textStroke * 0.9), textStroke);
    // }


        void main() {
        vec2 st = vTexCoord;
        vec2 posMouse = mx;
        
     float circleSize = 0.03;
        float circleEdge = 0.18;
        
        float textMask = texture2D(u_texture, st).r;

        float sdfCircle = fill(
            sdCircle(st, posMouse),
            circleSize,
            circleEdge
        );
        // float textStroke = stroke(textMask, 0.42, 0.2, sdfCircle*0.7)* 8.0;
        float textStroke = stroke(textMask,0.58, 0.05, sdfCircle) * 8.0;
        gl_FragColor = vec4(vec3(textStroke, textStroke * 0.6, textStroke * 0.9), textStroke);
    }
    `
};

// Tatran sketch configuration
const tatranConfig = {
    imagePath: 'tatran.png',
    canvasSize: {
        width: window.innerHeight*0.93,
        height: window.innerHeight*0.93
    },
    mainFunction: `
        void main() {
        vec2 st = vTexCoord;
        vec2 posMouse = mx;
        
     float circleSize = 0.03;
        float circleEdge = 0.18;
        
        float textMask = texture2D(u_texture, st).r;

        float sdfCircle = fill(
            sdCircle(st, posMouse),
            circleSize,
            circleEdge
        );
        // float textStroke = stroke(textMask, 0.42, 0.2, sdfCircle*0.7)* 8.0;
        float textStroke = stroke(textMask,0.6, 0.08, sdfCircle) * 6.0;
        gl_FragColor = vec4(vec3(textStroke * 0.6, textStroke, textStroke * 0.9), textStroke);
    }
    `

    // mainFunction: `
    // void main() {
    //     vec2 st = vTexCoord;
    //     vec2 posMouse = mx;
        
    //     float circleSize = 0.08;
    //     float circleEdge = 0.12;
        
    //     float textMask = texture2D(u_texture, st).r;

    //     float sdfCircle = fill(
    //         sdCircle(st, posMouse),
    //         circleSize,
    //         circleEdge
    //     );
    //     float textStroke = stroke(textMask, 0.42, 0.1, sdfCircle*0.7) * 4.0;
    //     gl_FragColor = vec4(vec3(textStroke, textStroke * 0.8, textStroke * 0.9), textStroke);
    // }
    // `
};

const negativeConfig = {
    imagePath: 'negative.png',  // Replace with your actual image path
    canvasSize: {
        width: window.innerHeight * 0.88,
        height: window.innerHeight * 0.88
    },
    mainFunction: `
        void main() {
            vec2 st = vTexCoord;
            vec2 posMouse = mx;
            
            float circleSize = 0.03;
            float circleEdge = 0.18;
            
            float textMask = texture2D(u_texture, st).r;

            float sdfCircle = fill(
                sdCircle(st, posMouse),
                circleSize,
                circleEdge
            );
            // float textStroke = stroke(textMask, 0.6, 0.08, sdfCircle) * 6.0;
            // gl_FragColor = vec4(vec3(textStroke , textStroke* 0.9 , textStroke* 0.6), textStroke);
        float textStroke = stroke(textMask,0.58, 0.05, sdfCircle) * 8.0;
 gl_FragColor = vec4(vec3(textStroke , textStroke* 0.9 , textStroke* 0.6), textStroke);
        }
    `
};

const omriConfig = {
    imagePath: 'omri.png',  // Replace with your actual image path
    canvasSize: {
        width: window.innerHeight * 0.87,
        height: window.innerHeight * 0.87
    },
    mainFunction: `
        void main() {
            vec2 st = vTexCoord;
            vec2 posMouse = mx;
            
            float circleSize = 0.03;
            float circleEdge = 0.18;
            
            float textMask = texture2D(u_texture, st).r;

            float sdfCircle = fill(
                sdCircle(st, posMouse),
                circleSize,
                circleEdge
            );
            // float textStroke = stroke(textMask, 0.55, 0.08, sdfCircle) * 10.0;
        float textStroke = stroke(textMask,0.58, 0.05, sdfCircle) * 8.0;

            gl_FragColor = vec4(vec3(textStroke*0.4 , textStroke*0.3 , textStroke* 0.9), textStroke);

            
        }
    `
};

const containerOffsets = {
    'p5-man-container': -300,
    'p5-tatran-container': -180,
    'p5-negative-container': -70,
    'p5-omri-container': +220 
        // Add new containers here with their respective offsets
};

// Scroll effect for both sketches
function setupScrollEffect(containerId, textId) {
    const container = document.getElementById(containerId);
    const followingText = document.getElementById(textId);

    if (!container || !followingText) {
        console.error(`Missing elements for ${containerId} or ${textId}`);
        return;
    }

    const containerStyle = getComputedStyle(container);
    const textStyle = getComputedStyle(followingText);
    
    const startFixed = parseInt(containerStyle.top);
    const textOffset = parseInt(textStyle.top) - startFixed;
    
    const offset = containerOffsets[containerId] || 0;
    const endFixed = startFixed + window.innerHeight - offset;

    function updatePositions() {
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollPosition >= startFixed && scrollPosition < endFixed) {
            container.classList.add('fixed');
            followingText.classList.add('fixed');
            container.style.top = '0px';
            followingText.style.top = textOffset + 'px';
        } else if (scrollPosition >= endFixed) {
            container.classList.remove('fixed');
            followingText.classList.remove('fixed');
            container.style.top = endFixed + 'px';
            followingText.style.top = (endFixed + textOffset) + 'px';
        } else {
            container.classList.remove('fixed');
            followingText.classList.remove('fixed');
            container.style.top = startFixed + 'px';
            followingText.style.top = (startFixed + textOffset) + 'px';
        }
    }

    window.addEventListener('scroll', updatePositions);
    window.addEventListener('resize', updatePositions);
    updatePositions();
}
const scrollEffects = [
    { containerId: 'p5-man-container', textId: 'following-text-man' },
    { containerId: 'p5-tatran-container', textId: 'following-text-tatran' },
    { containerId: 'p5-negative-container', textId: 'following-text-negative' },
    { containerId: 'p5-omri-container', textId: 'following-text-omri' }  // Add this line


    // Add new configurations here
];

document.addEventListener('DOMContentLoaded', () => {
    // Initialize p5.js sketches
    new p5(createSketch(manConfig), document.getElementById('p5-man-container'));
    new p5(createSketch(tatranConfig), document.getElementById('p5-tatran-container'));
    new p5(createSketch(negativeConfig), document.getElementById('p5-negative-container'));
    new p5(createSketch(omriConfig), document.getElementById('p5-omri-container'));  // Add this line



    // Set up scroll effects
    scrollEffects.forEach(effect => {
        setupScrollEffect(effect.containerId, effect.textId);
    });
});