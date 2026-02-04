var DataTypes = require("sequelize").DataTypes;
var _bankily = require("./bankily");
var _banners = require("./banners");
var _bookings = require("./bookings");
var _chat_constant = require("./chat_constant");
var _cms = require("./cms");
var _contactus = require("./contactus");
var _driverDocuments = require("./driverDocuments");
var _faqs = require("./faqs");
var _message = require("./message");
var _notifications = require("./notifications");
var _payments = require("./payments");
var _reports = require("./reports");
var _reviewrating = require("./reviewrating");
var _rideRequest = require("./rideRequest");
var _sedad = require("./sedad");
var _testingLocation = require("./testingLocation");
var _transactions = require("./transactions");
var _transferscreenshot = require("./transferscreenshot");
var _userBanks = require("./userBanks");
var _users = require("./users");
var _vehicleDetails = require("./vehicleDetails");

function initModels(sequelize) {
  var bankily = _bankily(sequelize, DataTypes);
  var banners = _banners(sequelize, DataTypes);
  var bookings = _bookings(sequelize, DataTypes);
  var chat_constant = _chat_constant(sequelize, DataTypes);
  var cms = _cms(sequelize, DataTypes);
  var contactus = _contactus(sequelize, DataTypes);
  var driverDocuments = _driverDocuments(sequelize, DataTypes);
  var faqs = _faqs(sequelize, DataTypes);
  var message = _message(sequelize, DataTypes);
  var notifications = _notifications(sequelize, DataTypes);
  var payments = _payments(sequelize, DataTypes);
  var reports = _reports(sequelize, DataTypes);
  var reviewrating = _reviewrating(sequelize, DataTypes);
  var rideRequest = _rideRequest(sequelize, DataTypes);
  var sedad = _sedad(sequelize, DataTypes);
  var testingLocation = _testingLocation(sequelize, DataTypes);
  var transactions = _transactions(sequelize, DataTypes);
  var transferscreenshot = _transferscreenshot(sequelize, DataTypes);
  var userBanks = _userBanks(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);
  var vehicleDetails = _vehicleDetails(sequelize, DataTypes);

  payments.belongsTo(bankily, { as: "id_bankily_bankily", foreignKey: "id_bankily"});
  bankily.hasMany(payments, { as: "payments", foreignKey: "id_bankily"});
  payments.belongsTo(sedad, { as: "id_sedad_sedad", foreignKey: "id_sedad"});
  sedad.hasMany(payments, { as: "payments", foreignKey: "id_sedad"});
  payments.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(payments, { as: "payments", foreignKey: "user_id"});

  return {
    bankily,
    banners,
    bookings,
    chat_constant,
    cms,
    contactus,
    driverDocuments,
    faqs,
    message,
    notifications,
    payments,
    reports,
    reviewrating,
    rideRequest,
    sedad,
    testingLocation,
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
