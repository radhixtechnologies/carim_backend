const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('transferscreenshot', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DOUBLE(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    status: {
      type: DataTypes.ENUM('0','1','2'),
      allowNull: false,
      defaultValue: "0",
      comment: "0=>pending,1=>approved,2=>rejected"
    },
    paymentStatus: {
      type: DataTypes.ENUM('0','1','2'),
      allowNull: false,
      defaultValue: "0",
      comment: "0=>pending,1=>success,2=>failed"
    }
  }, {
    sequelize,
    tableName: 'transferscreenshot',
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
        name: "driverId",
        using: "BTREE",
        fields: [
          { name: "driverId" },
        ]
      },
    ]
  });
};
