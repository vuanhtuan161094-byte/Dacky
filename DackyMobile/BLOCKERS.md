# Current product blockers — Dacky ONE GAME

Active branch: `feature/dacky-product-completion`. The verified gameplay code checkpoint is `f467fb1e4d5bb993f7ddc2540580d712fc62b5fd`; exact-head CI [46051325757](https://github.com/vuanhtuan161094-byte/Dacky/actions/runs/46051325757) passed. Pages is enabled on `deploy/dacky-one-game-v1`; deployment checkpoint `da6d482` passed Pages run [46052117151](https://github.com/vuanhtuan161094-byte/Dacky/actions/runs/46052117151).

| Area | Verified state | Remaining blocker |
| --- | --- | --- |
| Endgame | A clean legal-action route reaches rank 19, completes campaign, trains five troop types and clears Bất Chu doors 1–3 by day 360. Door 4 has 202,691/3,450,000 source troops cleared. | Door 4 completion and door 5 are not proven. This route does not establish V1.0 endgame completion. |
| Source parity | 21 buildings, 570 research levels, 25 troops, 482 hero profiles, 73 city profiles and 151 artifacts have runtime paths where mapped. | 620 records remain `PARTIAL_RUNTIME`; formulas or balances still need source verification. |
| Items and loot | Item effects route through shared gameplay families; 1,093 Tiên Sơn rules are resolved by the current runtime adapter. | 26 reference/material goods lack distinct item-specific sinks; 174 Tiên Sơn IDs have no Mobile item join. Loot interval interpretation and some Boss/strongpoint rewards remain simulated or unverified. |
| Legacy tables | `generalrefreshlevellimitinfo`, `upgradeexp` and `fieldrandeventcfginfo` retain raw provenance and HOLD status. | Source structure/formulas remain unverified; substitute gameplay behavior is labeled simulated. |
| Visual proof | Current product captures include 11 primary views and an audit; a 227-second browser gameplay recording exists in the repository. | No captured live-client A reference for a full A/B/C comparison. Browser evidence is not physical-device or final art-direction approval. |
| Android | CI built and uploaded debug APK and AAB using JDK 21 / Android SDK 36. | No physical device/emulator QA was performed: **DEVICE QA HOLD**. |
| Distribution | GitHub Pages is live; root and single-file offline route returned HTTP 200 for the deployed build. | `offline.html` is 88.38 MB, above GitHub's recommended 50 MB file size, though below its 100 MB hard limit. |

Raw/private legacy dumps, signing keys and unapproved DEV resources remain excluded. Do not interpret imported-row totals, runtime adapters, or CI status as proof of source parity or completed endgame.
