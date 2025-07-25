const express = require('express');
const cors = require('cors');

const app = express();

// CORS middleware for your React frontend at localhost:5173
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Proxy endpoint to fetch committee data from Google Apps Script
app.get('/api/committee', async (req, res) => {
  const committee = req.query.committee;

  if (!committee) {
    return res.status(400).json({ error: "Missing 'committee' query parameter." });
  }

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwPK8B6rsC7_G4NhVFk3kUVRClq84noxLi3HOBDsOLQN_fNNojaMiHIJHCENsv0Moiy/exec';

  const url = `${GAS_URL}?committee=${encodeURIComponent(committee)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Apps Script responded with status ${response.status}`);
    }

    const data = await response.text();

    res.set('Content-Type', 'application/json');
    res.send(data);

  } catch (error) {
    console.error('Error fetching from Google Apps Script:', error);
    res.status(502).json({
      error: 'Failed to fetch data from Google Apps Script',
      details: error.message
    });
  }
});

// Start the backend server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Proxy backend running on http://localhost:${PORT}`);
});
