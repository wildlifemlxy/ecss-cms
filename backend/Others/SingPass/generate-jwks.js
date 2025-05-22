const { generateKeyPair, exportJWK } = require('jose');
const fs = require('fs');
const path = require('path');

async function generateAndSaveKeys() {
  // Generate signing EC key pair (P-256)
  const { publicKey: signPublicKey, privateKey: signPrivateKey } = await generateKeyPair('ES256', { extractable: true });
  // Generate encryption EC key pair (P-256)
  const { publicKey: encPublicKey, privateKey: encPrivateKey } = await generateKeyPair('ECDH-ES', { extractable: true });

  // Export signing public key as JWK
  const signJwk = await exportJWK(signPublicKey);
  signJwk.use = 'sig';
  signJwk.alg = 'ES256';
  signJwk.kid = 'signing-key-id';

  // Export encryption public key as JWK
  const encJwk = await exportJWK(encPublicKey);
  encJwk.use = 'enc';
  encJwk.alg = 'ECDH-ES+A256KW';
  encJwk.kid = 'encryption-key-id';

  const jwks = { keys: [signJwk, encJwk] };

  // Export private keys as JWK
  const signPrivateJwk = await exportJWK(signPrivateKey);
  signPrivateJwk.use = 'sig';
  signPrivateJwk.alg = 'ES256';
  signPrivateJwk.kid = 'signing-key-id';

  const encPrivateJwk = await exportJWK(encPrivateKey);
  encPrivateJwk.use = 'enc';
  encPrivateJwk.alg = 'ECDH-ES+A256KW';
  encPrivateJwk.kid = 'encryption-key-id';

  // Ensure the Keys directory exists
  const keysDir = path.join(__dirname, 'Keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  // Save JWKS (public keys)
  fs.writeFileSync(path.join(keysDir, 'jwks.json'), JSON.stringify(jwks, null, 2));
  // Save private keys as JWK
  fs.writeFileSync(path.join(keysDir, 'private-signing-key.jwk.json'), JSON.stringify(signPrivateJwk, null, 2));
  fs.writeFileSync(path.join(keysDir, 'private-encryption-key.jwk.json'), JSON.stringify(encPrivateJwk, null, 2));

  console.log('JWKS (public keys) saved to Keys/jwks.json');
  console.log('Signing private key saved to Keys/private-signing-key.jwk.json');
  console.log('Encryption private key saved to Keys/private-encryption-key.jwk.json');
}

generateAndSaveKeys();