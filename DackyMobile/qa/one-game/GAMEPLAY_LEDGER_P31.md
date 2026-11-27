# ONE GAME gameplay coverage — P31 checkpoint, updated continuation

Updated 2026-11-27 on `feature/dacky-product-completion`. The accompanying `gameplay-ledger-p31.json` is generated from runtime catalogs and pinned coverage metadata; it excludes raw/private database dumps. `VERIFIED_MOBILE` and `VERIFIED_LEGACY` identify source fields only. A working adapter does not establish original-game parity.

## Current continuation — equipment items, artifact path and army recovery

- Source item runtime statuses now read 1,068 `USE_RUNTIME`, 598 `EQUIP_RUNTIME`, 193 `QUEST_RUNTIME`, and 26 `REFERENCE_OR_MATERIAL`; all 1,885 goods remain represented. The separate 620 `PARTIAL_RUNTIME` labels remain because live hooks do not prove source formula parity.
- Goods 4710/4711 protect real equipment enhancement outcomes, 4714/4715 protect gem socket outcomes, and 8742 resets a reborn hero through the existing level reset handler. Source description fields are Mobile-verified; risk rates, rank cap +10, and failure results are SIMULATED.
- 151/151 Mobile artifact ability records map to existing source operations in Combat Core (88 unique descriptions). Army dispatch tests exercise equipped artifact casts and troop recovery caps; no duplicate text interpretation is applied.
- Hồi Xuân Đường now gradually recovers wounded troops using elapsed time, clinic level and bounded surplus food/gold. Its conversion is `SIMULATED`; source recovery speed is unknown. Manual healing is unchanged.
- Focused item/gear/clinic/PvE/combat checks: 63/63; full Node suite: 195/195; Python source checks: 10/10. The current worktree needs exact-HEAD CI after push.

## Current LOT E build and endgame evidence — 2026-11-27

- Clean-save specialist progression used legal runtime actions and no DEV resource grants. At day 180 it had cleared Bất Chu Sơn door 1, trained 33,449 troops across four types, recruited seven heroes and equipped ten unique items. At day 360 it had cleared doors 1–3 and one door-4 sortie (200,997 of 3,450,000); 3,249,003 remain, 50,171 troops are marching, and door 5 is not reached. No action errors occurred. This policy does **not** prove an endgame route. Full output: [`endgame-route-lot-e-360.json`](../product-completion/endgame-route-lot-e-360.json).
- Current Web build includes PWA shell and `offline.html`. The PWA reopened with networking disabled; single-file HTML started with no external asset requests or browser runtime errors. The 11 primary UI screens were captured after font/image/background readiness checks; screenshots and `ui-audit.json` are in [`runtime-lot-e-2026-11-27`](../product-completion/runtime-lot-e-2026-11-27/). This is not an original-client A/B comparison or an art approval.
- APK and AAB build successfully with the workspace JDK 21 and Android SDK 36. The standalone `json.gz` build sidecar is omitted from `dist` to prevent Android's asset merger from treating it as a duplicate compressed JSON resource. **DEVICE QA HOLD** remains because no device/emulator was exercised.
- Parent exact-head CI [46032605118](https://github.com/vuanhtuan161094-byte/Dacky/actions/runs/46032605118) failed only during Maven Central dependency resolution (HTTP 429). Code checkpoint `60fb7ec` passed all exact-head production CI steps in [46043637368](https://github.com/vuanhtuan161094-byte/Dacky/actions/runs/46043637368). Pages publish is built from that code at `https://vuanhtuan161094-byte.github.io/Dacky/`.

## Connected to playable systems

- 21 Mobile buildings, 19 Mobile technology branches and 570 level rows. Building/research queues consume their mapped costs and apply implemented effects. Unsupported formulas remain simulated or partial. The source cap for Phủ quan is 1 while Mobile research requires Tu Tiên Viện 2 and that building requires Phủ quan 2; runtime adds one explicit `SIMULATED_PREREQUISITE_BRIDGE` rank while retaining the verified source cap of 1.
- 25 Mobile troop profiles train and enter mixed army battles. 24/25 base training times use matching legacy rows; uncovered requirements and costs stay simulated or `UNKNOWN`.
- 482 recruitable Mobile hero profiles feed the roster, equipment, growth and combat systems. Growth curves, several role bonuses and endgame garrisons are simulated; source stats are not asserted to reproduce Mobile balance.
- 73 Mobile city identities and portraits are attached to playable world nodes. Garrison numbers and settlement rewards remain simulated because the source snapshot does not provide stable live counts.
- Quest source IDs are joined by exact goods/troop IDs when available. Current coverage maps or simulates 1,883/1,883 objectives across 1,158 playable quests; objective `HOLD` count is zero. Unverified interpretations remain marked simulated or unknown at field level.
- 624 Tiên Sơn locations expose 8,992 army stages. 7,934 have a fixed legacy formation; the other 1,058 use a separately labeled local formation rule. The runtime attaches 977 of 1,093 raw loot rows to playable floor candidates and interprets their intervals as `SIMULATED`; 116 source rows have no matching playable level/floor in this catalog version. Of 190 unique playable reward IDs, 16 join an item and 174 convert through the bounded, receipt-marked `SIMULATED_UNJOINED_SOURCE_ITEM_CONVERSION` award.
- 27 NPC strongpoints, 5 Bất Chu Sơn doors, 25 high-level Boss encounters and the eight-chapter campaign resolve to army fights. Boss source equipment and spells feed the adapted encounter; their exact Mobile combat effect is simulated. Regression QA executes real settlement for Boss gear/spells, Bất Chu progression and one-time rewards.
- Manual army combat saves per-round stance, artifact, commander and challenge choices. The player may issue round commands or let the battle auto-finish; the engine settles once and preserves the report across save/reload.
- Five formerly held artifact policies now run with explicit simulated mana costs/conversion behavior. They are executable fallback formulas, not verified source semantics.

## Runtime catalog status

The generated 2,656-row ledger currently groups records as follows: 620 `PARTIAL_RUNTIME` (482 heroes, 73 cities, 25 troops, 21 buildings, 19 technologies), 151 artifacts with executable simulated or verified costs, 1,068 `USE_RUNTIME`, 598 `EQUIP_RUNTIME`, 193 `QUEST_RUNTIME`, and 26 `REFERENCE_OR_MATERIAL`. These statuses describe adapter coverage, not a completion score.

Runtime-path audit: all 482 source heroes resolve to finite product commander profiles; all 21 building and 19 technology identities return live progression quotes; all 25 troops return live training quotes; all 73 sourced city garrisons provide their verified named troop types and commanders to battle inputs. Mobile garrison troop counts remain simulated because the source says counts vary by server. The 620 `PARTIAL_RUNTIME` labels remain because this check does not prove source formula or balance parity.

At the original P31 import, 594 goods had been grouped as reference/material: 218 treasures, 170 quest items, 97 materials, 91 chests, 10 gems, 3 production goods, 3 miscellaneous goods and 2 speedups. Shared effects and sinks have since reduced the current unclassified purpose group to 26; remaining instance-only, multiplayer-only and no-effect source items stay explicit.

## Four-strategy clean-save simulation

Reproducible output: `progression-p31.json`, produced by `scripts/check-one-game-progression.mjs`. Each run starts with `createNewGame`, advances three legal eight-hour periods per simulated day, performs ordinary actions without DEV resources, and migrates/reloads at each checkpoint. The four runs completed with no action errors; the table records the state after days 1, 7, 30, 90 and 180.

| Day | Economy | Military | Immortals | Balanced |
| ---: | --- | --- | --- | --- |
| 1 | Ch1 · tech 0 · army 18/1 · heroes 1 · gear 1 · wins/cities 0/0 | Ch1 · tech 0 · army 18/1 · heroes 1 · gear 1 · 0/0 | Ch1 · tech 0 · army 18/1 · heroes 1 · gear 1 · 0/0 | Ch1 · tech 0 · army 18/1 · heroes 1 · gear 1 · 0/0 |
| 7 | Ch1 · tech 6 · army 194/2 · heroes 1 · gear 4 · wins/cities 0/0 | Ch2 · tech 6 · army 191/1 · heroes 1 · gear 4 · 1/0 | Ch1 · tech 6 · army 182/1 · heroes 1 · gear 4 · 0/0 | Ch1 · tech 6 · army 0/0 · heroes 1 · gear 4 · 0/0 |
| 30 | Ch2 · tech 25 · army 459/2 · heroes 4 · gear 6 · wins/cities 2/1 | Ch6 · tech 29 · army 299/2 · heroes 4 · gear 7 · 7/2 | Ch3 · tech 24 · army 0/0 · heroes 9 · gear 4 · 2/0 | Ch4 · tech 29 · army 339/2 · heroes 1 · gear 4 · 4/1 |
| 90 | Ch2 · tech 75 · army 1,595/3 · heroes 4 · gear 10 · wins/cities 7/6 | Ch8 · tech 86 · army 219/3 · heroes 4 · gear 10 · 22/7 · story clear | Ch7 · tech 54 · army 0/0 · heroes 9 · gear 7 · 8/2 | Ch8 · tech 68 · army 2,071/3 · heroes 6 · gear 7 · 12/4 |
| 180 | Ch8 · tech 122 · army 0/0 · heroes 4 · gear 11 · wins/cities 14/7 | Ch8 · tech 105 · army 0/2 · heroes 4 · gear 12 · 22/7 · story clear | Ch8 · tech 68 · army 0/0 · heroes 9 · gear 10 · 17/5 | Ch8 · tech 93 · army 2,624/5 · heroes 6 · gear 10 · 25/7 · story clear · 3 PvE wins |

Army is current ready headcount/number of troop types; hero and gear counts are owned roster/equipped items. By day 180, the runs had trained 3–7 distinct Mobile troop types, recruited 4–9 heroes (up to three assigned), equipped 10–12 unique items, reached 11–12 Tower floors and claimed 159–167 source quests. Military cleared the campaign on day 90; Balanced did so on day 180. Economy and Immortals did not clear the campaign. Military's later Bất Chu door attempt used 57 troops against a 38,500-count source formation and lost; this run does not demonstrate endgame readiness. Difficulty was not reduced to turn these outcomes into wins.

## Genuine holds

- All 1,158 quests have playable objective adapters and 1,883 objectives are mapped; some source condition/reward semantics remain simulated.
- 977/1,093 Tiên Sơn loot rows attach to playable floor candidates; 116 have no matching playable floor. Interval interpretation is simulated, and 174 of 190 unique item IDs still use the bounded fallback.
- `generalrefreshlevellimitinfo`, `upgradeexp` and `fieldrandeventcfginfo` remain 3/70 legacy tables `HOLD`. Their runtime refresh, experience and field-event behavior is explicitly `SIMULATED`.
- 26 goods remain reference/material status as grouped above. The parser's 67/70 decoded legacy table count is not treated as a proxy for gameplay completion.
- Source hero and equipment formulas, high-end PvE calibration, several unsupported technology and building effects, full enhancement crafting, additional runtime battle animation/VFX/audio and physical Android interaction remain open. **DEVICE QA HOLD.**

The machine QA captures real Web/PWA/offline journeys and manual combat. A passing package build is not device QA. See `qa/one-game/` for screenshots and `battle-replay.mp4` for the captured combat session.
