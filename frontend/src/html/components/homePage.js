  import React, { Component } from 'react';
  import { withRouter } from 'react-router-dom';
  import '../../css/homePage.css'; // Ensure your CSS paths are correct
  import AccountsSection from './sub/accountsSection';
  import CoursesSection from './sub/courseSection';
  import RegistrationPaymentSection from './sub/registrationPaymentSection';
  import Popup from './popup/popupMessage';
  import Search from './sub/searchSection';
  import ViewToggle from './sub/viewToggleSection';
  import Pagination from './sub/paginationSection';
  import CreateAccountsSection from './sub/createAccountsSection';
  import ReceiptSection from './sub/receiptSection';
  import SideBarContent from './sub/sideBarContent';
  import DashboardSection from './sub/dashboardSection';
  import InvoiceSection from './sub/invoiceSection';
  import { withAuth } from '../../AuthContext';
  import axios from 'axios';  


  class HomePage extends Component {
    constructor(props) {
      super(props);

      const savedState = localStorage.getItem('myComponentState');
       var initialState = savedState ? JSON.parse(savedState) : {
        submenuVisible: null,
        language: 'en',
        courseType: null,
        isPopupOpen: false,
        popupMessage: '',
        popupType: '',
        sidebarVisible: false,
        locations: [],
        languages: [],
        types: [],
        selectedCourseLanguage: '',
        selectedCourseLocation: '',
        selectedCourseType: '',
        courseSearchQuery: '',
        selectedRegPaymentLanguage: '',
        selectedRegPaymentLocation: '',
        regPaymentSearchQuery: '',
        resetSearch: false,
        currentPage: 1,
        entriesPerPage: 100000000000,
        totalPages: 1,
        nofCourses: 0,
        noofDetails: 0,
        nofAccounts: 0,
        viewMode: 'full',
        isRegistrationPaymentVisible: false,
        section: '',
        accountType: null,
        roles: [],
        createAccount: false,
        displayedName: '',
        isDropdownOpen: false,
        isReceiptVisible: false,
        item: '',
        isInactive: false,
        refreshKey: 0,
        invoiceVisibility: false,
        dashboard: false,
        deleteId: ""
      };
  
      // Set the initial state
      this.state = initialState;

      this.handleDataFromChild = this.handleDataFromChild.bind(this);
      this.searchResultFromChild = this.searchResultFromChild.bind(this);
      this.handleSelectFromChild = this.handleSelectFromChild.bind(this);
      this.handleRegPaymentSelectFromChild = this.handleRegPaymentSelectFromChild.bind(this);
      this.handleRegPaymentSearchFromChild = this.handleRegPaymentSearchFromChild.bind(this);
      this.handlePageChange = this.handlePageChange.bind(this);
      this.toggleViewMode = this.toggleViewMode.bind(this); 
      this.toggleRegistrationPaymentComponent = this.toggleRegistrationPaymentComponent.bind(this);
      this.createAccountPopupMessage = this.createAccountPopupMessage.bind(this);
      this.inactivityTimeout = null;
      this.editAccountPopupMessage = this.editAccountPopupMessage.bind(this);
      //this.getTotalNumberofDetails = this.getTotalNumberofDetails.bind(this);
    }

    // Function to handle data passed from the child
    handleDataFromChild = async (filter1, filter2) =>
    {
      var {section} = this.state;
      console.log("Current Sections:", section);  
      if(section === "courses")
      {
      const filterLanguages = new Set(filter1);
      const filterLocations = new Set(filter2);

      this.setState({
        locations: Array.from(filterLanguages),
        languages: Array.from(filterLocations)
      });
     }
     else if(section === "registration")
     {
      const filterLocations = new Set(filter1);
      const filterType = new Set(filter2);
      this.setState({
        locations: Array.from(filterLocations),
        types: Array.from(filterType)
      });
     }
     else if(section === "accounts")
     {
      var filterRoles = new Set(filter1);
      this.setState({
        roles: Array.from(filterRoles)
      });
     }
  }

    handleSelectFromChild = async (updateState, dropdown) => {
      console.log("Selected Data:", updateState, dropdown);
      var {section} = this.state;
      if(section === "courses")
      {
        if (dropdown === "showLanguageDropdown") {
          this.setState({
            selectedLanguage: updateState.language
          });
        }
        else if (dropdown === "showLocationDropdown") {
          this.setState({
            selectedLocation: updateState.centreLocation
          });
        }
        else if(dropdown === "showTypeDropdown")
        {
          this.setState({
            selectedLocation: updateState.centreLocation
          });
        }
      }
      else if(section === "accounts")
      {
        if(dropdown === "showAccountTypeDropdown")
        {
              this.setState({
                selectedAccountType: updateState.role
              });
          }
      }
    }

    // Handle selection for registration payments
    handleRegPaymentSelectFromChild = async (updateState, dropdown) => {
      console.log("Selected Data (Registration Payment):", updateState, dropdown);
      if(updateState.centreLocation)
      {
        this.setState({
          selectedLocation: updateState.centreLocation
        });
      }
      else if(updateState.courseType)
      {
        this.setState({
          selectedCourseType: updateState.courseType
        });
      }
    }

    toggleInvoiceComponent = async() =>
    {
      try 
      {
          this.setState({ resetSearch: true, }, () => {
            this.setState({ resetSearch: false });
          });

         
          this.setState({
            courseType: null,
            sidebarVisible: false,
            isRegistrationPaymentVisible: false,
            section: "",
            accountType: null,
            createAccount: false,
            invoiceVisibility: true
          });
      } 
      catch (error) 
      {
        console.log(error);
      }
    }

    // Handle selection for registration payments
    handleRegPaymentSearchFromChild = async (data) => {
      this.setState({
        searchQuery: data
      });
    }


    searchResultFromChild = async (value) => {
     
      //console.log("Search Result:", value);
      this.setState({
        searchQuery: value
      });
    }

      // Search results for registration payments
      searchRegPaymentResultFromChild = async (value) => {
        console.log("Registration Payment Search Result:", value);
        this.setState({
          regPaymentSearchQuery: value
        });
      }


      toggleSubMenu = (index) => {
        this.setState((prevState) => ({
          submenuVisible: prevState.submenuVisible === index ? null : index
        }));
        //this.setState({viewMode: "full"});
      };

    toggleLanguage = () => {
      this.setState((prevState) => {
        const newLanguage = prevState.language === 'en' ? 'zh' : 'en';
        return {
          language: newLanguage
        };
      });
    };

    handleMouseLeave = () => {
      this.setState({ submenuVisible: null });
    };

    toggleSidebar = () => {
      this.setState((prevState) => ({
        sidebarVisible: !prevState.sidebarVisible
      }));
    };

    toggleCourseComponent = async (courseType) => {
      try {
        this.setState({ resetSearch: true, }, () => {
          this.setState({ resetSearch: false });
        });

        this.setState({
          isPopupOpen: true,
          popupMessage: "Loading In Progress",
          popupType: "loading",
          courseType: courseType,
          sidebarVisible: false,
          isRegistrationPaymentVisible: false ,
          section: "courses",
          accountType: "",
          createAccount: false,
          isReceiptVisible: false,
          invoiceVisibility: false
        });
      } catch (error) {
        console.log(error);
      }
    };

    componentDidMount = async () => {
      // Start the inactivity detection timeout
      //sessionStorage.clear();
      this.resetInactivity();
      // Adding event listeners to reset inactivity
      window.addEventListener('mousemove', this.resetInactivity);
      window.addEventListener('keypress', this.resetInactivity);
      window.addEventListener('click', this.resetInactivity);
      window.addEventListener('scroll', this.resetInactivity);
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }

    handleBeforeUnload = (event) => {
      // Save the current state to local storage before the page unloads
      localStorage.setItem('myComponentState', JSON.stringify(this.state));

      // Show a warning dialog when the user tries to refresh or close the page
     event.preventDefault();
     // event.returnValue = ''; // Trigger the confirmation dialog
    };
  
    componentWillUnmount() {
      // Cleanup the timeout and event listeners
      clearTimeout(this.inactivityTimeout); // Clear any existing timeouts
      window.removeEventListener('mousemove', this.resetInactivity);
      window.removeEventListener('keypress', this.resetInactivity);
      window.removeEventListener('click', this.resetInactivity);
      window.removeEventListener('scroll', this.resetInactivity);
     window.removeEventListener('beforeunload', this.handleBeforeUnload);
     localStorage.removeItem('myComponentState');
    }

    toggleDashboardComponent = async () => 
    {
        try 
        {
          console.log("Dashboard Page");
            this.setState({ resetSearch: true, }, () => {
              this.setState({ resetSearch: false });
            });
  
           
            this.setState({
              courseType: null,
              sidebarVisible: false,
              isRegistrationPaymentVisible: false ,
              section: "",
              accountType: null,
              createAccount: false,
              invoiceVisibility: false,
              dashboard: true,
              isPopupOpen: true,
              popupMessage: "Loading Dashboard",
              popupType: "loading",
            });
        } 
        catch (error) 
        {
          console.log(error);
        }
    };

    toggleAccountsComponent = async (accountType) => 
    {
      try 
      {
        if(accountType !== "Create Account")
        { 
          this.setState({ resetSearch: true, }, () => {
            this.setState({ resetSearch: false });
          });

          console.log("Account Type:", accountType);

          this.setState({
            isPopupOpen: true,
            popupMessage: "Loading In Progress",
            popupType: "loading",
            courseType: "",
            sidebarVisible: false,
            isRegistrationPaymentVisible: false ,
            section: "accounts",
            accountType: accountType,
            createAccount: false,
            invoiceVisibility: false
          });
        }
        else
        {
          this.setState({
            isPopupOpen: true,
            popupMessage: "Loading In Progress",
            popupType: "loading",
            courseType: "",
            sidebarVisible: false,
            isRegistrationPaymentVisible: false ,
            section: "accounts",
            accountType: null,
            createAccount: true,
            invoiceVisibility: false
          });
        }
      } 
      catch (error) 
      {
        console.log(error);
      }
    };


    toggleViewMode(mode) {
      var {section} = this.state;
      console.log("Toggle View Mode:", section);
      this.setState({ viewMode: mode });
      if (mode === 'full') 
      {
        if(section === "courses")
        {
          this.handleEntriesPerPageChange(this.state.nofCourses); // Reset table data when switching to full view
        }
        else if(section === "registration")
        {
          this.handleEntriesPerPageChange(this.state.noofDetails);
        }
        else if(section === "accounts")
        {
          this.handleEntriesPerPageChange(this.state.nofAccounts);
        }
      }
    }

    closePopup = () => {
      this.setState({
        isPopupOpen: false,
        popupMessage: '',
        popupType: '',
      });
    };

    closePopup2 = () => {
      // Open the popup with success message
      this.setState({
        isPopupOpen: true,  // Set popup to open
        popupMessage: "You have updated the entry successfully",  // Success message
        popupType: "success-message"  // Type of popup message
      });

      // Set timeout to close the popup after 5 seconds
      setTimeout(() => {
        this.setState({ 
          isPopupOpen: false  // Close the popup
        });
        this.refreshChild();  // Refresh or call any child method if needed
      }, 5000);  // 15 mins
    };


    generateDeleteConfirmationPopup = (id) => {
      console.log("ID deleted:", id);
      this.setState({
        isPopupOpen: true,
        popupMessage: `Are you sure you want to delete this item?`, // You can customize this based on your data
        popupType: "confirmation", // You can use this to style it differently if needed
        deleteId: id, // Store the row data to handle the deletion later
      });
    };
    
    generateReceiptPopup = () => {
      this.setState({
        isPopupOpen: true,
        popupMessage: "Generating Receipt...",
        popupType: "loading"
      });
    };

      
    updateRemarksPopup = () => {
      this.setState({
        isPopupOpen: true,
        popupMessage: "Changing Payment Method...",
        popupType: "loading"
      });
    };

    updatePaymentPopup = () => {
      this.setState({
        isPopupOpen: true,
        popupMessage: "Updating Payment Status...",
        popupType: "loading"
      });
    };


    handlePageChange(page) {
      console.log("Total No Of Pages:", this.state.totalPages);
      if (page >= 1 && page <= this.state.totalPages) {
        this.setState({ currentPage: page });
      }
    }

    getPaginatedCourses = () => {
        const { currentPage, coursesPerPage } = this.state;
      const startIndex = (currentPage - 1) * coursesPerPage;
      return this.getFilteredCourses().slice(startIndex, startIndex + coursesPerPage);
    };

    getTotalNumberofCourses = async (total) =>
    {
      console.log(total);
      this.setState({ nofCourses: total });
    };

    getTotalNumberofDetails = async (total) =>
    {
        console.log("Registration:", total);
        this.setState({ noofDetails: total });
    };

    getTotalNumberofAccounts = async (total) =>
    {
        console.log("Total Number Of Accounts:", total);
        this.setState({ nofAccounts: total });
    };
  

    handleEntriesPerPageChange = (value) => 
    {
      value = Number(value);
      const { nofCourses, section, noofDetails, nofAccounts } = this.state;
      console.log("Entries Per Page:", value);
      console.log("Number of Courses:", nofAccounts);
      if(section === "courses")
      {
        this.setState(
          { entriesPerPage: value, currentPage: 1 }, // Reset to the first page
          () => {
            const totalPages = Math.ceil(nofCourses / value);
            console.log("Total Pages:", totalPages);
            this.setState({ totalPages });
          }
        )
      }
      else if(section === "registration")
      {
        this.setState(
          { entriesPerPage: value, currentPage: 1 }, // Reset to the first page
          () => {
            const totalPages = Math.ceil(noofDetails / value);
            console.log("Total Pages:", totalPages);
            this.setState({ totalPages });
          }
        )
      }
      else if(section === "accounts")
      {
          console.log("Number of Accounts:", nofAccounts);
          this.setState(
            { entriesPerPage: value, currentPage: 1 }, // Reset to the first page
            () => {
              const totalPages = Math.ceil(nofAccounts / value);
              console.log(" Accounts Total Pages:", totalPages);
              this.setState({ totalPages });
            }
          )
        }
    };

    toggleRegistrationPaymentComponent(item)
    {
      console.log("Selected Item:", item);
      if(item === "Registration And Payment Table")
      {
        this.setState({ resetSearch: true, }, () => {
          this.setState({ resetSearch: false });
        });

        this.setState((prevState) => ({
            courseType: "",
            isRegistrationPaymentVisible: !prevState.isRegistrationPaymentVisible, // Toggle visibility
            isPopupOpen: true,
            popupMessage: "Loading In Progress",
            popupType: "loading",
            sidebarVisible: false,
            section: "registration",
            accountType: null,
            createAccount: false,
            isReceiptVisible: false,
            item: item,
            invoiceVisibility: false
            //viewMode: "full"
        }));
      }
      else if(item === "Receipt Table")
      {
          this.setState({ resetSearch: true, }, () => {
            this.setState({ resetSearch: false });
          });
  
          this.setState((prevState) => ({
              courseType: "",
              isRegistrationPaymentVisible: false, // Toggle visibility
              isPopupOpen: true,
              popupMessage: "Loading In Progress",
              popupType: "loading",
              sidebarVisible: false,
              section: "registration",
              accountType: null,
              createAccount: false,
              isReceiptVisible: !prevState.isReceiptVisible,
              item: item
              //viewMode: "full"
          }));
      }
  }
  
  onResetSearch = () =>
  {
    this.setState({ resetSearch: true, }, () => {
      this.setState({ resetSearch: false });
    });
  }

  logOut = async() =>
  {   
    //this.props.history.push('/');  
    this.setState({
      isPopupOpen: true,
      popupMessage: "Are you sure that you want to log out?",
      popupType: "logout",
      isDropdownOpen: false
    });
  }

  // This method is called when no activity is detected for the specified time
  noActivityDetected = async () => {
    this.setState({ isInactive: true });
    //console.log('User has been inactive for 1 minute.');
    this.setState({
      isPopupOpen: true,
      popupMessage: "",
      popupType: "no-activity"
    });
    //this.goBackHome();
  };

  // This method can be called to reset the inactivity state
  resetInactivity = () => {
    this.setState({ isInactive: false });
    //console.log('User is active again. Resetting inactivity timer.');
    clearTimeout(this.inactivityTimeout); // Clear the timeout if user becomes active

    // Restart the inactivity timeout
    //this.inactivityTimeout = setTimeout(this.noActivityDetected, 10000); // 1 minute*/
    this.inactivityTimeout = setTimeout(this.noActivityDetected, 15*60*1000); // 1 minute*/
  };

  goBackHome = async() =>
  {
    console.log("Logout");
    //var response = await axios.post(`https://ecss-backend-node.azurewebsites.net/login`, { "purpose": "logout", "accountId": this.props.location.state?.accountId});
    var response = await axios.post(`http://localhost:3001/login`, { "purpose": "logout", "accountId": this.props.location.state?.accountId});
    if(response.data.message.message === "Logout successful")
    {
      this.props.auth.logout();
      this.props.history.push("/");
    }
  }


  createAccountPopupMessage(result, message, popupType)
  {
    console.log(result, message, popupType);
    this.setState({
      isPopupOpen: result,
      popupMessage: message,
      popupType: "success-message"
    });
    setTimeout(() => {
      this.setState({ isPopupOpen: false});
    }, 5000);
  }

  toggleDropdown = () => {
    this.setState((prevState) => ({
      isDropdownOpen: !prevState.isDropdownOpen,
    }));
  };

    editAccountPopupMessage(accountId) {
      // Log the account ID for debugging purposes
     // console.log("Account Id:", accountId);
    
      // Set the popup state with a relevant message
      this.setState({
        isPopupOpen: true,
        popupMessage: accountId, // Informative message
        popupType: "edit-account"
      });
    }

   closePopupMessage = async () => {
        // Close the popup
        this.setState({
            isPopupOpen: false
        }, () => {
            // Call refreshChild after the state has updated
            this.refreshChild();
        });
    };

    // Method to refresh the child component
    refreshChild = () => {
        this.setState((prevState) => ({
            refreshKey: prevState.refreshKey + 1 // Increment refreshKey to trigger a refresh
        }));
    };

    updateAccessRights = async(accessRight) =>
    {
      console.log("Updated Access Right:", accessRight);
      this.setState({
        isPopupOpen: true,
        popupMessage: accessRight, // Informative message
        popupType: "update-access-right"
      });
    }

    warningPopUpMessage = async(message) =>
    {
        this.setState({
          isPopupOpen: true,
          popupMessage: message,
          popupType: "error-message",
        });
        // Redirect or perform other actions...
        setTimeout(() => {
          this.setState({ isPopupOpen: false, name: '', password: '', role: ''});
      }, 5000);
    } 

    loadingPopup = async () =>
    {
      this.setState({
        isPopupOpen: true,
        popupMessage: "Loading Dashboard",
        popupType: "loading",
      });
    }

    loadingPopup1 = async () =>
      {
        this.setState({
          isPopupOpen: true,
          popupMessage: "Loading In Progress",
          popupType: "loading",
        });
      }

    courseNameAndDetails(product_name) {
      var regex = /<br\s*\/?>/gi;
      var array = product_name.split(regex);
      if (array.length === 3) {
        array[2] = array[2].replace(/[()]/g, '');
        return { "engName": array[1], "chiName": array[0], "location": array[2] };
      }
      if (array.length === 2) {
        array[1] = array[1].replace(/[()]/g, '');
        return { "engName": array[0], "chiName": array[0], "location": array[1] };
      }
    } 

    generateInvoicePopup = async() => 
    {
      this.setState({
        isPopupOpen: true,
        popupMessage: "Generating Invoice",
        popupType: "loading",
      });
    }

    showUpdatePopup = async(item)=>
    {
      console.log("Selected:", item);
      this.setState({
        isPopupOpen: true,
        popupMessage: item,
        popupType: "loading",
      });
    }

    generateInvoiceNumber = async() =>
    {
      this.setState({
        isPopupOpen: true,
        popupMessage: "Generating Invoice For SkillsFuture Payment",
        popupType: "loading",
      });
    }

    render() 
    {
      console.log("Props History Push", this.props);
      const userName = this.props.location.state?.name || 'User';
      const role = this.props.location.state?.role;
      const siteIC = this.props.location.state?.siteIC;
      const { item,isDropdownOpen, isReceiptVisible, invoiceVisibility, dashboard, displayedName, submenuVisible, language, courseType, accountType, isPopupOpen, popupMessage, popupType, sidebarVisible, locations, languages, types, selectedLanguage, selectedLocation, selectedCourseType, searchQuery, resetSearch, viewMode, currentPage, totalPages, nofCourses,noofDetails, isRegistrationPaymentVisible, section, roles, selectedAccountType, nofAccounts, createAccount} = this.state;

      return (
        <>
          <div className="dashboard">
            <div className="header">
              <button className="sidebar-toggle" onClick={this.toggleSidebar}>
                ☰
              x</button>
              <div className="language-toggle">
                <button onClick={this.toggleLanguage}>
                  {language === 'en' ? '中文' : 'English'}
                </button>
              </div>
              <div className="user-dropdown">
                <div className="dropdown-toggle" onClick={this.toggleDropdown}>
                  <span className="displayedName">{userName}</span>
                  <i className='fas fa-user-alt'></i>
                </div>

                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <ul>
                      {/*<li>Profile</li>
                      <li>Settings</li>*/}
                      <li onClick={this.logOut}>Logout</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className={`content ${sidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
              <div
                className={`sidebar ${submenuVisible !== null ? 'expanded' : ''}`}
                onMouseLeave={this.handleMouseLeave}
              >
                <SideBarContent
                  accountId = {this.props.location.state?.accountId}
                  toggleDashboardComponent = {this.toggleDashboardComponent}
                  toggleAccountsComponent = {this.toggleAccountsComponent}
                  toggleCourseComponent = {this.toggleCourseComponent}
                  toggleRegistrationPaymentComponent = {this.toggleRegistrationPaymentComponent}
                  toggleInvoiceComponent = {this.toggleInvoiceComponent}
                  key={this.state.refreshKey}
                />
              </div>
              <div className="main-content">
              {
                accountType === null && courseType === null && isRegistrationPaymentVisible === false && createAccount === false && invoiceVisibility === false && dashboard === true &&
                (
                  <>
                  <div className="dashboard-section">
                    {<DashboardSection
                     closePopup1={this.closePopup}
                      loadingPopup = {this.loadingPopup}
                     />}
                  </div>
                  </>
                )
              }
              {createAccount && (
                <>
                   <div className="create-account-section">
                      <CreateAccountsSection
                        language={language}
                        closePopup={this.closePopup}
                        createAccountPopupMessage={this.createAccountPopupMessage}
                      />
                    </div>
                </>
              )}
              {accountType && (
                  <>
                  <div className="search-section">
                      <Search
                        language={language}
                        closePopup={this.closePopup}
                        passSelectedValueToParent={this.handleSelectFromChild}
                        passSearchedValueToParent={this.searchResultFromChild}
                        resetSearch={resetSearch}
                        section={section}
                        roles={roles}
                        item={item}
                      />
                    </div>
                    <div className="account-section">
                      <AccountsSection
                        language={language}
                        accountType={accountType}
                        closePopup={this.closePopup}
                        passDataToParent={this.handleDataFromChild}
                        selectedAccountType ={selectedAccountType}
                        searchQuery={searchQuery}
                        getTotalNumberofAccounts={this.getTotalNumberofAccounts}
                        currentPage={currentPage} // Pass current page
                        entriesPerPage={this.state.entriesPerPage} // Pass entries per page
                        resetSearch={resetSearch} 
                        section={section}
                        edit = {this.editAccountPopupMessage}
                        updateAccessRights = {this.updateAccessRights}
                        key={this.state.refreshKey}
                      />
                    </div>
                  </>
                )}
                {courseType && (
                  <>
                    <div className="search-section">
                      <Search
                        language={language}
                        closePopup={this.closePopup}
                        languages={languages}
                        locations={locations}
                        passSelectedValueToParent={this.handleSelectFromChild}
                        passSearchedValueToParent={this.searchResultFromChild}
                        resetSearch={resetSearch}
                        section={section}
                        item={item}
                      />
                    </div>
                    <div className="courses-section">
                      <CoursesSection
                        language={language}
                        courseType={courseType}
                        closePopup={this.closePopup}
                        passDataToParent={this.handleDataFromChild}
                        selectedLanguage={selectedLanguage}
                        selectedLocation={selectedLocation}
                        searchQuery={searchQuery}
                        getTotalNumberofCourses={this.getTotalNumberofCourses}
                        currentPage={currentPage} // Pass current page
                        entriesPerPage={this.state.entriesPerPage} // Pass entries per page
                        resetSearch={resetSearch} 
                        section={section}
                        item={item}
                      />
                    </div>
                  </>
                )}
                { isRegistrationPaymentVisible&& 
                  <>
                  <div className="search-section">
                      <Search
                        locations={locations}
                        types={types}
                        resetSearch={resetSearch}
                        section={section}
                        passSelectedValueToParent={this.handleRegPaymentSelectFromChild}
                        passSearchedValueToParent={this.handleRegPaymentSearchFromChild}
                        item={item}
                      />
                    </div>
                    <div className="registration-payment-section">
                    <RegistrationPaymentSection 
                        closePopup={this.closePopup}
                        section={section}
                        passDataToParent={this.handleDataFromChild}
                        selectedLocation={selectedLocation}
                        selectedCourseName={selectedCourseType}
                        searchQuery={searchQuery}
                        resetSearch={resetSearch}
                        getTotalNumberofDetails={this.getTotalNumberofDetails}
                        currentPage={currentPage} // Pass current page
                        entriesPerPage={this.state.entriesPerPage} // Pass entries per page
                        userName = {userName}
                        siteIC = {siteIC}
                        role = {role}
                        key={this.state.refreshKey}
                        refreshChild={this.refreshChild}
                        generateReceiptPopup = {this.generateReceiptPopup}
                        updatePaymentPopup = {this.updatePaymentPopup}
                        updateRemarksPopup = {this.updateRemarksPopup}
                        warningPopUpMessage = {this.warningPopUpMessage}
                        showUpdatePopup = {this.showUpdatePopup}
                        generateInvoiceNumber = {this.generateInvoiceNumber}
                        onResetSearch = {this.onResetSearch}
                        closePopupMessage = {this.closePopupMessage}
                        generateDeleteConfirmationPopup = {this.generateDeleteConfirmationPopup}
                    />
                    </div>
                  </>}                 
                  {isReceiptVisible && 
                  <>
                  <div className="search-section">
                      <Search
                        locations={locations}
                        types={types}
                        resetSearch={resetSearch}
                        section={section}
                        passSelectedValueToParent={this.handleRegPaymentSelectFromChild}
                        passSearchedValueToParent={this.handleRegPaymentSearchFromChild}
                        item={item}
                      />
                    </div>
                    <div className="view-toggle-section">
                      <ViewToggle
                        language={language}
                        viewMode={viewMode}
                        onToggleView={this.toggleViewMode}
                        onEntriesPerPageChange={this.handleEntriesPerPageChange}  
                        getTotalNumber= {noofDetails}
                      />
                    </div>
                    <div className="receipt-section">
                    <ReceiptSection 
                        closePopup={this.closePopup}
                        section={section}
                        passDataToParent={this.handleDataFromChild}
                        selectedLocation={selectedLocation}
                        selectedCourseType={selectedCourseType}
                        searchQuery={searchQuery}
                        resetSearch={resetSearch}
                        getTotalNumberofDetails={this.getTotalNumberofDetails}
                        currentPage={currentPage} // Pass current page
                        entriesPerPage={this.state.entriesPerPage} // Pass entries per page
                        userName = {userName}
                    />
                    </div>
                  </>} 
                  {invoiceVisibility && 
                  <>
                    <div className="invoice-section">
                    <InvoiceSection 
                      userName = {userName}
                      closePopup1={this.closePopup}
                      loadingPopup1 = {this.loadingPopup1}
                      generateInvoicePopup = {this.generateInvoicePopup}/>
                    </div>
                  </>} 
                  {/* Conditionally render the section */}
              </div>
            </div>
            <div className="footer">
              <p>© 2024 En Community Service Society Courses Management System.<br />
                All rights reserved.</p>
            </div>
          </div>
          <Popup isOpen={isPopupOpen} message={popupMessage} type={popupType} closePopup={this.closePopup} closePopup2={this.closePopup2} goBackLoginPage={this.goBackHome} closePopupMessage={this.closePopupMessage} id = {this.state.deleteId}/>
        </>
      );
    }
  }

  export default withAuth(HomePage);
