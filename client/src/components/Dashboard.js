import React, { useEffect, useState } from 'react';
import axios from 'axios';
axios.defaults.withCredentials = true;

function Dashboard() {
  const [user, setUser] = useState(null);
  const [error,setError] = useState('');
  const [idps, setIdps] = useState([]);
  const backend_url = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    axios.get(`${backend_url}/api/me?t=${Date.now()}`)
      .then(response => {
        setUser(response.data.user);
      })
      .catch(err => {
        setError('Error fetching user info. Please login.');
      });
  }, []);

  useEffect(() => {
    axios.get(`${backend_url}/api/idps`)
      .then(response => {
        setIdps(response.data);
      })
      .catch(err => {
        setError('Error fetching identity providers');
      });
  }, []);

    const handleLogout = async (idpId) => {
    try {
      //Time to fix 304 Not Modified response
      const encodedIdpId = encodeURIComponent(idpId);
      const response = await axios.get(`${backend_url}/logout/${encodedIdpId}?t=${Date.now()}`);
      // Retrieve the logout_url from the JSON response
      const { logout_url } = response.data;
      window.location.href = logout_url;
      }  catch (error) {
      alert('Error performing logout: ' + error.message);
      }
    };
    
  if(error) {
    return (
      <div>
        <p style={{ color: 'red' }}>{error}</p>
        <a href="/">Return Home</a>
      </div>
    );
  }

  else if(!user) {
    return <div>Loading...</div>;
  }

  else {
    return (
      <div>
        <h2>User Dashboard</h2>
        <h3>Logout Options:</h3>
          <ul>
            {idps.map(idp => (
              <li key={idp.id}>
                <button onClick={() => handleLogout(idp.id)}>
                  Logout with {idp.displayName}
                </button>
              </li>
            ))}
          </ul>
        <h3>Identity Information</h3>
        <ul>
          {Object.keys(user).map((key) => (
            <li key={key}>
              <strong>{key}:</strong> {typeof user[key] === 'object' ? JSON.stringify(user[key], null, 2) : user[key]}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default Dashboard;