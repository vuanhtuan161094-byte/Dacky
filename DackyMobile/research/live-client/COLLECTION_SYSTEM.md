# Sưu tập, đổi quà và vật phẩm tăng chỉ số

## Bằng chứng live

Trong phiên đã thấy quà theo hạng của Loạn Chiến, lộ trình Quà Lớn Nạp Đầu và bộ trang bị Hoan Hỉ. Loạn Chiến và gói Hoan Hỉ có mốc cộng thưởng, nhưng đây chưa chứng minh có album sưu tập vĩnh viễn tăng chỉ số. Không mở được màn hình “Bộ sưu tập” hoặc catalog trưng bày có thưởng chỉ số trong các menu đã khảo sát.

Vì vậy, hệ thống sưu tập tăng chỉ số gốc vẫn được đánh dấu UNKNOWN. Đã mở Túi đồ live và thấy 58 món chia theo Trang bị 4, Bảo vật 17, Tăng tốc 11, Sản xuất 14, Châu báu 3, Nguyên liệu 2, Nhiệm vụ 7; Bảo rương không hiện số. Điều này xác nhận cấu trúc kho item, không phải album sưu tập. Không suy ra công thức từ số icon hay nội dung tên tệp. Ảnh và tooltip mẫu: [inventory-all.png](evidence/v3/inventory-all.png), [inventory-observation-v3.json](database/inventory-observation-v3.json).

### Tăng trưởng vĩnh viễn đã phân biệt với bộ sưu tập

Ma Trận đã xác minh là tăng trưởng theo từng thần tiên, không phải bằng chứng cho một album sưu tập tài khoản. UI/hướng dẫn ghi 37 loại: Sử Thi 12 (+2), Truyền Thuyết 12 (+4), Thần Thánh 13 (+8); mỗi loại kích hoạt một lần cho thần tiên bằng Ảo Hóa tương ứng, mọi loại đã kích hoạt cộng dồn chỉ số và vòng hào quang được đổi miễn phí. Danh hiệu là hệ per-hero có thời hạn: module công khai nêu một danh hiệu/tướng, nguồn theo hoạt động, hạn tính từ lúc nhận thư và không tháo trước hạn (ngoại lệ Quốc chiến). Chưa có danh sách 55 danh hiệu hoặc số stat cụ thể từ payload UI. Màn trận thật không cho thấy tướng có Ma Trận/danh hiệu đã kích hoạt, nên aura/title VFX trong trận chưa được xác nhận bằng encounter này.

V3 mở panel `Bảo vật — ThiênMệnh`: Roi Bách Thảo Thần Nông còn 77 giờ, Lệnh Tăng Thuế Cao Cấp còn 269 giờ (cả hai phạm vi toàn quốc), Tăng ích liên minh đang bật với hồi thể lực/pháp lực +50%. Carousel V2 ghi hai vật phẩm +25% lương thực/thuế trong 7 ngày và dùng liên tục cộng dồn thời hạn. Chưa dùng vật phẩm, chưa thấy ID server hoặc điều kiện cấp buff. Đây là buff tạm thời, không phải Ma Trận hoặc set Hoan Hỉ. [V2](database/live-events-v2.json) · [V3](database/buff-observations-v3.json).

## Đổi vật phẩm

Đã mở Túi đồ chỉ để đọc, không dùng item. Tooltip live xác nhận Sách Kinh Nghiệm Cao Cấp x3, phẩm tím, khóa giao dịch, dùng cho thần tiên +500.000 EXP; Hộp cơm nóng cho quân sĩ x4 hồi Hoạt Lực tới trần tối đa. ID server chưa hiện. Ở Dacky, gameplay-p15.js ánh xạ Mobile source item 6036 cùng 6037, 6043, 6044 thành reward source item 6039; mô tả giao diện nêu Bánh Ú, nhưng tỷ lệ 1:1 được đánh dấu SIMULATED vì nguồn chưa ghi số lượng. Đây là đối chiếu mã Dacky, không phải xác nhận giao dịch live.

## Vật phẩm và buff

Hồ sơ ThiênMệnh có bốn slot Pháp bảo tách khỏi tám ô trang bị; khi mở slot, UI báo không có đồ phù hợp trong kho và gợi ý rương/Thương Thành/Chuồng ngựa. Không mở cửa hàng, không mua. Ảnh: [hero-artifact-slot-v3.png](evidence/v3/hero-artifact-slot-v3.png).

Dacky đã nhập danh mục Mobile và biểu diễn nhiều loại thời hạn/itemBuff trong gameplay-p15.js, gồm buff sản lượng/kho, kinh nghiệm tướng, hành quân/chiến đấu và lượt dã ngoại. DATA_COVERAGE.json ghi rõ phần nào VERIFIED_MOBILE, SIMULATED hoặc UNKNOWN. Màn hình tài khoản live chưa mở mô tả từng item; không khẳng định rằng các quy tắc item cụ thể đã khớp.

## Khoảng trống

- Thêm bằng chứng live cho album/bộ sưu tập, điều kiện mở, số mảnh, hiệu ứng từng mốc, cộng dồn, reset theo mùa và nguồn item; hiện chưa thấy album trong các menu mở được.
- Giữ null cho item ID của icon thưởng chưa mở tooltip.
- Tách chỉ số vĩnh viễn, set trang bị, buff theo thời hạn, phần thưởng sự kiện và vật phẩm tiêu hao trong database.
- Ghi rõ độ tin cậy của công thức đổi và hiệu ứng, không suy diễn từ Description đơn lẻ.

Ma trận item có thể đọc ở [item-gap.json](item-gap.json) và [database/collections.json](database/collections.json).
