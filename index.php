<?php
// CORS Headers
header("Access-Control-Allow-Origin: http://127.0.0.1:5500"); // Replace with the origin of your Live Server
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

ini_set('session.cookie_samesite', 'None'); // Allow cross-site usage
ini_set('session.cookie_secure', '1'); // Ensure the cookie is sent over HTTPS


ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

ini_set('log_errors', 1); // Enable logging
ini_set('error_log', __DIR__ . '/php-error.log'); // Log to a file in the current directory

// Database connection
$host = "sql3.freesqldatabase.com";
$user = "sql3748382";
$password = "K6QkP95uSm"; // Update with your database password
$dbname = "sql3748382"; // Update with your database name

$conn = new mysqli($host, $user, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(["error" => "Database connection failed"]));
}

// Routing logic
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Flights Search Route
if ($requestUri === '/flights' && $requestMethod === 'GET') {
    $origin = $_GET['origin'] ?? null;
    $destination = $_GET['destination'] ?? null;
    $departureDate = $_GET['departureDate'] ?? null;

    // Debugging Logs
    error_log("Received Parameters: Origin=$origin, Destination=$destination, DepartureDate=$departureDate");

    if (!$origin || !$destination || !$departureDate) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required parameters"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM flights WHERE origin = ? AND destination = ? AND departure_date = ?");
    $stmt->bind_param("sss", $origin, $destination, $departureDate);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["error" => "No flights found"]);
        exit;
    }

    $flights = [];
    while ($row = $result->fetch_assoc()) {
        $flights[] = $row;
    }

    echo json_encode($flights);
}

// Flight Booking Route
if ($requestUri === '/book-flight' && $requestMethod === 'POST') {
    session_start(); // Start the session
    if (!isset($_SESSION['firstName'], $_SESSION['lastName'], $_SESSION['phone'])) {
        // If the user is not logged in, return an error
        http_response_code(403);
        echo json_encode(["error" => "You must be logged in to book a flight."]);
        exit;
    }

    // Get JSON input
    $input = json_decode(file_get_contents(filename: 'php://input'), true);

    // Validate input data
    if (!isset($input['flightId'], $input['passengers']) || !is_array($input['passengers']) || empty($input['passengers'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid request. Provide flightId and passenger details."]);
        exit;
    }

    $flightId = $input['flightId'];
    $passengers = $input['passengers'];

    // Validate flight existence and availability
    $stmt = $conn->prepare("SELECT * FROM flights WHERE flight_id = ?");
    $stmt->bind_param("s", $flightId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["error" => "Flight not found."]);
        exit;
    }

    $flight = $result->fetch_assoc();

    // Validate seat availability
    $totalPassengers = count($passengers);
    if ($flight['available_seats'] < $totalPassengers) {
        http_response_code(400);
        echo json_encode(["error" => "Not enough seats available."]);
        exit;
    }

    // Calculate total price
    $adultPrice = $flight['price'];
    $totalPrice = 0;
    foreach ($passengers as $passenger) {
        if ($passenger['category'] === 'infant') {
            $totalPrice += $adultPrice * 0.1; // 10% of adult price
        } elseif ($passenger['category'] === 'child') {
            $totalPrice += $adultPrice * 0.7; // 70% of adult price
        } else {
            $totalPrice += $adultPrice; // Full adult price
        }
    }

    // Insert flight booking
    $bookingId = uniqid('BKG-');
    $stmt = $conn->prepare("INSERT INTO flight_booking (flight_booking_id, flight_id, total_price) VALUES (?, ?, ?)");
    $stmt->bind_param("ssi", $bookingId, $flightId, $totalPrice);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to book flight."]);
        exit;
    }

    // Insert passenger and ticket information
    foreach ($passengers as $passenger) {
        // Insert passenger details
        $stmt = $conn->prepare("INSERT INTO passenger (ssn, first_name, last_name, dob, category) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $passenger['ssn'], $passenger['firstName'], $passenger['lastName'], $passenger['dob'], $passenger['category']);
        if (!$stmt->execute()) {
            http_response_code(500);
            echo json_encode(["error" => "Failed to add passenger details."]);
            exit;
        }

        // Insert ticket information
        $ticketId = uniqid('TCK-');
        $price = ($passenger['category'] === 'infant') ? $adultPrice * 0.1 :
            (($passenger['category'] === 'child') ? $adultPrice * 0.7 : $adultPrice);
        $stmt = $conn->prepare("INSERT INTO tickets (ticket_id, flight_booking_id, ssn, price) VALUES (?, ?, ?, ?)");
        // echo "reached here";
        // echo $ticketId;
        $stmt->bind_param("sssi", $ticketId, $bookingId, $passenger['ssn'], $price);
        if (!$stmt->execute()) {
            $error = $stmt->error;
            http_response_code(500);
            echo json_encode(["error" => "Failed to add ticket information: " . $error]);
            exit;
        }
    }

    // Update available seats
    $stmt = $conn->prepare("UPDATE flights SET available_seats = available_seats - ? WHERE flight_id = ?");
    $stmt->bind_param("is", $totalPassengers, $flightId);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to update available seats."]);
        exit;
    }

    // Respond with booking details
    echo json_encode([
        "message" => "Flight booked successfully.",
        "bookingDetails" => [
            "bookingId" => $bookingId,
            "flightDetails" => $flight,
            "passengers" => $passengers,
            "totalPrice" => $totalPrice,
        ]
    ]);
} elseif ($requestUri === '/register' && $requestMethod === 'POST') {
    // Log the initial step
    error_log("Register route hit");

    // Read and decode the input data from the request body
    $input = json_decode(file_get_contents('php://input'), true);
    error_log("Input data: " . print_r($input, true));

    // List of required fields for validation
    $requiredFields = ['phone', 'password', 'firstName', 'lastName', 'dob', 'email'];

    // Validate required fields
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            error_log("Validation failed: Missing or empty field: $field");
            http_response_code(400); // Bad Request
            echo json_encode(["error" => "Missing or empty field: $field"]);
            exit;
        }
    }
    error_log("All required fields are present");

    // Validate phone number format (ddd-ddd-dddd)
    if (!preg_match('/^\d{3}-\d{3}-\d{4}$/', $input['phone'])) {
        error_log("Validation failed: Invalid phone number format");
        http_response_code(400); // Bad Request
        echo json_encode(["error" => "Invalid phone number format. Expected: ddd-ddd-dddd."]);
        exit;
    }
    error_log("Phone number format is valid");

    // Validate password strength (min 8 chars, 1 uppercase, 1 number)
    if (strlen($input['password']) < 8 || !preg_match('/[A-Z]/', $input['password']) || !preg_match('/\d/', $input['password'])) {
        error_log("Validation failed: Weak password");
        http_response_code(400); // Bad Request
        echo json_encode(["error" => "Password must be at least 8 characters long and include at least one uppercase letter and one number."]);
        exit;
    }
    error_log("Password strength is valid");

    // Validate email format
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        error_log("Validation failed: Invalid email address");
        http_response_code(400); // Bad Request
        echo json_encode(["error" => "Invalid email address."]);
        exit;
    }
    error_log("Email format is valid");

    // Check if phone number is unique
    error_log("Checking for duplicate phone numbers");
    $stmt = $conn->prepare("SELECT phone FROM users WHERE phone = ?");
    if (!$stmt) {
        error_log("Database error: Failed to prepare SELECT statement");
        http_response_code(500); // Internal Server Error
        echo json_encode(["error" => "Database error: Failed to prepare statement."]);
        exit;
    }
    $stmt->bind_param("s", $input['phone']);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        error_log("Validation failed: Duplicate phone number found");
        http_response_code(409); // Conflict
        echo json_encode(["error" => "Phone number already exists."]);
        exit;
    }
    error_log("Phone number is unique");

    // **MARKED CHANGE: Assign values to variables**
    // Bind variables for bind_param to avoid "only variables can be passed by reference" error
    $phone = $input['phone'];
    $hashedPassword = password_hash($input['password'], PASSWORD_BCRYPT); // Hash the password securely
    $firstName = $input['firstName'];
    $lastName = $input['lastName'];
    $dob = $input['dob'];
    $email = $input['email'];
    $gender = isset($input['gender']) ? $input['gender'] : null; // Handle optional gender field

    // **MARKED CHANGE: Prepare INSERT query**
    $stmt = $conn->prepare("INSERT INTO users (phone, password, firstName, lastName, dob, email, gender) VALUES (?, ?, ?, ?, ?, ?, ?)");
    if (!$stmt) {
        error_log("Database error: Failed to prepare INSERT statement");
        http_response_code(500); // Internal Server Error
        echo json_encode(["error" => "Database error: Failed to prepare statement."]);
        exit;
    }

    // **MARKED CHANGE: Bind parameters using variables**
    if (!$stmt->bind_param("sssssss", $phone, $hashedPassword, $firstName, $lastName, $dob, $email, $gender)) {
        error_log("Database error: Failed to bind parameters - " . $stmt->error);
        http_response_code(500);
        echo json_encode(["error" => "Database error: Failed to bind parameters."]);
        exit;
    }
    error_log("Bound parameters for INSERT statement: " . print_r([$phone, $hashedPassword, $firstName, $lastName, $dob, $email, $gender], true));

    // Execute the statement
    if (!$stmt->execute()) {
        error_log("Database error: Failed to execute INSERT statement - " . $stmt->error);
        http_response_code(500); // Internal Server Error
        echo json_encode(["error" => "Database error: Failed to insert user."]);
        exit;
    }

    // Log successful registration
    error_log("User registered successfully");
    http_response_code(201); // Created
    echo json_encode(["message" => "User registered successfully."]);
    exit;
}

// Hotel Search Route
if ($requestUri === '/hotels' && $requestMethod === 'GET') {
    // Get query parameters
    $city = $_GET['city'] ?? null;
    $checkInDate = $_GET['checkInDate'] ?? null;
    $checkOutDate = $_GET['checkOutDate'] ?? null;
    $roomsRequired = $_GET['roomsRequired'] ?? null;

    // Debugging Logs
    error_log("Received Parameters: City=$city, CheckInDate=$checkInDate, CheckOutDate=$checkOutDate, RoomsRequired=$roomsRequired");

    // Validate required parameters
    if (!$city || !$checkInDate || !$checkOutDate || !$roomsRequired) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required parameters"]);
        exit;
    }

    // Check if the city is valid (Example cities for Texas and California)
    $validCities = [
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
        "visalia"
    ];

    // Validate if the city is in the allowed list
    if (!in_array(strtolower($city), $validCities)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid city. Please select a city in Texas or California."]);
        exit;
    }

    // Query the database for available hotels in the specified city and date range
    $stmt = $conn->prepare("SELECT * FROM hotels WHERE city = ? AND available_rooms >= ? AND check_in_date >= ? AND check_out_date <= ?");
    $stmt->bind_param("siss", $city, $roomsRequired, $checkInDate, $checkOutDate);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["error" => "No hotels found for the specified criteria"]);
        exit;
    }

    $hotels = [];
    while ($row = $result->fetch_assoc()) {
        $hotels[] = $row;
    }

    echo json_encode($hotels);
} elseif ($requestUri === '/login' && $requestMethod === 'POST') {
    session_start(); // Start session
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate input
    if (!isset($input['phone'], $input['password'])) {
        http_response_code(400);
        echo json_encode(["error" => "Phone number and password are required."]);
        exit;
    }

    // Fetch user details from the database
    $stmt = $conn->prepare("SELECT phone, firstName, lastName, dob, email, gender, password FROM users WHERE phone = ?");
    $stmt->bind_param("s", $input['phone']);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();

        // Verify password
        if (password_verify($input['password'], $user['password'])) {
            // Store all required fields in the session
            $_SESSION['phone'] = $user['phone'];
            $_SESSION['firstName'] = $user['firstName'];
            $_SESSION['lastName'] = $user['lastName'];
            $_SESSION['dob'] = $user['dob'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['gender'] = $user['gender'];

            // Mark admin if phone is 222-222-2222
            if ($input['phone'] === '222-222-2222') {
                $_SESSION['isAdmin'] = true;
            } else {
                $_SESSION['isAdmin'] = false;
            }

            error_log("Session after login: " . print_r($_SESSION, true)); // Debugging
            echo json_encode(["message" => "Login successful"]);
            exit;
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Invalid phone number or password."]);
            exit;
        }
    }

    http_response_code(401);
    echo json_encode(["error" => "Invalid phone number or password."]);
    exit;
} elseif ($requestUri === '/logout' && $requestMethod === 'GET') {
    session_start();
    session_unset();
    session_destroy();
    echo json_encode(["message" => "Logged out successfully"]);
}

// Handle getUser route
if ($requestUri === '/getUser' && $requestMethod === 'GET') {
    session_start(); // Start session
    error_log("Session Data in getUser: " . print_r($_SESSION, true));
    if (isset($_SESSION['firstName'], $_SESSION['lastName'])) {
        echo json_encode([
            'firstName' => $_SESSION['firstName'],
            'lastName' => $_SESSION['lastName']
        ]);
    } else {
        echo json_encode([]);
    }
    exit;
}
if ($requestUri === '/submit-contact' && $requestMethod === 'POST') {
    // Check if the user is logged in
    session_start();
    if (!isset($_SESSION['firstName']) || !isset($_SESSION['lastName'])) {
        http_response_code(401);
        echo json_encode(["error" => "You must log in to submit a comment."]);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    // Validate comment length
    if (!isset($input['comment']) || strlen($input['comment']) < 10) {
        http_response_code(400);
        echo json_encode(["error" => "Comment must be at least 10 characters long."]);
        exit;
    }

    // Generate a unique contact ID
    $contactId = uniqid("CONTACT_");

    // Create an XML file if it doesn't exist
    $xmlFile = 'contactUs.xml';
    if (!file_exists($xmlFile)) {
        $xml = new SimpleXMLElement('<contacts></contacts>');
        $xml->asXML($xmlFile);
    }

    // Load the existing XML
    $xml = simplexml_load_file($xmlFile);

    // Add the new contact
    $contact = $xml->addChild('contact');
    $contact->addChild('contactId', $contactId);
    $contact->addChild('phone', $_SESSION['phone']);
    $contact->addChild('firstName', $_SESSION['firstName']);
    $contact->addChild('lastName', $_SESSION['lastName']);
    $contact->addChild('dob', $_SESSION['dob']);
    $contact->addChild('email', $_SESSION['email']);
    $contact->addChild('gender', $_SESSION['gender']);
    $contact->addChild('comment', $input['comment']);

    // Save the XML file
    $xml->asXML($xmlFile);

    echo json_encode(["message" => "Comment submitted successfully."]);
}

if ($requestUri === '/load-hotels' && $requestMethod === 'POST') {
    // checkAdminAuthorization();
    session_start();

    if (!isset($_SESSION['phone']) || $_SESSION['phone'] !== '222-222-2222') {
        http_response_code(403);
        echo json_encode(["error" => "Access denied. Admin login required."]);
        exit;
    }

    if (isset($_FILES['hotelFile']) && $_FILES['hotelFile']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['hotelFile']['tmp_name'];

        // Read the JSON file
        $fileContent = file_get_contents($fileTmpPath);
        $hotels = json_decode($fileContent, true);

        if ($hotels === null) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid JSON file."]);
            exit;
        }

        foreach ($hotels as $hotel) {
            if (!isset($hotel['hotelId'], $hotel['name'], $hotel['city'], $hotel['pricePerNight'])) {
                http_response_code(400);
                echo json_encode(["error" => "Missing required fields in JSON."]);
                exit;
            }

            $stmt = $conn->prepare("INSERT INTO hotels (hotel_id, name, city, price_per_night) VALUES (?, ?, ?, ?)
                                    ON DUPLICATE KEY UPDATE name = VALUES(name), city = VALUES(city), price_per_night = VALUES(price_per_night)");
            $stmt->bind_param("sssd", $hotel['hotelId'], $hotel['name'], $hotel['city'], $hotel['pricePerNight']);


            if (!$stmt->execute()) {
                http_response_code(500);
                echo json_encode(["error" => "Failed to insert hotel data: " . $stmt->error]);
                exit;
            }
        }

        echo json_encode(["message" => "Hotel data uploaded successfully."]);
        exit;
    } else {
        $uploadError = $_FILES['hotelFile']['error'];
        http_response_code(400);
        echo json_encode(["error" => "File upload error. Error Code: $uploadError"]);
        exit;
    }
}

if ($requestUri === '/search-hotels' && $requestMethod === 'GET') {
    $city = $_GET['city'] ?? null;

    if (!$city) {
        http_response_code(400);
        echo json_encode(["error" => "City is required."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT hotel_id, name, city, price_per_night FROM hotels WHERE city = ?");
    $stmt->bind_param("s", $city);
    $stmt->execute();
    $result = $stmt->get_result();

    $hotels = [];
    while ($row = $result->fetch_assoc()) {
        $hotels[] = $row;
    }
    echo json_encode($hotels);
}



if ($requestUri === '/book-hotel' && $requestMethod === 'POST') {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate input data
    if (
        !isset(
        $input['hotelId'],
        $input['checkInDate'],
        $input['checkOutDate'],
        $input['numberOfRooms'],
        $input['pricePerNight'],
        $input['totalPrice'],
        $input['guests']
    ) || !is_array($input['guests']) || empty($input['guests'])
    ) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid request. Provide all required fields."]);
        exit;
    }

    $hotelId = $input['hotelId'];
    $checkInDate = $input['checkInDate'];
    $checkOutDate = $input['checkOutDate'];
    $numberOfRooms = $input['numberOfRooms'];
    $pricePerNight = $input['pricePerNight'];
    $totalPrice = $input['totalPrice'];
    $guests = $input['guests'];

    // Validate hotel existence
    $stmt = $conn->prepare("SELECT * FROM hotels WHERE hotel_id = ?");
    $stmt->bind_param("s", $hotelId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["error" => "Hotel not found."]);
        exit;
    }

    $hotel = $result->fetch_assoc();

    // Insert booking into hotel_booking table
    $hotelBookingId = uniqid('HBK-');
    $stmt = $conn->prepare(
        "INSERT INTO hotel_booking (hotel_booking_id, hotel_id, check_in_date, check_out_date, number_of_rooms, price_per_night, total_price) 
        VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param(
        "sssssii",
        $hotelBookingId,
        $hotelId,
        $checkInDate,
        $checkOutDate,
        $numberOfRooms,
        $pricePerNight,  // Include pricePerNight
        $totalPrice
    );
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to book the hotel."]);
        exit;
    }

    // Insert guests into guesses table
    foreach ($guests as $guest) {
        $ssn = $guest['ssn'];
        $firstName = $guest['firstName'];
        $lastName = $guest['lastName'];
        $dob = $guest['dob'];
        $category = $guest['category'];

        // Validate fields
        if (!isset($ssn, $firstName, $lastName, $dob, $category)) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid guest details."]);
            exit;
        }

        $stmt = $conn->prepare(
            "INSERT INTO guests (ssn, hotel_booking_id, first_name, last_name, dob, category) 
            VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("ssssss", $ssn, $hotelBookingId, $firstName, $lastName, $dob, $category);

        if (!$stmt->execute()) {
            $error = $stmt->error;
            http_response_code(500);
            echo json_encode(["error" => "Failed to add guest details: " . $error]);
            exit;
        }
    }

    // Respond with booking confirmation
    http_response_code(200);
    echo json_encode([
        "message" => "Hotel booked successfully.",
        "bookingDetails" => [
            "hotelBookingId" => $hotelBookingId,
            "hotelId" => $hotel['hotel_id'],
            "hotelName" => $hotel['name'],
            "city" => $hotel['city'],
            "pricePerNight" => $pricePerNight,
            "checkInDate" => $checkInDate,
            "checkOutDate" => $checkOutDate,
            "totalPrice" => $totalPrice,
            "guests" => $guests,
        ],
    ]);
}


// Middleware to check if the user is logged in and is not an admin
function checkAdminAuthorization()
{
    session_start(); // Ensure session is started

    // Check if the user is logged in
    if (!isset($_SESSION['phone'])) {
        http_response_code(403);
        echo json_encode(["error" => "Unauthorized access. User not logged in."]);
        exit;
    }

    // Ensure the user has admin privileges
    if (!isset($_SESSION['isAdmin']) || $_SESSION['isAdmin'] !== true) {
        http_response_code(403);
        echo json_encode(["error" => "Unauthorized access. Admin privileges required."]);
        exit;
    }

    // If admin, allow access
    return true;
}



// Retrieve bookings by Flight Booking ID and Hotel Booking ID
if ($requestUri === '/account/bookings' && $requestMethod === 'GET') {
    // checkUserAuthorization();

    $flightBookingId = $_GET['flightBookingId'] ?? null;
    $hotelBookingId = $_GET['hotelBookingId'] ?? null;

    $results = [];

    if ($flightBookingId) {
        $stmt = $conn->prepare("SELECT * FROM flight_booking WHERE flight_booking_id = ?");
        $stmt->bind_param("s", $flightBookingId);
        $stmt->execute();
        $flightBooking = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $results['flight'] = $flightBooking ?: ["message" => "No flight found with the given ID."];
    }

    if ($hotelBookingId) {
        $stmt = $conn->prepare("SELECT * FROM hotel_booking WHERE hotel_booking_id = ?");
        $stmt->bind_param("s", $hotelBookingId);
        $stmt->execute();
        $hotelBooking = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $results['hotel'] = $hotelBooking ?: ["message" => "No hotel found with the given ID."];
    }

    echo json_encode($results);
    exit;
}

if ($requestUri === '/account/passengers' && $requestMethod === 'GET') {
    // Check if user is authorized

    $flightBookingId = $_GET['flightBookingId'] ?? null;

    if (!$flightBookingId) {
        http_response_code(400);
        echo json_encode(["error" => "Flight Booking ID is required."]);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT p.ssn, p.first_name, p.last_name, p.dob, p.category
        FROM passenger p
        INNER JOIN tickets t ON p.ssn = t.ssn
        WHERE t.flight_booking_id = ?
    ");
    $stmt->bind_param("s", $flightBookingId);
    $stmt->execute();
    $passengers = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    echo json_encode($passengers ?: ["message" => "No passengers found for the given Flight Booking ID."]);
    exit;
}


if ($requestUri === '/account/bookings/sep2024' && $requestMethod === 'GET') {
    // checkUserAuthorization();

    $stmt = $conn->prepare("
        SELECT 'Flight' AS booking_type, fb.flight_booking_id AS booking_id, fl.flight_id, fl.origin, fl.destination,
               fl.departure_date, fl.arrival_date, fl.departure_time, fl.arrival_time, fl.price AS price_per_unit,
               fb.total_price AS total_price
        FROM flight_booking fb
        JOIN flights fl ON fb.flight_id = fl.flight_id
        WHERE MONTH(fl.departure_date) = 9 AND YEAR(fl.departure_date) = 2024

        UNION ALL

        SELECT 'Hotel' AS booking_type, hb.hotel_booking_id AS booking_id, h.hotel_id, h.name AS hotel_name, h.city, 
               hb.check_in_date AS departure_date, hb.check_out_date AS arrival_date, NULL AS departure_time, 
               NULL AS arrival_time, h.price_per_night AS price_per_unit, hb.total_price AS total_price
        FROM hotel_booking hb
        JOIN hotels h ON hb.hotel_id = h.hotel_id
        WHERE MONTH(hb.check_in_date) = 9 AND YEAR(hb.check_in_date) = 2024
    ");

    $stmt->execute();
    $bookings = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    echo json_encode($bookings ?: ["message" => "No bookings found for September 2024."]);
    exit;
}


if ($requestUri === '/account/flights' && $requestMethod === 'GET') {
    // checkUserAuthorization();

    $ssn = $_GET['ssn'] ?? null;

    if (!$ssn) {
        http_response_code(400);
        echo json_encode(["error" => "SSN is required."]);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT fb.flight_booking_id, fb.total_price, f.flight_id, f.origin, f.destination,
               f.departure_date, f.arrival_date, f.departure_time, f.arrival_time, f.price,
               p.ssn, p.first_name, p.last_name, p.dob, p.category
        FROM flight_booking fb
        JOIN tickets t ON fb.flight_booking_id = t.flight_booking_id
        JOIN passenger p ON t.ssn = p.ssn
        JOIN flights f ON fb.flight_id = f.flight_id
        WHERE p.ssn = ?
    ");
    $stmt->bind_param("s", $ssn);
    $stmt->execute();
    $flights = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    echo json_encode($flights ?: ["message" => "No flights found for the given SSN."]);
    exit;
}

// Retrieve all booked flights departing from a city in Texas (Sep-Oct 2024)
if ($requestUri === '/admin/flights/texas-sep-oct' && $requestMethod === 'GET') {
    checkAdminAuthorization();
    $stmt = $conn->prepare("
        SELECT fb.flight_booking_id, fl.flight_id, fl.origin, fl.destination, fl.departure_date, fl.arrival_date, fl.departure_time, fl.arrival_time, fb.total_price
        FROM flight_booking fb
        JOIN flights fl ON fb.flight_id = fl.flight_id
        WHERE fl.origin IN (
            'Abilene', 'Amarillo', 'Austin', 'Brownsville', 'College Station', 
            'Corpus Christi', 'Dallas', 'El Paso', 'Fort Worth', 'Galveston', 
            'Harlingen', 'Houston', 'Killeen', 'Laredo', 'Longview', 'Lubbock', 
            'McAllen', 'Midland', 'San Antonio', 'Texarkana', 'Tyler', 
            'Victoria', 'Waco'
        ) AND fl.departure_date BETWEEN '2024-09-01' AND '2024-10-31';
    ");
    $stmt->execute();
    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    echo json_encode($results ?: ["message" => "No flights found."]);
    exit;
}

// Retrieve all booked hotels in a city in Texas (Sep-Oct 2024)
if ($requestUri === '/admin/hotels/texas-sep-oct' && $requestMethod === 'GET') {
    checkAdminAuthorization();

    $stmt = $conn->prepare("
        SELECT hb.hotel_booking_id, h.hotel_id, h.name, h.city, hb.check_in_date, hb.check_out_date, hb.number_of_rooms, hb.total_price
        FROM hotel_booking hb
        JOIN hotels h ON hb.hotel_id = h.hotel_id
        WHERE h.city IN (
            'Abilene', 'Amarillo', 'Austin', 'Brownsville', 'College Station', 
            'Corpus Christi', 'Dallas', 'El Paso', 'Fort Worth', 'Galveston', 
            'Harlingen', 'Houston', 'Killeen', 'Laredo', 'Longview', 'Lubbock', 
            'McAllen', 'Midland', 'San Antonio', 'Texarkana', 'Tyler', 
            'Victoria', 'Waco'
        ) AND hb.check_in_date BETWEEN '2024-09-01' AND '2024-10-31';
    ");
    $stmt->execute();
    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    echo json_encode($results ?: ["message" => "No hotels found."]);
    exit;
}

// Retrieve the most expensive booked hotels
if ($requestUri === '/admin/hotels/expensive' && $requestMethod === 'GET') {
    checkAdminAuthorization();

    $stmt = $conn->prepare("
        SELECT hb.hotel_booking_id, h.hotel_id, h.name, h.city, hb.total_price
        FROM hotel_booking hb
        JOIN hotels h ON hb.hotel_id = h.hotel_id
        ORDER BY hb.total_price DESC
        LIMIT 1;
    ");
    $stmt->execute();
    $results = $stmt->get_result()->fetch_assoc();
    echo json_encode($results ?: ["message" => "No hotel bookings found."]);
    exit;
}

// Retrieve flights with at least one infant passenger
if ($requestUri === '/admin/flights/with-infants' && $requestMethod === 'GET') {
    checkAdminAuthorization();

    $stmt = $conn->prepare("
        SELECT DISTINCT fb.flight_booking_id, fl.flight_id, fl.origin, fl.destination, fl.departure_date, fb.total_price
        FROM flight_booking fb
        JOIN tickets t ON fb.flight_booking_id = t.flight_booking_id
        JOIN passenger p ON t.ssn = p.ssn
        JOIN flights fl ON fb.flight_id = fl.flight_id
        WHERE p.category = 'Infant';
    ");
    $stmt->execute();
    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    echo json_encode($results ?: ["message" => "No flights found with infants."]);
    exit;
}

// Retrieve flights with at least one infant and 5 children
if ($requestUri === '/admin/flights/infants-and-children' && $requestMethod === 'GET') {
    checkAdminAuthorization();

    $stmt = $conn->prepare("
        SELECT fb.flight_booking_id, fl.flight_id, fl.origin, fl.destination, fl.departure_date, fb.total_price
        FROM flight_booking fb
        JOIN tickets t ON fb.flight_booking_id = t.flight_booking_id
        JOIN passenger p ON t.ssn = p.ssn
        JOIN flights fl ON fb.flight_id = fl.flight_id
        WHERE p.category = 'Infant'
        GROUP BY fb.flight_booking_id
        HAVING COUNT(CASE WHEN p.category = 'Child' THEN 1 END) >= 5;
    ");
    $stmt->execute();
    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    echo json_encode($results ?: ["message" => "No flights found with infants and 5 children."]);
    exit;
}

// Retrieve the most expensive booked flights
if ($requestUri === '/admin/flights/expensive' && $requestMethod === 'GET') {
    checkAdminAuthorization();

    $stmt = $conn->prepare("
        SELECT fb.flight_booking_id, fl.flight_id, fl.origin, fl.destination, fl.departure_date, fb.total_price
        FROM flight_booking fb
        JOIN flights fl ON fb.flight_id = fl.flight_id
        ORDER BY fb.total_price DESC
        LIMIT 1;
    ");
    $stmt->execute();
    $results = $stmt->get_result()->fetch_assoc();
    echo json_encode($results ?: ["message" => "No flight bookings found."]);
    exit;
}

// Retrieve flights departing from Texas without infants
if ($requestUri === '/admin/flights/texas-no-infants' && $requestMethod === 'GET') {
    checkAdminAuthorization();

    $stmt = $conn->prepare("
        SELECT fb.flight_booking_id, fl.flight_id, fl.origin, fl.destination, fl.departure_date, fb.total_price
        FROM flight_booking fb
        JOIN flights fl ON fb.flight_id = fl.flight_id
        WHERE fl.origin IN (
            'Abilene', 'Amarillo', 'Austin', 'Brownsville', 'College Station', 
            'Corpus Christi', 'Dallas', 'El Paso', 'Fort Worth', 'Galveston', 
            'Harlingen', 'Houston', 'Killeen', 'Laredo', 'Longview', 'Lubbock', 
            'McAllen', 'Midland', 'San Antonio', 'Texarkana', 'Tyler', 
            'Victoria', 'Waco'
        ) AND fb.flight_booking_id NOT IN (
            SELECT fb.flight_booking_id
            FROM flight_booking fb
            JOIN tickets t ON fb.flight_booking_id = t.flight_booking_id
            JOIN passenger p ON t.ssn = p.ssn
            WHERE p.category = 'Infant'
        );
    ");
    $stmt->execute();
    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    echo json_encode($results ?: ["message" => "No flights found from Texas without infants."]);
    exit;
}

// Retrieve number of flights arriving in California in Sep-Oct 2024
// Retrieve flights arriving in California (Sep-Oct 2024)
if ($requestUri === '/admin/flights/california-arrivals' && $requestMethod === 'GET') {
    checkAdminAuthorization();

    $stmt = $conn->prepare("
        SELECT fl.flight_id, fl.origin, fl.destination, fl.departure_date, fl.arrival_date, fl.departure_time, fl.arrival_time, fl.price
        FROM flights fl
        WHERE fl.destination IN (
            'Bakersfield', 'Burbank', 'Fresno', 'Los Angeles', 'Long Beach', 
            'Modesto', 'Ontario', 'Palm Springs', 'Riverside', 'Sacramento', 
            'San Diego', 'San Francisco', 'San Jose', 'Santa Ana', 'Santa Barbara', 
            'Santa Rosa', 'Simi Valley', 'Stockton', 'Torrance', 'Visalia'
        ) AND fl.arrival_date BETWEEN '2024-09-01' AND '2024-10-31' limit 10    ;
    ");
    $stmt->execute();
    $results = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    echo json_encode($results ?: ["message" => "No flights found arriving in California."]);
    exit;
}

// Load Flights Data from XML
// Route to upload flights from XML
if ($requestUri === '/load-flights' && $requestMethod === 'POST') {
    // Check if the user is an admin
    checkAdminAuthorization();

    // Check if a file is uploaded
    if (!isset($_FILES['flightFile']) || $_FILES['flightFile']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(["error" => "File upload error. Please upload a valid XML file."]);
        exit;
    }

    // Load the XML file
    $xmlFilePath = $_FILES['flightFile']['tmp_name'];
    $xmlContent = file_get_contents($xmlFilePath);

    // Parse the XML
    $flights = simplexml_load_string($xmlContent);
    if ($flights === false) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid XML structure. Please check your file."]);
        exit;
    }

    // Begin database transaction
    $conn->begin_transaction();
    try {
        foreach ($flights->flight as $flight) {
            // Check if the flight_id already exists
            $checkStmt = $conn->prepare("SELECT flight_id FROM flights WHERE flight_id = ?");
            $checkStmt->bind_param("s", $flight->id);
            $checkStmt->execute();
            $result = $checkStmt->get_result();

            if ($result->num_rows > 0) {
                // Update the existing record
                $updateStmt = $conn->prepare("
                    UPDATE flights
                    SET origin = ?, destination = ?, departure_date = ?, arrival_date = ?, departure_time = ?, arrival_time = ?, available_seats = ?, price = ?
                    WHERE flight_id = ?
                ");
                $updateStmt->bind_param(
                    "ssssssids",
                    $flight->origin,          // Correct
                    $flight->destination,     // Correct
                    $flight->departureDate,   // Correct
                    $flight->arrivalDate,     // Correct
                    $flight->departureTime,   // Correct
                    $flight->arrivalTime,     // Correct
                    $flight->availableSeats,  // Updated to map to availableSeats from XML
                    $flight->price,           // Correct
                    $flight->flightId         // Updated to map to flightId from XML
                );
                $updateStmt->execute();
            } else {
                // Insert a new record
                $insertStmt = $conn->prepare("
                    INSERT INTO flights (flight_id, origin, destination, departure_date, arrival_date, departure_time, arrival_time, available_seats, price)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $insertStmt->bind_param(
                    "sssssssis",
                    $flight->id,
                    $flight->origin,
                    $flight->destination,
                    $flight->departureDate,
                    $flight->arrivalDate,
                    $flight->departureTime,
                    $flight->arrivalTime,
                    $flight->seats,
                    $flight->price
                );
                $insertStmt->execute();
            }
        }

        // Commit transaction
        $conn->commit();
        echo json_encode(["message" => "Flights uploaded and updated successfully."]);
    } catch (Exception $e) {
        // Rollback transaction in case of an error
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["error" => "Failed to upload flights: " . $e->getMessage()]);
    }
}


$conn->close();
?>