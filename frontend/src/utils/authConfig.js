import { LogLevel } from '@azure/msal-browser';

// MSAL configuration using your Azure AD app
export const msalConfig = {
  auth: {
    clientId: '71ce9441-9704-42fa-b12a-eec3fcc850ad', // Your Azure AD Client ID
    authority: 'https://login.microsoftonline.com/1885cbed-e741-4fed-a830-831e834c9022', // Your tenant ID
    redirectUri: window.location.origin, // Current app URL
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error('[MSAL]', message);
            break;
          case LogLevel.Info:
            console.info('[MSAL]', message);
            break;
          case LogLevel.Verbose:
            console.debug('[MSAL]', message);
            break;
          case LogLevel.Warning:
            console.warn('[MSAL]', message);
            break;
        }
      }
    }
  }
};

// Login request configuration
export const loginRequest = {
  scopes: ['User.Read'],
  prompt: 'select_account'
};

// Microsoft Graph scopes for Excel Online
export const graphScopes = {
  scopes: [
    'Files.ReadWrite',
    'Files.ReadWrite.All',
    'Sites.ReadWrite.All',
    'User.Read'
  ]
};

// Graph API endpoints
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
  graphFilesEndpoint: 'https://graph.microsoft.com/v1.0/me/drive/root/children'
};