import React, { Component } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { graphScopes } from '../../../utils/authConfig';
import AttendanceTableView from './AttendanceTableView';
import AttendancePivotView from './AttendancePivotView';
import "../../../css/sub/attendance.css";
import "../../../css/homePage.css";

const baseURL = window.location.hostname === "localhost" 
  ? "http://localhost:3001" 
  : "https://ecss-backend-node.azurewebsites.net";


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
    
    // Add reference to store pivot export functions
    this.pivotExportFunctions = null;
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
        
        // Get unique activity codes from filtered location data
        // Filter data to show specific locations
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
        const uniqueActivityCodes = ['All Codes', ...allUniqueActivityCodes.slice(0, 50)];

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

  // Render external tabs above the table
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
        
        // Add all individual name rows
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

  // Method to trigger a parent refresh
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

  // Method to reset view preferences
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

    // Filter to show specific locations
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

  // Method to manually clear the filtered data cache
  clearFilterCache = () => {
    this.cachedFilteredData = null;
    this.lastFilterParams = null;
    console.log('Filter cache cleared');
  };

  // Create summary sheet for Excel export
  createSummarySheet = (data) => {
    const specificLocations = ['CT Hub', 'Tampines 253', 'Tampines North Community Centre', 'Pasir Ris West Wellness Centre'];
    const summaryData = [];
    
    // Overall summary
    summaryData.push({
      'Metric': 'Total Attendance Records',
      'Count': data.length,
      'Percentage': '100%'
    });
    
    // Location summary
    const locationTotals = {};
    data.forEach(record => {
      const location = this.getLocationFromClassId(record.qrCode);
      locationTotals[location] = (locationTotals[location] || 0) + 1;
    });
    
    summaryData.push({
      'Metric': '',
      'Count': '',
      'Percentage': ''
    });
    
    summaryData.push({
      'Metric': 'LOCATION BREAKDOWN',
      'Count': '',
      'Percentage': ''
    });
    
    Object.entries(locationTotals)
      .sort(([,a], [,b]) => b - a)
      .forEach(([location, count]) => {
        const percentage = ((count / data.length) * 100).toFixed(1);
        summaryData.push({
          'Metric': location,
          'Count': count,
          'Percentage': `${percentage}%`
        });
      });
    
    // Date summary (top 10 dates)
    const dateTotals = {};
    data.forEach(record => {
      const date = record.date || 'Unknown Date';
      dateTotals[date] = (dateTotals[date] || 0) + 1;
    });
    
    summaryData.push({
      'Metric': '',
      'Count': '',
      'Percentage': ''
    });
    
    summaryData.push({
      'Metric': 'TOP EVENT DATES',
      'Count': '',
      'Percentage': ''
    });
    
    Object.entries(dateTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([date, count]) => {
        const percentage = ((count / data.length) * 100).toFixed(1);
        summaryData.push({
          'Metric': date,
          'Count': count,
          'Percentage': `${percentage}%`
        });
      });
    
    // Class summary (top 10 classes)
    const classTotals = {};
    data.forEach(record => {
      const classId = record.qrCode || 'Unknown Class';
      classTotals[classId] = (classTotals[classId] || 0) + 1;
    });
    
    summaryData.push({
      'Metric': '',
      'Count': '',
      'Percentage': ''
    });
    
    summaryData.push({
      'Metric': 'TOP CLASSES',
      'Count': '',
      'Percentage': ''
    });
    
    Object.entries(classTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([classId, count]) => {
        const percentage = ((count / data.length) * 100).toFixed(1);
        summaryData.push({
          'Metric': classId,
          'Count': count,
          'Percentage': `${percentage}%`
        });
      });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    
    // Auto-width columns
    const colWidths = [
      { wch: 40 }, // Metric column
      { wch: 15 }, // Count column
      { wch: 15 }  // Percentage column
    ];
    worksheet['!cols'] = colWidths;

    // Apply styling
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) continue;
        
        const cellValue = worksheet[cellAddress].v;
        
        // Header row styling (first row)
        if (R === range.s.r) {
          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "2E7D32" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "medium", color: { rgb: "000000" } },
              bottom: { style: "medium", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
        }
        // Section headers (LOCATION BREAKDOWN, TOP EVENT DATES, etc.)
        else if (cellValue && typeof cellValue === 'string' && (cellValue.includes('BREAKDOWN') || cellValue.includes('TOP '))) {
          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "1565C0" } },
            alignment: { horizontal: "left", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "CCCCCC" } },
              bottom: { style: "thin", color: { rgb: "CCCCCC" } },
              left: { style: "thin", color: { rgb: "CCCCCC" } },
              right: { style: "thin", color: { rgb: "CCCCCC" } }
            }
          };
        }
        // Regular data cells
        else if (cellValue !== '') {
          worksheet[cellAddress].s = {
            alignment: { horizontal: C === 0 ? "left" : "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "CCCCCC" } },
              bottom: { style: "thin", color: { rgb: "CCCCCC" } },
              left: { style: "thin", color: { rgb: "CCCCCC" } },
              right: { style: "thin", color: { rgb: "CCCCCC" } }
            }
          };
          
          // Alternate row background for data rows
          if ((R - 1) % 2 === 1) {
            worksheet[cellAddress].s.fill = { fgColor: { rgb: "F5F5F5" } };
          }
        }
      }
    }

    return worksheet;
  };

  

  // Direct download method - simplified
  exportDirectDownload = async (data) => {
    const loadingDiv = this.createLoadingIndicator('Generating Excel file...', data.length);
    document.body.appendChild(loadingDiv);

    try {
      console.log('🔄 Starting direct Excel download...');
      
      const response = await axios.post(`${baseURL}/export-excel-direct`, {
        data: data
      }, {
        responseType: 'blob',
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      link.download = `attendance_report_${timestamp}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert(`✅ Excel file downloaded successfully!\n\n📊 ${data.length.toLocaleString()} records exported`);
      
    } catch (error) {
      console.error('❌ Direct download error:', error);
      
      if (error.response?.status === 413) {
        alert('❌ Dataset too large for direct export.\nTry filtering the data to reduce size.');
      } else if (error.code === 'ECONNABORTED') {
        alert('⏱️ Export timeout. The dataset might be too large.');
      } else {
        alert(`❌ Direct download failed: ${error.message}`);
      }
    } finally {
      if (document.body.contains(loadingDiv)) {
        document.body.removeChild(loadingDiv);
      }
    }
  };

  // Helper method to create loading indicator
  createLoadingIndicator = (message, recordCount) => {
    const loadingDiv = document.createElement('div');
    loadingDiv.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  background: white; padding: 20px; border: 2px solid #0078d4; border-radius: 8px; 
                  box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000; text-align: center;">
        <div style="margin-bottom: 15px;">
          <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0078d4; 
                      border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        </div>
        <p style="margin: 10px 0; font-weight: bold; color: #0078d4;">${message}</p>
        <p style="font-size: 12px; color: #666;">${recordCount.toLocaleString()} records</p>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          </style>
        </div>
      `;
    return loadingDiv;
  };

 // Helper function to create column-based pivot table
createColumnBasedPivotTable = (data, sheetName) => {
  const grouped = this.getGroupedPivotData(data);
  const pivotData = [];
  
  // Create rows with structure: Location, Date, Class_ID, Name, Count
  Object.entries(grouped).forEach(([date, classGroups]) => {
    Object.entries(classGroups).forEach(([class_id, names]) => {
      const location = this.getLocationFromClassId(class_id);
      
      // Create one row for each name
      names.forEach(name => {
        pivotData.push({
          'Location': location,
          'Date': date,
          'Class_ID': class_id,
          'Name': name,
          'Count': 1
        });
      });
    });
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(pivotData);
  
  // Auto-width all columns based on content
  const sheetRange = XLSX.utils.decode_range(worksheet['!ref']);
  const colWidths = [];
  
  for (let C = sheetRange.s.c; C <= sheetRange.e.c; ++C) {
    let maxWidth = 10; // minimum width
    
    for (let R = sheetRange.s.r; R <= sheetRange.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (worksheet[cellAddress] && worksheet[cellAddress].v) {
        const cellLength = String(worksheet[cellAddress].v).length;
        maxWidth = Math.max(maxWidth, cellLength + 2);
      }
    }
    
    colWidths.push({ wch: Math.min(maxWidth, 50) }); // max width 50
  }
  
  worksheet['!cols'] = colWidths;

  // Apply styling
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;
      
      const cellValue = worksheet[cellAddress].v;
      
      // Header row styling (first row)
      if (R === range.s.r) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4CAF50" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
      // Data cells styling
      else if (R >= 0 && R < range.e.r) {
        worksheet[cellAddress].s = {
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } }
          }
        };
        
        // Alternate row background
        if ((R - 1) % 2 === 1) {
          worksheet[cellAddress].s.fill = { fgColor: { rgb: "F5F5F5" } };
        }
      }
    }
  }

  return worksheet;
};

// Create raw data sheet for a specific location
createRawDataSheet = (data) => {
  const rawData = data.map(record => ({
    'Name': record.name || '',
    'NRIC': record.nric || '',
    'Class ID': record.qrCode || '',
    'Type': record.type || '',
    'Location': this.getLocationFromClassId(record.qrCode) || '',
    'Date': record.date || '',
    'Time': record.time || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(rawData);
  
  // Auto-width columns
  if (rawData.length > 0) {
    const headers = Object.keys(rawData[0]);
    const columnWidths = headers.map(header => {
      let maxWidth = header.length;
      rawData.forEach(row => {
        const cellValue = String(row[header] || '');
        maxWidth = Math.max(maxWidth, cellValue.length);
      });
      return { wch: Math.min(Math.max(maxWidth + 2, 10), 50) };
    });
    worksheet['!cols'] = columnWidths;
  }

  // Apply basic styling
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;
      
      // Header row styling
      if (R === range.s.r) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "2E7D32" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
      // Data cells
      else {
        worksheet[cellAddress].s = {
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } }
          }
        };
        
        // Alternate row background
        if ((R - 1) % 2 === 1) {
          worksheet[cellAddress].s.fill = { fgColor: { rgb: "F5F5F5" } };
        }
      }
    }
  }

  return worksheet;
};

// Create UI-formatted pivot table for Excel (matching renderPivotTable structure)
createUIFormattedPivotTable = (data) => {
  const grouped = this.getGroupedPivotData(data);
  const pivotRows = [];
  let grandTotal = 0;

  // Create rows matching the UI structure
  Object.entries(grouped).forEach(([date, classGroups]) => {
    let dateTotal = 0;
    
    // Date header row
    pivotRows.push({
      'Date': date,
      'Class ID': '',
      'Name': '',
      'Count': '',
      '_rowType': 'dateHeader'
    });
    
    Object.entries(classGroups).forEach(([class_id, names]) => {
      const count = names.length;
      dateTotal += count;
      grandTotal += count;
      
      // Class header row
      pivotRows.push({
        'Date': '',
        'Class ID': class_id,
        'Name': '',
        'Count': '',
        '_rowType': 'classHeader'
      });
      
      // Individual name rows
      names.forEach(name => {
        pivotRows.push({
          'Date': '',
          'Class ID': '',
          'Name': name,
          'Count': 1,
          '_rowType': 'nameRow'
        });
      });
      
      // Subtotal for class
      pivotRows.push({
        'Date': '',
        'Class ID': '',
        'Name': `Subtotal for ${class_id}:`,
        'Count': count,
        '_rowType': 'subtotal'
      });
    });
    
    // Date total row
    pivotRows.push({
      'Date': '',
      'Class ID': '',
      'Name': `Total for ${date}:`,
      'Count': dateTotal,
      '_rowType': 'dateTotal'
    });
  });
  
  // Grand total row
  pivotRows.push({
    'Date': '',
    'Class ID': '',
    'Name': 'Grand Total:',
    'Count': grandTotal,
    '_rowType': 'grandTotal'
  });

  // Remove the _rowType column before creating worksheet
  const cleanRows = pivotRows.map(row => {
    const { _rowType, ...cleanRow } = row;
    return cleanRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(cleanRows);
  
  // Auto-width columns
  const colWidths = [
    { wch: 15 }, // Date
    { wch: 25 }, // Class ID
    { wch: 45 }, // Name
    { wch: 15 }  // Count
  ];
  worksheet['!cols'] = colWidths;

  // Apply styling to match UI format
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;
      
      const rowIndex = R - 1; // Adjust for 0-based index (skip header)
      const originalRow = pivotRows[rowIndex];
      
      // Header row styling
      if (R === range.s.r) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "263238" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
      // Style based on row type
      else if (originalRow) {
        let fillColor = "FFFFFF";
        let fontBold = false;
        let alignment = "center";
        
        switch (originalRow._rowType) {
          case 'dateHeader':
            fillColor = "F5F5F5";
            fontBold = true;
            alignment = "left";
            break;
          case 'classHeader':
            fillColor = "E8E8E8";
            fontBold = true;
            alignment = "left";
            break;
          case 'nameRow':
            fillColor = "FFFFFF";
            alignment = C === 2 ? "left" : "center"; // Name column left-aligned
            break;
          case 'subtotal':
            fillColor = "E3F2FD";
            fontBold = true;
            alignment = C === 2 ? "right" : "center"; // Subtotal text right-aligned
            break;
          case 'dateTotal':
            fillColor = "BBDEFB";
            fontBold = true;
            alignment = C === 2 ? "right" : "center";
            break;
          case 'grandTotal':
            fillColor = "90CAF9";
            fontBold = true;
            alignment = C === 2 ? "right" : "center";
            break;
        }
        
        worksheet[cellAddress].s = {
          font: { bold: fontBold },
          fill: { fgColor: { rgb: fillColor } },
          alignment: { horizontal: alignment, vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } }
          }
        };
      }
    }
  }

  return worksheet;
};

// Create class-specific sheet with title row as class_id and columns for names and dates
createClassSpecificSheet = (classId, classData) => {
  // Sort data by date and name for consistent ordering
  const sortedData = classData.sort((a, b) => {
    const dateCompare = (a.date || '').localeCompare(b.date || '');
    if (dateCompare !== 0) return dateCompare;
    return (a.name || '').localeCompare(b.name || '');
  });

  // Create the data array starting with title row
  const sheetData = [];
  
  // Title row - class_id spanning across columns
  sheetData.push({
    'Name': classId,
    'Date': '',
    'Time': '',
    'Location': ''
  });
  
  // Empty row for spacing
  sheetData.push({
    'Name': '',
    'Date': '',
    'Time': '',
    'Location': ''
  });
  
  // Header row
  sheetData.push({
    'Name': 'Name',
    'Date': 'Date', 
    'Time': 'Time',
    'Location': 'Location'
  });
  
  // Data rows
  sortedData.forEach(record => {
    sheetData.push({
      'Name': record.name || '',
      'Date': record.date || '',
      'Time': record.time || '',
      'Location': this.getLocationFromClassId(record.qrCode) || ''
    });
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  
  // Set column widths
  const colWidths = [
    { wch: 35 }, // Name
    { wch: 15 }, // Date
    { wch: 12 }, // Time
    { wch: 30 }  // Location
  ];
  worksheet['!cols'] = colWidths;

  // Apply styling
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;
      
      // Title row styling (first row)
      if (R === 0) {
        worksheet[cellAddress].s = {
          font: { bold: true, size: 16, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1565C0" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "medium", color: { rgb: "000000" } },
            right: { style: "medium", color: { rgb: "000000" } }
          }
        };
      }
      // Header row styling (third row, after title and empty row)
      else if (R === 2) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "2E7D32" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
      // Data rows
      else if (R > 2) {
        worksheet[cellAddress].s = {
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } }
          }
        };
        
        // Alternate row background for data rows
        if ((R - 3) % 2 === 1) {
          worksheet[cellAddress].s.fill = { fgColor: { rgb: "F5F5F5" } };
        }
      }
    }
  }

  // Merge cells for title row (span across all columns)
  if (!worksheet['!merges']) worksheet['!merges'] = [];
  worksheet['!merges'].push({
    s: { r: 0, c: 0 }, // Start: row 0, col 0
    e: { r: 0, c: 3 }  // End: row 0, col 3 (spans 4 columns)
  });

  return worksheet;
};

// Updated saveData method for enhanced Excel with class-specific tabs
saveData = async () => {
  let totalSheets = 0;
  let loadingDiv = null;
  
  try {
    const filteredData = this.getFilteredAttendanceData();
    
    if (!filteredData || filteredData.length === 0) {
      alert('⚠️ No data available to export');
      return;
    }

    // Get unique class IDs for additional tabs
    const uniqueClassIds = [...new Set(filteredData.map(record => record.qrCode).filter(Boolean))];
    totalSheets = 11 + uniqueClassIds.length;

    loadingDiv = this.createLoadingIndicator(`Creating ${totalSheets}-sheet Excel file...`, filteredData.length);
    loadingDiv.setAttribute('data-loading-indicator', 'true');
    document.body.appendChild(loadingDiv);

    console.log(`🔄 Starting ${totalSheets}-sheet Excel generation...`);
    console.log(`📋 Found ${uniqueClassIds.length} unique class IDs:`, uniqueClassIds);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: Summary of all locations
    const summarySheet = this.createSummarySheet(filteredData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Sheet 10: Raw data for ALL locations combined
    const allRawSheet = this.createRawDataSheet(filteredData);
    XLSX.utils.book_append_sheet(workbook, allRawSheet, 'Raw_AllLocations');

    // Define the 4 specific locations
    const specificLocations = [
      'CT Hub',
      'Tampines 253', 
      'Tampines North Community Centre',
      'Pasir Ris West Wellness Centre'
    ];
    
    // Sheets 2-5: Raw data for each location
    specificLocations.forEach((location, index) => {
      const locationData = filteredData.filter(record => {
        const recordLocation = this.getLocationFromClassId(record.qrCode);
        return recordLocation === location;
      });
      
      const rawSheet = this.createRawDataSheet(locationData);
      // Shorten names to fit 31-character limit
      const locationMap = {
        'CT Hub': 'CTHub',
        'Tampines 253': 'Tampines253', 
        'Tampines North Community Centre': 'TampinesNorthCC',
        'Pasir Ris West Wellness Centre': 'PasirRisWestWC'
      };
      const shortName = locationMap[location] || location.replace(/[^\w]/g, '').substring(0, 20);
      const sheetName = `Raw_${shortName}`;
      XLSX.utils.book_append_sheet(workbook, rawSheet, sheetName);
    });
    
    // Sheets 6-9: Pivot tables for each location (matching UI format)
    specificLocations.forEach((location, index) => {
      const locationData = filteredData.filter(record => {
        const recordLocation = this.getLocationFromClassId(record.qrCode);
        return recordLocation === location;
      });
      
      const pivotSheet = this.createUIFormattedPivotTable(locationData);
      // Shorten names to fit 31-character limit
      const locationMap = {
        'CT Hub': 'CTHub',
        'Tampines 253': 'Tampines253', 
        'Tampines North Community Centre': 'TampinesNorthCC',
        'Pasir Ris West Wellness Centre': 'PasirRisWestWC'
      };
      const shortName = locationMap[location] || location.replace(/[^\w]/g, '').substring(0, 18);
      const sheetName = `Pivot_${shortName}`;
      XLSX.utils.book_append_sheet(workbook, pivotSheet, sheetName);
    });

    // Sheet 11: Pivot table for ALL locations combined
    const allPivotSheet = this.createUIFormattedPivotTable(filteredData);
    XLSX.utils.book_append_sheet(workbook, allPivotSheet, 'Pivot_AllLocations');

    // Additional sheets: One for each unique class_id
    uniqueClassIds.forEach((classId, index) => {
      const classData = filteredData.filter(record => record.qrCode === classId);
      const classSheet = this.createClassSpecificSheet(classId, classData);
      
      // Clean class ID for sheet name (Excel has 31-character limit)
      const cleanClassId = String(classId)
        .replace(/[^\w\s-]/g, '') // Remove special characters except dash
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 24); // Limit to 24 chars (leaving 7 for "Class_" prefix)
      
      const sheetName = `Class_${cleanClassId}`;
      XLSX.utils.book_append_sheet(workbook, classSheet, sheetName);
    });

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    link.download = `attendance_${totalSheets}sheets_${timestamp}.xlsx`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    alert(`✅ ${totalSheets}-sheet Excel file downloaded successfully!\n\n📊 Total: ${filteredData.length.toLocaleString()} records\n📋 Structure:\n• Sheet 1: Summary\n• Sheets 2-5: Raw data (4 locations)\n• Sheets 6-9: Pivot tables (4 locations)\n• Sheet 10: Raw data (ALL locations)\n• Sheet 11: Pivot table (ALL locations)\n• Sheets 12-${totalSheets}: Individual class tabs (${uniqueClassIds.length} classes)`);
    
  } catch (error) {
    console.error(`❌ ${totalSheets}-sheet Excel generation error:`, error);
    alert(`❌ Excel generation failed: ${error.message}`);
  } finally {
    if (loadingDiv && document.body.contains(loadingDiv)) {
      document.body.removeChild(loadingDiv);
    }
  }
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
