import React, { Component } from 'react';

class MyInfoResultsPage extends Component {
  render() {
    const { name, openid } = this.props.location.state || {}; // Get the passed data from location.state

    return (
      <div>
        <h1>My Info Results</h1>
        {name && <p>Name: {name}</p>}
        {openid && <p>OpenID: {openid}</p>}
      </div>
    );
  }
}

export default MyInfoResultsPage;
