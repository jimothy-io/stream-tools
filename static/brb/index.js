"use strict";

/*
  Assumptions:
  - index.html contains: <div id="logo"></div>
  - logo.svg is a white SVG in the same folder
  - config.json exists and is readable (OBS: Enable Local File Access)
*/

const logoContainer = document.getElementById("logo");

let CONFIG;

// Motion State
let x = 100;
let y = 100;
let vx = 0;
let vy = 0;
let colorIndex = 0;
let lastTime = performance.now();

/* ---------------- SVG LOADING ---------------- */

async function loadSVG(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load logo.svg");

  const text = await res.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");
  const svg = doc.documentElement;

  // Normalize SVG so it behaves like an inline icon.
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("fill", "currentColor");

  // Force all drawable elements to inherit color.
  svg.querySelectorAll("*").forEach(el => {
    if (el.hasAttribute("fill") && el.getAttribute("fill") !== "none") {
      el.setAttribute("fill", "currentColor");
    }
    if (el.hasAttribute("stroke") && el.getAttribute("stroke") !== "none") {
      el.setAttribute("stroke", "currentColor");
    }
  });

  return svg;
}

/* ---------------- COLOR ---------------- */

function applyColor() {
  const hue = CONFIG.palette[colorIndex];
  logoContainer.style.color = `hsl(${hue}, 100%, 55%)`;
  logoContainer.style.filter =
    `drop-shadow(6px 6px 0 rgba(0,0,0,0.85))`;
}

/* ---------------- ANIMATION ---------------- */

function tick(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  const w = window.innerWidth;
  const h = window.innerHeight;
  const rect = logoContainer.getBoundingClientRect();

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

  logoContainer.style.transform = `translate(${x}px, ${y}px)`;
  requestAnimationFrame(tick);
}

/* ---------------- STARTUP ---------------- */

function start() {
  // Apply size once.
  logoContainer.style.width = `${CONFIG.logoWidth}px`;

  // force layout so bounding box is correct.
  logoContainer.getBoundingClientRect();

  vx = CONFIG.speedX;
  vy = CONFIG.speedY;

  applyColor();
  requestAnimationFrame(tick);
}

/* ---------------- BOOTSTRAP ---------------- */

Promise.all([
  fetch("config.json").then(r => {
    if (!r.ok) throw new Error("Failed to load config.json");
    return r.json();
  }),
  loadSVG("logo.svg")
])
  .then(([cfg, svg]) => {
    CONFIG = Object.freeze(cfg);

    // Insert SVG into container.
    logoContainer.appendChild(svg);

    start();
  })
  .catch(err => {
    console.error(err);
  });