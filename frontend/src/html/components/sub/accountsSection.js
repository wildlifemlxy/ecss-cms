import React, { Component } from 'react';
import axios from 'axios';
import '../../../css/sub/accounts.css';

class AccountsSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accounts: [], // All fetched courses
      filteredAccounts: [], // Courses filtered based on user 
      accessRights: [], // All fetched courses
      filteredAccessRights: [],
      loading: false,
      hideAllCells: false,
      dataFetched: false,
      clearTable: false,
      expandedRowIndex: null,
      currentPage: 1, // Add this
      entriesPerPage: 10// Add this
    };
    this.tableRef = React.createRef();
  }

  toggleRowExpansion = (index) => {
    console.log(index);
    this.setState((prevState) => ({
      expandedRowIndex: prevState.expandedRowIndex === index ? null : index,
    }));
  };


  async fetchAccounts() 
  {
    try {
      this.setState({ loading: true });
      var response = await axios.post(`https://ecss-backend-node.azurewebsites.net/accountDetails`, { "purpose": "retrieve"});
      //var response = await axios.post(`http://localhost:3001/accountDetails`, { "purpose": "retrieve"});
      console.log(response.data.result);
      var roles = this.getAllRoles(response.data.result);

      await this.props.getTotalNumberofAccounts(response.data.result.length);
      this.props.passDataToParent(roles);
      this.props.closePopup();
      
        // Update state with fetched data
        this.setState({
            accounts: response.data.result, // All fetched courses
            filteredAccounts: response.data.result, // Courses filtered based on user inputs
            loading: false,
            hideAllCells: false,
            dataFetched: true,
            roles:roles // Set locations in state
          });
  
    } catch (error) {
      console.error('Error fetching data:', error);
      this.setState({ loading: false });
      this.props.closePopup();
    }
  }

  async fetchAccessRights() 
  {
    try {
      this.setState({ loading: true });
      //var response = await axios.post(`https://ecss-backend-node.azurewebsites.net/accessRights`, { "purpose": "retrieve"});
      var response = await axios.post(`http://localhost:3001/accessRights`, { "purpose": "retrieve"});
      console.log("Fetch Access Rights:",response.data.result);
      var roles = this.getAllRolesAccessRight(response.data.result);

      await this.props.getTotalNumberofAccounts(response.data.result.length);
      this.props.passDataToParent(roles);
      this.props.closePopup();
      
        // Update state with fetched data
        this.setState({
            accessRights: response.data.result, // All fetched courses
            filteredAccessRights: response.data.result, // Courses filtered based on user inputs
            loading: false,
            hideAllCells: false,
            dataFetched: true,
            roles:roles // Set locations in state
          });
  
    } catch (error) {
      console.error('Error fetching data:', error);
      this.setState({ loading: false });
      this.props.closePopup();
    }
  }


  getAllRoles(accounts) {
    return [...new Set(accounts.map(account => {
      return (account.role);
    }))];
  }

  getAllRolesAccessRight(accessRights) {
    return [...new Set(accessRights.map(accessRights => {
      return (accessRights["Account Details"]["Role"]);
    }))];
  }
  
  async componentDidMount() {
    var { accountType } = this.props;
   // console.log("ComponentDidMount:", accountType);
    if (accountType && !this.state.dataFetched && accountType === "Accounts") {
      await this.fetchAccounts();
    }
    else if (accountType && !this.state.dataFetched && accountType === "Access Rights") 
    {
      await this.fetchAccessRights();
    }
  }

  
  componentDidUpdate(prevProps)
  {
   var { accountType, selectedAccountType, language, searchQuery } = this.props;
    //console.log("Component Did Update:", accountType, prevProps.accountType, accountType !== prevProps.accountType);
   // Check if any of the relevant props have changed
   if (
     accountType !== prevProps.accountType ||
     language !== prevProps.language 
   ) {
      if(accountType === "Accounts")
     {
        this.fetchAccounts();
     }
     else if(accountType === "Access Rights")
     {
         this.fetchAccessRights();
        //this.props.closePopup();
     }
   }
   else if ( 
    selectedAccountType !== prevProps.selectedAccountType || 
    searchQuery !== prevProps.searchQuery 
  ) {
        if(accountType === "Accounts")
        {
            this.filterAccounts();
        }
        else if(accountType === "Access Rights")  
        {
            this.filterAccessRights();
           //this.props.closePopup();
        }
  }
  else if (prevProps.key !== this.props.key) {
    this.filterAccounts();
  }
 }

  getPaginatedDetails() {
    const { filteredAccounts } = this.state;
    const { currentPage, entriesPerPage } = this.props;
    const indexOfLastCourse = currentPage * entriesPerPage;
    const indexOfFirstCourse = indexOfLastCourse - entriesPerPage;
    return filteredAccounts.slice(indexOfFirstCourse, indexOfLastCourse);
  }

  getPaginatedAccessDetails()
  {
    //console.log("getPaginatedAccessDetails()", this.props);
    const { filteredAccessRights } = this.state;
    const { currentPage, entriesPerPage } = this.props;
    const indexOfLastCourse = currentPage * entriesPerPage;
    const indexOfFirstCourse = indexOfLastCourse - entriesPerPage;
    //console.log(filteredAccessRights.slice(indexOfFirstCourse, indexOfLastCourse))
    return filteredAccessRights.slice(indexOfFirstCourse, indexOfLastCourse);
  }

 filterAccounts() {
    const { section } = this.props;

    if (section === "accounts") {
        const { accounts } = this.state;
        const { selectedAccountType, searchQuery} = this.props;

        // Reset filtered courses to all courses if the search query is empty
        if (selectedAccountType === "All Roles") {
            this.setState({ filteredAccounts: accounts });
            return;
        }

        const normalizedSearchQuery = searchQuery ? searchQuery.toLowerCase().trim() : '';

        const filteredDetails = accounts.filter(data => {
            // Extract participant propertie
           // console.log("Data:", data);
            var name = data.name.toLowerCase().trim() || "";
            var email = data.email.toLowerCase().trim() || "";
            var password = data.password.toLowerCase().trim() || "";
            var role = data.role.toLowerCase().trim() || "";
            var date_created = data.date_created.toLowerCase().trim() || "";
            var time_created = data.time_created.toLowerCase().trim() || "";
            var first_time_log_in = data.first_time_log_in.toLowerCase().trim() || "";
            var date_log_in = data.date_log_in.toLowerCase().trim() || "";
            var time_log_in = data.time_log_in.toLowerCase().trim() || "";
            var date_log_out = data.date_log_out.toLowerCase().trim() || "";
            var time_log_out = data.time_log_out.toLowerCase().trim() || "";

            const matchesRoles = selectedAccountType === "All Roles" || 
            selectedAccountType === "所有语言" || 
            selectedAccountType === "" || 
            !selectedAccountType 
            ? true 
            : role === selectedAccountType.toLowerCase().trim();

            const matchesSearchQuery = normalizedSearchQuery
                  ? (name.includes(normalizedSearchQuery) ||
                     email.includes(normalizedSearchQuery) ||
                     password.includes(normalizedSearchQuery) ||
                     role.includes(normalizedSearchQuery) ||
                     date_created.includes(normalizedSearchQuery) ||
                     time_created.includes(normalizedSearchQuery) ||
                     first_time_log_in.includes(normalizedSearchQuery)||
                     date_log_in.includes(normalizedSearchQuery) ||
                     time_log_in.includes(normalizedSearchQuery) ||
                     date_log_out.includes(normalizedSearchQuery) ||
                     time_log_out.includes(normalizedSearchQuery))
                  : true;

            return matchesRoles && matchesSearchQuery;;
        });
        //console.log(filteredDetails);

        // If filteredDetails is empty, set registerationDetails to an empty array
       this.setState({ filteredAccounts: filteredDetails.length > 0 ? filteredDetails : [] });
    }
}

filterAccessRights() 
{
    const { section } = this.props;

    if (section === "accounts") {
        const { accessRights } = this.state;
        const { selectedAccountType, searchQuery} = this.props;

        // Reset filtered courses to all courses if the search query is empty
        if (selectedAccountType === "All Roles") {
            this.setState({ filteredAccessRights: accessRights });
            return;
        }

        const normalizedSearchQuery = searchQuery ? searchQuery.toLowerCase().trim() : '';

        const filteredDetails = accessRights.filter(data => {
            // Extract participant propertie
           // console.log("Data:", data);
            var name = data["Account Details"]["Name"].toLowerCase().trim() || "";
            var role = data["Account Details"]["Role"].toLowerCase().trim() || "";

            const matchesRoles = selectedAccountType === "All Roles" || 
            selectedAccountType === "所有语言" || 
            selectedAccountType === "" || 
            !selectedAccountType 
            ? true 
            : role === selectedAccountType.toLowerCase().trim();

            const matchesSearchQuery = normalizedSearchQuery
                  ? (name.includes(normalizedSearchQuery) ||
                     role.includes(normalizedSearchQuery))
                  : true;

            return matchesRoles && matchesSearchQuery;
        });
        //console.log(filteredDetails);

        // If filteredDetails is empty, set registerationDetails to an empty array
       this.setState({ filteredAccessRights: filteredDetails.length > 0 ? filteredDetails : [] });
    }
}

  // Account info handler based on index
  accountInfo = async (index, account, e) => {
    e.stopPropagation();  // Prevent the click event from propagating to the row
    console.log("Account Information:", account._id);
    // Call the edit function, passing the account's ID
    this.props.edit(account._id);
  };

  accessRightInfo = async(accessRight, e) =>
  {
    e.stopPropagation();
    console.log("Access Rights  :", accessRight);
    this.props.updateAccessRights(accessRight);
  }

  getRoleColor = (role) => {
    switch(role) {
      case 'Admin':
        return '#008000'; // Green
      case 'Sub Admin':
        return '#0000FF'; // Blue
      case 'Ops in-charge':
        return '#FF0000'; // Red
      case 'NSA in-charge':
        return '#FFA500'; // Orange
      case 'Site in-charge':
        return '#8B4513'; // Brown
      case 'Finance':
        return '#000000'; // Black
      default:
        return '#808080'; // Gray (default color if role is not recognized)
    }
  }


  render() 
  {
    const { hideAllCells, clearTable, currentPage, entriesPerPage, accounts, filteredAccounts, accessRights, filteredAccessRights, accountType } = this.state;
    var paginatedDetails = this.getPaginatedDetails();
    var paginatedDetails1 = this.getPaginatedAccessDetails();

      //console.log(filteredAccessRights);
      //paginatedDetails = this.getPaginatedAccessDetails();
    return (
      <div className="accounts-container">
        <div className="accounts-heading">
          <h1>{this.props.language === 'zh' ? (this.props.courseType === 'NSA' ? 'NSA 课程' : 'ILP 课程') : (this.props.accountType === 'Accounts' ? 'Accounts Table' : 'Access Rights Table')}</h1>
          <div className="table-wrapper" ref={this.tableRef}>
            { this.props.accountType === 'Accounts'? (
              <table className="dashboard-table">
              <thead>
                <tr>
                  <th>{this.props.language === 'zh' ? '' : 'Name'}</th>
                  <th>{this.props.language === 'zh' ? '' : 'Email'}</th>
                  <th>{this.props.language === 'zh' ? '' : 'Account Type'}</th>
                  <th>{this.props.language === 'zh' ? '' : 'Date Created'}</th>
                  <th>{this.props.language === 'zh' ? '' : 'Time Created'}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDetails.map((account, index) => (
                  <React.Fragment key={index}>
                    <tr
                      onClick={() => this.toggleRowExpansion(index)}
                      className="table-row"
                      style={{ cursor: 'pointer' }}
                    >
                      <td onClick={(e) => this.accountInfo(index, account, e)}>{account.name}</td>
                      <td>{account.email}</td>
                      <td style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        width: 'auto',
                        fontWeight: 'bold',
                        textAlign: 'center',  // Center text horizontally
                        verticalAlign: 'middle',  // Center text vertically
                      }}>
                        <div style={{
                          backgroundColor: this.getRoleColor(account.role),
                          color: 'white',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          display: 'inline-block', // Make div wrap around the text
                          fontWeight: 'bold',
                          fontSize: '0.9rem',  // Set smaller font size
                        }}>
                          {account.role}
                        </div>
                      </td>
                      <td>{account.date_created}</td>
                      <td>{account.time_created}</td>
                    </tr>
                    {this.state.expandedRowIndex === index && (
                      <tr className="expanded-row">
                        <td colSpan="5">
                          <div className="expanded-content">
                            <p><strong>More Information</strong></p>
                            <p><strong>First Log In: </strong>{account.first_time_log_in || 'N/A'}</p>
                            <p><strong>Last Log In: </strong>
                              <br/><strong>Date: </strong>{account.date_log_in || 'N/A'} 
                              <br/><strong>Time: </strong>{account.time_log_in || 'N/A'}
                            </p>
                            <p><strong>Last Log Out: </strong>
                              <br/><strong>Date: </strong>{account.date_log_out || 'N/A'} 
                              <br/><strong>Time: </strong>{account.time_log_out || 'N/A'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>            
            ): (
<table>
  <thead>
    <tr>
      <th colSpan="2">{this.props.language === 'zh' ? '' : 'Account Details'}</th>
    </tr>
    <tr>
      <th>{this.props.language === 'zh' ? '' : 'Name'}</th>
      <th>{this.props.language === 'zh' ? '' : 'Role'}</th>
    </tr>
  </thead>
  <tbody>
    {paginatedDetails1.map((accessRight, index) => {
      return (
        <React.Fragment key={index}>
          <tr onClick={() => this.toggleRowExpansion(index)} style={{ cursor: 'pointer' }}>
            <td onClick={(e) => this.accessRightInfo(accessRight, e)}>{accessRight["Account Details"]["Name"]}</td>
            <td style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        width: 'auto',
                        fontWeight: 'bold'
                      }}>
                        <div style={{
                          backgroundColor: this.getRoleColor(accessRight["Account Details"]["Role"]),
                          color: 'white',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          display: 'inline-block', // Make div wrap around the text
                          fontWeight: 'bold',
                          fontSize: '0.9rem',  // Set smaller font size
                        }}>
                {accessRight["Account Details"]["Role"]}
                </div>
              </td>
          </tr>

                    {/* Expanded row */}
                    {this.state.expandedRowIndex === index && (
                      <tr className="expanded-row">
                      <td colSpan="14">
                        <div>
                          <strong>Access Modules</strong>
                          <br/>
                          <br/>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            <strong>Account Modules | </strong>
                              <p style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
                                <strong>Account Table: </strong> 
                                {accessRight["Account"]["Account Table"] ? (
                                  <i className="fas fa-check" style={{ color: 'green', fontSize: '20px', marginLeft: '5px' }}></i> // Font Awesome checkmark icon
                                ) : (
                                  <i className="fas fa-times" style={{ color: 'red', fontSize: '20px', marginLeft: '5px' }}></i> // Font Awesome cross mark icon
                                )}
                              </p>
                              
                              <p style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
                                <strong>Access Rights Table: </strong> 
                                {accessRight["Account"]["Access Rights Table"] ? (
                                  <i className="fas fa-check" style={{ color: 'green', fontSize: '20px', marginLeft: '5px' }}></i>
                                ) : (
                                  <i className="fas fa-times" style={{ color: 'red', fontSize: '20px', marginLeft: '5px' }}></i>
                                )}
                              </p>
                          </div>
                          <br/>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            <strong>Courses Modules | </strong>
                              <p style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
                                <strong>Upload Course(s): </strong> 
                                {accessRight["Courses"]["Upload Courses"] ? (
                                  <i className="fas fa-check" style={{ color: 'green', fontSize: '20px', marginLeft: '5px' }}></i> // Font Awesome checkmark icon
                                ) : (
                                  <i className="fas fa-times" style={{ color: 'red', fontSize: '20px', marginLeft: '5px' }}></i> // Font Awesome cross mark icon
                                )}
                              </p>
                              
                              <p style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
                                <strong>NSA Courses: </strong> 
                                {accessRight["Courses"]["NSA Courses"]? (
                                  <i className="fas fa-check" style={{ color: 'green', fontSize: '20px', marginLeft: '5px' }}></i>
                                ) : (
                                  <i className="fas fa-times" style={{ color: 'red', fontSize: '20px', marginLeft: '5px' }}></i>
                                )}
                              </p>

                              <p style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
                                <strong>ILP Courses: </strong> 
                                {accessRight["Courses"]["ILP Courses"] ? (
                                  <i className="fas fa-check" style={{ color: 'green', fontSize: '20px', marginLeft: '5px' }}></i>
                                ) : (
                                  <i className="fas fa-times" style={{ color: 'red', fontSize: '20px', marginLeft: '5px' }}></i>
                                )}
                              </p>

                              <p style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
                                <strong>Update Course(s): </strong> 
                                {accessRight["Courses"]["Update Courses"] ? (
                                  <i className="fas fa-check" style={{ color: 'green', fontSize: '20px', marginLeft: '5px' }}></i>
                                ) : (
                                  <i className="fas fa-times" style={{ color: 'red', fontSize: '20px', marginLeft: '5px' }}></i>
                                )}
                              </p>

                              <p style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
                                <strong>Delete Course(s): </strong> 
                                {accessRight["Courses"]["Delete Courses"]? (
                                  <i className="fas fa-check" style={{ color: 'green', fontSize: '20px', marginLeft: '5px' }}></i>
                                ) : (
                                  <i className="fas fa-times" style={{ color: 'red', fontSize: '20px', marginLeft: '5px' }}></i>
                                )}
                              </p>
                          </div>
                          <br/>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            <strong>Registration | </strong>
                              <p style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
                                <strong>Registration And Payment Table: </strong> 
                                {accessRight["Registration And Payment"]["Registration And Payment Table"] ? (
                                  <i className="fas fa-check" style={{ color: 'green', fontSize: '20px', marginLeft: '5px' }}></i> // Font Awesome checkmark icon
                                ) : (
                                  <i className="fas fa-times" style={{ color: 'red', fontSize: '20px', marginLeft: '5px' }}></i> // Font Awesome cross mark icon
                                )}
                              </p>
                              
                              <p style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
                                <strong>Invoice Table: </strong> 
                                {accessRight["Registration And Payment"]["Invoice Table"]? (
                                  <i className="fas fa-check" style={{ color: 'green', fontSize: '20px', marginLeft: '5px' }}></i>
                                ) : (
                                  <i className="fas fa-times" style={{ color: 'red', fontSize: '20px', marginLeft: '5px' }}></i>
                                )}
                              </p>
                          </div>
                          <br/>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            <strong>QR Code Modules | </strong>
                              <p style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
                                <strong>QR Code Creation: </strong> 
                                {accessRight["QR Code"]["Create QR Code"] ? (
                                  <i className="fas fa-check" style={{ color: 'green', fontSize: '20px', marginLeft: '5px' }}></i> // Font Awesome checkmark icon
                                ) : (
                                  <i className="fas fa-times" style={{ color: 'red', fontSize: '20px', marginLeft: '5px' }}></i> // Font Awesome cross mark icon
                                )}
                              </p>
                              
                              <p style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
                                <strong>QR Code Table:</strong> 
                                {accessRight["QR Code"]["QR Code Table"]? (
                                  <i className="fas fa-check" style={{ color: 'green', fontSize: '20px', marginLeft: '5px' }}></i>
                                ) : (
                                  <i className="fas fa-times" style={{ color: 'red', fontSize: '20px', marginLeft: '5px' }}></i>
                                )}
                              </p>

                              <p style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
                                <strong>Update QR Code: </strong> 
                                {accessRight["QR Code"]["Update QR Code"] ? (
                                  <i className="fas fa-check" style={{ color: 'green', fontSize: '20px', marginLeft: '5px' }}></i>
                                ) : (
                                  <i className="fas fa-times" style={{ color: 'red', fontSize: '20px', marginLeft: '5px' }}></i>
                                )}
                              </p>
                              <p style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
                                <strong>QR Code Deletion: </strong> 
                                {accessRight["QR Code"]["Delete QR Code"]? (
                                  <i className="fas fa-check" style={{ color: 'green', fontSize: '20px', marginLeft: '5px' }}></i>
                                ) : (
                                  <i className="fas fa-times" style={{ color: 'red', fontSize: '20px', marginLeft: '5px' }}></i>
                                )}
                              </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

                  )}
          </div>
        </div>
      </div>
    );
  }
  
}

export default AccountsSection;
