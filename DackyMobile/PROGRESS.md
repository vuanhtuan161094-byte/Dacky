# Tiến độ Dacky Mobile

Cập nhật: 2026-11-25 · Repository `vuanhtuan161094-byte/Dacky` · Nhánh task `feature/dacky-v1-production`

## Checkpoint hiện tại

- Nhánh `feature/dacky-v1-production` được tạo từ checkout `work` tại `c7903e2a5f6df4395af6066815ab7c43c06a3dd0`; tại thời điểm kiểm tra `origin/main` trỏ cùng SHA. Không merge hoặc force-push.
- Draft onboarding đã lưu `install_script`, `start_skill` và checkout `Dacky` tại SHA này. Draft cần được review/save rồi publish trong Environment Settings để tạo cấu hình hoạt động.
- Web game offline-first hiện có kinh tế, 21 công trình, khoa kỹ, 39 binh chủng, 540 thần tiên, 2.155 vật phẩm, 1.158 nhiệm vụ, 120 điểm chiến dịch, combat NPC, save/load, PWA và art SVG tự tạo. Tất cả thông số runtime vẫn mang nhãn `SIMULATED`.
- Đã ghim Capacitor 8.6.2, thêm lockfile và tạo Android native project. Gradle Wrapper 8.14.3 kiểm tra SHA-256; Android SDK Platform 36, Build Tools 35.0.0 và JDK 21.0.13.1+2 đã build APK debug thành công.
- Giới hạn Phong Thần Tháp hiện là 9.999 do bản mô phỏng chọn. Số 8.992 thuộc bảng tầng Tiên Sơn legacy `elflandfloorinfo`; không có nguồn xác minh số tầng Tháp.

## Nguồn và độ phủ dữ liệu

- GET công khai tới trang Mobile, trang danh mục, GitHub raw/API và npm trả HTTP 200 trong lần kiểm tra 2026-11-25. Đã chụp 7 danh mục PTC công khai, phiên bản `5d78c226cb`, tổng 2.656 hàng vào `input-private/` bị gitignore. Đây không phải xác nhận phiên bản client; runtime chưa nhập bản ghi Mobile nào.
- 208/208 tệp legacy trong allowlist của commit `13d969fc88c141553535c70943aaa98cf9f86616` khớp Git blob SHA. Parser giải mã 64/70 bảng, 161.234 hàng; 6 bảng vẫn `HOLD`. Không có hàng legacy nào được nối vào runtime.
- GitHub không khai báo SPDX license cho repo legacy; trang dữ liệu Mobile không cung cấp manifest giấy phép. Giữ raw/source rows trong thư mục private và không tuyên bố parity hoặc quyền tái phân phối.
- `DATA_COVERAGE.json` được cập nhật từ manifest cục bộ; 0 record nguồn đã nhập runtime.

## Kiểm chứng lần này

- `npm ci --no-audit --no-fund --cache /workspace/.npm-cache`: PASS.
- `npm test`: PASS 27/27, có regression test tách cap Tháp mô phỏng khỏi số tầng legacy.
- `npm run test:source`: PASS 5/5 parser tests. `verify_legacy_cache.py`: PASS 208/208 SHA. Parser: 64 decoded, 6 held, 161.234 hàng.
- `npm run build`: PASS; xuất 4.680 hàng SIMULATED trên 9 bảng, PWA và `dist/offline.html`.
- Chromium smoke trên 390px mobile và 844×390 landscape: PASS các màn hình, save/reload, xây dựng, chiêu mộ/trang bị, huấn luyện, hành quân/loot; 0 lỗi runtime/console. GET localhost trả HTTP 200.
- `npm run android:build:debug`: BUILD SUCCESSFUL. APK `vn.dackymobile.offline`, min SDK 24, target/compile SDK 36, 4.489.145 bytes; `aapt` và `apksigner verify` PASS. SHA-256 `bfb3599e2bce4652b1461f9d66d7b67fef58f2dc175ac2ba7ce687d2b1219a92`. Chưa cài trên thiết bị.

## Việc còn mở

- 6 bảng legacy chưa giải mã an toàn: `generalrefreshlevellimitinfo` (block type 249), `strongpointinfo`, `advfieldinfo`, `fightgetgoodstimecfg` (DATETIME chưa hỗ trợ), `upgradeexp` (block type 253), `fieldrandeventcfginfo` (không có trong pinned allowlist). Giữ `HOLD`, không đoán định dạng.
- Chưa đối chiếu toàn bộ phiên bản Mobile với legacy hoặc tích hợp trường nguồn vào gameplay; cần provenance, semantics và quyền sử dụng rõ ràng.
- APK debug chưa được cài/kiểm tra trên emulator hoặc thiết bị. ADB server không khởi động trong máy cloud do thư mục home mặc định chỉ đọc; chưa có emulator trong SDK.
- PWA relaunch khi tắt mạng PASS với cached resources; Chromium mở `dist/offline.html` qua `file://` vẫn trả `chrome-error://chromewebdata/`.

## Lịch sử checkpoint được nhập

Các tài liệu cũ ghi feature branch `feature/dacky-mobile-complete-20261124` cùng nhiều SHA từ môi trường Heoofgaia. Những Git object đó không có trong checkout Dacky này; giữ làm provenance, không xem là nhánh hoặc HEAD hiện tại. Tiếp tục trên nhánh được người dùng chỉ định; không merge hoặc force-push.
