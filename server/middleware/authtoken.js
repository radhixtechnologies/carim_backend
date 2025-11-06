const jwt = require("jsonwebtoken");
const db = require('../models');
const secret = process.env.JWT_SECRET;
const helper = require("../helper/helper");

module.exports = {
  verifyToken: async (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const findUser = await db.users.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });

      if (findUser.role === '3' && findUser.requestStatus !== '1') {
        return helper.failure(res, "You are not eligible to access this resource. Please wait.");
      }

      req.admin = findUser;
      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return helper.failure(res, "Invalid token", 400);
      } else if (error.name === "TokenExpiredError") {
        return helper.failure(res, "Token expired", 400);
      }
      return helper.failure(res, "Token not found", 400);
    }
  },

  authenticateJWT: async (req, res, next) => {
    try {
      const secretCryptoKey = ENV.encrypt_sec_key
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          code: 401,
          message: "Unauthorized: No token provided",
          body: {},
        });
      }

      const token = authHeader.split(" ")[1];

      jwt.verify(token, secretCryptoKey, async (err, payload) => {



        if (err) {
          return res.status(403).json({
            success: false,
            code: 401,
            message: "Forbidden: Invalid token",
            body: {},
          });
        }
        const existingUser = await db.users.findOne({ where: { id: payload.id, login_time: payload.login_time } });

        if (!existingUser) {
          return helper.forbidden(res, "Session expired because this email was logged in on another device.");
        }

        if (existingUser.status == 0) {
          return helper.forbidden(res, "Your account is in‑active by admin.");
        }
        if (!existingUser) {
          return res.status(404).json({
            success: false,
            code: 401,
            message: "Token expired",
            body: {},
          });
        }



        req.user = existingUser.dataValues;
        next();
      });
    } catch (error) {
      console.error("JWT Authentication Error:", error);
      return res.status(500).json({
        success: false,
        code: 500,
        message: "Internal Server Error",
        body: {},
      });
    }
  },
};
