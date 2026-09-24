let CONTENT = DEFAULT_CONTENT;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const state = { tint: null, fill: 0, noDodges: 0, dateKind: null, when: null, typed: false };

function letterText() {
  const g = CONTENT.greeting ? `${CONTENT.greeting}\n\n` : "";
  const extra = CONTENT.oneTrueThing ? `\n\n${CONTENT.oneTrueThing}` : "";
  return g + (CONTENT.letter.body || "") + extra;
}

const fine = window.matchMedia("(pointer: fine)").matches;
if (!fine) document.body.classList.add("is-touch");

const world = $("#world");
let tx = innerWidth / 2,
  ty = innerHeight / 2,
  wx = 0,
  wy = 0;
const trail = [];

window.addEventListener("pointermove", (e) => {
  tx = e.clientX;
  ty = e.clientY;
  if (trail.length < 16) {
    trail.push({
      x: e.clientX + 16,
      y: e.clientY + 11,
      life: 1,
      gold: Math.random() > 0.45,
    });
  }
  wx = (e.clientX / innerWidth - 0.5) * 8;
  wy = (e.clientY / innerHeight - 0.5) * 5;
});

document.addEventListener("pointerdown", (e) => {
  if (e.target.closest("button, a, input, textarea, .mail, .well")) return;
  const img = document.createElement("img");
  img.src = (CONTENT.images && CONTENT.images.hearts) || "assets/hearts.png";
  img.className = "pop";
  img.style.left = e.clientX - 20 + "px";
  img.style.top = e.clientY - 20 + "px";
  document.body.appendChild(img);
  setTimeout(() => img.remove(), 850);
});

function tickWorld() {
  if (world) world.style.transform = `translate3d(${wx}px, ${wy}px, 0)`;
  requestAnimationFrame(tickWorld);
}
tickWorld();

const canvas = $("#sky");
const ctx = canvas.getContext("2d", { alpha: true });
let W = 0,
  H = 0,
  flies = [],
  burst = [],
  t = 0;
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 1.25);
  W = canvas.width = Math.floor(innerWidth * dpr);
  H = canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  flies = Array.from({ length: 8 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    p: Math.random() * 6,
    s: 0.5 + Math.random(),
    r: 1.2 + Math.random() * 2,
  }));
}
window.addEventListener("resize", resize);
resize();

function boom(x, y) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  for (let i = 0; i < 80; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 2 + Math.random() * 6;
    burst.push({ x: x * dpr, y: y * dpr, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, pink: Math.random() > 0.5 });
  }
}

function draw() {
  t += 0.016;
  ctx.clearRect(0, 0, W, H);
  for (const f of flies) {
    f.x += Math.sin(t * f.s + f.p) * 0.5;
    f.y += Math.cos(t * f.s * 0.8 + f.p) * 0.35;
    const pulse = 0.25 + Math.sin(t * 3 + f.p) * 0.25;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#ffd2e6";
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  const dpr = Math.min(devicePixelRatio || 1, 2);
  for (let i = trail.length - 1; i >= 0; i--) {
    const p = trail[i];
    p.life -= 0.03;
    p.y += 0.3;
    if (p.life <= 0) trail.splice(i, 1);
    else {
      ctx.globalAlpha = p.life * 0.7;
      ctx.fillStyle = p.gold ? "#f0d7a0" : "#f3b7d0";
      ctx.fillRect(p.x * dpr, p.y * dpr, 2.2 * dpr, 2.2 * dpr);
    }
  }
  ctx.globalAlpha = 1;
  for (let i = burst.length - 1; i >= 0; i--) {
    const b = burst[i];
    b.x += b.vx;
    b.y += b.vy;
    b.vy += 0.05;
    b.life -= 0.012;
    ctx.globalAlpha = Math.max(0, b.life);
    ctx.fillStyle = b.pink ? "#f3b7d0" : "#a9c6f7";
    ctx.fillRect(b.x, b.y, 3, 3);
    if (b.life <= 0) burst.splice(i, 1);
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(draw);
}
draw();

const PAGE_IDS = ["open", "love", "sky", "story", "color", "play", "letter", "ask"];
function pageOrder() {
  const saved = CONTENT && CONTENT.look && CONTENT.look.order;
  const next = Array.isArray(saved) ? saved.filter((id) => PAGE_IDS.includes(id)) : [];
  PAGE_IDS.forEach((id) => {
    if (!next.includes(id)) next.push(id);
  });
  return next;
}
function nextAfter(id) {
  const o = pageOrder();
  const i = Math.max(0, o.indexOf(id));
  return o[Math.min(o.length - 1, i + 1)];
}
function prevBefore(id) {
  const o = pageOrder();
  const i = o.indexOf(id);
  return i > 0 ? o[i - 1] : o[0];
}
function setSteps(id) {
  const o = pageOrder();
  const box = $("#steps");
  if (!box) return;
  if (box.children.length !== o.length) {
    box.innerHTML = "";
    o.forEach(() => box.appendChild(document.createElement("i")));
  }
  const idx = Math.max(0, o.indexOf(id));
  [...box.children].forEach((el, i) => {
    el.classList.toggle("on", i === idx);
    el.classList.toggle("done", i < idx);
  });
}

let sceneId = "open";
let sceneLock = false;

function splitMagic(el) {
  if (!el || el.classList.contains("letter-card") || el.classList.contains("seal") || el.querySelector("img")) return;
  if (el.dataset.magic === "1" && el.querySelector(".mg")) return;
  const pieces = [];
  const walk = (node, css) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        for (const ch of child.textContent || "") pieces.push({ ch, css });
      } else if (child.nodeName === "BR") pieces.push({ br: true });
      else if (child.nodeType === 1) walk(child, mergeCss(css, styleString(child)));
    });
  };
  if (el.childNodes.length) walk(el, "");
  else for (const ch of el.textContent || "") pieces.push({ ch, css: "" });
  el.textContent = "";
  let i = 0;
  let word = document.createElement("span");
  word.className = "mg-word";
  const flush = () => {
    if (!word.childNodes.length) return;
    el.appendChild(word);
    word = document.createElement("span");
    word.className = "mg-word";
  };
  for (const p of pieces) {
    if (p.br || p.ch === "\n") {
      flush();
      el.appendChild(document.createElement("br"));
      continue;
    }
    if (p.ch === " ") {
      flush();
      el.appendChild(document.createTextNode(" "));
      continue;
    }
    const s = document.createElement("span");
    s.className = "mg";
    if (p.css) s.style.cssText = p.css;
    s.style.setProperty("--i", String(Math.min(i, 18)));
    s.textContent = p.ch;
    word.appendChild(s);
    i += 1;
  }
  flush();
  el.dataset.magic = "1";
  const saved = blockFor(el.dataset.text);
  if (saved && saved.size) {
    el.style.setProperty("font-size", saved.size, "important");
    el.querySelectorAll(".mg").forEach((s) => s.style.setProperty("font-size", saved.size, "important"));
  }
}

function magicNodes(root) {
  if (!root) return [];
  if (root.matches?.(".for-you, .display, .soft, .tiny, .letter-card, .go, .nah, .hold")) return [root];
  return [...root.querySelectorAll(".for-you, .display, .soft, .tiny, .hold, .go, .nah, .chip, .window, .letter-card, .picked")];
}

function prepareMagic(el) {
  if (!el || el.classList.contains("letter-card")) return;
  if (el.dataset && el.dataset.ppt) return;
  if (el.classList.contains("window")) {
    el.classList.add("magic-block");
    return;
  }
  const len = (el.textContent || "").replace(/\s/g, "").length;
  if (len > 36 || el.classList.contains("letter")) {
    el.classList.add("magic-block");
    return;
  }
  splitMagic(el);
}

function magicIn(root) {
  const els = magicNodes(root);
  const card = els.find((el) => el.classList.contains("letter-card"));
  els.forEach((el) => {
    prepareMagic(el);
    el.classList.remove("magic-out", "ppt-in");
  });
  if (card) card.classList.add("magic-hold");
  root.classList?.remove("is-dusting");
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      els.forEach((el) => {
        if (el.dataset.ppt) el.classList.add("ppt-in");
        else el.classList.add("magic-in");
      });
      root.querySelectorAll("[data-ppt]").forEach((el) => el.classList.add("ppt-in"));
      if (card) card.classList.remove("magic-hold");
      const n = els.reduce((sum, el) => sum + (el.classList.contains("magic-block") ? 8 : el.querySelectorAll(".mg").length), 0);
      setTimeout(resolve, Math.min(1600, 720 + Math.min(n, 18) * 45));
    });
  });
}

function magicOut(root) {
  const els = magicNodes(root);
  els.forEach((el) => {
    prepareMagic(el);
    el.classList.remove("magic-in");
    void el.offsetWidth;
    el.classList.add("magic-out");
  });
  const n = els.reduce((sum, el) => sum + (el.classList.contains("magic-block") ? 8 : el.querySelectorAll(".mg").length), 0);
  const card = els.some((el) => el.classList.contains("letter-card"));
  return new Promise((resolve) => {
    setTimeout(resolve, card && !n ? 700 : Math.min(1300, 560 + Math.min(n, 18) * 36));
  });
}

function show(id, skipOut) {
  if (!id || id === sceneId || sceneLock) return;
  const cur = document.querySelector(".panel.is-on");
  const next = document.getElementById("scene-" + id);
  sceneLock = true;
  sceneId = id;
  (async () => {
    if (!skipOut && cur && cur !== next) {
      const leavingId = (cur.id || "").replace(/^scene-/, "");
      const exit = slideFor(leavingId).exit;
      cur.querySelectorAll("[data-ppt-out]").forEach((el) => {
        el.classList.remove("ppt-out");
        void el.offsetWidth;
        el.classList.add("ppt-out");
      });
      cur.classList.remove("ppt-enter");
      playSlideLeave(cur, exit);
      await new Promise((r) => setTimeout(r, 700));
      cur.classList.remove("is-leaving", "ppt-leave");
      delete cur.dataset.leave;
    }
    $$(".panel").forEach((p) => p.classList.remove("is-on", "is-dusting", "is-leaving", "ppt-enter", "ppt-leave"));
    if (next) {
      next.hidden = false;
      applyContent(CONTENT);
      paintAppLine();
      applyBlocks(next);
      if (id === "story") {
        const tale = next.querySelector(".tale");
        if (tale) {
          const body = (CONTENT.story && CONTENT.story.body) || tale.dataset.full || "";
          if (body) tale.dataset.full = body;
          tale.textContent = "";
          delete tale.dataset.magic;
        }
      }
      next.classList.add("is-on");
      const enter = slideFor(id).enter;
      if (enter) {
        next.dataset.enter = enter;
        void next.offsetWidth;
        next.classList.add("ppt-enter");
      } else delete next.dataset.enter;
      applySky(skyFor(id));
      paintSkyPicker();
      paintMotion();
      setSteps(id);
      await magicIn(next);
      applyBlocks(next);
      if (id === "story") typeStory();
    }
    const back = $("#pageBack");
    if (back) back.hidden = pageOrder().indexOf(id) <= 0;
    sceneLock = false;
  })();
}

function paintName(name) {
  const el = $("#intro-name");
  if (!el) return;
  el.innerHTML = "";
  [...(name || "Rinn")].forEach((ch, i) => {
    const s = document.createElement("span");
    s.textContent = ch === " " ? "\u00a0" : ch;
    s.style.animationDelay = 0.15 + i * 0.14 + "s";
    el.appendChild(s);
  });
}

function spawnBits() {}

const mail = $("#mail");
const envSeal = $("#envSeal");
function paintForDust(el) {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(r.width * dpr));
  c.height = Math.max(1, Math.ceil(r.height * dpr));
  c.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;pointer-events:none;z-index:35;`;
  const g = c.getContext("2d");
  const nodes = [el];
  el.querySelectorAll(".letter-card, .for-you, .hold, h1, h2, p, button, span, em, strong, b").forEach((n) => nodes.push(n));
  const seen = new Set();
  for (const node of nodes) {
    if (!node || seen.has(node)) continue;
    seen.add(node);
    if (node.classList?.contains("is-dusting")) continue;
    if (node.closest && node.closest(".letter-card") && !node.classList.contains("letter-card")) continue;
    const br = node.getBoundingClientRect();
    if (br.width < 2 || br.height < 2) continue;
    const x = br.left - r.left;
    const y = br.top - r.top;
    if (node.classList.contains("letter-card")) {
      g.strokeStyle = "#e7c2b2";
      g.lineWidth = 10;
      g.strokeRect(x + 8, y + 8, br.width - 16, br.height - 16);
      g.fillStyle = "#e7b7aa";
      g.beginPath();
      g.moveTo(x + 18, y + 14);
      g.lineTo(x + br.width - 18, y + 14);
      g.lineTo(x + br.width / 2, y + 72);
      g.closePath();
      g.fill();
      g.fillStyle = "#b03a48";
      g.beginPath();
      g.arc(x + br.width / 2, y + 58, 14, 0, Math.PI * 2);
      g.fill();
      continue;
    }
    const text = (node.innerText || "").trim();
    if (!text) continue;
    if (node.children.length > 3) continue;
    const cs = getComputedStyle(node);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const size = parseFloat(cs.fontSize) || 16;
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    g.fillStyle = "#c9899e";
    g.textBaseline = "top";
    text.split("\n").forEach((line, i) => g.fillText(line, x, y + i * size * 1.15));
  }
  return c;
}

function dustRun(el, inbound) {
  return new Promise((resolve) => {
    const c = paintForDust(el);
    if (!c) {
      resolve();
      return;
    }
    const g = c.getContext("2d");
    const snap = g.getImageData(0, 0, c.width, c.height);
    if (!inbound) el.classList.add("is-dusting");
    document.body.appendChild(c);
    g.clearRect(0, 0, c.width, c.height);
    const parts = [];
    const step = Math.max(4, Math.round(4 * Math.min(devicePixelRatio || 1, 2)));
    for (let y = 0; y < c.height && parts.length < 480; y += step) {
      for (let x = 0; x < c.width && parts.length < 480; x += step) {
        if (snap.data[(y * c.width + x) * 4 + 3] < 24) continue;
        if (Math.random() > 0.58) continue;
        const across = c.width ? x / c.width : 0;
        parts.push({
          hx: x,
          hy: y,
          x: inbound ? x + 18 + Math.random() * 70 : x,
          y: inbound ? y - Math.random() * 48 : y,
          vx: 0.15 + Math.random() * 0.85,
          vy: -0.08 - Math.random() * 0.7,
          life: 1,
          t: inbound ? -across * 0.35 : -across * 0.45,
          s: 0.7 + Math.random() * 1.15,
          gold: Math.random() > 0.5,
        });
      }
    }
    let frames = 0;
    const tick = () => {
      g.clearRect(0, 0, c.width, c.height);
      let alive = false;
      for (const p of parts) {
        const col = p.gold ? "rgba(246,228,174," : "rgba(244,182,200,";
        if (inbound) {
          p.t += 0.016;
          if (p.t < 0) {
            alive = true;
            continue;
          }
          const k = Math.min(1, p.t);
          const e = 1 - Math.pow(1 - k, 3);
          const px = p.x + (p.hx - p.x) * e;
          const py = p.y + (p.hy - p.y) * e;
          g.fillStyle = col + Math.min(0.9, k) + ")";
          g.beginPath();
          g.arc(px, py, p.s, 0, Math.PI * 2);
          g.fill();
          if (k < 1) alive = true;
        } else {
          p.t += 0.016;
          if (p.t < 0) {
            alive = true;
            g.fillStyle = col + "0.85)";
            g.beginPath();
            g.arc(p.hx, p.hy, p.s, 0, Math.PI * 2);
            g.fill();
            continue;
          }
          p.hx += p.vx;
          p.hy += p.vy;
          p.life -= 0.012;
          if (p.life <= 0) continue;
          alive = true;
          g.fillStyle = col + Math.max(0, p.life) + ")";
          g.beginPath();
          g.arc(p.hx, p.hy, p.s * (0.6 + p.life * 0.5), 0, Math.PI * 2);
          g.fill();
        }
      }
      g.globalAlpha = 1;
      frames += 1;
      if (alive && frames < 120) requestAnimationFrame(tick);
      else {
        c.remove();
        resolve();
      }
    };
    tick();
  });
}

function dustOut(el) {
  return dustRun(el, false);
}
function dustIn(el) {
  return dustRun(el, true);
}

async function openEnvelope() {
  if (sceneLock || !mail || mail.dataset.opened) return;
  mail.dataset.opened = "1";
  sceneLock = true;
  const hint = $("#holdHint");
  if (hint) hint.style.opacity = "0";
  const panel = $("#scene-open");
  if (panel) {
    playSlideLeave(panel, slideFor("open").exit);
    await new Promise((r) => setTimeout(r, 700));
    panel.classList.remove("is-leaving", "is-on");
  }
  sceneLock = false;
  show(nextAfter("open"), true);
}

function meadowCmd(cmd) {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "rinn-music-cmd", cmd }, "*");
  }
}
$("#mnPrev")?.addEventListener("click", (e) => {
  e.stopPropagation();
  meadowCmd("prev");
});
$("#mnNext")?.addEventListener("click", (e) => {
  e.stopPropagation();
  meadowCmd("next");
});
$("#mnPlay")?.addEventListener("click", (e) => {
  e.stopPropagation();
  meadowCmd("toggle");
});
function toggleMeadowPlayer(e) {
  const n = $("#meadowNotch");
  if (!n || !n.classList.contains("is-playing")) return;
  if (e && e.target.closest("button")) return;
  const open = n.classList.toggle("is-sheet");
  $("#mnDim")?.classList.toggle("on", open);
}
$("#meadowNotch")?.addEventListener("click", toggleMeadowPlayer);
$("#mnDim")?.addEventListener("click", () => {
  $("#meadowNotch")?.classList.remove("is-sheet");
  $("#mnDim")?.classList.remove("on");
});

window.addEventListener("message", (e) => {
  const d = e.data;
  if (!d || d.type !== "rinn-music") return;
  const n = $("#meadowNotch");
  if (!n) return;
  n.classList.toggle("is-playing", !!d.on);
  const img = $("#mnCover");
  const title = $("#mnTitle");
  if (img && d.cover) img.src = d.cover;
  if (title) title.textContent = d.title || "";
  const artist = $("#mnArtist");
  if (artist) artist.textContent = d.artist || "";
  const play = $("#mnPlay");
  if (play) play.textContent = d.on ? "❚❚" : "▶";
  if (!d.on) {
    n.classList.remove("is-sheet");
    $("#mnDim")?.classList.remove("on");
  }
});
if (window.parent && window.parent !== window) {
  window.parent.postMessage({ type: "rinn-music-ask" }, "*");
}
envSeal?.addEventListener("click", (e) => {
  e.preventDefault();
  openEnvelope();
});

$$("[data-to]").forEach((b) => b.addEventListener("click", () => {
  if (b.classList.contains("ghost")) show(prevBefore(sceneId));
  else show(nextAfter(sceneId));
}));
$("#pageBack")?.addEventListener("click", () => {
  const prev = prevBefore(sceneId);
  if (prev && prev !== sceneId) show(prev);
});

$$("[data-tint]").forEach((b) => {
  b.addEventListener("click", () => {
    state.tint = b.dataset.tint;
    document.body.dataset.tint = state.tint;
    show(nextAfter("color"));
  });
});

const well = $("#well");
const wellFill = $("#wellFill");
well.addEventListener("click", () => {
  state.fill = Math.min(5, state.fill + 1);
  wellFill.setAttribute("y", 29 - state.fill * 5.6);
  $("#wellHint").textContent = state.fill >= 5 ? "lit" : "again";
  boom(innerWidth / 2, well.getBoundingClientRect().top);
  if (state.fill >= 5) setTimeout(() => show(nextAfter("play")), 550);
});

let storyTimer = 0;
function typeStory() {
  const el = document.querySelector("#scene-story .tale");
  if (!el) return;
  clearTimeout(storyTimer);
  const body = (CONTENT.story && CONTENT.story.body) || el.getAttribute("data-full") || "";
  if (body) el.setAttribute("data-full", body);
  el.classList.remove("magic-block", "magic-in", "magic-out");
  const pieces = richPieces(body);
  el.innerHTML = "";
  let i = 0;
  const tick = () => {
    if (sceneId !== "story") return;
    i += 1;
    el.innerHTML = renderPieces(pieces.slice(0, i));
    applyBlocks(el.parentElement || document);
    if (i < pieces.length) storyTimer = setTimeout(tick, pieces[i - 1] && pieces[i - 1].br ? 48 : 26);
  };
  if (pieces.length) tick();
}

function typeLetter() {
  if (state.typed) return;
  state.typed = true;
  const pieces = richPieces(letterText());
  const el = $("#letter");
  if (!el) return;
  el.classList.remove("magic-block", "magic-in", "magic-out");
  el.innerHTML = "";
  let i = 0;
  const tick = () => {
    i++;
    el.innerHTML = renderPieces(pieces.slice(0, i));
    applyBlocks(el.parentElement || document);
    if (i < pieces.length) setTimeout(tick, pieces[i - 1] && pieces[i - 1].br ? 40 : 22);
    else {
      $$("[data-next-ask]").forEach((b) => b.classList.add("is-on"));
      const sc = $("#scene-letter");
      requestAnimationFrame(() => {
        $$("[data-next-ask]").pop()?.scrollIntoView({ behavior: "smooth", block: "end" });
        if (sc) sc.scrollTop = sc.scrollHeight;
      });
    }
  };
  tick();
}
const seal = $("#seal");
seal.addEventListener("click", () => {
  if (state.typed) return;
  seal.classList.remove("is-breaking");
  void seal.offsetWidth;
  seal.classList.add("is-breaking");
  setTimeout(typeLetter, 280);
});
$$("[data-next-ask]").forEach((b) => b.addEventListener("click", () => show(nextAfter("letter"))));

const noBtn = $("[data-no]");
const choices = $(".choices");
function evade() {
  state.noDodges++;
  const dx = (Math.random() > 0.5 ? 1 : -1) * (70 + Math.random() * 90);
  const dy = -20 - Math.random() * 50;
  const rot = (Math.random() - 0.5) * 16;
  noBtn.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
  const mercy = $(".mercy");
  if (mercy && state.noDodges === 3) mercy.hidden = false;
}
noBtn.addEventListener("mouseenter", evade);
noBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  evade();
});
noBtn.addEventListener("click", (e) => {
  e.preventDefault();
  evade();
});
$("[data-yes]")?.addEventListener("click", (e) => {
  e.preventDefault();
  boom(innerWidth / 2, innerHeight / 2);
  const next = nextAfter("ask");
  show(next && next !== "ask" ? next : "date");
});

$$("[data-kind]").forEach((c) =>
  c.addEventListener("click", () => {
    $$("[data-kind]").forEach((x) => x.classList.remove("is-on"));
    c.classList.add("is-on");
    state.dateKind = c.dataset.kind;
    maybe();
  })
);
$$("[data-when]").forEach((c) =>
  c.addEventListener("click", () => {
    $$("[data-when]").forEach((x) => x.classList.remove("is-on"));
    c.classList.add("is-on");
    state.when = c.dataset.when;
    maybe();
  })
);
const lockBtn = $("[data-lock]");
function maybe() {
  if (!lockBtn) return;
  lockBtn.disabled = !(state.dateKind && state.when);
  lockBtn.style.opacity = lockBtn.disabled ? 0.4 : 1;
}
maybe();
lockBtn?.addEventListener("click", () => {
  if (lockBtn.disabled) return;
  $(".picked").textContent = `${CONTENT.date.kindFull[state.dateKind]}. ${CONTENT.date.whenFull[state.when]}.`;
  $("#app-line").textContent = (CONTENT.yes.appLine || "").replace("{callApp}", CONTENT.callApp);
  boom(innerWidth / 2, innerHeight * 0.4);
  show("yes");
});

function clocks() {
  const d = new Date();
  const opts = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" };
  const el = $("#clockHere");
  if (el) el.textContent = d.toLocaleTimeString("en-GB", { ...opts, timeZone: "Europe/Berlin" });
  const there = $("#clockThere");
  if (there) there.textContent = d.toLocaleTimeString("en-GB", { ...opts, timeZone: "Asia/Singapore" });
}
clocks();
setInterval(clocks, 15000);

const SKIES = [
  { id: "meadow", label: "meadow", forest: "assets/melody-meadow.jpg", clouds: "assets/melody-clouds.jpg" },
  { id: "woods", label: "woods", forest: "assets/forest.jpg", clouds: "assets/melody-clouds.jpg" },
  { id: "dusk", label: "dusk", forest: "assets/sky.jpg", clouds: "assets/melody-clouds.jpg" },
  { id: "night", label: "night", forest: "assets/moon.jpg", clouds: "" },
  { id: "story", label: "storybook", forest: "assets/storybook.jpg", clouds: "assets/melody-clouds.jpg" },
  { id: "vines", label: "vines", forest: "assets/vines.jpg", clouds: "" },
  { id: "paper", label: "letter", forest: "assets/letter.jpg", clouds: "" },
  { id: "tickets", label: "tickets", forest: "assets/tickets.jpg", clouds: "" },
  { id: "call", label: "window", forest: "assets/call.jpg", clouds: "" },
  { id: "aurora", label: "aurora", forest: "", paint: "linear-gradient(180deg,#1b1433,#f4b6c8)" },
  { id: "rose", label: "rose", forest: "", paint: "linear-gradient(180deg,#ffd6e8,#c97a9a)" },
  { id: "ocean", label: "ocean", forest: "", paint: "linear-gradient(180deg,#d5e7f8,#3a5a8c)" },
  { id: "lilac", label: "lilac", forest: "", paint: "linear-gradient(180deg,#efe4ff,#8d74c4)" },
  { id: "gold", label: "gold", forest: "", paint: "linear-gradient(180deg,#fff1cf,#e0a15a)" },
  { id: "candle", label: "candle", forest: "", paint: "linear-gradient(180deg,#2a160f,#f2d2a2)" },
  { id: "blush", label: "blush", forest: "", paint: "linear-gradient(165deg,#fff7f2,#8fb4ea)" },
  { id: "midnight", label: "midnight", forest: "", paint: "radial-gradient(circle at 50% 20%,#243056,#070910)" },
  { id: "peach", label: "peach", forest: "", paint: "linear-gradient(180deg,#ffe0cc,#f0a07a)" },
  { id: "fairy", label: "fairy", forest: "", paint: "linear-gradient(180deg,#1b1433,#f4b6c8)" },
  { id: "rain", label: "rain", forest: "", paint: "linear-gradient(180deg,#8ea0b5,#2c3644)" },
];

function skyFor(pageId) {
  const pages = CONTENT.look && CONTENT.look.pages;
  const id = pageId || sceneId || "open";
  if (pages && pages[id]) return pages[id];
  return (CONTENT.look && CONTENT.look.sky) || "meadow";
}

function applySky(id) {
  const sky = SKIES.find((s) => s.id === id) || SKIES[0];
  document.body.dataset.sky = sky.id;
  const meadow = $(".world__meadow");
  const clouds = $(".world__clouds");
  if (meadow) {
    meadow.style.opacity = sky.forest ? "1" : "0";
    if (sky.forest) meadow.src = sky.forest;
  }
  if (clouds) {
    clouds.style.opacity = sky.clouds ? "" : "0";
    if (sky.clouds) clouds.src = sky.clouds;
  }
}

async function persistMeadow(data) {
  data.savedAt = Date.now();
  try {
    localStorage.setItem("forher.content.v4", JSON.stringify(data));
  } catch (_) {}
  const payload = JSON.stringify({ target: "meadow", data });
  try {
    const r = await fetch(location.origin + "/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    if (!r.ok) return false;
    const body = await r.json().catch(() => ({}));
    return body.ok !== false;
  } catch (_) {
    return false;
  }
}

const STUDIO_FIELDS = [
  ["open", "Opening line", "load.forYou", "area"],
  ["open", "Tap to open", "load.tap", "text"],
  ["love", "Line", "load.love", "area"],
  ["love", "Button", "load.loveNext", "text"],
  ["sky", "Label", "sky.kicker", "text"],
  ["sky", "Title", "sky.title", "area"],
  ["sky", "Here label", "sky.here", "text"],
  ["sky", "Under here", "sky.withYou", "text"],
  ["sky", "There label", "sky.there", "text"],
  ["sky", "Her clock line", "sky.thereTime", "text"],
  ["sky", "Line under clocks", "sky.lede", "area"],
  ["sky", "Button", "sky.next", "text"],
  ["story", "Label", "story.kicker", "text"],
  ["story", "Title", "story.title", "area"],
  ["story", "Under title", "story.lede", "area"],
  ["story", "Story", "story.body", "area"],
  ["story", "Button", "story.next", "text"],
  ["story", "Turn back", "story.back", "text"],
  ["color", "Label", "color.kicker", "text"],
  ["color", "Title", "color.title", "area"],
  ["color", "Line", "color.lede", "area"],
  ["color", "Pink hint", "color.pinkHint", "text"],
  ["color", "Pink label", "color.pinkLabel", "text"],
  ["color", "Blue hint", "color.blueHint", "text"],
  ["color", "Blue label", "color.blueLabel", "text"],
  ["play", "Label", "play.kicker", "text"],
  ["play", "Title", "play.title", "area"],
  ["play", "Line", "play.lede", "area"],
  ["play", "Heart", "play.tap", "text"],
  ["play", "Skip", "play.skip", "text"],
  ["letter", "Label", "letter.kicker", "text"],
  ["letter", "Before it opens", "letter.tap", "text"],
  ["letter", "Greeting", "greeting", "area"],
  ["letter", "The letter", "letter.body", "area"],
  ["letter", "One true thing", "oneTrueThing", "area"],
  ["letter", "Sign-off", "signOff", "text"],
  ["letter", "Continue", "letter.continue", "text"],
  ["ask", "Label", "ask.kicker", "text"],
  ["ask", "Title", "ask.title", "area"],
  ["ask", "Line", "ask.lede", "area"],
  ["ask", "Yes", "ask.yes", "text"],
  ["ask", "No", "ask.no", "text"],
  ["ask", "Mercy", "ask.mercy", "area"],
];

let studioPage = "open";

function movePage(id, dir) {
  const o = pageOrder();
  const i = o.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= o.length) return;
  const swap = o[i];
  o[i] = o[j];
  o[j] = swap;
  if (!CONTENT.look) CONTENT.look = {};
  CONTENT.look.order = o;
  paintOrder();
  setSteps(sceneId);
  queueSave();
}
function paintOrder() {
  const box = $("#pageOrder");
  if (!box) return;
  box.innerHTML = "";
  const title = document.createElement("span");
  title.className = "style-lab";
  title.textContent = "page order";
  box.appendChild(title);
  const note = document.createElement("p");
  note.className = "place-note";
  note.textContent = "up and down. save keeps this order.";
  box.appendChild(note);
  pageOrder().forEach((id, i, arr) => {
    const row = document.createElement("div");
    row.className = "order-row";
    const name = document.createElement("b");
    name.textContent = id;
    const up = document.createElement("button");
    up.type = "button";
    up.textContent = "up";
    up.disabled = i === 0;
    up.addEventListener("click", () => movePage(id, -1));
    const down = document.createElement("button");
    down.type = "button";
    down.textContent = "down";
    down.disabled = i === arr.length - 1;
    down.addEventListener("click", () => movePage(id, 1));
    row.append(name, up, down);
    box.appendChild(row);
  });
}
function fillStudio() {
  const pages = [...new Set(STUDIO_FIELDS.map((f) => f[0]))];
  const nav = $("#studioPages");
  nav.innerHTML = "";
  pages.forEach((id) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = id;
    b.className = id === studioPage ? "on" : "";
    b.addEventListener("click", () => {
      studioPage = id;
      nav.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      $$("#studioFields .studio-block").forEach((row) => {
        row.hidden = row.dataset.page !== studioPage;
      });
      paintSkyPicker();
    });
    nav.appendChild(b);
  });
  const host = $("#studioFields");
  host.innerHTML = "";
  STUDIO_FIELDS.forEach(([page, label, key, type]) => {
    const wrap = document.createElement("div");
    wrap.className = "studio-block";
    wrap.dataset.page = page;
    wrap.hidden = page !== studioPage;
    const lab = document.createElement("label");
    lab.textContent = label;
    const el = document.createElement("div");
    el.className = "studio-edit";
    el.contentEditable = "true";
    el.spellcheck = true;
    el.dataset.field = key;
    el.dataset.kind = type;
    const v = getPath(CONTENT, key);
    el.innerHTML = renderRichHtml(v == null ? "" : String(v));
    el.addEventListener("input", queueSave);
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      document.execCommand("insertLineBreak");
    });
    el.addEventListener("paste", (e) => {
      e.preventDefault();
      const t = (e.clipboardData || window.clipboardData).getData("text/plain");
      document.execCommand("insertText", false, t);
    });
    wrap.append(lab, el);
    host.appendChild(wrap);
  });
  paintSkyPicker();
  paintOrder();
}

function paintSkyPicker() {
  const picker = $("#skyPicker");
  if (!picker) return;
  const page = sceneId || "open";
  const cur = skyFor(page);
  const label = $("#skyLabel");
  if (label) label.textContent = "wallpaper · " + page;
  picker.innerHTML = "";
  SKIES.forEach((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = s.id === cur ? "on" : "";
    if (s.paint) b.style.background = s.paint;
    else if (s.forest) b.style.backgroundImage = `url("${s.forest}")`;
    const cap = document.createElement("span");
    cap.textContent = s.label;
    b.appendChild(cap);
    b.addEventListener("click", () => {
      const target = sceneId || "open";
      if (!CONTENT.look) CONTENT.look = {};
      if (!CONTENT.look.pages) CONTENT.look.pages = {};
      CONTENT.look.pages[target] = s.id;
      applySky(s.id);
      paintSkyPicker();
      queueSave();
    });
    picker.appendChild(b);
  });
}

function readStudioIntoContent() {
  $$("#studioFields [data-field]").forEach((el) => {
    const raw = el.classList.contains("studio-edit") ? serializeRichNode(el) : el.value;
    setPath(CONTENT, el.dataset.field, raw === "<br>" ? "" : raw);
  });
  const blocks = CONTENT.look && CONTENT.look.blocks;
  if (blocks) {
    Object.keys(blocks).forEach((path) => {
      const size = blocks[path] && blocks[path].size;
      if (!size) return;
      const cur = getPath(CONTENT, path);
      if (cur == null) return;
      setPath(CONTENT, path, bakeFontSize(String(cur), size));
    });
  }
  if (CONTENT.signOff == null && getPath(CONTENT, "signOff") == null) CONTENT.signOff = "me";
}

function liveStudio() {
  readStudioIntoContent();
  clearTimeout(storyTimer);
  const tale = document.querySelector("#scene-story .tale");
  if (tale && CONTENT.story) tale.dataset.full = CONTENT.story.body || "";
  applyContent(CONTENT);
  applyBlocks(document);
  if (sceneId === "letter" && state.typed) {
    const letter = $("#letter");
    if (letter) letter.innerHTML = renderRichHtml(letterText());
  }
  paintName(CONTENT.herName);
  paintAppLine();
  applySky(skyFor(sceneId));
  restoreMarkTarget();
}

let saveTimer = 0;
function queueSave() {
  liveStudio();
  clearTimeout(saveTimer);
  $("#studioMsg").textContent = "saving…";
  saveTimer = setTimeout(async () => {
    const ok = await persistMeadow(CONTENT);
    $("#studioMsg").textContent = ok ? "saved." : "couldn't write file — check the server.";
  }, 450);
}

async function saveMeadowNow() {
  readStudioIntoContent();
  if (!CONTENT.look) CONTENT.look = {};
  delete CONTENT.savedScene;
  clearTimeout(storyTimer);
  const tale = document.querySelector("#scene-story .tale");
  if (tale && CONTENT.story && CONTENT.story.body) tale.dataset.full = CONTENT.story.body;
  applyContent(CONTENT);
  paintAppLine();
  applyBlocks(document);
  applySky(skyFor(sceneId));
  const ok = await persistMeadow(CONTENT);
  const msg = $("#studioMsg");
  if (msg) msg.textContent = ok ? "saved. meadow still starts on the first page." : "saved in this browser. server didn't write the file.";
}

function paintAppLine() {
  const el = $("#app-line");
  if (!el) return;
  const raw = (CONTENT.yes && CONTENT.yes.appLine) || "";
  el.innerHTML = renderRichHtml(String(raw).replaceAll("{callApp}", CONTENT.callApp || ""));
}
function editPathFor(host) {
  if (!host) return "";
  if (host.id === "letter" && state.typed) return "letter.body";
  return host.dataset.text || "";
}
function openStudio() {
  studioPage = sceneId === "kind" ? "no" : (sceneId || "open");
  fillStudio();
  $("#studio").hidden = false;
  document.body.classList.add("studio-open");
}

function closeStudio() {
  $("#studio").hidden = true;
  document.body.classList.remove("studio-open");
}

let marked = null;
let markTarget = "";

function editFromNode(node) {
  const el = node && (node.nodeType === 1 ? node : node.parentElement);
  return el && el.closest ? el.closest(".studio-edit") : null;
}

function markCss() {
  if (!marked || !marked.range) return {};
  let node = marked.range.startContainer;
  if (!node) return {};
  if (node.nodeType === 3) node = node.parentElement;
  const edit = editFromNode(node);
  const map = {};
  while (node && node !== edit) {
    styleString(node).split(";").forEach((part) => {
      const i = part.indexOf(":");
      if (i < 1) return;
      const k = part.slice(0, i).trim();
      if (k && map[k] == null) map[k] = part.slice(i + 1).trim();
    });
    node = node.parentElement;
  }
  return map;
}

function paintMark() {
  const read = $("#markRead");
  if (!read) return;
  const words = ((marked && marked.text) || "").replace(/\s+/g, " ").trim();
  if (!words) read.textContent = "mark the words. only that part changes.";
  else {
    const short = words.length > 42 ? words.slice(0, 42) + "…" : words;
    read.innerHTML = "marked · <b></b>";
    read.querySelector("b").textContent = short;
  }
  $$("#studioFields .studio-edit").forEach((el) => {
    el.classList.toggle("is-marked", !!(marked && el.dataset.field === marked.path));
  });
  const css = marked ? markCss() : {};
  $$("#styleTool [data-write]").forEach((b) => {
    const kind = b.dataset.write;
    const on =
      (kind === "bold" && /^(700|bold)$/.test(css["font-weight"] || "")) ||
      (kind === "italic" && css["font-style"] === "italic") ||
      (kind === "underline" && (css["text-decoration"] || "").includes("underline")) ||
      (kind === "caps" && css["text-transform"] === "uppercase");
    b.classList.toggle("on", !!on);
  });
  const light = $$("#styleTool [data-write='light']")[0];
  if (light) light.classList.toggle("on", /^(300|lighter)$/.test(css["font-weight"] || ""));
  const shadow = $$("#styleTool [data-write='shadow']")[0];
  if (shadow) shadow.classList.toggle("on", !!(css["text-shadow"] && css["text-shadow"] !== "none"));
  const savedAlign = markTarget && blockFor(markTarget);
  $$("#styleTool [data-align]").forEach((b) => {
    b.classList.toggle("on", !!(savedAlign && savedAlign.align === b.dataset.align));
  });
  const num = $("#sizeNum");
  if (num && document.activeElement !== num) {
    const saved = markTarget && blockFor(markTarget);
    const fromText = ((saved && saved.size) || css["font-size"] || "").replace("px", "");
    if (fromText) num.value = parseFloat(fromText);
  }
  paintMotion();
}

function rememberMark() {
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  const edit = editFromNode(range.commonAncestorContainer);
  if (!edit || !edit.closest("#studioFields")) return;
  marked = { range: range.cloneRange(), text: sel.toString(), path: edit.dataset.field };
  markTarget = edit.dataset.field;
  paintMark();
}

function restoreMarkTarget() {
  $$(".is-style-target").forEach((n) => n.classList.remove("is-style-target"));
  if (!markTarget) return;
  const host = document.querySelector('[data-text="' + markTarget + '"]');
  if (host) host.classList.add("is-style-target");
}

function showStudioPage(id) {
  studioPage = id;
  $$("#studioPages button").forEach((x) => x.classList.toggle("on", x.textContent === id));
  $$("#studioFields .studio-block").forEach((row) => {
    row.hidden = row.dataset.page !== id;
  });
}

function selectInEdit(edit, phrase, whole) {
  const walker = document.createTreeWalker(edit, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let full = "";
  while (walker.nextNode()) {
    nodes.push({ node: walker.currentNode, start: full.length });
    full += walker.currentNode.textContent || "";
  }
  if (!nodes.length) return;
  let startAt = 0;
  let endAt = full.length;
  if (!whole && phrase) {
    let idx = full.indexOf(phrase);
    let len = phrase.length;
    if (idx < 0) {
      const parts = phrase.trim().split(/\s+/).filter(Boolean).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      const m = parts.length ? new RegExp(parts.join("\\s+")).exec(full) : null;
      if (m) {
        idx = m.index;
        len = m[0].length;
      }
    }
    if (idx >= 0) {
      startAt = idx;
      endAt = idx + len;
    }
  }
  const pos = (at) => {
    for (const n of nodes) {
      const len = n.node.textContent.length;
      if (at <= n.start + len) return { node: n.node, offset: Math.max(0, at - n.start) };
    }
    const last = nodes[nodes.length - 1];
    return { node: last.node, offset: last.node.textContent.length };
  };
  const a = pos(startAt);
  const b = pos(endAt);
  const range = document.createRange();
  range.setStart(a.node, a.offset);
  range.setEnd(b.node, b.offset);
  edit.focus();
  const sel = document.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  marked = { range: range.cloneRange(), text: range.toString(), path: edit.dataset.field };
  markTarget = edit.dataset.field;
  edit.scrollIntoView({ block: "nearest" });
  paintMark();
}

function focusFieldMark(path, phrase, whole) {
  const studio = $("#studio");
  if (studio && studio.hidden) openStudio();
  const meta = STUDIO_FIELDS.find((f) => f[2] === path);
  if (meta) showStudioPage(meta[0]);
  const edit = document.querySelector('#studioFields [data-field="' + path + '"]');
  if (!edit) return;
  selectInEdit(edit, phrase, whole);
  edit.scrollIntoView({ block: "center" });
}

function stampDeep(node, patch) {
  [...node.childNodes].forEach((child) => {
    if (child.nodeType === 3) {
      if (!child.textContent) return;
      const parent = child.parentNode;
      if (parent && parent.nodeType === 1 && parent.tagName === "SPAN" && parent !== node) {
        Object.entries(patch).forEach(([k, v]) => parent.style.setProperty(k, v));
        return;
      }
      const span = document.createElement("span");
      Object.entries(patch).forEach(([k, v]) => span.style.setProperty(k, v));
      child.parentNode.insertBefore(span, child);
      span.appendChild(child);
    } else if (child.nodeType === 1 && child.nodeName !== "BR") {
      if (child.tagName === "SPAN") Object.entries(patch).forEach(([k, v]) => child.style.setProperty(k, v));
      stampDeep(child, patch);
    }
  });
}

function applyPatch(patch) {
  if (!marked || !marked.range || marked.range.collapsed) {
    const read = $("#markRead");
    if (read) read.textContent = "mark the words first";
    return;
  }
  const range = marked.range;
  const edit = editFromNode(range.startContainer);
  if (!edit) return;
  const contents = range.extractContents();
  stampDeep(contents, patch);
  const first = contents.firstChild;
  const last = contents.lastChild;
  range.insertNode(contents);
  if (first && last) {
    const next = document.createRange();
    next.setStartBefore(first);
    next.setEndAfter(last);
    marked = { range: next.cloneRange(), text: next.toString(), path: edit.dataset.field };
    const sel = document.getSelection();
    sel.removeAllRanges();
    sel.addRange(next);
  }
  paintMark();
  edit.dispatchEvent(new Event("input", { bubbles: true }));
}

function clearMarkStyle() {
  if (!marked || !marked.range || marked.range.collapsed) {
    const read = $("#markRead");
    if (read) read.textContent = "mark the words first";
    return;
  }
  const range = marked.range;
  const edit = editFromNode(range.startContainer);
  if (!edit) return;
  const contents = range.extractContents();
  const frag = document.createDocumentFragment();
  const dump = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) frag.appendChild(document.createTextNode(child.textContent || ""));
      else if (child.nodeName === "BR") frag.appendChild(document.createElement("br"));
      else if (child.nodeType === 1) dump(child);
    });
  };
  dump(contents);
  const first = frag.firstChild;
  const last = frag.lastChild;
  range.insertNode(frag);
  if (first && last) {
    const next = document.createRange();
    next.setStartBefore(first);
    next.setEndAfter(last);
    marked = { range: next.cloneRange(), text: next.toString(), path: edit.dataset.field };
  }
  paintMark();
  edit.dispatchEvent(new Event("input", { bubbles: true }));
}

function ensureLook() {
  if (!CONTENT.look) CONTENT.look = {};
  if (!CONTENT.look.blocks) CONTENT.look.blocks = {};
  if (!CONTENT.look.slides) CONTENT.look.slides = {};
  return CONTENT.look;
}
function blockFor(path) {
  const blocks = CONTENT.look && CONTENT.look.blocks;
  return path && blocks ? blocks[path] : null;
}
function editBlock(path) {
  const look = ensureLook();
  if (!look.blocks[path]) look.blocks[path] = { x: 0, y: 0, size: "", align: "", enter: "", exit: "" };
  return look.blocks[path];
}
function slideFor(id) {
  const slides = CONTENT.look && CONTENT.look.slides;
  return (slides && slides[id]) || { enter: "", exit: "" };
}
function editSlide(id) {
  const look = ensureLook();
  if (!look.slides[id]) look.slides[id] = { enter: "", exit: "" };
  return look.slides[id];
}
function applyBlocks(root) {
  (root || document).querySelectorAll("[data-text]").forEach((el) => {
    const b = blockFor(el.dataset.text);
    if (!b) return;
    const x = b.x || 0;
    const y = b.y || 0;
    if (x || y) el.style.setProperty("translate", x + "px " + y + "px");
    else el.style.removeProperty("translate");
    if (b.size) {
      el.style.setProperty("font-size", b.size, "important");
      el.querySelectorAll("span, .mg").forEach((s) => s.style.setProperty("font-size", b.size, "important"));
    } else el.style.removeProperty("font-size");
    if (b.align) {
      el.style.setProperty("text-align", b.align, "important");
      el.style.setProperty("width", "100%", "important");
      el.style.setProperty("max-width", "100%", "important");
    }
    if (b.enter) el.dataset.ppt = b.enter;
    else delete el.dataset.ppt;
    if (b.exit) el.dataset.pptOut = b.exit;
    else delete el.dataset.pptOut;
  });
}
function lineEl(path) {
  return path ? document.querySelector('[data-text="' + path + '"]') : null;
}
function commitLineAlign(path, align) {
  if (!path || !align) return;
  editBlock(path).align = align;
  applyBlocks(document);
  paintMark();
  queueSave();
}
function commitLineSize(path, px) {
  if (!path || !px) return;
  const b = editBlock(path);
  b.size = px;
  const cur = getPath(CONTENT, path);
  if (cur != null) setPath(CONTENT, path, bakeFontSize(String(cur), px));
  const baked = getPath(CONTENT, path) || "";
  const edit = document.querySelector('#studioFields [data-field="' + path + '"]');
  if (edit) edit.innerHTML = renderRichHtml(baked);
  const el = lineEl(path);
  if (el) {
    delete el.dataset.magic;
    el.innerHTML = renderRichHtml(baked);
    el.style.setProperty("font-size", px, "important");
    el.querySelectorAll("span, .mg").forEach((s) => s.style.setProperty("font-size", px, "important"));
  }
  const num = $("#sizeNum");
  if (num) num.value = parseFloat(px);
  queueSave();
}
function resizeLine(dir) {
  if (!markTarget) {
    const read = $("#markRead");
    if (read) read.textContent = "mark a line first";
    return;
  }
  const el = lineEl(markTarget);
  if (!el) return;
  const b = blockFor(markTarget);
  const cur = parseFloat(b && b.size) || parseFloat(getComputedStyle(el).fontSize) || 28;
  const next = Math.max(12, Math.min(160, Math.round(cur + dir * 2)));
  if (b) b.y = (b.y || 0) + (dir > 0 ? -next : next);
  else editBlock(markTarget).y = dir > 0 ? -next : next;
  commitLineSize(markTarget, next + "px");
}
function nudgeLine(dir) {
  if (!markTarget) {
    const read = $("#markRead");
    if (read) read.textContent = "mark a line first";
    return;
  }
  const el = lineEl(markTarget);
  if (!el) return;
  const b = editBlock(markTarget);
  const row = parseFloat(b.size) || parseFloat(getComputedStyle(el).fontSize) || 28;
  b.y = (b.y || 0) + dir * row;
  applyBlocks(document);
  queueSave();
}
function showGuides(hotX, hotY) {
  const g = $("#midGuides");
  const main = document.querySelector("main");
  if (!g || !main) return;
  const r = main.getBoundingClientRect();
  g.hidden = false;
  g.style.left = r.left + "px";
  g.style.top = r.top + "px";
  g.style.width = r.width + "px";
  g.style.height = r.height + "px";
  g.classList.toggle("hot-x", !!hotX);
  g.classList.toggle("hot-y", !!hotY);
}
function hideGuides() {
  const g = $("#midGuides");
  if (!g) return;
  g.hidden = true;
  g.classList.remove("hot-x", "hot-y");
}
function paintMotion() {
  const b = (markTarget && blockFor(markTarget)) || {};
  const s = slideFor(sceneId || "open");
  const set = (id, val) => {
    const el = $("#" + id);
    if (el && el.value !== (val || "")) el.value = val || "";
  };
  set("textEnter", b.enter);
  set("textExit", b.exit);
  set("slideEnter", s.enter);
  set("slideExit", s.exit);
}
function replayText(path) {
  const el = lineEl(path);
  if (!el || !el.dataset.ppt) return;
  el.classList.remove("ppt-in");
  void el.offsetWidth;
  el.classList.add("ppt-in");
}
function replaySlide() {
  const panel = document.getElementById("scene-" + (sceneId || "open"));
  if (!panel || !panel.dataset.enter) return;
  panel.classList.remove("ppt-enter");
  void panel.offsetWidth;
  panel.classList.add("ppt-enter");
}
let leavePreview = 0;
function playSlideLeave(panel, exit) {
  if (!panel) return;
  panel.classList.remove("ppt-leave", "is-leaving");
  panel.style.animation = "none";
  void panel.offsetWidth;
  panel.style.animation = "";
  if (exit) {
    panel.dataset.leave = exit;
    panel.classList.add("is-leaving", "ppt-leave");
  } else panel.classList.add("is-leaving");
}
function replayLeave() {
  const panel = document.getElementById("scene-" + (sceneId || "open"));
  const exit = $("#slideExit")?.value || "";
  if (!panel) return;
  clearTimeout(leavePreview);
  if (!exit) {
    panel.classList.remove("ppt-leave", "is-leaving");
    delete panel.dataset.leave;
    return;
  }
  playSlideLeave(panel, exit);
  leavePreview = setTimeout(() => {
    panel.classList.remove("ppt-leave", "is-leaving");
    delete panel.dataset.leave;
  }, 780);
}

let placeDrag = null;
let movedPlace = false;

function bindStyleTool() {
  const tool = $("#styleTool");
  if (!tool) return;
  tool.addEventListener("pointerdown", (e) => {
    if (e.target.closest("select, input")) return;
    e.preventDefault();
  });
  const writes = {
    bold: ["font-weight", "700", "400"],
    italic: ["font-style", "italic", "normal"],
    underline: ["text-decoration", "underline", "none"],
    caps: ["text-transform", "uppercase", "none"],
  };
  $$("#styleTool [data-write]").forEach((b) => {
    b.addEventListener("click", () => {
      if (b.dataset.write === "light") {
        const on = /^(300|lighter)$/.test(markCss()["font-weight"] || "");
        applyPatch({ "font-weight": on ? "400" : "300" });
        return;
      }
      if (b.dataset.write === "shadow") {
        const on = markCss()["text-shadow"] && markCss()["text-shadow"] !== "none";
        applyPatch({ "text-shadow": on ? "none" : "0 2px 12px rgba(42,28,36,.45)" });
        return;
      }
      const spec = writes[b.dataset.write];
      if (!spec) return;
      const css = markCss();
      const on = b.dataset.write === "underline"
        ? (css["text-decoration"] || "").includes("underline")
        : css[spec[0]] === spec[1] || (spec[0] === "font-weight" && /^(700|bold)$/.test(css[spec[0]] || ""));
      applyPatch({ [spec[0]]: on ? spec[2] : spec[1] });
    });
  });
  $("#fontPick")?.addEventListener("change", () => {
    const v = $("#fontPick").value;
    if (!v) return;
    applyPatch({ "font-family": v });
    $("#fontPick").value = "";
  });
  $("#sizePick")?.addEventListener("change", () => {
    const v = $("#sizePick").value;
    if (!v) return;
    if (!markTarget) {
      const read = $("#markRead");
      if (read) read.textContent = "mark a line first";
      $("#sizePick").value = "";
      return;
    }
    commitLineSize(markTarget, v);
    $("#sizePick").value = "";
  });
  $$("#styleTool [data-align]").forEach((b) => {
    b.addEventListener("click", () => {
      if (!markTarget) {
        const read = $("#markRead");
        if (read) read.textContent = "mark a line first";
        return;
      }
      commitLineAlign(markTarget, b.dataset.align);
    });
  });
  $("#sizeNum")?.addEventListener("change", () => {
    const n = Math.round(Number($("#sizeNum").value));
    if (!markTarget || !n) return;
    commitLineSize(markTarget, Math.max(12, Math.min(160, n)) + "px");
  });
  const inks = ["#3a2a32", "#7a6570", "#b03a48", "#e07a9a", "#ffffff", "#1c3f6e", "#c9843a", "#1b1433"];
  const marks = ["none", "#ffe08a", "#f4b6c8", "#c9e4ff", "#e7d6ff", "#d8f3df"];
  const addSwatch = (host, color, prop) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.title = color === "none" ? "no highlight" : color;
    b.style.background = color === "none"
      ? "linear-gradient(135deg,#fff 45%,#b03a48 46%,#b03a48 54%,#fff 55%)"
      : color;
    b.addEventListener("click", () => applyPatch({ [prop]: color === "none" ? "transparent" : color }));
    host.appendChild(b);
  };
  inks.forEach((c) => addSwatch($("#inkSwatches"), c, "color"));
  marks.forEach((c) => addSwatch($("#hiSwatches"), c, "background-color"));
  $("#inkPick")?.addEventListener("change", () => applyPatch({ color: $("#inkPick").value }));
  $("#styleClear")?.addEventListener("click", clearMarkStyle);
  $("#sizeUp")?.addEventListener("click", () => resizeLine(1));
  $("#sizeDown")?.addEventListener("click", () => resizeLine(-1));
  $("#rowUp")?.addEventListener("click", () => nudgeLine(-1));
  $("#rowDown")?.addEventListener("click", () => nudgeLine(1));
  $("#placeReset")?.addEventListener("click", () => {
    if (!markTarget || !CONTENT.look || !CONTENT.look.blocks) return;
    delete CONTENT.look.blocks[markTarget];
    const el = lineEl(markTarget);
    if (el) {
      el.style.translate = "";
      el.style.fontSize = "";
      delete el.dataset.ppt;
      delete el.dataset.pptOut;
    }
    paintMotion();
    queueSave();
  });
  $("#textEnter")?.addEventListener("change", () => {
    if (!markTarget) return;
    editBlock(markTarget).enter = $("#textEnter").value;
    applyBlocks(document);
    replayText(markTarget);
    queueSave();
  });
  $("#textExit")?.addEventListener("change", () => {
    if (!markTarget) return;
    editBlock(markTarget).exit = $("#textExit").value;
    applyBlocks(document);
    const el = lineEl(markTarget);
    if (el && el.dataset.pptOut) {
      el.classList.remove("ppt-out");
      void el.offsetWidth;
      el.classList.add("ppt-out");
      setTimeout(() => el.classList.remove("ppt-out"), 620);
    }
    queueSave();
  });
  $("#slideEnter")?.addEventListener("change", () => {
    const id = sceneId || "open";
    editSlide(id).enter = $("#slideEnter").value;
    const panel = document.getElementById("scene-" + id);
    if (panel) {
      if ($("#slideEnter").value) panel.dataset.enter = $("#slideEnter").value;
      else delete panel.dataset.enter;
    }
    replaySlide();
    queueSave();
  });
  $("#slideExit")?.addEventListener("change", () => {
    editSlide(sceneId || "open").exit = $("#slideExit").value;
    replayLeave();
    queueSave();
  });
  document.addEventListener("pointerdown", (e) => {
    const studio = $("#studio");
    if (!studio || studio.hidden) return;
    if (e.target.closest("#studio, #studioTab, .meadow-notch, .page-back, button, a, input, textarea")) return;
    const host = e.target.closest("[data-text]");
    if (!host || host.dataset.text !== markTarget) return;
    const b = blockFor(host.dataset.text) || { x: 0, y: 0 };
    placeDrag = { host, path: host.dataset.text, sx: e.clientX, sy: e.clientY, ox: b.x || 0, oy: b.y || 0, pid: e.pointerId };
  });
  document.addEventListener("pointermove", (e) => {
    if (!placeDrag || e.pointerId !== placeDrag.pid) return;
    const dx = e.clientX - placeDrag.sx;
    const dy = e.clientY - placeDrag.sy;
    if (!movedPlace && Math.hypot(dx, dy) < 6) return;
    movedPlace = true;
    placeDrag.host.classList.add("is-placing");
    const block = editBlock(placeDrag.path);
    block.x = placeDrag.ox + dx;
    block.y = placeDrag.oy + dy;
    applyBlocks(document);
    const main = document.querySelector("main");
    if (!main) return;
    const area = main.getBoundingClientRect();
    const box = placeDrag.host.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const mx = area.left + area.width / 2;
    const my = area.top + area.height / 2;
    let hotX = false;
    let hotY = false;
    if (Math.abs(cx - mx) < 18) {
      block.x += mx - cx;
      hotX = true;
    }
    if (Math.abs(cy - my) < 18) {
      block.y += my - cy;
      hotY = true;
    }
    if (hotX || hotY) applyBlocks(document);
    showGuides(hotX, hotY);
  });
  document.addEventListener("pointerup", (e) => {
    if (!placeDrag || e.pointerId !== placeDrag.pid) return;
    placeDrag.host.classList.remove("is-placing");
    placeDrag = null;
  });
  document.addEventListener("selectionchange", rememberMark);
  let eatClick = false;
  document.addEventListener("pointerup", (e) => {
    const studio = $("#studio");
    if (!studio || studio.hidden) return;
    if (movedPlace) {
      movedPlace = false;
      eatClick = true;
      hideGuides();
      queueSave();
      return;
    }
    if (e.target.closest("#studio, #studioTab, .meadow-notch, .page-back")) return;
    const sel = document.getSelection();
    const dragged = sel && !sel.isCollapsed ? String(sel.toString()).replace(/\s+/g, " ").trim() : "";
    const from = dragged && sel.anchorNode ? sel.anchorNode : e.target;
    const base = from && (from.nodeType === 1 ? from : from.parentElement);
    const host = base && base.closest ? base.closest("[data-text]") : null;
    if (!host || host.closest("#studio")) return;
    eatClick = true;
    $$(".is-style-target").forEach((n) => n.classList.remove("is-style-target"));
    host.classList.add("is-style-target");
    focusFieldMark(editPathFor(host), dragged, !dragged);
  });
  document.addEventListener("click", (e) => {
    if (!eatClick) return;
    eatClick = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);
}

function bindStudio() {
  const studio = $("#studio");
  if (!studio) return;
  bindStyleTool();
  $("#studioTab")?.addEventListener("click", openStudio);
  if (location.hash === "#studio" || /[?&]studio=1/.test(location.search)) openStudio();
  $("#studioClose")?.addEventListener("click", closeStudio);
  $("#studioSave")?.addEventListener("click", saveMeadowNow);
}

loadContent().then((c) => {
  CONTENT = c;
  applyContent(CONTENT);
  applySky(skyFor("open"));
  paintName(CONTENT.herName);
  paintAppLine();
  setSteps("open");
  document.title = CONTENT.title || "for Rinn";
  bindStudio();
  applyBlocks(document);
  const open = $("#scene-open");
  const openEnter = slideFor("open").enter;
  if (open && openEnter) {
    open.dataset.enter = openEnter;
    open.classList.add("ppt-enter");
  }
  magicIn(open).then(() => applyBlocks(document));
});
