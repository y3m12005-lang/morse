# MORSE

A welcoming, sound-first Morse learning website. Built with browser-native JavaScript, CSS and Web Audio. All learning features are free and work without an account. Google sign-in integration is included but remains unconfigured because Firebase project setup could not complete. No personal owner name or email is embedded in the website.

## What it teaches

- 26 sequenced lessons: E/T through A–Z, digits, useful punctuation, words and messages.
- Animated dots and dashes alongside accurate sine-wave Morse playback.
- Guided hints that fade, audio-only lessons, typed answers and corrective feedback.
- 80% pass marks, saved progress, daily goals, real practice statistics and first-listen recognition metrics.
- A custom practice studio and clickable reference library.
- A mouse/touch/Space Morse key with dot-and-dash pattern checking.
- Adjustable character speed, extra inter-character spacing, tone and volume.
- Progress export/import. Data stays in this browser's local storage.

This is a learning tool, not a promise of immediate fluency. Sending practice grades symbol order, not exact spacing. Operational radio procedures and continuous prosigns are outside the curriculum. International character mappings and timing are based on [ITU M.1677](https://www.itu.int/rec/R-REC-M.1677-1-200910-I/).

## Google sign-in status

The landing page leads to an account screen. Google sign-in is clearly marked as pending; the device-only course is fully usable. To enable real sign-in, create a Firebase project on the free plan, enable Google in Authentication, register a web app, add the live website domain to Authorized domains, and populate `auth-config.js` with the public Firebase web configuration. Never add a service-account key or secret. No emails are hardcoded. Signed-in progress is separated by user ID in local storage; cloud sync is not implemented.

## Run locally

Serve this folder with any static HTTP server. For example, run `python -m http.server 8000` and open `http://localhost:8000`. There are no npm dependencies.

## Deploy

This repository root is the complete static site. Serve it over HTTP(S); JavaScript modules do not work reliably with a file:// URL. GitHub Pages publishes the main branch root. The learning features also work when fonts are unavailable, using system-font fallbacks.

No secrets are required. Google sign-in remains pending.


## Advertising setup

Ad placements live in `ads.js`:

- **During lessons and listening sessions:** a sticky 300px rail beside the lesson on desktop (1340px and wider), and one banner below the lesson on tablets and phones. Both sit outside the question card and away from the answer buttons. They live outside `#main`, so they load once and stay put between questions (no refresh).
- **Learning path:** right rail and under the lesson list.
- **Public pages:** footer banner.

Ads stay off until `adConfig` in `ads.js` has a real AdSense publisher ID, slot IDs, `consentReady: true` and `enabled: true`. Visitors never see empty boxes. To preview the positions, open the site with `?ads=preview`, for example `https://y3m12005-lang.github.io/morse/?ads=preview#learn`.

A custom domain or a GitHub user-site root is needed for domain-level verification and ads.txt; the project lives under /morse/. Update the privacy page before activation.

## Motion & polish

`fx.css` and `fx.js` add page transitions, scroll reveals, count-up stats, confetti on correct answers and passed lessons, a live "transmitting" hello card, a sticky glass top bar, and a reading-progress bar. All motion switches off for visitors who choose reduced motion in their system settings.
