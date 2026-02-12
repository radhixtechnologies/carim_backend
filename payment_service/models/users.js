const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('users', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  email: DataTypes.STRING,
  totalAmount: DataTypes.DOUBLE,
}, {
  timestamps: true,
  paranoid: true,
});

module.exports = User;