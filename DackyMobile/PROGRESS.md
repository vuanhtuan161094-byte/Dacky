# Dacky V1.0 progress

Updated 2026-11-25 · Repository `vuanhtuan161094-byte/Dacky` · branch `feature/dacky-v1-production`

## Checkpoint: Mobile gameplay data, legacy quest reference and offline art

- Reused the existing cloud Android toolchain: Capacitor 8.6.2, JDK 21, Android SDK 36, Gradle 8.14.3. Gradle and Android user caches are directed to writable workspace paths; nothing was reinstalled.
- Re-imported all 2,656 checksum-verified Mobile catalog rows into a named JS module supported by the project bundler. Runtime adapters apply 35,902 provenance-bearing Mobile field values across 2,641 gameplay records: 15 building tables, 10 technology tables, 25 troop profiles, all 482 Mobile heroes, 151 artifacts, 1,885 goods, and 73 city profiles.
- Downloaded 2,209 unique public Mobile images (13,173,749 bytes). `assets/mobile-source-manifest.json` records URL, path, references, byte count and SHA-256. Local art now appears in the source library, mapped buildings and technologies, 25 troop profiles, 12 matched hero portraits, and 73 mapped city records. Owner authorization dated 2026-11-25 is recorded; no SPDX identifier is claimed.
- Runtime building/research costs use source level rows where mapped; mapped research rates and troop matchup rows use source effects. All 482 Mobile hero identities, portraits, base stats, occupations, factions, profiles and source abilities are now recruitable with field provenance. Mobile base attributes feed a local hero rating formula; its coefficients, active skills, training progression and unsupported mechanics remain explicitly `SIMULATED`.
- All 151 Mobile artifact names, images, quality, occupation, level/mana requirements, ability text, descriptions, owners and acquisition references are mapped with per-field provenance. Equipped artifacts apply parsed army attack/defense/troop-count effects from exact source text. Runtime stacking is explicitly simulated; unsupported abilities such as locks and spell nullification remain `UNKNOWN`, and mixed abilities are marked partial in battle reports.
- Imported 1,885 Mobile goods with source identity, image, category, quality, acquisition, equipment position/requirements, stats and opening links. The runtime equips 534 sourced gear profiles, enforces published level/occupation requirements, opens 676 linked source reward lists (including source keys), and applies four directly described resource packs. 88 source boxes have verified merchant-link availability; conversion prices remain SIMULATED. Unmapped item-use mechanics stay UNKNOWN and are disabled.
- Imported 1,158 legacy quest descriptions into a separately versioned runtime reference with field provenance for source ID, title, content, brief, target and type code (6,948 fields). Compared table `quest` to `quest_20_11`: 1,156 shared IDs, two IDs only in `quest` (110098, 110099), and title changes on three shared records. Requirements, rewards and active quest mechanics remain UNKNOWN; these descriptions do not overwrite simulated progression.
- Added a Vietnamese source library with search, pagination, tables and provenance. Exported runtime JSON now preserves mixed per-record/field evidence instead of rejecting sourced rows.
- Runtime JSON now exports 7,723 catalog records, including the separate legacy quest reference. The single-file build correctly bundles named export lists and embeds all 2,209 images once; it contains 28,088,269 JavaScript characters. `dist/offline.html` is 47,726,729 bytes; Chromium served it locally, rendered the game and made no external HTTP asset requests. Direct `file://` navigation is blocked by this Chromium environment, so direct-file launch remains unverified.
- PWA shell v10 passed the offline relaunch check with the new legacy quest module cached; the entrypoint reopened with network disabled.

## Verification and Android output

- `npm test`: PASS 41/41, including Mobile artifact combat, chest outcomes, equipment restrictions, legacy quest provenance and version deltas.
- Python parser/normalizer source tests: PASS 10/10; data coverage regenerated from the pinned-source manifests. Legacy quest comparison records 1,156 shared IDs, two selected-snapshot-only IDs, and three title changes.
- Chromium gameplay smoke: PASS across 12 screens, legacy quest source/provenance display, source artwork, construction, recruitment/equipment, training, marching/combat reports, IndexedDB save/reload, and 390×844 / 844×390 layouts; zero console/runtime errors.
- Web build and `cap sync`: PASS. Gradle `assembleDebug bundleDebug`: BUILD SUCCESSFUL with JDK 21, SDK 36, Gradle 8.14.3.
- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`, 47,529,749 bytes, SHA-256 `8f53dd62f90c66d0bc1a728b2871d8382f7714946757d31303a3120a97c4bbeb`. `apksigner verify`, ZIP integrity and package metadata passed.
- Debug AAB: `android/app/build/outputs/bundle/debug/app-debug.aab`, 33,701,607 bytes, SHA-256 `692cf7d6fae11ae16245566ce232e338a5d3c7342aa7603011aa051ef2f7d6f8`; ZIP integrity passed. No release signing key was used.
- No emulator or physical Android device was available; installation/device interaction is unverified.

## Remaining V1.0 work

- Legacy parser: 67/70 pinned tables decoded; three remain `HOLD` (`generalrefreshlevellimitinfo`, `upgradeexp`, `fieldrandeventcfginfo`). Keep unsupported binary fields `UNKNOWN` rather than infer a layout.
- Gameplay data coverage is partial. Artifact and chest reward mappings use Mobile source records. A separate library contains 1,158 verified legacy quest descriptions, while quest requirements/rewards, unsupported item-use abilities, set bonuses, NPC armies, tower floors and much PvE remain `SIMULATED` or `UNKNOWN`. The source library does not imply that those quest mechanics are playable or version-equivalent.
- Art coverage is improved but incomplete: many generated hero entries, PvE encounters, animations and skill VFX still use project-authored or shared art; do not claim complete source parity or finished production art.
- Finish field-level Mobile/legacy comparisons and adapters where semantics map directly; preserve source versions and incompatible-version differences. Then continue gameplay, art, wiki and release QA.

Raw legacy database dumps and captured source inputs remain in gitignored `input-private/`. APK/AAB outputs are local build artifacts, not committed. Do not merge or force-push this branch.
