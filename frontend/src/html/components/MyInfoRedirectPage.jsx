import React, { Component } from "react";
import axios from "axios";

class MyInfoRedirectPage extends Component {
  componentDidMount() {
    const params = new URLSearchParams(window.location.search);
    
    // Process successful authentication
    const code = params.get("code");
    const returnedState = params.get("state");
    const savedState = sessionStorage.getItem("state");
    const code_verifier = sessionStorage.getItem("code_verifier");

    // Log information for debugging
    console.log("URL params:", params.toString());
    console.log("Code:", code);
    console.log("Returned state:", returnedState);
    console.log("Saved state:", savedState);
    console.log("Code verifier exists:", code_verifier);
    
    // Validate response and automatically exchange code if valid
    if (code && returnedState && savedState && code_verifier && returnedState === savedState) {
      this.handleSendToBackend(code, code_verifier);
    } else {
      // Handle missing parameters or state mismatch
      this.setState({
        loading: false,
        error: true,
        errorMessage: "Invalid authentication parameters or state mismatch"
      });
    }
  }

  handleSendToBackend = async (code, code_verifier) => {
    console.log("Sending code to backend:", code);
    console.log("Using code_verifier:", code_verifier);
    
    try {
      const response = await axios.post(
        `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/singpass`,
        {
          code,
          code_verifier
        },
        {
          timeout: 30000, // 30 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log("Backend response:", response.data);
      
      // Handle successful authentication
      this.setState({ 
        loading: false,
        success: true, 
        data: response.data,
        error: false 
      });
      
    } catch (error) {
      console.error("Authentication failed:", error);
      this.setState({ 
        loading: false,
        success: false, 
        error: true,
        errorMessage: error.response?.data?.message || error.message || "Authentication failed"
      });
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      success: false,
      error: false,
      errorMessage: null,
      data: null
    };
  }

  // Helper function to format field names for display
  formatFieldName = (fieldName) => {
    const fieldMap = {
      sub: "Subject ID",
      uinfin: "NRIC/FIN",
      name: "Name",
      dob: "Date of Birth 出生日期",
      sex: "Gender 性别",
      race: "Race 种族",
      residentialstatus: "Residential Status 居民身份",
      email: "Email Address",
      mobileno: "Contact No. 联络号码",
      regadd: "Registered Address"
    };
    return fieldMap[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  };

  // Enhanced helper function to safely render complex SingPass structured objects
  renderValue = (value, fieldName = null) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    // Handle simple string or number values
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    
    // Handle SingPass structured data format: {lastupdated, source, classification, value}
    if (typeof value === 'object' && value.value !== undefined) {
      return this.renderValue(value.value, fieldName); // Pass fieldName for context
    }
    
    // Handle SingPass coded values: {code, desc, ...}
    if (typeof value === 'object' && value.desc !== undefined) {
      // Special handling for different fields with bilingual display
      if (fieldName === 'residentialstatus') {
        return this.formatResidentialStatus(value.code, value.desc);
      }
      if (fieldName === 'race') {
        return this.formatRace(value.code, value.desc);
      }
      if (fieldName === 'sex') {
        return this.formatGender(value.code, value.desc);
      }
      return value.desc; // Return the description for other coded values
    }
    
    // Handle mobile number structure: {areacode, prefix, nbr} - remove country code
    if (typeof value === 'object' && value.areacode && value.prefix && value.nbr) {
      const number = this.renderValue(value.nbr);
      return number; // Return only the number without country code
    }
    
    // Handle date of birth formatting to dd/mm/yyyy
    if (fieldName === 'dob' && typeof value === 'string') {
      return this.formatDateOfBirth(value);
    }
    
    // Handle address objects - return only postal code
    if (fieldName === 'regadd' && typeof value === 'object' && value.postal) {
      const postalValue = this.renderValue(value.postal);
      return postalValue !== 'N/A' ? postalValue : 'N/A';
    }
    
    // Handle address objects with nested structure (fallback)
    if (typeof value === 'object' && (value.block || value.street || value.building || value.postal)) {
      // For registered address, return only postal code
      if (fieldName === 'regadd' && value.postal) {
        const postalValue = this.renderValue(value.postal);
        return postalValue !== 'N/A' ? postalValue : 'N/A';
      }
      
      // For other address fields, return full address
      const components = [];
      
      if (value.block) {
        const blockValue = this.renderValue(value.block);
        if (blockValue && blockValue !== 'N/A') components.push(`Block ${blockValue}`);
      }
      
      if (value.building) {
        const buildingValue = this.renderValue(value.building);
        if (buildingValue && buildingValue !== 'N/A') components.push(buildingValue);
      }
      
      if (value.street) {
        const streetValue = this.renderValue(value.street);
        if (streetValue && streetValue !== 'N/A') components.push(streetValue);
      }
      
      if (value.postal) {
        const postalValue = this.renderValue(value.postal);
        if (postalValue && postalValue !== 'N/A') components.push(`Singapore ${postalValue}`);
      }
      
      return components.length > 0 ? components.join(', ') : 'N/A';
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => this.renderValue(item, fieldName)).join(', ');
    }
    
    // Handle other objects by attempting to extract meaningful data
    if (typeof value === 'object') {
      // Try to find a meaningful display value
      if (value.name) return this.renderValue(value.name, fieldName);
      if (value.title) return this.renderValue(value.title, fieldName);
      if (value.text) return this.renderValue(value.text, fieldName);
      if (value.description) return this.renderValue(value.description, fieldName);
      
      // For debugging: log unhandled object structures
      console.log('Unhandled object structure:', value);
      
      // Last resort: convert to readable JSON
      try {
        const entries = Object.entries(value);
        if (entries.length <= 3) {
          // For small objects, show key-value pairs
          return entries
            .map(([k, v]) => `${k}: ${this.renderValue(v, fieldName)}`)
            .join(', ');
        } else {
          // For large objects, just indicate it's complex data
          return 'Complex data structure';
        }
      } catch (e) {
        return 'Invalid data format';
      }
    }
    
    return String(value);
  };

  // Helper function to format date of birth to dd/mm/yyyy
  formatDateOfBirth = (dateString) => {
    try {
      // Handle various date formats
      let date;
      
      // If it's already in dd/mm/yyyy format, return as is
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateString;
      }
      
      // If it's in yyyy-mm-dd format (ISO format)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // Try parsing as a date object
      date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      
      // If all else fails, return the original string
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Helper function to format residential status with bilingual display
  formatResidentialStatus = (code, description) => {
    const statusMap = {
      'SC': 'SC 新加坡公民',
      'PR': 'PR 永久居民',
      'P': 'PR 永久居民'   // Alternative code for PR
    };
    
    // Return mapped value if available, otherwise fallback to code + description
    return statusMap[code] || `${code} ${description}`;
  };

  // Helper function to format race with bilingual display
  formatRace = (code, description) => {
    const raceMap = {
      'CN': 'Chinese 华',
      'IN': 'Indian 印',
      'ML': 'Malay 马',
      'OT': 'Others 其他'
    };
    
    // Return mapped value if available, otherwise fallback to code + description
    return raceMap[code] || `${code} ${description}`;
  };

  // Helper function to format gender with bilingual display
  formatGender = (code, description) => {
    const genderMap = {
      'M': 'M 男',
      'F': 'F 女'
    };
    
    // Return mapped value if available, otherwise fallback to code + description
    return genderMap[code] || `${code} ${description}`;
  };

  // Helper function to handle navigation
  handleNavigation = (path) => {
    window.location.href = path;
  };

  render() {
    const { loading, success, error, errorMessage, data } = this.state;
    
    // Base container styles
    const containerStyle = {
      maxWidth: '600px',
      margin: '50px auto',
      padding: '30px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      lineHeight: '1.6'
    };

    const buttonStyle = {
      backgroundColor: '#4CAF50',
      color: 'white',
      padding: '12px 24px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
      marginTop: '20px',
      transition: 'all 0.3s ease',
      minWidth: '120px'
    };

    const dataItemStyle = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '12px 0',
      borderBottom: '1px solid #e0e0e0'
    };

    const labelStyle = {
      color: '#333',
      fontWeight: '600',
      minWidth: '150px',
      fontSize: '14px'
    };

    const valueStyle = {
      color: '#666',
      textAlign: 'right',
      flex: 1,
      marginLeft: '15px',
      fontSize: '14px',
      wordBreak: 'break-word'
    };
    
    if (loading) {
      return (
        <div style={{
          ...containerStyle,
          borderLeft: '5px solid #2196F3',
          backgroundColor: '#f8f9ff',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #2196F3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>Processing Authentication...</h2>
          <p style={{ color: '#666' }}>Please wait while we verify your SingPass credentials.</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div style={{
          ...containerStyle,
          borderLeft: '5px solid #f44336',
          backgroundColor: '#fff5f5'
        }}>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>Authentication Failed</h2>
          <p style={{ color: '#666' }}>There was an error during the authentication process.</p>
          {errorMessage && (
            <div style={{
              backgroundColor: '#ffebee',
              border: '1px solid #ffcdd2',
              borderRadius: '4px',
              padding: '12px',
              margin: '15px 0',
              color: '#c62828'
            }}>
              {errorMessage}
            </div>
          )}
          <button 
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#45a049';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#4CAF50';
              e.target.style.transform = 'translateY(0)';
            }}
            onClick={() => this.handleNavigation("/singPass")}
          >
            Try Again
          </button>
        </div>
      );
    }
    
    if (success && data) {
      // Extract clean UUID if needed
      const cleanUUID = typeof data.uuid === 'string' && data.uuid.startsWith('u=')
        ? data.uuid.substring(2)
        : data.uuid;
        
      return (
        <div style={{
          ...containerStyle,
          borderLeft: '5px solid #4CAF50',
          backgroundColor: '#f8fff8'
        }}>
          <h2 style={{ color: '#333', marginBottom: '10px' }}>Authentication Successful!</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>You have successfully logged in with SingPass.</p>
          
          <div style={{
            margin: '20px 0',
            padding: '25px',
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ 
              color: '#333', 
              marginBottom: '20px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              User Information
            </h3>
            
            {/* Display UUID */}
            <div style={dataItemStyle}>
              <strong style={labelStyle}>UUID:</strong>
              <span style={{ 
                ...valueStyle,
                fontFamily: 'monospace',
                fontSize: '13px'
              }}>
                {cleanUUID}
              </span>
            </div>
            
            {/* Display UINFIN if available */}
            {data.uinfin && (
              <div style={dataItemStyle}>
                <strong style={labelStyle}>NRIC/FIN:</strong>
                <span style={valueStyle}>
                  {this.renderValue(data.uinfin)}
                </span>
              </div>
            )}
            
            {/* Display extracted user data */}
            {data.userData && (
              <div style={{ marginTop: '25px' }}>
                <h4 style={{
                  marginBottom: '15px',
                  color: '#333',
                  borderBottom: '2px solid #4CAF50',
                  paddingBottom: '8px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  Profile Details
                </h4>
                {Object.entries(data.userData)
                  .filter(([key, value]) => {
                    // Filter out empty values and duplicate sub
                    if (key === 'sub') return false;
                    // Show email field even if empty (will display "N/A")
                    if (key === 'email') return true;
                    return value;
                  })
                  .map(([key, value], index, array) => (
                    <div 
                      key={key} 
                      style={{
                        ...dataItemStyle,
                        borderBottom: index === array.length - 1 ? 'none' : '1px solid #e0e0e0'
                      }}
                    >
                      <strong style={labelStyle}>
                        {this.formatFieldName(key)}:
                      </strong>
                      <span style={valueStyle}>
                        {key === 'email' && (!value || value === '') 
                          ? 'N/A' 
                          : this.renderValue(value, key)
                        }
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
          
          <button 
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#45a049';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#4CAF50';
              e.target.style.transform = 'translateY(0)';
            }}
            onClick={() => this.handleNavigation("/singPass")}
          >
            Continue
          </button>
        </div>
      );
    }
    
    return (
      <div style={containerStyle}>
        <h2 style={{ color: '#333', marginBottom: '10px' }}>Processing...</h2>
        <p style={{ color: '#666' }}>Redirecting...</p>
      </div>
    );
  }
}

export default MyInfoRedirectPage;