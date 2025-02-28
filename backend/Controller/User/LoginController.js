//const Account = require("../../Entity/Account"); // Import the Account class
var DatabaseConnectivity = require("../../database/databaseConnectivity");

function getCurrentDateTime() {
  const now = new Date();

  // Get day, month, year, hours, and minutes
  const day = String(now.getDate()).padStart(2, '0'); // Ensure two digits
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, '0'); // 24-hour format
  const minutes = String(now.getMinutes()).padStart(2, '0'); // Ensure two digits
  const seconds = String(now.getSeconds()).padStart(2, '0'); // Ensure two digits

  // Format date and time
  const formattedDate = `${day}/${month}/${year}`;
  const formattedTime = `${hours}:${minutes}:${seconds}`;

  return {
      date: formattedDate,
      time: formattedTime,
  };
}

class LoginController 
{
  constructor() 
  {
    this.databaseConnectivity = new DatabaseConnectivity(); // Create an instance of DatabaseConnectivity
  }

  // Handle user login
  async login(email, password) 
  {
    try 
    {
      console.log(email, password);
      var result = await this.databaseConnectivity.initialize();
      if(result === "Connected to MongoDB Atlas!")
      {
        var databaseName = "Courses-Management-System";
        var collectionName = "Accounts";
        var currentDateTime = getCurrentDateTime();
        var connectedDatabase = await this.databaseConnectivity.login(databaseName, collectionName, email, password, currentDateTime.date, currentDateTime.time);
        //console.log(connectedDatabase.message);
        return {"message": connectedDatabase.message, "details": connectedDatabase.user};   
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

  async logout(accountId) 
  {
    try 
    {
      var result = await this.databaseConnectivity.initialize();
      if(result === "Connected to MongoDB Atlas!")
      {
        var databaseName = "Courses-Management-System";
        var collectionName = "Accounts";
        var currentDateTime = getCurrentDateTime();
        var connectedDatabase = await this.databaseConnectivity.logout(databaseName, collectionName, accountId, currentDateTime.date, currentDateTime.time);
        //console.log(connectedDatabase.message);
        return {"message": connectedDatabase.message};   
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

  async changePassword(accountId, password) 
  {
    try 
    {
      console.log(accountId, password);
      var result = await this.databaseConnectivity.initialize();
      if(result === "Connected to MongoDB Atlas!")
      {
        var databaseName = "Courses-Management-System";
        var collectionName = "Accounts";
        var connectedDatabase = await this.databaseConnectivity.changePassword(databaseName, collectionName, accountId, password);
        return {"message": connectedDatabase.message, "success": connectedDatabase.success};   
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

  async resetPassword(username, password) 
  {
    try 
    { 
      console.log("Reset Password");
      var result = await this.databaseConnectivity.initialize();
      if(result === "Connected to MongoDB Atlas!")
      {
        var databaseName = "Courses-Management-System";
        var collectionName = "Accounts";
        var connectedDatabase = await this.databaseConnectivity.resetPassword(databaseName, collectionName, username, password);
        return {"message": connectedDatabase.message, "success": connectedDatabase.success};   
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



module.exports = LoginController;
