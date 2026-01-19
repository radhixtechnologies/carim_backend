const db = require('../../models');
const bcrypt = require('bcryptjs');
const helper = require('../../helper/helper');
const { Validator } = require('node-input-validator');
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");


module.exports = {
    // getAllFaqs: async (req, res) => {
    //     try {
    //         const userId = req.user?.id;
    //         if (!userId) {
    //             return helper.failure(res, "User ID is missing");
    //         }
    //         const data = await db.faqs.findAll();
    //         return helper.success(res, "FAQ data fetched successfully", data);

    //     } catch (error) {
    //         return helper.failure(res, "An error occurred while fetching FAQ data");
    //     }
    // },
    getAllFaqs: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default English
            const userId = req.user?.id;

            if (!userId) {
                let msg = "User ID is missing.";
                if (languageType === 1) msg = "معرّف المستخدم مفقود.";
                else if (languageType === 2) msg = "ID utilisateur manquant.";
                return helper.failure(res, msg);
            }

            const data = await db.faqs.findAll();

            let msg = "FAQ data fetched successfully.";
            if (languageType === 1) msg = "تم جلب بيانات الأسئلة الشائعة بنجاح.";
            else if (languageType === 2) msg = "Données FAQ récupérées avec succès.";

            return helper.success(res, msg, data);

        } catch (error) {
            console.error('getAllFaqs error:', error);

            const languageType = Number(req.headers.languagetype); // fallback
            let msg = "An error occurred while fetching FAQ data.";
            if (languageType === 1) msg = "حدث خطأ أثناء جلب بيانات الأسئلة الشائعة.";
            else if (languageType === 2) msg = "Une erreur s'est produite lors de la récupération des données FAQ.";

            return helper.failure(res, msg);
        }
    },

    getFaqs: async (req, res) => {
        try {
            const { id } = req.params
            const data = await db.faqs.findOne({ where: { id } })
            return helper.success(res, "Faq fetched successfully", data)
        } catch (error) {
            return helper.failure(res, "Something Went Wrong")
        }
    },
}