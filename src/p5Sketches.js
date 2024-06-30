import { predefinedShapesData } from './predefinedShapes.js';

// Constants
const MAX_SHAPES = 1000; // Maximum number of floating shapes to render

// Global variables
let shapePool = [];
let activeShapes = new Set();
let predefinedShapes = new Set(); // Using a Set for efficient operations
let scale, offsetX, offsetY;

// Unused class - kept for potential future use
/*
class AbstractShape {
  constructor(p) {
    this.p = p;
    this.pos = p.createVector(0, 0);
    this.points = [p.createVector(), p.createVector(), p.createVector(), p.createVector()];
    this.rotation = 0;
    this.speed = 0;
    this.range = 0;
    this.active = false;
  }

  init(x, y, range = 20) {
    this.pos.set(x, y);
    this.range = this.p.randomGaussian(range, 30);
    this.rotation = this.p.random(this.p.TWO_PI);
    this.speed = this.p.random(0.5, 1.5);
    this.generatePoints();
    this.active = true;
  }

  generatePoints() {
    let centerX = this.p.random(-this.range / 4, this.range / 4);
    let centerY = this.p.random(-this.range / 4, this.range / 4);
  
    for (let i = 0; i < 4; i++) {
      let angle = this.p.map(i, 0, 4, 0, this.p.TWO_PI) + this.p.random(-0.9,0.9);
      let r = this.p.random(this.range / 2, this.range / 2);
      let x = centerX + r * this.p.cos(angle);
      let y = centerY + r * this.p.sin(angle);
      this.points[i].set(x, y);
    }
  }

  update() {
    this.pos.y -= this.speed;
    if (this.pos.y < -this.range) {
      this.active = false;
    }
  }

  display() {
    this.p.push();
    this.p.translate(this.pos.x, this.pos.y);
    this.p.rotate(this.rotation);
    this.p.fill(255); // All shapes are white now
    this.p.beginShape();
    for (let point of this.points) {
      this.p.vertex(point.x, point.y);
    }
    this.p.endShape(this.p.CLOSE);
    this.p.pop();
  }
}
*/

class PredefinedShape {
  constructor(p, points, rotation = 0) {
    this.p = p;
    this.points = points;
    this.rotation = rotation;
    this.canSplit = true;
    this.center = this.calculateCenter(); // Cache the center
  }

  // Calculate and cache the center of the shape
  calculateCenter() {
    if (!this.center) {
      let sumX = 0, sumY = 0;
      for (let point of this.points) {
        sumX += point.x;
        sumY += point.y;
      }
      this.center = this.p.createVector(sumX / this.points.length, sumY / this.points.length);
    }
    return this.center;
  }

  // Display the shape on the canvas
  display(scale, offsetX, offsetY) {
    this.p.push();
    this.p.translate(
      this.center.x * scale + offsetX,
      this.center.y * scale + offsetY
    );
    this.p.rotate(this.rotation);
    this.p.fill(255);
    this.p.beginShape();
    for (let point of this.points) {
      this.p.vertex(
        (point.x - this.center.x) * scale,
        (point.y - this.center.y) * scale
      );
    }
    this.p.endShape(this.p.CLOSE);
    this.p.pop();
  }

  // Check if a point is inside the shape
  containsPoint(x, y) {
    let translatedX = x - this.center.x;
    let translatedY = y - this.center.y;
    let rotatedX = translatedX * Math.cos(-this.rotation) - translatedY * Math.sin(-this.rotation) + this.center.x;
    let rotatedY = translatedX * Math.sin(-this.rotation) + translatedY * Math.cos(-this.rotation) + this.center.y;

    let inside = false;
    for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
      let xi = this.points[i].x, yi = this.points[i].y;
      let xj = this.points[j].x, yj = this.points[j].y;
      
      if (((yi > rotatedY) !== (yj > rotatedY)) &&
          (rotatedX < (xj - xi) * (rotatedY - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  // Split the shape into two new shapes
  split(x, y) {
    if (!this.canSplit) return null;

    const isVerticalSplit = this.p.random() < 0.5;
    let intersections = this.findIntersections(x, y, isVerticalSplit);
    if (intersections.length !== 2) return null;

    let shape1Points = [], shape2Points = [];
    let currentShape = shape1Points;
    let offsetMagnitude = 20;
    let perpVector = isVerticalSplit 
      ? this.p.createVector(1, 0).mult(offsetMagnitude)
      : this.p.createVector(0, 1).mult(offsetMagnitude);

    let tempVector = this.p.createVector(); // Reuse vector for efficiency
    for (let i = 0; i < this.points.length; i++) {
      let offset = currentShape === shape1Points ? perpVector : perpVector.copy().mult(-1);
      tempVector.set(this.points[i].x + offset.x, this.points[i].y + offset.y);
      currentShape.push(tempVector.copy());
      
      if (intersections.includes(i)) {
        let nextIndex = (i + 1) % this.points.length;
        let t = this.getIntersectionT(this.points[i], this.points[nextIndex], x, y, isVerticalSplit);
        tempVector.set(
          this.points[i].x + (this.points[nextIndex].x - this.points[i].x) * t,
          this.points[i].y + (this.points[nextIndex].y - this.points[i].y) * t
        );
        currentShape.push(tempVector.copy().add(offset));
        currentShape = (currentShape === shape1Points) ? shape2Points : shape1Points;
        offset.mult(-1);
        currentShape.push(tempVector.copy().add(offset));
      }
    }

    // Apply random rotations
    let maxRotation = 0.13;
    let rotation1 = this.p.random(-maxRotation, maxRotation);
    let rotation2 = this.p.random(-maxRotation, maxRotation);

    return [
      new PredefinedShape(this.p, shape1Points, this.rotation + rotation1),
      new PredefinedShape(this.p, shape2Points, this.rotation + rotation2)
    ];
  }

  // Find intersections for splitting
  findIntersections(x, y, isVerticalSplit) {
    let intersections = [];
    for (let i = 0; i < this.points.length; i++) {
      let nextIndex = (i + 1) % this.points.length;
      if (this.lineIntersects(this.points[i], this.points[nextIndex], x, y, isVerticalSplit)) {
        intersections.push(i);
      }
    }
    return intersections;
  }

  // Check if a line intersects with the split line
  lineIntersects(a, b, x, y, isVerticalSplit) {
    if (isVerticalSplit) {
      if ((a.x > x && b.x < x) || (a.x < x && b.x > x)) {
        let t = (x - a.x) / (b.x - a.x);
        let intersectY = a.y + (b.y - a.y) * t;
        return (intersectY > Math.min(a.y, b.y) && intersectY < Math.max(a.y, b.y));
      }
    } else {
      if ((a.y > y && b.y < y) || (a.y < y && b.y > y)) {
        let t = (y - a.y) / (b.y - a.y);
        let intersectX = a.x + (b.x - a.x) * t;
        return (intersectX > Math.min(a.x, b.x) && intersectX < Math.max(a.x, b.x));
      }
    }
    return false;
  }

  // Get the intersection parameter
  getIntersectionT(a, b, x, y, isVerticalSplit) {
    return isVerticalSplit ? (x - a.x) / (b.x - a.x) : (y - a.y) / (b.y - a.y);
  }
}

// Load predefined shapes from data
function loadPredefinedShapes(p) {
  return new Set(predefinedShapesData.map(shapeData => 
    new PredefinedShape(p, shapeData.map(point => p.createVector(point[0], point[1])))
  ));
}

// Calculate scale and offset for centering shapes
function calculateScaleAndOffset(p, shapes, scaleFactor = 0.8) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let shape of shapes) {
    for (let point of shape.points) {
      minX = p.min(minX, point.x);
      minY = p.min(minY, point.y);
      maxX = p.max(maxX, point.x);
      maxY = p.max(maxY, point.y);
    }
  }

  let compositionWidth = maxX - minX;
  let compositionHeight = maxY - minY;

  let scaleX = (p.width / compositionWidth) * scaleFactor;
  let scaleY = (p.height / compositionHeight) * scaleFactor;
  scale = p.min(scaleX, scaleY);

  offsetX = (p.width - compositionWidth * scale) / 2 - minX * scale;
  offsetY = (p.height - compositionHeight * scale) / 2 - minY * scale;
}

// Main sketch
export const sketch1 = (p) => {
  p.setup = () => {
    let canvas = p.createCanvas(p.windowWidth*0.9, p.windowHeight*0.9);
    canvas.parent('p5-sketch-1');
    p.noStroke();

    // Load predefined shapes
    predefinedShapes = loadPredefinedShapes(p);
    calculateScaleAndOffset(p, predefinedShapes);
  };

  p.draw = () => {
    p.clear();
    
    // Display predefined shapes
    for (let shape of predefinedShapes) {
      shape.display(scale, offsetX, offsetY);
    }
  };

  p.mousePressed = () => {
    let mouseX = (p.mouseX - offsetX) / scale;
    let mouseY = (p.mouseY - offsetY) / scale;

    for (let shape of predefinedShapes) {
      if (shape.containsPoint(mouseX, mouseY)) {
        let newShapes = shape.split(mouseX, mouseY);
        if (newShapes) {
          predefinedShapes.delete(shape);
          newShapes.forEach(newShape => predefinedShapes.add(newShape));
          break; // Only split one shape per click
        }
      }
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    calculateScaleAndOffset(p, predefinedShapes);
  };
};
























// ... (sketch2 remains the same)

export const sketch2 = (p) => {

  p.setup = () => {
      let canvas = p.createCanvas(300, p.windowHeight);
      canvas.parent('p5-sketch-2');
      p.textSize(64);
      p.textAlign(p.CENTER, p.CENTER);
  };

  p.draw = () => {
      p.background(100, 20, 30, 100);
      

      
      // Set up the main text style
      p.fill(255, 200, 100);
      p.stroke(255, 100, 50);
      p.strokeWeight(2);
      
      // Hebrew text: "שלום עולם ברוך הבא לכאן"
      // Meaning: "Hello world welcome here"
      let hebrewText = " איזה אחלה חלל   ";
      
      p.push();
      p.translate(p.width / 2, p.height / 2);
      p.rotate(-p.HALF_PI);
      p.text(hebrewText, 0, 0);
      p.pop();
      p.circle(mouseX, mouseY, 100);
  };
};