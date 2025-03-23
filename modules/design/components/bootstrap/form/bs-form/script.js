/**
 * Bootstrap Form Component Script
 */

// Form validation initialization
function initFormValidation(formId) {
  const form = document.getElementById(formId) || document.querySelector('form.needs-validation');
  
  if (!form) return;
  
  // Loop over forms and prevent submission
  form.addEventListener('submit', function(event) {
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
      
      // Find the first invalid field and focus it
      const invalidField = form.querySelector(':invalid');
      if (invalidField) {
        invalidField.focus();
        
        // Scroll to the invalid field (with a small offset)
        const yOffset = -100;
        const y = invalidField.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({top: y, behavior: 'smooth'});
      }
    } else if (form.getAttribute('data-loading') === 'true') {
      // Show loading state only if form is valid
      showLoadingState(form);
    }
    
    form.classList.add('was-validated');
  }, false);
  
  // Handle loading state toggle
  const loadingToggle = form.getAttribute('data-loading') === 'true';
  if (loadingToggle) {
    form.addEventListener('submit', function(event) {
      if (form.checkValidity()) {
        showLoadingState(form);
      }
    });
  }
  
  // Handle character counters
  const fieldsWithCounter = form.querySelectorAll('[data-character-counter]');
  fieldsWithCounter.forEach(function(field) {
    const maxChars = field.getAttribute('maxlength');
    if (maxChars) {
      const counterId = `${field.id}-counter`;
      let counterEl = document.getElementById(counterId);
      
      // Create counter element if it doesn't exist
      if (!counterEl) {
        counterEl = document.createElement('div');
        counterEl.id = counterId;
        counterEl.className = 'form-text text-end character-counter';
        field.parentNode.appendChild(counterEl);
      }
      
      // Initial update
      const remainingChars = maxChars - field.value.length;
      counterEl.textContent = `${remainingChars} caracteres restantes`;
      
      // Update on input
      field.addEventListener('input', function() {
        const remaining = maxChars - field.value.length;
        counterEl.textContent = `${remaining} caracteres restantes`;
        
        // Add warning class when getting close to limit
        if (remaining <= 10) {
          counterEl.classList.add('text-warning');
        } else {
          counterEl.classList.remove('text-warning');
        }
      });
    }
  });
  
  // Handle dependent fields (fields that show/hide based on other fields)
  const conditionalFields = form.querySelectorAll('[data-depends-on]');
  conditionalFields.forEach(function(field) {
    const dependency = field.getAttribute('data-depends-on');
    const dependsOnValue = field.getAttribute('data-depends-value');
    const dependsOnField = form.querySelector(`[name="${dependency}"]`);
    
    if (dependsOnField) {
      // Initial check
      updateFieldVisibility(dependsOnField, field, dependsOnValue);
      
      // Check when dependency changes
      const eventType = dependsOnField.type === 'checkbox' || dependsOnField.type === 'radio' ? 'change' : 'input';
      dependsOnField.addEventListener(eventType, function() {
        updateFieldVisibility(dependsOnField, field, dependsOnValue);
      });
    }
  });
}

// Function to show loading state
function showLoadingState(form) {
  const submitBtn = form.querySelector('[type="submit"]');
  const spinner = submitBtn.querySelector('.loading-spinner');
  
  if (submitBtn && spinner) {
    submitBtn.disabled = true;
    submitBtn.setAttribute('data-original-text', submitBtn.innerText.trim());
    spinner.classList.remove('visually-hidden');
  }
}

// Function to update dependent field visibility
function updateFieldVisibility(dependsOnField, targetField, dependsOnValue) {
  let fieldContainer = targetField.closest('.form-group') || targetField.closest('.mb-3') || targetField;
  let isVisible = false;
  
  // Check different input types
  if (dependsOnField.type === 'checkbox') {
    // For checkbox, we check if it's checked
    isVisible = dependsOnField.checked === (dependsOnValue === 'true');
  } else if (dependsOnField.type === 'radio') {
    // For radio buttons, find the checked one in the group
    const radioGroup = document.querySelectorAll(`[name="${dependsOnField.name}"]`);
    const checkedRadio = Array.from(radioGroup).find(radio => radio.checked);
    isVisible = checkedRadio && checkedRadio.value === dependsOnValue;
  } else {
    // For select and text-like inputs
    isVisible = dependsOnField.value === dependsOnValue;
  }
  
  // Show/hide the field
  if (isVisible) {
    fieldContainer.style.display = '';
    // Enable the field for form validation
    targetField.disabled = false;
  } else {
    fieldContainer.style.display = 'none';
    // Disable the field to avoid validation when hidden
    targetField.disabled = true;
  }
}

// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Find all forms on the page to initialize
  const forms = document.querySelectorAll('form.needs-validation');
  forms.forEach(function(form) {
    initFormValidation(form.id);
  });
  
  // Password strength meter initialization if present
  const passwordInputs = document.querySelectorAll('input[type="password"][data-password-strength]');
  passwordInputs.forEach(function(input) {
    input.addEventListener('input', function() {
      updatePasswordStrength(input);
    });
    
    // Initial check
    if (input.value) {
      updatePasswordStrength(input);
    }
  });
});

// Function to update password strength meter
function updatePasswordStrength(passwordInput) {
  const password = passwordInput.value;
  let strength = 0;
  let feedback = '';
  
  // Create strength meter if it doesn't exist
  const meterId = `${passwordInput.id}-strength`;
  let meterContainer = document.getElementById(meterId);
  
  if (!meterContainer) {
    meterContainer = document.createElement('div');
    meterContainer.id = meterId;
    meterContainer.className = 'password-strength mt-2';
    meterContainer.innerHTML = `
      <div class="progress" style="height: 5px;">
        <div class="progress-bar bg-danger" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
      </div>
      <div class="form-text password-feedback mt-1"></div>
    `;
    passwordInput.parentNode.appendChild(meterContainer);
  }
  
  const progressBar = meterContainer.querySelector('.progress-bar');
  const feedbackEl = meterContainer.querySelector('.password-feedback');
  
  // Calculate password strength
  if (password.length > 0) {
    // Basic length check
    strength += Math.min(password.length * 2, 20);
    
    // Complexity checks
    if (/[A-Z]/.test(password)) strength += 10; // Uppercase
    if (/[a-z]/.test(password)) strength += 10; // Lowercase
    if (/[0-9]/.test(password)) strength += 10; // Numbers
    if (/[^A-Za-z0-9]/.test(password)) strength += 15; // Special chars
    
    // Cap at 100
    strength = Math.min(strength, 100);
    
    // Provide feedback based on strength
    if (strength < 30) {
      feedbackEl.textContent = 'Senha muito fraca';
      progressBar.className = 'progress-bar bg-danger';
    } else if (strength < 60) {
      feedbackEl.textContent = 'Senha fraca';
      progressBar.className = 'progress-bar bg-warning';
    } else if (strength < 80) {
      feedbackEl.textContent = 'Senha moderada';
      progressBar.className = 'progress-bar bg-info';
    } else {
      feedbackEl.textContent = 'Senha forte';
      progressBar.className = 'progress-bar bg-success';
    }
  } else {
    feedbackEl.textContent = '';
    strength = 0;
  }
  
  // Update progress bar
  progressBar.style.width = `${strength}%`;
  progressBar.setAttribute('aria-valuenow', strength);
}