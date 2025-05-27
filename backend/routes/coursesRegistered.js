var express = require('express');
var router = express.Router();
const CourseRegisteredController = require('../Controller/CourseRegistered/CourseRegisteredController'); // Adjust path as needed

router.post('/', async function(req, res, next) 
{
    if(req.body.purpose === "retrieve")
    {
        try {
            const { nric } = req.body;
            
            // Validate NRIC input
            if (!nric) {
                return res.status(400).json({
                    success: false,
                    message: "NRIC is required"
                });
            }

            var controller = new CourseRegisteredController();
            var result = await controller.retrievedCourse({ nric });
            
            // Enhanced response format
            return res.json({
                success: result.success,
                message: result.message,
                data: result.courses,
                count: result.courses ? result.courses.length : 0
            }); 
        } catch (error) {
            console.error("Retrieve courses error:", error);
            return res.status(500).json({
                success: false,
                message: "Error retrieving courses",
                error: error.message
            });
        }
    }
    else {
        res.status(400).json({
            success: false,
            message: "Invalid purpose. Expected 'retrieve'"
        });
    }
});

module.exports = router;