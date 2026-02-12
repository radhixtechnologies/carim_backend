
const auth_url = "https://ebankily-tst.appspot.com/authentification"
const payment_url  = "https://ebankily-tst.appspot.com/payment"
const verify_transaction_url ="https://ebankily-tst.appspot.com/checkTransaction"



const username = process.env.BANKILY_USER_NAME;
const password = process.env.BANKILY_PASSWORD;
async function authenticate() {

    const params = {
        grant_type:"password",
        username:username,
        password:password,
        client_id:"ebankily"
    }
    const query = new URLSearchParams(params).toString();

    const result = await fetch(`${auth_url}?${query}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

    return result.json();
}


async function refreshAuthentication(refresh_token) {

    const params = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id" :"ebankily"
    }
    const query = new URLSearchParams(params).toString();

    const result = await fetch(`${auth_url}?${query}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

    return result.json();
}



async function MakePayment(clientPhone,passcode,operationId,amount,language , access_token) {

    const body =  {
    "clientPhone": clientPhone,
    "passcode": passcode,
    "operationId": operationId,
    "amount": amount,
    "language" :language
  }

   const headers = {
        "Content-type" : "application/json",
        "Authorization": "Bearer "+access_token
    }
   

    const result = await fetch(payment_url, {
        method: "POST",
        body:JSON.stringify(body),
        headers: headers
    });



    return result.json();
    }





async function verifyTransaction(operationId , access_token) {

    const body =  {
    "operationId": operationId,
  }

   const headers = {
        "Content-type" : "application/json",
        "Authorization": "Bearer "+access_token
    }
   

    const result = await fetch(verify_transaction_url, {
        method: "POST",
        body:JSON.stringify(body),
        headers: headers
    });

    return result.json();
    }


module.exports = {
  authenticate,
  MakePayment,
  verifyTransaction,
};