const db = require('../../models'); 
const helper = require('../../helper/helper');

module.exports = {
    privacy_policy: async (req, res) => {
        try {
            let data = await db.cms.findOne({ where: { type: 1 } });
            if (!data) {
                data = { title: "Privacy Policy", content: "<p>Privacy policy content</p>" };
            }
            return res.status(200).json({ message: "Privacy policy retrieved successfully.", data });
        } catch (error) {
            return helper.error(res, error);
        }
    },
    privacypolicy: async (req, res) => {
        try {
            const { title, content } = req.body;
            let existing = await db.cms.findOne({ where: { type: 1 } });
            if (existing) {
                await db.cms.update(
                    { title: title || existing.title || "Privacy Policy", content },
                    { where: { type: 1 } }
                );
            } else {
                await db.cms.create({
                    type: 1,
                    title: title || "Privacy Policy",
                    content
                });
            }
            return res.status(200).json({ message: "Privacy policy updated successfully." });
        } catch (error) {
            return helper.error(res, error);
        }
    },
    aboutus: async (req, res) => {
        try {
            let data = await db.cms.findOne({ where: { type: 2 } });
            if (!data) {
                data = { title: "About Us", content: "<p>About us content</p>" };
            }
            return res.status(200).json({ message: "About Us retrieved successfully.", data });
        } catch (error) {
            return helper.error(res, error);
        }
    },
    updateabout: async (req, res) => {
        try {
            const { title, content } = req.body;
            let existing = await db.cms.findOne({ where: { type: 2 } });
            if (existing) {
                await db.cms.update(
                    { title: title || existing.title || "About Us", content },
                    { where: { type: 2 } }
                );
            } else {
                await db.cms.create({
                    type: 2,
                    title: title || "About Us",
                    content
                });
            }
            return res.status(200).json({ message: "About Us updated successfully." });
        } catch (error) {
            return helper.error(res, error);
        }
    },
    term: async (req, res) => {
        try {
            let data = await db.cms.findOne({ where: { type: 3 } });
            if (!data) {
                data = { title: "Terms and Conditions", content: "<p>Terms and conditions content</p>" };
            }
            return res.status(200).json({ message: "Terms and Conditions retrieved successfully.", data });
        } catch (error) {
            return helper.error(res, error);
        }
    },
    updateterm: async (req, res) => {
        try {
            const { title, content } = req.body;
            let existing = await db.cms.findOne({ where: { type: 3 } });
            if (existing) {
                await db.cms.update(
                    { title: title || existing.title || "Terms and Conditions", content },
                    { where: { type: 3 } }
                );
            } else {
                await db.cms.create({
                    type: 3,
                    title: title || "Terms and Conditions",
                    content
                });
            }
            return res.status(200).json({ message: "Terms and Conditions updated successfully." });
        } catch (error) {
            return helper.error(res, error);
        }
    }
};
