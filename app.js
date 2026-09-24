const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const phone = $("#phone");

const PHONE_FIELDS = [
  ["herName", "Background name"],
  ["devicePass", "Lock password"],
  ["adminPass", "Admin password"],
  ["lockHint", "Lock hint"],
  ["lockBanner", "Unlock banner"],
  ["lockTime", "Lock screen time (blank = live)"],
  ["lockDate", "Lock screen date (blank = live)"],
  ["herLockTime", "Lock her time (blank = live +6h)"],
  ["statusTime", "Status bar time (blank = live)"],
  ["herTimeLabel", "Widget: her time label"],
  ["herTimeSub", "Widget: her time subtitle"],
  ["myTimeLabel", "Widget: my time label"],
  ["myTimeSub", "Widget: my time subtitle"],
  ["missLabel", "Widget: miss you label"],
  ["missValue", "Widget: miss you %"],
  ["dateLabel", "Widget: next call label"],
  ["dateValue", "Widget: next call day"],
  ["dateSub", "Widget: next call note"],
  ["safariUrl", "Safari address"],
  ["meadowTitle", "Safari favourite title"],
  ["meadowSub", "Safari favourite subtitle"],
  ["meadowHint", "Safari hint"],
  ["portalBack", "Back-to-phone button"],
  ["waName", "WhatsApp name"],
  ["waChat", "WhatsApp chat (me: / them:)", true],
  ["mailLetter", "Mail letter", true],
  ["noteList", "Notes: shopping", true],
  ["notePass", "Notes: wifi", true],
  ["noteDusk", "Notes: later", true],
  ["mapsCap", "Maps caption"],
  ["musicTitle", "Song title"],
  ["musicArtist", "Song artist"],
  ["duskStory", "Dusk line"],
  ["bootLines", "Boot lines (one per line)", true],
];

let phoneContent = {};
let meadowContent = {};
let chatLines = [];
let chatStep = 0;
let placing = null;

function renderStickers() {
  const box = $("#deskStickers");
  if (!box) return;
  box.innerHTML = "";
  (phoneContent.stickers || []).forEach((s) => {
    const img = document.createElement("img");
    img.src = s.src;
    img.style.left = s.x + "px";
    img.style.top = s.y + "px";
    img.style.width = (s.s || 72) + "px";
    img.style.transform = `rotate(${s.r || 0}deg)`;
    box.appendChild(img);
  });
}

const HIS_TZ = "Europe/Berlin";
const HER_TZ = "Asia/Singapore";

function fmtZone(timeZone, date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(date);
}
function ymdZone(timeZone, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const n = (type) => Number(parts.find((p) => p.type === type).value);
  return { y: n("year"), m: n("month"), d: n("day") };
}
function tick() {
  const n = new Date();
  const herClock = fmtZone(HER_TZ, n);
  const hisClock = fmtZone(HIS_TZ, n);
  $("#t").textContent = herClock.replace(/\s/g, "");
  $("#lt").textContent = herClock;
  $("#ld").textContent =
    phoneContent.lockDate ||
    n.toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric", timeZone: HER_TZ });
  ["herT", "herT2", "herT3", "setHer"].forEach((id) => {
    const el = $("#" + id);
    if (el) el.textContent = herClock;
  });
  if ($("#setYou")) $("#setYou").textContent = hisClock;
  if ($("#myTime")) $("#myTime").textContent = hisClock;
  const { y, m, d } = ymdZone(HER_TZ, n);
  const bday = daysUntilBirthday(y, m, d);
  if ($("#bdayDate")) $("#bdayDate").textContent = "21 December";
  if ($("#bdayLeft")) {
    $("#bdayLeft").textContent =
      bday === 0 ? "that's today" : bday === 1 ? "tomorrow" : bday + " days left";
  }
}

function daysUntilBirthday(y, m, d) {
  const today = Date.UTC(y, m - 1, d);
  let next = Date.UTC(y, 11, 21);
  if (today > next) next = Date.UTC(y + 1, 11, 21);
  return Math.round((next - today) / 86400000);
}

const DEFAULT_WIDGETS = ["herTime", "myTime", "miss", "bday"];
let homeEdit = false;
let widgetDrag = null;

function widgetEls() {
  return $$("#wgrid .iwid");
}

function currentWidgetOrder() {
  return widgetEls().map((el) => el.dataset.wid);
}

function applyWidgetOrder(order) {
  const grid = $("#wgrid");
  if (!grid) return;
  const list = Array.isArray(order) && order.length ? order : DEFAULT_WIDGETS;
  const map = Object.fromEntries(widgetEls().map((el) => [el.dataset.wid, el]));
  list.forEach((id) => {
    if (map[id]) grid.appendChild(map[id]);
  });
  widgetEls().forEach((el) => {
    if (!list.includes(el.dataset.wid)) grid.appendChild(el);
  });
}

function flipWidgets(run) {
  const first = new Map(widgetEls().map((el) => [el, el.getBoundingClientRect()]));
  run();
  widgetEls().forEach((el) => {
    if (widgetDrag && el === widgetDrag.el) return;
    const a = first.get(el);
    const b = el.getBoundingClientRect();
    if (!a) return;
    const dx = a.left - b.left;
    const dy = a.top - b.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    el.style.transition = "none";
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    void el.offsetWidth;
    el.style.transition = "transform 0.48s cubic-bezier(0.32, 0.72, 0, 1)";
    el.style.transform = "";
    const clear = () => {
      el.style.transition = "";
      el.style.transform = "";
      el.removeEventListener("transitionend", clear);
    };
    el.addEventListener("transitionend", clear);
  });
}

function saveWidgetOrder() {
  phoneContent.widgetOrder = currentWidgetOrder();
  try {
    localStorage.setItem("rinn.phone.content", JSON.stringify(phoneContent));
  } catch (_) {}
}

function setHomeEdit(on) {
  homeEdit = !!on;
  $("#home")?.querySelector(".ios-home")?.classList.toggle("is-edit", homeEdit);
  if (!homeEdit && widgetDrag) endWidgetDrag(true);
}

function startWidgetDrag(el, e) {
  const r = el.getBoundingClientRect();
  const clone = el.cloneNode(true);
  clone.classList.add("iwid-float");
  clone.style.position = "fixed";
  clone.style.left = r.left + "px";
  clone.style.top = r.top + "px";
  clone.style.width = r.width + "px";
  clone.style.height = r.height + "px";
  clone.style.zIndex = "80";
  document.body.appendChild(clone);
  el.classList.add("iwid-slot");
  widgetDrag = {
    el,
    clone,
    grabX: e.clientX - r.left,
    grabY: e.clientY - r.top,
  };
}

function moveWidgetDrag(e) {
  if (!widgetDrag) return;
  const { clone, grabX, grabY, el } = widgetDrag;
  clone.style.left = e.clientX - grabX + "px";
  clone.style.top = e.clientY - grabY + "px";
  const over = document.elementFromPoint(e.clientX, e.clientY)?.closest("#wgrid .iwid");
  if (!over || over === el) return;
  const order = currentWidgetOrder();
  const from = order.indexOf(el.dataset.wid);
  const to = order.indexOf(over.dataset.wid);
  if (from < 0 || to < 0 || from === to) return;
  order.splice(to, 0, order.splice(from, 1)[0]);
  flipWidgets(() => applyWidgetOrder(order));
}

function endWidgetDrag(instant) {
  if (!widgetDrag) return;
  const { el, clone } = widgetDrag;
  const dest = el.getBoundingClientRect();
  const finish = () => {
    clone.remove();
    el.classList.remove("iwid-slot");
    widgetDrag = null;
    saveWidgetOrder();
  };
  if (instant) {
    finish();
    return;
  }
  clone.style.transition = "left 0.42s cubic-bezier(0.32, 0.72, 0, 1), top 0.42s cubic-bezier(0.32, 0.72, 0, 1), transform 0.42s cubic-bezier(0.32, 0.72, 0, 1)";
  clone.style.left = dest.left + "px";
  clone.style.top = dest.top + "px";
  clone.style.transform = "scale(1)";
  setTimeout(finish, 430);
}

function bindWidgets() {
  const grid = $("#wgrid");
  if (!grid) return;
  let pressTimer = 0;
  let startX = 0;
  let startY = 0;
  let target = null;
  const clearPress = () => {
    clearTimeout(pressTimer);
    pressTimer = 0;
    target = null;
  };
  grid.addEventListener("pointerdown", (e) => {
    const card = e.target.closest(".iwid");
    if (!card) return;
    e.stopPropagation();
    startX = e.clientX;
    startY = e.clientY;
    target = card;
    if (homeEdit) {
      startWidgetDrag(card, e);
      return;
    }
    pressTimer = setTimeout(() => {
      setHomeEdit(true);
      startWidgetDrag(card, e);
    }, 480);
  });
  window.addEventListener("pointermove", (e) => {
    if (widgetDrag) {
      moveWidgetDrag(e);
      return;
    }
    if (!pressTimer) return;
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > 10) clearPress();
  });
  const up = () => {
    if (widgetDrag) endWidgetDrag(false);
    clearPress();
  };
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  $("#home")?.addEventListener("click", (e) => {
    if (!homeEdit) return;
    if (e.target.closest(".iwid, .app")) return;
    setHomeEdit(false);
  });
}
bindWidgets();
tick();
setInterval(tick, 10000);

function setText(id, value) {
  const el = $("#" + id);
  if (el && value != null) el.textContent = value;
}

function renderSig(name) {
  const el = $("#sigName");
  if (!el) return;
  const entered = document.body.classList.contains("sig-in");
  el.replaceChildren();
  [...String(name || "Rinn")].forEach((ch, i) => {
    const s = document.createElement("span");
    s.textContent = ch === " " ? "\u00a0" : ch;
    s.style.setProperty("--i", String(i));
    if (entered) s.classList.add("is-on");
    el.appendChild(s);
  });
}

function parseChat(raw) {
  return String(raw || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^([^:]+)\s*:\s*(.*)$/);
      if (!m) return { who: "them", t: line };
      const who = m[1].trim().toLowerCase() === "me" ? "me" : "them";
      return { who, t: m[2] };
    });
}

const FONTS_UI = ["Outfit", "Inter", "Nunito", "Playfair Display", "Cinzel"];
const FONTS_SCRIPT = ["Great Vibes", "Allura", "Dancing Script", "Playfair Display"];

const WALLPAPERS = [
  { id: "dusk", label: "Dusk", src: "assets/wallpaper.jpg" },
  { id: "meadow", label: "Meadow", src: "assets/melody-meadow.jpg" },
  { id: "dune", label: "Dune", src: "assets/dune.jpg" },
  { id: "voh", label: "Voh", src: "assets/voh.jpg" },
  { id: "heart", label: "Heart", src: "assets/voh-heart.jpg" },
  { id: "window", label: "Window", src: "assets/pola-window.jpg" },
  { id: "letter", label: "Letter", src: "assets/parchment.jpg" },
  { id: "aurora", label: "Aurora", css: "wp-aurora" },
  { id: "fairy", label: "Fairy", css: "wp-fairy" },
  { id: "night", label: "Night", css: "wp-night" },
  { id: "rose", label: "Rose", css: "wp-rose" },
  { id: "ocean", label: "Ocean", css: "wp-ocean" },
];

function applyLook(c) {
  const ui = c.uiFont || "Outfit";
  const script = c.scriptFont || "Great Vibes";
  document.documentElement.style.setProperty("--ui-font", `"${ui}", system-ui, sans-serif`);
  document.documentElement.style.setProperty("--script-font", `"${script}", cursive`);
  document.documentElement.style.setProperty("--sig-x", (c.sigX || 0) + "px");
  document.documentElement.style.setProperty("--sig-y", (c.sigY || 0) + "px");
  document.documentElement.style.setProperty("--sig-size", (c.sigSize || 160) + "px");
  const sig = $("#sigName");
  if (sig) sig.className = "sig sig-light frame-" + (c.nameFrame || "none");
  if (phone) {
    phone.classList.remove("mat-titanium", "mat-gloss", "mat-ceramic");
    phone.classList.add("mat-" + (c.material || "titanium"));
  }
  const mood = c.deskMood || "dusk";
  document.body.classList.remove("desk-dusk", "desk-morning", "desk-night", "desk-meadow", "desk-rain");
  document.body.classList.add("desk-" + mood);
  applyWallpaper(c.wallpaper);
  renderStickers();
  applyWidgetOrder(c.widgetOrder);
}

function applyWallpaper(id) {
  const wp = WALLPAPERS.find((w) => w.id === id) || WALLPAPERS[0];
  const el = $(".screen-wp");
  const lock = $("#lockWp");
  if (!el) return;
  el.className = "screen-wp" + (wp.css ? " " + wp.css : "");
  if (wp.src) {
    el.style.backgroundImage = `url("${wp.src}")`;
    if (lock) {
      lock.hidden = false;
      lock.src = wp.src;
    }
  } else {
    el.style.backgroundImage = "none";
    if (lock) lock.hidden = true;
  }
}

function buildMotes() {
  const box = $("#studioMotes");
  if (!box || box.childElementCount) return;
  for (let i = 0; i < 20; i++) {
    const s = document.createElement("i");
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.animationDelay = (Math.random() * 14).toFixed(2) + "s";
    s.style.animationDuration = (9 + Math.random() * 11).toFixed(2) + "s";
    s.style.setProperty("--drift", (Math.random() * 40 - 20).toFixed(1) + "px");
    box.appendChild(s);
  }
}

const SONGS = [
  { title: "Die With A Smile", artist: "Lady Gaga, Bruno Mars", cover: "assets/cover-die-with-a-smile.jpg", yt: "kPa7bsKwL-c", dur: 252 },
  { title: "Just the Way You Are", artist: "Bruno Mars", cover: "assets/cover-just-the-way-you-are.jpg", yt: "LjhCEhWiKXk", dur: 221 },
  { title: "Perfect", artist: "Ed Sheeran", cover: "assets/cover-perfect.jpg", yt: "2Vv-BfVoq4g", dur: 263 },
  { title: "Until I Found You", artist: "Stephen Sanchez", cover: "assets/cover-until-i-found-you.jpg", yt: "GxldQCyNqEs", dur: 178 },
  { title: "Lover", artist: "Taylor Swift", cover: "assets/cover-lover.jpg", yt: "asuyKPPGvQk", dur: 221 },
  { title: "Die For You", artist: "The Weeknd", cover: "assets/cover-die-for-you.jpg", yt: "uPD0QOGTmMI", dur: 260 },
  { title: "All of Me", artist: "John Legend", cover: "assets/cover-all-of-me.jpg", yt: "450p7goxZqg", dur: 269 },
  { title: "Thinking Out Loud", artist: "Ed Sheeran", cover: "assets/cover-thinking-out-loud.jpg", yt: "lp-EO5I60Cs", dur: 281 },
  { title: "A Thousand Years", artist: "Christina Perri", cover: "assets/cover-thousand-years.jpg", yt: "rtOvBOTyX00", dur: 285 },
  { title: "Photograph", artist: "Ed Sheeran", cover: "assets/cover-photograph.jpg", yt: "nSDgHBxUbVQ", dur: 259 },
  { title: "Yellow", artist: "Coldplay", cover: "assets/cover-yellow.jpg", yt: "yKNxeF4KMsY", dur: 269 },
  { title: "Can't Help Falling in Love", artist: "Elvis Presley", cover: "assets/cover-falling-in-love.jpg", yt: "vGJTaP6anOU", dur: 180 },
];
let trackIndex = 0;

function setCovers(src) {
  $$(".song-cover").forEach((img) => {
    if (img.classList.contains("cover-over")) return;
    if (img.dataset.cur === src) return;
    img.dataset.cur = src;
    const stack = img.parentElement;
    if (!stack || !(stack.classList.contains("mini-art") || stack.classList.contains("spot-bg"))) {
      img.src = src;
      return;
    }
    const cs = getComputedStyle(stack);
    if (cs.position === "static") stack.style.position = "relative";
    let over = stack.querySelector(":scope > .cover-over");
    if (!over) {
      over = img.cloneNode(false);
      over.classList.add("cover-over");
      over.removeAttribute("id");
      over.alt = "";
      stack.appendChild(over);
    }
    over.src = src;
    over.style.opacity = "0";
    requestAnimationFrame(() => {
      over.style.opacity = "1";
    });
    setTimeout(() => {
      img.src = src;
      over.style.opacity = "0";
    }, 560);
  });
}

let seekSec = 0;
function fmtTime(s) {
  s = Math.max(0, Math.floor(s || 0));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
function ytCmd(func, args = []) {
  try {
    $("#yt").contentWindow.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  } catch (_) {}
}
function syncSeekUI() {
  const d = SONGS[trackIndex].dur || 240;
  const v = Math.round((seekSec / d) * 1000);
  const el = $("#appSeek");
  if (el && document.activeElement !== el) el.value = String(v);
  setText("appTime", fmtTime(seekSec));
}
function seekFromSlider(el) {
  const d = SONGS[trackIndex].dur || 240;
  seekSec = (Number(el.value) / 1000) * d;
  ytCmd("seekTo", [seekSec, true]);
  syncSeekUI();
}
function applyNowPlayingTint(src, on) {
  document.body.classList.toggle("np-on", !!on);
  if (!src) return;
  const img = new Image();
  img.onload = () => {
    try {
      const c = document.createElement("canvas");
      c.width = 12;
      c.height = 12;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, 12, 12);
      const d = ctx.getImageData(0, 0, 12, 12).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) {
        const s = d[i] + d[i + 1] + d[i + 2];
        if (s < 55 || s > 700) continue;
        r += d[i];
        g += d[i + 1];
        b += d[i + 2];
        n++;
      }
      if (!n) return;
      r = Math.round(r / n);
      g = Math.round(g / n);
      b = Math.round(b / n);
      const peak = Math.max(r, g, b, 1);
      const lift = Math.min(200 / peak, 1.65);
      r = Math.min(255, Math.round(r * lift));
      g = Math.min(255, Math.round(g * lift));
      b = Math.min(255, Math.round(b * lift));
      const root = document.documentElement.style;
      root.setProperty("--np-glow", `rgb(${r}, ${g}, ${b})`);
      root.setProperty("--np-r", String(r));
      root.setProperty("--np-g", String(g));
      root.setProperty("--np-b", String(b));
    } catch (_) {}
  };
  img.src = src;
}

function applyTrack() {
  const s = SONGS[trackIndex];
  seekSec = 0;
  setText("islandTitle", s.title);
  setText("islandArtist", s.artist);
  setText("miniTitle", s.title);
  setText("miniArtist", s.artist);
  setText("ccTitle", s.title);
  setText("musicTitle", s.title);
  setText("musicArtist", s.artist);
  setCovers(s.cover);
  $$(".lib-row").forEach((row, i) => row.classList.toggle("on", i === trackIndex));
  syncSeekUI();
  applyNowPlayingTint(s.cover, musicOn);
  if (musicOn) {
    $("#yt").src = `https://www.youtube.com/embed/${s.yt}?autoplay=1&enablejsapi=1&playsinline=1&rel=0`;
  }
  syncMeadowMusic();
}

function skipTrack(dir) {
  trackIndex = (trackIndex + dir + SONGS.length) % SONGS.length;
  applyTrack();
  if (musicOn) pulseIsland();
  document.body.classList.remove("np-skip");
  void document.body.offsetWidth;
  document.body.classList.add("np-skip");
  clearTimeout(skipTrack._t);
  skipTrack._t = setTimeout(() => document.body.classList.remove("np-skip"), 900);
}

const VOH = { lat: -20.93763, lon: 164.65849 };
let vohGlobe = null;

function latLonToVec3(lat, lon, r) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function stopVohGlobe() {
  if (!vohGlobe) return;
  vohGlobe.running = false;
  if (vohGlobe.raf) cancelAnimationFrame(vohGlobe.raf);
  if (vohGlobe.tl) vohGlobe.tl.kill();
}

function sizeVohGlobe() {
  if (!vohGlobe) return;
  const map = $("#vohMap");
  const w = map.clientWidth || 300;
  const h = map.clientHeight || 280;
  vohGlobe.renderer.setSize(w, h, false);
  vohGlobe.camera.aspect = w / Math.max(h, 1);
  vohGlobe.camera.updateProjectionMatrix();
}

function initVohGlobe() {
  const THREE = window.THREE;
  const canvas = $("#vohGlobe");
  const map = $("#vohMap");
  if (!THREE || !canvas || !map) return null;
  if (vohGlobe) return vohGlobe;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000005, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 40);
  camera.position.set(0, 0.35, 5.2);
  camera.lookAt(0, 0, 0);

  const starsGeo = new THREE.BufferGeometry();
  const starCount = 1600;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 12 + Math.random() * 16;
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);
  }
  starsGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(
    starsGeo,
    new THREE.PointsMaterial({ color: 0xccddff, size: 0.035, sizeAttenuation: true })
  );
  scene.add(stars);

  const earthGroup = new THREE.Group();
  scene.add(earthGroup);

  const earthMat = new THREE.MeshPhongMaterial({
    color: 0x2244aa,
    emissive: 0x031018,
    shininess: 8,
    specular: 0x335577,
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), earthMat);
  earthGroup.add(earth);

  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(1.045, 48, 48),
    new THREE.MeshBasicMaterial({
      color: 0x7ec8ff,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
    })
  );
  earthGroup.add(atmo);

  const patchPos = latLonToVec3(VOH.lat, VOH.lon, 1.004);
  const patch = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.2),
    new THREE.MeshBasicMaterial({ color: 0x445544, transparent: true, opacity: 0 })
  );
  patch.position.copy(patchPos);
  patch.lookAt(0, 0, 0);
  patch.rotateY(Math.PI);
  patch.rotateZ((42 * Math.PI) / 180);
  earthGroup.add(patch);

  scene.add(new THREE.AmbientLight(0x6688aa, 0.55));
  const sun = new THREE.DirectionalLight(0xfff2dd, 1.35);
  sun.position.set(4, 1.2, 3);
  scene.add(sun);

  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  loader.load(
    "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
    (tex) => {
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      earth.material.map = tex;
      earth.material.color.set(0xffffff);
      earth.material.needsUpdate = true;
    },
    undefined,
    () => {}
  );
  loader.load("assets/voh-heart.jpg", (tex) => {
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    patch.material.map = tex;
    patch.material.color.set(0xffffff);
    patch.material.opacity = 1;
    patch.material.needsUpdate = true;
  });

  const look = { x: 0, y: 0, z: 0 };
  vohGlobe = { renderer, scene, camera, earth, earthGroup, stars, patch, look, running: false, raf: 0, tl: null };
  sizeVohGlobe();

  const tick = () => {
    if (!vohGlobe || !vohGlobe.running) return;
    vohGlobe.stars.rotation.y += 0.00015;
    vohGlobe.camera.lookAt(vohGlobe.look.x, vohGlobe.look.y, vohGlobe.look.z);
    vohGlobe.renderer.render(vohGlobe.scene, vohGlobe.camera);
    vohGlobe.raf = requestAnimationFrame(tick);
  };
  vohGlobe.tick = tick;
  return vohGlobe;
}

function resetVohZoom() {
  const map = $("#vohMap");
  if (!map) return;
  map.classList.remove("is-falling", "is-heart", "is-settled");
  stopVohGlobe();
  clearTimeout(resetVohZoom._t);
  clearTimeout(resetVohZoom._t2);
}

function playVohZoom() {
  const map = $("#vohMap");
  const gsap = window.gsap;
  const THREE = window.THREE;
  if (!map) return;
  map.classList.remove("is-falling", "is-heart", "is-settled");
  const g = initVohGlobe();
  if (!g || !THREE) {
    map.classList.add("is-heart", "is-settled");
    return;
  }
  sizeVohGlobe();
  stopVohGlobe();
  g.running = true;
  g.look.x = 0;
  g.look.y = 0;
  g.look.z = 0;
  g.camera.position.set(0, 0.38, 5.6);
  g.earthGroup.quaternion.identity();
  g.earthGroup.rotation.set(0.18, 0.55, 0.04);
  g.tick();

  const target = latLonToVec3(VOH.lat, VOH.lon, 1).normalize();
  const endQ = new THREE.Quaternion().setFromUnitVectors(target, new THREE.Vector3(0, 0, 1));
  const startQ = g.earthGroup.quaternion.clone();
  const spin = { t: 0 };

  if (g.tl) g.tl.kill();
  if (!gsap) {
    g.earthGroup.quaternion.copy(endQ);
    g.camera.position.set(0, 0, 1.12);
    g.look.z = 1;
    map.classList.add("is-heart", "is-settled");
    return;
  }
  g.tl = gsap.timeline({
    onComplete: () => {
      resetVohZoom._t = setTimeout(() => map.classList.add("is-heart"), 900);
      resetVohZoom._t2 = setTimeout(() => map.classList.add("is-settled"), 1600);
    },
  });
  g.tl
    .to(g.camera.position, { z: 3.6, y: 0.2, duration: 2.4, ease: "sine.inOut" }, 0)
    .to(
      spin,
      {
        t: 1,
        duration: 3.2,
        ease: "power2.inOut",
        onUpdate: () => g.earthGroup.quaternion.slerpQuaternions(startQ, endQ, spin.t),
      },
      0.8
    )
    .to(g.camera.position, { z: 1.55, y: 0.04, x: 0, duration: 2.8, ease: "power2.inOut" }, 3.6)
    .to(g.look, { z: 1.0, duration: 2.2, ease: "sine.inOut" }, 4.8)
    .to(g.camera.position, { z: 1.11, y: 0, duration: 2.6, ease: "power3.inOut" }, 5.8);
}

function startFirefly() {
  const f = $("#firefly");
  const gsap = window.gsap;
  if (!f) return;
  const loop = () => {
    if (!document.body.classList.contains("desk-meadow") || document.body.classList.contains("lights-out")) {
      f.style.opacity = "0";
      startFirefly._t = setTimeout(loop, 4000);
      return;
    }
    const pr = phone?.getBoundingClientRect();
    if (!pr) {
      startFirefly._t = setTimeout(loop, 4000);
      return;
    }
    const x0 = Math.random() * window.innerWidth * 0.4;
    const y0 = pr.top + Math.random() * 80 - 40;
    const x1 = pr.left + pr.width * (0.18 + Math.random() * 0.2);
    const y1 = pr.top + pr.height * (0.12 + Math.random() * 0.1);
    const x2 = window.innerWidth * (0.7 + Math.random() * 0.25);
    const y2 = pr.top - 40 - Math.random() * 80;
    f.style.opacity = "0";
    if (gsap) {
      gsap.killTweensOf(f);
      gsap.set(f, { x: x0, y: y0, opacity: 0, scale: 0.6 });
      gsap.timeline({
        onComplete: () => {
          startFirefly._t = setTimeout(loop, 2800 + Math.random() * 4000);
        },
      })
        .to(f, { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" })
        .to(f, { x: x1, y: y1, duration: 2.8, ease: "sine.inOut" })
        .to(f, { x: x1 + 6, y: y1 - 4, duration: 1.8, ease: "sine.inOut" })
        .to(f, { x: x2, y: y2, opacity: 0, scale: 0.5, duration: 2.4, ease: "sine.in" });
    } else {
      startFirefly._t = setTimeout(loop, 8000);
    }
  };
  clearTimeout(startFirefly._t);
  loop();
}

function renderLib() {
  const lib = $("#lib");
  if (!lib) return;
  lib.innerHTML = "";
  SONGS.forEach((s, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lib-row" + (i === trackIndex ? " on" : "");
    b.innerHTML = `<img src="${s.cover}" alt="" /><span><b>${s.title}</b><small>${s.artist}</small></span>`;
    b.addEventListener("click", () => {
      trackIndex = i;
      applyTrack();
      setMusic(true);
    });
    lib.appendChild(b);
  });
}

function applyPhone(c) {
  phoneContent = c;
  applyLook(c);
  renderSig(c.herName);
  setText("lockHint", c.lockHint);
  setText("herTimeLabel", c.herTimeLabel);
  setText("herTimeSub", c.herTimeSub);
  setText("myTimeLabel", c.myTimeLabel);
  setText("myTimeSub", c.myTimeSub);
  setText("missLabel", c.missLabel);
  setText("missValue", c.missValue);
  setText("dateLabel", c.dateLabel);
  setText("dateValue", c.dateValue);
  setText("dateSub", c.dateSub);
  applyTrack();
  const fill = $("#missFill");
  if (fill) fill.style.width = String(c.missValue || "94%").includes("%") ? c.missValue : `${c.missValue}%`;
  setText("sfUrl", c.safariUrl);
  setText("meadowTitle", c.meadowTitle);
  setText("meadowSub", c.meadowSub);
  setText("meadowHint", c.meadowHint);
  setText("closePortal", c.portalBack);
  setText("waName", c.waName);
  setText("mapsCap", c.mapsCap);
  setText("duskStory", c.duskStory);
  const letter = $("#mailLetter");
  if (letter) letter.innerHTML = String(c.mailLetter || "").replace(/\n/g, "<br>");
  chatLines = parseChat(c.waChat);
  chatStep = 0;
  const thread = $("#thread");
  if (thread) {
    thread.innerHTML = "";
    thread.appendChild(
      Object.assign(document.createElement("div"), { className: "bubble tap them", textContent: "tap the chat." })
    );
  }
  tick();
}

let currentApp = null;
let lastIcon = null;

function iconOrigin(btn) {
  const pr = phone.getBoundingClientRect();
  const icon = (btn && btn.querySelector && btn.querySelector(".i")) || btn;
  const ir = icon.getBoundingClientRect();
  return {
    ox: ir.left + ir.width / 2 - pr.left + "px",
    oy: ir.top + ir.height / 2 - pr.top + "px",
  };
}

function closeApp() {
  const el = currentApp && document.getElementById(currentApp);
  phone.classList.remove("app-open");
  if (el) {
    if (lastIcon) {
      const o = iconOrigin(lastIcon);
      el.style.setProperty("--ox", o.ox);
      el.style.setProperty("--oy", o.oy);
    }
    el.classList.remove("is-on");
  }
  currentApp = null;
  document.body.classList.remove("music-app");
  phone.classList.remove("in-music");
  resetVohZoom();
}

function openApp(id, fromBtn) {
  if (!id || id === "home") {
    closeApp();
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;
  if (currentApp && currentApp !== id) {
    document.getElementById(currentApp)?.classList.remove("is-on");
  }
  if (fromBtn) {
    const o = iconOrigin(fromBtn);
    el.style.setProperty("--ox", o.ox);
    el.style.setProperty("--oy", o.oy);
    lastIcon = fromBtn;
  }
  currentApp = id;
  document.body.classList.toggle("music-app", id === "music");
  phone.classList.toggle("in-music", id === "music");
  phone.classList.add("app-open");
  el.classList.add("is-on");
  if (id === "photos") $$(".pola").forEach((p, i) => setTimeout(() => p.classList.add("dev"), 200 + i * 400));
  if (id === "maps") playVohZoom();
}

function show(id, fromBtn) {
  if (id === "home") {
    closeApp();
    $("#lock").classList.remove("is-on");
    $("#home").classList.add("is-on");
    return;
  }
  if (id === "lock") {
    closeApp();
    $$(".scr").forEach((s) => s.classList.remove("is-on"));
    $("#lock").classList.add("is-on");
    return;
  }
  openApp(id, fromBtn);
}

let faceBusy = false;
function runFaceId(ok, done) {
  const n = $("#notch");
  if (!n) {
    if (done) done();
    return;
  }
  faceBusy = true;
  n.classList.remove("is-unlock", "is-fail");
  n.classList.add("is-scanning");
  setTimeout(() => {
    n.classList.remove("is-scanning");
    if (ok) {
      n.classList.add("is-unlock");
      setTimeout(() => {
        n.classList.remove("is-unlock");
        faceBusy = false;
        if (done) done();
      }, 420);
    } else {
      n.classList.add("is-fail");
      setTimeout(() => {
        n.classList.remove("is-fail");
        faceBusy = false;
      }, 480);
    }
  }, ok ? 720 : 420);
}

let bannerTimer;
function showBanner(text) {
  const el = $("#banner");
  if (!el) return;
  el.textContent = text;
  el.classList.remove("show");
  void el.offsetWidth;
  pulseIsland();
  requestAnimationFrame(() => el.classList.add("show"));
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(hideBanner, 4300);
}
function hideBanner() {
  const el = $("#banner");
  if (!el) return;
  el.classList.remove("show");
}

$("#pw")?.addEventListener("input", () => {
  if (faceBusy) return;
  if ($("#pw").value.length) $("#notch")?.classList.add("is-scanning");
  else $("#notch")?.classList.remove("is-scanning");
});
$("#pw")?.addEventListener("blur", () => {
  if (!faceBusy) $("#notch")?.classList.remove("is-scanning");
});

$("#unlock").addEventListener("submit", (e) => {
  e.preventDefault();
  if (faceBusy) return;
  const pass = (phoneContent.devicePass || "stink").toLowerCase();
  const ok = $("#pw").value.trim().toLowerCase() === pass;
  if (ok) {
    $("#err").hidden = true;
    runFaceId(true, () => {
      show("home");
      setTimeout(() => setMusic(true), 520);
      setTimeout(() => {
        showBanner(phoneContent.lockBanner || "stink · hey. open messages.");
      }, 980);
    });
  } else {
    $("#err").hidden = false;
    $("#pw").value = "";
    runFaceId(false);
  }
});

const closedApps = new Set(["mail", "notes", "msg"]);
$$("[data-app]").forEach((b) =>
  b.addEventListener("click", (e) => {
    if (homeEdit) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (closedApps.has(b.dataset.app)) {
      e.preventDefault();
      e.stopPropagation();
      showBanner("make sure to open safari first.");
      return;
    }
    if (navigator.vibrate) navigator.vibrate(12);
    show(b.dataset.app, b);
  })
);
$$(".back").forEach((b) => {
  if (b.dataset.close != null) return;
  b.addEventListener("click", () => show("home"));
});
$("#homeBtn").addEventListener("click", () => {
  if (homeEdit) {
    setHomeEdit(false);
    return;
  }
  setMini(false);
  show("home");
});

const cc = $("#cc");
let pulling = false;
phone.addEventListener("pointerdown", (e) => {
  if (e.target.closest("#notch, #island, #mini, #cc")) return;
  const r = phone.getBoundingClientRect();
  const y = e.clientY - r.top;
  const x = e.clientX - r.left;
  if (y < 42 && x > r.width * 0.52) pulling = true;
});
window.addEventListener("pointerup", () => (pulling = false));
phone.addEventListener("pointermove", (e) => {
  if (!pulling) return;
  const y = e.clientY - phone.getBoundingClientRect().top;
  if (y > 64) cc.classList.add("open");
  if (y < 36) cc.classList.remove("open");
});
cc?.addEventListener("click", (e) => {
  if (e.target === cc) cc.classList.remove("open");
});
$("#flash").onclick = () => {
  $("#flash").classList.toggle("on");
  phone.classList.toggle("flash");
};
$("#bright")?.addEventListener("input", (e) => {
  phone.style.filter = `brightness(${Number(e.target.value) / 100})`;
});
["ccWifi", "ccBt", "ccFocus"].forEach((id) => {
  $("#" + id)?.addEventListener("click", () => $("#" + id).classList.toggle("on"));
});
$("#ccNow")?.addEventListener("click", () => {
  cc.classList.remove("open");
  if (musicOn) setMini(true);
});

let musicOn = false;
function pulseIsland() {
  const n = $("#notch");
  if (!n) return;
  n.classList.remove("is-morph");
  void n.offsetWidth;
  n.classList.add("is-morph");
  clearTimeout(pulseIsland._t);
  pulseIsland._t = setTimeout(() => n.classList.remove("is-morph"), 600);
}
function setMini(open) {
  open = !!open;
  if (phone.classList.contains("is-mini") === open) return;
  phone.classList.toggle("is-mini", open);
  pulseIsland();
}
function setMusic(on) {
  on = !!on;
  const started = on && !musicOn;
  const stopped = !on && musicOn;
  musicOn = on;
  phone.classList.toggle("is-playing", on);
  if (!on) phone.classList.remove("is-mini");
  if (started || stopped) pulseIsland();
  applyNowPlayingTint(on ? SONGS[trackIndex].cover : null, on);
  $("#play").textContent = on ? "pause" : "play";
  $("#miniPlay").textContent = on ? "❚❚" : "▶";
  $("#muteBtn").classList.toggle("on", on);
  const yt = $("#yt");
  const s = SONGS[trackIndex];
  if (on) yt.src = `https://www.youtube.com/embed/${s.yt}?autoplay=1&enablejsapi=1&playsinline=1&rel=0`;
  else yt.src = "";
  syncMeadowMusic();
}

function syncMeadowMusic() {
  const frame = $("#meadowFrame");
  if (!frame || !frame.contentWindow) return;
  if (!frame.src || frame.src === "about:blank") return;
  const s = SONGS[trackIndex];
  const cover = s && s.cover
    ? (s.cover.startsWith("http") ? s.cover : location.origin + "/" + s.cover.replace(/^\//, ""))
    : "";
  try {
    frame.contentWindow.postMessage({
      type: "rinn-music",
      on: !!musicOn,
      title: s ? s.title : "",
      artist: s ? s.artist : "",
      cover,
    }, "*");
  } catch (_) {}
}
window.addEventListener("message", (e) => {
  if (!e.data) return;
  if (e.data.type === "rinn-music-ask") syncMeadowMusic();
  if (e.data.type === "rinn-music-cmd") {
    if (e.data.cmd === "toggle") setMusic(!musicOn);
    if (e.data.cmd === "prev") skipTrack(-1);
    if (e.data.cmd === "next") skipTrack(1);
  }
});
$("#play").onclick = () => setMusic(!musicOn);
$("#muteBtn").onclick = () => setMusic(!musicOn);
$("#miniPlay")?.addEventListener("click", (e) => {
  e.stopPropagation();
  setMusic(!musicOn);
});
$("#miniPrev")?.addEventListener("click", (e) => {
  e.stopPropagation();
  skipTrack(-1);
});
$("#miniNext")?.addEventListener("click", (e) => {
  e.stopPropagation();
  skipTrack(1);
});
$("#appPrev")?.addEventListener("click", () => skipTrack(-1));
$("#appNext")?.addEventListener("click", () => skipTrack(1));
$("#appSeek")?.addEventListener("input", (e) => seekFromSlider(e.target));
$("#yt")?.addEventListener("load", () => {
  try {
    $("#yt").contentWindow.postMessage('{"event":"listening","id":1}', "*");
  } catch (_) {}
});
setInterval(() => {
  if (!musicOn) return;
  seekSec = Math.min(seekSec + 1, SONGS[trackIndex].dur || 240);
  syncSeekUI();
}, 1000);
$("#island")?.addEventListener("click", (e) => {
  e.stopPropagation();
  if (musicOn) setMini(true);
});
$("#mini")?.addEventListener("click", (e) => e.stopPropagation());

document.addEventListener("click", (e) => {
  if (!phone.classList.contains("is-mini")) return;
  if (e.target.closest("#notch, #mini, #island")) return;
  setMini(false);
});

const thread = $("#thread");
function pushChat(line) {
  const d = document.createElement("div");
  d.className = "bubble " + (line.who === "me" ? "me" : "them");
  d.innerHTML = line.t + (line.who === "me" ? ' <span class="ticks">✓✓</span>' : "");
  thread.appendChild(d);
  thread.scrollTop = thread.scrollHeight;
}
thread.addEventListener("click", () => {
  if (chatStep >= chatLines.length) return;
  const line = chatLines[chatStep];
  if (line.who === "them") {
    $("#typing").hidden = false;
    setTimeout(() => {
      $("#typing").hidden = true;
      pushChat(line);
      chatStep++;
    }, 600);
  } else {
    pushChat(line);
    chatStep++;
  }
});

$("#envBtn").onclick = () => ($("#letter").hidden = false);

$$("[data-note]").forEach((b) =>
  b.addEventListener("click", () => {
    const key = { list: "noteList", pass: "notePass", dusk: "noteDusk" }[b.dataset.note];
    $("#noteBody").textContent = phoneContent[key] || "";
    $("#noteSheet").hidden = false;
  })
);
$("[data-close]").onclick = () => ($("#noteSheet").hidden = true);

const flies = $("#flies");
if (flies) {
  let caught = 0;
  for (let i = 0; i < 5; i++) {
    const f = document.createElement("button");
    f.className = "fly";
    f.style.left = 10 + Math.random() * 80 + "%";
    f.style.top = 10 + Math.random() * 70 + "%";
    f.onclick = () => {
      f.remove();
      caught++;
      $("#duskLog").textContent = caught + " / 5";
    };
    flies.appendChild(f);
  }
}

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split(".");
  let cur = obj;
  keys.slice(0, -1).forEach((k) => {
    if (!cur[k] || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k];
  });
  cur[keys[keys.length - 1]] = value;
}
function flatten(obj, prefix = "") {
  const rows = [];
  Object.entries(obj || {}).forEach(([k, v]) => {
    const key = prefix ? prefix + "." + k : k;
    if (typeof v === "string" && v.startsWith("data:image")) return;
    if (v && typeof v === "object" && !Array.isArray(v)) rows.push(...flatten(v, key));
    else if (typeof v === "string" || typeof v === "number") rows.push({ key, value: String(v) });
  });
  return rows;
}
function fieldEl(key, label, value, tall) {
  const wrap = document.createElement("div");
  wrap.className = "ed-field";
  const lab = document.createElement("label");
  lab.textContent = label;
  const input = document.createElement(tall || String(value).length > 70 || String(value).includes("\n") ? "textarea" : "input");
  if (input.tagName === "INPUT") input.type = "text";
  input.dataset.key = key;
  input.value = value == null ? "" : value;
  wrap.append(lab, input);
  return wrap;
}

function renderPhoneEditor() {
  const pane = $("#edPhone");
  pane.innerHTML = "";
  const look = document.createElement("div");
  look.className = "ed-field";
  look.innerHTML = `<label>Phone UI font</label>`;
  const uiSel = document.createElement("select");
  uiSel.dataset.key = "uiFont";
  FONTS_UI.forEach((f) => {
    const o = document.createElement("option");
    o.value = f;
    o.textContent = f;
    if ((phoneContent.uiFont || "Outfit") === f) o.selected = true;
    uiSel.appendChild(o);
  });
  uiSel.addEventListener("change", () => {
    phoneContent.uiFont = uiSel.value;
    applyLook(phoneContent);
  });
  look.appendChild(uiSel);
  pane.appendChild(look);

  const look2 = document.createElement("div");
  look2.className = "ed-field";
  look2.innerHTML = `<label>Name behind phone</label>`;
  const scSel = document.createElement("select");
  scSel.dataset.key = "scriptFont";
  FONTS_SCRIPT.forEach((f) => {
    const o = document.createElement("option");
    o.value = f;
    o.textContent = f;
    if ((phoneContent.scriptFont || "Great Vibes") === f) o.selected = true;
    scSel.appendChild(o);
  });
  scSel.addEventListener("change", () => {
    phoneContent.scriptFont = scSel.value;
    applyLook(phoneContent);
  });
  look2.appendChild(scSel);
  pane.appendChild(look2);

  [
    ["sigX", "Name left / right", -240, 240],
    ["sigY", "Name up / down", -200, 200],
    ["sigSize", "Name size", 80, 260],
  ].forEach(([key, label, min, max]) => {
    const wrap = document.createElement("div");
    wrap.className = "ed-field";
    wrap.innerHTML = `<label>${label}</label>`;
    const range = document.createElement("input");
    range.type = "range";
    range.min = min;
    range.max = max;
    range.dataset.key = key;
    range.value = phoneContent[key] ?? (key === "sigSize" ? 160 : 0);
    range.addEventListener("input", () => {
      phoneContent[key] = Number(range.value);
      applyLook(phoneContent);
    });
    wrap.appendChild(range);
    pane.appendChild(wrap);
  });

  const frameWrap = document.createElement("div");
  frameWrap.className = "ed-field";
  frameWrap.innerHTML = "<label>Name frame</label>";
  const fr = document.createElement("select");
  fr.dataset.key = "nameFrame";
  ["none", "paper", "neon", "polaroid", "plaque", "ribbon"].forEach((v) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    if ((phoneContent.nameFrame || "none") === v) o.selected = true;
    fr.appendChild(o);
  });
  fr.addEventListener("change", () => {
    phoneContent.nameFrame = fr.value;
    applyLook(phoneContent);
  });
  frameWrap.appendChild(fr);
  pane.appendChild(frameWrap);

  const matWrap = document.createElement("div");
  matWrap.className = "ed-field";
  matWrap.innerHTML = "<label>Phone material</label>";
  const mt = document.createElement("select");
  mt.dataset.key = "material";
  ["titanium", "gloss", "ceramic"].forEach((v) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    if ((phoneContent.material || "titanium") === v) o.selected = true;
    mt.appendChild(o);
  });
  mt.addEventListener("change", () => {
    phoneContent.material = mt.value;
    applyLook(phoneContent);
  });
  matWrap.appendChild(mt);
  pane.appendChild(matWrap);

  const deskWrap = document.createElement("div");
  deskWrap.className = "ed-field";
  deskWrap.innerHTML = "<label>Desk mood</label>";
  const dk = document.createElement("select");
  dk.dataset.key = "deskMood";
  [
    ["dusk", "Dusk (pink / blue)"],
    ["morning", "Morning window"],
    ["night", "Night"],
    ["meadow", "Meadow"],
    ["rain", "Rain on the glass"],
  ].forEach(([v, label]) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = label;
    if ((phoneContent.deskMood || "dusk") === v) o.selected = true;
    dk.appendChild(o);
  });
  dk.addEventListener("change", () => {
    phoneContent.deskMood = dk.value;
    applyLook(phoneContent);
  });
  deskWrap.appendChild(dk);
  pane.appendChild(deskWrap);

  const bootWrap = document.createElement("div");
  bootWrap.className = "ed-field";
  bootWrap.innerHTML = "<label>Boot background</label>";
  const bb = document.createElement("select");
  bb.dataset.key = "bootBack";
  [
    ["blush", "Blush"],
    ["paper", "Paper"],
    ["dusk", "Dusk"],
    ["night", "Night"],
    ["meadow", "Meadow"],
    ["ocean", "Ocean"],
    ["rose", "Rose"],
  ].forEach(([v, label]) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = label;
    if ((phoneContent.bootBack || "blush") === v) o.selected = true;
    bb.appendChild(o);
  });
  bootWrap.appendChild(bb);
  pane.appendChild(bootWrap);

  const wpWrap = document.createElement("div");
  wpWrap.className = "ed-field";
  wpWrap.innerHTML = "<label>Phone wallpaper</label>";
  const wpGrid = document.createElement("div");
  wpGrid.className = "wp-picker";
  WALLPAPERS.forEach((w) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.wp = w.id;
    b.title = w.label;
    b.className = (phoneContent.wallpaper || "dusk") === w.id ? "on" : "";
    if (w.src) b.style.backgroundImage = `url("${w.src}")`;
    else b.classList.add(w.css);
    b.addEventListener("click", () => {
      phoneContent.wallpaper = w.id;
      wpGrid.querySelectorAll("button").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      applyLook(phoneContent);
    });
    const cap = document.createElement("span");
    cap.textContent = w.label;
    b.appendChild(cap);
    wpGrid.appendChild(b);
  });
  wpWrap.appendChild(wpGrid);
  pane.appendChild(wpWrap);

  const tray = document.createElement("div");
  tray.className = "ed-field";
  tray.innerHTML = "<label>Stickers — pick one, then click the desk</label>";
  const trayBtns = document.createElement("div");
  trayBtns.className = "sticker-tray";
  ["assets/bow.png", "assets/hearts.png", "assets/pixie.png", "assets/bear-hug.png"].forEach((src) => {
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `<img src="${src}" alt="" />`;
    b.addEventListener("click", () => {
      placing = src;
    });
    trayBtns.appendChild(b);
  });
  const clear = document.createElement("button");
  clear.type = "button";
  clear.textContent = "clear stickers";
  clear.addEventListener("click", () => {
    phoneContent.stickers = [];
    renderStickers();
  });
  tray.append(trayBtns, clear);
  pane.appendChild(tray);

  PHONE_FIELDS.forEach(([key, label, tall]) => {
    pane.appendChild(fieldEl(key, label, phoneContent[key] || "", tall));
  });
}
function renderMeadowEditor() {
  const pane = $("#edMeadow");
  pane.innerHTML = "";
  flatten(meadowContent).forEach((row) => {
    pane.appendChild(fieldEl(row.key, row.key, row.value));
  });
}

$("#adminOpen")?.addEventListener("click", () => ($("#adminSheet").hidden = false));
$("#adminBack")?.addEventListener("click", () => ($("#adminSheet").hidden = true));
$("#adminForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const pass = (phoneContent.adminPass || "tinkerbell").toLowerCase();
  if ($("#adminPw").value.trim().toLowerCase() !== pass) {
    $("#adminErr").hidden = false;
    return;
  }
  $("#adminErr").hidden = true;
  $("#adminOk").hidden = false;
  renderPhoneEditor();
  try {
    const res = await fetch("/meadow/content.json", { cache: "no-store" });
    if (res.ok) meadowContent = await res.json();
  } catch (_) {}
  renderMeadowEditor();
});

$$("[data-ed]").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$("[data-ed]").forEach((b) => b.classList.remove("on"));
    btn.classList.add("on");
    const meadow = btn.dataset.ed === "meadow";
    $("#edPhone").hidden = meadow;
    $("#edMeadow").hidden = !meadow;
  });
});

$("#adminSave")?.addEventListener("click", async () => {
  const msg = $("#adminSaveMsg");
  const phonePane = !$("#edPhone").hidden;
  if (phonePane) {
    $$("#edPhone [data-key]").forEach((el) => {
      phoneContent[el.dataset.key] = el.type === "range" ? Number(el.value) : el.value;
    });
    applyPhone(phoneContent);
    try {
      localStorage.setItem("rinn.phone.content", JSON.stringify(phoneContent));
    } catch (_) {}
    const res = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: "phone", data: phoneContent }),
    });
    msg.textContent = res.ok ? "phone saved on disk." : "saved in this browser. server write failed.";
    return;
  }
  $$("#edMeadow [data-key]").forEach((el) => setPath(meadowContent, el.dataset.key, el.value));
  try {
    localStorage.removeItem("forher.content.v4");
  } catch (_) {}
  const res = await fetch("/api/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: "meadow", data: meadowContent }),
  });
  if (res.ok) {
    meadowReady = false;
    loadMeadow(true);
    msg.textContent = "meadow saved on disk.";
  } else msg.textContent = "couldn’t save meadow.";
});

const portal = $("#portal");
const frame = $("#meadowFrame");
const closeBtn = $("#closePortal");
const portalLens = $("#portalLens");
let meadowReady = false;
let portalBusy = false;
let portalTween;
let portalClip = { x: 0, y: 0, rx: 0, ry: 0 };

function loadMeadow(force) {
  if (meadowReady && !force) return;
  frame.src = "/meadow/?v=" + Date.now();
  meadowReady = true;
}
frame?.addEventListener("load", () => setTimeout(syncMeadowMusic, 250));

const meadowEase = "cubic-bezier(0.32, 0.72, 0, 1)";

function islandBox() {
  const n = $("#notch") || phone;
  return n.getBoundingClientRect();
}

function coverRadius(x, y) {
  return Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 32;
}

function applyPortalClip() {
  const c = portalClip;
  portal.style.clipPath = `ellipse(${c.rx}px ${c.ry}px at ${c.x}px ${c.y}px)`;
  if (portalLens) {
    portalLens.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) scale(${Math.max(c.rx / 50, 0.01)}, ${Math.max(c.ry / 50, 0.01)})`;
  }
}

function expandMeadow() {
  if (portalBusy) return;
  portalBusy = true;
  loadMeadow();
  const bar = $("#sfUrl");
  if (bar) {
    bar.textContent = (phoneContent.safariUrl || "rinn.garden") + "/meadow";
    bar.classList.add("is-morphing");
  }
  document.body.classList.add("meadow-open");
  const pr = phone.getBoundingClientRect();
  const x = pr.left + pr.width / 2;
  const y = pr.top + pr.height / 2;
  const r0 = Math.min(pr.width, pr.height) * 0.48;
  const r1 = coverRadius(x, y);
  portal.classList.remove("is-open");
  Object.assign(portalClip, { x, y, rx: r0, ry: r0 });
  applyPortalClip();
  if (portalLens) portalLens.style.opacity = "1";
  portal.style.opacity = "1";
  portal.hidden = false;
  const gsap = window.gsap;
  if (!gsap) {
    portal.style.clipPath = "none";
    portal.classList.add("is-open");
    portalBusy = false;
    return;
  }
  if (portalTween) portalTween.kill();
  gsap.set(frame, { opacity: 1 });
  gsap.set(closeBtn, { opacity: 0 });
  portalTween = gsap.timeline({
    onComplete: () => {
      portal.style.clipPath = "none";
      if (portalLens) portalLens.style.opacity = "0";
      portal.classList.add("is-open");
      portalBusy = false;
    },
  });
  portalTween
    .to(
      portalClip,
      {
        rx: r1,
        ry: r1,
        duration: 0.78,
        ease: meadowEase,
        onUpdate: applyPortalClip,
      },
      0
    )
    .to(portalLens, { opacity: 0, duration: 0.22, ease: "power2.out" }, 0)
    .to(closeBtn, { opacity: 1, duration: 0.28, ease: "power2.out" }, 0.46);
}

function islandRestSize() {
  if (phone.classList.contains("is-mini")) return { w: Math.min(358, phone.clientWidth * 0.915), h: 80, rad: 32 };
  if (phone.classList.contains("is-playing")) return { w: 210, h: 37, rad: 19 };
  return { w: 126, h: 37, rad: 999 };
}

function collapseMeadow() {
  if (portalBusy) return;
  portalBusy = true;
  const gsap = window.gsap;
  const notch = $("#notch");
  portal.classList.remove("is-open", "is-absorbing");
  const pr = phone.getBoundingClientRect();
  const px = pr.left + pr.width / 2;
  const py = pr.top + pr.height * 0.52;
  const rest = islandRestSize();
  const catchW = phone.classList.contains("is-playing") ? 240 : 178;
  const catchH = 58;
  const ix = px;
  const iy = pr.top + 12 + catchH / 2;
  const rCover = coverRadius(px, py);
  const rPhone = Math.min(pr.width, pr.height) * 0.3;
  if (!gsap) {
    portal.hidden = true;
    document.body.classList.remove("meadow-open");
    portalBusy = false;
    show("web");
    return;
  }
  if (portalTween) portalTween.kill();
  Object.assign(portalClip, { x: px, y: py, rx: rCover, ry: rCover });
  applyPortalClip();
  gsap.set(frame, { opacity: 1 });
  if (portalLens) gsap.set(portalLens, { opacity: 0 });
  if (notch) {
    gsap.set(notch, { xPercent: -50, transformOrigin: "50% 0%", scaleX: 1, scaleY: 1 });
    notch.classList.add("is-catching");
    notch.classList.remove("is-morph");
  }
  portalTween = gsap.timeline({
    onComplete: () => {
      portal.hidden = true;
      portal.classList.remove("is-absorbing");
      if (notch) {
        notch.classList.remove("is-catching", "is-reaching");
        gsap.set(notch, { clearProps: "transform,width,height,borderRadius,scale,scaleX,scaleY,xPercent" });
      }
      portal.style.clipPath = "none";
      portal.style.opacity = "1";
      gsap.set(frame, { opacity: 1 });
      document.body.classList.remove("meadow-open");
      $("#sfUrl")?.classList.remove("is-morphing");
      if ($("#sfUrl")) $("#sfUrl").textContent = phoneContent.safariUrl || "rinn.garden";
      portalBusy = false;
      show("web");
    },
  });
  portalTween
    .to(closeBtn, { opacity: 0, duration: 0.1 }, 0)
    .to(
      portalClip,
      {
        rx: rPhone,
        ry: rPhone,
        duration: 0.56,
        ease: meadowEase,
        onUpdate: applyPortalClip,
      },
      0
    )
    .to(portalLens, { opacity: 1, duration: 0.2, ease: "power2.out" }, 0.28)
    .to(
      notch,
      {
        width: catchW * 0.88,
        height: 44,
        borderRadius: 22,
        duration: 0.32,
        ease: meadowEase,
      },
      0.34
    )
    .to(
      notch,
      {
        width: catchW,
        height: catchH,
        borderRadius: 28,
        duration: 0.28,
        ease: "power2.out",
      },
      0.58
    )
    .to(frame, { opacity: 0, duration: 0.22, ease: "power2.in" }, 0.62)
    .to(portalLens, { opacity: 0, duration: 0.16, ease: "power2.in" }, 0.66)
    .to(
      portalClip,
      {
        x: ix,
        y: iy,
        rx: 18,
        ry: 18,
        duration: 0.38,
        ease: "power3.in",
        onUpdate: applyPortalClip,
      },
      0.84
    )
    .add(() => {
      portal.style.opacity = "0";
      portal.hidden = true;
      portal.style.clipPath = "none";
      if (portalLens) portalLens.style.opacity = "0";
    }, 1.22)
    .to(notch, { scaleX: 1.1, scaleY: 0.82, duration: 0.1, ease: "power2.out" }, 1.22)
    .to(
      notch,
      {
        scaleX: 1,
        scaleY: 1,
        width: rest.w,
        height: rest.h,
        borderRadius: rest.rad,
        duration: 0.48,
        ease: "back.out(1.5)",
      },
      1.32
    );
}

$("#openMeadow").addEventListener("click", expandMeadow);
$("#closePortal").addEventListener("click", collapseMeadow);
$$('[data-app="web"]').forEach((b) => b.addEventListener("click", () => loadMeadow()));

async function bootPhone() {
  let data = {};
  try {
    const r = await fetch("/content.json", { cache: "no-store" });
    if (r.ok) data = await r.json();
  } catch (_) {}
  if (!data || !Object.keys(data).length) {
    try {
      data = JSON.parse(localStorage.getItem("rinn.phone.content") || "{}");
    } catch (_) {}
  } else {
    try {
      localStorage.setItem("rinn.phone.content", JSON.stringify(data));
    } catch (_) {}
  }
  applyPhone(data);
  buildMotes();
  startFirefly();
  renderLib();
  applyTrack();
  runBoot();
}
bootPhone();

document.addEventListener("click", (e) => {
  if (!placing) return;
  if (e.target.closest(".phone-wrap, .portal, #adminSheet, .sticker-tray, button, input, select, textarea, a")) return;
  phoneContent.stickers = phoneContent.stickers || [];
  phoneContent.stickers.push({
    src: placing,
    x: e.clientX - 36,
    y: e.clientY - 36,
    s: 72,
    r: Math.round((Math.random() * 16 - 8) * 10) / 10,
  });
  renderStickers();
});

const wrap = $("#wrap");
let tiltTick = 0;
$("#powerBtn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  const turningOff = !document.body.classList.contains("lights-out");
  document.body.classList.toggle("lights-out", turningOff);
  document.body.classList.remove("lamp-ignite", "lamp-kill");
  void document.body.offsetWidth;
  document.body.classList.add(turningOff ? "lamp-kill" : "lamp-ignite");
  if (turningOff) phone?.classList.remove("lit");
  else phone?.classList.add("lit");
  setTimeout(() => document.body.classList.remove("lamp-ignite", "lamp-kill"), 1000);
});

window.addEventListener(
  "pointermove",
  (e) => {
    if (tiltTick) return;
    tiltTick = requestAnimationFrame(() => {
      tiltTick = 0;
      if (!wrap) return;
      wrap.style.setProperty("--rx", ((e.clientY / window.innerHeight) - 0.5) * -2.2 + "deg");
      wrap.style.setProperty("--ry", ((e.clientX / window.innerWidth) - 0.5) * 2.8 + "deg");
      wrap.style.setProperty("--spec", String(((e.clientX / window.innerWidth) - 0.5) * 26));
      const r = wrap.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const reach = Math.max(r.width, r.height) * 0.92;
      setNear(Math.hypot(dx, dy) < reach);
    });
  },
  { passive: true }
);
wrap?.addEventListener("pointerenter", () => setNear(true));
document.addEventListener("mouseleave", () => setNear(false));

const BOOT_LINES = [
  "TinkerbellOS 0.9.4",
  "",
  "checking heart................ ok",
  "mounting desk................. ok",
  "offset clock +6h.............. ok",
  "island........................ ok",
  "unlocking name................ ok",
  "",
  "hello, Tinkerbell.",
  "",
  "ok.",
];

let proximityOn = false;
let nearPhone = true;

function setNear(near) {
  if (!proximityOn || !phone) return;
  if (near === nearPhone) return;
  nearPhone = near;
  phone.classList.toggle("asleep", !near);
}

function endBoot() {
  const boot = $("#boot");
  const gsap = window.gsap;
  const scene = [".studio", ".stage", ".desk-stickers"];
  document.body.classList.remove("booting");
  document.body.classList.add("lights-out");
  phone?.classList.remove("lit");
  if (gsap) gsap.set(scene, { opacity: 1 });
  setTimeout(() => document.body.classList.add("sig-in"), 720);
  setTimeout(() => {
    proximityOn = true;
  }, 400);
  if (!boot) return;
  if (gsap) {
    gsap.to(boot, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => boot.remove(),
    });
  } else {
    boot.remove();
  }
}

function dustInBootLine(el) {
  return new Promise((resolve) => {
    const r = el.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.ceil(r.width * dpr));
    c.height = Math.max(1, Math.ceil(r.height * dpr));
    c.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;pointer-events:none;z-index:95;`;
    const g = c.getContext("2d");
    g.scale(dpr, dpr);
    const cs = getComputedStyle(el);
    g.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    g.fillStyle = "#c9899e";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText((el.textContent || "").trim(), r.width / 2, r.height / 2);
    const snap = g.getImageData(0, 0, c.width, c.height);
    document.body.appendChild(c);
    g.clearRect(0, 0, c.width, c.height);
    const parts = [];
    const step = Math.max(3, Math.round(3 * dpr));
    for (let y = 0; y < c.height && parts.length < 260; y += step) {
      for (let x = 0; x < c.width && parts.length < 260; x += step) {
        if (snap.data[(y * c.width + x) * 4 + 3] < 24) continue;
        if (Math.random() > 0.5) continue;
        const across = x / c.width;
        parts.push({
          hx: x,
          hy: y,
          x: x + 16 + Math.random() * 60,
          y: y - Math.random() * 40,
          t: -across * 0.4,
          s: 0.8 + Math.random() * 1.2,
          gold: Math.random() > 0.5,
        });
      }
    }
    let frames = 0;
    const tick = () => {
      g.clearRect(0, 0, c.width, c.height);
      let alive = false;
      for (const p of parts) {
        p.t += 0.02;
        if (p.t < 0) {
          alive = true;
          continue;
        }
        const k = Math.min(1, p.t);
        const e = 1 - Math.pow(1 - k, 3);
        g.fillStyle = (p.gold ? "rgba(246,228,174," : "rgba(244,182,200,") + Math.min(0.95, k) + ")";
        g.beginPath();
        g.arc(p.x + (p.hx - p.x) * e, p.y + (p.hy - p.y) * e, p.s, 0, Math.PI * 2);
        g.fill();
        if (k < 1) alive = true;
      }
      frames += 1;
      if (alive && frames < 90) requestAnimationFrame(tick);
      else {
        c.remove();
        resolve();
      }
    };
    tick();
  });
}

async function runBoot() {
  const boot = $("#boot");
  const skip = $("#bootSkip");
  const log = $("#bootLog");
  if (log) log.replaceChildren();
  if (boot) boot.dataset.back = "black";
  if (!boot) {
    endBoot();
    return;
  }
  let stopped = false;
  skip?.addEventListener("click", () => {
    stopped = true;
    endBoot();
  });
  await new Promise((r) => setTimeout(r, 600));
  if (stopped) return;
  document.body.classList.remove("booting");
  document.body.classList.add("lights-out");
  phone?.classList.remove("lit");
  const gsap = window.gsap;
  if (gsap) gsap.set([".studio", ".stage", ".desk-stickers"], { opacity: 1 });
  boot.classList.add("is-clear");
  await new Promise((r) => setTimeout(r, 1850));
  if (!stopped) endBoot();
}
