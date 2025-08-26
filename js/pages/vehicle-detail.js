// Vehicle Detail Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleId = urlParams.get('id');
    const vehicleDetailContainer = document.querySelector('.vehicle-detail-container');
    const vehicleInfoContainer = document.getElementById('vehicle-info');
    const reviewsContainer = document.getElementById('reviews-container');
    const avgRatingEl = document.getElementById('avg-rating');
    const ratingCountEl = document.getElementById('rating-count');
    const bookNowBtn = document.querySelector('.btn-book-now');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Get reference to booking modal elements
    const bookingModal = document.getElementById('booking-modal');
    const closeBookingModal = bookingModal.querySelector('.close-modal');
    const bookingForm = document.getElementById('booking-form');
    const vehicleIdInput = document.getElementById('vehicle-id');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const totalDaysElement = document.getElementById('total-days');
    const totalPriceElement = document.getElementById('total-price');
    const bookingSummary = document.querySelector('.booking-summary');
    const bookingVehicleImage = document.getElementById('booking-vehicle-image');
    const bookingVehicleName = document.getElementById('booking-vehicle-name');
    const bookingVehiclePrice = document.getElementById('booking-vehicle-price');
    
    // Set minimum dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    startDateInput.min = formatDate(today);
    endDateInput.min = formatDate(tomorrow);
    
    // Event listener for start date change
    startDateInput.addEventListener('change', function() {
        const selectedStartDate = new Date(this.value);
        const nextDay = new Date(selectedStartDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        endDateInput.min = formatDate(nextDay);
        
        // If end date is before new start date, reset it
        const endDate = new Date(endDateInput.value);
        if (endDate <= selectedStartDate) {
            endDateInput.value = formatDate(nextDay);
        }
        
        calculateBookingSummary();
    });
    
    // Event listener for end date change
    endDateInput.addEventListener('change', calculateBookingSummary);
    
    function calculateBookingSummary() {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        
        if (startDate && endDate && endDate > startDate) {
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (currentVehicle) {
                const pricePerDay = currentVehicle.pricePerDay || 0;
                const totalPrice = diffDays * pricePerDay;
                
                totalDaysElement.textContent = diffDays;
                totalPriceElement.textContent = `$${totalPrice}`;
                bookingSummary.classList.remove('hidden');
            }
        }
    }
    
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Initialize tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Show the first tab by default
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }
    
    let currentVehicle = null;
    
    if (vehicleId) {
        // Get vehicle details
        db.collection("vehicles").doc(vehicleId).get()
            .then((doc) => {
                if (doc.exists) {
                    currentVehicle = doc.data();
                    currentVehicle.id = doc.id;
                    displayVehicleDetails(currentVehicle);
                    
                    // Fetch reviews for this vehicle
                    fetchReviews(vehicleId);
                    
                    // Show the content after it's loaded
                    document.querySelector('.loading-container').classList.add('hidden');
                    document.querySelector('.vehicle-detail-content').classList.remove('hidden');
                } else {
                    vehicleDetailContainer.innerHTML = '<div class="error-message">Vehicle not found!</div>';
                }
            })
            .catch((error) => {
                console.error("Error getting document:", error);
                vehicleDetailContainer.innerHTML = '<div class="error-message">Error loading vehicle details!</div>';
            });
    } else {
        vehicleDetailContainer.innerHTML = '<div class="error-message">No vehicle ID provided!</div>';
    }
    
    function displayVehicleDetails(vehicle) {
        // Update the header
        document.getElementById('vehicle-name').textContent = vehicle.vehicleName || vehicle.name;
        document.getElementById('vehicle-price').textContent = `$${vehicle.pricePerDay}/day`;
        
        // Main image
        const mainImageUrl = vehicle.imageUrl || (vehicle.images && vehicle.images.length > 0 
            ? vehicle.images[0] 
            : 'images/placeholder-car.jpg');
        
        console.log("Vehicle image URL:", mainImageUrl);
        document.getElementById('main-image').src = mainImageUrl;
        
        // Vehicle info tab
        vehicleInfoContainer.innerHTML = `
            <h2>Vehicle Specifications</h2>
            <div class="specs-grid">
                <div class="vehicle-spec">
                    <i class="fas fa-car"></i>
                    <span>Type: ${vehicle.type || 'Not specified'}</span>
                </div>
                <div class="vehicle-spec">
                    <i class="fas fa-gas-pump"></i>
                    <span>Fuel: ${vehicle.fuel || 'Not specified'}</span>
                </div>
                <div class="vehicle-spec">
                    <i class="fas fa-cogs"></i>
                    <span>Transmission: ${vehicle.transmission || 'Not specified'}</span>
                </div>
                <div class="vehicle-spec">
                    <i class="fas fa-users"></i>
                    <span>Seats: ${vehicle.seats || 'Not specified'}</span>
                </div>
                <div class="vehicle-spec">
                    <i class="fas fa-suitcase"></i>
                    <span>Luggage: ${vehicle.luggage || 'Not specified'} bags</span>
                </div>
                <div class="vehicle-spec">
                    <i class="fas fa-road"></i>
                    <span>Mileage: ${vehicle.mileage || 'Unlimited'}</span>
                </div>
            </div>
            
            <div class="vehicle-description">
                <h4>Description</h4>
                <p>${vehicle.description || 'No description available.'}</p>
            </div>
        `;
        
        // Features tab
        document.getElementById('features-container').innerHTML = `
            <div class="vehicle-features">
                <ul class="features-list">
                    ${(vehicle.features || []).map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
                </ul>
            </div>
        `;
        
        // Update booking modal with vehicle details
        bookingVehicleImage.src = mainImageUrl;
        bookingVehicleName.textContent = vehicle.vehicleName || vehicle.name;
        bookingVehiclePrice.textContent = `$${vehicle.pricePerDay}/day`;
        vehicleIdInput.value = vehicle.id;
    }
    
    function fetchReviews(vehicleId) {
        db.collection("reviews")
            .where("vehicleId", "==", vehicleId)
            .get()
            .then((querySnapshot) => {
                if (querySnapshot.empty) {
                    reviewsContainer.innerHTML = '<p class="no-reviews">No reviews yet.</p>';
                    avgRatingEl.textContent = 'N/A';
                    ratingCountEl.textContent = '(0)';
                    return;
                }
                
                let totalRating = 0;
                const reviews = [];
                
                querySnapshot.forEach((doc) => {
                    const review = doc.data();
                    review.id = doc.id;
                    reviews.push(review);
                    totalRating += review.rating;
                });
                
                const avgRating = (totalRating / reviews.length).toFixed(1);
                avgRatingEl.textContent = avgRating;
                ratingCountEl.textContent = `(${reviews.length})`;
                
                // Display reviews
                reviewsContainer.innerHTML = reviews.map(review => {
                    const date = review.timestamp ? new Date(review.timestamp.toDate()).toLocaleDateString() : 'Unknown date';
                    const verified = review.verified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified Renter</span>' : '';
                    
                    return `
                        <div class="review-card">
                            <div class="review-header">
                                <div class="reviewer-info">
                                    <div class="reviewer-name">${review.userName || 'Anonymous'}</div>
                                    ${verified}
                                </div>
                                <div class="review-date">${date}</div>
                            </div>
                            <div class="review-rating">
                                ${getStarRating(review.rating)}
                            </div>
                            <div class="review-text">${review.text || 'No comment.'}</div>
                        </div>
                    `;
                }).join('');
            })
            .catch((error) => {
                console.error("Error getting reviews: ", error);
                reviewsContainer.innerHTML = '<div class="error-message">Error loading reviews!</div>';
            });
    }
    
    function getStarRating(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i - 0.5 <= rating) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        return stars;
    }
    
    // Book Now button
    bookNowBtn.addEventListener('click', function() {
        // Check if user is logged in
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to book a vehicle.');
            window.location.href = 'login.html';
            return;
        }
        
        bookingModal.style.display = 'block';
        
        // Reset form
        bookingForm.reset();
        bookingSummary.classList.add('hidden');
    });
    
    // Close booking modal
    closeBookingModal.addEventListener('click', function() {
        bookingModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === bookingModal) {
            bookingModal.style.display = 'none';
        }
    });
    
    // Handle booking form submission
    bookingForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to book a vehicle.');
            return;
        }
        
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        
        if (!startDate || !endDate || endDate <= startDate) {
            alert('Please select valid dates.');
            return;
        }
        
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const totalPrice = diffDays * currentVehicle.pricePerDay;
        
        // Create booking object
        const booking = {
            userId: user.uid,
            userEmail: user.email,
            vehicleId: vehicleIdInput.value,
            vehicleName: currentVehicle.vehicleName || currentVehicle.name,
            vehicleImage: currentVehicle.imageUrl || '',
            startDate: firebase.firestore.Timestamp.fromDate(startDate),
            endDate: firebase.firestore.Timestamp.fromDate(endDate),
            totalDays: diffDays,
            totalPrice: totalPrice,
            pricePerDay: currentVehicle.pricePerDay,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add booking to Firestore
        db.collection("bookings").add(booking)
            .then((docRef) => {
                alert('Booking successful! You can view your booking in the dashboard.');
                bookingModal.style.display = 'none';
                bookingForm.reset();
                bookingSummary.classList.add('hidden');
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                console.error("Error adding booking: ", error);
                alert('Error creating booking. Please try again.');
            });
    });
});
