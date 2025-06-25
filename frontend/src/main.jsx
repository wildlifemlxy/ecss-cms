// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import App from './App'
import './index.css'

// SingPass OIDC Configuration following exact SingPass specifications
const oidcConfig = {
  //authority: "https://stg-id.singpass.gov.sg", // Staging discovery endpoint
  authority: "https://id.singpass.gov.sg",
  client_id: "ZrjDybXZeOFUA70KYMwb1dnfmdEXFfAS",
  redirect_uri: window.location.hostname === "localhost" 
      ? "http://localhost:3000/callback" 
      : "https://salmon-wave-09f02b100.6.azurestaticapps.net/callback",
  response_type: "code",
  scope: "openid", // Start with minimal scope as per SingPass best practices
  automaticSilentRenew: false, // Required for SingPass
  loadUserInfo: false, // SingPass doesn't provide userinfo endpoint
  // SingPass specific settings
  response_mode: "query",
  prompt: "login",
  // Additional SingPass required parameters
  acr_values: "2", // Authentication Context Class Reference
  nonce: true, // Enable nonce for security
  state: true, // Enable state parameter
  // Disable features not supported by SingPass
  monitorSession: false,
  checkSessionInterval: 0,
  revokeAccessTokenOnSignout: false,
  includeIdTokenInSilentRenew: false
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider {...oidcConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
)