"use strict";

const $ = (id) => document.getElementById(id);
const games = ["pack", "frost", "compare"];
const done = new Set();

function updateHome() {
  $("home-progress").textContent = done.size > 0 ? `${done.size} of 3 complete` : "";
  document.querySelectorAll("[data-card]").forEach((card) => {
    card.querySelector(".card-link").firstChild.textContent = done.has(card.dataset.card) ? "Play again " : "Play game ";
  });
}

function goTo(page) {
  window.location.hash = page;
}

function renderPage(moveFocus = true) {
  const destination = window.location.hash.slice(1);
  const page = games.includes(destination) ? destination : "home";
  $("home").hidden = page !== "home";
  $("game-view").hidden = page === "home";
  games.forEach((game) => {
    $(game).hidden = page !== game;
  });
  document.querySelectorAll("[data-step]").forEach((link) => {
    if (link.dataset.step === page) {
      link.setAttribute("aria-current", "step");
    } else {
      link.removeAttribute("aria-current");
    }
  });
  if (page === "home") updateHome();
  if (moveFocus) {
    $(`${page}-title`).focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

const heroSnow = $("hero-snow");
const snowToggle = $("hero-snow-toggle");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const flakeCount = 42;

function setSnowPaused(paused) {
  heroSnow.classList.toggle("is-paused", paused);
  snowToggle.textContent = paused ? "Start snow" : "Pause snow";
}

setSnowPaused(reducedMotion.matches);
reducedMotion.addEventListener("change", (event) => setSnowPaused(event.matches));
snowToggle.addEventListener("click", () => setSnowPaused(!heroSnow.classList.contains("is-paused")));

const flakes = Array.from({ length: flakeCount }, (_, index) => {
  const flake = document.createElement("span");
  const near = Math.random();
  const duration = 54 - 25 * near;
  flake.style.setProperty("--flake-x", `${((index + Math.random()) / flakeCount) * 100}%`);
  flake.style.setProperty("--flake-size", `${2.2 + 3.8 * near}px`);
  flake.style.setProperty("--flake-opacity", String(0.42 + 0.54 * near));
  flake.style.setProperty("--fall-duration", `${duration}s`);
  flake.style.setProperty("--fall-delay", `${-duration * Math.random()}s`);
  flake.style.setProperty("--fall-drift", `${(Math.random() - 0.5) * 45}px`);
  return flake;
});
heroSnow.append(...flakes);

const destinations = [
  {
    title: "A weekend in a snowy cabin",
    twist: "Snow has blocked the road. You have to stay one more night!",
    question: "Which two things from your suitcase would help you most? What do you wish you’d packed?",
  },
  {
    title: "A winter city break",
    twist: "Your phone battery is dead, and you can’t remember the way to your hotel!",
    question: "How would you find your way back? Would you ask someone for help or use something you packed?",
  },
  {
    title: "A day without electricity",
    twist: "It’s getting dark, and the power won’t be back until morning!",
    question: "How would you keep warm, see in the dark and spend the evening? Would you swap anything you packed?",
  },
];
const gear = [
  ["gloves", "Gloves"],
  ["torch", "Torch"],
  ["paper-map", "Paper map"],
  ["power-bank", "Power bank"],
  ["wool-socks", "Wool socks"],
  ["scarf", "Scarf"],
  ["first-aid-kit", "First-aid kit"],
  ["candles", "Candles"],
  ["matches", "Matches"],
  ["chocolate", "Chocolate"],
  ["thermos", "Thermos"],
  ["guidebook", "Guidebook"],
  ["headphones", "Headphones"],
  ["winter-boots", "Winter boots"],
  ["blanket", "Blanket"],
];
const capacity = 5;
const packed = new Set();
const gearButtons = [];
let destinationIndex = -1;
let twistOpen = false;

function makeItemParts(button, imageName, label) {
  const picture = document.createElement("img");
  picture.className = "item-photo";
  picture.src = `assets/gear/${imageName}.webp`;
  picture.alt = "";
  picture.width = 192;
  picture.height = 152;
  picture.draggable = false;
  const name = document.createElement("span");
  name.className = "item-label";
  name.textContent = label;
  button.append(picture, name);
}

function updatePacking(message) {
  gearButtons.forEach((button, index) => {
    const selected = packed.has(index);
    button.disabled = destinationIndex < 0 || selected;
    button.classList.toggle("is-packed", selected);
  });

  $("packed-items").replaceChildren(...Array.from(packed, (index) => {
    const [imageName, label] = gear[index];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "packed-item";
    button.dataset.item = String(index);
    button.setAttribute("aria-label", `Remove ${label.toLowerCase()} from suitcase`);
    button.title = `Remove ${label.toLowerCase()}`;
    makeItemParts(button, imageName, label);
    button.addEventListener("click", () => {
      packed.delete(index);
      updatePacking();
      gearButtons[index].focus({ preventScroll: true });
    });
    return button;
  }));

  $("suitcase-empty").hidden = packed.size > 0;
  $("pack-count").textContent = `${packed.size} / ${capacity}`;
  $("twist-button").disabled = packed.size !== capacity || twistOpen;
  $("twist-button").hidden = twistOpen;
  $("twist").hidden = !twistOpen;
  $("pack-next").disabled = !twistOpen;

  let status = "Reveal your destination to start.";
  if (destinationIndex >= 0) {
    status = packed.size === capacity
      ? "Your suitcase is full. Tap an item inside to swap it."
      : "Tap a packed item to take it out.";
    if (packed.size === 0) status = "Choose any five items.";
  }
  $("pack-message").textContent = message || status;
}

function packItem(index, moveFocus) {
  if (destinationIndex < 0 || packed.has(index) || !gear[index]) return;
  if (packed.size >= capacity) {
    $("pack-message").textContent = "Only five fit! Take something out first.";
    return;
  }
  packed.add(index);
  updatePacking();
  if (moveFocus) {
    if (packed.size === capacity && !twistOpen) {
      $("twist-button").focus({ preventScroll: true });
    } else {
      const nextItem = gearButtons.slice(index + 1).find((button) => !button.disabled)
        || gearButtons.find((button) => !button.disabled);
      nextItem?.focus({ preventScroll: true });
    }
  }
}

const suitcase = $("suitcase");
let drag;
let draggedIndex;

function isOverSuitcase(event) {
  const box = suitcase.getBoundingClientRect();
  return event.clientX >= box.left && event.clientX <= box.right
    && event.clientY >= box.top && event.clientY <= box.bottom;
}

function moveItem(event) {
  if (event.pointerId !== drag?.pointerId) return;
  if (!drag.preview) {
    const distance = Math.hypot(event.clientX - drag.x, event.clientY - drag.y);
    if (distance < 8) return;
    drag.preview = drag.button.cloneNode(true);
    drag.preview.classList.add("item-in-flight");
    drag.preview.inert = true;
    document.body.append(drag.preview);
    drag.button.setPointerCapture(drag.pointerId);
  }
  drag.preview.style.left = `${event.clientX}px`;
  drag.preview.style.top = `${event.clientY}px`;
  suitcase.classList.toggle("drag-over", isOverSuitcase(event));
}

function endItemDrag(event) {
  if (event.pointerId !== drag?.pointerId) return;
  if (drag.preview) {
    drag.preview.remove();
    suitcase.classList.remove("drag-over");
    draggedIndex = drag.index;
    if (event.type === "pointerup" && isOverSuitcase(event)) packItem(drag.index, false);
  }
  drag = undefined;
}

window.addEventListener("pointermove", moveItem);
window.addEventListener("pointerup", endItemDrag);
window.addEventListener("pointercancel", endItemDrag);

gear.forEach(([imageName, label], index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "item";
  makeItemParts(button, imageName, label);
  button.addEventListener("pointerdown", (event) => {
    if (button.disabled || drag || event.button !== 0) return;
    draggedIndex = undefined;
    drag = { button, index, pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  });
  button.addEventListener("click", (event) => {
    if (draggedIndex === index && event.detail !== 0) return;
    packItem(index, event.detail === 0);
  });
  gearButtons.push(button);
  $("item-bank").append(button);
});

$("destination-button").addEventListener("click", () => {
  const options = destinations.map((_, index) => index).filter((index) => index !== destinationIndex);
  destinationIndex = options[Math.floor(Math.random() * options.length)];
  const destination = destinations[destinationIndex];
  $("destination").textContent = destination.title;
  $("twist-title").textContent = destination.twist;
  $("twist-question").textContent = destination.question;
  $("destination-button").textContent = "New destination";
  packed.clear();
  twistOpen = false;
  updatePacking();
});
$("twist-button").addEventListener("click", () => {
  twistOpen = true;
  updatePacking();
  $("twist-title").focus({ preventScroll: true });
  $("twist").scrollIntoView({ block: "nearest" });
});
$("pack-next").addEventListener("click", () => {
  done.add("pack");
  goTo("frost");
});
updatePacking();

const photos = [
  {
    name: "dog",
    answer: "A dog in an oversized sweater!",
    question: "Why is it wearing such a big sweater? What might happen when it tries to run?",
    clues: [[0.28, 0.39], [0.52, 0.67], [0.67, 0.4]],
  },
  {
    name: "drift",
    answer: "A hiker stuck in a snowdrift!",
    question: "How did they end up there? What would you say if you were with them?",
    clues: [[0.76, 0.41], [0.31, 0.57], [0.52, 0.36]],
  },
  {
    name: "snowman",
    answer: "A snowman in sunglasses!",
    question: "What else looks unusual? Imagine who built it and explain why.",
    clues: [[0.52, 0.25], [0.71, 0.52], [0.49, 0.39]],
  },
  {
    name: "rabbit",
    answer: "A rabbit and a person are both holding the same carrot!",
    question: "Who do you think will get the carrot? Tell us what happens next.",
    clues: [[0.35, 0.49], [0.59, 0.70], [0.76, 0.66]],
  },
  {
    name: "scarf-plants",
    answer: "Someone put tiny scarves on their plant pots!",
    question: "Why do you think the plants are out in the snow? Who dressed them up?",
    clues: [[0.52, 0.31], [0.55, 0.72], [0.29, 0.71]],
  },
];

const ice = $("ice");
const frost = ice.getContext("2d", { willReadFrequently: true });
const frostWidth = 960;
const frostHeight = 540;
let photoIndex = 0;
let clueIndex = 0;
let activePointer;
let lastPoint;
let photoOpen = false;
let roundRevealed = false;

function frostRandom(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function paintFrost() {
  ice.width = frostWidth;
  ice.height = frostHeight;
  const random = frostRandom(29 + photoIndex);
  const base = frost.createLinearGradient(0, 0, frostWidth, frostHeight);
  base.addColorStop(0, "#a0bbce");
  base.addColorStop(0.45, "#d3e3e9");
  base.addColorStop(1, "#8da9bf");
  frost.fillStyle = base;
  frost.fillRect(0, 0, frostWidth, frostHeight);

  for (let index = 0; index < 3300; index++) {
    const x = random() * frostWidth;
    const y = random() * frostHeight;
    const length = 1 + random() * 4;
    frost.fillStyle = index % 3 ? "rgba(255,255,255,.15)" : "rgba(72,106,128,.12)";
    frost.fillRect(x, y, length, 1);
  }

  for (let index = 0; index < 52; index++) {
    const x = random() * frostWidth;
    const y = random() * frostHeight;
    const radius = 16 + random() * 99;
    const angle = random() * Math.PI;
    frost.strokeStyle = index % 3 ? "rgba(253,255,255,.34)" : "rgba(234,248,255,.57)";
    frost.lineWidth = 0.8 + random() * 1.1;
    for (let arm = 0; arm < 6; arm++) {
      const direction = angle + arm * Math.PI / 3;
      const cos = Math.cos(direction);
      const sin = Math.sin(direction);
      frost.beginPath();
      frost.moveTo(x, y);
      frost.lineTo(x + cos * radius, y + sin * radius);
      for (let step = 0.25; step < 0.88; step += 0.135) {
        const distance = radius * step;
        const branch = radius * (0.24 - step * 0.16);
        const bx = x + cos * distance;
        const by = y + sin * distance;
        [-0.9, 0.9].forEach((offset) => {
          frost.moveTo(bx, by);
          frost.lineTo(bx + branch * Math.cos(direction + offset), by + branch * Math.sin(direction + offset));
        });
      }
      frost.stroke();
    }
  }

  const vignette = frost.createRadialGradient(frostWidth / 2, frostHeight / 2, 120, frostWidth / 2, frostHeight / 2, 560);
  vignette.addColorStop(0, "rgba(62,94,120,0)");
  vignette.addColorStop(1, "rgba(51,82,112,.48)");
  frost.fillStyle = vignette;
  frost.fillRect(0, 0, frostWidth, frostHeight);
  ice.classList.add("drawn");
}

function eraseFrost(from, to, width) {
  frost.save();
  frost.globalCompositeOperation = "destination-out";
  frost.lineWidth = width;
  frost.lineCap = "round";
  frost.lineJoin = "round";
  frost.beginPath();
  frost.moveTo(from.x, from.y);
  if (from.x === to.x && from.y === to.y) {
    frost.arc(to.x, to.y, width / 2, 0, Math.PI * 2);
    frost.fill();
  } else {
    frost.lineTo(to.x, to.y);
    frost.stroke();
  }
  frost.restore();
}

function checkFrost() {
  if (photoOpen) return;
  const pixels = frost.getImageData(0, 0, frostWidth, frostHeight).data;
  let samples = 0;
  let clear = 0;
  for (let y = 11; y < frostHeight; y += 19) {
    for (let x = 11; x < frostWidth; x += 19) {
      samples++;
      if (pixels[(y * frostWidth + x) * 4 + 3] < 45) clear++;
    }
  }
  if (clear / samples > 0.62) revealPhoto();
}

function pointOnIce(event) {
  const rect = ice.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * frostWidth / rect.width,
    y: (event.clientY - rect.top) * frostHeight / rect.height,
  };
}

function revealPhoto() {
  if (photoOpen) return;
  const currentPhoto = photos[photoIndex];
  photoOpen = true;
  roundRevealed = true;
  ice.hidden = true;
  $("clue-button").hidden = true;
  $("reveal-photo").hidden = true;
  $("next-photo").hidden = false;
  $("frost-next").disabled = false;
  $("frost-prompt-label").textContent = "The reveal";
  $("frost-prompt-title").textContent = currentPhoto.answer;
  $("frost-prompt-text").textContent = currentPhoto.question;
  $("hidden-photo").alt = currentPhoto.answer;
}

function prepPhoto() {
  clueIndex = 0;
  activePointer = undefined;
  photoOpen = false;
  $("hidden-photo").src = `assets/${photos[photoIndex].name}.webp`;
  $("hidden-photo").alt = "";
  $("photo-count").textContent = `Photo ${photoIndex + 1} of ${photos.length}`;
  $("frost-prompt-label").textContent = "Your guess";
  $("frost-prompt-title").textContent = "What do you think it is?";
  $("frost-prompt-text").textContent = "Name one detail you can see. Then say what you think is happening.";
  $("reveal-photo").hidden = false;
  $("next-photo").hidden = true;
  $("frost-next").disabled = !roundRevealed;
  $("clue-button").hidden = false;
  $("clue-button").disabled = false;
  ice.hidden = false;
  paintFrost();
}

ice.addEventListener("pointerdown", (event) => {
  if (photoOpen || activePointer !== undefined || event.button !== 0) return;
  activePointer = event.pointerId;
  ice.setPointerCapture(activePointer);
  lastPoint = pointOnIce(event);
  eraseFrost(lastPoint, lastPoint, 90);
});
ice.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointer || photoOpen) return;
  const point = pointOnIce(event);
  eraseFrost(lastPoint, point, 90);
  lastPoint = point;
});
function endScratch(event) {
  if (event.pointerId !== activePointer) return;
  activePointer = undefined;
  checkFrost();
}
ice.addEventListener("pointerup", endScratch);
ice.addEventListener("pointercancel", endScratch);
ice.addEventListener("lostpointercapture", endScratch);
$("reveal-photo").addEventListener("click", () => {
  revealPhoto();
  $("next-photo").focus({ preventScroll: true });
});
$("clue-button").addEventListener("click", () => {
  const clues = photos[photoIndex].clues;
  const [x, y] = clues[clueIndex];
  const point = { x: x * frostWidth, y: y * frostHeight };
  eraseFrost(point, point, 118);
  clueIndex++;
  if (clueIndex >= clues.length) {
    $("clue-button").disabled = true;
    $("reveal-photo").focus({ preventScroll: true });
  }
});
$("next-photo").addEventListener("click", () => {
  photoIndex = (photoIndex + 1) % photos.length;
  prepPhoto();
  $("clue-button").focus({ preventScroll: true });
});
$("frost-next").addEventListener("click", () => {
  done.add("frost");
  goTo("compare");
});
prepPhoto();

const scenes = [
  {
    name: "Café",
    images: ["expectation", "reality"],
    expectation: "Fresh snow and empty seats outside a warmly lit café.",
    reality: "People queue outside the café, standing in muddy slush.",
    before: "Would you stop at this café? What do you think you’ll find when you get there?",
    after: "Would you wait in that queue or go somewhere else? Tell us why.",
  },
  {
    name: "Ice rink",
    images: ["skating-expectation", "skating-reality"],
    expectation: "An empty outdoor ice rink and a pair of skates on a bench.",
    reality: "People grab the rail for balance, and one skater is sitting on the ice.",
    before: "Imagine this is your first time on ice. How do you think it will go?",
    after: "How did skating turn out? What would you say to the person who fell?",
  },
  {
    name: "Snowman",
    images: ["snowman-expectation", "snowman-reality"],
    expectation: "A snowman in a scarf and hat stands in a snowy garden.",
    reality: "The snowman has melted into a small pile, with the hat, scarf and carrot on the ground.",
    before: "You’ve just built this snowman. What do you expect it to look like tomorrow?",
    after: "Describe what happened to your snowman. What would you do with the hat, scarf and carrot?",
  },
  {
    name: "Forest walk",
    images: ["walk-expectation", "walk-reality"],
    expectation: "A lightly snow-covered footbridge leads into a sunny winter forest.",
    reality: "A deep snowdrift blocks the footbridge, and footprints stop in front of it.",
    before: "You’re going for a short walk before lunch. What do you expect the path to be like?",
    after: "You’ve reached the bridge. Would you try to cross, find another way or turn back?",
  },
];
let sceneIndex = 0;
let showingRealityPrompt = false;
const revealedScenes = new Set();
const slider = $("slider");
const compare = $("comparison");
const expectationLabel = compare.querySelector(".expectation-label");
const realityLabel = compare.querySelector(".reality-label");
const expectationPhoto = compare.querySelector(".expectation-photo");
const realityPhoto = compare.querySelector(".reality-photo");

const sceneButtons = scenes.map((scene, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "secondary";
  button.textContent = scene.name;
  button.addEventListener("click", () => {
    if (sceneIndex !== index) selectScene(index);
  });
  $("scene-picker").append(button);
  return button;
});

function showScenePrompt(hasRevealed) {
  const scene = scenes[sceneIndex];
  showingRealityPrompt = hasRevealed;
  $("compare-prompt-label").textContent = hasRevealed ? "After the reveal" : "Before you slide";
  $("compare-prompt-title").textContent = hasRevealed ? "What actually happened?" : "What were you expecting?";
  $("compare-prompt-text").textContent = hasRevealed ? scene.after : scene.before;
}

function selectScene(index) {
  sceneIndex = index;
  const [expectation, reality] = scenes[index].images;
  expectationPhoto.src = `assets/${expectation}.webp`;
  realityPhoto.src = `assets/${reality}.webp`;
  sceneButtons.forEach((button, buttonIndex) => {
    button.setAttribute("aria-pressed", String(index === buttonIndex));
  });
  slider.value = 100;
  showScenePrompt(false);
  updateSlider();
}

function updateSlider() {
  const value = Number(slider.value);
  const scene = scenes[sceneIndex];
  compare.style.setProperty("--split", `${value}%`);
  compare.classList.toggle("at-start", value < 4);
  compare.classList.toggle("at-end", value > 96);
  expectationLabel.classList.toggle("visible", value > 24);
  realityLabel.classList.toggle("visible", value < 77);
  expectationPhoto.alt = value > 24 ? scene.expectation : "";
  realityPhoto.alt = value < 77 ? scene.reality : "";
  $("show-expectation").setAttribute("aria-pressed", String(value === 100));
  $("show-reality").setAttribute("aria-pressed", String(value === 0));
  slider.setAttribute("aria-valuetext", `${value}% expectation, ${100 - value}% reality`);
  if (value <= 35) {
    if (!showingRealityPrompt) showScenePrompt(true);
    revealedScenes.add(sceneIndex);
  } else if (value === 100 && showingRealityPrompt) {
    showScenePrompt(false);
  }
  $("compare-finish").disabled = revealedScenes.size === 0;
}
slider.addEventListener("input", updateSlider);
$("show-expectation").addEventListener("click", () => {
  slider.value = 100;
  updateSlider();
});
$("show-reality").addEventListener("click", () => {
  slider.value = 0;
  updateSlider();
});
$("compare-finish").addEventListener("click", () => {
  done.add("compare");
  goTo("home");
});
selectScene(0);

function restartGame(game) {
  done.delete(game);
  if (game === "pack") {
    destinationIndex = -1;
    packed.clear();
    twistOpen = false;
    $("destination").textContent = "Where are you going?";
    $("destination-button").textContent = "Reveal your destination";
    updatePacking();
  } else if (game === "frost") {
    photoIndex = (photoIndex + 1) % photos.length;
    roundRevealed = false;
    prepPhoto();
  } else if (game === "compare") {
    revealedScenes.clear();
    selectScene(0);
  }
}

document.querySelectorAll("[data-card]").forEach((card) => {
  card.addEventListener("click", () => {
    if (done.has(card.dataset.card)) restartGame(card.dataset.card);
  });
});
document.querySelector(".hero .primary").addEventListener("click", () => {
  if (done.size === games.length) games.forEach(restartGame);
});

history.scrollRestoration = "manual";
window.addEventListener("hashchange", () => renderPage());
renderPage(Boolean(window.location.hash));
