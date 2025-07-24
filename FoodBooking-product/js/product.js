import { db, ref, onValue, push, remove, update, set, auth } from "./firebase.js";

let allProducts = [];
let currentProductId = null;
let currentFilter = 'all';

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

function renderProducts(products) {
  const container = document.getElementById("productContainer");
  container.innerHTML = "";

  // Lọc sản phẩm theo filter hiện tại
  const filteredProducts = filterProductsByCategory(products, currentFilter);

  filteredProducts.forEach((product, index) => {
    const productDiv = document.createElement("div");
    productDiv.className = "product-demo";
    productDiv.dataset.id = product.id;

    if ((index + 1) % 5 === 0) {
      productDiv.style.marginRight = "-17px";
    }

    productDiv.innerHTML = `
      <img class="product-img" src="${product.imageUrl}" alt="${product.name}" onerror="this.src='pic/error-image.png'">
      <div class="product-info">
        <h2 class="name">${product.name}</h2>
        <p>${product.description}</p>
        <div class="price">
          <span>${product.price.toLocaleString()} VNĐ</span><br>
        </div>
        <div class="category-badge">
          <span class="category-${product.category || 'food'}">${getCategoryName(product.category || 'food')}</span>
        </div>
      </div>
    `;
    container.appendChild(productDiv);
  });
}

// Hàm lọc sản phẩm theo danh mục
function filterProductsByCategory(products, filter) {
  if (filter === 'all') {
    return products;
  }
  return products.filter(product => product.category === filter);
}

// Hàm lấy tên danh mục
function getCategoryName(category) {
  const categoryNames = {
    'food': 'Đồ ăn',
    'drink': 'Đồ uống',
    'dessert': 'Tráng miệng'
  };
  return categoryNames[category] || 'Đồ ăn';
}

// Hàm filter sản phẩm (global function)
window.filterProducts = function(filter) {
  currentFilter = filter;
  
  // Cập nhật active tab
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Render lại sản phẩm
  renderProducts(allProducts);
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("productContainer");
  container.addEventListener("click", function (event) {
    const productEl = event.target.closest(".product-demo");
    if (productEl) {
      const productId = productEl.dataset.id;
      infoById(productId);
    }
  });

  // Kiểm tra quyền admin để ẩn/hiện nút quản lý sản phẩm
  checkAndToggleAdminButton();
});

const productRef = ref(db, "products");
onValue(productRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  allProducts = Object.entries(data).map(([id, product]) => ({
    id,
    ...product,
    category: product.category || 'food'
  }));
  renderProducts(allProducts);
});

function infoById(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  document.getElementById("popupImage").src = product.imageUrl;
  document.getElementById("popupName").textContent = product.name;
  document.getElementById("popupPrice").textContent = product.price.toLocaleString() + " VNĐ";

  // Thêm thông tin category vào popup
  const categoryName = getCategoryName(product.category || 'food');
  const categoryElement = document.querySelector('.popup-right p:nth-child(3)');
  if (categoryElement) {
    categoryElement.innerHTML = `<strong>Danh mục:</strong> ${categoryName}`;
  }

  currentProductId = productId;
  loadComments(productId);

  document.getElementById("productPopup").style.display = "flex";
}

function closeProductPopup() {
  const popup = document.getElementById("productPopup");
  const box = popup.querySelector(".popup-box");

  box.style.animation = "popupZoomOut 0.3s ease forwards";
  setTimeout(() => {
    popup.style.display = "none";
    box.style.animation = "";
  }, 300);
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

document.getElementById("submit-comment").addEventListener("click", () => {
  const input = document.getElementById("comment-input");
  const commentText = input.value.trim();

  if (!commentText || !currentProductId) return;

  const user = getCurrentUser();
  if (!user) {
    alert("Vui lòng đăng nhập để bình luận!");
    return;
  }

  const commentRef = ref(db, `comments/${currentProductId}`);
  push(commentRef, {
    userName: user.displayName || "Ẩn danh",
    userId: user.uid,
    commentText,
    createdAt: new Date().toISOString()
  });

  input.value = "";
});

function loadComments(productId) {
  const container = document.getElementById("comments-container");
  container.innerHTML = "Đang tải bình luận...";
  const currentUser = getCurrentUser();

  const commentRef = ref(db, `comments/${productId}`);
  onValue(commentRef, (snapshot) => {
    const data = snapshot.val();
    container.innerHTML = "";

    if (!data) {
      container.innerHTML = "<p>Chưa có bình luận nào.</p>";
      return;
    }

    Object.entries(data).forEach(([key, comment]) => {
      const div = document.createElement("div");
      div.className = "comment";
      const isOwner = currentUser?.uid === comment.userId;

      div.innerHTML = `
        <strong>${comment.userName}:</strong><br>
        <span>${comment.commentText}</span>
        <div class="comment-footer">
          <div class="comment-actions">
            ${isOwner ? `
              <button onclick="editComment('${key}')">Sửa</button>
              <button onclick="deleteComment('${key}')">Xóa</button>
            ` : ""}
          </div>
          <div class="emoji-bar">
            ${renderReactionButtons(productId, key, comment.reactions || {}, false)}
          </div>
        </div>
      `;

      const replyBox = document.createElement("div");
      replyBox.className = "reply-box";
      replyBox.innerHTML = `
        <div class="reply-list" id="replies-${key}">Đang tải phản hồi...</div>
        <div class="reply-input">
          <input type="text" placeholder="Viết phản hồi..." id="reply-input-${key}" />
          <button onclick="submitReply('${productId}', '${key}')">Gửi</button>
        </div>
      `;
      div.appendChild(replyBox);

      container.appendChild(div);
      loadReplies(productId, key);
    });
  });
}

function renderReactionButtons(productId, parentId, reactions, isReply = false, replyId = "") {
  const emojis = ["❤️", "😂", "👍", "😡", "😭"];
  return emojis.map(emoji => {
    const count = reactions[emoji]?.count || 0;
    const handler = isReply
      ? `reactToReply('${productId}', '${parentId}', '${replyId}', '${emoji}')`
      : `reactToComment('${productId}', '${parentId}', '${emoji}')`;
    return `
      <button onclick="${handler}">
        ${emoji} ${count > 0 ? `<span class="emoji-count">${count}</span>` : ""}
      </button>
    `;
  }).join("");
}

window.reactToComment = function (productId, commentId, emoji) {
  handleReaction(`comments/${productId}/${commentId}/reactions/${emoji}`);
};

window.reactToReply = function (productId, commentId, replyId, emoji) {
  handleReaction(`comments/${productId}/${commentId}/replies/${replyId}/reactions/${emoji}`);
};

function handleReaction(basePath) {
  const user = getCurrentUser();
  if (!user || !user.uid) {
    alert("Vui lòng đăng nhập để thả cảm xúc!");
    return;
  }

  const userRef = ref(db, `${basePath}/users/${user.uid}`);
  const countRef = ref(db, `${basePath}/count`);

  onValue(userRef, (snapshot) => {
    const hasReacted = snapshot.exists();

    if (hasReacted) {
      remove(userRef);
      onValue(countRef, (snap) => {
        const current = snap.val() || 1;
        update(ref(db, basePath), { count: Math.max(current - 1, 0) });
      }, { onlyOnce: true });
    } else {
      set(userRef, true);
      onValue(countRef, (snap) => {
        const current = snap.val() || 0;
        update(ref(db, basePath), { count: current + 1 });
      }, { onlyOnce: true });
    }
  }, { onlyOnce: true });
}

window.submitReply = function (productId, commentId) {
  const input = document.getElementById(`reply-input-${commentId}`);
  const text = input.value.trim();
  const user = getCurrentUser();
  if (!user) {
    alert("Vui lòng đăng nhập để phản hồi!");
    return;
  }
  if (!text) return;

  const replyRef = ref(db, `comments/${productId}/${commentId}/replies`);
  push(replyRef, {
    userName: user.displayName || "Ẩn danh",
    userId: user.uid,
    replyText: text,
    createdAt: new Date().toISOString()
  });

  input.value = "";
};

function loadReplies(productId, commentId) {
  const container = document.getElementById(`replies-${commentId}`);
  const replyRef = ref(db, `comments/${productId}/${commentId}/replies`);
  const currentUser = getCurrentUser();

  onValue(replyRef, (snapshot) => {
    const data = snapshot.val();
    container.innerHTML = "";

    if (!data) {
      container.innerHTML = "<p class='no-replies'>Chưa có phản hồi nào.</p>";
      return;
    }

    Object.entries(data).forEach(([key, reply]) => {
      const isOwner = currentUser?.uid === reply.userId;
      const div = document.createElement("div");
      div.className = "reply";
      div.innerHTML = `
        <strong>${reply.userName}:</strong> ${reply.replyText}
        <div class="comment-footer">
          <div class="comment-actions">
            ${isOwner ? `
              <button onclick="editReply('${productId}', '${commentId}', '${key}')">Sửa</button>
              <button onclick="deleteReply('${productId}', '${commentId}', '${key}')">Xóa</button>
            ` : ""}
          </div>
          <div class="emoji-bar">
            ${renderReactionButtons(productId, commentId, reply.reactions || {}, true, key)}
          </div>
        </div>
      `;
      container.appendChild(div);
    });
  });
}

window.editComment = function (commentId) {
  const newText = prompt("Nhập nội dung mới:");
  if (!newText) return;
  update(ref(db, `comments/${currentProductId}/${commentId}`), {
    commentText: newText,
    editedAt: new Date().toISOString()
  });
};

window.deleteComment = function (commentId) {
  if (confirm("Bạn có chắc muốn xóa bình luận này?")) {
    remove(ref(db, `comments/${currentProductId}/${commentId}`));
  }
};

window.editReply = function (productId, commentId, replyId) {
  const newText = prompt("Nhập nội dung mới:");
  if (!newText) return;
  update(ref(db, `comments/${productId}/${commentId}/replies/${replyId}`), {
    replyText: newText,
    editedAt: new Date().toISOString()
  });
};

window.deleteReply = function (productId, commentId, replyId) {
  if (confirm("Bạn có chắc muốn xóa phản hồi này?")) {
    remove(ref(db, `comments/${productId}/${commentId}/replies/${replyId}`));
  }
};

// chat với người bán
function chatWithSeller() {
  const user = getCurrentUser();
  if (!user || !user.uid) {
    alert("Bạn cần đăng nhập để chat với người bán!");
    window.location.href = "/FoodBooking-login/login.html";
    return;
  }
  const product = allProducts.find(p => p.id === currentProductId);
  if (!product) {
    alert("Không tìm thấy sản phẩm!");
    return;
  }

  const sellerId = product.ownerID;
  const sellerName = product.sellerName || "Người bán";
  const sellerEmail = product.sellerEmail || "";
  if (!sellerId || !sellerName) {
    alert("Sản phẩm này chưa có đủ thông tin người bán để chat!");
    return;
  }
  const productId = product.id;
  const productName = product.name;
  const productImage = product.imageUrl;

  // Tạo chatId duy nhất giữa 2 user (không bị trùng ngược)
  const chatId = [user.uid, sellerId].sort().join("_");

  // Lưu thông tin chat vào localStorage để trang chat lấy
  const chatInfo = {
    chatId,
    userId: user.uid,
    userName: user.displayName || "Ẩn danh",
    userEmail: user.email || "",
    sellerId,
    sellerName,
    sellerEmail,
    productId,
    productName,
    productImage
  };
  localStorage.setItem("currentChat", JSON.stringify(chatInfo));

  // Chuyển sang trang chat chính
  window.location.href = "/FoodBooking-chat/chat.html";
}

window.info = info;
window.closePopup = closePopup;
window.infoById = infoById;
window.closeProductPopup = closeProductPopup;
window.addToBasket = addToBasket;
window.chatWithSeller = chatWithSeller;

async function checkAndToggleAdminButton() {
  // Đợi user đăng nhập xong (nếu có)
  const waitForAuth = () => {
    if (!auth.currentUser) {
      setTimeout(waitForAuth, 200);
      return;
    }
    auth.currentUser.getIdTokenResult(true).then((idTokenResult) => {
      const isAdmin = !!idTokenResult.claims.admin;
      const adminBtn = document.querySelector('.btn-admin');
      const adminText = document.querySelector('.admin');
      if (adminBtn && adminText) {
        if (isAdmin) {
          adminBtn.style.display = '';
          adminText.style.display = '';
        } else {
          adminBtn.style.display = 'none';
          adminText.style.display = 'none';
        }
      }
    }).catch(() => {
      // Nếu lỗi thì ẩn luôn
      const adminBtn = document.querySelector('.btn-admin');
      const adminText = document.querySelector('.admin');
      if (adminBtn && adminText) {
        adminBtn.style.display = 'none';
        adminText.style.display = 'none';
      }
    });
  };
  waitForAuth();
}