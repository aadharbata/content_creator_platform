const axios = require('axios');

exports.verifyGST = async (req, res) => {
  const { gstNumber } = req.body;
  if (!gstNumber) {
    return res.status(400).json({ error: 'GST number is required' });
  }

  try {
    // Call the official GST Verification API
    const response = await axios.get('https://einv-apisandbox.nic.in/version1.03/get-gstin-details.html', {
      params: { gstin: gstNumber },
      headers: {
        'client_id': process.env.GST_API_CLIENT_ID,
        'client_secret': process.env.GST_API_CLIENT_SECRET,
        'AuthToken': process.env.GST_API_AUTH_TOKEN
      }
    });

    // If the API returns a successful response, return the company details
    if (response.data && response.data.LegalName) {
      return res.json({
        legalName: response.data.LegalName,
        tradeName: response.data.TradeName,
        address: response.data.AddrLoc,
        status: response.data.Status
      });
    } else {
      return res.status(404).json({ error: 'GST number not found or invalid' });
    }
  } catch (error) {
    console.error('GST verification error:', error);
    return res.status(500).json({ error: 'Failed to verify GST number' });
  }
}; 