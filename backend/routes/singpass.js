const express = require('express');
const router = express.Router();
const moment = require('moment');
const axios = require('axios');
const path = require('path');

// Constants defined at top level
const CLIENT_ID = "mHlUcRS43LOQAjkYJ22MNvSpE8vzPmfo";
const JWTTOKENURL = "https://stg-id.singpass.gov.sg";
const SPTOKENURL = "https://stg-id.singpass.gov.sg/token";
const REDIRECT_URI = process.env.NODE_ENV === 'production' 
  ? "https://ecss-cms-frontend.azurewebsites.net/myinfo-redirect"  // Replace with your actual Azure frontend URL
  : "http://localhost:3000/myinfo-redirect";

const USERINFO_URL = "https://stg-id.singpass.gov.sg/userinfo";

// Initialize jose as null and import it dynamically
let jose = null;

// Load jose asynchronously before handling requests
async function initializeJose() {
  if (jose === null) {
    jose = await import('jose');
    console.log('Jose library loaded successfully');
  }
  return jose;
}

// Helper function to extract value from SingPass structured data
function extractSingPassValue(data) {
  if (data === null || data === undefined) {
    return null;
  }
  
  // Handle SingPass structured data format: {lastupdated, source, classification, value}
  if (typeof data === 'object' && data.value !== undefined) {
    return data.value;
  }
  
  // Return the data as-is if it's not structured
  return data;
}

// Helper function to process extracted data and remove structured objects
function processExtractedData(rawData) {
  const processedData = {};
  
  Object.keys(rawData).forEach(key => {
    const extractedValue = extractSingPassValue(rawData[key]);
    if (extractedValue !== null && extractedValue !== undefined) {
      processedData[key] = extractedValue;
    }
  });
  
  return processedData;
}

// Modified encrypt function to use dynamically imported jose
async function encryptJwtAsJwe(unsignedJwt, encryptionJwk) {
  const joseLib = await initializeJose();
  // Extract public JWK from private key
  const publicJwk = { ...encryptionJwk };
  delete publicJwk.d;
  const encKey = await joseLib.importJWK(publicJwk, "ECDH-ES+A256KW");
  return await new joseLib.CompactEncrypt(
    new TextEncoder().encode(unsignedJwt)
  )
    .setProtectedHeader({
      alg: "ECDH-ES+A256KW",
      enc: "A256GCM",
      kid: encryptionJwk.kid,
    })
    .encrypt(encKey);
}

// Modified sign function to use dynamically imported jose
async function signJwtAsJws(payload, signingJwk, kid) {
  const joseLib = await initializeJose();
  const privateKey = await joseLib.importJWK(signingJwk, "ES256");
  return await new joseLib.SignJWT(payload)
    .setProtectedHeader({
      alg: "ES256",
      kid: kid,
      typ: "JWT",
    })
    .sign(privateKey);
}

// Enhanced UserInfo function to handle JWE responses
async function fetchUserInfo(accessToken, options = {}) {
  const { retries = 1, timeout = 5000 } = options;
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      console.log(`UserInfo request attempt ${attempt + 1}/${retries + 1}`);
      
      // Check token type
      const isJwt = accessToken.includes('.');
      const tokenType = isJwt ? "JWT" : "opaque";
      console.log(`Token appears to be ${tokenType} type`);
      
      const response = await axios.get(USERINFO_URL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'SingPass-Integration/1.0'
        },
        timeout,
        validateStatus: status => true
      });
      
      console.log(`UserInfo response status: ${response.status}`);
      
      // Check for successful response
      if (response.status === 200) {
        const userInfoResponse = response.data;
        console.log("UserInfo response data:", userInfoResponse);
        
        // Check if response is a JWE (encrypted)
        if (typeof userInfoResponse === 'string' && userInfoResponse.split('.').length === 5) {
          console.log("UserInfo response is JWE, decrypting...");
          
          try {
            // Load encryption private key
            const ENCRYPTION_PRIVATE_KEY = require("../Others/SingPass/Keys/private-ec-encryption-key.jwk.json");
            
            // Decrypt the JWE
            const joseLib = await initializeJose();
            const privateKey = await joseLib.importJWK(ENCRYPTION_PRIVATE_KEY, "ECDH-ES+A256KW");
            
            const { plaintext } = await joseLib.compactDecrypt(userInfoResponse, privateKey);
            const decryptedText = new TextDecoder().decode(plaintext);
            
            console.log("Decrypted text:", decryptedText);
            
            // Check if decrypted content is a JWT
            if (decryptedText.startsWith('eyJ')) {
              console.log("Decrypted content is a JWT, decoding...");
              const decryptedUserInfo = joseLib.decodeJwt(decryptedText);
              console.log("Decoded JWT claims:", decryptedUserInfo);
              
              // Extract key user information from decrypted JWT claims - keeping original structure for now
              const rawExtractedData = {
                sub: decryptedUserInfo.sub,
                uinfin: decryptedUserInfo.uinfin,
                name: decryptedUserInfo.name,
                dob: decryptedUserInfo.dob,
                sex: decryptedUserInfo.sex,
                nationality: decryptedUserInfo.nationality,
                race: decryptedUserInfo.race,
                residentialstatus: decryptedUserInfo.residentialstatus,
                email: decryptedUserInfo.email,
                mobileno: decryptedUserInfo.mobileno,
                regadd: decryptedUserInfo.regadd
              };
              
              // Process the extracted data to get clean values
              const processedData = processExtractedData(rawExtractedData);
              
              return { 
                success: true, 
                userInfo: decryptedUserInfo,
                extractedData: processedData,
                uinfin: extractSingPassValue(decryptedUserInfo.uinfin) // Extract clean UINFIN value
              };
              
            } else {
              // Try parsing as JSON if it's not a JWT
              try {
                const decryptedUserInfo = JSON.parse(decryptedText);
                console.log("Decrypted UserInfo (JSON):", decryptedUserInfo);
                
                // Extract key user information from decrypted data
                const rawExtractedData = {
                  sub: decryptedUserInfo.sub,
                  uinfin: decryptedUserInfo.uinfin,
                  name: decryptedUserInfo.name,
                  dob: decryptedUserInfo.dob,
                  sex: decryptedUserInfo.sex,
                  nationality: decryptedUserInfo.nationality,
                  race: decryptedUserInfo.race,
                  residentialstatus: decryptedUserInfo.residentialstatus,
                  email: decryptedUserInfo.email,
                  mobileno: decryptedUserInfo.mobileno,
                  regadd: decryptedUserInfo.regadd
                };
                
                // Process the extracted data to get clean values
                const processedData = processExtractedData(rawExtractedData);
                
                return { 
                  success: true, 
                  userInfo: decryptedUserInfo,
                  extractedData: processedData,
                  uinfin: extractSingPassValue(decryptedUserInfo.uinfin)
                };
                
              } catch (jsonError) {
                console.error("Failed to parse decrypted content as JSON:", jsonError);
                return {
                  success: false,
                  error: "UserInfo decryption succeeded but content parsing failed",
                  message: jsonError.message,
                  decryptedContent: decryptedText.substring(0, 100) + "..."
                };
              }
            }
            
          } catch (decryptError) {
            console.error("JWE decryption failed:", decryptError);
            return {
              success: false,
              error: "UserInfo JWE decryption failed",
              message: decryptError.message
            };
          }
          
        } else {
          // Handle plain JSON response
          console.log("UserInfo response is plain JSON");
          
          const rawExtractedData = {
            sub: userInfoResponse.sub,
            uinfin: userInfoResponse.uinfin,
            name: userInfoResponse.name,
            dob: userInfoResponse.dob,
            sex: userInfoResponse.sex,
            nationality: userInfoResponse.nationality,
            race: userInfoResponse.race,
            residentialstatus: userInfoResponse.residentialstatus,
            email: userInfoResponse.email,
            mobileno: userInfoResponse.mobileno,
            regadd: userInfoResponse.regadd
          };
          
          // Process the extracted data to get clean values
          const processedData = processExtractedData(rawExtractedData);
          
          return { 
            success: true, 
            userInfo: userInfoResponse,
            extractedData: processedData,
            uinfin: extractSingPassValue(userInfoResponse.uinfin)
          };
        }
      }
      
      // Handle error responses
      if (response.status === 401) {
        console.error("Authorization failed (401):", response.data);
        return { 
          success: false,
          error: "UserInfo authorization failed", 
          status: response.status, 
          details: response.data,
          tokenType,
          recommendation: "Ensure 'openid uinfin' scopes are included in authorization request"
        };
      }
      
      // Retry for server errors
      if (response.status === 429 || response.status >= 500) {
        console.warn(`Retriable error (${response.status}), attempt ${attempt + 1}`);
        await new Promise(r => setTimeout(r, 1000 * Math.min(3, attempt + 1)));
        attempt++;
        continue;
      }
      
      // Other errors
      console.error("UserInfo request failed:", {
        status: response.status,
        data: response.data
      });
      return { 
        success: false,
        error: "UserInfo request failed", 
        status: response.status, 
        details: response.data,
        tokenType
      };
      
    } catch (error) {
      console.error("Error fetching UserInfo:", error.message);
      
      if (attempt < retries) {
        attempt++;
        await new Promise(r => setTimeout(r, 1000 * Math.min(3, attempt)));
        continue;
      }
      
      return { 
        success: false,
        error: "UserInfo request error", 
        message: error.message,
        code: error.code || 'NETWORK_ERROR'
      };
    }
  }
  
  return {
    success: false,
    error: "UserInfo request failed after retries",
    lastAttempt: attempt
  };
}

// Main endpoint handler
router.post('/', async (req, res) => {
  try {
    // Ensure jose is initialized
    await initializeJose();
    
    // Get authorization code and code verifier
    const code = req.body.code || req.query.code;
    if (!code) {
      return res.status(400).json({ error: "Bad request", message: "Missing required parameter: code" });
    }
    
    const code_verifier = req.body.code_verifier || req.query.code_verifier;
    if (!code_verifier) {
      return res.status(400).json({ error: "Bad request", message: "Missing required parameter: code_verifier" });
    }
    
    // Load configuration and keys
    const SIGNATURE_PRIVATE_KEY = require("../Others/SingPass/Keys/private-signing-key.jwk.json");
    const ENCRYPTION_PRIVATE_KEY = require("../Others/SingPass/Keys/private-ec-encryption-key.jwk.json");
    const KID = SIGNATURE_PRIVATE_KEY.kid;
    
    // For JWT payload and signatures
    const nowTime = moment().unix();
    const futureTime = moment().add(2, "minutes").unix();
    
    const jwtPayload = {
      sub: CLIENT_ID,
      iss: CLIENT_ID,
      aud: JWTTOKENURL,
      iat: nowTime,
      exp: futureTime,
      direct_pii_allowed: true
    };
    
    // Step 1: Sign JWT
    let jws;
    try {
      console.log("KID:", KID);
      jws = await signJwtAsJws(jwtPayload, SIGNATURE_PRIVATE_KEY, KID);
    } catch (err) {
      return res.status(500).json({ error: "JWS signing failed", message: err.message });
    }

    // Step 2: Token exchange
    let tokenData;
    try {
      const response = await axios.post(
        SPTOKENURL,
        new URLSearchParams({
          client_id: CLIENT_ID,
          redirect_uri: REDIRECT_URI,
          code: code,
          client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          grant_type: "authorization_code",
          client_assertion: jws,
          code_verifier: code_verifier,
          scope: "openid name uinfin residentialstatus race sex dob nationality mobileno email regadd"
        }),
        {
          headers: { 
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      tokenData = response.data;
      console.log("Token exchange response:", tokenData);
    } catch (e) {
      return res.status(500).json({ 
        error: "Token exchange failed", 
        message: e.message, 
        details: e.response?.data 
      });
    }

    // Step 3: Process ID token to extract UUID and user data
    try {
      if (!tokenData || !tokenData.id_token) {
        return res.status(400).json({ error: "Missing id_token in response" });
      }
      
      const idToken = tokenData.id_token;
      const tokenParts = idToken.split('.');
      console.log("Token parts:", tokenParts.length);
      
      // Handle JWT (not JWE) token case
      if (tokenParts.length === 3) {
        try {
          const joseLib = await initializeJose();
          const claims = joseLib.decodeJwt(idToken);
          console.log("Decoded JWT claims:", claims);
          
          // Extract UUID from JWT
          const uuid = claims.sub;

          console.log("Fetching user data from UserInfo endpoint...");  
          const userInfoResult = await fetchUserInfo(tokenData.access_token);
          console.log("UserInfo result:", userInfoResult);
          
          // Prepare response with UUID and user data
          const response = {
            success: true,
            uuid: uuid
          };
          
          // Add extracted user data if available
          if (userInfoResult.success && userInfoResult.extractedData) {
            response.userData = userInfoResult.extractedData;
            response.uinfin = userInfoResult.uinfin;
            console.log("User data retrieved from UserInfo:", userInfoResult.extractedData);
          } else {
            console.warn("Failed to fetch user data from UserInfo:", userInfoResult.error);
          }
          
          return res.status(200).json(response);
          
        } catch (jwtError) {
          return res.status(400).json({ 
            error: "JWT decoding failed", 
            message: jwtError.message
          });
        }
      }
      
      return res.status(500).json({
        error: "Invalid token format",
        message: "Token is neither JWT nor JWE format"
      });
      
    } catch (e) {
      return res.status(500).json({ 
        error: "Token processing failed", 
        message: e.message
      });
    }
    
  } catch (e) {
    return res.status(500).json({ 
      error: "Internal server error", 
      message: e.message
    });
  }
});

// Export router
module.exports = router;