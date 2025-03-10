import React, { useState } from 'react';
import axios from 'axios';
axios.defaults.withCredentials = true;

function Admin() {
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const backend_url = process.env.REACT_APP_BACKEND_URL;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) {
      setUploadMessage("Please select a metadata file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append('metadata', file);

    axios.post(`${backend_url}/api/admin/upload-metadata`, formData)
      .then(response => {
        setUploadMessage("Metadata uploaded successfully.");
      })
      .catch(err => {
        setUploadMessage("Error uploading metadata: " + (err.response?.data?.error || err.message));
      });
  };

  const handleDownload = () => {
    // Download the SP metadata.
    axios.get(`${backend_url}/api/sp-metadata`, { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'xml' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'sp-metadata.xml');
        document.body.appendChild(link);
        link.click();
      })
      .catch(err => {
        alert('Error downloading metadata: ' + err.message);
      });
  };
  
  return (
    <div>
      <h2>Admin Interface</h2>
      <div>
        <h3>Upload Identity Provider Metadata</h3>
        <input type="file" onChange={handleFileChange} accept=".xml" />
        <button onClick={handleUpload}>Upload</button>
        {uploadMessage && <p>{uploadMessage}</p>}
      </div>
      <div>
        <h3>Download Service Provider Metadata</h3>
        <button onClick={handleDownload}>Download SP Metadata</button>
      </div>
    </div>
    
  );
}

export default Admin;