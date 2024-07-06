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
  constructor(p, points, rotation = 0, generation = 1) {
    this.p = p;
    this.points = points;
    this.rotation = rotation;
    this.canSplit = true;
    this.center = this.calculateCenter();
    this.generation = generation;
    this.velocity = p.createVector(0, 0);
    this.isMoving = false;
    this.scaleFactor = 1; // Add this line for individual shape scaling
  }

  move() {
    if (this.isMoving) {
      this.center.add(this.velocity);
      // Gradually scale down the shape
      this.scaleFactor *= this.p.random(0.993, 0.999);
        }
  }

  isOffScreen(canvasWidth, canvasHeight, globalScale, offsetX, offsetY) {
    let minSizeThreshold = 0.1; // Adjust this value as needed
 
    return this.scaleFactor < minSizeThreshold
  
    // // If not too small, check if it's off screen
    // let scaledCenterX = this.center.x * globalScale + offsetX;
    // let scaledCenterY = this.center.y * globalScale + offsetY;
    // let shapeSize = 100 * globalScale * this.scaleFactor; // Estimate shape size
  
    // return scaledCenterX < -shapeSize || 
    //        scaledCenterX > canvasWidth + shapeSize ||
    //        scaledCenterY < -shapeSize || 
    //        scaledCenterY > canvasHeight + shapeSize;
  }

  startMoving() {
    this.isMoving = true;
    let speed = 4;
    this.velocity = this.p.createVector(
      this.p.random(-speed, speed),
      this.p.random(-speed, speed)
    );
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
  display(globalScale, offsetX, offsetY) {
    this.p.push();
    this.p.translate(
      this.center.x * globalScale + offsetX,
      this.center.y * globalScale + offsetY
    );
    this.p.rotate(this.rotation);
    this.p.scale(this.scaleFactor); // Apply individual shape scale
    this.p.fill(255);
    this.p.beginShape();
    for (let point of this.points) {
      this.p.vertex(
        (point.x - this.center.x) * globalScale,
        (point.y - this.center.y) * globalScale
      );
    }
    this.p.endShape(this.p.CLOSE);
    this.p.pop();
  }

  // Check if a point is inside the shape
  containsPoint(x, y) {
  // Adjust the input coordinates based on the shape's current position and scale
  let adjustedX = (x - this.center.x) / this.scaleFactor + this.center.x;
  let adjustedY = (y - this.center.y) / this.scaleFactor + this.center.y;

  let translatedX = adjustedX - this.center.x;
  let translatedY = adjustedY - this.center.y;
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
  
    // Adjust the split point based on the current scale
    let adjustedX = (x - this.center.x) / this.scaleFactor + this.center.x;
    let adjustedY = (y - this.center.y) / this.scaleFactor + this.center.y;
  
    const isVerticalSplit = this.p.random() < 0.5;
    let intersections = this.findIntersections(adjustedX, adjustedY, isVerticalSplit);
    if (intersections.length !== 2) return null;
  
    let shape1Points = [], shape2Points = [];
    let currentShape = shape1Points;
    let offsetMagnitude = 20 * this.scaleFactor; // Scale the offset
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
        let t = this.getIntersectionT(this.points[i], this.points[nextIndex], adjustedX, adjustedY, isVerticalSplit);
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
  
    // Create new shapes with increased generation and inherited scale factor
    return [
      new PredefinedShape(this.p, shape1Points, this.rotation + rotation1, this.generation + 1, this.scaleFactor),
      new PredefinedShape(this.p, shape2Points, this.rotation + rotation2, this.generation + 1, this.scaleFactor)
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
    new PredefinedShape(p, shapeData.map(point => p.createVector(point[0], point[1])), 0, 1)
  ));
}

// Calculate scale and offset for centering shapes
function calculateScaleAndOffset(p, shapes, scaleFactor = 0.9) {
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

  offsetX = (p.width - compositionWidth * scale) / 2 - minX * scale + 10;
  offsetY = (p.height - compositionHeight * scale) / 2 - minY * scale -20;
}

// Main sketch
export const sketch1 = (p) => {
  let textX, textY, textWidth, textHeight, hebrewText;
  p.setup = () => {
    let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent('p5-sketch-1');
    p.noStroke();

    // Load predefined shapes
    predefinedShapes = loadPredefinedShapes(p);
    calculateScaleAndOffset(p, predefinedShapes);
    p.textSize(30);
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont('david');

    // Calculate text position and dimensions
    hebrewText = "הפעם בקטע סבבה";
    textX = 50;
    textY = 90;
    textWidth = p.textWidth(hebrewText);
    textHeight = p.textAscent() + p.textDescent();
  };

  p.draw = () => {
    p.clear();
    
    let shapesToRemove = new Set();
  
for (let shape of predefinedShapes) {
      shape.move();
      shape.display(scale, offsetX, offsetY);

      if (shape.isOffScreen(p.width, p.height, scale, offsetX, offsetY)) {
        shapesToRemove.add(shape);
      }
    }
  
    // Remove shapes that are off-screen
    shapesToRemove.forEach(shape => predefinedShapes.delete(shape));
  
    // Display Hebrew text
    p.fill(255);
    p.text(hebrewText, 255, 750);
    // p.fill(255,0,0)
    // p.rect(0,0,p.width,p.height);
  };

  p.mousePressed = () => {
    let mouseX = (p.mouseX - offsetX) / scale;
    let mouseY = (p.mouseY - offsetY) / scale;
  
    for (let shape of predefinedShapes) {
      // Only consider shapes that are still visible
      if (shape.scaleFactor > 0.1) {  // You can adjust this threshold
        if (shape.containsPoint(mouseX, mouseY)) {
          let newShapes = shape.split(mouseX, mouseY);
          if (newShapes) {
            predefinedShapes.delete(shape);
            newShapes.forEach(newShape => {
              predefinedShapes.add(newShape);
              if (newShape.generation >= 3) {
                let moveProbability = calculateMoveProbability(newShape.generation);
                if (p.random() < moveProbability) {
                  newShape.startMoving();
                }
              }
            });
            break; // Only split one shape per click
          }
        }
      }
    }
  };
  
  // Helper function to calculate move probability
  function calculateMoveProbability(generation) {
    if (generation < 3) return 0;
    // Start with 25% for generation 3, increase by 10% for each generation
    let probability = 0.20 + (generation - 3) * 0.05;
    // Cap the probability at 95% to always leave a small chance of not moving
    return Math.min(probability, 0.95);
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    calculateScaleAndOffset(p, predefinedShapes);
  };
};
























// ... (sketch2 remains the same)
export const sketch2 = (p) => {
  let textX, textY, textWidth, textHeight, hebrewText;
  let ellipseWidth, ellipseHeight;
  let rectRotation = 0;
  let targetRotation = 0;
  let isMouseOver = false;

  // Define colors
  const normalColor = p.color(200, 200, 200);
  const hoverColor = p.color(0, 0, 255); // Deep blue
  let currentEllipseColor;
  let currentTextColor;

  p.setup = () => {
    let canvas = p.createCanvas(p.windowWidth, 200);
    canvas.parent('p5-sketch-2');
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.textFont('narkisBlock');

    // Calculate text position and dimensions
    hebrewText = "כרטיסים";
    textX = 50;
    textY = 90;
    textWidth = p.textWidth(hebrewText);
    textHeight = p.textAscent() + p.textDescent();

    // Calculate ellipse dimensions (make it slightly larger than the text)
    ellipseWidth = textHeight + 20;  // Add some padding
    ellipseHeight = textWidth + 40;  // Add some padding

    // Initialize colors
    currentEllipseColor = normalColor;
    currentTextColor = p.color(0); // Black
  };

  p.draw = () => {
    p.clear();
  
    // Check if mouse is over ellipse
    let d = p.dist(p.mouseX, p.mouseY, textX, p.height - textY);
    isMouseOver = d < ellipseWidth/2;

    if (isMouseOver) {
      targetRotation = p.PI/4;
    } else {
      targetRotation = 0;
    }

    // Smoothly interpolate the rotation
    rectRotation = p.lerp(rectRotation, targetRotation, 0.1);

    // Smoothly interpolate the colors
    currentEllipseColor = p.lerpColor(currentEllipseColor, isMouseOver ? hoverColor : normalColor, 0.1);
    currentTextColor = p.lerpColor(currentTextColor, isMouseOver ? p.color(255) : p.color(0), 0.1);
  
    // Draw ellipse
    p.push();
    p.translate(textX+3, p.height - textY);
    p.fill(currentEllipseColor);
    p.noStroke();
    p.ellipse(0, 0, ellipseWidth, ellipseHeight);
    
    // Draw rotating rectangle
    p.push();
    p.fill(currentTextColor); // Use the same color as the text
    p.translate(0, -ellipseHeight/2 + 12);
    p.rotate(rectRotation);
    p.rectMode(p.CENTER);
    p.rect(0, 0, 8, 8);
    p.pop();
    
    p.pop();

    // Draw main text
    p.fill(currentTextColor);
    p.noStroke();
    p.push();
    p.translate(textX, p.height - textY);
    p.rotate(-p.PI/2);
    p.text(hebrewText, 0, 0);
    p.pop();
  };
};