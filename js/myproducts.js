import { db, ref, onValue, remove, update, get, auth } from "./firebase.js";

let currentUser = null;
let allProducts = [];
let currentFilter = 'all';

function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
}

// Kiểm tra đăng nhập khi load trang
document.addEventListener("DOMContentLoaded", () => {
    checkLogin();

    const accPopup = document.getElementById("accountPopup");
    if (accPopup) {
        accPopup.addEventListener("mousedown", function(e) {
            if (e.target === accPopup) {
                closePopup();
            }
        });
    }
    const btnAcc = document.getElementById("btnAcc");
    if (btnAcc) {
        btnAcc.addEventListener("click", info);
    }
});

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
function checkLogin() {
    const user = getCurrentUser();
    if (user) {
        currentUser = user;
        loadMyProducts();
    } else {
        window.location.href = "login.html";
    }
}

// Lấy sản phẩm của người dùng hiện tại
function loadMyProducts() {
    const productsRef = ref(db, "products");
    const pendingRef = ref(db, "pendingProducts");

    Promise.all([get(productsRef), get(pendingRef)]).then(([prodSnap, pendSnap]) => {
        const products = [];
        const pendings = [];

        if (prodSnap.exists()) {
            prodSnap.forEach(child => {
                const data = child.val();
                if (data.ownerID === currentUser.uid) {
                    products.push({
                        ...data,
                        id: child.key,
                        status: 'approved'
                    });
                }
            });
        }

        if (pendSnap.exists()) {
            pendSnap.forEach(child => {
                const data = child.val();
                if (data.ownerID === currentUser.uid || data.submittedUID === currentUser.uid) {
                    pendings.push({
                        ...data,
                        id: child.key,
                        status: 'pending'
                    });
                }
            });
        }

        allProducts = [...products, ...pendings];
        updateStats();
        displayProducts();
    });
}

// Cập nhật thống kê
function updateStats() {
    const total = allProducts.length;
    const approved = allProducts.filter(p => p.status === 'approved').length;
    const pending = allProducts.filter(p => p.status === 'pending').length;

    document.getElementById('totalProducts').textContent = total;
    document.getElementById('approvedProducts').textContent = approved;
    document.getElementById('pendingProducts').textContent = pending;

    const noProductsDiv = document.getElementById('noProducts');
    const productsGrid = document.getElementById('myProductsGrid');

    if (total === 0) {
        noProductsDiv.style.display = 'block';
        productsGrid.style.display = 'none';
        noProductsDiv.querySelector('h3').textContent = 'Bạn chưa đăng bán sản phẩm nào';
        noProductsDiv.querySelector('p').textContent = 'Hãy bắt đầu đăng bán sản phẩm đầu tiên của bạn để quản lý tại đây!';
    } else {
        noProductsDiv.style.display = 'none';
        productsGrid.style.display = 'grid';
    }
}

// Hiển thị sản phẩm
function displayProducts() {
    const productsGrid = document.getElementById('myProductsGrid');
    productsGrid.innerHTML = '';

    const filtered = filterProductsByStatus(allProducts, currentFilter);
    filtered.forEach(product => {
        const card = createProductCard(product);
        productsGrid.appendChild(card);
    });
}

function filterProductsByStatus(products, filter) {
    if (filter === 'approved') return products.filter(p => p.status === 'approved');
    if (filter === 'pending') return products.filter(p => p.status === 'pending');
    return products;
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const statusClass = product.status === 'approved' ? 'status-approved' : 'status-pending';
    const statusText = product.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt';

    card.innerHTML = `
        <img src="${product.imageUrl || 'https://via.placeholder.com/300x200?text=Không+có+ảnh'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Không+có+ảnh'">
        <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.description || ""}</p>
            <div class="product-price">${Number(product.price || 0).toLocaleString('vi-VN')} VNĐ</div>
            <div class="product-status ${statusClass}">${statusText}</div>
            <div class="product-actions">
                <button class="edit-btn" onclick="editProduct('${product.id}', '${product.status}')">
                    <i class='bx bx-edit-alt'></i> Sửa
                </button>
                <button class="delete-btn" onclick="deleteProduct('${product.id}', '${product.status}')">
                    <i class='bx bx-trash'></i> Xóa
                </button>
            </div>
        </div>
    `;

    return card;
}

// Lọc theo trạng thái
window.filterProducts = function(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    displayProducts();
};

// Chỉnh sửa
window.editProduct = function(productId, status) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('editProductId').value = productId;
    document.getElementById('editName').value = product.name;
    document.getElementById('editImageUrl').value = product.imageUrl;
    document.getElementById('editPrice').value = product.price;
    document.getElementById('editCategory').value = product.category;
    document.getElementById('editDescription').value = product.description;

    document.getElementById('editProductPopup').style.display = 'block';
};

// Xóa
window.deleteProduct = function(productId, status) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    const node = status === 'approved' ? 'products' : 'pendingProducts';
    remove(ref(db, `${node}/${productId}`))
        .then(() => {
            customAlert('Đã xóa sản phẩm thành công!', loadMyProducts);
        })
        .catch((err) => {
            console.error('Lỗi khi xóa sản phẩm:', err);
            customAlert('Có lỗi xảy ra khi xóa sản phẩm!');
        });
};

window.closeEditPopup = function () {
    document.getElementById('editProductPopup').style.display = 'none';
};

// Lưu thay đổi
document.getElementById('editProductForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const productId = document.getElementById('editProductId').value;
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const updatedData = {
        name: document.getElementById('editName').value,
        imageUrl: document.getElementById('editImageUrl').value,
        price: Number(document.getElementById('editPrice').value),
        category: document.getElementById('editCategory').value,
        description: document.getElementById('editDescription').value,
        updatedAt: new Date().toISOString()
    };

    try {
        const node = product.status === 'approved' ? 'products' : 'pendingProducts';
        await update(ref(db, `${node}/${productId}`), updatedData);
        customAlert('Cập nhật sản phẩm thành công!', () => {
            closeEditPopup();
            loadMyProducts();
        });
    } catch (err) {
        console.error('Lỗi cập nhật:', err);
        customAlert('Có lỗi xảy ra khi cập nhật!');
    }
});

// Tài khoản
window.info = function() {
    const popup = document.getElementById("accountPopup");
    const nameEl = document.getElementById("userName");
    const emailEl = document.getElementById("userEmail");

    const user = getCurrentUser();
    if (user) {
        nameEl.textContent = user.displayName || user.name || "Ẩn danh";
        emailEl.textContent = user.email || "Không có email";
    } else {
        nameEl.textContent = "Chưa đăng nhập";
        emailEl.textContent = "";
    }
    popup.style.display = "block";
};

window.closePopup = function() {
    document.getElementById("accountPopup").style.display = "none";
};

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
