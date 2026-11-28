# Tài nguyên client công khai

## Đã có trong nhánh Dacky

Không lặp lại tải danh mục Mobile 2.656 bản ghi. DATA_COVERAGE.json ghi 2.209 asset nguồn Mobile, tổng 13.173.749 byte, cùng manifest URL/hash ở assets/mobile-source-manifest.json. Nhóm thư mục gồm hero-hd, items, map-ng và tech. Thư viện hình/âm thanh sản phẩm hiện có thêm visual/assets/am-thanh, battle, battle-fx, battle-ng, blr-ui và các ảnh thành/công trình. Nguồn version của catalog là 5d78c226cb.

## Lượt đọc public client trong nghiên cứu này

37 module JavaScript ở đường dẫn /mods đã trả HTTP 200 và được băm SHA-256. Chỉ lưu đường dẫn, kích thước, hash và mô tả vai trò tổng quát trong [public-client-assets.json](public-client-assets.json); mã thô nằm ngoài repo và đã được dọn khỏi /tmp sau nghiên cứu. Một đường dẫn được thử trả 404 và không đưa vào inventory.

Các nhóm module được lấy mẫu: sự kiện/điểm danh/quà, thần tướng/Ma Trận/tu luyện, quân tình/Loạn Chiến/chiến đấu, Tiên Sơn/Bất Chu/Tháp, nhiệm vụ/khoa kỹ/Cung Điện, bang hội/hảo hữu và VFX. Chỉ trích chuỗi hiển thị người dùng. Không phân tích endpoint mạng, API, token hoặc giao thức.

## Ảnh

22 ảnh 1600×900 đã được chụp từ màn hình đã đăng nhập, lọc riêng tư và lưu trong evidence/. Không có video trận thật; không quay trận vì trận có thể thay đổi quân/trạng thái và thẻ preview Loạn Chiến chưa được phát.

## Quyền và giới hạn

Tài liệu này kiểm kê URL công khai của client đang được phục vụ và hash tại thời điểm lấy. Hash không phải bản sao lưu hoặc tuyên bố quyền sở hữu. Các asset đã có ở nhánh được tham chiếu bằng manifest hiện hữu; không thêm lại file art của game gốc vào nhánh nghiên cứu.
