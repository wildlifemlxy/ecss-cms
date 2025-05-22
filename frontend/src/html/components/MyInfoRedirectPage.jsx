import React, { Component } from "react";
import axios from "axios";

class MyInfoRedirect extends Component {
  componentDidMount() {
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get('code');
    const state = params.get('state');

    if (authCode && state) {
      const savedState = sessionStorage.getItem('state');
      if (savedState !== state) {
        console.error('State mismatch!');
        return;
      }

      this.exchangeCodeForToken(authCode);
    }
  }

  exchangeCodeForToken = async (authCode) => {
    const codeVerifier = sessionStorage.getItem('code_verifier');
    const redirectUri = "http://localhost:3000/myinfo-redirect"; // Same redirect URI as before

    try {
      const response = await axios.post('http://localhost:3001/singpass', {
        code: authCode,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
      });
      console.log("Token Response:", response.data);
      const accessToken = response.data.access_token;
      sessionStorage.setItem("access_token", accessToken);
    } catch (error) {
      console.error("Error exchanging code for token:", error);
    }
  };

  render() {
    return <div>Redirecting...</div>;
  }
}

export default MyInfoRedirect;
