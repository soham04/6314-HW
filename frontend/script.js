// Display Date-Time
document.addEventListener("DOMContentLoaded", () => {
  const dateTimeElement = document.getElementById("date-time");
  setInterval(() => {
    const now = new Date();
    dateTimeElement.textContent = now.toLocaleString();
  }, 1000);
});

// Utility function to display error messages
function displayError(message, elementId) {
  const errorContainer = document.getElementById(elementId);
  errorContainer.innerText = message;
  errorContainer.style.color = "red";
}

// Clear error message
function clearError(elementId) {
  const errorContainer = document.getElementById(elementId);
  errorContainer.innerText = "";
}

function validateContactForm() {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const comment = document.getElementById("comment").value.trim();
  const gender = document.querySelector('input[name="gender"]:checked')?.value;

  const nameRegex = /^[A-Z][a-zA-Z]*$/;
  const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  clearError("contactError");

  // Input Validations
  if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
    displayError("First and last name must start with a capital letter and contain only alphabetic characters.", "contactError");
    return;
  }
  if (!phoneRegex.test(phone)) {
    displayError("Phone number must be in the format ddd-ddd-dddd.", "contactError");
    return;
  }
  if (!emailRegex.test(email)) {
    displayError("Please enter a valid email address.", "contactError");
    return;
  }
  if (comment.length < 10) {
    displayError("Comment must be at least 10 characters long.", "contactError");
    return;
  }
  if (!gender) {
    displayError("Please select a gender.", "contactError");
    return;
  }

  // Submit the comment via AJAX
  submitContactForm(firstName, lastName, phone, email, gender, comment);
}

function submitContactForm(firstName, lastName, phone, email, gender, comment) {
  const contactInfo = {
    firstName,
    lastName,
    phone,
    email,
    gender,
    comment,
  };

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:3000/submit-contact", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.withCredentials = true; // Include session cookie

  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      const response = JSON.parse(xhr.responseText);
      if (response.error) {
        displayError(response.error, "contactError");
      } else {
        alert("Comment submitted successfully!");
      }
    } else {
      displayError("Failed to submit comment. Please try again.", "contactError");
    }
  };

  xhr.onerror = function () {
    displayError("Error during comment submission. Please try again.", "contactError");
  };

  xhr.send(JSON.stringify(contactInfo));
}


// Toggle Return Date based on Trip Type Selection
function toggleReturnDate() {
  const tripType = document.getElementById("tripType").value;
  document.getElementById("returnDateContainer").style.display =
    tripType === "roundtrip" ? "block" : "none";
}

// Toggle Passenger Form
function togglePassengerForm() {
  const passengerForm = document.getElementById("passengerForm");
  passengerForm.style.display =
    passengerForm.style.display === "none" ? "block" : "none";
}

// Flights Form Validation and Search
function validateFlightForm() {
  const origin = document.getElementById("origin").value.trim().toLowerCase();
  const destination = document
    .getElementById("destination")
    .value.trim()
    .toLowerCase();
  const tripType = document.getElementById("tripType").value;
  const departureDateInput = document.getElementById("departureDate").value;
  const returnDateInput = document.getElementById("returnDate").value;
  const departureDate = departureDateInput ? new Date(departureDateInput) : null;
  const returnDate = returnDateInput ? new Date(returnDateInput) : null;
  const adults = parseInt(document.getElementById("adults").value) || 0;
  const children = parseInt(document.getElementById("children").value) || 0;
  const infants = parseInt(document.getElementById("infants").value) || 0;

  const validCities = [
    "abilene", "amarillo", "austin", "brownsville", "college station",
    "corpus christi", "dallas", "el paso", "fort worth", "galveston",
    "harlingen", "houston", "killeen", "laredo", "longview", "lubbock",
    "mcallen", "midland", "san antonio", "texarkana", "tyler",
    "victoria", "waco", "bakersfield", "burbank", "fresno", "los angeles",
    "long beach", "modesto", "ontario", "palm springs", "riverside",
    "sacramento", "san diego", "san francisco", "san jose", "santa ana",
    "santa barbara", "santa rosa", "simi valley", "stockton", "torrance", "visalia"
  ];

  const startDate = new Date("2024-09-01");
  const endDate = new Date("2024-12-01");

  clearError("flightError");

  if (!validCities.includes(origin) || !validCities.includes(destination)) {
    displayError("Origin and destination must be a city in Texas or California.", "flightError");
    return false;
  }

  if (!departureDateInput || departureDate < startDate || departureDate > endDate) {
    displayError("Departure date must be between September 1, 2024, and December 1, 2024.", "flightError");
    return false;
  }

  if (tripType === "roundtrip" && (!returnDateInput || returnDate <= departureDate)) {
    displayError("Return date must be after the departure date.", "flightError");
    return false;
  }

  if (adults + children + infants === 0 || adults > 4 || children > 4 || infants > 4) {
    displayError("Please select at least one passenger and ensure no category exceeds 4.", "flightError");
    return false;
  }

  searchFlightsInAPI(origin, destination, departureDateInput, tripType, returnDateInput, adults, children, infants);
  return true;
}

// Function to search flights from API and display results
function searchFlightsInAPI(origin, destination, departureDate, tripType, returnDate, adults, children, infants) {
  // Construct the URL with query parameters
  const apiUrl = `http://localhost:3000/flights?origin=${encodeURIComponent(
    origin
  )}&destination=${encodeURIComponent(destination)}&departureDate=${encodeURIComponent(departureDate)}`;

  fetch(apiUrl) // Send request with required query parameters
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch flights data from the API");
      }
      return response.json(); // Expect JSON response from the server
    })
    .then((flights) => {
      const matchingFlights = flights.filter((flight) => {
        // Check if the flight has enough available seats
        const availableSeats = flight.available_seats;
        return availableSeats >= adults + children + infants;
      });

      if (matchingFlights.length > 0) {
        displayFlightResults(matchingFlights, tripType, returnDate, adults, children, infants);
      } else {
        displayError("No flights found for the selected dates.", "flightError");
      }
    })
    .catch((err) => {
      console.error("Failed to fetch flights data:", err);
      displayError("Error fetching flights data. Please try again.", "flightError");
    });
}

// Function to display flight results
function displayFlightResults(flights, tripType, returnDate, adults, children, infants) {
  console.log(flights);

  let summaryHTML = "<h3>Available Flights</h3><ul>";
  flights.forEach((flight) => {
    summaryHTML += `
        <strong>Flight ID:</strong> ${flight.flight_id}<br>
        <strong>Departure Date:</strong> ${flight.departure_date}<br>
        <strong>Arrival Date:</strong> ${flight.arrival_date}<br>
        <strong>Departure Time:</strong> ${flight.departure_time}<br>
        <strong>Arrival Time:</strong> ${flight.arrival_time}<br>
        <strong>Seats Available:</strong> ${flight.available_seats}<br>
        <strong>Price:</strong> $${flight.price} per adult
        <button onclick="addToCart('${flight.flight_id}', '${flight.departure_date}', '${flight.arrival_date}', '${flight.departure_time}', '${flight.arrival_time}', ${flight.price}, ${adults}, ${children}, ${infants})">Add to Cart</button>
      </li>
      <hr>
    `;
  });
  summaryHTML += "</ul>";
  document.getElementById("flightSummary").innerHTML = summaryHTML;
  document.getElementById("flightSummary").style.display = "block";
}

function displayCart() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  console.log(cart);

  if (cart.length === 0) {
    document.getElementById("cartSummary2").innerHTML = "<p>No Flight in the cart yet.</p>";
    return;
  }

  let cartHTML = "<h3>Your Flight Cart</h3><ul>";

  cartHTML += `
    <li>
      <strong>Booking ID:</strong> ${cart[0].bookingId}<br>
      <strong>Flight ID:</strong> ${cart[0].flightId}<br>
      <strong>Departure:</strong> ${cart[0].departureDate} (${cart[0].departureTime})<br>
      <strong>Arrival:</strong> ${cart[0].arrivalDate} (${cart[0].arrivalTime})<br>
      <strong>Total Price:</strong> $${cart[0].totalPrice.toFixed(2)}
    </li>
    <hr>
  `;
  cartHTML += "</ul>";

  const totalPassengers =
    parseInt(cart[0].adults) + parseInt(cart[0].children) + parseInt(cart[0].infants);

  let passengerIndex = 0;

  for (let i = 0; i < cart[0].adults; i++) {
    passengerIndex++;
    cartHTML += generatePassengerForm(passengerIndex, "Adult");
  }

  for (let i = 0; i < cart[0].children; i++) {
    passengerIndex++;
    cartHTML += generatePassengerForm(passengerIndex, "Child");
  }

  for (let i = 0; i < cart[0].infants; i++) {
    passengerIndex++;
    cartHTML += generatePassengerForm(passengerIndex, "Infant");
  }

  document.getElementById("cartSummary2").innerHTML = cartHTML;
}

// Helper function to generate passenger input form
function generatePassengerForm(index, category) {
  return `
    <hr>
    <p>Passenger ${index}:</p>
    <hr>
    <label for="firstName${index}">First Name</label>
    <input type="text" id="firstName${index}" name="firstName" required pattern="[A-Za-z]+" title="First name should only contain letters.">
    
    <label for="lastName${index}">Last Name</label>
    <input type="text" id="lastName${index}" name="lastName" required pattern="[A-Za-z]+" title="Last name should only contain letters.">
    
    <label for="dob${index}">Date of Birth</label>
    <input type="date" id="dob${index}" name="dob" required>
    
    <label for="ssn${index}">Social Security Number (SSN)</label>
    <input type="text" id="ssn${index}" name="ssn" required pattern="\\d{3}-\\d{2}-\\d{4}" title="SSN must be in the format: 123-45-6789.">

    <label for="category${index}">Category</label>
    <select id="category${index}" name="category" required>
      <option value="Adult" ${category === "Adult" ? "selected" : ""}>Adult</option>
      <option value="Child" ${category === "Child" ? "selected" : ""}>Child</option>
      <option value="Infant" ${category === "Infant" ? "selected" : ""}>Infant</option>
    </select>
  `;
}

// Function to add flight to cart
function addToCart(flightId, departureDate, arrivalDate, departureTime, arrivalTime, price, adults, children, infants) {

  console.log('Added flight to cart');

  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  // if (cart.length === 1) {
  //   alert("You can only add one flight at a time.");
  //   return;
  // }

  const totalPrice = (adults * price) + (children * price * 0.7) + (infants * price * 0.1);

  cart.push({
    bookingId: generateBookingId(),
    flightId,
    departureDate,
    arrivalDate,
    departureTime,
    arrivalTime,
    pricePerAdult: price,
    adults,
    children,
    infants,
    totalPrice
  });

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Flight added to cart!");
}

// Generate unique booking ID
function generateBookingId() {
  return "BKG" + Math.floor(Math.random() * 1000000);
}

// Display cart contents on cart.html
// function displayCart() {
//   console.log('hi');

//   const cart = JSON.parse(localStorage.getItem("cart")) || [];

//   console.log(cart);

//   if (cart.length === 0) {
//     // document.getElementById("cartSummary2").innerHTML = "<p>No Flight in the cart yet.</p>";
//     return;
//   }

//   let cartHTML = "<h3>Your Flight Cart</h3><ul>";
//   // cart.forEach((item) => {
//   cartHTML += `
//       <li>
//         <strong>Booking ID:</strong> ${cart[0].bookingId}<br>
//         <strong>Flight ID:</strong> ${cart[0].flightId}<br>
//         <strong>Departure:</strong> ${cart[0].departureDate} (${cart[0].departureTime})<br>
//         <strong>Arrival:</strong> ${cart[0].arrivalDate} (${cart[0].arrivalTime})<br>
//         <strong>Total Price:</strong> $${cart[0].totalPrice.toFixed(2)}
//       </li>
//       <hr>
//     `;
//   // });
//   cartHTML += "</ul>";

//   const passengers = cart[0].adults + cart[0].children + cart[0].infants;

//   console.log(passengers);

//   for (let index = 0; index < passengers; index++) {

//     cartHTML += `
//     <hr>
//     <p>Passenger ${index + 1}:</p>
//     <hr>
//     <label for="firstName">First Name</label>
//     <input type="text" id="firstName${index + 1}" name="firstName" required pattern="[A-Za-z]+" title="First name should only contain letters.">

//     <label for="lastName">Last Name</label>
//     <input type="text" id="lastName${index + 1}" name="lastName" required pattern="[A-Za-z]+" title="Last name should only contain letters.">

//     <label for="dob">Date of Birth</label>
//     <input type="date" id="dob${index + 1}" name="dob" required>

//     <label for="ssn">Social Security Number (SSN)</label>
//     <input type="text" id="ssn${index + 1}" name="ssn" required pattern="\d{3}-\d{2}-\d{4}" title="SSN must be in the format: 123-45-6789.">
//     </br>
//     `
//   }

//   document.getElementById("cartSummary2").innerHTML = cartHTML;
// }

// Function to collect passenger data and submit via Fetch
// Function to collect passenger data and submit via Fetch
function bookFlight(event) {
  if (event) {
    event.preventDefault(); // Prevent default browser behavior
  }

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const passengerCount = cart[0].adults + cart[0].children + cart[0].infants;

  const passengers = [];
  const flightId = cart[0].flightId;

  // Collect passenger details
  for (let i = 0; i < passengerCount; i++) {
    const firstName = document.getElementById(`firstName${i + 1}`).value.trim();
    const lastName = document.getElementById(`lastName${i + 1}`).value.trim();
    const dob = document.getElementById(`dob${i + 1}`).value;
    const ssn = document.getElementById(`ssn${i + 1}`).value.trim();

    // Get the category for the passenger (Adult, Child, Infant)
    const category = document.querySelector(`input[name="category${i + 1}"]:checked`)?.value || 'adult';

    passengers.push({ firstName, lastName, dob, ssn, category });
  }

  console.log(passengers);

  // Prepare the data for the POST request
  const bookingData = {
    flightId: flightId,
    passengers: passengers,
  };

  // Make the POST request using fetch
  fetch("http://localhost:3000/book-flight", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bookingData),
    credentials: 'include',
  })
    .then((response) => {
      if (!response.ok) {
        // If response status is not OK, throw an error
        return response.json().then((errorData) => {
          // If the response body contains an error message, show it
          throw new Error(errorData.error || "An error occurred while booking the flight.");
        });
      }
      // Check if the response is JSON
      return response.text().then((text) => {
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error("Invalid JSON response: " + text);
        }
      });
    })
    .then((data) => {
      // alert("Flight booked successfully! Booking details: " + JSON.stringify(data));
      const bookingDetails = data.bookingDetails;
      let bookingHTML = `<h3>Booking Confirmation</h3>`;
      bookingHTML += `
  <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
  <p><strong>Flight Details:</strong></p>
  <ul>
    <li><strong>Flight ID:</strong> ${bookingDetails.flightDetails.flight_id}</li>
    <li><strong>Origin:</strong> ${bookingDetails.flightDetails.origin}</li>
    <li><strong>Destination:</strong> ${bookingDetails.flightDetails.destination}</li>
    <li><strong>Departure Date:</strong> ${bookingDetails.flightDetails.departure_date}</li>
    <li><strong>Arrival Date:</strong> ${bookingDetails.flightDetails.arrival_date}</li>
    <li><strong>Departure Time:</strong> ${bookingDetails.flightDetails.departure_time}</li>
    <li><strong>Arrival Time:</strong> ${bookingDetails.flightDetails.arrival_time}</li>
    <li><strong>Price:</strong> $${bookingDetails.flightDetails.price}</li>
  </ul>
  <p><strong>Passengers:</strong></p>
  <ul>
`;

      bookingDetails.passengers.forEach((passenger, index) => {
        bookingHTML += `
    <li>Passenger ${index + 1}: ${passenger.firstName} ${passenger.lastName} (DOB: ${passenger.dob}) | SSN: ${passenger.ssn} | Category: ${passenger.category}</li>
  `;
      });
      bookingHTML += `</ul>`;

      document.getElementById("cartSummary2").innerHTML = bookingHTML;

      localStorage.removeItem("cart");

    })
    .catch((error) => {
      alert("Failed to book flight: " + error.message);
      console.error("Error:", error);
      console.log(error);
    });
}


// displayCart()

// Utility functions
function displayError(message, elementId) {
  const errorContainer = document.getElementById(elementId);
  errorContainer.innerText = message;
}

function clearError(elementId) {
  document.getElementById(elementId).innerText = "";
}

// Helper function to capitalize the first letter of each word
function capitalize(str) {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Stays Form Validation
function validateStayForm() {
  const city = document.getElementById("city").value.trim().toLowerCase();
  const checkInDateInput = document.getElementById("checkInDate").value;
  const checkOutDateInput = document.getElementById("checkOutDate").value;
  const checkInDate = checkInDateInput ? new Date(checkInDateInput) : null;
  const checkOutDate = checkOutDateInput ? new Date(checkOutDateInput) : null;
  const adults = parseInt(document.getElementById("adults").value) || 0;
  const children = parseInt(document.getElementById("children").value) || 0;
  const infants = parseInt(document.getElementById("infants").value) || 0;

  const validCities = [
    "abilene", "amarillo", "austin", "brownsville", "college station",
    "corpus christi", "dallas", "el paso", "fort worth", "galveston",
    "harlingen", "houston", "killeen", "laredo", "longview", "lubbock",
    "mcallen", "midland", "san antonio", "texarkana", "tyler",
    "victoria", "waco", "bakersfield", "burbank", "fresno", "los angeles",
    "long beach", "modesto", "ontario", "palm springs", "riverside",
    "sacramento", "san diego", "san francisco", "san jose", "santa ana",
    "santa barbara", "santa rosa", "simi valley", "stockton", "torrance", "visalia"
  ];

  const startDate = new Date("2024-09-01");
  const endDate = new Date("2024-12-01");

  clearError("stayError");

  // Validate city (case-insensitive)
  if (!validCities.includes(city)) {
    displayError("City must be a city in Texas or California.", "stayError");
    document.getElementById("staySummary").style.display = "none";
    return false;
  }

  // Validate check-in and check-out dates
  if (!checkInDateInput || !checkOutDateInput) {
    displayError("Please select both check-in and check-out dates.", "stayError");
    return false;
  }

  if (checkInDate < startDate || checkOutDate > endDate || checkInDate >= checkOutDate) {
    displayError("Check-in and check-out dates must be valid and within September 1, 2024, to December 1, 2024.", "stayError");
    return false;
  }

  if (adults + children + infants === 0) {
    displayError("At least one guest must be selected.", "stayError");
    return false;
  }

  const totalGuests = adults + children;
  let roomsNeeded = Math.ceil(totalGuests / 2);

  searchHotels(city, checkInDateInput, checkOutDateInput, roomsNeeded, adults, children, infants);
  return true;
}

// Function to fetch and display hotels from API
function searchHotels(city, checkInDate, checkOutDate, roomsNeeded, adults, children, infants) {
  fetch(`http://localhost:3000/search-hotels?city=${city}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch hotels');
      }
      return response.json();
    })
    .then((hotels) => {
      if (hotels.length === 0) {
        displayError('No hotels available for the selected criteria.', 'stayError');
        return;
      }
      displayHotelResults(hotels, checkInDate, checkOutDate, roomsNeeded, adults, children, infants);
    })
    .catch((err) => displayError(err.message, 'stayError'));
}


// Function to display hotel results
function displayHotelResults(hotels, checkInDate, checkOutDate, roomsNeeded, adults, children, infants) {
  let summaryHTML = "<h3>Available Hotels</h3><ul>";
  hotels.forEach((hotel) => {
    summaryHTML += `
      <li>
        <strong>Hotel ID:</strong> ${hotel.hotel_id}<br>
        <strong>Hotel Name:</strong> ${hotel.name}<br>
        <strong>City:</strong> ${hotel.city}<br>
        <strong>Check-In Date:</strong> ${checkInDate}<br>
        <strong>Check-Out Date:</strong> ${checkOutDate}<br>
        <strong>Price Per Night:</strong> $${hotel.price_per_night}<br>
        <strong>Rooms Needed:</strong> ${roomsNeeded}
        <button onclick="addHotelToCart('${hotel.hotel_id}', '${hotel.name}', '${hotel.city}', '${checkInDate}', '${checkOutDate}', ${hotel.price_per_night}, ${roomsNeeded}, ${adults}, ${children}, ${infants})">Add to Cart</button>
      </li>
      <hr>
    `;
  });
  summaryHTML += "</ul>";
  document.getElementById("staySummary").innerHTML = summaryHTML;
  document.getElementById("staySummary").style.display = "block";
}

// Function to add hotel to cart
function addHotelToCart(hotelId, name, city, checkInDate, checkOutDate, pricePerNight, rooms, adults, children, infants) {
  console.log('Added hotels to cart');

  console.log('rom', rooms);


  const cart = JSON.parse(localStorage.getItem("hotelCart")) || [];
  const totalPrice = pricePerNight * rooms * (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24);

  console.log(totalPrice);


  cart.push({
    bookingId: generateBookingId(),
    hotelId,
    name,
    city,
    checkInDate,
    checkOutDate,
    pricePerNight,
    adults,
    children,
    infants,
    rooms,
    totalPrice,
  });

  localStorage.setItem("hotelCart", JSON.stringify(cart));
  console.log(cart);

  alert("Hotel added to cart!");
}

// Display Cart Contents
// Display Cart Contents with Dynamic Guest Input
function displayHotelCart() {
  const cart = JSON.parse(localStorage.getItem("hotelCart")) || [];
  console.log(cart);

  if (cart.length === 0) {
    document.getElementById("cartSummary").innerHTML = "<p>No Hotels in the cart yet.</p>";
    return;
  }

  let cartHTML = "<h3>Your Hotel Cart</h3><ul>";
  cart.forEach((item, index) => {
    const totalGuests = item.adults + item.children + item.infants;
    const roomsNeeded = Math.ceil((item.adults + item.children) / 2);

    cartHTML += `
      <li>
        <strong>Booking ID:</strong> ${item.bookingId}<br>
        <strong>Hotel Name:</strong> ${item.name}<br>
        <strong>City:</strong> ${item.city}<br>
        <strong>Check-In:</strong> ${item.checkInDate}<br>
        <strong>Check-Out:</strong> ${item.checkOutDate}<br>
        <strong>Total Price:</strong> $${item.totalPrice.toFixed(2)}<br>
        <strong>Total Guests:</strong> ${totalGuests}<br>
        <strong>Rooms Needed:</strong> ${roomsNeeded}
      </li>
      <hr>
    `;

    // Add guest input fields dynamically
    for (let i = 0; i < totalGuests; i++) {
      cartHTML += `
        <div>
          <h4>Guest ${i + 1} Details</h4>
          <label for="firstName${index}_${i}">First Name:</label>
          <input type="text" id="firstName${index}_${i}" name="firstName${index}_${i}" required pattern="[A-Za-z]+" title="First name should only contain letters.">
          
          <label for="lastName${index}_${i}">Last Name:</label>
          <input type="text" id="lastName${index}_${i}" name="lastName${index}_${i}" required pattern="[A-Za-z]+" title="Last name should only contain letters.">
          
          <label for="dob${index}_${i}">Date of Birth:</label>
          <input type="date" id="dob${index}_${i}" name="dob${index}_${i}" required>
          
          <label for="ssn${index}_${i}">Social Security Number (SSN):</label>
          <input type="text" id="ssn${index}_${i}" name="ssn${index}_${i}" required pattern="\\d{3}-\\d{2}-\\d{4}" title="SSN must be in the format: 123-45-6789.">
          
          <label for="category${index}_${i}">Category:</label>
          <select id="category${index}_${i}" name="category${index}_${i}">
            <option value="Adult">Adult</option>
            <option value="Child">Child</option>
            <option value="Infant">Infant</option>
          </select>
        </div>
        <hr>
      `;
    }
  });
  cartHTML += "</ul>";
  cartHTML += `<button onclick="bookHotel()">Book Hotel</button>`;
  document.getElementById("cartSummary").innerHTML = cartHTML;
}

displayHotelCart()

function bookHotel() {
  const cart = JSON.parse(localStorage.getItem("hotelCart")) || [];
  if (cart.length === 0) {
    alert("No hotel in the cart.");
    return;
  }

  const bookingData = {
    hotelId: cart[0].hotelId, // Assuming single booking at a time
    checkInDate: cart[0].checkInDate,
    checkOutDate: cart[0].checkOutDate,
    numberOfRooms: Math.ceil((cart[0].adults + cart[0].children) / 2),
    pricePerNight: cart[0].pricePerNight,
    totalPrice: cart[0].totalPrice,
    guests: [],
  };

  const totalGuests = cart[0].adults + cart[0].children + cart[0].infants;
  for (let i = 0; i < totalGuests; i++) {
    const firstName = document.getElementById(`firstName0_${i}`).value.trim();
    const lastName = document.getElementById(`lastName0_${i}`).value.trim();
    const dob = document.getElementById(`dob0_${i}`).value;
    const ssn = document.getElementById(`ssn0_${i}`).value.trim();
    const category = document.getElementById(`category0_${i}`).value;

    if (!firstName || !lastName || !dob || !ssn || !category) {
      alert(`Please fill out all fields for Guest ${i + 1}`);
      return;
    }

    bookingData.guests.push({ firstName, lastName, dob, ssn, category });
  }

  // Make the POST request
  fetch("http://localhost:3000/book-hotel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bookingData),
    credentials: 'include'
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(text);
        });
      }
      return response.json();
    })
    .then((data) => {
      alert("Hotel booked successfully!");
      console.log(data);
      localStorage.removeItem("hotelCart");
      document.getElementById("cartSummary").innerHTML = ""; // Clear the cart
    })
    .catch((error) => {
      alert("Failed to book hotel: " + error.message);
      console.error(error);
    });
}


// function bookHotels() {
//   const cart = JSON.parse(localStorage.getItem("hotelCart")) || [];

//   if (!cart.length) {
//     alert("No hotels selected for booking.");
//     return;
//   }

//   console.log(cart);

//   const bookings = cart.map((hotel) => ({
//     hotelId: hotel.hotelId,
//     checkInDate: hotel.checkInDate,
//     checkOutDate: hotel.checkOutDate,
//     adults: hotel.adults,
//     children: hotel.children,
//     infants: hotel.infants,
//   }));

//   fetch("http://localhost:3000/book-hotels", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ bookings }),
//     credentials: 'include'
//   })
//     .then((response) => {
//       if (!response.ok) {
//         throw new Error(response.statusText);
//       }
//       return response.json();
//     })
//     .then((data) => {
//       alert("Hotels booked successfully!");

//       const bookingResults = data.bookingResults;
//       let bookingHTML = `<h3>Booking Confirmations</h3>`;

//       bookingResults.forEach((booking) => {
//         bookingHTML += `
//           <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
//           <p><strong>Hotel Details:</strong></p>
//           <ul>
//             <li><strong>Hotel Name:</strong> ${booking.name}</li>
//             <li><strong>City:</strong> ${booking.city}</li>
//             <li><strong>Price Per Night:</strong> $${booking.pricePerNight.toFixed(2)}</li>
//           </ul>
//           <p><strong>Stay Details:</strong></p>
//           <ul>
//             <li><strong>Check-In Date:</strong> ${booking.checkInDate}</li>
//             <li><strong>Check-Out Date:</strong> ${booking.checkOutDate}</li>
//             <li><strong>Total Guests:</strong> ${booking.adults + booking.children + booking.infants}</li>
//             <li><strong>Adults:</strong> ${booking.adults}</li>
//             <li><strong>Children:</strong> ${booking.children}</li>
//             <li><strong>Infants:</strong> ${booking.infants}</li>
//             <li><strong>Rooms:</strong> ${booking.rooms}</li>
//             <li><strong>Total Price:</strong> $${booking.totalPrice.toFixed(2)}</li>
//           </ul>
//           <hr>
//         `;
//       });

//       document.getElementById("cartSummary").innerHTML = bookingHTML;
//       localStorage.removeItem("hotelCart");

//     })
//     .catch((error) => {
//       alert("Failed to book hotels: " + error.message);
//       console.error("Error:", error);
//     });
// }


// Generate unique booking ID
function generateBookingId() {
  return "BKG" + Math.floor(Math.random() * 1000000);
}

// Utility functions
function displayError(message, elementId) {
  const errorContainer = document.getElementById(elementId);
  errorContainer.innerText = message;
}

function clearError(elementId) {
  document.getElementById(elementId).innerText = "";
}

// Car Form Validation
function validateCarForm() {
  const city = document.getElementById("carCity").value.trim().toLowerCase();
  const carType = document.getElementById("carType").value;
  const checkInDateInput = document.getElementById("checkInDate").value;
  const checkOutDateInput = document.getElementById("checkOutDate").value;
  const checkInDate = checkInDateInput ? new Date(checkInDateInput) : null;
  const checkOutDate = checkOutDateInput ? new Date(checkOutDateInput) : null;

  const validCities = [
    "abilene",
    "amarillo",
    "austin",
    "brownsville",
    "college station",
    "corpus christi",
    "dallas",
    "el paso",
    "fort worth",
    "galveston",
    "harlingen",
    "houston",
    "killeen",
    "laredo",
    "longview",
    "lubbock",
    "mcallen",
    "midland",
    "san antonio",
    "texarkana",
    "tyler",
    "victoria",
    "waco",
    "bakersfield",
    "burbank",
    "fresno",
    "los angeles",
    "long beach",
    "modesto",
    "ontario",
    "palm springs",
    "riverside",
    "sacramento",
    "san diego",
    "san francisco",
    "san jose",
    "santa ana",
    "santa barbara",
    "santa rosa",
    "simi valley",
    "stockton",
    "torrance",
    "visalia",
  ];

  const validCarTypes = ["economy", "suv", "compact", "midsize"];
  const startDate = new Date("2024-09-01");
  const endDate = new Date("2024-12-01");

  clearError("carError");

  // Validate city
  if (!validCities.includes(city)) {
    displayError("City must be a city in Texas or California.", "carError");
    document.getElementById("carSummary").style.display = "none";
    return false;
  }

  // Validate car type
  if (!validCarTypes.includes(carType)) {
    displayError(
      "Car type must be Economy, SUV, Compact, or Midsize.",
      "carError"
    );
    document.getElementById("carSummary").style.display = "none";
    return false;
  }

  // Validate check-in and check-out dates
  if (!checkInDateInput || !checkOutDateInput) {
    displayError(
      "Please select both check-in and check-out dates.",
      "carError"
    );
    document.getElementById("carSummary").style.display = "none";
    return false;
  }
  if (
    checkInDate < startDate ||
    checkInDate > endDate ||
    checkOutDate < startDate ||
    checkOutDate > endDate
  ) {
    displayError(
      "Check-in and check-out dates must be between September 1, 2024 and December 1, 2024.",
      "carError"
    );
    document.getElementById("carSummary").style.display = "none";
    return false;
  }
  if (checkInDate >= checkOutDate) {
    displayError("Check-out date must be after check-in date.", "carError");
    document.getElementById("carSummary").style.display = "none";
    return false;
  }

  // If all validations pass, display the summary
  const summary = `
      <h3>Car Rental Summary</h3>
      <p><strong>City:</strong> ${capitalize(city)}</p>
      <p><strong>Car Type:</strong> ${capitalize(carType)}</p>
      <p><strong>Check-In Date:</strong> ${checkInDateInput}</p>
      <p><strong>Check-Out Date:</strong> ${checkOutDateInput}</p>
    `;
  document.getElementById("carSummary").innerHTML = summary;
  document.getElementById("carSummary").style.display = "block";
  return true;
}

// Cruise Form Validation using jQuery
function validateCruiseForm() {
  const city = $("#destination").val();
  const departingDateInput = $("#departingDate").val();
  const departingDate = departingDateInput
    ? new Date(departingDateInput)
    : null;
  const durationMin = parseInt($("#durationMin").val()) || 0;
  const durationMax = parseInt($("#durationMax").val()) || 0;
  const adults = parseInt($("#adults").val()) || 0;
  const children = parseInt($("#children").val()) || 0;
  const infants = parseInt($("#infants").val()) || 0;

  const validDestinations = ["Alaska", "Bahamas", "Europe", "Mexico"];
  const startDate = new Date("2024-09-01");
  const endDate = new Date("2024-12-01");

  $("#cruiseError").text(""); // Clear previous error message

  // Validate destination
  if (!validDestinations.includes(city)) {
    $("#cruiseError")
      .text("Destination must be Alaska, Bahamas, Europe, or Mexico.")
      .css("color", "red");
    $("#cruiseSummary").hide();
    return false;
  }

  // Validate departing date
  if (!departingDateInput) {
    $("#cruiseError")
      .text("Please select a departing date.")
      .css("color", "red");
    $("#cruiseSummary").hide();
    return false;
  }
  if (departingDate < startDate || departingDate > endDate) {
    $("#cruiseError")
      .text(
        "Departing date must be between September 1, 2024, and December 1, 2024."
      )
      .css("color", "red");
    $("#cruiseSummary").hide();
    return false;
  }

  // Validate duration
  if (durationMin < 3 || durationMax > 10 || durationMin > durationMax) {
    $("#cruiseError")
      .text(
        "Duration must be between 3 and 10 days, and minimum should not exceed maximum."
      )
      .css("color", "red");
    $("#cruiseSummary").hide();
    return false;
  }

  // Validate guest count
  if (adults === 0 && (children > 0 || infants > 0)) {
    $("#cruiseError")
      .text("At least one adult is required if there are children or infants.")
      .css("color", "red");
    $("#cruiseSummary").hide();
    return false;
  }
  if (adults + children + infants === 0) {
    $("#cruiseError")
      .text("Number of guests cannot be 0. Please select at least one guest.")
      .css("color", "red");
    $("#cruiseSummary").hide();
    return false;
  }

  // Calculate required rooms based on adults and children
  const totalGuests = adults + children;
  let roomsNeeded = Math.ceil(totalGuests / 2);

  // If all validations pass, display the summary
  const summary = `
      <h3>Cruise Booking Summary</h3>
      <p><strong>Destination:</strong> ${city}</p>
      <p><strong>Departing Date:</strong> ${departingDateInput}</p>
      <p><strong>Duration:</strong> ${durationMin} - ${durationMax} days</p>
      <p><strong>Guests:</strong></p>
      <ul>
        <li>Adults: ${adults}</li>
        <li>Children: ${children}</li>
        <li>Infants: ${infants}</li>
      </ul>
      <p><strong>Number of Rooms Needed:</strong> ${roomsNeeded}</p>
    `;
  $("#cruiseSummary").html(summary).show();
  return true;
}

// Apply settings from localStorage on page load
document.addEventListener("DOMContentLoaded", function () {
  applySavedSettings();
});

function applySettings() {
  const fontSize = document.getElementById("fontSize").value;
  const bgColor = document.getElementById("bgColor").value;

  // Save settings to localStorage
  localStorage.setItem("fontSize", fontSize);
  localStorage.setItem("bgColor", bgColor);

  // Apply settings immediately
  applySavedSettings();
}

function applySavedSettings() {
  // Get settings from localStorage
  const fontSize = localStorage.getItem("fontSize") || "medium";
  const bgColor = localStorage.getItem("bgColor") || "#ffffff";

  // Apply font size to main content
  document.querySelectorAll("main").forEach((mainContent) => {
    switch (fontSize) {
      case "small":
        mainContent.style.fontSize = "14px";
        break;
      case "medium":
        mainContent.style.fontSize = "20px";
        break;
      case "large":
        mainContent.style.fontSize = "40px";
        break;
      default:
        mainContent.style.fontSize = "16px";
    }
  });

  // Apply background color to the entire page
  document.body.style.backgroundColor = bgColor;
}

// Submit Registration Form
function submitRegistrationForm() {
  // Get form values
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const dob = document.getElementById("dob").value.trim();
  const email = document.getElementById("email").value.trim();
  const gender = document.querySelector('input[name="gender"]:checked')?.value || "";

  // Validate inputs
  const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
  const dobRegex = /^\d{2}\/\d{2}\/\d{4}$/;

  if (!phone || !phoneRegex.test(phone)) {
    alert("Invalid phone number. Please use the format ddd-ddd-dddd.");
    return;
  }
  if (!password || password.length < 8) {
    alert("Password must be at least 8 characters long.");
    return;
  }
  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }
  if (!firstName) {
    alert("First name is required.");
    return;
  }
  if (!lastName) {
    alert("Last name is required.");
    return;
  }
  if (!dob || !dobRegex.test(dob)) {
    alert("Invalid date of birth. Please use the format MM/DD/YYYY.");
    return;
  }
  if (!email || !email.includes("@") || !email.endsWith(".com")) {
    alert("Invalid email address. It must contain '@' and end with '.com'.");
    return;
  }

  // Prepare data for submission
  const formData = JSON.stringify({
    phone,
    password,
    firstName,
    lastName,
    dob,
    email,
    gender,
  });

  // Submit data to the server using AJAX
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:3000/register", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      const response = JSON.parse(xhr.responseText);
      if (response.error) {
        alert(response.error);
      } else {
        alert("Registration successful! You can now log in.");
        window.location.href = "login.html"; // Redirect to login page
      }
    } else {
      alert("Failed to register. Please try again.");
    }
  };

  xhr.onerror = function () {
    console.error("Error during registration.");
    alert("Error during registration. Please try again.");
  };

  xhr.send(formData); // Send the data
}


// Submit Login Form
function submitLoginForm() {
  // Get form values
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value.trim();

  // Validate inputs
  if (!phone) {
    alert("Phone number is required.");
    return;
  }
  if (!password) {
    alert("Password is required.");
    return;
  }

  // Prepare data for submission
  const formData = JSON.stringify({
    phone,
    password,
  });

  // Submit data to the server using AJAX
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:3000/login", true);
  xhr.withCredentials = true
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      const response = JSON.parse(xhr.responseText);
      if (response.error) {
        alert(response.error);
      } else {
        alert("Login successful!");
        // Redirect or load user-specific page
        window.location.href = "index.html"; // Replace with your desired page
      }
    } else {
      alert("Failed to log in. Please try again.");
    }
  };

  xhr.onerror = function () {
    displayError("Error during login. Please try again.", "loginError");
    // console.error("Error during login.");
    // alert("Error during login. Please try again.");
  };

  xhr.send(formData); // Send the data
}


// Load user information via AJAX
// Load user information via AJAX
function loadUserInfo() {
  console.log('load user info');

  const xhr = new XMLHttpRequest();
  xhr.withCredentials = true; // Include credentials (cookies)
  xhr.open("GET", "http://localhost:3000/getUser", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        console.log("Response from getUser:", xhr.responseText);
        const response = JSON.parse(xhr.responseText);
        const userInfo = document.querySelector(".user-info");
        if (response.firstName && response.lastName) {
          userInfo.innerHTML = `Welcome, ${response.firstName} ${response.lastName}!`;
        } else {
          userInfo.innerHTML = `Welcome, Guest! <a href="login.html">Login</a>`;
        }
      } else {
        console.error("Error fetching user info:", xhr.statusText);
      }
    }
  };
  xhr.send();
}

// Check Admin Status and Display Admin Features
function checkAdminStatus() {
  console.log('ssobn');

  fetch('http://localhost:3000/getUser', { credentials: 'include' })
    .then((response) => {
      if (!response.ok) throw new Error('Failed to fetch user info');
      return response.json();
    })
    .then((user) => {
      if (user.isAdmin) {
        document.getElementById('adminHotelLoader').style.display = 'block';
      }
    })
    .catch((err) => console.error('Error checking admin status:', err));
}

// Upload hotel data to the server
function uploadHotelData() {
  const fileInput = document.getElementById('hotelFile');
  const statusMessage = document.getElementById('uploadStatus');

  if (fileInput.files.length === 0) {
    statusMessage.textContent = 'Please select a JSON file.';
    statusMessage.style.color = 'red';
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('hotelFile', file);

  statusMessage.textContent = 'Uploading...';
  statusMessage.style.color = 'blue';

  fetch('http://localhost:3000/load-hotels', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Unknown error occurred.');
      }
      return response.json();
    })
    .then((data) => {
      statusMessage.textContent = data.message || 'Hotels data uploaded successfully!';
      statusMessage.style.color = 'green';
    })
    .catch((err) => {
      statusMessage.textContent = `Error uploading hotel data: ${err.message}`;
      statusMessage.style.color = 'red';
      console.error('Error:', err);
    });
}




// Run admin check on page load
document.addEventListener('DOMContentLoaded', checkAdminStatus);

// Retrieve bookings by Flight and Hotel Booking IDs
function retrieveBookingsByIds() {
  const flightBookingId = document.getElementById("flightBookingId").value.trim();
  const hotelBookingId = document.getElementById("hotelBookingId").value.trim();
  const url = new URL("http://localhost:3000/account/bookings");
  if (flightBookingId) url.searchParams.append("flightBookingId", flightBookingId);
  if (hotelBookingId) url.searchParams.append("hotelBookingId", hotelBookingId);

  fetch(url, {
    method: "GET",
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        document.getElementById("bookingByIdResults").innerText = data.error;
      } else {
        displayResults("bookingByIdResults", data);
      }
    })
    .catch((error) => console.error("Error retrieving bookings:", error));
}

// Retrieve passengers by Flight Booking ID
function retrievePassengers() {
  const flightBookingId = document.getElementById("passengerFlightBookingId").value.trim();
  if (!flightBookingId) {
    document.getElementById("passengerResults").innerText = "Flight Booking ID is required.";
    return;
  }

  const url = new URL("http://localhost:3000/account/passengers");
  url.searchParams.append("flightBookingId", flightBookingId);

  fetch(url, {
    method: "GET",
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        document.getElementById("passengerResults").innerText = data.error;
      } else {
        displayResults("passengerResults", data);
      }
    })
    .catch((error) => console.error("Error retrieving passengers:", error));
}


// Retrieve all bookings for SEP 2024
function retrieveSep2024Bookings() {
  const url = new URL("http://localhost:3000/account/bookings/sep2024");

  fetch(url, {
    method: "GET",
    credentials: "include",
  }).then((response) => response.json())
    .then((data) => {
      displayResults("sep2024BookingsResults", data);
    })
    .catch((error) => console.error("Error retrieving SEP 2024 bookings:", error));
}

// Retrieve booked flights by SSN
function retrieveFlightsBySsn() {
  const ssn = document.getElementById("ssn").value.trim();
  if (!ssn) {
    document.getElementById("flightsBySsnResults").innerText = "SSN is required.";
    return;
  }

  const url = new URL("http://localhost:3000/account/flights");
  url.searchParams.append("ssn", ssn);

  fetch(url, {
    method: "GET",
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      displayResults("flightsBySsnResults", data);
    })
    .catch((error) => console.error("Error retrieving flights by SSN:", error));
}

// Retrieve Flights Departing from Texas (Sep-Oct 2024)
function retrieveTexasFlights() {
  const url = new URL("http://localhost:3000/admin/flights/texas-sep-oct");

  fetch(url, {
    method: "GET",
    credentials: "include",
  })
    .then(response => response.json())
    .then(data => displayResults("texasFlightsResults", data))
    .catch(error => console.error("Error retrieving flights from Texas:", error));
}

// Retrieve Hotels in Texas (Sep-Oct 2024)
function retrieveTexasHotels() {
  const url = new URL("http://localhost:3000/admin/hotels/texas-sep-oct");

  fetch(url, {
    method: "GET",
    credentials: "include",
  })
    .then(response => response.json())
    .then(data => displayResults("texasHotelsResults", data))
    .catch(error => console.error("Error retrieving hotels in Texas:", error));
}

// Retrieve Most Expensive Booked Hotels
function retrieveMostExpensiveHotels() {
  const url = new URL("http://localhost:3000/admin/hotels/expensive");

  fetch(url, {
    method: "GET",
    credentials: "include",
  })
    .then(response => response.json())
    .then(data => displayResults("expensiveHotelsResults", data))
    .catch(error => console.error("Error retrieving most expensive hotels:", error));
}

// Retrieve Flights with Infant Passengers
function retrieveFlightsWithInfants() {
  const url = new URL("http://localhost:3000/admin/flights/with-infants");

  fetch(url, {
    method: "GET",
    credentials: "include",
  })
    .then(response => response.json())
    .then(data => displayResults("infantFlightsResults", data))
    .catch(error => console.error("Error retrieving flights with infants:", error));
}

// Retrieve Flights with Infant Passengers and At Least 5 Children
function retrieveFlightsWithInfantsAndChildren() {
  const url = new URL("http://localhost:3000/admin/flights/infants-and-children");

  fetch(url, {
    method: "GET",
    credentials: "include",
  })
    .then(response => response.json())
    .then(data => displayResults("infantAndChildrenFlightsResults", data))
    .catch(error => console.error("Error retrieving flights with infants and children:", error));
}

// Retrieve Most Expensive Booked Flights
function retrieveMostExpensiveFlights() {
  const url = new URL("http://localhost:3000/admin/flights/expensive");

  fetch(url, {
    method: "GET",
    credentials: "include",
  })
    .then(response => response.json())
    .then(data => displayResults("expensiveFlightsResults", data))
    .catch(error => console.error("Error retrieving most expensive flights:", error));
}

// Retrieve Flights Departing from Texas Without Infants
function retrieveTexasFlightsWithoutInfants() {
  const url = new URL("http://localhost:3000/admin/flights/texas-no-infants");

  fetch(url, {
    method: "GET",
    credentials: "include",
  })
    .then(response => response.json())
    .then(data => displayResults("texasNoInfantFlightsResults", data))
    .catch(error => console.error("Error retrieving Texas flights without infants:", error));
}

// Retrieve Flights Arriving to California (Sep-Oct 2024)
function retrieveFlightsArrivingToCalifornia() {
  const url = new URL("http://localhost:3000/admin/flights/california-arrivals");

  fetch(url, {
    method: "GET",
    credentials: "include",
  })
    .then(response => response.json())
    .then(data => displayResults("californiaArrivalsResults", data))
    .catch(error => console.error("Error retrieving flights arriving to California:", error));
}


// Display results in a specified element
function displayResults(elementId, data) {
  const resultsElement = document.getElementById(elementId);
  resultsElement.innerHTML = "<ul>";

  if (Array.isArray(data)) {
    data.forEach((item) => {
      resultsElement.innerHTML += `<li>${JSON.stringify(item)}</li>`;
    });
  } else {
    resultsElement.innerHTML += `<li>${JSON.stringify(data)}</li>`;
  }

  resultsElement.innerHTML += "</ul>";
}

// Upload flight data to the server
function uploadFlightData() {
  const fileInput = document.getElementById('flightFile');
  const statusMessage = document.getElementById('flightUploadStatus');

  if (fileInput.files.length === 0) {
    statusMessage.textContent = 'Please select an XML file.';
    statusMessage.style.color = 'red';
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('flightFile', file);

  statusMessage.textContent = 'Uploading...';
  statusMessage.style.color = 'blue';

  fetch('http://localhost:3000/load-flights', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Unknown error occurred.');
      }
      return response.json();
    })
    .then((data) => {
      statusMessage.textContent = data.message || 'Flights data uploaded successfully!';
      statusMessage.style.color = 'green';
    })
    .catch((err) => {
      statusMessage.textContent = `Error uploading flights data: ${err.message}`;
      statusMessage.style.color = 'red';
      console.error('Error:', err);
    });
}



// Call loadUserInfo on page load
window.onload = function () {
  displayCart()
};

window.onload = function () {
  loadUserInfo();
}