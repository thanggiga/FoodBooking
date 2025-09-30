// Custom animated alert popup with callback
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

window.customAlert = function(msg, callback) {
  const popup = document.getElementById('customAlert');
  const msgBox = document.getElementById('customAlertMsg');
  popup.style.display = 'flex';
  msgBox.innerText = msg;
  const btnClose = document.getElementById('customAlertClose');
  btnClose.onclick = function() {
    popup.style.display = 'none';
    if (typeof callback === 'function') callback();
  };
};

function renderSelected() {
  const container = document.getElementById("selectedProductsList");
  if (!container) return;
  if (!selectedProducts.length) {
    container.innerHTML = '<div class="empty-selected">Chưa có món nào được chọn.</div>';
    return;
  }
  container.innerHTML = selectedProducts.map(p => `
    <div class="selected-product">
      <img src="${p.imageUrl}" class="selected-thumb" alt="${p.name}" />
      <span class="selected-name">${p.name}</span>
      <div class="selected-qty">
        <button class="qty-btn" onclick="decreaseQty('${p.id}')">-</button>
        <span id="qty-${p.id}">${p.qty || 1}</span>
        <button class="qty-btn" onclick="increaseQty('${p.id}')">+</button>
      </div>
      <button class="remove-btn" onclick="removeSelected('${p.id}')">❌</button>
    </div>
  `).join("");

  // Tính tổng dinh dưỡng
  const nutritionTotal = {};
  selectedProducts.forEach(p => {
    const qty = p.qty || 1;
    if (Array.isArray(p.nutrition)) {
      p.nutrition.forEach(n => {
        nutritionTotal[n] = (nutritionTotal[n] || 0) + qty;
      });
    } else if (typeof p.nutrition === 'object' && p.nutrition !== null) {
      Object.entries(p.nutrition).forEach(([k, v]) => {
        // Nếu là số, cộng dồn, nếu là chuỗi thì đếm số lần xuất hiện
        if (!isNaN(Number(v))) {
          nutritionTotal[k] = (nutritionTotal[k] || 0) + Number(v) * qty;
        } else {
          nutritionTotal[k] = (nutritionTotal[k] || 0) + qty;
        }
      });
    }
  });
  // Hiển thị tổng dinh dưỡng
  if (Object.keys(nutritionTotal).length) {
    container.innerHTML += `<div class="nutrition-total"><b>Tổng dinh dưỡng:</b><ul>` +
      Object.entries(nutritionTotal).map(([k, v]) => `<li>${k}: ${v}</li>`).join("") +
      `</ul></div>`;
  }

  // Gắn sự kiện hỏi AI tư vấn
  const btnAskAI = document.getElementById("btnAskAI");
  if (btnAskAI) {
    btnAskAI.onclick = window.askPreferenceAdvice;
  }

window.increaseQty = function(id) {
  const idx = selectedProducts.findIndex(p => p.id === id);
  if (idx !== -1) {
    selectedProducts[idx].qty = (selectedProducts[idx].qty || 1) + 1;
    localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
    renderSelected();
  }
}
window.decreaseQty = function(id) {
  const idx = selectedProducts.findIndex(p => p.id === id);
  if (idx !== -1 && (selectedProducts[idx].qty || 1) > 1) {
    selectedProducts[idx].qty = (selectedProducts[idx].qty || 1) - 1;
    localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
    renderSelected();
  }
}
}
function loadSelectedFromStorage() {
  const data = JSON.parse(localStorage.getItem("selectedProducts"));
  if (Array.isArray(data)) {
    selectedProducts = data;
    renderSelected();
    if (selectedProducts.length > 0) {
      const btnAddMore = document.getElementById("btnAddMoreProduct");
      if (btnAddMore) btnAddMore.style.display = "inline-block";
    }
  }
}
import { db, ref, onValue, update } from "./firebase.js";

let allProducts = [];
let selectedProducts = [];

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
  // Nếu dùng Firebase:
  if (typeof db !== 'undefined' && typeof ref === 'function' && typeof onValue === 'function') {
    const productRef = ref(db, "products");
    onValue(productRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      allProducts = Object.entries(data).map(([id, p]) => ({ id, ...p }));
      renderProductPopupList();
    });
  } else {
    // Nếu không có Firebase, dùng dữ liệu mẫu (demo)
    allProducts = [
      { id: '1', name: 'Cơm gà Healthy', price: 45000, imageUrl: 'https://res.cloudinary.com/dhxabc6as/image/upload/v1750578758/BetterImage_1750578615095_hpjyos.jpg', nutrition: ['Protein', 'Calo thấp', 'Ít dầu mỡ'], ingredients: ['Gà', 'Cơm lứt', 'Rau củ'] },
      { id: '2', name: 'Salad cá hồi', price: 65000, imageUrl: 'https://res.cloudinary.com/dhxabc6as/image/upload/v1753501676/6d28a376-2fd8-4e63-8e47-b3ebccd9f4cc.png', nutrition: ['Omega-3', 'Vitamin', 'Ít calo'], ingredients: ['Cá hồi', 'Rau xanh', 'Sốt mè'] },
      { id: '3', name: 'Bún bò Huế', price: 40000, imageUrl: 'https://res.cloudinary.com/dhxabc6as/image/upload/v1753502031/b69dbd08-8637-44d0-927a-0ffaea1f4cbb.png', nutrition: ['Tinh bột', 'Protein', 'Khoáng chất'], ingredients: ['Bò', 'Bún', 'Rau thơm'] }
    ];
    renderProductPopupList();
  }
}

function openProductListPopup() {
  document.getElementById("productPopupSelector").style.display = "flex";
}
function closeProductListPopup() {
  document.getElementById("productPopupSelector").style.display = "none";
}
function closeProductPopup() {
  document.getElementById("productPopupDetail").style.display = "none";
}

window.viewProduct = function(id) {
  const p = allProducts.find(i => i.id === id);
  if (!p) return;
  document.getElementById("popupDetailImage").src = p.imageUrl;
  document.getElementById("popupDetailName").textContent = p.name;
  document.getElementById("popupDetailPrice").textContent = `${p.price?.toLocaleString('vi-VN') || ''} VNĐ`;
  document.getElementById("popupDetailIngredients").innerHTML = p.ingredients ? Object.values(p.ingredients).map(i => `<li>${i}</li>`).join("") : "<li>Không rõ</li>";
  document.getElementById("popupDetailNutrition").innerHTML = p.nutrition ? Object.entries(p.nutrition).map(([k, v]) => `<li>${k}: ${v}</li>`).join("") : "<li>Không rõ</li>";
  const popup = document.getElementById("productPopupDetail");
  popup.style.display = "flex";
  popup.classList.add("wide-popup"); // Thêm class mở rộng popup
  popup.dataset.currentId = p.id;
  // Đổi nút "Thêm"
  const addBtn = document.getElementById("btnAddProduct");
  if (addBtn) {
    addBtn.textContent = "Thêm";
    addBtn.onclick = addToSelected;
  }
}
function addToSelected() {
  const id = document.getElementById("productPopupDetail").dataset.currentId;
  const product = allProducts.find(p => p.id === id);
  if (!product) return;
  let found = selectedProducts.find(p => p.id === product.id);
  if (!found) {
    selectedProducts.push({...product, qty: 1});
  } else {
    found.qty = (found.qty || 1) + 1;
  }
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
  renderSelected();
  closeProductPopup();
  closeProductListPopup();
  const btnAddMore = document.getElementById("btnAddMoreProduct");
  if (btnAddMore) btnAddMore.style.display = "inline-block";
}
function renderProductPopupList() {
  const list = document.getElementById("popupProductList");
  if (!list) return;
  list.innerHTML = allProducts.map(p => `
    <div class="product-card" onclick="viewProduct('${p.id}')">
      <img src="${p.imageUrl}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" />
      <h3>${p.name}</h3>
      <div class="product-price">${p.price?.toLocaleString('vi-VN') || ''} VNĐ</div>
    </div>
  `).join("");
}
window.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadSelectedFromStorage();
  const openPopupBtn = document.getElementById("btnOpenProductPopup");
  const productPopup = document.getElementById("productPopupSelector");
  const closePopupBtns = document.querySelectorAll(".popup-close");
  const btnAddMore = document.getElementById("btnAddMoreProduct");
  if (openPopupBtn && productPopup) {
    openPopupBtn.onclick = () => { productPopup.style.display = "flex"; };
  }
  if (btnAddMore && productPopup) {
    btnAddMore.onclick = () => { productPopup.style.display = "flex"; };
  }
  closePopupBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const popup = btn.closest(".popup-container");
      if (popup) popup.style.display = "none";
    });
  });
});
window.closeProductListPopup = closeProductListPopup;
window.closeProductPopup = closeProductPopup;
window.askPreferenceAdvice = async function () {

  const ageEl = document.getElementById("userAge");
  const goalEl = document.getElementById("userGoal");
  const noteEl = document.getElementById("userNote");
  const age = ageEl.value.trim();
  const goal = goalEl.value;
  const note = noteEl.value.trim();
  localStorage.setItem("featureUserInfo", JSON.stringify({ age, goal, note }));

  if (!age || !selectedProducts.length) {
    customAlert("Vui lòng nhập đầy đủ thông tin và chọn ít nhất 1 món ăn.");
    return;
  }

  const selectedNames = selectedProducts.map(p => p.name).join(", ");
  const prompt = `Tôi ${age} tuổi, mục tiêu: ${goal}. ${note} Tôi đã chọn các món: ${selectedNames}. Bạn nhận xét giúp tôi về lựa chọn này và tư vấn thêm nếu cần nhé, xưng hô bạn bè bình thường thôi.`;

  const apiKey = "AIzaSyAg5XdsCM_EkGpJETDggzs5DLRg5K4_1cQ";
  const model = "gemini-2.5-flash";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const loading = document.getElementById("aiLoading");
  const result = document.getElementById("aiAdviceResult");
  loading.style.display = "block";
  result.innerHTML = "";
  const suggestedSection = document.getElementById("suggestedSection");
  if (suggestedSection) suggestedSection.style.display = "none";

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!res.ok) {
      const text = await res.text();
      result.innerHTML = `<p style='color:red;'>❌ Lỗi API: ${res.status} - ${res.statusText}<br>${text}</p>`;
      loading.style.display = "none";
      return;
    }

    const data = await res.json();
    console.log("AI raw response:", data);
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!content) {
      result.innerHTML = "<p style='color:red;'>❌ AI không trả về lời khuyên. Vui lòng thử lại hoặc nhập thông tin chi tiết hơn.</p>";
      loading.style.display = "none";
      return;
    }
    // Tìm xem AI có trả về gợi ý món ăn dạng JSON không
    let suggestions = null;
    try {
      // Tìm đoạn JSON trong content
      const match = content.match(/\{[\s\S]+\}/);
      if (match) {
        const json = JSON.parse(match[0]);
        if (Array.isArray(json.suggestions)) {
          suggestions = json.suggestions;
        }
      }
    } catch (e) {}

    // Format AI content: remove Markdown headers, convert * to bullet points, bold/italic to HTML
    let formatted = content
      // Remove Markdown headers (###, ##, #)
      .replace(/^#+\s*(.+)$/gm, '<h4>$1</h4>')
      // Convert *text* at line start to bullet points
      .replace(/(^|\n)\*\s?([^\n]+)/g, '$1<li>$2</li>')
      // Convert _text_ or *text* to <i>
      .replace(/\*([^*]+)\*/g, '<i>$1</i>')
      .replace(/_([^_]+)_/g, '<i>$1</i>')
      // Convert **text** to <b>
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      // Replace numbered list (1. text) with <ol><li>text</li></ol>
      .replace(/(^|\n)(\d+)\.\s?([^\n]+)/g, '$1<ol><li>$3</li></ol>')
      // Replace multiple newlines with paragraph
      .replace(/\n{2,}/g, '</p><p>')
      // Replace single newline with <br>
      .replace(/\n/g, '<br>');
    // Wrap <li> in <ul> if any
    if (/<li>/.test(formatted)) {
      formatted = formatted.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    }
    // Remove any duplicate <ul><ul>...
    formatted = formatted.replace(/(<ul>)+/g, '<ul>').replace(/(<\/ul>)+/g, '</ul>');
    // Remove any duplicate <ol><ol>...
    formatted = formatted.replace(/(<ol>)+/g, '<ol>').replace(/(<\/ol>)+/g, '</ol>');
    // Remove stray <ul></ul> and <ol></ol>
    formatted = formatted.replace(/<ul>\s*<\/ul>/g, '').replace(/<ol>\s*<\/ol>/g, '');
    result.innerHTML = `<div class="ai-advice-formatted"><b>FoodBooking AI:</b><p>${formatted}</p></div>
      <button id="btnAddAllToCart" class="add-all-btn">Thêm tất cả món vào giỏ hàng</button>`;

    // Nếu có suggestions, hiển thị ra dưới dạng box
    if (suggestions && suggestions.length) {
      // Tìm các sản phẩm trong allProducts trùng tên suggestions (nếu có)
      const suggestedProducts = suggestions.map(s => {
        if (typeof s === 'string') {
          return allProducts.find(p => p.name.toLowerCase() === s.toLowerCase()) || { name: s };
        }
        return s;
      });
      // Nếu chưa có section, tạo mới
      let suggestedSection = document.getElementById("suggestedSection");
      if (!suggestedSection) {
        suggestedSection = document.createElement("section");
        suggestedSection.id = "suggestedSection";
        result.parentNode.appendChild(suggestedSection);
      }
      suggestedSection.innerHTML = `<h3>Gợi ý thêm từ AI:</h3><div id="suggestedProducts"></div><button class="btn-main" onclick="addSuggestedToCart()">Thêm tất cả gợi ý vào danh sách chọn</button>`;
      renderSuggestions(suggestedProducts);
      suggestedSection.style.display = "block";
    }

    const btnAddAll = document.getElementById("btnAddAllToCart");
    if (btnAddAll) {
      btnAddAll.onclick = async function() {
        const user = getCurrentUser();
        if (!user || !user.uid) {
          customAlert("Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng!");
          return;
        }
        let addCount = 0;
        for (const product of selectedProducts) {
          const cartRef = ref(db, `users/${user.uid}/cart/${product.id}`);
          await new Promise((resolve) => {
            onValue(cartRef, (snapshot) => {
              const existing = snapshot.val();
              const newItem = {
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity: existing?.quantity ? existing.quantity + (product.qty || 1) : (product.qty || 1)
              };
              update(cartRef, newItem)
                .then(() => { addCount++; resolve(); })
                .catch(() => resolve());
            }, { onlyOnce: true });
          });
        }
        customAlert(`Đã thêm ${addCount} món vào giỏ hàng!`);
      };
    }
  } catch (err) {
    console.error("Lỗi khi gọi API AI:", err);
    result.innerHTML = `<p style='color:red;'>❌ Đã xảy ra lỗi khi hỏi AI: ${err?.message || err}</p>`;
  } finally {
    loading.style.display = "none";
  }
};

function renderSuggestions(products) {
  const container = document.getElementById("suggestedProducts");
  container.innerHTML = products.map(p => `
    <div class="product-box">
      <h4>${p.name}</h4>
      <p>${p.description || ''}</p>
    </div>
  `).join("");
  container.dataset.suggestedIds = products.map(p => p.id).join(",");
  document.getElementById("suggestedSection").style.display = "block";
}

window.addSuggestedToCart = function () {
  const ids = document.getElementById("suggestedProducts").dataset.suggestedIds?.split(",");
  if (!ids || !ids.length) return;
  ids.forEach(id => {
    const product = allProducts.find(p => p.id === id);
    if (product) {
      let found = selectedProducts.find(p => p.id === product.id);
      if (!found) {
        selectedProducts.push({...product, qty: 1});
      } else {
        found.qty = (found.qty || 1) + 1;
      }
    }
  });
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
  renderSelected();
  closeProductPopup();
  closeProductListPopup();
}
window.removeSelected = function(id) {
  const idx = selectedProducts.findIndex(p => p.id === id);
  if (idx !== -1) {
    selectedProducts.splice(idx, 1);
    localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
    renderSelected();
  }
};

window.info = info;
window.closePopup = closePopup;