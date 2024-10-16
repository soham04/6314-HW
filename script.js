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
  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const phone = document.getElementById("phone").value;
  const email = document.getElementById("email").value;
  const comment = document.getElementById("comment").value;
  const gender = document.querySelector('input[name="gender"]:checked');

  const nameRegex = /^[A-Z][a-zA-Z]*$/;
  const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  clearError("contactError");

  if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
    displayError("First and last name must start with a capital letter and contain only alphabetic characters.", "contactError");
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
  return true;
}

// Toggle Return Date based on Trip Type Selection
function toggleReturnDate() {
  const tripType = document.getElementById("tripType").value;
  document.getElementById("returnDateContainer").style.display = tripType === "roundtrip" ? "block" : "none";
}

// Toggle Passenger Form
function togglePassengerForm() {
  const passengerForm = document.getElementById("passengerForm");
  passengerForm.style.display = passengerForm.style.display === "none" ? "block" : "none";
}

// Flights Form Validation
function validateFlightForm() {
  const origin = document.getElementById("origin").value.trim().toLowerCase();
  const destination = document.getElementById("destination").value.trim().toLowerCase();
  const tripType = document.getElementById("tripType").value;
  const departureDateInput = document.getElementById("departureDate").value;
  const returnDateInput = document.getElementById("returnDate").value;
  const departureDate = departureDateInput ? new Date(departureDateInput) : null;
  const returnDate = returnDateInput ? new Date(returnDateInput) : null;
  const adults = parseInt(document.getElementById("adults").value) || 0;
  const children = parseInt(document.getElementById("children").value) || 0;
  const infants = parseInt(document.getElementById("infants").value) || 0;

  // Updated valid cities list (case-insensitive)
  const validCities = [
    "abilene", "amarillo", "austin", "brownsville", "college station", "corpus christi", "dallas", "el paso", 
    "fort worth", "galveston", "harlingen", "houston", "killeen", "laredo", "longview", "lubbock", "mcallen", 
    "midland", "san antonio", "texarkana", "tyler", "victoria", "waco", "bakersfield", "burbank", "fresno", 
    "los angeles", "long beach", "modesto", "ontario", "palm springs", "riverside", "sacramento", "san diego", 
    "san francisco", "san jose", "santa ana", "santa barbara", "santa rosa", "simi valley", "stockton", 
    "torrance", "visalia"
  ];
  
  const startDate = new Date("2024-09-01");
  const endDate = new Date("2024-12-01");

  clearError("flightError");

  // Validate origin and destination (case-insensitive)
  if (!validCities.includes(origin) || !validCities.includes(destination)) {
    displayError("Origin and destination must be a city in Texas or California.", "flightError");
    document.getElementById("flightSummary").style.display = "none";
    return false;
  }

  // Validate departure date
  if (!departureDateInput) {
    displayError("Please select a departure date.", "flightError");
    document.getElementById("flightSummary").style.display = "none";
    return false;
  }
  if (departureDate < startDate || departureDate > endDate) {
    displayError("Departure date must be between September 1, 2024 and December 1, 2024.", "flightError");
    document.getElementById("flightSummary").style.display = "none";
    return false;
  }

  // Validate return date for round trip
  if (tripType === "roundtrip") {
    if (!returnDateInput) {
      displayError("Please select a return date for a round trip.", "flightError");
      document.getElementById("flightSummary").style.display = "none";
      return false;
    }
    if (returnDate <= departureDate) {
      displayError("Return date must be after the departure date.", "flightError");
      document.getElementById("flightSummary").style.display = "none";
      return false;
    }
  }

  // Validate passenger count
  if (adults > 4 || children > 4 || infants > 4) {
    displayError("Number of passengers for each category (adults, children, infants) cannot exceed 4.", "flightError");
    document.getElementById("flightSummary").style.display = "none";
    return false;
  }
  if (adults + children + infants === 0) {
    displayError("Please select at least one passenger.", "flightError");
    document.getElementById("flightSummary").style.display = "none";
    return false;
  }

  // If all validations pass, display the summary
  const summary = `
    <h3>Flight Summary</h3>
    <p><strong>Trip Type:</strong> ${tripType === "oneway" ? "One Way" : "Round Trip"}</p>
    <p><strong>Origin:</strong> ${capitalize(origin)}</p>
    <p><strong>Destination:</strong> ${capitalize(destination)}</p>
    <p><strong>Departure Date:</strong> ${departureDateInput}</p>
    ${tripType === "roundtrip" ? `<p><strong>Return Date:</strong> ${returnDateInput}</p>` : ""}
    <p><strong>Passengers:</strong></p>
    <ul>
      <li>Adults: ${adults}</li>
      <li>Children: ${children}</li>
      <li>Infants: ${infants}</li>
    </ul>
  `;
  document.getElementById("flightSummary").innerHTML = summary;
  document.getElementById("flightSummary").style.display = "block";
  return true;
}

// Helper function to capitalize the first letter of each word
function capitalize(str) {
  return str
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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

  // Updated valid cities list (case-insensitive)
  const validCities = [
    "abilene", "amarillo", "austin", "brownsville", "college station", "corpus christi", "dallas", "el paso", 
    "fort worth", "galveston", "harlingen", "houston", "killeen", "laredo", "longview", "lubbock", "mcallen", 
    "midland", "san antonio", "texarkana", "tyler", "victoria", "waco", "bakersfield", "burbank", "fresno", 
    "los angeles", "long beach", "modesto", "ontario", "palm springs", "riverside", "sacramento", "san diego", 
    "san francisco", "san jose", "santa ana", "santa barbara", "santa rosa", "simi valley", "stockton", 
    "torrance", "visalia"
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
    document.getElementById("staySummary").style.display = "none";
    return false;
  }
  if (checkInDate < startDate || checkInDate > endDate || checkOutDate < startDate || checkOutDate > endDate) {
    displayError("Check-in and check-out dates must be between September 1, 2024 and December 1, 2024.", "stayError");
    document.getElementById("staySummary").style.display = "none";
    return false;
  }
  if (checkInDate >= checkOutDate) {
    displayError("Check-out date must be after check-in date.", "stayError");
    document.getElementById("staySummary").style.display = "none";
    return false;
  }

  // Validate guest count
  if (adults === 0 && (children > 0 || infants > 0)) {
    displayError("At least one adult is required if there are children or infants.", "stayError");
    document.getElementById("staySummary").style.display = "none";
    return false;
  }
  if (adults + children + infants === 0) {
    displayError("Number of guests cannot be 0. Please select at least one guest.", "stayError");
    document.getElementById("staySummary").style.display = "none";
    return false;
  }

  // Calculate required rooms
  const totalGuests = adults + children;
  let roomsNeeded = Math.ceil(totalGuests / 2);

  // Display summary
  const summary = `
    <h3>Stay Summary</h3>
    <p><strong>City:</strong> ${capitalize(city)}</p>
    <p><strong>Check-In Date:</strong> ${checkInDateInput}</p>
    <p><strong>Check-Out Date:</strong> ${checkOutDateInput}</p>
    <p><strong>Guests:</strong></p>
    <ul>
      <li>Adults: ${adults}</li>
      <li>Children: ${children}</li>
      <li>Infants: ${infants}</li>
    </ul>
    <p><strong>Number of Rooms Needed:</strong> ${roomsNeeded}</p>
  `;
  document.getElementById("staySummary").innerHTML = summary;
  document.getElementById("staySummary").style.display = "block";
  return true;
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
    "abilene", "amarillo", "austin", "brownsville", "college station", "corpus christi", "dallas", "el paso", 
    "fort worth", "galveston", "harlingen", "houston", "killeen", "laredo", "longview", "lubbock", "mcallen", 
    "midland", "san antonio", "texarkana", "tyler", "victoria", "waco", "bakersfield", "burbank", "fresno", 
    "los angeles", "long beach", "modesto", "ontario", "palm springs", "riverside", "sacramento", "san diego", 
    "san francisco", "san jose", "santa ana", "santa barbara", "santa rosa", "simi valley", "stockton", 
    "torrance", "visalia"
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
    displayError("Car type must be Economy, SUV, Compact, or Midsize.", "carError");
    document.getElementById("carSummary").style.display = "none";
    return false;
  }

  // Validate check-in and check-out dates
  if (!checkInDateInput || !checkOutDateInput) {
    displayError("Please select both check-in and check-out dates.", "carError");
    document.getElementById("carSummary").style.display = "none";
    return false;
  }
  if (checkInDate < startDate || checkInDate > endDate || checkOutDate < startDate || checkOutDate > endDate) {
    displayError("Check-in and check-out dates must be between September 1, 2024 and December 1, 2024.", "carError");
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
  const departingDate = departingDateInput ? new Date(departingDateInput) : null;
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
    $("#cruiseError").text("Destination must be Alaska, Bahamas, Europe, or Mexico.").css("color", "red");
    $("#cruiseSummary").hide();
    return false;
  }

  // Validate departing date
  if (!departingDateInput) {
    $("#cruiseError").text("Please select a departing date.").css("color", "red");
    $("#cruiseSummary").hide();
    return false;
  }
  if (departingDate < startDate || departingDate > endDate) {
    $("#cruiseError").text("Departing date must be between September 1, 2024, and December 1, 2024.").css("color", "red");
    $("#cruiseSummary").hide();
    return false;
  }

  // Validate duration
  if (durationMin < 3 || durationMax > 10 || durationMin > durationMax) {
    $("#cruiseError").text("Duration must be between 3 and 10 days, and minimum should not exceed maximum.").css("color", "red");
    $("#cruiseSummary").hide();
    return false;
  }

  // Validate guest count
  if (adults === 0 && (children > 0 || infants > 0)) {
    $("#cruiseError").text("At least one adult is required if there are children or infants.").css("color", "red");
    $("#cruiseSummary").hide();
    return false;
  }
  if (adults + children + infants === 0) {
    $("#cruiseError").text("Number of guests cannot be 0. Please select at least one guest.").css("color", "red");
    $("#cruiseSummary").hide();
    return false;
  }

  // Calculate required rooms based on adults and children (infants do not count toward room limit)
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