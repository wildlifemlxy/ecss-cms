import React, { Component } from 'react';

class PaymentMethod extends Component {
  constructor(props) {
    super(props);
    this.state = { value: props.value || '' };
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value });
  };

  getValue = () => {
    return this.state.value;
  };

  render() {
    return (
      <select
        value={this.state.value}
        onChange={this.handleChange}
        style={{ width: '100%' }}
      >
        <option value="">Select</option>
        <option value="Cash">Cash</option>
        <option value="PayNow/Paylah">PayNow/Paylah</option>
        <option value="SkillsFuture">SkillsFuture</option>
      </select>
    );
  }
}

export default PaymentMethod;