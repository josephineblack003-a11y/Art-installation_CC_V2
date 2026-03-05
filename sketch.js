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
let cellSize;
let patternChars = ["/", "\\", "+", "-", ".", ">", "<", "0", "1"];
let savedPixels = null; // FIX: store pixels before noLoop()

function preload() {
  for (let i = 0; i < photoURLs.length; i++) {
    photos[i] = loadImage(photoURLs[i]);
  }
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);

  // FIX: broader touch prevention for iOS Safari
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
  cellSize = windowHeight / 5;
  cols = ceil(windowWidth / cellSize);
  rows = ceil(windowHeight / cellSize);
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
    // FIX: capture pixels during draw() before stopping, not after noLoop()
    if (!savedPixels) {
      drawGrid(); // draw one last frame so pixels are fresh
      savedPixels = true;
      pixelateCanvas();
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
    let x = col * cellSize;
    let y = row * cellSize;
    let cell = cells[i];

    if (!cell) continue;

    if (cell.type === "color") {
      noStroke();
      fill(cell.value);
      rect(x, y, cellSize, cellSize);
    } else if (cell.type === "pattern") {
      fill(240);
      noStroke();
      rect(x, y, cellSize, cellSize);

      fill(0);
      textSize(cellSize / 5);

      for (let j = 0; j < 5; j++) {
        let xOff = noise(i, noiseSpeed, j) * (cellSize - 20) + 10;
        let yOff = noise(i + 50, noiseSpeed, j + 2) * (cellSize - 20) + 10;
        let charIndex =
          (patternChars.indexOf(cell.value) + j) % patternChars.length;
        text(patternChars[charIndex], x + xOff, y + yOff);
      }
    } else if (cell.type === "photo") {
      image(cell.value, x, y, cellSize, cellSize);
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
    if (newType === "color")
      newValue = color(random(255), random(255), random(255));
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

// FIX: unified touch handler using rawInput for reliable iOS coords
function handleInteraction(x, y) {
  let col = Math.floor(x / cellSize);
  let row = Math.floor(y / cellSize);
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
  // FIX: use the raw touch event for reliable coordinates on iOS
  if (touches && touches.length > 0) {
    handleInteraction(touches[0].x, touches[0].y);
  }
  return false; // prevent default scroll/zoom
}

// FIX: must return false to prevent iOS from stealing touch events mid-gesture
function touchMoved() {
  return false;
}

function touchEnded() {
  return false;
}

// Mouse fallback for desktop only
function mousePressed() {
  if (touches && touches.length > 0) return false; // skip on touch devices
  handleInteraction(mouseX, mouseY);
  return false;
}

function pixelateCanvas() {
  loadPixels();
  let step = 50;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      let pixelX = constrain(floor(x + step / 2), 0, width - 1);
      let pixelY = constrain(floor(y + step / 2), 0, height - 1);
      let i = (pixelX + pixelY * width) * 4;
      fill(pixels[i], pixels[i + 1], pixels[i + 2]);
      noStroke();
      rect(x, y, step, step);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateGrid();
  initGrid();
}
