// src/html/components/ErrorPage.js
import React, { Component } from 'react';
import '../../css/errorPage.css'; // Ensure you have styles for the error page

class ErrorPage extends Component 
{
  componentDidMount = async() =>
  {
    console.log("ok");
    setTimeout(() => {
      this.props.history.push({ pathname: '/'});
    }, 10*1000);
  }

  render() {
    return (
      <div className="errorpage-container">
        <div className="errorpage-content">
          <h1 className="errorpage-title">404 - Page Not Found</h1>
          <p className="errorpage-message">
            Sorry, the page you are looking for does not exist.
          </p>
          We will redirect you back to the login page. 
        </div>
      </div>
    );
  }
}

export default ErrorPage;
