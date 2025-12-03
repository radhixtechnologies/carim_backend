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
    socket.on("updateLocation", async (data) => {
      try {
        const { userId, latitude, longitude, location } = data;

        if (!userId || latitude === undefined || longitude === undefined) {
          return socket.emit("updateLocation", {
            success: false,
            message: "User ID, latitude, and longitude are required"
          });
        }

        const driver = await db.users.findOne({
          where: {
            id: userId,
            role: '2'
          }
        });

        if (!driver) {
          return socket.emit("updateLocation", {
            success: false,
            message: "Driver not found"
          });
        }

        await db.users.update({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          location: location || null
        }, {
          where: {
            id: userId
          }
        });

        const updatedDriver = await db.users.findOne({
          where: { id: userId },
        });

        socket.emit("updateLocation", {
          success: true,
          message: "Location updated successfully",
          data: {
            driverId: updatedDriver.id,
            latitude: updatedDriver.latitude,
            longitude: updatedDriver.longitude,
            location: updatedDriver.location
          }
        });
        socket.broadcast.emit("updateLocation", {
          driverId: updatedDriver.id,
          latitude: updatedDriver.latitude,
          longitude: updatedDriver.longitude,
          location: updatedDriver.location,
        });

      } catch (error) {
        console.error("Error updating location:", error);
        socket.emit("updateLocation", {
          success: false,
          message: "Something went wrong while updating location",
          error: error.message
        });
      }
    });
    socket.on("rideStatusUpdate", async (data) => {
      try {
        const { bookingId, status, otp, driverId } = data;

        if (!bookingId || !status || !driverId) {
          return socket.emit("rideStatusUpdate", {
            success: false,
            message: "Booking ID, status, and driver ID are required."
          });
        }

        if (!['0', '1', '2', '3', '4'].includes(status)) {
          return socket.emit("rideStatusUpdate", {
            success: false,
            message: "Invalid status value."
          });
        }

        const booking = await db.bookings.findOne({
          where: {
            id: bookingId,
            driverId: driverId,
          },
          include: [{
            model: db.users,
            as: 'userbook',
            attributes: ['id', 'rideOtp', 'socketId']
          }]
        });

        if (!booking) {
          return socket.emit("rideStatusUpdate", {
            success: false,
            message: "Booking not found",
            code: 404
          });
        }

        const currentStatus = booking.status;

        if (status === '2') {
          if (currentStatus === '2') {
            return socket.emit("rideStatusUpdate", {
              success: false,
              message: "Ride already started."
            });
          }

          if (!otp) {
            return socket.emit("rideStatusUpdate", {
              success: false,
              message: "OTP is required to start the ride."
            });
          }

          if (!booking.userbook) {
            return socket.emit("rideStatusUpdate", {
              success: false,
              message: "User not found for this booking."
            });
          }

          if (booking.userbook.rideOtp !== otp) {
            return socket.emit("rideStatusUpdate", {
              success: false,
              message: "OTP does not match. Please enter correct OTP."
            });
          }

          await db.bookings.update({
            status: status,
            otpbooking: otp
          }, {
            where: { id: bookingId }
          });

          if (booking.userbook && booking.userbook.socketId) {
            io.to(booking.userbook.socketId).emit("rideStatusUpdated", {
              success: true,
              message: "Ride has started",
              bookingId: booking.id,
              status: status
            });
          }

          return socket.emit("rideStatusUpdate", {
            success: true,
            message: "Ride started successfully",
            data: {
              bookingId: booking.id,
              status: status,
              otpVerified: true
            }
          });
        }

        if (status === '3' || status === '4') {
          if (currentStatus !== '2') {
            const action = status === '3' ? 'finish' : 'cancel';
            return socket.emit("rideStatusUpdate", {
              success: false,
              message: `Cannot ${action} ride. Ride must be started first (status 2).`
            });
          }

          await booking.update({ status: status });

          if (booking.userbook && booking.userbook.socketId) {
            io.to(booking.userbook.socketId).emit("rideStatusUpdated", {
              success: true,
              message: `Ride ${status === '3' ? 'finished' : 'cancelled'} successfully`,
              bookingId: booking.id,
              status: status
            });
          }

          return socket.emit("rideStatusUpdate", {
            success: true,
            message: `Ride ${status === '3' ? 'finished' : 'cancelled'} successfully`,
            data: {
              bookingId: booking.id,
              status: status
            }
          });
        }

        if (['0', '1'].includes(status)) {
          if (currentStatus >= '2') {
            return socket.emit("rideStatusUpdate", {
              success: false,
              message: `Cannot change status to ${status} after ride has started.`
            });
          }

          await booking.update({ status: status });

          if (booking.userbook && booking.userbook.socketId) {
            io.to(booking.userbook.socketId).emit("rideStatusUpdated", {
              success: true,
              message: "Ride status updated",
              bookingId: booking.id,
              status: status
            });
          }

          return socket.emit("rideStatusUpdate", {
            success: true,
            message: "Ride status updated successfully",
            data: {
              bookingId: booking.id,
              status: status
            }
          });
        }

        return socket.emit("rideStatusUpdate", {
          success: false,
          message: "Invalid status operation."
        });

      } catch (error) {
        console.error("Error updating ride status:", error);
        return socket.emit("rideStatusUpdate", {
          success: false,
          message: "Something went wrong while updating ride status.",
          error: error.message
        });
      }
    });

  });
};
