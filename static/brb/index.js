"use strict";

const PALETTE = [0, 30, 60, 120, 180, 210, 270, 300];
const logo = document.getElementById("logo");

let x = 100;
let y = 100;
let vx = 220;
let vy = 160;

let colorIndex = 0;
let lastTime = performance.now();

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
    colorIndex = (colorIndex + 1) % PALETTE.length;
    logo.style.filter =
      `invert(1) sepia(1) saturate(8) hue-rotate(${PALETTE[colorIndex]}deg)`;
  }

  logo.style.transform = `translate(${x}px, ${y}px)`;
  requestAnimationFrame(tick);
}

function start() {
  logo.style.filter =
    `invert(1) sepia(1) saturate(8) hue-rotate(${PALETTE[colorIndex]}deg)`;
  requestAnimationFrame(tick);
}

if (logo.complete) {
  start();
} else {
  logo.onload = start;
}
