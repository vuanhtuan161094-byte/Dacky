# Visual Fidelity V2 — benchmark and comparison record

Local B/C captures use Chromium 1440×1000. Mobile captures use 390×844 and 844×390. B is the retained P50 build before this remake; C is the current build. Image files use the same viewport for matching desktop screens.

| Screen | A — current Mobile gameplay screenshot | B — before V2 | C — after V2 |
| --- | --- | --- | --- |
| Start | Not captured; no live player session screenshot | `before/01-start-desktop.png` | `after/01-start-desktop.png` |
| Thành trì | Not captured; current client city assets/modules inspected | `before/02-city-desktop.png` | `after/02-city-desktop.png` |
| Thần tiên | Not captured; current hero modules and portrait/UI assets inspected | `before/03-heroes-desktop.png` | `after/03-heroes-desktop.png` |
| Túi đồ | Not captured; no gameplay session capture | `before/04-inventory-desktop.png` | `after/04-inventory-desktop.png` |
| Binh doanh | Not captured; current troop source art inspected | `before/05-army-desktop.png` | `after/05-army-desktop.png` |
| Bản đồ thiên hạ | Not captured; current map source art/modules inspected | `before/06-world-desktop.png` | `after/06-world-desktop.png` |
| Thử thách/PvE | Not captured; no gameplay session capture | `before/07-pve-desktop.png` | `after/07-pve-desktop.png` |
| Khoa kỹ | Not captured; no gameplay session capture | `before/08-tech-desktop.png` | `after/08-tech-desktop.png` |
| Nhiệm vụ | Not captured; no gameplay session capture | `before/09-quests-desktop.png` | `after/09-quests-desktop.png` |
| Thị trường | Not captured; no gameplay session capture | `before/10-market-desktop.png` | `after/10-market-desktop.png` |
| Chiến báo | Not captured; no gameplay session capture | `before/11-reports-desktop.png` | `after/11-reports-desktop.png` |
| Thiết lập | Not captured; no gameplay session capture | `before/12-settings-desktop.png` | `after/12-settings-desktop.png` |
| Thư viện | Not captured; encyclopedia page inspected, not a game screen | `before/13-library-desktop.png` | `after/13-library-desktop.png` |
| Thành trì 390×844 | Not captured | `before/13-city-mobile-390.png` | `after/13-city-mobile-390.png` |
| Bản đồ 390×844 | Not captured | `before/14-world-mobile-390.png` | `after/14-world-mobile-390.png` |
| Thành trì ngang 844×390 | Not captured | `before/15-city-mobile-landscape-844.png` | `after/15-city-mobile-landscape-844.png` |
| Chiến trường thủ công | Not captured; no live battle session screenshot | `before/16-manual-army-battle.png` | `after/16-manual-army-battle.png` |
| Chiến trường sau lệnh pháp bảo | Not captured | `before/16-manual-army-battle.png` | `after/16-manual-battle-effect-120s.png` (frame from the recorded live runtime battle) |
| Chiến báo sau quyết toán | Not captured | `before/17-settled-battle-report.png` | `after/17-settled-battle-report.png` |
| Thành trì sau chiếm thành phụ | Not captured | `before/18-developed-city.png` | `after/18-developed-city.png` |

## A capture limitation

`https://dackytruvuong.com/play` is the primary current Mobile benchmark. The public page and its city, hero, map, UI, sound, troop sprite, and VFX modules were inspected. Headless Chromium did not produce a gameplay screenshot, even through the configured network proxy; no live player session was available. Therefore every A cell is explicitly marked **not captured**. No visual-match claim is based on A screenshots.

`https://dackytruvuong.com/phong-than-cac/` is the current game encyclopedia, not a gameplay screenshot gallery. The Kotaku and GameWatcher War of Legends galleries are legacy PC references and are not treated as current Mobile UI references.

The current public-client art files used by this build are listed with origin and SHA-256 in [`assets/visual-art-manifest.json`](../../assets/visual-art-manifest.json). Reuse is marked `OWNER_ATTESTED` from the project owner authorization; this manifest does not assert an independent SPDX license.
