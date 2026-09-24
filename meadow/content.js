/* Shared defaults. Admin + the public site both load this. */
const DEFAULT_CONTENT = {
  title: "for Rinn",
  herName: "Rinn",
  signOff: "me",
  callApp: "the app we already use",
  greeting: "",
  oneTrueThing: "",
  load: {
    kicker: "for",
    title: "Rinn",
    lede: "hold to open",
    tap: "tap to open",
    forYou: "For you Tinkerbell",
    love: "I love you",
    loveNext: "continue",
  },
  sky: {
    kicker: "same sky",
    title: "you’re far.\nthe moon’s still shared.",
    here: "here",
    there: "there",
    thereTime: "your night",
    withYou: "with you",
    lede: "long distance doesn’t cancel a first date. it just makes the showing-up part louder.",
    next: "keep walking",
  },
  story: {
    kicker: "chapter one",
    title: "the girl with two kinds of magic",
    lede: "pink in one hand. blue in the other.",
    body: "there was a girl who couldn't pick a sky, so she kept both.\n\nfar from her woods, somebody kept looking for that glow anyway. dumb, ngl. but that's how these things start.\n\nthe forest only lets you in if you catch the lanterns. then you get to ask for real.",
    next: "turn the page",
    back: "turn back",
  },
  color: {
    kicker: "her magic",
    title: "pink or blue.\nboth belong to you.",
    lede: "pick a grove. the path keeps going either way.",
    pinkHint: "warm",
    pinkLabel: "pink",
    blueHint: "quiet",
    blueLabel: "blue",
  },
  play: {
    kicker: "the errand",
    title: "fill the heart",
    lede: "tap until it glows. that's how the meadow lets you in.",
    skip: "skip",
    tap: "tap me",
  },
  letter: {
    kicker: "the true part",
    tap: "break the seal.",
    continue: "turn the page",
    body: "so that's the story i made up.\n\nthe true part is dumber and better:\nyou're far as hell. we don't know each other that well yet. that's kinda the point.\ni still wanted to ask you properly. not in a dry text. not as a joke.\n\nyou've got that tiny-bright thing about you. the kind that makes a whole clearing feel less stupid.\n\nanyway. i like you, little miss. come be in it.",
  },
  ask: {
    kicker: "the ask",
    title: "write the next page\nwith me",
    lede: "a call. cameras on. no castle. just us, ngl.",
    yes: "i'm in",
    no: "nah",
    mercy: "you can say no. for real. i'll be okay. this was still worth asking.",
  },
  date: {
    kicker: "chapter two",
    title: "not a kingdom.\njust an hour.",
    lede: "i'll come to your time. pick the vibe, then a window.",
    kindLabel: "the date",
    whenLabel: "when",
    lock: "that's our date",
    kinds: {
      movie: "same movie",
      walk: "walk + talk",
      questions: "20 questions",
    },
    whens: {
      weeknight: "a weeknight",
      weekend: "this weekend",
      you: "you pick",
    },
    kindFull: {
      movie: "same movie, two cities, one call",
      walk: "a walk together, phones up",
      questions: "twenty questions. no skipping",
    },
    whenFull: {
      weeknight: "some weeknight",
      weekend: "this weekend",
      you: "whenever you say",
    },
  },
  yes: {
    kicker: "kept",
    title: "okay. the story's ours now.",
    textMe: "text me yes too. i wanna see it pop up for real. not just in a forest.",
    appLine: "i'll be there on {callApp}. your timezone. i'll show up.",
  },
  kind: {
    kicker: "still glad",
    title: "okay.\nthanks for opening the book.",
    lede: "you can close it. i liked writing this for you anyway.",
  },
  look: { sky: "meadow" },
  images: {
    doorPink: "assets/sky.jpg",
    doorBlue: "assets/moon.jpg",
    finale: "assets/storybook.jpg",
    forest: "assets/melody-meadow.jpg",
    clouds: "assets/melody-clouds.jpg",
    bow: "assets/bow.png",
    berry: "assets/berry.png",
    daisy: "assets/daisy.png",
    bunny: "assets/bear-hearts.png",
    hood: "assets/bear-hug.png",
    bear: "assets/bear-hug.png",
    bell: "assets/hearts.png",
    seal: "assets/seal.png",
    fairy: "assets/pixie.png",
    lantern: "assets/bear-hearts.png",
    hearts: "assets/hearts.png",
    bearHug: "assets/bear-hug.png",
    bearHearts: "assets/bear-hearts.png",
  },
};

function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

function setPath(obj, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  let cur = obj;
  for (const k of keys) {
    if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k];
  }
  cur[last] = value;
}

function deepMerge(a, b) {
  if (Array.isArray(b) || typeof b !== "object" || b == null) return b;
  const out = { ...a };
  for (const k of Object.keys(b)) {
    out[k] =
      a && typeof a[k] === "object" && !Array.isArray(a[k])
        ? deepMerge(a[k], b[k])
        : b[k];
  }
  return out;
}

async function loadContent() {
  let data = deepMerge({}, DEFAULT_CONTENT);
  let fileStamp = 0;
  try {
    const res = await fetch("content.json?ts=" + Date.now(), { cache: "no-store" });
    if (res.ok) {
      const file = await res.json();
      fileStamp = file.savedAt || 0;
      data = deepMerge(data, file);
    }
  } catch (_) {}
  try {
    const local = JSON.parse(localStorage.getItem("forher.content.v4") || "null");
    if (local && (local.savedAt || 0) > fileStamp) data = deepMerge(data, local);
  } catch (_) {}
  return data;
}

const RICH_PROPS = ["font-family", "font-size", "color", "background-color", "font-weight", "font-style", "text-decoration", "text-transform", "letter-spacing", "text-shadow"];

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function safeCssValue(v) {
  const val = String(v || "").trim().replace(/"/g, "'");
  if (!val || val.length > 160) return "";
  if (/url\(|expression\(|@import|javascript:|[<>{}]/i.test(val)) return "";
  return val;
}

function styleString(el) {
  if (!el || el.nodeType !== 1) return "";
  const bits = [];
  const seen = new Set();
  const add = (k, v) => {
    const key = String(k || "").trim().toLowerCase();
    const val = safeCssValue(v);
    if (!RICH_PROPS.includes(key) || !val || seen.has(key)) return;
    seen.add(key);
    bits.push(key + ":" + val);
  };
  String((el.getAttribute && el.getAttribute("style")) || "").split(";").forEach((part) => {
    const i = part.indexOf(":");
    if (i > 0) add(part.slice(0, i), part.slice(i + 1));
  });
  const tag = el.tagName;
  if (tag === "B" || tag === "STRONG") add("font-weight", "700");
  if (tag === "I" || tag === "EM") add("font-style", "italic");
  if (tag === "U") add("text-decoration", "underline");
  return bits.join(";");
}

function mergeCss(parent, child) {
  const map = new Map();
  const put = (css) => {
    String(css || "").split(";").forEach((part) => {
      const i = part.indexOf(":");
      if (i < 1) return;
      const k = part.slice(0, i).trim().toLowerCase();
      const v = part.slice(i + 1).trim();
      if (k && v) map.set(k, v);
    });
  };
  put(parent);
  put(child);
  return [...map.entries()].map(([k, v]) => k + ":" + v).join(";");
}

function serializeRichNode(root) {
  let out = "";
  const walk = (node, css) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        const t = child.textContent || "";
        if (!t) return;
        out += css ? '<span style="' + css + '">' + escapeHtml(t) + "</span>" : escapeHtml(t);
      } else if (child.nodeName === "BR") {
        out += "<br>";
      } else if (child.nodeType === 1) {
        const tag = child.nodeName;
        if (tag === "DIV" || tag === "P") {
          if (out && !out.endsWith("<br>")) out += "<br>";
          walk(child, css);
          return;
        }
        walk(child, mergeCss(css, styleString(child)));
      }
    });
  };
  walk(root, "");
  return out.replace(/^(<br>)+/, "").replace(/(<br>)+$/, "").replace(/(<br>){3,}/g, "<br><br>");
}

function sanitizeRich(html) {
  const box = document.createElement("div");
  box.innerHTML = String(html || "").replace(/<(?!\/?(br|span|b|strong|i|em|u|div|p)\b)/gi, "&lt;");
  const clean = serializeRichNode(box);
  return clean === "<br>" ? "" : clean;
}

function renderRichHtml(value) {
  return sanitizeRich(String(value ?? "").replace(/\n/g, "<br>"));
}

function bakeFontSize(value, px) {
  const pieces = richPieces(value);
  if (!pieces.length) return String(value || "");
  const add = "font-size:" + px;
  return renderPieces(pieces.map((p) => (p.br ? p : { ch: p.ch, css: mergeCss(p.css, add) })));
}

function richPieces(value) {
  const box = document.createElement("div");
  box.innerHTML = renderRichHtml(value);
  const pieces = [];
  const walk = (node, css) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        for (const ch of child.textContent || "") pieces.push({ ch, css });
      } else if (child.nodeName === "BR") pieces.push({ br: true });
      else if (child.nodeType === 1) walk(child, mergeCss(css, styleString(child)));
    });
  };
  walk(box, "");
  return pieces;
}

function renderPieces(pieces) {
  let html = "";
  let open = null;
  const close = () => {
    if (open) html += "</span>";
    open = null;
  };
  for (const p of pieces) {
    if (p.br) {
      close();
      html += "<br>";
      continue;
    }
    const css = p.css || "";
    if (css !== open) {
      close();
      if (css) {
        html += '<span style="' + css + '">';
        open = css;
      }
    }
    html += escapeHtml(p.ch || "");
  }
  close();
  return html;
}

function applyContent(c) {
  document.title = c.title || "a small letter";
  document.querySelectorAll("[data-text]").forEach((el) => {
    if (el.id === "letter" && typeof state !== "undefined" && state.typed) return;
    const v = getPath(c, el.dataset.text);
    if (v == null) return;
    delete el.dataset.magic;
    el.classList.remove("magic-in", "magic-out", "magic-block");
    el.innerHTML = renderRichHtml(v);
  });
  document.querySelectorAll("[data-src]").forEach((el) => {
    const v = getPath(c, el.dataset.src);
    if (v) el.src = v;
  });
}
