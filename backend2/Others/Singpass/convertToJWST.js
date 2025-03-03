const jose = require('node-jose');
const fs = require('fs');
//const { importPKCS8, exportJWK } = require('jose');
const { SignJWT, importPKCS8 } = require('jose');

// Load your public key (replace this with your public key path)
const publicKey = fs.readFileSync('public_key.pem', 'utf8');

// Generate key from the public key
jose.JWK.asKey(publicKey, 'pem').then((key) => {
  // Extract the public key components (x, y) and build the JWK object for signature
  const jwk = key.toJSON(true); // true means we include the public key components

  // Generate the JWKS (key set) object
  const jwks = {
    keys: [
      // Signature key (for signing JWT)
      {
        kty: 'EC',
        crv: 'P-256',
        x: jwk.x,
        y: jwk.y,
        use: 'sig',  // Signature use
        alg: 'ES256', // Algorithm for signing
        kid: 'your-key-id',  // Key ID (optional, you can generate a unique one)
      },
      // Encryption key (for encrypting JWT)
      {
        kty: 'EC',
        crv: 'P-256',
        x: jwk.x,
        y: jwk.y,
        use: 'enc',  // Encryption use
        alg: 'ECDH-ES+A256KW', // Correct encryption algorithm
        kid: 'your-encryption-key-id',  // Key ID (optional, you can generate a unique one)
      },
    ],
  };

  console.log(JSON.stringify(jwks, null, 2));
}).catch((err) => {
  console.error('Error generating key:', err);
});

// Load your private key in PEM format (replace with the path to your private key)
const privateKey = fs.readFileSync('private_key.pem', 'utf8');

// Generate key from the public key
jose.JWK.asKey(privateKey, 'pem').then((key) => {
  // Extract the public key components (x, y) and build the JWK object for signature
  const jwk = key.toJSON(true); // true means we include the public key components

  // Generate the JWKS (key set) object
  const jwks = {
    keys: [
      // Signature key (for signing JWT)
      {
        kty: 'EC',
        crv: 'P-256',
        x: jwk.x,
        y: jwk.y,
        use: 'sig',  // Signature use
        alg: 'ES256', // Algorithm for signing
        kid: 'your-key-id',  // Key ID (optional, you can generate a unique one)
      }
    ],
  };

  console.log(JSON.stringify(jwks, null, 2));
}).catch((err) => {
  console.error('Error generating key:', err);
});
