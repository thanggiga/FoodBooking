import { db, auth, ref, push, set, get } from './firebase.js';

let currentUser = null;

// Kiểm tra trạng thái đăng nhập
auth.onAuthStateChanged(user => {
    currentUser = getCurrentUser();
    if (currentUser) {
        // Tự động điền thông tin nếu đã đăng nhập
        document.getElementById('feedbackName').value = currentUser.displayName || '';
        document.getElementById('feedbackEmail').value = currentUser.email || '';
    }
});

function getCurrentUser() {
    const local = localStorage.getItem('currentUser');
    if (local) return JSON.parse(local);
    if (auth.currentUser) {
        return {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName,
            photoURL: auth.currentUser.photoURL
        };
    }
    return null;
}

// Character counter
document.getElementById('feedbackContent').addEventListener('input', function() {
    const content = this.value;
    const maxLength = 1000;
    const currentLength = content.length;
    const counter = document.getElementById('charCounter');
    
    counter.textContent = `${currentLength}/${maxLength} ký tự`;
    
    // Thay đổi màu sắc dựa trên độ dài
    counter.className = 'char-counter';
    if (currentLength > maxLength * 0.8) {
        counter.classList.add('warning');
    }
    if (currentLength > maxLength * 0.95) {
        counter.classList.add('danger');
    }
});

// Hiển thị message
function showMessage(type, text) {
    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    // Ẩn tất cả messages
    successMsg.classList.remove('show');
    errorMsg.classList.remove('show');
    
    if (type === 'success') {
        successMsg.classList.add('show');
        setTimeout(() => {
            successMsg.classList.remove('show');
        }, 3000);
    } else if (type === 'error') {
        errorText.textContent = text;
        errorMsg.classList.add('show');
        setTimeout(() => {
            errorMsg.classList.remove('show');
        }, 5000);
    }
}

// Xử lý gửi feedback
document.getElementById('feedbackForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitFeedback');
    const originalText = submitBtn.innerHTML;
    
    // Disable button và hiển thị loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Đang gửi...';
    
    try {
        const name = document.getElementById('feedbackName').value.trim();
        const email = document.getElementById('feedbackEmail').value.trim();
        const content = document.getElementById('feedbackContent').value.trim();
        
        // Validation
        if (!name || !email || !content) {
            showMessage('error', 'Vui lòng điền đầy đủ thông tin trước khi gửi cho chúng tôi!');
            return;
        }
        
        if (content.length < 10) {
            showMessage('error', 'Nội dung góp ý phải có ít nhất 10 ký tự!');
            return;
        }
        
        if (content.length > 1000) {
            showMessage('error', 'Nội dung góp ý không được vượt quá 1000 ký tự!');
            return;
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('error', 'Email không hợp lệ!');
            return;
        }
        
        const feedbackData = {
            userId: currentUser ? currentUser.uid : null,
            userName: name,
            userEmail: email,
            content: content,
            timestamp: Date.now(),
            status: 'pending',
            userAgent: navigator.userAgent,
            ipAddress: await getIPAddress(),
            userType: currentUser ? 'registered' : 'guest'
        };
        
        const feedbackRef = ref(db, 'feedback');
        const newFeedbackRef = push(feedbackRef);
        
        await set(newFeedbackRef, feedbackData);
        
        showMessage('success', 'Gửi phản hồi thành công!');
        
        document.getElementById('feedbackForm').reset();
        document.getElementById('charCounter').textContent = '0/1000 ký tự';
        document.getElementById('charCounter').className = 'char-counter';
        
    } catch (error) {
        console.error('Lỗi khi gửi feedback:', error);
        showMessage('error', 'Có lỗi xảy ra khi gửi phản hồi. Vui lòng thử lại sau!');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// Hàm lấy IP address (sử dụng service miễn phí)
async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Không thể lấy IP address:', error);
        return 'unknown';
    }
}

// Popup tài khoản
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

// Logout
document.querySelector('.btn-logout').addEventListener('click', function() {
    auth.signOut();
});

// Export functions cho global access
window.info = info;
window.closePopup = closePopup;

// Hàm để admin xem feedback (có thể thêm vào trang admin)
window.loadFeedbackForAdmin = async function() {
    try {
        const feedbackRef = ref(db, 'feedback');
        const snapshot = await get(feedbackRef);
        const feedbacks = [];
        
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                const feedback = child.val();
                feedback.id = child.key;
                feedbacks.push(feedback);
            });
        }
        
        // Sắp xếp theo thời gian mới nhất
        feedbacks.sort((a, b) => b.timestamp - a.timestamp);
        
        return feedbacks;
    } catch (error) {
        console.error('Lỗi khi load feedback:', error);
        return [];
    }
};

// Hàm cập nhật trạng thái feedback
window.updateFeedbackStatus = async function(feedbackId, status) {
    try {
        const feedbackRef = ref(db, `feedback/${feedbackId}/status`);
        await set(feedbackRef, status);
        return true;
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        return false;
    }
};