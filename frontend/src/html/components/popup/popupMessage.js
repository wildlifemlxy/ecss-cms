import React, { Component } from "react";
import '../../../css/popup/popup.css'; // Import CSS for popup styles
import axios from 'axios';

class Popup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newPassword: "",
      newPassword1: "",
      confirmPassword: "",
      newPasswordError: "",
      confirmPasswordError: "",
      formErrorMessage: "",
      showNewPassword: false, // For toggling new password visibility
      showConfirmPassword: false, // For toggling confirm password visibility
      username: "",
      message: '',
      error: '',
      password: '',
      countdown: 10,
      checked: true, 
      message4: null,
      participant: {
        id: '',
        name: '',
        nric: '',
        residentalStatus: '',
        race: '',
        gender: '', 
        contactNumber:  '',
        email: '',
        postalCode:  '',
        educationLevel: '',
        workStatus: ''
      },
      errors: {
        name: '',
        nric: '',
        contactNumber: '',
        email: '',
        postalCode: ''
      },
      showEditMessage: false,
    };
    this.countdownInterval = null;
  } 

    componentDidMount = async () => {  
      if (this.props.type === "no-activity") {
        console.log("Start CountDown");
        this.startCountdown();
      }
    
      if (this.props.type === "update-access-right") {
        console.log("Update Access Right", this.props.message);
        this.setState({ message4: this.props.message }, () => {
          console.log("Updated message4 state:", this.state.message4);
        });
      }
    
      if (this.props.type === "edit") {
        console.log("Edit", this.props.message);
        console.log("Participants Details:", this.props.message.participant);
        // Check if message and participant data are available
        if (this.props.message && this.props.message.participant) {
          this.setState({
            participant: {
              id: this.props.message._id|| '',
              name: this.props.message.participant.name || '',
              nric: this.props.message.participant.nric || '',
              residentialStatus: this.props.message.participant.residentialStatus || '',
              race: this.props.message.participant.race || '',
              gender: this.props.message.participant.gender || '',
              contactNumber: this.props.message.participant.contactNumber || '',
              email: this.props.message.participant.email || '',
              postalCode: this.props.message.participant.postalCode || '',
              educationLevel: this.props.message.participant.educationLevel || '',
              workStatus: this.props.message.participant.workStatus || ''
            },
            showEditMessage: true // Set state to show the edit-message div
          }, () => {
            console.log("Updated participant state:", this.state.participant);
          });
        } else {
          console.error("Participant data is missing in message.");
        }
      }
    };
    

    componentDidUpdate(prevProps) {
      // Check if the type prop has changed from the previous value
      if (this.props.type !== prevProps.type) {
        console.log("Type prop changed. Current type:", this.props.type);
    
        // If the new type is "no-activity", restart the countdown
        if (this.props.type === "no-activity") {
          console.log("Restart CountDown");
          this.startCountdown();
        }
        // If the new type is "update-access-right", update the message state
        else if (this.props.type === "update-access-right" && this.props.message !== prevProps.message) {
          console.log("Update Access Right", this.props.message);
          this.setState({ message4: this.props.message }, () => {
            console.log("Updated message4 state:", this.state.message4);
          });
        }
        // For any other type change, clear the countdown
        else {
          clearInterval(this.countdownInterval);
          console.log("Countdown cleared due to type change");
        }
      }
    
      // Handle "edit" type condition
      if (this.props.type === "edit" && this.props.message !== prevProps.message) {
        console.log("Edit", this.props.message);
        console.log("Participants Details:", this.props.message.participant);
        if (this.props.message && this.props.message.participant) {
          this.setState({
            participant: {
              id: this.props.message._id|| '',
              name: this.props.message.participant.name || '',
              nric: this.props.message.participant.nric || '',
              residentialStatus: this.props.message.participant.residentialStatus || '',
              race: this.props.message.participant.race || '',
              gender: this.props.message.participant.gender || '',
              contactNumber: this.props.message.participant.contactNumber || '',
              email: this.props.message.participant.email || '',
              postalCode: this.props.message.participant.postalCode || '',
              educationLevel: this.props.message.participant.educationLevel || '',
              workStatus: this.props.message.participant.workStatus || ''      
            },
            showEditMessage: true // Show the edit form
          }, () => {
            console.log("Updated participant state:", this.state.participant);
          });
        } else {
          console.error("Participant data is missing in the message.");
        }
      }
    }

 componentWillUnmount() {
    clearInterval(this.countdownInterval);
    this.setState({ countdown: 10 });
  }

  startCountdown = () => {
    this.countdownInterval = setInterval(() => {
      this.setState(prevState => {
        if (prevState.countdown <= 1) {
          //console.log(prevState.countdown);
         clearInterval(this.countdownInterval);
          this.props.goBackLoginPage();
            return { countdown: 0 };
        }
        console.log(prevState.countdown);
        return { countdown: prevState.countdown - 1 };
      });
    }, 1000);
  };



  validatePassword = (password) => {
    // Password validation regex: at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  // Handle form submission for changing password
  changePassword = async (event) => {
    event.preventDefault();
    const { newPassword, confirmPassword } = this.state;
    const {accountId} = this.props;

    let valid = true;

    // Validate new password
    if (!this.validatePassword(newPassword)) {
      this.setState({
        newPasswordError:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      });
      valid = false;
    }

    // Validate confirm password
    if (confirmPassword === "") {
      this.setState({ confirmPasswordError: "Confirm Password cannot be empty" });
      valid = false;
    } else if (newPassword !== confirmPassword) {
      this.setState({ confirmPasswordError: "Passwords do not match" });
      valid = false;
    }

    if (!valid) {
      return;
    }
    else if(valid)
    {
      //var response = await axios.post(`http://localhost:3001/login`, {"purpose": "changePassword", "accountId": accountId, "newPassword": newPassword});
      var response = await axios.post(`https://ecss-backend-node-backup.azurewebsites.net/login`, {"purpose": "changePassword", "accountId": accountId, "newPassword": newPassword});
      if(response.data.success === true)
      {
        this.props.passPopupMessage(response.data.success, response.data.message);
      }
      else
      {
        this.props.passPopupMessage(response.data.success, response.data.message);
      }
    }
  };

  handlePasswordChange = (event) => {
    const { value } = event.target;
    this.setState({ newPassword: value });

    // Validate password as the user types
    if (!this.validatePassword(value)) {
      this.setState({
        newPasswordError:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      });
    } else {
      this.setState({ newPasswordError: "" });
    }
  };

  clickPasswordChange = () => {
    this.setState({ newPasswordError: "" });
  };

  clickConfirmPasswordChange = () => {
    this.setState({ confirmPasswordError: "" });
  };

  handleConfirmPasswordChange = (event) => {
    const { value } = event.target;
    this.setState({ confirmPassword: value });

    // Clear error if passwords match
    if (value === this.state.newPassword) {
      this.setState({ confirmPasswordError: "" });
    }
  };

  // Toggle new password visibility
  toggleNewPasswordVisibility = () => {
    this.setState((prevState) => ({
      showNewPassword: !prevState.showNewPassword,
    }));
  };

  handleConfirm = async(id) =>
  {
    console.log("Registration Id1:", id);
    axios.post('https://ecss-backend-node-backup.azurewebsites.net/courseregistration', {"purpose": "delete", id})
      //axios.post('http://localhost:3001/courseregistration', {"purpose": "delete", "id":id})
      .then((response) => {
        console.log("Deleted Participants:", response);
        this.props.closePopupMessage();
      })
    .catch((error) => {
      console.error('Error submitting form:', error);
    });
  }

  // Toggle confirm password visibility
  toggleConfirmPasswordVisibility = () => {
    this.setState((prevState) => ({
      showConfirmPassword: !prevState.showConfirmPassword,
    }));
  };

  cancel = async() =>
  {
    this.props.closePopup();
  }

  cancel1 = async() =>
  {
    this.props.closePopup();
    this.setState({ countdown: 10 });
  }

  goBackHome = async() =>
  {
    this.props.goBackLoginPage();
  }

  enterUsername = (e) => {
    const { name, value } = e.target;
    console.log(name, value); // Logs the id and value for debugging
    this.setState({ [name]: value });
  };

  handleSendPassword = async (e) => 
  {
    console.log("Handle Password");
    e.preventDefault();
    const { username, newPassword1 } = this.state;
    let valid = true;

    if (!username) {
      this.setState({ error: 'Please enter your username.' });
      valid = false;
    }
    if (!newPassword1) {
      this.setState({
        newPasswordError1:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      });
      valid = false;
    }
    if (!this.validatePassword(newPassword1)) {
      this.setState({
        newPasswordError1:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      });
      valid = false;
    }
  
    if(valid === true)
    {
      //var response = await axios.post(`http://localhost:3001/login`, {"purpose": "resetPassword",  "username": username, "password": newPassword1});
      var response = await axios.post(`https://ecss-backend-node-backup.azurewebsites.net/login`, {"purpose": "resetPassword",  "username": username, "password": newPassword1});
      console.log(response)
      if(response.data.success === true)
      {
        //console.log("Change Password Successfully");
        this.props.passPopupMessage(response.data.success, "Reset Password Successfully");
      }
      else
      {
        //console.log("Change Password Error");
        this.props.passPopupMessage(response.data.success, "Reset Password Failure");
      }
    }

   /* // For demonstration, we'll just set a success message
    this.setState({
      message: 'Instructions have been sent to your email.',
      error: '',
    });*/
  };

  manageAccountInfo = async(action) =>
  {
    if(action === "Delete")
    {
      console.log("Delete Account");
      //console.log("Delete Account", this.props);
      var accountId = this.props.message;
      var response = await axios.post(`http://ecss-backend-node-backup.azurewebsites.net/accountDetails`, {"purpose": "deleteAccount",  "accountId": accountId});
      //var response = await axios.post(`http://localhost:3001/accountDetails`, {"purpose": "deleteAccount",  "accountId": accountId});
      if(response.data.success === true)
      {
          //console.log("Change Password Successfully");
          this.props.closePopupMessage(response.data.success, "Delete Account Successfully");
      }
      else
      {
        //console.log("Change Password Error");
        this.props.closePopupMessage(response.data.success, "DeleteAccount Failure");
      }
    }
  }

  handleCheckboxChange = (mainKey, subKey) => {
    //var {message4} = this.state 
    var {message4} = this.state 
    // Get the current value from props
    const currentValue = message4[mainKey][subKey];
  
    console.log("Main Key:", mainKey);
    console.log("Sub Key:", subKey);
    console.log("Current Value:", currentValue);
  
    // Create a new message4 object with the updated value
    const updatedMessage4 = {
      ...message4,
      [mainKey]: {
        ...message4[mainKey],
        [subKey]: !currentValue, // Toggle the value
      },
    };
  
    // Set the state with the new message4
    this.setState({ message4: updatedMessage4 });
  };
  
  updateAccessRight = async() =>
  {
    var accessRight = this.state.message4;
    var accessRightId = this.props.message._id;
    var response = await axios.post(`https://ecss-backend-node-backup.azurewebsites.net/accessRights`, {"purpose": "updateAccessRight",  "accessRight": accessRight, "accessRightId": accessRightId});
    //var response = await axios.post(`http://localhost:3001/accessRights`, {"purpose": "updateAccessRight",  "accessRight": accessRight, "accessRightId": accessRightId});
    if(response.data.success === true)
      {
          //console.log("Change Password Successfully");
          this.props.closePopupMessage(response.data.success, "Update Access Rights Successfully");
      }
      else
      {
        //console.log("Change Password Error");
        this.props.closePopupMessage(response.data.success, "Update Access Rights Failure");
      }
  }

  handleInputChange = (e, field) => {
    const { value } = e.target;
    this.setState(prevState => ({
      participant: {
        ...prevState.participant,
        [field]: value, // Dynamically update the specific field
      },
    }));
  };

   // Handle form submission
  handleSubmitEdit = async (e) => {
    e.preventDefault();

    const { participant } = this.state;
    let errors = { ...this.state.errors };

    // Validation: Ensure that all required fields are filled out
    if (!participant.name) {
      errors.name = 'Name is required.';
    } else {
      errors.name = '';
    }

    if (!participant.nric) {
      errors.nric = 'NRIC is required.';
    } else {
      errors.nric = '';
    }

    if (!participant.contactNumber) {
      errors.contactNumber = 'Contact Number is required.';
    } else {
      errors.contactNumber = '';
    }

    if (!participant.email) {
      errors.email = 'Email is required.';
    } else {
      errors.email = '';
    }

    if (!participant.postalCode) {
      errors.postalCode = 'Postal Code is required.';
    } else {
      errors.postalCode = '';
    }

    // Update state with errors
    this.setState({ errors });

    // Check if there are any errors
    const hasErrors = Object.values(errors).some((error) => error !== '');
    if (hasErrors) {
      console.error('Validation Errors:', errors);
      return;  // Stop further execution if validation fails
    }

    console.log("Updated Details:", participant);

    try {
      const response = 
      //await axios.post('http://localhost:3001/courseregistration', {
      await axios.post('https://ecss-backend-node-backup.azurewebsites.net/courseregistration', {
        purpose: "updateEntry",
        entry: participant
      });

      // Check the response data
      if (response.data.result === true) {
        console.log("Successfully updated participant.");
        this.props.closePopup2(); // Close the popup if update is successful
      } else {
        console.error("Backend validation error:", response.data.message);
      }
    } catch (error) {
      // Handle network or other errors
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting the form. Please try again.");
    }
  };

  render() {
    const workStatusOptions = [
      { label: 'Retired 退休', value: 'Retired 退休' },
      { label: 'Employed full-time 全职工作', value: 'Employed full-time 全职工作' },
      { label: 'Self-employed 自雇人', value: 'Self-employed 自雇人' },
      { label: 'Part-time 兼职', value: 'Part-time 兼职' },
      { label: 'Unemployed 失业', value: 'Unemployed 失业' }
    ]; 
    const { message, isOpen, onClose, type } = this.props;
    const {newPassword,
      newPassword1,
      confirmPassword,
      newPasswordError,
      newPasswordError1,
      confirmPasswordError,
      formErrorMessage,
      showNewPassword,
      showConfirmPassword,
      username,
      message1,
      error,
      countdown, 
      message4,
      participant,
      showEditMessage,
      errors
    } = this.state;

    if (!isOpen) return null;

    const popupTypeClass = `popup-content ${type}`; // Apply different class based on the type

    return (
      <div className="popup-overlay" onClick={onClose}>
        <div className={popupTypeClass} onClick={(e) => e.stopPropagation()}>
          {type === "loading" ? (
            // Layout for loading type
            <div className="loading-popup">
              <h2>{message}</h2>
              <div className="bouncing-circles">
                <div className="circle"></div>
                <div className="circle"></div>
                <div className="circle"></div>
                <div className="circle"></div>
              </div>
            </div>
          ) : type === "success-message" ? (
            // Layout for success type
            <div className="success-message">
              <img src="https://ecss.org.sg/wp-content/uploads/2024/10/iqbf2fomkl6f65us70kdcann90.png"></img>
              <h2 className="success-title">Success!</h2>
              <p>{message}</p>
            </div>
          ) : type === "error-message" ? (
            // Layout for error type
            <div className="error-message">
            <img src="https://ecss.org.sg/wp-content/uploads/2024/10/error-10376-2.png"></img>
            <h2 className="error-title">Error!</h2>
            <p>{message}</p>
          </div>
          ): type === "change-password" ? (
            // Layout for error type
            <div className="change-password-message">
              <form onSubmit={this.changePassword}>
                <div className="form-group">
                  <label htmlFor="new-password">New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="new-password"
                      name="newPassword"
                      value={newPassword}
                      onChange={this.handlePasswordChange}
                      onClick={this.clickPasswordChange}
                    />
                    <i
                      className={`fa ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle-icon`}
                      onClick={this.toggleNewPasswordVisibility}
                    ></i>
                  </div>
                  {newPasswordError && <p className="error-message1">{newPasswordError}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm-password"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={this.handleConfirmPasswordChange}
                      onClick={this.clickConfirmPasswordChange}
                    />
                    <i
                      className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle-icon`}
                      onClick={this.toggleConfirmPasswordVisibility}
                    ></i>
                  </div>
                  {confirmPasswordError && <p className="error-message1">{confirmPasswordError}</p>}
                </div>
                {formErrorMessage && <p className="error-message1">{formErrorMessage}</p>}
                <button type="submit" className="submit-btn">Change Password</button>
              </form>
        </div>
          ):  type === "forgot-password" ? (
            // Layout for success type
            <div className="forgot-password-message">
            <h2 style={{color:"#000000"}}>Forgot Password</h2>
            <form onSubmit={this.handleSendPassword} className="forgot-password-form">
              <div className="form-group">
                <label htmlFor="username">Username:</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={username}
                  onChange={this.enterUsername}
                />
              </div>
              {error && <div className="error-message2">{error}</div>}
              <div className="form-group">
              <label htmlFor="password1">Password:</label>
              <div className="password-input-container">
              <input
                      type={showNewPassword ? "text" : "password"}
                      id="new-password1"
                      name="newPassword1"
                      value={newPassword1}
                      onChange={this.enterUsername}
                    />
                    <i
                      className={`fa ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle-icon`}
                      onClick={this.toggleNewPasswordVisibility}
                    ></i>
                  </div>
                  {newPasswordError1 && <p className="error-message2">{newPasswordError1}</p>}
              </div>
              {message1 && <div className="success-message">{message1}</div>}
              <br/>
              <button type="submit" className="submit-button">Submit</button>
            </form>
          </div>
          ):  type === "logout" ? (
            // Layout for success type
            <div className="logout-message">
              <h2 className="logout-title">Logout</h2>
              <p>{message}</p>
              <div className="button-container1">
                <button onClick={this.cancel}>No</button>
                <button onClick={this.goBackHome}>Yes</button>
              </div>
            </div>
          ):  type === "no-activity" ? (
           
            // Layout for success type
            <div className="no-activity-message">
              <h2 className="no-activity-title">No Activity</h2>
              <p>You have been inactive for a while</p>
              <h3>Returning to Login Page: {`00:${countdown.toString().padStart(2, '0')}`}</h3>
              <div className="button-container1">
                <button onClick={this.cancel1}>Cancel</button>
              </div>
            </div>
          ): type === "edit-account" ?(
          // Layout for success type
            <div className="edit-account-message">
               <button className="close-button12" onClick={this.cancel}>&times;</button>
               <h2 className="edit-account-title">Account</h2>
              <p>Click on the button below:</p>
              <div className="button-container2">
                <button onClick={() => this.manageAccountInfo("Edit")}>Edit Account Info</button>
                <button onClick={() => this.manageAccountInfo("Delete")}>Delete Account</button>              
              </div>
            </div>
          ): 
          type === "update-access-right" && message4 && Object.keys(message4).length > 0 ? (
            <div className="access-right-message">
              <h2 className="access-right-title">Update Access Rights</h2>
              {Object.keys(message4)
                .filter(mainKey => mainKey !== "_id") // Exclude mainKey named "_id"
                .map((mainKey) => (
                  <div key={mainKey} className="main-key">
                      <h3>{mainKey}</h3>
                    <div className="sub-keys">
                      <div className="checkbox-container">
                        {Object.keys(message4[mainKey]).
                         filter(subKey => subKey !== "Account ID").
                         map((subKey) => {
                          const value = message4[mainKey][subKey];
                          return (
                            <>
                              {subKey === "Registration And Payment Table" ? (
                                <div key={subKey}>
                                  <label className="checkbox-label">
                                    {/* Render checkbox only for boolean values */}
                                    {typeof value === "boolean" ? (
                                      <input 
                                        type="checkbox" 
                                        checked={value}
                                        onChange={() => this.handleCheckboxChange(mainKey, subKey)}
                                      />
                                    ) : null}
                                    <strong>
                                      <h3 style={{fontSize: "1em"}}>Registration And</h3>
                                      <h3 style={{fontSize: "1em"}}>Payment Table</h3>
                                      {typeof value === "boolean" ? ' ' : ': '}
                                    </strong>
                                    &nbsp;
                                    {typeof value === "string" ? value : ''}
                                  </label>
                                </div>
                              ) : (
                                <div key={subKey} className="checkbox-box">
                                  <label className="checkbox-label">
                                    {/* Render checkbox only for boolean values */}
                                    {typeof value === "boolean" ? (
                                      <input 
                                        type="checkbox" 
                                        checked={value}
                                        onChange={() => this.handleCheckboxChange(mainKey, subKey)}
                                      />
                                    ) : null}
                                    <strong>
                                      {subKey}
                                      {typeof value === "boolean" ? ' ' : ': '}
                                    </strong>
                                    &nbsp;
                                    {typeof value === "string" ? value : ''}
                                  </label>
                                </div>
                              )}
                            </>
                          );                          
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="button-container1">
                  <button onClick={this.cancel}>Cancel</button>
                  <button onClick={() => this.updateAccessRight()}>Update</button>
                </div>
            </div>
          )
          : type === "edit" ? (
            <div className="edit-message">
            <p>{message}</p>
          </div>
          ):type === "confirmation" ? (
            <div className="confirmation-message">
              <p>{message}</p>
              <div className="confirmation-buttons">
                <button onClick={() => this.handleConfirm(this.props.id)} className="confirm-btn">Confirm</button>
                <button onClick={this.cancel} className="cancel-btn">Cancel</button>
              </div>
            </div>
          )
          :(
            // Default layout for other types (like "message")
            <>  
            </>
          )}
        </div>
      </div>
    );
  }
}

export default Popup;
