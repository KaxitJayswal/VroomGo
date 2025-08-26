// Contact Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.style.display = 'none';
    successMessage.textContent = 'Your message has been sent successfully. We will get back to you soon!';
    
    if (contactForm) {
        // Insert success message before the form
        contactForm.parentNode.insertBefore(successMessage, contactForm);
        
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Reset any previous error states
            const errorElements = document.querySelectorAll('.form-group.error');
            errorElements.forEach(el => el.classList.remove('error'));
            
            const errorMessages = document.querySelectorAll('.error-message');
            errorMessages.forEach(el => el.remove());
            
            // Get form fields
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();
            
            // Validate form
            let isValid = true;
            
            // Validate name
            if (name === '') {
                showError('name', 'Please enter your name');
                isValid = false;
            }
            
            // Validate email
            if (email === '') {
                showError('email', 'Please enter your email');
                isValid = false;
            } else if (!isValidEmail(email)) {
                showError('email', 'Please enter a valid email address');
                isValid = false;
            }
            
            // Validate phone (optional)
            if (phone !== '' && !isValidPhone(phone)) {
                showError('phone', 'Please enter a valid phone number');
                isValid = false;
            }
            
            // Validate subject
            if (subject === '') {
                showError('subject', 'Please enter a subject');
                isValid = false;
            }
            
            // Validate message
            if (message === '') {
                showError('message', 'Please enter your message');
                isValid = false;
            }
            
            // If valid, submit the form (in this case, simulate submission)
            if (isValid) {
                // In a real application, you would send the data to a server
                // For demonstration, we'll just show a success message
                
                // Show success message
                successMessage.style.display = 'block';
                
                // Reset form
                contactForm.reset();
                
                // Hide success message after 5 seconds
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 5000);
            }
        });
    }
    
    // Helper function to show error
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field.parentElement;
        formGroup.classList.add('error');
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        
        formGroup.appendChild(errorMessage);
    }
    
    // Helper function to validate email
    function isValidEmail(email) {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(email);
    }
    
    // Helper function to validate phone
    function isValidPhone(phone) {
        const re = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        return re.test(phone);
    }
});
