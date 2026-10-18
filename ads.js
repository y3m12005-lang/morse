// ─────────────────────────────────────────────────────────────────────────────
// MORSE ad placements
//
// Ads stay OFF until AdSense approves the site. To go live:
//   1. Put your publisher ID in `client` (looks like "ca-pub-1234567890123456").
//   2. Create ad units in AdSense and paste each numeric slot ID below.
//   3. Set up a certified consent (CMP) message in AdSense, then set
//      `consentReady: true` and `enabled: true`.
//
// Preview the layout before approval by opening the site with ?ads=preview
// (for example https://y3m12005-lang.github.io/morse/?ads=preview#learn).
// Normal visitors never see empty "reserved" boxes.
// ─────────────────────────────────────────────────────────────────────────────
export const adConfig = {
  enabled: false,
  consentReady: false,
  client: "",
  slots: {
    lessonRail: "", // 300×600 / 300×250 sticky rail beside lessons (desktop)
    lessonBanner: "", // responsive banner under the lesson (tablet & phone)
    side: "", // learning path right rail
    between: "", // learning path, under the lesson list
    footer: "", // bottom of public pages
  },
};

const preview = /[?&]ads=preview\b/.test(location.search);
const live = () => adConfig.enabled && adConfig.consentReady && /^ca-pub-\d{16}$/.test(adConfig.client);
const hasSlot = (name) => /^\d+$/.test(adConfig.slots[name] || "");
const requested = new Set();
let loader, pageObserver, lessonObserver;

function inner() {
  return `<span class="ad-label">Advertisement</span><div class="ad-content">${
    preview ? '<span class="ad-placeholder">Ad preview<small>Your ad will appear here</small></span>' : ""
  }</div>`;
}

function slot(name) {
  const section = document.createElement("aside");
  section.className = "ad-placement ad-" + name;
  section.setAttribute("aria-label", "Advertisement");
  section.dataset.placement = name;
  section.innerHTML = inner();
  return section;
}

// Lesson ads live OUTSIDE #main, so they survive every question re-render.
// Each one is requested once per page load and never refreshed.
function setupLessonAds() {
  const els = [
    [document.getElementById("lesson-ad-rail"), "lessonRail"],
    [document.getElementById("lesson-ad-banner"), "lessonBanner"],
  ];
  for (const [el, name] of els) {
    if (!el || el.dataset.ready) continue;
    el.dataset.ready = "1";
    el.dataset.placement = name;
    el.innerHTML = `<div class="ad-placement">${inner()}</div>`;
    if (live() && hasSlot(name)) {
      lessonObserver ||= new IntersectionObserver(
        (entries) => {
          for (const entry of entries)
            if (entry.isIntersecting) {
              lessonObserver.unobserve(entry.target);
              loadSlot(entry.target);
            }
        },
        { rootMargin: "200px" },
      );
      lessonObserver.observe(el);
    }
  }
}

function lessonAds(on) {
  const show = on && (preview || live());
  document.body.classList.toggle("lesson-ads-on", show);
  for (const id of ["lesson-ad-rail", "lesson-ad-banner"]) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (live() && !preview && !hasSlot(el.dataset.placement || "")) el.hidden = true;
    else el.hidden = !show;
  }
  if (show) setupLessonAds();
}

export function placeAds(page) {
  pageObserver?.disconnect();
  // Lessons and listening sessions: sticky rail on desktop, banner under the lesson on smaller screens.
  // Ads are never placed inside the question card, next to answer buttons, in the translator or sign-in.
  lessonAds(page === "lesson" || page === "session");
  if (!preview && !live()) return;
  const main = document.getElementById("main");
  if (!main) return;
  if (page === "learn") {
    main.querySelector(".right-rail")?.append(slot("side"));
    main.querySelector(".path-note")?.after(slot("between"));
  }
  if (["welcome", "about", "learn", "reference"].includes(page)) main.append(slot("footer"));
  if (!live()) return;
  pageObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          pageObserver.unobserve(entry.target);
          loadSlot(entry.target);
        }
    },
    { rootMargin: "100px" },
  );
  main.querySelectorAll(".ad-placement").forEach((el) => {
    const name = el.dataset.placement;
    if (requested.has(name) || !hasSlot(name)) {
      el.hidden = true;
      return;
    }
    pageObserver.observe(el);
  });
}

async function loadSlot(section) {
  const name = section.dataset.placement;
  if (requested.has(name) || !section.isConnected) return;
  // One request per placement per full page load. No automatic refresh or retry loop.
  requested.add(name);
  loader ||= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + adConfig.client;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
  try {
    await loader;
    if (!section.isConnected) return;
    const ad = document.createElement("ins");
    ad.className = "adsbygoogle";
    ad.style.display = "block";
    ad.dataset.adClient = adConfig.client;
    ad.dataset.adSlot = adConfig.slots[name];
    ad.dataset.adFormat = name === "lessonRail" ? "vertical" : "auto";
    ad.dataset.fullWidthResponsive = "true";
    section.querySelector(".ad-content").replaceChildren(ad);
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {
    section.hidden = true;
  }
}
