const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Payments = sequelize.define('payments', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    comment: 'Unique payment ID',
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Foreign key to users table',
  },
  amount: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0,
    comment: 'Payment amount',
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date of payment',
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Payment status',
  },
  id_bankily: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Foreign key to Bankily payment (if applicable)',
  },
  id_sedad: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Foreign key to Sedad payment (if applicable)',
  },
}, {
  tableName: 'payments',
  timestamps: true,
  paranoid: true,
});

module.exports = Payments;
