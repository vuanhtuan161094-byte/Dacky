# Asset provenance

## City panorama v1

- File: `assets/city-panorama.jpg`
- Purpose: background illustration for the city screen and campaign ending banner
- Source image: generated original, no source game image supplied or traced
- Original render retained at `/workspace/generated_images/exec-44ebe4b2-a45d-4ca0-a760-f7e863fd83c5.png` (2172×724 PNG, 2,732,028 bytes, SHA-256 `d6ea565c09c432f7b2f0eb9e9b058cd664796872af4befc8d587b87e6d114a4d`)
- Generator: `image_gen__imagegen`
- Generated image ID: `exec-44ebe4b2-a45d-4ca0-a760-f7e863fd83c5`
- Prompt version: `DACKY_CITY_PANORAMA_V1`
- Prompt: “Create an original high-quality 2D game environment background for a Vietnamese offline strategy game set in the mythic Shang era. Very wide horizontal panorama, roughly 3:1 composition: an ancient Chinese fortified capital with elegant layered tiled roofs, warm vermilion gates, aged bronze details, timber buildings, distant blue-gray mountains, a river and mist at sunrise, soft gold lantern light. Painterly, refined mobile game illustration, coherent muted indigo, jade, earth red and antique gold palette; detailed enough to feel authored, quiet enough to sit behind readable UI. Keep the central and upper area visually calm for overlaid interface text. No characters, no text, no calligraphy, no logos, no frame, no watermark, no UI, no emoji. Full-bleed landscape scene.”
- Original render: 2172×724 PNG; final export: 1536×512 JPEG, 210,824 bytes
- SHA-256: `a3657c7b2658cee5fa229307ec5e1fcd15ede2d048333701f6f9508e99af1ed0`
- States: image created PASS; file exported PASS; visual asset QA PASS (composition inspected, no visible text/logo/watermark, 3:1 bounds); integration PASS (city and ending CSS, offline bundle, PWA shell v4, APK and AAB include it); in-game screenshot QA PASS (`qa/screenshots/02-city-desktop.png`).
- Spend estimate: not returned by the generator
- Provenance/license: project-generated original; no third-party game asset used. Applicable platform terms were not independently audited.

## Jiang Ziya portrait v1

- File: `assets/portraits/jiang-zia.webp`
- Purpose: portrait for the independently authored `hero-01` Jiang Ziya roster entry.
- State: `RECREATED` (project-generated original; not copied from Dacky Mobile or another game).
- Source render: `/workspace/generated_images/exec-ac08750e-3341-4a6e-a359-4f46d97e4c29.png` (1086×1448 PNG, 2,780,117 bytes, SHA-256 `8a9fc5d0d5f882a0aa21b2757d752c466bddcfab9793af65da9c85c43f340353`).
- Generator: `image_gen__imagegen`; generated image ID `exec-ac08750e-3341-4a6e-a359-4f46d97e4c29`.
- Prompt version: `DACKY_JIANG_ZIYA_PORTRAIT_V1`.
- Prompt: “Create one original production-quality character portrait illustration for an offline strategy RPG inspired by classical Chinese myth, not based on any existing game art. Subject: Jiang Ziya, an elderly wise military strategist and immortal, long silver-white beard, calm observant eyes, dark indigo scholar-warrior robe with subtle antique gold cloud embroidery, a simple jade hairpin, holding a slender bamboo command scroll. Waist-up, front three-quarter pose, dignified and warm, elegant painterly mobile game key art, refined brush texture, cinematic soft golden dawn rim light, deep blue-green and muted gold palette, distinct readable silhouette at small card size. Vertical 3:4 composition, face in upper third, shoulders fully visible, atmospheric mountain mist and faint pines in background, detailed but uncluttered. No text, no calligraphy, no logos, no watermark, no UI, no frame, no collage, no extra hands or duplicate props.”
- Export: 768×1024 WebP, 184,080 bytes, SHA-256 `af844ce11966bbcaa4091ace3357e0799f86681c208c6024bbc8be608b968e18`.
- QA: visual review PASS for distinct face/silhouette, intact hand and scroll, no visible text/logo/watermark; portrait-card crop inspected; integration PASS in roster, offline HTML, PWA v4 cache, debug APK/AAB; browser screenshot `qa/screenshots/03-heroes-desktop.png` confirms the intended entry renders. No animation frames; this is a single portrait still.
- Spend estimate: not returned by the generator. Applicable platform terms were not independently audited.
