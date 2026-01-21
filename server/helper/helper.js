const path = require('path');
const uuid = require("uuid").v4;
const axios = require("axios")
const FCM = require("fcm-node");
const util = require('util')
const admin = require("firebase-admin");
const serviceAccount = require("./carim-app-firebase-adminsdk-fbsvc-b0dc2c7c48.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
module.exports = {

    // sendNotification_android: async (token, noti_data) => {
    //     try {
    //         console.log(token,"iiiiiiiiiiiiiiiiiiiiii");
    //                     console.log(noti_data,"noti_datanoti_datanoti_datanoti_data");

    //         jwtClient.authorize(async (err, tokens) => {
    //             if (err) {
    //                 console.log('Error during JWT authorization:', err);
    //                 return;
    //             }
    //             const accessToken = tokens.access_token;
    //             const apiUrl = `https://fcm.googleapis.com/v1/projects/${push_projectName}/messages:send`;
    //             const headers = {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${accessToken}`
    //             };

    //             const data = {
    //                 "message": {
    //                     "token": token,
    //                     "notification": {
    //                         "title": "Carim",
    //                         "body": noti_data.message,
    //                     },

    //                     "data": {
    //                         "title": "Carim",
    //                         "body": noti_data.message,
    //                         "type": JSON.stringify(noti_data.type),
    //                         "senderId": JSON.stringify(noti_data.senderId),
    //                         "sender_name": noti_data.sender_name,
    //                         "sender_image": noti_data.sender_image,

    //                     },
    //                 }
    //             }
    //             console.log(headers, data, "==========================");

    //             try {
    //                 const response = await axios.post(apiUrl, data, { headers });
    //                 console.log('Push sent successfully:', response.data);
    //             } catch (error) {
    //                 console.error('Error sending push notification:', error.response ? error.response.data : error.data);
    //             }
    //         });
    //     } catch (error) {
    //         console.error('Error in sendNotification_android:', error);
    //     }
    // },


    sendNotification_android: async function (token, noti_data) {
        if (!token || token.trim() === "") {
            console.warn("No device token provided, skipping push notification.");
            return false;
        }
        console.log(token, "token");
        console.log(noti_data, "noti_data");
        try {
            const message = {
                token: token,
                notification: {
                    title: noti_data.title || "Carim",
                    body: noti_data.message || "",
                },
                data: {
                    titleData: String(noti_data.title || "Notification"),
                    messageData: String(noti_data.message || ""),
                    senderId: String(noti_data.senderId || ""),
                    type: String(noti_data.type || ""),
                    notificationId: String(noti_data.notificationId || "0"),
                    bookingId: String(noti_data.bookingId || 0),
                    ...(noti_data.senderName && { senderName: String(noti_data.senderName) }),
                    ...(noti_data.senderImage && { senderImage: String(noti_data.senderImage) }),
                    ...(noti_data.phoneNumber && { phoneNumber: String(noti_data.phoneNumber) }),
                },
                apns: {
                    payload: {
                        aps: {
                            // sound: "default",
                            sound: "user_app.caf",
                            badge: 1,
                        },
                    },
                },
                android: {
                    notification: {
                        sound: "default",
                        channelId: "default",
                    },
                },
            };
            console.log(message, "iiiiiiiiiiiiiiiiiiiiiiii");

            const response = await admin.messaging().send(message);
            console.log("Push sent successfully:", response);
            return true;
        } catch (error) {
            console.error("Error sending push notification:", error.message || error);
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                console.log(`Invalid token: ${token}, you may want to remove it from database`);
            }

            throw error;
        }
    },

    success: function (res, message = "", body = {}) {
        return res.status(200).json({
            success: true,
            status: 200,
            message: message,
            body: body
        });
    },
    failure: function (res, message = "", body = {}) {
        return res.status(400).json({
            success: false,
            status: 400,
            message: message,
            body: body
        });
    },
    error: function (res, message = "", body = {}) {
        return res.status(403).json({
            success: false,
            status: 403,
            message: message,
            body: body
        });
    },

    error1: function (res, message = "", body = {}) {
        return res.status(405).json({
            success: false,
            status: 405,
            message: message,
            body: body
        });
    },
    error2: function (res, message = "", body = {}) {
        return res.status(406).json({
            success: false,
            status: 406,
            message: message,
            body: body
        });
    },
    error3: function (res, message = "", body = {}) {
        return res.status(407).json({
            success: false,
            status: 407,
            message: message,
            body: body
        });
    },
    forbidden: function (res, message = "", body = {}) {
        return res.status(402).json({
            success: false,
            status: 402,
            message: message,
            body: body
        });
    },
    fileUpload: async (file) => {
        if (!file) return null;

        try {
            const extension = path.extname(file.name);
            const filename = uuid() + extension;
            const uploadPath = path.join(process.cwd(), "public", "images", filename);

            await file.mv(uploadPath);

            return `/images/${filename}`;
        } catch (err) {
            throw err;
        }
    },
    checkValidation: async (v) => {
        var errorsResponse;
        const match = await v.check().then(function (matched) {
            if (!matched) {
                var valdErrors = v.errors;
                var respErrors = [];
                Object.keys(valdErrors).forEach(function (key) {
                    if (valdErrors && valdErrors[key] && valdErrors[key].message) {
                        respErrors.push(valdErrors[key].message);
                    }
                });
                errorsResponse = respErrors.length > 0 ? respErrors[0] : '';
            }
        });
        return errorsResponse;
    },
    unixTimestamp: function () {
        var time = Date.now();
        var n = time / 1000;
        return (time = Math.floor(n));
    },

}