# Thành trì và công trình

## Màn hình Nội chính

Tab trực tiếp: Tài nguyên, Trị thành, Tiên thuật, Lãnh thổ. Giao diện tài nguyên có sản lượng theo giờ, kho, giới hạn và bảng thành. Công thức hiện trên trang: vàng mỗi giờ bằng thuế cộng khoản khác trừ bổng lộc tướng; các giá trị số đã bị che vì phụ thuộc save.

Tab Trị thành trình bày Thuế khoá, An dân, Khai suất và Thành thủ; có đường mở Cung Điện. Tab Tiên thuật hướng sang Tu Tiên Viện. Tab Lãnh thổ hiển thị đất/địa điểm thuộc thành. Ảnh che tên thành, tọa độ, chủ tướng, số dư và dữ liệu lãnh thổ.

Trợ giúp công khai mô tả thao tác: bấm ô trống để xây, bấm công trình để xem cấp/nâng cấp, Ngoại thành dành cho Ruộng/Trại gỗ/Mỏ đá/Mỏ đồng, Địa đồ cho phép kéo và chọn ô, Cung Điện dùng sửa thuế/an dân/khai suất/thành thủ. Đây là nội dung module trợ giúp công khai, chưa kiểm tra từng điều kiện mở live.

## Đối chiếu Dacky

DATA_COVERAGE.json ghi 21 hồ sơ công trình, 15 bảng Mobile có chi phí theo cấp và sáu hồ sơ mô phỏng. Công trình/thuế/sản lượng được triển khai trong src/catalog.js và src/engine.js; nhiều giới hạn kinh tế vẫn được gắn SIMULATED hoặc UNKNOWN. Không tái nhập bảng công trình đã có.

Tài nguyên và chính sách thuế của Dacky là mô hình cục bộ. Chưa xác minh quy tắc đồng bộ nhiều thành, dân số, địa hạt, Tiên thuật hay điều kiện xây/mở theo UI live; do vậy đánh giá hệ thống là PARTIAL.

Ảnh: [city-resources.png](evidence/city-resources.png), [city-governance.png](evidence/city-governance.png), [city-techniques.png](evidence/city-techniques.png), [city-territory.png](evidence/city-territory.png). Điều hướng Ngoại thành chưa được xác nhận; xem SCREEN_INDEX.md.
