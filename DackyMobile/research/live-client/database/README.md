# Normalized research data

Each JSON file declares its own `schemaVersion` and, where applicable, `observedAt`, source and evidence labels. LIVE_UI means an authenticated UI rule was visible; PUBLIC_CLIENT means only a public client module exposed the label or text; DACKY_CODE is an implementation audit. UNKNOWN fields are intentionally null or named in unknown arrays. IDs are retained only where they appear in the local Dacky mapping; live reward icons without tooltips keep null IDs.

Canonical narrative: ../SCREEN_INDEX.md. Gap classification: ../GAMEPLAY_GAP_MATRIX.md.

V2 normalized observations: `live-events-v2.json`, `battle-observations.json`, `tower-observation-v2.json`, `strongpoint-observation-v2.json`, `progression-dashboard-v2.json`, and `outer-city-observation-v2.json`. Module inventory and deep source notes: `client-modules.json` and ../CLIENT_MODULE_ANALYSIS.md.
V3 observations: `live-events-v3.json`, `inventory-observation-v3.json`, `hero-equipment-observation-v3.json`, `title-system-observation-v3.json`, `buff-observations-v3.json`, `npc-trial-observation-v3.json`, `asset-inventory-v3.json`, and `acquired-assets-v3.json`. Battle observations remain in `battle-observations.json` and `combat.json`.
