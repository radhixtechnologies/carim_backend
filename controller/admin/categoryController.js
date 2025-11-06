const sequelize = require("sequelize")


module.exports = {

    categoryListing: async (req, res) => {
        try {
            res.render("category/categoryList.ejs")

        } catch (error) {
            req.flash("error", error.message);
            console.log(error, "error");
        }
    },

}