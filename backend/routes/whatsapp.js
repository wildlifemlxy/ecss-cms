const express = require('express');
const router = express.Router();
const axios = require('axios');

// POST /api/send-whatsapp-registration
router.post('/', async (req, res) => {
  let { phoneNumber, name, course, template } = req.body;
  console.log('Received data:', { phoneNumber, name, course, template }); 

  // Ensure phone number is in +65XXXXXXXX format
  if (!phoneNumber.startsWith('+65')) {
    // Remove any leading zeros or country code, then prepend +65
    phoneNumber = '+65' + phoneNumber.replace(/^(\+65|65|0)/, '');
  }

  // Replace with your actual Interakt API key
  const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY || `dHNDOW9jdGtGZVFxc3JTbnVNQ1VPck9wX2tqdERiRnBYY0FMRWlOTWFBQTo=`;

    try {
    const response = await axios.post(
      'https://api.interakt.ai/v1/public/message/', // <-- updated endpoint
      {
        countryCode: '+65', // Singapore country code with plus
        phoneNumber: phoneNumber.replace('+65', ''), // Interakt expects number without country code
        type: 'Template',
        // Optionally add callbackData if needed
        template: {
          name: template || 'course_registration_submission',
          languageCode: 'en',
          // headerValues: [], // Add if your template uses header variables
          bodyValues: [name, course],
          // buttonValues: {} // Add if your template uses dynamic buttons
        }
      },
      {
        headers: {
          'Authorization': `Basic ${INTERAKT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    if (error.response) {
      console.error('Interakt API error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      });
    } else {
      console.error('Error sending WhatsApp message:', error.message);
    }
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

module.exports = router;
