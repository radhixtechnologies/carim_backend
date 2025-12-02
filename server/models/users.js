const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('users', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    role: {
      type: DataTypes.ENUM('0', '1', '2', '3'),
      allowNull: false,
      defaultValue: "1",
      comment: "o=>admin,1=>user,2=>driver,3=>employee"
    },
    firstName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    lastName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    countryCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: ""
    },
    phoneNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ""
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    otp: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    otpVerify: {
      type: DataTypes.ENUM('0', '1'),
      allowNull: false,
      defaultValue: "0",
      comment: "0=>not verify,1=>verify"
    },
    status: {
      type: DataTypes.ENUM('0', '1'),
      allowNull: false,
      defaultValue: "1",
      comment: "0=>incative,1=>active"
    },
    isProfileComplete: {
      type: DataTypes.ENUM('0', '1'),
      allowNull: false,
      defaultValue: "0",
      comment: "0=>no,1=>yes"
    },
    loginTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    country: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    state: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ""
    },
    latitude: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    longitude: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    isNotificationOn: {
      type: DataTypes.ENUM('0', '1'),
      allowNull: false,
      defaultValue: "1",
      comment: '0 off ,1 on'
    },
    deviceToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ""
    },
    deviceType: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: ""
    },
    socket_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    online: {
      type: DataTypes.ENUM('0', '1'),
      allowNull: false,
      defaultValue: "0",
      comment: "for chat 1=>online, 0=>offline"
    },
    customer_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "",
      comment: "for Stripe Payment "
    },
    account_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "",
      comment: "for Stripe Payment "
    },
    hash_account: {
      type: DataTypes.ENUM('0', '1'),
      allowNull: false,
      defaultValue: "0",
      comment: "for Stripe Payment   0=>pending,1=>complete"
    },
    gender: {
      type: DataTypes.ENUM('0', '1', '2'),
      allowNull: false,
      defaultValue: "0",
      comment: "for chat 0=>male, 1=>female, 2=>other"
    },
    block: {
      type: DataTypes.ENUM('0', '1',),
      allowNull: false,
      defaultValue: "0",
      comment: " 0=>unblock, 1=>block"
    },
    suspend: {
      type: DataTypes.ENUM('0', '1',),
      allowNull: false,
      defaultValue: "0",
      comment: " 0=>unsuspend, 1=>suspend"
    },
    approve: {
      type: DataTypes.ENUM('0', '1', '2'),
      allowNull: false,
      defaultValue: "0",
      comment: " 0=>pending, 1=>aproved, 2=>rejected"
    },
    documentVerify: {
      type: DataTypes.ENUM('0', '1', '2'),
      allowNull: false,
      defaultValue: "0",
      comment: " 0=>pending, 1=>verified, 2=>rejected"
    },
    adminCommission: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "",
      comment: "for admin charge"
    },
    vehicle: {
      type: DataTypes.ENUM('0', '1'),
      allowNull: false,
      defaultValue: "0",
      comment: " 0=>pending, 1=>verified,"
    },
    totalAmount: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "",
    }

  }, {
    sequelize,
    tableName: 'users',
    timestamps: true,
    paranoid: true,

  });
};
