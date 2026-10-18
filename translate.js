import { CODE, clean } from "./core.js";
const reverse = Object.fromEntries(Object.entries(CODE).map(([letter, code]) => [code, letter]));
export function translate(input, direction = "auto") {
  const normalized = String(input)
    .replace(/[·•]/g, ".")
    .replace(/[_−–—]/g, "-")
    .trim();
  const mode = direction === "auto" ? (/^[.\-\s/|]+$/.test(normalized) ? "decode" : "encode") : direction;
  if (!normalized) return { text: "", plain: "", errors: [], mode };
  const errors = [];
  if (mode === "encode") {
    const plain = clean(input).replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
    const text = plain
      .split(" ")
      .map((word) =>
        [...word]
          .map((c) => {
            if (CODE[c]) return CODE[c];
            errors.push(c);
            return "�";
          })
          .join(" "),
      )
      .join(" / ");
    return { text, plain, errors: [...new Set(errors)], mode };
  }
  const text = normalized
    .replace(/\s*[|/]\s*|\n+| {3,}/g, " / ")
    .split(/\s*\/\s*/)
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((code) => {
          if (reverse[code]) return reverse[code];
          errors.push(code);
          return "�";
        })
        .join(""),
    )
    .filter(Boolean)
    .join(" ");
  return { text, plain: text, errors: [...new Set(errors)], mode };
}
export function translatorMarkup() {
  return `<div class="dialog-heading"><div><div class="eyebrow">THE SIGNAL TRANSLATOR</div><h2 id="translator-title">Two ways. One connection.</h2></div><button class="icon-button" id="translator-close" aria-label="Close translator">×</button></div><p>Write a message or paste a signal. We’ll make the connection.</p><label for="translate-mode">Direction</label><select id="translate-mode"><option value="auto">Detect automatically</option><option value="encode">English → Morse</option><option value="decode">Morse → English</option></select><label for="translate-input">Your message</label><textarea id="translate-input" maxlength="1000" rows="5" placeholder="HELLO WORLD or .... . .-.. .-.. --- / .-- --- .-. .-.. -.."></textarea><div class="translate-meta"><span id="translate-detected">Ready when you are</span><button class="text-button" id="translate-swap">⇄ Swap</button><button class="text-button" id="translate-clear">Clear</button></div><label for="translate-output">Translation</label><textarea id="translate-output" rows="5" readonly placeholder="Your translation appears here"></textarea><p id="translate-status" role="status" class="micro">Separate Morse letters with spaces and words with /.</p><div class="button-row"><button class="button primary" id="translate-play">▶ Listen</button><button class="button secondary" id="translate-stop">Stop</button><button class="button secondary" id="translate-copy">Copy translation</button></div><p class="micro">Accepts · or . for dots, and −, _ or - for dashes. Three spaces or a new line also separate words. Punctuation-only text? Choose the direction manually. This translates written International Morse, not microphone recordings.</p>`;
}
