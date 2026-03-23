'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

sequelize.sync({ alter: false })
  .then(() => {
    console.log('Database synced successfully');
  })
  .catch((err) => {
    console.error('Error syncing the database:', err);
  });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;





//for booking
db.bookings.belongsTo(db.users, { foreignKey: 'userId', as: 'userbook' });
db.users.hasMany(db.bookings, { foreignKey: "driverId", as: "driverbook" });

db.bookings.belongsTo(db.users, { foreignKey: 'driverId', as: 'driverbook' });




// In your associations file where you define relationships
db.users.hasMany(db.reviewrating, { foreignKey: 'ratedTo', as: 'receivedRatings' });
db.reviewrating.belongsTo(db.users, { foreignKey: 'ratedBy', as: 'ratedby' });
db.reviewrating.belongsTo(db.users, { foreignKey: 'ratedTo', as: 'ratedto' });
db.reviewrating.belongsTo(db.bookings, { foreignKey: 'bookingId', as: 'ratedbooking' });

//report associations 
db.reports.belongsTo(db.users, { foreignKey: 'reportBy', as: 'reportedby' });
db.reports.belongsTo(db.users, { foreignKey: 'reportTo', as: 'reportedto' });
db.reports.belongsTo(db.bookings, { foreignKey: 'bookingId', as: 'reportedbooking' });

//transaction associations
db.transactions.belongsTo(db.users, { foreignKey: 'userId', as: 'usertransaction' });
db.transactions.belongsTo(db.users, { foreignKey: 'driverId', as: 'drivertransaction' });
db.transactions.belongsTo(db.bookings, { foreignKey: 'bookingId', as: 'transactionbooking' });

//driver documents associationsp
db.users.hasOne(db.vehicleDetails, { foreignKey: 'driverId', as: 'vehicleDetail' });
db.vehicleDetails.belongsTo(db.users, { foreignKey: 'driverId', as: 'vehicleDetail' });

//user banks associations
db.userBanks.belongsTo(db.users, { foreignKey: 'userId', as: 'banks' });
db.users.hasMany(db.userBanks, { foreignKey: 'userId', as: 'banks' });

//screenshot associations 
db.transferscreenshot.belongsTo(db.users, { foreignKey: 'driverId', as: 'screenshotdriver' });


db.rideRequest.belongsTo(db.users, { foreignKey: 'driverId', as: 'user' });
db.bookings.hasMany(db.rideRequest, { foreignKey: "bookingId", as: "rideRequests" });

db.rideRequest.belongsTo(db.bookings, { foreignKey: "bookingId", as: "booking" });
