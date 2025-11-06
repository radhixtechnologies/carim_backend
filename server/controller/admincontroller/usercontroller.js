const db = require("../../models");
const helper = require("../../helper/helper");
const { Op, Model } = require("sequelize");


module.exports = {
    userList: async (req, res) => {
        try {
            let { page, limit, search, dateFilter } = req.query;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            const offset = (page - 1) * limit;
            dateFilter = dateFilter || "all";

            const Op = db.Sequelize.Op;
            const whereCondition = { role: "1" };

            if (search && search.trim() !== "") {
                whereCondition[Op.or] = [
                    { name: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } },
                ];
            }

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

            const { count, rows } = await db.users.findAndCountAll({
                where: whereCondition,
                offset,
                limit,
                order: [["id", "DESC"]],
            });

            return helper.success(res, "All players Detail", {
                data: rows,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalUsers: count,
            });
        } catch (error) {
            return helper.error(res, error.message);
        }
    },
    userStatus: async (req, res) => {
        try {
            const { id, status } = req.body;
            const user = await db.users.findOne({ where: { id } });
            await db.users.update({ status }, { where: { id } });
            const updatedUser = await db.users.findOne({ where: { id } });
            return helper.success(res, "User status updated successfully", { id: updatedUser.id, status: updatedUser.status });
        } catch (error) {
            return helper.error(res, error.message);
        }
    },
    userDelete: async (req, res) => {
        try {
            const { id } = req.params;
            const user = await db.users.findOne({ where: { id } });

            if (!user) {
                return helper.error(res, "User not found", 404);
            }
            await db.users.destroy({ where: { id } });
            return helper.success(res, "User deleted successfully");
        } catch (error) {
            return helper.error(res, error.message);
        }
    },
    driverList: async (req, res) => {
        try {
            let { page, limit, search, dateFilter } = req.query;
            page = parseInt(page) || 1;
            limit = parseInt(limit) || 10;
            const offset = (page - 1) * limit;
            dateFilter = dateFilter || "all";

            const Op = db.Sequelize.Op;
            const whereCondition = { role: "2" };

            if (search && search.trim() !== "") {
                whereCondition[Op.or] = [
                    { name: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } },
                ];
            }

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

            const include = [
                {
                    model: db.reviewrating,
                    as: 'ratedcoach',
                    required: false,
                    attributes: []
                }
            ];

            const { count, rows } = await db.users.findAndCountAll({
                where: whereCondition,
                offset,
                limit,
                include,
                attributes: {
                    include: [
                        [
                            db.Sequelize.fn(
                                'COALESCE',
                                db.Sequelize.fn(
                                    'ROUND',
                                    db.Sequelize.fn('AVG', db.Sequelize.col('ratedcoach.rating')),
                                    2
                                ),
                                0
                            ),
                            'averageRating'
                        ],
                        [
                            db.Sequelize.fn('COUNT', db.Sequelize.col('ratedcoach.id')),
                            'totalReviews'
                        ]
                    ]
                },
                group: ['users.id',],
                subQuery: false,
                order: [["id", "DESC"]],
                distinct: true,
            });

            const formattedRows = rows.map(row => {
                const userData = row.toJSON();
                return {
                    ...userData,
                    averageRating: parseFloat(userData.averageRating) || 0,
                    totalReviews: parseInt(userData.totalReviews) || 0
                };
            });

            return helper.success(res, "All coaches Detail", {
                data: formattedRows,
                currentPage: page,
                totalPages: Math.ceil(count.length / limit),
                totalUsers: count.length,
            });
        } catch (error) {
            return helper.error(res, error.message);
        }
    },
   
  

}