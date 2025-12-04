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
  var transactions = _transactions(sequelize, DataTypes);
  var transferscreenshot = _transferscreenshot(sequelize, DataTypes);
  var userBanks = _userBanks(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);
  var vehicleDetails = _vehicleDetails(sequelize, DataTypes);

  reports.belongsTo(bookings, { as: "booking", foreignKey: "bookingId"});
  bookings.hasMany(reports, { as: "reports", foreignKey: "bookingId"});
  reviewrating.belongsTo(bookings, { as: "booking", foreignKey: "bookingId"});
  bookings.hasMany(reviewrating, { as: "reviewratings", foreignKey: "bookingId"});
  transactions.belongsTo(bookings, { as: "booking", foreignKey: "bookingId"});
  bookings.hasMany(transactions, { as: "transactions", foreignKey: "bookingId"});
  bookings.belongsTo(users, { as: "user", foreignKey: "userId"});
  users.hasMany(bookings, { as: "bookings", foreignKey: "userId"});
  bookings.belongsTo(users, { as: "driver", foreignKey: "driverId"});
  users.hasMany(bookings, { as: "driver_bookings", foreignKey: "driverId"});
  driverDocuments.belongsTo(users, { as: "driver", foreignKey: "driverId"});
  users.hasMany(driverDocuments, { as: "driverDocuments", foreignKey: "driverId"});
  reports.belongsTo(users, { as: "reportBy_user", foreignKey: "reportBy"});
  users.hasMany(reports, { as: "reports", foreignKey: "reportBy"});
  reports.belongsTo(users, { as: "reportTo_user", foreignKey: "reportTo"});
  users.hasMany(reports, { as: "reportTo_reports", foreignKey: "reportTo"});
  reviewrating.belongsTo(users, { as: "ratedBy_user", foreignKey: "ratedBy"});
  users.hasMany(reviewrating, { as: "reviewratings", foreignKey: "ratedBy"});
  reviewrating.belongsTo(users, { as: "ratedTo_user", foreignKey: "ratedTo"});
  users.hasMany(reviewrating, { as: "ratedTo_reviewratings", foreignKey: "ratedTo"});
  transactions.belongsTo(users, { as: "user", foreignKey: "userId"});
  users.hasMany(transactions, { as: "transactions", foreignKey: "userId"});
  transactions.belongsTo(users, { as: "driver", foreignKey: "driverId"});
  users.hasMany(transactions, { as: "driver_transactions", foreignKey: "driverId"});
  transferscreenshot.belongsTo(users, { as: "driver", foreignKey: "driverId"});
  users.hasMany(transferscreenshot, { as: "transferscreenshots", foreignKey: "driverId"});
  userBanks.belongsTo(users, { as: "user", foreignKey: "userId"});
  users.hasMany(userBanks, { as: "userBanks", foreignKey: "userId"});

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
