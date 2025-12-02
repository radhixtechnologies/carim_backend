var express = require('express');
var router = express.Router();
const middleware = require('../middleware/authtoken');
const authController = require('../controller/apicontroller/authController');
const faqController = require('../controller/apicontroller/faqController');


router.use(middleware.authenticateHeader);
router.get("/getcms", authController.getCmsContent);
//fileupload
router.post('/fileupload', authController.fileUploadDriver);

router.post('/login', authController.login);
router.use(middleware.verifyUser);

router.post("/verifyOtp", authController.verifyOtp);
router.post("/resendotp", authController.resendOTP);
router.post("/deleteaccount", authController.deleteAccount);
router.post("/logout", authController.logout);
router.post('/notificationOnOff', authController.notificationOnOff);
router.post('/createcontact', authController.createContactUs);

//profile
router.post('/profileedit', authController.editProfile);
router.get('/profileget', authController.getProfile);

//driver vehicle
router.post('/vehicleAdd', authController.vehicleAdd);
router.post('/vehicleedit/:id', authController.vehicleEdit);
router.get('/vehicleget', authController.vehicleGet);

//admin bank details
router.get('/adminbankdetail',authController.bankDetail);

//faq
router.get('/faqlist', faqController.getAllFaqs);
router.get('/faqdetail/:id', faqController.getFaqs);

//home
router.get('/home',authController.home);





module.exports = router;
