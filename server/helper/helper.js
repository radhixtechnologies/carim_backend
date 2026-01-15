const path = require('path');
const uuid = require("uuid").v4;
const FCM = require("fcm-node");
const util = require('util')
const { google } = require('googleapis');
const fcmfile = require('./carim-app-firebase-adminsdk-fbsvc-b0dc2c7c48.json');
const SCOPES = ['https://www.googleapis.com/auth/cloud-platform'];
const push_projectName = "Carim";
const jwtClient = new google.auth.JWT(
    fcmfile.client_email,
    null,
    fcmfile.private_key,
    SCOPES,
    null
);
module.exports = {

    sendNotification_android: async (token, noti_data) => {
        try {
            jwtClient.authorize(async (err, tokens) => {
                if (err) {
                    console.log('Error during JWT authorization:', err);
                    return;
                }
                const accessToken = tokens.access_token;
                const apiUrl = `https://fcm.googleapis.com/v1/projects/${push_projectName}/messages:send`;
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                };

                const data = {
                    "message": {
                        "token": token,
                        "notification": {
                            "title": "Carim",
                            "body": noti_data.message,
                        },

                        "data": {
                            "title": "Carim",
                            "body": noti_data.message,
                            "type": JSON.stringify(noti_data.type),
                            "senderId": JSON.stringify(noti_data.senderId),
                            "sender_name": noti_data.sender_name,
                            "sender_image": noti_data.sender_image,

                        },
                    }
                }
                console.log(headers, data, "==========================");

                try {
                    const response = await axios.post(apiUrl, data, { headers });
                    console.log('Push sent successfully:', response.data);
                } catch (error) {
                    console.error('Error sending push notification:', error.response ? error.response.data : error.data);
                }
            });
        } catch (error) {
            console.error('Error in sendNotification_android:', error);
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