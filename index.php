<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

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

// Register User
if ($requestUri === '/register' && $requestMethod === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['phone'], $input['password'], $input['firstName'], $input['lastName'], $input['dob'], $input['email'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields"]);
        exit;
    }

    // Validate inputs
    if (!preg_match('/^\d{3}-\d{3}-\d{4}$/', $input['phone'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid phone number format (ddd-ddd-dddd)"]);
        exit;
    }
    if (strlen($input['password']) < 8) {
        http_response_code(400);
        echo json_encode(["error" => "Password must be at least 8 characters long"]);
        exit;
    }
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid email address"]);
        exit;
    }

    // Check unique phone number
    $stmt = $conn->prepare("SELECT phone FROM users WHERE phone = ?");
    $stmt->bind_param("s", $input['phone']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        http_response_code(400);
        echo json_encode(["error" => "Phone number already exists"]);
        exit;
    }

    // Insert user
    $stmt = $conn->prepare("INSERT INTO users (phone, password, firstName, lastName, dob, email, gender) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param(
        "sssssss",
        $input['phone'],
        password_hash($input['password'], PASSWORD_BCRYPT),
        $input['firstName'],
        $input['lastName'],
        $input['dob'],
        $input['email'],
        $input['gender'] ?? null
    );
    if ($stmt->execute()) {
        echo json_encode(["message" => "User registered successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to register user"]);
    }
}

// User Login
elseif ($requestUri === '/login' && $requestMethod === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['phone'], $input['password'])) {
        http_response_code(400);
        echo json_encode(["error" => "Phone number and password are required"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT password FROM users WHERE phone = ?");
    $stmt->bind_param("s", $input['phone']);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        http_response_code(401);
        echo json_encode(["error" => "Invalid phone number or password"]);
        exit;
    }

    $user = $result->fetch_assoc();
    if (!password_verify($input['password'], $user['password'])) {
        http_response_code(401);
        echo json_encode(["error" => "Invalid phone number or password"]);
        exit;
    }

    echo json_encode(["message" => "Login successful"]);
}

// Flight Search
elseif ($requestUri === '/flights' && $requestMethod === 'GET') {
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
}

$conn->close();
?>
