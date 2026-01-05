const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('userBanks', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    accountType: {
      type: DataTypes.ENUM('0','1'),
      allowNull: false,
      defaultValue: "1",
      comment: "0=>current, 1=>saving"
    },
    bankName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    accountCountry: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    currency: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    currencyCountry: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    sortCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: ""
    },
    accountName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    accountNumber: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    accountOwnerInfo: {
      type: DataTypes.ENUM('0','1','2'),
      allowNull: false,
      defaultValue: "1",
      comment: "1=>personal,2=>company"
    },
    holderName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    postalCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: ""
    },
    isDefault: {
      type: DataTypes.ENUM('0','1'),
      allowNull: false,
      defaultValue: "0",
      comment: "0=>no, 1=>yes default"
    }
  }, {
    sequelize,
    tableName: 'userBanks',
    timestamps: true,
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
    ]
  });
};
