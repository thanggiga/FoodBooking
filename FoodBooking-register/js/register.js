function showFooter() {
  var footer = document.querySelector('footer');
  if (!footer) {
      // Nếu footer chưa được load, đợi một chút rồi thử lại
      setTimeout(showFooter, 100);
      return;
  }
  
  if (footer.classList.contains('show')) {
    // Ẩn footer
    footer.style.opacity = '0';
    footer.style.transform = 'translateY(20px)';
    setTimeout(function() {
      footer.classList.remove('show');
      footer.style.display = 'none';
    }, 500); 
  } else {
    // Hiện footer
    footer.style.display = 'block';
    setTimeout(function() {
      footer.classList.add('show');
      footer.style.opacity = '1';
      footer.style.transform = 'translateY(0)';
    }, 10);
  }
}