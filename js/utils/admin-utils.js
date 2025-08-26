// Add this code to your Firebase initialization file or create a new file
// This will help you add admin roles to users from the Firebase console

// Function to set a user as admin
function setUserAsAdmin(userId) {
  // Get a reference to the user document
  const userRef = db.collection('users').doc(userId);
  
  // Update the user's role to 'admin'
  return userRef.update({
    role: 'admin',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    console.log(`User ${userId} has been promoted to admin`);
    return true;
  })
  .catch((error) => {
    console.error("Error setting admin role: ", error);
    return false;
  });
}

// Function to remove admin role from a user
function removeAdminRole(userId) {
  // Get a reference to the user document
  const userRef = db.collection('users').doc(userId);
  
  // Update the user's role to 'user'
  return userRef.update({
    role: 'user',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    console.log(`Admin role removed from user ${userId}`);
    return true;
  })
  .catch((error) => {
    console.error("Error removing admin role: ", error);
    return false;
  });
}

// Function to check if a user is an admin
function isUserAdmin(userId) {
  // Get a reference to the user document
  return db.collection('users').doc(userId).get()
    .then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        return userData.role === 'admin';
      }
      return false;
    })
    .catch((error) => {
      console.error("Error checking admin status: ", error);
      return false;
    });
}

// How to use:
// 1. In Firebase Console, find the user's UID from Authentication section
// 2. Open browser console on your website (when logged in as admin)
// 3. Run: setUserAsAdmin('user-uid-here')
// 4. Check in Firestore if the user document has role: 'admin'
