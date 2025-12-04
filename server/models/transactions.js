const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('transactions', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      references: {
        model: 'users',
        key: 'id'
      }
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
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      references: {
        model: 'bookings',
        key: 'id'
      }
    },
    totalAmount: {
      type: DataTypes.DOUBLE(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    stripeCharge: {
      type: DataTypes.DOUBLE(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    trasactionid: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    paymentStatus: {
      type: DataTypes.ENUM('0','1','2'),
      allowNull: false,
      defaultValue: "0",
      comment: "0=>pending,1=>success,2=>failed"
    },
    paymentMethod: {
      type: DataTypes.ENUM('0','1','2'),
      allowNull: false,
      defaultValue: "0",
      comment: "1=>online,2=>offline"
    }
  }, {
    sequelize,
    tableName: 'transactions',
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
      {
        name: "bookingId",
        using: "BTREE",
        fields: [
          { name: "bookingId" },
        ]
      },
    ]
  });
};
