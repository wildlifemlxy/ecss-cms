const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection string
const uri = 'mongodb+srv://moseslee:Mlxy6695@ecss-course.hejib.mongodb.net/?retryWrites=true&w=majority&appName=ECSS-Course'; // Use env variable

class DatabaseConnectivity {
    constructor() {
        this.client = new MongoClient(uri);
        this.isConnected = false;
    }

    // Connect to the database
    async initialize()
    {
        try 
        {
            if (!this.isConnected) 
            {
                await this.client.connect();
                this.isConnected = true;
                return "Connected to MongoDB Atlas!";
            }   
        } catch (error) {
            console.error("Error connecting to MongoDB Atlas:", error);
            throw error;
        }
    }

    async login(dbname, collectionName, email, password, date, time)
    {
        const db = this.client.db(dbname);
        try
        {
            var table = db.collection(collectionName);
            // Find a user with matching email and password
            const user = await table.findOne({ email: email, password: password });
            if (user) {
                await table.updateOne(
                    { _id: user._id }, // Filter to find the user
                    {
                        $set: {
                            date_log_in: date,
                            time_log_in: time
                        }
                    }
                );
    
            // User found, login successful
            return {
                success: true,
                message: 'Login successful',
                user: user // or you can choose to return specific user details
            };
            } else {
            // No user found, login failed
            return {
                success: false,
                message: 'Invalid email or password'
            };
            }
        }
        catch(error)
        {
            console.log(error);
        }
    }

    async logout(dbname, collectionName, accountId, date, time)
    {
        const db = this.client.db(dbname);
        try
        {
            var table = db.collection(collectionName);
            // Find a user with matching email and password
            const user = await table.findOne({ _id: new ObjectId(accountId) });
            if (user) {
                await table.updateOne(
                    { _id: user._id }, // Filter to find the user
                    {
                        $set: {
                            date_log_out: date,
                            time_log_out: time
                        }
                    }
                );
    
            // User found, login successful
            return {
                success: true,
                message: 'Logout successful',
            };
            } else {
            // No user found, login failed
            return {
                success: false,
                message: 'Invalid email or password'
            };
            }
        }
        catch(error)
        {
            console.log(error);
        }
    }

    async changePassword(dbname, collectionName, accountId, newPassword)
    {
        const db = this.client.db(dbname);
        try
        {
            var table = db.collection(collectionName);
            // Find a user with matching email and password
            const result = await table.updateOne(
                { _id: accountId }, // Filter
                { $set: { password: newPassword,
                            first_time_log_in: "No"
                 } } // Update
            );

            if (result) {
            // User found, login successful
            return {
                success: true,
                message: 'Change Password Successful',
            };
            } else {
            // No user found, login failed
            return {
                success: false,
                message: 'Change Password Failure'
            };
            }
        }
        catch(error)
        {
            console.log(error);
        }
    }

    async resetPassword(dbname, collectionName, username, password)
    {
        const db = this.client.db(dbname);
        try
        {
            var table = db.collection(collectionName);
            // Find a user with matching email and password
            const result = await table.updateOne(
                {email: username }, // Filter
                { $set: {   password: password,
                            first_time_log_in: "No"
                 } } // Update
            );
            console.log(result);
            if (result) {
            // User found, login successful
            return {
                success: true,
                message: 'Change Password Successful',
            };
            } else {
            // No user found, login failed
            return {
                success: false,
                message: 'Change Password Failure'
            };
            }
        }
        catch(error)
        {
            console.log(error);
        }
    }

    async insertToDatabase(dbname, collectionName, data) {
        console.log("Database:", dbname);
        console.log("Data:", data);
    
        const db = this.client.db(dbname); // Get the database object
        let result;
    
        try {
            if (db) {
                const table = db.collection(collectionName);
    
                // Ensure registration_id is an ObjectId only for "Receipts" collection
                if (collectionName === "Receipts") {
                    const registrationId = new ObjectId(data.registration_id);
                    data.registration_id = registrationId;
                }
    
                // Directly insert the data without any checks
                result = await table.insertOne(data);
    
                // Return the result based on the collection name
                if (collectionName === "Accounts") {
                    return { acknowledged: result.acknowledged, accountId: result.insertedId };
                } else {
                    return { acknowledged: result.acknowledged }; // For other collections
                }
            }
        } catch (error) {
            console.error('Error during database operation:', error);
            return { acknowledged: false, error: error.message }; // Return error status
        }
    }
    
    async retrieveFromDatabase(dbname, collectionName)
    {
        var db = this.client.db(dbname); // return the db object
        try
        {
            if(db)
            {
                var table = db.collection(collectionName);
                var result = await table.find().toArray();
                return result;
            }
        }
        catch(error)
        {
            console.log(error);
        }
    }

    async retrieveCourseRegistration(dbname, collectionName, role, siteIC) 
    {
        var db = this.client.db(dbname); // Return the db object
        try {
            if (db) {
                var table = db.collection(collectionName);
                
                // Define query object
                let query = {};

                // If role is "Site in-charge", filter by course.courseLocation
                if (role === "Site in-charge") {
                    console.log("Site IC", siteIC)
                    if (siteIC != null){
                        query["course.courseLocation"] = siteIC; // Filtering based on courseLocation
                    }
                }
                // If role is not "Site in-charge", return all documents (empty query retrieves all)
                
                var result = await table.find(query).toArray();
                //console.log("Result:",result);
                return result;
            }
        } catch (error) {
            console.log(error);
        }
    }


    async retrieveOneFromDatabase(dbname, collectionName, id) {
        console.log("Selected One");
        console.log("Id:", id);
        var db = this.client.db(dbname); // Return the db object
        try {
            if (db) {
                var table = db.collection(collectionName);
                // Use findOne to get the document by nested field
                var result = await table.findOne({ "Account Details.Account ID": new ObjectId(id)}); // Convert id to ObjectId
                console.log("Retrieve:", result); // Log the result
                return result; // Return the single document
            }
        } catch (error) {
            console.log(error);
        }
    }
    
            
    async updateInDatabase(dbname, id, newStatus) {
        var db = this.client.db(dbname); // return the db object
        try {
            if (db) {
                var tableName = "Registration Forms";
                var table = db.collection(tableName);
    
                // Use updateOne to update a single document
                const filter = { _id: new ObjectId(id) };

                // Add the new key "confirmation" to the update data
                const update = {
                    $set: {
                        status: newStatus, // Add new key "confirmation"
                    }
                };
    
               // Call updateOne
                const result = await table.updateOne(filter, update);
    
                return result;
            }
        } catch (error) {
            console.log("Error updating database:", error);
        }
    }

                
    async updateParticipantParticulars(dbname, id, field, editedParticulars) {
        console.log("Update Request:", id, field, editedParticulars);
        var db = this.client.db(dbname); // Return the db object
        try {
            if (db) {
                const tableName = "Registration Forms";
                const table = db.collection(tableName);
                
                // Use updateOne to update a single document
                const filter = { _id: new ObjectId(id) };
    
                // Dynamically construct the update object with dot notation
                const update = {
                    $set: {
                        [`participant.${field}`]: editedParticulars, // Use bracket notation for dynamic field
                    },
                };
    
                // Call updateOne
                const result = await table.updateOne(filter, update);
                console.log("Update Result:", result);
                return result;
            }
        } catch (error) {
            console.error("Error updating database:", error);
        }
    }
    

    async updateReceiptNumberData(dbname, id, receiptNumber) {
        console.log("Parameters:", dbname, id, receiptNumber);
        var db = this.client.db(dbname); // return the db object
        try {
            if (db) {
                var tableName = "Registration Forms";
                var table = db.collection(tableName);
    
                // Use updateOne to update a single document
                const filter = { _id: new ObjectId(id) };
    
                // Update only the `receiptNo` field inside the `official` object
                const update = {
                    $set: {
                        "official.receiptNo": receiptNumber
                    }
                };

                // Call updateOne
                const result = await table.updateOne(filter, update);
                console.log("updateReceiptNumberData:", result)
    
                return result;
            }
        } catch (error) {
            console.log("Error updating database:", error);
        }
    }
    
    
    async updatePaymentOfficialUse(dbname, id, name, date, time, status) {
        var db = this.client.db(dbname); // return the db object
        try {
            if (db) {
                var tableName = "Registration Forms";
                var table = db.collection(tableName);
    
                // Use updateOne to update a single document
                const filter = { _id: new ObjectId(id) };
    
                // Define the update object conditionally based on status
                let update = null;
                
                console.log("Update Payment Official Use:", status);
                if (status === "Paid" || status === "SkillsFuture Done" || status === "Generating SkillsFuture Invoice") {
                    console.log("OK");
                    update = {
                        $set: {
                            "status": status,
                            "official.name": name,
                            "official.date": date,
                            "official.time": time
                        }
                    };
                } else {
                    update = {
                        $set: {
                            "status": status,
                            "official.receiptNo": "",
                            "official.date": "",
                            "official.time": "",
                            "official.receiptNo": "",
                            "official.confirmed": false
                        }
                    };
                }
    
                // Call updateOne
                const result = await table.updateOne(filter, update);
    
                return result;
            }
        } catch (error) {
            console.log("Error updating database:", error);
        }
    }

    async updateConfirmtionOfficialUse(dbname, id, name, date, time, status) {
        var db = this.client.db(dbname); // return the db object
        try {
            if (db) {
                var tableName = "Registration Forms";
                var table = db.collection(tableName);
        
                // Use updateOne to update a single document
                const filter = { _id: new ObjectId(id) };
        
                // Define the update object conditionally based on status
                let update = {
                    $set: {
                        "official.confirmed": status,
                        "official.name": name,
                        "official.date": date,
                        "official.time": time,
                        "status": "Pending",
                        "official.receiptNo": ""
                    }
                };
        
                // Call updateOne
                const result = await table.updateOne(filter, update);
        
                return result;
            }
        } catch (error) {
            console.log("Error updating database:", error);
            throw error; // rethrow the error to handle it at the calling function
        }
    }
    

    async updatePaymentMethod(dbname, id, newPaymentMethod, staff, date, time) 
    {
        var db = this.client.db(dbname); // return the db object ok
        try {
            console.log("Id:", id);
            console.log("New Payment Method:", newPaymentMethod);
            if (db) {
                var tableName = "Registration Forms";
                var table = db.collection(tableName);
    
                // Use updateOne to update a single document
                const filter = { _id: new ObjectId(id) };
    
                var update = {
                            $set: {
                                "course.payment": newPaymentMethod,
                                "status": "Pending",
                                "official.receiptNo": "",
                                "official.name": staff,
                                "official.date": date,
                                "official.time": time,
                                "official.confirmed": false,
                            }
                        };
                // Call updateOne
                const result = await table.updateOne(filter, update);
                //console.log("New Payment Method:", result);
    
                return result;
            }
        } catch (error) {
            console.log("Error updating database:", error);
        }
    }

    async updateRegistrationEntry(dbname, participantDetails) {
        var db = this.client.db(dbname); // return the db object ok
        try {
            if (db) {
                var tableName = "Registration Forms";
                var table = db.collection(tableName);

                console.log("Participants Details:", participantDetails);
    
                // Use updateOne to update a single document
                const filter = { _id: new ObjectId(participantDetails.id) };
    
                // Define the update object conditionally based on status
                var update = {
                            $set: {
                                "participant.name": participantDetails.name,
                                "participant.nric": participantDetails.nric,
                                "participant.residentialStatus": participantDetails.residentialStatus,
                                "participant.race": participantDetails.race,
                                "participant.gender": participantDetails.gender,
                                "participant.contactNumber": participantDetails.contactNumber,
                                "participant.email": participantDetails.email,
                                "participant.postalCode": participantDetails.postalCode,
                                "participant.educationLevel": participantDetails.educationLevel,
                                "participant.workStatus": participantDetails.workStatus
                            }
                        };
    
                // Call updateOne
                const result = await table.updateOne(filter, update);
    
                return result;
            }
        } catch (error) {
            console.log("Error updating database:", error);
        }
    }
    
    async deleteAccount(databaseName, collectionName, id) {
        const db = this.client.db(databaseName);
        const table = db.collection(collectionName);
    
        try {
            const filter = { _id: new ObjectId(id) }; // Find document by ID
            const result = await table.deleteOne(filter);
    
            if (result.deletedCount === 1) {
                console.log("Successfully deleted the document.");
                return { success: true, message: "Document deleted successfully." };
            } else {
                console.log("No document found with that ID.");
                return { success: false, message: "No document found with that ID." };
            }
        } catch (error) {
            console.log("Error deleting document:", error);
            return { success: false, error };
        }
    }
    
    async getNextReceiptNumber(databaseName, collectionName, courseLocation, centreLocation) {
        const db = this.client.db(databaseName);
        const collection = db.collection(collectionName);
        console.log("Locations:", courseLocation, centreLocation);
    
        // Get the current two-digit year (e.g., 2025 -> "25")
        var currentYear = new Date().getFullYear().toString().slice(-2);
        currentYear = parseInt(currentYear);
    
        let regexPattern = `^${courseLocation}`; // Default pattern

        if (centreLocation === "Tampines 253 Centre") {
            regexPattern = `${courseLocation}TP`; // Ensure "TP" appears after courseLocation
        }

        console.log("Regex Pattern:", regexPattern);
        
        const existingReceipts = await collection.find({
            receiptNo: { $regex: regexPattern },
            location: centreLocation
        }).toArray();
        

        console.log("Existing Receipts:", existingReceipts);
    
        let formattedReceiptNumber;
    
        // First, handle the SkillsFuture Invoice Number
        if (courseLocation.startsWith("ECSS/SFC/")) 
        {
            console.log("Skillsfuture Invoice");
            // Filter receipts to get only those from the current year
            const validReceipts = existingReceipts.filter(receipt => {
                let regexPattern;
                // Check if the location is Tampines 253 Centre
                if (centreLocation === "Tampines 253 Centre") {
                    // Ensure "TP" appears for Tampines 253 Centre
                    regexPattern = new RegExp(`^${courseLocation}TP\\d+/(${currentYear})$`);
                } else {
                    // Default pattern without "TP"
                    regexPattern = new RegExp(`^${courseLocation}\\d+/(${currentYear})$`);
                }
                return regexPattern.test(receipt.receiptNo);
            });
            console.log("Valid Receipts:", courseLocation, validReceipts);
        
            // Get the current year's receipt numbers for the specific location (centreLocation)
            const centreReceiptNumbers = validReceipts.map(receipt => {
                // Create regex pattern based on the centreLocation
                let regexPattern;    
                if (centreLocation === "Tampines 253 Centre") {
                    // Enforce "TP" for Tampines 253 Centre receipts
                    regexPattern = new RegExp(`^${courseLocation}TP(\\d+)(?:/\\d+| - \\d+)$`);
                } else {
                    // Default pattern without "TP"
                    regexPattern = new RegExp(`^${courseLocation}(\\d+)(?:/\\d+| - \\d+)$`);
                }
                const match = receipt.receiptNo.match(regexPattern);
                return match ? parseInt(match[1], 10) : null;
            }).filter(num => num !== null);
            
            console.log(courseLocation, centreReceiptNumbers, centreLocation, currentYear);
            formattedReceiptNumber = this.getNextReceiptNumberForSkillsFuture(courseLocation, centreReceiptNumbers, centreLocation, currentYear);
        } 
        else 
        {
            console.log("Get Next Number For Receipt (PayNow or Cash)");
            // Default logic for other locations
            formattedReceiptNumber = this.getNextReceiptNumberForPayNowCash(courseLocation, existingReceipts, centreLocation, currentYear);
        }

        return formattedReceiptNumber;
    }
    
    getNextReceiptNumberForSkillsFuture(courseLocation, centreReceiptNumbers, centreLocation, currentYear) 
    {
        let nextNumber;
        console.log("Centre Receipt Number:", centreReceiptNumbers, centreLocation);
        // Logic for 2025
        if (currentYear === 25) {
            if (centreLocation === "CT Hub") {
             // For CT Hub in 2025, start from 109
                nextNumber = centreReceiptNumbers.length > 0 ? Math.max(...centreReceiptNumbers) + 1 : 109;
            }             
            else if (centreLocation === "Tampines 253 Centre") 
            {             
                // For Tampines 253 Centre in 2026 and beyond, start from 1
                nextNumber = centreReceiptNumbers.length > 0 ? Math.max(...centreReceiptNumbers) + 1 : 91;
            } 
            else if (centreLocation === "Pasir Ris West Wellness Centre") {
                // For Pasir Ris West Wellness Centre in 2026 and beyond, start from 1
                nextNumber = centreReceiptNumbers.length > 0 ? Math.max(...centreReceiptNumbers) + 1 : 13 ;
            }
        } 
        // Logic for 2026 and beyond
        else if (currentYear >= 26) {
            if (centreLocation === "CT Hub") {
                // For CT Hub in 2026 and beyond, start from 1
                nextNumber = centreReceiptNumbers.length > 0 ? Math.max(...centreReceiptNumbers) + 1 : 1;
            } else if (centreLocation === "Tampines 253 Centre") {
                // For Tampines 253 Centre in 2026 and beyond, start from 1
                nextNumber = centreReceiptNumbers.length > 0 ? Math.max(...centreReceiptNumber.substring(2)) + 1 : 1;
            } else if (centreLocation === "Pasir Ris West Wellness Centre") {
                // For Pasir Ris West Wellness Centre in 2026 and beyond, start from 1
                nextNumber = centreReceiptNumbers.length > 0 ? Math.max(...centreReceiptNumbers) + 1 : 1;
            }
        }

        console.log("Tampines 253 Centre Next Receipt:", nextNumber);
    
        // Pad number to 3 digits if less than 3 digits, else keep original length
        if (nextNumber.toString().length < 3) 
        {
            if(centreLocation === "Tampines 253 Centre")
            {
                nextNumber = `TP${nextNumber.toString().padStart(3, '0')}`; // Pad to 3 digits if less than 3
            }
            else
            {
                nextNumber = nextNumber.toString().padStart(3, '0'); // Pad to 3 digits if less than 3
            }
        } 
        else 
        {
            nextNumber = nextNumber.toString(); // Keep original length if 3 or more digits
        }
            
        // Return the formatted receipt number
       return `${courseLocation}${nextNumber}/${currentYear.toString()}`;
    }
    
    
    getNextReceiptNumberForPayNowCash(courseLocation, existingReceipts, centreLocation, currentYear) {
        let nextNumber;
    
        console.log("Centre Receipt Number:", courseLocation, existingReceipts, centreLocation, currentYear);

         // Filter the existing receipts based on the location
        const filteredReceipts = existingReceipts.filter(receipt => receipt.location === centreLocation);
        console.log("Filtered Receipts for Centre Location:", filteredReceipts);

        // Extract the numeric part of the receiptNo (before the "-") and get the numbers
        const centreReceiptNumbers = filteredReceipts.map(receipt => {
                const receiptNumberMatch = receipt.receiptNo.split(" - ")[1]; // Split by " - " and get the number part
                return receiptNumberMatch ? parseInt(receiptNumberMatch, 10) : null;
            }).filter(num => num !== null);

        console.log("Centre Receipt Numbers11:", centreReceiptNumbers);

        const maxReceiptNumber = existingReceipts.length > 0 ? Math.max(...centreReceiptNumbers) : 0;
        console.log("Latest Receipt Numbers:", maxReceiptNumber);
       // Handle specific logic for each centre location
        if (centreLocation === "Tampines 253 Centre") {
            // Custom logic for Tampines 253 Centre
            nextNumber =  maxReceiptNumber + 1;
        } 
        else if (centreLocation === "Pasir Ris West Wellness Centre") {
            // Custom logic for Pasir Ris West Centre
            nextNumber =  maxReceiptNumber + 1;
        } 
        else if (centreLocation === "CT Hub") {
            // For CT Hub, it uses the same logic as the others
            nextNumber =  maxReceiptNumber + 1;
        } 
    
        // Determine the length of the next number based on the nextNumber value
        let numberLength = nextNumber.toString().length;
    
        // Format the next number dynamically with leading zeros based on its length
        let formattedNextNumber = String(nextNumber).padStart(numberLength + 3, '0');  // Start with length 4, increase as needed
    
        // Return the formatted receipt number in the format: "courseLocation - 0001"
        return `${courseLocation} - ${formattedNextNumber}`;
    }
    
    
    
    async newInvoice(databaseName, collectionName, invoiceNumber, month, username, date, time) {
        try {
            // Connect to the database and collection
            const db = this.client.db(databaseName);
            const collection = db.collection(collectionName);
    
            // Prepare the invoice document to insert
            const invoiceDocument = {
                invoiceNumber: invoiceNumber,
                month: month,
                username: username,
                date: date,
                time: time,
            };
    
            // Insert the document into the collectionm
            const result = await collection.insertOne(invoiceDocument);
    
            console.log("Invoice inserted successfully:", result.insertedId);
            return { success: true, id: result.insertedId }; // Return success with the inserted document ID
        } catch (error) {
            console.error("Error inserting new invoice:", error);
            return { success: false, error: "Failed to insert new invoice. Please try again." }; // Return failure with an error message
        }
    }

    async getNextInvoiceNumber(databaseName, collectionName) {
        try {
            const db = this.client.db(databaseName);
            const collection = db.collection(collectionName);
    
            const prefix = "ECSS/TLE/205/";
    
            // Retrieve all invoices matching the specified prefix
            const existingInvoices = await collection.find({
                invoiceNumber: { $regex: `^${prefix}\\d+$` } // Match invoice numbers starting with the prefix and a numeric part
            }).toArray();
    
            console.log("Current Invoices:", existingInvoices);
    
            // If there are no invoices, start with '1'
            if (existingInvoices.length === 0) {
                return `${prefix}1`;
            }
    
            // Extract the numeric part of invoice numbers
            const invoiceNumbers = existingInvoices.map(invoice => {
                const match = invoice.invoiceNumber.match(new RegExp(`^${prefix}(\\d+)$`));
                if (match) {
                    console.log(`Extracted number: ${match[1]}`); // Debugging output
                }
                return match ? parseInt(match[1], 10) : null; // Extract and parse numeric part
            }).filter(num => num !== null); // Remove invalid entries
    
            // Debugging output for extracted numbers
            console.log("Extracted Invoice Numbers:", invoiceNumbers);
    
            // Find the latest (maximum) existing number
            const latestNumber = Math.max(...invoiceNumbers);
            console.log("Latest Invoice Number:", latestNumber); // Debugging output
    
            // Determine the next number
            const nextNumber = latestNumber + 1;
    
            // Return the next invoice number without leading zeros
            return `${prefix}${nextNumber}`;
        } catch (error) {
            console.error("Error in getNextInvoiceNumber:", error);
            throw new Error("Unable to generate the next invoice number. Please try again.");
        }
    }

    async getInvoiceNumber(databaseName, collectionName, selectedMonth) {
        try {
            const db = this.client.db(databaseName);
            const collection = db.collection(collectionName);
    
            // Query to find the document with the specified month
            const invoice = await collection.findOne({ month: selectedMonth });
            console.log(invoice);
    
            if (!invoice) {
                console.log(`No invoice found for the month: ${selectedMonth}`);
                return null; // Return null if no document matches the query
            }
    
            console.log("Found Invoice:", invoice.invoiceNumber);
            return invoice.invoiceNumber; // Return the found document
        } catch (error) {
            console.error("Error in getInvoiceNumber:", error);
            throw new Error("Unable to retrieve the invoice. Please try again.");
        }
    }
    
    async deleteAccount(databaseName, collectionName, id) {
        const db = this.client.db(databaseName);
        const table = db.collection(collectionName);
    
        try {
            const filter = { _id: new ObjectId(id) }; // Find document by ID
            const result = await table.deleteOne(filter);
    
            if (result.deletedCount === 1) {
                console.log("Successfully deleted the document.");
                return { success: true, message: "Document deleted successfully." };
            } else {
                console.log("No document found with that ID.");
                return { success: false, message: "No document found with that ID." };
            }
        } catch (error) {
            console.log("Error deleting document:", error);
            return { success: false, error };
        }
    }

    async deleteFromDatabase(databaseName, collectionName, id)
     {
        const db = this.client.db(databaseName);
        const table = db.collection(collectionName);
    
        try {
            const filter = { 
                registration_id: new ObjectId(id) }; // Find document by ID
            const result = await table.deleteOne(filter);
    
            if (result.deletedCount === 1) {
                console.log("Successfully deleted the document.");
                return { success: true, message: "Document deleted successfully." };
            } else {
                console.log("No document found with that ID.");
                return { success: false, message: "No document found with that ID." };
            }
        } catch (error) {
            console.log("Error deleting document:", error);
            return { success: false, error };
        }
    }

    async deleteFromParticipant(databaseName, collectionName, id)
     {
        const db = this.client.db(databaseName);
        const table = db.collection(collectionName);
    
        try {
            const filter = { 
                _id: new ObjectId(id) }; // Find document by ID
            const result = await table.deleteOne(filter);
    
            if (result.deletedCount === 1) {
                console.log("Successfully deleted the document.");
                return { success: true, message: "Document deleted successfully." };
            } else {
                console.log("No document found with that ID.");
                return { success: false, message: "No document found with that ID." };
            }
        } catch (error) {
            console.log("Error deleting document:", error);
            return { success: false, error };
        }
    }
    
    async portOverParticipant(databaseName, collectionName, id, selectedLocation) {
        const db = this.client.db(databaseName);
        const table = db.collection(collectionName);
      
        try {
          const filter = { _id: new ObjectId(id) }; // Find document by ID
          const update = { $set: { "course.courseLocation": selectedLocation } }; // Update nested field
      
          // Perform the update operation
          const result = await table.updateOne(filter, update);
      
          if (result.modifiedCount === 1) {
            console.log("Successfully ported over the document.");
            return { success: true, message: "Document ported over successfully." };
          } else if (result.matchedCount === 0) {
            console.log("No document found with that ID.");
            return { success: false, message: "No document found with that ID." };
          } else {
            console.log("Document found but not modified.");
            return { success: false, message: "Document was found but no changes were made." };
          }
        } catch (error) {
          console.log("Error porting over document:", error);
          return { success: false, error: error.message || error };
        }
      }
      

    async deleteAccessRights(databaseName, collectionName, id) {
        const db = this.client.db(databaseName);
        const table = db.collection(collectionName);
    
        try {
            // Using bracket notation to access 'Account ID' under 'Account Details'
            const filter = { "Account Details.Account ID": new ObjectId(id) }; 
    
            const result = await table.deleteOne(filter);
    
            if (result.deletedCount === 1) {
                console.log("Successfully deleted the access right.");
                return { success: true, message: "Document deleted successfully." };
            } else {
                console.log("No document found with that ID.");
                return { success: false, message: "No document found with that ID." };
            }
        } catch (error) {
            console.log("Error deleting document:", error);
            return { success: false, error };
        }
    }

    async updateAccessRight(databaseName, collectionName, id1, updateAccessRight) {
        const db = this.client.db(databaseName);
        const table = db.collection(collectionName);
    
        try {
            // Define your filter to find the correct document
            const filter = { _id: new ObjectId(id1) };
            console.log("Filter:", filter);

            console.log(updateAccessRight);

            const keyMapping = {
                accounts: "Account",
                regPay: "Registration And Payment",
                qRCode: "QR Code",
                courses: "Courses",
              };
    
           // Exclude _id from the updateAccessRight if it exists
            const { id, accType, name, sn, ...filteredUpdateAccessRight } = updateAccessRight;
            var updateAccessRight = Object.fromEntries(
                Object.entries(filteredUpdateAccessRight).map(([key, value]) => [
                  keyMapping[key] || key, // Replace key if found in keyMapping, otherwise keep the original
                  value
                ])
              );
            console.log(updateAccessRight);
    
            // Prepare the update object
            const update = {
                $set: {}
            };

    
            // Add any other fields from updateData
            for (const key in updateAccessRight) {
                update.$set[key] = updateAccessRight[key];
            }
    
            console.log("Update object:", update);
    
            // Perform the update operation
            const result = await table.updateOne(filter, update);
    
            if (result.modifiedCount === 1) {
                console.log("Successfully updated the access right.");
                return { success: true, message: "Document updated successfully." };
            } else {
                console.log("No document found with that ID or no changes made.");
                return { success: false, message: "No document found with that ID or no changes made." };
            }
        } catch (error) {
            console.log("Error updating document:", error);
            return { success: false, error };
        }
    }
    
    

    // Close the connection to the database
    async close() {
        if (this.isConnected) {
            await this.client.close();
            this.isConnected = false;
            console.log("MongoDB connection closed.");
        }
    }
}

// Export the instance for use in other modules
module.exports = DatabaseConnectivity;