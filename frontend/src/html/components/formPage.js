import React, { Component } from 'react';
import '../../css/formPage.css';
import FormDetails from './sub/formDetails'; // Import the FormDetails component
import PersonalInfo from './sub/personalInfo'; // Import PersonalInfo component
import CourseDetails from './sub/courseDetails'; // Import CourseDetails component
import AgreementDetailsSection from './sub/agreementDetails';
import SubmitDetailsSection from './sub/submitDetails';
import axios from 'axios';

class FormPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentSection: 0,
      formData: {
        englishName: '',
        chineseName: '',
        location: '',
        nRIC: '',
        rESIDENTIALSTATUS: '',
        rACE: '',
        gENDER: '',
        dOB: '',
        cNO: '',
        eMAIL: '',
        postalCode: '',
        eDUCATION: '',
        wORKING: '',
        courseName: '',
        courseDate: '',
        agreement: ''  // Corrected key from 'argeement' to 'agreement'
      },
      validationErrors: {}
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    const queryParams = new URLSearchParams(window.location.search);
    console.log("QueryParams:", queryParams);
    const englishName = queryParams.get('engName')?.trim() || '';
    const chineseName = (() => {
      const param = queryParams.get('chiName') || '';
  
      if (param.includes(':')) {
          return param.split(':')[1].trim();
      } else {
          return param.trim();
      }
  })();
    const location = queryParams.get('location')?.trim() || '';
    const price = queryParams.get('price')?.trim() || '';
    const type = queryParams.get('type')?.trim() || '';
    const duration = queryParams.get('courseDuration')?.trim() || '';

    console.log(englishName, chineseName, "Location:", location, price, duration);

    this.setState((prevState) => ({
      formData: {
        ...prevState.formData,
        englishName,
        chineseName,
        location, 
        price, 
        type,
        duration
      }
    }));
  }

  handleDataChange = (newData) => {
    try
    {
      this.setState((prevState) => {
        const updatedFormData = {
          ...prevState.formData,
          ...newData,
        };
        
        const key = Object.keys(newData)[0];
        const updatedValidationErrors = { ...prevState.validationErrors };
    
        if (updatedValidationErrors[key]) {
          delete updatedValidationErrors[key];
        }

    
        return {
          formData: updatedFormData,
          validationErrors: updatedValidationErrors,
        };
      });
    }
    catch(error)
    {
      console.log(error);
    }
  };

  handleNext = () => {
    console.log("Pressed Next");
    const errors = this.validateForm();
    const { currentSection } = this.state;
    console.log(currentSection);
  
    // Payment validation when in CourseDetails section (currentSection === 2)
    if (currentSection === 2 && !this.courseDetailsRef.state.selectedPayment) {
      errors.selectedPayment = 'Please select a payment option.';
      this.courseDetailsRef.setState({ paymentTouched: true });
    }

    if (currentSection === 3 && !this.agreementDetailsRef.state.selectedChoice) {
      errors.agreement = 'Please choose the declaration.';
      this.agreementDetailsRef.setState({ isSelected: true });
    }


    if (Object.keys(errors).length === 0) {
      if (this.state.currentSection < 4) {
        this.setState({ currentSection: this.state.currentSection + 1 }, () => {
          window.scrollTo(0, 0);
        });
      } 
      if (this.state.currentSection === 3) {
        // Call handleSubmit if on the last section
        this.handleSubmit();
      } 
    } else {
      this.setState({ validationErrors: errors });
    }
  };

  handleSubmit = () => {
    const { formData } = this.state;

    // Participants Details
    var name = formData.pName;
    var nric = formData.nRIC;
    var residentalStatus = formData.rESIDENTIALSTATUS;
    var race = formData.rACE;
    var gender = formData.gENDER;
    var dateOfBirth = typeof formData.dOB === 'string' ? formData.dOB : formData.dOB.formattedDate;
    var contactNumber = formData.cNO;
    var email = formData.eMAIL;
    var postalCode = formData.postalCode;
    var educationLevel = formData.eDUCATION;
    var workStatus = formData.wORKING;

    // Course 
    var courseType = formData.type;
    var courseEngName = formData.englishName;
    var courseChiName = formData.chineseName;
    var courseLocation = formData.location;
    var coursePrice = formData.price; 
    var courseDuration = formData.duration;
    var payment = formData.payment;

    // Agreement
    var agreement = formData.agreement; // Use the corrected key

    var participantDetails = {
      participant: {
          name: name,
          nric: nric,
          residentialStatus: residentalStatus,
          race: race,
          gender: gender,
          dateOfBirth: dateOfBirth,
          contactNumber: contactNumber,
          email: email,
          postalCode: postalCode,
          educationLevel: educationLevel,
          workStatus: workStatus
      },
      course: {
          courseType: courseType,
          courseEngName: courseEngName,
          courseChiName: courseChiName,
          courseLocation: courseLocation,
          coursePrice: coursePrice,
          courseDuration: courseDuration,
          payment: payment
      },
      agreement: agreement,
      status: "Pending", 
    };

    console.log('Participants Details', participantDetails);
    
    // Example of sending data to the server using Axios
      axios.post('https://ecss-backend-node-backup.azurewebsites.net/courseregistration', {"participantDetails": participantDetails, "purpose": "insert"})
      //axios.post('http://localhost:3001/courseregistration', {"participantDetails": participantDetails, "purpose": "insert"})
      .then((response) => {
        console.log('Form submitted successfully', response.data);
        if(response.data)
        {
          window.close(); 
          //alert("Success");
        }
        else
        {
          //alert("Failure");
        }
      })
      .catch((error) => {
        console.error('Error submitting form:', error);
      });
  };

  isValidNRIC(nric) {
    // Check if NRIC is empty
    if (!nric) {
        return { isValid: false, error: 'NRIC Number is required. 身份证号码是必填项。' };
    }
    // Check if NRIC is exactly 9 characters long
    if (nric.length !== 9) {
        return { isValid: false, error: 'NRIC must be exactly 9 characters. NRIC 必须是9个字符。' };
    }
    // Check if NRIC follows the correct format (first letter + 7 digits + last letter)
    if (!/^[STFG]\d{7}[A-Z]$/.test(nric)) {
        return { isValid: false, error: 'Invalid NRIC format. 必须符合新加坡身份证格式，例如 S1234567D。' };
    }
    // If the format is correct, return as valid
    return { isValid: true, error: null }; // NRIC format is valid, but checksum is not checked
  }

  isValidDOB(dob) {
    console.log("Date of Birth:", dob);
  
    // First, check if dob is a non-empty string
    if (typeof dob === 'string') {
      // Now, check if dob.formattedDate1 exists and is not empty
  
      // Parse the date in the correct format
      const dateParts = dob.split('/');
      let dobDate;
  
      // Match the formats
      if (dob.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        // dd/mm/yyyy or mm/dd/yyyy (same regex, will handle both cases based on the input)
        dobDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`); // yyyy-mm-dd
      } else if (dob.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        // yyyy/mm/dd or yyyy/dd/mm
        // Here we assume it's yyyy/mm/dd format because dd/mm/yyyy would already be captured in the first case
        dobDate = new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`); // yyyy-mm-dd
      } else {
        // If the format doesn't match, it's invalid
        return { isValid: false, error: 'Invalid Date of Birth format. 日期格式无效，必须符合：dd/mm/yyyy, yyyy/mm/dd, yyyy/dd/mm, mm/dd/yyyy。' };
      }
  
      console.log("Official Date:", dobDate);

      // Get current year and check if the person is at least 50 years old
      const currentYear = new Date().getFullYear();
      const birthYear = dobDate.getFullYear();
      const age = currentYear - birthYear;
  
      if (age < 50) {
        return { isValid: false, error: 'Age must be at least 50 years. 年龄必须至少为50岁。' };
      }
  
      return { isValid: true, error: null }; // Valid DOB
    }
    if (dob.formattedDate1) {
       // Get current year and check if the person is at least 50 years old
       const currentYear = new Date().getFullYear();
       const birthYear = new Date(dob.formattedDate1).getFullYear();
       const age = currentYear - birthYear;
       console.log("Age:", age);
   
       if (age < 50) {
         return { isValid: false, error: 'Age must be at least 50 years. 年龄必须至少为50岁。' };
       }
   
       return { isValid: true, error: null }; // Valid DOB
    }
      
  
    return { isValid: false, error: 'Date of Birth is required. 出生日期是必填项。' };
  }
  

  validateForm = () => {
    const { currentSection, formData } = this.state;
    console.log("formData:", formData);
    const errors = {};

    if (currentSection === 1) {
      if (!formData.pName) {
        errors.pName = 'Name is required. 姓名是必填项。';
      }
      if (!formData.location) {
        errors.location = 'Location is required. 地点是必填项。';
      }
      if (formData.nRIC) {
        const { isValid, error } = this.isValidNRIC(formData.nRIC);
        if (!isValid) {
            errors.nRIC = error;
        }
    }
      if (!formData.rESIDENTIALSTATUS) {
        errors.rESIDENTIALSTATUS = 'Residential Status is required. 居民身份是必填项。';
      }
      if (!formData.rACE) {
        errors.rACE = 'Race is required. 种族是必填项。';
      }
      if (!formData.gENDER) {
        errors.gENDER = 'Gender is required. 性别是必填项。';
      }
      if (!formData.dOB) 
      {
        errors.dOB = "Date of Birth is required. 出生日期是必填项。";
      }
      if (formData.dOB) 
      {
        console.log("User Input:", formData.dOB);
        const { isValid, error } = this.isValidDOB(formData.dOB);
        if (!isValid) {
            errors.dOB = error;
        }
      }
      if (!formData.cNO) {
        errors.cNO = 'Contact No. is required. 联系号码是必填项。';
      }
      if (!formData.cNO) {
          errors.cNO = 'Contact No. is required. 联系号码是必填项。';
      }
      if (formData.cNO && !/^\d+$/.test(formData.cNO)) {
          errors.cNO = 'Contact No. must contain only numbers. 联系号码只能包含数字。';
      }
      if (formData.cNO && formData.cNO.length !== 8) {
          errors.cNO = 'Contact No. must be exactly 8 digits. 联系号码必须是8位数字。';
      }
      if (formData.cNO && !/^[89]/.test(formData.cNO)) {
          errors.cNO = 'Contact No. must start with 8 or 9. 联系号码必须以8或9开头。';
      }    
      if (!formData.eMAIL) {
        errors.eMAIL = 'Email is required. 电子邮件是必填项。';
      }
      if (!formData.postalCode) 
      {
          errors.postalCode = 'Postal Code is required. 邮政编码是必填项。';
      }
      if (formData.postalCode && /[^0-9]/.test(formData.postalCode)) {
          errors.postalCode = 'Postal Code must contain only numbers. 邮政编码只能包含数字。';
      }
      if (formData.postalCode && formData.postalCode.length !== 6) {
          errors.postalCode = 'Postal Code must be exactly 6 digits. 邮政编码必须是6位数字。';
      }
      if (!formData.eDUCATION) {
        errors.eDUCATION = 'Education Level is required. 教育水平是必填项。';
      }
      if (!formData.wORKING) {
        errors.wORKING = 'Work Status is required. 工作状态是必填项。';
      }
    }
    

    return errors;
  };

  handleBack = () => {
    if (this.state.currentSection > 0) {
      this.setState({ currentSection: this.state.currentSection - 1 });
    }
  };

  render() {
    const { currentSection, formData, validationErrors } = this.state;

    return (
      <div className="formwholepage">
        <div className="form-page">
          <div className="form-container">
            {currentSection === 0 && <FormDetails />}
            {currentSection === 1 && (
              <PersonalInfo data={formData} onChange={this.handleDataChange} errors={validationErrors} />
            )}
            {currentSection === 2 && 
              <CourseDetails 
                ref={(ref) => this.courseDetailsRef = ref} 
                courseEnglishName={formData.englishName} 
                courseChineseName={formData.chineseName} 
                courseLocation={formData.location} 
                coursePrice={formData.price} 
                courseType={formData.type}
                courseDuration={formData.duration}
                payment={formData.payment}
                onChange={this.handleDataChange}
              />
            }
            {currentSection === 3 && <AgreementDetailsSection ref={(ref) => this.agreementDetailsRef = ref} agreement={formData.agreement} onChange={this.handleDataChange} errors={validationErrors}/>}
            {currentSection === 4 && <SubmitDetailsSection />}
          </div>
        </div>   
          {/* Conditionally render the button container */}
          {currentSection < 4 && (
            <div className="button-container">
              <button onClick={this.handleBack} disabled={currentSection === 0}>Back 返回</button>
              <button onClick={this.handleNext}>
                {currentSection === 4 ? 'Submit 提交' : 'Next 下一步'}
              </button>
            </div>
          )}
      </div>
    );
  }
}

export default FormPage;
