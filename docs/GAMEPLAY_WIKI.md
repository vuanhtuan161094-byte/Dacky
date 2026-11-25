# Wiki gameplay (bản mô phỏng hiện tại)

## Chơi trên ONE GAME

Tại Thành trì, làm lần lượt các bước nhập môn để mở xây dựng, khoa kỹ, chiêu mộ và huấn luyện. Trận quân đội đầu tiên diễn ra ở Vân Mộng Đài. Thắng dã địa trong chương hiện tại để mở chương kế tiếp. Hồi phục thương binh tại Binh doanh. Để đánh thành, ưu tiên đưa thêm quân công thành. Chiến báo cho xem lại quân số, pháp lực, thương vong và tình trạng thành lũy theo hiệp.

Trong Phong Thần, Phong Thần Tháp và Bất Chu Sơn dùng đội thần tiên. Mục Chinh phạt dùng quân đội. Chọn Tiên Sơn, binh chủng và quân số rồi gửi quân vào tầng đã mở. Các tầng sau cần chiến thắng trước đó. Thành trì NPC và khu Boss ở nhóm bên dưới. Đội hình cố định lấy từ snapshot legacy. Nơi có khoảng cấp và quân số nhưng thiếu đội cụ thể sẽ tạo quân đồn trú theo cấu hình đó. Các trận này có thưởng lần thắng đầu do game cân bằng.

Nhận lương bổng ngày trong Phong Thần. Thắng một trận chính tuyến để mở tuần tra. Dịch quán và Phong Thần Đàn mở ưu đãi chiêu mộ luân phiên. Có thể làm mới ưu đãi một lần mỗi ngày với 50 đồng.

Lương bổng, tuần tra, giảm giá chiêu mộ, curve EXP và công thức phần thưởng PvE là thiết kế cục bộ. Bảng thưởng Tiên Sơn và liên kết trang bị Boss legacy còn ở dạng tra cứu. Xem bộ dữ liệu kiểm kê gameplay đi kèm bản Web để biết độ phủ từng nhóm.


> Nội dung dưới đây mô tả runtime của dự án này. Không phải trích xuất chính thức từ game Mobile hoặc legacy.

## Nguồn dữ liệu và phiên bản

Runtime là bản chơi đơn kết hợp dữ kiện đã xác minh và cơ chế còn SIMULATED/UNKNOWN. Chủ dự án xác nhận quyền sử dụng dữ liệu và tài nguyên đã tìm được vào 2026-11-25; không yêu cầu SPDX. Snapshot Mobile `5d78c226cb` có 2.656 hàng; 37.845 giá trị theo trường đã nối vào gameplay. Legacy giải mã 67/70 bảng, ba bảng `HOLD` còn ghi trong `BLOCKERS.md`. Thư viện tham khảo có 1.158 nhiệm vụ và 5.745 hàng `questcondition` liên kết đủ 1.158 ID; từng cột giữ provenance. Các mã `type/data` chưa xác minh ngữ nghĩa và các bảng nhập không có trường phần thưởng, vì vậy chưa kích hoạt điều kiện/phần thưởng trong tiến trình. Thời gian huấn luyện gốc của 24/25 quân Mobile dùng trường `147-soldierinfo`. Chi phí và điều kiện huấn luyện legacy đã được map cho 16/25 ID; chín ID không có hàng nguồn vẫn SIMULATED và Workshop ID 22 chưa có hệ tương ứng nên UNKNOWN. Delta giữa các phiên bản không chứng minh parity.

So sánh danh mục hiện xác nhận: 482 hồ sơ thần tiên Mobile trên 540 định nghĩa runtime (482 được mời chiêu mộ; 58 mô phỏng không mở chiêu mộ), pháp bảo 151/156, vật phẩm 1.885/2.155, binh chủng 25/39 (25 Mobile được huấn luyện), công trình 21/21, khoa kỹ 19/19, danh thành 73/75 nhóm tọa độ legacy. So sánh `quest`/`quest_20_11` ghi 1.156 ID chung, hai ID riêng trong `quest` (110098, 110099) và ba thay đổi trường `title`; các delta này không chứng minh luật Mobile. Đối chiếu nhãn thần tiên legacy/Mobile có 411 tên duy nhất trùng, 129 tên chỉ ở legacy, 70 chỉ ở Mobile; một nhãn Mobile bị trùng. Đây chỉ là đối chiếu tên, không xác minh cùng định danh, chỉ số hoặc công thức.

## Thành trì

Chỉ dẫn nhập môn lần lượt mở xây Phong Mộc Trường, nghiên cứu Nông Chính, dựng Phong Thần Đàn, chiêu mộ thần tiên, trang bị, huấn luyện và trận thắng đầu tiên. Các nút dùng hành động runtime; chỉ dẫn lưu theo save và nhận biết khi queue/trận hoàn tất.

Tử Vi Thành quản lý cấp thành, dân số và mở khóa. Runtime có 21 công trình; 15 hồ sơ Mobile được nối vào gameplay. Bấm Xây dựng/Nâng để trừ chi phí ngay; cấp mới có hiệu lực khi hàng đợi chung hoàn tất. 14 công trình có đủ chi phí và điều kiện Mobile cho 30 cấp (420 hàng cấp). Bệnh viện Mobile ID 200 không có bảng giá hoặc giới hạn cấp nguồn; sáu ID công trình chưa ánh xạ và các điều kiện chưa hiểu giữ SIMULATED/UNKNOWN.

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

Catalog runtime có 4.040 vật phẩm: 2.036 hồ sơ Mobile (151 pháp bảo, 1.885 hàng hóa) và 2.004 hồ sơ SIMULATED. Thương nhân hiển thị 1.885 món tiêu hao Mobile cùng 6 món SIMULATED; 88 rương có liên kết nguồn để mua nhưng giá chuyển đổi vẫn SIMULATED. Túi chứa tối đa 500 món; món bậc 8 trở lên cần thêm linh ngọc. Bốn pháp môn đội hình có nội tại tăng sát thương, giảm sát thương nhận vào, tăng đòn mở đầu và sức bền. Trong hành quân, Huyền Thủy hộ thể và Phong Lôi khai trận ở hiệp 1, Hỏa Phù gây sát thương ở hiệp 2, Thất Tinh hồi quân ở hiệp 3; cấp kỹ năng và linh căn làm mạnh hệ số. Chiến báo ghi lượng sát thương kỹ năng, sát thương đã chặn và hồi phục thực nhận. XP từ tu luyện, tiêu hao hoặc PvE tự tính cấp mới và mốc kỹ năng.

## Thần tiên và túi đồ

Roster chiêu mộ gồm 482 hồ sơ Mobile có ảnh và provenance theo trường. 58 định nghĩa mô phỏng được giữ để đọc save cũ nhưng không hiện trong lời mời mới. Giá chiêu mộ dùng đồng + linh ngọc theo công thức SIMULATED; Tiên Gia Phủ mở tối đa 60 chỗ theo cấp. Chỉ số gốc, phe phái, nghề, phẩm chất Mobile, mô tả và pháp bảo chuyên thuộc được giữ theo nguồn; tu luyện và đan XP cộng kinh nghiệm, tự tăng cấp khi đủ ngưỡng; mỗi mốc cấp 4 tăng một cấp kỹ năng. Linh căn/độ gắn kết từ 0–100 tăng khi tu luyện, hành quân và đấu pháp; nó cộng lực chiến, cường hóa pháp môn và tạo cộng hưởng khi hai hoặc ba thần tiên cùng nguyên tố được xếp chung. Tu luyện tiếp tục tăng linh căn kể cả khi thần tiên đã đạt cấp 60. Đội hình cho tối đa ba vị trí theo cấp thành. Vũ khí, giáp và pháp bảo cộng lực chiến nền. Trong combat chiến dịch, vũ khí cộng sát thương, giáp giảm sát thương nhận và pháp bảo tăng hệ số kỹ năng chủ động; phần đóng góp theo đội hình được ghi trong chiến báo. Bốn pháp môn (Hỏa Phù, Huyền Thủy, Phong Lôi, Thất Tinh) có nội tại ở cả combat quân đội và thử thách thần tiên. Đấu pháp thần tiên ở Phong Thần Tháp, Tiên Sơn và Bất Chu Sơn chạy tối đa sáu hiệp xác định theo seed; mỗi hiệp ghi thứ tự ra tay, sát thương thường, kỹ năng đã kích hoạt và trạng thái còn lại. Huyền Thủy tạo khiên ở hiệp 1, Phong Lôi đánh nhanh ở hiệp 1, Hỏa Phù gây sát thương ở hiệp 2 và Thất Tinh hồi phục ở hiệp 3 nếu trận còn tiếp diễn. Tinh thông và hệ số nhân vật vẫn là SIMULATED; kết quả không phải dữ liệu cân bằng được xác minh. Thương nhân NPC bán toàn bộ vật phẩm tiêu hao theo trang; giá dùng đồng + lương thực, vật phẩm bậc cao cần thêm linh ngọc, sức chứa tối đa 500 món. Mua xong dùng vật phẩm để áp dụng hiệu ứng runtime. Huyền Thiết Lò rèn món theo bậc; chiến thắng có tỷ lệ rơi trang bị.

## Quân đội và combat

Catalog giữ 39 định nghĩa binh chủng: 25 hồ sơ Mobile có chỉ số, vai trò, tương khắc, ảnh và provenance; 14 định nghĩa SIMULATED được giữ cho save cũ và đội NPC. Save mới bắt đầu bằng quân Mobile ID 1000. Chỉ 25 hồ sơ Mobile có thể huấn luyện mới. Thời gian gốc của 24 ID trùng lấy từ `147-soldierinfo`; một profile Mobile-only vẫn SIMULATED. `147-soldierrequireinfo` cung cấp chi phí tài nguyên và điều kiện cho 16/25 ID; 126 hàng liên quan khớp chính xác `soldierrequireinfo`. Runtime trừ chi phí theo số quân, kiểm tra cấp Binh doanh và Luyện Binh Thuật/Lĩnh Binh Thuật khi có mapping. Workshop ID 22 được giữ UNKNOWN vì runtime chưa có tòa khớp; chín Mobile ID chưa có hàng yêu cầu legacy giữ chi phí/mở cấp SIMULATED. Các điều kiện legacy không chứng minh parity phiên bản Mobile.

Xạ thủ/trinh sát đánh tuyến sau; công thành đứng tuyến phá thành; các quân còn lại giữ tuyến trước. Tầm đánh góp vào chủ động khai chiến; khắc chế theo vai trò, quân giữ trước bảo vệ đội sau, và Trận Đồ tác động hiệu quả phối hợp. Một lệnh hành quân có thể kết hợp nhiều loại quân; chọn số lượng chính và mở phần hỗ trợ để tận dụng tương khắc. Quân huấn luyện vào kho thành sau khi queue kết thúc. Sĩ khí và nội tại thần tiên tác động combat. Kỹ năng chủ động Huyền Thủy/Phong Lôi kích hoạt hiệp 1, Hỏa Phù hiệp 2 và Thất Tinh hiệp 3, nếu trận kéo dài tới lượt đó. Combat seeded tối đa sáu hiệp; chiến thắng ghi danh vọng/loot, quân chết mất, quân bị thương đi vào Hồi Xuân Đường. Mỗi trong 120 địa điểm có chủ soái, đội NPC 3–5 binh chủng và một ngũ hành; do thám cho biết quân số, chiến thuật và ngũ hành. Vòng mô phỏng Hỏa khắc Kim, Kim khắc Mộc, Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa; mỗi thần tiên thuận/nghịch hệ đổi ±2,5% sát thương gây ra và ±1,5% sát thương nhận. Thần tiên hệ Phong trung tính. Phục kích ưu tiên đòn mở đầu, thủ thành tăng sức bền, kỵ trận và pháp trận tăng sức đánh, Boss có cả phòng ngự lẫn công kích bổ sung. Đội hình địch, tổn thất và diễn biến từng hiệp được giữ trong chiến báo. Chỉ số công/thủ/tốc, ảnh và các hàng tương khắc của 25 quân Mobile dùng dữ kiện nguồn; đội NPC, chỉ huy, vị trí, hệ số sát thương và thưởng vẫn SIMULATED. Chưa có parity combat giữa các phiên bản được xác minh.

## Bản đồ và chiến dịch

120 NPC được chia thành tám chương, mỗi chương 15 địa điểm gồm danh thành, dã địa và Tiên Sơn. Chương đầu mở sẵn; thắng ở dã địa hoặc Tiên Sơn trong chương đang mở mới tiến sang chương kế tiếp. Mục tiêu chương chưa mở không nhận trinh sát, hành quân hoặc ngoại giao. 73 danh thành Mobile hiển thị năm hồ sơ tướng trấn thủ, chân dung và binh chủng được phân công (365 hồ sơ có provenance từng trường và hash ảnh). Mobile ghi quân số trấn thủ thay đổi theo máy chủ, nên số quân Mobile và sức mạnh trận vẫn UNKNOWN/SIMULATED. Snapshot legacy có 375 stack ở 75 tọa độ; 73 tọa độ khớp thành Mobile và 2 chỉ có trong legacy. Mỗi thành khớp có năm tướng kèm ID/tên binh chủng và số quân legacy; đây là đối chiếu phiên bản tham khảo, chưa tác động combat hoặc phần thưởng. Do thám từng mục tiêu mở tên chủ soái, đấu pháp và từng stack quân trong save. Mỗi chương có một mục tiêu chính tuyến riêng ghi nhận thắng ải tại vùng đó; chương kế tiếp chỉ hiện mục tiêu sau khi vùng được mở. Nhiệm vụ của chương chưa mở cũng không thể nhận thưởng. Trụ Vương cần mở tới chương tám, đạt 20 trận thắng và chiếm bảy danh thành; đây là điều kiện thiết kế SIMULATED.

## Thử thách

- Phong Thần Tháp: leo tối đa 9.999 tầng procedural theo cap do dự án chọn cho bản mô phỏng; nguồn hiện chưa xác minh số tầng. Con số 8.992 là số hàng tầng Tiên Sơn trong bảng legacy `elflandfloorinfo`, không phải Phong Thần Tháp.
- Bất Chu Sơn: cấu hình legacy xác minh 5 tầng. Tầng 1–3 có dải cấp/số tướng; tầng 4–5 có 90 đội hình cố định, giữ tên danh tướng, ID binh chủng và quân số theo trường nguồn. Mười Goods ID và 27 dòng bảng rơi trang bị được giữ làm tham chiếu; cú pháp rơi chưa giải nghĩa nên trận và thưởng vẫn dùng fallback, không cộng dữ liệu nguồn lần hai.
- Tiên Sơn: 624 tên/mô tả/cấp/số tầng được lấy từ `elflandinfo`; UI cho tra cứu roster theo từng địa điểm và tầng. Runtime lưu 8.992 cấu hình tầng, 39.670 đội NPC và 1.093 dòng quy tắc loot. Snapshot `_45` khác ở cấp của 94 địa điểm, số tầng của 93 địa điểm, có 744 khóa tầng chỉ trong snapshot chính; đội NPC có 32.545 hàng trùng hoàn toàn, 7.125 chỉ ở snapshot chính và 2.475 chỉ ở `_45`. Dữ liệu hai phiên bản không bị trộn. Sức mạnh, phần thưởng và combat trong lượt chơi vẫn SIMULATED/fallback; quy tắc `RdmInfo` UNKNOWN và chưa cấp loot.
- Vật phẩm: catalog gồm 4.040 hồ sơ, trong đó 2.036 trường hợp có dữ kiện Mobile. Hiệu ứng trang bị và mở rương chỉ áp dụng các phép chuyển đổi đã nối; giá mua và cơ chế chưa xác minh vẫn SIMULATED/UNKNOWN. Thị trường đổi sáu loại tài nguyên với phí NPC, không phải multiplayer.
- Nhiệm vụ: tiến trình đang chơi có 1.158 mục tiêu mô phỏng qua tám chương, có nhiệm vụ cuối đánh bại Trụ Vương. Thư tịch tách riêng 1.158 mô tả và 5.745 dòng `questcondition` legacy đã xác minh theo trường; mã điều kiện chưa giải nghĩa, dữ liệu nhập không có cột phần thưởng, và các dòng này không tự nhận là gameplay Mobile.

## Save/offline

Autosave ghi IndexedDB và localStorage backup. Thời gian offline tối đa 8 giờ. Cài đặt xuất tệp JSON; import kiểm tra cấu trúc, version và danh mục trước khi thay save. Save không đồng bộ lên server.
