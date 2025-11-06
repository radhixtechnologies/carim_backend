const sequelize = require("sequelize")
const { Validator } = require("node-input-validator")
const path = require('path')
const helper = require("../../middleWare/helper")
const { fileUpload } = require("../../middleWare/helper")
const db = require("../../models")
const session = require("express-session")
const bcrypt = require("bcrypt")
const { raw } = require("mysql")
const { Where } = require("sequelize/lib/utils")
const { table } = require("console")
const saltRound = 10

module.exports = {

    login: async (req, res) => {
        try {
            //  const msg = req.flash("msg");
            res.render("admin/login",
                {
                    // msg,
                    // error: req.flash("error")    
                }
            )

        } catch (error) {
            // req.flash("error", error.message);
            console.log(error, "error");
        }
    },

    loginPost: async (req, res) => {
        try {
            let login = await db.users.findOne({ where: { email: req.body.email, role: 0 } })
            if (!login) {
                // req.flash("error", "Please enter correct email")
                res.redirect('/')
            }
            else if (login.isVerified === 0) {
                // req.flash("error", "Account not verified")
                res.redirect('/')
            }
            const password = await bcrypt.compare(req.body.password, login.password);
            if (!password) {
                // req.flash('error', "Wrong password")
                res.redirect('/')
            } else {
                req.session.users = login
                // req.flash("msg", "Login successfully")
                res.redirect("/dashboard")
            }
        } catch (error) {
            // req.flash('error', error.message)
            console.log(error, "error");
        }
    },

    changePasswordPage: async (req, res) => {
        try {
            if (!req.session.users) {
                return res.redirect("/");
            }
            res.render("admin/changePassword", {
                session: req.session.users,
            })

        } catch (error) {
            // req.flash("error", error.message);
            console.log(error, "error");
        }
    },

    changePassword: async (req, res) => {
        try {
            const data = await db.users.findOne({ where: { id: req.session.users.id } })
            const decryptPassword = await bcrypt.compare(req.body.oldPassword, data.password)
            if (!decryptPassword) {
                req.flash('error', 'Old password does not match')
                res.redirect('/changePasswordPage')
            } else {
                const encryptPassword = await bcrypt.hash(req.body.newPassword, saltRound)
                data.password = encryptPassword
                data.save()
                req.flash("msg", "password updated successfully")
                res.redirect('/dashboard')
            }
        } catch (error) {
            console.log(error, "error");

        }
    },

    editProfile: async (req, res) => {
        try {
            if (!req.session.users) {
                return res.redirect("/");
            }
            res.render("admin/editProfile", {
                session: req.session.users,
            })

        } catch (error) {
            // req.flash("error", error.message);
            console.log(error, "error");
        }
    },

    updateAdminProfile: async (req, res) => {
        try {
            if (!req.session.users || !req.session.users.id) {
                return helper.failed(res, "User session not found or missing _id");
            }
            if (req.files && req.files.image.name) {
                const image = req.files.image;
                if (image) req.body.image = await fileUpload(image, "userImage");
            }

            const updateAdminProfile = await db.users.update({
                name: req.body.name,
                image: req.body.image,
                email: req.body.email,
                phone: req.body.phone,
                address: req.body.address,
                countryCode: req.body.countryCode,
            },
                {
                    where: { id: req.session.users.id }
                },)

            let updatedUser = await db.users.findOne({
                where: { id: req.session.users.id },
                raw: true,
            })

            req.session.users = updatedUser
            // req.flash("msg", "Profile updated sucessfully")
            res.redirect("/dashboard")
        } catch (error) {
            console.log(error, "error");
        }
    },

    logout: async (req, res) => {
        try {
            req.session.destroy((err) => {
                if (err) {
                    console.log(err, "session destroy error");
                    return res.json({ success: false, message: "Logout failed" });
                }
                res.json({ success: true, message: "Logout Successfully" });
            });
        } catch (error) {
            console.log(error, "error");
            res.json({ success: false, message: error.message });
        }
    },







}