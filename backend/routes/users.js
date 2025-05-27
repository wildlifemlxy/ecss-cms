var express = require("express");
var router = express.Router();
var ParticpantsController = require('../Controller/Participants/ParticipantsController');

router.post("/", async function(req, res) 
{
    var userName = req.body.userName;
    var password = req.body.password;
    //console.log(userName, password);
    var controller = new ParticpantsController();
    var result = await controller.login(userName, password);
    console.log(result);
    res.json({"message": result});
});

module.exports = router;