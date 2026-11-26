# ONE GAME gameplay coverage — P41–P50 checkpoint

Updated 2026-11-26 on `integration/dacky-one-game-v1`. This is a continuation of P31–P40; `GAMEPLAY_LEDGER_P31.md` remains the historical baseline. Test counts and data-row counts are evidence, not a claim that every Mobile behavior has source parity.

## Dependency graph and fresh-save path

`scripts/check-dependency-graph.mjs` models 1,567 progression nodes and 3,958 prerequisite edges across buildings, technology ranks, troops and linked unlocks. The current graph has 0 cycles, 0 impossible nodes and 0 unknown unique references. All 21 Mobile buildings, 570 Mobile technology ranks and 25 Mobile troops are checked. The Phủ quan source cap remains 1; one explicitly `SIMULATED_PREREQUISITE_BRIDGE` rank allows Mobile research rows that require Tu Tiên Viện 2. `tech-05` and `tech-08` are covered by regression checks. Six extra runtime buildings are marked as game support; the city renders 27 total cards, of which 21 carry Mobile source IDs.

Fresh saves now initialize the normalized gameplay state before the first city screen renders. This fixes the previously visible `Quan chức undefined` state and makes office progression, tax/labor controls, quest state and other gameplay adapters available immediately. Save migration remains in place (schema v4).

## HOLD and adapter status

| Area | P41–P50 implementation | Remaining truth |
| --- | --- | --- |
| Quest objectives | All 1,883 objectives across 1,158 quests now resolve as linked gameplay or explicitly labeled simulation; 480 objective interpretations and 53 reward interpretations are simulated. Item objectives can place missing quest goods through the NPC merchant. Quest claims are save-backed and one-time/repeat-day guarded. | Source meanings for legacy condition codes without a verified join remain simulated. This is not parity proof. |
| 594 goods | The groups are 218 treasures, 170 quest goods, 97 materials, 91 chests, 10 gems and 8 other goods. Added guarded resale/buyback, simulated chest packs where Mobile does not expose a drop list, +1…+5 enhancement, two gem sockets, set evaluation and source-artifact NPC purchase. A Mobile-source artifact was bought, equipped and cast during manual army combat. | Quest goods are reserved/consumed only by linked objectives; source chest tables are used where available and missing drops get a local resource pack; gems feed sockets. Some treasure/material/other goods still have only a valid resale or material sink rather than an item-specific effect. They retain provenance and are not given a fake “use” button. |
| Tiên Sơn loot | All 1,093 rows are parsed into 80 interval-rule keys and joined to 8,992 floors. Candidate source item references are retained. A local deterministic first-clear/repeat-day loot adapter now settles through PvE. | One invalid interval is excluded; five overlaps use the first valid interval; 179 legacy goods IDs have no Mobile join and fall back to labeled simulated resources. Probability semantics are simulated because raw `RdmInfo` meaning is not proven. |
| Boss and endgame rewards | Boss equipment/spell IDs feed the existing simulated encounter adapter; PvE reward receipts remain single-settlement. Bất Chu doors 4–5 retain 90 fixed source formations and multi-sortie progress. | Boss item effects and unlinked legacy reward IDs are simulated. Floors beyond Bất Chu 1 were not cleared in the clean-save proof below. |
| Legacy HOLD tables | `generalrefreshlevellimitinfo`, `upgradeexp` and `fieldrandeventcfginfo` remain raw, provenance-tagged HOLD references; refresh, EXP and field-event runtime replacements remain separate simulated formulas. | No source layout or formula is claimed where it could not be verified. |
| `PARTIAL_RUNTIME` source rows | The 620 source rows continue to drive linked hero, city, troop, building and technology behavior where mapped. | The row classification persists where one or more effects, caps, or version-specific semantics are unknown. Broad runtime presence does not mean all source effects are reproduced. |

## Progression and endgame evidence

`progression-p41-p50-v2.json` is a clean-save four-policy run. It simulates 1, 7, 30, 90 and 180 days with no DEV resources, advances through three capped eight-hour production periods daily and runs save migration at each milestone. The policy itself matters: two styles exhaust the field army, which is kept as a balancing finding rather than hidden.

| Policy at day 180 | Ready troops / types | Research levels | Wins / cities | Campaign | Tower |
| --- | ---: | ---: | ---: | --- | ---: |
| Economy | 0 / 0 | 142 | 14 / 7 | Not complete | 10 |
| Military | 1,580 / 3 | 114 | 22 / 7 | Complete by day 90 | 10 |
| Immortals | 0 / 0 | 77 | 17 / 5 | Not complete | 11 |
| Balanced | 6,589 / 8 | 109 | 25 / 7 | Complete by day 180 | 11 |

Separate `endgame-route-p41-p50-v2.json` uses a fifth legal, endgame-focused policy. By day 180 it had 20,025 ready troops in two types, 107 research levels, seven cities, 25 campaign victories, the campaign ending, Tower 11 and one Bất Chu door cleared. Door 1 retained its 38,500 source troop count; the runtime did not weaken the source formation. Door 2's 35,000-unit readiness target was not reached, so doors 2–5 remain unproven. No action errors were recorded. This proves one attainable first endgame milestone, not full endgame completion.

The four-policy output includes every milestone, resource balance, building/research unlock, troop type, battle receipt, casualty count and quest total. It also shows that troop variety reaches 3–8 types by day 180 for the continuing policies; the two depleted policies finish with no ready types. Review the raw output before changing difficulty or interpreting a policy outcome as an engine defect.

## Release evidence and remaining blockers

- Dependency check: 1,567 nodes / 3,958 edges; zero cycle, impossible-node or unknown-reference findings.
- Runtime/source regressions cover Mobile artifact purchase/equip/cast, Buzhou save anti-tamper, rewards, gear enhancement/gems, technology gates, troop unlocks and fresh-save initialization.
- Source refresh, EXP and field-event rules remain `SIMULATED`; full Mobile growth curves, some effects in the 620 partial rows and some of the 594 goods remain incomplete.
- Animation/VFX/audio still need production polish. Browser screenshots/video are Chromium output, not physical-device evidence. No Android device/emulator is attached: **DEVICE QA HOLD**.
- Final QA ran 129/129 Node tests, 10/10 source parser tests, zero dependency graph errors, all 12 main browser screens, a clean-save recruit/train/march/reward/capture/save-reload flow, manual battle with a Mobile artifact, and mobile portrait/landscape with zero runtime errors. PWA relaunch works offline; the 67.7 MB single-file HTML renders over local HTTP without external requests. The release build includes APK/AAB and a 141.75-second gameplay video plus 19 PNG captures. Physical Android and direct `file://` checks remain unverified. CI artifact and deploy links are recorded in the final handoff; this branch uses normal descendant pushes only.
