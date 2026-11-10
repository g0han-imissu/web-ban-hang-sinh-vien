/**
 * ==============================================================================
 * SHOPEE EDU-MARKETPLACE - CART & CHECKOUT CONTROLLER (js/cart.js)
 * Chức năng: Quản lý giỏ hàng, Tính toán số lượng, Mã giảm giá MSSV,
 *            3 phương thức thanh toán (COD, VietQR Modal, Ví SPayLater)
 * ==============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  Storage.ready.then(() => CartController.init());
});

const CartController = {
  selectedItems: [], // Danh sách productId được tick chọn để mua
  discountAmount: 0,
  appliedCoupon: null,
  selectedPaymentMethod: "COD", // "COD" | "QR" | "SPayLater"

  init() {
    if (!UserService.getCurrentUser()) {
      window.location.replace("dangnhap.html?returnUrl=giohang.html");
      return;
    }
    this.renderCartTable();
    this.initUserInfo();
    this.bindEvents();
    this.updateCalculation();
  },

  /**
   * Tự động điền thông tin người nhận nếu đã đăng nhập
   */
  initUserInfo() {
    const user = UserService.getCurrentUser();
    if (user) {
      const nameInput = document.getElementById("checkout-name");
      const phoneInput = document.getElementById("checkout-phone");
      const addressInput = document.getElementById("checkout-address");
      const spayLaterLimit = document.getElementById("spaylater-balance-text");

      if (nameInput && !nameInput.value) nameInput.value = user.hoTen || "";
      if (phoneInput && !phoneInput.value) phoneInput.value = user.sdt || "";
      if (addressInput && !addressInput.value) addressInput.value = "Phòng 305, Ký túc xá Đại học";

      if (spayLaterLimit) {
        spayLaterLimit.textContent = `Hạn mức khả dụng: ${FormatHelper.formatVND(user.viTraSau || 0)}`;
      }
    }
  },

  /**
   * Render bảng danh sách sản phẩm trong giỏ hàng
   */
  renderCartTable() {
    return CartView.renderCartTable(this);
  },

  /**
   * Cập nhật trạng thái checkbox "Chọn tất cả"
   */
  updateSelectAllCheckbox() {
    return CartView.updateSelectAllCheckbox(this);
  },

  /**
   * Tính toán và hiển thị tổng tiền, giảm giá
   */
  updateCalculation() {
    return CartView.updateCalculation(this);
  },

  /**
   * Đăng ký các sự kiện tương tác Giỏ hàng & Thanh toán
   */
  bindEvents() {
    // 1. Checkbox chọn từng món
    document.addEventListener("change", (e) => {
      if (e.target.classList.contains("item-checkbox")) {
        const id = e.target.value;
        if (e.target.checked) {
          if (!this.selectedItems.includes(id)) this.selectedItems.push(id);
        } else {
          this.selectedItems = this.selectedItems.filter(item => item !== id);
        }
        this.updateSelectAllCheckbox();
        this.updateCalculation();
      }
    });

    // 2. Checkbox chọn tất cả
    const selectAllCheckbox = document.getElementById("select-all-cart");
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener("change", (e) => {
        const checked = e.target.checked;
        const itemCheckboxes = document.querySelectorAll(".item-checkbox");
        itemCheckboxes.forEach(cb => {
          cb.checked = checked;
        });

        if (checked) {
          const detailedCart = CartService.getDetailedCart();
          this.selectedItems = detailedCart.map(i => i.productId);
        } else {
          this.selectedItems = [];
        }
        this.updateCalculation();
      });
    }

    // 3. Tăng / Giảm số lượng trong giỏ
    document.addEventListener("click", (e) => {
      const btnMinus = e.target.closest(".btn-cart-qty-minus");
      if (btnMinus) {
        const id = btnMinus.dataset.id;
        const cart = CartService.getCart();
        const currentItem = cart.find(i => i.productId === id);
        if (currentItem && currentItem.soLuong > 1) {
          CartService.updateQuantity(id, currentItem.soLuong - 1);
          this.renderCartTable();
          this.updateCalculation();
          HeaderController.updateCartBadge();
          HeaderController.renderMiniCart();
        }
      }

      const btnPlus = e.target.closest(".btn-cart-qty-plus");
      if (btnPlus) {
        const id = btnPlus.dataset.id;
        const product = ProductService.getById(id);
        const cart = CartService.getCart();
        const currentItem = cart.find(i => i.productId === id);
        if (currentItem && product) {
          if (currentItem.soLuong < product.soLuongTon) {
            CartService.updateQuantity(id, currentItem.soLuong + 1);
            this.renderCartTable();
            this.updateCalculation();
            HeaderController.updateCartBadge();
            HeaderController.renderMiniCart();
          } else {
            Toast.warning("Giới hạn tồn kho", `Món này trong kho chỉ còn ${product.soLuongTon} sản phẩm!`);
          }
        }
      }

      // Xóa sản phẩm khỏi giỏ
      const btnRemove = e.target.closest(".btn-remove-cart-item");
      if (btnRemove) {
        const id = btnRemove.dataset.id;
        CartService.removeFromCart(id);
        this.selectedItems = this.selectedItems.filter(item => item !== id);
        this.renderCartTable();
        this.updateCalculation();
        HeaderController.updateCartBadge();
        HeaderController.renderMiniCart();
        Toast.info("Đã xóa", "Đã bỏ sản phẩm khỏi giỏ hàng!");
      }
    });

    // 4. Áp dụng Mã giảm giá / MSSV
    const btnApplyCoupon = document.getElementById("btn-apply-coupon");
    const couponInput = document.getElementById("coupon-code-input");

    if (btnApplyCoupon && couponInput) {
      btnApplyCoupon.addEventListener("click", () => {
        const code = couponInput.value.trim().toUpperCase();

        if (!code) {
          Toast.warning("Chưa nhập mã", "Vui lòng nhập Mã sinh viên hoặc Voucher giảm giá!");
          return;
        }

        // Regex kiểm tra định dạng Mã số sinh viên hợp lệ (8 - 10 ký tự số hoặc tiền tố SV)
        const mssvRegex = /^(SV|sv|BK|bk|DH|dh)?[0-9]{7,10}$/;

        const currentUser = UserService.getCurrentUser();
        if (mssvRegex.test(code) && currentUser?.mssv && code === currentUser.mssv.toUpperCase()) {
          this.discountAmount = 20000;
          this.appliedCoupon = code;
          this.updateCalculation();
          Toast.success("Ưu Đãi Sinh Viên", `Xác thực MSSV (${code}) thành công! Đã giảm ngay 20.000 đ vào đơn hàng.`);
          return;
        }

        // Các mã khuyến mãi sự kiện khác
        if (code === "SINHVIEN2026") {
          this.discountAmount = 25000;
          this.appliedCoupon = code;
          this.updateCalculation();
          Toast.success("Voucher Hợp Lệ", "Áp dụng mã SINHVIEN2026 giảm 25.000 đ thành công!");
        } else if (code === "FREESHIP") {
          this.discountAmount = 15000;
          this.appliedCoupon = code;
          this.updateCalculation();
          Toast.success("Voucher Vận Chuyển", "Áp dụng mã FREESHIP giảm 15.000 đ phí ship!");
        } else {
          Toast.error("Mã không hợp lệ", "Mã giảm giá hoặc MSSV không đúng. Vui lòng thử lại!");
        }
      });
    }

    // 5. Chọn Phương thức thanh toán (COD, QR, SPayLater)
    document.querySelectorAll(".payment-method-card").forEach(card => {
      card.addEventListener("click", (e) => {
        document.querySelectorAll(".payment-method-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        const radio = card.querySelector(".payment-radio");
        if (radio) radio.checked = true;

        this.selectedPaymentMethod = card.dataset.method;

        // Nếu chọn QR: Mở Modal hiển thị mã VietQR giả lập
        if (this.selectedPaymentMethod === "QR") {
          this.openQrModal();
        }
      });
    });

    // 6. Đóng QR Modal
    const btnCloseQr = document.getElementById("btn-close-qr-modal");
    const qrModal = document.getElementById("qr-payment-modal");
    const btnConfirmQr = document.getElementById("btn-confirm-qr-paid");

    if (btnCloseQr && qrModal) {
      btnCloseQr.addEventListener("click", () => {
        qrModal.classList.remove("active");
      });
    }

    if (btnConfirmQr && qrModal) {
      btnConfirmQr.addEventListener("click", () => {
        qrModal.classList.remove("active");
        Toast.success("Đã xác nhận", "Hệ thống đã ghi nhận thanh toán chuyển khoản của bạn!");
      });
    }

    // 7. Bấm nút "ĐẶT HÀNG"
    const btnSubmitOrder = document.getElementById("btn-submit-order");
    if (btnSubmitOrder) {
      btnSubmitOrder.addEventListener("click", async () => this.handleOrderSubmission());
    }
  },

  /**
   * Mở modal quét mã QR chuyển khoản VietQR
   */
  openQrModal() {
    return CartView.openQrModal(this);
  },

  /**
   * Xử lý xác thực form và tiến hành đặt hàng
   */
  async handleOrderSubmission() {
    if (!UserService.getCurrentUser()) {
      Toast.warning("Cần đăng nhập", "Vui lòng đăng nhập trước khi đặt hàng.");
      window.location.href = "dangnhap.html";
      return;
    }
    // 1. Kiểm tra giỏ hàng và danh sách chọn
    if (this.selectedItems.length === 0) {
      Toast.warning("Chưa chọn món", "Vui lòng tick chọn ít nhất 1 sản phẩm để đặt hàng!");
      return;
    }

    // 2. Validate thông tin người nhận
    const nameInput = document.getElementById("checkout-name");
    const phoneInput = document.getElementById("checkout-phone");
    const addressInput = document.getElementById("checkout-address");

    const name = nameInput ? nameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const address = addressInput ? addressInput.value.trim() : "";

    if (!name) {
      Toast.warning("Thiếu họ tên", "Vui lòng nhập họ tên người nhận hàng!");
      if (nameInput) nameInput.focus();
      return;
    }

    // Regex số điện thoại Việt Nam (10 số, bắt đầu bằng 0)
    const phoneRegex = /^0[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      Toast.error("SĐT không hợp lệ", "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0 (VD: 0987654321)!");
      if (phoneInput) phoneInput.focus();
      return;
    }

    if (!address) {
      Toast.warning("Thiếu địa chỉ", "Vui lòng nhập địa chỉ nhận hàng (Ký túc xá / phòng trọ)!");
      if (addressInput) addressInput.focus();
      return;
    }

    const { subtotal, discount, finalTotal } = this.updateCalculation();
    const currentUser = UserService.getCurrentUser();

    // 3. Nếu chọn Ví SPayLater: kiểm tra hạn mức khả dụng
    if (this.selectedPaymentMethod === "SPayLater") {
      const balance = currentUser ? (currentUser.viTraSau || 0) : 0;
      if (balance < finalTotal) {
        Toast.error("Hạn mức không đủ", `Số dư ví SPayLater của bạn (${FormatHelper.formatVND(balance)}) không đủ để thanh toán đơn hàng này (${FormatHelper.formatVND(finalTotal)})! Vui lòng chọn COD hoặc Chuyển khoản QR.`);
        return;
      }
    }

    // 4. Lấy chi tiết các món được đặt
    const detailedCart = CartService.getDetailedCart();
    const orderItems = detailedCart
      .filter(item => this.selectedItems.includes(item.productId))
      .map(item => ({
        productId: item.productId,
        ten: item.product.ten,
        soLuong: item.soLuong,
        donGia: item.donGia,
        anhChinh: item.product.anhChinh,
        shopId: item.product.nguoiBanId
      }));

    // 5. Tạo đơn hàng mới lưu vào LocalStorage
    let newOrder;
    try {
      newOrder = await OrderService.createOrder({
      buyerId: currentUser ? currentUser.id : "guest_user",
      tenNguoiNhan: name,
      sdt: phone,
      diaChi: address,
      items: orderItems,
      tongTien: finalTotal,
      giamGia: discount,
      maGiamGia: this.appliedCoupon,
      phuongThucThanhToan: this.selectedPaymentMethod,
      trangThai: "ChoXacNhan"
      });
    } catch (error) {
      Toast.error("Không thể đặt hàng", error.message || "Vui lòng kiểm tra tồn kho và thử lại.");
      return;
    }

    if (this.selectedPaymentMethod === "SPayLater" && finalTotal > 0) {
      try {
        await UserService.updateViTraSau(currentUser.id, -finalTotal, newOrder.orderId);
      } catch (error) {
        try { await OrderService.cancelOrder(newOrder.orderId, { skipRefund: true }); }
        catch (cancelError) { console.error("Không thể hoàn tác đơn chưa thanh toán:", cancelError); }
        Toast.error("Không thể thanh toán", error.message || "Không trừ được hạn mức ví.");
        return;
      }
    }

    // 6. Xóa các món đã đặt khỏi giỏ hàng
    this.selectedItems.forEach(id => {
      CartService.removeFromCart(id);
    });

    await Storage.flush();

    // 7. Cập nhật Badge giỏ hàng và chuyển hướng sang trang Đơn mua
    HeaderController.updateCartBadge();
    HeaderController.renderMiniCart();

    Toast.success("Đặt hàng thành công", `Mã đơn hàng: ${newOrder.orderId}. Đang chuyển đến trang theo dõi đơn...`);

    setTimeout(() => {
      window.location.href = "donmua.html";
    }, 1200);
  }
};

