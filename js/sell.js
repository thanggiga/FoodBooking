import { db, ref, set, get } from "./firebase.js";

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

// Lấy người dùng hiện tại từ localStorage
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

window.info = function () {
  const popup = document.getElementById("accountPopup");
  const user = getCurrentUser();
  document.getElementById("userName").textContent = user?.displayName || "Ẩn danh";
  document.getElementById("userEmail").textContent = user?.email || "Không có email";
  popup.style.display = "block";
};

window.closePopup = function () {
  document.getElementById("accountPopup").style.display = "none";
};

// Tạo ID tiếp theo
async function generateNextProductId() {
  const [productsSnap, pendingSnap] = await Promise.all([
    get(ref(db, "products")),
    get(ref(db, "pendingProducts")),
  ]);

  let maxId = 25;
  const checkSnap = (snap) => {
    if (snap.exists()) {
      snap.forEach(child => {
        const key = child.key;
        if (/^p\d+$/.test(key)) {
          const num = parseInt(key.slice(1));
          if (num > maxId) maxId = num;
        }
      });
    }
  };

  checkSnap(productsSnap);
  checkSnap(pendingSnap);
  return `p${maxId + 1}`;
}

// Tạo nguyên liệu động
let ingredientCount = 0;
const countSpan = document.getElementById("ingredientCount");
const inputContainer = document.getElementById("ingredientInputs");

document.getElementById("increaseIngredient").onclick = () => {
  ingredientCount++;
  updateIngredientInputs();
};
document.getElementById("decreaseIngredient").onclick = () => {
  if (ingredientCount > 0) ingredientCount--;
  updateIngredientInputs();
};

function updateIngredientInputs() {
  countSpan.textContent = ingredientCount;
  inputContainer.innerHTML = "";
  for (let i = 0; i < ingredientCount; i++) {
    const div = document.createElement("div");
    div.style.marginBottom = "8px";
    div.innerHTML = `
      <input type="text" placeholder="Nguyên liệu ${i + 1}" class="aiName" required>
      <input type="text" placeholder="Khối lượng (vd: 100g, 1 quả)" class="aiWeight" required>
    `;
    inputContainer.appendChild(div);
  }
}

// Gọi AI phân tích dinh dưỡng
document.getElementById("analyzeBtn").addEventListener("click", async () => {
  const loadingDiv = document.getElementById("aiLoading");
  loadingDiv.style.display = "block"; // Hiện fallback loading

  const names = Array.from(document.querySelectorAll(".aiName")).map(i => i.value.trim());
  const weights = Array.from(document.querySelectorAll(".aiWeight")).map(i => i.value.trim());

  if (names.some(n => !n) || weights.some(w => !w)) {
    customAlert("⚠️ Vui lòng điền đầy đủ nguyên liệu và khối lượng.");
    loadingDiv.style.display = "none"; // Ẩn fallback nếu lỗi
    return;
  }

  const inputText = names.map((n, i) => `${weights[i]} ${n}`).join(", ");

  const apiKey = "AIzaSyCbGjhla6AP_2_wyfKQhsbjmL43Ud8OmX0";
  const model = "gemini-1.5-flash-latest";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `
Tôi có các nguyên liệu sau: ${inputText}.
Hãy tính giúp tổng giá trị dinh dưỡng của toàn bộ món ăn (không cần phân tích từng nguyên liệu).

Chỉ trả về kết quả dạng JSON như sau (không cần văn bản giải thích):
{
  "nutrition": {
    "calo": ..., "protein": ..., "fat": ..., "carb": ..., 
    "canxi": ..., "kẽm": ..., "vitaminC": ..., "sat": ...
  }
}`.trim();

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!res.ok) throw new Error("Lỗi kết nối Gemini AI");

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = rawText.match(/{[\s\S]+}/);
    const nutrition = JSON.parse(jsonMatch[0]).nutrition;

    localStorage.setItem("ai_nutrition", JSON.stringify(nutrition));

    const table = document.getElementById("nutritionDisplay");
    table.style.display = "table";
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = Object.entries(nutrition)
      .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
      .join("");

    customAlert("✅ Đã phân tích dinh dưỡng thành công!");
  } catch (err) {
    console.error("Lỗi AI:", err);
    customAlert("⚠️ Có lỗi khi gọi AI hoặc định dạng sai.");
  } finally {
    loadingDiv.style.display = "none"; // ✅ Luôn ẩn fallback khi xong
  }
});

// ====== Gửi món ăn lên pendingProducts =======
document.getElementById("sellForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const imageUrl = document.getElementById("imageUrl").value.trim();
  const price = parseFloat(document.getElementById("price").value);
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value.trim();

  const user = getCurrentUser();
  if (!user) return customAlert("⚠️ Bạn cần đăng nhập.");

  const names = Array.from(document.querySelectorAll(".aiName")).map(i => i.value.trim());
  const weights = Array.from(document.querySelectorAll(".aiWeight")).map(i => i.value.trim());
  const nutrition = JSON.parse(localStorage.getItem("ai_nutrition") || "{}");

  if (!name || !imageUrl || isNaN(price) || !description || !category || names.length === 0 || Object.keys(nutrition).length === 0) {
    customAlert("⚠️ Vui lòng nhập đầy đủ thông tin và phân tích dinh dưỡng trước.");
    return;
  }

  const ingredients = {};
  names.forEach((n, i) => {
    ingredients[`i${i + 1}`] = weights[i] + " " + n;
  });

  const id = await generateNextProductId();
  const createdAt = new Date().toISOString();

  const productData = {
    id,
    name,
    imageUrl,
    price,
    category,
    description,
    ingredients,
    nutrition,
    status: "pending",
    createdAt,
    ownerID: user.uid,
    ownerName: user.displayName || "Ẩn danh",
    ownerEmail: user.email || ""
  };

  try {
    await set(ref(db, `pendingProducts/${id}`), productData);
    localStorage.removeItem("ai_nutrition");
    customAlert("🎉 Món ăn đã được gửi để chờ duyệt!", function() {
      window.location.href = "myproducts.html";
    });
  } catch (err) {
    console.error("❌ Firebase lỗi:", err);
    customAlert("⚠️ Có lỗi khi gửi sản phẩm.");
  }
});
