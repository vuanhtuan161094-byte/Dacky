# Chỉ mục khảo sát live client

Ngày khảo sát: 2026-11-28 (giờ người dùng). Game: https://dackytruvuong.com/play. Nhánh mã đối chiếu: integration/dacky-total-finalization.

## Phương pháp và giới hạn

- Kiểm tra sự hiện diện của DACKY_USERNAME và DACKY_PASSWORD; cả hai biến đã được gắn vào tiến trình. Không in hoặc lưu giá trị.
- Đăng nhập bằng form giao diện thông thường trong Chromium/Playwright, sau đó giữ phiên trong persistent browser context khi duyệt. Không vượt CAPTCHA; không có CAPTCHA xuất hiện.
- Lỗi TLS ban đầu là Chromium không tin CA môi trường dù xác minh TLS của hệ điều hành thành công. Đã thêm CA gốc môi trường vào NSS DB tạm trong /tmp; Playwright tải trang HTTP 200 với ignoreHTTPSErrors=false. Đây không phải chế độ bỏ kiểm tra chứng thư.
- Khi vào game, đóng báo cáo vắng mặt bằng nút đóng. Không nhận quà, mua gói, đăng ký sự kiện, dùng vật phẩm, thay đổi đội hình, gửi chat hoặc mở trận.
- Chỉ lấy 37 tệp JavaScript công khai thuộc /mods, bằng GET cùng origin. Không gọi endpoint API, endpoint quản trị hay nguồn dữ liệu ẩn; không lưu mã JS thô trong nhánh.
- Không lặp lại danh mục 2.656 bản ghi Mobile đã có. Xem DackyMobile/DATA_COVERAGE.json và DackyMobile/assets/mobile-source-manifest.json.
- Ảnh trong evidence đã che tên tài khoản/nhân vật, danh sách thần tướng của tài khoản, số dư, chat, dữ liệu bang/hảo hữu và điểm cá nhân. Không có cookie, token, HAR, mật khẩu hay dữ liệu người chơi khác trong gói nghiên cứu.

## Màn hình đã mở

| Màn hình | Quan sát được | Ảnh đã làm sạch |
|---|---|---|
| Thành nội / HUD | Bản đồ đẳng phối cảnh, thanh tài nguyên, icon sự kiện, menu Địa đồ, Ngoại thành, Nội chính, Thần tướng, Quân tình, Ngoại giao, Báo cáo, Thư và Trợ giúp. | [main-menu-city.png](evidence/main-menu-city.png) |
| Quà Lớn Nạp Đầu | Ba lựa chọn Quà 20K/50K/100K; gói chia quà theo ngày, nhân vật Lôi Chấn Tử và điều kiện căn cốt 30. Không mua. | [event-first-topup.png](evidence/event-first-topup.png) |
| Sale 11.11 | Bốn gói thần tướng Việt, giá giảm hiển thị và giới hạn mỗi gói một lần. Không mua. | [event-sale-11-11.png](evidence/event-sale-11-11.png) |
| Black Friday | Nạp 1 tặng 1 (+100%); ba mốc nạp và quy tắc phần tặng thêm không tính vào mốc nạp sự kiện. Không nạp. | [event-black-friday.png](evidence/event-black-friday.png) |
| Loạn Chiến | Lịch sự kiện, tổng đăng ký theo máy chủ, nút đăng ký, tab xếp hạng và quà theo hạng; icon quà chưa có tooltip nên tên/ID quà UNKNOWN. Không đăng ký. | [event-loan-chien.png](evidence/event-loan-chien.png) |
| Gói Hoan Hỉ | Sáu vị trí trang bị và các mốc tăng tỷ lệ rơi đồ; giá/điều kiện mua hiển thị. Không mua. | [event-hoan-hi.png](evidence/event-hoan-hi.png) |
| Thần tướng / Tu luyện | Phi thăng, Phong thần, phép thần thông, Chuyển sinh — luyện Căn cốt, đan đổi Căn cốt, tẩy tủy. | [hero-growth.png](evidence/hero-growth.png) |
| Thần tướng / Kỹ năng | Nhóm Chiến Kỹ, Ma Trận, Danh hiệu, Phép thần thông, Bảo vật. | [hero-skills.png](evidence/hero-skills.png) |
| Ma Trận | Ba phẩm Sử Thi, Truyền Thuyết, Thần Thánh; danh sách 12/12/13; hiệu ứng chỉ số và thao tác kích hoạt. | [hero-matrix.png](evidence/hero-matrix.png), [hero-matrix-help.png](evidence/hero-matrix-help.png) |
| Chiến Kỹ | Truy kích; điều kiện chiến đấu, cấp tối đa, lựa chọn hiện tại/cấp tiếp/nâng cao, điểm học và nâng cao. | [hero-combat-skills.png](evidence/hero-combat-skills.png), [hero-skill-advanced.png](evidence/hero-skill-advanced.png) |
| Phối binh | Bốn loại quân, giới hạn theo thống suất và công thức dân số quân 440; có tuỳ chọn tự bổ sung sau trận và nút lưu. Không lưu thay đổi. | [hero-formation.png](evidence/hero-formation.png) |
| Quân tình | Xuất chinh, Cảnh giới, Đóng quân, Liên minh; các danh sách hiện không có đạo quân. | [army-overview.png](evidence/army-overview.png), [army-scout.png](evidence/army-scout.png), [army-garrison.png](evidence/army-garrison.png), [army-alliance.png](evidence/army-alliance.png) |
| Nội chính | Tab Tài nguyên, Trị thành, Tiên thuật, Lãnh thổ; công thức thu nhập vàng theo thuế và bổng lộc; đường dẫn Cung Điện/Tu Tiên Viện. | [city-resources.png](evidence/city-resources.png), [city-governance.png](evidence/city-governance.png), [city-techniques.png](evidence/city-techniques.png), [city-territory.png](evidence/city-territory.png) |
| Ngoại giao | Tab Bang hội/Hảo hữu và menu Tổng quan, Trợ giúp, Quà tặng, Thành viên, Ngoại giao, Nội vụ, Dụng cụ, Cung phụng, Nhật ký. Phần chứa danh tính thành viên bị che. | [diplomacy-menu.png](evidence/diplomacy-menu.png) |

## Chưa có bằng chứng trực tiếp

- Không mở danh sách người chơi, thư, báo cáo chiến đấu hoặc bảng xếp hạng động vì có thể chứa dữ liệu cá nhân của người chơi khác. Không ghi lại tên hay thứ hạng người chơi.
- Không mở đánh Boss, Tiên Sơn, chiến đấu thường, thay quân trong trận hoặc replay. Các hành động này có thể trừ quân/điểm/tài nguyên. Loạn Chiến chỉ hiện thẻ xem trước video một trận 50 người; không phát hoặc lưu video.
- Nút Ngoại thành được thử điều hướng nhưng màn hình đích không xác minh được trong phiên. Điều kiện Boss/Tiên Sơn, khoa kỹ chi tiết, nhiệm vụ, điểm danh đang nhận, quà online, hoạt động bang và bộ sưu tập chỉ được thấy tên trong client công khai hoặc chưa thấy; xem trạng thái UNKNOWN ở các tài liệu hệ thống.
- Màn hình ghi ở 1600×900 desktop. Chưa kiểm tra bố cục vật lý Android/mobile.

## Thang nguồn chứng cứ

- LIVE_UI: văn bản hoặc hành vi nhìn thấy trong phiên đã đăng nhập; ảnh tương ứng trong evidence.
- PUBLIC_CLIENT: giao diện/chuỗi nhãn trong tệp client công khai đã tải; chỉ chứng minh rằng client có mã UI, không chứng minh sự kiện đang mở hoặc trạng thái máy chủ.
- DACKY_CODE: mã hiện có trong nhánh Dacky, dùng để đối chiếu cách triển khai.
- UNKNOWN: chưa đủ bằng chứng để xác nhận hành vi hoặc công thức.
