var express = require('express');
var router = express.Router();
const middleware = require('../middleware/authtoken');
const authController = require('../controller/apicontroller/authController');


router.use(middleware.authenticateHeader);
router.get("/getcms", authController.getCmsContent);

router.post('/login', authController.login);
router.use(middleware.verifyUser);

router.post("/verifyOtp", authController.verifyOtp);
router.post("/resendotp", authController.resendOTP);
router.post("/deleteaccount", authController.deleteAccount);
router.post("/logout", authController.logout);
router.post('/notificationOnOff', authController.notificationOnOff);
router.post('/createcontact', authController.createContactUs);


module.exports = router;
