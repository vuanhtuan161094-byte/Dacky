# Sự kiện, quà và buff

Ngày dữ liệu: 2026-11-28. LIVE_UI chứng minh màn hình đã xuất hiện trong phiên. PUBLIC_CLIENT chứng minh module/chuỗi giao diện công khai có tồn tại; không chứng minh server đang bật tính năng.

## Sự kiện nhìn thấy trong phiên

### Loạn Chiến

Panel hiển thị lịch khai chiến 01:00–15:00 ngày 29/11/2026, thời lượng 14 giờ; giờ được ghi theo đồng hồ client, không suy ra múi giờ. Cùng panel có nút đăng ký, danh sách tổng hợp đăng ký theo bốn máy chủ, tab Xếp hạng và Quà theo hạng. Ở V2 chưa bấm đăng ký; trong lần mở lại V3 thử một lần nhưng giao diện không đổi và không xác nhận đăng ký.

Trong trang quà, các hạng máy chủ hiện 1, 2, 3, 4–10 và 11–20. Bảng thưởng liên máy chủ cũng bắt đầu ở dưới. Ảnh cho thấy số lượng icon theo hạng, nhưng không mở tooltip; tên vật phẩm và ID vì vậy để null. Nút tham gia hiển thị hai loại icon với số lượng 50 và 1. Không gán ý nghĩa cho icon chỉ dựa hình ảnh.

Panel mô tả đăng ký để thành chính của người tham gia được chuyển vào bản đồ Loạn Chiến khi khai chiến. Danh sách hạng/người chơi động không được lưu.

#### Phiên đăng ký đang mở — V3

Ảnh chụp trực tiếp ngày 28/11 cho thấy một lịch khai chiến khác đang đếm ngược tới 01:00 ngày 29/11/2026, kết thúc 15:00 cùng ngày. UI cho biết cấp quân vương tối thiểu 10; có thể vào muộn trong 30 phút đầu; bản đồ giữa có bốn cổng và 12 Ma Trận. Mỗi Ma Trận ghi hồi 3% quân mỗi 10 giây, đồng thời tăng công/thủ quân 20%. Nếu vùng Ngai Vàng chỉ còn quân của một máy chủ, giữ vùng đủ một phút được 100 điểm. Điểm hiển thị: mỗi quân địch bị diệt +1, thắng trận +500, phòng thủ thành công +200; hệ số tương quan lực chiến trong khoảng 0,3–3. S2/S3/S4 lần lượt có công/thủ quân +10%/+30%/+50%; tốc độ di chuyển, sản xuất và huấn luyện đều ×5. Quy tắc chi tiết và các lượng thưởng theo hạng giữ trong [live-events-v3.json](database/live-events-v3.json).

Panel hiển thị 101 lượt đăng ký tổng hợp trên bốn máy chủ. Chỉ số tổng hợp được lưu, không có danh tính người chơi. Đã thử nút đăng ký một lần; UI không đổi và không xác nhận đăng ký. Không tiếp tục vào chiến trường vì UI cảnh báo phạt người vào mà không tham gia. Chưa kiểm tra trận PvP, settlement hoặc phần thưởng thực nhận. Múi giờ của lịch chưa hiện.

### Điểm Danh 8 Ngày — trạng thái nhìn thấy

Ảnh phiên đăng nhập cho thấy tiến trình 4/8 ngày và hai ngày quà đang chờ nhận. Ngày 7 là lựa chọn thần tiên; ngày 8 là lựa chọn bảo vật. Không nhận quà ở lần chụp V3. Cấu trúc và ảnh: [attendance-8day.png](evidence/v3/attendance-8day.png). Điều kiện reset/timezone và nội dung đầy đủ trong từng hộp vẫn chưa được kiểm tra.

### Quà Lớn Nạp Đầu

Panel có ba gói 20K, 50K, 100K và lộ trình quà ngày 1–3. Nhân vật trưng bày là Lôi Chấn Tử, căn cốt 30. Các ô quà được nhìn thấy bằng icon; chưa mở tooltip để định danh toàn bộ item. Không bấm mua hoặc nhận.

### Black Friday

Popup “Nạp 1 tặng 1” hiển thị thưởng thêm +100%, kết thúc ngày 30/11 lúc 16:59 (múi giờ server UNKNOWN). Ba mốc trên popup: nạp 50.000đ nhận 100.000 VNĐ trong ví; 200.000đ nhận 400.000 VNĐ; 1.000.000đ nhận 2.000.000 VNĐ. Ghi chú nêu áp dụng ngân hàng/thẻ cào, mọi máy chủ, không giới hạn lần nạp; phần tặng thêm không tính vào mốc nạp của sự kiện khác. Không nạp.

### Sale 11.11

Popup “Tướng Việt huyền thoại — giảm tới 75%” hiển thị bốn gói: Hồ Xuân Hương 999K (giá gốc 3.999K, giảm 75%), Bà Trưng 1.599K (3.999K, giảm 60%), Bà Triệu 999K (2.999K, giảm 67%), Thánh Gióng 999K (2.999K, giảm 67%). Mỗi gói có quà kèm và tối đa một lần mua mỗi gói. Timer lúc chụp còn khoảng 1 ngày 12 giờ; ngày kết thúc chính xác UNKNOWN. Không mua; không mở tooltip vật phẩm.

### Gói Hoan Hỉ

Panel mô tả bộ đủ sáu món: Mũ, Kiếm, Áo, Hộ Uyển, Đai, Hài. Mốc 2 món +10%, 4 món +15%, 6 món +30% tỷ lệ rơi đồ; các mốc không cộng dồn. Phạm vi hiển thị: ô đất, thăm dò, tìm kiếm, Tiên Sơn. Tướng từ cấp 5 mặc được; mỗi nhân vật mua tối đa một lần. Giá hiển thị 333K, giá gốc 540K. Không mua.

### Các sự kiện khác tìm thấy trong client công khai

| Tên UI | Hành vi được ghi trong JavaScript công khai | Trạng thái live |
|---|---|---|
| Lộc Đài Mật Tàng | Chọn kho thưởng trong ba nhóm; có lượt miễn phí mỗi ngày; vòng quay tích mốc thưởng; kho bị khóa sau lượt đầu mỗi ngày. | UNKNOWN; không mở panel trực tiếp. |
| Tuần Du Thần Linh | Tung xúc xắc ghé thành; thành thường nhận ngay; thành lớn yêu cầu phái Đắc Kỷ và đợi 10 phút. | UNKNOWN. |
| Điểm Danh 8 Ngày | Tiến trình ngày 1–8; UI gợi ý hộp chọn thần tiên ở ngày 7 và rương bảo vật tự chọn ngày 8; rương mở trong túi đồ và cần chỗ ở Tụ Tiên Các. | UNKNOWN. |
| Quà Tặng Mỗi Ngày | Nạp đủ mốc để nhận quà; client có nút nhận/nạp. | UNKNOWN; không tương tác mua. |
| Miếu Hội | Các nhãn Cầu Nguyện, Đào Ba Tấc Đất, Vũ Khí Tuyệt Thế, Tỉ Thí, Chiến Lệnh, Tiệm Tầm Bảo, Điểm Danh, Quà Tích Nạp. | UNKNOWN. |
| Đua Top | Nhãn đua Chiến Lực, Quan Chức, Thần Tiên. | UNKNOWN; bảng động không được ghi nhận. |
| Bảo Long Doanh Tài | Client mô tả gói theo mùa và nút mở Ma Trận. | UNKNOWN; gói trả phí, không mua. |

Tham chiếu chuỗi UI và hash: [public-client-assets.json](public-client-assets.json), các module events.js, su-kien-tnl.js, diem-danh-8.js, qua-moi-ngay.js, mieu-hoi.js, dua-top.js, loan-chien.js, nap-dau.js, goi-hoan-hi.js và bao-long.js. Ảnh: [event-black-friday.png](evidence/event-black-friday.png), [event-sale-11-11.png](evidence/event-sale-11-11.png).

## Carousel sự kiện và buff đang hiện — V2

Từ HUD đã mở đủ 5 trang carousel, không dùng vật phẩm hoặc bấm CTA mua. Các tên, hiệu ứng và thời hạn dưới đây được chép từ UI, không phải suy luận từ ID:

1. **Buff sự kiện: Thần tiên nước Việt** — còn 1 ngày 8 giờ. Thần tiên nước Việt xuất hiện tại đất hoang cấp 10–15; đánh các ô đó nhận +100% kinh nghiệm và +20% rơi vật phẩm. UI cảnh báo quân giữ đất mạnh hơn.
2. **Sự kiện rơi đồ (2)** — Lễ Tạ Ơn cho cơ hội nhận Gà Tây/Gà Tây Lễ Tạ Ơn khi thắng đất hoang hoặc Tiên Sơn; Ngày Nhà giáo Việt Nam 20/11 cho cơ hội nhận Hoa Cẩm Chướng Trắng/Vàng/Xanh trong cùng điều kiện. Màn ghi hai sự kiện “đang diễn ra”, không cho ngày kết thúc chính xác.
3. **Roi Bách Thảo Thần Nông** — còn 3 ngày 6 giờ; mô tả ghi tăng 25% sản lượng lương thực trong 7 ngày, dùng liên tục cộng dồn thời hạn.
4. **Lệnh Tăng Thuế Cao Cấp** — còn 11 ngày 6 giờ; mô tả ghi tăng 25% thu nhập thuế vàng trong 7 ngày, dùng liên tục cộng dồn thời hạn.
5. **Tăng ích liên minh** — “Thường trực”; tốc độ hồi thể lực +50%, tốc độ hồi pháp lực +50%. UI không nêu điều kiện nhận/thoát buff.

ID server của hai vật phẩm tăng sản lượng và buff liên minh không hiện ở tooltip, nên để null. Không kích hoạt vật phẩm; không kiểm tra cộng dồn giữa hai item khác nhau. Ảnh trang 1–5: [1](evidence/v2/events/event-carousel-1-buff.png), [2](evidence/v2/events/event-carousel-2-drop.png), [3](evidence/v2/events/event-carousel-3-artifact.png), [4](evidence/v2/events/event-carousel-4-tax.png), [5](evidence/v2/events/event-carousel-5-alliance.png). Dữ liệu: [live-events-v2.json](database/live-events-v2.json).

Trong phiên đã nhận quà đăng nhập miễn phí gồm 20 Binh Pháp Dị Chí và 10 Tiên Đan. Không nạp tiền, mua gói, đăng ký Loạn Chiến hoặc dùng vật phẩm. Một lượt miễn phí được dùng để đánh Bất Chu Sơn; thử xác nhận mua thêm lượt 20 Xu không làm nút vào hoạt động, nguyên nhân UNKNOWN.

## Đối chiếu Dacky

Dacky có nút Lương bổng ngày và Tuần tra trong src/ui.js, còn engine xử lý ở src/engine.js và công thức tạo đề nghị ở src/simulated-world.js. Chúng dùng ngày UTC, reward/cost sinh từ chapter/seed; src/simulated-world.js tự ghi WORLD_RULE_EVIDENCE là SIMULATED cho bảng event chưa khôi phục. Đây không thay thế lịch sự kiện, đăng ký, tiến trình đăng nhập nhiều ngày, shop đổi quà hoặc quà online của server gốc.

Adapter trong src/gameplay-p15.js ánh xạ một vật phẩm đổi quà Mobile và đánh dấu lượng đổi SIMULATED; giao diện src/ui.js cũng ghi rõ tỷ lệ đổi chưa có dữ liệu nguồn. Xem [item-gap.json](item-gap.json).

## Không xác minh

Chưa claim sự kiện, lượt quay, hòm thư hay quà xếp hạng; chưa nạp/mua hoặc đăng ký hoạt động tranh hạng. Điều kiện eligibility, reset theo timezone máy chủ, ID item chưa hiện trong tooltip, quy tắc cộng buff cùng loại/khác loại và hiệu lực mùa khác vẫn UNKNOWN.

Chuẩn hóa các quan sát V3: [live-events-v3.json](database/live-events-v3.json). Ảnh Loạn Chiến đang mở: [loanchien-active.png](evidence/v3/loanchien-active.png).

### Buff đang hưởng trên hồ sơ thần tướng — V3

Panel `Bảo vật — ThiênMệnh` xác nhận Roi Bách Thảo Thần Nông còn 77 giờ và Lệnh Tăng Thuế Cao Cấp còn 269 giờ, đều ghi phạm vi “toàn quốc”; Tăng ích liên minh đang bật và hiển thị hồi thể lực/pháp lực +50%. V2 carousel đã ghi hiệu lực số của hai vật phẩm là +25% sản lượng lương thực/thu nhập thuế trong 7 ngày, dùng liên tục cộng dồn thời hạn. Trong V3 không dùng/khởi hoạt vật phẩm. Panel “Bảo vật” này là trạng thái buff đang hưởng, phân biệt với bốn slot Pháp bảo trên hồ sơ. [Ảnh](evidence/v3/hero-artifacts-v3.png) · [JSON](database/buff-observations-v3.json).
