var express = require('express');
var router = express.Router();

var authController = require('../controller/admin/authController');
var userController = require('../controller/admin/userController');
var categoryController = require('../controller/admin/categoryController');
var faqController = require("../controller/admin/faqController")
const contactusController = require("../controller/admin/contactusController")
const cmsController = require("../controller/admin/cmsController")



router.get('/', authController.login);
router.post("/loginPost", authController.loginPost)
router.get('/changePasswordPage', authController.changePasswordPage);
router.post("/changePassword", authController.changePassword)
router.get('/editProfile', authController.editProfile);
router.post("/updateAdminProfile", authController.updateAdminProfile)
router.get("/logout", authController.logout)

router.get('/dashboard', userController.dashboard);
router.get('/userListing', userController.userListing);
router.get('/driverListing', userController.driverListing);
router.post("/deleteDriver/:id", userController.deleteDriver)
router.post("/deleteUser/:id", userController.deleteUser)

router.get('/categoryListing', categoryController.categoryListing);

router.get('/contactListing', contactusController.contactListing);
router.post("/deleteContact/:id", contactusController.deleteContact)

router.get('/termCondition', cmsController.termCondition);
router.get('/privacyPolicy', cmsController.privacyPolicy);
router.get('/aboutus', cmsController.aboutus);
router.post("/updateTermCms", cmsController.updateTermCms)
router.post("/updatePrivacyCms", cmsController.updatePrivacyCms)
router.post("/updateAboutCms", cmsController.updateAboutCms)

router.post('/createfaqs', faqController.createfaqs);
router.get('/faqListing', faqController.faqListing);
router.post("/faqsdelete/:id", faqController.faqsdelete)
router.post('/faqsUpdate', faqController.faqsUpdate)



module.exports = router;
