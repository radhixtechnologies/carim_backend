const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('message', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    reciever_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    chatConstant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    message: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    msgType: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "1=>msg,2=>image,3=>video, 4=>call\t"
    },
    deletedId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    readStatus: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "1=>read,0=>Unread"
    }
  }, {
    sequelize,
    tableName: 'message',
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
    ]
  });
};
