/**
 * Bootstrap Product Card Component Script
 */

// Initialize product card functionality
function initProductCards() {
  // Add to cart functionality
  document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      const productId = this.getAttribute('data-product-id');
      
      // Show confirmation toast
      const toastEl = document.createElement('div');
      toastEl.classList.add('toast', 'align-items-center', 'text-white', 'bg-success', 'border-0');
      toastEl.setAttribute('role', 'alert');
      toastEl.setAttribute('aria-live', 'assertive');
      toastEl.setAttribute('aria-atomic', 'true');
      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
            Produto adicionado ao carrinho!
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      `;
      
      // Add toast to container (create if doesn't exist)
      let toastContainer = document.querySelector('.toast-container');
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.classList.add('toast-container', 'position-fixed', 'bottom-0', 'end-0', 'p-3');
        document.body.appendChild(toastContainer);
      }
      
      toastContainer.appendChild(toastEl);
      
      // Initialize and show toast
      const toast = new bootstrap.Toast(toastEl);
      toast.show();
      
      // Handle actual cart addition (to be connected to cart system)
      console.log(`Product ${productId} added to cart`);  
      
      // Update cart count indicator if exists
      const cartCountEl = document.querySelector('.cart-count');
      if (cartCountEl) {
        const currentCount = parseInt(cartCountEl.textContent) || 0;
        cartCountEl.textContent = currentCount + 1;
      }
      
      // Remove toast after it's hidden
      toastEl.addEventListener('hidden.bs.toast', function () {
        toastEl.remove();
      });
    });
  });
  
  // Add to wishlist functionality
  document.querySelectorAll('.add-to-wishlist-btn').forEach(button => {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      const productId = this.getAttribute('data-product-id');
      
      // Toggle active state
      this.classList.toggle('active');
      this.querySelector('i').classList.toggle('bi-heart');
      this.querySelector('i').classList.toggle('bi-heart-fill');
      
      console.log(`Product ${productId} ${this.classList.contains('active') ? 'added to' : 'removed from'} wishlist`);
    });
  });
  
  // Quick view functionality
  document.querySelectorAll('[data-bs-toggle="modal"][data-bs-target="#quickViewModal"]').forEach(button => {
    button.addEventListener('click', function() {
      const productId = this.getAttribute('data-product-id');
      const modal = document.querySelector('#quickViewModal');
      
      if (modal) {
        // Set loading state
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
          modalBody.innerHTML = '<div class="d-flex justify-content-center py-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        }
        
        // Here you would fetch the product details and update the modal
        // This would be connected to the actual product data system
        console.log(`Quick view for product ${productId} requested`);
      }
    });
  });
}

// Execute when DOM is loaded
document.addEventListener('DOMContentLoaded', initProductCards);