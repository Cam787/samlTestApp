import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Home() {
  const [idps, setIdps] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/idps')
      .then(response => {
        setIdps(response.data);
      })
      .catch(err => {
        setError('Error fetching identity providers');
      });
  }, []);

  useEffect(() => {
    axios.get('/isAlive')
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
      const response = await axios.get(`/login/${encodedIdpId}?t=${Date.now()}`);
      // Retrieve the login_url from the JSON response
      const { login_url } = response.data;
      // Now navigate the browser to that URL (this is a full-page navigation)
      window.location.href = login_url;
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
              Login with {idp.displayName}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;