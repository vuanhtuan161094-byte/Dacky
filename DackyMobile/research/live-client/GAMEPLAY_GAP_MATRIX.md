# Ma trận khoảng trống gameplay

Trạng thái mô tả Dacky so với hành vi gốc có bằng chứng. UNKNOWN nghĩa là thiếu bằng chứng phía game gốc, không phải cơ chế đã được khẳng định. Chưa gán COMPLETE cho hệ thống gameplay nào vì chưa xác minh đầy đủ điều kiện, hiệu ứng và kết quả thực tế tương ứng.

| Hệ thống | Quy tắc gốc được xác minh | Trạng thái Dacky | Đối chiếu hành vi |
|---|---|---|---|
| Loạn Chiến theo lịch | LIVE_UI: có giờ mở/kết thúc, đăng ký, chuyển thành chính sang chiến trường, quà theo hạng máy chủ/liên máy chủ. | MISSING | Nhánh Dacky có PvE offline và báo cáo cục bộ; không có đăng ký máy chủ, chiến trường đồng bộ hoặc mùa sự kiện. |
| Quà Lớn Nạp Đầu | LIVE_UI: ba gói 20K/50K/100K, lộ trình nhận quà ba ngày; không giao dịch. | MISSING | Không có ví thanh toán hay lộ trình giao gói theo ngày trong gameplay Dacky. |
| Sale 11.11 | LIVE_UI: bốn gói thần tướng Việt, giảm 60–75%, tối đa một lần mua/gói. | MISSING | Không có cửa hàng sự kiện có gói theo mùa trong gameplay Dacky. |
| Black Friday | LIVE_UI: nạp 1 tặng 1 +100%, ba bậc ví; phần tặng thêm không tính mốc nạp sự kiện khác. | MISSING | Không có ví VNĐ hoặc quy tắc nạp/mốc giao nhau trong gameplay Dacky. |
| Gói Hoan Hỉ | LIVE_UI: bộ 6 món; mốc 2/4/6 món tăng tỷ lệ rơi đồ +10/+15/+30%, không cộng dồn; áp dụng ô đất, thăm dò, tìm kiếm, Tiên Sơn; yêu cầu tướng cấp 5, mua một lần/nhân vật. | INCORRECT | Dacky có đối chiếu bộ trang bị và dùng số mốc bộ vào hệ số chiến đấu; không tái tạo hiệu ứng tăng rơi đồ/điều kiện và phân phối gói này. |
| Lộc Đài Mật Tàng / Tuần Du Thần Linh | PUBLIC_CLIENT: vòng quay có lượt miễn phí, chọn kho quà, mốc tích lũy; Tuần Du dùng xúc xắc, thành lớn cần phái Đắc Kỷ và chờ 10 phút. Chưa xác minh đang mở. | MISSING | Không có sự kiện máy chủ, lượt miễn phí, kho quà chọn trước hoặc lịch chờ/phái tướng tương ứng. |
| Điểm Danh 8 ngày / Quà online | PUBLIC_CLIENT: lộ trình tám ngày, rương chọn tướng/vật phẩm, quà đăng nhập lại và quà online. Trạng thái máy chủ UNKNOWN. | MISSING | Dacky chỉ có nút nhận lương ngày/tuần tra mô phỏng, không có chuỗi đăng nhập 8 ngày hoặc thời gian online. |
| Sưu tập tăng chỉ số | Không thấy màn sưu tập/permanent album trong phần UI tiếp cận; PUBLIC_CLIENT có nhiều màn hoạt động sưu tầm nhưng không đủ chứng cứ về bộ sưu tập chỉ số. | UNKNOWN | Không tìm thấy hệ album sưu tập trong giao diện gameplay Dacky; cần xác nhận nội dung gốc trước khi thêm. |
| Đổi vật phẩm sự kiện | Không mở túi/sự kiện đổi trong live nên giá đổi gốc UNKNOWN. | PARTIAL | Dacky ánh xạ vật phẩm nguồn 6036 cùng 6037/6043/6044 sang 6039; số lượng đổi bị đánh dấu SIMULATED trong gameplay-p15.js và ui.js. |
| Bộ chỉ số thần tướng | LIVE_UI: hồ sơ có chỉ số, tiềm năng, căn cốt, trung thành, thống suất và nhiều trạng thái. | PARTIAL | Dacky nhập hồ sơ Mobile và growth adapter; trần, lượng tăng cấp và nhiều công thức runtime được đánh dấu SIMULATED/UNKNOWN trong DATA_COVERAGE.json. |
| Phi thăng / Phong thần | LIVE_UI: Phi thăng cần cấp 80, Lệnh Phi Thăng, 100.000 vàng, tướng rảnh; về cấp 1 và giữ một nửa chỉ số theo nghề. Phong thần mở sau Phi thăng. | INCORRECT | Dacky không có bước Phi thăng riêng. Tác vụ rebirth yêu cầu cấp 60, vàng theo bộ đếm hoặc policy khác nhau, tăng căn cốt và về baseLevel. Cơ chế/giá không khớp. |
| Chuyển sinh / căn cốt | LIVE_UI: yêu cầu đã Phi thăng, cấp từ 59, rảnh và có lò; đan căn cốt và tẩy tủy là luồng riêng. | INCORRECT | Dacky rebirth không yêu cầu Phi thăng/lò, cấp khác và dùng công thức tăng trưởng SIMULATED. |
| Ma Trận | LIVE_UI: 37 loại, 3 phẩm; mỗi loại cho +2/+4/+8 vào ba chỉ số; kích hoạt từng loại cho từng tướng bằng một Ảo Hóa; các mốc đã mở cộng dồn; vòng hiển thị có thể đổi miễn phí. | INCORRECT | Dacky nhận vật phẩm matrix và lưu danh sách, nhưng product-v13.js cộng hệ số 1.5% mỗi ma trận với trần 35% cho chỉ số chiến đấu; không khớp điểm +2/+4/+8 hoặc hiệu ứng hào quang và sổ từng loại. |
| Chiến Kỹ | LIVE_UI: 6 nhóm; chỉ dùng một kỹ năng một lúc; Truy kích có ngưỡng quân địch dưới 75%, học 15.000 điểm; mở nâng cao 25.500 điểm, cấp 17 có hiệu ứng luôn hoạt động giảm tạo/hồi quân địch 30%. | PARTIAL | Dacky có kỹ năng chiến đấu và hiệu ứng, song chưa có cây sáu kỹ năng với chi phí/trần/điều kiện đúng như UI live. |
| Trang bị và set | LIVE_UI: màn hình thần tướng có 8 ô trang bị; Hoan Hỉ dùng sáu món cam với bonus rơi đồ. | INCORRECT | UI Dacky dossier trình bày Vũ khí/Giáp/Pháp bảo; adapter có các slot nội bộ khác và set bonus được đưa vào hệ số chiến đấu thay vì bonus rơi đồ. |
| Phối binh | LIVE_UI: Trường Kích, Đao Thuẫn, Cung Tiễn, Kỵ; trợ giúp ghi giới hạn theo thống suất và dân số quân 440; phối 0 trả quân; có tự bổ sung sau trận. | PARTIAL | Dacky quản lý quân, điều quân, đội hình và tự động chiến đấu, nhưng không tái hiện đúng công thức 440/điều phối theo từng thần tướng đã xác minh. |
| Quân tình | LIVE_UI: danh sách Xuất chinh, Cảnh giới, Đóng quân, Liên minh. | PARTIAL | Dacky có hàng quân/march/chiếm mục tiêu; chưa có mô hình máy chủ cho cảnh giới địch, viện binh đồng minh và sự kiện liên minh. |
| Trận live / replay | PUBLIC_CLIENT: có module chiến đấu live, chọn pháp bảo, tự đánh, kết nối lại; LIVE_UI chưa đánh trận. | UNKNOWN | Dacky có battleCommand/battleAuto và report mô phỏng; chưa so sánh được damage, lượt, casualties, kết quả hay replay với một trận gốc. |
| Nội chính / thuế | LIVE_UI: trang Tài nguyên/Trị thành/Tiên thuật/Lãnh thổ; công thức vàng giờ dựa thuế và bổng lộc tướng. | PARTIAL | Dacky có sản lượng, thuế, chính sách và lương tướng nhưng chưa xác minh quy tắc đa thành và công thức gốc đầy đủ. |
| Khoa kỹ | LIVE_UI chỉ lộ đường dẫn Tu Tiên Viện; PUBLIC_CLIENT có module College. | UNKNOWN | Dacky có 19 nghiên cứu Mobile, nhưng chưa mở điều kiện/cấp/tác dụng trong live UI để so từng dòng. |
| Thành bang/hảo hữu | LIVE_UI chỉ menu; danh sách cá nhân được che và không duyệt. | MISSING | Dacky có một số trạng thái bang cục bộ, nhưng không có giao tiếp/hội nhóm đồng bộ server như client gốc. |
| Tiên Sơn, Boss, hoạt động bang | Chỉ tên module/đường dẫn PUBLIC_CLIENT, không xác minh điều kiện và trận. | UNKNOWN | Không khẳng định parity từ dữ liệu tĩnh hoặc snapshot legacy. |
| Animation/VFX chiến đấu | PUBLIC_CLIENT có catalog và module VFX; chưa xem trận live. | UNKNOWN | Dacky có hoạt ảnh chiến đấu cục bộ, nhưng không thể so khung hình/nhịp/hiệu ứng khi không có trận đối chiếu trực tiếp. |

## Ưu tiên đọc

Các việc cần bổ sung theo thứ tự nằm trong [PRIORITIZED_GAPS.md](PRIORITIZED_GAPS.md). Số liệu catalog 2.656 Mobile đã có sẵn được tham chiếu, không nhập lại.
