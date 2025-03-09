import React, { useState } from 'react';
import axios from 'axios';

function SPConfiguration() {
  const [wantEncrypted, setWantEncrypted] = useState(false);
  const [message, setMessage] = useState('');

  const handleRadioChange = (event) => {
    setWantEncrypted(event.target.value === 'true');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('/api/sp-config', { wantEncrypted });
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Error updating configuration: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSave}>
      <fieldset>
        <legend>Want Encrypted Assertions?</legend>
        <label>
          <input
            type="radio"
            name="encryptedAssertions"
            value="true"
            checked={wantEncrypted === true}
            onChange={handleRadioChange}
          />
          Yes
        </label>
        <label style={{ marginLeft: '1em' }}>
          <input
            type="radio"
            name="encryptedAssertions"
            value="false"
            checked={wantEncrypted === false}
            onChange={handleRadioChange}
          />
          No
        </label>
      </fieldset>
      <button type="submit">Save Settings</button>
      {message && <p>{message}</p>}
    </form>
  );
}

export default SPConfiguration;
