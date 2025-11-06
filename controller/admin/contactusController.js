
const sequelize = require("sequelize");
const db = require("../../models");



module.exports = {

    contactListing: async (req, res) => {
        try {
            if (!req.session.users) {
                return res.redirect("/");
            }
            const contactUsData = await db.contactus.findAll({
                order: [['id', 'DESC']]
            })
            res.render("contactus/contactusList.ejs", {
                session: req.session.users,
                contactUsData
            })

        } catch (error) {
            // req.flash("error", error.message);
            console.log(error, "error");
        }
    },
    deleteContact: async (req, res) => {
        try {
            const dataid = req.params.id;
            const deleted = await db.contactus.destroy({ where: { id: dataid } });

            if (deleted) {
                return res.status(200).json({
                    success: true,
                    message: "Contact deleted successfully",
                });
            }
        } catch (error) {
            console.error("Error deleting contact:", error);
        }
    },

}