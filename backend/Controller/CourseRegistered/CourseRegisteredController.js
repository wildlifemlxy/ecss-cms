// In CourseRegisteredController.js
const DatabaseConnectivity = require('../../database/databaseConnectivity');

class CourseRegisteredController {
    constructor() {
        this.databaseConnectivity = new DatabaseConnectivity();
    }

    async retrievedCourse({ nric }) {
        try {
            const result = await this.databaseConnectivity.initialize();
            
            if (result === "Connected to MongoDB Atlas!") {
                const databaseName = "Courses-Management-System";
                const collectionName = "Registration Forms"; // or "Participants"

                // Find all courses registered by this NRIC
                const registeredCourses = await this.databaseConnectivity.findCoursesRegisteredByNRIC(
                    databaseName, 
                    collectionName, 
                    nric
                );

                if (registeredCourses && registeredCourses.length > 0) {
                    // Format the response to include all course details
                    const formattedCourses = registeredCourses.map(course => ({
                        courseType: course.course?.courseType || "N/A",
                        courseEngName: course.course?.courseEngName || "N/A",
                        courseChiName: course.course?.courseChiName || "N/A", 
                        courseLocation: course.course?.courseLocation || "N/A",
                        coursePrice: course.course?.coursePrice || "N/A",
                        courseDuration: course.course?.courseDuration || "N/A",
                        payment: course.payment?.method || course.payment || "N/A",
                        courseMode: course.course?.courseMode || "N/A",
                        status: course.status || "N/A",
                        registrationDate: course.registrationDate || "N/A",
                        receiptNumber: course.receiptNumber || "N/A"
                    }));

                    return {
                        success: true,
                        message: "Courses retrieved successfully",
                        courses: formattedCourses
                    };
                } else {
                    return {
                        success: true,
                        message: "No courses found for this NRIC",
                        courses: []
                    };
                }
            } else {
                return {
                    success: false,
                    message: "Database connection failed",
                    courses: []
                };
            }
        } catch (error) {
            console.error("Retrieve courses error:", error);
            return {
                success: false,
                message: "Error retrieving courses",
                error: error.message,
                courses: []
            };
        } finally {
            await this.databaseConnectivity.close();
        }
    }
}

module.exports = CourseRegisteredController;