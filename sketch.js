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
    let row = Math.floor(i
