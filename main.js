const PROFILE = {
  githubUrl: "https://github.com/HadesHecc",
  emailAddress: "your-email@example.com",
};

const HERO_TERMS = [
  "Large Language Model",
  "Graph Algorithms",
  "Multi-agent System",
  "Graph Reasoning",
  "Complex Network",
  "Community Detection",
];

const MICRO_TERMS = [
  "LLM",
  "Language Model",
  "Graphs",
  "Graph",
  "Algorithms",
  "Reasoning",
  "Complex",
  "Network",
  "Community",
  "Detection",
  "Agents",
  "Multi-agent",
  "Systems",
];

const DISPLAY_FONT = '"Bahnschrift", "Arial Narrow", "Segoe UI", sans-serif';
const COLOR_PALETTE = [
  { hue: 192, lightness: 72 },
  { hue: 208, lightness: 74 },
  { hue: 266, lightness: 76 },
  { hue: 314, lightness: 78 },
];

const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const state = {
  width: 0,
  height: 0,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  textNodes: [],
  sparks: [],
  pointer: { x: 0, y: 0, active: false, radius: 170 },
  sceneStart: performance.now(),
  frameId: 0,
  reducedMotion: reducedMotionQuery.matches,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function choice(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function safeZoneFor(width, height) {
  return {
    x: width * 0.5,
    y: height * 0.42,
    rx: Math.min(width * 0.18, 240),
    ry: Math.min(height * 0.13, 120),
  };
}

function randomSpreadPoint(width, height, safeZone) {
  let x = 0;
  let y = 0;
  let valid = false;

  while (!valid) {
    x = randomBetween(-width * 0.06, width * 1.06);
    y = randomBetween(-height * 0.06, height * 1.06);
    const dx = (x - safeZone.x) / safeZone.rx;
    const dy = (y - safeZone.y) / safeZone.ry;
    valid = dx * dx + dy * dy > 1.4;
  }

  return { x, y };
}

function randomFocusPoint(width, height, safeZone, ringBias) {
  const angle = randomBetween(0, Math.PI * 2);
  const radius = randomBetween(ringBias.min, ringBias.max);
  const wobble = 0.82 + Math.sin(angle * 3.1) * 0.12;
  const x = safeZone.x + Math.cos(angle) * safeZone.rx * 2.35 * radius;
  const y = safeZone.y + Math.sin(angle) * safeZone.ry * 2.7 * radius * wobble;
  return {
    x: clamp(x, -40, width + 40),
    y: clamp(y, -40, height + 40),
  };
}

function textShieldAlpha(x, y, safeZone) {
  const dx = (x - safeZone.x) / (safeZone.rx * 1.18);
  const dy = (y - safeZone.y) / (safeZone.ry * 1.16);
  const distance = dx * dx + dy * dy;
  if (distance >= 1) {
    return 1;
  }

  return 0.28 + distance * 0.72;
}

function makeTextNode(label, width, height, safeZone, options) {
  const spread = randomSpreadPoint(width, height, safeZone);
  const focus = randomFocusPoint(width, height, safeZone, options.ringBias);
  const color = choice(COLOR_PALETTE);

  return {
    label,
    isMajor: options.isMajor,
    size: options.size,
    baseX: spread.x,
    baseY: spread.y,
    focusX: focus.x,
    focusY: focus.y,
    x: spread.x,
    y: spread.y,
    vx: 0,
    vy: 0,
    drift: randomBetween(6, options.isMajor ? 18 : 30),
    phase: randomBetween(0, Math.PI * 2),
    speed: randomBetween(0.00018, 0.00034),
    alpha: options.alpha,
    hue: color.hue,
    lightness: color.lightness,
    repulsion: options.isMajor ? 0.8 : 0.52,
    weight: options.isMajor ? 700 : 500,
  };
}

function makeSpark(width, height, safeZone) {
  const spread = randomSpreadPoint(width, height, safeZone);
  const focus = randomFocusPoint(width, height, safeZone, { min: 0.25, max: 1.16 });
  const color = choice(COLOR_PALETTE);

  return {
    baseX: spread.x,
    baseY: spread.y,
    focusX: focus.x,
    focusY: focus.y,
    x: spread.x,
    y: spread.y,
    vx: 0,
    vy: 0,
    radius: randomBetween(0.8, 2.4),
    alpha: randomBetween(0.12, 0.48),
    hue: color.hue,
    lightness: color.lightness,
    drift: randomBetween(8, 28),
    speed: randomBetween(0.0002, 0.00036),
    phase: randomBetween(0, Math.PI * 2),
  };
}

function populateScene() {
  const width = state.width;
  const height = state.height;
  const safeZone = safeZoneFor(width, height);
  const compact = width < 820;

  state.textNodes = [];
  state.sparks = [];

  HERO_TERMS.forEach((label) => {
    state.textNodes.push(
      makeTextNode(label, width, height, safeZone, {
        isMajor: true,
        size: randomBetween(compact ? 15 : 18, compact ? 22 : 30),
        alpha: randomBetween(0.42, 0.68),
        ringBias: { min: 0.52, max: 1.02 },
      })
    );
  });

  const fragmentCount = compact ? 90 : 150;

  for (let index = 0; index < fragmentCount; index += 1) {
    state.textNodes.push(
      makeTextNode(choice(MICRO_TERMS), width, height, safeZone, {
        isMajor: false,
        size: randomBetween(compact ? 8 : 9, compact ? 13 : 16),
        alpha: randomBetween(0.12, 0.38),
        ringBias: { min: 0.3, max: 1.18 },
      })
    );
  }

  const sparkCount = compact ? 110 : 170;

  for (let index = 0; index < sparkCount; index += 1) {
    state.sparks.push(makeSpark(width, height, safeZone));
  }
}

function resizeCanvas() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;

  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  populateScene();
}

function clusterAmount(elapsed) {
  if (elapsed < 3400) {
    return easeOutCubic(elapsed / 3400);
  }

  if (elapsed < 7600) {
    const release = (elapsed - 3400) / 4200;
    return lerp(1, 0.3, easeOutCubic(release));
  }

  return 0.28 + Math.sin((elapsed - 7600) * 0.00028) * 0.08;
}

function updateNode(node, timestamp, amount, safeZone) {
  const driftX = Math.cos(timestamp * node.speed + node.phase) * node.drift;
  const driftY = Math.sin(timestamp * node.speed * 1.18 + node.phase * 0.9) * node.drift * 0.7;
  const homeX = lerp(node.baseX + driftX, node.focusX, amount);
  const homeY = lerp(node.baseY + driftY, node.focusY, amount);

  if (state.pointer.active) {
    const dx = node.x - state.pointer.x;
    const dy = node.y - state.pointer.y;
    const distanceSq = dx * dx + dy * dy;
    const radiusSq = state.pointer.radius * state.pointer.radius;

    if (distanceSq < radiusSq) {
      const distance = Math.max(Math.sqrt(distanceSq), 1);
      const force = (1 - distance / state.pointer.radius) * node.repulsion;
      node.vx += (dx / distance) * force * 1.25;
      node.vy += (dy / distance) * force * 1.25;
    }
  }

  node.vx += (homeX - node.x) * 0.018;
  node.vy += (homeY - node.y) * 0.018;
  node.vx *= 0.9;
  node.vy *= 0.9;
  node.x += node.vx;
  node.y += node.vy;

  return textShieldAlpha(node.x, node.y, safeZone);
}

function updateSpark(spark, timestamp, amount) {
  const driftX = Math.cos(timestamp * spark.speed + spark.phase) * spark.drift;
  const driftY = Math.sin(timestamp * spark.speed * 1.24 + spark.phase * 1.7) * spark.drift * 0.72;
  const homeX = lerp(spark.baseX + driftX, spark.focusX, amount);
  const homeY = lerp(spark.baseY + driftY, spark.focusY, amount);

  spark.vx += (homeX - spark.x) * 0.02;
  spark.vy += (homeY - spark.y) * 0.02;
  spark.vx *= 0.92;
  spark.vy *= 0.92;
  spark.x += spark.vx;
  spark.y += spark.vy;
}

function drawScene(timestamp) {
  ctx.clearRect(0, 0, state.width, state.height);
  const elapsed = timestamp - state.sceneStart;
  const amount = clusterAmount(elapsed);
  const safeZone = safeZoneFor(state.width, state.height);

  for (const spark of state.sparks) {
    updateSpark(spark, timestamp, amount);
    const shield = textShieldAlpha(spark.x, spark.y, safeZone);
    ctx.beginPath();
    ctx.fillStyle = `hsla(${spark.hue}, 95%, ${spark.lightness}%, ${spark.alpha * shield})`;
    ctx.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  for (const node of state.textNodes) {
    const shield = updateNode(node, timestamp, amount, safeZone);
    const alphaBoost = node.isMajor ? 0.3 : 0.15;
    const currentAlpha = clamp(node.alpha + amount * alphaBoost, 0, 0.88) * shield;
    ctx.font = `${node.weight} ${node.size}px ${DISPLAY_FONT}`;
    ctx.fillStyle = `hsla(${node.hue}, 88%, ${node.lightness}%, ${currentAlpha})`;
    ctx.fillText(node.label, node.x, node.y);
  }
}

function render(timestamp) {
  drawScene(timestamp);
  state.frameId = window.requestAnimationFrame(render);
}

function renderStatic() {
  const staticTimestamp = state.sceneStart + 7600;
  const safeZone = safeZoneFor(state.width, state.height);
  const amount = 0.26;

  ctx.clearRect(0, 0, state.width, state.height);

  for (const spark of state.sparks) {
    const driftX = Math.cos(staticTimestamp * spark.speed + spark.phase) * spark.drift;
    const driftY = Math.sin(staticTimestamp * spark.speed * 1.24 + spark.phase * 1.7) * spark.drift * 0.72;
    spark.x = lerp(spark.baseX + driftX, spark.focusX, amount);
    spark.y = lerp(spark.baseY + driftY, spark.focusY, amount);
    const shield = textShieldAlpha(spark.x, spark.y, safeZone);
    ctx.beginPath();
    ctx.fillStyle = `hsla(${spark.hue}, 95%, ${spark.lightness}%, ${spark.alpha * shield})`;
    ctx.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textBaseline = "middle";

  for (const node of state.textNodes) {
    const driftX = Math.cos(staticTimestamp * node.speed + node.phase) * node.drift;
    const driftY = Math.sin(staticTimestamp * node.speed * 1.18 + node.phase * 0.9) * node.drift * 0.7;
    node.x = lerp(node.baseX + driftX, node.focusX, amount);
    node.y = lerp(node.baseY + driftY, node.focusY, amount);
    const shield = textShieldAlpha(node.x, node.y, safeZone);
    ctx.font = `${node.weight} ${node.size}px ${DISPLAY_FONT}`;
    ctx.fillStyle = `hsla(${node.hue}, 88%, ${node.lightness}%, ${node.alpha * shield})`;
    ctx.fillText(node.label, node.x, node.y);
  }
}

function setProfileLinks() {
  const githubLink = document.getElementById("github-link");
  const emailLink = document.getElementById("email-link");
  const note = document.getElementById("config-note");
  const githubPlaceholder = PROFILE.githubUrl.includes("your-username");
  const emailPlaceholder = PROFILE.emailAddress.includes("your-email");

  githubLink.href = PROFILE.githubUrl;
  note.hidden = true;

  if (emailPlaceholder) {
    emailLink.hidden = true;
  } else {
    emailLink.hidden = false;
    emailLink.href = `mailto:${PROFILE.emailAddress}`;
  }

  if (githubPlaceholder) {
    note.hidden = false;
    githubLink.title = "Replace the GitHub URL in main.js";
  }
}

function stopAnimation() {
  if (state.frameId) {
    window.cancelAnimationFrame(state.frameId);
    state.frameId = 0;
  }
}

function startAnimation() {
  stopAnimation();
  resizeCanvas();

  if (state.reducedMotion) {
    renderStatic();
    return;
  }

  state.frameId = window.requestAnimationFrame(render);
}

window.addEventListener(
  "pointermove",
  (event) => {
    state.pointer.x = event.clientX;
    state.pointer.y = event.clientY;
    state.pointer.active = true;
  },
  { passive: true }
);

window.addEventListener("pointerout", (event) => {
  if (event.relatedTarget) {
    return;
  }

  state.pointer.active = false;
});

window.addEventListener(
  "resize",
  () => {
    startAnimation();
  },
  { passive: true }
);

reducedMotionQuery.addEventListener("change", (event) => {
  state.reducedMotion = event.matches;
  startAnimation();
});

setProfileLinks();
startAnimation();
