const express = require("express")
const Joi = require("joi");
const { authenticate, MakePayment, verifyTransaction } = require("../services/bankily_service");
const { createPaymentWithBankily, paymentFailed, paymentCompleted, updateBankily } = require("../services/payment_service")

router = express.Router()


const paymentSchema = Joi.object({
  uid: Joi.number().required(),
  clientPhone: Joi.string().required(),
  passcode: Joi.string().required(),
  // operationId: Joi.string().required(),
  amount: Joi.string().required(),
  language: Joi.string().required(),
});



router.post("/payment", async (req, res) => {
  console.log(req.body, "===>");

  const { error, value } = paymentSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { uid, clientPhone, passcode, amount, language } = value;

  const results = await createPaymentWithBankily(clientPhone, amount, passcode, uid)
  const operationId = results.bankily.operationId

  try {
    // 1. Authenticate
    const auth = await authenticate();
    const access_token = auth.access_token;


    // 2. Make payment
    const payment = await MakePayment(clientPhone, passcode, operationId, amount, language, access_token);
    if (payment.errorCode != 0) {
      console.log("error payment")

      await paymentFailed(results.payment.id)

      return res.status(400).json({ errorMessage: payment.errorMessage });
    }

    // 3. Verify transaction
    const verification = await verifyTransaction(operationId, access_token);

    console.log(verification)

    if (verification.errorCode == 0) {

      // TODO: Add the amount to the user's acount


      await paymentCompleted(results.payment.id, uid)
      await updateBankily(operationId, verification.transactionId)

      return res.status(200).json({
        transactionId: verification.transactionId,
        errorCode: verification.errorCode,
        errorMessage: verification.errorMessage,
        status: verification.status,
      });
    }



    await paymentFailed(results.payment.id)

    return res.status(400).json({
      transactionId: verification.transactionId,
      errorCode: verification.errorCode,
      errorMessage: verification.errorMessage,
      status: verification.status,
    });


  } catch (err) {
    console.error(err.message)
    return res.status(500).json({ errorMessage: "Internal server error", details: err.message });
  }
});



module.exports = router