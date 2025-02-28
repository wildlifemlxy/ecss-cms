  const express = require("express");
  const { SignJWT, importJWK, compactDecrypt, decodeJwt } = require("jose");
  const axios = require("axios");
  const moment = require("moment");
  const TextDecoder = require("util").TextDecoder;

  const router = express.Router();

  // Define keys from your configuration
  const SIGNING_PRIVATE_KEY = {
    kty: "EC",
    d: "wIgS539lM9J6VwSk2QNiZOeGYtBr9p8Nq5ilCLM3A6k",
    crv: "P-256",
    x: "wIgS539lM9J6VwSk2QNiZOeGYtBr9p8Nq5ilCLM3A6k",
    y: "6viJ5WzOjeB0m-sU6WV4P9IseunztkE3H53T6M7yWaY",
  };

  const ENCRYPTION_PRIVATE_KEY = {
    kty: "EC",
    d: "wIgS539lM9J6VwSk2QNiZOeGYtBr9p8Nq5ilCLM3A6k",
    crv: "P-256",
    x: "wIgS539lM9J6VwSk2QNiZOeGYtBr9p8Nq5ilCLM3A6k",
    y: "6viJ5WzOjeB0m-sU6WV4P9IseunztkE3H53T6M7yWaY",
  };

  /*const SIGNING_PRIVATE_KEY = {
    kty: "EC",
    d: "0GlHbGc8vSnyiB-Lf4_im_WFwrxM0MJjkk96o1-K3JQ",
    crv: "P-256",
    x: "wg11s6ZpBc0my5gT-mYatTZRDhgStyd_0qARVBwAWa4",
    y: "hlVoYWwlCuTMnm79Ppmf3RslIwDRhqdCCnm01PkhA2s"
  };

  const ENCRYPTION_PRIVATE_KEY =  {
    kty: "EC",
    d: "p4YZHS0_BS4VMUayEtt38qi2sMdkhs4JRFlks7HJCD8",
    crv: "P-256",
    x: "0GR5oBa1FINjCZP_W-nR8Yqoz4E_9j7lgCuRPh9PZTA",
    y: "0leGfxdQSJdtubopqhj5uhPVYV3LSd_yf3y2DdRD5No"
  }*/

  //mHlUcRS43LOQAjkYJ22MNvSpE8vzPmfo
  const REACT_APP_CLIENT_ID = "mHlUcRS43LOQAjkYJ22MNvSpE8vzPmfo";
  const REACT_APP_JWTTOKENURL = "https://stg-id.singpass.gov.sg";
  const REACT_APP_SPTOKENURL = "https://stg-id.singpass.gov.sg/token";
  const REACT_APP_KID = "your-key-id"; // Update with your key ID

  // Route for handling Singpass callback
  router.post("/", async (req, res) => {
    try {
      const code = req.body.code;

      // Prepare the JWT (client assertion) for authentication
      const privateKey = await importJWK(SIGNING_PRIVATE_KEY, "ES256");
      const nowTime = moment().unix();
      const futureTime = moment().add(2, "minutes").unix();

      const jwt = await new SignJWT({
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

      console.log("JWT:", jwt);

      // Request the Singpass token
      try {
        const { data } = await axios.post(
          REACT_APP_SPTOKENURL,
          new URLSearchParams({
            client_id: REACT_APP_CLIENT_ID,
            redirect_uri: "http://localhost:3000/myinfo-redirect",  // Ensure this matches your redirect URL
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
      
        // Process the response if successful
        console.log("Token response:", data);
      
      } catch (error) {
        // Check if the error has a response property (i.e., server response)
        if (error.response) {
          // Error response from the server
          console.error("Error response from server:", error.response.data);
          // You can also return the specific error message here to the client
          //return res.status(error.response.status).json({ error: error.response.data });
        } else if (error.request) {
          // No response received from the server
          console.error("No response received:", error.request);
          //return res.status(500).json({ error: "No response received from Singpass server." });
        } else {
          // Other types of errors (e.g., configuration issues)
          console.error("Error during axios request:", error.message);
          //return res.status(500).json({ error: "Error during request to Singpass." });
        }
      }
      

      /*// Decrypt the id_token
      const privateKey2 = await importJWK(ENCRYPTION_PRIVATE_KEY, "ECDH-ES+A256KW");
      const { plaintext } = await compactDecrypt(data.id_token, privateKey2);
      const dto = new TextDecoder().decode(plaintext);
      const result = await decodeJwt(dto);
      const NRIC = result.sub.substring(2, 11);
      const UUID = result.sub.substring(14);

      // Respond with NRIC and UUID
      return res.status(200).json({ data: { NRIC, UUID } });*/
    } catch (e) {
      console.log(e);
      return res.status(500).json({ data: e });
    }
  });

  module.exports = router;
