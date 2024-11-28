const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());

// Middleware to parse incoming requests
app.use(bodyParser.text({ type: 'text/xml' }));
app.use(express.json());

// Ensure the contactSubs directory exists
const contactSubsDir = path.join(__dirname, 'contactSubs');
if (!fs.existsSync(contactSubsDir)) {
    fs.mkdirSync(contactSubsDir);
}

// Path to flights.xml
const flightsXmlPath = path.join(__dirname, "flights.xml");

// Path to store bookings JSON
const bookingsDir = path.join(__dirname, "bookings");
const bookingsFilePath = path.join(bookingsDir, "flightBookings.json");

// Endpoint 1: Accept POST request and save data as XML
app.post('/submit-contact', (req, res) => {
    console.info('/submit-contact');
    const { firstName, lastName, phone, email, gender, comment } = req.body;
    if (!firstName || !lastName || !phone || !email || !gender || !comment) {
        return res.status(400).send('All fields are required');
    }

    const xmlContent = `
        <contact>
            <firstName>${firstName}</firstName>
            <lastName>${lastName}</lastName>
            <phone>${phone}</phone>
            <email>${email}</email>
            <gender>${gender}</gender>
            <comment>${comment}</comment>
        </contact>
    `;

    const fileName = `contact_${Date.now()}.xml`;
    const filePath = path.join(contactSubsDir, fileName);

    fs.writeFile(filePath, xmlContent, (err) => {
        if (err) {
            return res.status(500).send('Error saving contact');
        }
        res.status(200).send('Contact saved successfully');
    });
});

// Endpoint 2: Serve flights.xml
app.get('/flights', (req, res) => {
    console.info('/flights');
    const flightsXmlPath = path.join(__dirname, 'flights.xml');
    if (!fs.existsSync(flightsXmlPath)) {
        return res.status(404).send('Flights file not found');
    }

    res.set('Content-Type', 'text/xml');
    fs.createReadStream(flightsXmlPath).pipe(res);
});

// Endpoint 3: Serve hotels.json
app.get('/hotels', (req, res) => {
    console.info('/hotels');
    const hotelsJsonPath = path.join(__dirname, 'hotels.json');
    if (!fs.existsSync(hotelsJsonPath)) {
        return res.status(404).send('Hotels file not found');
    }

    res.set('Content-Type', 'application/json');
    fs.createReadStream(hotelsJsonPath).pipe(res);
});

app.post("/book-flight", (req, res) => {
    console.info('/book-flight')
    const { flightId, passengers } = req.body;

    // Validate input
    if (!flightId || !Array.isArray(passengers) || passengers.length === 0) {
        return res
            .status(400)
            .send("Invalid request. Please provide flightId and passengers.");
    }

    // Read flights.xml
    fs.readFile(flightsXmlPath, "utf-8", (err, data) => {
        if (err) {
            console.error("Error reading flights.xml:", err);
            return res.status(500).send("Error reading flights data.");
        }

        // Parse XML with JSDOM
        const dom = new JSDOM(data, { contentType: "text/xml" });
        const document = dom.window.document;

        // Find the flight with the given flightId
        const flightElement = Array.from(
            document.getElementsByTagName("flight")
        ).find(
            (flight) =>
                flight.getElementsByTagName("flightId")[0].textContent === flightId
        );

        if (!flightElement) {
            return res.status(404).send("Flight not found.");
        }

        // Get flight details
        const flightDetails = {
            flightId: flightElement.getElementsByTagName("flightId")[0].textContent,
            origin: flightElement.getElementsByTagName("origin")[0].textContent,
            destination: flightElement.getElementsByTagName("destination")[0].textContent,
            departureDate: flightElement.getElementsByTagName("departureDate")[0].textContent,
            arrivalDate: flightElement.getElementsByTagName("arrivalDate")[0].textContent,
            departureTime: flightElement.getElementsByTagName("departureTime")[0].textContent,
            arrivalTime: flightElement.getElementsByTagName("arrivalTime")[0].textContent,
            availableSeats: parseInt(
                flightElement.getElementsByTagName("availableSeats")[0].textContent
            ),
            price: parseFloat(flightElement.getElementsByTagName("price")[0].textContent),
        };

        // Check seat availability
        if (passengers.length > flightDetails.availableSeats) {
            return res
                .status(400)
                .send("Not enough seats available for the requested flight.");
        }

        // Deduct the booked seats
        flightElement.getElementsByTagName("availableSeats")[0].textContent =
            flightDetails.availableSeats - passengers.length;

        // Generate booking details
        const bookingId = `BKG-${Date.now()}`;
        const bookingDetails = {
            bookingId,
            flightDetails,
            passengers,
        };

        // Serialize and update flights.xml
        const XMLSerializer = dom.window.XMLSerializer; // Use XMLSerializer from jsdom
        const serializer = new XMLSerializer();
        const updatedXml = serializer.serializeToString(document);

        fs.writeFile(flightsXmlPath, updatedXml, (err) => {
            if (err) {
                console.error("Error updating flights.xml:", err);
                return res.status(500).send("Error updating flights data.");
            }

            // Store booking in JSON
            fs.readFile(bookingsFilePath, "utf-8", (err, bookingData) => {
                if (err) {
                    console.error("Error reading bookings file:", err);
                    return res.status(500).send("Error reading bookings data.");
                }

                const bookings = JSON.parse(bookingData);
                bookings.push(bookingDetails);

                fs.writeFile(
                    bookingsFilePath,
                    JSON.stringify(bookings, null, 2),
                    "utf-8",
                    (err) => {
                        if (err) {
                            console.error("Error saving booking:", err);
                            return res
                                .status(500)
                                .send("Error saving booking data.");
                        }

                        // Respond with booking confirmation
                        res.status(200).send({
                            message: "Flight booked successfully.",
                            bookingDetails,
                        });
                    }
                );
            });
        });
    });
});

app.post("/book-hotels", (req, res) => {
    console.info('/book-hotels');
    const { bookings } = req.body;

    if (!Array.isArray(bookings) || bookings.length === 0) {
        return res
            .status(400)
            .send("Invalid request. Please provide an array of hotel bookings.");
    }

    // Read hotels.json
    const hotelsJsonPath = path.join(__dirname, 'hotels.json');
    const hotelBookingsXmlPath = path.join(__dirname, 'bookings', 'hotelBookings.xml');

    fs.readFile(hotelsJsonPath, "utf-8", (err, data) => {
        if (err) {
            console.error("Error reading hotels.json:", err);
            return res.status(500).send("Error reading hotel data.");
        }

        const hotels = JSON.parse(data);
        const bookingResults = [];

        for (const booking of bookings) {
            const { hotelId, checkInDate, checkOutDate, adults, children, infants } = booking;

            if (!hotelId || !checkInDate || !checkOutDate || (adults + children + infants) === 0) {
                return res.status(400).send(
                    "Each booking must include hotelId, checkInDate, checkOutDate, and at least one guest."
                );
            }

            const hotel = hotels.find((hotel) => hotel.hotelId === hotelId);

            if (!hotel) {
                return res.status(404).send(`Hotel with ID ${hotelId} not found.`);
            }

            const totalGuests = adults + children + infants;
            const rooms = Math.ceil(totalGuests / 2);

            if (rooms > hotel.availableRooms) {
                return res.status(400).send(`Not enough rooms available for hotel ID: ${hotelId}.`);
            }

            hotel.availableRooms -= rooms;

            const checkIn = new Date(checkInDate);
            const checkOut = new Date(checkOutDate);
            const duration = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            const totalPrice = hotel.pricePerNight * rooms * duration;

            const bookingId = `BKG-H-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            const bookingDetails = {
                bookingId,
                hotelId,
                name: hotel.name,
                city: hotel.city,
                checkInDate,
                checkOutDate,
                pricePerNight: hotel.pricePerNight,
                adults,
                children,
                infants,
                rooms,
                totalPrice,
            };

            bookingResults.push(bookingDetails);
        }

        fs.writeFile(hotelsJsonPath, JSON.stringify(hotels, null, 2), "utf-8", (err) => {
            if (err) {
                console.error("Error updating hotels.json:", err);
                return res.status(500).send("Error updating hotel data.");
            }

            // Store bookings in hotelBookings.xml
            fs.readFile(hotelBookingsXmlPath, "utf-8", (err, existingXmlData) => {
                const { JSDOM } = require("jsdom");
                const dom = err
                    ? new JSDOM("<hotelBookings></hotelBookings>", { contentType: "text/xml" })
                    : new JSDOM(existingXmlData, { contentType: "text/xml" });

                const document = dom.window.document;

                for (const booking of bookingResults) {
                    const bookingElement = document.createElement("booking");

                    for (const [key, value] of Object.entries(booking)) {
                        const childElement = document.createElement(key);
                        childElement.textContent = value;
                        bookingElement.appendChild(childElement);
                    }

                    document.querySelector("hotelBookings").appendChild(bookingElement);
                }

                const serializer = new dom.window.XMLSerializer();
                const updatedXml = serializer.serializeToString(document);

                fs.writeFile(hotelBookingsXmlPath, updatedXml, "utf-8", (err) => {
                    if (err) {
                        console.error("Error saving hotelBookings.xml:", err);
                        return res.status(500).send("Error saving hotel bookings data.");
                    }

                    res.status(200).send({
                        message: "Hotels booked successfully.",
                        bookingResults,
                    });
                });
            });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


