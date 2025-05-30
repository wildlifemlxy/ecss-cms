import RegistrationController from './Controller/Registration/RegistrationController.js';
import ParticipantsController from './Controller/Participants/ParticipantsController.js';

const participantsController = new ParticipantsController();
const registrationController = new RegistrationController();

function parseDate(dateString) {
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
}

// Function to remove duplicates by both NRIC and contact number, keeping most recent
function removeDuplicates(participants) {
    const uniqueMap = new Map();
    
    for (const participant of participants) {
        const nric = participant.participant.nric;
        const contactNumber = participant.participant.contactNumber;
        const registrationDate = parseDate(participant.registrationDate);
        
        // Create a composite key using both NRIC and contact number
        const compositeKey = `${nric}_${contactNumber}`;
        
        // Check if we already have an entry with either the same NRIC or same contact number
        let isDuplicate = false;
        let keyToReplace = null;
        
        for (const [existingKey, existingParticipant] of uniqueMap) {
            const existingNric = existingParticipant.participant.nric;
            const existingContactNumber = existingParticipant.participant.contactNumber;
            
            // If NRIC matches OR contact number matches, it's a duplicate
            if (nric === existingNric || contactNumber === existingContactNumber) {
                isDuplicate = true;
                const existingDate = parseDate(existingParticipant.registrationDate);
                
                // If current registration is more recent, replace the existing one
                if (registrationDate > existingDate) {
                    keyToReplace = existingKey;
                }
                break;
            }
        }
        
        if (isDuplicate) {
            if (keyToReplace) {
                uniqueMap.delete(keyToReplace);
                uniqueMap.set(compositeKey, participant);
            }
            // If not more recent, don't add this participant
        } else {
            // No duplicate found, add the participant
            uniqueMap.set(compositeKey, participant);
        }
    }
    
    return Array.from(uniqueMap.values());
}


class DuplicateChecker {

    constructor() {

    }

    async getAllParticipants() {
        try {
            console.log("Retrieving all participant records...");
            const allParticipants = await registrationController.getAllParticipants();
            
            if (allParticipants && allParticipants.success) {
                console.log(`Retrieved ${allParticipants.participants ? allParticipants.participants.length : 0} participant records`);
                return {
                    success: true,
                    participants: allParticipants.participants || [],
                    count: allParticipants.participants ? allParticipants.participants.length : 0
                };
            } else {
                console.error("Failed to retrieve participant records:", allParticipants.message);
                return {
                    success: false,
                    participants: [],
                    count: 0,
                    error: allParticipants.message || "Unknown error"
                };
            }
        } catch (error) {
            console.error("Error retrieving all participant records:", error);
            return {
                success: false,
                participants: [],
                count: 0,
                error: error.message
            };
        }
    }

    async processRegistration() {
        try {
            const allParticipantsResult = await this.getAllParticipants();
            console.log("All participants retrieved:", allParticipantsResult);
            
            if (!allParticipantsResult.success) {
                return {
                    success: false,
                    message: "Failed to retrieve existing participant records",
                    error: allParticipantsResult.error
                };
            }

            var participants = [];
            for (let i = 0; i < allParticipantsResult.participants.length; i++) {
                const participant = allParticipantsResult.participants[i].participant;
                const registrationDate = allParticipantsResult.participants[i].registrationDate;

                participants.push({participant, registrationDate});
            }
            return participants;
            
        } catch (error) {
            console.error("Registration processing error:", error);
            return {
                success: false,
                message: "Error processing registration",
                error: error.message
            };
        }
    }
}

export default DuplicateChecker;

// Usage example (in an async context)
const duplicateChecker = new DuplicateChecker();
const result = await duplicateChecker.processRegistration();
// Remove duplicates by both NRIC and contact number in one pass
let uniqueParticipants = removeDuplicates(result);
console.log(`After duplicate removal: ${uniqueParticipants.length} participants`);

// Add the unique participants
for (let i = 0; i < uniqueParticipants.length; i++) {
    // Extract participant data and remove refunded field
    const participantData = { ...uniqueParticipants[i].participant };
    participantData.name = participantData.name.trim();
    delete participantData.refundedDate;
    
    console.log("Adding Participant Entry:", participantData);
    await participantsController.addParticipant(participantData);
}
