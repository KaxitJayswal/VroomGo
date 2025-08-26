// Admin Utilities

/**
 * Sets a user as admin in the database
 * @param {string} email - The email of the user to set as admin
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
function setUserAsAdmin(email) {
    if (!email) {
        console.error('Email is required');
        return Promise.resolve(false);
    }
    
    return firebase.auth().fetchSignInMethodsForEmail(email)
        .then(methods => {
            if (methods.length === 0) {
                console.error(`No user found with email: ${email}`);
                return false;
            }
            
            // Find user by email
            return db.collection('users')
                .where('email', '==', email)
                .get()
                .then(snapshot => {
                    if (snapshot.empty) {
                        console.error(`User document not found for email: ${email}`);
                        return false;
                    }
                    
                    const userDoc = snapshot.docs[0];
                    
                    // Set user as admin
                    return db.collection('users').doc(userDoc.id).update({
                        role: 'admin',
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    })
                    .then(() => {
                        return true;
                    });
                });
        })
        .catch(error => {
            console.error('Error setting user as admin:', error);
            return false;
        });
}

/**
 * Removes admin role from a user
 * @param {string} email - The email of the admin user
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
function removeAdminRole(email) {
    if (!email) {
        console.error('Email is required');
        return Promise.resolve(false);
    }
    
    // Find user by email
    return db.collection('users')
        .where('email', '==', email)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.error(`User document not found for email: ${email}`);
                return false;
            }
            
            const userDoc = snapshot.docs[0];
            
            // Remove admin role
            return db.collection('users').doc(userDoc.id).update({
                role: 'user',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                return true;
            });
        })
        .catch(error => {
            console.error('Error removing admin role:', error);
            return false;
        });
}

/**
 * Creates a new user and sets them as admin
 * @param {string} email - The email for the new admin
 * @param {string} password - The password for the new admin
 * @param {string} displayName - The display name for the new admin
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
function createAdminUser(email, password, displayName) {
    if (!email || !password) {
        console.error('Email and password are required');
        return Promise.resolve(false);
    }
    
    // Check if user already exists
    return firebase.auth().fetchSignInMethodsForEmail(email)
        .then(methods => {
            if (methods.length > 0) {
                return setUserAsAdmin(email);
            }
            
            // Create new user
            return firebase.auth().createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                    const user = userCredential.user;
                    
                    // Set display name if provided
                    if (displayName) {
                        return user.updateProfile({
                            displayName: displayName
                        }).then(() => user);
                    }
                    
                    return user;
                })
                .then(user => {
                    // Create user document with admin role
                    return db.collection('users').doc(user.uid).set({
                        email: email,
                        name: displayName || '',
                        role: 'admin',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    })
                    .then(() => {
                        return true;
                    });
                });
        })
        .catch(error => {
            console.error('Error creating admin user:', error);
            return false;
        });
}

// Export functions for use in console
if (typeof window !== 'undefined') {
    window.adminUtils = {
        setUserAsAdmin,
        removeAdminRole,
        createAdminUser
    };
}
