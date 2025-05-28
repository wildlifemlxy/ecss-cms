const RegistrationController = require('./Controller/Registration/RegistrationController');
const ParticipantsController = require('./Controller/Participants/ParticipantsController');

// Helper to compare registration dates (assumes ISO string or Date object)
function isLater(dateA, dateB) {
  return new Date(dateA) > new Date(dateB);
}

// Main function to import participants without duplicates (NRIC + contactNumber)
async function importParticipantsWithoutDuplicates() {
  try {
    const registrationController = new RegistrationController();
    const participantsController = new ParticipantsController();

    // Retrieve all participants (from registrations)
    const allParticipants = await registrationController.allParticipants();
    console.log(`Retrieved ${allParticipants.length} participants from registrations.`);

    // Use a Map to track unique (NRIC, contactNumber) pairs, keeping the most recent registration
    const participantMap = new Map();

    for (const participantEntry of allParticipants) {
      const participant = participantEntry.participant;
      if (!participant.nric) continue; // skip if no NRIC

      // Normalize NRIC: keep only alphabetic and numeric characters, lowercase
      const nricKey = participant.nric.replace(/[^a-zA-Z0-9]/g, '').trim().toLowerCase();
      const contactKey = (participant.contactNumber || '').replace(/\s+/g, '');
      const mapKey = `${nricKey}|${contactKey}`;

      const existing = participantMap.get(mapKey);

      if (!existing) {
        participantMap.set(mapKey, participant);
      } else {
        // Compare registrationDate, keep the most recent
        if (isLater(participantEntry.registrationDate, existing.registrationDate)) {
          participantMap.set(mapKey, participant);
        }
      }
    }

    console.log(`Found ${participantMap.size} unique (NRIC, contactNumber) pairs in registrations.`);

    // Add each unique participant using ParticipantsController
    for (const participant of participantMap.values()) {
      await participantsController.addParticipant(participant);
    }

    console.log(`Imported ${participantMap.size} unique participants (NRIC + contactNumber).`);
    return Array.from(participantMap.values());
  } catch (error) {
    console.error("Error importing participants:", error);
    throw error;
  }
}

// Run the import
importParticipantsWithoutDuplicates();