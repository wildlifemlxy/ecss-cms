import React, { Component } from 'react';
import axios from 'axios';
import '../../../css/sub/registrationPayment.css';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
import PaymentMethod from '../dropdownBox/paymentMethod'; 

class RegistrationPaymentSection extends Component {
    constructor(props) {
      super(props);
      this.state = {
        hideAllCells: false,
        registerationDetails: [],
        isLoading: true,
        focusedInputIndex: null,
        originalData: [],
        currentPage: 1, // Add this
        entriesPerPage: 100, // Add this
        remarks: "", // Remarks for each row
        paginatedDetails: [],
        columnDefs: this.getColumnDefs(),
        rowData: [],
        expandedRowIndex: null,
        editedRowIndex: 0
      };
      this.tableRef = React.createRef();
    }

    toggleRow = (index) => {
      this.setState((prevState) => ({
        expandedRow: prevState.expandedRow === index ? null : index,
      }));
    };  

    handleEntriesPerPageChange = (e) => {
      this.setState({
        entriesPerPage: parseInt(e.target.value, 100),
        currentPage: 1 // Reset to the first page when changing entries per page
      });
    }

   

    convertToChineseDate(dateStr) {
      const monthMap = {
        January: 1, February: 2, March: 3, April: 4,
        May: 5, June: 6, July: 7, August: 8,
        September: 9, October: 10, November: 11, December: 12,
      };

      const [day, month, year] = dateStr.split(' ');
      const monthNumber = monthMap[month];

      return `${year}年${monthNumber}月${parseInt(day)}日`;
    }

    fetchCourseRegistrations = async (language) => {
      try {
        var {siteIC, role} = this.props;  
        console.log("Role", role, "SiteIC", siteIC);
        const response = await axios.post(`${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`, { purpose: 'retrieve', role, siteIC });

        console.log("Course Registration:", response);
    
        const array = this.languageDatabase(response.data.result, language);
        return array;
    
      } catch (error) {
        console.error('Error fetching course registrations:', error);
        return []; // Return an empty array in case of error
      }
    };

    languageDatabase(array, language) {
      for (let i = 0; i < array.length; i++) {
        if (language === 'en') {
          const participant = array[i].participant;
          participant.residentialStatus = participant.residentialStatus.split(' ')[0];
          participant.race = participant.race.split(' ')[0];

          if (participant.educationLevel.split(' ').length === 3) {
            participant.educationLevel = participant.educationLevel.split(' ').slice(0, 2).join(' ');
          } else {
            participant.educationLevel = participant.educationLevel.split(' ')[0];
          }

          if (participant.workStatus.split(' ').length === 3) {
            participant.workStatus = participant.workStatus.split(' ').slice(0, 2).join(' ');
          } else {
            participant.workStatus = participant.workStatus.split(' ')[0];
          }

          array[i].agreement = array[i].agreement.split(' ')[0];
        } else if (language === 'zh') {
          const participant = array[i].participant;
          participant.residentialStatus = participant.residentialStatus.split(' ')[1];
          participant.race = participant.race.split(' ')[1];

          participant.gender = (participant.gender === 'M') ? '男' : (participant.gender === 'F') ? '女' : participant.gender;

          if (participant.educationLevel.split(' ').length === 3) {
            participant.educationLevel = participant.educationLevel.split(' ')[2];
          } else {
            participant.educationLevel = participant.educationLevel.split(' ')[1];
          }

          if (participant.workStatus.split(' ').length === 3) {
            participant.workStatus = participant.workStatus.split(' ')[2];
          } else {
            participant.workStatus = participant.workStatus.split(' ')[1];
          }

          const startDate = array[i].course.courseDuration.split('-')[0].trim();
          const endDate = array[i].course.courseDuration.split('-')[1].trim();
          array[i].course.courseEngName = array[i].course.courseChiName;
          array[i].course.courseDuration = `${this.convertToChineseDate(startDate)} - ${this.convertToChineseDate(endDate)}`;
          
          array[i].course.payment = array[i].course.payment === 'Cash' ? '现金' : array[i].course.payment;
          array[i].agreement = array[i].agreement.split(' ')[1];
        }
      }
      return array;
    }

    async componentDidMount() { 
     // this.props.onResetSearch();
      const { language, siteIC, role } = this.props;
      const data = await this.fetchCourseRegistrations(language);
      console.log('All Courses Registration:  ', data);
      var locations = await this.getAllLocations(data);
      var types = await this.getAllTypes(data);
      var names = await this.getAllNames(data);
      this.props.passDataToParent(locations, types, names);

      const statuses = data.map(item => item.status); // Extract statuses
      console.log('Statuses:', statuses); // Log the array of statuses
      
      await this.props.getTotalNumberofDetails(data.length);

      // Initialize inputValues for each index based on fetched data
      const inputValues = {};
      data.forEach((item, index) => {
        inputValues[index] = item.status || "Pending"; // Use item.status or default to "Pending"
      });

      const inputValues1 = {};
      data.forEach((item, index) => {
        inputValues1[index] = item.official.remarks; // Use item.status or default to "Pending"
        console.log("Current Remarks: ", item.official.remarks)
      });

      this.setState({
        originalData: data,
        registerationDetails: data, // Update with fetched dat
        isLoading: false, // Set loading to false after data is fetche
        inputValues: inputValues,  // Show dropdown for the focused input
        remarks: inputValues1,  // Show dropdown for the focused input
        locations: locations, // Set locations in state
        names: names,
        //rowData: data
      });
      this.getRowData(data);
      this.props.closePopup();
    }

    updateRowData(paginatedDetails) {
     // this.props.onResetSearch();
      // Update the state with the newly formatted rowData
      //console.log("Row Datawe:", paginatedDetails);
      this.setState({registerationDetails: paginatedDetails});
    }

    decodeHtmlEntities(text) 
    {
      const parser = new DOMParser();
      const decodedString = parser.parseFromString(`<!doctype html><body>${text}`, "text/html").body.textContent;
      return decodedString;
    }
    
          
    updateWooCommerceForRegistrationPayment = async (chi, eng, location, updatedStatus) => {
      try {
        // Check if the value is "Paid" or "Generate SkillsFuture Invoice"
        if (updatedStatus === "Paid" || updatedStatus === "SkillsFuture Done" || updatedStatus === "Cancelled" || updatedStatus === "Confirmed") {
          // Proceed to update WooCommerce stock
          const stockResponse = await axios.post(`${window.location.hostname === "localhost" ? "http://localhost:3002" : "https://ecss-backend-django.azurewebsites.net"}/update_stock/`, { type: 'update', page: { "courseChiName": chi, "courseEngName": eng, "courseLocation": location }, status: updatedStatus, location: location });

          console.log("WooCommerce stock update response:", stockResponse.data);
        
          // If WooCommerce stock update is successful, generate receipt
          if (stockResponse.data.success === true) {
            console.log("Stock updated successfully.");
            // Call the function to generate receipt or perform other action
          } else {
            console.error("Error updating WooCommerce stock:", stockResponse.data);
          }
        } else {
          console.log("No update needed for the given status.");
        }
      } catch (error) {
        console.error("Error during the update process:", error);
      }
    };

      // Method to get all locations
      getAllLocations = async (datas) => {
        return [...new Set(datas.map(data => {
          //console.log(data.course)
          return data.course.courseLocation;
        }))];
      }

      
      // Method to get all locations
      getAllTypes = async (datas) => {
        return [...new Set(datas.map(data => {
          //console.log(data.course)
          return data.course.courseType;
        }))];
      }
  
      // Method to get all languages
      getAllNames = async (datas) => {
         return [...new Set(datas.map(data => {
          console.log("Course Name:", data.course.courseEngName); 
          return data.course.courseEngName;
        }))];
      }

      generateReceiptNumber = async (course, newMethod) => 
      {
        const courseLocation = newMethod === "SkillsFuture" ? "ECSS/SFC/" : course.courseLocation;
        console.log("Course Location:", courseLocation);
        const centreLocation = course.courseLocation;
        console.log("Centre Location:", centreLocation);
        try {
          //console.log("Fetching receipt number for location:", courseLocation);
          const response = await axios.post(`${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/receipt`, { purpose: "getReceiptNo", courseLocation, centreLocation });
    
          if (response?.data?.result?.success) {
            console.log("Fetched receipt number:", response.data.result.receiptNumber);
            return response.data.result.receiptNumber;
          } else {
            throw new Error("Failed to fetch receipt number from response");
          }
        } catch (error) {
          console.error("Error fetching receipt number:", error);
          throw error;
        }
      };

      generatePDFReceipt = async (id, participant, course, receiptNo, status) => {
        try {
          const pdfResponse = await axios.post(`${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`, { purpose: "addReceiptNumber", id, participant, course, staff: this.props.userName, receiptNo, status });
          console.log("generatePDFReceipt:", pdfResponse);
          return pdfResponse;
        } catch (error) {
          console.error("Error generating PDF receipt:", error);
          throw error;
        }
      };
      
    
      receiptShown = async (participant, course, receiptNo, officialInfo) => 
      {
        try {
          if(course.payment === "Cash" || course.payment === "PayNow")
          {
            const pdfResponse = await axios.post(
              `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`, // Your endpoint
              {
                purpose: "receipt",
                participant,
                course,
                staff: this.props.userName,
                receiptNo,
                officialInfo
              },
              { responseType: "blob" }
            );
            
            // Extract the filename from the response's content-disposition header
            const contentDisposition = pdfResponse.headers["content-disposition"];
            const filenameMatch = contentDisposition ? contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/) : null;
            const filename = filenameMatch ? filenameMatch[1].replace(/['"]/g, "") : "receipt.pdf";
            
            // Create a Blob object from the response data (PDF)
            const blob = new Blob([pdfResponse.data], { type: "application/pdf" });
            
            // Create a URL for the Blob
            const url = window.URL.createObjectURL(blob);
            
            // Open the PDF in a new tab (automatically triggering the popup)
            const pdfWindow = window.open(url, '_blank');
            
            // Fallback if the window fails to open (in case of popup blockers)
            if (!pdfWindow) {
              alert('Please allow popups to view the PDF receipt.');
            }
            
            console.log(`PDF URL: ${url}`);
            
          }
          else
          {
            const pdfResponse = await axios.post(
              `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`,
            {
              purpose: "invoice",
              participant,
              course,
              staff: this.props.userName,
              receiptNo,
            },
            { responseType: "blob" }
          );

          // Extract the filename from the response's content-disposition header
          const contentDisposition = pdfResponse.headers["content-disposition"];
          const filenameMatch = contentDisposition ? contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/) : null;
          const filename = filenameMatch ? filenameMatch[1].replace(/['"]/g, "") : "receipt.pdf";
          
          // Create a Blob object from the response data (PDF)
          const blob = new Blob([pdfResponse.data], { type: "application/pdf" });
          
          // Create a URL for the Blob
          const url = window.URL.createObjectURL(blob);
          
          // Open the PDF in a new tab (automatically triggering the popup)
          const pdfWindow = window.open(url, '_blank');
          
          // Fallback if the window fails to open (in case of popup blockers)
          if (!pdfWindow) {
            alert('Please allow popups to view the PDF receipt.');
          }
          
          console.log(`PDF URL: ${url}`);
        }
        } catch (error) {
          console.error("Error generating PDF receipt:", error);
          throw error;
        }
      };

      async getNextReceiptNumber(databaseName, collectionName, courseLocation, centreLocation) {
        const db = this.client.db(databaseName);
        const collection = db.collection(collectionName);
        console.log("Centre:", centreLocation);
    
        // Get the current two-digit year
        const currentYear = new Date().getFullYear().toString().slice(-2);
    
        // Retrieve all receipts matching the specified courseLocation
        const existingReceipts = await collection.find({
            receiptNo: { $regex: `^${courseLocation}` } // Match all receipts starting with courseLocation
        }).toArray();
    
        console.log("Existing receipts:", existingReceipts);
    
        // Filter receipts to determine if a reset is needed for ECSS/SFC
        const validReceipts = existingReceipts.filter(receipt => {
            if (courseLocation === "ECSS/SFC/") {
                // Match receipts for the current year
                const regex = new RegExp(`^${courseLocation}\\d+/(${currentYear})$`);
                return regex.test(receipt.receiptNo);
            }
            return true; // For other prefixes, year isn't relevant
        });
    
        // Separate out receipts for "CT Hub"
        const cthubReceipts = validReceipts.filter(receipt => receipt.location === "CT Hub");
    
        // Get the highest receipt number for CT Hub (if any)
        const cthubReceiptNumbers = cthubReceipts.map(receipt => {
            if (courseLocation === "ECSS/SFC/") {
                // Match format: ECSS/SFC/037/2024
                const regex = new RegExp(`^${courseLocation}(\\d+)/\\d+$`);
                const match = receipt.receiptNo.match(regex);
                return match ? parseInt(match[1], 10) : null;
            } else {
                // Match format: XXX - 0001
                const regex = new RegExp(`^${courseLocation} - (\\d+)$`);
                const match = receipt.receiptNo.match(regex);
                return match ? parseInt(match[1], 10) : null;
            }
        }).filter(num => num !== null);
    
        const maxCthubNumber = cthubReceiptNumbers.length > 0 ? Math.max(...cthubReceiptNumbers) : 0;
    
        // Separate out receipts for other locations
        const otherReceipts = validReceipts.filter(receipt => receipt.location !== "CT Hub");
    
        // Get the highest receipt number for other locations
        const otherReceiptNumbers = otherReceipts.map(receipt => {
            if (courseLocation === "ECSS/SFC/") {
                // Match format: ECSS/SFC/037/2024
                const regex = new RegExp(`^${courseLocation}(\\d+)/\\d+$`);
                const match = receipt.receiptNo.match(regex);
                return match ? parseInt(match[1], 10) : null;
            } else {
                // Match format: XXX - 0001
                const regex = new RegExp(`^${courseLocation} - (\\d+)$`);
                const match = receipt.receiptNo.match(regex);
                return match ? parseInt(match[1], 10) : null;
            }
        }).filter(num => num !== null);
    
        const maxOtherNumber = otherReceiptNumbers.length > 0 ? Math.max(...otherReceiptNumbers) : 0;
    
        // Now, determine the next receipt number
        if (currentYear === "25") {
            // If the current year is 25, and the centre is "CT Hub"
            if (centreLocation === "CT Hub") {
                const nextNumber = maxCthubNumber > 0 ? maxCthubNumber + 1 : 109; // Start from 109 if no CT Hub receipts exist
                return courseLocation === "ECSS/SFC/"
                    ? `${courseLocation}${String(nextNumber).padStart(3, '0')}/${currentYear}`
                    : `${courseLocation} - ${String(nextNumber).padStart(4, '0')}`;
            } else {
                // For other centres, continue from the highest number for other locations
                const nextNumber = maxOtherNumber > 0 ? maxOtherNumber + 1 : 1; // Start from 1 if no other receipts exist
                return courseLocation === "ECSS/SFC/"
                    ? `${courseLocation}${String(nextNumber).padStart(3, '0')}/${currentYear}`
                    : `${courseLocation} - ${String(nextNumber).padStart(4, '0')}`;
            }
        } else {
            // For other years, reset numbers
            if (centreLocation === "CT Hub") {
                const nextNumber = maxCthubNumber > 0 ? maxCthubNumber + 1 : 109; // Start from 109 if no CT Hub receipts exist
                return courseLocation === "ECSS/SFC/"
                    ? `${courseLocation}${String(nextNumber).padStart(3, '0')}/${currentYear}`
                    : `${courseLocation} - ${String(nextNumber).padStart(4, '0')}`;
            } else {
                const nextNumber = maxOtherNumber > 0 ? maxOtherNumber + 1 : 1; // Start from 1 if no other receipts exist
                return courseLocation === "ECSS/SFC/"
                    ? `${courseLocation}${String(nextNumber).padStart(3, '0')}/${currentYear}`
                    : `${courseLocation} - ${String(nextNumber).padStart(4, '0')}`;
            }
        }
    }

    generatePDFInvoice = async (id, participant, course, receiptNo, status) => 
    {
      try {
        const pdfResponse = await axios.post(
          `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`,
          { purpose: "addInvoiceNumber", id, participant, course, staff: this.props.userName, receiptNo, status }
        );        
        return pdfResponse;
      } catch (error) {
        console.error("Error generating PDF receipt:", error);
        throw error;
      }
    };
  
    createReceiptInDatabase = async (receiptNo, location, registration_id, url) => {
      try {
        console.log("Creating receipt in database:", {
          receiptNo,
          registration_id,
          url,
        });
  
        const receiptCreationResponse = await axios.post(
          `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/receipt`,
          {
            purpose: "createReceipt",
            receiptNo,
            location, 
            registration_id,
            url,
            staff: this.props.userName,
          }
        );        
  
        console.log("Receipt creation response:", receiptCreationResponse.data);
      } catch (error) {
        console.error("Error creating receipt in database:", error);
        throw error;
      }
    };
    

      receiptGenerator = async (id, participant, course, official, value) => {
        console.log("Selected Parameters:", { course, official, value });
    
        if (value === "Paid") 
        {
          if (course.payment === "Cash" || course.payment === "PayNow") 
          {
            try 
            {
              console.log("Generating receipt for course:", course);
      
              //const registration_id = id;
              const receiptNo = await this.generateReceiptNumber(course, course.payment);
              console.log("Manual Receipt No:", receiptNo);
              await this.generatePDFReceipt(id, participant, course, receiptNo, value);
              await this.createReceiptInDatabase(receiptNo, course.courseLocation, id, "");  
            } 
            catch (error) 
            {
              console.error("Error during receipt generation:", error);
            }
          }
        } 
        else if (value === "Generating SkillsFuture Invoice") {
            try {
              console.log("Generating SkillsFuture invoice for course:", course);
              const invoiceNo = await this.generateReceiptNumber(course);
              console.log("Invoice No:", invoiceNo);
              await this.generatePDFInvoice(id, participant, course, invoiceNo, value);  
              await this.createReceiptInDatabase(invoiceNo, course.courseLocation, id, ""); 
            } catch (error) {
              console.error("Error during SkillsFuture invoice generation:", error);
            }
        }
      };

      //this.autoReceiptGenerator(id, participantInfo, courseInfo, officialInfo, newValue, "Paid")
      autoReceiptGenerator = async (id, participant, course, official, newMethod, value) => {
        console.log("Selected Parameters:", { course, official, newMethod, value });
    
        if (newMethod === "Cash" || newMethod === "PayNow") 
        {
          if (value === "Paid") 
          {
            try 
            {
              console.log(`${value} For This Course:`, course);
      
              //const registration_id = id;
              const receiptNo = await this.generateReceiptNumber(course, newMethod);
              console.log("Receipt N11o:", receiptNo);
              await this.generatePDFReceipt(id, participant, course, receiptNo, value);
              await this.createReceiptInDatabase(receiptNo, course.courseLocation, id, "");    
            } 
            catch (error) 
            {
              console.error("Error during receipt generation:", error);
            }
          }
        } 
        else if(newMethod === "SkillsFuture")
        {
          try 
          {
            console.log("Generating receipt for course:", course);
    
            const registration_id = id;
            const invoiceNo = await this.generateReceiptNumber(course, newMethod);
            console.log("Invoice No:", invoiceNo);
            await this.generatePDFReceipt(id, participant, course, invoiceNo, value);
            await this.createReceiptInDatabase(invoiceNo, course.courseLocation, id, "");    
          } 
          catch (error) 
          {
            console.error("Error during receipt generation:", error);
          }
        }
      };
      
      
    async saveData(paginatedDetails) {
        console.log("Save Data:", paginatedDetails);
    
        // Prepare the data for Excel
        const preparedData = [];

        // Define the sub-headers
        const headers = [
            "Participant Name", "Participant NRIC", "Participant Residential Status", "Participant Race", "Participant Gender", "Participant Date of Birth",
            "Participant Contact Number", "Participant Email", "Participant Postal Code", "Participant Education Level", "Participant Work Status",
            "Course Type", "Course English Name", "Course Chinese Name", "Course Location",
            "Course Price", "Course Duration", "Payment", "Agreement", "Payment Status", "Refunded Date",
            "Staff Name", "Received Date", "Received Time", "Receipt/Inovice Number", "Remarks"
        ];
    
        preparedData.push(headers);
    
        // Add the values
        paginatedDetails.forEach(detail => {
            const row = [
                detail.participantInfo.name,
                detail.participantInfo.nric,
                detail.participantInfo.residentialStatus,
                detail.participantInfo.race,
                detail.participantInfo.gender,
                detail.participantInfo.dateOfBirth,
                detail.participantInfo.contactNumber,
                detail.participantInfo.email,
                detail.participantInfo.postalCode,
                detail.participantInfo.educationLevel,
                detail.participantInfo.workStatus,
                detail.courseInfo.courseType,
                detail.courseInfo.courseEngName,
                detail.courseInfo.courseChiName,
                detail.courseInfo.courseLocation,
                detail.courseInfo.coursePrice,
                detail.courseInfo.courseDuration,
                detail.courseInfo.payment,
                detail.agreement,
                detail.status,
                detail.officialInfo?.refundedDate,
                detail.officialInfo?.name,
                detail.officialInfo?.date,
                detail.officialInfo?.time,
                detail.officialInfo?.receiptNo,
                detail.officialInfo?.remarks
            ];
            preparedData.push(row);
        });
    
        // Convert the prepared data into a worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(preparedData);
    
        // Create a new workbook and add the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Exported Data");

        // Prompt user for filename input
        var date = new Date();
        const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}${date.getFullYear()}`;
        const fileName = `exported data ${formattedDate}`;
    
        // Generate a binary string
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
        // Create a blob from the binary string
        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    
        // Create a link element for downloading
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${fileName}.xlsx`; // Specify the file name with .xlsx extension
        link.click(); // Trigger the download
    }

    convertDateFormat1(dateString) {
      const months = {
        January: '01',
        February: '02',
        Feburary: '02',
        March: '03',
        April: '04',
        May: '05',
        June: '06',
        July: '07',
        August: '08',
        September: '09',
        October: '10',
        November: '11',
        December: '12'
      };
    
      // Regular expression to match the input format
      const regex = /^(\d{1,2})\s([A-Za-z]+)\s(\d{4})$/;
    
      // Test the input against the regex
      const match = dateString.trim().match(regex);
    
      if (!match) {
        console.error('Invalid date format:', dateString);
        return 'Invalid date format';
      }
    
      // Extract day, month, and year from the regex groups
      const [, day, month, year] = match;
    
      // Validate the month
      const monthNumber = months[month];
      if (!monthNumber) {
        console.error('Invalid month name:', month);
        return 'Invalid date format';
      }
    
      // Return the formatted date
      return `${day.padStart(2, '0')}/${monthNumber}/${year}`;
    }
    

    handleEdit = async(item, index) =>
    {
      console.log("Handle Edit:", item);
      this.props.showEditPopup(item)
    }

    convertDateFormat(dateString) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0'); // Ensure two-digit day
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two-digit month (0-based index)
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    }

    exportToLOP = async (paginatedDetails) => {
      try {
        // Fetch the Excel file from public folder (adjust the path if necessary)
        const filePath = '/external/List of Eligible Participants_revised 240401.xlsx';  // Path relative to the public folder
        const response = await fetch(filePath);
    
        if (!response.ok) {
          return this.props.warningPopUpMessage("Error fetching the Excel file.");
        }
    
        const data = await response.arrayBuffer(); // Convert file to ArrayBuffer
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
    
        const sourceSheet = workbook.getWorksheet('LOP');
        if (!sourceSheet) {
          return this.props.warningPopUpMessage("Sheet 'LOP' not found!");
        }
    
        const originalRow = sourceSheet.getRow(9); // Row 9 is the template row to copy
        const startRow = 9;
        var courseName = "";
    
        console.log("Paginated Details :", paginatedDetails, paginatedDetails.length);
    
        paginatedDetails.forEach((detail, index) => {
          console.log("Paginated Detail1",  detail);
         // console.log("Date Of Birth:", detail.participantInfo.dateOfBirth);
          if (detail.courseInfo.courseType === "NSA") {
            const rowIndex = startRow + index;
            const newDataRow = sourceSheet.getRow(rowIndex);
            newDataRow.height = originalRow.height;
    
            // Populate cells with data from `detail`
            sourceSheet.getCell(`A${rowIndex}`).value = rowIndex - startRow + 1;
            sourceSheet.getCell(`B${rowIndex}`).value = detail.participantInfo.name;
            sourceSheet.getCell(`C${rowIndex}`).value = detail.participantInfo.nric;
            sourceSheet.getCell(`D${rowIndex}`).value = detail.participantInfo.residentialStatus.substring(0, 2);
    
            //console.log("Date of birth:", detail.participantInfo.name, detail?.participantInfo?.dateOfBirth.split("/"));
            const dob = detail?.participantInfo?.dateOfBirth;

            if (dob) {
                const [day, month, year] = dob.split("/");
                sourceSheet.getCell(`E${rowIndex}`).value = day.trim();
              sourceSheet.getCell(`F${rowIndex}`).value = month.trim();
              sourceSheet.getCell(`G${rowIndex}`).value = year.trim()
            }
    
            sourceSheet.getCell(`H${rowIndex}`).value = detail.participantInfo.gender.split(" ")[0];
            sourceSheet.getCell(`I${rowIndex}`).value = detail.participantInfo.race.split(" ")[0];
            sourceSheet.getCell(`J${rowIndex}`).value = detail.participantInfo.contactNumber;
            sourceSheet.getCell(`K${rowIndex}`).value = detail.participantInfo.email;
            sourceSheet.getCell(`L${rowIndex}`).value = detail.participantInfo.postalCode;
    
            const educationParts = detail.participantInfo.educationLevel.split(" ");
            sourceSheet.getCell(`M${rowIndex}`).value = educationParts.length === 3 ? educationParts[0] + " " + educationParts[1] : educationParts[0];
    
            const workParts = detail.participantInfo.workStatus.split(" ");
            sourceSheet.getCell(`N${rowIndex}`).value = workParts.length === 3 ? workParts[0] + " " + workParts[1] : workParts[0];
    
            let courseName = detail.courseInfo.courseEngName;
            let languages = courseName.split("–").pop().trim();
            if (!((languages === "English") || (languages === "Mandarin"))) {
              // If "English" or "Mandarin" is not in the course name, don't split
              sourceSheet.getCell(`O${rowIndex}`).value = courseName.trim();
            } else {
              // Otherwise, split by "–" and assign the first part
              sourceSheet.getCell(`O${rowIndex}`).value = courseName.split("–")[0].trim();
            }
            
    
            const [startDate, endDate] = detail.courseInfo.courseDuration.split(" - ");
            sourceSheet.getCell(`P${rowIndex}`).value = this.convertDateFormat1(startDate);
            sourceSheet.getCell(`Q${rowIndex}`).value = this.convertDateFormat1(endDate);
    
            sourceSheet.getCell(`R${rowIndex}`).value = detail.courseInfo.coursePrice;
            sourceSheet.getCell(`S${rowIndex}`).value = detail.courseInfo.payment === "SkillsFuture" ? "SFC" : detail.courseInfo.payment;
            sourceSheet.getCell(`V${rowIndex}`).value = detail.officialInfo.receiptNo;
    
            // Copy styles from the original row
            originalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const newCell = newDataRow.getCell(colNumber);
              newCell.style = cell.style;
            });
          }
        });
    
       // Create new file name and sav
        const originalFileName = `List of Eligible Participants for ${courseName} as of ${this.getCurrentDateTime()}.xlsx`
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    
        // Trigger download
        saveAs(blob, originalFileName);
      } catch (error) {
        console.error("Error exporting LOP:", error);
        this.props.warningPopUpMessage("An error occurred during export.");
      }
    };

    exportAttendance = async (paginatedDetails) => {
      var { selectedCourseName, selectedLocation } = this.props;
    
      try {
        // Fetch the Excel file from public folder (adjust the path if necessary)
        const filePath = '/external/Attendance.xlsx';  // Path relative to the public folder
        const response = await fetch(filePath);
    
        if (!response.ok) {
          return this.props.warningPopUpMessage("Error fetching the Excel file.");
        }
    
        const data = await response.arrayBuffer(); // Convert file to ArrayBuffer
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
    
        const sourceSheet = workbook.getWorksheet('Sheet1');
        if (!sourceSheet) {
          return this.props.warningPopUpMessage("Sheet 'Sheet1' not found!");
        }
    
        // Set Course Title in A1
        const cellA1 = sourceSheet.getCell('A1');
        cellA1.value = `Course Title: ${selectedCourseName}`;
        cellA1.font = { name: 'Calibri', size: 18, bold: true };
    
        // Set Course Commencement Date in A2
        let courseCommencementDate = '';
        for (let i = 0; i < paginatedDetails.length; i++) {
          const item = paginatedDetails[i];
          if (item.course === selectedCourseName) {
            courseCommencementDate = item.courseInfo.courseDuration.split("-")[0].trim();
            break;
          }
        }
    
        const cellA2 = sourceSheet.getCell('A2');
        cellA2.value = `Course Commencement Date: ${courseCommencementDate}`;
        cellA2.font = { name: 'Calibri', size: 18, bold: true };
    
        // Set Venue in A3 based on selected location
        const cellA3 = sourceSheet.getCell('A3');
        if (selectedLocation === "Tampines 253 Centre") {
          cellA3.value = `Venue: Blk 253 Tampines St 21 #01-406 Singapore 521253`;
        } else if (selectedLocation === "CT Hub") {
          cellA3.value = `Venue: En Community Services Society 2 Kallang Avenue CT Hub #06-14 Singapore 339407`;
        } else if (selectedLocation === "Tampines North Community Centre") {
          cellA3.value = `Venue: Tampines North Community Club Blk 421 Tampines St 41 #01-132 Singapore 520420`;
        } else if (selectedLocation === "Pasir Ris West Wellness Centre") {
          cellA3.value = `Venue: Pasir Ris West Wellness Centre Blk 605 Elias Road #01-200 Singapore 510605`;
        }
        cellA3.font = { name: 'Calibri', size: 18, bold: true };
    
        // Loop for S/N and Name starting from row 6 in Columns A and B
        let rowIndex = 6; // Start from row 6 for S/N and Name
        let participantIndex = 1;  // Initialize participant index for S/N
        for (let i = 0; i < paginatedDetails.length; i++) {
          const item = paginatedDetails[i];
          if (item.course === selectedCourseName && item.courseInfo.courseLocation === selectedLocation) {
            const cellA = sourceSheet.getCell(`A${rowIndex}`);
            const cellB = sourceSheet.getCell(`B${rowIndex}`);
    
            cellA.value = participantIndex;  // Set S/N dynamically
            cellB.value = item.participantInfo.name;
    
            // Apply font styling
            cellA.font = { name: 'Calibri', size: 18, bold: true };
            cellB.font = { name: 'Calibri', size: 18, bold: true };
    
            rowIndex++;
            participantIndex++; // Increment participant index for S/N
          }
        }
    
        // Set Weekly labels in row 4 (D4 onwards)
        const courseDuration = paginatedDetails[0]?.courseInfo?.courseDuration || '';
        const [startDate, endDate] = courseDuration.split(" - ");  // Split course duration into start and end dates
        const start = new Date(startDate);
        const end = new Date(endDate);
    
        // Calculate weeks
        let weekIndex = 1;
        let currentDate = new Date(start);
    
        const row = sourceSheet.getRow(4); // Row 4 for weekly labels
    
        let lessonColumns = [];  // To store columns that will contain lessons
    
        // Loop for lessons (L1, L2, L3, etc.)
        for (let col = 4; col <= 42; col += 2) {  // Every 2 columns will represent 1 lesson
          if (currentDate <= end) {
            const lessonLabel = `L${weekIndex}: ${formatDateToDDMMYYYY(currentDate)}`;
            const cell = row.getCell(col);  // Get the cell in the specific column of row 4
    
            // Set the value for the lesson
            cell.value = lessonLabel;
            cell.font = { name: 'Calibri', size: 16, bold: true };
    
            // Store the column index for lesson
            lessonColumns.push(col);
    
            // Move to the next week
            currentDate.setDate(currentDate.getDate() + 7);  // Move 1 week ahead
            weekIndex++; // Increment the week number
          }
        }
    
        // Helper function to format a date to dd/mm/yyyy
        function formatDateToDDMMYYYY(date) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }

        // Helper function to format a date to dd/mm/yyyy
        function formatDateToDDMMYYYY1(date) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
          const year = date.getFullYear();
          return `${day}${month}${year}`;
        }
          
    
        // Create a new file and trigger download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    
        // Trigger the file download with a new name
        saveAs(blob, `Attendance (Course) ECSS${formatDateToDDMMYYYY1(start)} ${selectedCourseName}.xlsx`);
      } catch (error) {
        console.error("Error exporting LOP:", error);
        this.props.warningPopUpMessage("An error occurred during export.");
      }
    };
    
    getCurrentDateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(2);
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
    
      return `${day}${month}${year}`;
    };
  
  // Custom Cell Renderer for Slide Button
  slideButtonRenderer = (params) => {
    const paymentMethod = params.data.paymentMethod; // Get payment method for the row

    // Return null or empty if the payment method is not 'SkillsFuture'
    if (paymentMethod !== 'SkillsFuture') {
      return null;
    }

    // Otherwise, return JSX for the slide button (checkbox)
    const checked = params.value;  // Set checkbox state based on the current value of 'confirmed'
    
    const handleChange = (event) => {
      const newValue = event.target.checked;
      params.api.getRowNode(params.node.id).setDataValue('confirmed', newValue);
      console.log('Slide button toggled:', newValue);
    };

    return (
      <div className="slide-button-container">
        <input 
          type="checkbox"
          className="slide-button"
          checked={checked}
          onChange={handleChange}
        />
      </div>
    );
  };

  // Custom cell renderer for Payment Method with Buttons
  paymentMethodRenderer = (params, courseName, location, type) => {
    const currentPaymentMethod = params.value; // Get the current payment method value

    let paymentMethods  ;
    if(type === "NSA")
    {
      // List of payment methods
      if(location === "Pasir Ris West Wellness Centre")
      {
        if(courseName !== "Community Ukulele – Mandarin")
        {
          paymentMethods = ['PayNow', 'SkillsFuture'];
        }
        else
        {
          paymentMethods = ['PayNow'];
        }
      }
      else
      {
        if(courseName !== "Community Ukulele – Mandarin")
        {
          paymentMethods = ['Cash', 'PayNow', 'SkillsFuture'];
        }
        else
        {
          paymentMethods = ['Cash', 'PayNow'];
        }
      }
    }
    else
    {
      paymentMethods = [];
    }


    // Handle button click to update the payment method in the row
    const handleButtonClick = (method) => {
      params.api.getRowNode(params.node.id).setDataValue('paymentMethod', method);
      console.log('Payment method changed to:', method);
    };

    return (
      <div className="payment-method-buttons-container">
        {paymentMethods.map((method) => (
          <button
            key={method}
            className={`payment-method-button ${method === currentPaymentMethod ? 'active' : ''}`}
            onClick={() => handleButtonClick(method)}
          >
            {method}
          </button>
        ))}
      </div>
    );
  };
  
  getColumnDefs = () => {
    const { role } = this.props; // Get the role from props
  
    const columnDefs = [
      {
        headerName: "S/N",
        field: "sn",
        width: 100,
      },
      {
        headerName: "Name",
        field: "name",
        width: 300,
        editable: true,
      },
      {
        headerName: "Contact Number",
        field: "contactNo",
        width: 150,
        editable: true,
      },
      {
        headerName: "Course Name",
        field: "course",
        width: 350,
      },
      {
        headerName: "Course Location",
        field: "location",
        width: 300,
        cellRenderer: (params) => {
          // Hide value if the role is "Site in-charge"
          return role === "Site in-charge" ? null : params.value;
        },
      },
      {
        headerName: "Payment Method",
        field: "paymentMethod",
        cellRenderer: (params) => {
          const { course, courseInfo } = params.data;
          return this.paymentMethodRenderer(params, course, courseInfo.courseLocation, courseInfo.courseType);
        },
        editable: false,
        width: 500,
      },
      {
        headerName: "Confirmation",
        field: "confirmed",
        cellRenderer: (params) => this.slideButtonRenderer(params),
        editable: false,
        width: 180,
        cellStyle: (params) => {
          return params.data.paymentMethod !== "SkillsFuture" ? { display: "none" } : {};
        },
      },
      {
        headerName: "Payment Status",
        field: "paymentStatus",
        cellEditor: "agSelectCellEditor",
        cellEditorParams: (params) => {
          const { paymentMethod, courseInfo } = params.data;
          const courseType = courseInfo.courseType;
      
          const options =
            courseType === "NSA"
              ? paymentMethod === "SkillsFuture"
                ? ["Pending", "Generating SkillsFuture Invoice", "SkillsFuture Done", "Cancelled", "Refunded"]
                : ["Pending", "Paid", "Cancelled", "Refunded"]
              : ["Pending", "Confirmed", "Cancelled", "Refunded"];
      
          return { values: options };
        },
        cellRenderer: (params) => {
          const statusStyles = {
            Pending: "#FFA500", // Orange
            "Generating SkillsFuture Invoice": "#00CED1", // Dark Turquoise
            "SkillsFuture Done": "#008000", // Green
            Cancelled: "#FF0000", // Red
            Paid: "#008000", // Green
            Confirmed: "#008000", // Green
            Refunded: "#D2691E", // Lighter brown (Dark orange brown)
          };
      
          const statusText = params.value;
          const backgroundColor = statusStyles[statusText] || "#D3D3D3"; // Default gray if the status doesn't match
      
          return (
            <span
              style={{
                fontWeight: "bold",
                color: "#FFFFFF", // Ensure the text color is white for all statuses
                textAlign: "center",
                display: "inline-block",
                borderRadius: "20px",
                padding: "5px 15px",
                minWidth: "150px",
                lineHeight: "30px",
                whiteSpace: "nowrap",
                backgroundColor: backgroundColor,
              }}
            >
              {statusText}
            </span>
          );
        },
        editable: true,
        width: 350,
      },      
      {
        headerName: "Refunded Date",
        field: "refundedDate",
        width: 250,
      },
      {
        headerName: "Receipt/Invoice Number",
        field: "recinvNo",
        width: 300,
      },
    ];
  
    // Add the "Delete" button column conditionally
    if (!["Site in-charge", "Finance"].includes(role)) {
      columnDefs.push({
        headerName: "",
        field: "delete",
        width: 300,
        cellRenderer: (params) => (
          <button
            onClick={() => this.handleDelete(params.data.id)}
            style={{
              backgroundColor: "#87CEEB",
              color: "#ffffff",
              borderRadius: "5px",
              width: "fit-content",
              fontWeight: "bold",
              height: "fit-content",
              margin: "auto",
            }}
          >
            Delete
          </button>
        ),
      });
    }
  
    // Add the "Port Over" button column conditionally
    if (!["Ops in-charge", "NSA in-charge", "Finance"].includes(role)) {
      columnDefs.push({
        headerName: "",
        field: "portOver",
        width: 300,
        cellRenderer: (params) => (
          <button
            onClick={() => this.handlePortOver(params.data.id, params.data.participantInfo, params.data.courseInfo, params.data.paymentStatus)}
            style={{
              backgroundColor: "#C7A29B", // Pastel Brown
              color: "#ffffff",
              borderRadius: "5px",
              width: "fit-content",
              fontWeight: "bold", 
              height: "fit-content",
              margin: "auto",
            }}
          >
            Port Over
          </button>
        ),
      });
    }
  
    return columnDefs;
  };
  
  handleDelete = async(id) =>
  {
    //console.log("Registration Id:", id);
    await this.props.generateDeleteConfirmationPopup(id);
  }

  handlePortOver = async(id, participantsInfo, courseInfo, status) =>
  {
    //console.log("Params1:", official);
    console.log("Params1:", id, participantsInfo, courseInfo, status);
    await this.props.generatePortOverConfirmationPopup(id, participantsInfo, courseInfo, status);
  }
  
  getPaginatedDetails() {
    const { registerationDetails } = this.state;
    const { currentPage, entriesPerPage } = this.props;
    
    // Calculate the index range for pagination
    const indexOfLastCourse = currentPage * entriesPerPage;
    const indexOfFirstCourse = indexOfLastCourse - entriesPerPage;
  
    // Return the paginated slice of the filtered registerationDetails
    return registerationDetails.slice(indexOfFirstCourse, indexOfLastCourse);
  }

  getRowData = (registerationDetails) => {
   //const paginatedDetails = this.getPaginatedDetails();
   //console.log("Hi")
  
    // Assuming paginatedDetails is an array of objects with the necessary fields.
    const rowData = registerationDetails.map((item, index) => {
      return {
        id: item._id,
        sn: index + 1,  // Serial number (S/N)
        name: item.participant.name,  // Replace with the actual field for name
        contactNo: item.participant.contactNumber,  // Replace with the actual field for contact number
        course: item.course.courseEngName,  // Replace with the actual field for payment status
        courseChi: item.course.courseChiName,  // Replace with the actual field for payment status
        location: item.course.courseLocation,  // Replace with the actual field for payment status
        paymentMethod: item.course.payment,  // Replace with the actual field for payment method
        confirmed: item.official.confirmed,  // Replace with the actual field for receipt/invoice number
        paymentStatus: item.status,  // Replace with the actual field for payment status
        recinvNo: item.official.receiptNo,  // Replace with the actual field for receipt/invoice number
        participantInfo: item.participant,
        courseInfo: item.course,
        officialInfo: item.official,
        agreement: item.agreement,
        status: item.status,
        registrationDate: item.registrationDate,
        refundedDate: item.official.refundedDate || ""
      };
    });
    console.log("All Rows Data:", rowData);
  
    // Set the state with the new row data
    this.setState({registerationDetails: rowData, rowData });
  };

  handleValueClick = async (event) =>
  {
    console.log("handleValueClick");
    const columnName = event.colDef.headerName;
    const receiptInvoice = event.data.recinvNo;
    const participantInfo = event.data.participantInfo;
    const courseInfo = event.data.courseInfo;
    const officialInfo = event.data.officialInfo;
    console.log("officialInfo:", officialInfo);

    const rowIndex = event.rowIndex; // Get the clicked row index
    const expandedRowIndex = this.state.expandedRowIndex;

    try {
      if(columnName === "S/N")
        {
          // Optional: Handle additional logic here if necessary
          console.log("Cell clicked", event);
          // Check if clicked on a row and handle expansion
          if (expandedRowIndex === rowIndex) {
            // If the same row is clicked, collapse it
            this.setState({ expandedRowIndex: null });
          } else {
            // Expand the new row
            this.setState({ expandedRowIndex: rowIndex });
          }
  
        }
        else if (columnName === "Receipt/Invoice Number")
        {
          if(receiptInvoice !== "")
          {
            this.props.showUpdatePopup("In Progress... Please wait...");
            console.log("Receipt/Invoice Number");
            await this.receiptShown(participantInfo, courseInfo, receiptInvoice, officialInfo);
            this.props.closePopup();
          }
        }
      }
      catch (error) {
        console.error('Error during submission:', error);
      }
  }

  // Define the Master/Detail grid options
  getDetailGridOptions = () => {
    return {
      columnDefs: [
        { headerName: "Detail Info", field: "detailInfo", width: 500 },
        { headerName: "More Info", field: "moreInfo", width: 500 },
      ],
      domLayout: "autoHeight", // Allows dynamic expansion
    };
  };

    // Add custom row below the clicked row
    getRowStyle = (params) => {
      // If this is the expanded row, display the custom <div>
      if (this.state.expandedRowIndex !== null && this.state.expandedRowIndex === params.rowIndex) {
        return { background: '#f1f1f1' }; // Example style for expanded row
      }
      return null;
    };
  

  onCellValueChanged = async (event) => {
    const columnName = event.colDef.headerName;
    const id = event.data.id;
    const courseName = event.data.course;
    const courseChiName = event.data.courseChi;
    const courseLocation = event.data.location;
    const newValue = event.value;
    const participantInfo = event.data.participantInfo;
    const courseInfo = event.data.courseInfo;
    const officialInfo = event.data.officialInfo;
    const confirmed = event.data.confirmed;
    const paymentMethod = event.data.paymentMethod;
    const paymentStatus = event.data.paymentStatus;
    const oldPaymentStatus = event.data.status;

    console.log("Column Name:", columnName);
    this.setState({editedRowIndex: id});

    try 
    {
        if (columnName === "Payment Method") 
        {
          this.props.showUpdatePopup("Updating in progress... Please wait ...");
          await axios.post(
            `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`,
            {
              purpose: 'updatePaymentMethod',
              id: id,
              newUpdatePayment: newValue,
              staff: this.props.userName
            }
          );          
          //Automatically Update Status
          console.log("newPaymentMethod:", newValue);
          if(newValue === "Cash" || newValue === "PayNow")
          {
              const response = await axios.post(
                `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`,
                { 
                  purpose: 'updatePaymentStatus', 
                  id: id, 
                  newUpdateStatus: "Paid", 
                  staff: this.props.userName 
                }
              );
            
              if (response.data.result === true) 
              {
                  // Define the parallel tasks function
                  const performParallelTasks = async () => {
                    try {
                      // Run the two functions in parallel using Promise.all
                      await Promise.all([
                        this.updateWooCommerceForRegistrationPayment(courseChiName, courseName, courseLocation, "Paid"),
                        //console.log("Course Info:", courseInfo)
                        this.autoReceiptGenerator(id, participantInfo, courseInfo, officialInfo, newValue, "Paid")
                      ]);
                      console.log("Updated Successfully");
                    } catch (error) {
                      console.error("Error occurred during parallel task execution:", error);
                    }
                };
                await performParallelTasks();
              } 
          }
        }
        else if (columnName === "Confirmation") 
        {
          this.props.showUpdatePopup("Updating in progress... Please wait ...")
          console.log('Cell clicked', event);
          const response = await axios.post(
            `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`,
            { 
              purpose: 'updateConfirmationStatus', 
              id: id, 
              newConfirmation: newValue, 
              staff: this.props.userName 
            }
          );          
          console.log(`${columnName}: ${newValue}`);
          if(paymentMethod === "SkillsFuture" && newValue === true)
          {
              if (response.data.result === true) 
              {
                console.log("Auto Generate SkillsFuture Invoice");
                // Define the parallel tasks function
                const response = await axios.post(
                  `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`, 
                  { 
                    purpose: 'updatePaymentStatus', 
                    id: id, 
                    newUpdateStatus: "Generating SkillsFuture Invoice", 
                    staff: this.props.userName 
                  }
                );
                if (response.data.result === true) 
                  {
                      // Define the parallel tasks function
                      const performParallelTasks = async () => {
                        try {
                          // Run the two functions in parallel using Promise.all
                          await Promise.all([
                            this.autoReceiptGenerator(id, participantInfo, courseInfo, officialInfo, paymentMethod, "Generating SkillsFuture Invoice")
                          ]);
                          console.log("Updated Successfully");
                        } catch (error) {
                          console.error("Error occurred during parallel task execution:", error);
                        }
                    };
                    await performParallelTasks();
                  } 
              }
          }
          console.log("Change SkillsFuture Confirmation");
        }
        else if (columnName === "Payment Status") 
        {
          this.props.showUpdatePopup("Updating in progress... Please wait ...")
          console.log('Cell clicked', event);
          const response = await axios.post(
            `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`,
            {
              purpose: 'updatePaymentStatus',
              id: id,
              newUpdateStatus: newValue,
              staff: this.props.userName
            }
          );
            console.log("Response for Payment Status1:", response);
            if (response.data.result === true) 
            {
              console.log("New Payment Status:", newValue);
              if(paymentMethod === "Cash" || paymentMethod === "PayNow")
              {
                console.log("Update Payment Status Success1");
                if(newValue === "Cancelled")
                {
                    const response = await axios.post(
                      `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`,
                      {
                        id: id,
                        purpose: 'removedRefundedDate'
                      }
                    );
                    console.log("Old Payment Status:", oldPaymentStatus);
                    if(oldPaymentStatus === "Paid")
                    {
                      const performParallelTasks = async () => {
                        try {
                        // Run the two functions in parallel using Promise.all
                          await Promise.all([
                            this.updateWooCommerceForRegistrationPayment(courseChiName, courseName, courseLocation, newValue),
                          ]);
                          console.log("Both tasks completed successfully.");
                        } catch (error) {
                          console.error("Error occurred during parallel task execution:", error);
                        }};
                        await performParallelTasks();
                    }
                }
                else if(newValue === "Refunded")
                {
                  //console.log("Refunding in progress");
                  const response = await axios.post(
                    `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`,
                    {
                      id: id,
                      purpose: 'addRefundedDate'
                    }
                  );
                  console.log("Response Add Refunded Date:", response);
                }
                else
                {
                  // Define the parallel tasks function
                  const performParallelTasks = async () => {
                    try {
                      // Run the two functions in parallel using Promise.all
                      await Promise.all([
                        this.updateWooCommerceForRegistrationPayment(courseChiName, courseName, courseLocation, newValue),
                        this.receiptGenerator(id, participantInfo, courseInfo, officialInfo, newValue),
                      ]);
                      console.log("Both tasks completed successfully.");
                    } catch (error) {
                      console.error("Error occurred during parallel task execution:", error);
                    }};
                    await performParallelTasks();
                  }
            }
            else if(paymentMethod === "SkillsFuture")
            {
              if(newValue === "SkillsFuture Done")
              {
                const performParallelTasks = async () => {
                  try {
                    // Run the two functions in parallel using Promise.all
                    await Promise.all([
                      this.updateWooCommerceForRegistrationPayment(courseChiName, courseName, courseLocation, newValue),
                    ]);
                    console.log("Both tasks completed successfully.");
                  } catch (error) {
                    console.error("Error occurred during parallel task execution:", error);
                  }};
                  await performParallelTasks();
              }
              else if(newValue === "Cancelled")
              {
                console.log("SkillsFuture, Old Payment Status:", oldPaymentStatus);
                const response = await axios.post(
                  `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`,
                  {
                    id: id,
                    purpose: 'rempvedRefundedDate'
                  }
                );
                console.log("Response Add Refunded Date:", response);
                if(oldPaymentStatus === "SkillsFuture Done")
                {
                  const performParallelTasks = async () => {
                    try {
                      // Run the two functions in parallel using Promise.all
                      await Promise.all([
                        this.updateWooCommerceForRegistrationPayment(courseChiName, courseName, courseLocation, newValue),
                      ]);
                      console.log("Both tasks completed successfully.");
                    } catch (error) {
                      console.error("Error occurred during parallel task execution:", error);
                    }};
                    await performParallelTasks();
                }
                else if(newValue === "Refunded")
                {
                  //console.log("Refunding in progress");
                  const response = await axios.post(
                    `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`,
                    {
                      id: id,
                      purpose: 'addRefundedDate'
                    }
                  );
                  console.log("Response Add Refunded Date:", response);
                }
                else
                {
                  console.log("SkillsFuture: Do not need to update Woocommerce");
                }
              } 
            }
            else if(courseInfo.courseType === "ILP")
            {
              if(newValue === "Confirmed")
              { 
                console.log("Confirm ILP Course")
                const performParallelTasks = async () => {
                  try {
                    // Run the two functions in parallel using Promise.all
                    await Promise.all([
                      this.updateWooCommerceForRegistrationPayment(courseChiName, courseName, courseLocation, newValue),
                    ]);
                    console.log("Both tasks completed successfully.");
                  } catch (error) {
                    console.error("Error occurred during parallel task execution:", error);
                  }};
                  await performParallelTasks();
              }
              else if(newValue === "Cancelled")
              { 
                console.log("Confirm ILP Course")
                const performParallelTasks = async () => {
                  try {
                    // Run the two functions in parallel using Promise.all
                    await Promise.all([
                      this.updateWooCommerceForRegistrationPayment(courseChiName, courseName, courseLocation, newValue),
                    ]);
                    console.log("Both tasks completed successfully.");
                  } catch (error) {
                    console.error("Error occurred during parallel task execution:", error);
                  }};
                  await performParallelTasks();
              }
            }
          }
        }
        else
        {
          console.log("Updated Particulars:", event.colDef.field, newValue);
          const response = await axios.post(
            `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`,
            {
              purpose: 'edit',
              id: id,
              field: event.colDef.field,
              editedValue: newValue
            }
          );
          
        }
        this.refreshChild(); 
    } catch (error) {
      console.error('Error during submission:', error);
      this.props.closePopup();
    }
  };
  
  refreshChild = async () => {
    const { language } = this.props;
    
    // Fetch new data
    const data = await this.fetchCourseRegistrations(language);
  
    // Get the current scroll position of the grid's container element
    const gridContainer = document.querySelector('.ag-body-viewport'); // Select the grid's scrollable container
    
    // Get the index of the currently edited row (replace this with your actual logic to get the row index)
    const currentRowIndex = this.state.editedRowIndex; // Assuming you store the index of the edited row in state
    
    // Save the current scroll position
    const currentScrollTop = gridContainer ? gridContainer.scrollTop : 0;
  
    // Update the state with new data
    this.setState(
      {
        originalData: data,
        registerationDetails: data, // Update with fetched data
        //rowData: data,  // Update the row data for the grid
      },
      () => {
        // After state update, restore the scroll position to the edited row
        if (gridContainer && currentRowIndex !== undefined) {
          // Calculate the position of the row based on the index
          const rowHeight = 40; // Assuming each row has a height of 40px (adjust as necessary)
          const rowPosition = currentRowIndex * rowHeight;  // Get the scroll position for the row
          
          // Set the scroll position back to the edited row
          gridContainer.scrollTop = rowPosition;
        }
  
        // Optionally call getRowData to process the updated data
        this.getRowData(data);
  
        // Close the popup
        this.props.closePopup();
      }
    );
  };
  

 // componentDidUpdate is called after the component has updated (re-rendered)
  componentDidUpdate(prevProps, prevState) {
    const { selectedLocation, selectedCourseType, searchQuery, selectedCourseName} = this.props;
    console.log("This Props:", selectedCourseName);
    // Check if the relevant props have changed
    if (
      selectedLocation !== prevProps.selectedLocation ||
      selectedCourseType !== prevProps.selectedCourseType ||
      selectedCourseName !== prevProps.selectedCourseName ||
      searchQuery !== prevProps.searchQuery
    ) {
      //console.log("ComponentDidUpdate");
      // Call the filter method when relevant props change
      this.filterRegistrationDetails();
    }
  }

  filterRegistrationDetails() {
    const { section, selectedLocation, selectedCourseType, selectedCourseName, searchQuery } = this.props;
    console.log("Section:", section);

    if (section === "registration") {
      const { originalData } = this.state;

      console.log("Original Data:", originalData);
      console.log("Filters Applied:", { selectedLocation, selectedCourseType, searchQuery, selectedCourseName });

      if (
        (selectedLocation === "All Locations" || !selectedLocation) &&
        (selectedCourseType === "All Courses Types" || !selectedCourseType) &&
        (selectedCourseName === "All Courses Name" || !selectedCourseName) &&
        (!searchQuery)
      ) {
        const rowData = originalData.map((item, index) => ({
          id: item._id,
          sn: index + 1,  // Serial number (S/N)
          name: item.participant.name,  // Participant's name
          contactNo: item.participant.contactNumber,  // Contact number
          course: item.course.courseEngName,  // Course English name
          courseChi: item.course.courseChiName,  // Course Chinese name
          location: item.course.courseLocation,  // Course location
          paymentMethod: item.course.payment,  // Payment method
          confirmed: item.official.confirmed,  // Confirmation status
          paymentStatus: item.status,  // Payment status
          recinvNo: item.official.receiptNo,  // Receipt number
          participantInfo: item.participant,  // Participant details
          courseInfo: item.course,  // Course details
          officialInfo: item.official,  // Official details
          refundedDate: item.offical.refundedDate|| ""// Official details
        }));
  
        // Update the row data with the filtered results
        this.setState({rowData});
        //this.setState({registerationDetails: rowData});
        this.updateRowData(rowData);
        return;
      }

      // Normalize the search query
      const normalizedSearchQuery = searchQuery ? searchQuery.toLowerCase().trim() : '';

      // Define filter conditions
      const filters = {
        location: selectedLocation !== "All Locations" ? selectedLocation : null,
        courseType: selectedCourseType !== "All Courses Types" ? selectedCourseType : null,
        courseName: selectedCourseName !== "All Courses Name" ? selectedCourseName : null,
        searchQuery: normalizedSearchQuery || null,
      };


    // Apply filters step by step
    let filteredDetails = originalData;

    // Apply location filter
    if (filters.location) {
      filteredDetails = filteredDetails.filter(data => data.course?.courseLocation === filters.location);
    }

    if (filters.courseType) {
      filteredDetails = filteredDetails.filter(data => data.course?.courseType === filters.courseType);
    }

    if (filters.courseName) {
      filteredDetails = filteredDetails.filter(data => data.course?.courseEngName === filters.courseName);
    }



    // Apply search query filter
    if (filters.searchQuery) {
      filteredDetails = filteredDetails.filter(data => {
        return [
          (data.participant?.name || "").toLowerCase(),
          (data.course?.courseLocation || "").toLowerCase(),
          (data.course?.courseType || "").toLowerCase(),
          (data.course?.courseEngName || "").toLowerCase(),
        ].some(field => field.includes(filters.searchQuery));
      });
    }


      // Log filtered results
      console.log("Filtered Details:", filteredDetails);

      const rowData = filteredDetails.map((item, index) => ({
        id: item._id,
        sn: index + 1,  // Serial number (S/N)
        name: item.participant.name,  // Participant's name
        contactNo: item.participant.contactNumber,  // Contact number
        course: item.course.courseEngName,  // Course English name
        courseChi: item.course.courseChiName,  // Course Chinese name
        location: item.course.courseLocation,  // Course location
        paymentMethod: item.course.payment,  // Payment method
        confirmed: item.official.confirmed,  // Confirmation status
        paymentStatus: item.status,  // Payment status
        recinvNo: item.official.receiptNo,  // Receipt number
        participantInfo: item.participant,  // Participant details
        courseInfo: item.course,  // Course details
        officialInfo: item.official,  // Official details
        refundedDate: item.official.refundedDate || ""// Official details
      }));

      // Update the row data with the filtered results
      this.setState({rowData})
      this.updateRowData(filteredDetails);
    }
  }

    render()
    {
      var {rowData} = this.state
      ModuleRegistry.registerModules([AllCommunityModule]);
      return (
        <>
          <div className="registration-payment-container" >
            <div className="registration-payment-heading">
              <h1>{this.props.language === 'zh' ? '报名与支付' : 'Registration And Payment'}</h1>
              <div className="button-row">
                <button className="save-btn" onClick={() => this.saveData(rowData)}>
                  Save Data
                </button>
                <button className="export-btn" onClick={() => this.exportToLOP(rowData)}>
                  Export To LOP
                </button>
                <button className="attendance-btn" onClick={() => this.exportAttendance(rowData)}>
                  Course Attendance
                </button>
              </div>
              <div className="grid-container">
              <AgGridReact
                  columnDefs={this.state.columnDefs}
                  rowData={rowData}
                  domLayout="normal"
                  paginationPageSize={rowData.length}
                  sortable={true}
                  statusBar={false}
                  pagination={true}
                  defaultColDef={{
                    resizable: true, // Make columns resizable
                  }}
                  onCellValueChanged={this.onCellValueChanged} // Handle cell value change
                  onCellClicked={this.handleValueClick} // Handle cell click event
                  getRowStyle={(params) => {
                    // Condition to change row style based on a specific value
                    if (params.data.courseInfo.courseType === 'ILP') {
                      return { backgroundColor: '#A8D5BA' }; // Olive green soft pastel color for ILP
                    } else if (params.data.courseInfo.courseType === 'OtherType') {
                      return { backgroundColor: '#FFB6C1' }; // Soft pink for other type
                    }
                    return {}; // Default style
                  }}
                />

              </div>
               {/* Render custom <div> below the expanded row */}
               {this.state.expandedRowIndex !== null && (
                <div
                style={{
                  padding: '10px',
                  backgroundColor: '#F9E29B',
                  marginLeft: '5%',
                  width: '88vw',
                  height: 'fit-content',
                  borderRadius: '15px', // Make the border more rounded
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Optional: Add a subtle shadow for a floating effect
                }}
                  >
                  {/* Custom content you want to display */}
                  <p  style={{textAlign:"left"}}><h2 style={{color:'#000000'}}>More Information</h2></p>
                  <p  style={{textAlign:"left"}}><h3 style={{color:'#000000'}}>Participant Details</h3></p>
                  <p style={{textAlign:"left"}}>
                    <strong>NRIC: </strong>{rowData[this.state.expandedRowIndex].participantInfo.nric}
                  </p>
                  <p style={{textAlign:"left"}}>
                    <strong>Residential Status: </strong>{rowData[this.state.expandedRowIndex].participantInfo.residentialStatus}
                  </p>
                  <p style={{textAlign:"left"}}>
                    <strong>Race: </strong>{rowData[this.state.expandedRowIndex].participantInfo.race}
                  </p>
                  <p style={{textAlign:"left"}}>
                    <strong>Gender: </strong>{rowData[this.state.expandedRowIndex].participantInfo.gender}
                  </p>                  <p style={{textAlign:"left"}}>
                    <strong>Date of Birth: </strong>{rowData[this.state.expandedRowIndex].participantInfo.dateOfBirth}
                  </p>
                  <p style={{textAlign:"left"}}>
                    <strong>Contact Number : </strong>{rowData[this.state.expandedRowIndex].participantInfo.contactNumber}
                  </p> 
                  <p style={{textAlign:"left"}}>
                    <strong>Email: </strong>{rowData[this.state.expandedRowIndex].participantInfo.email}
                  </p>
                  <p style={{textAlign:"left"}}>
                    <strong>Postal Code: </strong>{rowData[this.state.expandedRowIndex].participantInfo.postalCode}
                  </p>                  
                  <p style={{textAlign:"left"}}>
                    <strong>Education Level: </strong>{rowData[this.state.expandedRowIndex].participantInfo.educationLevel}
                  </p>
                  <p style={{textAlign:"left"}}>
                    <strong>Work Status: </strong>{rowData[this.state.expandedRowIndex].participantInfo.workStatus}
                  </p>
                  <p  style={{textAlign:"left"}}><h3 style={{color:'#000000'}}>Course Details</h3></p>
                  <p style={{textAlign:"left"}}>
                    <strong>Type: </strong>{rowData[this.state.expandedRowIndex].courseInfo.courseType}
                  </p>
                  <p style={{textAlign:"left"}}>
                    <strong>Price: </strong>{rowData[this.state.expandedRowIndex].courseInfo.coursePrice}
                  </p>
                  <p style={{textAlign:"left"}}>
                    <strong>Duration: </strong>{rowData[this.state.expandedRowIndex].courseInfo.courseDuration}
                  </p>
                  <p style={{textAlign:"left"}}><h3 style={{color:'#000000'}}>Official Use</h3></p>
                  <p style={{textAlign:"left"}}> 
                    <strong>Staff Name: </strong>{rowData[this.state.expandedRowIndex].officialInfo.name}
                  </p>
                  <p style={{textAlign:"left"}}>
                    <strong>Received Date: </strong>{rowData[this.state.expandedRowIndex].officialInfo.date}
                  </p>
                  <p style={{textAlign:"left"}}>
                    <strong>Received Time: </strong>{rowData[this.state.expandedRowIndex].officialInfo.time}
                  </p>
                  <p style={{textAlign:"left"}}>
                    <strong>Registration Date: </strong>{rowData[this.state.expandedRowIndex].registrationDate}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )
  }
}

export default RegistrationPaymentSection;
