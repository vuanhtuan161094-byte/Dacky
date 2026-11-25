# Combat workstream — integration contract V0.1
Base production SHA: b79908fe2b611c515647c6fc901b0d01b1bc9545
Branch: feature/dacky-combat-core. No merge or force push.

## File ownership
ChatGPT owns src/combat/**, tests/combat-*.test.js, docs/COMBAT_HANDOFF.md and .github/workflows/dacky-combat-core.yml. Luna owns production catalog/import scripts, city/economy, troop training, quests/PvE, UI/art/audio and release. Luna may add integration glue in engine.js/main.js/ui.js on production after handoff; do not edit the core files concurrently. Do not cherry-pick the whole branch blindly. Production remains the single game.

## API
Pure ES modules, no dependencies. createHeroCombatant(def, save, {instanceId, skillRules, artifact, artifactRule}) consumes existing mobileBaseStats [{label,value}], mobileAbilities [{name,description,rank}], item mobileAbilityText/mobileManaCost and existing save level. Hero growth and fallback abilities are explicitly SIMULATED. Source ability descriptions remain UNKNOWN until mapped; IDs use runtime hero ID + source ability index; validate against source version before reimporting.
resolveCombat({teams:[[combatant...],[combatant...]],seed,maxRounds,mode:'duel'|'army'}) yields winner (0/1/null), victory, rounds, ordered events, units, termination. No save mutation, loot, casualty settlement, queue or UI operations. Each actor has unique id, stats {attack,magic,defense,resistance,speed,maxHp,maxMana}, skills [{id,name,kind,manaCost,cooldown,effects}], optional count for army. Army survivors are a provisional HP-to-count mapping only; do not apply in parallel with existing casualty formula.
Effect targets self/enemy/ally/allEnemies/allAllies. Supported effect kinds: damage, heal, shield, modifier, status (stun/silence/sealArtifact), cleanse, mana, periodic. Explicit source rule mapping must supply magnitude, target, timing and provenance; unknown descriptions do not auto-activate. compileArtifact only audits exact unconditional simple clauses; timing is simulated and never auto-equipped/cast. artifactRule requires explicit mapping and equip eligibility by production.
Events use seq, round, type, actorId,targetId; damage/heal/absorb/mana amount; cast skillId/name/manaCost; effect kind/stat/status/amount/duration; skip reason; fall. Use events for animation, never recompute combat from UI.

## Integration sequence
1. Keep existing engine as fallback. Import core in an isolated bridge, start with duel mode behind a feature flag; existing save ID, NPC and reward settlement stay unchanged. Map enemy stats explicitly and do not use heroPower as HP without a documented adapter. Build old report rounds from events, preserve existing fields for old saves. Never apply old and new damage/reward systems together.
2. Map source ability and artifact rule families using decoded tables and Mobile texts. Validate requirements, mana, trigger, target, stacking, duration, scope and value units. Maintain rules with field provenance and counts of implemented/partial/unknown. Do not infer a full ability from a percentage substring.
3. Army mode only after source army rules and casualty/wounded conservation are agreed. Convert each stack with count and source unit stats; review stack HP scaling, march composition and leader effects. Use either existing army settlement or new adapter, not both.
4. Combat visuals consume ordered event log. No asset dependency in core. Luna continues art and UI using event mappings. Regression: seeded reproducibility, no duplicate reward, no negative HP/mana, cooldown and status expiration, legacy save reload.
5. Cherry-pick selected core files/commit after review onto production, resolve conflicts in glue only, run full tests and build once at major checkpoint. No merge without owner approval.

## Limits / work next
V0.1 implements reusable primitives, per-unit hero stats, deterministic action timeline, mana/cooldown, effects, and cautious artifact audit. It is NOT wired into production gameplay; no claim of 482 hero skills or 151 artifacts implemented. Source formula, progression, individual skill mappings, army stack calibration, targeting semantics, event triggers and replay UI remain open. Direct source cache is not present in ChatGPT container; Luna owns data regeneration. No Android build attempted here.
