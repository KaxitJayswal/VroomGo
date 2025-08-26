// Security Utility Functions for VroomGo

/**
 * Sanitizes input to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - The sanitized string
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Create a temporary div element
    const temp = document.createElement('div');
    // Set its content to the input string
    temp.textContent = input;
    // Return the HTML-escaped string
    return temp.innerHTML;
}

/**
 * Sanitizes an object's string properties recursively
 * @param {object} obj - The object to sanitize
 * @returns {object} - The sanitized object
 */
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const result = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            
            if (typeof value === 'string') {
                result[key] = sanitizeInput(value);
            } else if (typeof value === 'object' && value !== null) {
                result[key] = sanitizeObject(value);
            } else {
                result[key] = value;
            }
        }
    }
    
    return result;
}

/**
 * Validates email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validatePassword(password) {
    // At least 8 characters, containing lowercase, uppercase, number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
}

/**
 * Gets password strength feedback
 * @param {string} password - The password to check
 * @returns {object} - Object with valid boolean and message string
 */
function getPasswordFeedback(password) {
    if (!password) {
        return { valid: false, message: 'Password is required' };
    }
    
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters' };
    }
    
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must include at least one lowercase letter' };
    }
    
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must include at least one uppercase letter' };
    }
    
    if (!/\d/.test(password)) {
        return { valid: false, message: 'Password must include at least one number' };
    }
    
    return { valid: true, message: 'Password is strong' };
}

/**
 * Validates date format and ensures it's not in the past
 * @param {string} dateStr - The date string to validate (YYYY-MM-DD)
 * @returns {boolean} - True if valid, false otherwise
 */
function validateFutureDate(dateStr) {
    if (!dateStr) return false;
    
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day
    
    return date instanceof Date && !isNaN(date) && date >= today;
}

// Export functions
window.securityUtils = {
    sanitizeInput,
    sanitizeObject,
    validateEmail,
    validatePassword,
    getPasswordFeedback,
    validateFutureDate
};
