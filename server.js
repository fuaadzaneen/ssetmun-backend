const express = require('express');
const cors = require('cors');

const app = express();

// Allow cross-origin requests from your React frontend
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-vercel-domain.vercel.app'], // Add your actual Vercel domain
  credentials: true
}));

// Add JSON body parser for potential future POST requests
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Public City Backend API is running',
    endpoints: ['/api/committee?committee=AIPPM', '/api/committee?committee=F1', '/api/committee?committee=UNWomen', '/api/committee?committee=UNODC'],
    timestamp: new Date().toISOString()
  });
});

// Proxy endpoint for committee data
app.get('/api/committee', async (req, res) => {
  const committee = req.query.committee;

  if (!committee) {
    return res.status(400).json({ 
      error: "Missing 'committee' query parameter.",
      availableCommittees: ['AIPPM', 'F1', 'UNWomen', 'UNODC']
    });
  }

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbw8m9I8rFeUK6dZJTsAl31IjWuMn1shA9kjYi7Ytf-dKPYe6z-0Zn-D24C7MkNINsv3/exec';
  const url = `${GAS_URL}?committee=${encodeURIComponent(committee)}`;

  try {
    console.log(`Fetching data for committee: ${committee}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Apps Script responded with status ${response.status}`);
    }

    const text = await response.text();
    
    // Try to parse as JSON to validate
    let jsonData;
    try {
      jsonData = JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Invalid JSON response from Google Apps Script: ${parseError.message}`);
    }

    // Log successful data fetch
    console.log(`Successfully fetched ${Array.isArray(jsonData) ? jsonData.length : 'N/A'} records for ${committee}`);

    res.set('Content-Type', 'application/json');
    res.send(text);

  } catch (error) {
    console.error(`Error fetching data for committee ${committee}:`, error);
    res.status(502).json({
      error: 'Failed to fetch data from Google Apps Script',
      committee: committee,
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Public City Backend running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET / - Health check`);
  console.log(`  GET /api/committee?committee=AIPPM - AIPPM data`);
  console.log(`  GET /api/committee?committee=F1 - F1 data`);
  console.log(`  GET /api/committee?committee=UNWomen - UN Women data`);
  console.log(`  GET /api/committee?committee=UNODC - UNODC data`);
});
