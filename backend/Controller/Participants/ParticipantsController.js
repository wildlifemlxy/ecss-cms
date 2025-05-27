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

    // In ParticipantsController.js
  async update(updateData)
  {
      try 
      {
          console.log("Updating participant:", updateData);
          var result = await this.databaseConnectivity.initialize();
          if(result === "Connected to MongoDB Atlas!")
          {
              var databaseName = "Courses-Management-System";
              var collectionName = "Participants";
              
              var updateResult = await this.databaseConnectivity.updateParticipant(
                  databaseName, 
                  collectionName, 
                  updateData._id, 
                  updateData
              );
              
              return {
                  "success": updateResult.success, 
                  "message": updateResult.message, 
              };   
          } else {
              return {
                  success: false,
                  message: "Database connection failed"
              };
          }
      } 
      catch (error) 
      {
          console.error("Update error:", error);
          return {
              success: false,
              message: "Error updating participant"    
          };
      }
      finally 
      {
          await this.databaseConnectivity.close();
      }   
  }
}

module.exports = ParticipantsController;
