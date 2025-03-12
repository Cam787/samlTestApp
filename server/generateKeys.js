// generateKeys.js

const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

function generateKeys() {
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = selfsigned.generate(attrs, { days: 365 });

  const keyPath = path.join(__dirname, 'keys');
  if (!fs.existsSync(keyPath)) {
    fs.mkdirSync(keyPath);
  }

  // Save private key
  fs.writeFileSync(path.join(keyPath, 'privateKey.pem'), pems.private, 'utf8');
  console.log('Private key saved to keys/privateKey.pem');

  // Save public key (certificate)
  fs.writeFileSync(path.join(keyPath, 'publicKey.pem'), pems.cert, 'utf8');
  console.log('Public key saved to keys/publicKey.pem');
}

// Run the function to generate keys
generateKeys();
