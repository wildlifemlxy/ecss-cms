const DatabaseConnectivity = require('../../database/databaseConnectivity');

class AttendanceController {
    constructor() {
        this.databaseConnectivity = new DatabaseConnectivity();
    }

    async insertAttendance(insertData) {
        try {
            const result = await this.databaseConnectivity.initialize();
            
            if (result === "Connected to MongoDB Atlas!") {
                const databaseName = "Courses-Management-System";
                const collectionName = "Attendance";
                
                const insertResult = await this.databaseConnectivity.insertAttendanceRecord(
                    databaseName, 
                    collectionName, 
                    insertData
                );
                
                return {
                    "success": insertResult.success, 
                    "message": insertResult.message, 
                    "details": insertResult.details
                };   
            } else {
                return {
                    success: false,
                    message: "Database connection failed",
                    error: "Could not establish connection to MongoDB Atlas"
                };
            }
        } catch (error) {
            console.error("Insert attendance error:", error);
            return {
                success: false,
                message: "Error inserting attendance record",
                error: error.message
            };
        } finally {
            await this.databaseConnectivity.close();
        }   
    }

    async getAttendance(filterData) {
        try {
            const result = await this.databaseConnectivity.initialize();
            
            if (result === "Connected to MongoDB Atlas!") {
                const databaseName = "Courses-Management-System";
                const collectionName = "Attendance";
                
                const attendanceRecords = await this.databaseConnectivity.getAttendanceRecords(
                    databaseName, 
                    collectionName, 
                    filterData
                );
                
                return {
                    "success": attendanceRecords.success, 
                    "message": attendanceRecords.message, 
                    "details": attendanceRecords.data
                };   
            } else {
                return {
                    success: false,
                    message: "Database connection failed",
                    error: "Could not establish connection to MongoDB Atlas"
                };
            }
        } catch (error) {
            console.error("Get attendance error:", error);
            return {
                success: false,
                message: "Error retrieving attendance records",
                error: error.message
            };
        } finally {
            await this.databaseConnectivity.close();
        }   
    }

    async updateAttendance(updateData) {
        try {
            const result = await this.databaseConnectivity.initialize();
            
            if (result === "Connected to MongoDB Atlas!") {
                const databaseName = "Courses-Management-System";
                const collectionName = "Attendance";
                
                const updateResult = await this.databaseConnectivity.updateAttendanceRecord(
                    databaseName, 
                    collectionName, 
                    updateData._id,
                    updateData
                );
                
                return {
                    "success": updateResult.success, 
                    "message": updateResult.message, 
                    "details": updateResult.details
                };   
            } else {
                return {
                    success: false,
                    message: "Database connection failed",
                    error: "Could not establish connection to MongoDB Atlas"
                };
            }
        } catch (error) {
            console.error("Update attendance error:", error);
            return {
                success: false,
                message: "Error updating attendance record",
                error: error.message
            };
        } finally {
            await this.databaseConnectivity.close();
        }   
    }
}

module.exports = AttendanceController;