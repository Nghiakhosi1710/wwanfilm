import React from 'react';
import "../assets/scss/ChinhSachBaoMat.css";

const ChinhSachBaoMat = () => {
    return (
        <div className="container">
            <div className="chinh-sach-bao-mat">
                <h1>Chính Sách Bảo Mật</h1>
                <p>Chúng tôi cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn khi sử dụng dịch vụ xem phim của chúng tôi.</p>

                <h2>1. Thông Tin Chúng Tôi Thu Thập</h2>
                <ul>
                    <li>Thông tin cá nhân: Họ tên, email, số điện thoại, ngày sinh.</li>
                    <li>Thông tin đăng nhập: Tên đăng nhập, mật khẩu (được mã hóa).</li>
                    <li>Lịch sử xem phim để đề xuất nội dung phù hợp hơn.</li>
                    <li>Dữ liệu thiết bị: Địa chỉ IP, loại trình duyệt, hệ điều hành.</li>
                </ul>

                <h2>2. Cách chúng tôi sử dụng thông tin</h2>
                <p>Chúng tôi sử dụng thông tin thu thập được để:  </p>
                <ul>
                    <li>Cung cấp dịch vụ xem phim trực tuyến.</li>
                    <li>Đề xuất phim theo sở thích của bạn.</li>
                    <li>Cải thiện chất lượng dịch vụ và trải nghiệm người dùng.</li>
                    <li>Gửi thông báo về chương trình khuyến mãi, phim mới (nếu bạn đồng ý nhận).</li>
                    <li>Đảm bảo bảo mật tài khoản và ngăn chặn hành vi gian lận.</li>
                </ul>

                <h2>3. Chia Sẻ Thông Tin</h2>
                <p>WWAN cam kết **không bán, trao đổi hoặc chia sẻ thông tin cá nhân của bạn** với bên thứ ba, trừ các trường hợp:</p>
                <ul>
                    <li>Khi có yêu cầu từ cơ quan pháp luật.</li>
                    <li>Khi cần thiết để bảo vệ quyền lợi hợp pháp của chúng tôi.</li>
                    <li>Khi hợp tác với đối tác quảng cáo (chỉ dữ liệu ẩn danh, không chia sẻ thông tin cá nhân).</li>
                </ul>

                <h2>4. Cookies & Công Nghệ Theo Dõi</h2>
                <p>Chúng tôi sử dụng cookies để ghi nhớ thông tin đăng nhập, cải thiện đề xuất phim và phân tích hành vi người dùng.</p>

                <h2>5. Bảo Mật Thông Tin</h2>
                <p>Chúng tôi áp dụng các biện pháp bảo mật như mã hóa dữ liệu, tường lửa và chống truy cập trái phép để bảo vệ thông tin cá nhân của bạn.</p>

                <h2>6. Quyền Riêng Tư Của Trẻ Em</h2>
                <p>Dịch vụ của chúng tôi không dành cho trẻ em dưới 13 tuổi. Nếu phát hiện tài khoản trẻ em, chúng tôi có quyền xóa tài khoản đó.</p>

                <h2>7. Thay Đổi Chính Sách</h2>
                <p>Chính sách bảo mật có thể thay đổi và chúng tôi sẽ thông báo nếu có cập nhật quan trọng.</p>

                <p className="updated-date">📅 Cập nhật lần cuối: 17/1/2025</p>
            </div>
        </div>
    );
};

export default ChinhSachBaoMat;
