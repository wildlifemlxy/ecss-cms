import React, { Component } from 'react';
import axios from 'axios';
import AttendanceTableView from './AttendanceTableView';
import AttendancePivotView from './AttendancePivotView';
import "../../../css/sub/attendance.css";
import "../../../css/homePage.css";



class AttendanceSection extends Component {
  constructor(props) {
    super(props);
    
    // Load saved view preference from localStorage, default to table view if not found
    const savedView = localStorage.getItem('attendanceViewMode');
    const savedTab = localStorage.getItem('attendanceActiveTab');
    
    this.state = {
      attendanceData: [],
      loading: true,
      dataFetched: false,
      error: null,
      attendanceTypes: [],
      activityCodes: [],
      isPivotView: savedView === 'pivot', // Restore saved view or default to table
      activeTab: savedTab || 'all', // Restore saved tab or default to 'all'
      pivotTabs: [] // Store available tabs
    };
    
    this.gridApi = null;
    this.tableViewRef = React.createRef();
    this.isChangingView = false; // Flag to prevent multiple rapid view changes
    this.isChangingTab = false; // Flag to prevent multiple rapid tab changes
    this.cachedFilteredData = null; // Cache for filtered data
    this.lastFilterParams = null; // Track last filter parameters
  }

  // Handle grid ready from child component
  onGridReady = (params) => {
    this.gridApi = params.api;
    // Pass through to child component if needed
  };

  async componentDidMount() {
    const { isPivotView } = this.state;
    console.log(`Component mounted - loading ${isPivotView ? 'pivot' : 'table'} view (restored from localStorage)`);
    
    // Fetch data and let the component render the correct view based on saved state
    await this.fetchAttendance((attendanceData) => {
      const filteredData = this.getFilteredAttendanceData(attendanceData);
      console.log('Filtered data on mount:', filteredData);
    });
  }

  // Method to fetch attendance data
  fetchAttendance = async (onDataLoaded) => {
    try {
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
        
        // Get unique activity codes from filtered location data (limiting to a reasonable number to avoid overwhelming the dropdown)
        // First filter data to only show the 3 specific locations
        const allowedLocations = [
          'CT Hub',
          'Tampines 253',
          'Tampines North Community Centre', 
          'Pasir Ris West Wellness Centre'
        ];
        
        const filteredLocationData = attendanceData.filter(record => {
          const recordLocation = this.getLocationFromClassId(record.qrCode);
          return allowedLocations.includes(recordLocation);
        });
        
        // Get unique activity codes from filtered data only
        const allUniqueActivityCodes = [...new Set(filteredLocationData.map(record => record.qrCode).filter(Boolean))];
        const uniqueActivityCodes = ['All Codes', ...allUniqueActivityCodes.slice(0, 50)]; // Limit to first 50 unique codes

        // Extract unique locations
        const uniqueLocations = this.getUniqueLocations(attendanceData);

        console.log("Unique types:", uniqueTypes);
        console.log("Unique activity codes:", uniqueActivityCodes);
        console.log("Unique locations:", uniqueLocations);
      
        this.setState({
          attendanceData: attendanceData,
          loading: false,
          dataFetched: true,
          error: null
        }, () => {
          // Clear the cache when new data is loaded
          this.cachedFilteredData = null;
          this.lastFilterParams = null;
          
          // Validate and potentially reset tab if it doesn't exist in current data
          this.validateActiveTab();
          if (onDataLoaded) onDataLoaded(attendanceData);
        });
        
        // Pass types to parent component if a callback is provided
        if (this.props.onTypesLoaded) {
          this.props.onTypesLoaded(uniqueTypes, uniqueActivityCodes, uniqueLocations);
        }
      } else {
        this.setState({
          loading: false,
          error: "No attendance data available",
          dataFetched: true
        });
        if (onDataLoaded) onDataLoaded([]);
      }
    this.props.closePopup1();
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      this.setState({
        loading: false,
        error: "Failed to load attendance data",
        dataFetched: true
      });
      if (onDataLoaded) onDataLoaded([]);
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

  // Legacy method - keeping for reference but not used with WebDataRocks
  // getPivotDataSource = () => {
  //   return this.state.attendanceData.map(row => ({
  //     date: row.date || '',
  //     class_id: row.qrCode || '',
  //     name: row.name || ''
  //   }));
  // };

  // Method to extract tabs from class IDs
  getPivotTabs = () => {
    const { attendanceData } = this.state;
    const tabSet = new Set(['all']); // Always include 'all' tab
    const tabLabelMap = {
      'CTH': 'CT Hub',
      // Add more mappings here if needed
    };
    attendanceData.forEach(row => {
      const classId = row.qrCode || '';
      if (classId) {
        // Split by common delimiters and take first part
        const firstPart = classId.split(/[-_|\/\\]/)[0].trim();
        if (firstPart) {
          // Use mapped label if available
          tabSet.add(tabLabelMap[firstPart] || firstPart);
        }
      }
    });
    return Array.from(tabSet);
  };

  // Validate that the current active tab exists in available tabs
  validateActiveTab = () => {
    const availableTabs = this.getPivotTabs();
    if (!availableTabs.includes(this.state.activeTab)) {
      console.log(`Active tab '${this.state.activeTab}' not found in available tabs, resetting to 'all'`);
      this.setState({ activeTab: 'all' });
      localStorage.setItem('attendanceActiveTab', 'all');
    }
  };

  // Map tab label back to filter value for filtering
  getTabFilterValue = (tabLabel) => {
    const tabLabelMap = {
      'CTH': 'CT Hub',
      // Add more mappings here if needed
    };
    // Reverse lookup: if label matches, return key; else return label
    for (const [key, value] of Object.entries(tabLabelMap)) {
      if (value === tabLabel) return key;
    }
    return tabLabel;
  };

  // Filter data based on active tab
  getFilteredDataForTab = (tabName) => {
    const { attendanceData } = this.state;
    if (tabName === 'all') {
      return attendanceData;
    }
    // Map tab label back to filter value
    const filterValue = this.getTabFilterValue(tabName);
    return attendanceData.filter(row => {
      const classId = row.qrCode || '';
      const firstPart = classId.split(/[-_|\/\\]/)[0].trim();
      return firstPart === filterValue;
    });
  };

  // Render external tabs above the table (horizontal, styled like button-row4/view-btn)
  renderExternalTabs = () => {
    const { activeTab } = this.state;
    const tabs = this.getPivotTabs();
    return (
      <div className="button-row5" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: 0, marginRight: 0, minWidth: '110px' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? 'view-btn active-tab-btn' : 'view-btn'}
            style={{
              padding: '8px 20px',
              margin: '2px 0',
              fontSize: '20px',
              minHeight: '44px',
              lineHeight: '1.3',
              width: 'fit-content',
              textAlign: 'center',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              backgroundColor: activeTab === tab ? '#263238' : undefined,
              color: activeTab === tab ? '#fff' : undefined,
              outline: activeTab === tab ? '2px solid #263238' : 'none',
              boxShadow: activeTab === tab ? '0 2px 8px #bbb' : 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.3s ease',
              overflow: 'visible'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              this.handleTabChange(tab);
            }}
            disabled={this.isChangingTab}
            onMouseOver={e => {
              if (activeTab !== tab) {
                e.target.style.backgroundColor = '#e0e0e0';
              }
            }}
            onMouseOut={e => {
              if (activeTab !== tab) {
                e.target.style.backgroundColor = '';
              }
            }}
          >
            {tab === 'all' ? 'All Locations' : tab}
          </button>
        ))}
        <button className="save-btn" onClick={() => this.saveData()}>
          Export To Excel
        </button>
      </div>
    );
  };

  // Updated getGroupedPivotData to work with filtered data
  getGroupedPivotData = (filteredData = null) => {
    const dataToUse = filteredData || this.getFilteredDataForTab(this.state.activeTab);
    const grouped = {};
    
    dataToUse.forEach(row => {
      const date = row.date || '';
      const class_id = row.qrCode || '';
      const name = row.name || '';
      if (!grouped[date]) grouped[date] = {};
      if (!grouped[date][class_id]) grouped[date][class_id] = [];
      grouped[date][class_id].push(name);
    });
    
    return grouped;
  };

  // Handle tab change
  handleTabChange = (tabName) => {
    // Prevent multiple rapid tab changes
    if (this.isChangingTab) {
      console.log('Tab change already in progress, ignoring duplicate call');
      return;
    }
    
    this.isChangingTab = true;
    console.log('Changing tab to:', tabName);
    
    this.setState({ activeTab: tabName }, () => {
      // Save the active tab to localStorage
      localStorage.setItem('attendanceActiveTab', tabName);
      
      // Reset the flag after state update is complete
      setTimeout(() => {
        this.isChangingTab = false;
      }, 100);
    });
  };

  // Render tab navigation
  renderTabNavigation = () => {
    const { activeTab } = this.state;
    const tabs = this.getPivotTabs();
    
    return (
      <div style={{ 
        display: 'flex', 
        marginBottom: '20px', 
        borderBottom: '2px solid #ddd',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              this.handleTabChange(tab);
            }}
            disabled={this.isChangingTab}
            style={{
              padding: '10px 20px',
              margin: '0 5px',
              border: 'none',
              backgroundColor: activeTab === tab ? '#263238' : '#f5f5f5',
              color: activeTab === tab ? '#fff' : '#333',
              cursor: 'pointer',
              borderRadius: '5px 5px 0 0',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              if (activeTab !== tab) {
                e.target.style.backgroundColor = '#e0e0e0';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== tab) {
                e.target.style.backgroundColor = '#f5f5f5';
              }
            }}
          >
            {tab === 'all' ? 'All Classes' : tab}
          </button>
        ))}
      </div>
    );
  };

  // Updated renderPivotTable method
  renderPivotTable = () => {
    const filteredData = this.getFilteredAttendanceData();
    const grouped = this.getGroupedPivotData(filteredData);
    let grandTotal = 0;
    const rows = [];
    
    Object.entries(grouped).forEach(([date, classGroups]) => {
      let dateTotal = 0;
      
      // Add date header row
      rows.push(
        <tr key={`${date}-header`} style={{ fontWeight: 'bold', background: '#f5f5f5', borderTop: '2px solid #ddd' }}>
          <td colSpan={4} style={{ padding: '8px 12px', textAlign: 'left' }}>{date}</td>
        </tr>
      );
      
      Object.entries(classGroups).forEach(([class_id, names]) => {
        const count = names.length;
        dateTotal += count;
        grandTotal += count;
        
        // Add class header row
        rows.push(
          <tr key={`${date}-${class_id}-header`} style={{ fontWeight: 'bold', background: '#e8e8e8' }}>
            <td></td>
            <td colSpan={3} style={{ padding: '8px 12px', textAlign: 'left' }}>{class_id}</td>
          </tr>
        );
        
        // Add all individual name rows (fully expanded)
        names.forEach((name, i) => {
          rows.push(
            <tr key={`${date}-${class_id}-${i}`}>
              <td></td>
              <td></td>
              <td style={{ padding: '8px 12px' }}>{name}</td>
              <td style={{ padding: '8px 12px', textAlign: 'center' }}>1</td>
            </tr>
          );
        });
        
        // Subtotal for class_id
        rows.push(
          <tr key={`${date}-${class_id}-subtotal`} style={{ fontWeight: 'bold', background: '#e3f2fd' }}>
            <td></td>
            <td></td>
            <td style={{ textAlign: 'right', padding: '8px 12px' }}>Subtotal for {class_id}:</td>
            <td style={{ textAlign: 'center', padding: '8px 12px' }}>{count}</td>
          </tr>
        );
      });
      
      // Total for date
      rows.push(
        <tr key={`${date}-total`} style={{ fontWeight: 'bold', background: '#bbdefb' }}>
          <td colSpan={3} style={{ textAlign: 'right', padding: '8px 12px' }}>Total for {date}:</td>
          <td style={{ textAlign: 'center', padding: '8px 12px' }}>{dateTotal}</td>
        </tr>
      );
    });
    
    // Grand total row
    rows.push(
      <tr key="grand-total" style={{ fontWeight: 'bold', background: '#90caf9' }}>
        <td colSpan={3} style={{ textAlign: 'right', padding: '8px 12px' }}>Grand Total:</td>
        <td style={{ textAlign: 'center', padding: '8px 12px' }}>{grandTotal}</td>
      </tr>
    );
    
    return (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: 200, width: '100%' }}>
          <table style={{ 
            borderCollapse: 'collapse', 
            margin: '0 auto', 
            minWidth: 500, 
            maxWidth: 900, 
            background: '#fff', 
            boxShadow: '0 2px 8px #eee', 
            border: '1px solid #ddd' 
          }}>
            <thead>
              <tr style={{ background: '#263238', color: '#fff' }}>
                <th style={{ padding: '8px 12px', border: '1px solid #ddd', width: '15%' }}>Date</th>
                <th style={{ padding: '8px 12px', border: '1px solid #ddd', width: '25%' }}>Class ID</th>
                <th style={{ padding: '8px 12px', border: '1px solid #ddd', width: '45%' }}>Name</th>
                <th style={{ padding: '8px 12px', border: '1px solid #ddd', width: '15%' }}>Count of Name</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
      </div>
    );
  }

  changeView = () => {
    // Prevent multiple rapid executions
    if (this.isChangingView) {
      console.log('View change already in progress, ignoring duplicate call');
      return;
    }
    
    this.isChangingView = true;
    const nextView = !this.state.isPivotView;
    console.log('Changing view to:', nextView ? 'Pivot' : 'Table');
    
    this.setState({ 
      isPivotView: nextView 
    }, () => {
      // Save the view preference to localStorage
      localStorage.setItem('attendanceViewMode', nextView ? 'pivot' : 'table');
      
      // Reset the flag after state update is complete
      setTimeout(() => {
        this.isChangingView = false;
      }, 100);
    });
  };

  // Method to trigger a parent refresh (if provided)
  refreshChild = async () => {
    try {
      // Keep current view preference on refresh, don't force table view
      this.setState({ 
        loading: true 
      });

      // Determine base URL based on environment
      const baseURL = window.location.hostname === "localhost" 
        ? "http://localhost:3001" 
        : "https://ecss-backend-node.azurewebsites.net";
      
      // Make request to your backend to fetch fresh data
      const response = await axios.post(`${baseURL}/attendance`, {
        purpose: "retrieveAll"
      });

      console.log("Refreshing attendance data:", response.data);
      
      if (response.data && response.data.success) {
        const attendanceData = response.data.data || [];
        
        // Extract unique types and activity codes for parent updates
        const uniqueTypes = ['All Types', ...new Set(attendanceData.map(record => record.type).filter(Boolean))];
        const uniqueActivityCodes = ['All Codes', ...new Set(attendanceData.map(record => record.qrCode)
          .filter(Boolean)
          .slice(0, 50))];
        const uniqueLocations = this.getUniqueLocations(attendanceData);

        // Update state with new data while preserving view preference
        this.setState({
          attendanceData: attendanceData,
          loading: false,
          dataFetched: true,
          error: null
          // Don't modify isPivotView - keep user's current preference
        }, () => {
          // Clear the cache when new data is loaded
          this.cachedFilteredData = null;
          this.lastFilterParams = null;
        });

        // Update grid data if in table view
        if (!this.state.isPivotView && this.tableViewRef.current && this.tableViewRef.current.updateGridData) {
          const filteredData = this.getFilteredAttendanceData(attendanceData);
          this.tableViewRef.current.updateGridData(filteredData);
        }

        // Pass updated types to parent component if callback is provided
        if (this.props.onTypesLoaded) {
          this.props.onTypesLoaded(uniqueTypes, uniqueActivityCodes, uniqueLocations);
        }

        // Close popup
        this.props.closePopup1();
      } else {
        this.setState({
          loading: false,
          error: "No attendance data available",
          dataFetched: true
          // Don't modify isPivotView - keep user's current preference
        });
        this.props.closePopup1();
      }
    } catch (error) {
      console.error("Error refreshing attendance data:", error);
      this.setState({
        loading: false,
        error: "Failed to refresh attendance data",
        dataFetched: true
        // Don't modify isPivotView - keep user's current preference
      });
      this.props.closePopup1();
    }
  }

  // Optional: Method to reset view preferences (useful for debugging or user reset)
  resetViewPreferences = () => {
    localStorage.removeItem('attendanceViewMode');
    localStorage.removeItem('attendanceActiveTab');
    this.setState({
      isPivotView: false,
      activeTab: 'all'
    });
    console.log('View preferences reset to defaults');
  };

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

  // Extract unique locations from attendance data
  getUniqueLocations = (attendanceData) => {
    // Only show the 3 specific locations plus "All Locations"
    const allowedLocations = [
      'All Locations',
      'CT Hub',
      'Tampines 253',
      'Tampines North Community Centre', 
      'Pasir Ris West Wellness Centre'
    ];
    
    const locationSet = new Set(['All Locations']);
    
    attendanceData.forEach(record => {
      if (record.qrCode) {
        const location = this.getLocationFromClassId(record.qrCode);
        if (location && location !== 'Unknown' && allowedLocations.includes(location)) {
          locationSet.add(location);
        }
      }
    });
    
    return Array.from(locationSet);
  };

  // Centralized filtering logic for attendance data with caching
  getFilteredAttendanceData = (attendanceDataOverride = null) => {
    const { attendanceType, activityCode, searchQuery, selectedLocation } = this.props;
    const attendanceData = attendanceDataOverride || this.state.attendanceData;
    
    // Create a cache key from filter parameters
    const filterParams = {
      attendanceType: attendanceType || '',
      activityCode: activityCode || '', 
      searchQuery: searchQuery || '',
      selectedLocation: selectedLocation || '',
      dataLength: attendanceData.length,
      dataHash: attendanceData.length > 0 ? JSON.stringify(attendanceData.slice(0, 3)) : '' // Sample hash
    };
    
    // Check if we can use cached data
    if (this.cachedFilteredData && this.lastFilterParams && 
        JSON.stringify(filterParams) === JSON.stringify(this.lastFilterParams)) {
      console.log('[AttendanceSection] Using cached filtered data');
      return this.cachedFilteredData;
    }
    
    console.log('[AttendanceSection] Computing new filtered data');
    console.log('[AttendanceSection] attendanceType:', attendanceType);
    console.log('[AttendanceSection] activityCode:', activityCode);
    console.log('[AttendanceSection] searchQuery:', searchQuery);
    console.log('[AttendanceSection] selectedLocation:', selectedLocation);
    console.log('[AttendanceSection] attendanceData length:', attendanceData.length);

    let filteredData = [...attendanceData];

    // FIRST: Filter to only show the 3 specific locations
    const allowedLocations = [
      'CT Hub',
      'Tampines 253',
      'Tampines North Community Centre', 
      'Pasir Ris West Wellness Centre'
    ];
    
    filteredData = filteredData.filter(record => {
      const recordLocation = this.getLocationFromClassId(record.qrCode);
      return allowedLocations.includes(recordLocation);
    });
    
    console.log('[AttendanceSection] After location filtering, records:', filteredData.length);

    // Filter by attendance type if not 'All Types'
    if (attendanceType && attendanceType !== 'All Types') {
      filteredData = filteredData.filter(record => record.type === attendanceType);
    }
    // Filter by activity code if not 'All Codes'
    if (activityCode && activityCode !== 'All Codes') {
      filteredData = filteredData.filter(record =>
        record.qrCode && record.qrCode.includes(activityCode)
      );
    }
    // Filter by location if not 'All Locations'
    if (selectedLocation && selectedLocation !== 'All Locations') {
      filteredData = filteredData.filter(record => {
        const recordLocation = this.getLocationFromClassId(record.qrCode);
        return recordLocation === selectedLocation;
      });
    }
    // Filter by search query if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(record => {
        // Extract location for search
        const location = this.getLocationFromClassId(record.qrCode);
        
        return (
          (record.name && record.name.toLowerCase().includes(query)) ||
          (record.nric && record.nric.toLowerCase().includes(query)) ||
          (record.qrCode && record.qrCode.toLowerCase().includes(query)) ||
          (record.type && record.type.toLowerCase().includes(query)) ||
          (location && location.toLowerCase().includes(query))
        );
      });
    }
    
    // Cache the result
    this.cachedFilteredData = filteredData;
    this.lastFilterParams = filterParams;
    
    console.log('[AttendanceSection] filteredData length:', filteredData.length);
    return filteredData;
  };

  // Method to manually clear the filtered data cache (useful for debugging)
  clearFilterCache = () => {
    this.cachedFilteredData = null;
    this.lastFilterParams = null;
    console.log('Filter cache cleared');
  };

  render() {
    const { attendanceData, loading, error, isPivotView } = this.state;
    const filteredData = this.getFilteredAttendanceData();
    const gridKey = `attendance-grid-${this.props.attendanceType}-${this.props.activityCode}-${this.props.searchQuery}-${this.props.selectedLocation}`;

    console.log('attendanceData:', this.state.attendanceData);
    console.log('filteredData:', filteredData);
    console.log('isPivotView:', isPivotView);
    
    return (
      <div className="attendance-container">
        <div className="attendance-heading">
          <h1>{this.props.language === 'zh' ? '' : 'View Attendance'}</h1>
          <div className="button-row4" style={{marginLeft: '0px', width: '20%'}}>
            <button 
              className="view-btn" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                this.changeView();
              }}
              disabled={this.isChangingView}
            >
              {isPivotView ? 'Table View' : 'Pivot Table'}
            </button>
            <button className="save-btn" onClick={() => this.saveData()}>
              Export To Excel
            </button>
          </div>
        </div>
        
        {/* Use the separated components for clean conditional rendering */}
        {isPivotView ? (
          <AttendancePivotView 
            filteredData={filteredData}
          />
        ) : (
          <AttendanceTableView 
            ref={this.tableViewRef}
            filteredData={filteredData}
            gridKey={gridKey}
            onGridReady={this.onGridReady}
          />
        )}
      </div>
    );
  }
}

export default AttendanceSection;