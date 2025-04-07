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
    const tokenUrl = "https://stg-id.singpass.gov.sg/token";
    const clientId = "mHlUcRS43LOQAjkYJ22MNvSpE8vzPmfo";
    const redirectUri = "http://localhost:3000/myinfo-redirect"; // Same redirect URI as before

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", authCode);
    params.append("redirect_uri", redirectUri);
    params.append("client_id", clientId);
    params.append("code_verifier", codeVerifier);

    try {
      const response = await axios.post(tokenUrl, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      console.log("Token Response:", response.data);
      // Handle the access token and store it in localStorage or session
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
