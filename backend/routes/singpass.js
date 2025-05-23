const express = require('express');
const router = express.Router();
const jose = require('jose');
const moment = require('moment');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Staging environment
const SINGPASS_USERINFO_URL = "https://stg-id.singpass.gov.sg/userinfo";

// Production environment (for future reference)
// const SINGPASS_USERINFO_URL = "https://id.singpass.gov.sg/userinfo";

// POST /singpass/token
router.post('/', async (req, res) => {
  try {
    // Load signing key from file
    const signingKeyPath = path.join(__dirname, '../Others/SingPass/Keys/private-signing-key.jwk.json');
    const REACT_APP_SIGNATURE_PRIVATE_KEY = JSON.parse(fs.readFileSync(signingKeyPath, 'utf8'));

    console.log("Signature Private Key:", REACT_APP_SIGNATURE_PRIVATE_KEY);
    // Load encryption key from file
    const encryptionKeyPath = path.join(__dirname, '../Others/SingPass/Keys/private-encryption-key.jwk.json');
    const REACT_APP_ENCRYPTION_PRIVATE_KEY = JSON.parse(fs.readFileSync(encryptionKeyPath, 'utf8'));
    const REACT_APP_CLIENT_ID = "mHlUcRS43LOQAjkYJ22MNvSpE8vzPmfo";
    const REACT_APP_JWTTOKENURL = "https://stg-id.singpass.gov.sg";
    const REACT_APP_SPTOKENURL = "https://stg-id.singpass.gov.sg/token";
    // Use the kid from the loaded signing key
    const REACT_APP_KID = REACT_APP_SIGNATURE_PRIVATE_KEY.kid;
    const REACT_APP_REDIRECT_URI = "http://localhost:3000/myinfo-redirect";

    const { code, code_verifier } = req.body;
    console.log("Body:", req.body);
    const alg = "ES256";
    //Signature Keys
    const privateKey = await jose.importJWK(REACT_APP_SIGNATURE_PRIVATE_KEY, alg);
    const nowTime = moment().unix();
    const futureTime = moment().add(2, "minutes").unix();
    const payload = {
      sub: REACT_APP_CLIENT_ID,
      iss: REACT_APP_CLIENT_ID,
      aud: REACT_APP_JWTTOKENURL,
      iat: nowTime,
      exp: futureTime,
    };

    console.log("Creating encrypted JWE token for client assertion");
    const singpassPublicEncryptionKey = await jose.importJWK(
      SINGPASS_PUBLIC_ENCRYPTION_KEY,
      "ECDH-ES+A256KW"
    );

    // Create JWE token using your existing function
    const jwe = await createJweToken(
      payload, 
      privateKey, 
      REACT_APP_KID, 
      singpassPublicEncryptionKey, 
      SINGPASS_ENCRYPTION_KID
    );

    console.log("JWE token created successfully");
    console.log("Token segments:", jwe.split('.').length);

    const url = REACT_APP_SPTOKENURL;
    console.log("URL:", url);
    const params = {
      client_id: REACT_APP_CLIENT_ID,
      redirect_uri: REACT_APP_REDIRECT_URI,
      code: code,
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      grant_type: "authorization_code",
      client_assertion: jwe,  // Use JWE token instead of JWT
      code_verifier: code_verifier,
    };
    
    // Exchange code for token with error handling
    try {
      const { data } = await axios({
        method: 'post',
        url: url,
        data: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        transformRequest: [(data) => {
          // Convert data to form-urlencoded format
          return Object.entries(data)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        }]
      });
      
      const tokenData = data;
      console.log("Token data received");
      
      // Check if the token is JWE or JWS by counting segments
      const tokenParts = tokenData.id_token.split('.');
      console.log("Token has", tokenParts.length, "parts");
      
      let decodedToken;
      
      if (tokenParts.length === 5) {
        // Token is in JWE format (encrypted)
        console.log("Token appears to be JWE format (encrypted)");
        
        // Import the encryption private key for decryption
        const encryptionPrivateKey = await jose.importJWK(
          REACT_APP_ENCRYPTION_PRIVATE_KEY, 
          "ECDH-ES+A256KW"
        );
        
        // Decrypt the JWE token
        const { plaintext } = await jose.compactDecrypt(
          tokenData.id_token,
          encryptionPrivateKey
        );
        
        // Decode the decrypted payload
        const decryptedJwt = new TextDecoder().decode(plaintext);
        console.log("Decrypted JWT successfully");
        
        // Now decode the inner JWT
        decodedToken = await jose.decodeJwt(decryptedJwt);
        console.log("Decoded decrypted token successfully");
      } else if (tokenParts.length === 3) {
        // Token is in JWS format (signed but not encrypted)
        console.log("Token appears to be JWS format (signed, not encrypted)");
        decodedToken = await jose.decodeJwt(tokenData.id_token);
        console.log("Decoded JWT successfully");
      } else {
        throw new Error(`Unexpected token format with ${tokenParts.length} parts`);
      }
      
      // Rest of your processing remains the same
      const subject = decodedToken.sub;
      console.log("Decoded token subject:", subject);
      
      if (subject) {
        let UUID = subject;
        console.log("Decoded token (UUID):", UUID);
        
        // Extract UUID from SingPass response
        const singpassResponse = UUID;
        const uuid = singpassResponse.startsWith('u=') 
          ? singpassResponse.substring(2) 
          : singpassResponse;

        console.log("Clean UUID:", uuid); 
        
        try {
          // First get basic user info from UserInfo endpoint
          console.log("Attempting to retrieve user info from SingPass UserInfo endpoint");
          const userInfo = await retrieveUserInfo(tokenData.access_token);
          console.log("UserInfo retrieved successfully:", userInfo);
            
          // Return all data
          return res.status(200).json({ 
            data: uuid,
            userInfo: userInfo
          });
        } catch (userInfoError) {
          console.error("Error retrieving user info:", userInfoError);
          
          // Still return the UUID even if UserInfo fails
          return res.status(200).json({
            data: uuid,
            userInfoError: userInfoError.message
          });
        }
      } else {
        return res.status(400).json({
          error: "No subject found in token"
        });
      }
    } catch (axiosError) {
      console.error("Authentication request failed:", axiosError.message);
      
      if (axiosError.response) {
        console.error("Status:", axiosError.response.status);
        console.error("Response data:", axiosError.response.data);
        
        // Handle 401 errors specifically
        if (axiosError.response.status === 401) {
          return res.status(401).json({
            error: "Authentication failed",
            message: "Invalid credentials or expired code",
            details: axiosError.response.data
          });
        }
      }
      
      return res.status(500).json({
        error: "Token exchange failed",
        message: axiosError.message
      });
    }
  } catch (error) {
    console.error("General error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

/**
 * Retrieves user information from SingPass UserInfo endpoint
 * @param {string} accessToken - The OAuth access token from SingPass authentication
 * @returns {Promise<Object>} - User profile information
 */
const retrieveUserInfo = async (accessToken) => {
  console.log("Attempting to retrieve user info from SingPass UserInfo endpoint");
  
  // Avoid logging the full token for security reasons
  console.log("Token length:", accessToken ? accessToken.length : 0);

  try {
    const userInfoResponse = await axios.get(SINGPASS_USERINFO_URL, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache'
      },
      timeout: 8000, // Increased timeout for potentially slow responses
      validateStatus: (status) => status < 500 // Allow non-500 responses to be handled
    });
    
    console.log("UserInfo retrieved successfully", userInfoResponse.data);
    return userInfoResponse.data;
  } catch (error) {
    console.error("UserInfo request failed:", error.message);
    
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
      
      // Handle specific error codes
      if (error.response.status === 401) {
        const errorData = error.response.data || {};
        throw new Error(`Invalid token: ${errorData.error_description || 'Token may be expired or of wrong type'}`);
      } else if (error.response.status === 403) {
        throw new Error("Insufficient permissions to access user info");
      } else if (error.response.status === 429) {
        throw new Error("Rate limit exceeded for UserInfo endpoint");
      }
    } else if (error.request) {
      // Request made but no response received
      throw new Error("No response received from UserInfo endpoint - check connectivity");
    }
    
    throw error;
  }
};

/**
 * Helper function to create a signed JWT and then encrypt it as JWE
 * Example of how to create JWE tokens for SingPass
 * @param {Object} payload - The payload to include in the JWT
 * @param {Object} privateSigningKey - The private key for signing the JWT
 * @param {string} keyId - The key ID for the signing key
 * @param {Object} singpassPublicEncryptionKey - SingPass's public key for encryption
 * @param {string} singpassEncryptionKeyId - The key ID for SingPass's encryption key
 * @returns {Promise<string>} - The encrypted JWE token
 */
const createJweToken = async (payload, privateSigningKey, keyId, singpassPublicEncryptionKey, singpassEncryptionKeyId) => {
  // First create a signed JWT (JWS)
  const signedJwt = await new jose.SignJWT(payload)
    .setProtectedHeader({
      alg: "ES256",
      kid: keyId,
      typ: "JWT",
    })
    .sign(privateSigningKey);

  // Then encrypt it to create a JWE
  const encryptedJwt = await new jose.CompactEncrypt(
    new TextEncoder().encode(signedJwt)
  )
    .setProtectedHeader({
      alg: "ECDH-ES+A256KW", // Key encryption algorithm
      enc: "A256GCM",        // Content encryption algorithm
      kid: singpassEncryptionKeyId,
    })
    .encrypt(singpassPublicEncryptionKey);
    
  return encryptedJwt;
};

// After loading your own keys, add this
const singpassPublicKeyPath = path.join(__dirname, '../Others/SingPass/Keys/singpass-public-encryption-key.jwk.json');
let SINGPASS_PUBLIC_ENCRYPTION_KEY;
let SINGPASS_ENCRYPTION_KID;

try {
  SINGPASS_PUBLIC_ENCRYPTION_KEY = JSON.parse(fs.readFileSync(singpassPublicKeyPath, 'utf8'));
  SINGPASS_ENCRYPTION_KID = SINGPASS_PUBLIC_ENCRYPTION_KEY.kid;
  console.log("SingPass Public Encryption Key loaded successfully");
} catch (keyError) {
  console.error("Failed to load SingPass public encryption key:", keyError);
  // You may want to throw an error here or handle differently
}

module.exports = router;