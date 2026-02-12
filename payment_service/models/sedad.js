const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Sedad = sequelize.define('sedad', {
  id_facture: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    comment: 'Unique invoice ID',
  },

  payer_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '',
    comment: 'Name of the payer',
  },
  payer_tel: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '',
    comment: 'Phone number of the payer',
  },
  payment_code: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '',
    comment: 'Unique code for the payment',
  },

  id_transaction: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '',
    comment: '',
  },

  num_recu: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '',
    comment: '',
  },

  socketId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '',
    comment: '',
  },
}, {
  tableName: 'sedad',
  timestamps: true,
  paranoid: true,
});

module.exports = Sedad;
