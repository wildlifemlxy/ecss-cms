import React, { Component } from "react";
import axios from 'axios';  

class SingpassPage extends Component {
  generateCodeVerifier = () => {
    // Generate code verifier exactly as per RFC 7636 PKCE specification
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const randomValues = new Uint8Array(128); // 128 bytes for 43-128 character range
    window.crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < 128; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    
    return result.substring(0, 128); // Ensure exactly 128 characters
  };

  generateCodeChallenge = async (codeVerifier) => {
    // SHA256 hash and base64url encode exactly as per RFC 7636
    const hash = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  // Enhanced Unicode URL handling for mixed encoding scenarios
  decodeUrlSafely = (encodedUrl) => {
    if (!encodedUrl) return null;
    
    try {
      console.log('Original URL parameter:', encodedUrl);
      
      // Handle mixed encoding scenarios common with Chinese URLs
      let decoded = encodedUrl;
      let previousDecoded = '';
      let attempts = 0;
      const maxAttempts = 5; // Increased for complex encoding scenarios
      
      // Keep decoding until no more changes occur or max attempts reached
      while (decoded !== previousDecoded && attempts < maxAttempts) {
        previousDecoded = decoded;
        try {
          // Check if the string contains URL encoding patterns
          if (decoded.includes('%')) {
            const testDecoded = decodeURIComponent(decoded);
            console.log(`Attempting decode: ${decoded}`);
            // Only use the decoded version if it's different and doesn't break
            if (testDecoded !== decoded && !testDecoded.includes('%')) {
              decoded = testDecoded;
              console.log(`Decode attempt ${attempts + 1}: ${decoded}`);
            } else if (testDecoded !== decoded) {
              // Still encoded, continue
              decoded = testDecoded;
              console.log(`Decode attempt ${attempts + 1}: ${decoded}`);
            } else {
              // No change, stop decoding
              break;
            }
          } else {
            // No percent encoding found, stop
            break;
          }
          attempts++;
        } catch (innerError) {
          // If decoding fails, stop and use the last successful decode
          console.warn(`Decode attempt ${attempts + 1} failed, using previous result:`, innerError);
          break;
        }
      }
      
      console.log('Final decoded URL:', decoded);
      
      // Additional validation for mixed encoding issues
      if (decoded.includes('ecss.org.sg') || decoded.startsWith('http')) {
        // Check if we have Chinese characters properly displayed
        if (/[\u4e00-\u9fff]/.test(decoded)) {
          console.log('Successfully decoded URL with Chinese characters:', decoded);
          // Extract Chinese characters for validation
          const chineseMatch = decoded.match(/[\u4e00-\u9fff]+/g);
          if (chineseMatch) {
            console.log('Chinese characters found:', chineseMatch.join(''));
          }
        }
        return decoded;
      } else {
        console.warn('Decoded URL does not look valid, using original:', encodedUrl);
        return encodedUrl;
      }
      
    } catch (error) {
      console.warn('Failed to decode URL, using as-is:', error);
      return encodedUrl;
    }
  };

  handleLogin = async () => {
    try {
      // Capture the link parameter from current URL with enhanced Unicode handling
      const urlParams = new URLSearchParams(window.location.search);
      let redirectLink = urlParams.get('link');
      
      console.log('Raw URL parameter from URLSearchParams:', redirectLink);
      console.log('Current environment:', window.location.hostname === "localhost" ? "development" : "production");
      
      // Enhanced handling for mixed encoding scenarios
      if (redirectLink) {
        var decodedLink = this.decodeUrlSafely(redirectLink);
        redirectLink = window.location.hostname === "localhost"
                                                    ? `http://localhost:3000/form}`
                                                    : `https://salmon-wave-09f02b100.6.azurestaticapps.net/form}`;
        console.log('Processed redirect link with mixed encoding support:', redirectLink);
        
        // Additional Azure SWA environment logging
        console.log('Azure SWA Environment Details:', {
          hostname: window.location.hostname,
          isLocalhost: window.location.hostname === "localhost",
          isAzureSWA: window.location.hostname.includes('azurestaticapps.net'),
          originalLink: urlParams.get('link'),
          decodedLink: redirectLink
        });
      }
      
      // Store the redirect link for use after authentication
      if (redirectLink) {
        // Store the properly decoded link with UTF-8 support for Azure SWA
        sessionStorage.setItem('course_link', decodedLink);
        console.log('Stored redirect link in sessionStorage (Azure SWA UTF-8 safe)');
        
        // Store Azure SWA environment metadata
        const azureMetadata = {
          environment: window.location.hostname === "localhost" ? "development" : "production",
          hostname: window.location.hostname,
          originalParam: urlParams.get('link'),
          processedLink: redirectLink,
          timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('azure_swa_environment_info', JSON.stringify(azureMetadata));
      }

      // Generate PKCE parameters exactly as per SingPass specification
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      
      // Generate state and nonce as per SingPass requirements
      const state = window.crypto.randomUUID();
      const nonce = window.crypto.randomUUID();

      // SingPass Authorization Endpoint - exact URL from documentation
      const authorizationEndpoint = "https://stg-id.singpass.gov.sg/auth";
      
      // Required parameters with EXACT SingPass scopes as approved
      const authParams = new URLSearchParams({
        client_id: "mHlUcRS43LOQAjkYJ22MNvSpE8vzPmfo",
        response_type: "code",
        // EXACT SingPass scope format - space-separated as approved by SingPass
        scope: "openid dob email mobileno name nationality race regadd residentialstatus sex uinfin",
        redirect_uri: window.location.hostname === "localhost" 
          ? "http://localhost:3000/callback" 
          : "https://salmon-wave-09f02b100.6.azurestaticapps.net/callback",
        state: state,
        nonce: nonce,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        response_mode: "query",
        prompt: "login",
        acr_values: "2"
      });

      // Store PKCE parameters for token exchange
      sessionStorage.setItem('singpass_state', state);
      sessionStorage.setItem('singpass_nonce', nonce);
      sessionStorage.setItem('singpass_code_verifier', codeVerifier);
      
      // Build authorization URL exactly as per specification
      const authorizationUrl = `${authorizationEndpoint}?${authParams.toString()}`;
      
      console.log('SingPass Authorization URL with exact approved scopes:', authorizationUrl);
      console.log('Azure SWA redirect URI:', authParams.get('redirect_uri'));
      console.log('Stored redirect link for post-auth (Azure SWA safe):', redirectLink);
      
      // Set redirecting state
      this.setState({ redirecting: true });
      
      // Enable redirect for Azure SWA production - uncomment when ready
      window.location.href = authorizationUrl;
      
    } catch (error) {
      console.error('SingPass authentication error:', error);
      this.setState({ 
        error: 'Failed to initiate SingPass authentication. Please try again.',
        redirecting: false 
      });
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      redirecting: false,
      error: null,
      redirectLink: null
    };
  }

  componentDidMount() {
    // Check if there's a link parameter in the URL with enhanced Unicode handling
    const urlParams = new URLSearchParams(window.location.search);
    let redirectLink = urlParams.get('link');
    
    console.log('ComponentDidMount - Raw URL parameter:', redirectLink);
    
    if (redirectLink) {
      redirectLink = this.decodeUrlSafely(redirectLink);
      console.log('ComponentDidMount - Processed Unicode redirect link:', redirectLink);
      
      // Show the properly decoded link in the UI
      this.setState({ redirectLink: redirectLink });
      
      // Special handling for ECSS Chinese product URLs
      if (redirectLink.includes('ecss.org.sg') && redirectLink.includes('product')) {
        console.log('ECSS product page detected with Chinese characters');
        // Validate the Chinese characters are displaying correctly
        if (/[\u4e00-\u9fff]/.test(redirectLink)) {
          console.log('Chinese characters confirmed in URL');
        }
      }
    }
  }

  // Enhanced helper function to extract and display Chinese product name nicely
  formatDisplayUrl = (url) => {
    if (!url) return '';
    
    try {
      // For ECSS product URLs, try to extract a readable product name
      if (url.includes('ecss.org.sg/product/')) {
        const productPath = url.split('/product/')[1];
        if (productPath) {
          console.log('Formatting product path:', productPath);
          
          // Look for Chinese characters first
          const chineseMatch = productPath.match(/[\u4e00-\u9fff]+/g);
          if (chineseMatch && chineseMatch.length > 0) {
            const chineseText = chineseMatch.join('');
            console.log('Found Chinese text for display:', chineseText);
            return `ECSS: ${chineseText}...`;
          }
          
          // Fallback: split by hyphens and take first meaningful part
          const parts = productPath.split('-');
          const meaningfulPart = parts.find(part => part.length > 5 && !part.includes('%'));
          if (meaningfulPart) {
            return `ECSS: ${meaningfulPart}...`;
          }
        }
      }
      
      // Fallback: truncate long URLs
      return url.length > 60 ? url.substring(0, 60) + '...' : url;
    } catch (error) {
      console.error('Error formatting display URL:', error);
      return url.length > 60 ? url.substring(0, 60) + '...' : url;
    }
  };

  render() {
    const { redirecting, error, redirectLink } = this.state;
    
    return (
      <div style={{
        maxWidth: '400px',
        margin: '50px auto',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        textAlign: 'center',
        backgroundColor: 'white'
      }}>
        {/* Enhanced font support for Chinese characters */}
        <style>
          {`
            @font-face {
              font-family: 'Poppins';
              src: url('/Noto_Sans,Poppins/Poppins/Poppins-Bold.ttf') format('truetype');
              font-weight: bold;
              font-style: normal;
              font-display: swap;
              unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
            }
            @font-face {
              font-family: 'Poppins';
              src: url('/Noto_Sans,Poppins/Poppins/Poppins-Regular.ttf') format('truetype');
              font-weight: normal;
              font-style: normal;
              font-display: swap;
              unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
            }
            /* Enhanced support for Chinese characters - CJK Unified Ideographs */
            @font-face {
              font-family: 'Noto Sans CJK';
              src: url('/Noto_Sans,Poppins/Noto_Sans/NotoSansCJK-Regular.ttf') format('truetype');
              font-weight: normal;
              font-style: normal;
              font-display: swap;
              unicode-range: U+4E00-9FFF, U+3400-4DBF, U+20000-2A6DF, U+2A700-2B73F, U+2B740-2B81F, U+2B820-2CEAF, U+2CEB0-2EBEF, U+30000-3134F;
            }
            @font-face {
              font-family: 'Noto Sans CJK';
              src: url('/Noto_Sans,Poppins/Noto_Sans/NotoSansCJK-Bold.ttf') format('truetype');
              font-weight: bold;
              font-style: normal;
              font-display: swap;
              unicode-range: U+4E00-9FFF, U+3400-4DBF, U+20000-2A6DF, U+2A700-2B73F, U+2B740-2B81F, U+2B820-2CEAF, U+2CEB0-2EBEF, U+30000-3134F;
            }
          `}
        </style>

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '4px',
            padding: '12px',
            margin: '0 0 20px 0',
            color: '#c62828',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Enhanced display for Chinese URLs with better formatting */}
        {redirectLink && (
          <div style={{
            backgroundColor: '#e3f2fd',
            border: '1px solid #bbdefb',
            borderRadius: '4px',
            padding: '12px',
            margin: '0 0 20px 0',
            color: '#1565c0',
            fontSize: '14px'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
              Authentication Required
            </p>
            <p style={{ 
              margin: '0 0 8px 0', 
              fontSize: '12px',
              fontFamily: '"Noto Sans CJK", "Poppins", sans-serif', // Chinese character support first
              wordBreak: 'break-word', // Handle long URLs with Chinese characters
              lineHeight: '1.4',
              textAlign: 'left', // Better for mixed Chinese/English text
              padding: '4px 8px',
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderRadius: '3px',
              border: '1px solid rgba(25, 101, 192, 0.2)'
            }}>
              <strong>Destination:</strong><br />
              {this.formatDisplayUrl(redirectLink)}
            </p>
            <p style={{ margin: 0, fontSize: '12px' }}>
              You will be redirected after successful login
            </p>
          </div>
        )}
        
        <div>
          <h2 style={{ 
            color: '#333', 
            marginBottom: '30px',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: '600'
          }}>
            SingPass Authentication
          </h2>
          
          {/* Official SingPass Button - Red Fill following exact guidelines */}
          <button 
            onClick={this.handleLogin}
            disabled={redirecting}
            aria-label="Log in with Sing Pass authentication"
            aria-describedby="singpass-description"
            style={{
              backgroundColor: redirecting ? '#cccccc' : '#F4333D',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              cursor: redirecting ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 'bold',
              minWidth: '280px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0 24px',
              margin: '0 auto',
              transition: 'background-color 0.2s ease',
              letterSpacing: '0.025em',
              textRendering: 'optimizeLegibility'
            }}
            onMouseEnter={(e) => {
              if (!redirecting) {
                e.target.style.backgroundColor = '#B0262D';
              }
            }}
            onMouseLeave={(e) => {
              if (!redirecting) {
                e.target.style.backgroundColor = '#F4333D';
              }
            }}
          >
            {/* Text first, then logo */}
            <span aria-hidden="true" style={{
              fontFamily: 'Poppins, bold, sans-serif',
              fontSize: '16px',
              fontWeight: 'bold',
              lineHeight: '1'
            }}>
              {redirecting ? 'Redirecting...' : 'Log in with'}
            </span>
            {!redirecting && (
              <img 
                src="/Singpass logo/singpass_logo_white.svg" 
                alt="Sing Pass" 
                aria-label="Sing Pass"
                role="img"
                style={{ 
                  fontSize: '1ex',
                  height: '1ex',
                  width: 'auto',
                  minHeight: '14px',
                  filter: 'brightness(0) invert(1)',
                  verticalAlign: 'baseline',
                  display: 'inline-block',
                }}
                onError={(e) => {
                  e.target.src = "/Singpass logo/singpass_logo_white.png";
                  e.target.onerror = null;
                }}
              />
            )}
          </button>
          
          <p 
            id="singpass-description"
            style={{ 
              marginTop: '20px', 
              fontSize: '12px', 
              color: '#888',
              lineHeight: '1.4',
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            Secure authentication using your SingPass Digital ID
          </p>
        </div>
      </div>
    );
  }
}

export default SingpassPage;