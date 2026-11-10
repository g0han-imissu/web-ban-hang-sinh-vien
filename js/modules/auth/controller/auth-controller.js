/**
 * ==============================================================================
 * SHOPEE EDU-MARKETPLACE - AUTHENTICATION & VALIDATION LOGIC (js/auth.js)
 * Chức năng: Đăng ký, Đăng nhập, Regex validate form, Cập nhật phiên đăng nhập
 * ==============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  Storage.ready.then(() => AuthController.init());
});

const AuthController = {
  init() {
    this.bindRegisterForm();
    this.bindLoginForm();
  },

  /**
   * Biểu thức chính quy (Regex) kiểm tra tính hợp lệ dữ liệu sinh viên
   */
  regexRules: {
    // Email tiêu chuẩn
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    // Số điện thoại Việt Nam (10 số bắt đầu bằng 0)
    phone: /^0[3|5|7|8|9][0-9]{8}$/,
    // Mã số sinh viên (chữ số từ 7-10 ký tự, có thể có tiền tố trường như SV, BK, DH)
    mssv: /^(SV|sv|BK|bk|DH|dh)?[0-9]{7,10}$/,
    // Mật khẩu tối thiểu 6 ký tự
    password: /^.{6,}$/
  },

  /**
   * Xử lý Đăng ký tài khoản mới
   */
  bindRegisterForm() {
    const form = document.getElementById("form-register");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("reg-username").value.trim();
      const fullname = document.getElementById("reg-fullname").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const phone = document.getElementById("reg-phone").value.trim();
      const mssv = document.getElementById("reg-mssv").value.trim().toUpperCase();
      const password = document.getElementById("reg-password").value;
      const confirmPassword = document.getElementById("reg-confirm-password").value;
      const shopName = document.getElementById("reg-shopname").value.trim();

      // 1. Kiểm tra trường trống
      if (!username || !fullname || !email || !phone || !mssv || !password) {
        Toast.warning("Thiếu dữ liệu", "Vui lòng điền đầy đủ các thông tin bắt buộc!");
        return;
      }

      // 2. Validate Email bằng Regex
      if (!this.regexRules.email.test(email)) {
        Toast.error("Email không hợp lệ", "Định dạng email phải chuẩn (Ví dụ: sinhvien@edu.vn)!");
        document.getElementById("reg-email").focus();
        return;
      }

      // 3. Validate Số điện thoại bằng Regex
      if (!this.regexRules.phone.test(phone)) {
        Toast.error("SĐT không hợp lệ", "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0 (Ví dụ: 0987654321)!");
        document.getElementById("reg-phone").focus();
        return;
      }

      // 4. Validate Mã số sinh viên (MSSV) bằng Regex
      if (!this.regexRules.mssv.test(mssv)) {
        Toast.error("MSSV không hợp lệ", "Mã số sinh viên phải từ 7-10 chữ số (Ví dụ: 20210001)!");
        document.getElementById("reg-mssv").focus();
        return;
      }

      // 5. Validate Mật khẩu tối thiểu 6 ký tự
      if (!this.regexRules.password.test(password)) {
        Toast.error("Mật khẩu yếu", "Mật khẩu phải chứa ít nhất 6 ký tự!");
        document.getElementById("reg-password").focus();
        return;
      }

      // 6. Kiểm tra trùng khớp mật khẩu xác nhận
      if (password !== confirmPassword) {
        Toast.error("Mật khẩu không khớp", "Mật khẩu xác nhận không trùng khớp với mật khẩu đã nhập!");
        document.getElementById("reg-confirm-password").focus();
        return;
      }

      // Tiến hành lưu tài khoản vào cơ sở dữ liệu
      const res = await UserService.register({
        username,
        password,
        hoTen: fullname,
        email,
        sdt: phone,
        mssv,
        tenShop: shopName || `Tiệm Sinh Viên ${fullname}`
      });

      if (res.success) {
        Toast.success("Đăng ký thành công", `Chào mừng bạn ${fullname}! Bạn được tặng ngay hạn mức Ví SPayLater 500.000 đ.`);
        setTimeout(() => {
          window.location.href = "trangchu.html";
        }, 1500);
      } else {
        Toast.error("Đăng ký thất bại", res.message);
      }
    });
  },

  /**
   * Xử lý Đăng nhập tài khoản
   */
  bindLoginForm() {
    const form = document.getElementById("form-login");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("login-username").value.trim();
      const password = document.getElementById("login-password").value;

      if (!username || !password) {
        Toast.warning("Thiếu thông tin", "Vui lòng nhập tên đăng nhập và mật khẩu!");
        return;
      }

      const res = await UserService.login(username, password);

      if (res.success) {
        Toast.success("Đăng nhập thành công", `Xin chào, ${res.user.hoTen}! Chúc bạn mua sắm vui vẻ.`);
        setTimeout(() => {
          const requestedPage = new URLSearchParams(window.location.search).get("returnUrl");
          const safeReturnPage = requestedPage && /^[a-z0-9_-]+\.html$/i.test(requestedPage)
            ? requestedPage
            : "trangchu.html";
          window.location.href = safeReturnPage;
        }, 1200);
      } else {
        Toast.error("Đăng nhập thất bại", res.message);
      }
    });
  }
};

