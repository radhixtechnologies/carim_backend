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

    sendNotification_android: async function (token, noti_data) {
        if (!token || typeof token !== "string" || token.trim() === "") {
            console.warn("Invalid device token, skipping push:", token);
            return false;
        }

        try {
            console.log(token, "Device token");
            console.log(noti_data, "Notification data");

            // - ROLE 
            const role = String(noti_data.targetRole || "1");

            const isDriver = role === "2";
            const androidSound = isDriver ? "driver_alert" : "default";
            const androidChannel = isDriver ? "driver_channel" : "default";
            const iosSound = isDriver ? "push_sound.caf" : "user_app.caf";

            // ------------------ FCM PAYLOAD ------------------
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
                    bookingId: String(noti_data.bookingId || "0"),
                    targetRole: role,
                    sound: iosSound, // optional (useful for app logic)

                    ...(noti_data.senderName && { senderName: String(noti_data.senderName) }),
                    ...(noti_data.senderImage && { senderImage: String(noti_data.senderImage) }),
                    ...(noti_data.phoneNumber && { phoneNumber: String(noti_data.phoneNumber) }),
                },
                apns: {
                    payload: {
                        aps: {
                            sound: iosSound, //  DRIVER iOS SOUND
                            badge: 1,
                        },
                    },
                },
                android: {
                    notification: {
                        sound: androidSound,       // DRIVER ANDROID SOUND
                        channelId: androidChannel //  MUST MATCH APP CHANNEL
                    },
                },
            };

            console.log("FCM message payload =>", message);

            const response = await admin.messaging().send(message);
            console.log("Push sent successfully:", response);

            return true;
        } catch (error) {
            console.error("Error sending push notification:", error);

            if (
                error.code === "messaging/invalid-registration-token" ||
                error.code === "messaging/registration-token-not-registered"
            ) {
                console.log(`Invalid token: ${token}, remove from DB`);
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
    error8: function (res, message = "", body = {}) {
        return res.status(408).json({
            success: false,
            status: 408,
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