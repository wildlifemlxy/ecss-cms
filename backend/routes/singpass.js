const express = require("express");
const { SignJWT, importJWK, compactDecrypt, decodeJwt } = require("jose");
const axios = require("axios");
const moment = require("moment");
const TextDecoder = require("util").TextDecoder;

const router = express.Router();

// --- Config (use environment variables in production) ---
const SIGNING_PRIVATE_KEY = {
  kty: "EC",
  x: "3lLdi8c9P4IIn1tGVQQkJmqV24ZZWDrqnQZHfMJ7jqA",
  y: "ZA5031SQkAF4HfFX96tq5oEuDzJZWskdoub3iPGbKtA",
  crv: "P-256",
  d: "TOOxIYmQ4SNSA2pqi-9-kaNQ5e6ey174Q5lKZ4E_JZg",
  use: "sig",
  alg: "ES256",
  kid: "signing-key-id"
};

const ENCRYPTION_PRIVATE_KEY = {
  kty: "EC",
  x: "OURCT58pxFmjktT8iZBlhtG17kzl1uOB3DmNJlL-qrs",
  y: "3njUxEZA-31mj6u1MybfCrr5uokuUL4wmuYkuqBWy70",
  crv: "P-256",
  d: "CWD0D6Ak6vdMalsHCcMSd4zvRxNo5ayjqJkPmhKLl4o",
  use: "enc",
  alg: "ECDH-ES+A256KW",
  kid: "encryption-key-id"
};

// --- Demo Singpass Application Attributes ---
const SINGPASS_CLIENT_ID = "mHlUcRS43LOQAjkYJ22MNvSpE8vzPmfo"; // Registered client_id
const SINGPASS_REDIRECT_URI = "https://ecss-backend-node.azurewebsites.net/myinfo-redirect"; // Use local redirect URI for development
const SINGPASS_TOKEN_URL = "https://stg-id.singpass.gov.sg/token";
const SINGPASS_KID = "signing-key-id";
const SINGPASS_ISSUER = "https://ecss-backend-node.azurewebsites.net"; // Your Azure backend URL

// --- Token endpoint ---
router.post("/", async (req, res) => {
  try {
    // Request parameters from frontend
    const code = req.body.code;
    const code_verifier = req.body.code_verifier;

    // Log incoming request parameters
    console.log("Received code:", code);
    console.log("Received code_verifier:", code_verifier);

    // Prepare the JWT (client assertion)
    const privateKey = await importJWK(SIGNING_PRIVATE_KEY, "ES256");
    const nowTime = moment().unix();
    const futureTime = moment().add(2, "minutes").unix();
    const jwt = await new SignJWT({
      sub: SINGPASS_CLIENT_ID,
      iss: SINGPASS_ISSUER,
      aud: SINGPASS_TOKEN_URL,
      iat: nowTime,
      exp: futureTime,
    })
      .setProtectedHeader({
        alg: "ES256",
        kid: SINGPASS_KID,
        typ: "JWT",
      })
      .sign(privateKey);

    // Log the generated JWT
    console.log("Generated JWT:", jwt);

    // Decode and log the JWT payload for debugging
    const decoded = decodeJwt(jwt);
    console.log("Decoded JWT payload:", decoded);

    // --- Build request parameters as attributes ---
    const tokenRequestParams = {
      client_id: SINGPASS_CLIENT_ID,
      redirect_uri: SINGPASS_REDIRECT_URI,
      grant_type: "authorization_code",
      code: code,
      code_verifier: code_verifier,
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: jwt,
    };

    // Log the token request parameters
    console.log("Token request params:", tokenRequestParams);

    // Request the Singpass token
    try {
      const { data } = await axios.post(
        SINGPASS_TOKEN_URL,
        new URLSearchParams(tokenRequestParams),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      console.log("Singpass token response:", data);

      // Decrypt id_token if present (for direct-pii profile)
      if (data.id_token) {
        const encKey = await importJWK(ENCRYPTION_PRIVATE_KEY, "ECDH-ES+A256KW");
        const { plaintext } = await compactDecrypt(data.id_token, encKey);
        const dto = new TextDecoder().decode(plaintext);
        const result = decodeJwt(dto);
        const NRIC = result.sub?.substring(2, 11);
        const UUID = result.sub?.substring(14);
        console.log("Decrypted id_token:", result);
        return res.status(200).json({ NRIC, UUID, ...data });
      }

      // Return the token response to the frontend
      return res.status(200).json(data);

    } catch (error) {
      if (error.response) {
        // Error response from the server
        console.error("Error response from Singpass:", error.response.data);
        return res.status(error.response.status).json({ error: error.response.data });
      } else if (error.request) {
        // No response received from the server
        console.error("No response received from Singpass:", error.request);
        return res.status(500).json({ error: "No response received from Singpass server." });
      } else {
        // Other types of errors (e.g., configuration issues)
        console.error("Error during axios request:", error.message);
        return res.status(500).json({ error: "Error during request to Singpass." });
      }
    }

  } catch (e) {
    console.error("Internal error:", e);
    return res.status(500).json({ error: e.toString() });
  }
});

module.exports = router;
