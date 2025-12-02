let db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;



module.exports = function (io) {
  io.on("connection", function (socket) {
    socket.on("connectUser", async (connectListener) => {
      try {
        const { userId } = connectListener;

        if (!userId) {
          return socket.emit("connectUser", {
            success: false,
            message: "User ID is required",
          });
        }
        const user = await db.users.findOne({
          where: { id: userId },
          raw: true,
        });

        if (!user) {
          return socket.emit("connectUser", {
            success: false,
            message: "User not found",
          });
        }

        await db.users.update(
          {
            socketId: socket.id,
            online: 1,
          },
          {
            where: { id: userId },
          }
        );

        socket.emit("connectUser", {
          success: true,
          message: "Connected successfully",
          socketId: socket.id,
        });
      } catch (error) {
        console.error("Error in connectUser:", error);
        socket.emit("connectUser", {
          success: false,
          message: "Internal server error",
        });
      }
    });
    socket.on("unreadNotificationCount", async (data) => {
      try {
        const { receiverId } = data;

        const unreadCount = await db.notifications.count({
          where: {
            receiverId: receiverId,
            isRead: '0',
          },
          raw: true,
        });

        socket.emit("unreadNotificationCount", {
          successMessage: "Unread count retrieved successfully",
          count: unreadCount,
        });
      } catch (error) {
        socket.emit("unreadNotificationCount", {
          error_message: "Failed to retrieve notification count",
          code: 500,
          error: error.message,
        });
      }
    });
    socket.on("readNotification", async (data) => {
      try {
        const { receiverId } = data;

        const [updatedCount] = await db.notifications.update(
          {
            isRead: '1',
          },
          {
            where: {
              receiverId: receiverId,
              isRead: '0',
            },
          }
        );

        socket.emit("readNotification", {
          successMessage: "Notifications marked as read successfully",
          count: updatedCount,
        });
      } catch (error) {
        console.error("Error marking notifications as read:", error);
        socket.emit("readNotification", {
          error_message: "Failed to mark notifications as read",
          code: 500,
          error: error.message,
        });
      }
    });
    
  });
};
