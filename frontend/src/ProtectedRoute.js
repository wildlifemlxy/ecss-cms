// src/components/ProtectedRoute.js
import React, { Component } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { AuthContext } from './AuthContext'; // Ensure this path is correct

class ProtectedRoute extends Component {
  static contextType = AuthContext; // Set the context type to AuthContext

  render() {
    const { component: Component, ...rest } = this.props; // Destructure props
    const { isAuthenticated } = this.context; // Access isAuthenticated from the context

    return (
      <Route
        {...rest}
        render={props =>
          isAuthenticated ? (
            <Component {...props} />
          ) : (
            <Redirect to="/" /> // Redirect to the login page if not authenticated
          )
        }
      />
    );
  }
}

export default ProtectedRoute;
