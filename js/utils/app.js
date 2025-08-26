// Main Application JavaScript

// Check if a user is authenticated
function isAuthenticated() {
    return firebase.auth().currentUser !== null;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

// Format date
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

// Calculate days between two dates
function calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end - start;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
}

// Initialize mobile menu
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (hamburger && navLinks && authButtons) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('show');
            authButtons.classList.toggle('show');
            hamburger.classList.toggle('active');
        });
    }
}

// Initialize date inputs
function initDateInputs() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    
    dateInputs.forEach(input => {
        // Set min date to today
        const today = new Date().toISOString().split('T')[0];
        input.min = today;
        
        // For end date, ensure it's after start date
        if (input.id === 'end-date') {
            const startDateInput = document.getElementById('start-date');
            if (startDateInput) {
                startDateInput.addEventListener('change', () => {
                    input.min = startDateInput.value;
                    if (input.value && new Date(input.value) < new Date(startDateInput.value)) {
                        input.value = startDateInput.value;
                    }
                });
            }
        }
    });
}

// Add event listeners once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI elements
    initMobileMenu();
    initDateInputs();
    
    // Check for specific page functionality
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path.endsWith('/')) {
        console.log('Home page loaded');
        // Home page specific code (if needed beyond what's in firestore.js)
    } else if (path.includes('dashboard.html')) {
        console.log('Dashboard page loaded');
        // Dashboard specific code (if needed beyond what's in firestore.js)
    } else if (path.includes('login.html')) {
        console.log('Login page loaded');
        // Login page specific code (if needed beyond what's in firebase-auth.js)
    }
});
