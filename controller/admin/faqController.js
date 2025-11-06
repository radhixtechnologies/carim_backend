const sequelize = require("sequelize");
const db = require("../../models");



module.exports = {


    createfaqs: async (req, res) => {
        try {
            const faqss = await db.faq.create({
                question: req.body.question,
                answer: req.body.answer
            });
            const result = await faqss.save();
            // req.flash("msg", "FAQ Added Successfully!");
            return res.status(200).send({
                data: result,
                messages: "Faqs Create Successfully",
                success: true,
            });

        } catch (error) {
            return res.status(400).send({
                message: "Enternal Server Error",
                success: true,
                error: error.message,
            });
        }
    },
    faqListing: async (req, res) => {
        try {
            if (!req.session.users) {
                return res.redirect("/");
            }
            const faqss = await db.faq.findAll({
                order: [['id', 'DESC']]
            })
            res.render("faq/faqList.ejs", {
                session: req.session.users,
                faqss,

            })

        } catch (error) {
            // req.flash("error", error.message);
            console.log(error, "error");
        }
    },
    faqsdelete: async (req, res) => {
        try {
            let dataid = req.params.id;
            let faqss = await db.faq.destroy({ where: { id: dataid } });

            if (faqss) {
                return res.status(200).json({ success: true, message: "FAQ deleted successfully" });
            } else {
                return res.status(404).json({ success: false, message: "FAQ not found" });
            }
        } catch (error) {
            console.error(error);
        }
    },
    faqsUpdate: async (req, res) => {
        try {
            const { question, answer } = req.body;
            let faqss = await db.faq.update(
                { question, answer },
                {
                    where: { id: req.body.id }
                }
            );
            if (faqss) {
                // req.flash("msg", "Faq Updated Successfully");
                res.redirect("/faqListing");
            }
        } catch (error) {
            console.log(error);
        }
    },


}