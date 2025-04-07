import React, { Component } from 'react';
import * as XLSX from 'xlsx';
import '../../css/massImport.css';
import axios from 'axios';

class MassImport extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fileName: '', // Store the selected file name
      data: [], // Store the imported Excel data
    };
  }

  handleExcelFile = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
  
    // Set file name to state
    this.setState({
      fileName: file.name,
    });
  
    reader.onload = async (event) => {
      const bstr = event.target.result;
      const workbook = XLSX.read(bstr, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      console.log("BSTR:", worksheet);
  
      // Convert sheet to JSON, starting from row 2 (index 1)
      const json = XLSX.utils.sheet_to_json(worksheet, { 
        defval: ''        
      });

      console.log("JSON:", json);
      // Process the data into the required format
      const formattedData = json.map((row, index) => ({
        participant: {
          name: row['Participant Name'] || '',
          nric: row['Participant NRIC'] || '',
          residentialStatus: row['Participant Residential Status'] || '',
          race: row['Participant Race'] || '',
          gender: row['Participant Gender'] || '',
          dateOfBirth: row['Participant Date of Birth'] || '',
          contactNumber: row['Participant Contact Number'] || '',
          email: row['Participant Email'] || '',
          postalCode: row['Participant Postal Code'] || '',
          educationLevel: row['Participant Education Level'] || '',
          workStatus: row['Participant Work Status  '] || '',
        },
        course: {
          courseEngName: row['Course English Name'] || '',
          courseChiName: row['Course Chinese Name'] || '',
          courseLocation: row['Course Location'] || '',
          coursePrice: `$${parseFloat(row['Course Price']).toFixed(2)}` || '',
          courseDuration: row['Course Duration'] || '',
          payment: row['Payment'] || '',
        },
        agreement: row["Agreement"] || '',
        status: row['Payment Status'] || '',
        registrationDate: row['Registration Date'],
        official: {
          name: "",
          date: "",
          time: "",
          receiptNo: "",
          remarks: ""
        }
      }));
  
      // Store the formatted data in state
      this.setState({
        data: formattedData,
      });
  
      console.log('Formatted Data:', formattedData); // Log the formatted data for debugging
      await this.sendDataToAPI(formattedData);
    };
  
    reader.readAsArrayBuffer(file); // Read the file as a binary array
  };
  
    // Async function to send data to API
    sendDataToAPI = async (formattedData) => 
    {
        console.log("Mass Import Data:", formattedData);
        try 
        {
            const response = await axios.post(`${window.location.hostname === "localhost" ? 
                "http://localhost:3001" : 
                "https://ecss-backend-node.azurewebsites.net"}/massimport`, { purpose:"massimport", formattedData });
        
            console.log('API Response:', response);
            // Handle success, show success message or process the response data
        } 
        catch (error) 
        {
            console.error('API Error:', error);
            // Handle error, show error message to the user
        }
    };
  

  render() {
    return (
      <div className="upload-section">
        <h3>Upload Excel File</h3>
        <label htmlFor="file-input" className="custom-file-input">
          {this.state.fileName || 'Choose File'}
        </label>
        <input
          type="file"
          id="file-input"
          accept=".xlsx, .xls"
          onChange={this.handleExcelFile}
          className="file-input"
        />
        {this.state.data.length > 0 && (
          <div>
            <h4>Imported Data:</h4>
            <pre>{JSON.stringify(this.state.data, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  }
}

export default MassImport;
