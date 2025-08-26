// Firebase Configuration
// WARNING: In a production environment, these values should be stored in environment variables
// For GitHub deployment, restrict your Firebase project's API key in the Firebase Console
// by setting up Application restrictions (domain restrictions)

const firebaseConfig = {
    apiKey: "AIzaSyCVgXlDAHCN9XevmgXoFNr_5NbY4RHR-6c",
    authDomain: "vroomgo-805f5.firebaseapp.com",
    projectId: "vroomgo-805f5",
    storageBucket: "vroomgo-805f5.firebasestorage.app",
    messagingSenderId: "378913538694",
    appId: "1:378913538694:web:0ccd5d80402dc708e04707"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Initialize security utils if not already defined
if (!window.securityUtils) {
    console.warn('Security utilities not loaded. Using fallback security methods.');
    window.securityUtils = {
        validateEmail: (email) => {
            const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return re.test(String(email).toLowerCase());
        },
        sanitizeInput: (input) => {
            if (typeof input !== 'string') return input;
            const temp = document.createElement('div');
            temp.textContent = input;
            return temp.innerHTML;
        },
        getPasswordFeedback: (password) => {
            if (password && password.length >= 6) {
                return { valid: true };
            }
            return { valid: false, message: 'Password must be at least 6 characters long' };
        }
    };
}

// Disable console logs in production
if (window.location.hostname !== "localhost" && 
    window.location.hostname !== "127.0.0.1") {
    console.log = function() {};
    console.debug = function() {};
    console.info = function() {};
}
