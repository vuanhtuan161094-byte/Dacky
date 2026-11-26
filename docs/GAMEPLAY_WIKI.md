# Wiki gameplay (bản mô phỏng hiện tại)

## Chơi trên ONE GAME

Tại Thành trì, làm lần lượt các bước nhập môn để mở xây dựng, khoa kỹ, chiêu mộ và huấn luyện. Trận quân đội đầu tiên diễn ra ở Vân Mộng Đài. Thắng dã địa trong chương hiện tại để mở chương kế tiếp. Hồi phục thương binh tại Binh doanh. Để đánh thành, ưu tiên đưa thêm quân công thành. Chiến báo lưu từng hiệp, đội hình, pháp bảo, thương vong và quyết toán.

Phong Thần Tháp dùng đội thần tiên. Mục Chinh phạt dùng quân đội cho chiến dịch, Tiên Sơn, danh thành, thành NPC, Bất Chu Sơn và Boss. Chọn địa điểm đã mở, phân bổ nhiều binh chủng nếu muốn rồi hành quân. Các tầng sau cần thắng tầng trước. Đội hình cố định lấy từ snapshot legacy; nơi chỉ có khoảng cấp/quân số dùng đội hình được tạo bằng công thức SIMULATED. Bộ loot 1.093 dòng được nối vào các tầng; cách diễn giải khoảng RdmInfo vẫn SIMULATED, thưởng lần đầu và farm một lượt mỗi ngày được giữ trong save.

Khi chọn “Từng hiệp” trước lúc hành quân, trận chờ tới nơi rồi mở lệnh theo hiệp: chọn chiến thuật, pháp bảo, đổi thần tiên chỉ huy hoặc khiêu chiến đấu pháp. Lệnh được lưu trong save. Có thể để máy tự hoàn tất trận. Thương vong và phần thưởng chỉ chốt sau khi trận kết thúc; chiến báo cho xem lại từng hiệp.

Lương bổng, tuần tra, làm mới chiêu mộ, EXP và phần thưởng chưa có công thức nguồn dùng luật SIMULATED. Trang bị và phép Boss đi vào đội đối thủ qua adapter SIMULATED. Năm chính sách pháp bảo thiếu dữ liệu dùng chi phí SIMULATED có ghi nhãn. 1.093 luật loot Tiên Sơn dùng diễn giải khoảng RdmInfo SIMULATED; ID không nối được Mobile nhận fallback tài nguyên, còn lượt thắng đầu và lượt farm được giới hạn theo ngày. Độ phủ và HOLD hiện tại nằm trong `qa/one-game/GAMEPLAY_LEDGER_P41_P50.md`; kết quả cũ nằm trong `GAMEPLAY_LEDGER_P31.md`.


> Nội dung dưới đây mô tả runtime của dự án này. Không phải trích xuất chính thức từ game Mobile hoặc legacy.

## Nguồn dữ liệu và phiên bản

Runtime là bản chơi đơn kết hợp dữ kiện VERIFIED_MOBILE/VERIFIED_LEGACY với luật SIMULATED/UNKNOWN. Chủ dự án xác nhận quyền sử dụng dữ liệu và tài nguyên tìm được vào 2026-11-25; không yêu cầu SPDX. Snapshot Mobile có 2.656 hàng. Ba bảng legacy `generalrefreshlevellimitinfo`, `upgradeexp` và `fieldrandeventcfginfo` còn HOLD; refresh, EXP và sự kiện dã ngoại dùng công thức SIMULATED riêng. 1.158 nhiệm vụ có 1.883 mục tiêu chạy qua liên kết nguồn hoặc adapter SIMULATED; hiện 480 mục tiêu và 53 cách diễn giải thưởng là SIMULATED. Điều kiện claim được kiểm tra trong save, đây không phải khẳng định parity với game gốc. Trường nguồn được giữ trong adapter.

Runtime có 482 hồ sơ thần tiên Mobile, 151 pháp bảo, 1.885 hàng hóa, 25 binh chủng huấn luyện được, 21 công trình Mobile cùng 6 công trình hỗ trợ, 19 khoa kỹ với 570 cấp nguồn và 73 danh thành Mobile. Chỉ số nguồn không khẳng định cùng công thức/gameplay với Mobile gốc. So sánh tên thần tiên legacy/Mobile chỉ cho thấy 411 nhãn trùng duy nhất; không xác minh định danh hoặc parity.

## Thành trì

Chỉ dẫn nhập môn lần lượt mở xây Phong Mộc Trường, nghiên cứu Nông Chính, dựng Phong Thần Đàn, chiêu mộ thần tiên, trang bị, huấn luyện và trận thắng đầu tiên. Các nút dùng hành động runtime; chỉ dẫn lưu theo save và nhận biết khi queue/trận hoàn tất.

Tử Vi Thành quản lý cấp thành, dân số và mở khóa. Runtime có 21 công trình Mobile và 6 công trình hỗ trợ, dùng một hàng đợi xây dựng chung; 19 nhánh khoa kỹ dùng hàng đợi nghiên cứu. Bấm Xây dựng/Nâng để trừ chi phí; cấp mới có hiệu lực khi hàng đợi hoàn tất. Giá/điều kiện không có dòng nguồn dùng SIMULATED hoặc hiển thị UNKNOWN. Phủ quan có cap nguồn 1 nhưng các điều kiện khoa kỹ đòi Tu Tiên Viện cấp 2 trở lên; runtime dùng cấp cầu nối SIMULATED có provenance riêng. Kiểm toán 1.567 nút/3.958 cạnh không tìm thấy vòng lặp, nút bất khả thi hoặc tham chiếu chưa biết.

| Công trình | Tác dụng runtime |
| --- | --- |
| Ngũ Cốc Viên, Phong Mộc Trường, Địa Mạch Khoáng, Xích Kim Quặng | Tăng lương thực, gỗ, đá, sắt theo giờ |
| Linh Thương, Càn Khôn Khố | Tăng sản lượng lương thực và dung lượng kho |
| Triều Ca Thị, Vạn Lý Trạm | Tăng đồng mỗi giờ; Vạn Lý Trạm giảm phí đổi NPC |
| Thái Học Viện | Mở queue 19 nhánh khoa kỹ, tối đa 30 cấp mỗi nhánh |
| Thần Binh Doanh, Bách Chiến Đài | Quản lý và tăng tốc huấn luyện quân |
| Tiên Gia Phủ, Phong Thần Đàn | Tăng chỗ roster, cho phép chiêu mộ |
| Huyền Thiết Lò | Rèn trang bị theo công thức tài nguyên |
| Hồi Xuân Đường | Hồi quân bị thương với lương và đồng |
| Huyền Vũ Thành, Thiên Lý Đài | Phòng thủ và tốc độ hành quân (mô phỏng) |
| Bát Phương Quán, Vạn Lý Trạm | Ngoại giao NPC và giao thương offline |

Chính sách thuế có ba mức mô phỏng: khoan giảm tạo 75% đồng cơ sở và phục hồi 0,12 dân tâm/giờ; trung dung là mức chuẩn; thuế nặng tạo 130% đồng nhưng giảm 0,24 dân tâm/giờ. Dân tâm và cấp Tử Vi Thành cùng điều chỉnh tốc độ tăng dân số. Chính sách được lưu và vẫn áp dụng trong tiến trình offline. Mỗi danh thành chiếm được trở thành thành phụ; 73 hồ sơ danh thành Mobile cung cấp tên, ảnh và tọa độ khi đã ánh xạ. Có thể nâng thành phụ đến cấp 10 qua hàng xây dựng để tăng sản lượng các tài nguyên; điều kiện cấp là luật runtime SIMULATED.

Thái Học Viện có 19 nhánh Mobile, mỗi nhánh đủ 30 hàng chi phí, hiệu ứng và điều kiện có provenance. Các rate nguồn được áp dụng cho sản xuất, thuế, kho, xây dựng, huấn luyện, công kích và một phần phòng thủ/di chuyển/do thám. Công thức nền vận chuyển, phòng thủ, do thám và sức chứa còn PARTIAL/SIMULATED; nhánh pháp lực không có hệ thống runtime nên UNKNOWN. Thứ tự nhánh theo danh mục Mobile.

Catalog runtime có 4.290 vật phẩm: 2.036 hồ sơ Mobile, 2.004 hồ sơ SIMULATED và 250 tín vật nhiệm vụ legacy SIMULATED. 91 rương Mobile thiếu danh sách mở nguồn có gói tài nguyên SIMULATED; rương còn lại dùng danh sách nguồn đã nối. Vật phẩm đã trang bị, đang cần cho nhiệm vụ chưa nhận hoặc tín vật legacy được giữ khỏi thương nhân mua lại; món tham khảo không còn được dùng có thể bán lấy đồng theo giá SIMULATED. Huyền Thiết Lò cho cường hóa tối đa +5 và khảm hai ngọc vào trang bị; công thức và hiệu lực tăng lực chiến là SIMULATED. Thị trường pháp bảo phân trang để truy cập những món Mobile đủ điều kiện, giá vẫn SIMULATED. Rèn trang bị, mở rương, nâng cấp và bán đều có hành động tiêu thụ thật. Túi chứa tối đa 500 món; món bậc 8 trở lên cần thêm linh ngọc.

## Thần tiên và túi đồ

Roster chiêu mộ gồm 482 hồ sơ Mobile có ảnh và provenance theo trường. 58 định nghĩa mô phỏng được giữ để đọc save cũ nhưng không hiện trong lời mời mới. Giá chiêu mộ dùng đồng + linh ngọc theo công thức SIMULATED; Tiên Gia Phủ mở tối đa 60 chỗ theo cấp. Chỉ số gốc, phe phái, nghề, phẩm chất Mobile, mô tả và pháp bảo chuyên thuộc được giữ theo nguồn; tu luyện và đan XP cộng kinh nghiệm, tự tăng cấp khi đủ ngưỡng; mỗi mốc cấp 4 tăng một cấp kỹ năng. Linh căn/độ gắn kết từ 0–100 tăng khi tu luyện, hành quân và đấu pháp; nó cộng lực chiến, cường hóa pháp môn và tạo cộng hưởng khi hai hoặc ba thần tiên cùng nguyên tố được xếp chung. Tu luyện tiếp tục tăng linh căn kể cả khi thần tiên đã đạt cấp 60. Đội hình cho tối đa ba vị trí theo cấp thành. Vũ khí, giáp và pháp bảo cộng lực chiến nền. Trong combat chiến dịch, vũ khí cộng sát thương, giáp giảm sát thương nhận và pháp bảo tăng hệ số kỹ năng chủ động; phần đóng góp theo đội hình được ghi trong chiến báo. Bốn pháp môn (Hỏa Phù, Huyền Thủy, Phong Lôi, Thất Tinh) có nội tại ở cả combat quân đội và thử thách thần tiên. Đấu pháp thần tiên ở Phong Thần Tháp, Tiên Sơn và Bất Chu Sơn chạy tối đa sáu hiệp xác định theo seed; mỗi hiệp ghi thứ tự ra tay, sát thương thường, kỹ năng đã kích hoạt và trạng thái còn lại. Huyền Thủy tạo khiên ở hiệp 1, Phong Lôi đánh nhanh ở hiệp 1, Hỏa Phù gây sát thương ở hiệp 2 và Thất Tinh hồi phục ở hiệp 3 nếu trận còn tiếp diễn. Tinh thông và hệ số nhân vật vẫn là SIMULATED; kết quả không phải dữ liệu cân bằng được xác minh. Thương nhân NPC bán toàn bộ vật phẩm tiêu hao theo trang; giá dùng đồng + lương thực, vật phẩm bậc cao cần thêm linh ngọc, sức chứa tối đa 500 món. Mua xong dùng vật phẩm để áp dụng hiệu ứng runtime. Huyền Thiết Lò rèn món theo bậc; chiến thắng có tỷ lệ rơi trang bị.

## Quân đội và combat

Catalog giữ 39 định nghĩa binh chủng: 25 hồ sơ Mobile có chỉ số, vai trò, tương khắc, ảnh và provenance; 14 định nghĩa SIMULATED được giữ cho save cũ và đội NPC. Save mới bắt đầu bằng quân Mobile ID 1000. Chỉ 25 hồ sơ Mobile có thể huấn luyện mới. Thời gian gốc của 24 ID trùng lấy từ `147-soldierinfo`; một profile Mobile-only vẫn SIMULATED. `147-soldierrequireinfo` cung cấp chi phí tài nguyên và điều kiện cho 16/25 ID; 126 hàng liên quan khớp chính xác `soldierrequireinfo`. Runtime trừ chi phí theo số quân, kiểm tra cấp Binh doanh và Luyện Binh Thuật/Lĩnh Binh Thuật khi có mapping. Workshop ID 22 được giữ UNKNOWN vì runtime chưa có tòa khớp; chín Mobile ID chưa có hàng yêu cầu legacy giữ chi phí/mở cấp SIMULATED. Các điều kiện legacy không chứng minh parity phiên bản Mobile.

Xạ thủ/trinh sát đánh tuyến sau; công thành đứng tuyến phá thành; các quân còn lại giữ tuyến trước. Tầm đánh góp vào chủ động khai chiến; khắc chế theo vai trò, quân giữ trước bảo vệ đội sau, và Trận Đồ tác động hiệu quả phối hợp. Một lệnh hành quân có thể kết hợp nhiều loại quân; chọn số lượng chính và mở phần hỗ trợ để tận dụng tương khắc. Quân huấn luyện vào kho thành sau khi queue kết thúc. Sĩ khí và nội tại thần tiên tác động combat. Kỹ năng chủ động Huyền Thủy/Phong Lôi kích hoạt hiệp 1, Hỏa Phù hiệp 2 và Thất Tinh hiệp 3, nếu trận kéo dài tới lượt đó. Combat seeded tối đa sáu hiệp; chiến thắng ghi danh vọng/loot, quân chết mất, quân bị thương đi vào Hồi Xuân Đường. Mỗi trong 120 địa điểm có chủ soái, đội NPC 3–5 binh chủng và một ngũ hành; do thám cho biết quân số, chiến thuật và ngũ hành. Vòng mô phỏng Hỏa khắc Kim, Kim khắc Mộc, Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa; mỗi thần tiên thuận/nghịch hệ đổi ±2,5% sát thương gây ra và ±1,5% sát thương nhận. Thần tiên hệ Phong trung tính. Phục kích ưu tiên đòn mở đầu, thủ thành tăng sức bền, kỵ trận và pháp trận tăng sức đánh, Boss có cả phòng ngự lẫn công kích bổ sung. Đội hình địch, tổn thất và diễn biến từng hiệp được giữ trong chiến báo. Chỉ số công/thủ/tốc, ảnh và các hàng tương khắc của 25 quân Mobile dùng dữ kiện nguồn; đội NPC, chỉ huy, vị trí, hệ số sát thương và thưởng vẫn SIMULATED. Chưa có parity combat giữa các phiên bản được xác minh.

## Bản đồ và chiến dịch

120 NPC được chia thành tám chương, mỗi chương 15 địa điểm gồm danh thành, dã địa và Tiên Sơn. Chương đầu mở sẵn; thắng ở dã địa hoặc Tiên Sơn trong chương đang mở mới tiến sang chương kế tiếp. Mục tiêu chương chưa mở không nhận trinh sát, hành quân hoặc ngoại giao. 73 danh thành Mobile hiển thị năm hồ sơ tướng trấn thủ, chân dung và binh chủng được phân công (365 hồ sơ có provenance từng trường và hash ảnh). Mobile ghi quân số trấn thủ thay đổi theo máy chủ, nên số quân Mobile và sức mạnh trận vẫn UNKNOWN/SIMULATED. Snapshot legacy có 375 stack ở 75 tọa độ; 73 tọa độ khớp thành Mobile và 2 chỉ có trong legacy. Mỗi thành khớp có năm tướng kèm ID/tên binh chủng và số quân legacy; đây là đối chiếu phiên bản tham khảo, chưa tác động combat hoặc phần thưởng. Do thám từng mục tiêu mở tên chủ soái, đấu pháp và từng stack quân trong save. Mỗi chương có một mục tiêu chính tuyến riêng ghi nhận thắng ải tại vùng đó; chương kế tiếp chỉ hiện mục tiêu sau khi vùng được mở. Nhiệm vụ của chương chưa mở cũng không thể nhận thưởng. Trụ Vương cần mở tới chương tám, đạt 20 trận thắng và chiếm bảy danh thành; đây là điều kiện thiết kế SIMULATED.

## Thử thách

- Phong Thần Tháp: leo tối đa 9.999 tầng procedural theo cap do dự án chọn cho bản mô phỏng; nguồn hiện chưa xác minh số tầng. Con số 8.992 là số hàng tầng Tiên Sơn trong bảng legacy `elflandfloorinfo`, không phải Phong Thần Tháp.
- Bất Chu Sơn: cấu hình legacy xác minh 5 tầng. Tầng 1–3 có dải cấp/số tướng; tầng 4–5 có 90 đội hình cố định, giữ tên danh tướng, ID binh chủng và toàn bộ quân số theo trường nguồn. Cửa 4 cần 25.000 quân sẵn sàng, cửa 5 cần 100.000; hai cửa dùng nhiều đợt vây hãm, tiến độ từng đợt được lưu và chưa nhận thưởng cho tới khi diệt hết đội hình. Mười Goods ID và 27 dòng trang bị vẫn là tham chiếu; phần thưởng Bất Chu dùng luật SIMULATED.
- Tiên Sơn: 624 tên/mô tả/cấp/số tầng được lấy từ `elflandinfo`; đội NPC cố định và dải nguồn điều khiển adapter combat, còn Thư tịch tra cứu roster. Runtime lưu 8.992 cấu hình tầng, 39.670 đội NPC và 1.093 dòng quy tắc loot; mỗi tầng có ứng viên loot theo cấp nguồn. Diễn giải khoảng `RdmInfo` mang nhãn `SIMULATED_LEGACY_INTERVAL_INTERPRETATION`; một khoảng lỗi bị loại, năm khoảng chồng lấn dùng mục hợp lệ đầu tiên, và 179 ID vật phẩm không ghép được Mobile dùng fallback tài nguyên. Snapshot `_45` khác ở cấp của 94 địa điểm, số tầng của 93 địa điểm, có 744 khóa tầng chỉ trong snapshot chính; đội NPC có 32.545 hàng trùng hoàn toàn, 7.125 chỉ ở snapshot chính và 2.475 chỉ ở `_45`. Dữ liệu hai phiên bản không bị trộn.
- Vật phẩm: catalog gồm 4.290 hồ sơ, trong đó 2.036 có trường Mobile nguồn và 250 là tín vật SIMULATED nối ID nhiệm vụ legacy. Bán lại vật phẩm tham khảo, dùng công thức rèn, cường hóa +1…+5, khảm ngọc và mở rương thiếu bảng rơi có tác dụng runtime. Giá, cường hóa và gói rương thiếu nguồn vẫn SIMULATED/UNKNOWN. Thị trường đổi sáu loại tài nguyên với phí NPC, không phải multiplayer.
- Nhiệm vụ: tiến trình có 1.158 hồ sơ và 1.883 mục tiêu; toàn bộ mục tiêu được nối vào gameplay hoặc adapter SIMULATED, trong đó 480 mục tiêu và 53 cách diễn giải thưởng vẫn SIMULATED. Mã legacy không rõ chức năng được giữ dưới adapter SIMULATED, không khẳng định cùng điều kiện hoặc phần thưởng với Mobile. Thư tịch vẫn giữ riêng văn bản, dòng `questcondition` và provenance theo trường.

## Save/offline

Autosave ghi IndexedDB và localStorage backup. Thời gian offline tối đa 8 giờ. Cài đặt xuất tệp JSON; import kiểm tra cấu trúc, version và danh mục trước khi thay save. Save không đồng bộ lên server.
