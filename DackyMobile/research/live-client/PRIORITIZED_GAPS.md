# Chức năng cần bổ sung hoặc xác minh

## P0 — lấy bằng chứng trước khi triển khai

1. Sưu tập/album: mở đúng màn hình, ghi điều kiện, cấp mốc, bonus chỉ số, bonus cộng dồn, reset mùa và vật phẩm cần có. Hiện gốc UNKNOWN.
2. Các sự kiện đang mở và lịch reset: chụp tooltip item/reward, nguồn, giá, điều kiện claim, timezone máy chủ và hành vi không nhận. Không suy ra item ID từ icon.
3. Bộ sưu tập và đổi vật phẩm: xác minh tỉ lệ, giới hạn ngày/mùa, nguồn vật phẩm, hiệu ứng thực nhận.
4. Khoa kỹ, nhiệm vụ, Boss, Tiên Sơn, điểm danh, quà online, nội/ngoại thành và hoạt động bang: mở từng màn bằng luồng hợp lệ, ghi các yêu cầu khóa và không nhận thưởng.

## P1 — sửa sai cơ chế đã xác minh

1. Tách Phi thăng, Phong thần, phép thần thông và Chuyển sinh; không dùng rebirth hiện tại làm đại diện. Xác minh lại chi phí local vì engine.js và progression-v3.js đang khác nhau.
2. Thay Ma Trận theo nguồn: 37 loại, phẩm chất, điểm +2/+4/+8, kích hoạt riêng mỗi tướng, Ảo Hóa, cộng dồn và vòng hiển thị miễn phí.
3. Thêm cây Chiến Kỹ sáu loại, giới hạn dùng đồng thời, giá điểm, cap, hiệu ứng nâng cao và gate cấp 17.
4. Sửa set Hoan Hỉ theo bonus rơi đồ +10/+15/+30 ở 2/4/6 món, không cộng dồn và phạm vi ô đất/thăm dò/tìm kiếm/Tiên Sơn.
5. Hoàn thiện 8 slot trang bị theo vị trí và điều kiện mặc; đối chiếu hiệu ứng từng loại pháp bảo/khí cụ.
6. Xác minh công thức Phối binh 440 và auto-replenish; tạo evidence bằng màn hình read-only, không lưu loadout.

## P2 — parity online và visual

1. Tạo event scheduler/campaign state, claim log, reward selection, daily streak và reset theo thời gian máy chủ sau khi có dữ liệu nguồn.
2. Thêm guild/ally/scout/march multiplayer chỉ khi có bằng chứng hành vi, quyền truy cập và quyết định sản phẩm.
3. So sánh live battle/replay/VFX sau khi có lượt nghiên cứu được cho phép thay đổi trạng thái; ghi casualty và tài nguyên trước/sau bằng tài khoản thử nghiệm có thể reset.
4. Kiểm tra Ngoại thành, Tiên Sơn, Boss và Android touch/layout ở phiên hợp lệ.

Các nhiệm vụ trên yêu cầu nguồn trực tiếp hoặc xác nhận bằng UI. Không tự dựng công thức rồi gắn nhãn VERIFIED.
