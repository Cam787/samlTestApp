const xml2js = require('xml2js');
const saml2 = require('saml2-js');
const crypto = require('crypto');

let idps = {}; // key: id, value: { idp: saml2.IdentityProvider, metadata: parsed metadata, displayName }

function generateIdpId(metadataObj) {
  // Use the entityID from metadata if available, else generate a random id.
  try {
    const entityID = metadataObj.EntityDescriptor.$.entityID;
    return entityID;
  } catch (err) {
    return crypto.randomBytes(4).toString('hex');
  }
}

function parseIdpMetadata(xml, callback) {
  xml2js.parseString(
    xml,
    {
      explicitArray: false,
      // These processors remove any namespace prefixes from tag and attribute names
      tagNameProcessors: [xml2js.processors.stripPrefix],
      attrNameProcessors: [xml2js.processors.stripPrefix]
    },
    (err, result) => {
      if (err) return callback(err);

      try {
        // Without prefixes, the entity descriptor is now directly available.
        const entityDescriptor = result.EntityDescriptor;
        const id = generateIdpId(result);//IDPSSODescriptor

        // --- Extract Single Sign-On URL (prefer HTTP-Redirect binding) ---
        let ssoLoginUrl = "";
        if (
          entityDescriptor.IDPSSODescriptor &&
          entityDescriptor.IDPSSODescriptor.SingleSignOnService
        ) {
          const ssoService =
            entityDescriptor.IDPSSODescriptor.SingleSignOnService;
          if (Array.isArray(ssoService)) {
            const redirectService = ssoService.find(
              s =>
                s.$.Binding ===
                "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            );
            ssoLoginUrl = redirectService
              ? redirectService.$.Location
              : ssoService[0].$.Location;
          } else {
            ssoLoginUrl = ssoService.$.Location;
          }
        }

        // --- Extract Single Logout URL (if available) ---
        let ssoLogoutUrl = "";
        if (
          entityDescriptor.IDPSSODescriptor &&
          entityDescriptor.IDPSSODescriptor.SingleLogoutService
        ) {
          const sloService =
            entityDescriptor.IDPSSODescriptor.SingleLogoutService;
          if (Array.isArray(sloService)) {
            const redirectSLO = sloService.find(
              s =>
                s.$.Binding ===
                "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            );
            ssoLogoutUrl = redirectSLO
              ? redirectSLO.$.Location
              : sloService[0].$.Location;
          } else {
            ssoLogoutUrl = sloService.$.Location;
          }
        }

        // --- Extract certificates ---
        let certificates = [];
        if (
          entityDescriptor.IDPSSODescriptor &&
          entityDescriptor.IDPSSODescriptor.KeyDescriptor
        ) {
          const keyDescriptors = Array.isArray(
            entityDescriptor.IDPSSODescriptor.KeyDescriptor
          )
            ? entityDescriptor.IDPSSODescriptor.KeyDescriptor
            : [entityDescriptor.IDPSSODescriptor.KeyDescriptor];
          keyDescriptors.forEach(descriptor => {
            if (
              descriptor.KeyInfo &&
              descriptor.KeyInfo.X509Data &&
              descriptor.KeyInfo.X509Data.X509Certificate
            ) {
              let cert = descriptor.KeyInfo.X509Data.X509Certificate;
              cert = cert.replace(/\s+/g, "");
              certificates.push(cert);
            }
          });
        }

        // Create the options object for the IdentityProvider.
        let idp_options = {
          sso_login_url: ssoLoginUrl,
          sso_logout_url: ssoLogoutUrl,
          certificates: certificates,
          force_authn: false,
          sign_get_request: false
        };

        // Instantiate IdentityProvider.
        const idp = new saml2.IdentityProvider(idp_options);

        // Determine a display name: use the OrganizationName if provided, else fallback to id.
        const displayName =
          (entityDescriptor.Organization &&
            entityDescriptor.Organization.OrganizationName &&
            (entityDescriptor.Organization.OrganizationName._ ||
              entityDescriptor.Organization.OrganizationName)) ||
          id;

        callback(null, { id, idp, metadata: result, displayName });
      } catch (ex) {
        callback(ex);
      }
    }
  );
}

function addIdpFromMetadata(xml, callback) {
  parseIdpMetadata(xml, (err, idpData) => {
    if (err) return callback(err);
    idps[idpData.id] = idpData;
    callback(null, idpData);
  });
}

function getIdp(id) {
  return idps[id] ? idps[id].idp : null;
}

function listIdps() {
  // Return a list of IdPs with id and displayName.
  return Object.values(idps).map(entry => {
    return { id: entry.id, displayName: entry.displayName };
  });
}

module.exports = {
  addIdpFromMetadata,
  getIdp,
  listIdps
};