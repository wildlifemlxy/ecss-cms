// src/AuthContext.js
import React, { createContext, Component } from 'react';

// Create AuthContext
const AuthContext = createContext();

// Provider component
class AuthProvider extends Component {
  constructor(props) {
    super(props);
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'; // Read from local storage

    this.state = {
      isAuthenticated,
    };
  }

  login = () => {
    this.setState({ isAuthenticated: true }, () => {
      localStorage.setItem('isAuthenticated', 'true'); // Store in local storage
    });
  };

  logout = () => {
    this.setState({ isAuthenticated: false }, () => {
      localStorage.removeItem('isAuthenticated'); // Remove from local storage
    });
  };

  render() {
    const { children } = this.props;
    const { isAuthenticated } = this.state;

    return (
      <AuthContext.Provider value={{ isAuthenticated, login: this.login, logout: this.logout }}>
        {children}
      </AuthContext.Provider>
    );
  }
}

// Higher-order component to use the AuthContext
const withAuth = (WrappedComponent) => {
  return function WithAuth(props) {
    return (
      <AuthContext.Consumer>
        {context => <WrappedComponent {...props} auth={context} />}
      </AuthContext.Consumer>
    );
  };
};

// Export AuthProvider, AuthContext, and withAuth
export { AuthProvider, AuthContext, withAuth };
