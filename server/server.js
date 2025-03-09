// For Loading environment variables from .env file
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer  = require('multer');
const path = require('path');
const saml2 = require('saml2-js');
const selfsigned = require('selfsigned');
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const PORT = process.env.PORT || 3001;

const { addIdpFromMetadata, getIdp, listIdps } = require('./idpManager');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Setup body parsers.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve React static files from the client build (if built).
app.use(express.static(path.join(__dirname, '../client/build')));

// Set up session middleware.
app.use(session({
  secret: 'change-this-secret',
  resave: false,
  saveUninitialized: true
}));

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// --------------------
// Dynamically generate certificate and key.
const attrs = [{ name: 'commonName', value: 'localhost' }];
const pems = selfsigned.generate(attrs, { days: 365 });

var wantEncrypted = true

// Create our Service Provider (SP).
const sp_options = {
  entity_id: `http://localhost:${PORT}/metadata`,
  private_key: pems.private,
  certificate: pems.cert,
  assert_endpoint: `http://localhost:${PORT}/saml/acs`,
  allow_unencrypted_assertion: wantEncrypted, // this value comes from your configuration.
};
const sp = new saml2.ServiceProvider(sp_options);
// --------------------

// GET /isAlive
// Check to see if server is working
app.get('/isAlive', (req, res) => {
  res.json({ message: 'Server is Working!' });
});

// An example in-memory configuration. In production, you might store this in a database or configuration file.
let spConfig = {
  wantEncrypted: false, // default setting
  // ... other configuration settings
};

// API endpoint to update SP configuration
app.post('/api/sp-config', bodyParser.json(), (req, res) => {
  const { wantEncrypted } = req.body;
  if (typeof wantEncrypted === 'boolean') {
    spConfig.wantEncrypted = wantEncrypted;
    return res.status(200).json({ message: 'SP configuration updated.', spConfig });
  } else {
    return res.status(400).json({ error: 'Invalid configuration value.' });
  }
});

// GET /api/sp-metadata
// Returns the SP metadata (XML) for consumption by an IdP.
app.get('/api/sp-metadata', (req, res) => {
  try {
    const metadata = sp.create_metadata();
    res.header('Content-Type', 'application/xml');
    res.send(metadata);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/idps
// Returns a list of all available Identity Providers.
app.get('/api/idps', (req, res) => {
  try {
    const idpsList = listIdps();
    res.json(idpsList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/upload-metadata
// Admin endpoint to upload IdP metadata XML. Uses multer for file upload.
app.post('/api/admin/upload-metadata', upload.single('metadata'), (req, res) => {
  const fs = require('fs');
  const filePath = req.file.path;
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error reading uploaded file" });
    }
    // Remove the temp file.
    fs.unlink(filePath, () => {});
    
    addIdpFromMetadata(data, (err, idpData) => {
      if (err) {
        return res.status(500).json({ error: "Error parsing metadata: " + err.message });
      }
      res.json({ success: true, idp: { id: idpData.id, displayName: idpData.displayName } });
    });
  });
});

// GET /login/:idpId
// Initiates a SAML login via the selected IdP.
app.get('/login/:idpId', (req, res) => {
  console.log(`Login endpoint called with idpId: ${req.params.idpId}`);
  const encodedIdpId = req.params.idpId;
  const idpId = decodeURIComponent(encodedIdpId);
  const idp = getIdp(idpId);
  if (!idp) {
    return res.status(404).send("IdP not found");
  }
  // Add cache control headers to prevent caching
  res.set('Cache-Control', 'no-store');

  sp.create_login_request_url(idp, {}, (err, login_url, request_id) => {
    if (err) {
      return res.status(500).send("Error creating login request: " + err.message);
    }
    // Save the request_id (if needed for later verification).
    req.session.request_id = request_id;
    // Instead of redirecting, return the login_url as JSON. This is done to avoid CORS issues.
    res.status(200).json({ login_url });
  });
});

// POST /saml/acs
// SAML Assertion Consumer Service endpoint that handles the SAML response.
app.post('/saml/acs', bodyParser.urlencoded({ extended: false }), (req, res) => {

  // We try each IdP until one correctly validates the response.
  const options = {request_body: req.body};
  let validated = false;
  const idpEntries = listIdps();
  let processNext = (index) => {
    if (index <= idpEntries.length) {
      const curIdp = getIdp(idpEntries[index].id);
      sp.post_assert(curIdp, options, (err, saml_response) => {
        if (err) {
          console.error("Error validating SAML response using IdP ${idpEntries[index].id}:", err);
          processNext(index + 1);
        } else {
          validated = true;
          // On successful validation, store the returned user attributes in session.
          req.session.user = {
            samlUser: saml_response.user, // Your user attributes,
            name_id: saml_response.user.name_id, // or the appropriate property name
            session_index: saml_response.user.session_index  // or however it is provided
          }
          return res.redirect(`${frontendUrl}/dashboard`);
        }
      });
    } else {
      if (!validated) {
        console.log("No matches")
        return res.status(500).send("Could not validate SAML response with any configured IdP.");
      }
    }
  };
  processNext(0);
});

// GET /logout
// Clears the user session.
app.get('/logout/:idpId', (req, res) => {
  // Decode the IdP identifier from the URL
  const encodedIdpId = req.params.idpId;
  const idpId = decodeURIComponent(encodedIdpId);
  
  // Retrieve user info from the session
  const user = req.session.user;
  if (!user || !user.name_id || !user.session_index) {
    return res.status(401).send("User session not found or missing logout data.");
  }

  // Use the stored values from the session for the logout options
  const options = {
    name_id: user.name_id,
    session_index: user.session_index
  };
  
  // Retrieve the IdP configuration using your helper function
  const idp = getIdp(idpId);
  if (!idp) {
    return res.status(404).send("IdP not found");
  }

  sp.create_logout_request_url(idp, options, (err, logout_url, request_id) => {
    if (err) {
      return res.status(500).send("Error creating logout request: " + err.message);
    }
    // Instead of redirecting, return the login_url as JSON. This is done to avoid CORS issues.
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        console.error("Error destroying session:", destroyErr);
      }
      res.status(200).json({ logout_url });
      });  
    });
})

// GET /api/me
// Returns the authenticated user's profile information.
app.get('/api/me', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

// Catch-all: Serve React’s index.html for any unknown route.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});