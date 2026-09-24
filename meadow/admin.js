const KEY = "forher.content.v4";
const PASS_KEY = "forher.adminPass";
const DEFAULT_PASS = "pixiedust";

const FIELDS = [
  { section: "voice", key: "title", label: "Browser tab title", type: "text" },
  { section: "voice", key: "herName", label: "Her name (opening animation)", type: "text" },
  { section: "voice", key: "signOff", label: "Sign-off under the letter", type: "text" },
  { section: "voice", key: "callApp", label: "Call app she already uses", type: "text" },
  {
    section: "voice",
    key: "greeting",
    label: "Optional first line (leave empty if you barely know her)",
    type: "text",
  },
  {
    section: "voice",
    key: "oneTrueThing",
    label: "One true extra sentence (or empty)",
    type: "textarea",
  },
  { section: "load", key: "load.kicker", label: "Tiny label", type: "text" },
  { section: "load", key: "load.title", label: "Title (use Enter for a line break)", type: "textarea" },
  { section: "load", key: "load.lede", label: "Subtitle", type: "textarea" },
  { section: "story", key: "story.kicker", label: "Chapter label", type: "text" },
  { section: "story", key: "story.title", label: "Chapter title", type: "textarea" },
  { section: "story", key: "story.lede", label: "Line under the title", type: "textarea" },
  { section: "story", key: "story.body", label: "The fairy tale", type: "textarea" },
  { section: "story", key: "story.next", label: "Turn-the-page button", type: "text" },
  { section: "color", key: "color.kicker", label: "Tiny label", type: "text" },
  { section: "color", key: "color.title", label: "Title", type: "textarea" },
  { section: "color", key: "color.lede", label: "Subtitle", type: "textarea" },
  { section: "color", key: "color.pinkHint", label: "Pink door hint", type: "text" },
  { section: "color", key: "color.pinkLabel", label: "Pink door name", type: "text" },
  { section: "color", key: "color.blueHint", label: "Blue door hint", type: "text" },
  { section: "color", key: "color.blueLabel", label: "Blue door name", type: "text" },
  { section: "play", key: "play.kicker", label: "Tiny label", type: "text" },
  { section: "play", key: "play.title", label: "Title", type: "textarea" },
  { section: "play", key: "play.lede", label: "Subtitle", type: "textarea" },
  { section: "play", key: "play.skip", label: "Skip button", type: "text" },
  { section: "letter", key: "letter.kicker", label: "Tiny label", type: "text" },
  { section: "letter", key: "letter.tap", label: "Text before she opens the seal", type: "text" },
  { section: "letter", key: "letter.body", label: "The letter", type: "textarea" },
  { section: "letter", key: "letter.continue", label: "Continue button", type: "text" },
  { section: "ask", key: "ask.kicker", label: "Tiny label", type: "text" },
  { section: "ask", key: "ask.title", label: "Title", type: "textarea" },
  { section: "ask", key: "ask.lede", label: "Subtitle", type: "textarea" },
  { section: "ask", key: "ask.yes", label: "Yes button", type: "text" },
  { section: "ask", key: "ask.no", label: "No button", type: "text" },
  { section: "ask", key: "ask.mercy", label: "After No stops running", type: "textarea" },
  { section: "date", key: "date.kicker", label: "Tiny label", type: "text" },
  { section: "date", key: "date.title", label: "Title", type: "textarea" },
  { section: "date", key: "date.lede", label: "Subtitle", type: "textarea" },
  { section: "date", key: "date.kindLabel", label: "Date-type label", type: "text" },
  { section: "date", key: "date.whenLabel", label: "When label", type: "text" },
  { section: "date", key: "date.kinds.movie", label: "Option: movie", type: "text" },
  { section: "date", key: "date.kinds.walk", label: "Option: walk", type: "text" },
  { section: "date", key: "date.kinds.questions", label: "Option: questions", type: "text" },
  { section: "date", key: "date.whens.weeknight", label: "When: weeknight", type: "text" },
  { section: "date", key: "date.whens.weekend", label: "When: weekend", type: "text" },
  { section: "date", key: "date.whens.you", label: "When: she picks", type: "text" },
  { section: "date", key: "date.kindFull.movie", label: "Yes-page movie line", type: "text" },
  { section: "date", key: "date.kindFull.walk", label: "Yes-page walk line", type: "text" },
  { section: "date", key: "date.kindFull.questions", label: "Yes-page questions line", type: "text" },
  { section: "date", key: "date.whenFull.weeknight", label: "Yes-page weeknight line", type: "text" },
  { section: "date", key: "date.whenFull.weekend", label: "Yes-page weekend line", type: "text" },
  { section: "date", key: "date.whenFull.you", label: "Yes-page you-pick line", type: "text" },
  { section: "date", key: "date.lock", label: "Lock button", type: "text" },
  { section: "end", key: "yes.kicker", label: "Yes tiny label", type: "text" },
  { section: "end", key: "yes.title", label: "Yes title", type: "textarea" },
  { section: "end", key: "yes.textMe", label: "Text-me line", type: "textarea" },
  { section: "end", key: "yes.appLine", label: "App line — use {callApp}", type: "textarea" },
  { section: "end", key: "kind.kicker", label: "Soft-no tiny label", type: "text" },
  { section: "end", key: "kind.title", label: "Soft-no title", type: "textarea" },
  { section: "end", key: "kind.lede", label: "Soft-no subtitle", type: "textarea" },
  { section: "pictures", key: "images.doorPink", label: "Pink door photo", type: "image" },
  { section: "pictures", key: "images.doorBlue", label: "Blue door photo", type: "image" },
  { section: "pictures", key: "images.finale", label: "Yes-page photo", type: "image" },
  { section: "pictures", key: "images.forest", label: "Meadow background", type: "image" },
  { section: "pictures", key: "images.clouds", label: "Pink cloud overlay", type: "image" },
  { section: "stickers", key: "images.bow", label: "Bow", type: "image" },
  { section: "stickers", key: "images.berry", label: "Strawberry", type: "image" },
  { section: "stickers", key: "images.daisy", label: "Daisy", type: "image" },
  { section: "stickers", key: "images.bunny", label: "White bunny", type: "image" },
  { section: "stickers", key: "images.hood", label: "Hooded bunny", type: "image" },
  { section: "stickers", key: "images.bear", label: "White bear", type: "image" },
  { section: "stickers", key: "images.bell", label: "Little bell / dust", type: "image" },
  { section: "stickers", key: "images.seal", label: "Wax seal", type: "image" },
  { section: "stickers", key: "images.fairy", label: "Fairy (follows the cursor)", type: "image" },
  { section: "stickers", key: "images.lantern", label: "Lantern", type: "image" },
];

let content = deepMerge({}, DEFAULT_CONTENT);

function pass() {
  return localStorage.getItem(PASS_KEY) || DEFAULT_PASS;
}

function $(sel) {
  return document.querySelector(sel);
}

function setStatus(msg) {
  $("#status").textContent = msg;
}

function readFormInto(obj) {
  FIELDS.forEach((f) => {
    const el = document.querySelector(`[data-field="${f.key}"]`);
    if (!el || f.type === "image") return;
    setPath(obj, f.key, el.value);
  });
  return obj;
}

function fillForm(obj) {
  FIELDS.forEach((f) => {
    const val = getPath(obj, f.key);
    if (f.type === "image") {
      const img = document.querySelector(`[data-preview="${f.key}"]`);
      if (img && val) img.src = val;
      return;
    }
    const el = document.querySelector(`[data-field="${f.key}"]`);
    if (el) el.value = val == null ? "" : val;
  });
}

function compressFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1600;
      let w = img.width;
      let h = img.height;
      if (w > max) {
        h = Math.round((h * max) / w);
        w = max;
      }
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      const isPng = file.type === "image/png";
      resolve(c.toDataURL(isPng ? "image/png" : "image/jpeg", 0.84));
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function saveLocal() {
  readFormInto(content);
  try {
    localStorage.setItem(KEY, JSON.stringify(content));
    setStatus("saved on this computer");
    refreshPreview();
  } catch (err) {
    setStatus("too big for local save — download JSON instead");
    alert("Images made this too large for the browser. Use Download JSON and put content.json in the folder.");
  }
}

function refreshPreview() {
  const frame = $("#preview");
  frame.src = "index.html?v=" + Date.now();
}

function downloadJson() {
  readFormInto(content);
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "content.json";
  a.click();
  setStatus("content.json downloaded — drop it in the for-her folder");
}

function unlock() {
  $(".gate").style.display = "none";
  $(".studio").classList.add("is-on");
  fillForm(content);
  refreshPreview();
}

const ready = loadContent().then((c) => {
  content = c;
});

$("#login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const typed = $("#password").value;
  if (typed !== pass()) {
    $("#err").textContent = "nope.";
    return;
  }
  $("#err").textContent = "";
  await ready;
  unlock();
});

document.querySelectorAll("nav [data-go]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("nav [data-go]").forEach((b) => b.classList.remove("is-on"));
    btn.classList.add("is-on");
    document.querySelectorAll(".section").forEach((s) => s.classList.remove("is-on"));
    document.getElementById("sec-" + btn.dataset.go).classList.add("is-on");
  });
});

document.addEventListener("change", async (e) => {
  const input = e.target.closest("[data-file]");
  if (!input) return;
  const file = input.files && input.files[0];
  if (!file) return;
  const key = input.getAttribute("data-file");
  setStatus("compressing image…");
  const data = await compressFile(file);
  setPath(content, key, data);
  const img = document.querySelector(`[data-preview="${key}"]`);
  if (img) img.src = data;
  setStatus("image ready — hit Save");
});

$("#save").addEventListener("click", saveLocal);
$("#preview-btn").addEventListener("click", () => {
  saveLocal();
  window.open("index.html", "_blank");
});
$("#download").addEventListener("click", () => {
  readFormInto(content);
  downloadJson();
});
$("#import").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const json = JSON.parse(await file.text());
  content = deepMerge(DEFAULT_CONTENT, json);
  fillForm(content);
  setStatus("imported — hit Save");
});
$("#reset").addEventListener("click", () => {
  if (!confirm("Reset all copy and pictures to the original?")) return;
  content = deepMerge({}, DEFAULT_CONTENT);
  localStorage.removeItem(KEY);
  fillForm(content);
  refreshPreview();
  setStatus("reset");
});
$("#setpass").addEventListener("click", () => {
  const next = prompt("new admin password", pass());
  if (!next) return;
  localStorage.setItem(PASS_KEY, next);
  setStatus("password changed on this computer");
});

const groups = {};
FIELDS.forEach((f) => {
  if (!groups[f.section]) groups[f.section] = [];
  groups[f.section].push(f);
});
Object.entries(groups).forEach(([section, fields]) => {
  const root = document.getElementById("sec-" + section);
  fields.forEach((f) => {
    const wrap = document.createElement("div");
    if (f.type === "image") {
      wrap.className = "drop";
      wrap.innerHTML = `<label>${f.label}</label>
        <img data-preview="${f.key}" alt="">
        <input type="file" accept="image/*" data-file="${f.key}">`;
    } else if (f.type === "textarea") {
      wrap.innerHTML = `<label>${f.label}</label><textarea data-field="${f.key}"></textarea>`;
    } else {
      wrap.innerHTML = `<label>${f.label}</label><input type="text" data-field="${f.key}">`;
    }
    root.appendChild(wrap);
  });
});
