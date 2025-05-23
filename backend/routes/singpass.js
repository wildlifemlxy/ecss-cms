const express = require('express');
const router = express.Router();
const jose = require('jose');
const moment = require('moment');
const axios = require('axios');

// Encrypt a JWT string as JWE using EC public key
async function encryptJwtAsJwe(unsignedJwt, encryptionJwk) {
  // Extract public JWK from private key
  const publicJwk = { ...encryptionJwk };
  delete publicJwk.d;
  const encKey = await jose.importJWK(publicJwk, "ECDH-ES+A256KW");
  return await new jose.CompactEncrypt(new TextEncoder().encode(unsignedJwt))
    .setProtectedHeader({
      alg: "ECDH-ES+A256KW",
      enc: "A256GCM",
      kid: encryptionJwk.kid,
    })
    .encrypt(encKey);
}

// Sign a JWE as a JWS using EC private key
async function signJwtAsJws(payload, signingJwk, kid) {
  const privateKey = await jose.importJWK(signingJwk, "ES256");
  return await new jose.SignJWT({ payload })
    .setProtectedHeader({
      alg: "ES256",
      kid: kid,
      typ: "JWT",
    })
    .sign(privateKey);
}

// POST /singpass/token
// Main endpoint for handling SingPass token exchange and decryption
router.post('/', async (req, res) => {
  try {
    // Extract the authorization code from the request body or query string
    const code = req.body.code || req.query.code;
    console.log("code: ", code);
    // If code is missing, return a 400 Bad Request error
    if (!code) {
      return res.status(400).json({ error: "Bad request", message: "Missing required parameter: code" });
    }
    // Extract the PKCE code_verifier from the request body or query string
    const code_verifier = req.body.code_verifier || req.query.code_verifier;
    console.log("code_verifier: ", code_verifier);
    // If code_verifier is missing, return a 400 Bad Request error
    if (!code_verifier) {
      return res.status(400).json({ error: "Bad request", message: "Missing required parameter: code_verifier" });
    }
    // Load static configuration and cryptographic keys
    const CLIENT_ID = "mHlUcRS43LOQAjkYJ22MNvSpE8vzPmfo"; // OAuth client ID
    const JWTTOKENURL = "https://stg-id.singpass.gov.sg"; // OAuth issuer/audience
    const SPTOKENURL = "https://stg-id.singpass.gov.sg/token"; // Token endpoint
    const REDIRECT_URI = "http://localhost:3000/myinfo-redirect"; // Redirect URI registered with SingPass
    // Load EC private key for signing JWTs (JWS)
    const SIGNATURE_PRIVATE_KEY = require("../Others/SingPass/Keys/private-signing-key.jwk.json");
    // Load EC private key for decrypting JWEs (and public part for encryption)
    const ENCRYPTION_PRIVATE_KEY = require("../Others/SingPass/Keys/private-ec-encryption-key.jwk.json");
    // Extract the key ID (kid) from the signing key
    const KID = SIGNATURE_PRIVATE_KEY.kid;
    console.log("KID: ", KID);
    // Get the current Unix timestamp (seconds since epoch)
    const nowTime = moment().unix();
    // Set the JWT expiration time to 2 minutes in the future
    const futureTime = moment().add(2, "minutes").unix();
    // Construct the JWT payload with required claims
    const jwtPayload = {
      sub: CLIENT_ID, // Subject: client ID
      iss: CLIENT_ID, // Issuer: client ID
      aud: JWTTOKENURL, // Audience: SingPass issuer/audience (not the token endpoint)
      iat: nowTime, // Issued at: current time
      exp: futureTime // Expiration: 2 minutes from now
      //direct_pii_allowed: true // Explicitly allow direct PII access
    };
    // Log the JWT payload for debugging
    console.log("JWT Payload:", jwtPayload);

    //Step 1: Sign the JWT payload with the private signing key
    let jws;
    try {
      jws = await signJwtAsJws(jwtPayload, SIGNATURE_PRIVATE_KEY, KID);
      // Log the signed JWS for debugging
      console.log("JWS (signed JWT): ", jws);
    } catch (err) {
      // If signing fails, log the error and return a 500 error
      console.error("JWS signing error:", err.message );
      return res.status(500).json({ error: "JWS signing failed", message: err.message });
    }

    // Step 2: Exchange the authorization code for tokens at the SingPass token endpoint
    let tokenData;
    try {
      // Prepare the request body as URLSearchParams for form-urlencoded
      const url = SPTOKENURL;
      const response = await axios.post(
        url,
        new URLSearchParams({
          client_id: CLIENT_ID,
          redirect_uri: REDIRECT_URI,
          code: code,
          client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          grant_type: "authorization_code",
          client_assertion: jws,
          code_verifier: code_verifier // PKCE code verifier is now included
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          validateStatus: () => true
        }
      );
      tokenData = response.data;
      console.log("Token Data: ", tokenData);
    } catch (e) {
      console.error("Token exchange error:", e);
      if (e.response) {
        console.error("SingPass error response data:", e.response.data);
      }
      // If token exchange fails, return a 500 error with details
      return res.status(500).json({ error: "Token exchange failed", message: e.message, details: e.response?.data });
    }

    /*// Step 3: Encrypt the signed JWT (JWS) as a JWE using the EC public key
     1) JWE Header
       2) Encrypted Key
       3) Initialization Vector
       4) Encrypted Payload (if decrypted, this would be the Base64 encoded form of a JWS ID Token)
       5) Authentication Tag  
      
    let jwe;
    try {
      jwe = await encryptJwtAsJwe(jws, ENCRYPTION_PRIVATE_KEY); // Encrypt the signed JWT (JWS) as JWE
      // Log the generated JWE for debugging
      console.log("JWE (Base64): ", jwe);
    } catch (err) {
      // If encryption fails, log the error and return a 500 error
      console.error("JWE encryption error:", err);
      return res.status(500).json({ error: "JWE encryption failed", message: err.message });
    }*/


    /*
    // Step 5: Decrypt the id_token (JWE) using the EC private key
    try {
      // Import the EC private key for decryption
      const privateKey2 = await jose.importJWK(ENCRYPTION_PRIVATE_KEY, "ECDH-ES+A256KW");
      // Decrypt the compact JWE id_token
      const { plaintext } = await jose.compactDecrypt(tokenData.id_token, privateKey2);
      // Decode the decrypted plaintext (JWT string)
      const dto = new TextDecoder().decode(plaintext);
      // Parse the JWT to extract claims
      const result = await jose.decodeJwt(dto);
      // Log the decoded JWT for debugging
      console.log("Decoded JWT: ", result);
      // Extract the UUID (subject) from the JWT
      const UUID = result.sub;
      // Return the UUID as the response
      return res.status(200).json({ data: UUID });
    } catch (e) {
      // If decryption fails, return a 500 error
      return res.status(500).json({ error: "Decryption failed", message: e.message });
    }*/
  } catch (e) {
    // Catch-all for unexpected errors; return a 500 error
    //return res.status(500).json({ error: "Internal server error", message: e.message });
  }
});

module.exports = router;
