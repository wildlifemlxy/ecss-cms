import React, { Component } from 'react';
import '../../css/formPage.css';
import FormDetails from './sub/registrationForm/formDetails';
import PersonalInfo from './sub/registrationForm/personalInfo'; // Import PersonalInfo component
import CourseDetails from './sub/registrationForm/courseDetails'; // Import CourseDetails component
import AgreementDetailsSection from './sub/registrationForm/agreementDetails';
import SubmitDetailsSection from './sub/registrationForm/submitDetails';
import axios from 'axios';

class FormPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentSection: 0 ,
      loading: false,
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
        courseDate: '',
        agreement: '',  // Corrected key from 'argeement' to 'agreement'
        bgColor: '',
        courseMode: ''
      },
      validationErrors: {}
    };
  }

  componentDidMount = async () => {
      window.scrollTo(0, 0);
      const queryParams = new URLSearchParams(window.location.search);
      console.log("QueryParams:", queryParams);
  
      const link = queryParams.get('link')?.trim() || '';
      // Fetching courses
      var courseType = "";
      var allCourses = await this.fetchCourses(courseType);
      console.log("All Courses:", allCourses);
  
      // Function to find the course by name
      function findCourseByName(courseList) {
        return courseList.find(course => {
            // Direct comparison without spaces
            console.log("Actual Link:", link);
            console.log("Woocommerce Link:", decodeURIComponent(course.permalink));
            return decodeURIComponent(course.permalink) === link;
        });
      }

      // Find the matching course
      var matchedCourse = findCourseByName(allCourses);
      console.log("Matched Course:", matchedCourse);

      if (matchedCourse) {
         const type = matchedCourse.categories[1].name.split(":")[1].trim();
          // Setting background color based on course type
          if (type === 'ILP') {
              this.setState({ bgColor: '#006400' }); // Dark green for ILP
          } else if (type === 'NSA') {
              this.setState({ bgColor: '#003366' }); // Dark blue for NSA
          }
          let selectedLocation = matchedCourse.attributes[1].options[0];
          selectedLocation = selectedLocation === 'CT Hub' ? 'CT Hub' :
                             selectedLocation === '恩 Project@253' ? 'Tampines 253 Centre' :
                             selectedLocation === 'Pasir Ris West' ? 'Pasir Ris West Wellness Centre' :
                             selectedLocation === 'Tampines North CC' ? 'Tampines North Community Centre' :
                             selectedLocation; // Default if no match
          console.log("Selected Course Details:", matchedCourse.name.split(/<br\s*\/?>/));
          console.log("Selected Course Price:", matchedCourse.price);
          const shortDescription = matchedCourse.short_description;

          var courseMode = matchedCourse?.attributes?.[2]?.options?.[0];

          // Split the string by "<p>" to separate paragraph elements
          const paragraphs = shortDescription.split("<p>");
          
          // Get the last paragraph for Start Date (index -1) and second-to-last for End Date (index -2)
          const startDateParagraph = paragraphs[paragraphs.length - 2]; // second-to-last element
          const endDateParagraph = paragraphs[paragraphs.length - 1];  // last element
          
          // Clean the paragraphs by removing the <strong> and </strong> tags and </p> tag
          const cleanedStartDate = startDateParagraph.replace("<strong>", "").replace("</strong>", "").replace("</p>", "").split("<br />")[2];
          const cleanedEndDate = endDateParagraph.replace("<strong>", "").replace("</strong>", "").replace("</p>", "").split("<br />")[2];
          
          // Output the results
          console.log("Start Date:", cleanedStartDate);
          console.log("End Date:", cleanedEndDate);   
          const courseDuration = `${cleanedStartDate.replace(/\n/g, "")} - ${cleanedEndDate.replace(/\n/g, "")}`;    

  
          // Destructuring the split course name into parts
          const courseParts = matchedCourse.name.split(/<br\s*\/?>/).map(part => part.trim());
          const formattedPrice = matchedCourse.price ? `$${parseFloat(matchedCourse.price).toFixed(2)}` : "$0.00";
  
          // Setting state based on the course parts
          if (courseParts.length === 3) {
              // If we have three parts (Chinese, English, Location)
              this.setState((prevState) => ({
                  formData: {
                      ...prevState.formData,
                      chineseName: courseParts[0],  // Chinese name
                      englishName: courseParts[1],   // English name
                      location: selectedLocation,      // Location
                      price: formattedPrice,
                      type,
                      courseDuration,
                      courseMode
                  },
                  loading: true
              }));
          } else if (courseParts.length === 2) {
              // If we have two parts (Chinese, English)
              this.setState((prevState) => ({
                  formData: {
                      ...prevState.formData,
                      englishName: courseParts[0],  // Chinese name
                      location: selectedLocation,   // English name
                      price: formattedPrice,
                      type,
                      courseDuration,
                      courseMode
                  },
                  loading: true
              }));
          }
      } 
  }
  
  
  async fetchCourses(courseType) {
    try {
      var response = await axios.post(`${window.location.hostname === "localhost" ? "http://localhost:3002" : "https://ecss-backend-django.azurewebsites.net"}/courses/`, {courseType});
      var courses = response.data.courses;
      return courses;
    }
    catch(error)
    {
      console.error("Error:", error)
    }
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
    console.log("Current Section:", currentSection);
  
    if (currentSection === 2) {
      if (this.props.type === "NSA" && !this.courseDetailsRef.state.selectedPayment) {
        // If type is NSA and no payment option is selected, set an error
        errors.selectedPayment = 'Please select a payment option.';
        this.courseDetailsRef.setState({ paymentTouched: true });
      } 
      else if (this.props.type === "ILP") {
        // If type is ILP, just go on without 
        console.log("Go Next");
      }
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

  decodeHtmlEntities(text) 
  {
    const parser = new DOMParser();
    const decodedString = parser.parseFromString(`<!doctype html><body>${text}`, "text/html").body.textContent;
    return decodedString;
  }
  

  handleSubmit = () => {
    const { formData } = this.state;

    // Participants Details
    var name = formData.pName;
    var nric = formData.nRIC;
    var residentalStatus = formData.rESIDENTIALSTATUS;
    var race = formData.rACE;
    var gender = formData.gENDER;
    //var dateOfBirth = typeof formData.dOB === 'string' ? formData.dOB : formData.dOB.formattedDate;
    var dateOfBirth = formData.dOB;
    var contactNumber = formData.cNO;
    var email = formData.eMAIL;
    var postalCode = formData.postalCode;
    var educationLevel = formData.eDUCATION;
    var workStatus = formData.wORKING;

    // Course 
    var courseType = formData.type;
    var courseEngName = this.decodeHtmlEntities(formData.englishName);
    var courseChiName = this.decodeHtmlEntities(formData.chineseName);
    var courseLocation = formData.location;
    var coursePrice = formData.price; 
    var courseDuration = formData.courseDuration;
    var courseMode = formData.courseMode;
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
          courseMode: courseMode,
          payment: payment
      },
      agreement: agreement,
      status: "Pending", 
    };

    console.log('Participants Details', participantDetails);
    
    // Example of sending data to the server using Axios
    axios.post(
      `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`, 
      { participantDetails, purpose: "insert" }
    )
      .then((response) => {
        console.log('Form submitted successfully', response.data);
        if (response.data) {
          // Success alert
         // alert("Success");
    
          // Set a 10-second timeout to close the window after success
          setTimeout(() => {
            window.close(); // This will close the window after 10 seconds
          }, 10000);
        } else {
          // Handle failure if necessary
          alert("Error during submission");
        }
      })
      .catch((error) => {
        console.error('Error submitting form:', error);
        alert("Error during submission");
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
    const { currentSection, formData, validationErrors, bgColor, loading } = this.state;
  
    // Render the loading spinner or content depending on loading state
    if (loading === false) {
      return (
        <div className="loading-spinner" style={{ textAlign: 'center', marginTop: '20px' }}>
          <div className="spinner"></div>
          <p style={{ fontSize: '18px', color: '#333', fontWeight: '600', marginTop: '10px' }}>Loading...</p>
        </div>
      );
    }     
  
    return (
      <div className="formwholepage" style={{ backgroundColor: bgColor }}>
        <div className="form-page">
          <div className="form-container">
            {currentSection === 0 && <FormDetails courseType={formData.type} />}
            {currentSection === 1 && (
              <PersonalInfo
                data={formData}
                onChange={this.handleDataChange}
                errors={validationErrors}
              />
            )}
            {currentSection === 2 && (
              <CourseDetails
                ref={(ref) => (this.courseDetailsRef = ref)}
                courseEnglishName={formData.englishName}
                courseChineseName={formData.chineseName}
                courseLocation={formData.location}
                coursePrice={formData.price}
                courseType={formData.type}
                courseDuration={formData.courseDuration}
                courseMode = {formData.courseMode}
                payment={formData.payment}
                onChange={this.handleDataChange}
              />
            )}
            {currentSection === 3 && (
              <AgreementDetailsSection
                ref={(ref) => (this.agreementDetailsRef = ref)}
                agreement={formData.agreement}
                onChange={this.handleDataChange}
                errors={validationErrors}
              />
            )}
            {currentSection === 4 && <SubmitDetailsSection />}
          </div>
        </div>
        {/* Conditionally render the button container */}
        {currentSection < 4 && (
          <div className="button-container">
            <button onClick={this.handleBack} disabled={currentSection === 0}>
              Back 返回
            </button>
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
