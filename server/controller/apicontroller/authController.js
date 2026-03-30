const db = require('../../models');
const bcrypt = require('bcryptjs');
const helper = require('../../helper/helper');
const { Validator } = require('node-input-validator');
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { Sequelize } = require('sequelize');

const accountSid = "ACdcc97516d25fd3723d35d1e1df146b5a";
const authToken = "dc4bd0a49ee2ba28a852b44c6f16b5b8";
const client = require("twilio")(accountSid, authToken);



module.exports = {

    // login1: async (req, res) => {
    //     try {
    //         const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English

    //         // 🔹 validate input
    //         const v = new Validator(req.body, {
    //             countryCode: "required",
    //             phoneNumber: "required",
    //             role: "required",
    //         });

    //         const errorsResponse = await helper.checkValidation(v);
    //         if (errorsResponse) return helper.failure(res, errorsResponse);

    //         const { deviceToken, deviceType, phoneNumber, languagee_type, countryCode, role } = req.body;

    //         const existingUser = await db.users.findOne({
    //             where: { phoneNumber, countryCode, role, deletedAt: null },
    //         });

    //         let user;
    //         let isNewUser = false;
    //         const otp = '1111';
    //         const rideOtp = '1111';



    //         const loginTime = helper.unixTimestamp();

    //         if (existingUser) {
    //             if (existingUser.status === "0") {
    //                 let msg = "Your account has been deactivated by admin.";
    //                 if (languageType === 1) msg = "تم تعطيل حسابك من قبل المسؤول.";
    //                 else if (languageType === 2) msg = "Votre compte a été désactivé par l’administrateur.";
    //                 return helper.failure(res, msg);
    //             }

    //             if (existingUser.block === "1") {
    //                 let msg = "Your account has been blocked by admin.";
    //                 if (languageType === 1) msg = "تم حظر حسابك من قبل المسؤول.";
    //                 else if (languageType === 2) msg = "Votre compte a été bloqué par l’administrateur.";
    //                 return helper.failure(res, msg);
    //             }

    //             if (existingUser.suspend === "1") {
    //                 let msg = "Your account has been suspended by admin.";
    //                 if (languageType === 1) msg = "تم تعليق حسابك من قبل المسؤول.";
    //                 else if (languageType === 2) msg = "Votre compte a été suspendu par l’administrateur.";
    //                 return helper.failure(res, msg);
    //             }

    //             // Example driver approval check
    //             if (existingUser.role === '2' && existingUser.otpVerify === "1") {
    //                 if (existingUser.isProfileComplete === "1" && existingUser.vehicle === "1") {
    //                     if (existingUser.approve !== "1") {
    //                         let msg = "Your driver account is not approved yet.";
    //                         if (languageType === 1) msg = "حساب السائق الخاص بك لم يتم الموافقة عليه بعد.";
    //                         else if (languageType === 2) msg = "Votre compte conducteur n’est pas encore approuvé.";
    //                         return helper.failure(res, msg);
    //                     }
    //                 }
    //             }

    //             user = existingUser;

    //             // 🔹 update user loginTime, device info, OTP
    //             const updateData = {
    //                 // online: '1',
    //                 otp,
    //                 rideOtp,
    //                 loginTime,
    //                 updatedAt: helper.unixTimestamp(),
    //             };
    //             if (deviceToken) {
    //                 updateData.deviceToken = deviceToken;
    //                 updateData.deviceType = deviceType || null;
    //             }

    //             await db.users.update(updateData, { where: { id: user.id } });

    //             user = await db.users.findOne({ where: { id: user.id, deletedAt: null } });

    //         } else {
    //             const userWithSamePhone = await db.users.findOne({
    //                 where: { phoneNumber, countryCode, deletedAt: null }
    //             });

    //             if (userWithSamePhone) {
    //                 let msg = "Phone number already registered with a different role";
    //                 if (languageType === 1) msg = "رقم الهاتف مسجل بالفعل بدور مختلف";
    //                 else if (languageType === 2) msg = "Le numéro de téléphone est déjà enregistré avec un rôle différent";
    //                 return helper.failure(res, msg);
    //             }

    //             user = await db.users.create({
    //                 countryCode,
    //                 phoneNumber,
    //                 role,
    //                 deviceToken: deviceToken || null,
    //                 deviceType: deviceType || null,
    //                 loginTime,
    //                 otp,
    //                 rideOtp,
    //                 languagee_type,
    //                 status: "1",
    //             });

    //             isNewUser = true;
    //         }
    //         const token = jwt.sign({ id: user.id, loginTime }, process.env.JWT_SECRET, { expiresIn: "7d" });

    //         const responseData = { ...user.toJSON(), token, otp };

    //         if (isNewUser) {
    //             let msg = "Account created successfully. OTP sent for verification.";
    //             if (languageType === 1) msg = "تم إنشاء الحساب بنجاح. تم إرسال OTP للتحقق.";
    //             else if (languageType === 2) msg = "Compte créé avec succès. OTP envoyé pour vérification.";
    //             return helper.success(res, msg, responseData);
    //         }

    //         let msg = "OTP sent successfully for verification";
    //         if (languageType === 1) msg = "تم إرسال OTP للتحقق بنجاح";
    //         else if (languageType === 2) msg = "OTP envoyé avec succès pour vérification";
    //         return helper.success(res, msg, responseData);

    //     } catch (error) {
    //         console.error("Login error:", error);
    //         let msg = "Something went wrong";
    //         return helper.failure(res, msg);
    //     }
    // },
    // login2: async (req, res) => {
    //     try {
    //         const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English

    //         // 🔹 validate input
    //         const v = new Validator(req.body, {
    //             countryCode: "required",
    //             phoneNumber: "required",
    //             role: "required",
    //         });

    //         const errorsResponse = await helper.checkValidation(v);
    //         if (errorsResponse) return helper.failure(res, errorsResponse);

    //         const { deviceToken, deviceType, phoneNumber, languagee_type, countryCode, role } = req.body;

    //         const existingUser = await db.users.findOne({
    //             where: { phoneNumber, countryCode, role, deletedAt: null },
    //         });

    //         let user;
    //         let isNewUser = false;
    //         const rideOtp = Math.floor(1000 + Math.random() * 9000).toString();
    //         // Create OTP service and send OTP
    //         const otpService = await client.verify.v2.services.create({ friendlyName: "carim", codeLength: 4 });
    //         const otpVerification = await client.verify.v2
    //             .services(otpService.sid)
    //             .verifications.create({
    //                 to: `${countryCode}${phoneNumber}`,
    //                 channel: 'sms'
    //             });

    //         const otp = otpVerification.serviceSid;

    //         const loginTime = helper.unixTimestamp();

    //         if (existingUser) {
    //             if (existingUser.status === "0") {
    //                 let msg = "Your account has been deactivated by admin.";
    //                 if (languageType === 1) msg = "تم تعطيل حسابك من قبل المسؤول.";
    //                 else if (languageType === 2) msg = "Votre compte a été désactivé par l’administrateur.";
    //                 return helper.failure(res, msg);
    //             }

    //             if (existingUser.block === "1") {
    //                 let msg = "Your account has been blocked by admin.";
    //                 if (languageType === 1) msg = "تم حظر حسابك من قبل المسؤول.";
    //                 else if (languageType === 2) msg = "Votre compte a été bloqué par l’administrateur.";
    //                 return helper.failure(res, msg);
    //             }

    //             if (existingUser.suspend === "1") {
    //                 let msg = "Your account has been suspended by admin.";
    //                 if (languageType === 1) msg = "تم تعليق حسابك من قبل المسؤول.";
    //                 else if (languageType === 2) msg = "Votre compte a été suspendu par l’administrateur.";
    //                 return helper.failure(res, msg);
    //             }

    //             // Example driver approval check
    //             if (existingUser.role === '2' && existingUser.otpVerify === "1") {
    //                 if (existingUser.isProfileComplete === "1" && existingUser.vehicle === "1") {
    //                     if (existingUser.approve !== "1") {
    //                         let msg = "Your driver account is not approved yet.";
    //                         if (languageType === 1) msg = "حساب السائق الخاص بك لم يتم الموافقة عليه بعد.";
    //                         else if (languageType === 2) msg = "Votre compte conducteur n’est pas encore approuvé.";
    //                         return helper.failure(res, msg);
    //                     }
    //                 }
    //             }

    //             user = existingUser;

    //             // 🔹 update user loginTime, device info, OTP
    //             const updateData = {
    //                 // online: '1',
    //                 otp,
    //                 rideOtp,
    //                 loginTime,
    //                 updatedAt: helper.unixTimestamp(),
    //             };
    //             if (deviceToken) {
    //                 updateData.deviceToken = deviceToken;
    //                 updateData.deviceType = deviceType || null;
    //             }

    //             await db.users.update(updateData, { where: { id: user.id } });

    //             user = await db.users.findOne({ where: { id: user.id, deletedAt: null } });

    //         } else {
    //             const userWithSamePhone = await db.users.findOne({
    //                 where: { phoneNumber, countryCode, deletedAt: null }
    //             });

    //             if (userWithSamePhone) {
    //                 let msg = "Phone number already registered with a different role";
    //                 if (languageType === 1) msg = "رقم الهاتف مسجل بالفعل بدور مختلف";
    //                 else if (languageType === 2) msg = "Le numéro de téléphone est déjà enregistré avec un rôle différent";
    //                 return helper.failure(res, msg);
    //             }

    //             user = await db.users.create({
    //                 countryCode,
    //                 phoneNumber,
    //                 role,
    //                 deviceToken: deviceToken || null,
    //                 deviceType: deviceType || null,
    //                 loginTime,
    //                 otp,
    //                 rideOtp,
    //                 languagee_type,
    //                 status: "1"
    //             });

    //             isNewUser = true;
    //         }
    //         const token = jwt.sign({ id: user.id, loginTime }, process.env.JWT_SECRET, { expiresIn: "7d" });

    //         const responseData = { ...user.toJSON(), token, otp };

    //         if (isNewUser) {
    //             let msg = "Account created successfully. OTP sent for verification.";
    //             if (languageType === 1) msg = "تم إنشاء الحساب بنجاح. تم إرسال OTP للتحقق.";
    //             else if (languageType === 2) msg = "Compte créé avec succès. OTP envoyé pour vérification.";
    //             return helper.success(res, msg, responseData);
    //         }

    //         let msg = "OTP sent successfully for verification";
    //         if (languageType === 1) msg = "تم إرسال OTP للتحقق بنجاح";
    //         else if (languageType === 2) msg = "OTP envoyé avec succès pour vérification";
    //         return helper.success(res, msg, responseData);

    //     } catch (error) {
    //         console.error("Login error:", error);
    //         let msg = "Something went wrong";
    //         return helper.failure(res, msg);
    //     }
    // },
    login3: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English

            const v = new Validator(req.body, {
                countryCode: "required",
                phoneNumber: "required",
                role: "required",
            });

            const errorsResponse = await helper.checkValidation(v);
            if (errorsResponse) return helper.failure(res, errorsResponse);

            const { deviceToken, deviceType, phoneNumber, languagee_type, countryCode, role } = req.body;

            const userWithSamePhone = await db.users.findOne({
                where: { phoneNumber, countryCode, deletedAt: null, role: { [Op.ne]: role } }
            });

            if (userWithSamePhone) {
                let msg = "Phone number already registered with a different role";
                if (languageType === 1) msg = "رقم الهاتف مسجل بالفعل بدور مختلف";
                else if (languageType === 2) msg = "Le numéro de téléphone est déjà enregistré avec un rôle différent";
                return helper.failure(res, msg);
            }

            const existingUser = await db.users.findOne({
                where: { phoneNumber, countryCode, role, deletedAt: null },
            });

            let user;
            let isNewUser = false;
            const rideOtp = Math.floor(1000 + Math.random() * 9000).toString();

            let otp = null;
            let otpVerification = null;

            const loginTime = helper.unixTimestamp();
            if (existingUser) {
                if (existingUser.status === "0") {
                    let msg = "Your account has been deactivated by admin.";
                    if (languageType === 1) msg = "تم تعطيل حسابك من قبل المسؤول.";
                    else if (languageType === 2) msg = "Votre compte a été désactivé par l’administrateur.";
                    return helper.failure(res, msg);
                }

                if (existingUser.block === "1") {
                    let msg = "Your account has been blocked by admin.";
                    if (languageType === 1) msg = "تم حظر حسابك من قبل المسؤول.";
                    else if (languageType === 2) msg = "Votre compte a été bloqué par l’administrateur.";
                    return helper.failure(res, msg);
                }

                if (existingUser.suspend === "1") {
                    let msg = "Your account has been suspended by admin.";
                    if (languageType === 1) msg = "تم تعليق حسابك من قبل المسؤول.";
                    else if (languageType === 2) msg = "Votre compte a été suspendu par l’administrateur.";
                    return helper.failure(res, msg);
                }
                if (existingUser.role === '2' && existingUser.otpVerify === "1") {
                    if (existingUser.isProfileComplete === "1" && existingUser.vehicle === "1") {
                        if (existingUser.approve !== "1") {
                            let msg = "Your driver account is not approved yet.";
                            if (languageType === 1) msg = "حساب السائق الخاص بك لم يتم الموافقة عليه بعد.";
                            else if (languageType === 2) msg = "Votre compte conducteur n’est pas encore approuvé.";
                            return helper.failure(res, msg);
                        }
                    }
                }

                user = existingUser;
                const updateData = {
                    rideOtp,
                    loginTime,
                    updatedAt: helper.unixTimestamp(),
                };
                if (deviceToken) {
                    updateData.deviceToken = deviceToken;
                    updateData.deviceType = deviceType || null;
                }

                await db.users.update(updateData, { where: { id: user.id } });

                user = await db.users.findOne({ where: { id: user.id, deletedAt: null } });

            } else {
                user = await db.users.create({
                    countryCode,
                    phoneNumber,
                    role,
                    deviceToken: deviceToken || null,
                    deviceType: deviceType || null,
                    loginTime,
                    rideOtp,
                    languagee_type,
                    status: "1"
                });

                isNewUser = true;
            }
            try {
                const otpService = await client.verify.v2.services.create({ friendlyName: "carim", codeLength: 4 });
                otpVerification = await client.verify.v2
                    .services(otpService.sid)
                    .verifications.create({
                        to: `${countryCode}${phoneNumber}`,
                        channel: 'sms'
                    });

                otp = otpVerification.serviceSid;
                await db.users.update({ otp }, { where: { id: user.id } });
            } catch (otpError) {
                console.error("OTP sending error:", otpError);
                let msg = "Failed to send OTP. Please try again.";
                if (languageType === 1) msg = "فشل إرسال OTP. يرجى المحاولة مرة أخرى.";
                else if (languageType === 2) msg = "Échec de l'envoi de l'OTP. Veuillez réessayer.";
                return helper.failure(res, msg);
            }
            const token = jwt.sign({ id: user.id, loginTime }, process.env.JWT_SECRET, { expiresIn: "7d" });
            const responseData = { ...user.toJSON(), token, otp };

            if (isNewUser) {
                let msg = "Account created successfully. OTP sent for verification.";
                if (languageType === 1) msg = "تم إنشاء الحساب بنجاح. تم إرسال OTP للتحقق.";
                else if (languageType === 2) msg = "Compte créé avec succès. OTP envoyé pour vérification.";
                return helper.success(res, msg, responseData);
            }
            let msg = "OTP sent successfully for verification";
            if (languageType === 1) msg = "تم إرسال OTP للتحقق بنجاح";
            else if (languageType === 2) msg = "OTP envoyé avec succès pour vérification";
            return helper.success(res, msg, responseData);

        } catch (error) {
            console.error("Login error:", error);
            let msg = "Something went wrong";
            return helper.failure(res, msg);
        }
    },
    login: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English

            const v = new Validator(req.body, {
                countryCode: "required",
                phoneNumber: "required",
                role: "required",
            });

            const errorsResponse = await helper.checkValidation(v);
            if (errorsResponse) return helper.failure(res, errorsResponse);

            const { deviceToken, deviceType, phoneNumber, languagee_type, countryCode, role } = req.body;

            const userWithSamePhone = await db.users.findOne({
                where: { phoneNumber, countryCode, deletedAt: null, role: { [Op.ne]: role } }
            });

            if (userWithSamePhone) {
                let msg = "Phone number already registered with a different role";
                if (languageType === 1) msg = "رقم الهاتف مسجل بالفعل بدور مختلف";
                else if (languageType === 2) msg = "Le numéro de téléphone est déjà enregistré avec un rôle différent";
                return helper.failure(res, msg);
            }

            const existingUser = await db.users.findOne({
                where: { phoneNumber, countryCode, role, deletedAt: null },
            });

            let user;
            let isNewUser = false;
            const rideOtp = Math.floor(1000 + Math.random() * 9000).toString();

            let otp = null;
            let otpVerification = null;

            const loginTime = helper.unixTimestamp();

            if (existingUser) {
                if (existingUser.status === "0") {
                    let msg = "Your account has been deactivated by admin.";
                    if (languageType === 1) msg = "تم تعطيل حسابك من قبل المسؤول.";
                    else if (languageType === 2) msg = "Votre compte a été désactivé par l’administrateur.";
                    return helper.failure(res, msg);
                }

                if (existingUser.block === "1") {
                    let msg = "Your account has been blocked by admin.";
                    if (languageType === 1) msg = "تم حظر حسابك من قبل المسؤول.";
                    else if (languageType === 2) msg = "Votre compte a été bloqué par l’administrateur.";
                    return helper.failure(res, msg);
                }

                if (existingUser.suspend === "1") {
                    let msg = "Your account has been suspended by admin.";
                    if (languageType === 1) msg = "تم تعليق حسابك من قبل المسؤول.";
                    else if (languageType === 2) msg = "Votre compte a été suspendu par l’administrateur.";
                    return helper.failure(res, msg);
                }

                if (existingUser.role === '2' && existingUser.otpVerify === "1") {
                    if (existingUser.isProfileComplete === "1" && existingUser.vehicle === "1") {
                        if (existingUser.approve !== "1") {
                            let msg = "Your driver account is not approved yet.";
                            if (languageType === 1) msg = "حساب السائق الخاص بك لم يتم الموافقة عليه بعد.";
                            else if (languageType === 2) msg = "Votre compte conducteur n’est pas encore approuvé.";
                            return helper.failure(res, msg);
                        }
                    }
                }

                user = existingUser;
                const updateData = {
                    rideOtp,
                    loginTime,
                    updatedAt: helper.unixTimestamp(),
                };
                if (deviceToken) {
                    updateData.deviceToken = deviceToken;
                    updateData.deviceType = deviceType || null;
                }

                await db.users.update(updateData, { where: { id: user.id } });
                user = await db.users.findOne({ where: { id: user.id, deletedAt: null } });

            } else {
                user = await db.users.create({
                    countryCode,
                    phoneNumber,
                    role,
                    deviceToken: deviceToken || null,
                    deviceType: deviceType || null,
                    loginTime,
                    rideOtp,
                    languagee_type,
                    status: "1"
                });
                isNewUser = true;
            }

            // STATIC OTP LOGIC FOR SPECIFIC NUMBERS
            // Check if phone number is 896696666 OR 123456123
            if (phoneNumber === "896696666" || phoneNumber === "123456123") {
                // Set static OTP to 1111
                otp = "1111";

                // Store static OTP in database
                await db.users.update({ otp }, { where: { id: user.id } });

                console.log(`Static OTP 1111 set for phone number: ${phoneNumber}`);
            } else {
                // Normal OTP flow via Twilio for other numbers
                try {
                    const otpService = await client.verify.v2.services.create({ friendlyName: "carim", codeLength: 4 });
                    otpVerification = await client.verify.v2
                        .services(otpService.sid)
                        .verifications.create({
                            to: `${countryCode}${phoneNumber}`,
                            channel: 'sms'
                        });

                    otp = otpVerification.serviceSid;
                    await db.users.update({ otp }, { where: { id: user.id } });
                } catch (otpError) {
                    console.error("OTP sending error:", otpError);
                    let msg = "Failed to send OTP. Please try again.";
                    if (languageType === 1) msg = "فشل إرسال OTP. يرجى المحاولة مرة أخرى.";
                    else if (languageType === 2) msg = "Échec de l'envoi de l'OTP. Veuillez réessayer.";
                    return helper.failure(res, msg);
                }
            }

            const token = jwt.sign({ id: user.id, loginTime }, process.env.JWT_SECRET, { expiresIn: "7d" });
            const responseData = { ...user.toJSON(), token, otp };

            if (isNewUser) {
                let msg = "Account created successfully. OTP sent for verification.";
                if (languageType === 1) msg = "تم إنشاء الحساب بنجاح. تم إرسال OTP للتحقق.";
                else if (languageType === 2) msg = "Compte créé avec succès. OTP envoyé pour vérification.";
                return helper.success(res, msg, responseData);
            }

            let msg = "OTP sent successfully for verification";
            if (languageType === 1) msg = "تم إرسال OTP للتحقق بنجاح";
            else if (languageType === 2) msg = "OTP envoyé avec succès pour vérification";
            return helper.success(res, msg, responseData);

        } catch (error) {
            console.error("Login error:", error);
            let msg = "Something went wrong";
            if (languageType === 1) msg = "حدث خطأ ما";
            else if (languageType === 2) msg = "Quelque chose s'est mal passé";
            return helper.failure(res, msg);
        }
    },

    // verifyOtp: async (req, res) => {
    //     try {
    //         const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French

    //         const v = new Validator(req.body, {
    //             otp: 'required',
    //             countryCode: 'required',
    //             phoneNumber: 'required',
    //         });

    //         let errorsResponse = await helper.checkValidation(v);
    //         if (errorsResponse) {
    //             return helper.failure(res, errorsResponse);
    //         }

    //         let user = await db.users.findOne({
    //             where: {
    //                 phoneNumber: req.body.phoneNumber,
    //                 countryCode: req.body.countryCode,
    //                 deletedAt: null
    //             },
    //         });

    //         if (!user) {
    //             let msg = languageType == 1 ? 'المستخدم غير موجود.' :
    //                 languageType == 2 ? 'Utilisateur non trouvé.' :
    //                     'User not found.';
    //             return helper.failure(res, msg);
    //         }

    //         if (user.status === "0") {
    //             let msg = languageType == 1 ? "حسابك معطل من قبل المسؤول. يرجى الاتصال بالمسؤول للمساعدة." :
    //                 languageType == 2 ? "Votre compte est inactif par l’administrateur. Veuillez contacter l’administrateur pour obtenir de l’aide." :
    //                     "Your account is inactive by Admin. Please contact the admin.";
    //             return helper.failure(res, msg);
    //         }

    //         if (req.body.otp == user.otp) {
    //             // const loginTime = helper.unixTimestamp();

    //             const token = jwt.sign(
    //                 {
    //                     id: user.id
    //                 },
    //                 process.env.JWT_SECRET
    //             );

    //             await db.users.update(
    //                 {
    //                     otpVerify: "1",
    //                     otp: 0,
    //                 },
    //                 { where: { id: user.id } }
    //             );

    //             const updated = await db.users.findOne({
    //                 where: {
    //                     phoneNumber: req.body.phoneNumber,
    //                     countryCode: req.body.countryCode
    //                 }
    //             });

    //             let msg = languageType == 1 ? 'تم التحقق من OTP بنجاح.' :
    //                 languageType == 2 ? 'OTP vérifié avec succès.' :
    //                     'OTP verified successfully.';

    //             return helper.success(res, msg, {
    //                 ...updated.toJSON(),
    //                 token: token
    //             });
    //         }
    //         return helper.success(res, "", {
    //         });

    //     } catch (error) {
    //         console.error('verifyOtp error:', error);

    //         let msg = languageType == 1 ? 'حدث خطأ ما' :
    //             languageType == 2 ? 'Une erreur est survenue' :
    //                 'Something went wrong';

    //         return helper.failure(res, msg);
    //     }
    // },

   verifyOtp: async (req, res) => {
    try {
        const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French

        const v = new Validator(req.body, {
            otp: 'required',
            countryCode: 'required',
            phoneNumber: 'required',
        });

        let errorsResponse = await helper.checkValidation(v);
        if (errorsResponse) {
            return helper.failure(res, errorsResponse);
        }

        const { otp, phoneNumber, countryCode } = req.body;

        let user = await db.users.findOne({
            where: {
                phoneNumber,
                countryCode,
                deletedAt: null
            },
        });

        if (!user) {
            let msg = languageType == 1 ? 'المستخدم غير موجود.' :
                languageType == 2 ? 'Utilisateur non trouvé.' :
                    'User not found.';
            return helper.failure(res, msg);
        }

        if (user.status === "0") {
            let msg = languageType == 1 ? "حسابك معطل من قبل المسؤول. يرجى الاتصال بالمسؤول للمساعدة." :
                languageType == 2 ? "Votre compte est inactif par l’administrateur. Veuillez contacter l’administrateur pour obtenir de l’aide." :
                    "Your account is inactive by Admin. Please contact the admin.";
            return helper.failure(res, msg);
        }

        // 🔹 Twilio Verify check (correct service SID)
        if (phoneNumber == "123456123") {
            if (otp == 1111) {
                await db.users.update(
                    {
                        otpVerify: "1",
                        otp: 0,
                    },
                    { where: { id: user.id } }
                );

                const updated = await db.users.findOne({
                    where: { phoneNumber, countryCode }
                });
                
                const token = jwt.sign(
                    { id: user.id },
                    process.env.JWT_SECRET
                );

                let msg = languageType == 1 ? 'تم التحقق من OTP بنجاح.' :
                    languageType == 2 ? 'OTP vérifié avec succès.' :
                        'OTP verified successfully.';

                return helper.success(res, msg, {
                    ...updated.toJSON(),
                    token: token
                });
            }
        }

        const checkOtp = await client.verify.v2.services(user.otp)
            .verificationChecks
            .create({
                to: countryCode + phoneNumber,
                code: otp,
            });

        if (checkOtp.status === "approved") {
            await db.users.update(
                {
                    otpVerify: "1",
                    otp: 0,
                },
                { where: { id: user.id } }
            );

            const updated = await db.users.findOne({
                where: { phoneNumber, countryCode }
            });
            
            // Move token definition here
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET
            );

            let msg = languageType == 1 ? 'تم التحقق من OTP بنجاح.' :
                languageType == 2 ? 'OTP vérifié avec succès.' :
                    'OTP verified successfully.';

            return helper.success(res, msg, {
                ...updated.toJSON(),
                token: token
            });
        }

        // 🔹 OTP not approved
        return helper.error(res, "otp doesn't match", {});

    } catch (error) {
        console.error('verifyOtp error:', error);

        let msg = 'Something went wrong';

        return helper.failure(res, msg);
    }
},




    resendOTP: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                phoneNumber: "required|string",
                countryCode: "required|string",
            });

            const errorResponse = await helper.checkValidation(v);
            if (errorResponse) {
                return helper.error(res, errorResponse);
            }
            const { phoneNumber, countryCode } = req.body;
            const userData = await db.users.findOne({ where: { phoneNumber, countryCode } });

            if (!userData) {
                return helper.error(res, "Phone number not found");
            }
            const sendOtp = await client.verify.v2.services.create({ friendlyName: "Carim", codeLength: 4 })
            const verification = await client.verify.v2.
                services(sendOtp.sid)
                .verifications.create({
                    to: countryCode + " " + phoneNumber,
                    channel: 'sms'
                });
            await db.users.update(
                { otp: verification.serviceSid, is_verify: 0 },
                { where: { phoneNumber: phoneNumber } }
            );
            return helper.success(res, "Otp sent successfully", userData)
        } catch (error) {
            console.log(error, "==here is error");
        }
    },
    // resendOTP1: async (req, res) => {
    //     try {
    //         const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English

    //         const v = new Validator(req.body, {
    //             countryCode: "required",
    //             phoneNumber: "required",
    //         });

    //         const errorsResponse = await helper.checkValidation(v);
    //         if (errorsResponse) {
    //             return helper.failure(res, errorsResponse);
    //         }

    //         const { countryCode, phoneNumber } = req.body;

    //         const user = await db.users.findOne({
    //             where: { phoneNumber, countryCode, deletedAt: null },
    //             raw: true
    //         });

    //         if (!user) {
    //             let msg = "User not found";
    //             if (languageType == 1) msg = "المستخدم غير موجود";
    //             else if (languageType == 2) msg = "Utilisateur non trouvé";
    //             return helper.failure(res, msg);
    //         }

    //         const otp = '1111';
    //         //    const otp =  Math.floor(1000 + Math.random() * 9000).toString();

    //         await db.users.update(
    //             {
    //                 otp: otp,
    //                 otpVerify: "0",
    //             },
    //             { where: { id: user.id } }
    //         );

    //         let msg = "OTP Re-sent Successfully";
    //         if (languageType == 1) msg = "تم إعادة إرسال OTP بنجاح";
    //         else if (languageType == 2) msg = "OTP renvoyé avec succès";

    //         return helper.success(res, msg);

    //     } catch (error) {
    //         console.error('resendOTP error:', error);
    //         let msg = "OTP Not Sent!";
    //         if (languageType == 1) msg = "لم يتم إرسال OTP!";
    //         else if (languageType == 2) msg = "OTP non envoyé !";
    //         return helper.failure(res, msg);
    //     }
    // },


    createAccount: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English

            let profile = await db.users.findOne({
                where: { id: req.user.id },
            });

            const rideOtp = Math.floor(1000 + Math.random() * 9000).toString();
            const updatedProfileData = { ...req.body, rideOtp };

            await db.users.update(updatedProfileData, {
                where: { id: req.user.id },
            });

            profile = await db.users.findOne({
                where: { id: req.user.id },
                raw: true,
            });

            let msg = "Profile added successfully.";
            if (languageType == 1) msg = "تم إضافة الملف الشخصي بنجاح.";
            else if (languageType == 2) msg = "Profil ajouté avec succès.";

            return helper.success(res, msg, profile);

        } catch (error) {
            console.error('createAccount error:', error);

            let msg = "An error occurred while adding the profile.";
            if (languageType == 1) msg = "حدث خطأ أثناء إضافة الملف الشخصي.";
            else if (languageType == 2) msg = "Une erreur s'est produite lors de l'ajout du profil.";

            return helper.failure(res, msg);
        }
    },


    getProfile: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English
            const userId = req.user.id;

            const get_user_details = await db.users.findOne({
                where: { id: userId },
                raw: true,
            });

            if (!get_user_details) {
                let msg = "User not found.";
                if (languageType == 1) msg = "المستخدم غير موجود.";
                else if (languageType == 2) msg = "Utilisateur non trouvé.";
                return helper.failure(res, msg);
            }

            let msg = "Get user Profile Successfully.";
            if (languageType == 1) msg = "تم جلب ملف المستخدم بنجاح.";
            else if (languageType == 2) msg = "Profil utilisateur récupéré avec succès.";

            return helper.success(res, msg, get_user_details);

        } catch (error) {
            console.error('getProfile error:', error);

            let msg = "Something went wrong.";
            if (languageType == 1) msg = "حدث خطأ ما.";
            else if (languageType == 2) msg = "Une erreur est survenue.";
            return helper.failure(res, msg);
        }
    },

    editProfile: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English

            let profile = await db.users.findOne({
                where: { id: req.user.id },
            });

            const updatedProfileData = { ...req.body };

            await db.users.update(updatedProfileData, {
                where: { id: req.user.id },
            });

            profile = await db.users.findOne({
                where: { id: req.user.id },
                raw: true,
            });

            let msg = "Profile updated successfully.";
            if (languageType == 1) msg = "تم تحديث الملف الشخصي بنجاح.";
            else if (languageType == 2) msg = "Profil mis à jour avec succès.";

            return helper.success(res, msg, profile);

        } catch (error) {
            console.error('editProfile error:', error);

            let msg = "An error occurred while updating the profile.";
            if (languageType == 1) msg = "حدث خطأ أثناء تحديث الملف الشخصي.";
            else if (languageType == 2) msg = "Une erreur s'est produite lors de la mise à jour du profil.";

            return helper.failure(res, msg);
        }
    },


    deleteAccount: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English
            const deletedAt = new Date();

            await db.users.update(
                { deletedAt },
                { where: { id: req.user.id } }
            );

            let msg = "Account deleted successfully.";
            if (languageType == 1) msg = "تم حذف الحساب بنجاح.";
            else if (languageType == 2) msg = "Compte supprimé avec succès.";

            return helper.success(res, msg, {});

        } catch (error) {
            console.error('deleteAccount error:', error);

            let msg = "Error during account deletion.";
            if (languageType == 1) msg = "حدث خطأ أثناء حذف الحساب.";
            else if (languageType == 2) msg = "Erreur lors de la suppression du compte.";

            return helper.failure(res, msg, {});
        }
    },

    logout: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English
            const loginTime = helper.unixTimestamp();

            await db.users.update(
                { deviceToken: "", loginTime: 0 },
                { where: { id: req.user.id } }
            );

            let msg = "Logout Successfully";
            if (languageType == 1) msg = "تم تسجيل الخروج بنجاح";
            else if (languageType == 2) msg = "Déconnexion réussie";

            return helper.success(res, msg, {});

        } catch (error) {
            console.error('logout error:', error);

            let msg = "Error during account logout.";
            if (languageType == 1) msg = "حدث خطأ أثناء تسجيل الخروج من الحساب.";
            else if (languageType == 2) msg = "Erreur lors de la déconnexion du compte.";

            return helper.failure(res, msg, {});
        }
    },

    getCmsContent: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English
            const { type } = req.query;

            if (![1, 2, 3].includes(Number(type))) {
                let msg = "Invalid type. Use 1 for Privacy Policy, 3 for Terms and Conditions, 2 for About us.";
                if (languageType == 1) msg = "نوع غير صالح. استخدم 1 لسياسة الخصوصية، 3 للشروط والأحكام، 2 من نحن.";
                else if (languageType == 2) msg = "Type invalide. Utilisez 1 pour la politique de confidentialité, 3 pour les termes et conditions, 2 pour À propos de nous.";
                return helper.failure(res, msg);
            }

            const cmsContent = await db.cms.findOne({
                where: { type: Number(type) },
            });

            if (!cmsContent) {
                let msg = "Content not found.";
                if (languageType == 1) msg = "المحتوى غير موجود.";
                else if (languageType == 2) msg = "Contenu non trouvé.";
                return helper.failure(res, msg);
            }

            let message = "";
            let translatedTitle = "";

            switch (Number(type)) {
                case 1: // Privacy Policy
                    message = "Privacy policy guidelines retrieved successfully.";
                    translatedTitle = "Privacy Policy";
                    if (languageType == 1) {
                        message = "تم جلب إرشادات سياسة الخصوصية بنجاح.";
                        translatedTitle = "سياسة الخصوصية";
                    } else if (languageType == 2) {
                        message = "Directives de la politique de confidentialité récupérées avec succès.";
                        translatedTitle = "Politique de confidentialité";
                    }
                    break;

                case 2: // About Us
                    message = "About us content retrieved successfully.";
                    translatedTitle = "About Us";
                    if (languageType == 1) {
                        message = "تم جلب محتوى من نحن بنجاح.";
                        translatedTitle = "من نحن";
                    } else if (languageType == 2) {
                        message = "Contenu À propos de nous récupéré avec succès.";
                        translatedTitle = "À propos de nous";
                    }
                    break;

                case 3: // Terms & Conditions
                    message = "Terms and conditions retrieved successfully.";
                    translatedTitle = "Terms & Conditions";
                    if (languageType == 1) {
                        message = "تم جلب الشروط والأحكام بنجاح.";
                        translatedTitle = "الشروط والأحكام";
                    } else if (languageType == 2) {
                        message = "Termes et conditions récupérés avec succès.";
                        translatedTitle = "Termes et conditions";
                    }
                    break;
            }

            return helper.success(res, message, {
                ...cmsContent.dataValues,
                title: translatedTitle
            });

        } catch (error) {
            console.error('getCmsContent error:', error);

            let msg = "Something went wrong.";
            if (languageType == 1) msg = "حدث خطأ ما.";
            else if (languageType == 2) msg = "Une erreur est survenue.";
            return helper.failure(res, msg);
        }
    },

    notificationOnOff: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English
            const isNotificationOn = parseInt(req.body.isNotificationOn, 10);

            if (![0, 1].includes(isNotificationOn)) {
                let msg = "Invalid value. Use 1 or 0 as integer.";
                if (languageType == 1) msg = "قيمة غير صالحة. استخدم 1 أو 0 كعدد صحيح.";
                else if (languageType == 2) msg = "Valeur invalide. Utilisez 1 ou 0 comme entier.";
                return helper.failure(res, msg);
            }

            let user = await db.users.findOne({
                where: { id: req.user.id },
                raw: true,
            });

            if (!user) {
                let msg = "User not found.";
                if (languageType == 1) msg = "المستخدم غير موجود.";
                else if (languageType == 2) msg = "Utilisateur non trouvé.";
                return helper.failure(res, msg);
            }

            let msg = isNotificationOn === 1 ? "Notifications ON." : "Notifications OFF.";
            if (languageType == 1) msg = isNotificationOn === 1 ? "تم تفعيل الإشعارات." : "تم إيقاف الإشعارات.";
            else if (languageType == 2) msg = isNotificationOn === 1 ? "Notifications activées." : "Notifications désactivées.";

            await db.users.update(
                { isNotificationOn: isNotificationOn.toString() },
                { where: { id: req.user.id } }
            );

            return helper.success(res, msg, { isNotificationOn });

        } catch (error) {
            console.error('notificationOnOff error:', error);
            let msg = "Something went wrong.";
            if (languageType == 1) msg = "حدث خطأ ما.";
            else if (languageType == 2) msg = "Une erreur est survenue.";
            return helper.failure(res, msg, {});
        }
    },

    createContactUs: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English

            const v = new Validator(req.body, {
                name: "required",
                email: "required|email",
                message: "required",
                phoneNumber: "required",
                countryCode: "required",
            });

            const errorsResponse = await helper.checkValidation(v);
            if (errorsResponse) {
                return helper.failure(res, errorsResponse);
            }

            const supportData = {
                name: req.body.name,
                email: req.body.email,
                message: req.body.message,
                phoneNumber: req.body.phoneNumber,
                countryCode: req.body.countryCode,
                location: req.body.location || null,
            };

            const create_contact = await db.contactus.create(supportData);

            let msg = "Information submitted successfully.";
            if (languageType == 1) msg = "تم إرسال المعلومات بنجاح.";
            else if (languageType == 2) msg = "Informations soumises avec succès.";

            return helper.success(res, msg, create_contact);

        } catch (error) {
            console.error('createContactUs error:', error);
            let msg = "Something went wrong. Please try again.";
            if (languageType == 1) msg = "حدث خطأ ما. يرجى المحاولة مرة أخرى.";
            else if (languageType == 2) msg = "Une erreur s'est produite. Veuillez réessayer.";

            return helper.failure(res, msg);
        }
    },

    vehicleAdd: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English

            const v = new Validator(req.body, {
                vehicleBrand: "required",
                vehicleModel: "required",
                vehicleNumber: "required",
                vehicleDocument: "required",
                drivingLicence: "required"
            });

            const errorsResponse = await helper.checkValidation(v);
            if (errorsResponse) {
                return helper.failure(res, errorsResponse);
            }

            const {
                vehicleBrand,
                vehicleModel,
                vehicleYear,
                vehicleNumber,
                vehicleColor,
                vehicleDocument,
                drivingLicence,
                insurance,
                passengerCount
            } = req.body;

            const driverId = req.user.id;

            const driver = await db.users.findOne({
                where: { id: driverId, role: "2" }
            });

            if (!driver) {
                let msg = 'User not found or not authorized as driver';
                if (languageType == 1) msg = "المستخدم غير موجود أو غير مخول كسائق";
                else if (languageType == 2) msg = "Utilisateur introuvable ou non autorisé en tant que conducteur";
                return helper.failure(res, msg);
            }

            const existingVehicle = await db.vehicleDetails.findOne({ where: { driverId } });
            if (existingVehicle) {
                let msg = 'Vehicle already registered for this driver';
                if (languageType == 1) msg = "تم تسجيل مركبة لهذا السائق بالفعل";
                else if (languageType == 2) msg = "Véhicule déjà enregistré pour ce conducteur";
                return helper.failure(res, msg);
            }

            const existingVehicleNumber = await db.vehicleDetails.findOne({ where: { vehicleNumber } });
            if (existingVehicleNumber) {
                let msg = 'Vehicle number already registered';
                if (languageType == 1) msg = "رقم المركبة مسجل بالفعل";
                else if (languageType == 2) msg = "Numéro de véhicule déjà enregistré";
                return helper.failure(res, msg);
            }

            const transaction = await db.sequelize.transaction();

            try {
                const vehicle = await db.vehicleDetails.create({
                    driverId,
                    vehicleBrand,
                    vehicleModel,
                    vehicleYear,
                    vehicleNumber,
                    vehicleColor,
                    vehicleDocument,
                    drivingLicence,
                    insurance,
                    passengerCount
                }, { transaction });

                await db.users.update(
                    { vehicle: "1", isProfileComplete: '1' },
                    { where: { id: driverId }, transaction }
                );

                await transaction.commit();

                const updatedUser = await db.users.findOne({ where: { id: driverId } });

                const responseData = {
                    id: vehicle.id,
                    vehicleBrand: vehicle.vehicleBrand,
                    vehicleModel: vehicle.vehicleModel,
                    vehicleYear: vehicle.vehicleYear,
                    vehicleNumber: vehicle.vehicleNumber,
                    vehicleColor: vehicle.vehicleColor,
                    vehicleDocument: vehicle.vehicleDocument,
                    drivingLicence: vehicle.drivingLicence,
                    insurance: vehicle.insurance,
                    passengerCount: vehicle.passengerCount,
                    userVehicleStatus: updatedUser.vehicle
                };

                let msg = 'Vehicle added successfully';
                if (languageType == 1) msg = "تمت إضافة المركبة بنجاح";
                else if (languageType == 2) msg = "Véhicule ajouté avec succès";

                return helper.success(res, msg, responseData);

            } catch (error) {
                await transaction.rollback();
                throw error;
            }

        } catch (error) {
            console.error('vehicleAdd error:', error);

            let msg = `Something went wrong while adding vehicle: ${error.message}`;
            if (languageType == 1) msg = `حدث خطأ أثناء إضافة المركبة: ${error.message}`;
            else if (languageType == 2) msg = `Une erreur s'est produite lors de l'ajout du véhicule : ${error.message}`;

            return helper.failure(res, msg);
        }
    },


    fileUploadDriver: async (req, res) => {
        try {
            if (!req.files || !req.files.file) {
                return helper.failure(res, "No file uploaded");
            }

            let files = [];
            const uploadedFiles = Array.isArray(req.files.file) ? req.files.file : [req.files.file];

            for (const file of uploadedFiles) {
                try {
                    const uploadedPath = await helper.fileUpload(file);
                    files.push(uploadedPath);
                } catch (err) {
                    return helper.failure(res, `Error uploading file: ${err.message}`);
                }
            }

            return helper.success(res, "Files uploaded successfully", {
                files: files
            });
        } catch (error) {
            return helper.failure(res, "Error occurred during file upload");
        }
    },
    home: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English
            const userId = req.user.id;

            const userStatus = await db.users.findOne({
                where: { id: userId },
                attributes: ['status', 'block', 'suspend'],
                raw: true
            });

            if (!userStatus) {
                let msg = "User not found.";
                if (languageType == 1) msg = "المستخدم غير موجود.";
                else if (languageType == 2) msg = "Utilisateur non trouvé.";
                return helper.failure(res, msg);
            }

            if (userStatus.status === "0") {
                let msg = "Your account has been deactivated by admin.";
                if (languageType == 1) msg = "تم تعطيل حسابك من قبل المسؤول.";
                else if (languageType == 2) msg = "Votre compte a été désactivé par l’administrateur.";
                return helper.error2(res, msg);
            }

            if (userStatus.block === "1") {
                let msg = "Your account has been blocked by admin.";
                if (languageType == 1) msg = "تم حظر حسابك من قبل المسؤول.";
                else if (languageType == 2) msg = "Votre compte a été bloqué par l’administrateur.";
                return helper.error1(res, msg);
            }

            if (userStatus.suspend === "1") {
                let msg = "Your account has been suspended by admin.";
                if (languageType == 1) msg = "تم تعليق حسابك من قبل المسؤول.";
                else if (languageType == 2) msg = "Votre compte a été suspendu par l’administrateur.";
                return helper.error3(res, msg);
            }

            const responseData = await db.banners.findAll();

            let msg = 'All banner detail.';
            if (languageType == 1) msg = "جميع تفاصيل البانر.";
            else if (languageType == 2) msg = "Tous les détails des bannières.";

            return helper.success(res, msg, responseData);

        } catch (error) {
            console.error('home error:', error);
            let msg = "Something went wrong.";
            if (languageType == 1) msg = "حدث خطأ ما.";
            else if (languageType == 2) msg = "Une erreur est survenue.";
            return helper.failure(res, msg);
        }
    },

    vehicleEdit: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English

            const v = new Validator(req.body, {});

            const errorsResponse = await helper.checkValidation(v);
            if (errorsResponse) {
                return helper.failure(res, errorsResponse);
            }

            const {
                vehicleBrand,
                vehicleId,
                vehicleModel,
                vehicleYear,
                vehicleNumber,
                vehicleColor,
                vehicleDocument,
                insurance,
                drivingLicence,
                passengerCount
            } = req.body;

            const driverId = req.user.id;

            const driver = await db.users.findOne({
                where: { id: driverId, role: "2", deletedAt: null }
            });

            if (!driver) {
                let msg = 'User not found or not authorized as driver';
                if (languageType == 1) msg = "المستخدم غير موجود أو غير مخول كسائق";
                else if (languageType == 2) msg = "Utilisateur introuvable ou non autorisé en tant que conducteur";
                return helper.failure(res, msg);
            }

            const existingVehicle = await db.vehicleDetails.findOne({
                where: { id: vehicleId, driverId }
            });

            if (!existingVehicle) {
                let msg = 'Vehicle not found or not authorized to edit';
                if (languageType == 1) msg = "المركبة غير موجودة أو غير مخول لتعديلها";
                else if (languageType == 2) msg = "Véhicule introuvable ou non autorisé à modifier";
                return helper.failure(res, msg);
            }

            const existingVehicleNumber = await db.vehicleDetails.findOne({
                where: {
                    vehicleNumber,
                    id: { [db.Sequelize.Op.ne]: vehicleId }
                }
            });

            if (existingVehicleNumber) {
                let msg = 'Vehicle number already registered by another vehicle';
                if (languageType == 1) msg = "رقم المركبة مسجل بالفعل بواسطة مركبة أخرى";
                else if (languageType == 2) msg = "Numéro de véhicule déjà enregistré par un autre véhicule";
                return helper.failure(res, msg);
            }

            await db.vehicleDetails.update({
                vehicleBrand,
                vehicleModel,
                vehicleYear,
                vehicleNumber,
                vehicleColor,
                vehicleDocument,
                drivingLicence,
                insurance,
                passengerCount,
                updatedAt: new Date()
            }, {
                where: { id: vehicleId, driverId }
            });

            const updatedVehicle = await db.vehicleDetails.findOne({ where: { id: vehicleId } });

            const responseData = {
                id: updatedVehicle.id,
                vehicleBrand: updatedVehicle.vehicleBrand,
                vehicleModel: updatedVehicle.vehicleModel,
                vehicleYear: updatedVehicle.vehicleYear,
                vehicleNumber: updatedVehicle.vehicleNumber,
                vehicleColor: updatedVehicle.vehicleColor,
                vehicleDocument: updatedVehicle.vehicleDocument,
                drivingLicence: updatedVehicle.drivingLicence,
                insurance: updatedVehicle.insurance,
                passengerCount: updatedVehicle.passengerCount,
                updatedAt: updatedVehicle.updatedAt
            };

            let msg = 'Vehicle updated successfully';
            if (languageType == 1) msg = "تم تحديث المركبة بنجاح";
            else if (languageType == 2) msg = "Véhicule mis à jour avec succès";

            return helper.success(res, msg, responseData);

        } catch (error) {
            console.error('vehicleEdit error:', error);

            let msg = `Something went wrong while updating vehicle: ${error.message}`;
            if (languageType == 1) msg = `حدث خطأ أثناء تحديث المركبة: ${error.message}`;
            else if (languageType == 2) msg = `Une erreur s'est produite lors de la mise à jour du véhicule : ${error.message}`;

            return helper.failure(res, msg);
        }
    },

    vehicleGet: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English
            const driverId = req.user.id;

            const driver = await db.users.findOne({
                where: { id: driverId, role: "2", deletedAt: null }
            });

            if (!driver) {
                let msg = 'User not found or not authorized as driver';
                if (languageType == 1) msg = "المستخدم غير موجود أو غير مخول كسائق";
                else if (languageType == 2) msg = "Utilisateur introuvable ou non autorisé en tant que conducteur";
                return helper.failure(res, msg);
            }

            if (driver.status === "0") {
                let msg = "Your account has been deactivated by admin.";
                if (languageType == 1) msg = "تم تعطيل حسابك من قبل المسؤول.";
                else if (languageType == 2) msg = "Votre compte a été désactivé par l’administrateur.";
                return helper.error2(res, msg);
            }

            if (driver.block === "1") {
                let msg = "Your account has been blocked by admin.";
                if (languageType == 1) msg = "تم حظر حسابك من قبل المسؤول.";
                else if (languageType == 2) msg = "Votre compte a été bloqué par l’administrateur.";
                return helper.error1(res, msg);
            }

            if (driver.suspend === "1") {
                let msg = "Your account has been suspended by admin.";
                if (languageType == 1) msg = "تم تعليق حسابك من قبل المسؤول.";
                else if (languageType == 2) msg = "Votre compte a été suspendu par l’administrateur.";
                return helper.error3(res, msg);
            }

            const vehicle = await db.vehicleDetails.findOne({ where: { driverId } });

            if (!vehicle) {
                let msg = 'No vehicle found for this driver';
                if (languageType == 1) msg = "لا توجد مركبة لهذا السائق";
                else if (languageType == 2) msg = "Aucun véhicule trouvé pour ce conducteur";
                return helper.failure(res, msg);
            }

            let msg = 'Vehicle details fetched successfully';
            if (languageType == 1) msg = "تم جلب تفاصيل المركبة بنجاح";
            else if (languageType == 2) msg = "Détails du véhicule récupérés avec succès";

            return helper.success(res, msg, vehicle);

        } catch (error) {
            console.error('vehicleGet error:', error);
            let msg = `Something went wrong while fetching vehicle: ${error.message}`;
            if (languageType == 1) msg = `حدث خطأ أثناء جلب المركبة: ${error.message}`;
            else if (languageType == 2) msg = `Une erreur s'est produite lors de la récupération du véhicule : ${error.message}`;
            return helper.failure(res, msg);
        }
    },

    bankDetail: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English

            const admin = await db.users.findOne({
                where: { role: "0" },
                include: [
                    {
                        model: db.userBanks,
                        as: 'banks',
                        required: false,
                    },
                ],
            });

            let msg = 'Bank details fetched successfully';
            if (languageType == 1) msg = "تم جلب تفاصيل البنك بنجاح";
            else if (languageType == 2) msg = "Détails bancaires récupérés avec succès";

            return helper.success(res, msg, admin);

        } catch (error) {
            console.error('bankDetail error:', error);
            let msg = "Something went wrong.";
            if (languageType == 1) msg = "حدث خطأ ما.";
            else if (languageType == 2) msg = "Une erreur est survenue.";
            return helper.failure(res, msg);
        }
    },

    userActiveRide: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype) || 0;
            const userId = req.user.id;

            // ---------------- USER STATUS ----------------
            const userStatus = await db.users.findOne({
                where: { id: userId },
                attributes: ['status', 'block', 'suspend', 'role'],
                raw: true
            });

            if (!userStatus) {
                let msg = "User not found.";
                if (languageType == 1) msg = "المستخدم غير موجود.";
                else if (languageType == 2) msg = "Utilisateur non trouvé.";
                return helper.failure(res, msg);
            }

            if (userStatus.status === "0") {
                let msg = "Your account has been deactivated by admin.";
                if (languageType == 1) msg = "تم تعطيل حسابك من قبل المسؤول.";
                else if (languageType == 2) msg = "Votre compte a été désactivé par l’administrateur.";
                return helper.error2(res, msg);
            }

            if (userStatus.block === "1") {
                let msg = "Your account has been blocked by admin.";
                if (languageType == 1) msg = "تم حظر حسابك من قبل المسؤول.";
                else if (languageType == 2) msg = "Votre compte a été bloqué par l’administrateur.";
                return helper.error1(res, msg);
            }

            if (userStatus.suspend === "1") {
                let msg = "Your account has been suspended by admin.";
                if (languageType == 1) msg = "تم تعليق حسابك من قبل المسؤول.";
                else if (languageType == 2) msg = "Votre compte a été suspendu par l’administrateur.";
                return helper.error3(res, msg);
            }

            // ---------------- FETCH ACTIVE RIDE ----------------
            const activeRide = await db.bookings.findOne({
                where: {
                    userId: userId,
                    status: { [Sequelize.Op.in]: ['0', '1', '2'] }
                },
                include: [
                    {
                        model: db.users,
                        as: 'driverbook'
                    }
                ],
                order: [['id', 'DESC']]
            });

            // ---------------- NO RIDE FOUND ----------------
            if (!activeRide) {
                let msg = "No active ride";
                if (languageType == 1) msg = "لا توجد رحلة نشطة";
                else if (languageType == 2) msg = "Aucune course active";

                return helper.success(res, msg, {
                    hasActiveRide: false,
                    ride: null
                });
            }

            // ---------------- RIDE FOUND ----------------
            const driver = activeRide.driverbook;

            let msg = "Active ride found";
            if (languageType == 1) msg = "تم العثور على رحلة نشطة";
            else if (languageType == 2) msg = "Course active trouvée";

            return helper.success(res, msg, {
                hasActiveRide: userStatus.role == '3' ? false : true,

                ride: {
                    id: activeRide.id,
                    orderId: activeRide.orderId,
                    status: activeRide.status,
                    request: activeRide.request,
                    pickupLocation: activeRide.pickupLocation,
                    dropLocation: activeRide.dropLocation,
                    coordinates: {
                        pickup: {
                            latitude: activeRide.pickupLatitude,
                            longitude: activeRide.pickupLongitude
                        },
                        drop: {
                            latitude: activeRide.dropLatitude,
                            longitude: activeRide.dropLongitude
                        }
                    },
                    driver: driver ? {
                        id: driver.id,
                        fullName: `${driver.firstName} ${driver.lastName}`,
                        phone: driver.phoneNumber,
                        image: driver.image,
                        latitude: driver.latitude,
                        longitude: driver.longitude
                    } : null
                }
            });

        } catch (error) {
            console.error("Error in userActiveRide:", error);
            let msg = "Something went wrong.";
            if (languageType == 1) msg = "حدث خطأ ما.";
            else if (languageType == 2) msg = "Une erreur est survenue.";
            return helper.failure(res, msg);
        }
    },


    testLocation: async (req, res) => {
        try {
            const userId = req.user.id;
            const { location, latitude, longitude } = req.body;

            if (!location || !latitude || !longitude) {
                return helper.failed(res, "location, latitude, and longitude are required");
            }
            const data = await db.testingLocation.create({
                userId,
                location,
                latitude,
                longitude
            });

            return helper.success(res, "Created successfully", data);
        } catch (error) {
            console.log(error, "error in testLocation API");
            return helper.failed(res, "Something went wrong");
        }
    },
    getLocations: async (req, res) => {
        try {
            const userId = req.user.id;

            const locations = await db.testingLocation.findAll({
                where: { userId },
                order: [['createdAt', 'DESC']] // latest first
            });

            return helper.success(res, "Locations fetched successfully", locations);
        } catch (error) {
            console.log(error, "error in getLocations API");
            return helper.failed(res, "Something went wrong");
        }
    },

    transactionSsHistory1: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype) || 0;
            const driverId = req.user.id;

            const driverStatus = await db.users.findOne({
                where: { id: driverId },
                attributes: ['status', 'block', 'suspend', 'totalAmount'],
                raw: true
            });

            if (!driverStatus) {
                let msg = "User not found";
                if (languageType == 1) msg = "المستخدم غير موجود";
                else if (languageType == 2) msg = "Utilisateur non trouvé";
                return helper.failure(res, msg);
            }

            if (driverStatus.status === "0") {
                return helper.error2(res, "Your account has been deactivated by admin.");
            }

            if (driverStatus.block === "1") {
                return helper.error1(res, "Your account has been blocked by admin.");
            }

            if (driverStatus.suspend === "1") {
                return helper.error3(res, "Your account has been suspended by admin.");
            }

            const { status } = req.body;

            let whereCondition = {
                user_id: driverId
            };

            if (status) {
                whereCondition.status = status;  // pending / completed / failed
            }

            const history = await db.payments.findAll({
                where: whereCondition,
                order: [["createdAt", "DESC"]],
            });

            let msg = "Payment history fetched successfully";
            if (languageType == 1) msg = "تم جلب سجل المدفوعات بنجاح";
            else if (languageType == 2) msg = "Historique des paiements récupéré avec succès";

            return res.json({
                status: true,
                message: msg,
                body: {
                    currentBalance: driverStatus.totalAmount || "0.00",
                    history: history
                }
            });

        } catch (error) {
            console.error('transactionSsHistory error:', error);

            return res.status(500).json({
                status: false,
                message: "Something went wrong",
                error: error.message
            });
        }
    },
    transactionSsHistory: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype) || 0;
            const driverId = req.user.id;

            const driverStatus = await db.users.findOne({
                where: { id: driverId },
                attributes: ['status', 'block', 'suspend', 'totalAmount'],
                raw: true
            });

            if (!driverStatus) {
                let msg = "User not found";
                if (languageType == 1) msg = "المستخدم غير موجود";
                else if (languageType == 2) msg = "Utilisateur non trouvé";
                return helper.failure(res, msg);
            }

            if (driverStatus.status === "0") {
                return helper.error2(res, "Your account has been deactivated by admin.");
            }
            if (driverStatus.block === "1") {
                return helper.error1(res, "Your account has been blocked by admin.");
            }
            if (driverStatus.suspend === "1") {
                return helper.error3(res, "Your account has been suspended by admin.");
            }

            const { status } = req.body;
            let paymentWhere = {
                user_id: driverId
            };
            if (status) {
                paymentWhere.status = status;
            }

            const payments = await db.payments.findAll({
                where: paymentWhere,
                order: [["createdAt", "DESC"]],
                raw: true
            });

            // Completed rides from bookings
            const bookings = await db.bookings.findAll({
                where: {
                    driverId: driverId,
                    status: "3"
                },
                attributes: ['id', 'bookingPrice', 'adminAmountCut', 'createdAt'],
                order: [["createdAt", "DESC"]],
                raw: true
            });

            const bookingCommissions = bookings.map(booking => {
                const matchingPayment = payments.find(p => p.id_sedad == booking.id);

                return {
                    id: booking.id,
                    bookingId: booking.id,
                    bookingPrice: booking.bookingPrice,
                    adminAmountCut: booking.adminAmountCut || "0",
                    createdAt: booking.createdAt,
                };
            });

            let msg = "Payment history fetched successfully";
            if (languageType == 1) msg = "تم جلب سجل المدفوعات بنجاح";
            else if (languageType == 2) msg = "Historique des paiements récupéré avec succès";

            return res.json({
                status: true,
                message: msg,
                body: {
                    currentBalance: driverStatus.totalAmount || "0.00",
                    history: payments,
                    commissions: bookingCommissions
                }
            });

        } catch (error) {
            console.error('transactionSsHistory error:', error);

            return res.status(500).json({
                status: false,
                message: "Something went wrong",
                error: error.message
            });
        }
    },
}