let cols, rows;
let cells = [];
let photos = [];
let photoURLs = [
  "smk.1.tif.jpg",
  "smk.2.jpg",
  "smk.3.tif.jpg",
  "smk.4.tif.jpg",
  "smk.5.tif.jpg",
  "smk.6.tif.jpg",
  "smk.7.jpg",
  "smk.8.tif.jpg",
  "smk.9.tif.jpg",
  "smk.10.tif.jpg",
];
let isDestroyed = false;
let cellW, cellH;
let patternChars = ["/", "\\", "+", "-", ".", ">", "<", "0", "1"];
let savedPixels = null;

function preload() {
  for (let i = 0; i < photoURLs.length; i++) {
    photos[i] = loadImage(photoURLs[i]);
  }
}

function setup() {
  let canvas = createCanvas(window.innerWidth, window.innerHeight);
  canvas.elt.style.touchAction = "none";
  canvas.elt.style.userSelect = "none";
  canvas.elt.style.webkitUserSelect = "none";
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
  document.body.style.height = "100%";
  calculateGrid();
  initGrid();
  textAlign(CENTER, CENTER);
  frameRate(30);
}

function calculateGrid() {
  rows = 5;
  cols = ceil(window.innerWidth / (window.innerHeight / rows));
  cellW = window.innerWidth / cols;
  cellH = window.innerHeight / rows;
}

function initGrid() {
  isDestroyed = false;
  savedPixels = null;
  cells = [];
  for (let i = 0; i < cols * rows; i++) {
    changeCell(i);
  }
  loop();
}

function draw() {
  if (isDestroyed) {
    if (!savedPixels) {
      drawGrid();
      savedPixels = true;
      setTimeout(() => {
        try { pixelateCanvas(); } catch(e) { console.log("pixelate skipped:", e); }
      }, 50);
    }
    noLoop();
  } else {
    background(255);
    drawGrid();
  }
}

function drawGrid() {
  let noiseSpeed = frameCount * 0.02;
  for (let i = 0; i < cells.length; i++) {
    let col = i % cols;
    let row = Math.floor(i / cols);
    let x = col * cellW;
    let y = row * cellH;
    let cell = cells[i];
    if (!cell) continue;
    if (cell.type === "color") {
      noStroke();
      fill(cell.value);
      rect(x, y, cellW, cellH);
    } else if (cell.type === "pattern") {
      fill(240);
      noStroke();
      rect(x, y, cellW, cellH);
      fill(0);
      textSize(cellH / 5);
      for (let j = 0; j < 5; j++) {
        let xOff = noise(i, noiseSpeed, j) * (cellW - 20) + 10;
        let yOff = noise(i + 50, noiseSpeed, j + 2) * (cellH - 20) + 10;
        let charIndex = (patternChars.indexOf(cell.value) + j) % patternChars.length;
        text(patternChars[charIndex], x + xOff, y + yOff);
      }
    } else if (cell.type === "photo") {
      image(cell.value, x, y, cellW, cellH);
    }
  }
}

function changeCell(index) {
  let types = ["color", "pattern", "photo"];
  let success = false;
  let attempts = 0;
  while (!success && attempts < 15) {
    let newType = random(types);
    let newValue;
    if (newType === "color") newValue = color(random(255), random(255), random(255));
    else if (newType === "pattern") newValue = random(patternChars);
    else newValue = random(photos);
    if (countOccurrences(newType, newValue) < 2) {
      cells[index] = { type: newType, value: newValue };
      success = true;
    }
    attempts++;
  }
}

function countOccurrences(type, value) {
  let count = 0;
  for (let cell of cells) {
    if (cell && cell.type === type && cell.value === value) count++;
  }
  return count;
}

function handleInteraction(x, y) {
  let col = Math.floor(x / cellW);
  let row = Math.floor(y / cellH);
  let index = col + row * cols;
  let centerIndex = floor(cells.length / 2);
  if (isDestroyed) {
    initGrid();
  } else if (index === centerIndex) {
    isDestroyed = true;
  } else if (index >= 0 && index < cells.length) {
    changeCell(index);
  }
}

function touchStarted() {
  if (touches && touches.length > 0) {
    handleInteraction(touches[0].x, touches[0].y);
  }
  return false;
}

function touchMoved() { return false; }
function touchEnded() { return false; }

function mousePressed() {
  if (touches && touches.length > 0) return false;
  handleInteraction(mouseX, mouseY);
  return false;
}

function pixelateCanvas() {
  push();
  let step = 50;
  noStroke();
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      let col = floor(x / cellW);
      let row = floor(y / cellH);
      let index = col + row * cols;
      if (cells[index] && cells[index].type === "color") {
        fill(cells[index].value);
      } else {
        fill(random(255), random(255), random(255));
      }
      rect(x, y, step, step);
    }
  }
  pop();
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
  calculateGrid();
  initGrid();
}
