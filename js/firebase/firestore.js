// Firestore Database Interactions

// Global variables for vehicle data
let allVehicles = [];
let filteredVehicles = [];
let currentFilter = {
    type: 'all',
    maxPrice: 200,
    searchTerm: ''
};

// Fetch and display vehicles on the homepage
function fetchAndDisplayVehicles() {
    const vehicleGrid = document.getElementById('vehicle-grid');
    
    if (!vehicleGrid) return;
    
    // Clear the grid except for the sample card
    const sampleCard = document.querySelector('.sample-card');
    if (sampleCard) {
        sampleCard.style.display = 'none';
    }
    
    // Show loading state
    vehicleGrid.innerHTML = '<p class="loading-msg">Loading vehicles...</p>';
    
    // Get vehicles from Firestore
    db.collection('vehicles').get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                vehicleGrid.innerHTML = '<p class="no-vehicles-msg">No vehicles available at the moment.</p>';
                return;
            }
            
            // Clear the loading message
            vehicleGrid.innerHTML = '';
            
            // Store all vehicles in the global array
            allVehicles = [];
            querySnapshot.forEach((doc) => {
                const vehicle = doc.data();
                vehicle.id = doc.id;
                allVehicles.push(vehicle);
            });
            
            // Apply initial filtering
            applyFilters();
        })
        .catch((error) => {
            console.error('Error fetching vehicles:', error);
            vehicleGrid.innerHTML = '<p class="error-msg">Failed to load vehicles. Please try again later.</p>';
        });
}

// Apply filters and display vehicles
function applyFilters() {
    // Filter vehicles based on current criteria
    filteredVehicles = allVehicles.filter(vehicle => {
        // Type filter
        if (currentFilter.type !== 'all' && vehicle.type !== currentFilter.type) {
            return false;
        }
        
        // Price filter
        if (vehicle.pricePerDay > currentFilter.maxPrice) {
            return false;
        }
        
        // Search term
        if (currentFilter.searchTerm && !vehicle.vehicleName.toLowerCase().includes(currentFilter.searchTerm.toLowerCase())) {
            return false;
        }
        
        return true;
    });
    
    // Display filtered vehicles
    displayVehicles(filteredVehicles);
}

// Display vehicles in the grid
function displayVehicles(vehicles) {
    const vehicleGrid = document.getElementById('vehicle-grid');
    
    if (!vehicleGrid) return;
    
    // Clear the grid
    vehicleGrid.innerHTML = '';
    
    if (vehicles.length === 0) {
        vehicleGrid.innerHTML = '<p class="no-vehicles-msg">No vehicles match your criteria.</p>';
        return;
    }
    
    // Create and append vehicle cards
    vehicles.forEach(vehicle => {
        const vehicleCard = createVehicleCard(vehicle);
        vehicleGrid.appendChild(vehicleCard);
    });
}

// Create vehicle card element
function createVehicleCard(vehicle) {
    // Get vehicle ratings asynchronously
    getVehicleRatings(vehicle.id).then(ratingData => {
        const ratingStars = generateRatingStars(ratingData.averageRating);
        
        // Update the rating display if it exists
        const ratingElement = card.querySelector('.vehicle-rating');
        if (ratingElement) {
            ratingElement.innerHTML = `
                <div class="stars">${ratingStars}</div>
                <span>(${ratingData.count} reviews)</span>
            `;
        }
    });
    
    const card = document.createElement('div');
    card.className = 'vehicle-card';
    card.innerHTML = `
        <a href="vehicle-detail.html?id=${vehicle.id}" class="vehicle-card-link">
            <div class="vehicle-image">
                <img src="${vehicle.imageUrl}" alt="${vehicle.vehicleName}">
            </div>
            <div class="vehicle-details">
                <h3>${vehicle.vehicleName}</h3>
                <p class="vehicle-type">${vehicle.type}</p>
                <div class="vehicle-rating">
                    <div class="stars"><i class="fas fa-star-half-alt"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i></div>
                    <span>(0 reviews)</span>
                </div>
                <p class="vehicle-price">$${vehicle.pricePerDay}/day</p>
            </div>
        </a>
        <div class="vehicle-actions">
            <button class="btn btn-book btn-full-width" data-vehicle-id="${vehicle.id}">Book Now</button>
        </div>
    `;
    
    // Add event listener to the Book Now button
    const bookButton = card.querySelector('.btn-book');
    bookButton.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent click from propagating to card link
        openBookingModal(vehicle);
    });
    
    return card;
}

// Get vehicle ratings from Firestore
function getVehicleRatings(vehicleId) {
    return db.collection('reviews')
        .where('vehicleId', '==', vehicleId)
        .get()
        .then(querySnapshot => {
            if (querySnapshot.empty) {
                return { averageRating: 0, count: 0 };
            }
            
            let totalRating = 0;
            let count = 0;
            
            querySnapshot.forEach(doc => {
                const review = doc.data();
                totalRating += review.rating;
                count++;
            });
            
            const averageRating = count > 0 ? totalRating / count : 0;
            
            return {
                averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
                count: count
            };
        })
        .catch(error => {
            console.error('Error getting vehicle ratings:', error);
            return { averageRating: 0, count: 0 };
        });
}

// Generate HTML for rating stars
function generateRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    
    // Add half star if needed
    if (halfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
}

// Open reviews modal
function openReviewsModal(vehicle) {
    // Check if the reviews modal exists, create it if not
    let reviewsModal = document.getElementById('reviews-modal');
    
    if (!reviewsModal) {
        reviewsModal = document.createElement('div');
        reviewsModal.id = 'reviews-modal';
        reviewsModal.className = 'modal';
        reviewsModal.innerHTML = `
            <div class="modal-content reviews-modal-content">
                <span class="close-modal">&times;</span>
                <h2>Reviews for <span id="review-vehicle-name"></span></h2>
                <div id="reviews-container"></div>
                <div id="add-review-form">
                    <h3>Add Your Review</h3>
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
            </div>
        `;
        document.body.appendChild(reviewsModal);
        
        // Add event listener to close button
        const closeButton = reviewsModal.querySelector('.close-modal');
        closeButton.addEventListener('click', () => {
            reviewsModal.classList.remove('show');
        });
        
        // Add event listeners to star rating inputs
        const stars = reviewsModal.querySelectorAll('.star-rating i');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                setStarRating(stars, rating);
                reviewsModal.dataset.currentRating = rating;
            });
            
            star.addEventListener('mouseover', () => {
                const rating = parseInt(star.dataset.rating);
                highlightStars(stars, rating);
            });
            
            star.addEventListener('mouseout', () => {
                const currentRating = parseInt(reviewsModal.dataset.currentRating || 0);
                highlightStars(stars, currentRating);
            });
        });
        
        // Add event listener to submit button
        const submitButton = reviewsModal.querySelector('#submit-review');
        submitButton.addEventListener('click', () => {
            const rating = parseInt(reviewsModal.dataset.currentRating || 0);
            const reviewText = reviewsModal.querySelector('#review-text').value.trim();
            const vehicleId = reviewsModal.dataset.vehicleId;
            
            if (!rating) {
                alert('Please select a rating');
                return;
            }
            
            if (!reviewText) {
                alert('Please write a review');
                return;
            }
            
            submitReview(vehicleId, rating, reviewText);
        });
    }
    
    // Set the vehicle ID for the review
    reviewsModal.dataset.vehicleId = vehicle.id;
    
    // Set the vehicle name
    const vehicleNameElement = reviewsModal.querySelector('#review-vehicle-name');
    if (vehicleNameElement) {
        vehicleNameElement.textContent = vehicle.vehicleName;
    }
    
    // Load reviews for this vehicle
    loadVehicleReviews(vehicle.id);
    
    // Show the modal
    reviewsModal.classList.add('show');
}

// Helper function to set star rating
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

// Helper function to highlight stars on hover
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

// Load vehicle reviews
function loadVehicleReviews(vehicleId) {
    const reviewsContainer = document.querySelector('#reviews-container');
    
    if (!reviewsContainer) return;
    
    // Clear previous reviews
    reviewsContainer.innerHTML = '<p>Loading reviews...</p>';
    
    // Get reviews from Firestore
    db.collection('reviews')
        .where('vehicleId', '==', vehicleId)
        .orderBy('createdAt', 'desc')
        .get()
        .then(querySnapshot => {
            reviewsContainer.innerHTML = '';
            
            if (querySnapshot.empty) {
                reviewsContainer.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to review!</p>';
                return;
            }
            
            querySnapshot.forEach(doc => {
                const review = doc.data();
                const reviewElement = createReviewElement(review);
                reviewsContainer.appendChild(reviewElement);
            });
        })
        .catch(error => {
            console.error('Error loading reviews:', error);
            reviewsContainer.innerHTML = '<p class="error-msg">Failed to load reviews. Please try again later.</p>';
        });
}

// Create review element
function createReviewElement(review) {
    const reviewElement = document.createElement('div');
    reviewElement.className = 'review-item';
    
    // Format date
    let dateFormatted = 'Unknown date';
    if (review.createdAt && typeof review.createdAt.toDate === 'function') {
        dateFormatted = review.createdAt.toDate().toLocaleDateString();
    }
    
    // Generate stars HTML
    const starsHtml = generateRatingStars(review.rating);
    
    reviewElement.innerHTML = `
        <div class="review-header">
            <div class="review-user">${review.userName || 'Anonymous'}</div>
            <div class="review-date">${dateFormatted}</div>
        </div>
        <div class="review-rating">${starsHtml}</div>
        <div class="review-text">${review.text}</div>
    `;
    
    return reviewElement;
}

// Submit a review
function submitReview(vehicleId, rating, text) {
    // Check if user is logged in
    const user = firebase.auth().currentUser;
    
    if (!user) {
        alert('Please log in to submit a review');
        window.location.href = 'login.html';
        return;
    }
    
    // Validate inputs
    if (!vehicleId) {
        console.error('Invalid vehicle ID');
        return;
    }
    
    if (!rating || rating < 1 || rating > 5) {
        alert('Please select a rating between 1 and 5 stars');
        return;
    }
    
    // Sanitize inputs
    text = window.securityUtils?.sanitizeInput(text) || text;
    vehicleId = window.securityUtils?.sanitizeInput(vehicleId) || vehicleId;
    
    // Limit text length
    if (text.length > 500) {
        text = text.substring(0, 500);
    }
    
    // Create review object
    const review = {
        vehicleId: vehicleId,
        userId: user.uid,
        rating: rating,
        text: text,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Get user name from Firestore
    db.collection('users').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                review.userName = doc.data().name;
            }
            
            // Save review to Firestore
            return db.collection('reviews').add(review);
        })
        .then(() => {
            // Reload reviews
            loadVehicleReviews(vehicleId);
            
            // Clear form
            const reviewsModal = document.getElementById('reviews-modal');
            if (reviewsModal) {
                reviewsModal.querySelector('#review-text').value = '';
                reviewsModal.dataset.currentRating = 0;
                setStarRating(reviewsModal.querySelectorAll('.star-rating i'), 0);
            }
            
            alert('Thank you for your review!');
        })
        .catch(error => {
            console.error('Error submitting review:', error);
            alert('Failed to submit review: ' + error.message);
        });
}

// Open booking modal
function openBookingModal(vehicle) {
    const modal = document.getElementById('booking-modal');
    const vehicleDetailsContainer = document.getElementById('booking-vehicle-details');
    const vehicleIdInput = document.getElementById('vehicle-id');
    
    if (!modal || !vehicleDetailsContainer || !vehicleIdInput) return;
    
    // Set vehicle ID in hidden input
    vehicleIdInput.value = vehicle.id;
    
    // Display vehicle details in modal
    vehicleDetailsContainer.innerHTML = `
        <img src="${vehicle.imageUrl}" alt="${vehicle.vehicleName}">
        <div>
            <h3>${vehicle.vehicleName}</h3>
            <p>${vehicle.type}</p>
            <p class="vehicle-price">$${vehicle.pricePerDay}/day</p>
        </div>
    `;
    
    // Set minimum date for booking to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date').min = today;
    document.getElementById('end-date').min = today;
    
    // Reset form fields
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('rental-days').textContent = '0';
    document.getElementById('total-price').textContent = '0';
    
    // Store the vehicle price per day for calculations
    modal.dataset.pricePerDay = vehicle.pricePerDay;
    
    // Show modal
    modal.classList.add('show');
}

// Calculate booking details (days and price)
function calculateBookingDetails() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const rentalDaysElement = document.getElementById('rental-days');
    const totalPriceElement = document.getElementById('total-price');
    const modal = document.getElementById('booking-modal');
    
    if (!startDateInput || !endDateInput || !rentalDaysElement || !totalPriceElement || !modal) return;
    
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    
    // Validate dates
    if (startDate && endDate && startDate <= endDate) {
        // Calculate number of days
        const timeDiff = endDate - startDate;
        const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
        
        // Calculate total price
        const pricePerDay = parseFloat(modal.dataset.pricePerDay);
        const totalPrice = days * pricePerDay;
        
        // Update display
        rentalDaysElement.textContent = days;
        totalPriceElement.textContent = totalPrice.toFixed(2);
    } else {
        // Reset if invalid
        rentalDaysElement.textContent = '0';
        totalPriceElement.textContent = '0';
    }
}

// Create a new booking
function createBooking(vehicleId, startDate, endDate) {
    // Get the current user
    const user = firebase.auth().currentUser;
    
    if (!user) {
        alert('Please log in to make a booking.');
        window.location.href = 'login.html';
        return Promise.reject('User not logged in');
    }
    
    // Get vehicle details
    return db.collection('vehicles').doc(vehicleId).get()
        .then((doc) => {
            if (!doc.exists) {
                throw new Error('Vehicle not found');
            }
            
            const vehicle = doc.data();
            
            // Calculate rental days and total price
            const start = new Date(startDate);
            const end = new Date(endDate);
            const timeDiff = end - start;
            const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
            const totalPrice = days * vehicle.pricePerDay;
            
            // Create booking object
            const booking = {
                userId: user.uid,
                vehicleId: vehicleId,
                vehicleName: vehicle.vehicleName,
                vehicleType: vehicle.type,
                imageUrl: vehicle.imageUrl,
                startDate: firebase.firestore.Timestamp.fromDate(start),
                endDate: firebase.firestore.Timestamp.fromDate(end),
                days: days,
                totalPrice: totalPrice,
                status: 'upcoming',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Save booking to Firestore
            return db.collection('bookings').add(booking)
                .then((docRef) => {
                    alert('Booking confirmed! You can view it in your dashboard.');
                    window.location.href = 'dashboard.html';
                    return docRef;
                });
        })
        .catch((error) => {
            console.error('Error creating booking:', error);
            alert('Failed to create booking: ' + error.message);
            throw error;
        });
}

// Fetch user's bookings for dashboard
function fetchUserBookings(userId) {
    const bookingsList = document.getElementById('booking-history-list');
    
    if (!bookingsList) {
        return;
    }
    
    // Clear the list
    bookingsList.innerHTML = '';
    
    // Get bookings from Firestore
    db.collection('bookings')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                bookingsList.innerHTML = '<p class="no-bookings-msg">No bookings found.</p>';
                updateBookingStats([], userId);
                return;
            }
            
            const bookings = [];
            querySnapshot.forEach((doc) => {
                const booking = doc.data();
                booking.id = doc.id;
                bookings.push(booking);
                
                // Create booking item element
                const bookingItem = createBookingItem(booking);
                bookingsList.appendChild(bookingItem);
            });
            
            // Update booking stats
            updateBookingStats(bookings, userId);
        })
        .catch((error) => {
            console.error('Error fetching bookings:', error);
            bookingsList.innerHTML = '<p class="error-msg">Failed to load bookings. Please try again later.</p>';
        });
}

// Create booking item element for dashboard
function createBookingItem(booking) {
    // Convert Firestore timestamps to JS dates safely
    let startDate, endDate;
    
    // Handle startDate
    if (booking.startDate && typeof booking.startDate.toDate === 'function') {
        startDate = booking.startDate.toDate();
    } else if (booking.startDate instanceof Date) {
        startDate = booking.startDate;
    } else {
        startDate = new Date(); // Default to today
    }
    
    // Handle endDate
    if (booking.endDate && typeof booking.endDate.toDate === 'function') {
        endDate = booking.endDate.toDate();
    } else if (booking.endDate instanceof Date) {
        endDate = booking.endDate;
    } else {
        console.warn('Invalid endDate format:', booking.endDate);
        endDate = new Date(); // Default to today
    }
    
    // Format dates for display
    const formatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const startDateFormatted = startDate.toLocaleDateString('en-US', formatOptions);
    const endDateFormatted = endDate.toLocaleDateString('en-US', formatOptions);
    
    // Check if booking is past (for filtering)
    const today = new Date();
    const isPast = endDate < today;
    
    // Create element
    const item = document.createElement('div');
    item.className = 'booking-item';
    item.dataset.status = booking.status;
    item.dataset.isPast = isPast.toString();
    
    item.innerHTML = `
        <div class="booking-details">
            <h3 class="booking-vehicle">${booking.vehicleName}</h3>
            <p class="booking-dates">${startDateFormatted} - ${endDateFormatted} (${booking.days} days)</p>
            <p class="booking-price">Total: $${booking.totalPrice.toFixed(2)}</p>
        </div>
        <span class="booking-status status-${booking.status}">${booking.status}</span>
    `;
    
    return item;
}

// Update booking statistics on dashboard
function updateBookingStats(bookings, userId) {
    console.log('Updating booking stats with', bookings.length, 'bookings');
    
    const totalBookingsElement = document.getElementById('total-bookings');
    const upcomingBookingsElement = document.getElementById('upcoming-bookings');
    const completedBookingsElement = document.getElementById('completed-bookings');
    const canceledBookingsElement = document.getElementById('canceled-bookings');
    
    if (!totalBookingsElement || !upcomingBookingsElement || !completedBookingsElement || !canceledBookingsElement) {
        console.error('One or more booking stat elements not found');
        return;
    }
    
    const today = new Date();
    
    // Count bookings by status
    const totalBookings = bookings.length;
    
    // Safely check if endDate is a Firestore timestamp and convert it
    let upcomingBookings = 0;
    let completedBookings = 0;
    let canceledBookings = 0;
    
    bookings.forEach(booking => {
        console.log('Processing booking:', booking.id, booking.vehicleName, booking.status);
        
        // Safely convert endDate to JavaScript Date
        let endDate;
        if (booking.endDate && typeof booking.endDate.toDate === 'function') {
            endDate = booking.endDate.toDate();
        } else if (booking.endDate instanceof Date) {
            endDate = booking.endDate;
        } else {
            console.warn('Invalid endDate format:', booking.endDate);
            endDate = new Date(0); // Default to epoch
        }
        
        if (booking.status === 'canceled') {
            canceledBookings++;
        } else if (booking.status === 'completed' || (booking.status === 'upcoming' && endDate < today)) {
            completedBookings++;
        } else if (booking.status === 'upcoming' && endDate >= today) {
            upcomingBookings++;
        }
    });
    
    console.log('Stats calculated:', {
        total: totalBookings,
        upcoming: upcomingBookings,
        completed: completedBookings,
        canceled: canceledBookings
    });
    
    // Update UI
    totalBookingsElement.textContent = totalBookings;
    upcomingBookingsElement.textContent = upcomingBookings;
    completedBookingsElement.textContent = completedBookings;
    canceledBookingsElement.textContent = canceledBookings;
}

// Filter bookings on dashboard
function filterBookings(filter) {
    const bookingItems = document.querySelectorAll('.booking-item');
    
    bookingItems.forEach(item => {
        const status = item.dataset.status;
        const isPast = item.dataset.isPast === 'true';
        
        if (filter === 'all') {
            item.style.display = 'flex';
        } else if (filter === 'upcoming' && status === 'upcoming' && !isPast) {
            item.style.display = 'flex';
        } else if (filter === 'past' && (status === 'completed' || isPast)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Add event listeners once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Fetch vehicles for homepage
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        fetchAndDisplayVehicles();
        
        // Set up search and filter functionality
        setupSearchAndFilter();
    }
    
    // Booking modal events
    const modal = document.getElementById('booking-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const bookingForm = document.getElementById('booking-form');
    
    if (modal && closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }
    
    // Calculate booking details when dates change
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', calculateBookingDetails);
        endDateInput.addEventListener('change', calculateBookingDetails);
    }
    
    // Booking form submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Booking form submitted');
            
            const vehicleId = document.getElementById('vehicle-id').value;
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            
            console.log('Form data:', { vehicleId, startDate, endDate });
            
            if (!vehicleId || !startDate || !endDate) {
                alert('Please fill in all fields');
                return;
            }
            
            // Validate dates
            if (!window.securityUtils?.validateFutureDate(startDate)) {
                alert('Please select a valid start date in the future');
                return;
            }
            
            if (!window.securityUtils?.validateFutureDate(endDate)) {
                alert('Please select a valid end date in the future');
                return;
            }
            
            // Ensure end date is after start date
            if (new Date(endDate) < new Date(startDate)) {
                alert('End date must be after start date');
                return;
            }
            
            // Sanitize inputs
            vehicleId = window.securityUtils?.sanitizeInput(vehicleId) || vehicleId;
            
            createBooking(vehicleId, startDate, endDate);
        });
    }
    
    // Filter buttons for dashboard
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Apply filter
                const filter = button.dataset.filter;
                filterBookings(filter);
            });
        });
    }
});

// Setup search and filter functionality
function setupSearchAndFilter() {
    // Search functionality
    const searchInput = document.getElementById('vehicle-search');
    const searchButton = document.getElementById('search-button');
    
    if (searchInput && searchButton) {
        // Search on button click
        searchButton.addEventListener('click', () => {
            currentFilter.searchTerm = searchInput.value.trim();
            applyFilters();
        });
        
        // Search on Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentFilter.searchTerm = searchInput.value.trim();
                applyFilters();
            }
        });
    }
    
    // Type filter buttons
    const typeFilterButtons = document.querySelectorAll('.filter-btn[data-type]');
    
    typeFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button styling
            typeFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update filter and apply
            currentFilter.type = button.dataset.type;
            applyFilters();
        });
    });
    
    // Price range slider
    const priceRangeSlider = document.getElementById('price-range');
    const priceDisplay = document.getElementById('price-display');
    
    if (priceRangeSlider && priceDisplay) {
        // Update price display on slider change
        priceRangeSlider.addEventListener('input', () => {
            const maxPrice = parseInt(priceRangeSlider.value);
            priceDisplay.textContent = `$0 - $${maxPrice}`;
            currentFilter.maxPrice = maxPrice;
            applyFilters();
        });
    }
}

// Set up reviews system
function setupReviewsSystem() {
    // Add event listeners to review buttons when they are created
    // This is done in the createVehicleCard function
    
    // Set up global event delegation for review-related interactions
    document.addEventListener('click', function(event) {
        // Close any modal when clicking outside of it
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('show');
        }
    });
    
    // Update booking statuses based on current date
    updateBookingStatuses();
}

// Update booking statuses based on current date
function updateBookingStatuses() {
    const user = firebase.auth().currentUser;
    
    if (!user) return;
    
    const today = new Date();
    
    // Get all user's bookings
    db.collection('bookings')
        .where('userId', '==', user.uid)
        .where('status', '==', 'upcoming')
        .get()
        .then((querySnapshot) => {
            const batch = db.batch();
            let updatedCount = 0;
            
            querySnapshot.forEach((doc) => {
                const booking = doc.data();
                const endDate = booking.endDate.toDate();
                
                // If end date is in the past, update status to completed
                if (endDate < today) {
                    batch.update(doc.ref, { status: 'completed' });
                    updatedCount++;
                }
            });
            
            // Commit the batch if we have updates
            if (updatedCount > 0) {
                return batch.commit();
            }
        })
        .then(() => {
            console.log('Booking statuses updated');
        })
        .catch((error) => {
            console.error('Error updating booking statuses:', error);
        });
}

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    // Fetch and display vehicles on the homepage
    fetchAndDisplayVehicles();
    
    // Set up the search and filter functionality
    setupSearchAndFilter();
    
    // Set up the reviews system
    setupReviewsSystem();
});
