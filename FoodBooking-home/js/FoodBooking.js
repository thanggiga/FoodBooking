document.addEventListener("DOMContentLoaded", () => { 
    //Account Popup Logic
    const accountButton = document.querySelector('.btn-acc');
    const accountPopup = document.getElementById('accountPopup');
    
    if (accountButton && accountPopup) {
        accountButton.addEventListener('click', () => {
            const currentUser = JSON.parse(localStorage.getItem("currentUser"));
            if (currentUser) {
                accountPopup.style.display = 'flex';
            } else {
                alert("Bạn cần đăng nhập để xem thông tin tài khoản.");
                window.location.href = "/FoodBooking-login/login.html";
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
