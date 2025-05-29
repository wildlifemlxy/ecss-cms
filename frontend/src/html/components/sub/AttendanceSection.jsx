import React, { Component } from 'react';
import axios from 'axios';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
import '../../../css/sub/attendance.css';

class AttendanceSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      attendanceData: [],
      loading: true,
      dataFetched: false,
      error: null,
      attendanceTypes: [],   // Store unique types here
      activityCodes: []      // Store unique activity codes here
    };
    
    this.gridApi = null;
    this.gridColumnApi = null;
  }

  async componentDidMount() {
       
      await this.fetchAttendance();
  }

  // Method to fetch attendance data
  fetchAttendance = async () => {
    try {
      // Show loading popup
      this.props.loadingPopup1();
      
      // Determine base URL based on environment
      const baseURL = window.location.hostname === "localhost" 
        ? "http://localhost:3001" 
        : "https://ecss-backend-node.azurewebsites.net";
      
      // Make request to your backend
      const response = await axios.post(`${baseURL}/attendance`, {
        purpose: "retrieveAll"
      });

      console.log("Attendance data response:", response.data);
      
      if (response.data && response.data.success) {
        // Process attendance data
        const attendanceData = response.data.data || [];
        console.log("Processed attendance data:", attendanceData);
        
        // Extract unique types and activity codes
        const uniqueTypes = ['All Types', ...new Set(attendanceData.map(record => record.type).filter(Boolean))];
        
        // Get unique activity codes (limiting to a reasonable number to avoid overwhelming the dropdown)
        const uniqueActivityCodes = ['All Codes', ...new Set(attendanceData.map(record => record.qrCode)
          .filter(Boolean)
          .slice(0, 50))]; // Limit to first 50 unique codes

        console.log("Unique types:", uniqueTypes);
        console.log("Unique activity codes:", uniqueActivityCodes);
      
        this.setState({
          attendanceData: attendanceData,
          loading: false,
          dataFetched: true,
          error: null
        });
        
        // Pass types to parent component if a callback is provided
        if (this.props.onTypesLoaded) {
          this.props.onTypesLoaded(uniqueTypes, uniqueActivityCodes);
        }
      } else {
        this.setState({
          loading: false,
          error: "No attendance data available",
          dataFetched: true
        });
      }
    this.props.closePopup1();
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      this.setState({
        loading: false,
        error: "Failed to load attendance data",
        dataFetched: true
      });
      this.props.closePopup1();
    }
  };


  // Add this method to handle viewing details
  handleViewDetails = (params) => {
    const recordId = params.data._id;
    console.log("Viewing details for record:", recordId);
    
    // Here you would implement logic to show a modal or details panel
    // for the selected attendance record
  }

  // Add method to apply filters from parent component
  filterAttendanceData = (type, activityCode, searchQuery) => {
    // Only proceed if we have a valid grid API
    if (!this.gridApi) {
      console.warn("Grid API not available yet");
      return;
    }
    
    console.log("Filtering with:", { type, activityCode, searchQuery });
    
    // Start with all data
    let filteredData = [...this.state.attendanceData];
    
    // Apply type filter if selected and not 'All Types'
    if (type && type !== 'All Types') {
      filteredData = filteredData.filter(record => record.type === type);
    }
    
    // Apply activity code filter if provided and not 'All Codes'
    if (activityCode && activityCode !== 'All Codes') {
      filteredData = filteredData.filter(record => 
        record.qrCode && record.qrCode.includes(activityCode)
      );
    }
    
    // Apply search query if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(record =>
        (record.name && record.name.toLowerCase().includes(query)) ||
        (record.nric && record.nric.toLowerCase().includes(query)) ||
        (record.qrCode && record.qrCode.toLowerCase().includes(query)) ||
        (record.type && record.type.toLowerCase().includes(query))
      );
    }
    
    console.log("Filtered data count:", filteredData.length);
    
    // Try different methods of updating the grid depending on AG Grid version
    try {
      // Method 1: Modern AG Grid
      this.gridApi.setGridOption('rowData', filteredData);
    } catch (err1) {
      console.warn("Couldn't use setGridOption method:", err1);
      try {
        // Method 2: Older AG Grid versions
        this.gridApi.setRowData(filteredData);
      } catch (err2) {
        console.warn("Couldn't use setRowData method:", err2);
        try {
          // Method 3: Alternative approach
          const rowNode = this.gridApi.getRenderedNodes();
          this.gridApi.refreshCells({ rowNodes: rowNode, force: true });
        } catch (err3) {
          console.error("All methods of updating grid data failed:", err3);
        }
      }
    }
  };

  // Add this to componentDidUpdate to handle filter changes
  componentDidUpdate(prevProps) {
    // Check if any filter props changed
    if (
      prevProps.attendanceType !== this.props.attendanceType ||
      prevProps.activityCode !== this.props.activityCode ||
      prevProps.searchQuery !== this.props.searchQuery
    ) {
      this.filterAttendanceData(
        this.props.attendanceType,
        this.props.activityCode,
        this.props.searchQuery
      );
    }
  }

  render() {
    ModuleRegistry.registerModules([AllCommunityModule]);
    const { attendanceData, loading, error } = this.state;
    
    // Define column definitions for the grid
    const columnDefs = [
      { 
        headerName: 'S/N', 
        valueGetter: (params) => params.node.rowIndex + 1,
        width: 70,
        suppressSizeToFit: true // Prevent this column from flexing
      },
      { 
        headerName: 'Name', 
        field: 'name', 
        width: 200,
        sortable: true,
        flex: 2 // Give name more space
      },
      { 
        headerName: 'NRIC', 
        field: 'nric', 
        width: 120,
        flex: 1
      },
      { 
        headerName: 'Type', 
        field: 'type', 
        width: 120,
        sortable: true,
        flex: 1
      },
      { 
        headerName: 'Activity Code', 
        field: 'qrCode', 
        width: 250,
        sortable: true,
        flex: 3,
        wrapText: true,
        cellStyle: { 
          whiteSpace: 'normal',
        }
      },
      { 
        headerName: 'Date', 
        field: 'date', 
        width: 120,
        sortable: true,
        flex: 1
      },
      { 
        headerName: 'Time', 
        field: 'time', 
        width: 120,
        sortable: true,
        flex: 1
      }
    ];
    
    return (
      <div className="attendance-container">
        <div className="attendance-heading">
          <h1>View Attendance</h1>
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}
          
          {!loading && attendanceData.length > 0 && (
            <div 
              className="ag-theme-alpine" 
              style={{ 
                height: '500px', 
                width: '100%' // Ensure this is 100%
              }}
            >
              <AgGridReact
                columnDefs={columnDefs}
                rowData={attendanceData}
                pagination={true}
                paginationPageSize={10}
                domLayout="normal"
                defaultColDef={{
                  resizable: true,
                  sortable: true
                }}
                onGridReady={(params) => {
                  console.log("Grid is ready, storing API reference");
                  this.gridApi = params.api;
                  this.gridColumnApi = params.columnApi;
                  
                  // Use this instead of sizeColumnsToFit to respect flex settings
                  params.api.sizeColumnsToFit();
                  
                  // If we already have filter criteria, apply it now that the grid is ready
                  if (this.props.attendanceType || this.props.activityCode || this.props.searchQuery) {
                    this.filterAttendanceData(
                      this.props.attendanceType,
                      this.props.activityCode,
                      this.props.searchQuery
                    );
                  }
                  
                  // Handle window resize to maintain full width
                  window.addEventListener('resize', () => {
                    setTimeout(() => {
                      params.api.sizeColumnsToFit();
                    });
                  });
                }}
                suppressColumnVirtualisation={true} // Ensure all columns are rendered
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default AttendanceSection;