# Thành trì và công trình

## Màn hình Nội chính

Tab trực tiếp: Tài nguyên, Trị thành, Tiên thuật, Lãnh thổ. Giao diện tài nguyên có sản lượng theo giờ, kho, giới hạn và bảng thành. Công thức hiện trên trang: vàng mỗi giờ bằng thuế cộng khoản khác trừ bổng lộc tướng; các giá trị số đã bị che vì phụ thuộc save.

Tab Trị thành trình bày Thuế khoá, An dân, Khai suất và Thành thủ; có đường mở Cung Điện. Tab Tiên thuật hướng sang Tu Tiên Viện. Tab Lãnh thổ hiển thị đất/địa điểm thuộc thành. Ảnh che tên thành, tọa độ, chủ tướng, số dư và dữ liệu lãnh thổ.

Trợ giúp công khai mô tả thao tác: bấm ô trống để xây, bấm công trình để xem cấp/nâng cấp, Ngoại thành dành cho Ruộng/Trại gỗ/Mỏ đá/Mỏ đồng, Địa đồ cho phép kéo và chọn ô, Cung Điện dùng sửa thuế/an dân/khai suất/thành thủ. Đây là nội dung module trợ giúp công khai, chưa kiểm tra từng điều kiện mở live.

## Đối chiếu Dacky

DATA_COVERAGE.json ghi 21 hồ sơ công trình, 15 bảng Mobile có chi phí theo cấp và sáu hồ sơ mô phỏng. Công trình/thuế/sản lượng được triển khai trong src/catalog.js và src/engine.js; nhiều giới hạn kinh tế vẫn được gắn SIMULATED hoặc UNKNOWN. Không tái nhập bảng công trình đã có.

Tài nguyên và chính sách thuế của Dacky là mô hình cục bộ. Chưa xác minh quy tắc đồng bộ nhiều thành, dân số, địa hạt, Tiên thuật hay điều kiện xây/mở theo UI live; do vậy đánh giá hệ thống là PARTIAL.

Ảnh: [city-resources.png](evidence/city-resources.png), [city-governance.png](evidence/city-governance.png), [city-techniques.png](evidence/city-techniques.png), [city-territory.png](evidence/city-territory.png). V2 xác nhận đã mở được cảnh Ngoại thành; điều kiện mở từng ô chưa xác minh.

## Ngoại thành và gợi ý tiến độ — V2

V2 đã mở được **Ngoại thành**: cảnh tuyết bao quanh thành, các ô có số cấp 7–9, lối tắt `Địa đồ`/`Nội thành` và menu HUD vẫn cố định. Lượt này không nâng cấp/xây ở màn này, nên điều kiện mở từng ô và sản lượng thực tế vẫn theo UI nội chính trước đó hoặc UNKNOWN. Ảnh: [outside-city-v2.png](evidence/v2/outside-city-v2.png); dải chat hệ thống ở cạnh dưới đã được che.

Panel **Mạnh Hơn → Tài nguyên** liên kết: thêm quân → Binh doanh; thêm thần tiên → Dẫn Tiên Đài/Bất Chu Sơn; thêm tu vi → Thương Thành/Địa đồ; trang bị → ô đất; Tiên Thạch → Thương Thành; bảo thạch → Thương Thành; pháp bảo → quầy pháp bảo/rương; thú cưỡi → Chuồng ngựa; danh vọng → Cứ điểm/Địa đồ. Đây là gợi ý điều hướng, không phải xác nhận tất cả nguồn thưởng/điều kiện mở. [JSON](database/progression-dashboard-v2.json).

**Cứ Điểm Chiến** là hoạt động bang theo lịch, không phải công trình đặt trong ô thành. Bản đồ có 27 cứ điểm; UI ghi Thứ Năm 13:00, còn 5 ngày 4 giờ, trận kéo 6 giờ. Ngày 3/12/2026 là ước tính từ ngày capture; múi giờ máy chủ chưa biết. Ở Đồng Quan, UI ghi quân trấn giữ NPC 5 tướng cấp 80–100, Tường thành cấp 20, Phong hỏa đài cấp 10, tổng 272.000 quân. Không có bang nào đăng ký; không đăng ký chiến trường. [Ảnh](evidence/v2/strongpoint-lobby-v2.png) · [JSON](database/strongpoint-observation-v2.json).

**Đối chiếu hành vi**: Dacky có mô hình nội/ngoại thành và 21 profile công trình; chi phí/điều kiện nhiều cấp có nguồn, nhưng chưa có dữ liệu live từng ô ngoại thành, tuyến điều phối nhiều thành và trận Cứ Điểm. Đánh giá **PARTIAL** cho nội thành/ô ngoại thành và **MISSING** cho hoạt động bang theo lịch. [Quan sát Ngoại thành](database/outer-city-observation-v2.json); không nâng COMPLETE từ ảnh bố cục.
