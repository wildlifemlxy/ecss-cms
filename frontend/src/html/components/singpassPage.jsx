import React, { Component } from "react";
import axios from 'axios';  

class SingpassPage extends Component {
  generateCodeVerifier = () => {
    // Generate a random string of the correct length and character set
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const randomValues = new Uint8Array(64); // Use 64 bytes for good length
    window.crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < 64; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    
    return result;
  };

  generateCodeChallenge = (codeVerifier) => {
    return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
      .then((hash) => {
        // Convert to base64url encoding (RFC 7636)
        return btoa(String.fromCharCode(...new Uint8Array(hash)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      });
  };

  handleLogin = async () => {
    // Generate PKCE parameters
    const codeVerifier = this.generateCodeVerifier();
    console.log('Code verifier generated:', codeVerifier);
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const codeChallengeMethod = "S256"; // PKCE method

    const authurl = "https://stg-id.singpass.gov.sg/auth?";
    const scope = "openid name uinfin residentialstatus race sex dob nationality mobileno email regadd"; // Available scopes for user data
    const response_type = "code";
    const client_id = "mHlUcRS43LOQAjkYJ22MNvSpE8vzPmfo";
    
    // Fix: redirect_uri should be a string, not an axios.post call
    const redirect_uri = window.location.hostname === "localhost" 
      ? "http://localhost:3000/myinfo-redirect" 
      : "https://salmon-wave-09f02b100.6.azurestaticapps.net/myinfo-redirect";

    // Generate state and nonce
    const nonce = window.crypto.randomUUID();
    const state = window.crypto.randomUUID();

    // Save the state and code_verifier in sessionStorage
    sessionStorage.setItem('state', state);
    console.log('Code verifier stored:', codeVerifier);
    sessionStorage.setItem('code_verifier', codeVerifier);
    
    console.log('State stored:', state);
    console.log('Redirect URI:', redirect_uri);

    const url =
      authurl +
      "scope=" + encodeURIComponent(scope) + // Fix: URL encode the scope parameter
      "&state=" + state +
      "&response_type=" + response_type +
      "&redirect_uri=" + encodeURIComponent(redirect_uri) + // Fix: URL encode the redirect_uri
      "&client_id=" + client_id +
      "&nonce=" + nonce +
      "&code_challenge=" + codeChallenge +
      "&code_challenge_method=" + codeChallengeMethod;

    console.log('Redirecting to:', url);
    
    // Set component state to show loading/countdown
    this.setState({ redirecting: true, countdown: 1 });
    
    // Start countdown
    this.countdownInterval = setInterval(() => {
      this.setState(prevState => ({
        countdown: prevState.countdown - 1
      }));
    }, 1000);
    
    // Fix: Delay redirect by 1 second (not 15 milliseconds)
    setTimeout(() => {
      clearInterval(this.countdownInterval);
      window.location.href = url;
    }, 1000);
  };

  constructor(props) {
    super(props);
    this.state = {
      redirecting: false,
      countdown: 0
    };
    this.countdownInterval = null;
  }

  componentWillUnmount() {
    // Clean up interval if component unmounts during countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  render() {
    const { redirecting, countdown } = this.state;
    
    return (
      <div style={{
        maxWidth: '400px',
        margin: '50px auto',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        textAlign: 'center'
      }}>
        {redirecting ? (
          <div>
            <h3 style={{ color: '#333', marginBottom: '20px' }}>Redirecting to SingPass...</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              You will be redirected in {countdown} second{countdown !== 1 ? 's' : ''}
            </p>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #2196F3',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          </div>
        ) : (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>SingPass Login</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              Click below to authenticate with your SingPass credentials
            </p>
            <button 
              type="submit" 
              onClick={this.handleLogin}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                minWidth: '200px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#45a049';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#4CAF50';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Login with SingPass
            </button>
          </div>
        )}
      </div>
    );
  }
}

export default SingpassPage;