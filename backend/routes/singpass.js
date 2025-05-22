const express = require("express");
const { SignJWT, importJWK, compactDecrypt, decodeJwt } = require("jose");
const axios = require("axios");
const moment = require("moment");
const TextDecoder = require("util").TextDecoder;
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Load the private signing key JWK from the Keys folder
const SIGNING_PRIVATE_KEY = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../Others/SingPass/Keys/private-signing-key.jwk.json'),
    'utf8'
  )
);

//mHlUcRS43LOQAjkYJ22MNvSpE8vzPmfo
const REACT_APP_CLIENT_ID = "mHlUcRS43LOQAjkYJ22MNvSpE8vzPmfo";
const REACT_APP_JWTTOKENURL = "https://stg-id.singpass.gov.sg";
const REACT_APP_SPTOKENURL = "https://stg-id.singpass.gov.sg/token";
const REACT_APP_KID = "signing-key-id"; // Update with your key ID

// Route for handling Singpass callback
router.post("/", async (req, res) => {
  try {
    const code = req.body.code;
    const code_verifier = req.body.code_verifier; // <-- Add this

    // Prepare the JWT (client assertion) for authentication
    const privateKey = await importJWK(SIGNING_PRIVATE_KEY, "ES256");
    const nowTime = moment().unix();
    const futureTime = moment().add(2, "minutes").unix();

    const jwt = await new SignJWT({
      sub: REACT_APP_CLIENT_ID,
      iss: REACT_APP_CLIENT_ID,
      aud: REACT_APP_SPTOKENURL, // <-- Use the token endpoint
      iat: nowTime,
      exp: futureTime,
    })
      .setProtectedHeader({
        alg: "ES256",
        kid: REACT_APP_KID,
        typ: "JWT",
      })
      .sign(privateKey);

    console.log("JWT:", jwt);
    console.log("Token request body:", {
      client_id: REACT_APP_CLIENT_ID,
      redirect_uri: "http://localhost:3000/myinfo-redirect",
      code,
      code_verifier,
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      grant_type: "authorization_code",
      client_assertion: jwt,
    });

    // Request the Singpass token
    try {
      const { data } = await axios.post(
        REACT_APP_SPTOKENURL,
        new URLSearchParams({
          client_id: REACT_APP_CLIENT_ID,
          redirect_uri: "http://localhost:3000/myinfo-redirect",
          code: code,
          code_verifier: code_verifier, // <-- Add this
          client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          grant_type: "authorization_code",
          client_assertion: jwt,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      // Return the token response to the frontend
      return res.status(200).json(data);

    } catch (error) {
      if (error.response) {
        // Error response from the server
        console.error("Error response from server:", error.response.data);
        return res.status(error.response.status).json({ error: error.response.data });
      } else if (error.request) {
        // No response received from the server
        console.error("No response received:", error.request);
        return res.status(500).json({ error: "No response received from Singpass server." });
      } else {
        // Other types of errors (e.g., configuration issues)
        console.error("Error during axios request:", error.message);
        return res.status(500).json({ error: "Error during request to Singpass." });
      }
    }

  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: e.toString() });
  }
});

module.exports = router;