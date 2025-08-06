import { db, ref, onValue, push, remove, update, set, get, auth } from "./firebase.js";

// Hàm kiểm tra quyền admin bằng custom claims
async function checkAdminStatus() {
    return new Promise((resolve) => {
        const user = auth.currentUser;
        if (!user) {
            resolve(false);
            return;
        }
        user.getIdTokenResult(true).then((idTokenResult) => {
            resolve(!!idTokenResult.claims.admin);
        }).catch(() => resolve(false));
    });
}

// Kiểm tra quyền admin khi vào trang
async function checkAdmin() {
    const waitForAuth = () => {
        if (!auth.currentUser) {
            setTimeout(waitForAuth, 200);
            return;
        }
        checkAdminStatus().then(isAdmin => {
            if (!isAdmin) {
                alert("Bạn không có quyền truy cập trang này!");
                window.location.href = "login.html";
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

    const submittedDate = product.createdAt
        ? new Date(product.createdAt).toLocaleDateString('vi-VN')
        : "Không rõ";

    card.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.name}">
        <div class="product-info">
            <h2>${product.name}</h2>
            <p>${product.description}</p>
            <div class="price">${Number(product.price).toLocaleString('vi-VN')} VNĐ</div>
            <div class="submitted-by">
                <p><strong>Người gửi:</strong> ${product.submittedName || product.ownerName || "Ẩn danh"}</p>
                <p><strong>Email:</strong> ${product.submittedEmail || product.ownerEmail || "Không có"}</p>
                <p><strong>Ngày gửi:</strong> ${submittedDate}</p>
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
        const pendingProductRef = ref(db, `pendingProducts/${productId}`);
        const productSnapshot = await get(pendingProductRef);
        const product = productSnapshot.val();

        if (!product) {
            customAlert("Sản phẩm không tồn tại hoặc đã bị xoá.");
            return;
        }

        // Lấy ID sản phẩm kế tiếp dựa trên p26 trở đi
        const productsRef = ref(db, "products");
        const productsSnapshot = await get(productsRef);
        let maxId = 25;
        if (productsSnapshot.exists()) {
            productsSnapshot.forEach(child => {
                const id = child.key;
                if (/^p\d+$/.test(id)) {
                    const num = parseInt(id.slice(1));
                    if (num > maxId) maxId = num;
                }
            });
        }
        const newId = `p${maxId + 1}`;

        // Gắn thông tin người đăng chuẩn
        const finalProduct = {
            ...product,
            id: newId,
            status: "approved",
            approvedAt: new Date().toISOString(),
            ownerID: product.submittedUID || product.ownerID || "",
            ownerName: product.submittedName || product.ownerName || "Ẩn danh",
            ownerEmail: product.submittedEmail || product.ownerEmail || "Không rõ"
        };

        await set(ref(db, `products/${newId}`), finalProduct);
        await remove(pendingProductRef);

        customAlert(`✅ Đã duyệt sản phẩm thành công! Mã sản phẩm: ${newId}`);
    } catch (error) {
        console.error("Lỗi khi duyệt sản phẩm:", error);
        customAlert("❌ Có lỗi xảy ra khi duyệt sản phẩm.");
    }
}

// Từ chối sản phẩm
async function rejectProduct(productId) {
    if (confirm("Bạn có chắc chắn muốn từ chối sản phẩm này?")) {
        try {
            const pendingProductRef = ref(db, `pendingProducts/${productId}`);
            await remove(pendingProductRef);
            customAlert("❌ Đã từ chối và xoá sản phẩm.");
        } catch (error) {
            console.error("Lỗi từ chối sản phẩm:", error);
            customAlert("⚠️ Có lỗi xảy ra khi từ chối sản phẩm.");
        }
    }
}

// Hiển thị thông tin tài khoản
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
    const btnAcc = document.getElementById("btnAcc");
    if (btnAcc) {
        btnAcc.addEventListener("click", info);
    }
});

// Gắn hàm vào window để gọi từ HTML
window.approveProduct = approveProduct;
window.rejectProduct = rejectProduct;
window.info = info;
window.closePopup = closePopup;
window.closePopup = closePopup;

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
