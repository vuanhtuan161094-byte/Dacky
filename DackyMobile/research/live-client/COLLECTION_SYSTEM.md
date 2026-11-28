# Sưu tập, đổi quà và vật phẩm tăng chỉ số

## Bằng chứng live

Trong phiên đã thấy quà theo hạng của Loạn Chiến, lộ trình Quà Lớn Nạp Đầu và bộ trang bị Hoan Hỉ. Loạn Chiến và gói Hoan Hỉ có mốc cộng thưởng, nhưng đây chưa chứng minh có album sưu tập vĩnh viễn tăng chỉ số. Không mở được màn hình “Bộ sưu tập” hoặc catalog trưng bày có thưởng chỉ số trong các menu đã khảo sát.

Vì vậy, hệ thống sưu tập tăng chỉ số gốc được đánh dấu UNKNOWN. Không suy ra công thức từ số icon hay nội dung tên tệp.

## Đổi vật phẩm

Không mở túi hoặc màn đổi quà live để tránh sử dụng vật phẩm. Ở Dacky, gameplay-p15.js ánh xạ Mobile source item 6036 cùng 6037, 6043, 6044 thành reward source item 6039; mô tả giao diện nêu Bánh Ú, nhưng tỷ lệ 1:1 được đánh dấu SIMULATED vì nguồn chưa ghi số lượng. Đây là đối chiếu mã Dacky, không phải xác nhận giao dịch live.

## Vật phẩm và buff

Dacky đã nhập danh mục Mobile và biểu diễn nhiều loại thời hạn/itemBuff trong gameplay-p15.js, gồm buff sản lượng/kho, kinh nghiệm tướng, hành quân/chiến đấu và lượt dã ngoại. DATA_COVERAGE.json ghi rõ phần nào VERIFIED_MOBILE, SIMULATED hoặc UNKNOWN. Màn hình tài khoản live chưa mở mô tả từng item; không khẳng định rằng các quy tắc item cụ thể đã khớp.

## Khoảng trống

- Thêm bằng chứng live cho album/bộ sưu tập, điều kiện mở, số mảnh, hiệu ứng từng mốc, cộng dồn, reset theo mùa và nguồn item.
- Giữ null cho item ID của icon thưởng chưa mở tooltip.
- Tách chỉ số vĩnh viễn, set trang bị, buff theo thời hạn, phần thưởng sự kiện và vật phẩm tiêu hao trong database.
- Ghi rõ độ tin cậy của công thức đổi và hiệu ứng, không suy diễn từ Description đơn lẻ.

Ma trận item có thể đọc ở [item-gap.json](item-gap.json) và [database/collections.json](database/collections.json).
