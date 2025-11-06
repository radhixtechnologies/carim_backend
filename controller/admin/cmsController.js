const sequelize = require("sequelize")
const db = require("../../models")



module.exports = {

    termCondition: async (req, res) => {
        try {
            if (!req.session.users) {
                return res.redirect("/")
            }
            let data = await db.cms.findOne({ where: { type: 0 } })
            res.render("cms/termCondition.ejs", {
                session: req.session.users,
                data
            })

        } catch (error) {
            req.flash("error", error.message);
            console.log(error, "error");
        }
    },

    updateTermCms: async (req, res) => {
        try {
            const data = await db.cms.update(
                {
                    title: req.body.title,
                    content: req.body.editor1
                },
                {
                    where: { type: 0 }
                }
            );
            // req.flash("msg", "Terms & Conditions updated successfully");
            res.redirect('/termCondition');
        } catch (error) {
            console.error("Error updating Terms & Conditions:", error);
        }
    },

    privacyPolicy: async (req, res) => {
        try {
            if (!req.session.users) {
                return res.redirect("/")
            }
            let data = await db.cms.findOne({ where: { type: 1 } })
            res.render("cms/privacyPolicy.ejs", {
                session: req.session.users,
                data
            })

        } catch (error) {
            // req.flash("error", error.message);
            console.log(error, "error");
        }
    },
    updatePrivacyCms: async (req, res) => {
        try {
            const data = await db.cms.update(
                {
                    title: req.body.title,
                    content: req.body.editor1
                },
                {
                    where: { type: 1 }
                }
            )
            // req.flash("msg", "Privacy Policy Update Successfully")
            res.redirect("/privacyPolicy")
        } catch (error) {
            console.log(error);
        }
    },

    aboutus: async (req, res) => {
        try {
            if (!req.session.users) {
                return res.redirect("/")
            }
            let data = await db.cms.findOne({ where: { type: 2 } })
            res.render("cms/aboutus.ejs", {
                session: req.session.users,
                data
            })

        } catch (error) {
            // req.flash("error", error.message);
            console.log(error, "error");
        }
    },
    updateAboutCms: async (req, res) => {
        try {
            const data = await db.cms.update(
                {
                    title: req.body.title,
                    content: req.body.editor1
                },
                {
                    where: { type: 2 }
                }
            )
            // req.flash("msg", "About Us Update Successfully")
            res.redirect("/aboutUs")
        } catch (error) {
            console.log(error);
        }
    },
}