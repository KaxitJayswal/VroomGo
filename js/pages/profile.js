// Profile Management Script

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabs = document.querySelectorAll('.profile-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(tabId + '-tab').classList.add('active');
        });
    });
    
    // Load user profile data when authenticated
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // Update profile information
            document.getElementById('profile-name').textContent = user.displayName || 'User';
            document.getElementById('profile-email').textContent = user.email;
            document.getElementById('display-name').value = user.displayName || '';
            
            // Set profile avatar
            updateProfileAvatar(user);
            
            // Get additional user data from Firestore
            loadUserData(user.uid);
        } else {
            // Redirect to login page if not authenticated
            window.location.href = 'login.html';
        }
    });
    
    // Handle profile form submission
    document.getElementById('profile-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        const user = firebase.auth().currentUser;
        if (user) {
            const displayName = document.getElementById('display-name').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const address = document.getElementById('address').value.trim();
            const photoURL = document.getElementById('photo-url').value.trim();
            
            // Validate inputs
            if (!displayName) {
                showFormError('display-name', 'Display name cannot be empty');
                resetSubmitButton(submitBtn, originalBtnText);
                return;
            }
            
            if (phone && !isValidPhone(phone)) {
                showFormError('phone', 'Please enter a valid phone number');
                resetSubmitButton(submitBtn, originalBtnText);
                return;
            }
            
            // Create activity log entry
            const activityData = {
                userId: user.uid,
                type: 'profile_update',
                title: 'Profile Updated',
                description: 'You updated your profile information.',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Update user data in batch
            const db = firebase.firestore();
            const batch = db.batch();
            
            // Update profile document
            const userRef = db.collection('users').doc(user.uid);
            batch.set(userRef, {
                name: displayName,
                phone: phone,
                address: address,
                photoURL: photoURL,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            // Add activity log
            const activityRef = db.collection('user_activity').doc();
            batch.set(activityRef, activityData);
            
            // Commit the batch
            batch.commit()
                .then(() => {
                    // Update Auth profile
                    return user.updateProfile({
                        displayName: displayName,
                        photoURL: photoURL || user.photoURL
                    });
                })
                .then(() => {
                    // Show success message
                    showSuccessMessage('profile-form', 'Profile updated successfully!');
                    
                    // Update UI
                    document.getElementById('profile-name').textContent = displayName;
                    updateProfileAvatar(user);
                    
                    // Update navbar username
                    const navbarUsername = document.querySelector('.user-profile .user-name');
                    if (navbarUsername) {
                        navbarUsername.textContent = displayName;
                    }
                    
                    // Refresh activity tab
                    loadUserActivity(user.uid);
                    
                    // Reset button
                    resetSubmitButton(submitBtn, originalBtnText);
                })
                .catch((error) => {
                    console.error("Error updating profile:", error);
                    showFormError('display-name', 'Error updating profile: ' + error.message);
                    resetSubmitButton(submitBtn, originalBtnText);
                });
        }
    });
    
    // Handle password form submission
    document.getElementById('password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validate password
        if (!currentPassword) {
            showFormError('current-password', 'Please enter your current password');
            resetSubmitButton(submitBtn, originalBtnText);
            return;
        }
        
        if (!newPassword) {
            showFormError('new-password', 'Please enter a new password');
            resetSubmitButton(submitBtn, originalBtnText);
            return;
        }
        
        if (newPassword.length < 6) {
            showFormError('new-password', 'Password must be at least 6 characters');
            resetSubmitButton(submitBtn, originalBtnText);
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showFormError('confirm-password', 'Passwords do not match');
            resetSubmitButton(submitBtn, originalBtnText);
            return;
        }
        
        const user = firebase.auth().currentUser;
        if (user) {
            // Re-authenticate user with current password
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email, 
                currentPassword
            );
            
            user.reauthenticateWithCredential(credential)
                .then(() => {
                    // User re-authenticated, now update password
                    return user.updatePassword(newPassword);
                })
                .then(() => {
                    // Record activity
                    return firebase.firestore().collection('user_activity').add({
                        userId: user.uid,
                        type: 'security_update',
                        title: 'Password Changed',
                        description: 'You changed your account password.',
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    // Show success message
                    showSuccessMessage('password-form', 'Password updated successfully!');
                    
                    // Reset form
                    document.getElementById('password-form').reset();
                    
                    // Refresh activity tab
                    loadUserActivity(user.uid);
                    
                    // Reset button
                    resetSubmitButton(submitBtn, originalBtnText);
                })
                .catch((error) => {
                    console.error("Error updating password:", error);
                    showFormError('current-password', 'Error: ' + error.message);
                    resetSubmitButton(submitBtn, originalBtnText);
                });
        }
    });
    
    // Cancel buttons functionality
    document.getElementById('cancel-profile').addEventListener('click', function() {
        // Reset form errors
        clearFormErrors();
        removeSuccessMessages();
        
        // Reload user data
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                document.getElementById('display-name').value = user.displayName || '';
                document.getElementById('photo-url').value = user.photoURL || '';
                loadUserData(user.uid);
            }
        });
    });
    
    document.getElementById('cancel-password').addEventListener('click', function() {
        // Reset form and errors
        document.getElementById('password-form').reset();
        clearFormErrors('password-form');
        removeSuccessMessages('password-form');
    });
    
    // Delete account functionality
    document.getElementById('delete-account-btn').addEventListener('click', function() {
        const confirmDelete = confirm("Warning: This action cannot be undone. All your data will be permanently deleted. Are you sure you want to delete your account?");
        
        if (confirmDelete) {
            const password = prompt("For security, please enter your password to confirm account deletion:");
            
            if (password) {
                const user = firebase.auth().currentUser;
                if (user) {
                    // Re-authenticate user
                    const credential = firebase.auth.EmailAuthProvider.credential(
                        user.email, 
                        password
                    );
                    
                    user.reauthenticateWithCredential(credential)
                        .then(() => {
                            // Delete user data from Firestore
                            const db = firebase.firestore();
                            const batch = db.batch();
                            
                            // Delete user profile
                            const userRef = db.collection('users').doc(user.uid);
                            batch.delete(userRef);
                            
                            // Delete user activities
                            return db.collection('user_activity')
                                .where('userId', '==', user.uid)
                                .get()
                                .then((snapshot) => {
                                    snapshot.forEach((doc) => {
                                        batch.delete(doc.ref);
                                    });
                                    return batch.commit();
                                });
                        })
                        .then(() => {
                            // Delete bookings
                            return firebase.firestore().collection('bookings')
                                .where('userId', '==', user.uid)
                                .get()
                                .then((snapshot) => {
                                    const batch = firebase.firestore().batch();
                                    snapshot.forEach((doc) => {
                                        batch.delete(doc.ref);
                                    });
                                    return batch.commit();
                                });
                        })
                        .then(() => {
                            // Delete user account
                            return user.delete();
                        })
                        .then(() => {
                            alert("Your account has been deleted successfully.");
                            window.location.href = '../index.html';
                        })
                        .catch((error) => {
                            console.error("Error deleting account:", error);
                            alert("Error deleting account: " + error.message);
                        });
                }
            }
        }
    });
});

// Helper Functions
function loadUserData(userId) {
    firebase.firestore().collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Fill form fields with user data
                if (userData.phone) document.getElementById('phone').value = userData.phone;
                if (userData.address) document.getElementById('address').value = userData.address;
                if (userData.photoURL) document.getElementById('photo-url').value = userData.photoURL;
                
                // Load activity data
                loadUserActivity(userId);
            }
        })
        .catch((error) => {
            console.error("Error getting user data:", error);
        });
}

function loadUserActivity(userId) {
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading activity...</div>';
    
    firebase.firestore().collection('user_activity')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                activityList.innerHTML = '<p class="no-data">No recent activity.</p>';
                return;
            }
            
            activityList.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const activity = doc.data();
                const date = activity.timestamp ? activity.timestamp.toDate() : new Date();
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                
                let iconClass = 'fas fa-info-circle';
                switch(activity.type) {
                    case 'booking':
                        iconClass = 'fas fa-car';
                        break;
                    case 'login':
                        iconClass = 'fas fa-sign-in-alt';
                        break;
                    case 'profile_update':
                        iconClass = 'fas fa-user-edit';
                        break;
                    case 'security_update':
                        iconClass = 'fas fa-shield-alt';
                        break;
                }
                
                const activityItem = `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="activity-content">
                            <h3>${activity.title}</h3>
                            <p>${activity.description}</p>
                        </div>
                        <div class="activity-date">${formattedDate}</div>
                    </div>
                `;
                
                activityList.innerHTML += activityItem;
            });
        })
        .catch((error) => {
            console.error("Error getting user activity:", error);
            activityList.innerHTML = '<p class="error-message">Error loading activity data.</p>';
        });
}

function updateProfileAvatar(user) {
    const profileAvatar = document.getElementById('profile-avatar');
    if (!profileAvatar) return;
    
    if (user.photoURL) {
        profileAvatar.innerHTML = `<img src="${user.photoURL}" alt="${user.displayName || 'User'}" onerror="this.src='../images/default-avatar.png';" />`;
    } else {
        const initials = user.displayName 
            ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
            : user.email[0].toUpperCase();
        profileAvatar.innerHTML = `<span>${initials}</span>`;
    }
}

function showFormError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const formGroup = field.parentElement;
    
    // Clear existing errors
    clearFormError(formGroup);
    
    formGroup.classList.add('error');
    
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = message;
    
    formGroup.appendChild(errorMessage);
    field.focus();
}

function clearFormError(formGroup) {
    formGroup.classList.remove('error');
    const errorMessage = formGroup.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

function clearFormErrors(formId) {
    const form = formId ? document.getElementById(formId) : document;
    const errorGroups = form.querySelectorAll('.form-group.error');
    errorGroups.forEach(group => clearFormError(group));
}

function showSuccessMessage(formId, message) {
    const form = document.getElementById(formId);
    
    // Remove existing success messages
    removeSuccessMessages(formId);
    
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    form.insertBefore(successMessage, form.firstChild);
    
    // Hide message after 5 seconds
    setTimeout(() => {
        successMessage.classList.add('fade-out');
        setTimeout(() => successMessage.remove(), 500);
    }, 5000);
}

function removeSuccessMessages(formId) {
    const form = formId ? document.getElementById(formId) : document;
    const successMessages = form.querySelectorAll('.success-message');
    successMessages.forEach(msg => msg.remove());
}

function resetSubmitButton(button, originalText) {
    button.disabled = false;
    button.textContent = originalText;
}

function isValidPhone(phone) {
    const re = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return re.test(phone);
}
