import {
  updateProfile,
  deleteUser,
  signOut,
  updatePassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { auth } from "./firebase.js";

// Custom alert
function customAlert(message, callback) {
  const alertBox = document.getElementById('customAlert');
  const alertMessage = document.getElementById('customAlertMsg');
  const alertClose = document.getElementById('customAlertClose');
  if (!alertBox || !alertMessage || !alertClose) {
    alert(message); if (typeof callback === 'function') callback(); return;
  }
  alertMessage.textContent = message;
  alertBox.style.display = 'flex';
  alertBox.classList.remove('fadeOut');
  void alertBox.offsetWidth;
  alertBox.classList.add('fadeIn');
  alertClose.onclick = function () {
    alertBox.classList.remove('fadeIn');
    alertBox.classList.add('fadeOut');
    setTimeout(() => {
      alertBox.style.display = 'none';
      if (typeof callback === 'function') callback();
      else location.reload();
    }, 350);
  };
}

// Load thông tin từ localStorage
function loadUserInfo() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    customAlert("Bạn chưa đăng nhập!", () => {
      window.location.href = "login.html";
    });
    return;
  }

  document.getElementById("userName").textContent = currentUser.displayName || "Không có tên";
  document.getElementById("userEmail").textContent = currentUser.email;
  // Hiển thị email cứng trong phần quản lý tài khoản
  const emailStatic = document.getElementById("email");
  if (emailStatic) emailStatic.textContent = currentUser.email;
  document.getElementById("displayName").value = currentUser.displayName || "";
  document.getElementById("email").value = currentUser.email || "";

  updateEmailVerificationStatus();
}

// Cập nhật trạng thái xác minh
function updateEmailVerificationStatus(show = true) {
  const user = auth.currentUser;
  const statusEl = document.getElementById("verifyStatus");
  if (!statusEl) return;
  if (!show) {
    statusEl.style.display = "none";
    return;
  }
  statusEl.style.display = "inline-block";
  if (!user) {
    statusEl.textContent = "❌ Chưa xác minh";
    return;
  }
  user.reload().then(() => {
    const verified = auth.currentUser.emailVerified;
    statusEl.textContent = verified ? "✅ Đã xác minh" : "❌ Chưa xác minh";
  }).catch(() => {
    statusEl.textContent = "❌ Chưa xác minh";
  });
}

// Nút kiểm tra xác minh
document.getElementById("btnCheckVerify").addEventListener("click", function(e) {
  e.preventDefault();
  updateEmailVerificationStatus(true);
});

// Lưu thay đổi
document.getElementById("accountForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("displayName").value.trim();
  const newEmail = document.getElementById("email").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const oldPassword = document.getElementById("oldPassword") ? document.getElementById("oldPassword").value.trim() : "";
  const user = auth.currentUser;

  if (!user) {
    customAlert("Không tìm thấy người dùng!");
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser) {
    customAlert("Lỗi: không tìm thấy dữ liệu người dùng.");
    return;
  }

  if (!oldPassword && ((name && name !== user.displayName) || (newEmail && newEmail !== user.email) || (newPassword && newPassword.length >= 6))) {
    customAlert("Bạn phải nhập mật khẩu cũ để xác nhận mọi thay đổi!");
    return;
  }

  let changed = false;
  let needAuth = (name && name !== user.displayName) || (newEmail && newEmail !== user.email) || (newPassword && newPassword.length >= 6);
  let authSuccess = false;

  // Nếu có thay đổi, xác thực trước
  if (needAuth) {
    try {
      const email = user.email;
      // Kiểm tra mật khẩu cũ bằng signInWithEmailAndPassword
      await signInWithEmailAndPassword(auth, email, oldPassword);
      // Nếu sau xác thực lại mà user bị null, reload lại
      if (!auth.currentUser) {
        await auth.updateCurrentUser(user);
      }
      if (!auth.currentUser) {
        customAlert("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!");
        return;
      }
      authSuccess = true;
    } catch (error) {
      customAlert("Mật khẩu cũ không đúng hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      return;
    }
  }

  // Đổi tên
  if (name && name !== user.displayName && authSuccess) {
    await updateProfile(user, { displayName: name });
    customAlert("Đã đổi tên thành công!");
    changed = true;
  }

  // Đổi password
  if (newPassword && newPassword.length >= 6 && authSuccess) {
    // Kiểm tra mật khẩu mới phải có ký tự đặc biệt
    if (!/[!@#$%^&*(),.?":{}|<>\[\]\\/\-_+=~`]/.test(newPassword)) {
      customAlert("Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt!");
      return;
    }
    await updatePassword(user, newPassword);
    customAlert("Đã đổi mật khẩu thành công!");
    changed = true;
  }

  if (changed) {
    // Cập nhật lại localStorage
    const updatedUser = {
      uid: user.uid,
      email: user.email,
      displayName: name || user.displayName || "Không có tên",
      photoURL: user.photoURL || "",
    };
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  }
});

// Xóa tài khoản
document.getElementById("btnDelete").addEventListener("click", () => {
  const user = auth.currentUser;
  if (!user) return;
  if (confirm("Bạn có chắc muốn xóa tài khoản không?")) {
    deleteUser(user)
      .then(() => {
        localStorage.removeItem("currentUser");
        customAlert("Tài khoản đã bị xóa.", () => window.location.href = "register.html");
      })
      .catch((error) => {
        customAlert("Lỗi xóa tài khoản: " + error.message);
      });
  }
});

// Đăng xuất
document.getElementById("btn-logout").addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      localStorage.removeItem("currentUser");
      window.location.href = "login.html";
    })
    .catch((error) => {
      customAlert("Lỗi đăng xuất: " + error.message);
    });
});

window.addEventListener("DOMContentLoaded", () => {
  loadUserInfo();
  updateEmailVerificationStatus(false);
});
