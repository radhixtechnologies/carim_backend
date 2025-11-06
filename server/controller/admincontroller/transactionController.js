const db = require("../../models");
const helper = require("../../helper/helper");

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
            console.error("Transaction list error:", error);
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

};
