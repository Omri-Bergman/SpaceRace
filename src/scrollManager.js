// scrollManager.js

export class ScrollManager {
  constructor(textElementSelector, updateCameraPositionFunc) {
    this.sections = [];
    this.currentSectionIndex = -1;
    this.scrollY = 0;
    this.textElement = textElementSelector ? document.querySelector(textElementSelector) : null;
    this.updateCameraPosition = updateCameraPositionFunc;

  }

  addSection(config) {
    this.sections.push({
      startY: typeof config.startY === 'function' ? config.startY : () => config.startY,
      endY: typeof config.endY === 'function' ? config.endY : () => config.endY,
      textScrollBehavior: config.textScrollBehavior,
      threeJSBehavior: config.threeJSBehavior,
      onEnter: config.onEnter || (() => {}),
      onLeave: config.onLeave || (() => {}),
      onScroll: config.onScroll || (() => {})
    });
    // Sort sections by startY to ensure they're in order
    this.sections.sort((a, b) => a.startY() - b.startY());
  }

  updateScroll(newScrollY) {
    this.scrollY = newScrollY;
    const newSectionIndex = this.getSectionIndexForScrollY(newScrollY);

    
    if (newSectionIndex !== this.currentSectionIndex) {
      // Section changed
      if (this.currentSectionIndex !== -1) {
        this.sections[this.currentSectionIndex].onLeave();
      }
      this.currentSectionIndex = newSectionIndex;
      if (this.currentSectionIndex !== -1) {
        this.sections[this.currentSectionIndex].onEnter();
      }
    }

    // Call onScroll for current section if we're in a section
    if (this.currentSectionIndex !== -1) {
      this.sections[this.currentSectionIndex].onScroll(newScrollY);
    }

    this.updateThreeJS();
    this.updateTextScroll();
  }

  getSectionIndexForScrollY(scrollY) {
    return this.sections.findIndex(section => 
      scrollY >= section.startY() && scrollY < section.endY()
    );
  }

  updateThreeJS() {
    if (this.currentSectionIndex === -1) return;
    const currentSection = this.sections[this.currentSectionIndex];
    if (currentSection.threeJSBehavior === 'static') {
      // Keep Three.js content static
    } else if (currentSection.threeJSBehavior === 'scroll') {
      // Update Three.js based on scroll
      if (this.updateCameraPosition) {
        this.updateCameraPosition(this.scrollY);
      }
    }
  }

  updateTextScroll() {
    if (this.currentSectionIndex === -1 || !this.textElement) return;
    
    const currentSection = this.sections[this.currentSectionIndex];
    
    if (currentSection.textScrollBehavior === 'scroll') {
      const scrollOffset = this.scrollY - currentSection.startY();
      this.textElement.style.transform = `translateY(${-scrollOffset}px)`;
    } else {
      // Reset transform when behavior is 'static'
      this.textElement.style.transform = 'translateY(0)';
    }
  }
}