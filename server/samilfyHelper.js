const samlify = require('samlify');
const fs = require('fs');
const path = require('path');

// Load or generate self-signed certificate and key
const keyPath = path.join(__dirname, 'keys');
const privateKeyPath = path.join(keyPath, 'privateKey.pem');
const publicKeyPath = path.join(keyPath, 'publicKey.pem');

let privateKey, publicKey;
if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
  // Load existing keys
  privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  publicKey = fs.readFileSync(publicKeyPath, 'utf8');
  console.log('Loaded existing keys.');
} else {
  // Generate new keys
  const selfsigned = require('selfsigned');
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = selfsigned.generate(attrs, { days: 365 });

  privateKey = pems.private;
  publicKey = pems.cert;

  // Ensure the keys directory exists
  if (!fs.existsSync(keyPath)) {
    fs.mkdirSync(keyPath);
  }

  // Save keys to files
  fs.writeFileSync(privateKeyPath, privateKey, 'utf8');
  fs.writeFileSync(publicKeyPath, publicKey, 'utf8');
  console.log('Generated and saved new keys.');
}

// Configure Service Provider
const sp = samlify.ServiceProvider({
  entityID: `http://localhost:${process.env.BACKEND_PORT || 3001}/metadata`,
  authnRequestsSigned: true,
  wantAssertionsSigned: false,
  wantMessageSigned: false,
  signingCert: publicKey,
  privateKey: privateKey,
  privateKeyPass: '',
  nameIDFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  assertionConsumerService: `http://localhost:${process.env.BACKEND_PORT || 3001}/saml/acs`,
  allowUnencryptedAssertion: true
});

function createLoginRequest(idp) {
  return sp.createLoginRequest(idp, 'post');
}

function parseLoginResponse(idp, req) {
  return sp.parseLoginResponse(idp, 'post', req);
}

function createLogoutRequest(idp, options) {
  return sp.createLogoutRequest(idp, options, 'redirect');
}

function getMetadata() {
  return sp.getMetadata();
}

function parseMetadata(metadataXml) {;
    return samlify.parseMetadata(metadataXml);
}

function IdentityProvider(idp) {
    return samlify.IdentityProvider(idp)
  };
module.exports = {
  createLoginRequest,
  parseLoginResponse,
  createLogoutRequest,
  getMetadata,
  parseMetadata,
  IdentityProvider
};