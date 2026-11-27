# Combat Art R3
R2 CI 46017685646 PASS: actual squad command + replay, 7 controlled effect fixtures, 0 browser errors. Inspected screenshot contact sheet: soldiers remain small, VFX small, replay footer wastes arena height.
R3 adds 10 original FLARE atlases from pinned c641d2ac2801617f6be3e327454de39250d489b9 with original config and Git blob verification: 17 VFX atlases, 286 nonblank packed frame/variant entries. Does not count color/direction variants as new skills.
Shared renderer changes: compact replay, larger troop/commander art and FX; projectile travel for fire, arrow, ice and lightning; presentation-only ranged volley from actual strike and visible troop role; preserve original FX fallback. No engine or save changes. Mapping by descriptive event label is a presentation approximation, not Mobile parity.
Kept Dacky native soldiers and two existing legacy NPC mappings. SpriteCook pixel paladin/scout reviewed as candidate, not added due inconsistent style. No new art generation. Source notices retained.
R3 CI and actual visual acceptance pending. 100 VFX goal not yet achieved.
