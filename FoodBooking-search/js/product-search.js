import { db, ref, onValue, push, remove, update, set, auth } from "./firebase.js";

let allProducts = [];
let currentProductId = null;

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

function loadProducts() {
  const productsRef = ref(db, 'products');
  onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      allProducts = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
    } else {
      allProducts = [];
    }
  });
}

function displayProducts(products) {
  const container = document.getElementById('productContainer');
  container.innerHTML = '';

  if (products.length === 0) {
    container.innerHTML = '<p>Không tìm thấy sản phẩm phù hợp.</p>';
    return;
  }

  products.forEach(product => {
    const productDiv = document.createElement('div');
    productDiv.className = 'product-demo show';
    productDiv.onclick = () => showProductPopup(product.id);

    productDiv.innerHTML = `
      <img class="product-img" src="${product.imageUrl || product.image}" alt="${product.name}">
      <div class="product-info">
        <h2 class="name">${product.name}</h2>
        <p>${product.description}</p>
        <div class="price">
          <span>${product.price.toLocaleString()} VNĐ</span>
        </div>
      </div>
    `;

    container.appendChild(productDiv);
  });
}

function searchProducts(query) {
  if (!query.trim()) {
    document.getElementById('productContainer').innerHTML = '';
    return;
  }

  const filteredProducts = allProducts.filter(product =>
    product.name.toLowerCase().startsWith(query.toLowerCase()) ||
    product.description.toLowerCase().startsWith(query.toLowerCase())
  );

  displayProducts(filteredProducts);
}

function showProductPopup(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  document.getElementById("popupImage").src = product.imageUrl || product.image;
  document.getElementById("popupName").textContent = product.name;
  document.getElementById("popupPrice").textContent = product.price.toLocaleString() + " VNĐ";

  currentProductId = productId;

  loadComments(productId);

  const popup = document.getElementById("productPopup");
  const box = popup.querySelector(".popup-box");

  box.style.animation = "none";
  void box.offsetHeight;
  box.style.animation = "popupZoomIn 0.3s ease forwards";

  popup.style.display = "flex";
}

function closeProductPopup() {
  document.getElementById("productPopup").style.display = "none";
  currentProductId = null;
}

function addToBasket() {
  const user = getCurrentUser();
  if (!user || !user.uid) {
    alert("Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng!");
    return;
  }

  const product = allProducts.find(p => p.id === currentProductId);
  if (!product) return;

  const addButton = document.querySelector('.add-to-basket-btn');
  const originalText = addButton.textContent;
  addButton.disabled = true;
  addButton.textContent = 'Đang thêm...';

  const cartRef = ref(db, `users/${user.uid}/cart/${product.id}`);
  onValue(cartRef, (snapshot) => {
    const existing = snapshot.val();
    const newItem = {
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: existing?.quantity ? existing.quantity + 1 : 1
    };
    update(cartRef, newItem)
      .then(() => {
        alert("Đã thêm sản phẩm vào giỏ hàng!");
      })
      .catch(error => {
        console.error("Lỗi khi thêm vào giỏ hàng:", error);
        alert("Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng!");
      })
      .finally(() => {
        addButton.disabled = false;
        addButton.textContent = originalText;
      });
  }, { onlyOnce: true });
}

function chatWithSeller() {
  const user = getCurrentUser();
  if (!user) {
    alert("Vui lòng đăng nhập để chat với người bán!");
    return;
  }

  window.location.href = "/FoodBooking-chat/chat.html";
}

function loadComments(productId) {
  const commentsRef = ref(db, `comments/${productId}`);
  const commentsList = document.getElementById("comments-container");

  onValue(commentsRef, (snapshot) => {
    const data = snapshot.val();
    commentsList.innerHTML = '';

    if (data) {
      const comments = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })).sort((a, b) => b.timestamp - a.timestamp);

      comments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';
        commentDiv.innerHTML = `
          <div class="comment-header">
            <strong>${comment.userName}</strong>
            <span>${new Date(comment.timestamp).toLocaleString()}</span>
          </div>
          <div class="comment-content">${comment.text}</div>
        `;
        commentsList.appendChild(commentDiv);
      });
    }
  });
}

function addComment() {
  const user = getCurrentUser();
  if (!user) {
    alert("Vui lòng đăng nhập để bình luận!");
    return;
  }

  const commentText = document.getElementById("commentText").value.trim();
  if (!commentText) {
    alert("Vui lòng nhập nội dung bình luận!");
    return;
  }

  const comment = {
    text: commentText,
    userName: user.displayName || "Ẩn danh",
    userEmail: user.email,
    timestamp: Date.now()
  };

  const commentsRef = ref(db, `comments/${currentProductId}`);
  push(commentsRef, comment).then(() => {
    document.getElementById("commentText").value = '';
    alert("Đã gửi bình luận!");
  }).catch(error => {
    console.error("Lỗi khi gửi bình luận:", error);
    alert("Có lỗi xảy ra khi gửi bình luận!");
  });
}

document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.getElementById('searchInput');
  loadProducts();

  searchInput.addEventListener('input', (e) => {
    searchProducts(e.target.value);
  });

  const searchIcon = document.querySelector('.search-icon');
  if (searchIcon) {
    searchIcon.addEventListener('click', () => {
      searchProducts(searchInput.value);
    });
  }

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchProducts(searchInput.value);
    }
  });
});

window.info = info;
window.closePopup = closePopup;
window.showProductPopup = showProductPopup;
window.closeProductPopup = closeProductPopup;
window.addToBasket = addToBasket;
window.chatWithSeller = chatWithSeller;
window.addComment = addComment;
