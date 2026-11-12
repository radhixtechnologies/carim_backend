const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'uploadedFiles',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      mimeType: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: 'application/octet-stream',
      },
      data: {
        type: DataTypes.BLOB('long'),
        allowNull: false,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      tableName: 'uploadedFiles',
      timestamps: true,
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
        {
          name: 'uploadedFiles_filename_unique',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'filename' }],
        },
      ],
    }
  );
};
