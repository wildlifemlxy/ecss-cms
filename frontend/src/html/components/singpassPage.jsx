import React, { Component } from "react";

class SingpassPage extends Component {
  generateCodeVerifier = () => {
    const array = new Uint32Array(56); // Generate a 56-byte random string
    window.crypto.getRandomValues(array);
    return Array.from(array, (dec) => dec.toString(36)).join('');
  };

  generateCodeChallenge = (codeVerifier) => {
    return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
      .then((hash) => {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(hash)))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      });
  };

  handleLogin = async () => {
    const authurl = "https://stg-id.singpass.gov.sg/auth?";
    const scope = "openid";
    const response_type = "code";
    const client_id = "mHlUcRS43LOQAjkYJ22MNvSpE8vzPmfo";
    const redirect_uri = "http://localhost:3000/myinfo-redirect"; // New redirect page

    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const codeChallengeMethod = "S256"; // PKCE method

    const nonce = crypto.randomUUID();
    const state = crypto.randomUUID();

    // Save the state and code_verifier in sessionStorage
    sessionStorage.setItem('state', state);
    sessionStorage.setItem('code_verifier', codeVerifier);

    const url =
      authurl +
      "scope=" + scope +
      "&state=" + state +
      "&response_type=" + response_type +
      "&redirect_uri=" + redirect_uri +
      "&client_id=" + client_id +
      "&nonce=" + nonce +
      "&code_challenge=" + codeChallenge +
      "&code_challenge_method=" + codeChallengeMethod;

    window.location.href = url;
  };

  render() {
    return (
      <div>
        <button onClick={this.handleLogin}>Login with Singpass</button>
      </div>
    );
  }
}

export default SingpassPage;
