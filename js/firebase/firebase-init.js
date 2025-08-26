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

// Disable console logs in production
if (window.location.hostname !== "localhost" && 
    window.location.hostname !== "127.0.0.1") {
    console.log = function() {};
    console.debug = function() {};
    console.info = function() {};
}
