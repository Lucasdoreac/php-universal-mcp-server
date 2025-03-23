/**
 * Modern Header Component Script
 */

// Handle search toggle
function initSearchToggle() {
  const searchToggle = document.querySelector('.search-toggle');
  const searchContainer = document.querySelector('.search-container');
  
  if (searchToggle && searchContainer) {
    searchToggle.addEventListener('click', function() {
      searchContainer.classList.toggle('active');
      if (searchContainer.classList.contains('active')) {
        searchContainer.querySelector('input').focus();
      }
    });
  }
}

// Handle mobile menu
function initMobileMenu() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  
  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', function() {
      mainNav.classList.toggle('active');
      mobileMenuToggle.classList.toggle('active');
    });
  }
}

// Sticky header on scroll
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  let scrollPosition = window.scrollY;
  const scrollThreshold = 100;
  
  if (header) {
    window.addEventListener('scroll', function() {
      scrollPosition = window.scrollY;
      
      if (scrollPosition > scrollThreshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }
}

// Initialize all header functionality
function initHeader() {
  initSearchToggle();
  initMobileMenu();
  initStickyHeader();
}

// Execute when DOM is loaded
document.addEventListener('DOMContentLoaded', initHeader);