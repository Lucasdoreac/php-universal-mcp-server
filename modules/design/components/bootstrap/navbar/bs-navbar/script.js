/**
 * Bootstrap Navbar Component Script
 */

// Initialize any Bootstrap-specific functionality
function initNavbar() {
  // Enable dropdowns (Bootstrap JS should handle this automatically)
  // Make navbar collapse on mobile when clicking nav links
  document.querySelectorAll('.navbar-nav .nav-link').forEach(item => {
    item.addEventListener('click', () => {
      // Check if navbar is expanded and we're on mobile
      const navbarToggler = document.querySelector('.navbar-toggler');
      const navbarCollapse = document.querySelector('.navbar-collapse');
      
      if (window.innerWidth < 992 && navbarCollapse.classList.contains('show')) {
        // Use Bootstrap's collapse API to hide the menu
        const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
          toggle: false
        });
        bsCollapse.hide();
      }
    });
  });
  
  // Handle sticky header behavior if enabled
  if (document.querySelector('.navbar.sticky-top, .navbar.fixed-top')) {
    window.addEventListener('scroll', function() {
      const navbar = document.querySelector('.navbar.sticky-top, .navbar.fixed-top');
      if (window.scrollY > 50) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
    });
  }
}

// Execute when DOM is loaded
document.addEventListener('DOMContentLoaded', initNavbar);