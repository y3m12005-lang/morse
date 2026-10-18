import { placeAds } from "./ads.js";
import { enterPage, reveal, countUp, confetti, shake, tilt, refreshScroll } from "./fx.js";
import { translate, translatorMarkup } from "./translate.js";
import {
  CODE,
  GROUPS,
  LESSONS,
  clean,
  symbols,
  blankState,
  readState,
  validateState,
  today,
  streak,
  nextLesson,
  unlocked,
  knownChars,
  makeQueue,
  recordAnswer,
} from "./core.js";
import { MorseAudio } from "./audio.js";
import { welcome, signup, privacy } from "./welcome.js";
import { authConfigured, watchAccount, googleSignIn, googleSignOut } from "./auth.js";
let account = null,
  guest = false,
  storageKey = "signal-school-v1";
const $ = (s) => document.querySelector(s),
  audio = new MorseAudio();
let state;
try {
  state = readState(localStorage);
} catch {
  state = blankState();
}
let storageWarning = false,
  session = null,
  playing = false,
  playVersion = 0,
  sendCode = "",
  sendTarget = "E",
  keyStarted = 0,
  keyPending = false,
  keyCanceled = false;
const icons = {
  book: '<path d="M3 4h7a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H3z"/><path d="M13 7a3 3 0 0 1 3-3h5v14h-4a4 4 0 0 0-4 3"/>',
  headphones:
    '<path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',
  radio: '<path d="M5 9a10 10 0 0 1 14 0M8 12a6 6 0 0 1 8 0M11 15a2 2 0 0 1 2 0"/><path d="M12 18v3"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  chart: '<path d="M4 3v17h17M8 15v-4M13 15V7M18 15V4"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
  flame: '<path d="M13 3c2 5-3 6-1 9 2-1 3-3 3-3s5 4 3 9c-2 5-12 4-12-2 0-4 3-6 3-6-1 5 2 5 2 3-2-5 2-10 2-10z"/>',
  volume: '<path d="m11 4-6 5H2v6h3l6 5zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  play: '<path d="m8 4 12 8-12 8z"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  repeat: '<path d="m17 2 4 4-4 4M21 6H8a5 5 0 0 0-5 5m4 11-4-4 4-4m-4 4h13a5 5 0 0 0 5-5"/>',
};
function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.radio}</svg>`;
}
function injectIcons() {
  document.querySelectorAll("[data-icon]").forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    storageWarning = true;
    toast("Storage is unavailable. Export your progress in settings before leaving.");
  }
  updateTopbar();
}
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("visible"), 4500);
}
function updateTopbar() {
  $("#streak").innerHTML = `${icon("flame")}${streak(state.days)} day streak`;
  if (storageWarning) $(".saved-note").textContent = "Session only · export to save";
}
function stopSound() {
  playVersion++;
  audio.stop();
  audio.keyUp();
  playing = false;
  keyCanceled = true;
  keyStarted = 0;
  document.querySelectorAll(".is-playing,.lit").forEach((el) => el.classList.remove("is-playing", "lit"));
}
function go(hash) {
  if (location.hash === "#" + hash) render();
  else location.hash = hash;
}
function heading(kicker, title, description, extra = "") {
  return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${description}</p></div>${extra}</div>`;
}
function chip(text, type = "") {
  return `<span class="chip ${type}">${text}</span>`;
}
function waveBars() {
  return `<span class="waveform" aria-hidden="true">${Array.from({ length: 23 }, (_, i) => `<i style="--h:${10 + (Math.sin(i * 1.7) + 1) * 16}px;--d:${i * 0.035}s"></i>`).join("")}</span>`;
}
function heroArt() {
  return `<div class="hero-art" aria-hidden="true"><div class="orbit o1"></div><div class="orbit o2"></div><div class="orbit o3"></div><div class="floating-symbol f1">· −</div><div class="floating-symbol f2">− · ·</div><div class="signal-device" data-tilt><span class="device-top"><i></i> SIGNAL FOUND</span><div class="device-wave">${waveBars()}</div><span class="device-bottom"><i></i><i></i><b>HELLO, POSSIBILITY.</b></span></div><span class="spark s1">✦</span><span class="spark s2">✦</span></div>`;
}
function home() {
  const next = nextLesson(state),
    done = Object.keys(state.completed).filter((k) => state.completed[k] >= 80).length,
    total = Object.values(state.stats).reduce((a, s) => a + s.total, 0),
    correct = Object.values(state.stats).reduce((a, s) => a + s.correct, 0);
  return `${heading("YOUR NEXT CHAPTER", "Small signals. Big possibilities.", "Learn to hear a whole new world, one little beep at a time.", `<span class="soft-tag">${icon("headphones")} Sound on. Curiosity on.</span>`)}
 <section class="hero" data-tilt-area><div class="hero-copy">${chip(done ? "KEEP YOUR MOMENTUM" : "START WITH ZERO. BUILD SOMETHING GREAT.", "light")}<h2>${done ? "Your next breakthrough<br>is a beep away." : "A new skill.<br>A different way to listen."}</h2><p>From your first dot to your first conversation.<br>Short lessons. Real progress. Your own pace.</p><a class="button primary" href="#lesson/${next.id}">${done ? "Continue learning" : "Start my first lesson"} ${icon("arrow")}</a><div class="hero-foot">${icon("clock")} About 3 minutes <span>•</span> No experience needed</div></div>${heroArt()}</section>
 <section class="stats-strip" aria-label="Learning statistics"><div><span class="stat-icon purple">${icon("book")}</span><span><b data-count="${done}">${done}<small> / ${LESSONS.length}</small></b><label>Lessons completed</label></span></div><div><span class="stat-icon orange">${icon("bolt")}</span><span><b data-count="${state.xp}">${state.xp.toLocaleString()}</b><label>Learning XP</label></span></div><div><span class="stat-icon green">${icon("check")}</span><span><b ${total ? `data-count="${Math.round((correct / total) * 100)}" data-suffix="%"` : ""}>${total ? Math.round((correct / total) * 100) + "%" : "—"}</b><label>Practice accuracy</label></span></div><div><span class="stat-icon blue">${icon("headphones")}</span><span><b data-count="${state.firstListen}">${state.firstListen}</b><label>First-listen wins</label></span></div></section>
 <div class="home-columns"><div><div class="section-heading"><h2>Your learning path</h2><span>${done} of ${LESSONS.length} complete</span></div><div class="path-tabs" role="group" aria-label="Lesson stages"><button class="active" data-action="stage" data-stage="First steps">First steps</button><button data-action="stage" data-stage="The alphabet">The alphabet</button><button data-action="stage" data-stage="Numbers & signs">Numbers & signs</button><button data-action="stage" data-stage="Real listening">Real listening</button><button data-action="stage" data-stage="Advanced">Advanced</button></div><div id="lesson-list">${lessonList("First steps")}</div><div class="path-note">${icon("lock")} Score 80% to unlock the next lesson. Revisit any completed lesson.</div></div><aside class="right-rail"><section class="daily-card"><div class="section-heading"><h3>A little every day</h3><span class="sun">☀</span></div><div class="goal-number">${Math.min(10, state.days[today()] || 0)}<small> / 10</small></div><p>Correct answers toward today's goal</p><div class="progress-track"><i style="width:${Math.min(100, (state.days[today()] || 0) * 10)}%"></i></div><span class="micro">${state.days[today()] >= 10 ? "Goal reached. Look at you go!" : "A few minutes is all it takes."}</span></section><section class="ear-card"><span class="illustration-ear">${icon("headphones")}</span><h3>Listen first.<br>Let the rhythm stick.</h3><p>Dots and dashes are training wheels. We’ll help you take them off, one step at a time.</p><a href="#practice" class="text-button">Explore the studio ${icon("arrow")}</a></section><section class="mini-tip"><span>GOOD TO KNOW</span><p>Morse is a code for letters and numbers. Learn the sound of each pattern, not a new language.</p></section></aside></div>`;
}
function lessonList(stage) {
  return LESSONS.filter((l) => l.stage === stage)
    .map((l) => {
      const open = unlocked(l.id, state),
        complete = state.completed[l.id] >= 80,
        current = nextLesson(state).id === l.id;
      return `<article class="lesson-row ${current ? "current" : ""} ${open ? "" : "locked"}"><span class="lesson-number ${complete ? "done" : ""}">${complete ? icon("check") : String(l.id + 1).padStart(2, "0")}</span><div class="lesson-info"><div><h3>${l.title}</h3>${current ? chip("UP NEXT") : ""}</div><p>${l.chars ? `<span class="letter-chips">${[...l.chars].map((c) => `<b>${esc(c)}</b>`).join("")}</span>` : l.description}</p><span class="micro">${complete ? `${state.completed[l.id]}% best · Ready to revisit` : l.type === "letters" ? "Meet the sounds · Guided practice" : l.type === "ears" || l.type === "final" ? "Listening only · 10 questions" : "Decode words · 10 questions"}</span></div>${open ? `<a class="${current ? "button primary small" : "round-link"}" href="#lesson/${l.id}" aria-label="${complete ? "Review" : "Start"} ${l.title}">${current ? "Start lesson" : ""}${icon(current ? "arrow" : complete ? "repeat" : "play")}</a>` : `<span class="lock-icon" title="Complete lesson ${l.id} with 80%">${icon("lock")}</span>`}</article>`;
    })
    .join("");
}
function lessonIntro(id) {
  const l = LESSONS[id];
  if (!l || !unlocked(id, state))
    return `${heading("ONE STEP AT A TIME", "This lesson is still ahead of you.", "Finish your current lesson with 80% to unlock the next one.")}<a href="#learn" class="button primary">Back to learning path ${icon("arrow")}</a>`;
  const ears = ["ears", "final"].includes(l.type);
  return `<a href="#learn" class="back-link">← Learning path</a>${heading(`LESSON ${String(id + 1).padStart(2, "0")} / ${l.stage.toUpperCase()}`, l.title, l.description)}<div class="intro-layout"><section class="panel lesson-intro"><div class="section-heading"><h2>${l.chars ? "Meet your new signals" : "A bigger listening challenge"}</h2>${chip(ears ? "AUDIO ONLY" : "LISTEN + SEE")}</div>${l.chars ? `<div class="character-intros">${[...l.chars].map((c) => `<button class="character-card" data-action="sound" data-text="${esc(c)}" aria-label="Listen to ${esc(c)}"><span>${esc(c)}</span><b>${symbols(c)}</b><small>${icon("volume")} Hear the pattern</small></button>`).join("")}</div>` : `<div class="large-wave">${waveBars()}</div><p class="intro-description">${ears ? "The symbols will stay hidden. Listen, replay if you need to, then type what you heard. Hinted answers help you learn but do not count toward the 80% listening pass mark." : "Listen for a slightly longer pause between letters, and an even longer pause between words. Type the complete message, including spaces."}</p>`}<div class="lesson-explainer"><span class="stat-icon purple">${icon("headphones")}</span><div><h3>${id === 0 ? "One short sound. One long sound." : "Hear the whole pattern."}</h3><p>${id === 0 ? "E is one short beep: “dit” (·). T is one long beep: “dah” (−). A dash lasts three times as long as a dot. Tap each card above to compare." : "Play each new sound a few times. Try saying its rhythm back to yourself. You will also hear some familiar signals during practice."}</p></div></div><button class="button primary" data-action="start-lesson" data-id="${id}">Let’s practice ${icon("arrow")}</button><span class="micro intro-bottom">10 questions · No timer · Mistakes are part of learning</span></section><aside class="panel how-card"><h3>Your simple learning loop</h3><ol><li><b>Listen</b><span>Hear a clear Morse signal.</span></li><li><b>Notice</b><span>Follow the dots and dashes while you are learning.</span></li><li><b>Type</b><span>Write the letter or message in the answer box.</span></li><li><b>Build confidence</b><span>Replay, review, and gradually turn off the hints.</span></li></ol><div class="note">We start with crisp signals and extra thinking space. You can change the speed and tone in settings.</div></aside></div>`;
}
function buildSession(lesson, custom = false, mode = "guided") {
  stopSound();
  session = {
    lesson,
    custom,
    queue: makeQueue(lesson, state),
    index: 0,
    results: [],
    plays: 0,
    hint: false,
    answered: false,
    mode: ["ears", "final"].includes(lesson.type) ? "ears" : mode,
  };
  state.lastLesson = lesson.id ?? state.lastLesson;
  save();
  go("session");
}
function visualOn() {
  return (session.mode !== "ears" && (session.mode === "visual" || session.index < 5)) || session.hint || session.answered;
}
function renderMarks(text) {
  let index = 0;
  return `<div class="morse-marks" aria-label="Morse symbols">${[...text].map((c) => (c === " " ? '<span class="word-gap">/</span>' : `<span class="symbol-group">${[...CODE[c]].map((mark) => `<i class="mark ${mark === "." ? "dot" : "dash"}" data-mark="${index++}"><span class="sr-only">${mark === "." ? "dot " : "dash "}</span></i>`).join("")}</span>`)).join("")}</div>`;
}
function sessionView() {
  if (!session) return home();
  if (session.index >= session.queue.length) return resultView();
  const target = session.queue[session.index],
    show = visualOn();
  return `<div class="exercise-top"><a href="${session.custom ? "#practice" : "#learn"}" class="back-link">← ${session.custom ? "Practice studio" : "Learning path"}</a><span>${session.custom ? "PERSONAL PRACTICE" : `LESSON ${String(session.lesson.id + 1).padStart(2, "0")}`} / ${esc(session.lesson.title)}</span><button class="text-button" data-action="settings">${icon("settings")} Settings</button></div><div class="exercise-progress"><span>Question ${session.index + 1} <small>of ${session.queue.length}</small></span><div class="progress-track"><i style="width:${(session.index / session.queue.length) * 100}%"></i></div><span>${session.results.filter((r) => r.correct).length} correct</span></div><section class="exercise panel"><div class="eyebrow">${session.mode === "ears" ? "TRUST YOUR EARS" : show ? "LISTEN. NOTICE. DECODE." : "YOUR TURN TO LISTEN WITHOUT HINTS"}</div><h1>What did you hear?</h1><p class="exercise-sub">${target.length === 1 ? "Listen to the signal, then type the letter or symbol." : "Listen to the complete signal, then type the word or message."}</p><div id="signal-area" class="signal-area">${show ? renderMarks(target) : `<div class="hidden-signal">${waveBars()}<span>The rhythm is your clue.</span></div>`}</div><button id="play-signal" class="button play-button ${session.plays || session.answered ? "" : "pulse"}" data-action="play-question">${icon("play")} ${session.plays ? "Replay signal" : "Play signal"} <kbd>Alt + R</kbd></button><p class="micro" id="play-status" role="status">${session.plays ? `Played ${session.plays} ${session.plays === 1 ? "time" : "times"}. Take your time.` : "Press play to begin. Sound starts only when you are ready."}</p><form id="answer-form" class="answer-form"><label for="answer">Your ${target.length === 1 ? "answer" : "message"}</label><input id="answer" name="answer" type="text" placeholder="${target.length === 1 ? "?" : "Type what you hear…"}" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="40" ${session.answered ? "disabled" : ""} aria-describedby="answer-feedback"><button class="button primary" type="submit" ${session.answered ? "disabled" : ""}>Check answer ${icon("arrow")}</button></form><div id="answer-feedback" class="feedback" aria-live="polite">${session.answered ? feedbackHTML() : ""}</div>${session.answered ? `<button class="button primary next-button" data-action="next-question">${session.index === session.queue.length - 1 ? "See my results" : "Next signal"} ${icon("arrow")}</button>` : `<div class="exercise-help"><button class="text-button" data-action="hint">${show ? "Explain this pattern" : "Show the dots & dashes"}</button><span>•</span><button class="text-button" data-action="skip">I’m not sure</button></div>`}</section><div class="exercise-caption">${icon("headphones")} ${show ? "Follow the rhythm, not just the number of beeps." : "A replay is always okay. Recognition comes with repetition."}</div>`;
}
function feedbackHTML() {
  const r = session.results.at(-1),
    target = session.queue[session.index];
  return `<div class="feedback-box ${r.correct ? "correct" : "incorrect"}"><strong>${r.correct ? (r.assisted ? "Right, with a little help." : "That’s it. Nice listening!") : `This one was ${esc(target)}.`}</strong><span>${r.correct ? (r.assisted ? "Good practice. Try it without the hint next time for an independent listening point." : r.first ? "Recognized on the first listen. +10 XP" : "You recognized the signal. +10 XP") : `${esc(symbols(target))} · Play it again and connect the sound to ${esc(target)}. Mistakes help us choose your review.`}</span></div>`;
}
async function playQuestion() {
  if (!session || session.index >= session.queue.length) return;
  if (playing) {
    stopSound();
    $("#play-status").textContent = "Playback stopped. Replay when ready.";
    $("#play-signal").innerHTML = `${icon("play")} Replay signal`;
    return;
  }
  const version = ++playVersion;
  playing = true;
  session.plays++;
  $("#play-signal").innerHTML = `${icon("volume")} Stop signal`;
  $("#play-signal").classList.remove("pulse");
  $(" .signal-area")?.classList.add("is-playing");
  $("#play-status").textContent = "Listening…";
  try {
    const completed = await audio.play(session.queue[session.index], state.settings, (index, on) => {
      if (version !== playVersion) return;
      const el = document.querySelector(`[data-mark="${index}"]`);
      el?.classList.toggle("lit", on);
    });
    if (version !== playVersion) return;
    playing = false;
    $(".signal-area")?.classList.remove("is-playing");
    if ($("#play-signal")) $("#play-signal").innerHTML = `${icon("repeat")} Replay signal <kbd>Alt + R</kbd>`;
    if ($("#play-status"))
      $("#play-status").textContent = completed ? "Your turn. What did you hear?" : "Stopped. Replay the full signal when ready.";
    if (completed && !session.answered) $("#answer")?.focus();
  } catch (error) {
    playing = false;
    toast(error.message);
    if ($("#play-status")) $("#play-status").textContent = error.message;
    if ($("#play-signal")) $("#play-signal").innerHTML = `${icon("play")} Try audio again`;
    session.plays = Math.max(0, session.plays - 1);
  }
}
function answer(value, skip = false) {
  if (!session || session.answered) return;
  if (playing) {
    toast("Let the signal finish, or press Stop before answering.");
    return;
  }
  if (!session.plays && !skip) {
    toast("Play the signal first. Your ears are doing the learning.");
    return;
  }
  const target = session.queue[session.index],
    correct = !skip && clean(value) === target,
    assisted = session.mode === "ears" && session.hint,
    first = correct && !visualOn() && session.plays === 1;
  session.results.push({ target, answer: clean(value), correct, assisted, first, replays: Math.max(0, session.plays - 1) });
  session.answered = true;
  recordAnswer(state, target, correct, first);
  save();
  renderSession();
  if (correct) confetti($(".feedback-box"), first ? 34 : 20);
  else shake($(".feedback-box"));
  $(".next-button")?.focus();
}
let shownQuestion = -1;
function renderSession() {
  $("#main").innerHTML = sessionView();
  injectIcons();
  placeAds("session");
  const finished = session.index >= session.queue.length;
  if (finished) {
    const result = $(".result");
    reveal($("#main"));
    countUp(result);
    if (result?.classList.contains("passed")) setTimeout(() => confetti($(".result-emblem"), 60), 250);
  } else if (shownQuestion !== session.index) $(".exercise")?.classList.add("question-enter");
  shownQuestion = finished ? -1 : session.index;
}
function completeSession() {
  const earned = session.results.filter((r) => r.correct && !r.assisted).length,
    accuracy = Math.round((earned / session.queue.length) * 100);
  if (!session.custom && accuracy >= 80) state.completed[session.lesson.id] = Math.max(state.completed[session.lesson.id] || 0, accuracy);
  state.history.push({ date: today(), accuracy, total: session.queue.length, label: session.lesson.title });
  state.history = state.history.slice(-60);
  save();
}
function resultView() {
  const correct = session.results.filter((r) => r.correct).length,
    score = Math.round((session.results.filter((r) => r.correct && !r.assisted).length / session.queue.length) * 100),
    pass = score >= 80,
    first = session.results.filter((r) => r.first).length;
  return `<section class="result panel ${pass ? "passed" : ""}"><span class="result-emblem">${icon(pass ? "star" : "headphones")}</span><div class="eyebrow">SESSION COMPLETE</div><h1>${pass ? "Look at you, learning a new skill." : "Every signal is a step forward."}</h1><p>${session.custom ? "A little practice today makes tomorrow’s signals more familiar." : pass ? "Lesson complete. Your next step is ready when you are." : "Aim for 80% to move on. Replay the patterns below, then try again."}</p><div class="result-stats"><div><b data-count="${score}" data-suffix="%">${score}%</b><span>${session.mode === "ears" ? "Unhinted accuracy" : "Accuracy"}</span></div><div><b>${correct}/${session.queue.length}</b><span>Correct answers</span></div><div><b>${first}</b><span>First-listen wins</span></div></div><div class="button-row">${!session.custom && pass && session.lesson.id < LESSONS.length - 1 ? `<a class="button primary" href="#lesson/${session.lesson.id + 1}">Next lesson ${icon("arrow")}</a>` : ""}<button class="button ${pass ? "secondary" : "primary"}" data-action="retry-session">Practice again ${icon("repeat")}</button><a href="#learn" class="text-button">Back to my path</a></div><div class="result-review"><h3>Your signals, one more time</h3><div>${session.results.map((r) => `<button class="review-chip ${r.correct ? "" : "needs-review"}" data-action="sound" data-text="${esc(r.target)}">${icon(r.correct ? "check" : "repeat")}<b>${esc(r.target)}</b><span>${esc(symbols(r.target))}</span>${icon("volume")}</button>`).join("")}</div></div><p class="micro">A first-listen win means a correct answer with no visual hint and no replay.</p></section>`;
}
function practice() {
  return `${heading("YOUR PRACTICE STUDIO", "Make the rhythm your own.", "Choose what to hear and how much help you want. No locked levels here.")}<div class="practice-layout"><form class="panel practice-form" id="practice-form"><h2>A session, your way</h2><label for="practice-set">What would you like to practice?</label><select id="practice-set"><option value="known">My learned letters (${esc(knownChars(state))})</option><option value="weak">My tricky signals</option><option value="all">The whole alphabet</option><option value="numbers">Numbers 0–9</option><option value="words">Short words</option><option value="phrases">Short messages</option></select><label for="practice-mode">How would you like to learn?</label><select id="practice-mode"><option value="visual">Sound + dots and dashes</option><option value="guided">Guided: hints fade halfway through</option><option value="ears">Sound only: train your ears</option></select><div class="note">10 signals. No countdown. Replay any time. Tricky-signal practice favors patterns you have missed.</div><button class="button primary" type="submit">Start practicing ${icon("play")}</button></form><section class="panel practice-note"><span class="big-line-icon">${icon("headphones")}</span><h2>From seeing<br>to simply knowing.</h2><p>First connect the sound to its symbols. Then hide the symbols. Let each letter become a small, familiar rhythm.</p><div class="mini-steps"><span>01 · See + hear</span><span>02 · Hear + type</span><span>03 · Recognize</span></div><p class="micro">Go slowly enough to succeed. Increase the speed only when a session feels comfortable.</p></section></div>`;
}
function reference() {
  return `${heading("THE MORSE LIBRARY", "Every signal has a sound.", "Tap any card to hear it. Keep this nearby while you find your rhythm.")}<div class="library-toolbar"><label class="search-label">Find a signal<input id="library-search" placeholder="Search a letter, number, or pattern…" type="search"></label><span class="soft-tag">${icon("volume")} Tap to listen</span></div><div id="library-grid" class="library-grid">${libraryCards("")}</div><section class="panel timing-guide"><h2>The rhythm behind the code</h2><div class="timing-grid"><div><b>·</b><strong>Dot / dit</strong><p>One unit of sound.</p></div><div><b>−</b><strong>Dash / dah</strong><p>Three units of sound.</p></div><div><b>1 : 3 : 7</b><strong>Space matters</strong><p>1 unit within a letter, 3 between letters, 7 between words.</p></div></div><p class="micro">Learning mode adds extra space between letters and words, while keeping each character’s rhythm intact. Set the gap to 1× for standard spacing.</p><a class="text-button" href="https://www.itu.int/rec/R-REC-M.1677-1-200910-I/" target="_blank" rel="noopener">Based on ITU International Morse code M.1677 ↗</a></section><section class="note prosign-note"><strong>A note about SOS</strong><p>SOS is the continuous distress pattern ···−−−···, with no letter gaps. Ordinary text practice plays S, O, and S as separate letters. The course teaches A–Z, digits, and the listed punctuation; operational prosigns and radio procedures are a further step.</p></section>`;
}
function libraryCards(query) {
  const q = clean(query).replaceAll("_", "-").replaceAll("−", "-").replaceAll("·", ".");
  const entries = Object.entries(CODE).sort(([a], [b]) => a.localeCompare(b));
  return (
    entries
      .filter(([c, p]) => !q || c.includes(q) || p.includes(q))
      .map(
        ([c, p]) =>
          `<button class="library-card" data-action="sound" data-text="${esc(c)}" aria-label="Hear ${esc(c)}"><span>${esc(c)}</span><b>${esc(p.replaceAll("-", "−").replaceAll(".", "·"))}</b>${icon("volume")}</button>`,
      )
      .join("") || "<p>No matching signals. Try a letter such as A, or a pattern such as .-</p>"
  );
}
function sender() {
  return `${heading("LEARN TO SEND", "You make the signal.", "Learn the other half of Morse: turning a letter into a rhythm.")}<div class="send-layout"><section class="panel keyer"><div class="section-heading"><h2>Your sending desk</h2>${chip("HANDS-ON PRACTICE")}</div><p class="micro">Send this letter</p><div class="send-target" id="send-target">${sendTarget}</div><button class="text-button" data-action="sender-hint">Hear a reminder ${icon("volume")}</button><div id="keyer-output" class="keyer-output" aria-live="polite">Your signal appears here</div><button id="straight-key" class="straight-key" aria-label="Morse key: hold briefly for a dot, longer for a dash"><span class="key-cap"></span><b>Hold to beep</b><small>or hold Space</small></button><div class="keyer-buttons"><button class="button secondary" data-action="dot">· Dot</button><button class="button secondary" data-action="dash">− Dash</button><button class="text-button" data-action="clear-send">Clear</button></div><button class="button primary" data-action="check-send">Check my signal ${icon("check")}</button><div id="send-feedback" class="feedback" role="status"></div><button class="text-button" data-action="next-send">Try another letter →</button></section><aside class="panel how-card"><h3>A little rhythm lesson</h3><p>A short press makes a dot. A longer press makes a dash. A dash should last about three dots.</p><p>Start with the Dot and Dash buttons if holding the key feels tricky. Listen to their lengths, then try the real key.</p><div class="note">The letter check looks at your dot-and-dash pattern. It does not grade exact spacing yet.</div><label for="sender-set">Practice set</label><select id="sender-set"><option value="known">My learned letters</option><option value="all">Whole alphabet</option></select><hr><h3>Aim for a comfortable pace</h3><p>Take a short breath between letters. Sending clearly matters more than sending quickly.</p></aside></div>`;
}
function progress() {
  const totals = Object.values(state.stats).reduce((a, s) => ({ total: a.total + s.total, correct: a.correct + s.correct }), {
      total: 0,
      correct: 0,
    }),
    done = Object.keys(state.completed).filter((k) => state.completed[k] >= 80).length;
  const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      return { key: today(d), label: d.toLocaleDateString("en", { weekday: "short" }) };
    }),
    max = Math.max(10, ...dates.map((d) => state.days[d.key] || 0));
  return `${heading("YOUR PROGRESS", "Look how far you’re listening.", "A personal record of the small sessions that add up.")}<div class="progress-summary"><article class="panel"><span>Lessons complete</span><b>${done}<small>/${LESSONS.length}</small></b></article><article class="panel"><span>Character accuracy</span><b>${totals.total ? Math.round((totals.correct / totals.total) * 100) + "%" : "—"}</b></article><article class="panel"><span>Current streak</span><b>${streak(state.days)}<small> days</small></b></article><article class="panel"><span>Learning XP</span><b>${state.xp}</b></article></div><div class="progress-columns"><section class="panel activity"><h2>Your week in signals</h2><p>Correct answers per day</p><div class="bar-chart">${dates.map((d) => `<div><span>${state.days[d.key] || 0}</span><i style="height:${Math.max(3, ((state.days[d.key] || 0) / max) * 130)}px"></i><small>${d.label}</small></div>`).join("")}</div></section><section class="panel"><h2>Little milestones</h2><div class="badges">${[
    ["First signal", state.xp >= 10, "radio"],
    ["50 correct", totals.correct >= 50, "bolt"],
    ["Alphabet explorer", Object.keys(state.completed).filter((k) => Number(k) < 12 && state.completed[k] >= 80).length === 12, "book"],
    ["10 first listens", state.firstListen >= 10, "headphones"],
  ]
    .map(
      ([name, earned, i]) =>
        `<div class="badge ${earned ? "earned" : ""}">${icon(i)}<strong>${name}</strong><span>${earned ? "Earned" : "Keep practicing"}</span></div>`,
    )
    .join(
      "",
    )}</div></section></div><section class="panel"><div class="section-heading"><h2>Your signal confidence</h2><button class="text-button" data-action="review">Review tricky signals →</button></div><p class="micro">A signal turns green after at least 5 attempts with 80% accuracy. This is practice history, not a fluency certification.</p><div class="confidence-grid">${[
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  ]
    .map((c) => {
      const st = state.stats[c],
        pct = st ? Math.round((st.correct / st.total) * 100) : 0;
      return `<button data-action="sound" data-text="${c}" class="${st ? (st.total >= 5 && pct >= 80 ? "confident" : "learning") : ""}" title="${st ? `${st.correct}/${st.total} correct` : "Not practiced yet"}">${c}<small>${st ? pct + "%" : "—"}</small></button>`;
    })
    .join("")}</div></section><section class="panel recent"><h2>Recent sessions</h2>${
    state.history.length
      ? `<div class="session-table"><div class="table-head"><span>Session</span><span>Date</span><span>Accuracy</span></div>${[
          ...state.history,
        ]
          .reverse()
          .slice(0, 8)
          .map((h) => `<div><strong>${esc(h.label)}</strong><span>${esc(h.date)}</span><b>${h.accuracy}%</b></div>`)
          .join("")}</div>`
      : '<div class="empty-state">Your story starts with one signal. Complete a lesson or practice session to see it here.<a class="button primary small" href="#lesson/0">Start learning →</a></div>'
  }</section><p class="micro">Progress belongs to this browser. Export a backup in Sound & settings to keep it or move devices.</p>`;
}
function render() {
  const hash = location.hash.slice(1) || "welcome";
  stopSound();
  if (hash !== "session") session = null;
  const page = hash.split("/")[0];
  const publicPage = ["welcome", "signup", "privacy", "about"].includes(page);
  document.body.classList.toggle("public-page", publicPage);
  const active = page === "lesson" || page === "session" ? "learn" : page;
  document.querySelectorAll("[data-nav]").forEach((a) => {
    a.classList.toggle("active", a.dataset.nav === active);
    if (a.dataset.nav === active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  $("#breadcrumb").textContent =
    {
      learn: "Your learning / Overview",
      lesson: "Your learning / Lesson",
      session: "Your learning / Listening practice",
      practice: "Your learning / Practice studio",
      send: "Your learning / Sending desk",
      reference: "Your learning / Morse library",
      progress: "Your learning / Progress",
    }[page] || "Your learning";
  $("#main").innerHTML =
    page === "welcome" || page === "about"
      ? welcome(icon)
      : page === "signup"
        ? signup(icon, authConfigured)
        : page === "privacy"
          ? privacy()
          : page === "lesson"
            ? lessonIntro(Number(hash.split("/")[1]))
            : page === "session"
              ? sessionView()
              : page === "practice"
                ? practice()
                : page === "send"
                  ? sender()
                  : page === "reference"
                    ? reference()
                    : page === "progress"
                      ? progress()
                      : home();
  injectIcons();
  updateTopbar();
  window.scrollTo({ top: 0, behavior: "instant" });
  if (page === "send") bindKeyer();
  if (page === "about") document.getElementById("how-it-works")?.scrollIntoView();
  placeAds(page);
  if (page === "session") shownQuestion = session ? session.index : -1;
  enterPage($("#main"));
  reveal($("#main"));
  countUp($("#main"));
  tilt($("#main"));
  refreshScroll();
}
function settings() {
  stopSound();
  const s = state.settings;
  $("#settings-dialog").innerHTML =
    `<div class="dialog-heading"><div><div class="eyebrow">MAKE YOURSELF COMFORTABLE</div><h2 id="settings-title">Sound & settings</h2></div><button class="icon-button" data-action="close-settings" aria-label="Close settings">×</button></div><form id="settings-form"><label for="speed">Character speed <output id="speed-value">${s.wpm} WPM</output></label><input id="speed" type="range" min="8" max="30" value="${s.wpm}" name="wpm"><p class="micro">The speed within each letter. 18 WPM is a crisp starting rhythm.</p><label for="gap">Thinking space <output id="gap-value">${s.gap}×</output></label><input id="gap" type="range" min="1" max="4" step=".5" value="${s.gap}" name="gap"><p class="micro">Extra time between letters and words. 1× uses standard Morse spacing.</p><label for="tone">Tone <output id="tone-value">${s.tone} Hz</output></label><input id="tone" type="range" min="400" max="900" step="25" value="${s.tone}" name="tone"><label for="volume">Volume <output id="volume-value">${Math.round(s.volume * 100)}%</output></label><input id="volume" type="range" min=".05" max=".7" step=".05" value="${s.volume}" name="volume"><div class="button-row"><button type="button" class="button secondary" data-action="test-sound">${icon("volume")} Test sound</button><button class="button primary" type="submit">Save settings</button></div></form><div class="backup-section"><h3>Your progress, your device</h3><p class="micro">No account needed. Export a backup before clearing browser data. Import replaces the progress stored on this device.</p><div class="button-row"><button class="text-button" data-action="export">Export progress ↓</button><label class="text-button import-label">Import backup ↑<input type="file" accept="application/json,.json" id="import-progress"></label></div><div id="import-confirm"></div></div>`;
  $("#settings-dialog").showModal();
}
function settingsValues() {
  const form = $("#settings-form");
  return {
    wpm: Number(form.elements.wpm.value),
    gap: Number(form.elements.gap.value),
    tone: Number(form.elements.tone.value),
    volume: Number(form.elements.volume.value),
  };
}
async function sound(text, settingsOverride) {
  try {
    await audio.play(text, settingsOverride || state.settings);
  } catch (e) {
    toast(e.message);
  }
}
function updateSending() {
  const el = $("#keyer-output");
  if (el) el.textContent = sendCode ? sendCode.replaceAll(".", "·").replaceAll("-", "−").split("").join(" ") : "Your signal appears here";
}
function addMark(mark) {
  if (sendCode.length >= 8) {
    toast("Clear your signal to start a new pattern.");
    return;
  }
  sendCode += mark;
  updateSending();
  if ($("#send-feedback")) $("#send-feedback").innerHTML = "";
}
async function startKey() {
  if (keyStarted || keyPending) return;
  keyPending = true;
  keyCanceled = false;
  stopSound();
  keyCanceled = false;
  keyStarted = performance.now();
  $("#straight-key")?.classList.add("pressed");
  try {
    await audio.keyDown(state.settings);
    if (keyCanceled) audio.keyUp();
  } catch (e) {
    toast(e.message);
  } finally {
    keyPending = false;
  }
}
function endKey() {
  if (!keyStarted && !keyPending) return;
  const length = performance.now() - keyStarted;
  keyCanceled = true;
  audio.keyUp();
  keyStarted = 0;
  $("#straight-key")?.classList.remove("pressed");
  if (length > 10) addMark(length > 2 * (1200 / state.settings.wpm) ? "-" : ".");
}
function bindKeyer() {
  const el = $("#straight-key");
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    startKey();
  });
  el.addEventListener("pointerup", endKey);
  el.addEventListener("pointercancel", () => {
    audio.keyUp();
    keyStarted = 0;
    keyCanceled = true;
    el.classList.remove("pressed");
  });
}
let pendingImport = null;
document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "translator") {
    openTranslator();
  } else if (action === "google-signin") {
    button.disabled = true;
    try {
      await googleSignIn();
      go("learn");
    } catch (e) {
      const status = $("#auth-status");
      if (status) status.textContent = e.message;
      toast(e.message);
    } finally {
      button.disabled = false;
    }
  } else if (action === "guest") {
    guest = true;
    go("learn");
  } else if (action === "account") {
    if (account) {
      await googleSignOut();
      go("welcome");
    } else go("signup");
  } else if (action === "settings") settings();
  else if (action === "close-settings") {
    $("#settings-dialog").close();
    stopSound();
  } else if (action === "stage") {
    document.querySelectorAll('[data-action="stage"]').forEach((b) => b.classList.toggle("active", b === button));
    $("#lesson-list").innerHTML = lessonList(button.dataset.stage);
    injectIcons();
    reveal($("#lesson-list"));
  } else if (action === "start-lesson") buildSession(LESSONS[Number(button.dataset.id)]);
  else if (action === "sound") {
    button.classList.add("auditioning");
    await sound(button.dataset.text);
    button.classList.remove("auditioning");
  } else if (action === "play-question") playQuestion();
  else if (action === "hint" && session) {
    session.hint = true;
    if (visualOn() && session.index < 5 && session.mode !== "ears")
      toast("A dot is a short “dit”; a dash is a longer “dah”. Listen to the complete rhythm.");
    stopSound();
    renderSession();
  } else if (action === "skip") answer("", true);
  else if (action === "next-question") {
    stopSound();
    session.index++;
    session.plays = 0;
    session.hint = false;
    session.answered = false;
    if (session.index === session.queue.length) completeSession();
    renderSession();
    $("#play-signal")?.focus();
  } else if (action === "retry-session") buildSession(session.lesson, session.custom, session.mode);
  else if (action === "review") {
    const learned = knownChars(state),
      chars = [...learned]
        .sort((a, b) => {
          const x = state.stats[a],
            y = state.stats[b];
          return (x ? x.correct / x.total : 0) - (y ? y.correct / y.total : 0);
        })
        .slice(0, 6)
        .join("");
    buildSession({ title: "Tricky signals", chars, id: 0, type: "letters" }, true, "guided");
  } else if (action === "test-sound") sound("ET", settingsValues());
  else if (action === "export") {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `morse-progress-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else if (action === "confirm-import" && pendingImport) {
    state = pendingImport;
    pendingImport = null;
    save();
    $("#settings-dialog").close();
    render();
    toast("Your progress has been restored.");
  } else if (action === "cancel-import") {
    pendingImport = null;
    $("#import-confirm").innerHTML = "";
  } else if (action === "sender-hint") sound(sendTarget);
  else if (action === "dot" || action === "dash") {
    addMark(action === "dot" ? "." : "-");
    sound(action === "dot" ? "E" : "T");
  } else if (action === "clear-send") {
    sendCode = "";
    updateSending();
    $("#send-feedback").innerHTML = "";
  } else if (action === "check-send") {
    if (!sendCode) {
      toast("Make a signal first.");
      return;
    }
    const correct = sendCode === CODE[sendTarget];
    $("#send-feedback").innerHTML =
      `<div class="feedback-box ${correct ? "correct" : "incorrect"}"><strong>${correct ? "Clear signal. That’s " + sendTarget + "!" : "Not quite. Here is " + sendTarget + ":"}</strong><span>${symbols(sendTarget)} · ${correct ? "Try another letter when you are ready." : "Listen to the reminder, clear, and try again."}</span></div>`;
    if (correct) confetti($("#send-feedback .feedback-box"), 22);
    else shake($("#send-feedback .feedback-box"));
  } else if (action === "next-send") {
    const pool = $("#sender-set").value === "all" ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : knownChars(state);
    const choices = [...pool].filter((c) => c !== sendTarget);
    sendTarget = choices[Math.floor(Math.random() * choices.length)] || pool[0];
    sendCode = "";
    $("#send-target").textContent = sendTarget;
    updateSending();
    $("#send-feedback").innerHTML = "";
  }
});
document.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.id === "answer-form") answer(form.elements.answer.value);
  else if (form.id === "settings-form") {
    state.settings = settingsValues();
    save();
    stopSound();
    $("#settings-dialog").close();
    toast("Sound settings saved.");
    if (session) renderSession();
  } else if (form.id === "practice-form") {
    const set = $("#practice-set").value,
      mode = $("#practice-mode").value;
    let lesson = { id: 0, type: "letters", title: "Personal practice", chars: knownChars(state) };
    if (set === "all") lesson.chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    else if (set === "numbers") lesson.chars = "0123456789";
    else if (set === "words") lesson = { ...LESSONS[16] };
    else if (set === "phrases") lesson = { ...LESSONS[18] };
    else if (set === "weak")
      lesson.chars = [...knownChars(state)]
        .sort((a, b) => {
          const x = state.stats[a],
            y = state.stats[b];
          return (x ? x.correct / x.total : 0) - (y ? y.correct / y.total : 0);
        })
        .slice(0, 6)
        .join("");
    buildSession(lesson, true, mode);
  }
});
document.addEventListener("input", (event) => {
  const el = event.target;
  if (el.id === "library-search") {
    $("#library-grid").innerHTML = libraryCards(el.value);
    reveal($("#library-grid"));
  }
  if (el.closest("#settings-form")) {
    const settings = settingsValues();
    $("#speed-value").textContent = settings.wpm + " WPM";
    $("#gap-value").textContent = settings.gap + "×";
    $("#tone-value").textContent = settings.tone + " Hz";
    $("#volume-value").textContent = Math.round(settings.volume * 100) + "%";
  }
});
document.addEventListener("change", async (event) => {
  if (event.target.id !== "import-progress") return;
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 1000000) throw new Error("Choose a progress file smaller than 1 MB.");
    pendingImport = validateState(JSON.parse(await file.text()));
    $("#import-confirm").innerHTML =
      '<div class="note">Replace this device’s progress with the selected backup?</div><div class="button-row"><button class="button primary small" data-action="confirm-import">Restore backup</button><button class="text-button" data-action="cancel-import">Cancel</button></div>';
  } catch (error) {
    toast(error.message);
  }
});
document.addEventListener("keydown", (event) => {
  if (event.altKey && event.key.toLowerCase() === "r" && session) {
    event.preventDefault();
    playQuestion();
  }
  if (
    location.hash === "#send" &&
    !$("#settings-dialog").open &&
    event.code === "Space" &&
    !/INPUT|SELECT|TEXTAREA/.test(event.target.tagName)
  ) {
    event.preventDefault();
    if (!event.repeat) startKey();
  }
});
document.addEventListener("keyup", (event) => {
  if (event.code === "Space" && location.hash === "#send") {
    event.preventDefault();
    endKey();
  }
});
window.addEventListener("blur", () => {
  audio.keyUp();
  keyStarted = 0;
  keyCanceled = true;
  $("#straight-key")?.classList.remove("pressed");
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopSound();
});
$("#settings-dialog").addEventListener("close", () => {
  stopSound();
  if (session) renderSession();
});
window.addEventListener("hashchange", render);
render();
watchAccount((user) => {
  account = user;
  storageKey = user ? "morse-progress:" + user.uid : "signal-school-v1";
  try {
    state = readState({ getItem: () => localStorage.getItem(storageKey) });
  } catch {
    state = blankState();
  }
  const button = $(".account-button");
  if (button) button.textContent = user ? "Sign out" : "Sign in";
  if (user && location.hash === "#signup") go("learn");
  else render();
});

function openTranslator() {
  stopSound();
  const dialog = $("#translator-dialog");
  dialog.innerHTML = translatorMarkup();
  dialog.showModal();
  let result = translate("");
  const refresh = () => {
    audio.stop();
    result = translate($("#translate-input").value, $("#translate-mode").value);
    $("#translate-output").value = result.text;
    $("#translate-detected").textContent = result.mode === "decode" ? "Morse → English" : "English → Morse";
    $("#translate-status").textContent = result.errors.length
      ? "Please check: " + result.errors.join(", ") + ". Unknown signals appear as �."
      : "Separate Morse letters with spaces and words with /.";
    $("#translate-play").disabled = !result.plain || !!result.errors.length;
    $("#translate-copy").disabled = !result.text;
  };
  $("#translate-input").addEventListener("input", refresh);
  $("#translate-mode").addEventListener("change", refresh);
  $("#translator-close").onclick = () => dialog.close();
  $("#translate-stop").onclick = () => audio.stop();
  $("#translate-clear").onclick = () => {
    $("#translate-input").value = "";
    refresh();
    $("#translate-input").focus();
  };
  $("#translate-swap").onclick = () => {
    if (result.errors.length) {
      toast("Fix the highlighted input before swapping.");
      return;
    }
    $("#translate-input").value = result.text;
    $("#translate-mode").value = result.mode === "encode" ? "decode" : "encode";
    refresh();
  };
  $("#translate-play").onclick = () => sound(result.plain);
  $("#translate-copy").onclick = async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      toast("Translation copied.");
    } catch {
      $("#translate-output").select();
      toast("Select and copy the translation using your keyboard.");
    }
  };
  refresh();
  $("#translate-input").focus();
}
$("#translator-dialog").addEventListener("close", () => audio.stop());
