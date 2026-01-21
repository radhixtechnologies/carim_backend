let db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const helper = require('../helper/helper');


global.onlineUsers = {};

module.exports = function (io) {
  io.on("connection", function (socket) {



    socket.on("connectUser", async ({ userId }) => {
      try {
        if (!userId) {
          return socket.emit("connectUser", {
            success: false,
            message: "User ID is required",
          });
        }

        const user = await db.users.findOne({ where: { id: userId } });
        if (!user) {
          return socket.emit("connectUser", {
            success: false,
            message: "User not found",
          });
        }

        // Initialize array if not exists
        if (!onlineUsers[userId]) {
          onlineUsers[userId] = [];
        }

        // Avoid duplicate socket
        if (!onlineUsers[userId].includes(socket.id)) {
          onlineUsers[userId].push(socket.id);
        }

        // Attach userId to socket
        socket.userId = userId;

        // Update DB (same as your logic)
        await db.users.update(
          {
            socketId: socket.id,
            online: "1",
          },
          { where: { id: userId } }
        );

        socket.emit("connectUser", {
          success: true,
          message: "Connected successfully",
          socketId: socket.id,
        });

        // Proper disconnect cleanup
        socket.on("disconnect", async () => {
          try {
            if (onlineUsers[userId]) {
              onlineUsers[userId] = onlineUsers[userId].filter(
                (sid) => sid !== socket.id
              );

              if (onlineUsers[userId].length === 0) {
                delete onlineUsers[userId];

                await db.users.update(
                  { online: "0", socketId: null },
                  { where: { id: userId } }
                );
              }
            }
          } catch (err) {
            console.error("Disconnect error:", err);
          }
        });

      } catch (error) {
        socket.emit("connectUser", {
          success: false,
          message: "Internal server error",
        });
      }
    });


    socket.on("unreadNotificationCount", async (data) => {
      try {
        const { receiverId, languagetype } = data;
        const lang = Number(data.languageType ?? data.languagetype) || 0;
        const getMessage = (en, ar, fr) => (lang === 1 ? ar : lang === 2 ? fr : en);


        if (!receiverId) {
          return socket.emit("unreadNotificationCount", {
            success: false,
            message: getMessage(
              "Receiver ID is required",
              "معرّف المستلم مطلوب",
              "ID du destinataire requis"
            )
          });
        }

        const unreadCount = await db.notifications.count({
          where: {
            receiverId: receiverId,
            isRead: '0',
          },
          raw: true,
        });

        socket.emit("unreadNotificationCount", {
          success: true,
          message: getMessage(
            "Unread count retrieved successfully",
            "تم استرجاع عدد الإشعارات غير المقروءة بنجاح",
            "Nombre de notifications non lues récupéré avec succès"
          ),
          count: unreadCount,
        });

      } catch (error) {
        const languageType = Number(data.languagetype) || 0;
        const getMessage = (en, ar, fr) => (languageType === 1 ? ar : languageType === 2 ? fr : en);

        socket.emit("unreadNotificationCount", {
          success: false,
          message: getMessage(
            "Failed to retrieve notification count",
            "فشل في استرجاع عدد الإشعارات",
            "Échec de la récupération du nombre de notifications"
          ),
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

        // ---------------- DRIVER CHECK ----------------
        const driver = await db.users.findOne({
          where: { id: userId, role: '2' }
        });

        if (!driver) {
          return socket.emit("updateLocation", {
            success: false,
            message: "Driver not found"
          });
        }

        // ---------------- UPDATE DRIVER LOCATION ----------------
        await db.users.update({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          location: location || null
        }, {
          where: { id: userId }
        });

        // OPEN RIDE LOGIC (rideOpen = 1 ONLY)
        const booking = await db.bookings.findOne({
          where: {
            driverId: userId,
            rideOpen: 1,
            status: '2', // ride started
            request: "1"
          }
        });

        if (booking) {
          const startLat = booking.lastLatitude
            ? parseFloat(booking.lastLatitude)
            : parseFloat(booking.pickupLatitude);

          const startLng = booking.lastLongitude
            ? parseFloat(booking.lastLongitude)
            : parseFloat(booking.pickupLongitude);

          const currLat = parseFloat(latitude);
          const currLng = parseFloat(longitude);

          if (
            !isNaN(startLat) &&
            !isNaN(startLng) &&
            !isNaN(currLat) &&
            !isNaN(currLng)
          ) {

            // ---------------- DISTANCE UTILS ----------------
            const toRad = v => v * Math.PI / 180;
            const calculateDistance = (a, b, c, d) => {
              const R = 6371;
              const dLat = toRad(c - a);
              const dLon = toRad(d - b);
              const x =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(a)) * Math.cos(toRad(c)) *
                Math.sin(dLon / 2) ** 2;
              return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
            };

            const segmentDistanceKm = calculateDistance(
              startLat,
              startLng,
              currLat,
              currLng
            );

            // GPS noise ignore
            if (segmentDistanceKm > 0 && segmentDistanceKm <= 30) {

              // ---------------- ADMIN PRICE PER KM ----------------
              const adminData = await db.users.findOne({
                where: { role: '0' },
                attributes: ['rideAmount'],
                raw: true
              });

              const pricePerKm = adminData?.rideAmount
                ? parseFloat(adminData.rideAmount)
                : 10;

              if (!isNaN(pricePerKm) && pricePerKm > 0) {

                const totalDistanceKm =
                  parseFloat(booking.travelledDistance || 0) + segmentDistanceKm;

                const newBookingPrice = Math.round(
                  totalDistanceKm * pricePerKm
                ).toString();

                // ---------------- UPDATE BOOKING ----------------
                await booking.update({
                  dropLatitude: currLat.toString(),
                  dropLongitude: currLng.toString(),
                  dropLocation: location || booking.dropLocation,
                  travelledDistance: totalDistanceKm.toString(),
                  bookingPrice: newBookingPrice,
                  lastLatitude: currLat.toString(),
                  lastLongitude: currLng.toString()
                });

                // ---------------- SOCKET UPDATE TO USER ----------------
                if (global.onlineUsers && onlineUsers[booking.userId]) {
                  onlineUsers[booking.userId].forEach(sockId => {
                    io.to(sockId).emit("rideStatusUpdate", {
                      bookingId: booking.id,
                      dropLatitude: currLat.toString(),
                      dropLongitude: currLng.toString(),
                      bookingPrice: newBookingPrice,
                      rideDistanceKm: totalDistanceKm.toFixed(2)
                    });
                  });
                }
              }
            }
          }
        }

        // ---------------- DRIVER RESPONSE----------------
        const updatedDriver = await db.users.findOne({
          where: { id: userId }
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
          location: updatedDriver.location
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




    // socket.on("rideStatusUpdate", async (data) => {
    //   try {
    //     const { bookingId, status, otp, driverId } = data;

    //     if (!bookingId || !status || !driverId) {
    //       return socket.emit("rideStatusUpdate", {
    //         success: false,
    //         message: "Booking ID, status, and driver ID are required."
    //       });
    //     }

    //     if (!['0', '1', '2', '3', '4'].includes(status)) {
    //       return socket.emit("rideStatusUpdate", {
    //         success: false,
    //         message: "Invalid status value."
    //       });
    //     }

    //     const booking = await db.bookings.findOne({
    //       where: { id: bookingId, driverId },
    //       include: [{
    //         model: db.users,
    //         as: 'userbook',
    //         attributes: [
    //           'id',
    //           'rideOtp',
    //           'socketId',
    //           'deviceToken',
    //           'status',
    //           'block',
    //           'suspend',
    //           'languagee_type'
    //         ]
    //       }]
    //     });

    //     if (!booking) {
    //       return socket.emit("rideStatusUpdate", {
    //         success: false,
    //         message: "Booking not found",
    //         code: 404
    //       });
    //     }

    //     const currentStatus = booking.status;

    //     const driver = await db.users.findOne({
    //       where: { id: driverId },
    //       attributes: [
    //         'id',
    //         'deviceToken',
    //         'status',
    //         'block',
    //         'suspend',
    //         'languagee_type'
    //       ],
    //       raw: true
    //     });

    //     if (!driver) {
    //       return socket.emit("rideStatusUpdate", {
    //         success: false,
    //         message: "Driver not found."
    //       });
    //     }

    //     if (driver.status === "0")
    //       return socket.emit("rideStatusUpdate", { success: false, message: "Driver deactivated" });
    //     if (driver.block === "1")
    //       return socket.emit("rideStatusUpdate", { success: false, message: "Driver blocked" });
    //     if (driver.suspend === "1")
    //       return socket.emit("rideStatusUpdate", { success: false, message: "Driver suspended" });

    //     const user = booking.userbook;

    //     if (!user)
    //       return socket.emit("rideStatusUpdate", {
    //         success: false,
    //         message: "User not found"
    //       });

    //     if (user.status === "0")
    //       return socket.emit("rideStatusUpdate", { success: false, message: "User deactivated" });
    //     if (user.block === "1")
    //       return socket.emit("rideStatusUpdate", { success: false, message: "User blocked" });
    //     if (user.suspend === "1")
    //       return socket.emit("rideStatusUpdate", { success: false, message: "User suspended" });

    //     // LANGUAGE HELPERS
    //     const getUserMsg = (en, ar, fr) =>
    //       user.languagee_type === 1 ? ar : user.languagee_type === 2 ? fr : en;

    //     const getDriverMsg = (en, ar, fr) =>
    //       driver.languagee_type === 1 ? ar : driver.languagee_type === 2 ? fr : en;

    //     // EMIT FUNCTION
    //     const emitToBoth = async (userMsg, driverMsg, statusData, otpVerified = false) => {

    //       await db.notifications.create({
    //         sender_id: driverId,
    //         receiver_id: user.id,
    //         bookingId: booking.id,
    //         type: Number(statusData),
    //         message: userMsg,
    //         is_read: 0,
    //         status: 0
    //       });

    //       await db.notifications.create({
    //         sender_id: user.id,
    //         receiver_id: driverId,
    //         bookingId: booking.id,
    //         type: Number(statusData),
    //         message: driverMsg,
    //         is_read: 0,
    //         status: 0
    //       });

    //       if (onlineUsers[user.id]) {
    //         onlineUsers[user.id].forEach(sid => {
    //           io.to(sid).emit("rideStatusUpdate", {
    //             success: true,
    //             message: userMsg,
    //             bookingId: booking.id,
    //             status: statusData,
    //             otpVerified
    //           });
    //         });
    //       }

    //       if (onlineUsers[driverId]) {
    //         onlineUsers[driverId].forEach(sid => {
    //           io.to(sid).emit("rideStatusUpdate", {
    //             success: true,
    //             message: driverMsg,
    //             bookingId: booking.id,
    //             status: statusData,
    //             otpVerified
    //           });
    //         });
    //       }
    //     };

    //     // STATUS FLOW
    //     switch (status) {

    //       case "1": // DRIVER ARRIVED
    //         if (currentStatus !== "0") return;

    //         await booking.update({ status: "1" });

    //         await emitToBoth(
    //           getUserMsg("Driver arrived", "وصل السائق", "Le conducteur est arrivé"),
    //           getDriverMsg("Driver arrived", "وصل السائق", "Le conducteur est arrivé"),
    //           "1"
    //         );

    //         if (user.deviceToken) {
    //           helper.sendNotification_android(user.deviceToken, {
    //             message: getUserMsg(
    //               "Your driver has arrived.",
    //               "وصل سائقك.",
    //               "Votre conducteur est arrivé."
    //             ),
    //             type: 7,
    //             senderId: driverId,
    //             bookingId: booking.id
    //           });
    //         }
    //         break;

    //       case "2": // START RIDE
    //         if (!otp || booking.userbook.rideOtp !== otp) {
    //           return socket.emit("rideStatusUpdate", {
    //             success: false,
    //             message: getDriverMsg(
    //               "OTP does not match.",
    //               "OTP غير متطابق.",
    //               "L'OTP ne correspond pas."
    //             )
    //           });
    //         }

    //         await booking.update({ status: "2", otpbooking: otp });

    //         await emitToBoth(
    //           getUserMsg("Ride has started", "تم بدء الرحلة", "Le trajet a commencé"),
    //           getDriverMsg("Ride has started", "تم بدء الرحلة", "Le trajet a commencé"),
    //           "2",
    //           true
    //         );

    //         //  PUSH TO USER - RIDE STARTED
    //         if (user.deviceToken) {
    //           helper.sendNotification_android(user.deviceToken, {
    //             message: getUserMsg(
    //               "Your ride has started.",
    //               "بدأت رحلتك.",
    //               "Votre trajet a commencé."
    //             ),
    //             type: 8,
    //             senderId: driverId,
    //             bookingId: booking.id
    //           });
    //         }
    //         break;

    //       case "3": // FINISHED
    //         if (currentStatus !== "2") return;

    //         await booking.update({ status: "3" });

    //         await emitToBoth(
    //           getUserMsg("Ride finished successfully", "تم الانتهاء من الرحلة بنجاح", "Trajet terminé avec succès"),
    //           getDriverMsg("Ride finished successfully", "تم الانتهاء من الرحلة بنجاح", "Trajet terminé avec succès"),
    //           "3"
    //         );

    //         //  PUSH TO USER - RIDE COMPLETED
    //         if (user.deviceToken) {
    //           helper.sendNotification_android(user.deviceToken, {
    //             message: getUserMsg(
    //               "Your ride has been completed.",
    //               "تم إكمال رحلتك.",
    //               "Votre trajet est terminé."
    //             ),
    //             type: 9,
    //             senderId: driverId,
    //             bookingId: booking.id
    //           });
    //         }
    //         break;

    //       case "4": // CANCELLED
    //         if (currentStatus !== "2") return;

    //         await booking.update({ status: "4" });

    //         await emitToBoth(
    //           getUserMsg("Ride cancelled successfully", "تم إلغاء الرحلة بنجاح", "Trajet annulé avec succès"),
    //           getDriverMsg("Ride cancelled successfully", "تم إلغاء الرحلة بنجاح", "Trajet annulé avec succès"),
    //           "4"
    //         );
    //         break;

    //       case "0": // ON THE WAY
    //         if (currentStatus >= "2") return;

    //         await booking.update({ status: "0" });

    //         await emitToBoth(
    //           getUserMsg("Driver on the way", "السائق في الطريق", "Le conducteur est en route"),
    //           getDriverMsg("Driver on the way", "السائق في الطريق", "Le conducteur est en route"),
    //           "0"
    //         );
    //         break;
    //     }

    //   } catch (error) {
    //     console.error("rideStatusUpdate error:", error);
    //     return socket.emit("rideStatusUpdate", {
    //       success: false,
    //       message: "Something went wrong while updating ride status.",
    //       error: error.message
    //     });
    //   }
    // });
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
          where: { id: bookingId, driverId },
          include: [{
            model: db.users,
            as: 'userbook',
            attributes: [
              'id',
              'rideOtp',
              'socketId',
              'deviceToken',
              'status',
              'block',
              'suspend',
              'languagee_type'
            ]
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

        const driver = await db.users.findOne({
          where: { id: driverId },
          attributes: [
            'id',
            'deviceToken',
            'status',
            'block',
            'suspend',
            'languagee_type'
          ],
          raw: true
        });

        if (!driver) {
          return socket.emit("rideStatusUpdate", {
            success: false,
            message: "Driver not found."
          });
        }

        if (driver.status === "0")
          return socket.emit("rideStatusUpdate", { success: false, message: "Driver deactivated" });
        if (driver.block === "1")
          return socket.emit("rideStatusUpdate", { success: false, message: "Driver blocked" });
        if (driver.suspend === "1")
          return socket.emit("rideStatusUpdate", { success: false, message: "Driver suspended" });

        const user = booking.userbook;

        if (!user) {
          return socket.emit("rideStatusUpdate", {
            success: false,
            message: "User not found"
          });
        }

        if (user.status === "0")
          return socket.emit("rideStatusUpdate", { success: false, message: "User deactivated" });
        if (user.block === "1")
          return socket.emit("rideStatusUpdate", { success: false, message: "User blocked" });
        if (user.suspend === "1")
          return socket.emit("rideStatusUpdate", { success: false, message: "User suspended" });

        // ================= LANGUAGE HELPERS =================
        const getUserMsg = (en, ar, fr) =>
          user.languagee_type === 1 ? ar : user.languagee_type === 2 ? fr : en;

        const getDriverMsg = (en, ar, fr) =>
          driver.languagee_type === 1 ? ar : driver.languagee_type === 2 ? fr : en;

        // ================= EMIT FUNCTION =================
        const emitToBoth = async (
          userMsg,
          driverMsg,
          statusData,
          otpVerified = false
        ) => {

          // ✅ USER DB NOTIFICATION ONLY
          await db.notifications.create({
            sender_id: driverId,
            receiver_id: user.id,
            bookingId: booking.id,
            type: Number(statusData),
            message: userMsg,
            is_read: 0,
            status: 0
          });

          // SOCKET → USER
          if (onlineUsers[user.id]) {
            onlineUsers[user.id].forEach(sid => {
              io.to(sid).emit("rideStatusUpdate", {
                success: true,
                message: userMsg,
                bookingId: booking.id,
                status: statusData,
                otpVerified
              });
            });
          }

          // SOCKET → DRIVER (NO DB / NO PUSH)
          if (onlineUsers[driverId]) {
            onlineUsers[driverId].forEach(sid => {
              io.to(sid).emit("rideStatusUpdate", {
                success: true,
                message: driverMsg,
                bookingId: booking.id,
                status: statusData,
                otpVerified
              });
            });
          }
        };

        // ================= STATUS FLOW =================
        switch (status) {

          case "1": // DRIVER ARRIVED
            if (currentStatus !== "0") return;

            await booking.update({ status: "1" });

            await emitToBoth(
              getUserMsg("Driver arrived", "وصل السائق", "Le conducteur est arrivé"),
              getDriverMsg("Driver arrived", "وصل السائق", "Le conducteur est arrivé"),
              "1"
            );

            // ✅ PUSH → USER ONLY
            if (user.deviceToken) {
              helper.sendNotification_android(user.deviceToken, {
                message: getUserMsg(
                  "Your driver has arrived.",
                  "وصل سائقك.",
                  "Votre conducteur est arrivé."
                ),
                type: 7,
                senderId: driverId,
                bookingId: booking.id
              });
            }
            break;

          case "2": // START RIDE
            if (!otp || booking.userbook.rideOtp !== otp) {
              return socket.emit("rideStatusUpdate", {
                success: false,
                message: getDriverMsg(
                  "OTP does not match.",
                  "OTP غير متطابق.",
                  "L'OTP ne correspond pas."
                )
              });
            }

            await booking.update({ status: "2", otpbooking: otp });

            await emitToBoth(
              getUserMsg("Ride has started", "تم بدء الرحلة", "Le trajet a commencé"),
              getDriverMsg("Ride has started", "تم بدء الرحلة", "Le trajet a commencé"),
              "2",
              true
            );

            if (user.deviceToken) {
              helper.sendNotification_android(user.deviceToken, {
                message: getUserMsg(
                  "Your ride has started.",
                  "بدأت رحلتك.",
                  "Votre trajet a commencé."
                ),
                type: 8,
                senderId: driverId,
                bookingId: booking.id
              });
            }
            break;

          case "3": // FINISHED
            if (currentStatus !== "2") return;

            await booking.update({ status: "3" });

            await emitToBoth(
              getUserMsg("Ride finished successfully", "تم الانتهاء من الرحلة بنجاح", "Trajet terminé avec succès"),
              getDriverMsg("Ride finished successfully", "تم الانتهاء من الرحلة بنجاح", "Trajet terminé avec succès"),
              "3"
            );

            if (user.deviceToken) {
              helper.sendNotification_android(user.deviceToken, {
                message: getUserMsg(
                  "Your ride has been completed.",
                  "تم إكمال رحلتك.",
                  "Votre trajet est terminé."
                ),
                type: 9,
                senderId: driverId,
                bookingId: booking.id
              });
            }
            break;

          case "4": // CANCELLED
            if (currentStatus !== "2") return;

            await booking.update({ status: "4" });

            await emitToBoth(
              getUserMsg("Ride cancelled successfully", "تم إلغاء الرحلة بنجاح", "Trajet annulé avec succès"),
              getDriverMsg("Ride cancelled successfully", "تم إلغاء الرحلة بنجاح", "Trajet annulé avec succès"),
              "4"
            );
            break;

          case "0": // ON THE WAY
            if (currentStatus >= "2") return;

            await booking.update({ status: "0" });

            await emitToBoth(
              getUserMsg("Driver on the way", "السائق في الطريق", "Le conducteur est en route"),
              getDriverMsg("Driver on the way", "السائق في الطريق", "Le conducteur est en route"),
              "0"
            );
            break;
        }

      } catch (error) {
        console.error("rideStatusUpdate error:", error);
        return socket.emit("rideStatusUpdate", {
          success: false,
          message: "Something went wrong while updating ride status.",
          error: error.message
        });
      }
    });







    socket.on("bookingHistory", async (data) => {
      try {
        const { userId, status, page = 1, limit = 10, languagetype } = data;
        const lang = Number(data.languageType ?? data.languagetype) || 0;
        const getMessage = (en, ar, fr) => (lang === 1 ? ar : lang === 2 ? fr : en);


        if (!userId) {
          return socket.emit("bookingHistory", {
            success: false,
            message: getMessage(
              "User ID is required",
              "معرّف المستخدم مطلوب",
              "ID utilisateur requis"
            )
          });
        }

        // ------------------- USER STATUS CHECK -------------------
        const userStatus = await db.users.findOne({
          where: { id: userId },
          attributes: ['status', 'block', 'suspend'],
          raw: true
        });

        if (!userStatus) {
          return socket.emit("bookingHistory", {
            success: false,
            message: getMessage(
              "User not found.",
              "المستخدم غير موجود.",
              "Utilisateur introuvable."
            )
          });
        }

        if (userStatus.status === "0") {
          return socket.emit("bookingHistory", {
            success: false,
            message: getMessage(
              "Your account has been deactivated by admin.",
              "تم تعطيل حسابك من قبل المسؤول.",
              "Votre compte a été désactivé par l'administrateur."
            )
          });
        }

        if (userStatus.block === "1") {
          return socket.emit("bookingHistory", {
            success: false,
            message: getMessage(
              "Your account has been blocked by admin.",
              "تم حظر حسابك من قبل المسؤول.",
              "Votre compte a été bloqué par l'administrateur."
            )
          });
        }

        if (userStatus.suspend === "1") {
          return socket.emit("bookingHistory", {
            success: false,
            message: getMessage(
              "Your account has been suspended by admin.",
              "تم تعليق حسابك من قبل المسؤول.",
              "Votre compte a été suspendu par l'administrateur."
            )
          });
        }
        // ------------------- USER STATUS CHECK END -------------------

        const offset = (page - 1) * limit;

        // STATUS CONDITION
        let statusCondition = {};
        if (status !== undefined && status !== null && status !== "") {
          if (['0', '1', '2'].includes(status)) {
            statusCondition = { status: { [Op.in]: ['0', '1', '2'] } };
          } else if (status === '3') {
            statusCondition = { status: { [Op.in]: ['3', '4', '5'] } };
          } else if (status === '4') {
            statusCondition = { status: { [Op.in]: ['4', '5'] } };
          } else {
            statusCondition = { status: status };
          }
        }

        const whereCondition = {
          [Op.or]: [{ driverId: userId }, { userId: userId }],
          ...statusCondition,
          request: { [Op.in]: ['1', '2'] }
        };

        const totalBookings = await db.bookings.count({ where: whereCondition });

        const bookings = await db.bookings.findAll({
          where: whereCondition,
          include: [
            {
              model: db.users,
              as: "driverbook",
              include: [
                {
                  model: db.vehicleDetails,
                  as: "vehicleDetail",
                  required: false
                }
              ]
            },
            {
              model: db.users,
              as: "userbook"
            }
          ],
          limit: parseInt(limit),
          offset,
          order: [["id", "DESC"]]
        });

        socket.emit("bookingHistory", {
          success: true,
          message: getMessage(
            "Booking history fetched successfully",
            "تم جلب سجل الحجز بنجاح",
            "Historique des réservations récupéré avec succès"
          ),
          data: {
            totalBookings,
            currentPage: page,
            totalPages: Math.ceil(totalBookings / limit),
            bookings: bookings.map(booking => ({
              bookingId: booking.id,
              orderId: booking.orderId,
              driverId: booking.driverId,
              driverDetails: booking.driverbook,
              vehicleDetail: booking.driverbook?.vehicleDetail,
              userDetails: booking.userbook,
              pickupLocation: booking.pickupLocation,
              dropLocation: booking.dropLocation,
              pickupLatitude: booking.pickupLatitude,
              pickupLongitude: booking.pickupLongitude,
              dropLatitude: booking.dropLatitude,
              dropLongitude: booking.dropLongitude,
              status: booking.status,
              request: booking.request,
              bookingDate: booking.bookingDate,
              bookingPrice: booking.bookingPrice,
              rideOpen: booking.rideOpen
            }))
          }
        });

      } catch (error) {
        const languageType = Number(data.languagetype) || 0;
        const getMessage = (en, ar, fr) => {
          if (languageType === 1) return ar;
          if (languageType === 2) return fr;
          return en;
        };

        socket.emit("bookingHistory", {
          success: false,
          message: getMessage(
            "Something went wrong while fetching booking history.",
            "حدث خطأ أثناء جلب سجل الحجز.",
            "Une erreur est survenue lors de la récupération de l'historique des réservations."
          ),
          error: error.message
        });
      }
    });

    socket.on("onlineStatusUpdate", async (data) => {
      try {
        const { userId, status } = data;
        // status = '1' => online, status = '0' => offline

        const [updated] = await db.users.update(
          { online: status },
          {
            where: {
              id: userId
            }
          }
        );

        socket.emit("onlineStatusUpdate", {
          successMessage: "Online status updated successfully",
          updated: updated,
          status: status
        });

        // broadcast to others also
        socket.broadcast.emit("userOnlineStatus", {
          userId: userId,
          status: status
        });

      } catch (error) {
        console.error("Error updating online status:", error);
        socket.emit("onlineStatusUpdate", {
          error_message: "Failed to update online status",
          code: 500,
          error: error.message
        });
      }
    });

    socket.on('cont_unread_msg', async (get_data) => {
      try {

        if (!get_data.reciever_id || !get_data.sender_id) {
          console.error("Invalid sender_id or reciever_id:", get_data);
          return;
        }

        const senderId = Number(get_data.sender_id);
        const receiverId = Number(get_data.reciever_id);

        if (isNaN(senderId) || isNaN(receiverId)) {
          console.error("Invalid sender or receiver ID:", get_data);
          return;
        }

        await db.message.update(
          {
            readStatus: 1,
          },
          {
            where: {
              sender_id: senderId,
              reciever_id: receiverId,
              deletedAt: null,
              readStatus: 0
            },
          }
        );

        socket.emit("cont_unread_msg", { success_message: "Read Status changed successfully" });
      } catch (error) {
        console.error("Error updating read status:", error);
      }
    });


    socket.on("user_constant_list", async (get_data) => {
      try {

        let whereCondition = {
          [Op.or]: [
            { sender_id: get_data.sender_id },
            { reciever_id: get_data.sender_id },
          ],
          deletedId: { [Op.not]: get_data.sender_id },
        };

        if (get_data.bookingId) {
          whereCondition.bookingId = get_data.bookingId;
        }

        whereCondition.bookingId = {
          [Op.in]: Sequelize.literal(`(
        SELECT id FROM bookings 
        WHERE status NOT IN ('3','4','5') 
        AND request != '2'
      )`)
        };

        let constantList = await db.chat_constant.findAll({
          attributes: {
            include: [
              [
                Sequelize.literal(
                  `CASE 
                WHEN chat_constant.reciever_id = ${get_data.sender_id}
                THEN chat_constant.sender_id 
                ELSE chat_constant.reciever_id 
              END`
                ),
                "Receiver_user_id",
              ],
              [
                Sequelize.literal(
                  `IFNULL((SELECT message FROM message 
                WHERE message.id = chat_constant.lastMessage_id 
                AND deletedId != ${get_data.sender_id}), "")`
                ),
                "last_msg",
              ],
              [
                Sequelize.literal(
                  `(SELECT createdAt FROM message 
                WHERE message.reciever_id = chat_constant.reciever_id 
                AND message.sender_id= chat_constant.sender_id 
                ORDER BY id DESC LIMIT 1)`
                ),
                "CreatedAt",
              ],
              [
                Sequelize.literal(
                  `(SELECT COUNT(*) FROM message 
                WHERE message.reciever_id = ${get_data.sender_id} 
                AND message.sender_id = Receiver_user_id 
                AND message.readStatus = 0)`
                ),
                "unread_msg",
              ],
              [
                Sequelize.literal(
                  "(SELECT orderId FROM bookings WHERE bookings.id = chat_constant.bookingId)"
                ),
                "orderId",
              ],
              [
                Sequelize.literal(
                  "(SELECT CONCAT(firstName,' ',lastName) FROM users WHERE users.id = Receiver_user_id)"
                ),
                "ReceiverName",
              ],
              [
                Sequelize.literal(
                  "(SELECT image FROM users WHERE users.id = Receiver_user_id)"
                ),
                "Receiverimage",
              ],
              [
                Sequelize.literal(
                  "(SELECT online FROM users WHERE users.id = Receiver_user_id)"
                ),
                "online",
              ],
            ],
          },
          where: whereCondition,
          order: [
            [
              Sequelize.literal(
                `(SELECT createdAt FROM message 
              WHERE message.reciever_id = chat_constant.reciever_id 
              AND message.sender_id = chat_constant.sender_id 
              ORDER BY id DESC LIMIT 1)`
              ),
              "DESC",
            ],
          ],
        });


        const filteredList = [];

        for (let chat of constantList) {

          const senderId = get_data.sender_id;
          const receiverId = chat.dataValues.Receiver_user_id;

          // Fetch BOTH users status in one go
          const usersStatus = await db.users.findAll({
            where: {
              id: { [Op.in]: [senderId, receiverId] }
            },
            attributes: ['id', 'status', 'block', 'suspend'],
            raw: true
          });

          let invalidUser = usersStatus.find(
            u => u.status === "0" || u.block === "1" || u.suspend === "1"
          );

          if (invalidUser) {
            continue;
          }

          filteredList.push(chat);
        }

        socket.emit("user_constant_list", filteredList);

      } catch (error) {
        console.log(error);
        socket.emit("user_constant_list", []);
      }
    });



    socket.on("send_message", async (get_data) => {
      try {
        /* -------------------- BOOKING CHECK -------------------- */
        if (get_data.bookingId) {
          const bookingExist = await db.bookings.findOne({
            where: { id: get_data.bookingId },
          });

          if (!bookingExist) {
            return socket.emit("send_message", {
              success: false,
              message: "Invalid bookingId - Booking not found!",
            });
          }
        }

        /* ------------------ FIND / CREATE CHAT CONSTANT ------------------ */
        let findConstant = await db.chat_constant.findOne({
          where: {
            [Op.or]: [
              { sender_id: get_data.sender_id, reciever_id: get_data.reciever_id },
              { sender_id: get_data.reciever_id, reciever_id: get_data.sender_id },
            ],
            ...(get_data.bookingId && { bookingId: get_data.bookingId }),
          },
          raw: true,
        });

        let chatConstantId;

        if (!findConstant) {
          let createConstant = await db.chat_constant.create({
            sender_id: get_data.sender_id,
            reciever_id: get_data.reciever_id,
            bookingId: get_data.bookingId || null,
          });
          chatConstantId = createConstant.id;
        } else {
          chatConstantId = findConstant.id;
        }

        /* ---------------------- CREATE MESSAGE ---------------------- */
        let createMessage = await db.message.create({
          sender_id: get_data.sender_id,
          reciever_id: get_data.reciever_id,
          message: get_data.message,
          msgType: get_data.msgType,
          chatConstant_id: chatConstantId,
          bookingId: get_data.bookingId || null,
        });

        await db.chat_constant.update(
          {
            lastMessage_id: createMessage.id,
            deletedId: 0,
          },
          { where: { id: chatConstantId } }
        );

        /* -------------------- FETCH FULL MESSAGE DATA -------------------- */
        var getMsgData = await db.message.findOne({
          attributes: {
            include: [
              [
                Sequelize.literal(
                  "(SELECT CONCAT(firstName,lastName) FROM users WHERE users.id  = message.sender_id)"
                ),
                "SenderName",
              ],
              [
                Sequelize.literal(
                  "(SELECT image FROM users WHERE users.id = message.sender_id)"
                ),
                "Senderimage",
              ],
              [
                Sequelize.literal(
                  "(SELECT CONCAT(firstName,lastName) FROM users WHERE users.id = message.reciever_id)"
                ),
                "ReceiverName",
              ],
              [
                Sequelize.literal(
                  "(SELECT image FROM users WHERE users.id = message.reciever_id)"
                ),
                "Receiverimage",
              ],
            ],
          },
          where: { id: createMessage.id },
          raw: true,
        });

        /* ---------------------- FIND RECEIVER ---------------------- */
        let socketUser = await db.users.findOne({
          where: { id: get_data.reciever_id },
          raw: true,
        });

        //  EMIT SOCKET TO RECEIVER 

        if (socketUser) {
          io.to(socketUser.socket_id).emit("user_constant_list", null);
          io.to(socketUser.socketId).emit("send_message", getMsgData);
        }

        // Your same echo back to sender
        socket.emit("send_message", getMsgData);

        //  PUSH NOTIFICATION 

        if (socketUser && socketUser.deviceToken) {
          const payload = {
            to: socketUser.deviceToken,
            notification: {
              title: getMsgData.SenderName || "New Message",
              body: get_data.message || "You received a new message",
              sound: "default",
            },
            data: {
              type: 3,
              chatConstant_id: chatConstantId.toString(),
              sender_id: get_data.sender_id.toString(),
              receiver_id: get_data.reciever_id.toString(),
              bookingId: (get_data.bookingId || "").toString(),
            },
          };

          helper.sendNotification_android(payload); // your FCM function
        }

      } catch (error) {
        console.error(error);
      }
    });


    socket.on("get_message_list", async (get_data) => {
      try {

        let whereCondition = {
          [Op.or]: [
            { sender_id: get_data.sender_id, reciever_id: get_data.reciever_id },
            { sender_id: get_data.reciever_id, reciever_id: get_data.sender_id },
          ],
          deletedId: {
            [Op.not]: get_data.sender_id,
          },
        };

        if (get_data.bookingId) {
          whereCondition.bookingId = get_data.bookingId;
        }

        // 🚀 NEW: Filter out messages from completed / cancelled / rejected bookings
        whereCondition.bookingId = {
          [Op.in]: Sequelize.literal(`(
        SELECT id FROM bookings 
        WHERE status NOT IN ('3','4','5') 
        AND request != '2'
      )`)
        };

        const allMsg = await db.message.findAll({
          where: whereCondition,
          attributes: {
            include: [
              [
                Sequelize.literal(
                  "(SELECT CONCAT(firstName,lastName) FROM users WHERE users.id = message.sender_id)"
                ),
                "SenderName",
              ],
              [
                Sequelize.literal(
                  "(SELECT image FROM users WHERE users.id = message.sender_id)"
                ),
                "Senderimage",
              ],
              [
                Sequelize.literal(
                  "(SELECT CONCAT(firstName,lastName) FROM users WHERE users.id = message.reciever_id)"
                ),
                "ReceiverName",
              ],
              [
                Sequelize.literal(
                  "(SELECT image FROM users WHERE users.id = message.reciever_id)"
                ),
                "Receiverimage",
              ],
            ],
          },
        });

        socket.emit("get_message_list", { messageList: allMsg });

      } catch (error) {
        console.log(error);
      }
    });


    socket.on('user_blocked_status', async (data) => {
      try {
        const { bookingId } = data;

        if (!bookingId) {
          return socket.emit("user_blocked_status", {
            success: false,
            message: "Booking ID is required"
          });
        }

        let chatConst = await db.chat_constant.findOne({
          where: { bookingId },
          attributes: ["id", "sender_id", "reciever_id", "bookingId"]
        });

        if (!chatConst) {
          const booking = await db.bookings.findOne({
            where: { id: bookingId },
            attributes: ["id", "userId", "driverId"]
          });

          if (!booking) {
            return socket.emit("user_blocked_status", {
              success: false,
              message: "Invalid bookingId - Booking not found!"
            });
          }

          chatConst = {
            id: null,
            sender_id: booking.userId,
            reciever_id: booking.driverId,
            bookingId
          };
        }

        const users = await db.users.findAll({
          where: { id: [chatConst.sender_id, chatConst.reciever_id] },
          attributes: ["id", "block"]
        });

        let statusMap = {};
        users.forEach(u => {
          statusMap[u.id] = u.block === "1";
        });

        socket.emit("user_blocked_status", {
          success: true,
          message: "Block status fetched successfully",
          data: {
            constantId: chatConst.id,
            bookingId: chatConst.bookingId,
            senderId: chatConst.sender_id,
            receiverId: chatConst.reciever_id,
            senderBlocked: statusMap[chatConst.sender_id] || false,
            receiverBlocked: statusMap[chatConst.reciever_id] || false
          }
        });

      } catch (error) {
        console.error("Error checking block status:", error);
        socket.emit("user_blocked_status", {
          success: false,
          message: "Something went wrong"
        });
      }
    });


    socket.on("driverUpdateDrop", async (data) => {
      try {
        const { bookingId, driverId, dropLatitude, dropLongitude, dropLocation } = data;

        if (!bookingId || !driverId || !dropLatitude || !dropLongitude) {
          return socket.emit("driverUpdateDrop", {
            success: false,
            message: "Booking ID, driver ID, and drop coordinates are required."
          });
        }

        const booking = await db.bookings.findOne({ where: { id: bookingId, driverId, rideOpen: 1, request: "1", status: '0' } });
        if (!booking) return socket.emit("driverUpdateDrop", { success: false, message: "Ride not found or not started." });

        const startLat = booking.lastLatitude ? parseFloat(booking.lastLatitude) : parseFloat(booking.pickupLatitude);
        const startLng = booking.lastLongitude ? parseFloat(booking.lastLongitude) : parseFloat(booking.pickupLongitude);
        const dropLat = parseFloat(dropLatitude);
        const dropLng = parseFloat(dropLongitude);

        const toRad = v => v * Math.PI / 180;
        const calculateDistance = (a, b, c, d) => {
          const R = 6371;
          const dLat = toRad(c - a);
          const dLon = toRad(d - b);
          const x =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(a)) * Math.cos(toRad(c)) *
            Math.sin(dLon / 2) ** 2;
          return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
        };

        const segmentDistanceKm = calculateDistance(startLat, startLng, dropLat, dropLng);
        const totalDistanceKm = (parseFloat(booking.travelledDistance || 0) + segmentDistanceKm);
        const newBookingPrice = Math.round(totalDistanceKm * 10).toString();

        await booking.update({
          dropLocation: dropLocation || booking.dropLocation,
          dropLatitude: dropLat.toString(),
          dropLongitude: dropLng.toString(),
          travelledDistance: totalDistanceKm.toString(),
          bookingPrice: newBookingPrice,
          lastLatitude: dropLat.toString(),
          lastLongitude: dropLng.toString()
        });

        // Emit update to user and driver
        const userId = booking.userId;
        if (userId && onlineUsers[userId]) {
          onlineUsers[userId].forEach(sid => {
            io.to(sid).emit("rideStatusUpdate", {
              success: true,
              message: "Drop location updated by driver",
              bookingId,
              dropLatitude,
              dropLongitude,
              dropLocation,
              bookingPrice: newBookingPrice,
              rideDistanceKm: totalDistanceKm.toFixed(2)
            });
          });
        }

        if (driverId && onlineUsers[driverId]) {
          onlineUsers[driverId].forEach(sid => {
            io.to(sid).emit("rideStatusUpdate", {
              success: true,
              message: "Drop location updated",
              bookingId,
              dropLatitude,
              dropLongitude,
              dropLocation,
              bookingPrice: newBookingPrice,
              rideDistanceKm: totalDistanceKm.toFixed(2)
            });
          });
        }

      } catch (err) {
        console.error("Driver update drop error:", err);
        return socket.emit("driverUpdateDrop", { success: false, message: err.message });
      }
    });




  });
};
