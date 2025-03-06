import React, { Component } from 'react';
import axios from 'axios';
import '../../../css/sub/invoiceSection.css';
import * as XLSX from "xlsx";

class InvoiceSection extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    // Fetch invoice data when the component mounts
    componentDidMount = async () => {
        this.props.loadingPopup1();
        //await this.fetchInvoiceDetails();
        this.props.closePopup1();
    };
    generateMonthlyReport = async (data) => {
        // Get the current month and year
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
        const currentYear = currentDate.getFullYear();
    
        // Define the headers
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
    
        // Prepare the rows from the data
        const rows = data.map((item, index) => [
            index + 1, // Serial number (S/N)
            item.registrationDate || '', // Registration Date
            item.official.date || '', // Payment Date
            item.official?.receiptNo || '', // Receipt Number
            item.participant?.name || '', // Received From
            item.course?.payment || '', // Payment Method
            item.course?.coursePrice || '', // Price
            item.course?.courseEngName || '', // Course Name
            item.course?.courseLocation || '', // Course Location
            item.misc || '', // Misc
            item.remarks || '' // Remarks
        ]);
    
        // Calculate total price (parse the price string and remove "$" before summing up)
        const totalPrice = data.reduce((total, item) => {
            let price = 0;
            if (item.official.date) {
                // Extract the price, remove the dollar sign, and trim any spaces
                const priceString = item.course?.coursePrice.replace('$', '').trim();
                // Check if priceString is not empty and can be parsed as a valid number
                if (priceString !== "" && !isNaN(parseFloat(priceString))) {
                    const parsedPrice = parseFloat(priceString);
                    price = parsedPrice;
                }
            }
            return total + price;
        }, 0);
    
        // Format the totalPrice to $x.xx
        const formattedTotalPrice = `$${totalPrice.toFixed(2)}`;
    
        console.log("Total Price:", formattedTotalPrice); // Outputs: $x.xx
    
        // Empty row after data
        const emptyRow = new Array(headers.length).fill('');
    
        // Row for "Collection by Lee Chin"
        const collectionRow = new Array(headers.length).fill('');
        collectionRow[2] = 'dd-mm-yy'; // Set date in column 2 (index 1)
        collectionRow[3] = 'Collection by Lee Chin'; // Set text in column 3 (index 2)
    
        // Create worksheet using the rows and header
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows, emptyRow, collectionRow, emptyRow]);
    
        // Make the headers bold (apply bold font to each header cell)
        for (let col = 0; col < headers.length; col++) {
            const headerCell = ws[XLSX.utils.encode_cell({ r: 0, c: col })]; // Get header cell
            if (headerCell) {
                headerCell.font = { bold: true }; // Apply bold to each header cell
            }
        }
    
        // Make the collection row bold (apply bold font to columns 2 and 3)
        const collectionRowIndex = rows.length + 2; // Get the index of the collection row
        ws[XLSX.utils.encode_cell({ r: collectionRowIndex, c: 1 })].font = { bold: true }; // Bold for column 2
        ws[XLSX.utils.encode_cell({ r: collectionRowIndex, c: 2 })].font = { bold: true }; // Bold for column 3
    
        // Row for "Total"
        const totalRow = ['', '', 'Total:', '', '', '', formattedTotalPrice, '', '', '', ''];
    
        // Add the total row at the end
        const totalRowIndex = rows.length + 3; // Get the index of the total row
        totalRow.forEach((cell, colIndex) => {
            const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c: colIndex });
            ws[cellAddress] = { v: cell, t: 's' }; // Assign the value to the corresponding cell
            if (colIndex >= 2 && colIndex <= 6) {
                ws[cellAddress].font = { bold: true }; // Make the total row cells bold
            }
        });
    
        // Auto adjust column width
        const columnWidths = headers.map((header, index) => {
            let maxLength = header.length; // Start with the length of the header
            rows.forEach((row) => {
                const cellLength = (row[index] || '').toString().length; // Get the length of each cell in the column
                maxLength = Math.max(maxLength, cellLength);
            });
            return { wch: maxLength }; // Set the width to the max length in the column
        });
    
        // Set column widths in the worksheet
        ws['!cols'] = columnWidths;
    
        // Create a new workbook and append the worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Course Payments');
    
        // Write the workbook to a file, naming it with the current month and year
        const fileName = `Course_Payments_${currentMonth}_${currentYear}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };
      
    // Function to format the date as dd-mm-yy
    formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = ('0' + date.getDate()).slice(-2);
        const month = ('0' + (date.getMonth() + 1)).slice(-2); // Months are 0-indexed
        const year = date.getFullYear().toString().slice(-2); // Last two digits of the year
        return `${day}-${month}-${year}`;
    };
      
    generateInvoice = async () => 
    {
        await this.props.generateInvoicePopup();

        try 
        {
            //await this.generateMonthlyReport();
            const response = await axios.post(`${window.location.hostname === "localhost" ? "http://localhost:3002" : "https://ecss-backend-django.azurewebsites.net"}/generate_monthly_report/`);
            console.log("Monthly Report Data:", response.data.data);
            await this.generateMonthlyReport(response.data.data);
            this.props.closePopup1();
        } 
        catch (error) 
        {
            console.error('Error generating invoice:', error);
        }
    };

    render() {
        const { months, selectedMonth, courses, totalPrice, totalPriceInWords } = this.state;

        return (
            <div className='invoice-section'>
                <h1>Invoice</h1>
                <div id="invoiceSelectBox">
                    <label htmlFor="monthDropdown">Choose a Month:</label>
                    <div className="button-row6">
                        <button onClick={() => this.generateInvoice()}>Generate New Monthly Report</button>             
                    </div>
                </div>
            </div>
        );
    }
}

export default InvoiceSection;
