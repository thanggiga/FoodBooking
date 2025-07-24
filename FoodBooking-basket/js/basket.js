import { db, ref, onValue, update, remove, push, set } from "./firebase.js";

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

function renderCart() {
  const user = getCurrentUser();
  const cartContainer = document.querySelector('.block');
  cartContainer.innerHTML = '';

  if (!user) {
    cartContainer.innerHTML = '<p class="product">Bạn chưa đăng nhập!</p>';
    return;
  }

  const cartRef = ref(db, `users/${user.uid}/cart`);
  onValue(cartRef, (snapshot) => {
    const data = snapshot.val();
    cartContainer.innerHTML = '';

    if (!data) {
      cartContainer.innerHTML = '<p class="product">Bạn chưa thêm món ăn nào vào giỏ hàng!</p>';
      return;
    }

    let totalPrice = 0;

    Object.entries(data).forEach(([key, item]) => {
      const price = typeof item.price === "string" ? parseInt(item.price.replace(/\D/g, '')) : item.price;
      const itemTotal = price * item.quantity;
      totalPrice += itemTotal;

      const div = document.createElement('div');
      div.classList.add('food-item');
      div.innerHTML = `
        <div class="product-demo">
          <img src="${item.imageUrl}" alt="${item.name}" class="product-img">
          <div class="food">
            <h3>${item.name}</h3>
            <p>Giá: ${price.toLocaleString()} VNĐ</p>
            <p>Số lượng: ${item.quantity}</p>
            <button class="minus" onclick="updateQuantity('${key}', -1)">-</button>
            <button class="plus" onclick="updateQuantity('${key}', 1)">+</button>
            <button class="remove" onclick="removeItem('${key}')"><i class="fa-solid fa-trash"></i></button>
            <p class="total-food">Tổng: ${itemTotal.toLocaleString()} VNĐ</p>
          </div>
        </div>
      `;
      cartContainer.appendChild(div);
    });

    // Thêm khối tổng và voucher
    const totalDiv = document.createElement('div');
    totalDiv.classList.add('total-price');
    totalDiv.innerHTML = `
      <div class="deal">
        <h1 class="deal-title">Hóa đơn thanh toán:</h1>
        <h2 class="total">Thành tiền: ${totalPrice.toLocaleString()} VNĐ</h2>
        <div class="voucher">
          <h2>Nhập mã voucher giảm giá: <input id="codePrice" class="codeInput" type="text" placeholder="Nhập mã..."></h2>
          <h2>Nhập mã vận chuyển: <input id="codeDelivery" class="codeInput" type="text" placeholder="Nhập mã..."></h2>
        </div>
        <button class="checkout" onclick="checkout()">Thanh toán ngay</button>
      </div>
    `;
    cartContainer.appendChild(totalDiv);

    // Gắn xử lý voucher
    document.getElementById("codePrice").addEventListener("change", () => applyVoucher(totalPrice));
    document.getElementById("codeDelivery").addEventListener("change", () => applyVoucher(totalPrice));
  });
}

function applyVoucher(totalPrice) {
  const user = getCurrentUser();
  if (!user) return;

  const codePrice = document.getElementById("codePrice").value.trim().toUpperCase();
  const codeDelivery = document.getElementById("codeDelivery").value.trim().toUpperCase();
  const hour = new Date().getHours();
  const shippingFee = 30000;
  let discountPrice = 0;
  let discountDelivery = 0;

  const usedVoucherRef = ref(db, `users/${user.uid}/usedVouchers/${codePrice}`);
  onValue(usedVoucherRef, (snapshot) => {
    if (snapshot.exists()) {
      alert("Bạn đã sử dụng mã này rồi.");
      return;
    }

    // Giảm giá sản phẩm
    switch (codePrice) {
      case "KHM1": if (totalPrice > 500000) discountPrice = 100000; break;
      case "KHM2": if (totalPrice > 300000) discountPrice = 70000; break;
      case "KHM3": if (totalPrice > 200000) discountPrice = totalPrice * 0.2; break;
      case "KHM4": if (totalPrice > 100000) discountPrice = totalPrice * 0.15; break;
      case "KHM5": if (totalPrice > 50000) discountPrice = totalPrice * 0.1; break;
      case "VTKG1": if (hour >= 8 && hour < 10 && totalPrice > 50000) discountPrice = Math.min(totalPrice * 0.1, 10000); break;
      case "VTKG2": if (hour >= 10 && hour < 12 && totalPrice > 60000) discountPrice = Math.min(totalPrice * 0.25, 25000); break;
      case "VTKG3": if ((hour === 12 || hour === 13) && totalPrice > 100000) discountPrice = Math.min(totalPrice * 0.3, 30000); break;
      case "VTKG4": if (hour >= 14 && hour < 16 && totalPrice > 50000) discountPrice = Math.min(totalPrice * 0.2, 10000); break;
      case "VTKG5": if (hour >= 16 && hour < 20 && totalPrice > 100000) discountPrice = Math.min(totalPrice * 0.3, 40000); break;
      case "VHC1":
      case "VHC2": discountPrice = totalPrice * 0.2; break;
      case "VHC3": if (totalPrice > 150000) discountPrice = totalPrice * 0.3; break;
      case "VHC4": if (totalPrice > 200000) discountPrice = totalPrice * 0.4; break;
      case "VHC5": if (totalPrice > 400000) discountPrice = totalPrice * 0.5; break;
      case "VHC6": if (totalPrice > 500000) discountPrice = totalPrice * 0.75; break;
    }

    // Giảm phí vận chuyển
    switch (codeDelivery) {
      case "VHC1":
      case "VHC2": discountDelivery = shippingFee * 0.2; break;
      case "VHC3": if (totalPrice > 150000) discountDelivery = shippingFee * 0.3; break;
      case "VHC4": if (totalPrice > 200000) discountDelivery = shippingFee * 0.4; break;
      case "VHC5": if (totalPrice > 400000) discountDelivery = shippingFee * 0.5; break;
      case "VHC6": if (totalPrice > 500000) discountDelivery = shippingFee * 0.75; break;
    }

    const totalDiscount = discountPrice + discountDelivery;
    const finalTotal = totalPrice + shippingFee - totalDiscount;

    document.querySelector(".total").innerHTML = `
      <p>Tạm tính: ${totalPrice.toLocaleString()} VNĐ</p>
      <p>Phí vận chuyển: ${shippingFee.toLocaleString()} VNĐ</p>
      <p>Giảm giá sản phẩm: -${discountPrice.toLocaleString()} VNĐ</p>
      <p>Giảm phí vận chuyển: -${discountDelivery.toLocaleString()} VNĐ</p>
      <strong>Tổng thanh toán: ${finalTotal.toLocaleString()} VNĐ</strong>
    `;
  }, { onlyOnce: true });
}

window.updateQuantity = function (key, change) {
  const user = getCurrentUser();
  if (!user) return;

  const quantityRef = ref(db, `users/${user.uid}/cart/${key}/quantity`);
  onValue(quantityRef, (snapshot) => {
    let quantity = snapshot.val() + change;
    if (quantity < 1) {
      removeItem(key);
    } else {
      update(ref(db, `users/${user.uid}/cart/${key}`), { quantity });
    }
  }, { onlyOnce: true });
};

window.removeItem = function (key) {
  const user = getCurrentUser();
  if (!user) return;

  if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
    const removeButton = event.target.closest('.remove');
    const originalHTML = removeButton.innerHTML;
    removeButton.disabled = true;
    removeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    remove(ref(db, `users/${user.uid}/cart/${key}`))
      .then(() => {
        alert("Đã xóa sản phẩm khỏi giỏ hàng!");
      })
      .catch(error => {
        console.error("Lỗi khi xóa sản phẩm:", error);
        alert("Có lỗi xảy ra khi xóa sản phẩm!");
        removeButton.disabled = false;
        removeButton.innerHTML = originalHTML;
      });
  }
};

window.checkout = function () {
  const user = getCurrentUser();
  if (!user) return;

  const checkoutButton = document.querySelector('.checkout');
  const originalText = checkoutButton.textContent;
  checkoutButton.disabled = true;
  checkoutButton.textContent = 'Đang xử lý...';

  const cartRef = ref(db, `users/${user.uid}/cart`);
  onValue(cartRef, (snapshot) => {
    const cartData = snapshot.val();
    if (!cartData) {
      alert("Không có sản phẩm nào để thanh toán!");
      checkoutButton.disabled = false;
      checkoutButton.textContent = originalText;
      return;
    }

    const purchaseRef = ref(db, `users/${user.uid}/purchased`);
    const newPurchase = push(purchaseRef);
    set(newPurchase, {
      date: new Date().toLocaleString(),
      items: cartData,
      total: calculateTotal(cartData)
    })
      .then(() => {
        remove(cartRef)
          .then(() => {
            alert("Thanh toán thành công!");
            renderCart();
          })
          .catch(error => {
            console.error("Lỗi khi xóa giỏ hàng:", error);
            alert("Có lỗi xảy ra khi xóa giỏ hàng!");
          });
      })
      .catch(error => {
        console.error("Lỗi khi thanh toán:", error);
        alert("Có lỗi xảy ra khi thanh toán!");
      })
      .finally(() => {
        checkoutButton.disabled = false;
        checkoutButton.textContent = originalText;
      });
  }, { onlyOnce: true });
};

function calculateTotal(cartData) {
  return Object.values(cartData).reduce((total, item) => {
    const price = typeof item.price === "string" ? parseInt(item.price.replace(/\D/g, '')) : item.price;
    return total + (price * item.quantity);
  }, 0);
}

window.addEventListener("load", () => renderCart());
window.info = info;
window.closePopup = closePopup;
