const db = require("../../models");
const helper = require("../../helper/helper");

module.exports = {
    bookingList: async (req, res) => {
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
                    as: 'driverbook',
                    required: false,
                },
                {
                    model: db.users,
                    as: 'userbook',
                    required: false,
                }
            ];

            // Date filter
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
                    '$bookedcoach.name$': {
                        [db.Sequelize.Op.like]: `%${search}%`
                    }
                });

                searchConditions.push({
                    '$userbook.name$': {
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

            const totalBookings = await db.bookings.count({
                where: whereClause,
                distinct: true,
                col: 'id',
                include: includeClause
            });

            const bookings = await db.bookings.findAll({
                where: whereClause,
                offset: offset,
                limit: limit,
                order: [["id", "DESC"]],
                include: includeClause,
                subQuery: false,
            });

            return helper.success(res, "All bookings details", {
                data: bookings,
                total: totalBookings,
                page,
                limit,
                totalPages: Math.ceil(totalBookings / limit),
            });
        } catch (error) {
            console.error("Booking list error:", error);
            return helper.error(res, error.message);
        }
    },
    bookingDelete: async (req, res) => {
        try {
            const { id } = req.params;

            const League = await db.bookings.findOne({ where: { id } });
            await db.bookings.destroy({ where: { id } });

            return helper.success(res, "Booking deleted successfully");
        } catch (error) {
            return helper.error(res, error.message);
        }
    },

};
