# E1 — ART13 preservation / UI audit / gameplay repairs / asset inventory

ART14 procedural art is rejected. The original ART13 asset pack and installer are unchanged. No image generation, no merge. City hitboxes and positions remain unchanged pending actual visual review. E1 adjusts shadow and interaction affordance, improves mobile item readability, captures all non-city normal runtime screens and exports UI audit metrics. The existing QA also captures city states and focus views.

Gameplay: fix insufficient voucher redemption (previous clamp returned 1 even when max was 0); prevent unlimited manual labor tax by a simulated once-per-UTC-day rule and morale floor, preserving day on migration. Both have regression tests. This is a simulated economic guard, not a verified original-game formula. Source parity remains incomplete: see QA P41–P50 ledger for 620 partial rows, 594 goods, 3 HOLD tables and endgame evidence. No blanket data expansion or fake completion.

Inventory: 2363 tracked asset files at source HEAD, grouped by source in asset-inventory-e1.json; city candidate list includes actual paths and blob IDs. Existing source rights attestation retained. No candidate has been substituted blindly.

Visual acceptance and CI still pending until exact-SHA build and screenshots have been inspected.
