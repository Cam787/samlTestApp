# SAML Service Provider App

This is a sample application built in JavaScript that acts as a SAML 2.0 Service Provider. The backend (using Express and [saml2-js](https://github.com/Clever/saml2-js)) handles SAML authentication, while the frontend is implemented in React to provide a user interface with both login and administrative capabilities.

## Features

- **Multiple Identity Providers**  
  The Home page shows available IdP options. Users can log in via any available IdP.

- **Administrative Interface**  
  The Admin page allows you to upload new IdP metadata (an XML file) to dynamically add IdP options. It also lets you download the SP metadata which is generated using dynamically generated keys.

- **Dynamic Key Generation**  
  On startup, the app uses the `selfsigned` package to generate a certificate and private key used by the SP. These keys are embedded in the metadata.

- **User Dashboard**  
  Upon successful login, the dashboard displays all identity attributes returned from the IdP in a nicely formatted view along with a logout button.

- **Error Handling**  
  Both backend and frontend try to fail gracefully. Errors during metadata parsing, SAML response validation, or API calls are caught and an appropriate error message is shown.

## Project Structure
├── server/                   
│   ├── idpManager.js         // Module to parse and store IdP metadata/configs in memory  
│   ├── server.js             // Main server file: SP setup, SAML endpoints and admin APIs  
│   └── package.json          // Server dependencies and startup script  
├── client/                   
│   ├── public/
│   │   └── index.html        // Main HTML  
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.js       // Landing page – lists available IdP login buttons  
│   │   │   ├── Admin.js      // Admin page – upload IdP metadata and download SP metadata  
│   │   │   └── Dashboard.js  // Dashboard – shows identity attributes and a logout button  
|   |   |   └── SPConfiguration.js  // Service Provider Configuration – Page to update the Service Provider configuration (e.g. encrypted assertions)
│   │   ├── App.js            // React routing between pages  
│   │   └── index.js          // React entry point  
│   └── package.json          // Client dependencies and scripts  
└── README.md                 // Documentation

## How to Run the Application

### Prerequisites
- Node.js (v12.x or later)
- npm

### Setup

#### 1. Server Setup
- Open a terminal, navigate to the `server` directory, and install dependencies:

```bash
cd server
npm install
```

Starting the server
```bash
npm start
```
The backend server will run on port 3001 by default.

#### 2. Client Setup
In another terminal, navigate to the client directory and install its dependencies:
```bash
cd client
npm install
```

Start the React development server:

```bash
export NODE_OPTIONS=--openssl-legacy-provider
npm start
```

The React app will typically run on port 3000. (API calls are proxied to the backend.)
Note: In a production scenario, you can build the React app (npm run build in the client folder) and the Express server will serve the static files from the client/build directory.

### Using the Application
#### Home Page
- The landing page lists all available Identity Providers.
- Click the Login with [IdP Name] button for the preferred IdP to initiate a SAML login.

#### Admin Interface
- Click the Admin link from the navigation bar.
- Upload IdP Metadata: Use the file input to select and upload an IdP metadata XML file. If parsed successfully, the new IdP is added to the Home page’s login options.
- Download SP Metadata: Click the button to download the SP metadata XML file. This file is what you share with an Identity Provider to set up SAML integration.

#### Dashboard
-After a successful login, you are redirected to the Dashboard where:
-Your identity attributes (as returned by the IdP) are displayed.
-A Logout button is provided to end the session.

### Code Walkthrough
#### Server
Dynamic Key Generation: The server dynamically generates a self-signed certificate and private key using selfsigned. These are used to create the SP metadata.
SAML Setup: The SP is configured with its entity ID and Assertion Consumer Service (ACS) URL. Endpoints exist for initiating login (/login/:idpId), processing the SAML response (/saml/acs), and downloading metadata (/api/sp-metadata).
IdP Management: The idpManager.js module uses xml2js to parse uploaded IdP metadata and create new IdentityProvider instances with saml2-js. It holds IdP configurations in memory.

#### Client
Routing: React Router (react-router-dom) is used to manage routing between Home, Admin, and Dashboard pages.
Home Component: Fetches a list of IdPs from /api/idps and renders login buttons. Clicking a button redirects to the backend’s login endpoint.
Admin Component: Lets administrators upload new IdP metadata and download SP metadata.
Dashboard Component: After login, it fetches user attributes from /api/me and displays them alongside a logout button.
Service Provider Componnent: Used for updating the Service Provider's configuration

#### Further Improvements
You might choose to persist IdP configurations in a database rather than in-memory.
Enhance UI styling and add better error logging.
Expand the SAML functionality (e.g., signing/authenticating requests/responses) if needed.
Enjoy exploring and extending this SAML Service Provider App!
Ability to persists a Service Providers configuration within the code, so it doesn't need to be generated each time
Ability to persists a Identity Provider configuration within the code, so it doesn't need to be uploaded each time

---

## Final Remarks

This implementation is a starting point that you can extend as needed. For example, you might want to add persistent storage for IdP configurations or improve error reporting/logging. It’s designed to run locally; when you’re ready to deploy, adjust endpoints, secrets, and security settings accordingly.

Feel free to dive deeper into SAML flows and the React UI if you need more customization.

Happy coding!