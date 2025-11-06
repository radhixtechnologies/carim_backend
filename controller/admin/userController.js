const sequelize = require("sequelize");
const db = require("../../models");
const helper = require("../../middleWare/helper")
const { fileUpload } = require("../../middleWare/helper")

module.exports = {


    dashboard: async (req, res) => {
        try {
            if (!req.session.users) {
                return res.redirect("/");
            }
            const usercount = (await db?.users?.count({ where: { role: 1 }, raw: true, })) || 0;
            const Activeusercount = (await db?.users?.count({ where: { role: 1, status: 1 }, raw: true, })) || 0;

            const drivercount = (await db?.users?.count({ where: { role: 2 }, raw: true, })) || 0;
            const ActiveDrivercount = (await db?.users?.count({ where: { role: 2, status: 1 }, raw: true, })) || 0;

            const contactCount = (await db?.contactus?.count({ raw: true })) || 0;
            const reportCount = (await db?.reports?.count({ raw: true })) || 0;
            const faqCount = (await db?.faq?.count({ raw: true })) || 0;


            res.render("common/dashboard.ejs", {
                session: req.session.users,
                usercount,
                Activeusercount,
                drivercount,
                ActiveDrivercount,
                contactCount,
                reportCount,
                faqCount,
            })

        } catch (error) {
            req.flash("error", error.message);
            console.log(error, "error");
        }
    },

    userListing: async (req, res) => {
        try {
            if (!req.session.users) {
                return res.redirect("/");
            }
            const userData = await db.users.findAll({
                where: { role: 1 },
                order: [['id', 'DESC']]
            })
            console.log(userData, "userDatauserDatauserData");

            res.render("users/userList.ejs", {
                session: req.session.users,
                userData
            })

        } catch (error) {
            req.flash("error", error.message);
            console.log(error, "error");
        }
    },

    driverListing: async (req, res) => {
        try {
            const userData = await db.users.findAll({
                where: { role: 2 },
                order: [['id', 'DESC']]
            })
            res.render("users/driverList.ejs", {
                session: req.session.users,
                userData
            })

        } catch (error) {
            req.flash("error", error.message);
            console.log(error, "error");
        }
    },

    deleteUser: async (req, res) => {
        try {
            const dataid = req.params.id;
            const deleted = await db.users.destroy({ where: { id: dataid } });
            if (deleted) {
                return res.status(200).json({
                    success: true,
                    message: "user deleted successfully",
                });
            }
        } catch (error) {
            console.log(error);
        }
    },
    deleteDriver: async (req, res) => {
        try {
            const dataid = req.params.id;
            const deleted = await db.users.destroy({ where: { id: dataid } });
            if (deleted) {
                return res.status(200).json({
                    success: true,
                    message: "user deleted successfully",
                });
            }
        } catch (error) {
            console.log(error);
        }
    },







}