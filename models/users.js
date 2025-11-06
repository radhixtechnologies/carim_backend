const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('users', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    role: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: "0=admin, 1=user , 2=provider"
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    countryCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    phone: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ""
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    gender: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    aprovalstatus: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "0=pending , 1=approved , 2= disaproved"
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: "0=inactive , 1=active"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    social_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    social_type: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    otp: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    otpVerify: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    device_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    device_type: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    isDeleted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: "0= user not found ,  1 = login"
    },
    forgotPasswordToken: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    NotificationStatus: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: " 1=on, 0=off"
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
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    loginTime: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'users',
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
    ]
  });
};
