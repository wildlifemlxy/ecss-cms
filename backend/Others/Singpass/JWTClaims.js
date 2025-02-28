const jwt = require('jsonwebtoken');
const fs = require('fs');

// Load your private key (use the path to your private key file)
const privateKey = fs.readFileSync('./Singpass/Keys/');

// Create the payload (this will depend on the Singpass API's requirements)
const payload = {
  iss: 'your_client_id', // Client ID issued to you by Singpass
  sub: 'your_client_id', // Client ID again (this may vary depending on the OAuth provider)
  aud: 'https://stg-id.singpass.gov.sg', // Audience (the Singpass token endpoint)
  jti: 'some_unique_identifier', // A unique identifier (optional)
  exp: Math.floor(Date.now() / 1000) + 60 * 60, // Expiration time (set to 1 hour)
  iat: Math.floor(Date.now() / 1000), // Issued at time (current time)
};

// Sign the JWT using your private key and the RS256 algorithm
const jwtToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: 'your_key_id' });

console.log('Generated JWT:', jwtToken);
