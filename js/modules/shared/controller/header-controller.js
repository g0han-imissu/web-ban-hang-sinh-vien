// ==============================================================================
// 2. HEADER & MINI-CART CONTROLLER
// ==============================================================================
const HeaderController = {
  init() {
    this.renderUserAuth();
    this.updateCartBadge();
    this.renderMiniCart();
    this.bindSearchEvent();
    this.bindLogoutEvent();
    this.bindUserDropdown();
  },

  renderUserAuth() {
    return HeaderView.renderUserAuth(this);
  },

  updateCartBadge() {
    return HeaderView.updateCartBadge(this);
  },

  renderMiniCart() {
    return HeaderView.renderMiniCart(this);
  },

  bindSearchEvent() {
    const searchForm = document.getElementById("header-search-form");
    const searchInput = document.getElementById("header-search-input");

    if (searchForm && searchInput) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const keyword = searchInput.value.trim();
        if (keyword) {
          window.location.href = `danhsachsanpham.html?search=${encodeURIComponent(keyword)}`;
        } else {
          window.location.href = `danhsachsanpham.html`;
        }
      });
    }
  },

  bindLogoutEvent() {
    document.addEventListener("click", (e) => {
      if (e.target.closest("#btn-logout")) {
        e.preventDefault();
        UserService.logout().finally(() => {
          window.location.href = "trangchu.html";
        });
      }
    });
  },

  bindUserDropdown() {
    document.addEventListener("click", (e) => {
      const userTrigger = e.target.closest(".header-user-trigger");
      const userDropdown = document.querySelector(".header-user-dropdown");

      // Khi ấn vào tên / avatar tài khoản
      if (userTrigger) {
        e.stopPropagation();
        const isOpen = userDropdown && userDropdown.classList.contains("show");
        if (userDropdown) {
          userDropdown.classList.toggle("show", !isOpen);
        }
        userTrigger.classList.toggle("active", !isOpen);
        return;
      }

      // Khi click vào các link bên trong menu dropdown thì cho phép chạy bình thường
      if (e.target.closest(".header-user-dropdown")) {
        return;
      }

      // Ấn ra ngoài bất kỳ đâu thì đóng menu
      if (userDropdown) {
        userDropdown.classList.remove("show");
      }
      const activeTrigger = document.querySelector(".header-user-trigger.active");
      if (activeTrigger) {
        activeTrigger.classList.remove("active");
      }
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Storage.ready.then(() => HeaderController.init());
});
