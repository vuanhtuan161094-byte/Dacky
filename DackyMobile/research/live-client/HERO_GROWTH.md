# Thần tướng, tu luyện và Ma Trận

## Thông tin trực tiếp trong UI

Hồ sơ Thần tướng chia tab Thuộc tính, Tu luyện, Kỹ năng và Phối binh. Trang thuộc tính hiển thị căn cốt, tiềm năng, thống suất, trung thành, trạng thái và vị trí trang bị. Ảnh baseline đã lọc dữ liệu ngoài tài khoản; V3 giữ nguyên số liệu của tài khoản nghiên cứu theo quyền đã cấp.

### Phi thăng và Phong thần

Trang Con đường thành thần ghi Phi thăng cần cấp từ 80, Lệnh Phi Thăng, 100.000 vàng và thần tướng đang rảnh. Mô tả sau khi phi thăng: về cấp 1, giữ một nửa chỉ số theo nghề. Phong thần mở sau Phi thăng; Phép thần thông mở sau Phong thần.

### Chuyển sinh và căn cốt

Trang Bồi căn cốt ghi Chuyển sinh — luyện Căn cốt cần đã Phi thăng, cấp từ 59, đang rảnh và có lò luyện. Đan đổi Căn cốt và Tẩy tủy — hoàn điểm tư chất là các thao tác riêng. Không sử dụng lò, đan hoặc tẩy tủy.

### Ma Trận

Hướng dẫn trong game xác nhận Ma Trận là vòng sáng dưới chân và chỉ tăng chỉ số cho thần tiên tương ứng. Có 37 Ma Trận: Sử Thi 12 loại (+2 mỗi loại), Truyền Thuyết 12 loại (+4), Thần Thánh 13 loại (+8). Mỗi loại chỉ kích hoạt một lần cho mỗi thần tiên và tiêu hao một Ảo Hóa cùng loại. Mọi Ma Trận đã mở cộng dồn chỉ số; vòng sáng đang hiển thị có thể đổi miễn phí. Khi vào trận, vòng hiện dưới chân thần tiên ở cả hai phe. Nguồn Ảo Hóa được hướng dẫn là thư, sự kiện và gift code.

### Chiến Kỹ

Trang Chiến Kỹ liệt kê Truy kích, Tử chiến, Mưu lược, Ban phúc, Trùng sinh và Né chiêu. Chỉ một kỹ năng được sử dụng cùng lúc. Màn hình Truy kích ghi ngưỡng quân đối diện dưới 75% binh lực và chi phí học 15.000 điểm; mở nâng cao có giá 25.500 điểm. Tab Nâng cao mô tả mốc kỹ năng cấp 17 giảm 30% việc tạo và hồi quân đối phương, hiệu lực mọi trận. Không học hoặc nâng cấp.

## Trạng thái tài khoản nghiên cứu và thực nghiệm đội hình — V2

Tài khoản phụ đã dùng quà đăng nhập miễn phí: 20 Binh Pháp Dị Chí và 10 Tiên Đan. Đội hiện có ThiênMệnh cấp 6, Đặng Thiền Ngọc cấp 40, Kim Tố cấp 36 và Cao Thể Càn cấp 38. Những giá trị dưới đây là số của chính save nghiên cứu:

- ThiênMệnh là thành thủ; màn Phối binh cho thấy thống suất 881 và giới hạn 440 Cung Tiễn theo dân số lính 2.
- Kim Tố có thống suất 4.408, giới hạn 2.204 Cung Tiễn, thể lực 894/894, pháp lực 580/580, trung thành 9/100, căn cốt Cao, trạng thái Rảnh và bổng lộc 1.440 vàng.
- Trước trận Bất Chu Sơn, Cao Thể Càn được phối 240 quân; sau trận thua, UI còn 6 quân được phối. Không có dòng nào phân biệt số chết với số bị thương.
- Trận hiển thị Cao Thể Càn cấp 38 với HP 934/934, MP 621/621, vũ lực 78, công 416, thủ 182; đây là chỉ số HUD của trận, không được dùng làm công thức tăng cấp.

Ảnh đội hình đã lưu ở [evidence/v2](evidence/v2). V3 mở bốn slot Pháp bảo dưới hàng Ngựa; không tìm thấy vật phẩm tương thích để trang bị ThiênMệnh nên không vào được kiểm nghiệm hiệu lực Pháp bảo trong trận. Panel `Bảo vật` lại cho thấy buff đang chạy và được lưu riêng ở [buff-observations-v3.json](database/buff-observations-v3.json). Đối chiếu với Dacky, tiếp tục giữ công thức chuyển sinh/rebirth hiện có là `SIMULATED`/sai điều kiện so với Phi Thăng gốc; không lấy dữ liệu cấp 40 hoặc chênh quân sau một trận làm đường cong tăng trưởng.

### Danh hiệu — hành vi từ module công khai

`danh-hieu.js` comment catalog có 55 danh hiệu; mỗi thần tiên đeo tối đa một danh hiệu. Hạn tính từ lúc nhận trong Hòm thư; danh hiệu thường không thể tháo trước hạn, riêng danh hiệu Quốc chiến có thể tháo ở màn Quốc chiến. Chuỗi nguồn liệt kê Đại Hội Tỷ Võ, Quốc chiến, Bảng Phú Hào, Phong Thần Tháp và Lộc Đài. Client nhận danh mục/điều kiện/tên/chỉ số từ state máy chủ, nên 55 là số do comment client công bố, chưa phải danh sách live đã enumerate. Module nhận các field chỉ số và dựng banner nhiều lớp từ frame strips; xem [asset-inventory-v3.json](database/asset-inventory-v3.json) và [title-system-observation-v3.json](database/title-system-observation-v3.json).

## Phân tích module công khai

`than-tuong.js` dựng hồ sơ/roster; `tu-phat.js` quản lý UI phòng tu luyện, thần tiên, gói và thời lượng; `theurgy.js` là panel phép thần thông; `phap-bao-tich.js` cung cấp panel bảo vật; `ma-tran.js` đọc trạng thái Ma Trận theo từng thần tiên và vẽ MovieClip từ spritesheet + JSON frame; `danh-hieu.js` dựng danh hiệu và banner động. Client code phân biệt hiển thị của mỗi thần tiên, nhưng phần thưởng/hiệu ứng vẫn do state game data/server gửi. Hash và nhận xét: [client-modules.json](database/client-modules.json).

## Đối chiếu triển khai hiện tại

- src/ui.js hiển thị hồ sơ Mobile, nhưng dossier hiện nêu ba ô chính Vũ khí/Giáp/Pháp bảo. Ảnh live phân biệt rõ tám ô trang bị chính: Mũ, Giáp, Đai, Cổ Khí, Giày, Tay, Vũ Khí, Cấm Khí. Ngựa ở hàng mount riêng bên dưới; Pháp bảo là nút/panel riêng, không nằm trong tám ô. So sánh có cấu trúc ở [hero-equipment-observation-v3.json](database/hero-equipment-observation-v3.json).
- src/engine.js rebirthHero hiện yêu cầu cấp 60, chưa gán đội và giới hạn 5 lần; giá trong action là 8.000 + 3.000 mỗi lần, cộng căn cốt và đưa về baseLevel. combat/progression-v3.js lại có PROGRESSION_POLICY rebirthGold 1.670.000. Hai đường dữ liệu không thống nhất và đều không khớp Phi thăng/Chuyển sinh live; không dùng làm quy tắc nguồn.
- Dacky nhận item Ma Trận vào danh sách matrices trong engine.js, nhưng combat/product-v13.js tăng hệ số chiến đấu theo số ma trận và có trần. UI gốc cho điểm cộng phẳng theo phẩm, cộng dồn theo từng loại, và phân biệt vòng hiệu ứng. Cơ chế hiện tại được phân loại INCORRECT.
- UI Dacky có skillLevel và kỹ năng combat; chưa có bằng chứng về bảng sáu kỹ năng, giá điểm, cap 25 và quy tắc nâng cao cấp 17 giống live.

Chi tiết có cấu trúc: [growth-catalog.json](growth-catalog.json). Ảnh: [hero-growth.png](evidence/hero-growth.png), [hero-skills.png](evidence/hero-skills.png), [hero-matrix.png](evidence/hero-matrix.png), [hero-matrix-help.png](evidence/hero-matrix-help.png), [hero-combat-skills.png](evidence/hero-combat-skills.png), [hero-skill-advanced.png](evidence/hero-skill-advanced.png).


### V3 — xác minh hồ sơ và thống suất trực tiếp

Capture mới ghi ThiênMệnh cấp 6 đang lĩnh 440/440 quân; tab Phối binh hiển thị thống suất 881, trần Cung Tiễn 440, quy tắc một loại = thống suất ÷ dân số lính 440 và 5.342 quân còn rảnh trong kho tổng 7.993. `Tự bổ sung lính sau trận` đang được bật; hành vi sau một trận mới chưa thử ở capture này. Hồ sơ hiển thị `Danh hiệu —` và `Ma Trận —` cho ThiênMệnh, không phải bằng chứng hệ thống bị khóa. Ảnh: [thuộc tính](evidence/v3/hero-growth-v3.png), [phối binh](evidence/v3/hero-army-v3.png).
