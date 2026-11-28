# Tham chiếu UI/UX

## Bố cục

- Trang game dùng khung fullscreen 1600×900 trong phiên khảo sát, đặt HUD tài nguyên ở mép trên, menu chính dưới cùng và icon sự kiện/khuyến mãi ở góc trên.
- Thành nội là cảnh đẳng phối cảnh có các công trình tương tác. Red badge là thông báo; số đếm đã che khi liên quan save cá nhân.
- Màn hình Thần tướng là cửa sổ chia ba vùng: roster trái, nhân vật/trang bị giữa, tab và bảng công thức bên phải. Nhóm tab gồm Thuộc tính, Tu luyện, Kỹ năng, Phối binh.
- Ma Trận dùng bố cục danh sách ô theo phẩm chất ở bên phải, preview nhân vật và vòng sáng ở giữa, nút trợ giúp và panel điểm cộng.
- Event/promotion dùng modal lớn phủ cảnh thành; nội dung xếp theo thẻ, hạng, timer, CTA. Không bấm CTA giao dịch/đăng ký.
- Quân tình dùng danh mục bên trái, danh sách giữa, bản đồ/minh hoạ phải. Nội chính dùng thanh tab phía trên, nội dung tài nguyên/điều hành ở panel bên phải.

## Chuyển động và VFX

Ảnh tĩnh xác minh được minh họa nhân vật, vòng sáng Ma Trận, cảnh thành và icon chiến trường. Public modules có battle animation, hit VFX và FX catalog; chưa phát trận live nên mọi nhận xét về tốc độ, timing, hit-stop, âm thanh, damage float và đồng bộ hiệu ứng vẫn UNKNOWN.

## Hỗ trợ và khả năng đọc

Client công khai có module trợ giúp với câu hỏi tân thủ, xây/nâng cấp, ngoại thành, địa đồ và Cung Điện. Văn bản tiếng Việt trên màn hình desktop nhìn rõ ở 1600×900. Chưa xác minh touch target, zoom, camera, crop hoặc đọc chữ ở độ phân giải Android.

## Hình tham chiếu đã lọc

Ảnh baseline đã che các trường save; V2 giữ nguyên số liệu của chính tài khoản thử nghiệm theo quyền nghiên cứu và che ticker chat ở các screenshot ngoài trận. V3 tiếp tục chỉ lưu số liệu của tài khoản nghiên cứu cùng số đếm đăng ký tổng hợp theo máy chủ cho Loạn Chiến. Không lưu bảng người chơi, thư, danh sách hội viên hoặc phát ngôn chat.

## Tham chiếu V2 và trạng thái thật

Capture tiếp tục ở viewport 1600×900, device scale 1. Canvas game có thể cao 960 px và dịch lên trong cửa sổ desktop; do đó tọa độ UI dưới đây là từ bounding box thực tế, không phải kích thước Android.

- **Carousel buff/sự kiện**: tooltip rộng khoảng 365 px, neo gần góc trái trên, có ảnh/icon, trạng thái/thời gian, đoạn mô tả, nút lùi/tiến và bộ đếm 1/5…5/5. Các dòng dài xuống nhiều hàng; ảnh V2 che riêng ticker chat ở đáy.
- **Mạnh Hơn**: modal gần toàn màn hình, ba cột — danh sách thần tiên bên trái (~250 px), chân dung/tổng lực chiến giữa (~375 px), tab và nhiệm vụ tiến độ bên phải (~800 px). Tab `Hướng đi`, `Tài nguyên`, `Cẩm nang`; hàng khuyến nghị có CTA `Nâng`/`Đi` và nhãn `Cần gấp`/`Đề cử`/`Đạt`. UI không tự động thực hiện CTA khi mở.
- **Phong Thần Tháp**: danh mục 4 thẻ ở trái (Khiêu chiến, Xếp chiêu, Bảng hạng, Quầy đổi) và sân khấu nhân vật ở giữa. Màn trạng thái chưa ghi danh hiện CTA lớn; không thể khiêu chiến trước khi ghi danh. [JSON](database/tower-observation-v2.json).
- **Cứ Điểm Chiến**: cột trái 6 danh mục, bản đồ chiến trường ở giữa và bảng thông tin thành đang chọn bên phải. Chú giải phân màu bang ta/bang khác/còn trống/chưa mở. Bản đồ có tooltip thông số phòng thủ và thời gian kỳ chiến. [JSON](database/strongpoint-observation-v2.json).
- **Ngoại thành**: cảnh isometric tuyết, các ô cấp 7–9 hiển thị trên bản đồ; menu sự kiện/HUD giữ ở mép trên và lối tắt Địa đồ/Nội thành ở đáy trái. Không đủ bằng chứng để khẳng định mọi ô nhìn thấy đều là ô nông nghiệp đang sở hữu. [JSON](database/outer-city-observation-v2.json).
- **Combat thật**: HUD gồm khung hai tướng ở hai góc trên, số lượt/hiệp ở giữa, các dãy đơn vị hai bên sân, con số `Binh lực` ở đáy và nút Pháp bảo/Kết thúc/Tắt hiệu ứng/Rút lui. Video Bất Chu Sơn cho thấy chuyển động và hit VFX thật trong 25 giây. Bố cục trực tiếp khác modal static; chi tiết tác vụ chiến đấu ở [COMBAT_MECHANICS.md](COMBAT_MECHANICS.md).
- **Túi đồ**: modal phủ cảnh ở viewport 1600×900; các nhóm nằm theo tab/icon, gồm Trang bị, Bảo rương, Bảo vật, Tăng tốc, Sản xuất, Châu báu, Nguyên liệu, Nhiệm vụ. Snapshot tài khoản có 58 món; tab Bảo vật có 17. Tooltip mở ngay trên vật phẩm, hiển thị tên/mô tả, phẩm chất, lượng sở hữu và trạng thái khóa/giao dịch. Không dùng item trong lần khảo sát. [Ảnh](evidence/v3/inventory-all.png) · [JSON](database/inventory-observation-v3.json).
- **Điểm danh**: modal lịch 8 ngày cho thấy trạng thái nhận/chờ nhận và lựa chọn rương ở ngày 7–8; capture đang ở mốc 4/8 với hai ngày đang chờ. [Ảnh](evidence/v3/attendance-8day.png).
- **Loạn Chiến**: modal sự kiện có thông tin lịch đếm ngược, nút đăng ký, tổng đăng ký chia theo máy chủ, tab xếp hạng và quà theo hạng. Phần luật chiến trường nằm trong vùng nội dung cuộn; ảnh V3 lưu panel đang mở, không lưu tên/danh sách người chơi. Không tham gia trận. [Ảnh](evidence/v3/loanchien-active.png) · [JSON](database/live-events-v3.json).
- **Quân Tình**: tab và danh sách trạng thái quân trình bày trong ảnh V3; không lưu danh sách người chơi khác. [Ảnh](evidence/v3/army-menu.png).

Font cụ thể và kích thước chữ CSS chưa được đo từ font file; không suy diễn bằng mắt. UI tiếng Việt đọc được ở desktop capture. Chưa chạy browser viewport mobile/touch nên tap-target, safe area, zoom và responsive behavior vẫn UNKNOWN.

## Chuyển động và tài nguyên vẽ — V2

Video thật xác nhận có nhiều đội hình lính, HUD hiệp và VFX theo đòn đánh. Public code phân tích chi tiết hơn: TNL renderer dựng AnimatedSprite từ hình khung; config vị trí tiền/hậu quân; mã hit dùng fire/hurt/special, rung màn, lóe và thời gian chờ; Bất Chu Sơn có hiệu ứng nền riêng. Ma Trận và danh hiệu cũng dùng sprite/atlas + JSON frame, fps và offset. Các con số timing/scale trong renderer thuộc animation, không được đưa vào công thức damage.

V3 lưu thêm batch 391 asset cùng-origin của public client (54 sprite quân, 337 VFX) cùng metadata hash/path; đây là artifact nghiên cứu, không được nhập vào asset/build manifest của Dacky. Catalog frame đầy đủ và provenance xem [ASSET_INVENTORY.md](ASSET_INVENTORY.md), [asset-inventory-v3.json](database/asset-inventory-v3.json), [acquired-assets-v3.json](database/acquired-assets-v3.json), [client-modules.json](database/client-modules.json).

## Tham chiếu V3 — tăng trưởng, buffs và hoạt động bản đồ

- Hồ sơ tướng ghi đủ 8 ô chính; Ngựa riêng và bốn ô Pháp bảo bên dưới. Mở một ô Pháp bảo ở ThiênMệnh hiện “Không có đồ vừa ô này”; không mở shop/rương. Panel `Bảo vật` hiển thị buffs đang hưởng: hai vật phẩm toàn quốc còn 77h/269h và ích liên minh hồi +50%/+50%. Ảnh [ô trang bị](evidence/v3/hero-growth-v3.png), [slot quân](evidence/v3/hero-army-v3.png), [buff](evidence/v3/hero-artifacts-v3.png), [trống Pháp bảo](evidence/v3/hero-artifact-slot-v3.png).
- Search panel của bản đồ có sáu loại mục tiêu (Đất hoang, Tiên Sơn, Hồ nước, Rừng rậm, Mỏ Đá, Mỏ Đồng). Chọn Tiên Sơn hiển thị tầng 4, tầng 5 đang mở; chọn Thần tướng du hành hiển thị “mang quà định sẵn, thắng là nhận” và tài khoản đang có cấp 4. [Tiên Sơn](evidence/v3/world-search-tien-son-v3.png) · [Thần tướng du hành](evidence/v3/world-search-hero-v3.png).
- Panel Tỷ Thí Tướng An Phá Bại hiển thị target/đội giữ/quà/làm mới; setup Quân Cơ cho phép tối đa 5 thần tiên, điều quân theo loại và báo supply/stamina/travel. Nút Xuất chinh không chuyển trạng thái dù đã chọn 3 tướng; lý do gate chưa được nêu. [panel](evidence/v3/npc-boss-panel-v3.png) · [setup](evidence/v3/npc-sortie-v3.png).
