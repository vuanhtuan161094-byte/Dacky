# Phân tích module client công khai — V2

Ngày lấy: 2026-11-28. Snapshot full listing và SHA-256 ở [database/client-modules.json](database/client-modules.json). File thô chỉ được giữ ngoài checkout trong thời gian phân tích và không đưa vào commit.

## Phạm vi đọc

Trang game phục vụ 145 đường dẫn `/mods/*.js` cùng origin; batch lấy 138 module sau khi loại 7 nhóm liên quan chat/group chat, hỗ trợ khách hàng, account helper, leaderboard, chọn server và mail/notification. Đọc sâu 26 module hệ thống, sau đó kiểm tra bổ trợ/điều kiện ở các module quân, nhiệm vụ, đô thành, sự kiện và item. Không gọi API/game command bằng đường ngoài UI, không đọc endpoint quản trị, không trích token/protocol. Không xem danh sách người chơi, mail hoặc chat.

Các nhận xét dưới đây chia thành:

- **CODE UI**: logic dựng màn/điều kiện hiển thị trong module client.
- **LIVE UI**: text/hành vi được nhìn trực tiếp sau đăng nhập.
- **SERVER/DATA DEPENDENCY**: module đọc state/game data được phát cho client; không thể xác minh quy tắc chỉ từ render code.
- **UNKNOWN**: chỉ code hoặc một trận mẫu chưa đủ kết luận.

## Combat, đội quân và replay

### `battle-live.js`, `battle-hud.js`, `battle-screen.js`

- HUD tách thanh thể lực/pháp lực tướng khỏi số `Binh lực` của đội. State có avatar, cấp, vũ lực, công, thủ, danh hiệu, pháp bảo, kỹ năng, trạng thái hiệp/đợt và timer.
- Dàn pháp bảo có ô `Công kích` (không thi triển, hao 0) trước các món đang mang. Món thiếu pháp lực hoặc bị khóa không chọn được; việc chọn gọi đường điều khiển hiệp. Khi auto bật, client giữ trạng thái toggle qua lần dựng lại HUD và mô tả tự bỏ thời gian chờ/tự dùng pháp bảo.
- HUD có `Kết thúc`, `Tự Đánh`, tốc độ ×0.5/×1/×2/×3/×4, `Tắt hiệu ứng`, `Rút lui`; hàng danh sách có đội đang đấu và các đội còn lính.
- Sự kiện trận được đưa vào queue tuần tự. Hiệp resume được dựng lại từ đầu danh sách để tránh nhân đôi; replay dùng các hiệp đã lưu, có thể giữ thời tiết và pháp bảo đã dùng. Kết quả/loot được đọc sau khi trận được server quyết toán.
- Đổi đội được xếp cho lần đổi đội kế tiếp; bản đồ animation dựng đội mới rồi mới áp số binh lực tương ứng. Một trận có thể có thay đội, nhưng batch này chưa có live trận nào đủ đổi quân để xác minh.

### `battle-tnl.js`, `battle-tnl-data.js`, `battle-fx-*`, `battle-hit-fx.js`

- Bố cục TNL render có lớp tiền quân/hậu quân, đơn vị tướng, cờ, hàng quân đang chờ và đội kế tiếp còn lính. Đội dùng nhiều khối `heroGroup` được gom khi dựng hình.
- Animation dùng các trạng thái đứng, chạy/xông lên, lùi về, bắn/đạn, trúng đòn, chết/ngã và ẩn xác. Sự kiện hit mới áp con số vào đúng thời điểm va chạm; số quân server là nguồn sự thật, số nhân vật vẽ trên màn là đại diện theo tỷ lệ.
- Tệp data tự sinh ghi đội hình có 54 tọa độ tiền quân và 54 tọa độ hậu quân cho từng mẫu; các timing như bước chạy, hit delay, hồi, bullet range, shock interval chỉ phục vụ vẽ. Không biến những số này thành damage/casualty rule.
- Catalog VFX chứa cấu hình effect id, sprite/animation, thời gian và thuộc tính render như scale, offset, alpha, hue. `ma-tran.js` đọc MovieClip atlas và JSON frame/rect/offset/fps; `danh-hieu.js` dựng biển động từ chuỗi frame.

### Đối chiếu với trận thật

Một trận PvE Bất Chu Sơn tầng 1 thất bại ở hiệp 3 đã được quay video: [clip](evidence/combat/buzhou-floor1-pve.mp4), [kết quả](evidence/v2/buzhou-battle1-result.png). Trận xác nhận HUD/VFX tồn tại thật và kết quả có danh vọng/kinh nghiệm; không xác nhận công thức damage. Trước trận có 2 tướng/687 quân, nhưng HUD trong trận chỉ cho Cao Thể Càn; chưa xác định Đặng Thiền Ngọc được dùng ở đợt kế hay danh sách trận khác với đội đã chọn.

## Bất Chu Sơn

`buzhou.js` là module có code gameplay UI đọc chi tiết nhất. Nó hiển thị ba lối tu luyện và đổi bảng thưởng theo mode:

| Mode | Hiển thị thưởng trên từng tầng | Ghi chú code |
|---|---|---|
| Tầm bảo | Một quyển sách kinh nghiệm riêng cho tầng đó. | Vượt tầng nào nhận đúng một sách tầng đó. |
| Chiêu hiền | Một tướng bắt/chiêu mộ, phạm vi cấp/căn cốt/tỉ lệ theo tầng. | Màn có danh sách danh tướng hiếm; giá trị cụ thể nằm ở state/game data. |
| Đoạt khí | Trang bị và tỉ lệ của một lần vượt tầng. | UI mobile hiển thị tối đa 6 item, desktop tối đa 8. |

Đội mặc định là các tướng rảnh đã phối binh, cấp cao trước, tối đa 5. Thay tướng đầu đội đổi chủ tướng; mỗi tướng có trường pháp bảo. Client ghi chú chủ tướng thi triển; tướng kế tiếp thay khi hết quân sử dụng lựa chọn của họ. Khi đang trong núi, mode bị khóa; muốn đổi phải rời trước. Bản đồ có 5 floor, chỉ đánh tầng đang đứng, khóa tầng sau theo tiến độ. Mỗi tầng chia defender thành wave 5 tướng; phần code ghi thương vong được đem sang wave kế, thua/hòa làm rút khỏi núi.

UI ghi 6 lần vào/ngày, một lần miễn phí nếu còn, và tối đa 5 lần mua/ngày; giá hiển thị 20 Xu. Trong live một trận free đã dùng. Xác nhận 20 Xu được hiển thị, nhưng sau khi đồng ý nút vào vẫn disabled; nguyên nhân thiếu Xu/điều kiện khác chưa xác minh.

## Thần tướng, tăng trưởng, pháp bảo

- `than-tuong.js`: roster, hồ sơ, attributes, cultivation, skill, troop assignment; client presentation không quyết tăng trưởng server.
- `tu-phat.js`: room/package/duration/eligible hero/reward overview; thời gian/chất lượng phụ thuộc state, không suy luận giá trị chỉ từ UI code.
- `theurgy.js`: UI chọn phép theo thành/tướng/đạo pháp và hiển thị mục tiêu/hiệu ứng; hiệu lực là server/game-data dependency.
- `phap-bao-tich.js`: danh sách/chi tiết/chọn pháp bảo; chiến đấu dùng danh sách phép được máy chủ gửi, không phải danh sách mọi item trong kho.
- `ma-tran.js`: per-hero activation state, tab phẩm và bệ vòng sáng; vòng đứng được đổi riêng không kéo theo reset chỉ số. Live help là nguồn 37 loại và điểm +2/+4/+8; module render không hardcode số đó.
- `danh-hieu.js`: kho/trang bị/preview/duration; client source comment nêu 55 title chính thức, mỗi thần tiên một title, hết hạn tính từ lúc nhận và không tháo trước hạn. Cần giữ nguồn là code-comment cho tới khi UI mở đủ toàn bộ.

## Hoạt động, sự kiện, nhiệm vụ

- `events.js`/`su-kien-tnl.js` dựng thẻ giới thiệu, chọn pool, spin/milestone; xem thẻ không tự vào event. `diem-danh-8.js` cho reward tile mở tooltip, có luồng chọn quà và confirm riêng. `bao-online.js` dựng thông báo/quà có timer.
- `loan-chien.js` có lịch/đăng ký/xếp hạng/quà. Live popup Loạn Chiến đã hiện điều kiện, nhưng không đăng ký.
- `tower.js` cho thấy Thần Tháp yêu cầu ghi danh rồi mới lên bảng và khiêu chiến; live lobby xác nhận 568 thần tiên tranh hạng liên server, 10 lượt/ngày và 4 slot pháp bảo. Đây là arena competitive; không khiêu chiến.
- `strongpoint.js` dựng chiến trường bang: sa bàn, ghi danh, kho quân, đóng góp, quầy đổi và lịch đấu. Live panel Đồng Quan ghi NPC garrison 5 tướng cấp 80–100, 272.000 quân. Không ghi danh bang.
- `quests.js` đưa bước Trận đầu tới ô đất hoang cấp 0 gần thành; nhiệm vụ danh vọng phân biệt thắng đất hoang và vượt Tiên Sơn. Không tự chọn target chưa xác định là NPC.
- `college.js` đọc tech levels/cost/prerequisite/effect/timer từ `gamedata`; điều kiện UI gồm level công trình/thuật, quan chức và vật phẩm. Code comment nêu research duration giảm theo buff Mưu lược thành thủ ×0,5% mỗi đơn vị buff. Chưa xác minh trong UI sống của tài khoản này.

## Thành, kinh tế và item

- `noi-chinh.js` gom tab tài nguyên, trị thành, thuật và lãnh thổ; `subcity.js` hiển thị điều kiện/đặt thành phụ; `binh-doanh.js` và `barrack-calc.js` lo UI huấn luyện/phối quân. Dùng text hướng dẫn live để xác minh thống suất/dân số quân thay vì coi mọi phép tính client là authoritative.
- `bag.js` chứa inventory/detail surfaces; `item-supplement.js` ghép UI nhiều item. Module xuất hiện không chứng minh item có trong save hoặc điều kiện dùng đã met; không dùng item trong V2.
- `manh-hon.js` làm dashboard nhiệm vụ tiến độ. Live đã xem các tab Hướng đi, Tài nguyên, Cẩm nang; `Đi` là điều hướng tới hệ thống được gợi ý, không tự nâng cấp.

## Dữ liệu hóa và giới hạn

Từng module trong snapshot có `reviewTier: deep|survey|inventory`, khu vực, nhận xét, byte count và SHA-256. Các chi tiết đã xác minh hành vi được lưu riêng ở [live-events-v2.json](database/live-events-v2.json), [battle-observations.json](database/battle-observations.json), [combat.json](database/combat.json), `events.json`, `growth-catalog.json` và các catalog hiện có. Nhiều data cần server state; không trích API, không lấy nội dung chat/account khác, và không gắn công thức mô phỏng Dacky với nhãn gốc.
