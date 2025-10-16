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
        console.log('Hamburger menu elements found');
        hamburger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Hamburger clicked');
            hamburger.classList.toggle('active');
            mobileNavLinks.classList.toggle('active');
            console.log('Nav links active class:', mobileNavLinks.classList.contains('active'));
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
        
        // Services dropdown functionality - REMOVED
    }
    
    // Dropdown menu functionality - REMOVED
    
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
    
    // Service Modal functionality
    const serviceModal = document.getElementById('serviceModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const modalCloseButtons = document.querySelectorAll('.modal-close');

    // Service content data
    const serviceData = {
        'residential-remodeling': {
            title: 'Residential & Commercial Remodeling',
            content: `
                <h3>Complete Home & Commercial Transformation</h3>
                <p>Transform your living and working spaces with our comprehensive remodeling services throughout <strong>Visalia</strong>, <strong>Tulare</strong>, and <strong>Hanford</strong>.</p>
                
                <h3>Residential Services</h3>
                <ul>
                    <li><strong>Kitchen Remodeling:</strong> Custom cabinets, countertops, and modern appliances</li>
                    <li><strong>Bathroom Renovations:</strong> Complete bathroom makeovers with luxury fixtures</li>
                    <li><strong>Room Additions:</strong> Expand your living space with seamless additions</li>
                    <li><strong>Interior Renovations:</strong> Flooring, painting, and interior design updates</li>
                    <li><strong>Exterior Improvements:</strong> Siding, roofing, and outdoor living spaces</li>
                </ul>
                
                <h3>Commercial Services</h3>
                <ul>
                    <li><strong>Office Build-outs:</strong> Professional office space design and construction</li>
                    <li><strong>Retail Renovations:</strong> Storefront and interior commercial updates</li>
                    <li><strong>Restaurant Construction:</strong> Complete restaurant build-outs and renovations</li>
                    <li><strong>Warehouse Improvements:</strong> Industrial space modifications and upgrades</li>
                    <li><strong>Tenant Improvements:</strong> Custom commercial space solutions</li>
                </ul>
                
                <p>Our licensed <strong>General (B)</strong> contractor team ensures all work meets local building codes and exceeds quality standards. We work closely with you from design to completion, delivering exceptional results that enhance your property value.</p>
            `
        },
        'kitchen-bathroom': {
            title: 'Kitchen & Bathroom Renovations',
            content: `
                <h3>Transform Your Most Important Spaces</h3>
                <p>Create stunning, functional kitchens and bathrooms that reflect your style and meet your family's needs throughout the <strong>Central Valley</strong>.</p>
                
                <h3>Kitchen Renovation Services</h3>
                <ul>
                    <li><strong>Custom Cabinetry:</strong> Built-to-order cabinets with premium materials</li>
                    <li><strong>Countertop Installation:</strong> Granite, quartz, marble, and butcher block options</li>
                    <li><strong>Appliance Integration:</strong> Professional installation of modern appliances</li>
                    <li><strong>Electrical Updates:</strong> Code-compliant electrical work for new appliances</li>
                    <li><strong>Plumbing Services:</strong> Updated plumbing for sinks, dishwashers, and garbage disposals</li>
                    <li><strong>Lighting Design:</strong> Task, ambient, and accent lighting solutions</li>
                </ul>
                
                <h3>Bathroom Renovation Services</h3>
                <ul>
                    <li><strong>Luxury Fixtures:</strong> High-end toilets, sinks, and faucets</li>
                    <li><strong>Shower & Tub Installation:</strong> Walk-in showers, soaking tubs, and steam rooms</li>
                    <li><strong>Tile Work:</strong> Custom tile design for floors, walls, and backsplashes</li>
                    <li><strong>Vanity Installation:</strong> Custom vanities with storage solutions</li>
                    <li><strong>Ventilation Systems:</strong> Proper ventilation for moisture control</li>
                    <li><strong>Accessibility Features:</strong> ADA-compliant bathroom modifications</li>
                </ul>
                
                <p>Our experienced team handles every aspect of your renovation, from initial design consultation to final cleanup. We ensure minimal disruption to your daily routine while delivering exceptional craftsmanship.</p>
            `
        },
        'wood-repair': {
            title: 'Wood Repair & Framing',
            content: `
                <h3>Expert Structural Repairs & Custom Framing</h3>
                <p>Professional wood repair and framing services for all your construction needs with expert craftsmanship in <strong>Fresno County</strong> and <strong>Kings County</strong>.</p>
                
                <h3>Wood Repair Services</h3>
                <ul>
                    <li><strong>Structural Repairs:</strong> Foundation repairs, beam replacement, and load-bearing fixes</li>
                    <li><strong>Water Damage Restoration:</strong> Repair and replace water-damaged wood structures</li>
                    <li><strong>Termite Damage Repair:</strong> Restore structural integrity after termite damage</li>
                    <li><strong>Deck & Patio Repairs:</strong> Fix loose boards, railings, and structural issues</li>
                    <li><strong>Window & Door Frames:</strong> Repair and replace damaged door and window frames</li>
                    <li><strong>Custom Millwork:</strong> Matching existing trim, molding, and architectural details</li>
                </ul>
                
                <h3>Framing Services</h3>
                <ul>
                    <li><strong>New Construction Framing:</strong> Complete structural framing for new builds</li>
                    <li><strong>Room Additions:</strong> Framing for home and commercial additions</li>
                    <li><strong>Wall Modifications:</strong> Remove, add, or modify interior walls</li>
                    <li><strong>Roof Framing:</strong> Custom roof structures and modifications</li>
                    <li><strong>Commercial Framing:</strong> Office partitions and commercial space framing</li>
                    <li><strong>Permit Assistance:</strong> Help with building permits and inspections</li>
                </ul>
                
                <p>Our skilled craftsmen use premium materials and proven techniques to ensure your wood structures are safe, durable, and built to last. We work with both residential and commercial clients to meet all framing and repair needs.</p>
            `
        },
        'ev-charger': {
            title: 'EV Charger Installation',
            content: `
                <h3>Professional EV Charging Station Installation</h3>
                <p>Professional <strong>EV charging station installation</strong> for your home or business with SCE program benefits. Licensed <strong>electrical contractor</strong> services throughout the Central Valley.</p>
                
                <h3>Residential EV Charger Services</h3>
                <ul>
                    <li><strong>Level 2 Home Chargers:</strong> Fast, efficient home charging solutions</li>
                    <li><strong>Smart Charger Installation:</strong> WiFi-enabled chargers with mobile app control</li>
                    <li><strong>Electrical Panel Upgrades:</strong> Ensure your panel can handle EV charging load</li>
                    <li><strong>Dedicated Circuits:</strong> Proper electrical circuits for safe charging</li>
                    <li><strong>Permit & Inspection:</strong> Handle all permits and electrical inspections</li>
                    <li><strong>SCE Rebate Programs:</strong> Help you qualify for Southern California Edison rebates</li>
                </ul>
                
                <h3>Commercial EV Charger Services</h3>
                <ul>
                    <li><strong>Multi-Station Installations:</strong> Multiple charging stations for businesses</li>
                    <li><strong>Public Charging Stations:</strong> Commercial-grade charging infrastructure</li>
                    <li><strong>Load Management:</strong> Smart systems to manage electrical load</li>
                    <li><strong>Payment Systems:</strong> Integrated payment and access control</li>
                    <li><strong>Maintenance Programs:</strong> Ongoing service and maintenance plans</li>
                    <li><strong>Compliance:</strong> Meet all local and state regulations</li>
                </ul>
                
                <h3>Why Choose DNA Contracting?</h3>
                <ul>
                    <li><strong>Licensed C-10 Electrical Contractor</strong> with specialized EV training</li>
                    <li><strong>SCE Authorized Installer</strong> for rebate programs</li>
                    <li><strong>Code Compliance:</strong> All installations meet current electrical codes</li>
                    <li><strong>Warranty Coverage:</strong> Comprehensive warranty on all work</li>
                    <li><strong>Fast Installation:</strong> Most installations completed in one day</li>
                </ul>
                
                <p>Make the switch to electric vehicles seamless with our professional installation services. We'll help you choose the right charger for your needs and ensure a safe, efficient installation.</p>
            `
        },
        'building-electrification': {
            title: 'Building Electrification',
            content: `
                <h3>Upgrade to Efficient Electrical Systems</h3>
                <p>Upgrade to efficient electrical systems through authorized SGIP programs and modern technology. <strong>Electrical contractor</strong> expertise for residential and commercial properties.</p>
                
                <h3>Electrification Services</h3>
                <ul>
                    <li><strong>Electric Vehicle Infrastructure:</strong> EV charging stations and electrical upgrades</li>
                    <li><strong>Heat Pump Installation:</strong> Electric heat pumps for heating and cooling</li>
                    <li><strong>Electric Water Heaters:</strong> High-efficiency electric water heating systems</li>
                    <li><strong>Solar Integration:</strong> Electrical systems for solar panel integration</li>
                    <li><strong>Battery Storage Systems:</strong> Home and commercial battery storage solutions</li>
                    <li><strong>Smart Home Integration:</strong> Connected electrical systems and automation</li>
                </ul>
                
                <h3>SGIP Program Benefits</h3>
                <ul>
                    <li><strong>Rebate Programs:</strong> Access to Self-Generation Incentive Program rebates</li>
                    <li><strong>Energy Storage Incentives:</strong> Financial incentives for battery storage</li>
                    <li><strong>EV Charging Rebates:</strong> Additional rebates for EV infrastructure</li>
                    <li><strong>Utility Partnerships:</strong> Work with local utilities for maximum savings</li>
                    <li><strong>Application Assistance:</strong> Help with rebate applications and paperwork</li>
                </ul>
                
                <h3>Why Electrify Your Building?</h3>
                <ul>
                    <li><strong>Energy Efficiency:</strong> Reduce energy costs with modern electric systems</li>
                    <li><strong>Environmental Benefits:</strong> Lower carbon footprint and cleaner energy</li>
                    <li><strong>Future-Proofing:</strong> Prepare for the electric future</li>
                    <li><strong>Increased Property Value:</strong> Modern electrical systems add value</li>
                    <li><strong>Reliability:</strong> More reliable than gas-powered systems</li>
                </ul>
                
                <p>Our licensed electrical team specializes in building electrification projects, helping you take advantage of rebate programs while upgrading to efficient, modern electrical systems.</p>
            `
        },
        'electrical-panel': {
            title: 'Electrical Panel Upgrades',
            content: `
                <h3>Safe, Code-Compliant Electrical Panel Upgrades</h3>
                <p>Safe, code-compliant <strong>electrical panel upgrades</strong> for future power needs and expansion. Licensed <strong>C-10 electrical contractor</strong> serving the Central Valley.</p>
                
                <h3>Panel Upgrade Services</h3>
                <ul>
                    <li><strong>Service Upgrades:</strong> Upgrade from 100A to 200A or 400A service</li>
                    <li><strong>Panel Replacement:</strong> Replace outdated or damaged electrical panels</li>
                    <li><strong>Circuit Breaker Installation:</strong> Install new circuit breakers and safety devices</li>
                    <li><strong>Ground Fault Protection:</strong> Install GFCI and AFCI protection</li>
                    <li><strong>Sub-Panel Installation:</strong> Add sub-panels for additional circuits</li>
                    <li><strong>Emergency Power:</strong> Install transfer switches for generators</li>
                </ul>
                
                <h3>When to Upgrade Your Panel</h3>
                <ul>
                    <li><strong>Frequent Breaker Trips:</strong> Circuit breakers constantly tripping</li>
                    <li><strong>Adding New Appliances:</strong> EV chargers, hot tubs, or major appliances</li>
                    <li><strong>Home Additions:</strong> Expanding your living space</li>
                    <li><strong>Outdated Equipment:</strong> Old fuse boxes or outdated panels</li>
                    <li><strong>Safety Concerns:</strong> Burning smells or electrical issues</li>
                    <li><strong>Code Compliance:</strong> Meeting current electrical codes</li>
                </ul>
                
                <h3>Our Process</h3>
                <ul>
                    <li><strong>Free Assessment:</strong> Evaluate your current electrical system</li>
                    <li><strong>Permit Application:</strong> Handle all necessary permits and inspections</li>
                    <li><strong>Professional Installation:</strong> Licensed electricians perform the work</li>
                    <li><strong>Code Compliance:</strong> Ensure all work meets current codes</li>
                    <li><strong>Testing & Inspection:</strong> Thorough testing and utility inspection</li>
                    <li><strong>Warranty Coverage:</strong> Comprehensive warranty on all work</li>
                </ul>
                
                <p>Don't let an outdated electrical panel limit your home's potential. Our experienced team will safely upgrade your electrical system to meet your current and future needs.</p>
            `
        },
        'hvac': {
            title: 'C-20 HVAC Services',
            content: `
                <h3>Professional HVAC Installation, Repair & Maintenance</h3>
                <p>Professional <strong>HVAC installation</strong>, repair, and maintenance services. Licensed <strong>C-20 HVAC contractor</strong> serving the <strong>Central Valley</strong> with expert heating and cooling solutions.</p>
                
                <h3>HVAC Installation Services</h3>
                <ul>
                    <li><strong>Central Air Systems:</strong> Complete AC installation and replacement</li>
                    <li><strong>Heating Systems:</strong> Furnace installation and heat pump systems</li>
                    <li><strong>Ductwork Installation:</strong> New ductwork design and installation</li>
                    <li><strong>Zoned Systems:</strong> Multi-zone temperature control systems</li>
                    <li><strong>Energy Efficient Units:</strong> High-efficiency HVAC systems</li>
                    <li><strong>Commercial HVAC:</strong> Large-scale commercial installations</li>
                </ul>
                
                <h3>HVAC Repair Services</h3>
                <ul>
                    <li><strong>Emergency Repairs:</strong> 24/7 emergency HVAC repair service</li>
                    <li><strong>AC Repair:</strong> Air conditioning troubleshooting and repair</li>
                    <li><strong>Heating Repair:</strong> Furnace and heat pump repair services</li>
                    <li><strong>Ductwork Repair:</strong> Fix leaks and improve airflow</li>
                    <li><strong>Thermostat Issues:</strong> Smart thermostat installation and repair</li>
                    <li><strong>Refrigerant Services:</strong> Leak detection and refrigerant recharge</li>
                </ul>
                
                <h3>Maintenance Programs</h3>
                <ul>
                    <li><strong>Seasonal Tune-ups:</strong> Spring and fall maintenance checks</li>
                    <li><strong>Filter Replacement:</strong> Regular air filter changes</li>
                    <li><strong>System Cleaning:</strong> Duct cleaning and system sanitization</li>
                    <li><strong>Performance Testing:</strong> Efficiency and safety testing</li>
                    <li><strong>Preventive Maintenance:</strong> Catch issues before they become problems</li>
                    <li><strong>Priority Service:</strong> Priority scheduling for maintenance customers</li>
                </ul>
                
                <h3>Why Choose Our HVAC Services?</h3>
                <ul>
                    <li><strong>Licensed C-20 Contractor:</strong> Fully licensed and insured HVAC contractor</li>
                    <li><strong>Certified Technicians:</strong> NATE-certified HVAC technicians</li>
                    <li><strong>Quality Brands:</strong> Work with top HVAC manufacturers</li>
                    <li><strong>Energy Efficiency:</strong> Focus on energy-efficient solutions</li>
                    <li><strong>Warranty Coverage:</strong> Comprehensive warranty on all work</li>
                    <li><strong>Local Expertise:</strong> Deep knowledge of Central Valley climate needs</li>
                </ul>
                
                <p>Keep your home comfortable year-round with our professional HVAC services. From installation to maintenance, we ensure your heating and cooling systems operate efficiently and reliably.</p>
            `
        },
        'commercial-construction': {
            title: 'Commercial Construction',
            content: `
                <h3>Full-Service Commercial Construction</h3>
                <p>Full-service <strong>commercial construction</strong> including tenant improvements, office build-outs, and retail renovations throughout <strong>Visalia</strong>, <strong>Tulare</strong>, and <strong>Hanford</strong>.</p>
                
                <h3>Commercial Construction Services</h3>
                <ul>
                    <li><strong>Office Build-outs:</strong> Complete office space design and construction</li>
                    <li><strong>Retail Renovations:</strong> Storefront and interior commercial updates</li>
                    <li><strong>Restaurant Construction:</strong> Full-service restaurant build-outs</li>
                    <li><strong>Warehouse Improvements:</strong> Industrial space modifications</li>
                    <li><strong>Medical Facilities:</strong> Healthcare facility construction and renovation</li>
                    <li><strong>Educational Buildings:</strong> School and university construction projects</li>
                </ul>
                
                <h3>Tenant Improvement Services</h3>
                <ul>
                    <li><strong>Space Planning:</strong> Optimize layout for maximum efficiency</li>
                    <li><strong>Interior Design:</strong> Professional interior design services</li>
                    <li><strong>Electrical Work:</strong> Commercial electrical installations and upgrades</li>
                    <li><strong>Plumbing Services:</strong> Commercial plumbing and restroom installations</li>
                    <li><strong>HVAC Systems:</strong> Commercial heating and cooling solutions</li>
                    <li><strong>Flooring Installation:</strong> Commercial-grade flooring options</li>
                </ul>
                
                <h3>Project Management</h3>
                <ul>
                    <li><strong>Pre-Construction:</strong> Planning, design, and permit assistance</li>
                    <li><strong>Project Coordination:</strong> Manage all trades and subcontractors</li>
                    <li><strong>Timeline Management:</strong> Keep projects on schedule and on budget</li>
                    <li><strong>Quality Control:</strong> Ensure all work meets commercial standards</li>
                    <li><strong>Code Compliance:</strong> Meet all local building codes and regulations</li>
                    <li><strong>Final Inspections:</strong> Coordinate with building inspectors</li>
                </ul>
                
                <h3>Why Choose DNA Contracting?</h3>
                <ul>
                    <li><strong>Licensed General (B) Contractor:</strong> Fully licensed for commercial work</li>
                    <li><strong>Experienced Team:</strong> Skilled craftsmen and project managers</li>
                    <li><strong>Local Knowledge:</strong> Deep understanding of local codes and requirements</li>
                    <li><strong>Quality Materials:</strong> Use only commercial-grade materials</li>
                    <li><strong>Timely Completion:</strong> Meet deadlines without compromising quality</li>
                    <li><strong>Warranty Coverage:</strong> Comprehensive warranty on all commercial work</li>
                </ul>
                
                <p>Transform your commercial space with our professional construction services. We handle everything from initial design to final walkthrough, ensuring your project exceeds expectations.</p>
            `
        }
    };

    // Add event listeners to service learn more buttons
    const serviceButtons = document.querySelectorAll('.service-learn-more');
    
    serviceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const serviceType = this.getAttribute('data-service');
            openServiceModal(serviceType);
        });
    });
    
    // Add event listeners to close buttons
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', closeServiceModal);
    });
    
    // Close modal when clicking overlay
    if (serviceModal) {
        serviceModal.addEventListener('click', function(e) {
            if (e.target === serviceModal || e.target.classList.contains('modal-overlay')) {
                closeServiceModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && serviceModal && serviceModal.classList.contains('active')) {
            closeServiceModal();
        }
    });

    function openServiceModal(serviceType) {
        const service = serviceData[serviceType];
        if (service && modalTitle && modalContent && serviceModal) {
            modalTitle.textContent = service.title;
            modalContent.innerHTML = service.content;
            serviceModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    function closeServiceModal() {
        if (serviceModal) {
            serviceModal.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        }
    }
});
