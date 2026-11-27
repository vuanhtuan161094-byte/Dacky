# Runtime capture — 2026-11-27

Captured from the current local Web build at 1280 px viewport using `qa/art01-review.py` after `npm run build`. The capture script waited for web fonts, visible image decode, and visible CSS backgrounds; `ui-audit.json` records readiness and viewport widths.

These are runtime screenshots of the current product. They are not an A/B/C comparison with the original Dacky Mobile client, and they do not claim art-direction approval. A real reference-client capture is still unavailable in this workspace.

The PWA offline relaunch and single-file HTML startup were then verified with `qa/offline-smoke.mjs` against the local Web server: service-worker cache reopened with network disabled, the single-file game started without external asset requests, and Chromium reported zero runtime errors. Direct `file://` navigation is blocked by this managed browser policy, so the one-file runtime check used the served single HTML document.
