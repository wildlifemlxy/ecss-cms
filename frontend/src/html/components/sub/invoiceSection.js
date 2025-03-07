import React, { Component } from 'react';
import axios from 'axios';
import '../../../css/sub/invoiceSection.css';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import * as XLSX from 'xlsx'; // Import the XLSX library

class InvoiceSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      invoiceData: [],  // Store invoice data,
      updatedInvoiceData: [],  // Store invoice data
      columnDefs: [  // Define the column headers and configurations
        { headerName: "S/N", field: "index", width: 80, sortable: true },
        { headerName: "Registration Date", field: "registrationDate", width: 150, sortable: true },
        { headerName: "Payment Date", field: "official.date", width: 150, sortable: true },
        { headerName: "Receipt Number", field: "official.receiptNo", width: 150, sortable: true },
        { headerName: "Received From", field: "participant.name", width: 200, sortable: true },
        { headerName: "Payment Method", field: "course.payment", width: 150, sortable: true },
        { headerName: "Price", field: "course.coursePrice", width: 120, sortable: true },
        { headerName: "Course Name", field: "course.courseEngName", width: 300, sortable: true },
        { headerName: "Course Location", field: "course.courseLocation", width: 150, sortable: true },
        { headerName: "Misc", field: "misc", width: 250, sortable: true },
        { headerName: "Remarks", field: "remarks", width: 250, sortable: true },
      ], 
      rowData: [],  // The actual data for the grid
      monthYearOptions: [], // List of month-year combinations
      selectedMonthYear: '', // Selected month-year from the dropdown
      showTable: false, // Control whether the table and export button are visible
      status: "",
      total: ""
    };
  }
  
  // Fetch invoice data when the component mounts
  componentDidMount = async () => {
    this.props.loadingPopup1();
    await this.fetchInvoiceDetails();
    this.props.closePopup1();
  };

  calculateTotalPriceForSelectedMonth = (selectedMonthYear) => {
    const { updatedInvoiceData } = this.state;
    console.log("Invoice Data:", updatedInvoiceData);
  
    // Filter the invoice data based on the selectedMonthYear
    const filteredData =  updatedInvoiceData.filter(item => {
      const registrationDateString = item.registrationDate; // Assuming the format is 'dd/mm/yyyy'
      const [cday, cmonth, cyear] = registrationDateString.split('/');
      const monthName = new Date(`${cyear}-${cmonth}-${cday}`).toLocaleString('default', { month: 'long' });
      const monthYear = `${monthName} ${cyear}`;
  
      return monthYear === selectedMonthYear;
    });
  
    console.log("Filtered Data:", filteredData);
  
    // Calculate total price for the filtered data
    const totalPrice = filteredData.reduce((total, item) => {
      let price = 0;
      if (item.official.date) {
        const priceString = item.course?.coursePrice.replace('$', '').trim();
        if (priceString !== "" && !isNaN(parseFloat(priceString))) {
          price = parseFloat(priceString);
        }
      }
      return total + price; // Perform numerical addition
    }, 0);
  
    console.log("Filtered Total Price:", totalPrice);
  
    // Update the state with the total price, formatted to two decimal places
    this.setState({ totalPrice: totalPrice.toFixed(2) });
  };
  
  // Function to fetch invoice details and populate the AG-Grid
  fetchInvoiceDetails = async () => {
    try {
      const response = await axios.post(`${window.location.hostname === "localhost" ? "http://localhost:3002" : "https://ecss-backend-django.azurewebsites.net"}/generate_monthly_report/`);
      const data = response.data.data;

      // Map data to include an 'index' field for the AG-Grid
      const mappedData = data.map((item, index) => ({
        ...item,
        index: index + 1,
      }));
      console.log("Invoice Data:", mappedData);
      
      // Generate the month-year combinations
      const monthYearOptions = this.getMonthYearOptions(mappedData);

      // Update the state with the data and month-year options
      this.setState({ 
        invoiceData: mappedData, 
        rowData: mappedData, // Set the original data
        updatedInvoiceData: mappedData, // Set the filtered data initially to the full data
        monthYearOptions, 
        status: "Collection by Lee Chin" 
      });

    } catch (error) {
      console.error('Error fetching invoice details:', error);
    }
  };

  // Function to extract unique month-year combinations in full month name format (mmmm yyyy)
  getMonthYearOptions = (data) => {
    const monthYearSet = new Set();
    data.forEach(item => {
      const registrationDateString = item.registrationDate; // Assuming the format is 'dd/mm/yyyy'
      const [cday, cmonth, cyear] = registrationDateString.split('/');
      const monthName = new Date(`${cyear}-${cmonth}-${cday}`).toLocaleString('default', { month: 'long' });
      const monthYear = `${monthName} ${cyear}`;
      monthYearSet.add(monthYear);
    });
    return Array.from(monthYearSet);
  };

  handleMonthYearChange = (event) => {
    const selectedMonthYear = event.target.value;
    this.setState({ selectedMonthYear });
      // Recalculate total price and apply filter after selecting month-year
    this.calculateTotalPriceForSelectedMonth(selectedMonthYear);
    this.filterInvoiceDataByMonthYear(selectedMonthYear);
  };

  filterInvoiceDataByMonthYear = (selectedMonthYear) => {
    const { invoiceData } = this.state;
    console.log("Selected Value:", selectedMonthYear);
  
    if (selectedMonthYear !== "") {
      // Filter the data based on the selected month-year
      const filteredData = invoiceData.filter(item => {
        const registrationDateString = item.registrationDate; // Assuming the format is 'dd/mm/yyyy'
        const [cday, cmonth, cyear] = registrationDateString.split('/');
        const monthName = new Date(`${cyear}-${cmonth}-${cday}`).toLocaleString('default', { month: 'long' });
        const monthYear = `${monthName} ${cyear}`;
        console.log("Filter:", monthYear, selectedMonthYear);
        return monthYear === selectedMonthYear;
      });
  
      // Reset the index for the filtered data starting from 1
      const updatedFilteredData = filteredData.map((item, index) => ({
        ...item,
        index: index + 1 // Resetting the index to start from 1
      }));
  
      // Update the filtered data for AG-Grid
      this.setState({ updatedInvoiceData: updatedFilteredData, showTable: true });
    } else {
      // Show the full data and hide the table when no month is selected
      this.setState({ updatedInvoiceData: invoiceData, showTable: false });
    }
  };
  
  generateMonthlyReport = () => {
    const { updatedInvoiceData, selectedMonthYear } = this.state;
  
    const headers = [
      'S/N',
      'Registration Date',
      'Payment Date',
      'Receipt Number',
      'Received From',
      'Payment Method',
      'Price',
      'Course Name',
      'Course Location',
      'Misc',
      'Remarks'
    ];
  
    // Prepare the rows from the filtered data
    const rows = updatedInvoiceData.map((item, index) => [
      index + 1, // Serial number (S/N)
      item.registrationDate || '', // Registration Date
      item.official.date || '', // Payment Date
      item.official?.receiptNo || '', // Receipt Number
      item.participant?.name || '', // Received From
      item.course?.payment || '', // Payment Method
      item.course?.coursePrice || '', // Price
      item.course?.courseEngName || '', // Course Name
      item.course?.courseLocation || '', // Course Location
    ]);
  
    // Calculate total price for the filtered data
    const totalPrice = updatedInvoiceData.reduce((total, item) => {
      let price = 0;
      if (item.official.date) {
        const priceString = item.course?.coursePrice.replace('$', '').trim();
        if (priceString !== "" && !isNaN(parseFloat(priceString))) {
          price = parseFloat(priceString);
        }
      }
      return total + price;
    }, 0);
  
    const formattedTotalPrice = `$${totalPrice.toFixed(2)}`;
  
    // Prepare empty and collection rows
    const emptyRow = new Array(headers.length).fill('');
    const collectionRow = new Array(headers.length).fill('');
    collectionRow[2] = 'dd-mm-yy'; 
    collectionRow[3] = 'Collection by Lee Chin'; 
  
    // Add the total row at the end of the report
    const totalRow = new Array(headers.length).fill('');
    totalRow[6] = `Total: ${formattedTotalPrice}`;
  
    // Create the sheet
    const sheetData = [headers, ...rows, emptyRow, collectionRow, emptyRow, totalRow];
  
    // Determine column widths based on the longest content in each column
    const colWidths = headers.map((_, colIndex) => {
      let maxLength = headers[colIndex].length; // Start with the header length
      sheetData.forEach(row => {
        if (row[colIndex] && row[colIndex].toString().length > maxLength) {
          maxLength = row[colIndex].toString().length;
        }
      });
      return { wch: maxLength + 2 }; // Add some padding to the width
    });
  
    // Create a worksheet
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
  
    // Set column widths dynamically
    ws['!cols'] = colWidths;
  
    // Apply bold font for headers and collection row
    for (let col = 0; col < headers.length; col++) {
      ws[`${String.fromCharCode(65 + col)}1`].s = { font: { bold: true } };
    }
  
    // Create a workbook and export it as an Excel file
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice Report');
    XLSX.writeFile(wb, `Invoice Report - ${selectedMonthYear}.xlsx`);
  };  

  render() 
  {
    var {status, totalPrice} = this.state;
    ModuleRegistry.registerModules([AllCommunityModule]);
    return (
      <>
        {/* Title for Monthly Report */}
        <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Monthly Report</h1>
        
        {/* Dropdown for selecting month-year */}
        <div id="month-year-selector" name="monthYearSelector" style={{ marginTop: '20px', textAlign: 'center' }}>
          <select
            id="month-year-dropdown"
            name="monthYearDropdown"
            onChange={this.handleMonthYearChange}
            value={this.state.selectedMonthYear}
          >
            <option value="">Select Month Year</option>
            {this.state.monthYearOptions.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        </div>

  
        {/* Only display the table and export button if a month-year is selected */}
        {this.state.showTable && (<>
          <div className='report-container'>
            <p>
              <strong>
                Report For {this.state.selectedMonthYear}
              </strong>
            </p>
            <p>
              <strong>
                Status : {status}
              </strong>
              </p>
            <p>
              <strong>
                Total : ${totalPrice}
              </strong>
            </p>
          </div>
          <div id="invoice-table-container" name="invoiceTableContainer">
            {/* AG Grid for displaying invoices */}
            <div
              id="ag-grid-container"
              name="agGridContainer"
              className="ag-theme-alpine"
            >
              <AgGridReact
                columnDefs={this.state.columnDefs}
                rowData={this.state.updatedInvoiceData}
                pagination={true}
                paginationPageSize={this.state.updatedInvoiceData.length}
                domLayout="normal"
                onGridReady={this.onGridReady}
              />
            </div>
  
            {/* Export Button */}
            <div id="export-button-container" name="exportButtonContainer" style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                id="export-to-excel-button"
                name="exportToExcelButton"
                onClick={this.generateMonthlyReport}
              >
                Export to Excel
              </button>
            </div>
          </div>
        </>)}
      </>
    );
  }
}

export default InvoiceSection;
