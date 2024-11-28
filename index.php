<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Ensure directories exist
$contactSubsDir = __DIR__ . '/contactSubs';
if (!file_exists($contactSubsDir)) {
    mkdir($contactSubsDir, 0777, true);
}

$flightsXmlPath = __DIR__ . '/flights.xml';
$bookingsDir = __DIR__ . '/bookings';
$bookingsFilePath = $bookingsDir . '/flightBookings.json';
if (!file_exists($bookingsDir)) {
    mkdir($bookingsDir, 0777, true);
}

// Routing logic
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestMethod = $_SERVER['REQUEST_METHOD'];

if ($requestUri === '/submit-contact' && $requestMethod === 'POST') {
    // Save contact data as XML
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['firstName'], $input['lastName'], $input['phone'], $input['email'], $input['gender'], $input['comment'])) {
        http_response_code(400);
        echo json_encode(['error' => 'All fields are required']);
        exit;
    }

    $xmlContent = "
        <contact>
            <firstName>{$input['firstName']}</firstName>
            <lastName>{$input['lastName']}</lastName>
            <phone>{$input['phone']}</phone>
            <email>{$input['email']}</email>
            <gender>{$input['gender']}</gender>
            <comment>{$input['comment']}</comment>
        </contact>
    ";
    $fileName = "contact_" . time() . ".xml";
    $filePath = $contactSubsDir . '/' . $fileName;

    if (file_put_contents($filePath, $xmlContent)) {
        echo json_encode(['message' => 'Contact saved successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error saving contact']);
    }

} elseif ($requestUri === '/flights' && $requestMethod === 'GET') {
    // Serve flights.xml
    if (file_exists($flightsXmlPath)) {
        header('Content-Type: text/xml');
        readfile($flightsXmlPath);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Flights file not found']);
    }

} elseif ($requestUri === '/hotels' && $requestMethod === 'GET') {
    // Serve hotels.json
    $hotelsJsonPath = __DIR__ . '/hotels.json';
    if (file_exists($hotelsJsonPath)) {
        header('Content-Type: application/json');
        readfile($hotelsJsonPath);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Hotels file not found']);
    }

} elseif ($requestUri === '/book-flight' && $requestMethod === 'POST') {
    // Book a flight
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['flightId'], $input['passengers']) || !is_array($input['passengers']) || empty($input['passengers'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request. Provide flightId and passengers.']);
        exit;
    }

    if (!file_exists($flightsXmlPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Flights file not found']);
        exit;
    }

    $flightsXml = simplexml_load_file($flightsXmlPath);
    $flight = null;
    foreach ($flightsXml->flight as $f) {
        if ((string) $f->flightId === $input['flightId']) {
            $flight = $f;
            break;
        }
    }

    if (!$flight) {
        http_response_code(404);
        echo json_encode(['error' => 'Flight not found']);
        exit;
    }

    $availableSeats = (int) $flight->availableSeats;
    if (count($input['passengers']) > $availableSeats) {
        http_response_code(400);
        echo json_encode(['error' => 'Not enough seats available']);
        exit;
    }

    $flight->availableSeats = $availableSeats - count($input['passengers']);
    $updatedXml = $flightsXml->asXML();
    file_put_contents($flightsXmlPath, $updatedXml);

    $bookingId = "BKG-" . time();
    $bookingDetails = [
        'bookingId' => $bookingId,
        'flightDetails' => $flight,
        'passengers' => $input['passengers']
    ];

    $bookings = file_exists($bookingsFilePath) ? json_decode(file_get_contents($bookingsFilePath), true) : [];
    $bookings[] = $bookingDetails;

    if (file_put_contents($bookingsFilePath, json_encode($bookings, JSON_PRETTY_PRINT))) {
        echo json_encode(['message' => 'Flight booked successfully', 'bookingDetails' => $bookingDetails]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error saving booking']);
    }
}

?>
