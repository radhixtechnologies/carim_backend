const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('tutorials', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
        price: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: ""
        },
        status: {
            type: DataTypes.ENUM('0', '1'),
            allowNull: false,
            defaultValue: "0",
            comment: "0=>inactive,1=>active"
        }
    }, {
        sequelize,
        tableName: 'tutorials',
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
