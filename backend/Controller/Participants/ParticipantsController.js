 //const Account = require("../../Entity/Account"); // Import the Account class
var DatabaseConnectivity = require("../../database/databaseConnectivity");

class ParticipantsController 
{
  constructor() 
  {
    this.databaseConnectivity = new DatabaseConnectivity(); // Create an instance of DatabaseConnectivity
  }
    // Handle user login
  async login(username, password)
  {
    try 
    {
      console.log(username, password);
      var result = await this.databaseConnectivity.initialize();
      if(result === "Connected to MongoDB Atlas!")
      {
        var databaseName = "Courses-Management-System";
        var collectionName = "Participants";
        var connectedDatabase = await this.databaseConnectivity.participantsLogin(databaseName, collectionName, username, password);
        //console.log(connectedDatabase.message);
        return {"success": connectedDatabase.success, "message": connectedDatabase.message, "details": connectedDatabase.user};   
      }
    } 
    catch (error) 
    {
      return {
        success: false,
        message: "Error registering user",
        error: error
      };
    }
    finally 
    {
      await this.databaseConnectivity.close(); // Ensure the connection is closed
    }   
  }
}

module.exports = ParticipantsController;
