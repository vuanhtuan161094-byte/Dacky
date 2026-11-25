# Đắc Kỷ · Mưu Định Phong Thần

Game chiến thuật 2D tiếng Việt, đơn người chơi và offline-first. Nội dung gameplay chưa xác minh tương đồng với Mobile/legacy và được đánh dấu `SIMULATED`.

## Web/PWA

Từ thư mục này:

```sh
npm run build
npm run serve
```

Mở `http://127.0.0.1:4173/`. Bản build gồm PWA nhiều tệp và `dist/offline.html`; file HTML độc lập qua `file://` chưa hoạt động trong Chromium của môi trường kiểm tra. Save ở IndexedDB, có bản dự phòng localStorage và hỗ trợ import/export JSON.

## Android

Capacitor 8.6.2 đã được ghim trong lockfile và project Android native đã tạo. APK debug gần nhất: `android/app/build/outputs/apk/debug/app-debug.apk` (đã xác minh package, target SDK và chữ ký; chưa cài thử trên thiết bị). Build lại bằng `npm run android:build:debug` qua helper môi trường tại `/workspace/.toolchains/run-with-gradle-proxy.py`. Xem `docs/BUILD_GUIDE.md`.

## Tài liệu

- Tiến độ: `PROGRESS.md` · Quyết định: `DECISIONS.md` · Blockers: `BLOCKERS.md`
- Thiết kế: `GAME_DESIGN.md` · Độ phủ dữ liệu: `DATA_COVERAGE.json`
- Wiki gameplay: `docs/GAMEPLAY_WIKI.md` · Hướng dẫn chơi: `docs/PLAY_GUIDE.md` · Build: `docs/BUILD_GUIDE.md`
