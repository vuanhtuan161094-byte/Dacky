# Thần tướng, tu luyện và Ma Trận

## Thông tin trực tiếp trong UI

Hồ sơ Thần tướng chia tab Thuộc tính, Tu luyện, Kỹ năng và Phối binh. Trang thuộc tính hiển thị căn cốt, tiềm năng, thống suất, trung thành, trạng thái và vị trí trang bị. Các giá trị thuộc tài khoản đã được che khỏi ảnh.

### Phi thăng và Phong thần

Trang Con đường thành thần ghi Phi thăng cần cấp từ 80, Lệnh Phi Thăng, 100.000 vàng và thần tướng đang rảnh. Mô tả sau khi phi thăng: về cấp 1, giữ một nửa chỉ số theo nghề. Phong thần mở sau Phi thăng; Phép thần thông mở sau Phong thần.

### Chuyển sinh và căn cốt

Trang Bồi căn cốt ghi Chuyển sinh — luyện Căn cốt cần đã Phi thăng, cấp từ 59, đang rảnh và có lò luyện. Đan đổi Căn cốt và Tẩy tủy — hoàn điểm tư chất là các thao tác riêng. Không sử dụng lò, đan hoặc tẩy tủy.

### Ma Trận

Hướng dẫn trong game xác nhận Ma Trận là vòng sáng dưới chân và chỉ tăng chỉ số cho thần tiên tương ứng. Có 37 Ma Trận: Sử Thi 12 loại (+2 mỗi loại), Truyền Thuyết 12 loại (+4), Thần Thánh 13 loại (+8). Mỗi loại chỉ kích hoạt một lần cho mỗi thần tiên và tiêu hao một Ảo Hóa cùng loại. Mọi Ma Trận đã mở cộng dồn chỉ số; vòng sáng đang hiển thị có thể đổi miễn phí. Khi vào trận, vòng hiện dưới chân thần tiên ở cả hai phe. Nguồn Ảo Hóa được hướng dẫn là thư, sự kiện và gift code.

### Chiến Kỹ

Trang Chiến Kỹ liệt kê Truy kích, Tử chiến, Mưu lược, Ban phúc, Trùng sinh và Né chiêu. Chỉ một kỹ năng được sử dụng cùng lúc. Màn hình Truy kích ghi ngưỡng quân đối diện dưới 75% binh lực và chi phí học 15.000 điểm; mở nâng cao có giá 25.500 điểm. Tab Nâng cao mô tả mốc kỹ năng cấp 17 giảm 30% việc tạo và hồi quân đối phương, hiệu lực mọi trận. Không học hoặc nâng cấp.

## Đối chiếu triển khai hiện tại

- src/ui.js hiển thị hồ sơ Mobile, nhưng dossier hiện nêu ba ô chính Vũ khí/Giáp/Pháp bảo; giao diện live có tám ô: Mũ, Giáp, Đai, Giày, Ngựa, Pháp bảo, Vũ khí, Cổ Khí, Cấm Khí (một số mục UI là nút/ô riêng). Cần đối chiếu slot từng nhân vật trước khi kết luận số slot hợp lệ.
- src/engine.js rebirthHero hiện yêu cầu cấp 60, chưa gán đội và giới hạn 5 lần; giá trong action là 8.000 + 3.000 mỗi lần, cộng căn cốt và đưa về baseLevel. combat/progression-v3.js lại có PROGRESSION_POLICY rebirthGold 1.670.000. Hai đường dữ liệu không thống nhất và đều không khớp Phi thăng/Chuyển sinh live; không dùng làm quy tắc nguồn.
- Dacky nhận item Ma Trận vào danh sách matrices trong engine.js, nhưng combat/product-v13.js tăng hệ số chiến đấu theo số ma trận và có trần. UI gốc cho điểm cộng phẳng theo phẩm, cộng dồn theo từng loại, và phân biệt vòng hiệu ứng. Cơ chế hiện tại được phân loại INCORRECT.
- UI Dacky có skillLevel và kỹ năng combat; chưa có bằng chứng về bảng sáu kỹ năng, giá điểm, cap 25 và quy tắc nâng cao cấp 17 giống live.

Chi tiết có cấu trúc: [growth-catalog.json](growth-catalog.json). Ảnh: [hero-growth.png](evidence/hero-growth.png), [hero-skills.png](evidence/hero-skills.png), [hero-matrix.png](evidence/hero-matrix.png), [hero-matrix-help.png](evidence/hero-matrix-help.png), [hero-combat-skills.png](evidence/hero-combat-skills.png), [hero-skill-advanced.png](evidence/hero-skill-advanced.png).
