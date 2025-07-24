import { db, ref, onValue, push, remove, update, set } from "./firebase.js";

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function info() {
  const popup = document.getElementById("accountPopup");
  const nameEl = document.getElementById("userName");
  const emailEl = document.getElementById("userEmail");

  const user = getCurrentUser();
  if (user) {
    nameEl.textContent = user.displayName || "Ẩn danh";
    emailEl.textContent = user.email || "Không có email";
  } else {
    nameEl.textContent = "Chưa đăng nhập";
    emailEl.textContent = "";
  }
  popup.style.display = "block";
}

function closePopup() {
  document.getElementById("accountPopup").style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("sellForm");
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Disable submit button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = "Đang gửi...";

    const name = document.getElementById("name").value.trim();
    const imageUrl = document.getElementById("imageUrl").value.trim();
    const price = parseFloat(document.getElementById("price").value);
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value.trim();
    const currentUser = getCurrentUser();

    if (!name || !imageUrl || isNaN(price) || !description || !category) {
      alert("❗ Vui lòng điền đầy đủ và hợp lệ tất cả các trường.");
      submitButton.disabled = false;
      submitButton.textContent = "Gửi yêu cầu";
      return;
    }

    try {
      // Kiểm tra kết nối Firebase
      if (!db) {
        throw new Error("Không thể kết nối đến Firebase");
      }

      const newProductRef = push(ref(db, "pendingProducts"));
      const productData = {
        name,
        imageUrl,
        price: Number(price),
        category,
        description,
        status: "pending",
        createdAt: new Date().toISOString(),
        submittedUID: currentUser?.uid || "unknown",
        submittedName: currentUser?.displayName || "Ẩn danh",
        submittedEmail: currentUser?.email || "Không có email"
      };

      await set(newProductRef, productData);
      alert("🎉 Gửi yêu cầu thành công! Món ăn sẽ được xét duyệt bởi quản trị viên.");
      form.reset();
    } catch (err) {
      console.error("❌ Lỗi:", err);
      alert(`⚠️ Có lỗi xảy ra: ${err.message || "Vui lòng thử lại sau"}`);
    } finally {
      // Reset button state
      submitButton.disabled = false;
      submitButton.textContent = "Gửi yêu cầu";
    }
  });
});

window.info = info;
window.closePopup = closePopup;
