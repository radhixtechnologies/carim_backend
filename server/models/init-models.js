var DataTypes = require("sequelize").DataTypes;
var _banners = require("./banners");
var _bookings = require("./bookings");
var _chat_constant = require("./chat_constant");
var _cms = require("./cms");
var _contactus = require("./contactus");
var _driverDocuments = require("./driverDocuments");
var _faqs = require("./faqs");
var _message = require("./message");
var _reports = require("./reports");
var _reviewrating = require("./reviewrating");
var _rideRequest = require("./rideRequest");
var _transactions = require("./transactions");
var _transferscreenshot = require("./transferscreenshot");
var _userBanks = require("./userBanks");
var _users = require("./users");
var _vehicleDetails = require("./vehicleDetails");

function initModels(sequelize) {
  var banners = _banners(sequelize, DataTypes);
  var bookings = _bookings(sequelize, DataTypes);
  var chat_constant = _chat_constant(sequelize, DataTypes);
  var cms = _cms(sequelize, DataTypes);
  var contactus = _contactus(sequelize, DataTypes);
  var driverDocuments = _driverDocuments(sequelize, DataTypes);
  var faqs = _faqs(sequelize, DataTypes);
  var message = _message(sequelize, DataTypes);
  var reports = _reports(sequelize, DataTypes);
  var reviewrating = _reviewrating(sequelize, DataTypes);
  var rideRequest = _rideRequest(sequelize, DataTypes);
  var transactions = _transactions(sequelize, DataTypes);
  var transferscreenshot = _transferscreenshot(sequelize, DataTypes);
  var userBanks = _userBanks(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);
  var vehicleDetails = _vehicleDetails(sequelize, DataTypes);


  return {
    banners,
    bookings,
    chat_constant,
    cms,
    contactus,
    driverDocuments,
    faqs,
    message,
    reports,
    reviewrating,
    rideRequest,
    transactions,
    transferscreenshot,
    userBanks,
    users,
    vehicleDetails,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
