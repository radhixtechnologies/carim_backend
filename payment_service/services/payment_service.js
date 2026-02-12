const { Payments, Bankily , Sedad, User } = require('../models'); 
const sequelize = require('../db');
const {reverseFormatFacture} = require("../utils");



async function createPaymentWithSedad(
  clientPhone = null,
  amount = null,
  uid = null
) {
  const t = await sequelize.transaction();

  try {
    let sedad = null;
    console.log("create sadad")
    // Step 1: Create sedad if fields provided
      sedad = await Sedad.create({
        payer_tel:clientPhone,
      }, { transaction: t });
      
    console.log("sedad")


    // Step 2: Create Payment
    const payment = await Payments.create({
        id_sedad:sedad.id_facture,
        amount:amount,
        user_id:uid

    }, { transaction: t });



    // Commit transaction
    await t.commit();

    return { payment, sedad };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}




async function updateSedad(

    id_f = null,
  clientPhone = null,
  payment_code = null,
  payer_name= null,
  id_transaction= null,
  num_recu =null
) {
   try {
    let id_facture = id_f;
    if ( String(id_f).startsWith('N')){
        id_facture = reverseFormatFacture(id_f)
    }

    const sedad = await Sedad.findByPk(id_facture);
    if (!sedad) throw new Error(`sedad with ID ${id_facture} not found`);

    if (payment_code!=null) sedad.payment_code = payment_code
    if (payer_name!=null) sedad.payer_name = payer_name
    if (clientPhone!=null) sedad.clientPhone = clientPhone
    if (num_recu!=null) sedad.num_recu = num_recu
    if (id_transaction!=null) sedad.id_transaction = id_transaction

    sedad.save()

    return sedad;
  } catch (error) {
    throw error;
  }


}


async function updateBankily(

    operationId = null,
  id_transaction= null,

) {
   try {

    const bankily = await Bankily.findByPk(operationId);
    console.log(bankily)

    if (!bankily) throw new Error(`bankily with ID ${operationId} not found`);

    console.log("updating bankily")
    bankily.id_transaction = id_transaction

    bankily.save()

    return bankily;
  } catch (error) {
    console.log("updating bankily error")

    throw error;
  }


}





async function createPaymentWithBankily(
  
  clientPhone = null,
  amount = null,
  passcode=null,
  uid=null
) {
  const t = await sequelize.transaction();

  try {
    let bankily = null;

    // Step 1: Create Bankily if fields provided
      bankily = await Bankily.create({
        clientPhone:clientPhone,
        passcode:passcode,
      }, { transaction: t });
      
      console.log("bankily")
      console.log(bankily.operationId)
    // Step 2: Create Payment
    const payment = await Payments.create({
        id_bankily:bankily.operationId,
        amount:amount,
        user_id:uid

    }, { transaction: t });



    // Commit transaction
    await t.commit();
    console.log("reated")
    return { payment, bankily };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}








async function paymentFailed(paymentId) {
  const payment = await Payments.findByPk(paymentId);
  if (!payment) throw new Error(`Payment with ID ${paymentId} not found`);

  payment.status = 'failed';
  await payment.save();
  return payment;
}


async function findPaymentBySedadId(sedadId) {
  if (!sedadId) throw new Error('Sedad ID is required');

  let id_sedad = sedadId;
    if ( String(sedadId).startsWith('N')){
        id_sedad = reverseFormatFacture(sedadId)
    }
  const payment = await Payments.findOne({
    where: { id_sedad: id_sedad }
  });

//   console.log(payment)

  return payment; // returns null if not found
}

async function paymentCompleted(paymentId=null, uid) {
  // Use a transaction to ensure atomicity
  const t = await sequelize.transaction();

  try {
    const payment = await Payments.findByPk(paymentId, { transaction: t });
    if (!payment) throw new Error(`Payment with ID ${paymentId} not found`);

    const user = await User.findByPk(uid, { transaction: t });
    if (!user) throw new Error(`User with ID ${uid} not found`);


    payment.status = 'completed';
    await payment.save({ transaction: t });



    const previousTotal = parseFloat(user.totalAmount) || 0;
    const newTotal = previousTotal + parseFloat(payment.amount);
    user.totalAmount = newTotal;
    await user.save({ transaction: t });

    await t.commit();

    return payment;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}


module.exports = { createPaymentWithBankily  , paymentFailed, paymentCompleted, updateSedad, createPaymentWithSedad,findPaymentBySedadId,updateBankily};