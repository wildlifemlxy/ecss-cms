var express = require("express");
var router = express.Router();
var ParticipantsController = require('../Controller/Participants/ParticipantsController');

router.post("/", async function(req, res) 
{
    var userName = req.body.userName;
    var password = req.body.password;
    //console.log(userName, password);
    var controller = new ParticipantsController();
    var result = await controller.login(userName, password);
    console.log(result);
    res.json({"success": result.success, "message": result.message, "details": result.details});
});

module.exports = router;