const express = require("express");
const router = express.Router();
const jose = require("jose");
const moment = require("moment");
const axios = require("axios");

// --- Config (from your prompt) ---
const REACT_APP_SIGNATURE_PRIVATE_KEY = {
  "kty": "EC",
  "x": "3lLdi8c9P4IIn1tGVQQkJmqV24ZZWDrqnQZHfMJ7jqA",
  "y": "ZA5031SQkAF4HfFX96tq5oEuDzJZWskdoub3iPGbKtA",
  "crv": "P-256",
  "d": "TOOxIYmQ4SNSA2pqi-9-kaNQ5e6ey174Q5lKZ4E_JZg",
  "use": "sig",
  "alg": "ES256",
  "kid": "signing-key-id"
};
const REACT_APP_CLIENT_ID = "mHlUcRS43LOQAjkYJ22MNvSpE8vzPmfo";
const REACT_APP_JWTTOKENURL = "https://stg-id.singpass.gov.sg";
const REACT_APP_SPTOKENURL = "https://stg-id.singpass.gov.sg/token";
const REACT_APP_KID = "signing-key-id";
const REACT_APP_REDIRECT_URI = "http://localhost:3000/myinfo-redirect";

// POST /singpass
router.post("/", async (req, res) => {
  try {
    const code = req.body.code;
    const alg = "ES256";
    const privateKey = await jose.importJWK(REACT_APP_SIGNATURE_PRIVATE_KEY, alg);
    const nowTime = moment().unix();
    const futureTime = moment().add(2, "minutes").unix();
    const jwt = await new jose.SignJWT({
      sub: REACT_APP_CLIENT_ID,
      iss: REACT_APP_CLIENT_ID,
      aud: REACT_APP_JWTTOKENURL,
      iat: nowTime,
      exp: futureTime,
    })
      .setProtectedHeader({
        alg: "ES256",
        kid: REACT_APP_KID,
        typ: "JWT",
      })
      .sign(privateKey);

    console.log("JWT: ", jwt);

    const { data } = await axios.post(
      REACT_APP_SPTOKENURL,
      new URLSearchParams({
        client_id: REACT_APP_CLIENT_ID,
        redirect_uri: REACT_APP_REDIRECT_URI,
        code: code,
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

    res.status(200).json(data);

  } catch (e) {
    if (e.response?.data) {
      console.log(e.response.data);
    }
    res.status(500).json({ error: e.toString() });
  }
});

module.exports = router;