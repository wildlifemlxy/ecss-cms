import React, { Component } from "react";

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
    console.log('Code verifier generated123:', codeVerifier);
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const codeChallengeMethod = "S256"; // PKCE method

    const authurl = "https://stg-id.singpass.gov.sg/auth?";
    //const scope = "openid uinfin name dob sex nationality race residentialstatus email mobileno regadd"; // Available scopes for user data
    const scope = "openid name uinfin residentialstatus race sex dob nationality mobileno email regadd"; // Available scopes for user data
    const response_type = "code";
    const client_id = "mHlUcRS43LOQAjkYJ22MNvSpE8vzPmfo";
    const redirect_uri = await axios.post(
        `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/singpass`,
    );

    // Generate state and nonce
    const nonce = window.crypto.randomUUID();
    const state = window.crypto.randomUUID();

    // Save the state and code_verifier in sessionStorage
    sessionStorage.setItem('state', state);
    console.log('Code verifier stored:', codeVerifier);
    sessionStorage.setItem('code_verifier', codeVerifier);
    
    console.log('State stored:', state);

    const url =
      authurl +
      "scope=" + scope + // URL encoding handles spaces between scopes
      "&state=" + state +
      "&response_type=" + response_type +
      "&redirect_uri=" + redirect_uri +
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
    
    // Delay redirect by 15 seconds
    setTimeout(() => {
      clearInterval(this.countdownInterval);
      window.location.href = url;
    }, 15);
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
      <div>
        {redirecting ? (
          <div className="redirect-container">
            <p>Redirecting to SingPass in {countdown} seconds...</p>
            <button onClick={() => window.location.href = url}>
              Redirect now
            </button>
          </div>
        ) : (
          <button type="submit" onClick={this.handleLogin}>
            Login with Singpass
          </button>
        )}
      </div>
    );
  }
}

export default SingpassPage;
