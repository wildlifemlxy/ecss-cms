var express = require('express');
var router = express.Router();
var RegistrationController = require('../Controller/Registration/RegistrationController');
var ReceiptController = require('../Controller/Receipt/ReceiptController');
var receiptGenerator = require('../Others/Pdf/receiptGenerator');
var invoiceGenerator = require('../Others/Pdf/invoiceGenerator');

function getCurrentDateTime() {
    // Create a Date object and adjust for Singapore Standard Time (UTC+8)
    const now = new Date();
    const singaporeOffset = 8 * 60; // SST is UTC+8, in minutes
    const localOffset = now.getTimezoneOffset(); // Local timezone offset in minutes
    const adjustedTime = new Date(now.getTime() + (singaporeOffset - localOffset) * 60000);

    // Get day, month, year, hours, minutes, and seconds
    const day = String(adjustedTime.getDate()).padStart(2, '0'); // Ensure two digits
    const month = String(adjustedTime.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = adjustedTime.getFullYear();

    const hours = String(adjustedTime.getHours()+8).padStart(2, '0'); // Ensure two digits
    const minutes = String(adjustedTime.getMinutes()).padStart(2, '0'); // Ensure two digits
    const seconds = String(adjustedTime.getSeconds()).padStart(2, '0'); // Ensure two digits

    // Format date and time
    const formattedDate = `${day}/${month}/${year}`;
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    console.log("Now (SST):", formattedDate, formattedTime);

    return {
        date: formattedDate,
        time: formattedTime,
    };
}


router.post('/', async function(req, res, next) 
{
    if(req.body.purpose === "insert")
    {
        var participantsParticulars = req.body.participantDetails;
        
        var controller = new RegistrationController();
        participantsParticulars.registrationDate = getCurrentDateTime().date;
        participantsParticulars.official = {
            name: "", // You can set a default or dynamic value
            date: "", // You can set this to the current date using new Date() or any format
            time: "",  // Set the current time or any specific time value
            receiptNo: "",
            remarks: ""
          };
        var result = await controller.newParticipant(participantsParticulars);
        return res.json({"result": result});
    }
    else if(req.body.purpose === "retrieve")
    {
        var {role, siteIC} = req.body;
        console.log("Request Body:", role, siteIC);
        console.log("Retrieve From Database")
        var controller = new RegistrationController();
        var result = await controller.allParticipants(role, siteIC);
        //console.log("Retrieve Registration Records:", result);
        return res.json({"result": result}); 
    }
    else if(req.body.purpose === "delete")
    {
        var {id} = req.body;
        var controller = new RegistrationController();
        var result = await controller.deleteParticipant(id);
        //console.log("Retrieve Registration Records:", result);
        return res.json({"result": result}); 
    }
    else if(req.body.purpose === "portOver")
    {
        var {id, selectedLocation} = req.body;
        var controller = new RegistrationController();
        var result = await controller.portOverParticipant(id, selectedLocation);
        //console.log("Retrieve Registration Records:", result);
        return res.json({"result": result}); 
    }
    else if(req.body.purpose === "update")
    {
        var id = req.body.id;
        var newStatus = req.body.status;
        var controller = new RegistrationController();
        var result = await controller.updateParticipant(id, newStatus);
        return res.json({"result": result}); 
    }
    else if(req.body.purpose === "edit")
    {
        var id = req.body.id;
        var field = req.body.field;
        var editedValue = req.body.editedValue;
        console.log("Body:", req.body)
        var controller = new RegistrationController();
        var result = await controller.updateParticipantParticulars(id, field, editedValue);
        //console.log("Update Particulars:", result) 
        return res.json({"result": result}); 
    }
    else if(req.body.purpose === "updatePaymentStatus")
    {
        console.log("Official Use", req.body);
        var id = req.body.id;  
        var name = req.body.staff;
        var status = req.body.newUpdateStatus;
        const currentDateTime = getCurrentDateTime();
        var date = currentDateTime.date;
        var time = currentDateTime.time;
        var controller = new RegistrationController();
        const message = await controller.updateOfficialUse(id, name, date, time, status);
        return res.json({"result": message});
        //console.log("Message:", message);
        // After the PDF is sent, you can send a confirmation response if necessary
        //res.json({ message }); // Send confirmation response
    }
    else if(req.body.purpose === "updateConfirmationStatus")
    {
        console.log("Update Confirmation Status:", req.body);
        var id = req.body.id;  
        var name = req.body.staff;
        var status = req.body.newConfirmation;
        const currentDateTime = getCurrentDateTime();
        var date = currentDateTime.date;
        var time = currentDateTime.time;
        var controller = new RegistrationController();
        const message = await controller.updateConfirmationUse(id, name, date, time, status);
        //console.log(message);
        return res.json({"result": message});
    }
    else if(req.body.purpose === "addReceiptNumber")
    {
        console.log("Receipt body:", req.body); 
                
        // Initialize the controller
        var controller = new RegistrationController();

        // Update the receipt number
        var result = await controller.updateReceiptNumber(req.body.id, req.body.receiptNo);
        console.log("updateReceiptNumber:", result); 

        // Logging the row data from the request
        console.log("Array:", req.body.rowData);

        // Get current date and time
        const currentDateTime = getCurrentDateTime();
        var date = currentDateTime.date;
        var time = currentDateTime.time;

        console.log("Check:", req.body._id, req.body.staff, date, time, req.body.status);

        // Update the official use details
        await controller.updateOfficialUse(req.body._id, req.body.staff, date, time, req.body.status);

        // Return the result message
        return res.json({ "result": "Success" }); // Replace "Success" with a proper message if needed
    }
    else if(req.body.purpose === "receipt")
    {
        console.log("Body trasffered:", req.body);
        //console.log("OfficialInfo:", req.body.officialInfo);

        var receipt = new receiptGenerator();
        var array = []
        array.push({
            id: req.body.id,
            participant: req.body.participant,
            course: req.body.course,
            official: req.body.officialInfo
        });
        console.log("Array:", array);
        await receipt.generateReceipt(res, array, req.body.staff, req.body.receiptNo);
    }
    else if(req.body.purpose === "addInvoiceNumber")
    {
        console.log("Receipt body:", req.body); 
        var controller = new RegistrationController();
        var result = await controller.updateReceiptNumber(req.body.id, req.body.receiptNo);
        console.log("updateReceiptNumber:", result); 
        console.log("Array:", req.body.rowData);
        const currentDateTime = getCurrentDateTime();
        var date = currentDateTime.date;
        var time = currentDateTime.time;
        console.log("Check:", req.body._id,  req.body.staff, date, time, req.body.status);
        await controller.updateOfficialUse(req.body._id, req.body.staff, date, time, req.body.status);
        return res.json({ "result": "Success" }); 
    }
    else if(req.body.purpose === "invoice")
    {
        console.log(req.body);
        var invoice = new invoiceGenerator();
        var array = []
        array.push({
            id: req.body.id,
            participant: req.body.participant,
            course: req.body.course
        });
        await invoice.generateInvoice(res, array, req.body.staff, req.body.receiptNo);
    }
    else if(req.body.purpose === "updatePaymentMethod")
    {
        console.log("updatePaymentMethod:", req.body);
        var controller = new RegistrationController();
        const currentDateTime = getCurrentDateTime();
        var date = currentDateTime.date;
        var time = currentDateTime.time;
        var result = await controller.updatePaymentMethod(req.body.id, req.body.newUpdatePayment, req.body.staff, date, time);
        //console.log("Update Remarks:". result);
        return res.json({"result": result}); 
    }
    else if(req.body.purpose === "addRefundedDate")
    {
        //console.log("Add Refunded Date:", req.body);
        const currentDateTime = getCurrentDateTime();
        var controller = new RegistrationController();
        var date = currentDateTime.date;
        var result = await controller.addRefundedDate(req.body.id, date);
        return res.json({"result": result});
    }
    else if(req.body.purpose === "removedRefundedDate")
    {
        //console.log("Add Refunded Date:", req.body);
        const currentDateTime = getCurrentDateTime();
        var controller = new RegistrationController();
        var result = await controller.addRefundedDate(req.body.id, "");
        return res.json({"result": result});
    }
});

module.exports = router;

