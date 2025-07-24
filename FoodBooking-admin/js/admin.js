import { db, ref, onValue, push, remove, update, set, get, auth } from "./firebase.js";

// Hàm kiểm tra quyền admin bằng custom claims
async function checkAdminStatus() {
    return new Promise((resolve, reject) => {
        // Lấy user hiện tại từ Firebase Auth
        const user = auth.currentUser;
        if (!user) {
            resolve(false);
            return;
        }
        // Lấy custom claims từ token
        user.getIdTokenResult(true).then((idTokenResult) => {
            if (idTokenResult.claims.admin) {
                resolve(true);
            } else {
                resolve(false);
            }
        }).catch((error) => {
            resolve(false);
        });
    });
}

// Kiểm tra quyền admin khi vào trang
async function checkAdmin() {
    // Đợi user đăng nhập xong
    const waitForAuth = () => {
        if (!auth.currentUser) {
            setTimeout(waitForAuth, 200);
            return;
        }
        checkAdminStatus().then(isAdmin => {
            if (!isAdmin) {
                alert("Bạn không có quyền truy cập trang này!");
                window.location.href = "/FoodBooking-login/login.html";
            }
        });
    };
    waitForAuth();
}

// Lấy danh sách sản phẩm chờ duyệt
function loadPendingProducts() {
    const pendingProductsRef = ref(db, "pendingProducts");
    onValue(pendingProductsRef, (snapshot) => {
        const pendingProductsDiv = document.getElementById("pendingProducts");
        pendingProductsDiv.innerHTML = "";

        if (!snapshot.exists()) {
            pendingProductsDiv.innerHTML = "<p class='no-products'>Chưa có sản phẩm nào cần duyệt</p>";
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            const productCard = createProductCard(childSnapshot.key, product);
            pendingProductsDiv.appendChild(productCard);
        });
    });
}

// Tạo card sản phẩm
function createProductCard(productId, product) {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.name}">
        <div class="product-info">
            <h2>${product.name}</h2>
            <p>${product.description}</p>
            <div class="price">${product.price.toLocaleString('vi-VN')} VNĐ</div>
            <div class="submitted-by">
                <p>Người gửi: ${product.submittedName}</p>
                <p>Email: ${product.submittedEmail}</p>
                <p>Ngày gửi: ${new Date(product.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
            <div class="action-buttons">
                <button class="approve-btn" onclick="approveProduct('${productId}')">Duyệt</button>
                <button class="reject-btn" onclick="rejectProduct('${productId}')">Từ chối</button>
            </div>
        </div>
    `;
    return card;
}

// Duyệt sản phẩm
async function approveProduct(productId) {
    try {
        // Lấy thông tin sản phẩm từ pendingProducts
        const pendingProductRef = ref(db, `pendingProducts/${productId}`);
        const productSnapshot = await get(pendingProductRef);
        const product = productSnapshot.val();

        if (!product) {
            throw new Error("Không tìm thấy sản phẩm");
        }

        const productsRef = ref(db, "products");
        const productsSnapshot = await get(productsRef);
        let maxId = 25; 
        if (productsSnapshot.exists()) {
            productsSnapshot.forEach(child => {
                const id = child.key;
                if (/^p\d+$/.test(id)) {
                    const num = parseInt(id.substring(1));
                    if (num > maxId) maxId = num;
                }
            });
        }
        const newId = `p${maxId + 1}`;

        // Thêm thông tin người bán vào sản phẩm
        const sellerInfo = {};
        if (product.submittedUID) sellerInfo.ownerID = product.submittedUID;
        if (product.submittedName) sellerInfo.sellerName = product.submittedName;
        if (product.submittedEmail) sellerInfo.sellerEmail = product.submittedEmail;

        const newProductRef = ref(db, `products/${newId}`);
        await set(newProductRef, {
            ...product,
            ...sellerInfo,
            status: "approved",
            approvedAt: new Date().toISOString(),
            id: newId
        });

        await remove(pendingProductRef);

        alert(`Đã duyệt sản phẩm thành công! ID mới: ${newId}`);
    } catch (error) {
        console.error("Lỗi khi duyệt sản phẩm:", error);
        alert("Có lỗi xảy ra khi duyệt sản phẩm. Vui lòng thử lại!");
    }
}

async function rejectProduct(productId) {
    if (confirm("Bạn có chắc chắn muốn từ chối sản phẩm này?")) {
        try {
            const pendingProductRef = ref(db, `pendingProducts/${productId}`);
            await remove(pendingProductRef);
            alert("Đã từ chối sản phẩm!");
        } catch (error) {
            console.error("Lỗi khi từ chối sản phẩm:", error);
            alert("Có lỗi xảy ra khi từ chối sản phẩm. Vui lòng thử lại!");
        }
    }
}

function info() {
    const popup = document.getElementById("accountPopup");
    const nameEl = document.getElementById("userName");
    const emailEl = document.getElementById("userEmail");

    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (user) {
        nameEl.textContent = user.displayName || "Ẩn danh";
        emailEl.textContent = user.email || "Không có email";
    } else {
        nameEl.textContent = "Chưa đăng nhập";
        emailEl.textContent = "";
    }
    popup.style.display = "block";
}

// Đóng popup
function closePopup() {
    document.getElementById("accountPopup").style.display = "none";
}

// Khởi tạo trang
document.addEventListener("DOMContentLoaded", () => {
    checkAdmin();
    loadPendingProducts();
});

// Export các hàm cần thiết
window.approveProduct = approveProduct;
window.rejectProduct = rejectProduct;
window.info = info;
window.closePopup = closePopup;
