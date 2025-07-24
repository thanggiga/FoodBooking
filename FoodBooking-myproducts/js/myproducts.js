import { db, ref, onValue, remove, update, get, auth } from "./firebase.js";

let currentUser = null;
let allProducts = [];
let currentFilter = 'all';

// Hàm lấy thông tin người dùng từ localStorage
function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
}

// Kiểm tra đăng nhập
function checkLogin() {
    const user = getCurrentUser();
    if (user) {
        currentUser = user;
        loadMyProducts();
    } else {
        // Chuyển hướng về trang đăng nhập nếu chưa đăng nhập
        window.location.href = "/FoodBooking-login/login.html";
    }
}

// Kiểm tra đăng nhập khi load trang
document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
});

// Lấy sản phẩm của người dùng hiện tại
function loadMyProducts() {
    const productsRef = ref(db, "products");
    const pendingProductsRef = ref(db, "pendingProducts");
    
    Promise.all([
        get(productsRef),
        get(pendingProductsRef)
    ]).then(([productsSnap, pendingSnap]) => {
        const products = [];
        if (productsSnap.exists()) {
            productsSnap.forEach(childSnapshot => {
                const product = childSnapshot.val();
                if (product.submittedUID === currentUser.uid) {
                    products.push({
                        ...product,
                        id: childSnapshot.key,
                        status: 'approved'
                    });
                }
            });
        }
        const pendingProducts = [];
        if (pendingSnap.exists()) {
            pendingSnap.forEach(childSnapshot => {
                const product = childSnapshot.val();
                if (product.submittedUID === currentUser.uid) {
                    pendingProducts.push({
                        ...product,
                        id: childSnapshot.key,
                        status: 'pending'
                    });
                }
            });
        }
        allProducts = [...products, ...pendingProducts];
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

    // Hiển thị thông báo nếu không có sản phẩm
    const noProductsDiv = document.getElementById('noProducts');
    const productsGrid = document.getElementById('myProductsGrid');
    
    if (total === 0) {
        noProductsDiv.style.display = 'block';
        productsGrid.style.display = 'none';
        
        // Cập nhật nội dung thông báo
        const noProductsTitle = noProductsDiv.querySelector('h3');
        const noProductsDesc = noProductsDiv.querySelector('p');
        
        noProductsTitle.textContent = 'Bạn chưa đăng bán sản phẩm nào';
        noProductsDesc.textContent = 'Hãy bắt đầu đăng bán sản phẩm đầu tiên của bạn để quản lý tại đây!';
    } else {
        noProductsDiv.style.display = 'none';
        productsGrid.style.display = 'grid';
    }
}

// Hiển thị sản phẩm
function displayProducts() {
    const productsGrid = document.getElementById('myProductsGrid');
    productsGrid.innerHTML = '';

    const filteredProducts = filterProductsByStatus(allProducts, currentFilter);

    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Lọc sản phẩm theo trạng thái
function filterProductsByStatus(products, filter) {
    switch (filter) {
        case 'approved':
            return products.filter(p => p.status === 'approved');
        case 'pending':
            return products.filter(p => p.status === 'pending');
        default:
            return products;
    }
}

// Tạo card sản phẩm
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const statusClass = product.status === 'approved' ? 'status-approved' : 'status-pending';
    const statusText = product.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt';
    
    card.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Không+có+ảnh'">
        <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-price">${product.price.toLocaleString('vi-VN')} VNĐ</div>
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

// Lọc sản phẩm
window.filterProducts = function(filter) {
    currentFilter = filter;
    
    // Cập nhật active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayProducts();
}

// Chỉnh sửa sản phẩm
window.editProduct = function(productId, status) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    // Điền thông tin vào form
    document.getElementById('editProductId').value = productId;
    document.getElementById('editName').value = product.name;
    document.getElementById('editImageUrl').value = product.imageUrl;
    document.getElementById('editPrice').value = product.price;
    document.getElementById('editCategory').value = product.category;
    document.getElementById('editDescription').value = product.description;

    // Hiển thị popup
    document.getElementById('editProductPopup').style.display = 'block';
}

// Xóa sản phẩm
window.deleteProduct = function(productId, status) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    const node = status === 'approved' ? 'products' : 'pendingProducts';
    const productRef = ref(db, `${node}/${productId}`);

    remove(productRef)
        .then(() => {
            alert('Đã xóa sản phẩm thành công!');
        })
        .catch((error) => {
            console.error('Lỗi khi xóa sản phẩm:', error);
            alert('Có lỗi xảy ra khi xóa sản phẩm. Vui lòng thử lại!');
        });
}

// Đóng popup chỉnh sửa
window.closeEditPopup = function() {
    document.getElementById('editProductPopup').style.display = 'none';
}

// Lưu thay đổi sản phẩm
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
        const productRef = ref(db, `${node}/${productId}`);
        
        await update(productRef, updatedData);
        
        alert('Cập nhật sản phẩm thành công!');
        closeEditPopup();
    } catch (error) {
        console.error('Lỗi khi cập nhật sản phẩm:', error);
        alert('Có lỗi xảy ra khi cập nhật sản phẩm. Vui lòng thử lại!');
    }
});

// Thông tin tài khoản
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
}

// Đóng popup thông tin tài khoản
window.closePopup = function() {
    document.getElementById("accountPopup").style.display = "none";
}

// Đóng popup khi click bên ngoài
window.onclick = function(event) {
    const accountPopup = document.getElementById("accountPopup");
    const editPopup = document.getElementById("editProductPopup");
    
    if (event.target === accountPopup) {
        accountPopup.style.display = "none";
    }
    if (event.target === editPopup) {
        editPopup.style.display = "none";
    }
} 