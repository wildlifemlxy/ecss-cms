const { generateKeyPair, exportJWK } = require('jose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function generateAndSaveKeys() {
  // Generate a unique kid suffix for this run
  const kidSuffix = crypto.randomBytes(4).toString('hex');
  
  // Generate signing EC key pair (P-256)
  const { publicKey: signPublicKey, privateKey: signPrivateKey } = await generateKeyPair('ES256', { extractable: true });
  
  // Generate encryption EC key pair (P-256) for ECDH-ES+A256KW
  const { publicKey: encPublicKey, privateKey: encPrivateKey } = await generateKeyPair('ECDH-ES', { extractable: true });
  
  // Generate additional JWE RSA key pair for RSA-OAEP (more widely supported)
  const { publicKey: rsaPublicKey, privateKey: rsaPrivateKey } = await generateKeyPair('RSA-OAEP-256', { 
    modulusLength: 2048,
    extractable: true 
  });

  // Export signing public key as JWK
  const signJwk = await exportJWK(signPublicKey);
  signJwk.use = 'sig';
  signJwk.alg = 'ES256';
  signJwk.kid = `signing-key-${kidSuffix}`;

  // Export ECDH encryption public key as JWK
  const encJwk = await exportJWK(encPublicKey);
  encJwk.use = 'enc';
  encJwk.alg = 'ECDH-ES+A256KW';
  encJwk.kid = `ec-encryption-key-${kidSuffix}`;
  
  // Export RSA encryption public key as JWK
  const rsaJwk = await exportJWK(rsaPublicKey);
  rsaJwk.use = 'enc';
  rsaJwk.alg = 'RSA-OAEP-256';
  rsaJwk.kid = `rsa-encryption-key-${kidSuffix}`;

  const jwks = { keys: [signJwk, encJwk, rsaJwk] };

  // Export private keys as JWK
  const signPrivateJwk = await exportJWK(signPrivateKey);
  signPrivateJwk.use = 'sig';
  signPrivateJwk.alg = 'ES256';
  signPrivateJwk.kid = signJwk.kid;

  const encPrivateJwk = await exportJWK(encPrivateKey);
  encPrivateJwk.use = 'enc';
  encPrivateJwk.alg = 'ECDH-ES+A256KW';
  encPrivateJwk.kid = encJwk.kid;
  
  const rsaPrivateJwk = await exportJWK(rsaPrivateKey);
  rsaPrivateJwk.use = 'enc';
  rsaPrivateJwk.alg = 'RSA-OAEP-256';
  rsaPrivateJwk.kid = rsaJwk.kid;

  // Ensure the Keys directory exists
  const keysDir = path.join(__dirname, 'Keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  // Save JWKS (public keys)
  fs.writeFileSync(path.join(keysDir, 'jwks.json'), JSON.stringify(jwks, null, 2));
  
  // Save private keys as JWK
  fs.writeFileSync(path.join(keysDir, 'private-signing-key.jwk.json'), JSON.stringify(signPrivateJwk, null, 2));
  fs.writeFileSync(path.join(keysDir, 'private-ec-encryption-key.jwk.json'), JSON.stringify(encPrivateJwk, null, 2));
  fs.writeFileSync(path.join(keysDir, 'private-rsa-encryption-key.jwk.json'), JSON.stringify(rsaPrivateJwk, null, 2));

  console.log('JWKS (public keys) saved to Keys/jwks.json');
  console.log('Signing private key saved to Keys/private-signing-key.jwk.json');
  console.log('EC encryption private key saved to Keys/private-ec-encryption-key.jwk.json');
  console.log('RSA encryption private key saved to Keys/private-rsa-encryption-key.jwk.json');
  
  // Add verification/test code
  console.log('\nKey verification:');
  console.log('Signing key ID:', signJwk.kid);
  console.log('EC encryption key ID:', encJwk.kid);
  console.log('RSA encryption key ID:', rsaJwk.kid);
}

// Add a validation function to test the JWE encryption/decryption
async function testJweEncryption() {
  try {
    console.log('\nTesting JWE encryption and decryption...');
    const { createRemoteJWKSet, jwtVerify, CompactEncrypt, compactDecrypt, importJWK } = require('jose');
    
    const keysDir = path.join(__dirname, 'Keys');
    const jwksData = JSON.parse(fs.readFileSync(path.join(keysDir, 'jwks.json'), 'utf8'));
    const rsaPrivateKeyData = JSON.parse(fs.readFileSync(path.join(keysDir, 'private-rsa-encryption-key.jwk.json'), 'utf8'));
    
    // Find RSA encryption key from JWKS
    const rsaPublicKey = jwksData.keys.find(key => key.use === 'enc' && key.alg === 'RSA-OAEP-256');
    
    // Import keys
    const publicKey = await importJWK(rsaPublicKey);
    const privateKey = await importJWK(rsaPrivateKeyData);
    
    // Test data
    const testData = new TextEncoder().encode('This is a test message for JWE encryption with SingPass');
    
    // Create JWE
    const jwe = await new CompactEncrypt(testData)
      .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM', kid: rsaPublicKey.kid })
      .encrypt(publicKey);
    
    console.log('JWE created successfully:', jwe.substring(0, 50) + '...');
    
    // Decrypt JWE
    const { plaintext } = await compactDecrypt(jwe, privateKey);
    const decryptedText = new TextDecoder().decode(plaintext);
    
    console.log('JWE decrypted successfully:', decryptedText);
    return true;
  } catch (err) {
    console.error('JWE test failed:', err);
    return false;
  }
}

// Run both functions
async function run() {
  await generateAndSaveKeys();
  await testJweEncryption();
}


run();
run();