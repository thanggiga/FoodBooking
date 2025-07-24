import { db, ref, onValue } from "./firebase.js";

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

function loadPurchased() {
  const user = getCurrentUser();
  const purchasedContainer = document.querySelector('.purchased');
  const totalAmountContainer = document.querySelector('.total-amount');

  if (!user) {
    purchasedContainer.innerHTML = "<p>Bạn chưa đăng nhập!</p>";
    totalAmountContainer.innerHTML = "";
    return;
  }

  const purchaseRef = ref(db, `users/${user.uid}/purchased`);
  onValue(purchaseRef, (snapshot) => {
    const data = snapshot.val();
    purchasedContainer.innerHTML = '';
    totalAmountContainer.innerHTML = '';

    if (!data) {
      purchasedContainer.innerHTML = "<p>Bạn chưa mua sản phẩm nào!</p>";
      return;
    }

    let totalAmount = 0;

    Object.values(data).forEach(purchase => {
      Object.values(purchase.items).forEach(item => {
        const price = typeof item.price === "string"
          ? parseInt(item.price.replace(/\D/g, ''))
          : item.price;

        const itemTotal = price * item.quantity;
        totalAmount += itemTotal;

        const div = document.createElement('div');
        div.classList.add('purchased-item');
        div.innerHTML = `
          <img src="${item.imageUrl}" alt="${item.name}">
          <h3>${item.name}</h3>
          <p>Giá: ${price.toLocaleString()} VNĐ</p>
          <p>Số lượng: ${item.quantity}</p>
          <p class="total-food">Tổng: ${itemTotal.toLocaleString()} VNĐ</p>
        `;
        purchasedContainer.appendChild(div);
      });
    });

    totalAmountContainer.innerHTML = `<h2>Tổng tiền đã mua: ${totalAmount.toLocaleString()} VNĐ</h2>`;
  });
}

window.addEventListener("load", () => loadPurchased());
window.info = info;
window.closePopup = closePopup;
