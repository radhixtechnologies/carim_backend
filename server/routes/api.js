var express = require('express');
var router = express.Router();
const middleware = require('../middleware/authtoken');
const authController = require('../controller/apicontroller/authController');
const faqController = require('../controller/apicontroller/faqController');
const bookingController = require('../controller/apicontroller/bookingController');


module.exports = (io) => {


    router.use(middleware.authenticateHeader);
    router.get('/adminGet', authController.adminGet);
    router.get("/getcms", authController.getCmsContent);
    //fileupload
    router.post('/fileupload', authController.fileUploadDriver)
    router.post('/login', authController.login);

    router.get('/getLocations', authController.getLocations);

    router.use(middleware.verifyUser);
    router.post("/verifyOtp", authController.verifyOtp);
    router.post("/resendotp", authController.resendOTP);
    router.post("/deleteaccount", authController.deleteAccount);
    router.post("/logout", authController.logout);
    router.post('/notificationOnOff', authController.notificationOnOff);
    router.post('/createcontact', authController.createContactUs);

    router.post('/createAccount', authController.createAccount);
    router.post('/profileedit', authController.editProfile);
    router.get('/profileget', authController.getProfile);

    router.post('/vehicleAdd', authController.vehicleAdd);
    router.post('/vehicleedit', authController.vehicleEdit);
    router.get('/vehicleget', authController.vehicleGet);

    router.get('/adminbankdetail', authController.bankDetail);

    router.get('/faqlist', faqController.getAllFaqs);
    router.get('/faqdetail/:id', faqController.getFaqs);

    router.get('/home', authController.home);

    router.post('/findride', bookingController.findRide);
    router.post('/bookride', bookingController.bookRide(io));
    router.post('/updateDropLocationAndPrice', bookingController.updateDropLocationAndPrice(io));

    router.post('/accpetreject', bookingController.driverAccptReject(io));
    router.get('/requestList', bookingController.requestList(io));
    router.post('/locationupdate', bookingController.updatedPickupLocation);
    router.get('/bookingHistory', bookingController.bookingHistory);

    router.get('/bookingdetail/:id', bookingController.bookingDetail);
    router.get("/transactionSsHistory", authController.transactionSsHistory);
    router.get("/userActiveRide", authController.userActiveRide);

    router.post("/cancelRide", bookingController.cancelRide(io));
    router.post("/report", bookingController.report);
    router.post("/blockUser", bookingController.blockUser(io));
    router.post("/driverWaletRecharge", bookingController.driverWaletRecharge);
    router.get('/Notificationlist', bookingController.Notificationlist);


    router.post('/testLocation', authController.testLocation);
    router.post('/languageTypeChange', bookingController.languageTypeChange);

    router.get('/driverWaletBalance', bookingController.driverWaletBalance);

    router.get('/notificationClear', bookingController.notificationClear);

    return router
}
// module.exports = router;
