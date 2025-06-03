import React from 'react';

/**
 * TestMyInfoError - A testing utility component to display MyInfo error simulation status
 */
const TestMyInfoError = ({ onToggle, active = true }) => {
  const containerStyle = {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    backgroundColor: active ? '#e74c3c' : '#3498db',
    color: 'white',
    padding: '8px 15px',
    borderRadius: '4px',
    fontWeight: 'bold',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  };

  const iconStyle = {
    fontSize: '20px',
  };

  return (
    <div 
      style={containerStyle}
      onClick={onToggle}
      title="Click to toggle MyInfo error simulation"
    >
      <span style={iconStyle}>
        {active ? '⚠️' : '✅'}
      </span>
      <span>
        {active ? 'MyInfo Error Simulation: ON' : 'MyInfo Error Simulation: OFF'}
      </span>
    </div>
  );
};

export default TestMyInfoError;
