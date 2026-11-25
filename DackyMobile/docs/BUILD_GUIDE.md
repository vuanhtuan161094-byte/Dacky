# Hướng dẫn build

## Yêu cầu

- Node.js 24 và npm 11 trong môi trường cloud hiện tại; `package-lock.json` ghim Capacitor 8.6.2.
- Web build dùng script Node của dự án. Android cần JDK 21, Android SDK Platform 36, Build Tools 35.0.0, platform-tools và Gradle Wrapper 8.14.3.
- Toolchain cloud nằm ngoài checkout tại `/workspace/.toolchains`. Script môi trường cài JDK/SDK theo checksum; wrapper kiểm tra SHA-256 của Gradle distribution. `GRADLE_USER_HOME` dùng `/workspace/.gradle-cache`.

## Web/PWA

Từ thư mục `DackyMobile/`:

```sh
npm ci --no-audit --no-fund --cache /workspace/.npm-cache
npm test
npm run test:source
npm run build
npm run serve
```

Mở `http://127.0.0.1:4173/`. Build xuất database mô phỏng, PWA và `dist/offline.html`. Service worker cần HTTPS hoặc localhost. Chromium trong môi trường này mở URL localhost được; URL `file://.../offline.html` hiện trả `chrome-error://chromewebdata/`.

## Android debug

Project Capacitor native đã tạo. APK debug gần nhất nằm tại `android/app/build/outputs/apk/debug/app-debug.apk`. Build và sync lại nội dung Web:

```sh
python3 /workspace/.toolchains/run-with-gradle-proxy.py npm run android:build:debug
```

Helper đặt JDK/SDK paths, giữ proxy HTTPS cho JVM và dùng truststore riêng có CA do môi trường cấp. Không tắt kiểm tra TLS. `android/gradle/wrapper/gradle-wrapper.properties` ghim Gradle 8.14.3 kèm SHA-256 chính thức. APK debug được xác minh bằng `aapt` và `apksigner`; phiên build này chưa được cài lên thiết bị vì không có Android emulator/ADB daemon khả dụng.

Không commit `android/local.properties`, khóa ký hoặc secrets. AAB release cần khóa do chủ sở hữu cung cấp; chưa tạo AAB.
