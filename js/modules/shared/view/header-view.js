/** View module: render giao diện và cập nhật phần tử DOM. */
const HeaderView = {
  renderUserAuth(controller) {
    const authWrapper = document.getElementById("header-auth-section");
    if (!authWrapper) return;

    const currentUser = UserService.getCurrentUser();
    if (!currentUser) {
      authWrapper.innerHTML = `<a href="dangky.html" class="fw-medium">Đăng Ký</a>
        <span class="header-topbar-divider"></span>
        <a href="dangnhap.html" class="fw-medium">Đăng Nhập</a>`;
      return;
    }

    authWrapper.innerHTML = `<div class="header-user-controls">
        <div class="header-user-wrapper">
          <div class="header-user-trigger">
            <img class="header-user-avatar" src="${currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}" alt="${currentUser.hoTen}">
            <span class="header-user-name">${currentUser.hoTen}</span>
            <i class="fa-solid fa-angle-down" style="font-size: 0.72rem; color: rgba(255,255,255,0.7);"></i>
          </div>
          <div class="header-user-dropdown">
            <a href="donmua.html" class="header-dropdown-item"><i class="fa-solid fa-clipboard-list"></i><span>Đơn Mua Của Tôi</span></a>
            <a href="yeuthich.html" class="header-dropdown-item"><i class="fa-solid fa-heart"></i><span>Món Đồ Đã Lưu</span></a>
            <a href="kenhnguoiban.html" class="header-dropdown-item"><i class="fa-solid fa-store"></i><span>Kênh Người Bán</span></a>
          </div>
        </div>
        <button type="button" id="btn-logout" class="header-logout-btn"><i class="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất</button>
      </div>`;
  },
  updateCartBadge(controller) {
    const badgeEl = document.getElementById("header-cart-badge");
    if (!badgeEl) return;
    const cartLink = badgeEl.closest(".header-cart-link");
    const isAuthenticated = Boolean(UserService.getCurrentUser());
    if (cartLink) {
      cartLink.href = isAuthenticated ? "giohang.html" : "dangnhap.html?returnUrl=giohang.html";
      cartLink.setAttribute("aria-label", isAuthenticated ? "Xem giỏ hàng" : "Đăng nhập để xem giỏ hàng");
    }
    const cartWrapper = badgeEl.closest(".header-cart-wrapper");
    if (cartWrapper) cartWrapper.classList.toggle("guest-cart", !isAuthenticated);
    if (!isAuthenticated) {
      badgeEl.textContent = "0";
      badgeEl.style.display = "none";
      const miniCartList = document.getElementById("mini-cart-items");
      if (miniCartList) miniCartList.innerHTML = "<div class=\"mini-cart-empty\">Đăng nhập để sử dụng giỏ hàng</div>";
      const miniCartFooter = document.getElementById("mini-cart-footer");
      if (miniCartFooter) miniCartFooter.style.display = "none";
      return;
    }
    const totalCount = CartService.getCount();
    badgeEl.textContent = totalCount;
    badgeEl.style.display = totalCount > 0 ? "inline-block" : "none";
  
  },
  renderMiniCart(controller) {
    if (!UserService.getCurrentUser()) return;
    const miniCartList = document.getElementById("mini-cart-items");
    const miniCartFooter = document.getElementById("mini-cart-footer");
    if (!miniCartList) return;

    const detailedCart = CartService.getDetailedCart();

    if (detailedCart.length === 0) {
      miniCartList.innerHTML = `
        <div class="mini-cart-empty">
          <i class="fa-solid fa-cart-shopping"></i>
          <div>Giỏ hàng của bạn đang trống</div>
        </div>
      `;
      if (miniCartFooter) miniCartFooter.style.display = "none";
      return;
    }

    if (miniCartFooter) miniCartFooter.style.display = "flex";

    const recentItems = detailedCart.slice(0, 5);
    miniCartList.innerHTML = recentItems.map(item => `
      <a href="chitietsanpham.html?id=${item.productId}" class="mini-cart-item">
        <img src="${item.product.anhChinh}" alt="${item.product.ten}" class="mini-cart-img">
        <div class="mini-cart-info">
          <div class="mini-cart-name" title="${item.product.ten}">${item.product.ten}</div>
          <div class="d-flex align-center justify-between">
            <span class="mini-cart-price">${FormatHelper.formatVND(item.donGia)}</span>
            <span class="text-muted" style="font-size: 0.8rem;">x${item.soLuong}</span>
          </div>
        </div>
      </a>
    `).join("");

    const countText = document.getElementById("mini-cart-count-text");
    if (countText) {
      countText.textContent = `${detailedCart.length} món trong giỏ`;
    }
  
  }
};
