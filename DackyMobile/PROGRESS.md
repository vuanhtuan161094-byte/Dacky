# Tiến độ Dacky Mobile

Cập nhật: 2026-11-25 · Repository `vuanhtuan161094-byte/Dacky` · Nhánh task `feature/dacky-v1-production`

## Checkpoint hiện tại

- `feature/dacky-v1-production` tiếp tục từ các checkpoint đã push `829ac32a911091c20f86d6bd1580d947a8791aa0`, `a26a6157f74e79e198705575e3dbfe27d8d8aa89` và `4ec5879cabf29216223ec7a5ad2d9f592bb78770`; lô đang hoàn thiện thêm một portrait nguyên bản, PWA cache và APK/AAB. Không merge hoặc force-push.
- Dùng trực tiếp cloud environment đã thiết lập; không cài lại toolchain. Capacitor 8.6.2, JDK 21, Android SDK 36 và Gradle 8.14.3 vẫn là cấu hình đã xác minh.
- Web game hiện có kinh tế, 21 công trình, 19 nhánh khoa kỹ, 39 binh chủng, 540 hồ sơ thần tiên, 2.155 vật phẩm, 1.158 nhiệm vụ, 120 điểm PvE, chiến đấu NPC, lưu/tải, PWA và asset SVG nguyên bản. Các nội dung này vẫn được đánh dấu `SIMULATED`; chưa có nguồn nào đủ quyền để thay dữ liệu runtime.
- Đã tích hợp nền thành trì nguyên bản 1536×512 JPEG và một portrait master Khương Tử Nha 768×1024 WebP; provenance, prompt và SHA ở `docs/ASSET_PROVENANCE.md`. Portrait chỉ gắn vào `hero-01`; các chân dung còn lại vẫn dùng atlas vector dùng chung. Sprite công trình/quân, portrait riêng cho các thần tiên khác, animation và VFX còn thiếu.
- Đấu pháp thần tiên tại Phong Thần Tháp, Tiên Sơn và Bất Chu Sơn đã chuyển từ so lực chiến một bước sang tối đa sáu hiệp deterministic: initiative, thường công, kỹ năng, sát thương, khiên/hồi phục, máu và sĩ khí còn lại được giữ trong chiến báo. Tiên Sơn đã thắng được khóa thưởng để tránh farm lặp.
- Đã ghim Capacitor 8.6.2, thêm lockfile và tạo Android native project. Gradle Wrapper 8.14.3 kiểm tra SHA-256; Android SDK Platform 36, Build Tools 35.0.0 và JDK 21.0.13.1+2 đã build APK debug thành công.
- Giới hạn Phong Thần Tháp hiện là 9.999 do bản mô phỏng chọn. Số 8.992 thuộc bảng tầng Tiên Sơn legacy `elflandfloorinfo`; không có nguồn xác minh số tầng Tháp.

## Nguồn và độ phủ dữ liệu

- GET công khai tới trang Mobile, trang danh mục, GitHub raw/API và npm trả HTTP 200 trong lần kiểm tra 2026-11-25. Đã chụp 7 danh mục PTC công khai, phiên bản `5d78c226cb`, tổng 2.656 hàng vào `input-private/` bị gitignore. Đây không phải xác nhận phiên bản client; runtime chưa nhập bản ghi Mobile nào.
- 208/208 tệp legacy trong allowlist của commit `13d969fc88c141553535c70943aaa98cf9f86616` khớp Git blob SHA. Parser giải mã 67/70 bảng, 161.331 hàng. Cả 67 bảng có bản chuẩn hóa riêng tư, provenance cho từng trường và SHA schema/index/data; không có hàng riêng tư nào vào Git hoặc runtime.
- Delta số lượng Mobile ↔ legacy được ghi trong `DATA_COVERAGE.json`: thần tiên 482/540, pháp bảo 151/156, vật phẩm 1.885/2.155, binh chủng 25/39, công trình 21/21, khoa kỹ 19/19, danh thành 73/75 nhóm tọa độ legacy. Đây chỉ là delta số hàng, không phải đối chiếu ID/hiệu ứng hoặc kết luận hai phiên bản tương thích.
- Adapter nguồn đã nối vào runtime catalog nhưng fail-closed: cần giấy phép/bằng chứng cho phép dùng và provenance/hash theo trường. GitHub không công bố SPDX cho snapshot legacy; danh mục Mobile công khai không đưa điều khoản tái sử dụng. Vì vậy 0 bản ghi nguồn được nhập và runtime vẫn `SIMULATED`.
- `DATA_COVERAGE.json` được cập nhật từ manifest cục bộ; 0 record nguồn đã nhập runtime.

## Kiểm chứng lần này

- `npm ci --no-audit --no-fund --cache /workspace/.npm-cache`: PASS.
- `npm test`: PASS 32/32, gồm combat thần tiên xác định theo seed, kỹ năng theo hiệp và chặn thưởng Tiên Sơn lặp, cùng adapter nguồn fail-closed/provenance theo trường.
- Python source tests: PASS 10/10 (8 parser + 2 normalizer). `verify_legacy_cache.py`: PASS 208/208 SHA. Parser: 67 decoded, 3 held, 161.331 hàng. Chuẩn hóa: 67 bảng, 3 held, 161.331 hàng; dữ liệu đầu ra ở `input-private/normalized_legacy/`.
- `npm run build` sau combat và portrait: PASS; xuất 4.680 hàng SIMULATED trên 9 bảng, PWA shell v4 và `dist/offline.html`; xác nhận portrait WebP được inline trong HTML một file.
- Chromium `qa/browser-smoke.mjs`: PASS, startup/new save, 21 công trình, 11 màn hình, kinh tế, phân trang NPC/shop/quest/Tiên Sơn, xây dựng, chiêu mộ/trang bị, huấn luyện/hành quân/chiến báo, thành phụ, IndexedDB reload, viewport 390×844 và 844×390; không có lỗi console. Screenshot cập nhật ở `qa/screenshots/`.
- PWA offline relaunch sau cài shell v4: PASS; cache chứa portrait WebP và roster vẫn hiển thị chân dung sau reload khi ngắt mạng. Single-file HTML PASS khi mở qua HTTP rồi ngắt mạng: tạo save và chơi tiếp, chỉ có request lấy chính tệp HTML, không request CSS/JS/ảnh phụ. Browser environment chặn navigation `file://` bởi administrator policy nên cách mở trực tiếp bằng giao thức file chưa xác minh.
- `npm run android:sync + Gradle assembleDebug bundleDebug`: BUILD SUCCESSFUL với JDK 21/SDK 36/Gradle 8.14.3. APK `vn.dackymobile.offline`, 5.510.237 bytes, SHA-256 `4540c6572270881c6c93dc47cfc4ab77bd67a8e16a048915e479b674c55dae79`; debug AAB 4.837.345 bytes, SHA-256 `445228189d7b45032ecea3a99a4fdbadd42e757e84211ccb90c18f1eb3dca2b4`. ZIP integrity, `apksigner verify`, package/SDK metadata PASS. APK/AAB chứa portrait với đúng SHA-256. Chưa cài APK lên thiết bị.

## Việc còn mở

- 3 bảng legacy còn `HOLD`: `generalrefreshlevellimitinfo` (packed record type 249 chưa có decoder), `upgradeexp` (packed record type 253 chưa có decoder), `fieldrandeventcfginfo` (pinned tree chỉ có `.frm`, thiếu `.MYI` và `.MYD`, không có row count). Không đoán layout nén.
- Chưa có content-level Mobile/legacy diff hoặc dữ liệu nguồn đã được quyền sử dụng; chỉ có category-count deltas. Không tuyên bố gameplay parity hay hoàn tất V1.0.
- APK debug chưa được cài/kiểm tra trên emulator hoặc thiết bị. ADB server không khởi động trong máy cloud do thư mục home mặc định chỉ đọc; chưa có emulator trong SDK.
- APK chưa được cài và kiểm tra trên thiết bị Android vật lý.
- `dist/offline.html` được tạo, chứa ảnh nền cùng portrait in-line; mở trực tiếp bằng `file://` chưa được xác minh.

## Lịch sử checkpoint được nhập

Các tài liệu cũ ghi feature branch `feature/dacky-mobile-complete-20261124` cùng nhiều SHA từ môi trường Heoofgaia. Những Git object đó không có trong checkout Dacky này; giữ làm provenance, không xem là nhánh hoặc HEAD hiện tại. Tiếp tục trên nhánh được người dùng chỉ định; không merge hoặc force-push.
