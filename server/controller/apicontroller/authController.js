const db = require('../../models');
const bcrypt = require('bcryptjs');
const helper = require('../../helper/helper');
const { Validator } = require('node-input-validator');
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");


module.exports = {
    login: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                countryCode: "required",
                phoneNumber: "required",
                role: "required"
            });

            const errorsResponse = await helper.checkValidation(v);
            if (errorsResponse) {
                return helper.failure(res, errorsResponse);
            }

            const {
                deviceToken,
                deviceType,
                phoneNumber,
                countryCode,
                role,
            } = req.body;

            const existingUser = await db.users.findOne({
                where: {
                    phoneNumber: phoneNumber,
                    countryCode: countryCode,
                    role: role,
                    deletedAt: null
                }
            });

            let user;
            let isNewUser = false;

            if (existingUser) {
                user = existingUser;
            } else {
                const userWithSamePhone = await db.users.findOne({
                    where: {
                        phoneNumber: phoneNumber,
                        countryCode: countryCode,
                        deletedAt: null
                    }
                });

                if (userWithSamePhone) {
                    return helper.failure(res, 'Phone number already registered with a different role');
                }

                const otp = '1111';
                user = await db.users.create({
                    countryCode: countryCode,
                    phoneNumber: phoneNumber,
                    role: role,
                    deviceToken: deviceToken || null,
                    deviceType: deviceType || null,
                    loginTime: helper.unixTimestamp(),
                    otp: otp
                });

                isNewUser = true;
            }

            const loginTime = helper.unixTimestamp();
            const token = jwt.sign(
                { loginTime: loginTime, id: user.id },
                process.env.JWT_SECRET
            );

            const updateData = {
                loginTime: loginTime,
                updatedAt: helper.unixTimestamp()
            };

            if (deviceToken) {
                updateData.deviceToken = deviceToken;
                updateData.deviceType = deviceType || null;
            }

            await db.users.update(
                updateData,
                { where: { id: user.id } }
            );

            const updatedUser = await db.users.findOne({
                where: { id: user.id, deletedAt: null }
            });

            const responseData = {
                ...updatedUser.toJSON(),
                token: token
            };

            if (isNewUser) {
                responseData.otp = user.otp;
                return helper.success(res, 'Account created successfully. OTP sent for verification.', responseData);
            }

            return helper.success(res, 'Login successfully', responseData);

        } catch (error) {
            return helper.failure(res, 'Something went wrong');
        }
    },
    verifyOtp: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                otp: 'required',
                countryCode: 'required',
                phoneNumber: 'required',
            });

            let errorsResponse = await helper.checkValidation(v);
            if (errorsResponse) {
                return helper.failure(res, errorsResponse);
            }

            let user = await db.users.findOne({
                where: {
                    phoneNumber: req.body.phoneNumber,
                    countryCode: req.body.countryCode,
                    deletedAt: null
                },
            });

            if (!user) {
                return helper.failure(res, 'User not found.');
            }

            if (user.status === 0) {
                return helper.failure(res, "Your account is in-active by Admin. Please contact the admin for assistance."); // Changed from failure to failure
            }

            if (req.body.otp == user.otp) {
                const loginTime = helper.unixTimestamp();

                const token = jwt.sign(
                    { loginTime: loginTime, id: user.id },
                    process.env.JWT_SECRET
                );

                await db.users.update(
                    {
                        otpVerify: "1",
                        otp: 0,
                        loginTime: loginTime
                    },
                    { where: { id: user.id } }
                );

                const updated = await db.users.findOne({
                    where: {
                        phoneNumber: req.body.phoneNumber,
                        countryCode: req.body.countryCode
                    }
                });

                return helper.success(res, 'OTP verified successfully.', {
                    ...updated.toJSON(),
                    token: token
                });

            } else {
                return helper.failure(res, 'OTP does not match.');
            }
        } catch (error) {
            return helper.failure(res, 'Something went wrong');
        }
    },
    resendOTP: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                countryCode: "required",
                phoneNumber: "required",
            });

            const errorsResponse = await helper.checkValidation(v);
            if (errorsResponse) {
                return helper.failure(res, errorsResponse);
            }

            const { countryCode, phoneNumber } = req.body;

            const user = await db.users.findOne({
                where: {
                    phoneNumber,
                    countryCode,
                    deletedAt: null
                },
                raw: true
            });

            if (!user) {
                return helper.failure(res, "User not found");
            }

            const otp = '1111';

            await db.users.update(
                {
                    otp: otp,
                    otpVerify: "0",
                },
                {
                    where: {
                        id: user.id,
                    },
                }
            );

            return helper.success(res, "OTP Re-sent Successfully");
        } catch (error) {
            return helper.failure(res, "OTP Not Sent!");
        }
    },
    deleteAccount: async (req, res) => {
        try {
            const deletedAt = new Date();

            let updatedUser = await db.users.update(
                {
                    deletedAt: deletedAt,
                },
                {
                    where: {
                        id: req.user.id,
                    },
                }
            );

            return helper.success(res, "Account deleted successfully.", {});
        } catch (error) {
            return helper.failure(res, "Error during account deletion.", {});
        }
    },
    logout: async (req, res) => {
        try {
            let loginTime = helper.unixTimestamp();
            await db.users.update(
                {
                    deviceToken: "",
                    loginTime: loginTime,
                },
                {
                    where: {
                        id: req.user.id,
                    },
                }
            );

            return helper.success(res, "Logout Successfully", {});
        } catch (error) {
            return helper.failure(res, "Error during account logout.", {});

        }
    },
    getCmsContent: async (req, res) => {
        try {
            const { type } = req.query;
            if (![1, 2, 3].includes(Number(type))) {
                return helper.failure(
                    res,
                    "Invalid type. Use 1 for Privacy Policy, 3 for Terms and Conditions, 2 for About us."
                );
            }
            const cmsContent = await db.cms.findOne({
                where: {
                    type: Number(type),
                },
            });

            if (!cmsContent) {
                return helper.failure(res, "Content not found.");
            }

            let message = "";
            switch (Number(type)) {
                case 1:
                    message = "Privacy policy guidelines retrieved successfully.";
                    break;
                case 2:
                    message = "About us content retrieved successfully.";
                    break;
                case 3:
                    message = "Terms and conditions retrieved successfully.";

                    break;
            }

            return helper.success(res, message, cmsContent);
        } catch (error) {
            return helper.failure(res, error);
        }
    },
    notificationOnOff: async (req, res) => {
        try {
            const isNotificationOn = parseInt(req.body.isNotificationOn, 10);

            if (![0, 1].includes(isNotificationOn)) {
                return helper.failure(res, "Invalid value. Use 1 or 0 as integer.");
            }
            let user = await db.users.findOne({
                where: { id: req.user.id },
                raw: true,
            });

            if (!user) {
                return helper.failure(res, "User not found.");
            }

            const msg = isNotificationOn === 1 ? "Notifications ON." : "Notifications OFF.";

            await db.users.update(
                { isNotificationOn: isNotificationOn.toString() },
                { where: { id: req.user.id } }
            );

            return helper.success(res, msg, { isNotificationOn: isNotificationOn });
        } catch (error) {
            return helper.failure(res, "Something went wrong.", {});
        }
    },
    createContactUs: async (req, res) => {
        try {
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

            return helper.success(
                res,
                "Information submitted successfully.",
                create_contact
            );
        } catch (error) {
            return helper.failure(res, "Something went wrong. Please try again.");
        }
    },
    vehicleAdd: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                vehicleBrand: "required",
                vehicleModel: "required",
                vehicleYear: "required",
                vehicleNumber: "required",
                vehicleColor: "required",
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
                drivingLicence
            } = req.body;

            const driverId = req.user.id;

            const driver = await db.users.findOne({
                where: {
                    id: driverId,
                    role: "2",
                    deletedAt: null
                }
            });

            if (!driver) {
                return helper.failure(res, 'User not found or not authorized as driver');
            }

            const existingVehicle = await db.vehicleDetails.findOne({
                where: { driverId }
            });

            if (existingVehicle) {
                return helper.failure(res, 'Vehicle already registered for this driver');
            }

            const existingVehicleNumber = await db.vehicleDetails.findOne({
                where: { vehicleNumber }
            });

            if (existingVehicleNumber) {
                return helper.failure(res, 'Vehicle number already registered');
            }

            const vehicle = await db.vehicleDetails.create({
                driverId: driverId,
                vehicleBrand: vehicleBrand,
                vehicleModel: vehicleModel,
                vehicleYear: vehicleYear,
                vehicleNumber: vehicleNumber,
                vehicleColor: vehicleColor,
                vehicleDocument: vehicleDocument,
                drivingLicence: drivingLicence
            });

            const responseData = {
                id: vehicle.id,
                vehicleBrand: vehicle.vehicleBrand,
                vehicleModel: vehicle.vehicleModel,
                vehicleYear: vehicle.vehicleYear,
                vehicleNumber: vehicle.vehicleNumber,
                vehicleColor: vehicle.vehicleColor,
                vehicleDocument: vehicle.vehicleDocument,
                drivingLicence: vehicle.drivingLicence,

            };

            return helper.success(res, 'Vehicle added successfully', responseData);

        } catch (error) {
            return helper.failure(res, `Something went wrong while adding vehicle: ${error.message}`);
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
            const responseData = await db.banners.findAll();
            return helper.success(res, 'All banner detail.', responseData);
        } catch (error) {
            return helper.failure(res, "Something went wrong.");

        }
    },
    vehicleEdit: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                vehicleBrand: "required",
                vehicleModel: "required",
                vehicleYear: "required",
                vehicleNumber: "required",
                vehicleColor: "required",
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
                drivingLicence
            } = req.body;

            const driverId = req.user.id;
            const vehicleId = req.params.id;

            const driver = await db.users.findOne({
                where: {
                    id: driverId,
                    role: "2",
                    deletedAt: null
                }
            });

            if (!driver) {
                return helper.failure(res, 'User not found or not authorized as driver');
            }

            const existingVehicle = await db.vehicleDetails.findOne({
                where: {
                    id: vehicleId,
                    driverId: driverId
                }
            });

            if (!existingVehicle) {
                return helper.failure(res, 'Vehicle not found or not authorized to edit');
            }

            const existingVehicleNumber = await db.vehicleDetails.findOne({
                where: {
                    vehicleNumber: vehicleNumber,
                    id: { [db.Sequelize.Op.ne]: vehicleId }
                }
            });

            if (existingVehicleNumber) {
                return helper.failure(res, 'Vehicle number already registered by another vehicle');
            }

            await db.vehicleDetails.update({
                vehicleBrand: vehicleBrand,
                vehicleModel: vehicleModel,
                vehicleYear: vehicleYear,
                vehicleNumber: vehicleNumber,
                vehicleColor: vehicleColor,
                vehicleDocument: vehicleDocument,
                drivingLicence: drivingLicence,
                updatedAt: new Date()
            }, {
                where: {
                    id: vehicleId,
                    driverId: driverId
                }
            });

            const updatedVehicle = await db.vehicleDetails.findOne({
                where: { id: vehicleId }
            });

            const responseData = {
                id: updatedVehicle.id,
                vehicleBrand: updatedVehicle.vehicleBrand,
                vehicleModel: updatedVehicle.vehicleModel,
                vehicleYear: updatedVehicle.vehicleYear,
                vehicleNumber: updatedVehicle.vehicleNumber,
                vehicleColor: updatedVehicle.vehicleColor,
                vehicleDocument: updatedVehicle.vehicleDocument,
                drivingLicence: updatedVehicle.drivingLicence,
                updatedAt: updatedVehicle.updatedAt
            };

            return helper.success(res, 'Vehicle updated successfully', responseData);

        } catch (error) {
            return helper.failure(res, `Something went wrong while updating vehicle: ${error.message}`);
        }
    },
    vehicleGet: async (req, res) => {
        try {
            const driverId = req.user.id;

            const driver = await db.users.findOne({
                where: {
                    id: driverId,
                    role: "2",
                    deletedAt: null
                }
            });

            if (!driver) {
                return helper.failure(res, 'User not found or not authorized as driver');
            }

            const vehicle = await db.vehicleDetails.findOne({
                where: { driverId },

            });

            if (!vehicle) {
                return helper.failure(res, 'No vehicle found for this driver');
            }

            return helper.success(res, 'Vehicle details fetched successfully', vehicle);

        } catch (error) {
            return helper.failure(res, `Something went wrong while fetching vehicle: ${error.message}`);
        }
    },
    bankDetail: async (req, res) => {
        try {
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

       
            return helper.success(res, 'Vehicle details fetched successfully', admin);
        } catch (error) {
            return helper.failure(res, `Something went wrong.`);

        }
    }



}