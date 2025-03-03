const DatabaseConnectivity = require("../../database/databaseConnectivity"); // Import the class

class ReceiptController {
    constructor() {
        this.databaseConnectivity = new DatabaseConnectivity(); // Create an instance of DatabaseConnectivity
    }

    // Method to handle generating a new receipt number
    async newReceiptNo(courseLocation, centreLocation) { // Accept courseLocation as a parameter
        try {
            // Connect to the database
            const result = await this.databaseConnectivity.initialize();
            console.log("Database Connectivity:", result);

            if (result === "Connected to MongoDB Atlas!") {
                const databaseName = "Courses-Management-System";
                const collectionName = "Receipts";

                // Find the highest existing receipt number for the given course location
                const newReceiptNumber = await this.databaseConnectivity.getNextReceiptNumber(databaseName, collectionName, courseLocation, centreLocation);
                console.log("New Receipt Number:", newReceiptNumber);


                // Return the newly generated receipt number
                return {
                    success: true,
                    message: "New receipt number generated successfully",
                    receiptNumber: newReceiptNumber
                };
            }
        } 
        catch (error) {
            return {
                success: false,
                message: "Error generating new receipt number",
                error: error
            };
        } 
        finally {
            await this.databaseConnectivity.close(); // Ensure the connection is closed
        }
    }


    async createReceipt(receiptNo, registration_id, url, staff, date, time, location) {
        try {
            // Prepare receipt details
            var receiptDetails = { 
                receiptNo: receiptNo, 
                registration_id: registration_id, 
                url: url, 
                staff: staff, 
                location:location,
                date: date, 
                time: time,
            };
    
            // Initialize database connectivity
            var result = await this.databaseConnectivity.initialize();
            console.log("Database Connectivity:", result);
    
            if(result === "Connected to MongoDB Atlas!") {
                var databaseName = "Courses-Management-System";
                var collectionName = "Receipts";
                
                console.log("Data:", receiptDetails);
                // Insert receipt details into the database
                var connectedDatabase = await this.databaseConnectivity.insertToDatabase(databaseName, collectionName, receiptDetails);  
    
                // Return success response
                return {
                    success: true,
                    message: "New receipt number generated successfully",
                    receiptNumber: receiptNo
                };
            } else {
                throw new Error("Failed to connect to the database.");
            }
        } catch (error) {
            console.error("Error creating receipt:", error);
    
            // Return failure response
            return {
                success: false,
                message: "An error occurred while creating the receipt",
                error: error.message
            };
        }
    }

    async retrieveReceipts() 
    {
        try {
            // Connect to the database
            var result = await this.databaseConnectivity.initialize();
            console.log("Database Connectivity:", result);

            if(result === "Connected to MongoDB Atlas!")
            {
                var databaseName = "Courses-Management-System";
                var collectionName = "Receipts";
                var connectedDatabase = await this.databaseConnectivity.retrieveFromDatabase(databaseName, collectionName);   
                return connectedDatabase;
                //console.log(connectedDatabase);
            }
        } 
        catch (error) 
        {
            return {
                success: false,
                message: "Error retrieving all user",
                error: error
            };
        }
        finally {
            await this.databaseConnectivity.close(); // Ensure the connection is closed
        }    
    }  

    async deleteReceipt(id) 
    {
        try {
            // Connect to the database
            var result = await this.databaseConnectivity.initialize();
            console.log("Database Connectivity:", result);

            if(result === "Connected to MongoDB Atlas!")
            {
                var databaseName = "Courses-Management-System";
                var collectionName = "Receipts";
                var connectedDatabase = await this.databaseConnectivity.deleteFromDatabase(databaseName, collectionName, id);   
                return connectedDatabase;
                //console.log(connectedDatabase);
            }
        } 
        catch (error) 
        {
            return {
                success: false,
                message: "Error retrieving all user",
                error: error
            };
        }
        finally {
            await this.databaseConnectivity.close(); // Ensure the connection is closed
        }    
    }  
    
}

module.exports = ReceiptController;
