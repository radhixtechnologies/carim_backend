var express = require('express');
var router = express.Router();
const auth = require('../controller/admincontroller/authcontroller');
const authtoken = require('../middleware/authtoken');
const usercontroller = require('../controller/admincontroller/usercontroller');
const contactUsController = require('../controller/admincontroller/contactUsController');
const cmsController = require('../controller/admincontroller/cmsController');
const faqController = require('../controller/admincontroller/faqController');
const tutorialController = require('../controller/admincontroller/tutorialController');
const bookingController = require('../controller/admincontroller/bookingController');
const ratingController = require('../controller/admincontroller/ratingController');



router.post('/registration',auth.register);
router.post('/login',auth.login);
router.use(authtoken.verifyToken);  
router.get('/profile',auth.profile);
router.post('/updateprofile',auth.edit_profile);
router.post('/updatepassword',auth.reset_password);
router.post('/logout',auth.logout);
router.get('/dashboard',auth.dashboard);
router.post('/chartdata',auth.chartData);
router.post('/teamchart',auth.teamChart);


// router for users
router.post('/userStatus',usercontroller.userStatus);
router.post('/userDelete/:id',usercontroller.userDelete);
router.get('/userlist',usercontroller.userList);
router.get('/driverlist',usercontroller.driverList);






// router for contact us
router.get('/contactList',contactUsController.contactGet);
router.get('/contactDetail/:id',contactUsController.contactView);  
router.post('/contact/:id',contactUsController.contactDelete);

// router for cms
router.get('/privacypolicy',cmsController.privacy_policy);
router.post('/privacypolicy',cmsController.privacypolicy);    
router.get('/aboutus',cmsController.aboutus);
router.post('/aboutus',cmsController.updateabout);      
router.get('/termsconditions',cmsController.term);
router.post('/termsconditions',cmsController.updateterm);

// faqs
router.get('/faqlist',faqController.FAQList);
router.post('/craetefaq',faqController.createFAQ);
router.post("/faqdelete/:id", faqController.FAQDelete);
router.get('/faqdetail/:id',faqController.FAQDetail);
router.post("/FAQUpdate/:id", faqController.FAQUpdate);

//tutorial routes
router.get('/tutoriallist',tutorialController.tutorialList);
router.get('/tutorialdetail/:id',tutorialController.tutorialDetail);
router.post('/tutorialdelete/:id',tutorialController.tutorialDelete);
router.post('/tutorialupdate',tutorialController.tutorialStatus);
router.post('/createtutorial',tutorialController.tutorialCreate);
router.post('/tutorialupdate/:id',tutorialController.tutorialUpdate);
router.post('/imagedelete/:id',tutorialController.imageDelete);








//booking
router.get('/bookinglist',bookingController.bookingList);
router.post('/bookingdelete/:id',bookingController.bookingDelete);


//rating
router.get('/ratinglist',ratingController.ratingList);
router.post('/ratingdelete/:id',ratingController.ratingDelete);



module.exports = router;
