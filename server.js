const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

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

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


