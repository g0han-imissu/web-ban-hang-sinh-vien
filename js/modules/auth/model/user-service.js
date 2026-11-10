/** Account model/service; credentials are checked by the backend when available. */
const UserService = {
  getAll() {
    return Storage.get("users", []);
  },

  getCurrentUser() {
    return Storage.get("currentUser", null);
  },

  setCurrentUser(user) {
    const { password, passwordHash, passwordSalt, ...safeUser } = user;
    Storage.set("currentUser", safeUser);
    localStorage.setItem("edumarket-authenticated", "1");
    return true;
  },

  async logout() {
    Storage.remove("currentUser");
    // Giỏ và danh sách yêu thích là dữ liệu riêng tư, không để lộ cho phiên khách tiếp theo.
    Storage.set("cart", []);
    Storage.set("wishlist", []);
    sessionStorage.removeItem("edumarket-access-token");
    localStorage.removeItem("edumarket-authenticated");
    await Storage.flush();
    return true;
  },

  async login(username, password) {
    let result;
    if (Storage.remoteConnected) {
      try {
        result = await ApiClient.post("/auth/login", { username, password });
      } catch (error) {
        return { success: false, message: error.message || "Không kết nối được máy chủ." };
      }
    } else {
      const user = this.getAll().find(item => item.username === username && item.password === password);
      result = user
        ? { success: true, user }
        : { success: false, message: "Tên đăng nhập hoặc mật khẩu không chính xác!" };
    }
    if (result.success) {
      if (result.token) sessionStorage.setItem("edumarket-access-token", result.token);
      this.setCurrentUser(result.user);
    }
    return result;
  },

  async register(userData) {
    let result;
    if (Storage.remoteConnected) {
      try {
        result = await ApiClient.post("/auth/register", userData);
      } catch (error) {
        return { success: false, message: error.message || "Không kết nối được máy chủ." };
      }
    } else {
      const users = this.getAll();
      if (users.some(user => user.username === userData.username)) {
        return { success: false, message: "Tên đăng nhập đã tồn tại!" };
      }
      if (users.some(user => user.email === userData.email)) {
        return { success: false, message: "Email đã được sử dụng!" };
      }
      const user = {
        id: "user_" + Date.now().toString().slice(-6),
        viTraSau: 500000,
        tenShop: userData.tenShop || `Gian Hàng Sinh Viên ${userData.hoTen}`,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        ...userData,
      };
      result = { success: true, user };
    }

    if (result.success) {
      if (result.token) sessionStorage.setItem("edumarket-access-token", result.token);
      const users = this.getAll().filter(user => user.id !== result.user.id);
      users.push(result.user);
      Storage.set("users", users);
      this.setCurrentUser(result.user);
    }
    return result;
  },

  async updateViTraSau(userId, deltaAmount, orderId = null) {
    let updatedUser;
    if (Storage.remoteConnected) {
      const result = await ApiClient.post(`/users/${encodeURIComponent(userId)}/wallet`, { delta: deltaAmount, orderId });
      updatedUser = result.user;
    } else {
      const users = this.getAll();
      const user = users.find(item => item.id === userId);
      if (!user) return null;
      user.viTraSau = Math.max(0, (user.viTraSau || 0) + deltaAmount);
      updatedUser = user;
      Storage.set("users", users);
    }

    const users = this.getAll().map(user => user.id === userId ? { ...user, ...updatedUser } : user);
    Storage.set("users", users);
    const current = this.getCurrentUser();
    if (current && current.id === userId) this.setCurrentUser({ ...current, ...updatedUser });
    return updatedUser.viTraSau;
  },
};
