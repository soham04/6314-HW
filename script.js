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
    return false;
  }

  // Validate departure date
  if (!departureDateInput) {
    displayError("Please select a departure date.", "flightError");
    return false;
  }
  if (departureDate < startDate || departureDate > endDate) {
    displayError("Departure date must be between September 1, 2024 and December 1, 2024.", "flightError");
    return false;
  }

  // Validate return date for round trip
  if (tripType === "roundtrip") {
    if (!returnDateInput) {
      displayError("Please select a return date for a round trip.", "flightError");
      return false;
    }
    if (returnDate <= departureDate) {
      displayError("Return date must be after the departure date.", "flightError");
      return false;
    }
  }

  // Validate passenger count
  if (adults > 4 || children > 4 || infants > 4) {
    displayError("Number of passengers for each category (adults, children, infants) cannot exceed 4.", "flightError");
    return false;
  }
  if (adults + children + infants === 0) {
    displayError("Please select at least one passenger.", "flightError");
    return false;
  }

  displayError("Flight form submitted successfully!", "flightError");
  return true;
}

// Stays Form Validation
function validateStayForm() {
  const city = document.getElementById("city").value;
  const checkInDate = new Date(document.getElementById("checkInDate").value);
  const checkOutDate = new Date(document.getElementById("checkOutDate").value);

  const validCities = ["Dallas", "Houston", "Austin", "San Antonio", "Los Angeles", "San Francisco", "San Diego"];
  const startDate = new Date("2024-09-01");
  const endDate = new Date("2024-12-01");

  clearError("stayError");

  if (!validCities.includes(city)) {
    displayError("City must be a city in Texas or California.", "stayError");
    return false;
  }
  if (checkInDate < startDate || checkInDate > endDate || checkOutDate < startDate || checkOutDate > endDate) {
    displayError("Check-in and check-out dates must be between September 1, 2024 and December 1, 2024.", "stayError");
    return false;
  }
  if (checkInDate >= checkOutDate) {
    displayError("Check-out date must be after check-in date.", "stayError");
    return false;
  }

  displayError("Stay form submitted successfully!", "stayError");
  return true;
}

// Cars Form Validation
function validateCarForm() {
  const city = document.getElementById("carCity").value;
  const carType = document.getElementById("carType").value;
  const checkInDate = new Date(document.getElementById("checkInDate").value);
  const checkOutDate = new Date(document.getElementById("checkOutDate").value);

  const validCities = ["Dallas", "Houston", "Austin", "San Antonio", "Los Angeles", "San Francisco", "San Diego"];
  const carTypes = ["economy", "SUV", "compact", "midsize"];
  const startDate = new Date("2024-09-01");
  const endDate = new Date("2024-12-01");

  clearError("carError");

  if (!validCities.includes(city)) {
    displayError("City must be a city in Texas or California.", "carError");
    return false;
  }
  if (!carTypes.includes(carType)) {
    displayError("Car type must be Economy, SUV, Compact, or Midsize.", "carError");
    return false;
  }
  if (checkInDate < startDate || checkInDate > endDate || checkOutDate < startDate || checkOutDate > endDate) {
    displayError("Check-in and check-out dates must be between September 1, 2024 and December 1, 2024.", "carError");
    return false;
  }
  if (checkInDate >= checkOutDate) {
    displayError("Check-out date must be after check-in date.", "carError");
    return false;
  }

  displayError("Car form submitted successfully!", "carError");
  return true;
}

// Cruises Form Validation
function validateCruiseForm() {
  const destination = document.getElementById("destination").value;
  const durationMin = parseInt(document.getElementById("durationMin").value);
  const durationMax = parseInt(document.getElementById("durationMax").value);
  const departureDate = new Date(document.getElementById("departureDate").value);

  const validDestinations = ["Alaska", "Bahamas", "Europe", "Mexico"];
  const startDate = new Date("2024-09-01");
  const endDate = new Date("2024-12-01");

  clearError("cruiseError");

  if (!validDestinations.includes(destination)) {
    displayError("Destination must be Alaska, Bahamas, Europe, or Mexico.", "cruiseError");
    return false;
  }
  if (durationMin < 3 || durationMax > 10 || durationMin > durationMax) {
    displayError("Cruise duration must be between 3 and 10 days.", "cruiseError");
    return false;
  }
  if (departureDate < startDate || departureDate > endDate) {
    displayError("Departure date must be between September 1, 2024 and December 1, 2024.", "cruiseError");
    return false;
  }

  displayError("Cruise form submitted successfully!", "cruiseError");
  return true;
}