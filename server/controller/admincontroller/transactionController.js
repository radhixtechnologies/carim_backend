const db = require("../../models");
const helper = require("../../helper/helper");
const { Op } = require("sequelize");

// Add this association
db.payments.belongsTo(db.users, { foreignKey: 'user_id', as: 'user', targetKey: 'id' });
module.exports = {
    transactionList: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const search = req.query.search || "";
            const dateFilter = req.query.dateFilter || "all";

            const whereClause = {};
            const includeClause = [
                {
                    model: db.users,
                    as: 'usertransaction',
                    required: false,
                },
                {
                    model: db.users,
                    as: 'drivertransaction',
                    required: false,
                },
                {
                    model: db.bookings,
                    as: 'transactionbooking',
                    required: false,
                }
            ];

            if (dateFilter !== 'all') {
                const daysAgo = parseInt(dateFilter, 10);
                if (!isNaN(daysAgo)) {
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - daysAgo);
                    whereClause.createdAt = {
                        [db.Sequelize.Op.gte]: startDate,
                    };
                }
            }

            if (search) {
                const searchConditions = [];

                searchConditions.push({
                    '$usertransaction.name$': {
                        [db.Sequelize.Op.like]: `%${search}%`
                    }
                });

                searchConditions.push({
                    '$drivertransaction.name$': {
                        [db.Sequelize.Op.like]: `%${search}%`
                    }
                });

                if (!isNaN(search)) {
                    searchConditions.push({
                        id: parseInt(search)
                    });
                }

                whereClause[db.Sequelize.Op.or] = searchConditions;
            }

            const totalTransactions = await db.transactions.count({
                where: whereClause,
                distinct: true,
                col: 'id',
                include: includeClause
            });

            const transactions = await db.transactions.findAll({
                where: whereClause,
                offset: offset,
                limit: limit,
                order: [["id", "DESC"]],
                include: includeClause,
                subQuery: false,
            });

            return helper.success(res, "All transaction details", {
                data: transactions,
                total: totalTransactions,
                page,
                limit,
                totalPages: Math.ceil(totalTransactions / limit),
            });
        } catch (error) {
            return helper.error(res, error.message);
        }
    },
    transactionDelete: async (req, res) => {
        try {
            const { id } = req.params;

            const League = await db.transactions.findOne({ where: { id } });
            await db.transactions.destroy({ where: { id } });

            return helper.success(res, "Transaction deleted successfully");
        } catch (error) {
            return helper.error(res, error.message);
        }
    },
    screenshotlist: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const search = req.query.search || "";
            const dateFilter = req.query.dateFilter || "all";

            const whereClause = {};
            const includeClause = [
                {
                    model: db.users,
                    as: 'screenshotdriver',
                    required: false,
                },
            ];

            if (dateFilter !== 'all') {
                const daysAgo = parseInt(dateFilter, 10);
                if (!isNaN(daysAgo)) {
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - daysAgo);
                    whereClause.createdAt = {
                        [db.Sequelize.Op.gte]: startDate,
                    };
                }
            }

            if (search) {
                const searchConditions = [];
                searchConditions.push({
                    '$screenshotdriver.name$': {
                        [db.Sequelize.Op.like]: `%${search}%`
                    }
                });

                if (!isNaN(search)) {
                    searchConditions.push({
                        id: parseInt(search)
                    });
                }

                whereClause[db.Sequelize.Op.or] = searchConditions;
            }

            const totalTransactions = await db.transferscreenshot.count({
                where: whereClause,
                distinct: true,
                col: 'id',
                include: includeClause
            });

            const transactions = await db.transferscreenshot.findAll({
                where: whereClause,
                offset: offset,
                limit: limit,
                order: [["id", "DESC"]],
                include: includeClause,
                subQuery: false,
            });

            return helper.success(res, "All transaction screen details", {
                data: transactions,
                total: totalTransactions,
                page,
                limit,
                totalPages: Math.ceil(totalTransactions / limit),
            });
        } catch (error) {
            return helper.error(res, error.message);
        }
    },
    // screenshotstatus: async (req, res) => {
    //     try {
    //         const { id, status, addAmount } = req.body;
    //         if (!id) {
    //             return helper.error(res, "Transaction ID is required");
    //         }

    //         const transaction = await db.transferscreenshot.findOne({
    //             where: { id },
    //             include: [
    //                 {
    //                     model: db.users,
    //                     as: 'screenshotdriver'
    //                 }
    //             ]
    //         });

    //         if (!transaction) {
    //             return helper.error(res, "Transaction not found");
    //         }
    //         if (transaction.status === "1") {
    //             return helper.error(res, "Transaction is already verified");
    //         }

    //         if (!['0', '1', '2'].includes(status)) {
    //             return helper.error(res, "Invalid status");
    //         }

    //         const t = await db.sequelize.transaction();

    //         try {
    //             // Update transaction status and addedAmount
    //             await db.transferscreenshot.update(
    //                 {
    //                     status,
    //                     // addedAmount: status === "1" ? parseFloat(addAmount) : null,
    //                     amount: status === "1" ? parseFloat(addAmount) : 0
    //                 },
    //                 { where: { id }, transaction: t }
    //             );

    //             if (status === "1" && addAmount) {
    //                 let driverId = transaction.driverId;

    //                 if (!driverId && transaction.screenshotdriver) {
    //                     driverId = transaction.screenshotdriver.id;
    //                 }
    //                 if (!driverId) {
    //                     driverId = transaction.dataValues?.driverId;
    //                 }
    //                 if (!driverId) {
    //                     await t.rollback();
    //                     return helper.error(res, "Driver ID not found in transaction. Please check transaction data.");
    //                 }

    //                 const driver = await db.users.findOne({
    //                     where: {
    //                         id: driverId,
    //                         role: "2"
    //                     },
    //                     transaction: t
    //                 });

    //                 if (!driver) {
    //                     await t.rollback();
    //                     return helper.error(res, `Driver not found.`);
    //                 }

    //                 const currentDriverAmount = parseFloat(driver.totalAmount || 0);
    //                 const amountToAdd = parseFloat(addAmount);
    //                 const newDriverAmount = currentDriverAmount + amountToAdd;

    //                 await db.users.update(
    //                     // {
    //                     //     totalAmount: newDriverAmount
    //                     // },
    //                     {
    //                         where: { id: driverId },
    //                         transaction: t
    //                     }
    //                 );
    //             }

    //             await t.commit();

    //             const updatedTransaction = await db.transferscreenshot.findOne({
    //                 where: { id },
    //                 include: [
    //                     {
    //                         model: db.users,
    //                         as: 'screenshotdriver'
    //                     },
    //                 ]
    //             });

    //             let updatedDriver = null;
    //             if (status === "1" && addAmount) {
    //                 let driverId = transaction.driverId || (transaction.screenshotdriver && transaction.screenshotdriver.id);
    //                 if (driverId) {
    //                     updatedDriver = await db.users.findOne({
    //                         where: { id: driverId }
    //                     });
    //                 }
    //             }

    //             return helper.success(res, "Status updated successfully", {
    //                 id: updatedTransaction.id,
    //                 status: updatedTransaction.status,
    //                 addedAmount: updatedTransaction.addedAmount,
    //                 driverTotalAmount: updatedDriver?.totalAmount,
    //                 success: true
    //             });

    //         } catch (error) {
    //             await t.rollback();
    //             throw error;
    //         }
    //     } catch (error) {
    //         return helper.error(res, error.message);
    //     }
    // },

    screenshotstatus: async (req, res) => {
        try {
            const { id, status } = req.body;
            if (!id) {
                return helper.error(res, "Transaction ID is required");
            }

            const transaction = await db.transferscreenshot.findOne({
                where: { id },
                include: [
                    {
                        model: db.users,
                        as: 'screenshotdriver'
                    }
                ]
            });

            if (!transaction) {
                return helper.error(res, "Transaction not found");
            }

            if (!['0', '1', '2'].includes(status)) {
                return helper.error(res, "Invalid status");
            }

            if (status === "1" && transaction.status === "1") {
                return helper.error(res, "Transaction is already verified");
            }

            const t = await db.sequelize.transaction();

            try {
                await db.transferscreenshot.update(
                    {
                        status,
                    },
                    { where: { id }, transaction: t }
                );

                await t.commit();

                const updatedTransaction = await db.transferscreenshot.findOne({
                    where: { id },
                    include: [
                        {
                            model: db.users,
                            as: 'screenshotdriver'
                        },
                    ]
                });

                return helper.success(res, "Status updated successfully", {
                    id: updatedTransaction.id,
                    status: updatedTransaction.status,
                    amount: updatedTransaction.amount, // 0 will be returned
                    success: true
                });

            } catch (error) {
                await t.rollback();
                throw error;
            }
        } catch (error) {
            return helper.error(res, error.message);
        }
    },

    screenshotdelete: async (req, res) => {
        try {
            const { id } = req.params;

            const League = await db.transferscreenshot.findOne({ where: { id } });
            await db.transferscreenshot.destroy({ where: { id } });

            return helper.success(res, "Transaction screenshot deleted successfully");
        } catch (error) {
            return helper.error(res, error.message);
        }
    },

    driverWaletHistory: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const search = req.query.search || "";
            const dateFilter = req.query.dateFilter || "all";

            let whereCondition = {};
            if (dateFilter !== 'all') {
                const daysAgo = parseInt(dateFilter, 10);
                if (!isNaN(daysAgo)) {
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - daysAgo);

                    whereCondition.createdAt = {
                        [Op.gte]: startDate,
                    };
                }
            }

            let userIds = [];
            if (search) {
                const matchedUsers = await db.users.findAll({
                    where: {
                        [Op.or]: [
                            { firstName: { [Op.like]: `%${search}%` } },
                            { lastName: { [Op.like]: `%${search}%` } },
                        ]
                    },
                    attributes: ['id']
                });
                userIds = matchedUsers.map(user => user.id);

                if (userIds.length === 0) {
                    return helper.success(res, "Driver Wallet fetched successfully", {
                        data: [],
                        total: 0,
                        page,
                        limit,
                        totalPages: 0,
                    });
                }
            }
            let dataOptions = {
                include: [{
                    model: db.users,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'countryCode', 'phoneNumber'],
                    required: !!search
                }],
                limit,
                offset,
                order: [["id", "DESC"]],
                distinct: true
            };

            if (search && userIds.length > 0) {
                dataOptions.include[0].where = {
                    id: {
                        [Op.in]: userIds
                    }
                };
            }

            if (Object.keys(whereCondition).length > 0) {
                dataOptions.where = whereCondition;
            }

            const data = await db.payments.findAll(dataOptions);

            let totalWalletRecharge;
            if (search && userIds.length > 0) {
                const paymentsWithUsers = await db.payments.findAll({
                    where: whereCondition,
                    include: [{
                        model: db.users,
                        as: 'user',
                        where: {
                            id: {
                                [Op.in]: userIds
                            }
                        },
                        required: true
                    }],
                    attributes: ['id'],
                    distinct: true
                });
                totalWalletRecharge = paymentsWithUsers.length;
            } else {
                totalWalletRecharge = await db.payments.count({
                    where: whereCondition
                });
            }
            return helper.success(res, "Driver Wallet fetched successfully", {
                data,
                total: totalWalletRecharge,
                page,
                limit,
                totalPages: Math.ceil(totalWalletRecharge / limit),
            });
        } catch (error) {
            console.error("Error fetching driver wallet:", error);
            return helper.error(res, "Something went wrong", error);
        }
    },
    driverWaletView: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await db.payments.findByPk(id, {
                include: [{
                    model: db.users,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'countryCode', 'phoneNumber']
                }]
            });
            return res.status(200).json({ message: true, data });
        } catch (error) {
            return helper.error(res, "Something went wrong", error);
        }
    },

    driverWalletDelete: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await db.payments.destroy({ where: { id } });
            return helper.success(res, "Driver wallet Recharge deleted successfully");

        } catch (error) {
            return helper.error(res, "Something went wrong", error);
        }
    },

};
