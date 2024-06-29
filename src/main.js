import { initThree, animate, handleResize, handleScroll } from './threeSetup.js';
import { sketch1, sketch2 } from './p5Sketches.js';
import GUI from 'lil-gui';

function init() {
    initThree();
    new p5(sketch1);
    new p5(sketch2);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    animate();
}

init();