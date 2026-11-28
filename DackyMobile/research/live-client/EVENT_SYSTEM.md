# Sự kiện, quà và buff

Ngày dữ liệu: 2026-11-28. LIVE_UI chứng minh màn hình đã xuất hiện trong phiên. PUBLIC_CLIENT chứng minh module/chuỗi giao diện công khai có tồn tại; không chứng minh server đang bật tính năng.

## Sự kiện nhìn thấy trong phiên

### Loạn Chiến

Panel hiển thị lịch khai chiến 01:00–15:00 ngày 29/11/2026, thời lượng 14 giờ; giờ được ghi theo đồng hồ client, không suy ra múi giờ. Cùng panel có nút đăng ký, danh sách tổng hợp đăng ký theo bốn máy chủ, tab Xếp hạng và Quà theo hạng. Chưa bấm đăng ký.

Trong trang quà, các hạng máy chủ hiện 1, 2, 3, 4–10 và 11–20. Bảng thưởng liên máy chủ cũng bắt đầu ở dưới. Ảnh cho thấy số lượng icon theo hạng, nhưng không mở tooltip; tên vật phẩm và ID vì vậy để null. Nút tham gia hiển thị hai loại icon với số lượng 50 và 1. Không gán ý nghĩa cho icon chỉ dựa hình ảnh.

Panel mô tả đăng ký để thành chính của người tham gia được chuyển vào bản đồ Loạn Chiến khi khai chiến. Danh sách hạng/người chơi động không được lưu.

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

## Đối chiếu Dacky

Dacky có nút Lương bổng ngày và Tuần tra trong src/ui.js, còn engine xử lý ở src/engine.js và công thức tạo đề nghị ở src/simulated-world.js. Chúng dùng ngày UTC, reward/cost sinh từ chapter/seed; src/simulated-world.js tự ghi WORLD_RULE_EVIDENCE là SIMULATED cho bảng event chưa khôi phục. Đây không thay thế lịch sự kiện, đăng ký, tiến trình đăng nhập nhiều ngày, shop đổi quà hoặc quà online của server gốc.

Adapter trong src/gameplay-p15.js ánh xạ một vật phẩm đổi quà Mobile và đánh dấu lượng đổi SIMULATED; giao diện src/ui.js cũng ghi rõ tỷ lệ đổi chưa có dữ liệu nguồn. Xem [item-gap.json](item-gap.json).

## Không xác minh

Không có transaction, claim, đăng ký, lượt quay, quà hòm thư, thưởng xếp hạng hay buff online nào được thực hiện. Điều kiện eligibility, reset theo timezone máy chủ, giá trị thật của icon chưa có tooltip và hiệu lực mùa khác vẫn UNKNOWN.
