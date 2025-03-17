import React, { Component } from 'react';
import axios from 'axios';
import '../../../css/sub/invoiceSection.css';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import * as XLSX from 'xlsx'; // Import the XLSX library

class ReportSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      invoiceData: [],  // Store invoice data,
      updatedInvoiceData: [],  // Store invoice data
      columnDefs: [  // Define the column headers and configurations
        { headerName: "S/N", field: "index", width: 100, sortable: true },
        { headerName: "Registration Date", field: "registrationDate", width: 150, sortable: true },
        { headerName: "Payment Date", field: "official.date", width: 150, sortable: true },
        { headerName: "Receipt Number", field: "official.receiptNo", width: 250, sortable: true },
        { headerName: "Received From", field: "participant.name", width: 200, sortable: true },
        { headerName: "Payment Method", field: "course.payment", width: 150, sortable: true },
        { headerName: "Price", field: "course.coursePrice", width: 150, sortable: true },
        { headerName: "Course Name", field: "course.courseEngName", width: 350, sortable: true },
        { headerName: "Course Location", field: "course.courseLocation", width: 200, sortable: true },
        { headerName: "Misc", field: "misc", width: 250, sortable: true },
        { headerName: "Remarks", field: "remarks", width: 250, sortable: true },
      ], 
      rowData: [],  // The actual data for the grid
      monthYearOptions: [], // List of month-year combinations
      selectedMonthYear: '', // Selected month-year from the dropdown
      showTable: false, // Control whether the table and export button are visible
      status: "",
      total: "",
      fromDate: '',
      toDate: '',
      showReport: false,
      dateRange: "", 
      totalCash: 0,
      totalPayNow: 0
    };
  }

  handleFromDateChange = (e) => {
    this.setState({ fromDate: e.target.value });
  };

  handleToDateChange = (e) => {
    this.setState({ toDate: e.target.value });
  };

  generateReportButton = async () => {
      //await this.fetchInvoiceDetails();
      this.setState({ showReport: true, dateRange: `${this.state.fromDate} - ${this.state.toDate}` });
      this.fetchSiteICDetails(this.state.fromDate, this.state.toDate);
      this.calculateTotalPriceForDateRange(this.state.fromDate, this.state.toDate);
  };
  
  // Fetch invoice data when the component mounts
  componentDidMount = async () => 
  {
    if(this.props.reportType === "Monthly Report")
    {
      this.props.loadingPopup1();
      await this.fetchInvoiceDetails();
      this.props.closePopup1();
    }
    else if(this.props.reportType === "Payment Report")
    {
      this.props.loadingPopup1();
      await this.fetchInvoiceDetails();
      this.props.closePopup1();
    }
  };

  calculateTotalPriceForSelectedMonth = (selectedMonth) => {
    const { invoiceData } = this.state;
    console.log("Invoice Data:", invoiceData);
  
    // Function to parse the date string in dd/mm/yyyy format
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const [day, month, year] = dateStr.split('/');
      return new Date(`${year}-${month}-${day}`);
    };
  
    // Extract month and year from the selectedMonth string (e.g., "February 2025")
    const [monthName, year] = selectedMonth.split(' ');
  
    // Mapping month name to month index (0 = January, 1 = February, ..., 11 = December)
    const monthIndex = new Date(Date.parse(`${monthName} 1, 2025`)).getMonth();
    
    // Filter the invoice data based on the formatted month-year string
    const filteredData = invoiceData.filter(item => {
      const paymentDateString = item.official.date; // Assuming the format is 'dd/mm/yyyy'
      const paymentDate = parseDate(paymentDateString);
  
      if (!paymentDate) return false; // If there's no valid date, exclude the item
  
      // Format the payment date as "Month Year" string (e.g., "February 2025")
      const itemMonthName = paymentDate.toLocaleString('default', { month: 'long' }); // Get month name
      const itemYear = paymentDate.getFullYear(); // Get the full year from the payment date
  
      // Create a "Month Year" string from the item date
      const itemFormattedMonthYear = `${itemMonthName} ${itemYear}`;
  
      return item.official.receiptNo && itemFormattedMonthYear === selectedMonth; // Compare formatted month-year
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
  
  
  calculateTotalPriceForDateRange = (fromDate, toDate) => {
    const { invoiceData } = this.state;
    console.log("Invoice Data:", invoiceData);
  
    // Function to parse the date string in dd/mm/yyyy format
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const [day, month, year] = dateStr.split('/');
      return new Date(`${year}-${month}-${day}`);
    };
  
    // Validate if fromDate and toDate are valid
    const fromParsed = parseDate(fromDate);
    const toParsed = parseDate(toDate);
  
    // If either fromDate or toDate is invalid, exit the function
    if (!fromParsed || !toParsed || fromParsed > toParsed) {
      console.error("Invalid date range:", fromDate, toDate);
      return;
    }
  
    // Filter the invoice data based on the date range (fromDate, toDate)
    const filteredData = invoiceData.filter(item => {
      const paymentDateString = item.official.date; // Assuming the format is 'dd/mm/yyyy'
      const paymentDate = parseDate(paymentDateString);
  
      // Ensure there's a valid receipt number, the payment date is within the specified range,
      // and the course location is 'Tampines 253 Centre'
      return item.official.receiptNo && paymentDate >= fromParsed && paymentDate <= toParsed && item.course.courseLocation === "Tampines 253 Centre" && item.official.date !== "" && item.official.receiptNo !== "" && item.course.payment !== "SkillsFuture";
    });
  
    console.log("Filtered Data:", filteredData);
  
    // Calculate total price for Cash, PayNow, and Total
    const totalCash = filteredData.reduce((total, item) => {
      let price = 0;
      if (item.official.date && item.course.payment === "Cash") {
        const priceString = item.course?.coursePrice.replace('$', '').trim();
        if (priceString !== "" && !isNaN(parseFloat(priceString))) {
          price = parseFloat(priceString);
        }
      }
      return total + price;
    }, 0);
  
    const totalPayNow = filteredData.reduce((total, item) => {
      let price = 0;
      if (item.official.date && item.course.payment === "PayNow") {
        const priceString = item.course?.coursePrice.replace('$', '').trim();
        if (priceString !== "" && !isNaN(parseFloat(priceString))) {
          price = parseFloat(priceString);
        }
      }
      return total + price;
    }, 0);
  
    const totalPrice = filteredData.reduce((total, item) => {
      let price = 0;
      if (item.official.date) {
        const priceString = item.course?.coursePrice.replace('$', '').trim();
        if (priceString !== "" && !isNaN(parseFloat(priceString))) {
          price = parseFloat(priceString);
        }
      }
      return total + price;
    }, 0);
  
    console.log("Total Cash:", totalCash);
    console.log("Total PayNow:", totalPayNow);
    console.log("Total Price:", totalPrice);
  
    // Update the state with the totals, formatted to two decimal places
    this.setState({
      totalCash: totalCash.toFixed(2),
      totalPayNow: totalPayNow.toFixed(2),
      totalPrice: totalPrice.toFixed(2)
    });
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

  fetchSiteICDetails = async (fromDate, toDate) => {
    try {
      this.props.loadingPopup1();
      
      // Function to parse the date string in dd/mm/yyyy format
      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split('/');
        if (day && month && year) {
          return new Date(`${year}-${month}-${day}`);
        }
        return null; // If invalid date format
      };
  
      // Validate if a date is valid
      const isValidDate = (date) => date instanceof Date && !isNaN(date);
  
      // Parse fromDate and toDate
      const fromParsed = fromDate ? parseDate(fromDate) : null;
      const toParsed = toDate ? parseDate(toDate) : null;
  
      // Log invalid dates, but continue with filtering
      if (fromDate && !isValidDate(fromParsed)) {
        console.error("Invalid fromDate:", fromDate);
      }
  
      if (toDate && !isValidDate(toParsed)) {
        console.error("Invalid toDate:", toDate);
      }
  
      // Filter and map the data to ensure the index always starts from 1 after each filter
      let customIndex = 1; // Always start the index from 1
  
      // Filter the data based on date range and location
      const filteredData = this.state.invoiceData.filter((item) => {
        const itemDate = item.official.date; // assuming item.official.date is the date field in your data
        const date = parseDate(itemDate); // Parse the item date
        const courseLocation = item.course.courseLocation; // Get the courseLocation from the item
        const targetLocation = "Tampines 253 Centre"; // This is your target location
  
        // If item has a valid date
        if (date) {
          // If both fromDate and toDate are valid, filter based on date range and location
          if (fromParsed && toParsed && isValidDate(fromParsed) && isValidDate(toParsed)) {
            return date >= fromParsed && date <= toParsed && courseLocation === targetLocation && item.official.receiptNo !== "" && item.official.date !== "" && item.course.payment !== "SkillsFuture";
          } else if (!fromParsed && !toParsed) {
            // If no date range, just filter by courseLocation
            return false;
          }
          // If one of the dates is invalid, just filter by location
          return false;
        }
  
        return false; // If no valid date is available, exclude this item
      }).map((item) => {
        const newItem = {
          ...item,
          index: customIndex, // Assign current customIndex
        };
        customIndex++; // Increment the index for the next item
        return newItem;
      });
  
      console.log("Filtered Report Data:", filteredData);
  
      // Update the state with the filtered data
      this.setState({
        rowData: filteredData, // Set the original data
        updatedInvoiceData: filteredData, // Set the filtered data
        status: `Collection by ${this.props.userName}`,
      });
  
      // Close the popup
      this.props.closePopup1();
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
    console.log("Invoice Data:", invoiceData);
  
    if (selectedMonthYear !== "") {
      // Filter the data based on the selected month-year
      const filteredData = invoiceData.filter(item => {
        const registrationDateString = item.official.date || ""; // Assuming the format is 'dd/mm/yyyy'
        const [cday, cmonth, cyear] = registrationDateString.split('/');
        const monthName = new Date(`${cyear}-${cmonth}-${cday}`).toLocaleString('default', { month: 'long' });
        const monthYear = `${monthName} ${cyear}`;
        console.log("Filter:", monthYear, selectedMonthYear);
        return monthYear === selectedMonthYear && item.official.receiptNo !== "";
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
  
    const formattedTotalPrice = `$  ${totalPrice.toFixed(2)}`;
  
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

  generatePaymentReport = () => {
    const { updatedInvoiceData, dateRange, fromDate, toDate } = this.state;
  
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
  
  // Parse the fromDate and toDate to JavaScript Date objects
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`);
  };

  const fromParsed = parseDate(fromDate);
  const toParsed = parseDate(toDate);

  // Filter the data based on the date range
  const filteredData = updatedInvoiceData.filter(item => {
    const paymentDateString = item.official.date; // Assuming the format is 'dd/mm/yyyy'
    const paymentDate = parseDate(paymentDateString);

    // Only include items where the payment date is within the range
    return paymentDate >= fromParsed && paymentDate <= toParsed;
  });

  // Calculate total price for the filtered data, separately for Cash and Paynow
  const { totalPriceCash, totalPricePaynow } = filteredData.reduce(
    (acc, item) => {
      let price = 0;

      // Check if the item has a valid official date
      if (item.official.date) {
        // Clean the course price string and parse as a number
        const priceString = item.course?.coursePrice.replace('$', '').trim();
        if (priceString !== "" && !isNaN(parseFloat(priceString))) {
          price = parseFloat(priceString);
        }
      }

      // Check the payment method and add the price to the respective total
      const paymentMethod = item.course?.payment;
      if (paymentMethod === 'Cash') {
        acc.totalPriceCash += price; // Add price to Cash total
      } else if (paymentMethod === 'PayNow') {
        acc.totalPricePaynow += price; // Add price to Paynow total
      }

      return acc;
    },
    { totalPriceCash: 0, totalPricePaynow: 0 }
  );

    // Format the total prices for both Cash and Paynow to 2 decimal places
    const formattedTotalPriceCash = `$  ${totalPriceCash.toFixed(2)}`;
    const formattedTotalPricePaynow = `$  ${totalPricePaynow.toFixed(2)}`;
    const formattedTotalPrice = `$  ${(totalPricePaynow+totalPriceCash).toFixed(2)}`;

    console.log("Formatted Total Price for Cash:", formattedTotalPriceCash);
    console.log("Formatted Total Price for Paynow:", formattedTotalPricePaynow);

    // Prepare empty and collection rows
    const emptyRow = new Array(headers.length).fill('');
    const collectionRow = new Array(headers.length).fill('');
    collectionRow[2] = 'dd-mm-yy'; 
    collectionRow[3] = `Collection by ${this.props.userName}`; 

    // Add the total row at the end of the report
    const cashRow = new Array(headers.length).fill('');
    cashRow[6] = `Total (Cash): ${formattedTotalPriceCash}`;
    const payNowRow = new Array(headers.length).fill('');
    payNowRow[6] = `Total (PayNow): ${formattedTotalPricePaynow}`;
    const totalRow = new Array(headers.length).fill('');
    totalRow[6] = `Total: ${formattedTotalPrice}`;

    // Create the sheet
    const sheetData = [headers, ...rows, emptyRow, collectionRow, emptyRow, cashRow, payNowRow,totalRow];
  
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
    XLSX.writeFile(wb, `Invoice Report - ${dateRange}.xlsx`);
  };  


  render() 
  {
    var {status, totalPrice} = this.state;
    ModuleRegistry.registerModules([AllCommunityModule]);
    return (
      <>
        {this.props.reportType === "Monthly Report" && (
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
            {this.state.showTable && (
              <>
                <div className='report-container'>
                  <p>
                    <strong>
                      Report For {this.state.selectedMonthYear}
                    </strong>
                  </p>
                  <p>
                    <strong>
                      Status : {this.state.status}
                    </strong>
                  </p>
                  <p>
                    <strong>
                      Total : ${this.state.totalPrice}
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
              </>
            )}
          </>
        )}
      
        {this.props.reportType === "Payment Report" && (
          <>
            <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Payment Report</h1>
            <div id="date-range-selector" name="dateRangeSelector" style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{fontWeight:"bold"}}>Date Range</p> {/* Add this line for the Date Range label */}

              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
                <div style={{ textAlign: 'left', width: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label htmlFor="from-date" style={{ display: 'block', marginBottom: '5px' }}>From</label>
                  <input
                    type="text"
                    id="from-date"
                    name="fromDate"
                    onChange={this.handleFromDateChange}
                    value={this.state.fromDate}
                    placeholder = "dd/mm/yyyy"
                    style={{ padding: '8px', fontSize: '1rem', width: '7vw',  border: '1px solid #000000', borderRadius: '4px'}}
                  />
                </div>

                <div style={{ textAlign: 'left', width: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label htmlFor="to-date" style={{ display: 'block', marginBottom: '5px' }}>To</label>
                  <input
                    type="text"
                    id="to-date"
                    name="toDate"
                    onChange={this.handleToDateChange}
                    value={this.state.toDate}
                    placeholder = "dd/mm/yyyy"
                    style={{ padding: '8px', fontSize: '1rem', width: '7vw',  border: '1px solid #000000', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <button className="generate-btn" onClick={() => this.generateReportButton()}>Generate</button>
                </div>
              </div>
            </div>
            {this.state.showReport && (
              <>
                <div className='report-container'>
                  <p>
                    <strong>Report For {this.state.dateRange}</strong>
                  </p>
                  <p>
                    <strong>Status : {this.state.status}</strong>
                  </p>
                  <p style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <strong style={{ marginRight: '10px' }}>Total:</strong>
                    <span style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>${this.state.totalPrice} </span>
                      <span>${this.state.totalCash}   (Cash)</span>
                      <span> ${this.state.totalPayNow}   (PayNow)</span>
                    </span>
                  </p>
                </div>
                <div id="ag-grid-container" name="agGridContainer" className="ag-theme-alpine">
                  <AgGridReact
                    columnDefs={this.state.columnDefs}
                    rowData={this.state.updatedInvoiceData}
                    pagination={true}
                    paginationPageSize={this.state.updatedInvoiceData.length}  // Adjust to your preferred pagination size
                    domLayout="normal"  // Use "autoHeight" if you want dynamic height based on content
                    onGridReady={this.onGridReady}
                  />
                </div>
                 {/* Export Button */}
                 <div id="export-button-container" name="exportButtonContainer" style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button
                      id="export-to-excel-button"
                      name="exportToExcelButton"
                      onClick={this.generatePaymentReport}
                  >
                  Export to Excel
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </>
      );   
    }   
}

export default ReportSection;
