import React, { Component } from 'react';
import axios from 'axios';
import '../../../css/sub/registrationPayment.css';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'; 
import JSZip from 'jszip';

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
        editedRowIndex: "",
        aiSearchQuery: '',
        aiSuggestions: [],
        anomalyThreshold: 0.8,
        phoneNumber: '',
        message: '',
        status: '',
        isAlertShown: false,
        selectedRows: []
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
        const response1 = await axios.post(`${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`, { purpose: 'retrieve', role: "admin", siteIC: "" });
        console.log("Course Registration:", response);
    
        const data = this.languageDatabase(response.data.result, language);
        const data1 = this.languageDatabase(response1.data.result, language);
        return {data, data1};
    
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
      const {data, data1} = await this.fetchCourseRegistrations(language);
      //.log('All Courses Registration:  ', data);
      // Call anomaliesAlert only once
      var locations = await this.getAllLocations(data);
      var types = await this.getAllTypes(data);
      var names = await this.getAllNames(data);
      var quarters = await this.getAllQuarters(data);
      this.props.passDataToParent(locations, types, names, quarters);

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
      await this.getRowData(data);
      if (!this.state.isAlertShown) {
       await this.anomalitiesAlert(data1);
        // Use a callback to set the state after the alert has been shown
        this.setState({ isAlertShown: true });
      }
    
      this.props.closePopup();
    }

    getAnomalyRowStyles = (data) => {
      const styles = {};
      const seen = [];
    
      for (let index = 0; index < data.length; index++) {
        const item = data[index];
        const name = item.participantInfo.name;
        const courseName = item.courseInfo.courseEngName;
        const location = item.courseInfo.courseLocation;
    
        for (let i = 0; i < index; i++) {
          const prev = data[i];
    
          // Check for anomalies where the same person is registered for the same course but at different locations
          if (
            prev.participantInfo.name === name &&
            prev.courseInfo.courseEngName === courseName &&
            prev.courseInfo.courseLocation !== location
          ) {
            styles[index] = { backgroundColor: '#FFDDC1' };
            styles[i] = { backgroundColor: '#FFDDC1' };
    
            // Alert with the anomaly details (name, course name, and locations)
            //alert(`Anomaly detected! Name: ${name}, Course: ${courseName}, Locations: ${prev.courseInfo.courseLocation} and ${location}`);
          }
          else if (
            prev.participantInfo.name === name &&
            prev.courseInfo.courseEngName === courseName &&
            prev.courseInfo.courseLocation === location
          ) {
            styles[index] = { backgroundColor: '	#87CEEB' };
            styles[i] = { backgroundColor: '	#87CEEB' };
    
            // Alert with the anomaly details (name, course name, and locations)
            //alert(`Anomaly detected! Name: ${name}, Course: ${courseName}, Locations: ${prev.courseInfo.courseLocation} and ${location}`);
          }
        }
      }
    
      return styles;
    };

    anomalitiesAlert = (data) => {
      const anomalies = []; // Collect anomalies
            
      // Loop through your data to find anomalies and collect them
      for (let index = 0; index < data.length; index++) {
        const item = data[index];
        const name = item.participant.name;
        const courseName = item.course.courseEngName;
        const location = item.course.courseLocation;
              
        for (let i = 0; i < index; i++) {
          const prev = data[i];
                  
          if (
            prev.participant.name === name &&
            prev.course.courseEngName === courseName &&
            prev.course.courseLocation !== location
          ) {
            anomalies.push({
              originalIndex: index+1,
              name: name,
              course: courseName,
              locations: `${prev.course.courseLocation} (index: ${i+1}) and ${location} (index: ${index+1})`,
              type: "Person registered same course in different locations"
            });
          }
          else if(
            prev.participant.name === name &&
            prev.course.courseEngName === courseName &&
            prev.course.courseLocation === location
          ) {
            anomalies.push({
              originalIndex: index+1,
              name: name,
              course: courseName,
              locations: `${prev.course.courseLocation} (index: ${i+1}) and ${location} (index: ${index+1})`,
              type: "Person registered same course in same location"
            });
          }
        }
      }
            
      // Show alert only once with unique anomalies
      if (anomalies.length > 0) {
        // Remove duplicates based on a unique identifier
        const seen = new Set();
        const uniqueAnomalies = anomalies.filter(item => {
          const key = `${item.name}-${item.course}-${item.locations}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        
        // Create a pre-formatted string with sequential S/N
        let alertMessage = "Anomalies detected:\n\n";
        uniqueAnomalies.forEach((anomaly, index) => {
          alertMessage += `S/N: ${index+1}\n`;
          alertMessage += `Name: ${anomaly.name}, `;
          alertMessage += `Course: ${anomaly.course}\n`;
          alertMessage += `Locations: ${anomaly.locations}\n`;
          alertMessage += `Anomaly Type: ${anomaly.type}\n\n`;
        });
        
        alert(alertMessage);
      }
    };
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

    getAllQuarters = async (datas) => {
      const quarters = datas.map(data => {
        if (!data?.course?.courseDuration) return null; // Handle missing data
    
        const firstDate = data.course.courseDuration.split(' - ')[0]; // Extract "2 May 2025"
        const [day, monthStr, year] = firstDate.split(' '); // Split into components
    
        // Convert month string to a number
        const monthMap = {
          "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
          "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
        };
    
        const month = monthMap[monthStr];
        if (!month || !year) return null; // Skip if month or year is missing
    
        // Determine the quarter
        let quarter = "";
        if (month >= 1 && month <= 3) quarter = `Q1 ${year}`;
        if (month >= 4 && month <= 6) quarter = `Q2 ${year}`;
        if (month >= 7 && month <= 9) quarter = `Q3 ${year}`;
        if (month >= 10 && month <= 12) quarter = `Q4 ${year}`;
    
        return quarter;
      });
    
      // Remove null values and sort chronologically
      return [...new Set(quarters.filter(Boolean))].sort((a, b) => {
        const [qA, yearA] = a.split(" ");
        const [qB, yearB] = b.split(" ");
        return yearA - yearB || qA.localeCompare(qB); // Sort by year first, then by quarter
      });
    };      

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


      receiptShown = async (participant, course, receiptNo, officialInfo) => {
        try {
          // Define the purpose based on payment type
          let purpose = course.payment === "Cash" || course.payment === "PayNow" ? "receipt" : "invoice";
      
          // Send request to backend to generate PDF
          const pdfResponse = await axios.post(
            `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`,
            {
              purpose,
              participant,
              course,
              staff: this.props.userName,
              receiptNo,
              officialInfo
            },
            { responseType: "blob" }
          );
      
          // Dynamically generate filename based on participant name, payment type, and receipt number
          const filename = `${participant.name}-${course.payment}-${receiptNo}.pdf`;
          console.log("Generated Filename:", filename);  // Debugging
      
          // Create a Blob from the PDF data
          const blob = new Blob([pdfResponse.data], { type: "application/pdf" });
      
          // Create a Blob URL
          const blobUrl = window.URL.createObjectURL(blob);
      
          // Open the PDF in a new tab for viewing
          const pdfWindow = window.open(blobUrl, "_blank");
      
          // Fallback if popups are blocked
          if (!pdfWindow) {
            alert("Please allow popups to view the PDF receipt.");
          }
      
          // Create a temporary <a> element to trigger the download
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = filename;  // Set the filename for download
          a.click();  // Programmatically click to download the PDF
      
          // Clean up by revoking the Blob URL after download is triggered
          window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
          console.error("Error generating PDF receipt:", error);
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
      
      
    /*async saveData(paginatedDetails) {
        console.log("Save Data:", paginatedDetails);
    
        // Prepare the data for Excel
        const preparedData = [];

        // Define the sub-headers
        const headers = [
          "S/N", "Participant Name", "Participant NRIC", "Participant Residential Status", 
          "Participant Race", "Participant Gender", "Participant Date of Birth",
          "Participant Contact Number", "Participant Email", "Participant Postal Code", 
          "Participant Education Level", "Participant Work Status",
          "Course Type", "Course English Name", "Course Chinese Name", "Course Location",
          "Course Mode", "Course Price", "Course Duration", "Payment", 
          "Registration Date", "Agreement", "Payment Status", "Confirmation Status", 
          "Refunded Date", "WhatsApp Message Sent",
          "Staff Name", "Received Date", "Received Time", "Receipt/Invoice Number", "Remarks"
      ];
    
        preparedData.push(headers);
    
        // Add the values
        paginatedDetails.forEach((index, detail) => {
            const row = [
                index + 1,
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
                detail.course.courseMode,
                detail.courseInfo.coursePrice,
                detail.courseInfo.courseDuration,
                detail.registrationDate,
                detail.courseInfo.payment,
                detail.agreement,
                detail.status,
                detail.registrationDate,
                detail.officialInfo?.refundedDate,
                detail.sendingWhatsappMessage,
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
    }*/

    async saveData(paginatedDetails) {
      console.log("Save Data:", paginatedDetails);
      
      // Prepare the data for Excel
      const preparedData = []; 
      
      // Define the sub-headers
      const headers = [
          "S/N", 
          "Participant Name", "Participant NRIC", "Participant Residential Status", 
          "Participant Race", "Participant Gender", "Participant Contact Number",
          "Participant Email", "Participant Postal Code", "Participant Education Level", 
          "Participant Work Status", "Participant Date of Birth", "Registration Date",
          "Course Type", "Course English Name", "Course Chinese Name", "Course Location", "Course Mode",
          "Course Price", "Course Duration", "Agreement", "WhatsApp Message Sent", 
          "Confirmation Status", "Payment Method", "Payment Status", "Staff Name", "Payment Date", "Payment Time", 
          "Receipt/Invoice Number", "Remarks",  "Refunded Date" 
      ];
      
      preparedData.push(headers);
      
      // Add the values - mapping from the actual JSON structure
      paginatedDetails.forEach((detail, index) => {
          const row = [
              index + 1,
              detail.participantInfo?.name || "",
              detail.participantInfo?.nric || "",
              detail.participantInfo?.residentialStatus || "",
              detail.participantInfo?.race || "",
              detail.participantInfo?.gender || "",
              detail.participantInfo?.contactNumber || "",
              detail.participantInfo?.email || "",
              detail.participantInfo?.postalCode || "",
              detail.participantInfo?.educationLevel || "",
              detail.participantInfo?.workStatus || "",
              detail.participantInfo?.dateOfBirth || "",
              detail.courseInfo?.courseType || "",
              detail.courseInfo?.courseEngName || "",
              detail.courseInfo?.courseChiName || "",
              detail.courseInfo?.courseLocation || "",
              detail.courseInfo?.coursePrice || "",
              detail.courseInfo?.courseDuration || "",
              detail.courseInfo?.payment || "",
              detail.courseInfo?.courseMode || "",
              detail.registrationDate || "",
              detail.agreement || "",
              detail.status || "",
              detail.officialInfo?.confirmed ? "Yes" : "No",
              detail.officialInfo?.name || "",
              detail.officialInfo?.date || "",
              detail.officialInfo?.time || "",
              detail.officialInfo?.receiptNo || "",
              detail.officialInfo?.remarks || "",
              detail.officialInfo?.refundedDate || "",
              detail.sendDetails ? "Yes" : "No"
          ];
          preparedData.push(row);
      });
      
      // Set column widths based on content
      const colWidths = [];
      for (let i = 0; i < headers.length; i++) {
          let maxWidth = headers[i].length;
          for (let j = 1; j < preparedData.length; j++) {
              const cellValue = preparedData[j][i];
              const cellWidth = cellValue ? String(cellValue).length : 0;
              maxWidth = Math.max(maxWidth, cellWidth);
          }
          // Add some padding and set the width
          colWidths.push({ wch: maxWidth + 2 });
      }
      
      // Convert the prepared data into a worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(preparedData);
      
      // Apply column widths
      worksheet['!cols'] = colWidths;
      
      // Apply bold formatting to header row
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
          worksheet[cellAddress].s = { font: { bold: true } };
      }
      
      // Create a new workbook and add the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Exported Data");
      
      // Generate filename with current date
      const date = new Date();
      const formattedDate = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${date.getFullYear()}`;
      const fileName = `exported_data_${formattedDate}`;
      
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
      
      // Clean up
      window.URL.revokeObjectURL(link.href);
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

    exportToLOP = async () => 
    {
      try {
        console.log("Selected Row:", this.state.selectedRows);
        var {selectedRows} = this.state;      
        // Fetch the Excel file from public folder (adjust the path if necessary)
        const filePath = '/external/OSG NSA List of participants (20250401).xlsx';  // Path relative to the public folder
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
    
        console.log("Paginated Details :", selectedRows, selectedRows.length);

        selectedRows.sort((a, b) => {
          const nameA = a.participantInfo.name.trim().toLowerCase();
          const nameB = b.participantInfo.name.trim().toLowerCase();
          return nameA.localeCompare(nameB); // Compare names alphabetically
        });
    
        selectedRows.forEach((detail, index) => {
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
            sourceSheet.getCell(`I${rowIndex}`).value = detail.participantInfo.race.split(" ")[0][0];
            sourceSheet.getCell(`J${rowIndex}`).value = detail.participantInfo.contactNumber;
            sourceSheet.getCell(`K${rowIndex}`).value = detail.participantInfo.email;
            sourceSheet.getCell(`L${rowIndex}`).value = detail.participantInfo.postalCode;
    
            const educationParts = detail.participantInfo.educationLevel.split(" ");
            sourceSheet.getCell(`M${rowIndex}`).value = educationParts.length === 3 ? educationParts[0] + " " + educationParts[1] : educationParts[0];
    
            const workParts = detail.participantInfo.workStatus.split(" ");
            sourceSheet.getCell(`N${rowIndex}`).value = workParts.length === 3 ? workParts[0] + " " + workParts[1] : workParts[0];
    
            let courseName = detail.courseInfo.courseEngName;
            sourceSheet.getCell(`O${rowIndex}`).value = this.ecssCourseCode(courseName);
            let languages = courseName.split("–").pop().trim();
            if (!((languages === "English") || (languages === "Mandarin"))) {
              // If "English" or "Mandarin" is not in the course name, don't split
              sourceSheet.getCell(`P${rowIndex}`).value = courseName.trim();
            } else {
              // Otherwise, split by "–" and assign the first part
              sourceSheet.getCell(`P${rowIndex}`).value = courseName.split("–")[0].trim();
            }
            sourceSheet.getCell(`R${rowIndex}`).value = detail.courseInfo.coursePrice;  
            let priceStr = detail.courseInfo.coursePrice; // e.g., "$12.34"
            let numericValue = parseFloat(priceStr.replace('$', ''))// Step 2: Multiply by 5
            let multiplied = numericValue * 5;
            let formattedPrice = `$${multiplied.toFixed(2)}`;
            sourceSheet.getCell(`Q${rowIndex}`).value = formattedPrice;
          
            
    
            const [startDate, endDate] = detail.courseInfo.courseDuration.split(" - ");
            sourceSheet.getCell(`S${rowIndex}`).value = this.convertDateFormat1(startDate);
            sourceSheet.getCell(`T${rowIndex}`).value = this.convertDateFormat1(endDate);
            sourceSheet.getCell(`U${rowIndex}`).value = detail.courseInfo.courseMode === "Face-to-Face" ? "F2F" : detail.courseInfo.courseMode;
    
            sourceSheet.getCell(`W${rowIndex}`).value = detail.courseInfo.coursePrice;
            sourceSheet.getCell(`X${rowIndex}`).value = detail.courseInfo.payment === "SkillsFuture" ? "SFC" : detail.courseInfo.payment;
            sourceSheet.getCell(`AD${rowIndex}`).value = detail.officialInfo.receiptNo;
            sourceSheet.getCell(`V${rowIndex}`).value = detail.courseInfo.courseLocation === "Pasir Ris West Wellness Centre" ? "510605," : "";
    
            // Copy styles from the original row
            originalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const newCell = newDataRow.getCell(colNumber);
              newCell.style = cell.style;
            });
          }
        });

        let total = selectedRows.reduce((sum, item) => {
          let priceStr = item?.courseInfo?.coursePrice || "$0";
          let numeric = parseFloat(priceStr.replace('$', ''));
        
          // If parseFloat fails and returns NaN, fallback to 0
          return sum + (isNaN(numeric) ? 0 : numeric);
        }, 0);
        
        let formattedTotal = `$${total.toFixed(2)}`;
        
        sourceSheet.getCell(`R5`).value = formattedTotal;

       // Create new file name and sav
        const originalFileName = `OSG NSA List of participants (20350401) as of ${this.getCurrentDateTime()}.xlsx`
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


    ecssCourseCode(course) {
        //The Rest Note of Life – Mandarin 14-Feb
        course = course.trim();
        console.log("Course Name111: ", course);
    
        //Therapeutic Basic Line Work
        const courseMap = {
            "TCM – Don’t be a friend of Chronic Diseases": "ECSS-CBO-M-016C",
            "Nagomi Pastel Art Basic": "ECSS-CBO-M-019C",
            "Therapeutic Watercolour Painting for Beginners": "ECSS-CBO-M-024E",
            "Chinese Calligraphy Intermediate": "ECSS-CBO-M-021C",
            "Chinese Calligraphy Basic": "ECSS-CBO-M-020C",
            "Nagomi Pastel Art Appreciation": "ECSS-CBO-M-018C",
            "Community Ukulele – Mandarin": "ECSS-CBO-M-004C",
            "Community Singing – Mandarin": "ECSS-CBO-M-003C",
            "Self-Care TCM Wellness – Mandarin": "ECSS-CBO-M-001C",
            "Hanyu Pinyin for Beginners": "ECSS-CBO-M-011C",
            "The Rest Note of Life – Mandarin": "ECSS-CBO-M-023C",
            "TCM Diet & Therapy": "ECSS-CBO-M-010C",
            "Therapeutic Basic Line Work": "ECSS-CBO-M-030E",
            "Healthy Minds, Healthy Lives – Mandarin": "ECSS-CBO-M-028C",
            "Smartphone Photography": "ECSS-CBO-M-038C",
            "Art of Positive Communication builds happy homes": "ECSS-CBO-M-031C"
            //Healthy Minds, Healthy Lives – Mandarin
        };

        // Check for exact match
        if (courseMap[course]) {
            return courseMap[course];
        }
    
        // If no match, return a default value
        return "";
      }

    exportAttendance = async () => {
      var { selectedCourseName, selectedLocation } = this.props;
      var {selectedRows} = this.state;
      console.log("Export To Attendance:", selectedRows);
    
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
        for (let i = 0; i < selectedRows.length; i++) {
          const item = selectedRows[i];
          if (item.course === selectedCourseName) {
            courseCommencementDate = item.courseInfo.courseDuration.split("-")[0].trim();
            break;
          }
        }
      
        console.log("Course Commerce Date:", courseCommencementDate);

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

        // Sort participants alphabetically by name (trim spaces)
        let sortedParticipants = selectedRows
                                  .filter(item => item.course === selectedCourseName && item.courseInfo.courseLocation === selectedLocation)
                                  .sort((a, b) => a.participantInfo.name.trim().toLowerCase().localeCompare(b.participantInfo.name.trim().toLowerCase()));
        console.log("Sorted Participants:", sortedParticipants);

       // Loop for S/N and Name starting from row 6 in Columns A and B
        let rowIndex = 6; // Start from row 6 for S/N and Name
        let participantIndex = 1;  // Initialize participant index for S/N
        for (let i = 0; i < sortedParticipants.length; i++) {
          const item = sortedParticipants[i];
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
        const courseDuration = selectedRows[0]?.courseInfo?.courseDuration || '';
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
        pinned: "left"
      },
      {
        headerName: "Name",
        field: "name",
        width: 300,
        editable: true,
        pinned: "left"
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
        headerName: "Course Mode",
        field: "courseMode",
        width: 150,
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
        headerName: "Sending Payment Details",
        field: "sendDetails",
        width: 300,
        cellRenderer: (params) => {
          const isSent = params.data?.sendDetails; // No need for !! as we handle undefined explicitly
        
          if (isSent === undefined) {
            return null; // Return nothing (blank cell)
          }
        
          const imageSrc = isSent
            ? "https://upload.wikimedia.org/wikipedia/commons/2/29/Tick-green.png" // ✅ Green Tick
            : "https://upload.wikimedia.org/wikipedia/commons/5/5f/Red_X.svg"; // ❌ Red Cross
        
          return <img src={imageSrc} alt={isSent ? "Sent" : "Not Sent"} width="20" height="20" />;
        }        
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
        headerName: "Receipt/Invoice Number",
        field: "recinvNo",
        width: 300,
      },     
      {
        headerName: "Payment Date",
        field: "paymentDate",
        width: 350,
        editable: true
      },

      {
        headerName: "Refunded Date",
        field: "refundedDate",
        width: 350,
        editable: true
      },
      {
        headerName: "Remarks",
        field: "remarks",
        width: 300,
        editable: (params) => {
          // Disable editing if the paymentStatus is "Cancelled" or "Refunded"
          return params.data.paymentStatus === 'Cancelled' || params.data.paymentStatus === 'Refunded';
        }
      }
    ];


    // Add the "Delete" button column conditionally
    {/*if (!["Site in-charge", "Finance"].includes(role)) {
      columnDefs.push({
        headerName: "",
        field: "delete",
        width: 100,
        pinned: 'right', // Pin the checkbox column
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
        )
      });
    }*/}
  
    // Add the "Port Over" button column conditionally
    if (!["Ops in-charge", "NSA in-charge", "Finance"].includes(role)) {
      columnDefs.push({
        headerName: "",
        field: "portOver",
        width: 150,
        pinned: 'right', // Pin the checkbox column
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
    columnDefs.push({
      headerName: '', // blank header (no text)
      field: 'checkbox',
      checkboxSelection: true,
      width: 50,
      pinned: 'right', // Pin the checkbox column
    });
    
    
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

  getRowData = (registerationDetails) => 
  {
    console.log("Get Row Data:", registerationDetails);
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
        courseMode: item.course.courseMode === "Face-to-Face" ? "F2F" : item.course?.courseMode,
        sendDetails: item.sendingWhatsappMessage,
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
        refundedDate: item.official?.refundedDate || "",
        remarks: item.official?.remarks || "",
        paymentDate: item.official?.date || ""
      };
    });
    console.log("All Rows Data:", rowData);
    // Set the state with the new row data
  
    this.setState({registerationDetails: rowData, rowData });
  };


  handleValueClick = async (event) =>
  {
    console.log("handleValueClick", event.data);
    const id = event.data.id;
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
        else if (columnName === "Contact Number")
        {
            console.log("Course Info:", courseInfo);
            if(participantInfo && participantInfo.contactNumber && courseInfo.payment === "SkillsFuture")
            {
              const phoneNumber = participantInfo.contactNumber.replace(/\D/g, ""); // Remove non-numeric characters
              const message = `${participantInfo.name} - ${courseInfo.courseEngName} invoice for your SkillsFuture submission
              Please ensure that the details are accurate before submission.
              🔴 Please send us a screenshot of your submission once done.
              More Information: https://ecss.org.sg/wp-content/uploads/2025/03/Handphone-SFC-claim-step-by-step-via-handphone.pdf`;

              
              const whatsappWebURL = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
              
              window.open(whatsappWebURL, "_blank"); // Opens in a new browser tab              
            }
            else if (participantInfo && participantInfo.contactNumber && (courseInfo.payment === "PayNow" || courseInfo.payment === "Cash"))
            {
              const phoneNumber = participantInfo.contactNumber.replace(/\D/g, ""); // Remove non-numeric characters
              const message = `${courseInfo.courseEngName} - ${courseInfo.courseDuration.split("–")[0]}
                Course subsidy applies to only Singaporeans and PRs aged 50yrs and above
                Hi ${participantInfo.name}, 
                Thank you for signing up for the above-mentioned class. 
                Details are as follows:
                Price: ${courseInfo.coursePrice}
                Payment to be made via Paynow to UEN no: T03SS0051L (En Community Services Society) 
                Under the "reference portion", kindly insert your name as per NRIC. 
                Once payment has gone through, take a screenshot of the payment receipt on your phone and send it over to us. 
                Thank you.`;

              
              const whatsappWebURL = `https://web.whatsapp.com/send?phone=+65${phoneNumber}&text=${encodeURIComponent(message)}`;
              console.log("Whatsapp Link:", whatsappWebURL)
              
              window.open(whatsappWebURL, "_blank"); // Opens in a new browser tab              
            }
            console.log("Submitted Id:", id);
            await this.sendDetails(id);
            //await this.refreshChild();
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
    console.log("Event Data111:", event);
    const columnName = event.colDef.headerName;
    const id = event.data.id;
    const sn = event.data.sn;
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
    const oldPaymentStatus = event.oldValue;

    console.log("Column Name:", columnName);
    //this.setState({editedRowIndex: id});

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
          this.props.showUpdatePopup("Updating in progress... Please wait ...");
          
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
                          const response = await axios.post(
                            `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`,
                            {
                              id: id,
                              purpose: 'removedRefundedDate'
                            }
                          );
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
                if(oldPaymentStatus === "SkillsFuture Done")
                {
                  const performParallelTasks = async () => {
                    try {
                      // Run the two functions in parallel using Promise.all
                      await Promise.all([
                        this.updateWooCommerceForRegistrationPayment(courseChiName, courseName, courseLocation, newValue),
                      ]);
                      console.log("Both tasks completed successfully.");
                      const response = await axios.post(
                        `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`,
                        {
                          id: id,
                          purpose: 'removedRefundedDate'
                        }
                      );
                      console.log("Response Add Refunded Date:", response);
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
        else if (columnName === "Remarks")
        {
          console.log("Now editing remarks", newValue);
          if(newValue !== "")
          {
            const response = await axios.post(
              `${window.location.hostname === "localhost" ? "http://localhost:3001" : "https://ecss-backend-node.azurewebsites.net"}/courseregistration`,
              {
                purpose: 'addCancelRemarks',
                id: id,
                editedValue: newValue
              });
          }
          else
          {
            alert("No remarks added");
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
          )  
        }
        this.refreshChild(); 
    } catch (error) {
      console.error('Error during submission:', error);
      this.props.closePopup();
    }
  };

  refreshChild = async () => 
  {
    const { language } = this.props;
    
    // Save scroll information before fetching data
    const gridContainer = document.querySelector('.ag-body-viewport');
    const currentScrollTop = gridContainer ? gridContainer.scrollTop : 0;
    
    // Fetch new data
    const {data, data1} = await this.fetchCourseRegistrations(language);
    //console.log("New Data:", newData);
    
    // Map only the items that exist in current rowData
    const existingIds = new Set(this.state.rowData.map(item => item.id));
    console.log("existingIds:", existingIds);
    
    const updatedRowData = data
      .filter(item => existingIds.has(item._id))
      .map((item, index) => ({
        id: item._id,
        sn: index + 1,
        name: item.participant.name,
        contactNo: item.participant.contactNumber,
        course: item.course.courseEngName,
        courseChi: item.course.courseChiName,
        location: item.course.courseLocation,
        courseMode: item.course.courseMode === "Face-to-Face" ? "F2F" : item.course.courseMode,
        paymentMethod: item.course.payment,
        confirmed: item.official.confirmed,
        paymentStatus: item.status,
        recinvNo: item.official.receiptNo,
        participantInfo: item.participant,
        courseInfo: item.course,
        officialInfo: item.official,
        refundedDate: item.official?.refundedDate, // Fixed typo from 'offical'
        agreement: item.agreement,
        remarks: item.official?.remarks,
        registrationDate: item.registrationDate,
        sendDetails: item.sendingWhatsappMessage,
        paymentDate: item.official?.date || ""
      }));

      /*if (!this.state.isAlertShown) {
        await this.anomalitiesAlert(data1);
         // Use a callback to set the state after the alert has been shown
         this.setState({ isAlertShown: true });
       }*/
     
    
    // Update state and restore scroll position in one step
    this.setState({
      originalData: data,
      registerationDetails: data,
      rowData: updatedRowData
    }, () => {
      // Restore scroll position directly
      if (gridContainer) {
        gridContainer.scrollTop = currentScrollTop;
      }
      
      this.props.closePopup();
    });
  };

 // MUpdate is called after the component has updated (re-rendered)
  componentDidUpdate(prevProps, prevState) {
    const { selectedLocation, selectedCourseType, searchQuery, selectedCourseName, selectedQuarter} = this.props;
    console.log("This Props Current:", selectedQuarter);
    // Check if the relevant props have changed
    if (
      selectedLocation !== prevProps.selectedLocation ||
      selectedCourseType !== prevProps.selectedCourseType ||
      selectedCourseName !== prevProps.selectedCourseName ||
      selectedQuarter !== prevProps.selectedQuarter ||
      searchQuery !== prevProps.searchQuery
    ) {
      //console.log("ComponentDidUpdate");
      // Call the filter method when relevant props change
      this.filterRegistrationDetails();
    }
  }

  
  sendDetails = async (id) =>
  {
    await this.props.generateSendDetailsConfirmationPopup(id);
  }

  filterRegistrationDetails() {
    const { section, selectedLocation, selectedCourseType, selectedCourseName, searchQuery, selectedQuarter } = this.props;
    console.log("Section:", section);

    if (section === "registration") {
      const { originalData } = this.state;

      console.log("Original Data:", originalData);
      console.log("Filters Applied:", { selectedLocation, selectedCourseType, searchQuery, selectedCourseName }, !searchQuery);
      console.log("Result:", selectedCourseName, !selectedCourseName); 


      if (
        (selectedLocation === "All Locations" || !selectedLocation) &&
        (selectedCourseType === "All Courses Types" || !selectedCourseType) &&
        (selectedCourseName === "All Courses Name" || !selectedCourseName) &&
        (selectedQuarter === "All Quarters" || !selectedQuarter) &&
        (searchQuery === "" || !searchQuery)
      ) {
        const rowData = originalData.map((item, index) => ({
          id: item._id,
          sn: index + 1,  // Serial number (S/N)
          name: item.participant.name,  // Participant's name
          contactNo: item.participant.contactNumber,  // Contact number
          course: item.course.courseEngName,  // Course English name
          courseChi: item.course.courseChiName,  // Course Chinese name
          courseMode: item.course.courseMode === "Face-to-Face" ? "F2F" : item.course.courseMode,
          location: item.course.courseLocation,  // Course location
          paymentMethod: item.course.payment,  // Payment method
          confirmed: item.official.confirmed,  // Confirmation status
          paymentStatus: item.status,  // Payment status
          recinvNo: item.official.receiptNo,  // Receipt number
          participantInfo: item.participant,  // Participant details
          courseInfo: item.course,  // Course details
          officialInfo: item.official,  // Official details
          refundedDate: item.offical?.refundedDate,// Official details*/
          agreement: item.agreement,
          registrationDate: item.registrationDate,
          remarks: item.official.remarks,
          sendDetails: item.sendingWhatsappMessage,
          paymentDate: item.official?.date || ""
        }));
  
        // Update the row data with the filtered results
        this.setState({rowData});
        //this.setState({registerationDetails: rowData});
        this.updateRowData(rowData);
      }

      // Normalize the search query
      const normalizedSearchQuery = searchQuery ? searchQuery.toLowerCase().trim() : '';

      // Define filter conditions
      const filters = {
        location: selectedLocation !== "All Locations" ? selectedLocation : null,
        courseType: selectedCourseType !== "All Courses Types" ? selectedCourseType : null,
        courseName: selectedCourseName !== "All Courses Name" ? selectedCourseName : null,
        quarter: selectedQuarter !== "All Quarters" ? selectedQuarter : null,
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

    if (filters.quarter) {
      filteredDetails = filteredDetails.filter(data => {
        const courseDuration = data.course?.courseDuration;
        if (!courseDuration) return false; // Skip if courseDuration is missing
    
        const firstDate = courseDuration.split(' - ')[0]; // Extract "2 May 2025"
        const [day, monthStr, year] = firstDate.split(' '); // Split into components
    
        // Convert month string to a number
        const monthMap = {
          "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
          "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
        };        
    
        const month = monthMap[monthStr];
        if (!month || !year) return false; // Skip invalid entries
    
        // Determine the quarter
        let quarter = "";
        if (month >= 1 && month <= 3) quarter = `Q1 ${year}`;
        if (month >= 4 && month <= 6) quarter = `Q2 ${year}`;
        if (month >= 7 && month <= 9) quarter = `Q3 ${year}`;
        if (month >= 10 && month <= 12) quarter = `Q4 ${year}`;
    
        return quarter === filters.quarter; // Check if it matches the filter
      });
    }    

    // Apply search query filter
    if (filters.searchQuery) {
      filteredDetails = filteredDetails.filter(data => {
        return [
          (data.participant?.name || "").toLowerCase(),
          (data.course?.courseLocation || "").toLowerCase(),
          (data.course?.courseType || "").toLowerCase(),
          (data.course?.courseEngName || "").toLowerCase(),
          (data.course?.courseDuration || "").toLowerCase(),
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
        courseMode: item.course.courseMode === "Face-to-Face" ? "F2F" : item.course.courseMode,
        paymentMethod: item.course.payment,  // Payment method
        confirmed: item.official.confirmed,  // Confirmation status
        paymentStatus: item.status,  // Payment status
        recinvNo: item.official.receiptNo,  // Receipt number
        participantInfo: item.participant,  // Participant details
        courseInfo: item.course,  // Course details
        officialInfo: item.official,  // Official details
        refundedDate: item.offical?.refundedDate,// Official details*/
        agreement: item.agreement,
        registrationDate: item.registrationDate,
        sendDetails: item.sendingWhatsappMessage,
        remarks: item.official.remarks,
        paymentDate: item.official?.date || ""
      }));

      // Update the row data with the filtered results
      this.setState({rowData})
      this.updateRowData(filteredDetails);
    }
  }

  onSelectionChanged = (event) => {
    const selectedRows = event.api.getSelectedRows();
    this.setState({ selectedRows });
  };

  render()
  {
    var {rowData, registerationDetails} = this.state;
    ModuleRegistry.registerModules([AllCommunityModule]);
    const anomalyStyles = this.getAnomalyRowStyles(rowData);

    return (
      <>
        <div className="registration-payment-container" >
          <div className="registration-payment-heading">
            <h1>{this.props.language === 'zh' ? '报名与支付' : 'Registration And Payment'}</h1>
            <div className="button-row">
              <button className="save-btn" onClick={() => this.saveData(rowData)}>
                Save/Archive Data
              </button>
              <button className="export-btn" onClick={() => this.exportToLOP()}>
                Export To LOP
              </button>
              <button className="attendance-btn" onClick={() => this.exportAttendance()}>
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
              rowSelection="multiple" // <-- Enables multi-selection
              defaultColDef={{
                resizable: true,
                sortable: true, // Just in case you want all columns to be sortable by default
              }}
              onGridReady={this.onGridReady}
              onCellValueChanged={this.onCellValueChanged}
              onCellClicked={this.handleValueClick}
              onSelectionChanged={this.onSelectionChanged}
              suppressRowClickSelection={true} // prevents cell click from selecting
              getRowStyle={(params) => {
                const rowIndex = params.node.rowIndex;
                const courseType = params.data.courseInfo.courseType;

                let rowStyle = {};

                if (courseType === 'ILP') {
                  rowStyle.backgroundColor = '#A8D5BA';
                } else if (courseType === 'OtherType') {
                  rowStyle.backgroundColor = '#FFB6C1';
                }

                if (anomalyStyles[rowIndex]) {
                  rowStyle.backgroundColor = '#FFDDC1'; // anomaly wins
                }

                return rowStyle;
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
