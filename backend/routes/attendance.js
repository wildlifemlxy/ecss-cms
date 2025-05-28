var express = require("express");
var router = express.Router();
var AttendanceController = require('../Controller/Attendance/AttendanceController');

// Helper function to format date as dd/mm/yyyy
function getCurrentDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
}

// Helper function to format time as hh:mm:ss (24-hour format)
function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

router.post("/", async function(req, res) 
{
    if(req.body.purpose === "insert")
    {
        console.log("Received request to insert attendance record", req.body);
        // Get current date and time in specified formats
        const currentDate = getCurrentDate(); // dd/mm/yyyy format
        const currentTime = getCurrentTime(); // hh:mm:ss format (24-hour)
        
        // Extract all attendance fields from request body
        var insertData = {
            name: req.body.name,
            nric: req.body.nric,
            type: req.body.type,
            qrCode: req.body.qrCode,
            time: currentTime,
            date: currentDate,
           // status: req.body.status || "Present"
        };

        // Validate required fields
        if (!insertData.name || !insertData.nric) {
            return res.status(400).json({
                "success": false, 
                "message": "Name and NRIC are required for attendance record"
            });
        }

        console.log("Insert attendance data:", insertData);
        var controller = new AttendanceController();
        var result = await controller.insertAttendance(insertData);
        console.log(result);
        res.json({"success": result.success, "message": result.message});
    }
    else
    {
        res.status(400).json({
            "success": false,
            "message": "Invalid purpose. Expected 'insert'"
        });
    }
});

module.exports = router;