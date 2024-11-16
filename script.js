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

// Contact Form Validation
function validateContactForm() {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const comment = document.getElementById("comment").value.trim();
  const gender = document.querySelector('input[name="gender"]:checked');

  const nameRegex = /^[A-Z][a-zA-Z]*$/;
  const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  clearError("contactError");

  if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
    displayError(
      "First and last name must start with a capital letter and contain only alphabetic characters.",
      "contactError"
    );
    return false;
  }
  if (firstName === lastName) {
    displayError("First name and last name cannot be the same.", "contactError");
    return false;
  }
  if (!phoneRegex.test(phone)) {
    displayError("Phone number must be in the format (123) 456-7890.", "contactError");
    return false;
  }
  if (!emailRegex.test(email)) {
    displayError("Please enter a valid email address.", "contactError");
    return false;
  }
  if (!gender) {
    displayError("Please select a gender.", "contactError");
    return false;
  }
  if (comment.length < 10) {
    displayError("Comment must be at least 10 characters long.", "contactError");
    return false;
  }

  displayError("Contact form submitted successfully!", "contactError");
  saveContactInfoToXML(firstName, lastName, phone, email, gender.value, comment);
  return true;
}

// Function to save contact info via API
function saveContactInfoToXML(firstName, lastName, phone, email, gender, comment) {
  const contactInfo = {
    firstName,
    lastName,
    phone,
    email,
    gender,
    comment,
  };

  fetch("http://localhost:3000/submit-contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contactInfo), // Send data as JSON
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to save contact info");
      }
      return response.text();
    })
    .then((message) => {
      console.log("Contact info saved successfully:", message);
      alert("Contact information has been submitted successfully!");
    })
    .catch((err) => {
      console.error("Error saving contact info:", err);
      alert("Failed to submit contact information. Please try again.");
    });
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
  fetch("http://localhost:3000/flights") // Fetch the flights XML from the API endpoint
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch flights data from the API");
      }
      return response.text();
    })
    .then((xmlStr) => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlStr, "text/xml");
      const flights = xmlDoc.getElementsByTagName("flight");
      const matchingFlights = [];

      for (const flight of flights) {
        const flightOrigin = flight.getElementsByTagName("origin")[0].textContent.toLowerCase();
        const flightDestination = flight.getElementsByTagName("destination")[0].textContent.toLowerCase();
        const flightDepartureDate = flight.getElementsByTagName("departureDate")[0].textContent;
        const availableSeats = parseInt(flight.getElementsByTagName("availableSeats")[0].textContent);

        if (
          flightOrigin === origin &&
          flightDestination === destination &&
          flightDepartureDate === departureDate &&
          availableSeats >= (adults + children + infants)
        ) {
          matchingFlights.push({
            flightId: flight.getElementsByTagName("flightId")[0].textContent,
            departureDate: flightDepartureDate,
            arrivalDate: flight.getElementsByTagName("arrivalDate")[0].textContent,
            departureTime: flight.getElementsByTagName("departureTime")[0].textContent,
            arrivalTime: flight.getElementsByTagName("arrivalTime")[0].textContent,
            availableSeats: availableSeats,
            price: parseInt(flight.getElementsByTagName("price")[0].textContent),
          });
        }
      }

      if (matchingFlights.length > 0) {
        displayFlightResults(matchingFlights, tripType, returnDate, adults, children, infants);
      } else {
        displayError("No flights found for the selected dates.", "flightError");
      }
    })
    .catch((err) => console.error("Failed to fetch flights data:", err));
}

// Function to display flight results
function displayFlightResults(flights, tripType, returnDate, adults, children, infants) {
  let summaryHTML = "<h3>Available Flights</h3><ul>";
  flights.forEach((flight) => {
    summaryHTML += `
      <li>
        <strong>Flight ID:</strong> ${flight.flightId}<br>
        <strong>Departure Date:</strong> ${flight.departureDate}<br>
        <strong>Arrival Date:</strong> ${flight.arrivalDate}<br>
        <strong>Departure Time:</strong> ${flight.departureTime}<br>
        <strong>Arrival Time:</strong> ${flight.arrivalTime}<br>
        <strong>Seats Available:</strong> ${flight.availableSeats}<br>
        <strong>Price:</strong> $${flight.price} per adult
        <button onclick="addToCart('${flight.flightId}', '${flight.departureDate}', '${flight.arrivalDate}', '${flight.departureTime}', '${flight.arrivalTime}', ${flight.price}, ${adults}, ${children}, ${infants})">Add to Cart</button>
      </li>
      <hr>
    `;
  });
  summaryHTML += "</ul>";
  document.getElementById("flightSummary").innerHTML = summaryHTML;
  document.getElementById("flightSummary").style.display = "block";
}

// Function to add flight to cart
function addToCart(flightId, departureDate, arrivalDate, departureTime, arrivalTime, price, adults, children, infants) {

  console.log('Added flight to cart');

  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 1) {
    alert("You can only add one flight at a time.");
    return;
  }

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
function displayCart() {
  console.log('hi');

  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  console.log(cart);

  if (cart.length === 0) {
    // document.getElementById("cartSummary2").innerHTML = "<p>No Flight in the cart yet.</p>";
    return;
  }

  let cartHTML = "<h3>Your Flight Cart</h3><ul>";
  // cart.forEach((item) => {
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
  // });
  cartHTML += "</ul>";

  const passengers = cart[0].adults + cart[0].children + cart[0].infants;

  console.log(passengers);

  for (let index = 0; index < passengers; index++) {

    cartHTML += `
    <hr>
    <p>Passenger ${index + 1}:</p>
    <hr>
    <label for="firstName">First Name</label>
    <input type="text" id="firstName${index + 1}" name="firstName" required pattern="[A-Za-z]+" title="First name should only contain letters.">
    
    <label for="lastName">Last Name</label>
    <input type="text" id="lastName${index + 1}" name="lastName" required pattern="[A-Za-z]+" title="Last name should only contain letters.">
    
    <label for="dob">Date of Birth</label>
    <input type="date" id="dob${index + 1}" name="dob" required>
    
    <label for="ssn">Social Security Number (SSN)</label>
    <input type="text" id="ssn${index + 1}" name="ssn" required pattern="\d{3}-\d{2}-\d{4}" title="SSN must be in the format: 123-45-6789.">
    </br>
    `
  }


  document.getElementById("cartSummary2").innerHTML = cartHTML;
}

// Function to collect passenger data and submit via Fetch
function bookFlight(event) {
  if (event) {
    event.preventDefault(); // Prevent default browser behavior
  }

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const passengerCount = cart[0].adults + cart[0].children + cart[0].infants;

  const passengers = [];
  const flightId = cart[0].flightId

  // Collect passenger details
  for (let i = 0; i < passengerCount; i++) {
    const firstName = document.getElementById(`firstName${i + 1}`).value.trim();
    const lastName = document.getElementById(`lastName${i + 1}`).value.trim();
    const dob = document.getElementById(`dob${i + 1}`).value;
    const ssn = document.getElementById(`ssn${i + 1}`).value.trim();

    passengers.push({ firstName, lastName, dob, ssn });
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
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response);
      }
      return response.json();
    })
    .then((data) => {
      // alert("Flight booked successfully! Booking details: " + JSON.stringify(data));
      // localStorage.removeItem("cart"); // Clear the cart
      // Fill the UI with booking details
      const bookingDetails = data.bookingDetails;
      let bookingHTML = `<h3>Booking Confirmation</h3>`;
      bookingHTML += `
  <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
  <p><strong>Flight Details:</strong></p>
  <ul>
    <li><strong>Flight ID:</strong> ${bookingDetails.flightDetails.flightId}</li>
    <li><strong>Origin:</strong> ${bookingDetails.flightDetails.origin}</li>
    <li><strong>Destination:</strong> ${bookingDetails.flightDetails.destination}</li>
    <li><strong>Departure Date:</strong> ${bookingDetails.flightDetails.departureDate}</li>
    <li><strong>Arrival Date:</strong> ${bookingDetails.flightDetails.arrivalDate}</li>
    <li><strong>Departure Time:</strong> ${bookingDetails.flightDetails.departureTime}</li>
    <li><strong>Arrival Time:</strong> ${bookingDetails.flightDetails.arrivalTime}</li>
    <li><strong>Price:</strong> $${bookingDetails.flightDetails.price.toFixed(2)}</li>
  </ul>
  <p><strong>Passengers:</strong></p>
  <ul>
`;
      bookingDetails.passengers.forEach((passenger, index) => {
        bookingHTML += `
    <li>Passenger ${index + 1}: ${passenger.firstName} ${passenger.lastName} (DOB: ${passenger.dob}) | SSN : ${passenger.ssn}</li>
  `;
      });
      bookingHTML += `</ul>`;

      document.getElementById("cartSummary2").innerHTML = bookingHTML;
    })
    .catch((error) => {
      alert("Failed to book flight: " + error.message);
      console.error("Error:", error);
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
  fetch("http://localhost:3000/hotels") // Fetch the hotels JSON from the API endpoint
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch hotels data from the API");
      }
      return response.json();
    })
    .then((hotels) => {
      const availableHotels = hotels.filter(
        (hotel) => hotel.city.toLowerCase() === city && hotel.availableRooms >= roomsNeeded
      );

      if (availableHotels.length > 0) {
        displayHotelResults(availableHotels, checkInDate, checkOutDate, roomsNeeded, adults, children, infants);
      } else {
        displayError("No hotels found for the selected criteria.", "stayError");
      }
    })
    .catch((err) => console.error("Failed to fetch hotels data:", err));
}


// Function to display hotel results
function displayHotelResults(hotels, checkInDate, checkOutDate, roomsNeeded, adults, children, infants) {
  let summaryHTML = "<h3>Available Hotels</h3><ul>";
  hotels.forEach((hotel) => {
    summaryHTML += `
      <li>
        <strong>Hotel ID:</strong> ${hotel.hotelId}<br>
        <strong>Hotel Name:</strong> ${hotel.name}<br>
        <strong>City:</strong> ${hotel.city}<br>
        <strong>Check-In Date:</strong> ${checkInDate}<br>
        <strong>Check-Out Date:</strong> ${checkOutDate}<br>
        <strong>Price Per Night:</strong> $${hotel.pricePerNight}<br>
        <strong>Rooms Needed:</strong> ${roomsNeeded}
        <button onclick="addHotelToCart('${hotel.hotelId}', '${hotel.name}', '${hotel.city}', '${checkInDate}', '${checkOutDate}', ${hotel.pricePerNight}, ${roomsNeeded}, ${adults}, ${children}, ${infants})">Add to Cart</button>
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

  const cart = JSON.parse(localStorage.getItem("hotelCart")) || [];
  const totalPrice = pricePerNight * rooms * (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24);

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
function displayHotelCart() {
  const cart = JSON.parse(localStorage.getItem("hotelCart")) || [];
  console.log(cart);

  if (cart.length === 0) {
    // document.getElementById("cartSummary").innerHTML = "<p>No Hotels in the cart yet.</p>";
    return;
  }

  let cartHTML = "<h3>Your Hotel Cart</h3><ul>";
  cart.forEach((item) => {
    cartHTML += `
      <li>
        <strong>Booking ID:</strong> ${item.bookingId}<br>
        <strong>Hotel Name:</strong> ${item.name}<br>
        <strong>City:</strong> ${item.city}<br>
        <strong>Check-In:</strong> ${item.checkInDate}<br>
        <strong>Check-Out:</strong> ${item.checkOutDate}<br>
        <strong>Total Price:</strong> $${item.totalPrice.toFixed(2)}
      </li>
      <hr>
    `;
  });
  cartHTML += "</ul>";
  document.getElementById("cartSummary").innerHTML = cartHTML;
}

displayHotelCart()

function bookHotels() {
  const cart = JSON.parse(localStorage.getItem("hotelCart")) || [];

  if (!cart.length) {
    alert("No hotels selected for booking.");
    return;
  }

  const bookings = cart.map((hotel) => ({
    hotelId: hotel.hotelId,
    checkInDate: hotel.checkInDate,
    checkOutDate: hotel.checkOutDate,
    adults: hotel.adults,
    children: hotel.children,
    infants: hotel.infants,
  }));

  fetch("http://localhost:3000/book-hotels", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bookings }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      alert("Hotels booked successfully!");

      const bookingResults = data.bookingResults;
      let bookingHTML = `<h3>Booking Confirmations</h3>`;

      bookingResults.forEach((booking) => {
        bookingHTML += `
          <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
          <p><strong>Hotel Details:</strong></p>
          <ul>
            <li><strong>Hotel Name:</strong> ${booking.name}</li>
            <li><strong>City:</strong> ${booking.city}</li>
            <li><strong>Price Per Night:</strong> $${booking.pricePerNight.toFixed(2)}</li>
          </ul>
          <p><strong>Stay Details:</strong></p>
          <ul>
            <li><strong>Check-In Date:</strong> ${booking.checkInDate}</li>
            <li><strong>Check-Out Date:</strong> ${booking.checkOutDate}</li>
            <li><strong>Total Guests:</strong> ${booking.adults + booking.children + booking.infants}</li>
            <li><strong>Adults:</strong> ${booking.adults}</li>
            <li><strong>Children:</strong> ${booking.children}</li>
            <li><strong>Infants:</strong> ${booking.infants}</li>
            <li><strong>Rooms:</strong> ${booking.rooms}</li>
            <li><strong>Total Price:</strong> $${booking.totalPrice.toFixed(2)}</li>
          </ul>
          <hr>
        `;
      });

      document.getElementById("cartSummary").innerHTML = bookingHTML;
      localStorage.removeItem("hotelCart");

    })
    .catch((error) => {
      alert("Failed to book hotels: " + error.message);
      console.error("Error:", error);
    });
}


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
