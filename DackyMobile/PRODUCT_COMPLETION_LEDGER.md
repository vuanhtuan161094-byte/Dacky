# Dacky product completion ledger

Updated 2026-11-27 · active branch `feature/dacky-product-completion` · base `41455f6c1888b981a5a2351654fbc7c1e056cfd4`.

This ledger describes playable behavior and evidence. Record counts, tests and imported rows do not establish source parity or product completion.

| System | Feature | Status | Runtime evidence | Remaining work | Next action |
| --- | --- | --- | --- | --- | --- |
| Product integration | One integrated game, shared save and Combat P50 adapter | DONE | Branch is based on the ART13-preserving review descendant of ONE GAME. No second game or engine was added. | Source parity remains incomplete where marked below. | Keep all changes on this product branch. |
| Save | Migration and persisted timed item effects | DONE | Save schema v4; the new 4503 buff test reloads the save and checks provenance survives. Existing migration and reward-receipt tests pass. | No physical-device save check. | Re-run the focused save flow on Android when an emulator/device is available. |
| Mobile decree items | Items 4503, 4505 and 4506 | IN_PROGRESS | Verified descriptions now drive 25% all-resource production, 2× storage, 25% immortal XP/march speed and 10% army attack/defense for the sourced duration. 140 runtime tests pass. | The source-listed +5% immortal-capture chance has no capture flow; it stays explicitly unsupported. Refresh stacking duration is SIMULATED. | Implement and test capture only after a legal in-game capture action and reward path are defined. |
| Combat | Manual/automatic campaign combat and event settlement | DONE | Existing runtime, event receipts and one-time settlement suites pass. This increment only supplies the existing army adapter with the sourced decree attack effect. | Some encounter loadouts, skill semantics and visual effects remain simulated/partial. | Reuse the existing engine; do not fork or rewrite it. |
| ART13 | Painted city and building runtime art | DONE | `scripts/install-art13.py` installed two terrain scenes and 27 independent sprites; each output matched the pack's exact hashes. See [`docs/ART13_ASSET_LOCK.json`](docs/ART13_ASSET_LOCK.json). | Visual approval is not implied by hash validation. | Preserve ART13 source pack and build verifier. |
| Screen review | City, hero, army, map and supporting game screens | IN_PROGRESS | Actual Chromium run generated 55 PNGs and an 11-screen UI audit at 1280 px; 0 broken visible images and 0 document-width overflows. Captures are in `qa/art01-review/`. | Current live-client gameplay screenshots were not captured. The hero and army screens remain information-dense; comparison to the current Mobile client is not proven. | Review the capture set and polish player-facing screens with existing assets only. |
| Web/PWA | Static Web, PWA assets and single-file offline HTML | DONE | `npm run build` created `dist/`, the PWA shell and `dist/offline.html`; the artifact is generated from the same runtime modules. | Direct `file://` and public Pages hosting are not verified. | Use CI Web artifact for preview; enable Pages separately at repository settings. |
| Android | Debug APK and AAB pipeline | IN_PROGRESS | The production workflow builds both debug packages on GitHub Actions after push. | Exact-HEAD CI is pending; no device/emulator is attached, so DEVICE QA HOLD remains. | Verify new run artifacts and SHA after push. |
| Long progression | New-save 1/7/30/90/180-day policies and endgame | IN_PROGRESS | The P41–P50 clean-save record covers four strategies plus a specialist endgame route. Day 180: economy 0 ready troops/142 research; military 1,580/114 and campaign clear; immortals 0/77; balanced 6,589 troops across 8 types/109 research and campaign clear. Specialist held the 38,500 Bất Chu 1 source formation intact and cleared door 1 with 20,025 troops. | Doors 2–5 and full endgame remain unproven; two strategies exhaust their field army. This increment did not rerun that unrelated simulation. | Improve recovery/economy and prove the remaining doors with earned resources. |
| Data-backed gameplay | Quests, goods, PvE loot, bosses and legacy tables | IN_PROGRESS | See [`qa/one-game/GAMEPLAY_LEDGER_P41_P50.md`](qa/one-game/GAMEPLAY_LEDGER_P41_P50.md) for runtime paths and evidence. | 480 quest-objective and 53 reward interpretations are simulated; some of 594 goods lack unique gameplay sinks; 620 rows remain PARTIAL_RUNTIME; 179 loot IDs have no Mobile join; three legacy tables remain HOLD. | Continue by player-facing effect families, retaining field provenance. |
| Image generation | Assets requiring new masters | IMAGEGEN_HOLD | This task's instruction is ASSET REUSE ONLY; no image generation was invoked. | See [`IMAGEGEN_QUEUE.md`](IMAGEGEN_QUEUE.md). | Reuse bundled Mobile art/audio while generation remains unavailable. |

## Checks on this increment

- `npm test`: **140/140**, dependency graph 1,567 nodes / 3,958 edges, 0 cycles, 0 impossible conditions, 0 unknown unique references.
- `npm run test:source`: **10/10**.
- `npm run build`: PASS; 59,017 compact runtime records preserve 128,253 unique field-evidence records.
- ART13 installer: 2 terrain scenes + 27 building sprites, exact hashes verified.
- Local browser capture: 55 PNGs across the initial/developed city, free/building selection, mobile landscape/portrait and 12 game functions; UI audit covers 11 non-city screens with no broken visible images or horizontal document overflow.
- Exact branch CI and APK/AAB artifact links will be added after the branch push completes.
