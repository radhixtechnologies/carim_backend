const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Bankily = sequelize.define('bankily', {
  operationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,

    comment: 'Unique operation identifier for Bankily',
  },

  clientPhone: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '',
  },
  passcode: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '',
  },
  id_transaction: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '',
  },
}, {
  tableName: 'bankily',
  timestamps: true,
  paranoid: true,
});

module.exports = Bankily;
