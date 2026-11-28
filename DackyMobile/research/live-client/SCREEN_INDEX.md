# Chỉ mục khảo sát live client

Ngày khảo sát: 2026-11-28. Game: https://dackytruvuong.com/play. Nhánh mã đối chiếu: `integration/dacky-total-finalization`. Mốc nghiên cứu kế thừa: `711f08063173084702d88e99927fd846eb7637ae`.

## Đăng nhập và phương pháp

- Đã kiểm tra `DACKY_USERNAME` và `DACKY_PASSWORD` có trong môi trường mà không in giá trị. Chromium/Playwright đăng nhập qua form thông thường và giữ phiên trong browser context.
- Lỗi TLS đầu tiên là Chromium không tin CA của môi trường dù HTTPS xác minh được bằng trust store hệ điều hành. Đã thêm root CA môi trường vào NSS DB tạm trong `/tmp`; trang tải HTTP 200 với `ignoreHTTPSErrors=false`. Không tắt xác minh TLS, không có CAPTCHA.
- Nhân vật nghiên cứu là ThiênMệnh, máy chủ S4 Kỳ Sơn. Không gửi chat, không mở danh sách người chơi, thư hoặc bảng xếp hạng có danh tính động.
- Chỉ dùng UI bình thường cho quà đăng nhập miễn phí và một lượt PvE; không nạp tiền, không mua gói. Một lượt Bất Chu Sơn khác không mở được sau khi xác nhận hộp mua 20 Xu; nguyên nhân chưa rõ. Không thử thanh toán tiền thật.
- 145 đường dẫn module `/mods` same-origin được thấy; 138 module công khai tải về và đọc theo nhóm, 7 nhóm riêng tư/leaderboard/mail bị loại. Không gọi API ngoài UI, không dò đường dẫn admin, không thu thập dữ liệu người khác. Hash/nhận xét nằm ở [database/client-modules.json](database/client-modules.json); phân tích ở [CLIENT_MODULE_ANALYSIS.md](CLIENT_MODULE_ANALYSIS.md).
- Không tải lại 2.656 Mobile records đã có. Không sửa code gameplay.

## Màn đã mở trong UI

| Khu vực | Bằng chứng và trạng thái |
|---|---|
| Thành nội/HUD | Bản đồ, thanh tài nguyên, icon sự kiện; lối tới Nội chính, Thần tướng, Quân tình, Ngoại giao, Báo cáo, Thư, Địa đồ, Ngoại thành và trợ giúp. [main-menu-city.png](evidence/main-menu-city.png) |
| Quà đăng nhập | Đã nhận 20 Binh Pháp Dị Chí và 10 Tiên Đan miễn phí. Không dùng tiếp item. [login-reward-claim.png](evidence/v2/login-reward-claim.png) |
| Loạn Chiến | Lịch/điều kiện/đăng ký/xếp hạng/quà; không ghi danh. [event-loan-chien.png](evidence/event-loan-chien.png) |
| Offer trả phí | Quà Lớn Nạp Đầu, Black Friday, Sale 11.11, Hoan Hỉ; chỉ xem, không mua. [event-first-topup.png](evidence/event-first-topup.png), [event-black-friday.png](evidence/event-black-friday.png), [event-sale-11-11.png](evidence/event-sale-11-11.png), [event-hoan-hi.png](evidence/event-hoan-hi.png) |
| Event/buff carousel | Mở đủ 5/5 trang, có Thần tiên nước Việt, sự kiện rơi đồ, Roi Bách Thảo, Lệnh Tăng Thuế và ích liên minh. [Ảnh 1–5](evidence/v2/events/) · [JSON](database/live-events-v2.json) |
| Thần tướng/tăng trưởng | Thuộc tính, Tu luyện, Phi Thăng, Phong thần, Chuyển sinh, Chiến Kỹ, Ma Trận, Danh hiệu, phép/bảo vật. [hero-growth.png](evidence/hero-growth.png), [hero-skills.png](evidence/hero-skills.png), [hero-matrix.png](evidence/hero-matrix.png), [hero-combat-skills.png](evidence/hero-combat-skills.png); V3 snapshot hồ sơ tại [hero-growth-v3.png](evidence/v3/hero-growth-v3.png), active buffs tại [hero-artifacts-v3.png](evidence/v3/hero-artifacts-v3.png), ô Pháp bảo chưa có vật phẩm phù hợp tại [hero-artifact-slot-v3.png](evidence/v3/hero-artifact-slot-v3.png). [JSON equipment](database/hero-equipment-observation-v3.json) · [buff](database/buff-observations-v3.json) · [title/matrix](database/title-system-observation-v3.json). |
| Phối quân | Bốn loại quân; trợ giúp xác nhận giới hạn bằng thống suất chia dân số lính. ThiênMệnh 881/440; Kim Tố 4.408/2.204; V3 thấy 7.993 tổng kho, 2.651 cấp cho tướng khác, 5.342 rảnh, tự bổ sung được bật (kết quả sau trận chưa thử). [ảnh ThiênMệnh](evidence/v2/formation-thienmenh-440.png), [ảnh Kim Tố](evidence/v2/formation-kimto-2204-full.png), [V3](evidence/v3/hero-army-v3.png) |
| Quân tình | Xuất chinh, Cảnh giới, Đóng quân, Liên minh; các ảnh nền từ checkpoint cũ. [army-overview.png](evidence/army-overview.png), [army-scout.png](evidence/army-scout.png), [army-garrison.png](evidence/army-garrison.png), [army-alliance.png](evidence/army-alliance.png) |
| Nội/ngoại thành | Nội chính các tab Tài nguyên/Trị thành/Tiên thuật/Lãnh thổ; V2 mở cảnh ngoại thành tuyết có lưới ô cấp 7–9. [city-resources.png](evidence/city-resources.png), [outside-city-v2.png](evidence/v2/outside-city-v2.png) |
| Mạnh Hơn | Mở đủ Hướng đi và Tài nguyên; gợi ý phối binh, 6 món trang bị, công trình và farm Tiên Thạch; tài nguyên tới quân, tướng, tu vi, trang bị, đá, pháp bảo, thú cưỡi và danh vọng. [progress](evidence/v2/manhon-progress-v2.png), [guide](evidence/v2/manhon-guide-v2.png) |
| Phong Thần Tháp | Lobby ghi 568 thần tiên tranh hạng liên server, 10 lượt/ngày, 4 slot pháp bảo; yêu cầu ghi danh. Không ghi danh hoặc khiêu chiến. [ảnh](evidence/v2/tower-lobby-v2.png) · [JSON](database/tower-observation-v2.json) |
| Cứ Điểm Chiến | Sa bàn 27 điểm và panel Đồng Quan; NPC phòng thủ 5 tướng cấp 80–100, 272.000 quân, lịch bang theo kỳ. Không đăng ký. [ảnh](evidence/v2/strongpoint-lobby-v2.png) · [JSON](database/strongpoint-observation-v2.json) |
| Bất Chu Sơn | 5 tầng, thông số tầng 1, roster, lối Tầm bảo, đội hình 2/5 và mua lượt. Đánh 1 PvE rồi thất bại; replay video cho thấy Đặng Thiền Ngọc cạn quân trước khi Cao Thể Càn vào pha kế. [evidence/v2](evidence/v2/) · [video](evidence/combat/buzhou-floor1-pve.mp4) |
| Túi đồ | Mở đủ danh mục; snapshot 58 món. Tooltip xác nhận Sách Kinh Nghiệm Cao Cấp +500.000 EXP tướng và Hộp cơm nóng hồi Hoạt Lực tới trần. Không dùng item. [ảnh](evidence/v3/inventory-all.png) · [JSON](database/inventory-observation-v3.json) |
| Điểm Danh 8 ngày | Capture 4/8 ngày, còn 2 ngày quà chờ nhận; ngày 7 là hộp tự chọn thần tiên, ngày 8 là rương bảo vật tự chọn. Chưa bấm Nhận trong lần chụp này. [ảnh](evidence/v3/attendance-8day.png) |
| Loạn Chiến đang mở đăng ký | UI hiển thị khai chiến 01:00, kết thúc 15:00 ngày 29/11/2026; quy tắc điểm, buff bản đồ và thưởng theo hạng. Không xác nhận đăng ký hoặc vào chiến trường. [ảnh](evidence/v3/loanchien-active.png) · [JSON](database/live-events-v3.json) |
| Tiên Sơn / Tỷ Thí Tướng | Tìm kiếm cho thấy tài khoản ở tầng Tiên Sơn 4, tầng 5 mở; NPC An Phá Bại có 2 tướng cấp 10/1.482 quân/+30%, ba phần thưởng preview. Xếp đội 3/5 (2.657 quân); nút Xuất chinh không khởi chạy và không trừ tài nguyên. [Tiên Sơn](evidence/v3/world-search-tien-son-v3.png), [NPC](evidence/v3/npc-boss-panel-v3.png), [đội xuất chinh](evidence/v3/npc-sortie-v3.png) · [JSON](database/npc-trial-observation-v3.json) |
| Quân Tình | Xuất chinh, Cảnh giới, Đóng quân, Liên minh; ảnh cho thấy danh sách Xuất chinh trống và yêu cầu Phong Hỏa Đài cấp 7. [ảnh](evidence/v3/army-menu.png) |

## Trận và giới hạn xác minh

Trận Bất Chu Sơn hiện đợt 1/2, hiệp 3, Cao Thể Càn cấp 38 đấu Tinh Thần cấp 51; kết quả thua, quân ta 0, NPC còn 7.080, thưởng 150 danh vọng +1.499 kinh nghiệm. Video replay chứng minh Đặng Thiền Ngọc (447→0) đánh trước, Cao Thể Càn vào ở pha sau với 240 quân; chưa đủ để khái quát mọi điều kiện thay quân. Xem [COMBAT_MECHANICS.md](COMBAT_MECHANICS.md) và [battle-observations.json](database/battle-observations.json).

Chưa hoàn thành trận PvE thứ hai. Bất Chu Sơn không mở thêm lượt sau lượt miễn phí. V3 mở Tiên Sơn (tài khoản ở tầng 4, tối đa tầng 5 đang mở) và Tỷ Thí Tướng An Phá Bại, thử xếp đội 3/5 tổng 2.657 quân rồi bấm Xuất chinh; UI không chuyển sang hành quân, không trừ tài nguyên và chỉ hiển thị “Chưa xuất chinh được · 1” cho thần tiên thành thủ. Nguyên nhân chính xác chưa hiển thị. Thần Tháp/Cứ Điểm là hoạt động tranh hạng/bang theo lịch nên không tham gia.

## Chưa đủ bằng chứng trực tiếp

- Đã mở màn tìm kiếm Tiên Sơn và Tỷ Thí Tướng; chưa hoàn thành trận ở hai mode này. Chưa mở sâu bảng khoa kỹ, tooltip toàn bộ item, toàn bộ event đang inactive, toàn bộ report, quest reward, online reward, hoạt động bang tương tác hoặc các tầng Bất Chu Sơn khác.
- Video đã xác minh thay tướng khi Đặng cạn quân trong encounter này; chưa thao tác thay quân thủ công/pháp bảo/Chiến Kỹ trong trận, `Tự Đánh` không bật. V3 xác nhận 4 slot Pháp bảo nhưng không có vật phẩm phù hợp trong kho; damage formula, dead/wounded split và điều kiện thay quân tổng quát vẫn chưa rõ.
- Chưa có album sưu tập tăng chỉ số riêng; Ma Trận là per-hero permanent growth. V3 xác nhận hai buff theo thời hạn và ích liên minh đang bật, nhưng ID, reset/mùa và stacking giữa nhiều nguồn vẫn UNKNOWN.
- UI desktop 1600×900; chưa kiểm thử Android/mobile/touch.

## Nguồn chứng cứ

- `LIVE_UI`: thấy hoặc thao tác trực tiếp; ảnh/video kèm trong evidence.
- `PUBLIC_CLIENT`: module JavaScript cùng origin; chứng minh nhãn/UI/logic client, không tự chứng minh máy chủ đang bật hay state người chơi.
- `DACKY_CODE`: mã hiện tại dùng để so sánh.
- `UNKNOWN`: chưa đủ chứng cứ hành vi/số gốc.
