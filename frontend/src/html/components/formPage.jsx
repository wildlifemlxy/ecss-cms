import React, { Component } from 'react';
import '../../css/formPage.css';
import FormDetails from './sub/registrationForm/formDetails';
import PersonalInfo from './sub/registrationForm/personalInfo';
import CourseDetails from './sub/registrationForm/courseDetails';
import AgreementDetailsSection from './sub/registrationForm/agreementDetails';
import SubmitDetailsSection from './sub/registrationForm/submitDetails';
import axios from 'axios';
import SingPassButton from './sub/SingPassButton';

class FormPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentSection: 0,
      loading: false,
      //isAuthenticated: false, // Track SingPass authentication status
      isAuthenticated: true, // Track SingPass authentication status
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
        agreement: '',
        bgColor: '',
        courseMode: '',
        courseTime: ''
      },
      validationErrors: {}
    };
  }

  // Check if user is authenticated with SingPass
  checkSingPassAuthentication = () => {
    try {
      const userDataJson = sessionStorage.getItem('singpass_user_data_json');
      const accessToken = sessionStorage.getItem('singpass_access_token');
      
      if (userDataJson && accessToken) {
        const userData = JSON.parse(userDataJson);
        return userData && userData.name;
      }
      return false;
    } catch (error) {
      console.error('Error checking SingPass authentication:', error);
      return false;
    }
  };

  // Handle manual proceed without SingPass (optional)
  handleProceedWithoutSingPass = () => {
    this.setState({ 
      isAuthenticated: true,
      currentSection: 1 // Move to next section
    });
  };

  formatRace = (race) => {
    if (!race) return '';

    // If already formatted in Chinese/English mix, return as is
    if (
      typeof race === 'string' &&
      (race.includes('华') || race.includes('印') || race.includes('马') || race.includes('其他'))
    ) {
      return race;
    }

    // Default to OT unless we find a valid code
    let raceCode = 'OT';

    // Try to extract race code from structured object
    if (typeof race === 'object') {
      if (race.code) {
        raceCode = race.code;
      } else if (race.value) {
        raceCode = race.value;
      }
    } else if (typeof race === 'string') {
      raceCode = race;
    }

    const raceMap = {
      'CN': 'Chinese 华',
      'IN': 'Indian 印',
      'MY': 'Malay 马',
      'OT': 'Others 其他'
    };

    return raceMap[raceCode] || raceMap['OT'];
  };


  // Add helper function to format gender
  formatGender = (gender) => {
    console.log("Formatting gender:", gender);
    if (!gender) return '';
    
    // Handle if gender is already formatted
    if (typeof gender === 'string' && (gender.includes('男') || gender.includes('女'))) {
      return gender;
    }
    
    // Extract value if it's a SingPass structured object
    let genderCode = gender.code;
    if (typeof gender === 'object' && gender.value !== undefined) {
      genderCode = gender.code;
    }
    
    // Format according to your requirements
    const genderMap = {
      'M': 'M 男',
      'F': 'F 女'
    };
    
    return genderMap[genderCode] || genderCode;
  };

  // Updated formatResidentialStatus method to handle the classification property correctly
  formatResidentialStatus = (status) => {
    console.log("Residential Status:", status);
    
    if (!status) return '';
    
    // Handle if status is already formatted
    if (typeof status === 'string' && (status.includes('新加坡公民') || status.includes('永久居民'))) {
      return status;
    }
    
    // Extract the correct status code from SingPass structured object
    let statusCode = status;
    if (typeof status === 'object') {
      // Use classification if available, otherwise use code
      statusCode = status.classification || status.code || status.value;
    }
    
    console.log("Status Code:", statusCode);
    
    // Format according to your requirements
    const statusMap = {
      'SC': 'SC 新加坡公民',
      'C': 'SC 新加坡公民',
      'PR': 'PR 永久居民',
      'P': 'PR 永久居民'
    };
    
    return statusMap[statusCode] || statusCode;
  };

  // Add helper function to extract mobile number properly
  extractMobileNumber = (mobileData) => {
    if (!mobileData) return '';
    
    // Handle SingPass mobile structure: {areacode, prefix, nbr}
    if (typeof mobileData === 'object' && mobileData.nbr) {
      // Extract just the number from nbr.value
      if (mobileData.nbr.value) {
        return mobileData.nbr.value;
      }
      return mobileData.nbr;
    }
    
    // Handle simple string/number
    if (typeof mobileData === 'string' || typeof mobileData === 'number') {
      let mobile = String(mobileData).trim();
      // Remove +65 country code if present
      if (mobile.startsWith('+65')) {
        mobile = mobile.substring(3);
      }
      if (mobile.startsWith('65') && mobile.length === 10) {
        mobile = mobile.substring(2);
      }
      return mobile;
    }
    
    return '';
  };

  componentDidMount = async () => {
    window.scrollTo(0, 0);
    var clink;
    
    // Check if user is already authenticated with SingPass
    const isAuthenticatedWithSingPass = this.checkSingPassAuthentication();
    
    if (isAuthenticatedWithSingPass) {
      console.log('User already authenticated with SingPass');
      this.setState({ isAuthenticated: true, loading: false });
      
      // Pre-populate form with SingPass data
      this.populateFormWithSingPassData();
    }

    // Load course data
    await this.loadCourseData();
  };

  // Extract SingPass data population logic into separate method
  populateFormWithSingPassData = () => {
    let userData = null;
    try {
      const userDataJson = sessionStorage.getItem('singpass_user_data_json');
      if (userDataJson) {
        userData = JSON.parse(userDataJson);
        console.log('SingPass User Data retrieved:', userData);
      } else {
        console.log('No SingPass user data found in sessionStorage');
      }
    } catch (error) {
      console.error('Error parsing SingPass user data from sessionStorage:', error);
      
      // Fallback: try to get individual fields
      try {
        userData = {
          name: sessionStorage.getItem('singpass_user_data_name'),
          uinfin: sessionStorage.getItem('singpass_user_data_uinfin'),
          residentialstatus: sessionStorage.getItem('singpass_user_data_residentialstatus'),
          race: sessionStorage.getItem('singpass_user_data_race'),
          sex: sessionStorage.getItem('singpass_user_data_sex'),
          dob: sessionStorage.getItem('singpass_user_data_dob'),
          mobileno: sessionStorage.getItem('singpass_user_data_mobileno'),
          email: sessionStorage.getItem('singpass_user_data_email'),
          regadd: sessionStorage.getItem('singpass_user_data_regadd')
        };
        console.log('Fallback: Retrieved individual SingPass fields:', userData);
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        userData = null;
      }
    }

    if (userData) {
      console.log('Pre-populating form with SingPass data:', userData);
      
      // Extract postal code from regadd if it's an object or string
      let postalCode = '';
      if (userData.regadd) {
        try {
          if (typeof userData.regadd === 'string') {
            // Try to parse if it's a JSON string
            const regaddObj = JSON.parse(userData.regadd);
            postalCode = regaddObj.postal?.value || '';
          } else if (typeof userData.regadd === 'object') {
            postalCode = userData.regadd.postal?.value || '';
          }
        } catch (regaddError) {
          console.log('Could not extract postal code from regadd:', regaddError);
        }
      }
      
      // Extract and format mobile number properly
      const mobileNumber = this.extractMobileNumber(userData.mobileno);
      
      // Format all user data fields properly
      const formattedResidentialStatus = this.formatResidentialStatus(userData.residentialstatus);
      const formattedRace = this.formatRace(userData.race);
      const formattedGender = this.formatGender(userData.sex);
      
      this.setState(prevState => ({
        formData: {
          ...prevState.formData,
          // Map SingPass fields to form fields correctly
          pName: userData.name || '',
          nRIC: userData.uinfin || '',  // uinfin maps to nRIC
          rESIDENTIALSTATUS: formattedResidentialStatus,
          rACE: formattedRace,
          gENDER: formattedGender,  // sex maps to gENDER
          dOB: userData.dob || '',
          cNO: mobileNumber,  // extracted mobile number
          eMAIL: userData.email || '',
          postalCode: postalCode || '',
        }
      }));
      
      console.log('Form pre-populated with SingPass data');
      console.log('Formatted residential status:', formattedResidentialStatus);
      console.log('Formatted race:', formattedRace);
      console.log('Formatted gender:', formattedGender);
      console.log('Extracted mobile number:', mobileNumber);
    } else {
      console.log('No SingPass user data available for pre-population');
    }
  };

  // Extract course loading logic into separate method
  loadCourseData = async () => {
    const params = new URLSearchParams(window.location.search) || sessionStorage.getItem("courseLink");
    const link = params.get("link");
    console.log('Course Link:', link);
    if(!this.state.isAuthenticated) {
      sessionStorage.setItem("courseLink", link);
    }
    console.log('Final Course Link:', link);

    if (link) {
      // Fetching courses
      var courseType = "";
      var allCourses = await this.fetchCourses(courseType);
      console.log("All Courses:", allCourses);

      // Function to find the course by name
      function findCourseByName(courseList) {
        return courseList.find(course => {
          console.log("Actual Link:", link);
          console.log("Woocommerce Link:", decodeURIComponent(course.permalink));
          return decodeURIComponent(link) === decodeURIComponent(course.permalink);
        });
      }

      // Find the matching course
      var matchedCourse = findCourseByName(allCourses);
      console.log("Matched Course:", matchedCourse);

      if (matchedCourse) {
        const type = matchedCourse.categories[1].name.split(":")[1].trim();
        
        // Setting background color based on course type
        if (type === 'ILP') {
          this.setState({ bgColor: '#006400' });
        } else if (type === 'NSA') {
          this.setState({ bgColor: '#003366' });
        }
        
        let selectedLocation = matchedCourse.attributes[1].options[0];
        selectedLocation = selectedLocation === 'CT Hub' ? 'CT Hub' :
                          selectedLocation === '恩 Project@253' ? 'Tampines 253 Centre' :
                          selectedLocation === 'Pasir Ris West' ? 'Pasir Ris West Wellness Centre' :
                          selectedLocation === 'Tampines North CC' ? 'Tampines North Community Centre' :
                          selectedLocation;
        
        console.log("Selected Course Details:", matchedCourse.name.split(/<br\s*\/?>/));
        console.log("Selected Course Price:", matchedCourse.price);
        const shortDescription = matchedCourse.short_description;
        console.log(" :", shortDescription);

        let courseMode = '';
        if (
          matchedCourse &&
          Array.isArray(matchedCourse.attributes) &&
          matchedCourse.attributes[2] &&
          Array.isArray(matchedCourse.attributes[2].options) &&
          matchedCourse.attributes[2].options.length > 0
        ) {
          courseMode = matchedCourse.attributes[2].options[0];
        }

        console.log("Course Mode:", courseMode);

        // Parse course duration
        const paragraphs = shortDescription.split("<p>");
        const startDateParagraph = paragraphs[paragraphs.length - 2];
        const endDateParagraph = paragraphs[paragraphs.length - 1];

        const timingParagraph = this.decodeHtmlEntities(paragraphs[paragraphs.length - 3]);
        console.log("Timing Paragraph", timingParagraph);
        const courseTime = timingParagraph.match(/(\d{1,2}:\d{2}[ap]m\s*[–-]\s*\d{1,2}:\d{2}[ap]m)/i)[0];
        console.log("Timing:", courseTime);
        
        const cleanedStartDate = startDateParagraph.replace("<strong>", "").replace("</strong>", "").replace("</p>", "").split("<br />")[2];
        const cleanedEndDate = endDateParagraph.replace("<strong>", "").replace("</strong>", "").replace("</p>", "").split("<br />")[2];
        
        console.log("Start Date:", cleanedStartDate);
        console.log("End Date:", cleanedEndDate);
        const courseDuration = `${cleanedStartDate.replace(/\n/g, "")} - ${cleanedEndDate.replace(/\n/g, "")}`;

        // Parse course name parts
        const courseParts = matchedCourse.name.split(/<br\s*\/?>/).map(part => part.trim());
        const formattedPrice = matchedCourse.price ? `$${parseFloat(matchedCourse.price).toFixed(2)}` : "$0.00";

        // Update course details in state
        if (courseParts.length === 3) {
          this.setState((prevState) => ({
            formData: {
              ...prevState.formData,
              chineseName: courseParts[0],
              englishName: courseParts[1],
              location: selectedLocation,
              price: formattedPrice,
              type,
              courseDuration,
              courseTime,
              courseMode
            },
            loading: true
          }));
        } else if (courseParts.length === 2) {
          this.setState((prevState) => ({
            formData: {
              ...prevState.formData,
              englishName: courseParts[0],
              chineseName: courseParts[1] || '',
              location: selectedLocation,
              price: formattedPrice,
              type,
              courseDuration,
              courseTime,
              courseMode
            },
            loading: true
          }));
        } else if (courseParts.length === 1) {
          this.setState((prevState) => ({
            formData: {
              ...prevState.formData,
              englishName: courseParts[0],
              location: selectedLocation,
              price: formattedPrice,
              type,
              courseDuration,
              courseTime,
              courseMode
            },
            loading: true
          }));
        }
      } else {
        console.log("No matching course found");
        this.setState({ loading: true });
      }
    } else {
      console.log("No course link provided, loading form without course data");
      this.setState({ loading: true });
    }
  }

  // Add helper method to get SingPass user data safely
  getSingPassUserData = () => {
    try {
      const userDataJson = sessionStorage.getItem('singpass_user_data_json');
      return userDataJson ? JSON.parse(userDataJson) : null;
    } catch (error) {
      console.error('Error retrieving SingPass user data:', error);
      return null;
    }
  }

  async fetchCourses(courseType) {
    try {
      var response = await axios.post(`${window.location.hostname === "localhost" ? "http://localhost:3002" : "https://ecss-backend-django.azurewebsites.net"}/courses/`, {courseType});
      var courses = response.data.courses;
      return courses;
    }
    catch(error) {
      console.error("Error:", error)
    }
  }

  handleDataChange = (newData) => {
    try {
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
    catch(error) {
      console.log(error);
    }
  };

  handleNext = () => {
    console.log("Pressed Next");
    const errors = this.validateForm();
    const { currentSection, isAuthenticated } = this.state;
    console.log("Current Section:", currentSection);

    // Special handling for section 0 (FormDetails with SingPass)
    if (currentSection === 0) {
      if (!isAuthenticated) {
        // User must authenticate with SingPass first
        this.setState({ 
          validationErrors: { 
            authentication: 'Please authenticate with SingPass to continue. 请使用SingPass认证以继续。' 
          } 
        });
        return;
      }
      // If authenticated, proceed to next section without additional validation
    }

    // Existing validation logic for other sections
    if (currentSection === 2) {
      if (this.props.type === "NSA" && !this.courseDetailsRef.state.selectedPayment) {
        errors.selectedPayment = 'Please select a payment option.';
        this.courseDetailsRef.setState({ paymentTouched: true });
      } 
      else if (this.props.type === "ILP") {
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
    var courseTime = formData.courseTime;
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
          courseTime: courseTime,
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
          sessionStorage.clear(); // Clear session storage after successful submission
          // Success alert
         // alert("Success");
    
          // Set a 10-second timeout to close the window after success
          setTimeout(() => {
            //window.close(); // This will close the window after 10 seconds
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

    // No validation needed for section 0 (FormDetails) - just SingPass authentication check
    if (currentSection === 0) {
      return errors; // Return empty errors for section 0
    }

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
    const { currentSection, formData, validationErrors, bgColor, loading, isAuthenticated } = this.state;
  
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
            {currentSection === 0 && (
              <FormDetails 
                courseType={formData.type} 
                isAuthenticated={isAuthenticated}
                onAuthenticationChange={(authStatus) => this.setState({ isAuthenticated: authStatus })}
                onProceedWithoutSingPass={this.handleProceedWithoutSingPass}
                validationErrors={validationErrors}
              />
            )}
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
                courseMode={formData.courseMode}
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
        {/* Show Next/Back buttons for all sections */}
        {isAuthenticated && currentSection < 4 && (
          <div className="button-container">
            <button onClick={this.handleBack} disabled={currentSection === 0}>
              Back 返回
            </button>
            <button onClick={this.handleNext}>
              {currentSection === 3 ? 'Submit 提交' : 'Next 下一步'}
            </button>
          </div>
        )}
        {!isAuthenticated && window.location.href.includes('localhost') && (
        <div className="button-container">
          <SingPassButton/>
        </div>
      )}
      </div>
    );
  }  
}

export default FormPage;
