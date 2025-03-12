import React, { useEffect, useState } from 'react';
import axios from 'axios';
axios.defaults.withCredentials = true;

function Home() {
  const [idps, setIdps] = useState([]);
  const [error, setError] = useState('');
  const backend_url = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    axios.get(`${backend_url}/api/idps`)
      .then(response => {
        setIdps(response.data);
      })
      .catch(err => {
        setError('Error fetching identity providers');
      });
  }, []);

  useEffect(() => {
    axios.get(`${backend_url}/isAlive`)
      .then(response => {
        console.log(response.data);
      })
      .catch(err => {
        console.error('Error:', err);
      });
  }, []);
  
  const handleLogin = async (idpId) => {
    const encodedIdpId = encodeURIComponent(idpId);
    try {
      // Make the GET call using Axios (this call will be proxied to your backend)
      const response = await axios.get(`${backend_url}/login/${encodedIdpId}?t=${Date.now()}`);
      // Retrieve the login_url from the JSON response
      const login_url = response.data.login_url;
      const samlRequest = response.data.samlRequest;
      const relayState = response.data.relayState;
      
      // Ensure the variables are correctly initialized and not undefined
      if (!login_url || !samlRequest) {
        throw new Error('Missing required parameters from the response.');
      }

      // Create a form element
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = login_url;

      // Create a hidden input field for the SAML Request
      const inputSAMLRequest = document.createElement('input');
      inputSAMLRequest.type = 'hidden';
      inputSAMLRequest.name = 'SAMLRequest';
      inputSAMLRequest.value = samlRequest;
      form.appendChild(inputSAMLRequest);

      if (relayState) {
        // Create a hidden field for the relayState
        const inputRelayState = document.createElement('input');
        inputRelayState.type = 'hidden';
        inputRelayState.name = 'RelayState';
        inputRelayState.value = relayState;
        form.appendChild(inputRelayState)
      }
      
      // Append the form to the body and submit it
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      alert('Error performing login: ' + error.message);
    }
  };
  

  return (
    <div>
      <h2>Welcome to SAML SP App</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h3>Login Options:</h3>
      <ul>
        {idps.map(idp => (
          <li key={idp.id}>
            <button onClick={() => handleLogin(idp.id)}>
              Login with {idp.id}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;