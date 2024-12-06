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

// Flight Search
if ($requestUri === '/flights' && $requestMethod === 'GET') {
    $origin = $_GET['origin'] ?? null;
    $destination = $_GET['destination'] ?? null;
    $departureDate = $_GET['departureDate'] ?? null;

    if (!$origin || !$destination || !$departureDate) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required parameters"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM flights WHERE origin = ? AND destination = ? AND departure_date = ?");
    $stmt->bind_param("sss", $origin, $destination, $departureDate);
    $stmt->execute();
    $result = $stmt->get_result();

    $flights = [];
    while ($row = $result->fetch_assoc()) {
        $flights[] = $row;
    }

    echo json_encode($flights);
}

// Book a Flight
elseif ($requestUri === '/book-flight' && $requestMethod === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['flightId'], $input['passengers']) || !is_array($input['passengers']) || empty($input['passengers'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid request. Provide flightId and passengers."]);
        exit;
    }

    $flightId = $input['flightId'];
    $passengerCount = count($input['passengers']);

    // Check flight availability
    $stmt = $conn->prepare("SELECT available_seats FROM flights WHERE flight_id = ?");
    $stmt->bind_param("s", $flightId);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["error" => "Flight not found"]);
        exit;
    }

    $flight = $result->fetch_assoc();
    if ($flight['available_seats'] < $passengerCount) {
        http_response_code(400);
        echo json_encode(["error" => "Not enough seats available"]);
        exit;
    }

    // Update seats and insert booking
    $stmt = $conn->prepare("UPDATE flights SET available_seats = available_seats - ? WHERE flight_id = ?");
    $stmt->bind_param("is", $passengerCount, $flightId);
    $stmt->execute();

    $bookingId = uniqid('BKG-');
    $stmt = $conn->prepare("INSERT INTO flight_booking (flight_booking_id, flight_id, total_price) VALUES (?, ?, ?)");
    $totalPrice = 0; // Compute based on passengers
    $stmt->bind_param("ssi", $bookingId, $flightId, $totalPrice);
    $stmt->execute();

    echo json_encode(["message" => "Flight booked successfully", "bookingId" => $bookingId]);
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


$conn->close();
?>