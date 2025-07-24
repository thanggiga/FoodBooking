import { auth, db, ref, set, push, onValue, remove, update, get } from "./firebase.js";

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

// Kiểm tra xem user có phải admin không
function isAdmin(user) {
  // Kiểm tra user tồn tại và có thuộc tính isAdmin
  if (!user) return false;
  
  // Kiểm tra nhiều cách khác nhau
  if (user.isAdmin === true) return true;
  if (user.isAdmin === 'true') return true;
  if (user.role === 'admin') return true;
  if (user.admin === true) return true;
  
  return false;
}

// Hiển thị voucher từ database
function displayVouchers(vouchers) {
  const voucherContainer = document.querySelector('.voucher');
  if (!voucherContainer) return;

  voucherContainer.innerHTML = '';

  vouchers.forEach((voucher, index) => {
    const voucherElement = createVoucherElement(voucher, index);
    voucherContainer.appendChild(voucherElement);
  });
}

// Tạo element voucher
function createVoucherElement(voucher, index) {
  const voucherDiv = document.createElement('div');
  voucherDiv.className = 'voucher-demo';
  voucherDiv.onclick = () => info();

  const imageUrl = voucher.type === 'shipping' 
    ? "https://res.cloudinary.com/dhxabc6as/image/upload/v1750653064/shipping_y2qf5p.png"
    : "https://res.cloudinary.com/dhxabc6as/image/upload/v1750653064/voucher_t5v4u3.png";

  voucherDiv.innerHTML = `
    <img class="voucher-img" src="${imageUrl}" alt="voucher">
    <div class="voucher-info">
      <h2 class="name">${voucher.name}</h2>
      <p>${voucher.description}</p>
      <div class="price">
        <span>${voucher.discountText}</span> <br>
      </div>
      <h2 class="code">Mã voucher: ${voucher.code}</h2>
      ${isAdmin(getCurrentUser()) ? `
        <div class="admin-controls">
          <button onclick="editVoucher('${index}')" class="edit-btn">Sửa</button>
          <button onclick="deleteVoucher('${index}')" class="delete-btn">Xóa</button>
        </div>
      ` : ''}
    </div>
  `;

  return voucherDiv;
}

// Load vouchers từ database
function loadVouchers() {
  const vouchersRef = ref(db, 'vouchers');
  onValue(vouchersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const vouchersArray = Object.values(data);
      displayVouchers(vouchersArray);
    }
  });
}

// Thêm voucher mới (chỉ admin)
function addVoucher() {
  const user = getCurrentUser();
  if (!isAdmin(user)) {
    alert('Bạn không có quyền thêm voucher!');
    return;
  }

  const voucherType = document.getElementById('voucherType').value;
  const voucherName = document.getElementById('voucherName').value;
  const voucherDescription = document.getElementById('voucherDescription').value;
  const discountPercent = document.getElementById('discountPercent').value;
  const maxDiscount = document.getElementById('maxDiscount').value;
  const minOrder = document.getElementById('minOrder').value;
  const voucherCode = document.getElementById('voucherCode').value;

  if (!voucherName || !voucherDescription || !discountPercent || !voucherCode) {
    alert('Vui lòng điền đầy đủ thông tin!');
    return;
  }

  const discountText = voucherType === 'shipping' 
    ? `Giảm giá vận chuyển khi thanh toán ${discountPercent}% - ${maxDiscount ? `tối đa ${maxDiscount}đ` : 'không giới hạn'}`
    : `Giảm giá trực tiếp vào hóa đơn thanh toán ${discountPercent}% - ${maxDiscount ? `tối đa ${maxDiscount}đ` : 'không giới hạn'}`;

  const newVoucher = {
    type: voucherType,
    name: voucherName,
    description: voucherDescription,
    discountPercent: parseInt(discountPercent),
    maxDiscount: maxDiscount ? parseInt(maxDiscount) : null,
    minOrder: minOrder ? parseInt(minOrder) : 0,
    code: voucherCode,
    discountText: discountText,
    createdAt: Date.now()
  };

  const vouchersRef = ref(db, 'vouchers');
  push(vouchersRef, newVoucher).then(() => {
    alert('Thêm voucher thành công!');
    closeAddVoucherModal();
  }).catch((error) => {
    alert('Lỗi khi thêm voucher: ' + error.message);
  });
}

// Sửa voucher (chỉ admin)
function editVoucher(index) {
  const user = getCurrentUser();
  if (!isAdmin(user)) {
    alert('Bạn không có quyền sửa voucher!');
    return;
  }

  // Lấy danh sách voucher từ database
  const vouchersRef = ref(db, 'vouchers');
  get(vouchersRef).then((snapshot) => {
    const data = snapshot.val();
    if (data) {
      const vouchersArray = Object.values(data);
      const voucherKeys = Object.keys(data);
      
      if (vouchersArray[index]) {
        const voucher = vouchersArray[index];
        showEditVoucherModal(voucher, voucherKeys[index]);
      }
    }
  });
}

// Hiển thị modal sửa voucher
function showEditVoucherModal(voucher, voucherKey) {
  const modal = document.getElementById('editVoucherModal');
  if (!modal) return;

  document.getElementById('editVoucherType').value = voucher.type;
  document.getElementById('editVoucherName').value = voucher.name;
  document.getElementById('editVoucherDescription').value = voucher.description;
  document.getElementById('editDiscountPercent').value = voucher.discountPercent;
  document.getElementById('editMaxDiscount').value = voucher.maxDiscount || '';
  document.getElementById('editMinOrder').value = voucher.minOrder || '';
  document.getElementById('editVoucherCode').value = voucher.code;
  document.getElementById('editVoucherKey').value = voucherKey;

  modal.style.display = 'block';
}

// Cập nhật voucher
function updateVoucher() {
  const user = getCurrentUser();
  if (!isAdmin(user)) {
    alert('Bạn không có quyền sửa voucher!');
    return;
  }

  const voucherKey = document.getElementById('editVoucherKey').value;
  const voucherType = document.getElementById('editVoucherType').value;
  const voucherName = document.getElementById('editVoucherName').value;
  const voucherDescription = document.getElementById('editVoucherDescription').value;
  const discountPercent = document.getElementById('editDiscountPercent').value;
  const maxDiscount = document.getElementById('editMaxDiscount').value;
  const minOrder = document.getElementById('editMinOrder').value;
  const voucherCode = document.getElementById('editVoucherCode').value;

  if (!voucherName || !voucherDescription || !discountPercent || !voucherCode) {
    alert('Vui lòng điền đầy đủ thông tin!');
    return;
  }

  const discountText = voucherType === 'shipping' 
    ? `Giảm giá vận chuyển khi thanh toán ${discountPercent}% - ${maxDiscount ? `tối đa ${maxDiscount}đ` : 'không giới hạn'}`
    : `Giảm giá trực tiếp vào hóa đơn thanh toán ${discountPercent}% - ${maxDiscount ? `tối đa ${maxDiscount}đ` : 'không giới hạn'}`;

  const updatedVoucher = {
    type: voucherType,
    name: voucherName,
    description: voucherDescription,
    discountPercent: parseInt(discountPercent),
    maxDiscount: maxDiscount ? parseInt(maxDiscount) : null,
    minOrder: minOrder ? parseInt(minOrder) : 0,
    code: voucherCode,
    discountText: discountText,
    updatedAt: Date.now()
  };

  const voucherRef = ref(db, `vouchers/${voucherKey}`);
  update(voucherRef, updatedVoucher).then(() => {
    alert('Cập nhật voucher thành công!');
    closeEditVoucherModal();
  }).catch((error) => {
    alert('Lỗi khi cập nhật voucher: ' + error.message);
  });
}

// Xóa voucher (chỉ admin)
function deleteVoucher(index) {
  const user = getCurrentUser();
  if (!isAdmin(user)) {
    alert('Bạn không có quyền xóa voucher!');
    return;
  }

  if (!confirm('Bạn có chắc chắn muốn xóa voucher này?')) {
    return;
  }

  const vouchersRef = ref(db, 'vouchers');
  get(vouchersRef).then((snapshot) => {
    const data = snapshot.val();
    if (data) {
      const voucherKeys = Object.keys(data);
      if (voucherKeys[index]) {
        const voucherRef = ref(db, `vouchers/${voucherKeys[index]}`);
        remove(voucherRef).then(() => {
          alert('Xóa voucher thành công!');
        }).catch((error) => {
          alert('Lỗi khi xóa voucher: ' + error.message);
        });
      }
    }
  });
}

// Hiển thị modal thêm voucher
function showAddVoucherModal() {
  const user = getCurrentUser();
  if (!isAdmin(user)) {
    alert('Bạn không có quyền thêm voucher!');
    return;
  }

  const modal = document.getElementById('addVoucherModal');
  if (modal) {
    modal.style.display = 'block';
  }
}

// Đóng modal thêm voucher
function closeAddVoucherModal() {
  const modal = document.getElementById('addVoucherModal');
  if (modal) {
    modal.style.display = 'none';
    // Reset form
    document.getElementById('addVoucherForm').reset();
  }
}

// Đóng modal sửa voucher
function closeEditVoucherModal() {
  const modal = document.getElementById('editVoucherModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Khởi tạo dữ liệu voucher mặc định
function initializeDefaultVouchers() {
  const user = getCurrentUser();
  if (!isAdmin(user)) return;

  const vouchersRef = ref(db, 'vouchers');
  get(vouchersRef).then((snapshot) => {
    const data = snapshot.val();
    if (!data) {
      // Thêm voucher mặc định nếu chưa có dữ liệu
      const defaultVouchers = [
        {
          type: 'discount',
          name: 'Voucher khách hàng mới',
          description: 'Chào mừng bạn mới (hóa đơn trên 500.000vnd)',
          discountPercent: 50,
          maxDiscount: 100000,
          minOrder: 500000,
          code: 'KHM1',
          discountText: 'Giảm giá trực tiếp vào hóa đơn thanh toán 50% - tối đa 100.000vnd',
          createdAt: Date.now()
        },
        {
          type: 'shipping',
          name: 'Voucher vận chuyển',
          description: 'Chúc bạn ngon miệng (hóa đơn từ 0vnd)',
          discountPercent: 20,
          maxDiscount: null,
          minOrder: 0,
          code: 'VHC1',
          discountText: 'Giảm giá vận chuyển khi thanh toán 20% - không giới hạn',
          createdAt: Date.now()
        }
      ];

      defaultVouchers.forEach(voucher => {
        push(vouchersRef, voucher);
      });
    }
  });
}

// Khởi tạo trang
function initPage() {
  const user = getCurrentUser();
  
  // Hiển thị nút thêm voucher cho admin
  if (isAdmin(user)) {
    const addButton = document.createElement('button');
    addButton.className = 'add-voucher-btn';
    addButton.innerHTML = '<i class="fas fa-plus"></i> Thêm Voucher';
    addButton.onclick = showAddVoucherModal;
    
    const title = document.querySelector('.title-voucher');
    if (title) {
      title.parentNode.insertBefore(addButton, title.nextSibling);
    }
  }

  loadVouchers();
  initializeDefaultVouchers();
}

// Export functions để sử dụng trong HTML
window.info = info;
window.closePopup = closePopup;
window.addVoucher = addVoucher;
window.editVoucher = editVoucher;
window.deleteVoucher = deleteVoucher;
window.updateVoucher = updateVoucher;
window.showAddVoucherModal = showAddVoucherModal;
window.closeAddVoucherModal = closeAddVoucherModal;
window.closeEditVoucherModal = closeEditVoucherModal;

// Khởi tạo khi trang load xong
document.addEventListener('DOMContentLoaded', initPage);
