import React, { Component } from 'react';
import WebDataRocks from "@webdatarocks/webdatarocks";
import "@webdatarocks/webdatarocks/webdatarocks.min.css";
import "../../../css/sub/attendance.css";
import "../../../css/homePage.css";

class AttendancePivotView extends Component {
  constructor(props) {
    super(props);
    this.webDataRocksInstance = null;
    this.containerRef = React.createRef();
    this.isInitializing = false; // Flag to prevent multiple initializations
    this.reinitializeTimeout = null; // Timeout for delayed reinitializations
  }

  componentDidMount() {
    // Initialize WebDataRocks when component mounts
    this.initializeWebDataRocks();
  }

  componentDidUpdate(prevProps) {
    // Re-initialize WebDataRocks if filteredData has changed
    // Use a better comparison method that's less prone to false positives
    const prevData = prevProps.filteredData || [];
    const currentData = this.props.filteredData || [];
    
    // First check simple length comparison
    if (prevData.length !== currentData.length) {
      console.log('Pivot data length changed, reinitializing WebDataRocks');
      this.reinitializeWithDelay();
      return;
    }
    
    // Only do deeper comparison if lengths are the same and > 0
    if (currentData.length > 0) {
      // Compare a subset of properties that are actually used in the pivot
      const prevDataSimplified = prevData.map(item => ({
        date: item.date || '',
        qrCode: item.qrCode || '',
        name: item.name || '',
        type: item.type || '',
        nric: item.nric || ''
      }));
      
      const currentDataSimplified = currentData.map(item => ({
        date: item.date || '',
        qrCode: item.qrCode || '',
        name: item.name || '',
        type: item.type || '',
        nric: item.nric || ''
      }));
      
      // Only compare if data is meaningful (avoid comparing empty arrays repeatedly)
      const prevDataString = JSON.stringify(prevDataSimplified);
      const currentDataString = JSON.stringify(currentDataSimplified);
      
      if (prevDataString !== currentDataString) {
        console.log('Pivot data content changed, reinitializing WebDataRocks');
        this.reinitializeWithDelay();
      }
    }
  }

  // Helper method to reinitialize with delay and prevent multiple calls
  reinitializeWithDelay = () => {
    // Clear any existing timeout
    if (this.reinitializeTimeout) {
      clearTimeout(this.reinitializeTimeout);
    }
    
    // Set a new timeout
    this.reinitializeTimeout = setTimeout(() => {
      this.initializeWebDataRocks();
      this.reinitializeTimeout = null;
    }, 100);
  }

  componentWillUnmount() {
    // Clean up WebDataRocks instance and any pending timeouts
    if (this.reinitializeTimeout) {
      clearTimeout(this.reinitializeTimeout);
      this.reinitializeTimeout = null;
    }
    this.cleanupWebDataRocks();
  }

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

  // Initialize WebDataRocks pivot table
  initializeWebDataRocks = () => {
    // Prevent multiple concurrent initializations
    if (this.isInitializing) {
      console.log('WebDataRocks already initializing, skipping...');
      return;
    }

    const container = this.containerRef.current;
    if (!container) {
      console.warn('Pivot container not found');
      return;
    }

    this.isInitializing = true;

    // Clean up any existing instance
    this.cleanupWebDataRocks();

    // Clear container content
    container.innerHTML = '';

    // Prepare data for WebDataRocks
    const { filteredData } = this.props;
    
    // Check if we have data to display
    if (!filteredData || filteredData.length === 0) {
      console.log('No data available for pivot table');
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No data available to display in pivot table</div>';
      this.isInitializing = false;
      return;
    }

    const data = filteredData.map(row => ({
      date: row.date || '',
      class_id: row.qrCode || '',
      location: this.getLocationFromClassId(row.qrCode),
      name: row.name || '',
      type: row.type || '',
      nric: row.nric || '',
      time: row.time || ''
    }));

    // Filter to only show the 3 specific locations
    const allowedLocations = [
      'CT Hub',
      'Tampines 253',
      'Tampines North Community Centre', 
      'Pasir Ris West Wellness Centre'
    ];
    
    const filteredLocationData = data.filter(row => 
      allowedLocations.includes(row.location)
    );

    console.log('Filtered data for allowed locations:', filteredLocationData);

    // Check if we have any data after filtering
    if (filteredLocationData.length === 0) {
      console.log('No data available for the specified locations');
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No data available for the specified locations (253, TNC, PRW)</div>';
      this.isInitializing = false;
      return;
    }

    console.log('Initializing WebDataRocks with filtered data:', filteredLocationData);

    try {
      // Initialize WebDataRocks
      this.webDataRocksInstance = new WebDataRocks({
        container: container,
        toolbar: false,
        height: 500,
        width: '100%',
        report: {
          dataSource: { data: filteredLocationData },
          slice: {
            rows: [
              { uniqueName: "location" },
              { uniqueName: "date" },
              { uniqueName: "class_id" },
              { uniqueName: "name" }
            ],
            measures: [
              { uniqueName: "name", aggregation: "count", caption: "Count" }
            ]
          },
          options: {
            grid: {
              type: "classic",
              showTotals: "on",
              showGrandTotals: "on",
              showHeaders: false,
              showFilter: true,
              showGrandTotalsRows: "on",
              showGrandTotalsColumns: "on",
              showTotalsRows: "on",
              showTotalsColumns: "on"
            }
          }
        },
        reportcomplete: () => {
          if (this.webDataRocksInstance) {
            this.webDataRocksInstance.off("reportcomplete");
            this.webDataRocksInstance.expandAllData();
            console.log('WebDataRocks pivot table initialized successfully');
          }
          // Reset the initialization flag
          this.isInitializing = false;
        }
      });
    } catch (error) {
      console.error('Error initializing WebDataRocks:', error);
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: #d32f2f;">Error loading pivot table. Please try refreshing the page.</div>';
      // Reset the initialization flag on error
      this.isInitializing = false;
    }
  };

  // Cleanup WebDataRocks instance
  cleanupWebDataRocks = () => {
    if (this.webDataRocksInstance) {
      try {
        // Properly dispose of WebDataRocks instance
        this.webDataRocksInstance.dispose();
      } catch (error) {
        console.warn('Error disposing WebDataRocks instance:', error);
      }
      this.webDataRocksInstance = null;
    }

    if (this.containerRef.current) {
      this.containerRef.current.innerHTML = '';
    }
    
    // Reset initialization flag
    this.isInitializing = false;
  };

  render() {
    return (
      <div 
        ref={this.containerRef}
        id="pivotContainer" 
        style={{ 
          width: '100%', 
          minHeight: 500, 
          margin: '24px 0',
          border: '1px solid #ddd'
        }}
      />
    );
  }
}

export default AttendancePivotView;
