const express = require('express');
const axios = require('axios');
const router = express.Router();

// Real GST verification using Zoop.one API (example)
router.post('/verify', async (req, res) => {
  const { gstNumber } = req.body;
  if (!gstNumber || gstNumber.length !== 15) {
    return res.status(400).json({ error: 'GST number must be 15 characters.' });
  }
  try {
    // Replace with your actual Zoop.one API credentials and endpoint
    const response = await axios.post(
      'https://api.zoop.one/gstn/v2/gstin',
      { gstin: gstNumber },
      {
        headers: {
          'app-id': process.env.ZOOP_APP_ID,
          'api-key': process.env.ZOOP_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const data = response.data && response.data.data ? response.data.data : null;
    if (data && (data.legal_name || data.trade_name)) {
      return res.json({
        legalName: data.legal_name,
        tradeName: data.trade_name,
        address: data.principal_place_of_business_address,
        status: data.status
      });
    } else {
      return res.status(404).json({ error: 'GST number not found or invalid' });
    }
  } catch (error) {
    console.error('GST verification error:', error.response ? error.response.data : error.message);
    return res.status(500).json({ error: 'Failed to verify GST number' });
  }
});

module.exports = router; 