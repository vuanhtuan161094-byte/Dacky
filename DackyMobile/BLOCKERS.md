# Remaining production gaps

| Area | Known state | Next action |
| --- | --- | --- |
| Legacy parsing | 67 of 70 pinned tables decoded; three remain `HOLD`: two packed record layouts and one missing MyISAM data/index pair. | Keep unsupported fields `UNKNOWN`; continue from decoded tables without guessing binary layouts. |
| Gameplay source coverage | 2,656 Mobile records are bundled; 37,699 field values across 2,641 records are mapped to 15 buildings, 10 technology branches, 25 troops, 482 heroes, 151 artifacts, 1,885 goods, and 73 city identities. Artifact army effects and linked chest outcomes use source values; conversion prices and gear stat coefficients are SIMULATED, while unsupported abilities and remaining quest, tower, mountain and NPC combat mechanics contain `SIMULATED`/`UNKNOWN` values. | Continue field-level mapping where source meaning is established. |
| Version comparison | Mobile and legacy category deltas are recorded; shared names or IDs do not establish mechanics parity. | Keep versions separate and add field-level comparisons as coverage expands. |
| Source art | 2,209 referenced Mobile images (13,173,749 bytes) are downloaded locally with source URL and SHA-256. Art appears in the source library and mapped runtime screens. | Extend portrait and asset mapping only where identity is exact. |
| Web and Android deliverables | Web/PWA, single-file offline HTML, Android debug APK, and debug AAB build successfully. PWA offline relaunch and single-file HTTP smoke pass; current APK/AAB package integrity checks pass. | Rebuild after future runtime changes; distribute artifacts separately from Git. |
| Device QA | No emulator or physical-device session is available. | Keep device interaction unverified; do not infer a device pass from a successful package build. |

The project owner authorized use of found game data and assets on 2026-11-25; no SPDX identifier is required for integration. Raw legacy database dumps and captured input files remain gitignored in `input-private/`. Source image URL/hash details are in `assets/mobile-source-manifest.json`; concise usage notes are in `docs/MOBILE_ASSET_PROVENANCE.md`.

See `docs/PRODUCTION_POLICY.md` for the full owner directive. The three legacy `HOLD` tables and unmapped gameplay semantics remain genuine data gaps, separate from usage permission. No credentials, authenticated flow, private endpoint, server or legacy executable was used.
