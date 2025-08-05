import { db, ref, onValue, update, remove, push, set } from "./firebase.js";

function customAlert(message, callback) {
  const alertBox = document.getElementById('customAlert');
  const alertMessage = document.getElementById('customAlertMsg');
  const alertClose = document.getElementById('customAlertClose');
  if (!alertBox || !alertMessage || !alertClose) {
    console.error('Custom alert popup HTML chưa được thêm vào trang!');
    return;
  }
  alertMessage.textContent = message;
  alertBox.style.display = 'flex';
  alertBox.classList.remove('fadeOut');
  void alertBox.offsetWidth;
  alertBox.classList.add('fadeIn');
  alertClose.onclick = function() {
    alertBox.classList.remove('fadeIn');
    alertBox.classList.add('fadeOut');
    setTimeout(() => {
      alertBox.style.display = 'none';
      if (typeof callback === 'function') callback();
    }, 350);
  };
}

function customConfirm(message, onConfirm, onCancel) {
  const alertBox = document.getElementById('customConfirm');
  const alertMessage = document.getElementById('customConfirmMsg');
  if (!alertBox || !alertMessage) {
    console.error('Custom alert popup HTML chưa được thêm vào trang!');
    return;
  }
  alertMessage.innerHTML = message + '<br><div class="custom-confirm-btns"><button id="customConfirmOk">Đồng ý</button><button id="customConfirmCancel">Hủy</button></div>';
  alertBox.style.display = 'flex';
  alertBox.classList.remove('fadeOut');
  void alertBox.offsetWidth;
  alertBox.classList.add('fadeIn');
  document.getElementById('customConfirmOk').onclick = function() {
    alertBox.classList.remove('fadeIn');
    alertBox.classList.add('fadeOut');
    setTimeout(() => {
      alertBox.style.display = 'none';
      if (typeof onConfirm === 'function') onConfirm();
    }, 350);
  };
  document.getElementById('customConfirmCancel').onclick = function() {
    alertBox.classList.remove('fadeIn');
    alertBox.classList.add('fadeOut');
    setTimeout(() => {
      alertBox.style.display = 'none';
      if (typeof onCancel === 'function') onCancel();
    }, 350);
  };
}

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
  popup.classList.add("active");
}

function closePopup() {
  document.getElementById("accountPopup").style.display = "none";
}

function renderCart() {
  const user = getCurrentUser();
  const payment = document.querySelector('.block');
  const cart = document.querySelector('.cart');
  payment.innerHTML = '';
  cart.innerHTML = '';

  if (!user) {
    payment.innerHTML = '<p class="product">Bạn chưa đăng nhập!</p>';
    return;
  }

  const cartRef = ref(db, `users/${user.uid}/cart`);
  onValue(cartRef, (snapshot) => {
    const data = snapshot.val();
    payment.innerHTML = '';
    cart.innerHTML = '';

    if (!data) {
      payment.innerHTML = '<p class="product">Bạn chưa thêm món ăn nào vào giỏ hàng!</p>';
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
            <button class="minus">-</button>
            <button class="plus">+</button>
            <button class="remove"><i class="fa-solid fa-trash"></i></button>
            <p class="total-food">Tổng: ${itemTotal.toLocaleString()} VNĐ</p>
          </div>
        </div>
      `;

      // Gắn sự kiện cho từng nút
      div.querySelector('.minus').onclick = () => updateQuantity(key, -1);
      div.querySelector('.plus').onclick = () => updateQuantity(key, 1);
      div.querySelector('.remove').onclick = (event) => removeItem(key, event);

      cart.appendChild(div);
    });

    const totalDiv = document.createElement('div');
    totalDiv.classList.add('total-price');
    totalDiv.innerHTML = `
      <div class="deal">
        <h1 class="deal-title">Hóa đơn thanh toán:</h1>
        <h2 class="total">Thành tiền: ${totalPrice.toLocaleString()} VNĐ</h2>
        <div class="voucher">
          <h2 class="code">Nhập mã voucher giảm giá: <input id="codePrice" class="codeInput" type="text" placeholder="Nhập mã..."></h2>
          <h2 class="code">Nhập mã vận chuyển: <input id="codeDelivery" class="codeInput" type="text" placeholder="Nhập mã..."></h2>
        </div>
        <img class="pay-img" src="https://res.cloudinary.com/dhxabc6as/image/upload/v1753946680/e7dc5ffb-35d7-48c7-8167-484cc22a9ede.png" alt="QR">
        <button class="checkout">Đã thanh toán xong</button>
      </div>
    `;
    payment.appendChild(totalDiv);

    // Gắn xử lý voucher và thanh toán
    document.querySelector(".checkout").onclick = checkout;
    document.getElementById("codePrice").onchange = () => applyVoucher(totalPrice);
    document.getElementById("codeDelivery").onchange = () => applyVoucher(totalPrice);
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
      customAlert("Bạn đã sử dụng mã này rồi.");
      return;
    }

    // logic giảm giá
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

    switch (codeDelivery) {
      case "VHC1":
      case "VHC2": discountDelivery = shippingFee * 0.2; break;
      case "VHC3": if (totalPrice > 150000) discountDelivery = shippingFee * 0.3; break;
      case "VHC4": if (totalPrice > 200000) discountDelivery = shippingFee * 0.4; break;
      case "VHC5": if (totalPrice > 400000) discountDelivery = shippingFee * 0.5; break;
      case "VHC6": if (totalPrice > 500000) discountDelivery = shippingFee * 0.75; break;
    }

    const finalTotal = totalPrice + shippingFee - discountPrice - discountDelivery;
    document.querySelector(".total").innerHTML = `
      <p>Tạm tính: ${totalPrice.toLocaleString()} VNĐ</p>
      <p>Phí vận chuyển: ${shippingFee.toLocaleString()} VNĐ</p>
      <p>Giảm giá sản phẩm: -${discountPrice.toLocaleString()} VNĐ</p>
      <p>Giảm phí vận chuyển: -${discountDelivery.toLocaleString()} VNĐ</p>
      <strong>Tổng thanh toán: ${finalTotal.toLocaleString()} VNĐ</strong>
    `;
  }, { onlyOnce: true });
}

function updateQuantity(key, change) {
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
}

function removeItem(key, event) {
  const user = getCurrentUser();
  if (!user) return;

  if (customConfirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
    const btn = event.target.closest('.remove');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    remove(ref(db, `users/${user.uid}/cart/${key}`))
      .then(() => customAlert("Đã xóa sản phẩm!"))
      .catch(() => {
        btn.disabled = false;
        btn.innerHTML = original;
        customAlert("Xóa thất bại!");
      });
  }
}

function checkout() {
  const user = getCurrentUser();
  if (!user) return;

  const btn = document.querySelector('.checkout');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Đang xử lý...';

  const cartRef = ref(db, `users/${user.uid}/cart`);
  onValue(cartRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      customAlert("Không có gì để thanh toán!");
      btn.disabled = false;
      btn.textContent = original;
      return;
    }

    const newOrder = push(ref(db, `users/${user.uid}/purchased`));
    set(newOrder, {
      date: new Date().toLocaleString(),
      items: data,
      total: calculateTotal(data)
    }).then(() => {
      remove(cartRef).then(() => {
        customAlert("Thanh toán thành công!");
        renderCart();
      });
    }).catch(() => {
      customAlert("Lỗi khi thanh toán!");
    }).finally(() => {
      btn.disabled = false;
      btn.textContent = original;
    });
  }, { onlyOnce: true });
}

function calculateTotal(cartData) {
  return Object.values(cartData).reduce((total, item) => {
    const price = typeof item.price === "string" ? parseInt(item.price.replace(/\D/g, '')) : item.price;
    return total + price * item.quantity;
  }, 0);
}

window.addEventListener('click', function (e) {
  const popup = document.getElementById('accountPopup');
  const content = document.querySelector('.popup-content');
  if (popup.style.display === 'block' && !content.contains(e.target)) {
    closePopup();
  }
});


window.addEventListener("load", renderCart);
window.info = info;
window.closePopup = closePopup;
