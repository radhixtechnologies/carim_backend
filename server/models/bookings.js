const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bookings', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    orderId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    status: {
      type: DataTypes.ENUM('0','1','2','3','4','5','6'),
      allowNull: false,
      defaultValue: "0",
      comment: "0=>driver on the way,1=>arrived,2=>ride started,3=> completed,4=>cancel"
    },
    request: {
      type: DataTypes.ENUM('0','1','2'),
      allowNull: false,
      defaultValue: "0"
    },
    otpbooking: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    pickupLocation: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    dropLocation: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    pickupLatitude: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    pickupLongitude: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    dropLatitude: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    dropLongitude: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    numberOfPassenger: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    rideType: {
      type: DataTypes.ENUM('0','1'),
      allowNull: false,
      defaultValue: "0",
      comment: "0=>single ride,1=>pool ride"
    },
    bookingPrice: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    paymentMethod: {
      type: DataTypes.ENUM('0','1'),
      allowNull: false,
      defaultValue: "0",
      comment: "0=>cash,1=>online"
    },
    bookingDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    rideOpen: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    rejectCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    travelledDistance: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    lastLatitude: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    lastLongitude: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    lastParkingMinutes: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    totalParkingCharge: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    lastUpdateTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    startParkTime: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    endParkTime: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    callerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    callerCountryCode: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    callerPhone: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    adminAmountCut: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    rideDistance: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    }
  }, {
    sequelize,
    tableName: 'bookings',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "userId",
        using: "BTREE",
        fields: [
          { name: "userId" },
        ]
      },
      {
        name: "driverId",
        using: "BTREE",
        fields: [
          { name: "driverId" },
        ]
      },
    ]
  });
};
