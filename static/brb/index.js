"use strict";

const logo = document.getElementById("logo");

let CONFIG;
let x = 100;
let y = 100;
let vx = 0;
let vy = 0;
let colorIndex = 0;
let lastTime = performance.now();

function applyColor() {
  logo.style.filter =
    `invert(1) sepia(1) saturate(8) hue-rotate(${CONFIG.palette[colorIndex]}deg)`;
}

function tick(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  const w = window.innerWidth;
  const h = window.innerHeight;
  const rect = logo.getBoundingClientRect();

  x += vx * dt;
  y += vy * dt;

  let bounced = false;

  if (x <= 0) {
    x = 0;
    vx *= -1;
    bounced = true;
  } else if (x + rect.width >= w) {
    x = w - rect.width;
    vx *= -1;
    bounced = true;
  }

  if (y <= 0) {
    y = 0;
    vy *= -1;
    bounced = true;
  } else if (y + rect.height >= h) {
    y = h - rect.height;
    vy *= -1;
    bounced = true;
  }

  if (bounced) {
    colorIndex = (colorIndex + 1) % CONFIG.palette.length;
    applyColor();
  }

  logo.style.transform = `translate(${x}px, ${y}px)`;
  requestAnimationFrame(tick);
}

function start() {
  logo.style.width = `${CONFIG.logoWidth}px`;
  logo.getBoundingClientRect();
  vx = CONFIG.speedX;
  vy = CONFIG.speedY;
  applyColor();
  requestAnimationFrame(tick);
}

fetch("config.json")
  .then(r => {
    if (!r.ok) throw new Error("Failed to load config.json.");
    return r.json();
  })
  .then(cfg => {
    CONFIG = Object.freeze(cfg);
    if (logo.complete) start();
    else logo.onload = start;
  })
  .catch(err => {
    console.error(err);
  });