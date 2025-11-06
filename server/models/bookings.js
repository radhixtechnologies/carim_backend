const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('bookings', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        driverId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        status: {
            type: DataTypes.ENUM('0', '1', '2', '3', '4', '5'),
            allowNull: false,
            defaultValue: "0",
            comment: "0=>driver on the way,1=>arrived,2=>ride started,3=> completed,4=>cancel"
        },
        pickupLocation: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
        dropLocation: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
        numberOfPassenger: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
        rideType: {
            type: DataTypes.ENUM('0', '1'),
            allowNull: false,
            defaultValue: "0",
            comment: "0=>single ride,1=>pool ride"
        },
        bookingPrice: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
        paymentMethod: {
            type: DataTypes.ENUM('0', '1'),
            allowNull: false,
            defaultValue: "0",
            comment: "0=>cash,1=>online"
        },

        bookingDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
        },
        latitude: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
        longitude: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },



    }, {
        sequelize,
        tableName: 'bookings',
        timestamps: true,
        paranoid: true,

    });
};
