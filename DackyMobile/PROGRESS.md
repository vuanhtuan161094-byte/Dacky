# Dacky V1.0 progress

Updated 2026-11-25 · Repository `vuanhtuan161094-byte/Dacky` · branch `feature/dacky-v1-production`

## Checkpoint: Mobile source data and offline art

- Reused the existing cloud Android toolchain: Capacitor 8.6.2, JDK 21, Android SDK 36, Gradle 8.14.3. Gradle and Android user caches are directed to writable workspace paths; nothing was reinstalled.
- Re-imported all 2,656 checksum-verified Mobile catalog rows into a named JS module supported by the project bundler. Runtime adapters now apply 1,551 provenance-bearing Mobile field values: 15 building tables, 10 technology tables, 25 troop profiles, 12 exact canonical hero profiles, and 73 city profiles.
- Downloaded 2,209 unique public Mobile images (13,173,749 bytes). `assets/mobile-source-manifest.json` records URL, path, references, byte count and SHA-256. Local art now appears in the source library, mapped buildings and technologies, 25 troop profiles, 12 matched hero portraits, and 73 mapped city records. Owner authorization dated 2026-11-25 is recorded; no SPDX identifier is claimed.
- Runtime building/research costs use source level rows where mapped; mapped research rates and troop matchup rows use source effects. Missing names, mechanics and values remain `SIMULATED` or `UNKNOWN`. Runtime source fields retain per-field provenance.
- Added a Vietnamese source library with search, pagination, tables and provenance. Exported runtime JSON now preserves mixed per-record/field evidence instead of rejecting sourced rows.
- Single-file build now correctly bundles named export lists and embeds all 2,209 images once. `dist/offline.html` is 23,773,930 bytes; Chromium served it locally, rendered Mobile artwork and made no external HTTP asset requests. Direct `file://` navigation is blocked by this Chromium environment, so direct-file launch remains unverified.
- PWA shell v8 passed the offline relaunch check: cached entrypoint reopened with network disabled.

## Verification and Android output

- `npm test`: PASS 34/34.
- Python parser/normalizer source tests: PASS 10/10; data coverage regenerated from the pinned-source manifests.
- Chromium gameplay smoke: PASS across 12 screens, source artwork, construction, recruitment/equipment, training, marching/combat reports, IndexedDB save/reload, and 390×844 / 844×390 layouts; zero console/runtime errors.
- Web build and `cap sync`: PASS. Gradle `assembleDebug bundleDebug`: BUILD SUCCESSFUL with JDK 21, SDK 36, Gradle 8.14.3.
- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`, 46,533,259 bytes, SHA-256 `45ec9d602745013dbe37264c8f83641936da0d8a4204e0f83981004a733b4ed4`. `apksigner verify`, ZIP integrity and package metadata passed.
- Debug AAB: `android/app/build/outputs/bundle/debug/app-debug.aab`, 31,986,737 bytes, SHA-256 `f4efa16ae01f6b49b16034255b60aef57173aeabd6b6177e669634aa9c71ebfa`; ZIP integrity passed. No release signing key was used.
- No emulator or physical Android device was available; installation/device interaction is unverified.

## Remaining V1.0 work

- Legacy parser: 67/70 pinned tables decoded; three remain `HOLD` (`generalrefreshlevellimitinfo`, `upgradeexp`, `fieldrandeventcfginfo`). Keep unsupported binary fields `UNKNOWN` rather than infer a layout.
- Gameplay data coverage is partial. Hero combat/progression beyond the 12 exact identity matches, most item/equipment semantics, quests, NPC armies, tower floors and much PvE remain `SIMULATED` or `UNKNOWN`. The 2,656-row Mobile library is available in runtime, but not every source record has an adapter into a playable mechanic.
- Art coverage is improved but incomplete: many generated hero entries, PvE encounters, animations and skill VFX still use project-authored or shared art; do not claim complete source parity or finished production art.
- Finish field-level Mobile/legacy comparisons and adapters where semantics map directly; preserve source versions and incompatible-version differences. Then continue gameplay, art, wiki and release QA.

Raw legacy database dumps and captured source inputs remain in gitignored `input-private/`. APK/AAB outputs are local build artifacts, not committed. Do not merge or force-push this branch.
