// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Handle navigation link clicks
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            // Only prevent default for hash links (same page navigation)
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetSection.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
            // For non-hash links (like index.html), allow normal navigation
        });
    });

    // Update active navigation link based on scroll position
    const sections = document.querySelectorAll('section[id]');
    const header = document.querySelector('.header');
    
    function updateActiveNavLink() {
        const scrollPosition = window.scrollY + header.offsetHeight + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                // Remove active class from all nav links
                navLinks.forEach(link => link.classList.remove('active'));
                
                // Add active class to current section's nav link
                const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }

    // Listen for scroll events
    window.addEventListener('scroll', updateActiveNavLink);
    
    // Initial call to set active link
    updateActiveNavLink();

    // Enhanced form validation and submission
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        // Real-time validation
        const formInputs = contactForm.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                clearFieldError(this);
            });
        });

        // Form submission with enhanced validation
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Clear previous errors
            clearAllErrors();
            
            // Validate all fields
            let isValid = true;
            formInputs.forEach(input => {
                if (!validateField(input)) {
                    isValid = false;
                }
            });
            
            if (!isValid) {
                showFormError('Please correct the errors above before submitting.');
                return;
            }
            
            // Show loading state
            showFormLoading();
            
            // Prepare form data
            const formData = new FormData(contactForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                projectType: formData.get('projectType'),
                details: formData.get('message') || '',
                timestamp: new Date().toISOString(),
                page: window.location.pathname
            };
            
            // Send form data using Vercel API
            fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    projectType: formData.get('projectType'),
                    message: formData.get('message')
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.error) {
                    throw new Error(result.error.message);
                }
                
                // Show success message
                hideFormLoading();
                showFormSuccess('Thank you for your submission! We\'ll get back to you within 24 hours.');
                
                // Track conversion events
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_submit', {
                        event_category: 'Contact',
                        event_label: 'Quote Request',
                        value: 1
                    });
                }
                
                if (typeof fbq !== 'undefined') {
                    fbq('track', 'Lead', {
                        content_name: 'Quote Request',
                        content_category: 'Contact Form'
                    });
                }
                
                contactForm.reset();
                clearAllErrors();
            })
            .catch(error => {
                console.error('Email sending failed:', error);
                hideFormLoading();
                showFormError('Sorry, there was an error sending your message. Please try again or call us directly at (559) 870-7465.');
            });
        });
    }

    // Validation functions
    function validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            errorMessage = `${getFieldLabel(fieldName)} is required.`;
            isValid = false;
        }

        // Email validation
        if (fieldName === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errorMessage = 'Please enter a valid email address.';
                isValid = false;
            }
        }

        // Phone validation
        if (fieldName === 'phone' && value) {
            const phoneRegex = /^[\d\s\(\)\-\+]+$/;
            const digitsOnly = value.replace(/\D/g, '');
            if (!phoneRegex.test(value) || digitsOnly.length < 10) {
                errorMessage = 'Please enter a valid phone number.';
                isValid = false;
            }
        }

        // Name validation
        if (fieldName === 'name' && value && value.length < 2) {
            errorMessage = 'Name must be at least 2 characters long.';
            isValid = false;
        }

        // Details validation
        if (fieldName === 'details' && value && value.length < 10) {
            errorMessage = 'Please provide more details about your project (at least 10 characters).';
            isValid = false;
        }

        // Update field appearance and show error
        if (!isValid) {
            showFieldError(field, errorMessage);
        } else {
            showFieldSuccess(field);
        }

        return isValid;
    }

    function getFieldLabel(fieldName) {
        const labels = {
            'name': 'Full Name',
            'phone': 'Phone',
            'email': 'Email',
            'project-type': 'Project Type',
            'details': 'Project Details'
        };
        return labels[fieldName] || fieldName;
    }

    function showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.add('error');
        formGroup.classList.remove('success');
        
        // Update ARIA attributes
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', field.id + '-error');
        
        // Remove existing error message
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message show';
        errorDiv.id = field.id + '-error';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle" aria-hidden="true"></i> ${message}`;
        formGroup.appendChild(errorDiv);
    }

    function showFieldSuccess(field) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.add('success');
        formGroup.classList.remove('error');
        
        // Update ARIA attributes
        field.setAttribute('aria-invalid', 'false');
        
        // Remove existing error message
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    function clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.remove('error');
        
        // Update ARIA attributes
        field.setAttribute('aria-invalid', 'false');
        
        const errorMessage = formGroup.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.classList.remove('show');
            setTimeout(() => errorMessage.remove(), 300);
        }
    }

    function clearAllErrors() {
        const errorMessages = contactForm.querySelectorAll('.error-message');
        errorMessages.forEach(msg => {
            msg.classList.remove('show');
            setTimeout(() => msg.remove(), 300);
        });
        
        const formGroups = contactForm.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('error', 'success');
        });
    }

    function showFormError(message) {
        const existingError = contactForm.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error error-message show';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        contactForm.insertBefore(errorDiv, contactForm.querySelector('.form-buttons'));
    }

    function showFormSuccess(message) {
        const existingSuccess = contactForm.querySelector('.form-success');
        if (existingSuccess) {
            existingSuccess.remove();
        }
        
        const successDiv = document.createElement('div');
        successDiv.className = 'form-success success-message show';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        contactForm.insertBefore(successDiv, contactForm.querySelector('.form-buttons'));
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            successDiv.classList.remove('show');
            setTimeout(() => successDiv.remove(), 300);
        }, 5000);
    }

    function showFormLoading() {
        contactForm.classList.add('form-loading');
        const submitButton = contactForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    }

    function hideFormLoading() {
        contactForm.classList.remove('form-loading');
        const submitButton = contactForm.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Get a Quote';
    }

    // Enhanced file upload display
    const fileInput = document.querySelector('input[type="file"]');
    const fileText = document.querySelector('.file-text');
    const fileUpload = document.querySelector('.file-upload');
    
    if (fileInput && fileText && fileUpload) {
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                const files = Array.from(this.files);
                const totalSize = files.reduce((sum, file) => sum + file.size, 0);
                const maxSize = 10 * 1024 * 1024; // 10MB limit
                
                if (totalSize > maxSize) {
                    showFieldError(fileInput, 'Total file size exceeds 10MB limit.');
                    this.value = '';
                    fileText.textContent = 'No file chosen';
                    return;
                }
                
                // Validate file types
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/avi', 'video/mov'];
                const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
                
                if (invalidFiles.length > 0) {
                    showFieldError(fileInput, 'Please upload only images (JPG, PNG, GIF, WebP) or videos (MP4, AVI, MOV).');
                    this.value = '';
                    fileText.textContent = 'No file chosen';
                    return;
                }
                
                // Show success state
                showFieldSuccess(fileInput);
                
                // Display file information
                if (files.length === 1) {
                    const file = files[0];
                    const size = formatFileSize(file.size);
                    fileText.innerHTML = `<i class="fas fa-file"></i> ${file.name} (${size})`;
                } else {
                    const totalSizeFormatted = formatFileSize(totalSize);
                    fileText.innerHTML = `<i class="fas fa-files"></i> ${files.length} files selected (${totalSizeFormatted})`;
                }
                
                // Add visual feedback
                fileUpload.style.borderColor = '#22c55e';
                fileUpload.style.background = 'linear-gradient(145deg, #1d4c1d 0%, #2d3748 100%)';
            } else {
                fileText.textContent = 'No file chosen';
                fileUpload.style.borderColor = 'transparent';
                fileUpload.style.background = 'linear-gradient(145deg, #374151 0%, #2d3748 100%)';
                clearFieldError(fileInput);
            }
        });
        
        // Drag and drop functionality
        fileUpload.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#f97316';
            this.style.background = 'linear-gradient(145deg, #3d4852 0%, #374151 100%)';
        });
        
        fileUpload.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = 'transparent';
            this.style.background = 'linear-gradient(145deg, #374151 0%, #2d3748 100%)';
        });
        
        fileUpload.addEventListener('drop', function(e) {
            e.preventDefault();
            const files = e.dataTransfer.files;
            fileInput.files = files;
            fileInput.dispatchEvent(new Event('change'));
        });
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Handle "Jump on a call" button
    const callButton = document.querySelector('.btn-secondary');
    if (callButton && callButton.textContent.includes('Jump on a call')) {
        callButton.addEventListener('click', function() {
            // Scroll to contact section
            const contactSection = document.querySelector('#contact');
            if (contactSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = contactSection.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }

    // Handle "Sign up here" button
    const signupButton = document.querySelector('.btn-primary');
    if (signupButton && signupButton.textContent.includes('Sign up here')) {
        signupButton.addEventListener('click', function() {
            // Scroll to contact section
            const contactSection = document.querySelector('#contact');
            if (contactSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = contactSection.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }

    // Handle "Call (559) 870-7485" button
    const phoneButton = document.querySelector('.btn-secondary');
    if (phoneButton && phoneButton.textContent.includes('Call')) {
        phoneButton.addEventListener('click', function() {
            // Track phone call clicks
            if (typeof gtag !== 'undefined') {
                gtag('event', 'phone_call', {
                    event_category: 'Contact',
                    event_label: 'Phone Call Click',
                    value: 1
                });
            }
            
            if (typeof fbq !== 'undefined') {
                fbq('track', 'Contact', {
                    content_name: 'Phone Call',
                    content_category: 'Contact'
                });
            }
            
            window.location.href = 'tel:+15598707465';
        });
    }

    // Add hover effects to service cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add hover effects to project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add loading animation for buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled) {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
            }
        });
    });

    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.service-card, .project-card, .why-card, .feature-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Back to top button functionality
    const backToTopButton = document.getElementById('backToTop');
    
    if (backToTopButton) {
        // Show/hide back to top button based on scroll position
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('show');
            } else {
                backToTopButton.classList.remove('show');
            }
        });

        // Smooth scroll to top when button is clicked
        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});

// Utility function to format phone number
function formatPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phoneNumber;
}

// Add phone number formatting to phone input
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.querySelector('input[name="phone"]');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length >= 6) {
                value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
            } else if (value.length >= 3) {
                value = value.replace(/(\d{3})(\d{3})/, '($1) $2');
            }
            this.value = value;
        });
    }
    
    // Hamburger menu functionality
    const hamburger = document.getElementById('hamburger');
    const mobileNavLinks = document.getElementById('nav-links');
    
    if (hamburger && mobileNavLinks) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            mobileNavLinks.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !mobileNavLinks.contains(e.target)) {
                hamburger.classList.remove('active');
                mobileNavLinks.classList.remove('active');
            }
        });
        
        // Close menu on window resize (if screen becomes larger)
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                hamburger.classList.remove('active');
                mobileNavLinks.classList.remove('active');
            }
        });
        
        // Close menu when clicking on nav links
        const allNavLinks = document.querySelectorAll('.nav-link');
        allNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                mobileNavLinks.classList.remove('active');
            });
        });
    }
    
    // Dropdown menu functionality
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const dropdown = this.closest('.nav-dropdown');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            // Close other dropdowns
            document.querySelectorAll('.nav-dropdown').forEach(otherDropdown => {
                if (otherDropdown !== dropdown) {
                    otherDropdown.classList.remove('active');
                }
            });
            
            // Toggle current dropdown
            dropdown.classList.toggle('active');
        });
    });
    
    // Handle smooth scrolling to sections when coming from other pages
    function handleSectionScrolling() {
        // Check if URL has a hash (like #about, #projects, #services)
        if (window.location.hash) {
            const targetId = window.location.hash.substring(1); // Remove the #
            console.log('Looking for element with ID:', targetId);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                console.log('Found target element, scrolling to:', targetId);
                // Wait for page to load, then scroll to section
                setTimeout(() => {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 100);
            } else {
                console.log('Target element not found:', targetId);
            }
        }
    }
    
    // Run on page load
    document.addEventListener('DOMContentLoaded', function() {
        handleSectionScrolling();
    });
    
    // Also run when hash changes (for single-page navigation)
    window.addEventListener('hashchange', handleSectionScrolling);
});
