document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });
    }    

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
    }
});

function closePopup() {
    const accountPopup = document.getElementById('accountPopup');
    if (accountPopup) {
        accountPopup.style.display = 'none';
    }
}
