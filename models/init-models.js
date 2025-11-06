var DataTypes = require("sequelize").DataTypes;
var _contactus = require("./contactus");

function initModels(sequelize) {
  var contactus = _contactus(sequelize, DataTypes);


  return {
    contactus,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
