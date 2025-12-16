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
      allowNull: true
    },
    reportBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    reportTo: {
      type: DataTypes.INTEGER,
      allowNull: true
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
