import React, { Component } from "react";

class SingPassButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redirecting: false,
      error: null
    };
  }

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
      // Set redirecting state
      this.setState({ redirecting: true, error: null });

      // Call optional pre-login callback
      if (this.props.onLoginStart) {
        await this.props.onLoginStart();
      }

      // Capture the link parameter from current URL or props
      const urlParams = new URLSearchParams(window.location.search);
      let redirectLink = this.props.redirectLink || urlParams.get('link');
      
      console.log('Raw URL parameter from URLSearchParams:', redirectLink);
      console.log('Current environment:', window.location.hostname === "localhost" ? "development" : "production");
      
      // Enhanced handling for mixed encoding scenarios
      if (redirectLink) {
        const decodedLink = this.decodeUrlSafely(redirectLink);
        
        // Store the properly decoded link with UTF-8 support for Azure SWA
        sessionStorage.setItem('course_link', decodedLink);
        console.log('Stored redirect link in sessionStorage (Azure SWA UTF-8 safe)');
        
        // Store Azure SWA environment metadata
        const azureMetadata = {
          environment: window.location.hostname === "localhost" ? "development" : "production",
          hostname: window.location.hostname,
          originalParam: urlParams.get('link'),
          processedLink: decodedLink,
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
      
      // Call optional pre-redirect callback
      if (this.props.onBeforeRedirect) {
        await this.props.onBeforeRedirect(authorizationUrl);
      }

      // Redirect to SingPass
      window.location.href = authorizationUrl;
      
    } catch (error) {
      console.error('SingPass authentication error:', error);
      this.setState({ 
        error: error.message || 'Failed to initiate SingPass authentication. Please try again.',
        redirecting: false 
      });

      // Call optional error callback
      if (this.props.onError) {
        this.props.onError(error);
      }
    }
  };

  render() {
    const { redirecting, error } = this.state;
    const { 
      buttonText = 'Log in with',
      disabled = false,
      className = '',
      style = {},
      showLogo = true,
      size = 'default' // 'small', 'default', 'large'
    } = this.props;

    // Size configurations
    const sizeConfig = {
      small: {
        minWidth: '200px',
        height: '36px',
        fontSize: '14px',
        padding: '0 16px'
      },
      default: {
        minWidth: '280px',
        height: '48px',
        fontSize: '16px',
        padding: '0 24px'
      },
      large: {
        minWidth: '320px',
        height: '56px',
        fontSize: '18px',
        padding: '0 32px'
      }
    };

    const currentSize = sizeConfig[size] || sizeConfig.default;
    const isDisabled = disabled || redirecting;

    return (
      <>
        {/* Font definitions for SingPass branding */}
        <style>
          {`
            @font-face {
              font-family: 'Poppins';
              src: url('/Noto_Sans,Poppins/Poppins/Poppins-Bold.ttf') format('truetype');
              font-weight: bold;
              font-style: normal;
              font-display: swap;
            }
            @font-face {
              font-family: 'Poppins';
              src: url('/Noto_Sans,Poppins/Poppins/Poppins-Regular.ttf') format('truetype');
              font-weight: normal;
              font-style: normal;
              font-display: swap;
            }
          `}
        </style>

        {/* Error display */}
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '4px',
            padding: '12px',
            margin: '0 0 16px 0',
            color: '#c62828',
            fontSize: '14px',
            fontFamily: 'Poppins, sans-serif'
          }}>
            {error}
          </div>
        )}

        {/* Official SingPass Button - Red Fill following exact guidelines */}
        <button 
          onClick={this.handleLogin}
          disabled={isDisabled}
          className={className}
          aria-label="Log in with Sing Pass authentication"
          style={{
            backgroundColor: isDisabled ? '#cccccc' : '#F4333D',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            fontSize: currentSize.fontSize,
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 'bold',
            minWidth: currentSize.minWidth,
            height: currentSize.height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: currentSize.padding,
            margin: '0 auto',
            transition: 'background-color 0.2s ease',
            letterSpacing: '0.025em',
            textRendering: 'optimizeLegibility',
            ...style
          }}
          onMouseEnter={(e) => {
            if (!isDisabled) {
              e.target.style.backgroundColor = '#B0262D';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDisabled) {
              e.target.style.backgroundColor = '#F4333D';
            }
          }}
        >
          {/* Button text */}
          <span aria-hidden="true" style={{
            fontFamily: 'Poppins, bold, sans-serif',
            fontSize: currentSize.fontSize,
            fontWeight: 'bold',
            lineHeight: '1'
          }}>
            {redirecting ? 'Redirecting...' : buttonText}
          </span>

          {/* SingPass logo */}
          {!redirecting && showLogo && (
            <img 
              src="/Singpass logo/singpass_logo_white.svg" 
              alt="Sing Pass" 
              aria-label="Sing Pass"
              role="img"
              style={{ 
                fontSize: '1ex',
                height: '1ex',
                width: 'auto',
                minHeight: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
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
      </>
    );
  }
}

export default SingPassButton;