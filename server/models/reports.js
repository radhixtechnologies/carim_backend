const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('reports', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'bookings',
        key: 'id'
      }
    },
    reportBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reportTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rason: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'reports',
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
        name: "bookingId",
        using: "BTREE",
        fields: [
          { name: "bookingId" },
        ]
      },
      {
        name: "reportBy",
        using: "BTREE",
        fields: [
          { name: "reportBy" },
        ]
      },
      {
        name: "reportTo",
        using: "BTREE",
        fields: [
          { name: "reportTo" },
        ]
      },
    ]
  });
};
