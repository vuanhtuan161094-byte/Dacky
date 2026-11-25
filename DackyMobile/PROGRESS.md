# Tiến độ Dacky Mobile

Cập nhật: 2026-11-25 · Repository `vuanhtuan161094-byte/Dacky` · Nhánh task `feature/dacky-v1-production`

## Checkpoint hiện tại

- `feature/dacky-v1-production` đã giữ checkpoint push `829ac32a911091c20f86d6bd1580d947a8791aa0` và hiện bao gồm lô tích hợp database/mỹ thuật của lượt này. Không merge hoặc force-push.
- Dùng trực tiếp cloud environment đã thiết lập; không cài lại toolchain. Capacitor 8.6.2, JDK 21, Android SDK 36 và Gradle 8.14.3 vẫn là cấu hình đã xác minh.
- Web game hiện có kinh tế, 21 công trình, 19 nhánh khoa kỹ, 39 binh chủng, 540 hồ sơ thần tiên, 2.155 vật phẩm, 1.158 nhiệm vụ, 120 điểm PvE, chiến đấu NPC, lưu/tải, PWA và asset SVG nguyên bản. Các nội dung này vẫn được đánh dấu `SIMULATED`; chưa có nguồn nào đủ quyền để thay dữ liệu runtime.
- Đã tích hợp nền thành trì nguyên bản do image tool tạo, 1536×512 JPEG, 206 KiB, provenance/hash ở `docs/ASSET_PROVENANCE.md`; hero/building/troop sprite, animation và VFX vẫn còn việc sản xuất.
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
- `npm test`: PASS 31/31, gồm kiểm tra adapter nguồn fail-closed và giữ provenance theo trường.
- Python source tests: PASS 10/10 (8 parser + 2 normalizer). `verify_legacy_cache.py`: PASS 208/208 SHA. Parser: 67 decoded, 3 held, 161.331 hàng. Chuẩn hóa: 67 bảng, 3 held, 161.331 hàng; dữ liệu đầu ra ở `input-private/normalized_legacy/`.
- `npm run build`: PASS; xuất 4.680 hàng SIMULATED trên 9 bảng, PWA và `dist/offline.html`.
- Local HTTP smoke sau thay đổi: PASS 200 cho index, PWA shell v3, source adapter modules, JPEG và single-file HTML; bản offline HTML đã inline ảnh. Chromium headless screenshot không chạy được ngay cả với `about:blank` vì crashpad/NSS trong image; không nhận screenshot QA mới.
- `Capacitor sync + ./gradlew assembleDebug bundleDebug`: BUILD SUCCESSFUL. APK `vn.dackymobile.offline`, min SDK 24, target/compile SDK 36, 5.133.415 bytes, SHA-256 `82e6b01439730ffecef8cb1faa2f9e90553589111e55d875fe007570ac7e2887`; `aapt`, `apksigner verify`, zip integrity PASS. Debug AAB 4.461.580 bytes, SHA-256 `b64b0071a49811f0b836d989ccc08157643042fa44ec45444ef1580e7bac53df`, zip integrity PASS. Ảnh thành trì có mặt trong APK/AAB với đúng SHA-256. Chưa cài APK lên thiết bị.

## Việc còn mở

- 3 bảng legacy còn `HOLD`: `generalrefreshlevellimitinfo` (packed record type 249 chưa có decoder), `upgradeexp` (packed record type 253 chưa có decoder), `fieldrandeventcfginfo` (pinned tree chỉ có `.frm`, thiếu `.MYI` và `.MYD`, không có row count). Không đoán layout nén.
- Chưa có content-level Mobile/legacy diff hoặc dữ liệu nguồn đã được quyền sử dụng; chỉ có category-count deltas. Không tuyên bố gameplay parity hay hoàn tất V1.0.
- APK debug chưa được cài/kiểm tra trên emulator hoặc thiết bị. ADB server không khởi động trong máy cloud do thư mục home mặc định chỉ đọc; chưa có emulator trong SDK.
- PWA offline relaunch đã PASS ở checkpoint trước; cache shell hiện tăng lên v3 để gồm adapter và ảnh thành trì, chưa chạy lại offline-browser sau update vì Chromium headless lỗi.
- `dist/offline.html` được tạo, chứa ảnh nền in-line và trả HTTP 200 từ dev server; mở trực tiếp bằng `file://` chưa được xác minh trong Chromium hiện tại.

## Lịch sử checkpoint được nhập

Các tài liệu cũ ghi feature branch `feature/dacky-mobile-complete-20261124` cùng nhiều SHA từ môi trường Heoofgaia. Những Git object đó không có trong checkout Dacky này; giữ làm provenance, không xem là nhánh hoặc HEAD hiện tại. Tiếp tục trên nhánh được người dùng chỉ định; không merge hoặc force-push.
