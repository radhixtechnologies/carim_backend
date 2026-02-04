const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('sedad', {
    id_facture: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    payer_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    payer_tel: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    payment_code: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    socketId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    num_recu: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    id_transaction: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    }
  }, {
    sequelize,
    tableName: 'sedad',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id_facture" },
        ]
      },
    ]
  });
};
