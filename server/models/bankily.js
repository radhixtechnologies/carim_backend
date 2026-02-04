const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bankily', {
    operationId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      comment: "Unique operation identifier for Bankily"
    },
    clientPhone: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    passcode: {
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
    tableName: 'bankily',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "operationId" },
        ]
      },
    ]
  });
};
