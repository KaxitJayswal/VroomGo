// Admin Panel JavaScript

// Global variables
let adminUser = null;
let currentActionItem = null;
let vehicles = [];
let bookings = [];
let users = [];

// Admin access will be checked from Firestore database
// Admin users will have role = "admin" in their user document

// Initialize admin page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin page loaded');
    
    // Check if the current user is an admin
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log('User is logged in:', user.email);
            // Check if user has admin role in Firestore
            checkAdminRole(user);
        } else {
            // No user is logged in
            console.log('No user is logged in');
            hideAdminDashboard();
        }
    });
    
    // Admin login form submission
    document.getElementById('admin-login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('admin-login-email').value;
        const password = document.getElementById('admin-login-password').value;
        
        // Clear previous error
        document.getElementById('admin-login-error').textContent = '';
        document.getElementById('admin-login-error').classList.add('hidden');
        
        // Attempt login
        firebase.auth().signInWithEmailAndPassword(email, password)
            .catch((error) => {
                console.error('Login error:', error);
                document.getElementById('admin-login-error').textContent = error.message;
                document.getElementById('admin-login-error').classList.remove('hidden');
            });
    });
    
    // Setup navigation between admin sections
    setupAdminNavigation();
    
    // Setup modals
    setupModals();
    
    // Setup form handlers
    setupVehicleForm();
    
    // Setup search and filters
    setupSearchAndFilters();
});

// Check if user has admin role in Firestore
function checkAdminRole(user) {
    // Add a delay on failed attempts to prevent brute forcing
    let failedAttempts = parseInt(sessionStorage.getItem('adminLoginFailedAttempts') || '0');
    
    db.collection('users').doc(user.uid).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                if (userData.role === 'admin') {
                    // User has admin role
                    adminUser = user;
                    
                    // Reset failed attempts
                    sessionStorage.setItem('adminLoginFailedAttempts', '0');
                    
                    // Update user name in navbar instead of the old admin-email element
                    const userNameElement = document.querySelector('.user-name');
                    if (userNameElement) {
                        userNameElement.textContent = user.email || 'Admin';
                    }
                    
                    showAdminDashboard();
                    loadAllData();
                } else {
                    // User doesn't have admin role
                    handleAdminLoginFailure('You do not have admin privileges');
                }
            } else {
                // User document doesn't exist
                handleAdminLoginFailure('User account not found');
            }
        })
        .catch((error) => {
            console.error('Error checking admin role:', error);
            handleAdminLoginFailure('Error verifying admin status');
        });
}

// Handle failed admin login attempts
function handleAdminLoginFailure(message) {
    let failedAttempts = parseInt(sessionStorage.getItem('adminLoginFailedAttempts') || '0');
    failedAttempts++;
    sessionStorage.setItem('adminLoginFailedAttempts', failedAttempts.toString());
    
    document.getElementById('admin-login-error').textContent = message;
    document.getElementById('admin-login-error').classList.remove('hidden');
    
    // Add increasing delay for subsequent failed attempts
    const delay = Math.min(failedAttempts * 1000, 5000); // Cap at 5 seconds
    
    setTimeout(() => {
        firebase.auth().signOut();
    }, delay);
}

// Show admin dashboard, hide login
function showAdminDashboard() {
    document.getElementById('admin-login-container').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    
    // Show admin-only elements
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = 'block';
    });
}

// Hide admin dashboard, show login
function hideAdminDashboard() {
    document.getElementById('admin-login-container').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
    
    // Hide admin-only elements
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = 'none';
    });
}

// Load all data from Firestore
function loadAllData() {
    loadVehicles();
    loadBookings();
    loadUsers();
    loadReportData();
}

// Setup admin navigation
function setupAdminNavigation() {
    const menuItems = document.querySelectorAll('.admin-menu-item');
    const sections = document.querySelectorAll('.admin-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active menu item
            menuItems.forEach(btn => btn.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding section
            const sectionId = item.getAttribute('data-section');
            sections.forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`${sectionId}-section`).classList.add('active');
        });
    });
}

// Setup modals
function setupModals() {
    // Vehicle modal
    const vehicleModal = document.getElementById('vehicle-modal');
    const addVehicleBtn = document.getElementById('add-vehicle-btn');
    const closeVehicleModal = document.getElementById('close-vehicle-modal');
    const cancelVehicleBtn = document.getElementById('cancel-vehicle-btn');
    
    addVehicleBtn.addEventListener('click', () => {
        resetVehicleForm();
        document.getElementById('vehicle-modal-title').textContent = 'Add New Vehicle';
        vehicleModal.style.display = 'block';
    });
    
    closeVehicleModal.addEventListener('click', () => {
        vehicleModal.style.display = 'none';
    });
    
    cancelVehicleBtn.addEventListener('click', () => {
        vehicleModal.style.display = 'none';
    });
    
    // Booking details modal
    const bookingDetailsModal = document.getElementById('booking-details-modal');
    const closeBookingDetails = document.getElementById('close-booking-details');
    
    closeBookingDetails.addEventListener('click', () => {
        bookingDetailsModal.style.display = 'none';
    });
    
    // User role modal
    const userRoleModal = document.getElementById('user-role-modal');
    const closeUserRoleModal = document.getElementById('close-user-role-modal');
    const cancelRoleBtn = document.getElementById('cancel-role-btn');
    const userRoleForm = document.getElementById('user-role-form');
    
    closeUserRoleModal.addEventListener('click', () => {
        userRoleModal.style.display = 'none';
    });
    
    cancelRoleBtn.addEventListener('click', () => {
        userRoleModal.style.display = 'none';
    });
    
    userRoleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userId = document.getElementById('edit-user-id').value;
        const role = document.getElementById('user-role').value;
        
        updateUserRole(userId, role);
    });
    
    // Confirmation modal
    const confirmModal = document.getElementById('confirm-modal');
    const closeConfirmModal = document.getElementById('close-confirm-modal');
    const cancelConfirmBtn = document.getElementById('cancel-confirm-btn');
    
    closeConfirmModal.addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });
    
    cancelConfirmBtn.addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === vehicleModal) {
            vehicleModal.style.display = 'none';
        }
        if (event.target === bookingDetailsModal) {
            bookingDetailsModal.style.display = 'none';
        }
        if (event.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
        if (event.target === userRoleModal) {
            userRoleModal.style.display = 'none';
        }
    });
    
    // Setup booking action buttons
    document.getElementById('cancel-booking-btn').addEventListener('click', () => {
        if (currentActionItem) {
            showConfirmationModal(
                'Cancel Booking',
                `Are you sure you want to cancel booking #${currentActionItem.id.substring(0, 8)}?`,
                () => updateBookingStatus(currentActionItem.id, 'cancelled')
            );
        }
    });
    
    document.getElementById('confirm-booking-btn').addEventListener('click', () => {
        if (currentActionItem) {
            updateBookingStatus(currentActionItem.id, 'confirmed');
        }
    });
    
    document.getElementById('complete-booking-btn').addEventListener('click', () => {
        if (currentActionItem) {
            updateBookingStatus(currentActionItem.id, 'completed');
        }
    });
    
    // Confirmation modal proceed button
    document.getElementById('proceed-confirm-btn').addEventListener('click', () => {
        if (typeof currentActionCallback === 'function') {
            currentActionCallback();
        }
        confirmModal.style.display = 'none';
    });
}

// Vehicle form setup and handling
function setupVehicleForm() {
    const vehicleForm = document.getElementById('vehicle-form');
    const imageUrlInput = document.getElementById('vehicle-image');
    const imagePreview = document.getElementById('image-preview');
    
    // Image preview on URL input
    imageUrlInput.addEventListener('input', () => {
        const imageUrl = imageUrlInput.value.trim();
        if (imageUrl) {
            imagePreview.src = imageUrl;
            imagePreview.style.display = 'block';
        } else {
            imagePreview.src = '';
            imagePreview.style.display = 'none';
        }
    });
    
    // Handle form submission
    vehicleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const vehicleId = document.getElementById('edit-vehicle-id').value;
        const vehicleName = document.getElementById('vehicle-name').value;
        const vehicleType = document.getElementById('vehicle-type').value;
        const pricePerDay = parseFloat(document.getElementById('vehicle-price').value);
        const seats = parseInt(document.getElementById('vehicle-seats').value);
        const transmission = document.getElementById('vehicle-transmission').value;
        const fuel = document.getElementById('vehicle-fuel').value;
        const luggage = parseInt(document.getElementById('vehicle-luggage').value) || 0;
        const mileage = document.getElementById('vehicle-mileage').value;
        const imageUrl = document.getElementById('vehicle-image').value;
        const description = document.getElementById('vehicle-description').value;
        const featuresInput = document.getElementById('vehicle-features').value;
        const status = document.querySelector('input[name="vehicle-status"]:checked').value;
        
        // Parse features from comma-separated list
        const features = featuresInput.split(',')
            .map(feature => feature.trim())
            .filter(feature => feature.length > 0);
        
        // Create vehicle object
        const vehicle = {
            vehicleName,
            type: vehicleType,
            pricePerDay,
            seats,
            transmission,
            fuel,
            luggage,
            mileage,
            imageUrl,
            description,
            features,
            status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // If this is a new vehicle, add createdAt field
        if (!vehicleId) {
            vehicle.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        // Save to Firestore
        saveVehicle(vehicleId, vehicle);
    });
}

// Reset vehicle form
function resetVehicleForm() {
    document.getElementById('vehicle-form').reset();
    document.getElementById('edit-vehicle-id').value = '';
    document.getElementById('image-preview').src = '';
    document.getElementById('image-preview').style.display = 'none';
}

// Save vehicle to Firestore
function saveVehicle(vehicleId, vehicleData) {
    const vehicleModal = document.getElementById('vehicle-modal');
    
    if (vehicleId) {
        // Update existing vehicle
        db.collection("vehicles").doc(vehicleId).update(vehicleData)
            .then(() => {
                console.log("Vehicle updated successfully");
                vehicleModal.style.display = 'none';
                loadVehicles(); // Refresh the vehicles list
            })
            .catch((error) => {
                console.error("Error updating vehicle: ", error);
                alert("Error updating vehicle: " + error.message);
            });
    } else {
        // Add new vehicle
        db.collection("vehicles").add(vehicleData)
            .then((docRef) => {
                console.log("Vehicle added with ID: ", docRef.id);
                vehicleModal.style.display = 'none';
                loadVehicles(); // Refresh the vehicles list
            })
            .catch((error) => {
                console.error("Error adding vehicle: ", error);
                alert("Error adding vehicle: " + error.message);
            });
    }
}

// Delete a vehicle
function deleteVehicle(vehicleId) {
    // First check if there are any bookings for this vehicle
    db.collection("bookings")
        .where("vehicleId", "==", vehicleId)
        .limit(1)
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                alert("Cannot delete vehicle with existing bookings. Consider marking it as inactive instead.");
                return;
            }
            
            // No bookings, proceed with deletion
            db.collection("vehicles").doc(vehicleId).delete()
                .then(() => {
                    console.log("Vehicle deleted successfully");
                    loadVehicles(); // Refresh the vehicles list
                })
                .catch((error) => {
                    console.error("Error deleting vehicle: ", error);
                    alert("Error deleting vehicle: " + error.message);
                });
        })
        .catch((error) => {
            console.error("Error checking bookings: ", error);
            alert("Error checking bookings: " + error.message);
        });
}

// Load vehicles from Firestore
function loadVehicles() {
    const tableBody = document.getElementById('vehicles-table-body');
    tableBody.innerHTML = '<tr class="loading-row"><td colspan="6">Loading vehicles...</td></tr>';
    
    db.collection("vehicles").get()
        .then((querySnapshot) => {
            vehicles = [];
            querySnapshot.forEach((doc) => {
                const vehicle = doc.data();
                vehicle.id = doc.id;
                vehicles.push(vehicle);
            });
            
            displayVehicles(vehicles);
            updateReportData();
        })
        .catch((error) => {
            console.error("Error loading vehicles: ", error);
            tableBody.innerHTML = `<tr><td colspan="6">Error loading vehicles: ${error.message}</td></tr>`;
        });
}

// Display vehicles in the table
function displayVehicles(vehiclesList) {
    const tableBody = document.getElementById('vehicles-table-body');
    
    if (vehiclesList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No vehicles found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = vehiclesList.map(vehicle => {
        const statusClass = `status-${vehicle.status || 'available'}`;
        
        return `
            <tr data-id="${vehicle.id}">
                <td>
                    <img src="${vehicle.imageUrl || ''}" alt="${vehicle.vehicleName}" class="table-image" crossorigin="anonymous">
                </td>
                <td>${vehicle.vehicleName || 'Unnamed Vehicle'}</td>
                <td>${capitalizeFirstLetter(vehicle.type) || 'N/A'}</td>
                <td>$${vehicle.pricePerDay || 0}/day</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${capitalizeFirstLetter(vehicle.status || 'available')}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="editVehicle('${vehicle.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="confirmDeleteVehicle('${vehicle.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Edit vehicle
function editVehicle(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    // Set form values
    document.getElementById('edit-vehicle-id').value = vehicleId;
    document.getElementById('vehicle-name').value = vehicle.vehicleName || '';
    document.getElementById('vehicle-type').value = vehicle.type || 'sedan';
    document.getElementById('vehicle-price').value = vehicle.pricePerDay || 0;
    document.getElementById('vehicle-seats').value = vehicle.seats || 5;
    document.getElementById('vehicle-transmission').value = vehicle.transmission || 'automatic';
    document.getElementById('vehicle-fuel').value = vehicle.fuel || 'gasoline';
    document.getElementById('vehicle-luggage').value = vehicle.luggage || 0;
    document.getElementById('vehicle-mileage').value = vehicle.mileage || 'Unlimited';
    document.getElementById('vehicle-image').value = vehicle.imageUrl || '';
    document.getElementById('vehicle-description').value = vehicle.description || '';
    document.getElementById('vehicle-features').value = (vehicle.features || []).join(', ');
    
    // Set status radio button
    const statusRadio = document.querySelector(`input[name="vehicle-status"][value="${vehicle.status || 'available'}"]`);
    if (statusRadio) statusRadio.checked = true;
    
    // Update image preview
    const imagePreview = document.getElementById('image-preview');
    if (vehicle.imageUrl) {
        imagePreview.src = vehicle.imageUrl;
        imagePreview.style.display = 'block';
    } else {
        imagePreview.src = '';
        imagePreview.style.display = 'none';
    }
    
    // Update modal title and show
    document.getElementById('vehicle-modal-title').textContent = 'Edit Vehicle';
    document.getElementById('vehicle-modal').style.display = 'block';
}

// Confirm delete vehicle
function confirmDeleteVehicle(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    currentActionItem = vehicle;
    
    showConfirmationModal(
        'Delete Vehicle',
        `Are you sure you want to delete ${vehicle.vehicleName}? This action cannot be undone.`,
        () => deleteVehicle(vehicleId)
    );
}

// Load bookings from Firestore
function loadBookings() {
    const tableBody = document.getElementById('bookings-table-body');
    tableBody.innerHTML = '<tr class="loading-row"><td colspan="7">Loading bookings...</td></tr>';
    
    db.collection("bookings").orderBy("timestamp", "desc").get()
        .then((querySnapshot) => {
            bookings = [];
            querySnapshot.forEach((doc) => {
                const booking = doc.data();
                booking.id = doc.id;
                bookings.push(booking);
            });
            
            displayBookings(bookings);
            updateReportData();
        })
        .catch((error) => {
            console.error("Error loading bookings: ", error);
            tableBody.innerHTML = `<tr><td colspan="7">Error loading bookings: ${error.message}</td></tr>`;
        });
}

// Display bookings in the table
function displayBookings(bookingsList) {
    const tableBody = document.getElementById('bookings-table-body');
    
    if (bookingsList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">No bookings found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = bookingsList.map(booking => {
        const bookingId = booking.id.substring(0, 8); // Use first 8 chars of ID
        const statusClass = `status-${booking.status || 'pending'}`;
        
        // Format dates
        const startDate = booking.startDate ? new Date(booking.startDate.toDate()).toLocaleDateString() : 'N/A';
        const endDate = booking.endDate ? new Date(booking.endDate.toDate()).toLocaleDateString() : 'N/A';
        
        return `
            <tr data-id="${booking.id}">
                <td>${bookingId}</td>
                <td>${booking.userEmail || 'Unknown User'}</td>
                <td>${booking.vehicleName || 'Unknown Vehicle'}</td>
                <td>${startDate} to ${endDate}</td>
                <td>$${booking.totalPrice || 0}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${capitalizeFirstLetter(booking.status || 'pending')}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" onclick="viewBookingDetails('${booking.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// View booking details
function viewBookingDetails(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    currentActionItem = booking;
    
    // Format dates
    const startDate = booking.startDate ? new Date(booking.startDate.toDate()).toLocaleDateString() : 'N/A';
    const endDate = booking.endDate ? new Date(booking.endDate.toDate()).toLocaleDateString() : 'N/A';
    const bookingDate = booking.timestamp ? new Date(booking.timestamp.toDate()).toLocaleString() : 'N/A';
    
    // Build HTML content for the booking details
    const content = `
        <div class="booking-vehicle-info">
            <img src="${booking.vehicleImage || ''}" alt="${booking.vehicleName}" class="booking-vehicle-image" crossorigin="anonymous">
            <div>
                <h3 class="booking-vehicle-name">${booking.vehicleName || 'Unknown Vehicle'}</h3>
                <p class="booking-vehicle-price">$${booking.pricePerDay || 0}/day</p>
            </div>
        </div>
        
        <div class="booking-details">
            <div class="booking-details-grid">
                <div class="booking-detail-item">
                    <span class="booking-detail-label">Booking ID</span>
                    <span class="booking-detail-value">${booking.id}</span>
                </div>
                <div class="booking-detail-item">
                    <span class="booking-detail-label">Status</span>
                    <span class="booking-detail-value">
                        <span class="status-badge status-${booking.status || 'pending'}">
                            ${capitalizeFirstLetter(booking.status || 'pending')}
                        </span>
                    </span>
                </div>
                <div class="booking-detail-item">
                    <span class="booking-detail-label">Customer</span>
                    <span class="booking-detail-value">${booking.userEmail || 'Unknown'}</span>
                </div>
                <div class="booking-detail-item">
                    <span class="booking-detail-label">Booking Date</span>
                    <span class="booking-detail-value">${bookingDate}</span>
                </div>
                <div class="booking-detail-item">
                    <span class="booking-detail-label">Rental Period</span>
                    <span class="booking-detail-value">${startDate} to ${endDate} (${booking.totalDays || 0} days)</span>
                </div>
                <div class="booking-detail-item">
                    <span class="booking-detail-label">Total Price</span>
                    <span class="booking-detail-value">$${booking.totalPrice || 0}</span>
                </div>
            </div>
        </div>
    `;
    
    // Update the modal with the booking details
    document.getElementById('booking-details-content').innerHTML = content;
    
    // Show/hide action buttons based on the booking status
    const cancelBtn = document.getElementById('cancel-booking-btn');
    const confirmBtn = document.getElementById('confirm-booking-btn');
    const completeBtn = document.getElementById('complete-booking-btn');
    
    // Hide all buttons first
    cancelBtn.style.display = 'none';
    confirmBtn.style.display = 'none';
    completeBtn.style.display = 'none';
    
    // Show relevant buttons based on status
    if (booking.status === 'pending') {
        cancelBtn.style.display = 'block';
        confirmBtn.style.display = 'block';
    } else if (booking.status === 'confirmed') {
        cancelBtn.style.display = 'block';
        completeBtn.style.display = 'block';
    }
    
    // Show the modal
    document.getElementById('booking-details-modal').style.display = 'block';
}

// Update booking status
function updateBookingStatus(bookingId, newStatus) {
    db.collection("bookings").doc(bookingId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log(`Booking ${bookingId} status updated to ${newStatus}`);
        document.getElementById('booking-details-modal').style.display = 'none';
        loadBookings(); // Refresh the bookings list
    })
    .catch((error) => {
        console.error("Error updating booking status: ", error);
        alert("Error updating booking status: " + error.message);
    });
}

// Load users from Firestore
function loadUsers() {
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = '<tr class="loading-row"><td colspan="5">Loading users...</td></tr>';
    
    db.collection("users").get()
        .then((querySnapshot) => {
            users = [];
            querySnapshot.forEach((doc) => {
                const user = doc.data();
                user.id = doc.id;
                users.push(user);
            });
            
            // For each user, count their bookings
            const userPromises = users.map(user => {
                return db.collection("bookings")
                    .where("userId", "==", user.id)
                    .get()
                    .then(snapshot => {
                        user.bookingCount = snapshot.size;
                        return user;
                    });
            });
            
            return Promise.all(userPromises);
        })
        .then((usersWithBookings) => {
            displayUsers(usersWithBookings);
            updateReportData();
        })
        .catch((error) => {
            console.error("Error loading users: ", error);
            tableBody.innerHTML = `<tr><td colspan="5">Error loading users: ${error.message}</td></tr>`;
        });
}

// Display users in the table
function displayUsers(usersList) {
    const tableBody = document.getElementById('users-table-body');
    
    if (usersList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = usersList.map(user => {
        const joinDate = user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A';
        const role = user.role || 'user';
        const roleClass = `status-${role}`;
        
        return `
            <tr data-id="${user.id}">
                <td>${user.name || 'Unnamed User'}</td>
                <td>${user.email || 'No Email'}</td>
                <td>${joinDate}</td>
                <td>
                    <span class="status-badge ${roleClass}">
                        ${capitalizeFirstLetter(role)}
                    </span>
                </td>
                <td>${user.bookingCount || 0}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" onclick="viewUserDetails('${user.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" onclick="editUserRole('${user.id}')">
                            <i class="fas fa-user-shield"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// View user details (placeholder function - you can implement the details view)
function viewUserDetails(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // For now, just alert with user info
    alert(`User: ${user.name}\nEmail: ${user.email}\nBookings: ${user.bookingCount}`);
    
    // Later, you could implement a modal to show user details and their bookings
}

// Edit user role
function editUserRole(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Set form values
    document.getElementById('edit-user-id').value = userId;
    document.getElementById('role-user-name').textContent = user.name || 'Unnamed User';
    document.getElementById('role-user-email').textContent = user.email || 'No Email';
    document.getElementById('user-role').value = user.role || 'user';
    
    // Show the modal
    document.getElementById('user-role-modal').style.display = 'block';
}

// Update user role
function updateUserRole(userId, role) {
    // Don't allow changing your own role (for security)
    if (userId === adminUser.uid) {
        alert("You cannot change your own admin status.");
        document.getElementById('user-role-modal').style.display = 'none';
        return;
    }
    
    db.collection("users").doc(userId).update({
        role: role,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log(`User ${userId} role updated to ${role}`);
        document.getElementById('user-role-modal').style.display = 'none';
        
        // Refresh the users list
        loadUsers();
    })
    .catch((error) => {
        console.error("Error updating user role: ", error);
        alert("Error updating user role: " + error.message);
    });
}

// Load report data
function loadReportData() {
    // This data is already loaded in the other functions
    // Just update the report UI
    updateReportData();
}

// Update report data in the UI
function updateReportData() {
    // Calculate total revenue
    const totalRevenue = bookings
        .filter(booking => booking.status === 'completed' || booking.status === 'confirmed')
        .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    
    // Count active bookings
    const activeBookings = bookings
        .filter(booking => booking.status === 'confirmed' || booking.status === 'pending')
        .length;
    
    // Count available vehicles
    const availableVehicles = vehicles
        .filter(vehicle => vehicle.status === 'available')
        .length;
    
    // Update the UI
    document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('active-bookings').textContent = activeBookings;
    document.getElementById('available-vehicles').textContent = availableVehicles;
    document.getElementById('total-users').textContent = users.length;
    
    // Create charts (if Chart.js is loaded)
    if (typeof Chart !== 'undefined') {
        createBookingsChart();
        createPopularVehiclesChart();
    }
}

// Create bookings by month chart
function createBookingsChart() {
    const ctx = document.getElementById('bookings-chart');
    
    // Check if chart already exists and destroy it
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    // Get last 6 months
    const months = [];
    const monthData = { confirmed: [], completed: [], cancelled: [] };
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear().toString().substr(-2);
        months.push(`${monthName} ${year}`);
        
        // Start of month
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        // End of month
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        // Count bookings for this month
        const confirmedCount = bookings.filter(booking => {
            if (!booking.timestamp) return false;
            const bookingDate = booking.timestamp.toDate();
            return bookingDate >= startOfMonth && 
                   bookingDate <= endOfMonth && 
                   booking.status === 'confirmed';
        }).length;
        
        const completedCount = bookings.filter(booking => {
            if (!booking.timestamp) return false;
            const bookingDate = booking.timestamp.toDate();
            return bookingDate >= startOfMonth && 
                   bookingDate <= endOfMonth && 
                   booking.status === 'completed';
        }).length;
        
        const cancelledCount = bookings.filter(booking => {
            if (!booking.timestamp) return false;
            const bookingDate = booking.timestamp.toDate();
            return bookingDate >= startOfMonth && 
                   bookingDate <= endOfMonth && 
                   booking.status === 'cancelled';
        }).length;
        
        monthData.confirmed.push(confirmedCount);
        monthData.completed.push(completedCount);
        monthData.cancelled.push(cancelledCount);
    }
    
    // Create chart
    ctx.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Confirmed',
                    data: monthData.confirmed,
                    backgroundColor: '#3498db'
                },
                {
                    label: 'Completed',
                    data: monthData.completed,
                    backgroundColor: '#2ecc71'
                },
                {
                    label: 'Cancelled',
                    data: monthData.cancelled,
                    backgroundColor: '#e74c3c'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Create popular vehicles chart
function createPopularVehiclesChart() {
    const ctx = document.getElementById('vehicles-chart');
    
    // Check if chart already exists and destroy it
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    // Count bookings for each vehicle
    const vehicleBookings = {};
    
    bookings.forEach(booking => {
        if (booking.vehicleId) {
            if (!vehicleBookings[booking.vehicleId]) {
                vehicleBookings[booking.vehicleId] = {
                    name: booking.vehicleName || 'Unknown',
                    count: 0
                };
            }
            vehicleBookings[booking.vehicleId].count++;
        }
    });
    
    // Sort and take top 5
    const topVehicles = Object.values(vehicleBookings)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    
    // Create chart
    ctx.chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: topVehicles.map(v => v.name),
            datasets: [{
                data: topVehicles.map(v => v.count),
                backgroundColor: [
                    '#3498db',
                    '#2ecc71',
                    '#f1c40f',
                    '#e67e22',
                    '#9b59b6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Setup search and filters
function setupSearchAndFilters() {
    // Vehicle search and filter
    const vehicleSearch = document.getElementById('vehicle-search');
    const vehicleFilter = document.getElementById('vehicle-filter');
    
    if (vehicleSearch && vehicleFilter) {
        vehicleSearch.addEventListener('input', filterVehicles);
        vehicleFilter.addEventListener('change', filterVehicles);
    }
    
    // Booking search and filter
    const bookingSearch = document.getElementById('booking-search');
    const bookingFilter = document.getElementById('booking-filter');
    
    if (bookingSearch && bookingFilter) {
        bookingSearch.addEventListener('input', filterBookings);
        bookingFilter.addEventListener('change', filterBookings);
    }
    
    // User search and filter
    const userSearch = document.getElementById('user-search');
    const userRoleFilter = document.getElementById('user-role-filter');
    
    if (userSearch) {
        userSearch.addEventListener('input', filterUsers);
    }
    
    if (userRoleFilter) {
        userRoleFilter.addEventListener('change', filterUsers);
    }
}

// Filter vehicles based on search and filter
function filterVehicles() {
    const searchTerm = document.getElementById('vehicle-search').value.toLowerCase();
    const filterValue = document.getElementById('vehicle-filter').value;
    
    const filteredVehicles = vehicles.filter(vehicle => {
        // Match search term
        const nameMatch = (vehicle.vehicleName || '').toLowerCase().includes(searchTerm);
        const typeMatch = (vehicle.type || '').toLowerCase().includes(searchTerm);
        const searchMatch = nameMatch || typeMatch;
        
        // Match filter
        const filterMatch = filterValue === 'all' || vehicle.type === filterValue;
        
        return searchMatch && filterMatch;
    });
    
    displayVehicles(filteredVehicles);
}

// Filter bookings based on search and filter
function filterBookings() {
    const searchTerm = document.getElementById('booking-search').value.toLowerCase();
    const filterValue = document.getElementById('booking-filter').value;
    
    const filteredBookings = bookings.filter(booking => {
        // Match search term
        const idMatch = booking.id.toLowerCase().includes(searchTerm);
        const emailMatch = (booking.userEmail || '').toLowerCase().includes(searchTerm);
        const vehicleMatch = (booking.vehicleName || '').toLowerCase().includes(searchTerm);
        const searchMatch = idMatch || emailMatch || vehicleMatch;
        
        // Match filter
        const filterMatch = filterValue === 'all' || booking.status === filterValue;
        
        return searchMatch && filterMatch;
    });
    
    displayBookings(filteredBookings);
}

// Filter users based on search
function filterUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const roleFilter = document.getElementById('user-role-filter').value;
    
    const filteredUsers = users.filter(user => {
        // Match search term
        const nameMatch = (user.name || '').toLowerCase().includes(searchTerm);
        const emailMatch = (user.email || '').toLowerCase().includes(searchTerm);
        const searchMatch = nameMatch || emailMatch;
        
        // Match role filter
        const userRole = user.role || 'user';
        const roleMatch = roleFilter === 'all' || userRole === roleFilter;
        
        return searchMatch && roleMatch;
    });
    
    displayUsers(filteredUsers);
}

// Show confirmation modal
let currentActionCallback = null;
function showConfirmationModal(title, message, callback) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    currentActionCallback = callback;
    
    document.getElementById('confirm-modal').style.display = 'block';
}

// Helper functions
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}
