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
    }
  }

  handleSendToBackend = async (code, code_verifier) => {
    console.log("Sending code to backend:", code);
    console.log("Using code_verifier:", code_verifier);
    
  
      const response = await axios.post(
        "http://localhost:3001/singpass",
        {
          code,
          code_verifier
        }
      );
      console.log("Backend response:", response.data.data);
      // Handle successful authentication (e.g., save user data, redirect)
      this.setState({ success: true, data: response.data.data });
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

  render() {
    const { loading, success, error, errorMessage, data } = this.state;
    const params = new URLSearchParams(window.location.search);
    
    // First check for success, since that overrides any error state
    if (success) {
      // Extract clean UUID if needed
      const cleanUUID = typeof data === 'string' && data.startsWith('u=')
        ? data.substring(2)
        : data;
        
      return (
        <div className="auth-container success">
          <h2>Authentication Successful!</h2>
          <p>You have successfully logged in with SingPass.</p>
          <div className="user-data">
            <p><strong>UUID:</strong> {cleanUUID}</p>
          </div>
          <button onClick={() => window.location.href = "/singPass"}>Continue</button>
        </div>
      );
    }
  }
}

export default MyInfoRedirectPage;