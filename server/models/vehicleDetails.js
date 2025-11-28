const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('vehicleDetails', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        driverId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        vehicleBrand: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
        vehicleModel: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
        vehicleYear: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
        vehicleNumber: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
        vehicleColor: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
        vehicleDocument: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
        drivingLicence: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
    }, {
        sequelize,
        tableName: 'vehicleDetails',
        timestamps: true,

    });
};
