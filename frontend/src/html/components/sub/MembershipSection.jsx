import React, { Component } from 'react';
import axios from 'axios';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import "../../../css/sub/membership.css";
import "../../../css/homePage.css";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const baseURL = window.location.hostname === "localhost" 
  ? "http://localhost:3001" 
  : "https://ecss-backend-node.azurewebsites.net";

class MembershipSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      membershipData: [],
      loading: true,
      error: null,
      columnDefs: this.getColumnDefs(),
      originalData: [],
      rowData: []
    };
  }

  // Define column definitions for the membership table
  getColumnDefs = () => {
    console.log('Generating column definitions for membership data');
    return [
      {
        headerName: "S/N",
        field: "sn",
        width: 150,
        sortable: true,
        pinned: 'left'
      },
      {
        headerName: "Name",
        field: "particular.name",
        width: 250,
        sortable: true,
        pinned: 'left',
      },
      {
        headerName: "Contact Number",
        field: "particular.contactNumber",
        width: 200,
        sortable: true
      },
      {
        headerName: "Race",
        field: "particular.race",
        width: 150,
        sortable: true
      },
      {
        headerName: "Gender",
        field: "particular.gender",
        width: 120,
        sortable: true
      },
      {
        headerName: "Email",
        field: "particular.email",
        width: 250,
        sortable: true
      },
      {
        headerName: "Date of Birth",
        field: "particular.dateOfBirth",
        width: 150,
        sortable: true
      },
      {
        headerName: "Membership Type",
        field: "type",
        width: 300,
        sortable: true,
        pinned: 'right',
        cellStyle: (params) => {
          return {
            backgroundColor: this.getTypeColor(params.value),
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
            borderRadius: "15px",
            paddingLeft: "10px",
            paddingRight: "10px"
          };
        }
      }
    ];
  };

  // Get type color for styling
  getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'member':
        return '#4CAF50'; // Green
      case 'volunteer':
        return '#2196F3'; // Blue
      case 'participant':
        return '#FF9800'; // Orange
      default:
        return '#607D8B'; // Blue Grey
    }
  };

  // Extract all unique membership types from the data
  getAllMembershipTypes = (data) => {
    console.log('Extracting membership types from data:', data);
    // Extract unique types
    const types = [...new Set(data.map(item => item.type))].filter(Boolean);
    console.log('Unique membership types found:', types);
    return types;
  };

  async componentDidMount() {
    // Initialize columnDefs here to avoid circular reference
    this.setState({ columnDefs: this.getColumnDefs() });
    await this.fetchMembershipData();
    this.props.closePopup1()
  }

  componentDidUpdate(prevProps) {
    // Only filter when membershipType or searchQuery props change
    if (
      prevProps.membershipType !== this.props.membershipType ||
      prevProps.searchQuery !== this.props.searchQuery
    ) {
      // If membershipType is 'All Types' and searchQuery is empty, show all data (reset)
      if (
        (this.props.membershipType === 'All Types' || !this.props.membershipType) &&
        (!this.props.searchQuery || this.props.searchQuery === '')
      ) {
        // Show all data without filtering, but also reassign S/N
        const allDataWithSN = this.state.membershipData.map((item, index) => ({
          ...item,
          sn: index + 1
        }));
        this.setState({ rowData: allDataWithSN });
      } else {
        this.filterMembershipData();
      }
      this.props.closePopup1();
    }
  }

  // Filter membership data based on selected filters
  filterMembershipData = () => {
    const { membershipType, searchQuery } = this.props;
    const { membershipData } = this.state;

    console.log('Filtering membership data with:', { membershipType, searchQuery });
    console.log('Initial membership data length:', membershipData);

    let filteredData = [...membershipData];

    // Normalize membershipType value for comparison
    let typeValue = '';
    if (typeof membershipType === 'string') {
      typeValue = membershipType;
    } else if (membershipType && typeof membershipType === 'object' && membershipType.membershipType) {
      typeValue = membershipType.membershipType;
    }

    // Filter by membership type if not 'All Types'
    if (typeValue && typeValue !== 'All Types') {
      filteredData = filteredData.filter(record =>
        record.type && record.type.toLowerCase() === typeValue.toLowerCase()
      );
    }

    // Filter by search query if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(record => {
        const particular = record.particular || {};
        return (
          (particular.name && particular.name.toLowerCase().includes(query)) ||
          (particular.contactNumber && particular.contactNumber.toLowerCase().includes(query)) ||
          (particular.email && particular.email.toLowerCase().includes(query)) ||
          (particular.race && particular.race.toLowerCase().includes(query)) ||
          (particular.gender && particular.gender.toLowerCase().includes(query)) ||
          (record.type && record.type.toLowerCase().includes(query))
        );
      });
    }

    console.log('Filtered membership data:', filteredData.length, 'records');

    // Reassign S/N numbers for filtered data
    const filteredDataWithCorrectSN = filteredData.map((item, index) => ({
      ...item,
      sn: index + 1
    }));

    this.setState({
      rowData: filteredDataWithCorrectSN
    });
  };
  
  fetchMembershipData = async (reset = false) => {
    try {
      this.setState({ loading: true });

      const response = await axios.post(`${baseURL}/membership`, {
        purpose: "retrieveAll"
      });

      let processedData = [];
      if (response.data && response.data.data) {
        processedData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        processedData = response.data;
      } else if (response.data && response.data.details) {
        processedData = response.data.details;
      }

      const dataWithSN = processedData.map((item, index) => ({
        ...item,
        sn: index + 1
      }));

      const types = this.getAllMembershipTypes(dataWithSN);
      if (this.props.passDataToParent) {
        this.props.passDataToParent(types, null, null, null);
      }

        this.setState({
          membershipData: dataWithSN,
          rowData: dataWithSN,
          originalData: dataWithSN,
          loading: false
        });

    } catch (error) {
      console.error('Error fetching membership data:', error);
      this.setState({
        error: 'Failed to load membership data. Please try again later.',
        loading: false
      });
    }
  }

  refreshMembershipData = async () => {
x    // First reset the state directly - this ensures we're not using stale filter info
    this.setState({
      loading: true
    });
    
    // Wait for the data fetch with reset=true 
    await this.fetchMembershipData(true);
    
    // Force an additional reset of the data to ensure it's unfiltered
    const allDataWithSN = this.state.membershipData.map((item, index) => ({
      ...item,
      sn: index + 1
    }));
    
    // Set the data again to ensure no filters are applied
    this.setState({
      rowData: allDataWithSN
    }, () => {
      this.props.closePopup1();
    });
  };

  render() 
  {
    const { loading, error, columnDefs, rowData } = this.state;

    return (
      <div className="membership-container">
        <div className="membership-heading">
          <h1>{this.props.language === 'zh' ? '会员' : 'Membership'}</h1>
          <div className="grid-container1">
            <AgGridReact
              columnDefs={columnDefs}
              rowData={rowData}
              pagination={true}
              paginationPageSize={rowData.length}
              domLayout="normal"
              defaultColDef={{
                resizable: true,
                sortable: true
              }}
              onGridReady={(params) => {
                params.api.sizeColumnsToFit();
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default MembershipSection;
