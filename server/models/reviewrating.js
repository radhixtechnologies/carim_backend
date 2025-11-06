const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('reviewrating', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        ratedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        ratedTo: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        bookingId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        rating: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ""
        },
        review: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: ""
        },



    }, {
        sequelize,
        tableName: 'reviewrating',
        timestamps: true,
        paranoid: true,

    });
};
