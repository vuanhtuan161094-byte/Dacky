# Tài nguyên client công khai

## Giới hạn và cách lưu

Không tải lại 2.656 bản ghi Mobile đã có. Manifest Dacky hiện dùng catalog mobile-source v5d78c226cb cùng `DackyMobile/assets/mobile-source-manifest.json`, 2.209 asset Mobile được đóng gói (13.173.749 byte). Hệ nghiên cứu chỉ bổ sung bằng chứng mới từ tài khoản đã đăng nhập, UI và module `/mods` được phục vụ công khai.

138 module JavaScript cùng origin được tải bằng GET HTTPS sau khi lọc danh mục chat, group chat, hỗ trợ khách hàng, account helper, leaderboard, server selector và mail/notification. 7 đường dẫn module khỏi batch nghiên cứu để tránh bề mặt dữ liệu riêng tư. Không truy vấn endpoint quản trị/API, không ghi HAR, cookie, token hay request payload. TLS certificate verification được bật. Mã JavaScript thô không được commit; repo chỉ giữ đường dẫn, byte count, SHA-256 và nhận xét cơ chế đã đọc. Xem [database/client-modules.json](database/client-modules.json) và [CLIENT_MODULE_ANALYSIS.md](CLIENT_MODULE_ANALYSIS.md).

`public-client-assets.json` giữ manifest chọn lọc từ checkpoint trước. `database/client-modules.json` là snapshot đầy đủ của 138 module trong V2; không đổi/nhân bản danh mục art 2.656 Mobile.

## Nhóm module đã đọc sâu

- Combat: `battle-live`, `battle-hud`, `battle-screen`, `battle-tnl`, `battle-tnl-data`, VFX catalog/runner/script/hit, `buzhou`, `buzhou-fx`.
- Tăng trưởng: `than-tuong`, `tu-phat`, `theurgy`, `ma-tran`, `danh-hieu`, `phap-bao-tich`.
- Lịch/nghiên cứu: `events`, `su-kien-tnl`, `diem-danh-8`, `bao-online`, `loan-chien`, `strongpoint`, `tower`, `quests`, `college`, `manh-hon`.
- Quân/đô thành: `binh-doanh`, `barrack-calc`, `quan-tinh`, `noi-chinh`, `subcity`.

Module chỉ mô tả cách client dựng UI/state. Các giá trị từ data/server vẫn được gắn đúng nguồn; hàm vẽ hoặc comment về gateway không phải bằng chứng client có thể tự quyết thắng thua.

## Capture gameplay trong V2–V3

- Ảnh 1600×900 về trận, sự kiện, đội hình, Mạnh Hơn, ngoại thành, Phong Thần Tháp và Cứ Điểm Chiến nằm trong `evidence/v2/`; chat ticker được che ở ảnh ngoài trận. V3 bổ sung ảnh quân tình, điểm danh 8 ngày, túi đồ, Loạn Chiến đang mở đăng ký, hồ sơ/đội hình, search Tiên Sơn/Thần tướng du hành, Tỷ Thí Tướng và selector Pháp bảo tại `evidence/v3/`.
- Một clip H.264 1600×900, 25 fps, 25 giây ghi trận PvE thật, nằm trong `evidence/combat/buzhou-floor1-pve.mp4`. Không có chat hoặc dữ liệu người chơi khác trong khung trận.
- Ngoài manifest có sẵn, V3 đã tải thêm 391 binary cùng-origin (70,572,382 byte) bằng HTTPS GET có xác minh TLS, không kèm cookie/credential: 337 VFX chiến đấu và 54 sprite quân. Bản sao nằm trong `evidence/assets-v3/source-client/assets/`; từng đường dẫn nguồn, dung lượng, hash, loại và đường dẫn lưu được ghi trong [acquired-assets-v3.json](database/acquired-assets-v3.json). Batch này chỉ lấy các asset đã được xác định từ catalog public, không lặp lại 2.656 bản ghi art Mobile.
- Bốn mẫu đại diện Ma Trận, map frame JSON, dải animation danh hiệu và VFX bang235 được lưu ngay dưới `evidence/assets-v3/` để xem nhanh; chúng cũng có bản ghi hash trong [asset-inventory-v3.json](database/asset-inventory-v3.json). JSON inventory chuẩn hóa chứa toàn catalog frame/animation, script choreography, đội hình render và strip danh hiệu. Metadata chỉ mô tả hiển thị, không phải luật combat.
- Các binary client đã tải là bằng chứng nghiên cứu/provenance; không gộp vào build hoặc asset manifest của Dacky. Việc chúng được client phục vụ công khai không tự xác nhận quyền tái phân phối hoặc quyền sở hữu.

## Cấu trúc animation/VFX được xác minh từ code

`battle-tnl-data.js` là dữ liệu đội hình render: vị trí tiền/hậu quân, tọa độ cờ và các hệ số vẽ. `battle-tnl.js` cắt atlas theo rect/frame, dựng sprites, bố trí lớp, bắn đạn và phát hiệu ứng trúng đòn/ngã. `battle-fx-catalog.js`/`battle-fx-script.js` map mã hiệu ứng sang animation, `battle-hit-fx.js` tạo phản hồi hit/shake. `ma-tran.js` và `danh-hieu.js` đọc sprite sheet kèm JSON frame, anchor/offset/fps. Những trường này không phải công thức chiến đấu.

## V3 catalog và acquisition

`database/asset-inventory-v3.json` ghi 18 họ lính/144 trạng thái/1.424 frame, 6 họ đội trưởng/30 trạng thái/384 frame, 337 VFX với 5.269 frame theo metadata catalog, 624 script VFX, hai lớp vị trí đội hình và sáu dải động danh hiệu. `battle-tnl-data.js` là bố cục vẽ; không dùng số vị trí trong đó làm thống suất hay sức chứa. `battle-fx-script.js` mô tả chuỗi fire/move/hurt/bang/bullet/timing và cờ render, không đưa ra công thức sát thương. Danh hiệu hiển thị một trong các strip có frame/fps; tên, stat, nguồn và hạn cụ thể đến từ state.

Batch 391 binary được liệt kê độc lập ở `database/acquired-assets-v3.json` để có hash/provenance từng tệp. Các con số 337 VFX/54 sprite là số tệp tải trong batch, khác với số frame trong catalog. Bốn asset mẫu có bản sao để kiểm tra trực quan; các tệp còn lại ở cây `source-client`.

## Provenance

Ảnh và clip là bằng chứng capture hợp lệ từ tài khoản phụ. Asset client được lấy bằng URL cùng origin từ catalog client public, với TLS verification; hash nhận dạng chính xác các binary đã thấy ngày 2026-11-28. Không truy cập API quản trị hay asset yêu cầu quyền riêng. Không tuyên bố quyền sở hữu hoặc quyền tái phân phối chỉ từ việc URL tải được.
