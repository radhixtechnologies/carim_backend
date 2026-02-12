const User = require('./users');
const Payments = require('./payment');
const Bankily = require('./bankily');
const Sedad = require('./sedad');

Payments.belongsTo(User, { foreignKey: 'user_id' });
Payments.belongsTo(Bankily, { foreignKey: 'id_bankily' });
Payments.belongsTo(Sedad, { foreignKey: 'id_sedad' });

module.exports = {
  User,
  Payments,
  Bankily,
  Sedad,
};
