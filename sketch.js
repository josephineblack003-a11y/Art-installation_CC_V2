let clickCount = 0;
let collapseAt = 0;
let audioStarted = false;
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
let savedPixels = null;

function preload() {
  for (let i = 0; i < photoURLs.length; i++) {
    photos[i] = loadImage(photoURLs[i]);
  }
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
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
  let w = window.innerWidth;
  let h = window.innerHeight;

  // Altid præcis 5 rækker og så mange kolonner som passer
  cellSize = floor(h / 5);
  cols = floor(w / cellSize);
  rows = 5;

  // Canvas fylder præcis hele skærmen — celler strækkes til at passe
  resizeCanvas(w, h);
}

function initGrid() {
  isDestroyed = false;
  savedPixels = null;
  cells = [];
  clickCount = 0;
  collapseAt = floor(random(10, 21));
  for (let i = 0; i < cols * rows; i++) {
    changeCell(i);
  }
  loop();
}

function startAudio() {
  if (!audioStarted) {
    getAudioContext().resume();
    audioStarted = true;
  }
}

function playColorTone(colorValue) {
  let r = red(colorValue);
  let g = green(colorValue);
  let b = blue(colorValue);
  let freq = map(r * 0.5 + g * 0.3 + b * 0.2, 0, 255, 220, 880);
  let pentatonic = [220, 247, 277, 330, 370, 440, 494, 554, 659, 740, 880];
  let closest = pentatonic.reduce((a, b) =>
    Math.abs(b - freq) < Math.abs(a - freq) ? b : a
  );
  let osc = new p5.Oscillator("sine");
  osc.freq(closest);
  osc.amp(0.3);
  osc.start();
  osc.amp(0, 0.8);
  setTimeout(() => osc.stop(), 900);
}

function playCollapseSound() {
  let osc = new p5.Oscillator("sawtooth");
  osc.freq(110);
  osc.amp(0.4);
  osc.start();
  osc.freq(40, 1.5);
  osc.amp(0, 1.5);
  setTimeout(() => osc.stop(), 1600);
}

function draw() {
  if (isDestroyed) {
    if (!savedPixels) {
      drawGrid();
      savedPixels = true;
      setTimeout(() => {
        try {
          pixelateCanvas();
        } catch (e) {
          console.log("pixelate skipped:", e);
        }
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
  // Celler strækkes præcist til canvas størrelse
  let drawCellW = width / cols;
  let drawCellH = height / rows;

  for (let i = 0; i < cells.length; i++) {
    let col = i % cols;
    let row = Math.floor(i / cols);
    let x = col * drawCellW;
    let y = row * drawCellH;
    let cell = cells[i];

    if (!cell) continue;

    if (cell.type === "color") {
      noStroke();
      fill(cell.value);
      rect(x, y, drawCellW, drawCellH);
    } else if (cell.type === "pattern") {
      fill(240);
      noStroke();
      rect(x, y, drawCellW, drawCellH);
      fill(0);
      textSize(drawCellW / 5);
      for (let j = 0; j < 5; j++) {
        let xOff = noise(i, noiseSpeed, j) * (drawCellW - 20) + 10;
        let yOff = noise(i + 50, noiseSpeed, j + 2) * (drawCellH - 20) + 10;
        let charIndex =
          (patternChars.indexOf(cell.value) + j) % patternChars.length;
        text(patternChars[charIndex], x + xOff, y + yOff);
      }
    } else if (cell.type === "photo") {
      image(cell.value, x, y, drawCellW, drawCellH);
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

function handleInteraction(x, y) {
  startAudio();
  let drawCellW = width / cols;
  let drawCellH = height / rows;
  let col = Math.floor(x / drawCellW);
  let row = Math.floor(y / drawCellH);
  let index = col + row * cols;

  if (isDestroyed) {
    initGrid();
  } else if (index >= 0 && index < cells.length) {
    clickCount++;
    changeCell(index);
    if (cells[index] && cells[index].type === "color") {
      playColorTone(cells[index].value);
    }
    if (clickCount >= collapseAt) {
      playCollapseSound();
      isDestroyed = true;
    }
  } else if (index >= 0 && index < cells.length) {
    changeCell(index);
    if (cells[index] && cells[index].type === "color") {
      playColorTone(cells[index].value);
    }
  }
}

function touchStarted() {
  if (touches && touches.length > 0) {
    handleInteraction(touches[0].x, touches[0].y);
  }
  return false;
}

function touchMoved() {
  return false;
}

function touchEnded() {
  return false;
}

function mousePressed() {
  if (touches && touches.length > 0) return false;
  handleInteraction(mouseX, mouseY);
  return false;
}

function pixelateCanvas() {
  push();
  let step = 50;
  noStroke();
  let drawCellW = width / cols;
  let drawCellH = height / rows;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      let col = floor(x / drawCellW);
      let row = floor(y / drawCellH);
      let index = col + row * cols;
      if (cells[index] && cells[index].type === "color") {
        fill(cells[index].value);
        rect(x, y, step, step);
      } else {
        fill(random(255), random(255), random(255));
        rect(x, y, step, step);
      }
    }
  }
  pop();
}

function windowResized() {
  calculateGrid();
  initGrid();
}
