import React, { useState } from 'react';
import Popup from '../components/popup/popupMessage';

/**
 * MyInfoErrorTest - A standalone page for testing MyInfo error handling
 * This page allows you to easily trigger and visualize the MyInfo error popup
 * for testing and screenshot purposes.
 */
const MyInfoErrorTest = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    'MyInfo service is temporarily unavailable. Please try again later.'
  );

  // Error scenarios for testing
  const errorScenarios = [
    {
      message: 'MyInfo service is temporarily unavailable. Please try again later.',
      type: 'service_unavailable',
      label: 'Service Unavailable'
    },
    {
      message: 'Unable to retrieve your data from MyInfo at this time.',
      type: 'data_retrieval_failed',
      label: 'Data Retrieval Failed'
    },
    {
      message: 'MyInfo is currently undergoing maintenance. Service will be restored shortly.',
      type: 'maintenance',
      label: 'Maintenance'
    },
    {
      message: 'Connection to MyInfo service failed. Please check your internet connection and try again.',
      type: 'connection_failed',
      label: 'Connection Failed'
    },
    {
      message: 'MyInfo authentication timed out. Please try again.',
      type: 'timeout',
      label: 'Timeout'
    },
    {
      message: 'MyInfo service is experiencing high traffic. Please wait a moment and try again.',
      type: 'high_traffic',
      label: 'High Traffic'
    }
  ];

  // Handler for closing the popup
  const handleClosePopup = () => {
    setShowPopup(false);
  };

  // Handler for proceeding with manual form entry
  const handleProceedManually = () => {
    console.log('User chose to proceed manually');
    setShowPopup(false);
  };

  // Show error popup with the selected scenario
  const showErrorPopup = (scenario) => {
    setErrorMessage(scenario.message);
    setShowPopup(true);
  };

  const pageStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
  };

  const checkmarkStyle = {
    display: 'inline-block',
    width: '24px',
    height: '24px',
    backgroundColor: '#4caf50',
    borderRadius: '50%',
    color: 'white',
    textAlign: 'center',
    lineHeight: '24px',
    fontWeight: 'bold',
    marginRight: '10px',
  };

  const sectionStyle = {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '5px',
    marginBottom: '20px',
  };

  const buttonContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '20px',
  };

  const buttonStyle = {
    padding: '10px 15px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4caf50',
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={checkmarkStyle}>✓</span>
        <h1>MyInfo Error Handling Test</h1>
      </div>

      <div style={sectionStyle}>
        <h2>Requirement <span style={checkmarkStyle}>✓</span></h2>
        <p style={{ fontWeight: 'bold' }}>
          In the event of a MyInfo error, users can continue filling out the form by manually entering their personal details.
        </p>
        <p>
          This page allows you to test and take screenshots of the error handling implementation
          that satisfies this requirement.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2>Test Error Scenarios</h2>
        <p>Click a button below to show the corresponding error popup:</p>

        <div style={buttonContainerStyle}>
          {errorScenarios.map((scenario) => (
            <button
              key={scenario.type}
              style={buttonStyle}
              onClick={() => showErrorPopup(scenario)}
            >
              {scenario.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '20px' }}>
          <button 
            style={primaryButtonStyle}
            onClick={() => showErrorPopup(errorScenarios[0])}
          >
            Show Default Error Popup
          </button>
        </div>
      </div>

      {/* MyInfo Error Popup */}
      <Popup
        isOpen={showPopup}
        type="myinfo-error"
        message={errorMessage}
        closePopup={handleClosePopup}
        onProceedManually={handleProceedManually}
      />
    </div>
  );
};

export default MyInfoErrorTest;
