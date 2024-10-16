// Display Date-Time
document.addEventListener("DOMContentLoaded", () => {
    const dateTimeElement = document.getElementById("date-time");
    if (dateTimeElement) {
      setInterval(() => {
        const now = new Date();
        dateTimeElement.textContent = now.toLocaleString();
      }, 1000);
    }
  });
  
  // Contact Form Validation
  function validateContactForm() {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const comment = document.getElementById("comment").value.trim();
    const gender = document.querySelector('input[name="gender"]:checked');
  
    const nameRegex = /^[A-Z][a-zA-Z]*$/;  // First letter must be uppercase, followed by alphabetic characters only
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;  // Format: (123) 456-7890
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  // Must contain '@' and '.'
  
    // Validate First Name
    if (!nameRegex.test(firstName)) {
      alert("First name must start with a capital letter and contain only alphabetic characters.");
      return false;
    }
  
    // Validate Last Name
    if (!nameRegex.test(lastName)) {
      alert("Last name must start with a capital letter and contain only alphabetic characters.");
      return false;
    }
  
    // Ensure First Name and Last Name are not the same
    if (firstName === lastName) {
      alert("First name and last name cannot be the same.");
      return false;
    }
  
    // Validate Phone Number
    if (!phoneRegex.test(phone)) {
      alert("Phone number must be in the format (123) 456-7890.");
      return false;
    }
  
    // Validate Email
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return false;
    }
  
    // Validate Gender Selection
    if (!gender) {
      alert("Please select a gender.");
      return false;
    }
  
    // Validate Comment Length
    if (comment.length < 10) {
      alert("Comment must be at least 10 characters.");
      return false;
    }
  
    // If all validations pass
    alert("Contact form submitted successfully!");
    return true;  // Allow form submission
  }
  
  // Flights Form Validation
  function toggleReturnDate() {
    const tripType = document.getElementById("tripType").value;
    document.getElementById("returnDateContainer").style.display = tripType === "roundtrip" ? "block" : "none";
  }
  
  function validateFlightForm() {
    const origin = document.getElementById("origin").value;
    const destination = document.getElementById("destination").value;
    const departureDate = new Date(document.getElementById("departureDate").value);
    const returnDate = document.getElementById("returnDate").value ? new Date(document.getElementById("returnDate").value) : null;
  
    const validCities = ["Dallas", "Houston", "Austin", "San Antonio", "Los Angeles", "San Francisco", "San Diego"];
    const today = new Date();
    const startDate = new Date("2024-09-01");
    const endDate = new Date("2024-12-01");
  
    if (!validCities.includes(origin) || !validCities.includes(destination)) {
      alert("Origin and destination must be a city in Texas or California.");
      return false;
    }
    if (departureDate < startDate || departureDate > endDate) {
      alert("Departure date must be between September 1, 2024 and December 1, 2024.");
      return false;
    }
    if (returnDate && (returnDate < departureDate || returnDate > endDate)) {
      alert("Return date must be after departure date and before December 1, 2024.");
      return false;
    }
  
    alert("Flight form submitted successfully!");
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
  
    if (!validCities.includes(city)) {
      alert("City must be a city in Texas or California.");
      return false;
    }
    if (checkInDate < startDate || checkInDate > endDate || checkOutDate < startDate || checkOutDate > endDate) {
      alert("Check-in and check-out dates must be between September 1, 2024 and December 1, 2024.");
      return false;
    }
    if (checkInDate >= checkOutDate) {
      alert("Check-out date must be after check-in date.");
      return false;
    }
  
    alert("Stay form submitted successfully!");
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
  
    if (!validCities.includes(city)) {
      alert("City must be a city in Texas or California.");
      return false;
    }
    if (!carTypes.includes(carType)) {
      alert("Car type must be Economy, SUV, Compact, or Midsize.");
      return false;
    }
    if (checkInDate < startDate || checkInDate > endDate || checkOutDate < startDate || checkOutDate > endDate) {
      alert("Check-in and check-out dates must be between September 1, 2024 and December 1, 2024.");
      return false;
    }
    if (checkInDate >= checkOutDate) {
      alert("Check-out date must be after check-in date.");
      return false;
    }
  
    alert("Car form submitted successfully!");
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
  
    if (!validDestinations.includes(destination)) {
      alert("Destination must be Alaska, Bahamas, Europe, or Mexico.");
      return false;
    }
    if (durationMin < 3 || durationMax > 10 || durationMin > durationMax) {
      alert("Cruise duration must be between 3 and 10 days.");
      return false;
    }
    if (departureDate < startDate || departureDate > endDate) {
      alert("Departure date must be between September 1, 2024 and December 1, 2024.");
      return false;
    }
  
    alert("Cruise form submitted successfully!");
    return true;
  }