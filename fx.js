// MORSE motion helpers: page entrances, scroll reveals, count-ups, confetti and feedback.
// Everything respects "reduce motion" and degrades to static content.
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.documentElement.classList.add("fx");

// Fade + rise the top-level blocks of a freshly rendered page, one after another.
export function enterPage(root) {
  if (!root) return;
  root.classList.remove("page-enter");
  void root.offsetWidth; // restart the animation
  [...root.children].slice(0, 10).forEach((el, i) => el.style.setProperty("--i", i));
  root.classList.add("page-enter");
}

// Reveal cards and sections as they scroll into view.
const REVEAL =
  ".welcome-step-grid article, .welcome-strip > div, .welcome-quote, .welcome-how > h2, .lesson-row, .library-card, .stats-strip > div, .right-rail > section, .progress-summary > article, .badge, .timing-grid > div, .result-review .review-chip, .character-card, .confidence-grid > button";
let revealObserver;
export function reveal(root) {
  if (!root) return;
  const items = root.querySelectorAll(REVEAL);
  if (reduced() || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("revealed"));
    return;
  }
  revealObserver ||= new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          revealObserver.unobserve(entry.target);
        }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
  );
  // Stagger siblings that share a parent so grids ripple in.
  const groups = new Map();
  items.forEach((el) => {
    const n = groups.get(el.parentElement) || 0;
    groups.set(el.parentElement, n + 1);
    el.style.setProperty("--r", Math.min(n, 14));
    el.classList.add("reveal");
    revealObserver.observe(el);
  });
  // Safety net: never leave content invisible.
  setTimeout(() => items.forEach((el) => el.classList.add("revealed")), 2600);
}

// Count numbers up from zero: <b data-count="42" data-suffix="%">42%</b>
export function countUp(root) {
  root?.querySelectorAll("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count),
      suffix = el.dataset.suffix || "",
      keep = el.querySelector("small")?.outerHTML || "";
    if (!Number.isFinite(target) || target <= 0 || reduced()) return;
    const start = performance.now(),
      dur = Math.min(1400, 500 + target * 6);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur),
        eased = 1 - Math.pow(1 - t, 3);
      el.innerHTML = Math.round(target * eased).toLocaleString() + suffix + keep;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// A small celebratory burst from an element.
const COLORS = ["#7052d9", "#a48bce", "#3fb68b", "#f2b24c", "#ef7aa1", "#5aa9e6"];
export function confetti(from, amount = 26) {
  if (reduced() || !from) return;
  const r = from.getBoundingClientRect(),
    x = r.left + r.width / 2,
    y = r.top + r.height / 2;
  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  for (let i = 0; i < amount; i++) {
    const p = document.createElement("i"),
      angle = Math.random() * Math.PI * 2,
      dist = 70 + Math.random() * 130;
    p.style.cssText = `left:${x}px;top:${y}px;background:${COLORS[i % COLORS.length]};--x:${Math.cos(angle) * dist}px;--y:${
      Math.sin(angle) * dist - 60
    }px;--rot:${Math.random() * 720 - 360}deg;--delay:${Math.random() * 80}ms;${i % 3 ? "" : "border-radius:50%;"}`;
    layer.append(p);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 1500);
}

export function shake(el) {
  if (!el || reduced()) return;
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

// Subtle magnetic tilt on hero cards (desktop pointers only).
export function tilt(root) {
  if (reduced() || !window.matchMedia("(pointer:fine)").matches) return;
  root?.querySelectorAll("[data-tilt]").forEach((card) => {
    const area = card.closest("[data-tilt-area]") || card;
    area.addEventListener("pointermove", (e) => {
      const r = area.getBoundingClientRect(),
        dx = (e.clientX - r.left) / r.width - 0.5,
        dy = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--tx", `${dx * 10}deg`);
      card.style.setProperty("--ty", `${-dy * 10}deg`);
    });
    area.addEventListener("pointerleave", () => {
      card.style.setProperty("--tx", "0deg");
      card.style.setProperty("--ty", "0deg");
    });
  });
}

// Thin reading-progress bar at the top of the window.
const bar = () => document.querySelector(".scroll-progress i");
function updateScroll() {
  const el = bar();
  if (!el) return;
  const max = document.documentElement.scrollHeight - innerHeight;
  el.style.transform = `scaleX(${max > 40 ? Math.min(1, scrollY / max) : 0})`;
  document.body.classList.toggle("scrolled", scrollY > 8);
}
addEventListener("scroll", updateScroll, { passive: true });
addEventListener("resize", updateScroll, { passive: true });
export const refreshScroll = () => requestAnimationFrame(updateScroll);
