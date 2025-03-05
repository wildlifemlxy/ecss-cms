import React, { Component } from 'react';
import '../../../css/sub/courseDetails.css';

class CourseDetailsSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedPayment: '',
      paymentTouched: false,
    };
  }

  /*handlePaymentChange = (event) => {
    this.setState({ 
      selectedPayment: event.target.value,
      paymentTouched: true, // Update when user interacts with the payment option
    });
  };*/

   // Handle payment selection and call onChange prop
   handlePaymentChange = (event) => {
    const selectedPayment = event.target.value;
    this.setState({ 
      selectedPayment,
      paymentTouched: true,
    });

    // Pass the selected payment option back to the parent
    this.props.onChange({
      ...this.props.formData,
      payment: selectedPayment,
    });
  };


  render() {
    const { selectedPayment, paymentTouched } = this.state;
  
    return (
      <div className="course-details-section">
        <div className="input-group1">
          <label htmlFor="courseType">Course Type 课程类型</label>
          <span className="course-detail-text" id="courseType">
            {this.props.courseType}
          </span>
        </div>
        <div className="input-group1">
          <label htmlFor="courseName">Course Name 课程名称</label>
          <span className="course-detail-text" id="courseName">
            English Name: {this.props.courseEnglishName}
          </span>
          <br />
          <span className="course-detail-text" id="courseName">
            中文名: {this.props.courseChineseName}
          </span>
        </div>
        <div className="input-group1">
          <label htmlFor="courseLocation">Course Location 课程地点</label>
          <span className="course-detail-text" id="courseLocation">
            {this.props.courseLocation}
          </span>
        </div>
        <div className="input-group1">
          <label htmlFor="coursePrice">Course Price 价格</label>
          <span className="course-detail-text" id="coursePrice">
            {this.props.coursePrice}
          </span>
        </div>
        <div className="input-group1">
          <label htmlFor="courseDuration">Course Duration 课程时长</label>
          <span className="course-detail-text" id="courseDuration">
            {this.props.courseDuration}
          </span>
        </div>
  
        {this.props.courseType === 'NSA' && (  
          // Payment Options Section
          <div className="input-group1">
            <label>I wish to pay by:</label>
            <label>我希望通过以下方式付款：</label>
            <div className="payment-options">
              {
                this.props.courseLocation !== 'Pasir Ris West Wellness Centre' && (
                  <label>
                    <input
                      type="radio"
                      value="Cash"
                      checked={this.state.selectedPayment === 'Cash'}
                      onChange={this.handlePaymentChange}
                    />
                    Cash
                  </label>
                )
              }
              <label>
                <input
                  type="radio"
                  value="PayNow"
                  checked={this.state.selectedPayment === 'PayNow'}
                  onChange={this.handlePaymentChange}
                />
                PayNow
              </label>
              {/* Conditionally render SkillsFuture based on the course names */}
              {this.props.courseEnglishName !== 'Community Ukulele – Mandarin' && 
                this.props.courseChineseName !== '音乐祝福社区四弦琴班 – 中文' && (
                  <label>
                    <input
                      type="radio"
                      value="SkillsFuture"
                      checked={this.state.selectedPayment === 'SkillsFuture'}
                      onChange={this.handlePaymentChange}
                    />
                    SkillsFuture
                  </label>
              )}
            </div>
            {/* Display error message if no payment option is selected, paymentTouched is true, and courseType is 'NSA' */}
            {this.props.courseType === 'NSA' && !selectedPayment && paymentTouched && (
              <>
                <span className="error-message3">Please select a payment option.</span>
                <span className="error-message3">请选择付款方式。</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  }  
}

export default CourseDetailsSection;
