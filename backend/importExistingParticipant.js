const RegistrationController = require('./controllers/RegistrationController');

// Example usage: retrieve all participants (no router, just direct call)
async function getAllParticipants(role = null, siteIC = null) {
  try {
    const controller = new RegistrationController();
    const result = await controller.allParticipants(role, siteIC);
    console.log("All participants:", result);
    return result;
  } catch (error) {
    console.error("Error retrieving participants:", error);
    throw error;
  }
}

// Call the function directly (for testing/demo)
getAllParticipants();