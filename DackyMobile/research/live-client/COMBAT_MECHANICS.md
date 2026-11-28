# Quân đội, trận đánh và replay

Ngày khảo sát: 2026-11-28. Nguồn phân biệt rõ `LIVE_UI`, `PUBLIC_CLIENT` và `DACKY_CODE`; không gắn công thức ước lượng thành luật gốc.

## Phối quân đã kiểm tra bằng giao diện

- Bốn binh chủng là Trường Kích, Đao Thuẫn, Cung Tiễn và Kỵ Binh. Trợ giúp viết giới hạn mỗi loại quân bằng thống suất chia dân số lính; phối 0 trả toàn bộ quân về kho. Màn có checkbox tự bổ sung quân sau trận và nút lưu.
- Lượt này dùng đúng UI tối đa: ThiênMệnh 440 Cung Tiễn với thống suất 881; Kim Tố 2.204 Cung Tiễn với thống suất 4.408. Màn doanh trại ghi Kim Tố còn 7.106/7.993 lính rảnh sau các phân bổ hiện tại. Ảnh: [ThiênMệnh 440](evidence/v2/formation-thienmenh-440.png), [Kim Tố 2.204](evidence/v2/formation-kimto-2204-full.png).
- Capture V3 trên ThiênMệnh xác nhận lại trần hiển thị 440 Cung Tiễn khi thống suất 881; danh sách quân ghi tổng kho 7.993, phân phối cho tướng khác 2.651, còn rảnh 5.342. Checkbox `Tự bổ sung lính sau trận` đang bật trên màn này. Ảnh xác nhận trạng thái checkbox, không kiểm tra kết quả bổ sung sau một trận mới. [Ảnh](evidence/v3/hero-army-v3.png) · [JSON](database/hero-equipment-observation-v3.json).
- Bất Chu Sơn mặc định chọn thần tiên đang rảnh có quân, sắp theo cấp giảm dần và tối đa 5. Chọn thần tiên đầu tiên làm chủ tướng; chọn lại thần tiên đã chọn để bỏ; bấm một thần tiên khác đưa người đó lên đầu. Các hành vi này được xác minh trong `buzhou.js`; UI đội hình trước trận cho thấy 2/5.

## Trận PvE thực tế — Bất Chu Sơn tầng 1

Đã đánh một trận bằng lượt miễn phí, lối Tầm bảo. Đội trước trận là Đặng Thiền Ngọc 447 quân + Cao Thể Càn 240 quân (2 tướng, tổng 687). Đây là trận duy nhất có thể vào được trong phiên; sau đó UI không cho vào lại và thử mua một lượt 20 Xu cũng không mở khóa nút vào. Không nạp tiền hoặc tiếp tục thử mua.

| Trường | Quan sát trực tiếp |
|---|---|
| Tầng/đợt | Bất Chu Sơn tầng 1; kết quả hiện `Đợt 1/2 · Hiệp 3`. |
| Quân giữ tầng ở trang thông số | 10 tướng, cấp 50–60, tổng 360.000 quân, hệ số chỉ số ×1. |
| Đội đứng trên HUD trận | Video cho thấy Đặng Thiền Ngọc cấp 40, 447 quân đánh trước; sau khi số quân về 0, Cao Thể Càn cấp 38 vào ở pha kế tiếp với 240 quân. HUD Cao: thể lực 934/934, pháp lực 621/621, vũ lực 78, công 416, thủ 182. |
| Địch đứng trên HUD trận | Tinh Thần, cấp 51; HP/MP 100/100, công 232, thủ 130, vũ lực 34. |
| Trạng thái khi kết thúc | Thất bại ở hiệp 3; binh lực phía ta 0, phía NPC còn 7.080. Danh sách dự bị trên màn hình có bốn dòng 18.000. Không cộng các dòng này để suy ra tổng quân ban đầu vì quan hệ đội/hàng chưa được phân giải. |
| Phần thưởng | Danh vọng 150, kinh nghiệm 1.499; không thấy vật phẩm rơi. |
| Sau trận | UI báo đạo quân rút khỏi núi, vào lại leo từ tầng 1. Cao Thể Càn còn 6 quân được phối; trước trận là 240. Đây là chênh lệch số phối thấy trên UI, không phải phân loại chết/bị thương. |
| Replay/VFX | Đã bấm `Xem lại`; video đầy đủ 25 giây trong [buzhou-floor1-pve.mp4](evidence/combat/buzhou-floor1-pve.mp4) ghi trận và VFX thật. Clip 1600×900, H.264, 25 fps. Không có chat trong khung trận. |

Ảnh kết quả: [buzhou-battle1-result.png](evidence/v2/buzhou-battle1-result.png). Ảnh trước/sau đội: [trước trận](evidence/v2/buzhou-roster-before-battle.png), [sau trận](evidence/v2/buzhou-roster-after-loss.png). Timeline video: khoảng giây 1 Đặng hiện 447 quân; giây 11 còn 426; giây 12 hiện 0; ở pha kế tiếp khoảng giây 13 Cao xuất hiện với 240, rồi giảm còn 225. Video vì vậy giải quyết mismatch đội chọn/HUD trong chính trận này và trực tiếp cho thấy thay tướng sau khi đội trước cạn quân. Một encounter không đủ xác nhận mọi trường hợp thay quân. Video cho thấy số hiệp, các hàng quân, hit/critical VFX; chưa đủ log để dựng đúng thứ tự pháp bảo/Chiến Kỹ hay công thức damage.

### Thay tướng được quan sát và giới hạn còn lại

Đội trước trận ghi Đặng + Cao, tổng 687; video giờ cho thấy Đặng là đội đầu, chạm 0 rồi Cao vào pha kế tiếp. Mismatch đã giải quyết cho encounter này. Trình tự các đội sau đó, điều kiện chọn tướng nếu hàng không đủ quân, và liên hệ mỗi tướng với 5 người/đợt vẫn UNKNOWN. Trang thông số tầng ghi 10 tướng/360.000; màn kết quả lại chỉ để lộ một tướng đang đánh và bốn dòng dự bị 18.000, vì vậy phân bổ số quân theo từng tướng/đợt vẫn UNKNOWN.

## Bất Chu Sơn — quy tắc client được đọc sâu

`/mods/buzhou.js` cấu trúc giao diện và hành vi như sau:

- Ba lối: **Tầm bảo** (mỗi tầng vượt nhận một sách kinh nghiệm của tầng đó), **Chiêu hiền** (mỗi tầng vượt bắt một tướng trấn giữ; tầng thường có cơ hội chiêu mộ tướng thường và danh tướng hiếm), **Đoạt khí** (trang bị và tỉ lệ theo một lần vượt). Lối được chọn trước khi vào và bị khóa trong núi.
- Tối đa 5 tướng. Đội mặc định lấy tướng rảnh, đã phối quân, theo cấp giảm dần. Lối chỉ đánh tầng đang đứng; tầng khóa phải vượt tầng trước. Thua/hòa rút quân; thắng mới có thể lên tầng kế.
- Tầng chia quân giữ thành các đợt 5 tướng. Binh lực thương vong được truyền sang đợt tiếp; thua/hòa ở đợt nào thì rút khỏi núi. Trận có thể nhiều đợt, kết quả gom các trận con và replay chạy từ đợt đầu.
- Một lượt miễn phí khi còn `freeLeft`; trần giao diện là 6 lượt vào/ngày. Khi hết miễn phí, có thể dùng lượt mua; giao diện báo mặc định giá 20 Xu và tối đa 5 lượt mua/ngày. Điều kiện máy chủ không xác nhận được ngoài lần thử nêu trên.
- Mỗi thần tiên có thể chọn pháp bảo riêng trước khi xuất quân. Chỉ chủ tướng thi triển; khi chủ tướng hết quân, người thay lên dùng pháp bảo của chính họ. Chưa kiểm chứng điều này bằng trận có đổi tướng.

Đối chiếu `src/engine.js`, `src/pve-campaign.js`, `src/combat/*`: Dacky có campaign/phó bản và mô phỏng combat cục bộ, nhưng luật thương vong, phần thưởng ba lối và trạng thái rút khỏi núi chưa khớp bằng dữ liệu live. Số thương vong/loot trong engine Dacky có hệ số `SIMULATED`; trận gốc phụ thuộc kết quả máy chủ.

## Trình tự trận, điều khiển và biểu diễn

`battle-live.js` thể hiện giao diện nhận state theo hiệp, đưa sự kiện vào trình phát tuần tự, cho chọn pháp bảo trước hiệp và chọn đội thay ở lần đổi kế tiếp. `battle-hud.js` dựng thanh HP/MP tướng riêng với số `Binh lực`, dãy skill, pháp bảo, `Kết thúc`, `Tự Đánh`, tốc độ ×0.5/×1/×2/×3/×4, tắt hiệu ứng và rút lui. `Tự Đánh` trong client bỏ thời gian chờ và tự dùng pháp bảo theo mô tả code; chưa bật trong trận khảo sát. Client lưu các hiệp để `Xem lại` và phát lại sự kiện theo thứ tự.

`battle-tnl.js` và `battle-tnl-data.js` là lớp vẽ: hàng tiền/hậu quân, đội dự bị, hoạt ảnh tiến quân/đòn đánh/trúng đòn/ngã, VFX, âm thanh và khung số. Tệp cấu hình sinh sẵn khai báo 54 điểm bố trí cho mỗi lớp quân mẫu và các thời gian animation. Đó là thông số hiển thị, không phải số quân tối đa hoặc công thức damage. Catalog hiệu ứng: `battle-fx-catalog.js`, `battle-fx-script.js`, `battle-hit-fx.js`, `buzhou-fx.js`.

## Đối chiếu Dacky

## Tiên Sơn và Tỷ Thí Tướng V3 — chưa có trận xác minh

Màn tìm kiếm cho biết tài khoản ở Tiên Sơn tầng 4, tầng 5 đang mở. NPC An Phá Bại giữ 2 tướng cấp 10 với 1.482 quân và +30% độ khó; panel preview ba loại vật phẩm. Sau khi xếp 3/5 tướng, tổng 2.657 quân, nút `Xuất chinh` không chuyển trạng thái. UI chỉ hiện `Chưa xuất chinh được · 1` cho một tướng đang thành thủ; không thấy giải thích điều kiện bị chặn. Không ghi nhận hành quân, tiêu hao hay trận đấu. Dữ liệu đầy đủ và ảnh: [npc-trial-observation-v3.json](database/npc-trial-observation-v3.json).

Dacky dựng node Tiên Sơn từ bảng legacy Elfland. Advanced-field bosses dùng cấp suy ra trong `pve-campaign.js`, loadout có nhãn `SIMULATED_FROM_VERIFIED_LEGACY_IDS`; duel legacy trong `engine.js` dùng `resolveImmortalDuel` và phần thưởng generic, report ghi `SIMULATED`. Đây chưa phải ánh xạ đã xác minh cho NPC An Phá Bại hay cơ chế tăng độ khó theo lần thắng. Trạng thái so sánh là **PARTIAL**.

| Hành vi | Dacky hiện tại | Đánh giá |
|---|---|---|
| Lượt và kết quả trận | `src/combat/battle-session-v10.js`, `src/combat/runtime-v7.js`, `src/engine.js` chạy trận mô phỏng cục bộ; `battleCommand`/`battleAuto` có thể ghi lệnh. | **PARTIAL** — có vòng trận và nhật ký; chưa chứng minh tính tương đương trận live. |
| Damage, HP, buff, tương khắc | Công thức runtime ở `src/engine.js`/`src/combat/*`; một số hệ số/địch/loot được gắn `SIMULATED` hoặc `MIXED`. | **INCORRECT** nếu coi là công thức gốc; giữ nhãn mô phỏng cho tới khi có log trận server đủ trường. |
| Binh lực và thương vong | Engine giảm quân theo tỷ lệ mô phỏng, không có bằng chứng đối chiếu công thức từ trận này. | **UNKNOWN** về parity; không suy ra casualty ratio từ một trận. |
| Hiệp, thay quân, replay | Video replay trận thật ghi Đặng 447→426→0; Cao vào pha kế với 240→225; nút xem lại mở được. | **PARTIAL** — có vòng hiệp và replay; thay quân sau khi cạn quân **VERIFIED cho trận này**, luật tổng quát/damage/casualty vẫn **UNKNOWN**. |
| Hình trận/VFX | Có battle scene và asset phía Dacky nhưng khác pipeline. | **PARTIAL** về chức năng; timing/vfx parity **UNKNOWN**. |

Lược đồ kết quả máy trận gốc và evidence pointers: [database/battle-observations.json](database/battle-observations.json), [database/combat.json](database/combat.json). Module/hash: [database/client-modules.json](database/client-modules.json).
