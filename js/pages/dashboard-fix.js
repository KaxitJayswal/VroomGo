// Dashboard Fix Script - Direct access to bookings

// Wait for everything to load
window.addEventListener('load', () => {
    console.log('Dashboard fix script loaded');
    
    // Set up filter buttons immediately
    setupFilterButtons();
    
    // Listen for Firebase auth state changes
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log('User is authenticated in fix script:', user.uid);
            setTimeout(() => loadBookingsDirect(user.uid), 500);
        } else {
            console.log('No user logged in');
        }
    });
});

// Direct function to load bookings without relying on other code
function loadBookingsDirect(userId) {
    console.log('Loading bookings directly for user:', userId);
    
    // Get references to DOM elements
    const bookingsList = document.getElementById('booking-history-list');
    const totalElement = document.getElementById('total-bookings');
    const upcomingElement = document.getElementById('upcoming-bookings');
    const completedElement = document.getElementById('completed-bookings');
    const canceledElement = document.getElementById('canceled-bookings');
    
    // Check if we're on the dashboard page
    if (!bookingsList || !totalElement || !upcomingElement || !completedElement || !canceledElement) {
        console.log('Not on dashboard page or elements not found');
        return;
    }
    
    // Clear the bookings list
    bookingsList.innerHTML = '<p>Loading bookings...</p>';
    
    // Reference to Firestore
    const db = firebase.firestore();
    
    // Fetch bookings
    db.collection('bookings')
        .where('userId', '==', userId)
        .get()
        .then(snapshot => {
            console.log('Direct bookings query returned:', snapshot.size, 'results');
            
            // Clear loading message
            bookingsList.innerHTML = '';
            
            if (snapshot.empty) {
                bookingsList.innerHTML = '<p class="no-bookings-msg">No bookings found.</p>';
                
                // Update stats
                totalElement.textContent = '0';
                upcomingElement.textContent = '0';
                completedElement.textContent = '0';
                canceledElement.textContent = '0';
                
                return;
            }
            
            // Process bookings
            const bookings = [];
            let totalCount = 0;
            let upcomingCount = 0;
            let completedCount = 0;
            let canceledCount = 0;
            
            const today = new Date();
            
            snapshot.forEach(doc => {
                const booking = doc.data();
                booking.id = doc.id;
                totalCount++;
                
                // Create a booking element
                const item = document.createElement('div');
                item.className = 'booking-item';
                
                // Determine booking status for counting and display
                let displayStatus = booking.status || 'upcoming';
                let endDate;
                
                try {
                    endDate = booking.endDate.toDate();
                } catch (e) {
                    console.error('Error converting endDate:', e);
                    endDate = new Date(); // Use today as fallback
                }
                
                const isPast = endDate < today;
                
                // Add data attributes for filtering
                item.dataset.status = displayStatus;
                item.dataset.isPast = isPast.toString();
                
                // Update status for display based on date
                if (displayStatus === 'canceled') {
                    canceledCount++;
                } else if (isPast) {
                    // If end date is in the past, mark as completed for display
                    displayStatus = 'completed';
                    completedCount++;
                } else {
                    upcomingCount++;
                }
                
                // Format dates
                let startDateFormatted, endDateFormatted;
                try {
                    startDateFormatted = booking.startDate.toDate().toLocaleDateString();
                } catch (e) {
                    startDateFormatted = "Invalid date";
                }
                
                try {
                    endDateFormatted = booking.endDate.toDate().toLocaleDateString();
                } catch (e) {
                    endDateFormatted = "Invalid date";
                }
                
                // Build HTML for booking item
                let itemHTML = `
                    <div class="booking-details">
                        <h3 class="booking-vehicle">${booking.vehicleName || 'Unknown Vehicle'}</h3>
                        <p class="booking-dates">${startDateFormatted} - ${endDateFormatted} (${booking.days || '?'} days)</p>
                        <p class="booking-price">Total: $${(booking.totalPrice || 0).toFixed(2)}</p>`;
                
                // Add review button for completed bookings
                if (displayStatus === 'completed') {
                    itemHTML += `
                        <button class="btn btn-review-booking" data-vehicle-id="${booking.vehicleId}">
                            <i class="fas fa-star"></i> Write Review
                        </button>`;
                }
                
                itemHTML += `
                    </div>
                    <span class="booking-status status-${displayStatus}">${displayStatus}</span>
                `;
                
                // Set the HTML content
                item.innerHTML = itemHTML;
                
                // Add event listener for review button if present
                const reviewButton = item.querySelector('.btn-review-booking');
                if (reviewButton) {
                    reviewButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openReviewModal(booking.vehicleId, booking.vehicleName);
                    });
                }
                
                // Add to page
                bookingsList.appendChild(item);
            });
            
            // Update stats
            totalElement.textContent = totalCount.toString();
            upcomingElement.textContent = upcomingCount.toString();
            completedElement.textContent = completedCount.toString();
            canceledElement.textContent = canceledCount.toString();
            
            console.log('Direct booking counts:', {
                total: totalCount,
                upcoming: upcomingCount,
                completed: completedCount,
                canceled: canceledCount
            });
            
            // Setup filter buttons
            setupFilterButtons();
        })
        .catch(error => {
            console.error('Error fetching bookings directly:', error);
            bookingsList.innerHTML = `<p class="error-msg">Error loading bookings: ${error.message}</p>`;
        });
}

// Set up filter buttons
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Apply filter
            const filter = button.dataset.filter;
            filterBookingItems(filter);
        });
    });
}

// Filter booking items
function filterBookingItems(filter) {
    console.log('Filtering bookings by:', filter);
    const bookingItems = document.querySelectorAll('.booking-item');
    
    bookingItems.forEach(item => {
        const status = item.dataset.status;
        const isPast = item.dataset.isPast === 'true';
        
        if (filter === 'all') {
            item.style.display = 'flex';
        } else if (filter === 'upcoming' && !isPast) {
            item.style.display = 'flex';
        } else if (filter === 'past' && isPast) {
            item.style.display = 'flex';
        } else if (filter === 'completed' && status === 'completed') {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Open review modal for a vehicle
function openReviewModal(vehicleId, vehicleName) {
    // Check if modal exists, create it if not
    let reviewModal = document.getElementById('review-modal');
    
    if (!reviewModal) {
        reviewModal = document.createElement('div');
        reviewModal.id = 'review-modal';
        reviewModal.className = 'modal';
        reviewModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Write a Review for <span id="review-vehicle-name"></span></h2>
                <div class="rating-input">
                    <span>Your Rating:</span>
                    <div class="star-rating">
                        <i class="far fa-star" data-rating="1"></i>
                        <i class="far fa-star" data-rating="2"></i>
                        <i class="far fa-star" data-rating="3"></i>
                        <i class="far fa-star" data-rating="4"></i>
                        <i class="far fa-star" data-rating="5"></i>
                    </div>
                </div>
                <textarea id="review-text" placeholder="Write your review here..."></textarea>
                <button id="submit-review" class="btn">Submit Review</button>
            </div>
        `;
        document.body.appendChild(reviewModal);
        
        // Add event listener to close button
        const closeButton = reviewModal.querySelector('.close-modal');
        closeButton.addEventListener('click', () => {
            reviewModal.classList.remove('show');
        });
        
        // Add event listeners to star rating inputs
        const stars = reviewModal.querySelectorAll('.star-rating i');
        setupStarRating(stars, reviewModal);
        
        // Add event listener to submit button
        const submitButton = reviewModal.querySelector('#submit-review');
        submitButton.addEventListener('click', () => {
            submitReview(vehicleId);
        });
    }
    
    // Set the vehicle name
    const vehicleNameElement = reviewModal.querySelector('#review-vehicle-name');
    vehicleNameElement.textContent = vehicleName;
    
    // Store the vehicle ID
    reviewModal.dataset.vehicleId = vehicleId;
    
    // Reset the form
    const stars = reviewModal.querySelectorAll('.star-rating i');
    setStarRating(stars, 0);
    reviewModal.querySelector('#review-text').value = '';
    
    // Show the modal
    reviewModal.classList.add('show');
}

// Set up star rating
function setupStarRating(stars, container) {
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            setStarRating(stars, rating);
            container.dataset.currentRating = rating;
        });
        
        star.addEventListener('mouseover', () => {
            const rating = parseInt(star.dataset.rating);
            highlightStars(stars, rating);
        });
        
        star.addEventListener('mouseout', () => {
            const currentRating = parseInt(container.dataset.currentRating || 0);
            highlightStars(stars, currentRating);
        });
    });
}

// Set star rating
function setStarRating(stars, rating) {
    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        if (starRating <= rating) {
            star.className = 'fas fa-star';
        } else {
            star.className = 'far fa-star';
        }
    });
}

// Highlight stars on hover
function highlightStars(stars, rating) {
    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        if (starRating <= rating) {
            star.className = 'fas fa-star';
        } else {
            star.className = 'far fa-star';
        }
    });
}

// Submit a review
function submitReview(vehicleId) {
    const reviewModal = document.getElementById('review-modal');
    const rating = parseInt(reviewModal.dataset.currentRating || 0);
    const reviewText = reviewModal.querySelector('#review-text').value.trim();
    
    if (!rating) {
        alert('Please select a rating.');
        return;
    }
    
    if (!reviewText) {
        alert('Please write a review.');
        return;
    }
    
    const user = firebase.auth().currentUser;
    
    if (!user) {
        alert('You must be logged in to submit a review.');
        return;
    }
    
    // Create review object
    const review = {
        vehicleId: vehicleId,
        userId: user.uid,
        rating: rating,
        text: reviewText,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isVerifiedRenter: true // Always true since this comes from a completed booking
    };
    
    // Get user name from Firestore
    firebase.firestore().collection('users').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                review.userName = doc.data().name;
            }
            
            // Save review to Firestore
            return firebase.firestore().collection('reviews').add(review);
        })
        .then(() => {
            // Close modal
            reviewModal.classList.remove('show');
            
            alert('Thank you for your review!');
        })
        .catch(error => {
            console.error('Error submitting review:', error);
            alert('Failed to submit review: ' + error.message);
        });
}
