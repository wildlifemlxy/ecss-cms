import React, { Component } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import "../../../css/sub/attendance.css";
import "../../../css/homePage.css";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

class AttendanceTableView extends Component {
  // Extract location from class ID
  getLocationFromClassId = (classId) => {
    if (!classId) return 'Unknown';
    
    // Extract the first part before the first delimiter
    const locationCode = classId.split(/[-_|\/\\]/)[0].trim().toUpperCase();
    
    // Location mapping
    const locationMap = {
      'CTH': 'CT Hub',
      // Specific location mappings for filtering
      '253': 'Tampines 253',
      'TNC': 'Tampines North Community Centre',
      'PRW': 'Pasir Ris West Wellness Centre',
      // Add more location mappings as needed
    };
    
    return locationMap[locationCode] || locationCode;
  };

  // Move columnDefs to class property for efficiency
  columnDefs = [
    { headerName: 'S/N', valueGetter: (params) => params.node.rowIndex + 1,  width: 100, suppressSizeToFit: true },
    { headerName: 'Name', field: 'name', width: 300, sortable: true },
    { headerName: 'NRIC', field: 'nric', width: 200 },
    { headerName: 'Type', field: 'type', width: 200, sortable: true },
    { headerName: 'Location', valueGetter: (params) => this.getLocationFromClassId(params.data.qrCode), width: 400, sortable: true},
    { headerName: 'Activity Code', field: 'qrCode', width: 500, sortable: true, wrapText: true, cellStyle: { whiteSpace: 'normal' } },
    { headerName: 'Date', field: 'date', width: 200, sortable: true},
    { headerName: 'Time', field: 'time', width: 200, sortable: true }
  ];

  constructor(props) {
    super(props);
    this.gridApi = null;
    this.gridColumnApi = null;
  }

  // Store grid API reference for efficient data updates
  onGridReady = (params) => {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    
    // Size columns to fit on initial load
    params.api.sizeColumnsToFit();
    
    // Add resize listener for responsive behavior
    const handleResize = () => {
      setTimeout(() => {
        if (this.gridApi) {
          this.gridApi.sizeColumnsToFit();
        }
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    this.handleResize = handleResize;

    // Pass the grid API to parent if callback provided
    if (this.props.onGridReady) {
      this.props.onGridReady(params);
    }
  };

  // Method to update grid data externally
  updateGridData = (newData) => {
    if (this.gridApi) {
      this.gridApi.setRowData(newData);
    }
  };

  componentWillUnmount() {
    // Remove resize event listener
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }
  }

  render() {
    const { filteredData, gridKey } = this.props;
    
    return (
      <div className="grid-container1">
        <AgGridReact
          key={gridKey}
          columnDefs={this.columnDefs}
          rowData={filteredData}
          pagination={true}
          paginationPageSize={filteredData.length}
          domLayout="normal"
          defaultColDef={{ resizable: true, sortable: true }}
          onGridReady={this.onGridReady}
          suppressColumnVirtualisation={true}
        />
      </div>
    );
  }
}

export default AttendanceTableView;
