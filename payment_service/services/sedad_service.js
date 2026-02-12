const {findUserById} = require("./user_service")
const {paymentFailed,paymentCompleted, updateSedad , createPaymentWithSedad , findPaymentBySedadId} = require("./payment_service")
const {formatFacture,reverseFormatFacture}  = require("../utils")
const Sedad = require("../models/sedad")


const apiKey = process.env.SEDAD_API_KEY;

const codeAbonnement = process.env.SEDAD_SUBSCRIPTION_CODE;
const list_wallets_url = "https://nexpay-653e0b7d7b24.herokuapp.com/api/moyens_paiement"

const request_payment_url="https://nexpay-653e0b7d7b24.herokuapp.com/api/demande_paiement"

const consult_payment_url="https://nexpay-653e0b7d7b24.herokuapp.com/api/consulte_paiement"



 async function requestPayment(uid, montant,telephone_payeur , res, fetch){


   const results =  await createPaymentWithSedad(telephone_payeur,montant,uid)

    user = findUserById(uid)
    nom_payeur= user.firstName +" "+user.lastName
    const id_facture = formatFacture(results.sedad.id_facture)

    const body ={"montant":montant, telephone_payeur:telephone_payeur,  id_facture:id_facture,
        "date": new Date().toISOString() , "nom_payeur":nom_payeur,"code_abonnement":codeAbonnement }


    const result = await fetch(request_payment_url, {
        method: "POST",
        body:JSON.stringify(body),
        headers: headers = {
    "accept": "application/json",
    "Content-Type": "application/json", 
    "Authorization": `Api-Key ${apiKey}`
    }
        });
  
        const responseBody = await result.json();
        console.log(result.status )
        console.log(result.status )
        console.log(result.status )
        console.log(result.status )
        if(result.status ==200){


        const formattedResult = {
        code_paiement: responseBody.data.code_paiement,
        id_facture: responseBody.data.id_facture,
        type: responseBody.data.type
        };
        updateSedad(body.id_facture,null,formattedResult.code_paiement,null)

        console.log(formattedResult)
        console.log(responseBody)
        return res.status(200).json(formattedResult);

        }else{

            paymentFailed(results.payment.id)

        }


    return res.status(result.status).json(responseBody);
}




async function listWallets(){


    const result = await fetch(list_wallets_url, {
        method: "GET",
        headers: headers = {
    "accept": "application/json",
    "Content-Type": "application/json", 
    "Authorization": `Api-Key ${apiKey}`
}
    });

    return result;
}


async function confirmPayment(req,id_facture, id_transaction,numero_recu ){

    const payment = await  findPaymentBySedadId(id_facture)
    const sedad = await updateSedad(id_facture, null,null,null,id_transaction,numero_recu)

    await paymentCompleted(payment.id , payment.user_id)

  
   const io = req.app.get('io');


  if (sedad.socketId) {
    io.to(sedad.socketId).emit('payment_status', {
      transactionId: formatFacture(id_facture),
      status: 'completed',
      amount: payment.amount
    });
  }


}


async function _consultPayment(numero_recu) {




  body = {"numero_recu":numero_recu}


    const response = await fetch(consult_payment_url, {
        method: "POST",
        body:JSON.stringify(body),
        headers: headers = {
    "accept": "application/json",
    "Content-Type": "application/json", 
    "Authorization": `Api-Key ${apiKey}`
    }
        });
    
    const status = response.status
    const responseBody = await response.json()
    
    return {status,responseBody}

}

async function consultPaymentWithRetry(numero_recu, retries = 3) {
  try {
    return await _consultPayment(numero_recu);
  } catch (err) {
    // Detect fetch failed error
    if (err instanceof TypeError && err.message.includes("fetch failed")) {
      console.log("⚠️ Fetch failed, retrying...");

      if (retries > 0) {
        return await consultPaymentWithRetry(numero_recu, retries - 1);
      }

      console.log("❌ All retries exhausted.");
    }

    // Throw error if it's not recoverable
    throw err;
  }
}



async function findSedadByIdFacture(id_f) {



        let id_facture = id_f;
    if ( String(id_f).startsWith('N')){
        id_facture = reverseFormatFacture(id_f)
    }
  const sedad = await Sedad.findByPk(id_facture);

    return sedad

}







module.exports = {
    requestPayment,
    listWallets,
    confirmPayment,
    consultPaymentWithRetry,
    findSedadByIdFacture,
};