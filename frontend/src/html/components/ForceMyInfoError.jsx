import React from 'react';

/**
 * ForceMyInfoError - A utility component to demonstrate how MyInfo error handling works
 * NOTE: This component is no longer needed as the error is now forced directly in formPage.jsx
 * 
 * This file is kept for reference only.
 */
const ForceMyInfoError = () => {
  return (
    <div style={{ 
      padding: '10px', 
      backgroundColor: '#f8d7da', 
      border: '1px solid #f5c6cb', 
      borderRadius: '4px',
      color: '#721c24',
      margin: '10px 0',
      textAlign: 'center'
    }}>
      ⚠️ This component is deprecated. MyInfo errors are now handled directly in formPage.jsx
    </div>
  );
};

export default ForceMyInfoError;
