// One-time script to set up the first admin user
// Run this script by including it on a page and accessing it while logged in

document.addEventListener('DOMContentLoaded', function() {
    // Add a hidden admin setup button
    const setupButton = document.createElement('button');
    setupButton.id = 'admin-setup-button';
    setupButton.textContent = 'Setup Admin User';
    setupButton.style.position = 'fixed';
    setupButton.style.bottom = '10px';
    setupButton.style.right = '10px';
    setupButton.style.zIndex = '9999';
    setupButton.style.padding = '10px';
    setupButton.style.backgroundColor = '#3498db';
    setupButton.style.color = 'white';
    setupButton.style.border = 'none';
    setupButton.style.borderRadius = '4px';
    setupButton.style.cursor = 'pointer';
    
    document.body.appendChild(setupButton);
    
    // Add click event to setup button
    setupButton.addEventListener('click', function() {
        // Get current user
        const user = firebase.auth().currentUser;
        
        if (!user) {
            alert('Please log in first to become an admin.');
            return;
        }
        
        // Show confirmation
        if (confirm(`Make user ${user.email} an admin?`)) {
            // Get reference to user document
            const userRef = db.collection('users').doc(user.uid);
            
            // Check if user document exists
            userRef.get().then((doc) => {
                if (doc.exists) {
                    // Update existing document
                    return userRef.update({
                        role: 'admin',
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    // Create new user document with admin role
                    return userRef.set({
                        email: user.email,
                        name: user.displayName || 'Admin User',
                        role: 'admin',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            })
            .then(() => {
                alert(`User ${user.email} is now an admin! Please refresh the page.`);
                // Remove the setup button
                setupButton.remove();
            })
            .catch((error) => {
                console.error("Error setting admin role: ", error);
                alert("Error: " + error.message);
            });
        }
    });
    
    // Option to remove the button after 5 minutes for security
    setTimeout(() => {
        if (document.body.contains(setupButton)) {
            setupButton.remove();
        }
    }, 300000); // 5 minutes
});
