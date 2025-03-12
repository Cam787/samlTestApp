const crypto = require('crypto');
const { parseMetadata, IdentityProvider } = require('./samilfyHelper.js');

let idps = {}; // key: id, value: { idp: samlify.IdentityProvider, metadata: raw metadata }

function generateIdpId(metadataXml) {
  // Use the entityID from metadata if available, else generate a random id.
  try {
    const metadata = parseMetadata(metadataXml);
    return metadata.entityDescriptor.entityID;
  } catch (err) {
    return crypto.randomBytes(4).toString('hex');
  }
}

function addIdpFromMetadata(xml, callback) {
  try {
    const id = generateIdpId(xml);
    const idp = IdentityProvider({metadata: xml});

    idps[id] = { idp, metadata: xml };
    console.log(`IdP added: ${id}`); // Added for debugging
    callback(null, { id, idp, metadata: xml });
  } catch (ex) {
    callback(ex);
  }
}

function getIdp(id) {
  return idps[id] ? idps[id].idp : null;
}

function listIdps() {
  // Return a list of IdPs with id.
  const idpsList = Object.keys(idps).map(id => {
    return { id: id };
  });
  console.log('Listing IdPs:', idpsList); // Added for debugging
  return idpsList;
}

module.exports = {
  addIdpFromMetadata,
  getIdp,
  listIdps
};