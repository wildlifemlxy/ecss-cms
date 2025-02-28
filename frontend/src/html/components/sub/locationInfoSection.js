import React, { Component } from 'react';

class LocationInfo extends Component {
  handleChange = (e) => {
    const { name, value } = e.target;
    this.props.onChange({ [name]: value });
  };

  render() {
    const { location } = this.props.data;

    return (
      <div>
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={location}
          onChange={this.handleChange}
        />
      </div>
    );
  }
}

export default LocationInfo;
