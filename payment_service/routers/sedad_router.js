const express = require("express")
const Joi = require("joi");
const fetch = require("node-fetch")
const { requestPayment ,listWallets, confirmPayment,consultPaymentWithRetry,findSedadByIdFacture} = require("../services/sedad_service"); 
const {findPaymentBySedadId} = require("../services/payment_service")
const {reverseFormatFacture} = require("../utils");
router = express.Router()



const confermPaymentSchema = Joi.object({
  id_facture: Joi.string().required(), // id unique de la demande de paiement
  id_transaction: Joi.string().required(), // identifiant unique sur la plateforme
  date_paiement: Joi.date().required(),
  montant: Joi.string().required(), // montant de la transaction
  telephone_commercant: Joi.string().required(),
  numero_recu: Joi.string().required(), // identifiant Nexconnect
  note: Joi.string().allow('').optional() // note particuliere
});

const requestPaymentSchema = Joi.object({
  uid: Joi.number().optional(),
  montant: Joi.number().required(),
  telephone_payeur: Joi.string().required(),
});

const consultPaymentSchema = Joi.object({
  id_facture: Joi.string().required(),

});




router.post("/demande_paiement", async (req, res) => {

  const { error, value } = requestPaymentSchema.validate(req.body);
  console.log(req.body,"bbbbbbbbbbbbbbbbbbbbbb");
  
  if (error) return res.status(400).json({ error: error.details[0].message });

   const  { uid , montant, telephone_payeur} = value


    return requestPayment(uid, montant,telephone_payeur , res, fetch);
})

router.get("/moyens_paiement", async (req, res) => {

    const result = await listWallets();
    const body = await result.json()
    return res.status(200).json(body)
})

router.post("/confirmation_paiement", async (req, res) => {


  const { error, value } = confermPaymentSchema.validate(req.body);
  console.log(req.body,"hhhhhhhhhhhhhhhhhhhhhhhhhhh");
  
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { id_facture, id_transaction, date_paiement, montant,telephone_commercant,numero_recu, note} = value;

  console.log(`idFacture: ${reverseFormatFacture(id_facture)}`)

  confirmPayment(req,reverseFormatFacture(id_facture), id_transaction,numero_recu)

  return res.status(200).json({})
 
})

router.post("/consulte_paiement", async (req, res) => {


  const { error, value } = consultPaymentSchema.validate(req.body);
  console.log(req.body,"yyyyyyyyyyyyyyyyyyyy");
  
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { id_facture} = value;

    const sedad = await findSedadByIdFacture(id_facture)
    if (!sedad) return res.status(404).json({})

    const response = await consultPaymentWithRetry(sedad.num_recu)

    return res.status(response.status).json(response.responseBody)

})

router.get("/payment_status", async (req, res) => {


   const { error, value } = consultPaymentSchema.validate(req.query);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const { id_facture } = value;

  const payment = await findPaymentBySedadId(id_facture)
    if (!payment) return res.status(200).json({"status" : "NF"})

  return res.status(200).json({"status" : payment.status})


})

module.exports= router
