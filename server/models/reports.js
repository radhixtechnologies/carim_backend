const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('reports', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        reportBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        reportTo: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        bookingId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        rason: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: ""
        },



    }, {
        sequelize,
        tableName: 'reports',
        timestamps: true,
        paranoid: true,

    });
};
