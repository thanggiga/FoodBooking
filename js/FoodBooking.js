document.addEventListener("DOMContentLoaded", () => { 
    const accountButton = document.querySelector('.btn-acc');
    const accountPopup = document.getElementById('accountPopup');
    
    if (accountButton && accountPopup) {
        accountButton.addEventListener('click', () => {
            const currentUser = JSON.parse(localStorage.getItem("currentUser"));
            if (currentUser) {
                accountPopup.style.display = 'flex';
            } else {
                customAlert("Bạn cần đăng nhập để xem thông tin tài khoản.", () => {
                    window.location.href = "login.html";
                });
            }
        });
        // Đóng popup khi nhấn ra ngoài vùng popup-content
        accountPopup.addEventListener('mousedown', function(e) {
            if (e.target === accountPopup) {
                closePopup();
            }
        });
    }
});

function closePopup() {
    const accountPopup = document.getElementById('accountPopup');
    if (accountPopup) {
        accountPopup.style.display = 'none';
    }
}

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
