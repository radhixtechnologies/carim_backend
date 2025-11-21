const db = require('../../models');
const bcrypt = require('bcryptjs');
const helper = require('../../helper/helper');
const { Validator } = require('node-input-validator');
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");


module.exports = {

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return helper.error(res, "Email and Password are required");
            }

            const userData = await db.users.findOne({ where: { email } });

            if (!userData) {
                return helper.error(res, "Invalid Email");
            }

            if (userData.role === '3' && userData.requestStatus !== '1') {
                return helper.error(res, "You are not eligible to login. Please wait.");
            }

            const isPasswordValid = await bcrypt.compare(password, userData.password);
            if (!isPasswordValid) {
                return helper.error(res, "Invalid Email and Password");
            }

            if (userData.role === '3' && userData.requestStatus !== '1') {
                return helper.error(res, "You are not eligible to login. Please wait.");
            }

            const secret = process.env.JWT_SECRET;
            const token = jwt.sign(
                {
                    id: userData.id,
                    name: userData.name,
                    email: userData.email,
                    role: userData.role
                },
                secret,
            );

            const userResponse = { ...userData.toJSON() };
            delete userResponse.password;

            return helper.success(res, "Login successful", {
                ...userResponse,
                token
            });

        } catch (error) {
            return helper.error(res, error.message);
        }
    },
    profile: async (req, res) => {
        try {
            const userId = req.admin.id;
            const find_user = await db.users.findByPk(userId, {});
            return helper.success(res, "Profile fetched successfully", find_user);
        } catch (error) {
            return helper.error(res, error.message);
        }
    },
    edit_profile: async (req, res) => {
        try {
            const userId = req.admin.id;
            const find_user = await db.users.findByPk(userId);
            if (!find_user) {
                return helper.error(res, "User not found", 403);
            }
            let imagePath = find_user.image;
            if (req.files && req.files.image) {
                imagePath = await helper.fileUpload(req.files.image);
            }
            await db.users.update(
                {
                    name: req.body.name || find_user.name,
                    location: req.body.location || find_user.location,
                    phoneNumber: req.body.phoneNumber || find_user.phoneNumber,
                    countryCode: req.body.countryCode || find_user.countryCode,
                    image: imagePath,
                    adminCommission: req.body.adminCommission || find_user.adminCommission

                },
                { where: { id: userId } }
            );
            const updatedProfile = await db.users.findByPk(userId, {});

            return helper.success(res, "Profile updated successfully", updatedProfile);
        } catch (error) {
            return helper.error(res, error.message);
        }
    },
    reset_password: async (req, res) => {
        try {
            const { password, newPassword } = req.body;
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                return helper.error(res, "No token provided");
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;

            const find_data = await db.users.findByPk(userId);
            if (!find_data) {
                return helper.error(res, "User not found");
            }

            const isPasswordMatch = await bcrypt.compare(password, find_data.password);
            if (!isPasswordMatch) {
                return helper.error(res, "Old password is incorrect");
            }
            const isNewSameAsOld = await bcrypt.compare(newPassword, find_data.password);
            if (isNewSameAsOld) {
                return helper.error(res, "New password cannot be the same as the old password");
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            await db.users.update(
                { password: hashedNewPassword },
                { where: { id: userId } }
            );

            return helper.success(res, "Password changed successfully");
        } catch (error) {
            return helper.error(res, error.message);
        }
    },
    logout: async (req, res) => {
        try {
            return helper.success(res, "Logged out successfully. Please clear the token on the client side.");
        } catch (error) {
            return helper.error(res, error.message);
        }
    },
    dashboard: async (req, res) => {
        try {
            let player = await db.users.count({ where: { role: "1" } });
            let coach = await db.users.count({ where: { role: "2" } });

            let booking = await db.bookings.count();
            let rating = await db.reviewrating.count();
            let contact = await db.contactus.count();
            let faq = await db.faqs.count()

            return helper.success(res, "Dashboard data fetched successfully", {
                player,
                coach,

                booking,
                rating,
                contact,
                faq
            });
        } catch (error) {
            return helper.error(res, "Error fetching dashboard data", error);
        }
    },
    chartData: async (req, res) => {
        try {
            const currentYear = new Date().getFullYear();
            const categories = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            const data = await Promise.all(
                categories.map(async (_, index) => {
                    const startOfMonth = new Date(currentYear, index, 1);
                    const endOfMonth = new Date(currentYear, index + 1, 0, 23, 59, 59);

                    const playerCount = await db.users.count({
                        where: {
                            role: "1",
                            createdAt: {
                                [Op.between]: [startOfMonth, endOfMonth],
                            },
                        },
                    });
                    const coachCount = await db.users.count({
                        where: {
                            role: "2",
                            createdAt: {
                                [Op.between]: [startOfMonth, endOfMonth],
                            },
                        },
                    });

                    return { playerCount, coachCount };
                })
            );

            const playersData = data.map(item => item.playerCount);
            const coachesData = data.map(item => item.coachCount);

            res.json({
                data: { players: playersData, coaches: coachesData },
                categories,
            });
        } catch (error) {
            return helper.error(res, "Error fetching chart data", error);
        }
    },
    AdminBank: async (req, res) => {
        try {
            const userId = req.admin.id;

            const find_user = await db.users.findOne({
                where: { id: userId },
                include: [
                    {
                        model: db.userBanks,
                        as: 'banks',
                        required: false,
                    },
                ],
            });

            if (!find_user) {
                return helper.error(res, "User not found");
            }

            const bankData = find_user.banks && find_user.banks.length > 0 ? find_user.banks[0] : {};

            return helper.success(res, "Bank Detail fetched successfully", { bankuser: bankData });
        } catch (error) {
            return helper.error(res, error.message);
        }
    },
    updateBankDetails: async (req, res) => {
        try {
            const userId = req.admin.id;
            const {
                accountType, bankName, accountCountry, currency, currencyCountry, sortCode,
                accountName, accountNumber, accountOwnerInfo, holderName, city, address, postalCode, isDefault
            } = req.body;

            if (!bankName || !accountNumber || !holderName) {
                return helper.error(res, "Bank name, account number, and holder name are required");
            }

            let bankDetails = await db.userBanks.findOne({ where: { userId } });

            if (bankDetails) {
                await db.userBanks.update(
                    {
                        accountType, bankName, accountCountry, currency, currencyCountry, sortCode,
                        accountName, accountNumber, accountOwnerInfo, holderName, city, address, postalCode, isDefault
                    },
                    { where: { userId } }
                );
            } else {
                await db.userBanks.create({
                    userId, accountType, bankName, accountCountry, currency, currencyCountry, sortCode,
                    accountName, accountNumber, accountOwnerInfo, holderName, city, address, postalCode, isDefault
                });
            }

            const updatedBankDetails = await db.userBanks.findOne({ where: { userId } });
            return helper.success(res, "Bank details updated successfully", updatedBankDetails);
        } catch (error) {
            return helper.error(res, error.message);
        }
    }
}