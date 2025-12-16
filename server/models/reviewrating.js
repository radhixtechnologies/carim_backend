const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('reviewrating', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    ratedBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ratedTo: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rating: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'reviewrating',
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
        name: "ratedBy",
        using: "BTREE",
        fields: [
          { name: "ratedBy" },
        ]
      },
      {
        name: "ratedTo",
        using: "BTREE",
        fields: [
          { name: "ratedTo" },
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
