// Navbar functionality

document.addEventListener('DOMContentLoaded', function() {
    // Toggle hamburger menu
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            // Also toggle auth buttons if they exist
            if (authButtons && window.getComputedStyle(authButtons).display !== 'none') {
                authButtons.classList.toggle('active');
            }
        });
    }
    
    // User dropdown menu
    const userProfile = document.querySelector('.user-profile');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    
    if (userProfile) {
        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
            dropdownToggle.classList.toggle('active');
        });
        
        // Close dropdown when clicking elsewhere
        document.addEventListener('click', function() {
            if (dropdownMenu.classList.contains('show')) {
                dropdownMenu.classList.remove('show');
                dropdownToggle.classList.remove('active');
            }
        });
    }
    
    // Function to update user info in navbar
    function updateUserInfo(user) {
        const userNameElement = document.querySelector('.user-name');
        const userInitialsElement = document.querySelector('.user-avatar');
        const authButtons = document.querySelector('.auth-buttons');
        const userProfile = document.querySelector('.user-profile');
        
        if (user) {
            // User is logged in
            if (userNameElement) {
                // Display user's display name or email
                const displayName = user.displayName || user.email.split('@')[0];
                userNameElement.textContent = displayName;
            }
            
            if (userInitialsElement) {
                // Set user initials or first letter of email as avatar
                const initials = user.displayName 
                    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
                    : user.email[0].toUpperCase();
                
                // If there's no profile image, show initials
                if (!user.photoURL) {
                    userInitialsElement.innerHTML = `<span>${initials}</span>`;
                } else {
                    userInitialsElement.innerHTML = `<img src="${user.photoURL}" alt="${initials}">`;
                }
            }
            
            // Show user profile and hide login button
            if (authButtons) authButtons.style.display = 'none';
            if (userProfile) userProfile.style.display = 'flex';
        } else {
            // User is logged out
            if (authButtons) authButtons.style.display = 'flex';
            if (userProfile) userProfile.style.display = 'none';
        }
    }
    
    // Listen for auth state changes
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            updateUserInfo(user);
            
            // Handle logout button
            const logoutButtons = document.querySelectorAll('.btn-logout');
            logoutButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    firebase.auth().signOut()
                        .then(() => {
                            if (!window.location.pathname.includes('login.html')) {
                                window.location.href = window.location.pathname.includes('/pages/') 
                                    ? 'login.html' 
                                    : 'pages/login.html';
                            }
                        })
                        .catch(error => {
                            console.error('Sign out error:', error);
                        });
                });
            });
        });
    } else {
        // Firebase auth not available
    }
});
