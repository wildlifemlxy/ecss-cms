import React, { Component } from 'react';
import axios from 'axios';
import '../../../css/sub/receipt.css';

class ReceiptSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hideAllCells: false,
      receiptDetails: [],
      isLoading: true,
      inputValues: {},
      dropdownVisible: {}, // Store input values for each row
      filteredSuggestions: [],
      focusedInputIndex: null,
      originalData: [],
      currentPage: 1, // Add this
      entriesPerPage: 10 // Add this
    };
    this.tableRef = React.createRef();
  }

  handleEntriesPerPageChange = (e) => {
    this.setState({
      entriesPerPage: parseInt(e.target.value, 10),
      currentPage: 1 // Reset to the first page when changing entries per page
    });
  }

  getPaginatedDetails() {
    const { receiptDetails } = this.state;
    const { currentPage, entriesPerPage } = this.props;
    const indexOfLastCourse = currentPage * entriesPerPage;
    const indexOfFirstCourse = indexOfLastCourse - entriesPerPage;
    return receiptDetails.slice(indexOfFirstCourse, indexOfLastCourse);
  }

  fetchReceipt = async() =>
  {
    var response = await axios.post(`https://ecss-backend-node.azurewebsites.net/receipt`, { "purpose": "retrieve"});
    //var response = await axios.post(`http://localhost:3001/receipt`, { "purpose": "retrieve"});
    return response.data.result
  }


  async componentDidMount() 
  {
    const { language } = this.props;
    var data = await this.fetchReceipt();
    console.log(data);
    var locations = this.getAllLocations(data);
    console.log("Locations:", locations);
    var names = this.getAllNames(data);
    console.log("Names:", names);
    this.props.passDataToParent(locations, names);

    this.setState({
      originalData: data,
      receiptDetails: data, // Update with fetched dat
      isLoading: false,
      //inputValues: inputValues,  // Show dropdown for the focused input
      locations: locations, // Set locations in state
      names: names
    });

    await this.props.getTotalNumberofDetails(data.length);
    
    this.props.closePopup();
    //console.log('Data:', data);
    /*var locations = this.getAllLocations(data);
    var types = this.getAllType(data);
    this.props.passDataToParent(locations, types);

    const statuses = data.map(item => item.status); // Extract statuses
    console.log('Statuses:', statuses); // Log the array of statuses
    
    await this.props.getTotalNumberofDetails(data.length);

    // Initialize inputValues for each index based on fetched data
    const inputValues = {};
    data.forEach((item, index) => {
      inputValues[index] = item.status || "Pending"; // Use item.status or default to "Pending"
    });

    this.setState({
      originalData: data,
      receiptDetails: data, // Update with fetched dat
      isLoading: false, // Set loading to false after data is fetche
      inputValues: inputValues,  // Show dropdown for the focused input
      locations: locations, // Set locations in state
      types: types
    });
  
    this.props.closePopup();*/
  }
  
  

  async componentDidUpdate(prevProps) {
    const { selectedLocation, selectedCourseType, searchQuery} = this.props;
    if (selectedLocation !== prevProps.selectedLocation ||
      searchQuery !== prevProps.searchQuery 
    ) {
      this.filterRegistrationDetails();
    }
  }

 filterRegistrationDetails() {
    const { section } = this.props;

    if (section === "registration") {
        const { originalData } = this.state;
        const { selectedLocation, searchQuery } = this.props;

        // Reset filtered courses to all courses if the search query is empty
        if (selectedLocation === "All Loctions") {
            this.setState({ receiptDetails: originalData });
            return;
        }

        const normalizedSearchQuery = searchQuery ? searchQuery.toLowerCase().trim() : '';


        const filteredDetails = originalData.filter(data => {

          console.log("Substring:", data.receiptNo, selectedLocation,  data.receiptNo.includes(selectedLocation))
          const receiptNo = data.receiptNo?.toLowerCase().trim() || "";
          const staff = data.staff?.toLowerCase().trim() || "";
          const url = data.url?.toLowerCase().trim() || "";
          const date = data.date?.toLowerCase().trim() || "";
          const time = data.time?.toLowerCase().trim() || "";
          
            // Match 'All Languages' and 'All Locations'
            const matchesLocation = selectedLocation === "All Locations" || 
                selectedLocation === "所有语言" || 
                selectedLocation === "" || 
                !selectedLocation 
                ? true 
                : data.receiptNo.includes(selectedLocation);

            console.log("Matches:", matchesLocation);

            const matchesSearchQuery = normalizedSearchQuery
                ? (receiptNo.includes(normalizedSearchQuery) ||
                   staff.includes(normalizedSearchQuery) ||
                   url.includes(normalizedSearchQuery) ||
                   date.includes(normalizedSearchQuery) ||
                   time.includes(normalizedSearchQuery))
                : true;

            return matchesLocation && matchesSearchQuery;
        });

        // If filteredDetails is empty, set receiptDetails to an empty array
        this.setState({ receiptDetails: filteredDetails.length > 0 ? filteredDetails : [] });
    }
  }

  getAllLocations(datas) {
      return [...new Set(datas.map(data => {
        return data.receiptNo.split("-")[0].trim();
      }))];
    }

    getAllNames(datas) {
      return [...new Set(datas.map(data => {
        return data.staff;
      }))];
    }

    handleDownload = (receiptNumber, blobUrl) => {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${receiptNumber}.pdf`; // Set the default filename for download
        link.click(); // Programmatically click the link to trigger the download
  };

  render() {
    const { hideAllCells, receiptDetails, filteredSuggestions, currentInput, showSuggestions, focusedInputIndex } = this.state;
    const paginatedDetails = this.getPaginatedDetails();
    return (
      <div className="registration-payment-container">
        <div className="registration-payment-heading">
          <h1>{this.props.language === 'zh' ? '' : 'Receipt'}</h1>
          <div className="table-wrapper" ref={this.tableRef}>
            <table>
              <thead>
                <tr>
                  <th>{this.props.language === 'zh' ? '' : 'Receipt Number'}</th>
                  <th>{this.props.language === 'zh' ? '' : 'Receipt'}</th>
                  <th>{this.props.language === 'zh' ? '' : 'Staff Created'}</th>
                  <th>{this.props.language === 'zh' ? '' : 'Date Created'}</th>
                  <th>{this.props.language === 'zh' ? '' : 'Time Created'}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDetails.map((item, index) => (
                  <tr key={index}>
                    <td>{item.receiptNo}</td>
                    <td>
                        <a onClick={() => this.handleDownload(item.receiptNo, item.url)} >
                          <i className="fa-solid fa-receipt"></i>
                        </a>
                    </td>
                    <td>{item.staff}</td>
                    <td>{item.date}</td>
                    <td>{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default ReceiptSection;
