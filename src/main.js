import { initThree, animate, handleResize, updateCameraPosition, triggerSectionAnimation  } from './threeSetup.js';
import { sketch1, sketch2 } from './p5Sketches.js';
import { ScrollManager } from './scrollManager.js';
import GUI from 'lil-gui';


document.addEventListener('DOMContentLoaded', () => {
const scrollManager = new ScrollManager('.scrollable-text', updateCameraPosition); 

// Setup your sections
scrollManager.addSection({
    startY: 0,
    endY: window.innerHeight,  // Adjust based on your layout
    textScrollBehavior: 'scroll',
    threeJSBehavior: 'static',
  });
  
  scrollManager.addSection({
    startY: window.innerHeight,  // Should match the endY of the previous section
    endY: window.innerHeight * 2,  // Adjust based on your layout
    textScrollBehavior: 'scroll',
    threeJSBehavior: 'scroll',
  });


// More sections...


function handleScroll() {
  scrollManager.updateScroll(window.scrollY);
}

window.addEventListener('scroll', handleScroll);


window.addEventListener('resize', () => {
    // Recalculate section heights and update ScrollManager
    scrollManager.updateSectionHeights();
  });

function init() {
    initThree();
    new p5(sketch1);
    new p5(sketch2);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    animate();
}

init();
});