const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

router.get('/.well-known/jwks.json', (req, res) => {
  const jwksPath = path.join(__dirname, '../Others/SingPass/Keys/jwks.json');
  try {
    const jwks = JSON.parse(fs.readFileSync(jwksPath, 'utf8'));
    console.log('JWKS loaded successfully', jwks);
   // res.json(jwks);
  } catch (err) {
    res.status(500).json({ error: 'Unable to load JWKS' });
  }
});

module.exports = router;