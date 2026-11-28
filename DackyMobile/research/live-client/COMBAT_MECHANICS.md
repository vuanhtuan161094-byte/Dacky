# Quân đội và chiến đấu

## Phối binh đã xác minh

Trang Phối binh cho phép chọn Trường Kích, Đao Thuẫn, Cung Tiễn và Kỵ Binh; nhập số quân qua slider/input; có checkbox tự bổ sung sau trận và nút Lưu phối binh. Trợ giúp ghi giới hạn theo thống suất chia dân số lính 440 và phối 0 sẽ trả hết quân. Đây là quy tắc UI trực tiếp. Những con số quân và thống suất của tài khoản đã bị che.

Quân tình có bốn danh sách: Xuất chinh (quân mình đang đi), Cảnh giới (địch nhắm vào ta), Đóng quân (giữ đất/viện binh), Liên minh (đồng minh tới ta). Tất cả danh sách lúc chụp không có mục đang hoạt động.

## Kỹ năng và trận pháp

Truy kích xét trạng thái quân đối diện dưới 75% binh lực; màn hình có một nút dùng kỹ năng cùng lúc, học bằng điểm, nâng cấp chắc chắn thành công theo mô tả UI. Mốc nâng cao cấp 17 ghi giảm 30% tạo/hồi quân đối thủ trong mọi trận. Ma Trận hiển thị vòng dưới chân và cộng điểm riêng cho một thần tiên. Đây là quy tắc trên màn hình hồ sơ; không quan sát trận đang đánh.

## Trận live, replay và VFX

Không xuất chinh và không bắt đầu chiến đấu. Trận có thể gây thương vong, giảm tài nguyên hoặc tiêu hao điểm nên không phù hợp với lượt nghiên cứu chỉ đọc. Loạn Chiến có thẻ xem trước “Video một trận 50 người”, nhưng không mở/phát thẻ đó; không có video live được lưu.

PUBLIC_CLIENT có battle-live.js với nhãn chọn pháp bảo, tự đánh, pha chuẩn bị và khôi phục kết nối; battle-tnl.js, battle-fx-catalog.js, battle-hit-fx.js cùng thư mục asset VFX cho thấy client có mã hiệu ứng/hoạt ảnh. Những chuỗi này chưa chứng minh timeline, công thức damage, casualty, buff stack hay animation thực tế trong phiên hiện tại.

Dacky có battleCommand, battleAuto, march, report và màn mô phỏng trong src/engine.js, src/combat và src/ui.js. Chưa đối chiếu một trận live nên trạng thái cơ chế chiến đấu tổng thể là UNKNOWN. Không lấy battle-replay.mp4 của QA nội bộ làm bằng chứng live client.

Ảnh phối quân và danh sách quân: [hero-formation.png](evidence/hero-formation.png), [army-overview.png](evidence/army-overview.png), [army-scout.png](evidence/army-scout.png), [army-garrison.png](evidence/army-garrison.png), [army-alliance.png](evidence/army-alliance.png). Hash module ở [public-client-assets.json](public-client-assets.json).
