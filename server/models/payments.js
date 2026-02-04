const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('payments', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      comment: "Unique payment ID"
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Foreign key to users table",
      references: {
        model: 'users',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      comment: "Payment amount"
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
      comment: "Date of payment"
    },
    status: {
      type: DataTypes.ENUM('pending','completed','failed'),
      allowNull: false,
      defaultValue: "pending",
      comment: "Payment status"
    },
    id_bankily: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Foreign key to Bankily payment (if applicable)",
      references: {
        model: 'bankily',
        key: 'operationId'
      }
    },
    id_sedad: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Foreign key to Sedad payment (if applicable)",
      references: {
        model: 'sedad',
        key: 'id_facture'
      }
    }
  }, {
    sequelize,
    tableName: 'payments',
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
        name: "fk_payments_user",
        using: "BTREE",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "fk_payments_bankily",
        using: "BTREE",
        fields: [
          { name: "id_bankily" },
        ]
      },
      {
        name: "fk_payments_sedad",
        using: "BTREE",
        fields: [
          { name: "id_sedad" },
        ]
      },
    ]
  });
};
