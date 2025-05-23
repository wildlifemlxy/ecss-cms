const express = require('express');
const router = express.Router();
const jose = require('jose');
const moment = require('moment');
const axios = require('axios');

// Utility: base64url encode an object
function base64url(input) {
  return Buffer.from(JSON.stringify(input)).toString("base64url");
}

// Create unsigned JWT string (header.payload.)
function createUnsignedJwt(payload) {
  const header = { alg: "none", typ: "JWT" };
  return base64url(header) + "." + base64url(payload) + ".";
}

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
async function signJweAsJws(jwe, signingJwk, kid) {
  const privateKey = await jose.importJWK(signingJwk, "ES256");
  return await new jose.SignJWT({ jwe })
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
    // If code is missing, return a 400 Bad Request error
    if (!code) {
      return res.status(400).json({ error: "Bad request", message: "Missing required parameter: code" });
    }
    // Extract the PKCE code_verifier from the request body or query string
    const code_verifier = req.body.code_verifier || req.query.code_verifier;
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
    // Get the current Unix timestamp (seconds since epoch)
    const nowTime = moment().unix();
    // Set the JWT expiration time to 2 minutes in the future
    const futureTime = moment().add(2, "minutes").unix();
    // Construct the JWT payload with required claims
    const jwtPayload = {
      sub: CLIENT_ID, // Subject: client ID
      iss: CLIENT_ID, // Issuer: client ID
      aud: JWTTOKENURL, // Audience: SingPass token endpoint
      iat: nowTime, // Issued at: current time
      exp: futureTime, // Expiration: 2 minutes from now
    };
    // Step 1: Create an unsigned JWT (header.payload.)
    const unsignedJwt = createUnsignedJwt(jwtPayload);
    // Step 2: Encrypt the unsigned JWT as a JWE using the EC public key
    let jwe;
    try {
      jwe = await encryptJwtAsJwe(unsignedJwt, ENCRYPTION_PRIVATE_KEY);
      // Log the generated JWE for debugging
      console.log("JWE (Base64): ", jwe);
    } catch (err) {
      // If encryption fails, log the error and return a 500 error
      console.error("JWE encryption error:", err);
      return res.status(500).json({ error: "JWE encryption failed", message: err.message });
    }
    // Step 3: Sign the JWE as a JWS using the EC private signing key
    let jwt;
    try {
      jwt = await signJweAsJws(jwe, SIGNATURE_PRIVATE_KEY, KID);
      // Log the signed JWS for debugging
      console.log("JWS (signed JWE): ", jwt);
    } catch (err) {
      // If signing fails, log the error and return a 500 error
      console.error("JWS signing error:", err);
      return res.status(500).json({ error: "JWS signing failed", message: err.message });
    }
    // Step 4: Exchange the authorization code for tokens at the SingPass token endpoint
    let tokenData;
    try {
      // Make a POST request to the token endpoint with required parameters
      const response = await axios.post(
        SPTOKENURL,
        new URLSearchParams({
          client_id: CLIENT_ID, // OAuth client ID
          redirect_uri: REDIRECT_URI, // Redirect URI
          code: code, // Authorization code
          client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer", // Assertion type
          grant_type: "authorization_code", // OAuth grant type
          client_assertion: jwt, // The JWS (signed JWE) as client_assertion
          code_verifier: code_verifier, // PKCE code verifier
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" }, // Set content type
          validateStatus: () => true // Accept all HTTP status codes
        }
      );
      // Extract the response data (tokens)
      tokenData = response.data;
      // Log the token data for debugging
      console.log("Token Data: ", tokenData);
    } catch (e) {
      // If token exchange fails, return a 500 error with details
      return res.status(500).json({ error: "Token exchange failed", message: e.message, details: e.response?.data });
    }
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
    }
  } catch (e) {
    // Catch-all for unexpected errors; return a 500 error
    return res.status(500).json({ error: "Internal server error", message: e.message });
  }
});

// base64url: Encodes an object to base64url string
// createUnsignedJwt: Creates an unsigned JWT string from a payload
// encryptJwtAsJwe: Encrypts a JWT string as JWE using EC public key
// signJweAsJws: Signs a JWE as a JWS using EC private key
// Main handler: Orchestrates the SingPass token flow

module.exports = router;
