// Firebase Authentication Functions

// Auth state observer
firebase.auth().onAuthStateChanged(user => {
    // Hide/show elements based on auth state
    const loggedInElements = document.querySelectorAll('.logged-in-only');
    const loggedOutElements = document.querySelectorAll('.logged-out-only');
    const authRequiredElements = document.querySelectorAll('.auth-required');
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    
    if (user) {
        // User is signed in
        
        // Show logged in elements, hide logged out elements
        loggedInElements.forEach(el => el.classList.remove('hidden'));
        loggedOutElements.forEach(el => el.classList.add('hidden'));
        authRequiredElements.forEach(el => el.classList.remove('hidden'));
        
        // Check if user is admin from database
        checkUserRole(user.uid).then(isAdmin => {
            // Handle admin elements
            if (isAdmin) {
                adminOnlyElements.forEach(el => el.classList.remove('hidden'));
            } else {
                adminOnlyElements.forEach(el => el.classList.add('hidden'));
                
                // If on admin page but not admin, redirect
                if (window.location.pathname.includes('admin.html')) {
                    window.location.href = 'index.html';
                }
            }
        });
        
        // Get user data from Firestore
        getUserData(user.uid);
        
        // If on dashboard page, load user's bookings
        if (window.location.pathname.includes('dashboard.html')) {
            fetchUserBookings(user.uid);
        }
    } else {
        // User is signed out
        
        // Show logged out elements, hide logged in elements
        loggedInElements.forEach(el => el.classList.add('hidden'));
        loggedOutElements.forEach(el => el.classList.remove('hidden'));
        authRequiredElements.forEach(el => el.classList.add('hidden'));
        adminOnlyElements.forEach(el => el.classList.add('hidden'));
        
        // If on dashboard page, redirect to login
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'login.html';
        }
    }
});

// Handle Login
function handleLogin(email, password) {
    // Validate email
    if (!window.securityUtils?.validateEmail(email)) {
        alert('Please enter a valid email address');
        return Promise.reject(new Error('Invalid email format'));
    }
    
    // Sanitize inputs
    email = window.securityUtils?.sanitizeInput(email) || email;
    
    // Rate limiting - prevent brute force attacks
    const now = new Date().getTime();
    const lastAttempt = parseInt(localStorage.getItem('lastLoginAttempt') || '0');
    const attemptCount = parseInt(localStorage.getItem('loginAttemptCount') || '0');
    
    if (now - lastAttempt < 2000 && attemptCount > 5) {  // More than 5 attempts with less than 2 sec between
        alert('Too many login attempts. Please try again later.');
        return Promise.reject(new Error('Rate limited'));
    }
    
    // Update login attempt tracking
    localStorage.setItem('lastLoginAttempt', now.toString());
    localStorage.setItem('loginAttemptCount', (attemptCount + 1).toString());
    
    // If successful login, reset attempt counter
    return firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Reset attempt counter on success
            localStorage.setItem('loginAttemptCount', '0');
            
            // Signed in successfully
            window.location.href = 'dashboard.html';
            return userCredential.user;
        })
        .catch((error) => {
            // Handle errors
            console.error('Login error:', error.message);
            alert('Login failed: ' + error.message);
            throw error;
        });
}

// Handle Sign Up
function handleSignUp(email, password, name) {
    // Validate email
    if (!window.securityUtils?.validateEmail(email)) {
        alert('Please enter a valid email address');
        return Promise.reject(new Error('Invalid email format'));
    }
    
    // Validate password
    const passwordFeedback = window.securityUtils?.getPasswordFeedback(password);
    if (passwordFeedback && !passwordFeedback.valid) {
        alert(passwordFeedback.message);
        return Promise.reject(new Error(passwordFeedback.message));
    }
    
    // Sanitize inputs
    email = window.securityUtils?.sanitizeInput(email) || email;
    name = window.securityUtils?.sanitizeInput(name) || name;
    
    return firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed up successfully
            const user = userCredential.user;
            
            // Save additional user data to Firestore
            return db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                window.location.href = 'dashboard.html';
                return user;
            });
        })
        .catch((error) => {
            // Handle errors
            console.error('Sign up error:', error.message);
            alert('Sign up failed: ' + error.message);
            throw error;
        });
}

// Handle Logout
function handleLogout() {
    return firebase.auth().signOut()
        .then(() => {
            // Sign-out successful
            window.location.href = 'index.html';
        })
        .catch((error) => {
            // Handle errors
            console.error('Logout error:', error);
            alert('Logout failed. Please try again.');
            throw error;
        });
}

// Check if a user has admin role
function checkUserRole(userId) {
    return db.collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                return userData.role === 'admin';
            }
            return false;
        })
        .catch((error) => {
            console.error('Error checking user role:', error);
            return false;
        });
}

// Get user data from Firestore
function getUserData(userId) {
    return db.collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Update UI with user data if elements exist
                const userNameElement = document.querySelector('.user-name');
                if (userNameElement) {
                    userNameElement.textContent = userData.name || firebase.auth().currentUser.email;
                }
                
                // Set user avatar with initial if possible
                const userAvatarElement = document.querySelector('.user-avatar');
                if (userAvatarElement && firebase.auth().currentUser) {
                    const user = firebase.auth().currentUser;
                    if (user.photoURL) {
                        userAvatarElement.innerHTML = `<img src="${user.photoURL}" alt="${userData.name || 'User'}" />`;
                    } else {
                        const initial = userData.name ? userData.name[0].toUpperCase() : user.email[0].toUpperCase();
                        userAvatarElement.innerHTML = `<span>${initial}</span>`;
                    }
                }
                
                return userData;
            } else {
                return null;
            }
        })
        .catch((error) => {
            console.error('Error getting user data:', error);
            return null;
        });
}

// Add event listeners once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Login form submission
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            handleLogin(email, password);
        });
    }
    
    // Sign up form submission
    const signupForm = document.getElementById('form-signup');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            handleSignUp(email, password, name);
        });
    }
    
    // Logout button click
    const logoutButtons = document.querySelectorAll('.btn-logout');
    logoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            handleLogout();
        });
    });
    
    // Toggle between login and signup forms
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');
    const loginFormContainer = document.getElementById('login-form');
    const signupFormContainer = document.getElementById('signup-form');
    
    if (switchToSignup && switchToLogin && loginFormContainer && signupFormContainer) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            loginFormContainer.classList.add('hidden');
            signupFormContainer.classList.remove('hidden');
        });
        
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            signupFormContainer.classList.add('hidden');
            loginFormContainer.classList.remove('hidden');
        });
    }
    
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (hamburger && navLinks && authButtons) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('show');
            authButtons.classList.toggle('show');
        });
    }
});
