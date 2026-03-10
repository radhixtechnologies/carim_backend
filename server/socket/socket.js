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

            // GPS noise ignore (only update if distance is between 0 and 30km)
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

              const BASE_PRICE = 100; // Fixed base price in MRU

              if (!isNaN(pricePerKm) && pricePerKm > 0) {

                // Calculate total distance travelled so far
                const totalDistanceKm =
                  parseFloat(booking.travelledDistance || 0) + segmentDistanceKm;

                // New price = Base price 100 + (total distance × price per km)
                const newBookingPrice = Math.round(
                  BASE_PRICE + (totalDistanceKm * pricePerKm)
                ).toString();

                // Calculate distance charge separately for display if needed
                const distanceCharge = Math.round(totalDistanceKm * pricePerKm);

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

                console.log(`Open ride updated: Distance=${totalDistanceKm.toFixed(2)}km, Base=100, Distance Charge=${distanceCharge}, Total=${newBookingPrice}`);

                // ---------------- SOCKET UPDATE TO USER ----------------
                if (global.onlineUsers && onlineUsers[booking.userId]) {
                  onlineUsers[booking.userId].forEach(sockId => {
                    io.to(sockId).emit("rideStatusUpdate", {
                      bookingId: booking.id,
                      dropLatitude: currLat.toString(),
                      dropLongitude: currLng.toString(),
                      bookingPrice: newBookingPrice,
                      rideDistanceKm: totalDistanceKm.toFixed(2),
                      // Optional: Send breakdown for better UX
                      priceBreakdown: {
                        basePrice: BASE_PRICE,
                        distanceKm: totalDistanceKm.toFixed(2),
                        pricePerKm: pricePerKm,
                        distanceCharge: distanceCharge,
                        total: newBookingPrice
                      }
                    });
                  });
                }
              }
            }
          }
        }

        // ---------------- DRIVER RESPONSE ----------------
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

        // Broadcast to all other connected clients
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



    // socket.on("rideStatusUpdate(main)", async (data) => {
    //   try {
    //     const { bookingId, status, driverId } = data;

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

    //     if (!user) {
    //       return socket.emit("rideStatusUpdate", {
    //         success: false,
    //         message: "User not found"
    //       });
    //     }

    //     if (user.status === "0")
    //       return socket.emit("rideStatusUpdate", { success: false, message: "User deactivated" });
    //     if (user.block === "1")
    //       return socket.emit("rideStatusUpdate", { success: false, message: "User blocked" });
    //     if (user.suspend === "1")
    //       return socket.emit("rideStatusUpdate", { success: false, message: "User suspended" });

    //     // ================= LANGUAGE HELPERS =================
    //     const getUserMsg = (en, ar, fr) =>
    //       user.languagee_type === 1 ? ar : user.languagee_type === 2 ? fr : en;

    //     const getDriverMsg = (en, ar, fr) =>
    //       driver.languagee_type === 1 ? ar : driver.languagee_type === 2 ? fr : en;

    //     // ================= EMIT FUNCTION =================
    //     const emitToBoth = async (
    //       userMsg,
    //       driverMsg,
    //       statusData,
    //       otpVerified = false // Keeping this parameter for backward compatibility
    //     ) => {

    //       // USER DB NOTIFICATION ONLY
    //       await db.notifications.create({
    //         sender_id: driverId,
    //         receiver_id: user.id,
    //         bookingId: booking.id,
    //         type: Number(statusData),
    //         message: userMsg,
    //         is_read: 0,
    //         status: 0
    //       });

    //       // SOCKET → USER
    //       if (onlineUsers[user.id]) {
    //         onlineUsers[user.id].forEach(sid => {
    //           io.to(sid).emit("rideStatusUpdate", {
    //             success: true,
    //             message: userMsg,
    //             bookingId: booking.id,
    //             status: statusData,
    //             otpVerified: true
    //           });
    //         });
    //       }

    //       // SOCKET → DRIVER (NO DB / NO PUSH)
    //       if (onlineUsers[driverId]) {
    //         onlineUsers[driverId].forEach(sid => {
    //           io.to(sid).emit("rideStatusUpdate", {
    //             success: true,
    //             message: driverMsg,
    //             bookingId: booking.id,
    //             status: statusData,
    //             otpVerified: true // Always true now since OTP is removed
    //           });
    //         });
    //       }
    //     };

    //     // ================= STATUS FLOW =================
    //     switch (status) {

    //       case "1": // DRIVER ARRIVED
    //         if (currentStatus !== "0") return;

    //         await booking.update({ status: "1" });

    //         await emitToBoth(
    //           getUserMsg("Driver arrived", "وصل السائق", "Le conducteur est arrivé"),
    //           getDriverMsg("Driver arrived", "وصل السائق", "Le conducteur est arrivé"),
    //           "1"
    //         );

    //         // PUSH → USER ONLY
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
    //         // Removed OTP verification
    //         await booking.update({ status: "2" }); // Removed otpbooking update

    //         await emitToBoth(
    //           getUserMsg("Ride has started", "تم بدء الرحلة", "Le trajet a commencé"),
    //           getDriverMsg("Ride has started", "تم بدء الرحلة", "Le trajet a commencé"),
    //           "2",
    //           true
    //         );

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
    //         const freshDriver = await db.users.findOne({
    //           where: { id: driverId },
    //           attributes: ['id', 'totalAmount', 'adminCommission'],
    //           raw: true
    //         });

    //         if (!freshDriver) {
    //           return socket.emit("rideStatusUpdate", {
    //             success: false,
    //             message: "Driver not found."
    //           });
    //         }

    //         await booking.update({ status: "3" });

    //         const driverCurrentBalance = parseFloat(freshDriver.totalAmount) || 0;
    //         const adminCommissionPercent = parseFloat(freshDriver.adminCommission) || 5;

    //         const adminCommission = (driverCurrentBalance * adminCommissionPercent) / 100;

    //         if (driverCurrentBalance < adminCommission) {
    //           return socket.emit("rideStatusUpdate", {
    //             success: false,
    //             message: "Insufficient driver balance to deduct commission."
    //           });
    //         }

    //         const newDriverBalance = driverCurrentBalance - adminCommission;
    //         await db.users.update(
    //           { totalAmount: newDriverBalance.toFixed(2) },
    //           { where: { id: driverId, role: "2" } }
    //         );

    //         const adminUser = await db.users.findOne({
    //           where: { role: '0' },
    //           attributes: ['id', 'totalAmount'],
    //           raw: true
    //         });

    //         if (adminUser) {
    //           const currentAdminBalance = parseFloat(adminUser.totalAmount) || 0;
    //           const newAdminBalance = currentAdminBalance + adminCommission;

    //           await db.users.update({
    //             totalAmount: newAdminBalance.toFixed(2).toString()
    //           }, {
    //             where: { id: adminUser.id, role: '0' }
    //           });
    //         }
    //         await emitToBoth(
    //           getUserMsg("Ride finished successfully", "تم الانتهاء من الرحلة بنجاح", "Trajet terminé avec succès"),
    //           getDriverMsg("Ride finished successfully", "تم الانتهاء من الرحلة بنجاح", "Trajet terminé avec succès"),
    //           "3"
    //         );

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


    // socket.on("rideStatusUpdate1", async (data) => {
    //   try {
    //     const { bookingId, status, driverId } = data;

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

    //     if (!user) {
    //       return socket.emit("rideStatusUpdate", {
    //         success: false,
    //         message: "User not found"
    //       });
    //     }

    //     if (user.status === "0")
    //       return socket.emit("rideStatusUpdate", { success: false, message: "User deactivated" });
    //     if (user.block === "1")
    //       return socket.emit("rideStatusUpdate", { success: false, message: "User blocked" });
    //     if (user.suspend === "1")
    //       return socket.emit("rideStatusUpdate", { success: false, message: "User suspended" });

    //     // ================= LANGUAGE HELPERS =================
    //     const getUserMsg = (en, ar, fr) =>
    //       user.languagee_type === 1 ? ar : user.languagee_type === 2 ? fr : en;

    //     const getDriverMsg = (en, ar, fr) =>
    //       driver.languagee_type === 1 ? ar : driver.languagee_type === 2 ? fr : en;

    //     // ================= ROUND TO NEAREST 5 HELPER =================
    //     const roundToNearest5 = (num) => {
    //       return Math.round(parseFloat(num) / 5) * 5;
    //     };

    //     // ================= EMIT FUNCTION =================
    //     const emitToBoth = async (
    //       userMsg,
    //       driverMsg,
    //       statusData,
    //       otpVerified = false
    //     ) => {

    //       // USER DB NOTIFICATION ONLY
    //       await db.notifications.create({
    //         sender_id: driverId,
    //         receiver_id: user.id,
    //         bookingId: booking.id,
    //         type: Number(statusData),
    //         message: userMsg,
    //         is_read: 0,
    //         status: 0
    //       });

    //       // SOCKET → USER
    //       if (onlineUsers[user.id]) {
    //         onlineUsers[user.id].forEach(sid => {
    //           io.to(sid).emit("rideStatusUpdate", {
    //             success: true,
    //             message: userMsg,
    //             bookingId: booking.id,
    //             status: statusData,
    //             otpVerified: true
    //           });
    //         });
    //       }

    //       // SOCKET → DRIVER (NO DB / NO PUSH)
    //       if (onlineUsers[driverId]) {
    //         onlineUsers[driverId].forEach(sid => {
    //           io.to(sid).emit("rideStatusUpdate", {
    //             success: true,
    //             message: driverMsg,
    //             bookingId: booking.id,
    //             status: statusData,
    //             otpVerified: true
    //           });
    //         });
    //       }
    //     };

    //     // ================= FUNCTION TO START REAL-TIME PRICING =================
    //     const startRealTimePricing = async (bookingId) => {
    //       try {
    //         const rideBooking = await db.bookings.findOne({
    //           where: { id: bookingId },
    //           raw: true
    //         });

    //         if (rideBooking && rideBooking.rideOpen == 1) {
    //           console.log(`Starting real-time pricing for open ride: ${bookingId}`);

    //           if (!global.priceIntervals) {
    //             global.priceIntervals = {};
    //           }

    //           if (global.priceIntervals[bookingId]) {
    //             clearInterval(global.priceIntervals[bookingId]);
    //           }

    //           // Start interval to update price every minute
    //           const intervalId = setInterval(async () => {
    //             try {
    //               const currentBooking = await db.bookings.findOne({
    //                 where: {
    //                   id: bookingId
    //                 },
    //                 raw: true
    //               });

    //               // Check if booking still exists and rideOpen is still 1
    //               if (!currentBooking || currentBooking.rideOpen != 1) {
    //                 console.log(`Booking ${bookingId} not found or rideOpen changed, stopping pricing`);
    //                 clearInterval(global.priceIntervals[bookingId]);
    //                 delete global.priceIntervals[bookingId];
    //                 return;
    //               }

    //               // Calculate new price
    //               const basePrice = parseFloat(currentBooking.basePrice || 100);
    //               const currentPrice = parseFloat(currentBooking.bookingPrice || basePrice);
    //               const pricePerMin = 1; // 1 MRU per minute

    //               // ✅ Don't round during live ride - keep exact price
    //               let newPrice = currentPrice + pricePerMin;
    //               const totalMinutes = (parseInt(currentBooking.totalMinutes) || 0) + 1;

    //               // Update booking in database with exact price (no rounding during ride)
    //               await db.bookings.update(
    //                 {
    //                   bookingPrice: newPrice.toString(),
    //                   totalMinutes: totalMinutes.toString(),
    //                   lastPriceUpdate: new Date().toISOString()
    //                 },
    //                 {
    //                   where: { id: bookingId }
    //                 }
    //               );

    //               console.log(`Price updated for booking ${bookingId}: +1 MRU, New price: ${newPrice} MRU (exact), Total minutes: ${totalMinutes}`);

    //               // Emit to driver with exact price
    //               if (currentBooking.driverId && onlineUsers[currentBooking.driverId]) {
    //                 onlineUsers[currentBooking.driverId].forEach(sockId => {
    //                   io.to(sockId).emit("priceUpdate", {
    //                     bookingId: bookingId,
    //                     newPrice: newPrice.toString(), // Send exact price
    //                     totalMinutes: totalMinutes,
    //                     addedAmount: 1,
    //                     message: `Price increased by 1 MRU`,
    //                     timestamp: new Date().toISOString(),
    //                     isExactPrice: true // Flag to indicate this is exact price during ride
    //                   });
    //                 });
    //               }

    //               // Emit to user with exact price
    //               if (onlineUsers[currentBooking.userId]) {
    //                 onlineUsers[currentBooking.userId].forEach(sockId => {
    //                   io.to(sockId).emit("priceUpdate", {
    //                     bookingId: bookingId,
    //                     newPrice: newPrice.toString(), // Send exact price
    //                     totalMinutes: totalMinutes,
    //                     addedAmount: 1,
    //                     message: `Price increased by 1 MRU`,
    //                     timestamp: new Date().toISOString(),
    //                     isExactPrice: true // Flag to indicate this is exact price during ride
    //                   });
    //                 });
    //               }

    //             } catch (error) {
    //               console.error(`Error in price interval for booking ${bookingId}:`, error);
    //             }
    //           }, 60000); // Run every minute

    //           global.priceIntervals[bookingId] = intervalId;
    //         }
    //       } catch (error) {
    //         console.error('Error starting real-time pricing:', error);
    //       }
    //     };

    //     // ================= FUNCTION TO STOP REAL-TIME PRICING =================
    //     const stopRealTimePricing = async (bookingId) => {
    //       try {
    //         if (global.priceIntervals && global.priceIntervals[bookingId]) {
    //           clearInterval(global.priceIntervals[bookingId]);
    //           delete global.priceIntervals[bookingId];
    //           console.log(`Stopped real-time pricing for booking: ${bookingId}`);
    //         }
    //       } catch (error) {
    //         console.error('Error stopping real-time pricing:', error);
    //       }
    //     };

    //     // ================= STATUS FLOW =================
    //     switch (status) {

    //       case "1": // DRIVER ARRIVED
    //         if (currentStatus !== "0") return;

    //         await booking.update({ status: "1" });

    //         await emitToBoth(
    //           getUserMsg("Driver arrived", "وصل السائق", "Le conducteur est arrivé"),
    //           getDriverMsg("Driver arrived", "وصل السائق", "Le conducteur est arrivé"),
    //           "1"
    //         );

    //         // PUSH → USER ONLY
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
    //         await booking.update({ status: "2" });

    //         if (booking.rideOpen == 1) {
    //           await startRealTimePricing(bookingId);
    //         }

    //         await emitToBoth(
    //           getUserMsg("Ride has started", "تم بدء الرحلة", "Le trajet a commencé"),
    //           getDriverMsg("Ride has started", "تم بدء الرحلة", "Le trajet a commencé"),
    //           "2",
    //           true
    //         );

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
    //         await stopRealTimePricing(bookingId);

    //         const finalBooking = await db.bookings.findOne({
    //           where: { id: bookingId },
    //           raw: true
    //         });

    //         // ✅ Round to nearest 5 ONLY when ride finishes
    //         let finalPrice = parseFloat(finalBooking.bookingPrice);
    //         let roundedFinalPrice = roundToNearest5(finalPrice);

    //         // Update with rounded price only at completion
    //         await db.bookings.update(
    //           {
    //             bookingPrice: roundedFinalPrice.toString(),
    //             status: "3"
    //           },
    //           { where: { id: bookingId } }
    //         );

    //         console.log(`Final price for booking ${bookingId}: ${finalPrice} (exact) → ${roundedFinalPrice} (rounded to nearest 5)`);

    //         const freshDriver = await db.users.findOne({
    //           where: { id: driverId },
    //           attributes: ['id', 'totalAmount', 'adminCommission'],
    //           raw: true
    //         });

    //         if (!freshDriver) {
    //           return socket.emit("rideStatusUpdate", {
    //             success: false,
    //             message: "Driver not found."
    //           });
    //         }

    //         const driverCurrentBalance = parseFloat(freshDriver.totalAmount) || 0;
    //         const adminCommissionPercent = parseFloat(freshDriver.adminCommission) || 5;

    //         const adminCommission = (driverCurrentBalance * adminCommissionPercent) / 100;

    //         if (driverCurrentBalance < adminCommission) {
    //           return socket.emit("rideStatusUpdate", {
    //             success: false,
    //             message: "Insufficient driver balance to deduct commission."
    //           });
    //         }

    //         const newDriverBalance = driverCurrentBalance - adminCommission;
    //         await db.users.update(
    //           { totalAmount: newDriverBalance.toFixed(2) },
    //           { where: { id: driverId, role: "2" } }
    //         );

    //         const adminUser = await db.users.findOne({
    //           where: { role: '0' },
    //           attributes: ['id', 'totalAmount'],
    //           raw: true
    //         });

    //         if (adminUser) {
    //           const currentAdminBalance = parseFloat(adminUser.totalAmount) || 0;
    //           const newAdminBalance = currentAdminBalance + adminCommission;

    //           await db.users.update({
    //             totalAmount: newAdminBalance.toFixed(2).toString()
    //           }, {
    //             where: { id: adminUser.id, role: '0' }
    //           });
    //         }
    //         await emitToBoth(
    //           getUserMsg(`Ride finished successfully. Final price: ${roundedFinalPrice} MRU`,
    //             `تم الانتهاء من الرحلة بنجاح. السعر النهائي: ${roundedFinalPrice} MRU`,
    //             `Trajet terminé avec succès. Prix final: ${roundedFinalPrice} MRU`),
    //           getDriverMsg(`Ride finished successfully. Final price: ${roundedFinalPrice} MRU`,
    //             `تم الانتهاء من الرحلة بنجاح. السعر النهائي: ${roundedFinalPrice} MRU`,
    //             `Trajet terminé avec succès. Prix final: ${roundedFinalPrice} MRU`),
    //           "3"
    //         );

    //         if (user.deviceToken) {
    //           helper.sendNotification_android(user.deviceToken, {
    //             message: getUserMsg(
    //               `Your ride has been completed. Final price: ${roundedFinalPrice} MRU`,
    //               `تم إكمال رحلتك. السعر النهائي: ${roundedFinalPrice} MRU`,
    //               `Votre trajet est terminé. Prix final: ${roundedFinalPrice} MRU`
    //             ),
    //             type: 9,
    //             senderId: driverId,
    //             bookingId: booking.id
    //           });
    //         }
    //         break;

    //       case "4": // CANCELLED
    //         await stopRealTimePricing(bookingId);

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
    // socket.on("rideStatusUpdate143", async (data) => {
    //   try {
    //     const { bookingId, status, driverId } = data;

    //     if (!bookingId || !status || !driverId) {
    //       return socket.emit("rideStatusUpdate", {
    //         success: false,
    //         message: "Booking ID, status, and driver ID are required."
    //       });
    //     }
    //     console.log(bookingId, driverId, "bookingIdbookingIdbookingId>>>");


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
    //         attributes: ['id', 'rideOtp', 'socketId', 'deviceToken', 'status', 'block', 'suspend', 'languagee_type']
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

    //     if (!user) {
    //       return socket.emit("rideStatusUpdate", {
    //         success: false,
    //         message: "User not found"
    //       });
    //     }

    //     if (user.status === "0")
    //       return socket.emit("rideStatusUpdate", { success: false, message: "User deactivated" });
    //     if (user.block === "1")
    //       return socket.emit("rideStatusUpdate", { success: false, message: "User blocked" });
    //     if (user.suspend === "1")
    //       return socket.emit("rideStatusUpdate", { success: false, message: "User suspended" });

    //     // ================= LANGUAGE HELPERS =================
    //     const getUserMsg = (en, ar, fr) =>
    //       user.languagee_type === 1 ? ar : user.languagee_type === 2 ? fr : en;

    //     const getDriverMsg = (en, ar, fr) =>
    //       driver.languagee_type === 1 ? ar : driver.languagee_type === 2 ? fr : en;

    //     // ================= ROUND TO NEAREST 5 HELPER =================
    //     const roundToNearest5 = (num) => {
    //       return Math.round(parseFloat(num) / 5) * 5;
    //     };

    //     // ================= EMIT FUNCTION =================
    //     const emitToBoth = async (
    //       userMsg,
    //       driverMsg,
    //       statusData,
    //       otpVerified = false
    //     ) => {

    //       await db.notifications.create({
    //         sender_id: driverId,
    //         receiver_id: user.id,
    //         bookingId: booking.id,
    //         type: Number(statusData),
    //         message: userMsg,
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
    //             otpVerified: true
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
    //             otpVerified: true
    //           });
    //         });
    //       }
    //     };

    //     // ================= REAL-TIME PRICING FUNCTIONS =================
    //     const startRealTimePricing = async (bookingId) => {
    //       try {
    //         const rideBooking = await db.bookings.findOne({
    //           where: { id: bookingId },
    //           raw: true
    //         });

    //         if (rideBooking && rideBooking.rideOpen == 1) {
    //           console.log(`Starting real-time pricing for open ride: ${bookingId}`);

    //           if (!global.priceIntervals) {
    //             global.priceIntervals = {};
    //           }

    //           if (global.priceIntervals[bookingId]) {
    //             clearInterval(global.priceIntervals[bookingId]);
    //           }

    //           const intervalId = setInterval(async () => {
    //             try {
    //               const currentBooking = await db.bookings.findOne({
    //                 where: { id: bookingId },
    //                 raw: true
    //               });

    //               if (!currentBooking || currentBooking.rideOpen != 1) {
    //                 console.log(`Booking ${bookingId} not found or rideOpen changed, stopping pricing`);
    //                 clearInterval(global.priceIntervals[bookingId]);
    //                 delete global.priceIntervals[bookingId];
    //                 return;
    //               }

    //               const basePrice = parseFloat(currentBooking.basePrice || 100);
    //               const currentPrice = parseFloat(currentBooking.bookingPrice || basePrice);
    //               const pricePerMin = 1;

    //               let newPrice = currentPrice + pricePerMin;
    //               const totalMinutes = (parseInt(currentBooking.totalMinutes) || 0) + 1;

    //               await db.bookings.update(
    //                 {
    //                   bookingPrice: newPrice.toString(),
    //                   totalMinutes: totalMinutes.toString(),
    //                   lastPriceUpdate: new Date().toISOString()
    //                 },
    //                 { where: { id: bookingId } }
    //               );

    //               console.log(`Price updated for booking ${bookingId}: +1 MRU, New price: ${newPrice} MRU`);

    //               if (currentBooking.driverId && onlineUsers[currentBooking.driverId]) {
    //                 onlineUsers[currentBooking.driverId].forEach(sockId => {
    //                   io.to(sockId).emit("priceUpdate", {
    //                     bookingId: bookingId,
    //                     newPrice: newPrice.toString(),
    //                     totalMinutes: totalMinutes,
    //                     addedAmount: 1,
    //                     timestamp: new Date().toISOString()
    //                   });
    //                 });
    //               }

    //               if (onlineUsers[currentBooking.userId]) {
    //                 onlineUsers[currentBooking.userId].forEach(sockId => {
    //                   io.to(sockId).emit("priceUpdate", {
    //                     bookingId: bookingId,
    //                     newPrice: newPrice.toString(),
    //                     totalMinutes: totalMinutes,
    //                     addedAmount: 1,
    //                     timestamp: new Date().toISOString()
    //                   });
    //                 });
    //               }

    //             } catch (error) {
    //               console.error(`Error in price interval for booking ${bookingId}:`, error);
    //             }
    //           }, 60000);

    //           global.priceIntervals[bookingId] = intervalId;
    //         }
    //       } catch (error) {
    //         console.error('Error starting real-time pricing:', error);
    //       }
    //     };

    //     const stopRealTimePricing = async (bookingId) => {
    //       try {
    //         if (global.priceIntervals && global.priceIntervals[bookingId]) {
    //           clearInterval(global.priceIntervals[bookingId]);
    //           delete global.priceIntervals[bookingId];
    //           console.log(`Stopped real-time pricing for booking: ${bookingId}`);
    //         }
    //       } catch (error) {
    //         console.error('Error stopping real-time pricing:', error);
    //       }
    //     };

    //     // ================= STATUS FLOW =================
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
    //             message: getUserMsg("Your driver has arrived.", "وصل سائقك.", "Votre conducteur est arrivé."),
    //             type: 7,
    //             senderId: driverId,
    //             bookingId: booking.id
    //           });
    //         }
    //         break;

    //       case "2": // START RIDE
    //         await booking.update({ status: "2" });
    //         if (booking.rideOpen == 1) {
    //           await startRealTimePricing(bookingId);
    //         }
    //         await emitToBoth(
    //           getUserMsg("Ride has started", "تم بدء الرحلة", "Le trajet a commencé"),
    //           getDriverMsg("Ride has started", "تم بدء الرحلة", "Le trajet a commencé"),
    //           "2",
    //           true
    //         );
    //         if (user.deviceToken) {
    //           helper.sendNotification_android(user.deviceToken, {
    //             message: getUserMsg("Your ride has started.", "بدأت رحلتك.", "Votre trajet a commencé."),
    //             type: 8,
    //             senderId: driverId,
    //             bookingId: booking.id
    //           });
    //         }
    //         break;

    //       case "3": // FINISHED - COMMISSION CUT HOGA YAHAN
    //         await stopRealTimePricing(bookingId);

    //         // Get final booking details
    //         const finalBooking = await db.bookings.findOne({
    //           where: { id: bookingId },
    //           raw: true
    //         });

    //         // Round final price to nearest 5
    //         let finalPrice = parseFloat(finalBooking.bookingPrice);
    //         let roundedFinalPrice = roundToNearest5(finalPrice);

    //         // Update booking with rounded price and status
    //         await db.bookings.update(
    //           {
    //             bookingPrice: roundedFinalPrice.toString(),
    //             status: "3"
    //           },
    //           { where: { id: bookingId } }
    //         );

    //         console.log("========== RIDE COMPLETED - COMMISSION PROCESSING ==========");
    //         console.log(`Booking ID: ${bookingId}`);
    //         console.log(`Final price: ${finalPrice} → ${roundedFinalPrice} MRU`);

    //         // ===== GET DRIVER DETAILS =====
    //         const driverDetails = await db.users.findOne({
    //           where: { id: driverId, role: "2" },
    //           attributes: ['id', 'totalAmount', 'adminCommission'],
    //           raw: true
    //         });

    //         if (!driverDetails) {
    //           console.log("❌ Driver not found!");
    //           return socket.emit("rideStatusUpdate", {
    //             success: false,
    //             message: "Driver not found."
    //           });
    //         }

    //         // ===== GET COMMISSION PERCENTAGE =====
    //         // Pehle driver ka adminCommission check karo
    //         let commissionPercent = parseFloat(driverDetails.adminCommission);

    //         // Agar driver ka commission empty hai to admin ka commission le lo
    //         if (!commissionPercent || commissionPercent === 0) {
    //           console.log("⚠️ Driver adminCommission empty, fetching from admin...");

    //           const adminUser = await db.users.findOne({
    //             where: { role: '0' },
    //             attributes: ['adminCommission'],
    //             raw: true
    //           });

    //           commissionPercent = parseFloat(adminUser?.adminCommission) || 15; // Default 15%
    //           console.log(`Using admin commission: ${commissionPercent}%`);
    //         }

    //         // ✅ Driver ka current balance (jisme se commission katega)
    //         const driverBalance = parseFloat(driverDetails.totalAmount) || 0;

    //         // ✅ Commission calculate karo driver ke totalAmount se (bookingPrice se nahi)
    //         const commissionAmount = (driverBalance * commissionPercent) / 100;

    //         console.log(`Driver ID: ${driverId}`);
    //         console.log(`Driver adminCommission in DB: "${driverDetails.adminCommission}"`);
    //         console.log(`Using commission percent: ${commissionPercent}%`);
    //         console.log(`Driver balance before deduction: ${driverBalance} MRU`);
    //         console.log(`Commission calculation: ${driverBalance} × ${commissionPercent}% = ${commissionAmount} MRU`);

    //         if (commissionAmount > 0) {
    //           // ===== DEDUCT COMMISSION FROM DRIVER'S totalAmount =====
    //           const newDriverBalance = driverBalance - commissionAmount;

    //           const driverUpdate = await db.users.update(
    //             { totalAmount: newDriverBalance.toFixed(2).toString() },
    //             { where: { id: driverId, role: "2" } }
    //           );

    //           console.log(`Driver update result: ${driverUpdate[0]} row(s) updated`);
    //           console.log(`Driver balance after deduction: ${newDriverBalance} MRU (deducted ${commissionAmount} MRU)`);

    //           // ===== ADD COMMISSION TO ADMIN'S totalAmount =====
    //           const adminUser = await db.users.findOne({
    //             where: { role: '0' },
    //             attributes: ['id', 'totalAmount'],
    //             raw: true
    //           });

    //           if (adminUser) {
    //             const adminBalance = parseFloat(adminUser.totalAmount) || 0;
    //             const newAdminBalance = adminBalance + commissionAmount;

    //             const adminUpdate = await db.users.update(
    //               { totalAmount: newAdminBalance.toFixed(2).toString() },
    //               { where: { id: adminUser.id, role: '0' } }
    //             );

    //             console.log(`Admin update result: ${adminUpdate[0]} row(s) updated`);
    //             console.log(`Admin balance: ${adminBalance} → ${newAdminBalance} MRU (added ${commissionAmount} MRU)`);

    //             // Create admin transaction
    //             try {
    //               await db.transactions.create({
    //                 userId: adminUser.id,
    //                 bookingId: bookingId,
    //                 amount: commissionAmount.toString(),
    //                 type: 'commission_earning',
    //                 description: `Commission earned from driver #${driverId} (${commissionPercent}% of their balance)`,
    //                 status: 'completed'
    //               });
    //             } catch (txError) {
    //               console.log("Admin transaction error:", txError.message);
    //             }
    //           }

    //           // Create driver transaction
    //           try {
    //             await db.transactions.create({
    //               userId: driverId,
    //               bookingId: bookingId,
    //               amount: commissionAmount.toString(),
    //               type: 'commission_deduction',
    //               description: `Admin commission ${commissionPercent}% deducted from your balance for ride #${bookingId}`,
    //               status: 'completed'
    //             });
    //           } catch (txError) {
    //             console.log("Driver transaction error:", txError.message);
    //           }
    //         } else {
    //           console.log("⚠️ Commission amount is 0, skipping deduction");
    //         }

    //         console.log("========== COMMISSION PROCESSING COMPLETE ==========");

    //         // Send notifications
    //         await emitToBoth(
    //           getUserMsg(`Ride finished successfully. Final price: ${roundedFinalPrice} MRU`,
    //             `تم الانتهاء من الرحلة بنجاح. السعر النهائي: ${roundedFinalPrice} MRU`,
    //             `Trajet terminé avec succès. Prix final: ${roundedFinalPrice} MRU`),
    //           getDriverMsg(`Ride finished successfully. Final price: ${roundedFinalPrice} MRU`,
    //             `تم الانتهاء من الرحلة بنجاح. السعر النهائي: ${roundedFinalPrice} MRU`,
    //             `Trajet terminé avec succès. Prix final: ${roundedFinalPrice} MRU`),
    //           "3"
    //         );

    //         if (user.deviceToken) {
    //           helper.sendNotification_android(user.deviceToken, {
    //             message: getUserMsg(
    //               `Your ride has been completed. Final price: ${roundedFinalPrice} MRU`,
    //               `تم إكمال رحلتك. السعر النهائي: ${roundedFinalPrice} MRU`,
    //               `Votre trajet est terminé. Prix final: ${roundedFinalPrice} MRU`
    //             ),
    //             type: 9,
    //             senderId: driverId,
    //             bookingId: booking.id
    //           });
    //         }
    //         break;

    //       case "4": // CANCELLED
    //         await stopRealTimePricing(bookingId);
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
        let { bookingId, status, driverId } = data;

        if (!bookingId || !status) {
          return socket.emit("rideStatusUpdate", {
            success: false,
            message: "Booking ID and status are required."
          });
        }

        // If driverId is null or empty, fetch it from booking
        if (!driverId) {
          console.log("driverId is null/empty, fetching from booking...");
          const bookingInfo = await db.bookings.findOne({
            where: { id: bookingId },
            attributes: ['driverId'],
            raw: true
          });

          if (!bookingInfo || !bookingInfo.driverId) {
            return socket.emit("rideStatusUpdate", {
              success: false,
              message: "Booking not found or no driver assigned."
            });
          }

          driverId = bookingInfo.driverId;
          console.log(`Fetched driverId from booking: ${driverId}`);
        }

        console.log(bookingId, driverId, "bookingIdbookingIdbookingId>>>");

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
            attributes: ['id', 'rideOtp', 'socketId', 'deviceToken', 'status', 'block', 'suspend', 'languagee_type']
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

        // ================= ROUND TO NEAREST 5 HELPER =================
        const roundToNearest5 = (num) => {
          return Math.round(parseFloat(num) / 5) * 5;
        };

        // ================= EMIT FUNCTION =================
        const emitToBoth = async (
          userMsg,
          driverMsg,
          statusData,
          otpVerified = false
        ) => {

          await db.notifications.create({
            sender_id: driverId,
            receiver_id: user.id,
            bookingId: booking.id,
            type: Number(statusData),
            message: userMsg,
            is_read: 0,
            status: 0
          });

          if (onlineUsers[user.id]) {
            onlineUsers[user.id].forEach(sid => {
              io.to(sid).emit("rideStatusUpdate", {
                success: true,
                message: userMsg,
                bookingId: booking.id,
                status: statusData,
                otpVerified: true
              });
            });
          }

          if (onlineUsers[driverId]) {
            onlineUsers[driverId].forEach(sid => {
              io.to(sid).emit("rideStatusUpdate", {
                success: true,
                message: driverMsg,
                bookingId: booking.id,
                status: statusData,
                otpVerified: true
              });
            });
          }
        };

        // ================= REAL-TIME PRICING FUNCTIONS =================
        const startRealTimePricing = async (bookingId) => {
          try {
            const rideBooking = await db.bookings.findOne({
              where: { id: bookingId },
              raw: true
            });

            if (rideBooking && rideBooking.rideOpen == 1) {
              console.log(`Starting real-time pricing for open ride: ${bookingId}`);

              if (!global.priceIntervals) {
                global.priceIntervals = {};
              }

              if (global.priceIntervals[bookingId]) {
                clearInterval(global.priceIntervals[bookingId]);
              }

              const intervalId = setInterval(async () => {
                try {
                  const currentBooking = await db.bookings.findOne({
                    where: { id: bookingId },
                    raw: true
                  });

                  if (!currentBooking || currentBooking.rideOpen != 1) {
                    console.log(`Booking ${bookingId} not found or rideOpen changed, stopping pricing`);
                    clearInterval(global.priceIntervals[bookingId]);
                    delete global.priceIntervals[bookingId];
                    return;
                  }

                  const basePrice = parseFloat(currentBooking.basePrice || 100);
                  const currentPrice = parseFloat(currentBooking.bookingPrice || basePrice);
                  const pricePerMin = 1;

                  let newPrice = currentPrice + pricePerMin;
                  const totalMinutes = (parseInt(currentBooking.totalMinutes) || 0) + 1;

                  await db.bookings.update(
                    {
                      bookingPrice: newPrice.toString(),
                      totalMinutes: totalMinutes.toString(),
                      lastPriceUpdate: new Date().toISOString()
                    },
                    { where: { id: bookingId } }
                  );

                  console.log(`Price updated for booking ${bookingId}: +1 MRU, New price: ${newPrice} MRU`);

                  if (currentBooking.driverId && onlineUsers[currentBooking.driverId]) {
                    onlineUsers[currentBooking.driverId].forEach(sockId => {
                      io.to(sockId).emit("priceUpdate", {
                        bookingId: bookingId,
                        newPrice: newPrice.toString(),
                        totalMinutes: totalMinutes,
                        addedAmount: 1,
                        timestamp: new Date().toISOString()
                      });
                    });
                  }

                  if (onlineUsers[currentBooking.userId]) {
                    onlineUsers[currentBooking.userId].forEach(sockId => {
                      io.to(sockId).emit("priceUpdate", {
                        bookingId: bookingId,
                        newPrice: newPrice.toString(),
                        totalMinutes: totalMinutes,
                        addedAmount: 1,
                        timestamp: new Date().toISOString()
                      });
                    });
                  }

                } catch (error) {
                  console.error(`Error in price interval for booking ${bookingId}:`, error);
                }
              }, 60000);

              global.priceIntervals[bookingId] = intervalId;
            }
          } catch (error) {
            console.error('Error starting real-time pricing:', error);
          }
        };

        const stopRealTimePricing = async (bookingId) => {
          try {
            if (global.priceIntervals && global.priceIntervals[bookingId]) {
              clearInterval(global.priceIntervals[bookingId]);
              delete global.priceIntervals[bookingId];
              console.log(`Stopped real-time pricing for booking: ${bookingId}`);
            }
          } catch (error) {
            console.error('Error stopping real-time pricing:', error);
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
            if (user.deviceToken) {
              helper.sendNotification_android(user.deviceToken, {
                message: getUserMsg("Your driver has arrived.", "وصل سائقك.", "Votre conducteur est arrivé."),
                type: 7,
                senderId: driverId,
                bookingId: booking.id
              });
            }
            break;

          case "2": // START RIDE
            await booking.update({ status: "2" });
            if (booking.rideOpen == 1) {
              await startRealTimePricing(bookingId);
            }
            await emitToBoth(
              getUserMsg("Ride has started", "تم بدء الرحلة", "Le trajet a commencé"),
              getDriverMsg("Ride has started", "تم بدء الرحلة", "Le trajet a commencé"),
              "2",
              true
            );
            if (user.deviceToken) {
              helper.sendNotification_android(user.deviceToken, {
                message: getUserMsg("Your ride has started.", "بدأت رحلتك.", "Votre trajet a commencé."),
                type: 8,
                senderId: driverId,
                bookingId: booking.id
              });
            }
            break;

          // case "3": // FINISHED - COMMISSION CUT HOGA YAHAN
          //   await stopRealTimePricing(bookingId);

          //   // Get final booking details
          //   const finalBooking = await db.bookings.findOne({
          //     where: { id: bookingId },
          //     raw: true
          //   });

          //   // Round final price to nearest 5
          //   let finalPrice = parseFloat(finalBooking.bookingPrice);
          //   let roundedFinalPrice = roundToNearest5(finalPrice);

          //   // Update booking with rounded price and status
          //   await db.bookings.update(
          //     {
          //       bookingPrice: roundedFinalPrice.toString(),
          //       status: "3"
          //     },
          //     { where: { id: bookingId } }
          //   );

          //   console.log("========== RIDE COMPLETED - COMMISSION PROCESSING ==========");
          //   console.log(`Booking ID: ${bookingId}`);
          //   console.log(`Final price: ${finalPrice} → ${roundedFinalPrice} MRU`);

          //   // ===== GET DRIVER DETAILS =====
          //   const driverDetails = await db.users.findOne({
          //     where: { id: driverId, role: "2" },
          //     attributes: ['id', 'totalAmount', 'adminCommission'],
          //     raw: true
          //   });

          //   if (!driverDetails) {
          //     console.log("❌ Driver not found!");
          //     return socket.emit("rideStatusUpdate", {
          //       success: false,
          //       message: "Driver not found."
          //     });
          //   }

          //   // ===== GET COMMISSION PERCENTAGE =====
          //   // Pehle driver ka adminCommission check karo
          //   let commissionPercent = parseFloat(driverDetails.adminCommission);

          //   // Agar driver ka commission empty hai to admin ka commission le lo
          //   if (!commissionPercent || commissionPercent === 0) {
          //     console.log("⚠️ Driver adminCommission empty, fetching from admin...");

          //     const adminUser = await db.users.findOne({
          //       where: { role: '0' },
          //       attributes: ['adminCommission'],
          //       raw: true
          //     });

          //     commissionPercent = parseFloat(adminUser?.adminCommission) || 15; // Default 15%
          //     console.log(`Using admin commission: ${commissionPercent}%`);
          //   }

          //   // ✅ Driver ka current balance (jisme se commission katega)
          //   const driverBalance = parseFloat(driverDetails.totalAmount) || 0;

          //   // ✅ Commission calculate karo driver ke totalAmount se (bookingPrice se nahi)
          //   const commissionAmount = (driverBalance * commissionPercent) / 100;

          //   console.log(`Driver ID: ${driverId}`);
          //   console.log(`Driver adminCommission in DB: "${driverDetails.adminCommission}"`);
          //   console.log(`Using commission percent: ${commissionPercent}%`);
          //   console.log(`Driver balance before deduction: ${driverBalance} MRU`);
          //   console.log(`Commission calculation: ${driverBalance} × ${commissionPercent}% = ${commissionAmount} MRU`);

          //   if (commissionAmount > 0) {
          //     // ===== DEDUCT COMMISSION FROM DRIVER'S totalAmount =====
          //     const newDriverBalance = driverBalance - commissionAmount;

          //     const driverUpdate = await db.users.update(
          //       { totalAmount: newDriverBalance.toFixed(2).toString() },
          //       { where: { id: driverId, role: "2" } }
          //     );

          //     console.log(`Driver update result: ${driverUpdate[0]} row(s) updated`);
          //     console.log(`Driver balance after deduction: ${newDriverBalance} MRU (deducted ${commissionAmount} MRU)`);

          //     // ===== ADD COMMISSION TO ADMIN'S totalAmount =====
          //     const adminUser = await db.users.findOne({
          //       where: { role: '0' },
          //       attributes: ['id', 'totalAmount'],
          //       raw: true
          //     });

          //     if (adminUser) {
          //       const adminBalance = parseFloat(adminUser.totalAmount) || 0;
          //       const newAdminBalance = adminBalance + commissionAmount;

          //       const adminUpdate = await db.users.update(
          //         { totalAmount: newAdminBalance.toFixed(2).toString() },
          //         { where: { id: adminUser.id, role: '0' } }
          //       );

          //       console.log(`Admin update result: ${adminUpdate[0]} row(s) updated`);
          //       console.log(`Admin balance: ${adminBalance} → ${newAdminBalance} MRU (added ${commissionAmount} MRU)`);

          //       // Create admin transaction
          //       try {
          //         await db.transactions.create({
          //           userId: adminUser.id,
          //           bookingId: bookingId,
          //           amount: commissionAmount.toString(),
          //           type: 'commission_earning',
          //           description: `Commission earned from driver #${driverId} (${commissionPercent}% of their balance)`,
          //           status: 'completed'
          //         });
          //       } catch (txError) {
          //         console.log("Admin transaction error:", txError.message);
          //       }
          //     }

          //     // Create driver transaction
          //     try {
          //       await db.transactions.create({
          //         userId: driverId,
          //         bookingId: bookingId,
          //         amount: commissionAmount.toString(),
          //         type: 'commission_deduction',
          //         description: `Admin commission ${commissionPercent}% deducted from your balance for ride #${bookingId}`,
          //         status: 'completed'
          //       });
          //     } catch (txError) {
          //       console.log("Driver transaction error:", txError.message);
          //     }
          //   } else {
          //     console.log("⚠️ Commission amount is 0, skipping deduction");
          //   }

          //   console.log("========== COMMISSION PROCESSING COMPLETE ==========");

          //   // Send notifications
          //   await emitToBoth(
          //     getUserMsg(`Ride finished successfully. Final price: ${roundedFinalPrice} MRU`,
          //       `تم الانتهاء من الرحلة بنجاح. السعر النهائي: ${roundedFinalPrice} MRU`,
          //       `Trajet terminé avec succès. Prix final: ${roundedFinalPrice} MRU`),
          //     getDriverMsg(`Ride finished successfully. Final price: ${roundedFinalPrice} MRU`,
          //       `تم الانتهاء من الرحلة بنجاح. السعر النهائي: ${roundedFinalPrice} MRU`,
          //       `Trajet terminé avec succès. Prix final: ${roundedFinalPrice} MRU`),
          //     "3"
          //   );

          //   if (user.deviceToken) {
          //     helper.sendNotification_android(user.deviceToken, {
          //       message: getUserMsg(
          //         `Your ride has been completed. Final price: ${roundedFinalPrice} MRU`,
          //         `تم إكمال رحلتك. السعر النهائي: ${roundedFinalPrice} MRU`,
          //         `Votre trajet est terminé. Prix final: ${roundedFinalPrice} MRU`
          //       ),
          //       type: 9,
          //       senderId: driverId,
          //       bookingId: booking.id
          //     });
          //   }
          //   break;
          case "3": // FINISHED - COMMISSION CUT HOGA YAHAN
            await stopRealTimePricing(bookingId);

            // Get final booking details
            const finalBooking = await db.bookings.findOne({
              where: { id: bookingId },
              raw: true
            });

            // Round final price to nearest 5
            let finalPrice = parseFloat(finalBooking.bookingPrice);
            let roundedFinalPrice = roundToNearest5(finalPrice);

            console.log("========== RIDE COMPLETED - COMMISSION PROCESSING ==========");
            console.log(`Booking ID: ${bookingId}`);
            console.log(`Final price: ${finalPrice} → ${roundedFinalPrice} MRU`);

            // ===== GET COMMISSION PERCENTAGE FROM ADMIN =====
            // Role 0 admin ka commission percent lein
            const adminUser = await db.users.findOne({
              where: { role: '0' },
              attributes: ['id', 'totalAmount', 'adminCommission'],
              raw: true
            });

            if (!adminUser) {
              console.log("❌ Admin user not found!");
              return socket.emit("rideStatusUpdate", {
                success: false,
                message: "Admin configuration not found."
              });
            }

            // Admin ka commission percent
            let commissionPercent = parseFloat(adminUser.adminCommission) || 15; // Default 15% agar null ho
            console.log(`Admin commission percent from DB: ${commissionPercent}%`);

            // ===== GET DRIVER DETAILS =====
            const driverDetails = await db.users.findOne({
              where: { id: driverId, role: "2" },
              attributes: ['id', 'totalAmount'],
              raw: true
            });

            if (!driverDetails) {
              console.log("❌ Driver not found!");
              return socket.emit("rideStatusUpdate", {
                success: false,
                message: "Driver not found."
              });
            }

            // ✅ Commission calculate karo BOOKING PRICE se
            const commissionAmount = (roundedFinalPrice * commissionPercent) / 100;

            // Driver ka current balance
            const driverBalance = parseFloat(driverDetails.totalAmount) || 0;

            // ✅ Driver ke account se commission CUT karo (subtract)
            const newDriverBalance = driverBalance - commissionAmount;

            console.log(`Booking price: ${roundedFinalPrice} MRU`);
            console.log(`Commission calculation: ${roundedFinalPrice} × ${commissionPercent}% = ${commissionAmount} MRU`);
            console.log(`Driver balance before deduction: ${driverBalance} MRU`);
            console.log(`Driver balance after deduction: ${newDriverBalance} MRU`);

            // ===== UPDATE DRIVER'S totalAmount (SUBTRACT COMMISSION) =====
            const driverUpdate = await db.users.update(
              { totalAmount: newDriverBalance.toFixed(2).toString() },
              { where: { id: driverId, role: "2" } }
            );

            console.log(`Driver update result: ${driverUpdate[0]} row(s) updated`);

            // ===== UPDATE ADMIN'S totalAmount (ADD COMMISSION) =====
            const adminBalance = parseFloat(adminUser.totalAmount) || 0;
            const newAdminBalance = adminBalance + commissionAmount;

            const adminUpdate = await db.users.update(
              { totalAmount: newAdminBalance.toFixed(2).toString() },
              { where: { id: adminUser.id, role: '0' } }
            );

            console.log(`Admin update result: ${adminUpdate[0]} row(s) updated`);
            console.log(`Admin balance: ${adminBalance} → ${newAdminBalance} MRU (added ${commissionAmount} MRU)`);

            // ===== CREATE TRANSACTION RECORDS =====

            // Admin transaction (commission earning)
            try {
              await db.transactions.create({
                userId: adminUser.id,
                bookingId: bookingId,
                amount: commissionAmount.toString(),
                type: 'commission_earning',
                description: `Commission earned from ride #${bookingId} (${commissionPercent}% of booking price)`,
                status: 'completed'
              });
              console.log("Admin transaction created successfully");
            } catch (txError) {
              console.log("Admin transaction error:", txError.message);
            }

            // Driver transaction (commission deduction)
            try {
              await db.transactions.create({
                userId: driverId,
                bookingId: bookingId,
                amount: commissionAmount.toString(),
                type: 'commission_deduction',
                description: `Admin commission ${commissionPercent}% deducted for ride #${bookingId}`,
                status: 'completed'
              });
              console.log("Driver transaction created successfully");
            } catch (txError) {
              console.log("Driver transaction error:", txError.message);
            }

            // Update booking with rounded price and status
            await db.bookings.update(
              {
                bookingPrice: roundedFinalPrice.toString(),
                status: "3"
              },
              { where: { id: bookingId } }
            );

            console.log("========== COMMISSION PROCESSING COMPLETE ==========");

            // Send notifications
            await emitToBoth(
              getUserMsg(`Ride finished successfully. Final price: ${roundedFinalPrice} MRU`,
                `تم الانتهاء من الرحلة بنجاح. السعر النهائي: ${roundedFinalPrice} MRU`,
                `Trajet terminé avec succès. Prix final: ${roundedFinalPrice} MRU`),
              getDriverMsg(`Ride finished successfully. Final price: ${roundedFinalPrice} MRU`,
                `تم الانتهاء من الرحلة بنجاح. السعر النهائي: ${roundedFinalPrice} MRU`,
                `Trajet terminé avec succès. Prix final: ${roundedFinalPrice} MRU`),
              "3"
            );

            if (user.deviceToken) {
              helper.sendNotification_android(user.deviceToken, {
                message: getUserMsg(
                  `Your ride has been completed. Final price: ${roundedFinalPrice} MRU`,
                  `تم إكمال رحلتك. السعر النهائي: ${roundedFinalPrice} MRU`,
                  `Votre trajet est terminé. Prix final: ${roundedFinalPrice} MRU`
                ),
                type: 9,
                senderId: driverId,
                bookingId: booking.id
              });
            }
            break;

          case "4": // CANCELLED
            await stopRealTimePricing(bookingId);
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
            statusCondition = { status: { [Op.in]: ['3', '4', '5', '6'] } };
          } else if (status === '4') {
            statusCondition = { status: { [Op.in]: ['4', '5', '6'] } };
          } else {
            statusCondition = { status: status };
          }
        }

        // const whereCondition = {
        //   [Op.or]: [{ driverId: userId }, { userId: userId }],
        //   ...statusCondition,
        //   request: { [Op.in]: ['1', '2'] }
        // };
        const whereCondition = {
          [Op.or]: [
            {
              driverId: userId,
              request: { [Op.in]: ['1', '2'] }
            },
            {
              userId: userId,
              request: { [Op.in]: ['1', '2'] }
            },
            {
              userId: userId,
              status: '0',
              request: '0'
            }
          ],
          ...statusCondition
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
              rideOpen: booking.rideOpen,
              callerCountryCode: booking.callerCountryCode || "",
              callerPhone: booking.callerPhone || "",
              callerName: booking.callerName || "",
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
        const onlineStatus = String(status);
        const [updated] = await db.users.update(
          { online: onlineStatus },
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

        // EMIT SOCKET TO RECEIVER 
        if (socketUser && socketUser.socketId) {
          io.to(socketUser.socketId).emit("user_constant_list", null);
          io.to(socketUser.socketId).emit("send_message", getMsgData);
        }

        // Echo back to sender
        socket.emit("send_message", getMsgData);

        // PUSH NOTIFICATION - CORRECTED
        if (socketUser && socketUser.deviceToken) {
          // Get sender user details for notification
          const senderUser = await db.users.findOne({
            where: { id: get_data.sender_id },
            attributes: ['firstName', 'lastName', 'image', 'role'],
            raw: true
          });

          // Get receiver user role
          const receiverUser = await db.users.findOne({
            where: { id: get_data.reciever_id },
            attributes: ['role'],
            raw: true
          });

          const senderName = senderUser ?
            `${senderUser.firstName || ''} ${senderUser.lastName || ''}`.trim() :
            "Someone";

          // Prepare notification data in the format your function expects
          const notificationData = {
            title: "New Message", // This will appear as notification title
            message: get_data.message || "You have a new message", // This will appear as notification body
            type: "3", // Chat message type
            senderId: get_data.sender_id.toString(),
            bookingId: (get_data.bookingId || "0").toString(),
            targetRole: receiverUser?.role || "1", // Add targetRole which is required by your function
            senderName: senderName,
            senderImage: senderUser?.image || "",
            // Additional data that might be useful
            chatConstant_id: chatConstantId.toString(),
            receiver_id: get_data.reciever_id.toString()
          };

          console.log("Sending push notification with:");
          console.log("Token:", socketUser.deviceToken);
          console.log("Notification data:", notificationData);

          // Call the function with correct parameters: (token, noti_data)
          helper.sendNotification_android(socketUser.deviceToken, notificationData)
            .then(result => {
              console.log("Push notification sent successfully");
            })
            .catch(error => {
              console.error("Failed to send push notification:", error);
            });
        }

      } catch (error) {
        console.error("Error in send_message socket:", error);
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


    socket.on("notification_count", async (data) => {
      try {
        const userId = data.userId;

        // Count unread
        const count = await db.notifications.count({
          where: {
            receiver_id: userId,
            is_read: 0
          }
        });

        // Get latest unread notification
        const latestNotification = await db.notifications.findOne({
          where: {
            receiver_id: userId,
            is_read: 0
          },
          order: [["id", "DESC"]],
          raw: true
        });

        socket.emit("notification_count", {
          userId: userId,
          unreadCount: count,
          type: "ride_request",
          bookingId: latestNotification ? latestNotification.bookingId : null
        });

      } catch (error) {
        console.log("Notification Error:", error);
      }
    });


    socket.on("notification_read_all", async (data) => {
      try {
        const userId = data.userId;
        await db.notifications.update(
          { is_read: 1 },   // 1 = read
          {
            where: {
              receiver_id: userId,
              is_read: 0     // only unread ones
            }
          }
        );

        const count = await db.notifications.count({
          where: {
            receiver_id: userId,
            is_read: 0
          }
        });

        socket.emit("notification_read_all", {
          message: "All notifications marked as read",
          userId: userId,
          unread_count: count
        });

      } catch (err) {
        console.log("Read All Notification Error:", err);
      }
    });



  });
};
