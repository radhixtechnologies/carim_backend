const jwt = require("jsonwebtoken");
const db = require('../models');
const secret = process.env.JWT_SECRET;
const helper = require("../helper/helper");
const { Validator } = require('node-input-validator');


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
        return helper.error(res, "Invalid token", 403);
      } else if (error.name === "TokenExpiredError") {
        return helper.failure(res, "Token expired", 400);
      }
      return helper.failure(res, "Token not found", 400);
    }
  },

 
  authenticateHeader: async function (req, res, next) {
    const v = new Validator(req.headers, {
      secret_key: "required|string",
      publish_key: "required|string",
    });

    let errorsResponse = await helper.checkValidation(v);

    if (errorsResponse) {
      return helper.failure(res, errorsResponse);
    }


    if (
      req.headers.secret_key == process.env.secret_key &&
      req.headers.publish_key == process.env.publish_key
    ) {
      next();
    } else {
      return helper.failure(res, "Key not matched!");
    }
  },
  verifyUser: async (req, res, next) => {
    try {
      if (!req.headers.authorization) {
        return helper.error(res, "Token missing.",);
      }

      const tokenParts = req.headers.authorization.split(' ');
      const accessToken = tokenParts[1];

      const decoded = jwt.verify(accessToken, secret);
   
      const userData = await db.users.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });
     
      if (!userData) {
        return helper.error(res, "Invalid token or user not found.");
      }

       const userData1 = await db.users.findOne({
        attributes: { exclude: ["password"] },
        where : {
          id: decoded.id,
          loginTime : decoded.loginTime
        }
      });


      // if (userData.deviceToken && userData.deviceToken !== decoded.deviceToken) {
      //   await db.users.update(
      //     {
      //       deviceToken: decoded.deviceToken,
      //       loginTime: new Date(),
      //     },
      //     {
      //       where: {
      //         id: decoded.id,
      //       },
      //     }
      //   );
      //   return helper.error8(res, "Session expired - logged in on another device",);
      // }
      if (!userData1) {
        return helper.error8(
          res,
          "Session expired - logged in on another device"
        );
      }
      if (userData.status === "0") {
        return helper.error2(res, "Your account has been deactivated by admin.");
      }

      req.user = userData;
      next();
    } catch (error) {
      return helper.error(res, "Invalid token",403);
    }
  },
};
