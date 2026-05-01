let db = require("../models");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const helper = require('../helper/helper');
const moment = require("moment")

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

    // socket.on("updateLocation1", async (data) => {
    //   try {
    //     const { userId, latitude, longitude, location } = data;

    //     if (!userId || latitude === undefined || longitude === undefined) {
    //       return socket.emit("updateLocation", {
    //         success: false,
    //         message: "User ID, latitude, and longitude are required"
    //       });
    //     }

    //     // ---------------- DRIVER CHECK ----------------
    //     const driver = await db.users.findOne({
    //       where: { id: userId, role: '2' }
    //     });

    //     if (!driver) {
    //       return socket.emit("updateLocation", {
    //         success: false,
    //         message: "Driver not found"
    //       });
    //     }

    //     // ---------------- UPDATE DRIVER LOCATION ----------------
    //     await db.users.update({
    //       latitude: latitude.toString(),
    //       longitude: longitude.toString(),
    //       location: location || null
    //     }, {
    //       where: { id: userId }
    //     });

    //     // OPEN RIDE LOGIC (rideOpen = 1 ONLY)
    //     const booking = await db.bookings.findOne({
    //       where: {
    //         driverId: userId,
    //         rideOpen: 1,
    //         status: '2', // ride started
    //         request: "1"
    //       }
    //     });

    //     if (booking) {
    //       const startLat = booking.lastLatitude
    //         ? parseFloat(booking.lastLatitude)
    //         : parseFloat(booking.pickupLatitude);

    //       const startLng = booking.lastLongitude
    //         ? parseFloat(booking.lastLongitude)
    //         : parseFloat(booking.pickupLongitude);

    //       const currLat = parseFloat(latitude);
    //       const currLng = parseFloat(longitude);

    //       if (
    //         !isNaN(startLat) &&
    //         !isNaN(startLng) &&
    //         !isNaN(currLat) &&
    //         !isNaN(currLng)
    //       ) {

    //         // ---------------- DISTANCE UTILS ----------------
    //         const toRad = v => v * Math.PI / 180;
    //         const calculateDistance = (a, b, c, d) => {
    //           const R = 6371;
    //           const dLat = toRad(c - a);
    //           const dLon = toRad(d - b);
    //           const x =
    //             Math.sin(dLat / 2) ** 2 +
    //             Math.cos(toRad(a)) * Math.cos(toRad(c)) *
    //             Math.sin(dLon / 2) ** 2;
    //           return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
    //         };

    //         const segmentDistanceKm = calculateDistance(
    //           startLat,
    //           startLng,
    //           currLat,
    //           currLng
    //         );

    //         // GPS noise ignore (only update if distance is between 0 and 30km)
    //         if (segmentDistanceKm > 0 && segmentDistanceKm <= 30) {

    //           // ---------------- ADMIN PRICE PER KM ----------------
    //           const adminData = await db.users.findOne({
    //             where: { role: '0' },
    //             attributes: ['rideAmount'],
    //             raw: true
    //           });

    //           const pricePerKm = adminData?.rideAmount
    //             ? parseFloat(adminData.rideAmount)
    //             : 10;

    //           const BASE_PRICE = 100; // Fixed base price in MRU

    //           if (!isNaN(pricePerKm) && pricePerKm > 0) {

    //             // Calculate total distance travelled so far
    //             const totalDistanceKm =
    //               parseFloat(booking.travelledDistance || 0) + segmentDistanceKm;

    //             // New price = Base price 100 + (total distance × price per km)
    //             const newBookingPrice = Math.round(
    //               BASE_PRICE + (totalDistanceKm * pricePerKm)
    //             ).toString();

    //             // Calculate distance charge separately for display if needed
    //             const distanceCharge = Math.round(totalDistanceKm * pricePerKm);

    //             // ---------------- UPDATE BOOKING ----------------
    //             await booking.update({
    //               dropLatitude: currLat.toString(),
    //               dropLongitude: currLng.toString(),
    //               dropLocation: location || booking.dropLocation,
    //               travelledDistance: totalDistanceKm.toString(),
    //               bookingPrice: newBookingPrice,
    //               lastLatitude: currLat.toString(),
    //               lastLongitude: currLng.toString()
    //             });

    //             console.log(`Open ride updated: Distance=${totalDistanceKm.toFixed(2)}km, Base=100, Distance Charge=${distanceCharge}, Total=${newBookingPrice}`);

    //             // ---------------- SOCKET UPDATE TO USER ----------------
    //             if (global.onlineUsers && onlineUsers[booking.userId]) {
    //               onlineUsers[booking.userId].forEach(sockId => {
    //                 io.to(sockId).emit("rideStatusUpdate", {
    //                   bookingId: booking.id,
    //                   dropLatitude: currLat.toString(),
    //                   dropLongitude: currLng.toString(),
    //                   bookingPrice: newBookingPrice,
    //                   rideDistanceKm: totalDistanceKm.toFixed(2),
    //                   // Optional: Send breakdown for better UX
    //                   priceBreakdown: {
    //                     basePrice: BASE_PRICE,
    //                     distanceKm: totalDistanceKm.toFixed(2),
    //                     pricePerKm: pricePerKm,
    //                     distanceCharge: distanceCharge,
    //                     total: newBookingPrice
    //                   }
    //                 });
    //               });
    //             }
    //           }
    //         }
    //       }
    //     }

    //     // ---------------- DRIVER RESPONSE ----------------
    //     const updatedDriver = await db.users.findOne({
    //       where: { id: userId }
    //     });

    //     socket.emit("updateLocation", {
    //       success: true,
    //       message: "Location updated successfully",
    //       data: {
    //         driverId: updatedDriver.id,
    //         latitude: updatedDriver.latitude,
    //         longitude: updatedDriver.longitude,
    //         location: updatedDriver.location
    //       }
    //     });

    //     // Broadcast to all other connected clients
    //     socket.broadcast.emit("updateLocation", {
    //       driverId: updatedDriver.id,
    //       latitude: updatedDriver.latitude,
    //       longitude: updatedDriver.longitude,
    //       location: updatedDriver.location
    //     });

    //   } catch (error) {
    //     console.error("Error updating location:", error);
    //     socket.emit("updateLocation", {
    //       success: false,
    //       message: "Something went wrong while updating location",
    //       error: error.message
    //     });
    //   }
    // });
    socket.on("updateLocation2", async (data) => {
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
              const FREE_KM = 3; // First 3 kilometers free

              if (!isNaN(pricePerKm) && pricePerKm > 0) {

                // Calculate total distance travelled so far
                const totalDistanceKm =
                  parseFloat(booking.travelledDistance || 0) + segmentDistanceKm;

                // Calculate extra kilometers beyond free km
                const extraKm = Math.max(0, totalDistanceKm - FREE_KM);

                // New price = Base price 100 + (extra km × price per km)
                const newBookingPrice = Math.round(
                  BASE_PRICE + (extraKm * pricePerKm)
                ).toString();

                // Calculate distance charge separately for display (only for extra km)
                const distanceCharge = Math.round(extraKm * pricePerKm);

                if (rideOpen == 1) {

                  var parking = ""

                }

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

                console.log(`Open ride updated: Total Distance=${totalDistanceKm.toFixed(2)}km, Extra Km=${extraKm.toFixed(2)}km, Base=100, Distance Charge=${distanceCharge}, Total=${newBookingPrice}`);

                // ---------------- SOCKET UPDATE TO USER ----------------
                if (global.onlineUsers && onlineUsers[booking.userId]) {
                  onlineUsers[booking.userId].forEach(sockId => {
                    io.to(sockId).emit("rideStatusUpdate", {
                      bookingId: booking.id,
                      dropLatitude: currLat.toString(),
                      dropLongitude: currLng.toString(),
                      bookingPrice: newBookingPrice,
                      rideDistanceKm: totalDistanceKm.toFixed(2),
                      // Send breakdown for better UX
                      priceBreakdown: {
                        basePrice: BASE_PRICE,
                        freeKm: FREE_KM,
                        totalDistanceKm: totalDistanceKm.toFixed(2),
                        extraKm: extraKm.toFixed(2),
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

    socket.on("updateLocation3", async (data) => {
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
        let booking = await db.bookings.findOne({
          where: {
            driverId: userId,
            rideOpen: 1,
            status: '2',
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
            // ========== PER-MINUTE +5 PRICE LOGIC ==========
            const PRICE_PER_MINUTE = 5;

            const currentTime = new Date();
            const lastUpdateTime = booking.lastUpdateTime
              ? new Date(booking.lastUpdateTime)
              : new Date(booking.createdAt);

            const minutesSinceLastUpdate = Math.floor(
              (currentTime - lastUpdateTime) / (1000 * 60)
            );

            // Only add if at least 1 full minute has passed
            const perMinuteCharge = minutesSinceLastUpdate > 0
              ? minutesSinceLastUpdate * PRICE_PER_MINUTE
              : 0;

            if (perMinuteCharge > 0) {
              console.log(`⏱️ Per-minute charge: +₹${perMinuteCharge} (${minutesSinceLastUpdate} min × ₹${PRICE_PER_MINUTE})`);
            }

            // ========== PARKING CHARGE LOGIC WITH 5 MIN GRACE PERIOD ==========
            const PARKING_THRESHOLD_KM = 0.01; // 10 meters threshold
            const GRACE_PERIOD_MINUTES = 5; // 5 minutes free waiting time

            // Get admin parking charge rate
            const adminData = await db.users.findOne({
              where: { role: '0' },
              attributes: ['parkingCharge', 'rideAmount'],
              raw: true
            });

            const parkingRatePerMinute = parseFloat(adminData?.parkingCharge) || 0;
            const pricePerKm = parseFloat(adminData?.rideAmount) || 10;

            // ***** UPDATED LOGIC WITH GRACE PERIOD *****
            if (segmentDistanceKm <= PARKING_THRESHOLD_KM) {

              if (parkingRatePerMinute > 0 && minutesSinceLastUpdate > 0) {
                let lastParkingMinutes = parseFloat(booking.lastParkingMinutes || 0);
                let existingParkingCharge = parseFloat(booking.totalParkingCharge || 0);

                // Calculate total waiting minutes including this interval
                const totalWaitingMinutes = lastParkingMinutes + minutesSinceLastUpdate;

                let parkingChargeToAdd = 0;
                let chargeableMinutes = 0;

                // Check if total waiting minutes exceed grace period
                if (totalWaitingMinutes > GRACE_PERIOD_MINUTES) {
                  if (lastParkingMinutes <= GRACE_PERIOD_MINUTES) {
                    chargeableMinutes = totalWaitingMinutes - GRACE_PERIOD_MINUTES;
                  } else {
                    chargeableMinutes = minutesSinceLastUpdate;
                  }
                  parkingChargeToAdd = chargeableMinutes * parkingRatePerMinute;
                } else {
                  console.log(`✅ Still within ${GRACE_PERIOD_MINUTES} min grace period - No parking charge`);
                }

                const newTotalParkingMinutes = totalWaitingMinutes;
                const newTotalParkingCharge = existingParkingCharge + parkingChargeToAdd;

                // ---- COMBINE: existing bookingPrice + per-minute + parking ----
                const currentBookingPrice = parseFloat(booking.bookingPrice || 0);
                const newBookingPrice = Math.round(
                  currentBookingPrice + perMinuteCharge + parkingChargeToAdd
                );

                // Update booking with parking data + per-minute charge + new time
                await booking.update({
                  lastParkingMinutes: newTotalParkingMinutes.toString(),
                  totalParkingCharge: newTotalParkingCharge.toString(),
                  bookingPrice: newBookingPrice.toString(),
                  lastUpdateTime: currentTime, // Update time but NOT location
                });

                await booking.reload();

                if (parkingChargeToAdd > 0) {
                  console.log(`✅ Parking Added: +${chargeableMinutes} min → +₹${parkingChargeToAdd}`);
                }
                console.log(`💰 Per-min: +₹${perMinuteCharge} | Parking: ₹${newTotalParkingCharge} | Total Price: ₹${newBookingPrice}`);

                // Send parking update to user
                if (global.onlineUsers && onlineUsers[booking.userId]) {
                  onlineUsers[booking.userId].forEach(sockId => {
                    io.to(sockId).emit("parkingChargeUpdate", {
                      bookingId: booking.id,
                      parkingMinutesAdded: chargeableMinutes,
                      waitingMinutesTotal: newTotalParkingMinutes,
                      gracePeriodMinutes: GRACE_PERIOD_MINUTES,
                      parkingChargeAdded: parkingChargeToAdd,
                      totalParkingCharge: newTotalParkingCharge,
                      totalParkingMinutes: newTotalParkingMinutes,
                      perMinuteChargeAdded: perMinuteCharge,
                      bookingPrice: newBookingPrice,
                      isGracePeriod: newTotalParkingMinutes <= GRACE_PERIOD_MINUTES
                    });
                  });
                }

              } else if (perMinuteCharge > 0) {
                // Parking rate is 0 but per-minute charge still applies
                const currentBookingPrice = parseFloat(booking.bookingPrice || 0);
                const newBookingPrice = Math.round(currentBookingPrice + perMinuteCharge);

                await booking.update({
                  bookingPrice: newBookingPrice.toString(),
                  lastUpdateTime: currentTime,
                });

                await booking.reload();
                if (global.onlineUsers && onlineUsers[booking.userId]) {
                  onlineUsers[booking.userId].forEach(sockId => {
                    io.to(sockId).emit("parkingChargeUpdate", {
                      bookingId: booking.id,
                      perMinuteChargeAdded: perMinuteCharge,
                      bookingPrice: newBookingPrice,
                      isGracePeriod: false
                    });
                  });
                }
              }

            } else
              if (segmentDistanceKm > PARKING_THRESHOLD_KM && segmentDistanceKm <= 30) {
                // Driver is MOVING - Reset parking and update location
                console.log(" Driver MOVING - Resetting parking and updating location");

                let currentTotalParkingCharge = parseFloat(booking.totalParkingCharge || 0);

                // Calculate distance charge
                const totalDistanceKm = parseFloat(booking.travelledDistance || 0) + segmentDistanceKm;
                const BASE_PRICE = 100;
                const FREE_KM = 3;
                const extraKm = Math.max(0, totalDistanceKm - FREE_KM);
                const distanceCharge = Math.round(extraKm * pricePerKm);

                // ---- COMBINE: base + distance + parking + per-minute ----
                const newBookingPrice = Math.round(
                  BASE_PRICE + distanceCharge + currentTotalParkingCharge + perMinuteCharge
                );

                // Update booking with new location, reset parking minutes, apply per-minute charge
                await booking.update({
                  dropLatitude: currLat.toString(),
                  dropLongitude: currLng.toString(),
                  dropLocation: location || booking.dropLocation,
                  travelledDistance: totalDistanceKm.toString(),
                  bookingPrice: newBookingPrice.toString(),
                  lastLatitude: currLat.toString(),
                  lastLongitude: currLng.toString(),
                  lastUpdateTime: currentTime,
                  lastParkingMinutes: '0' // Reset parking minutes when moving
                });

                await booking.reload();

                console.log(`📊 MOVING UPDATE:`);
                console.log(`  Distance: +${segmentDistanceKm.toFixed(3)}km (Total: ${totalDistanceKm.toFixed(2)}km)`);
                console.log(`  Per-min charge: +₹${perMinuteCharge}`);
                console.log(`  Parking: ₹${currentTotalParkingCharge}`);
                console.log(`  Total Price: ₹${newBookingPrice}`);

                // Send ride update to user
                if (global.onlineUsers && onlineUsers[booking.userId]) {
                  onlineUsers[booking.userId].forEach(sockId => {
                    io.to(sockId).emit("rideStatusUpdate", {
                      bookingId: booking.id,
                      dropLatitude: currLat.toString(),
                      dropLongitude: currLng.toString(),
                      bookingPrice: newBookingPrice.toString(),
                      rideDistanceKm: totalDistanceKm.toFixed(2),
                      totalParkingCharge: currentTotalParkingCharge,
                      perMinuteChargeAdded: perMinuteCharge,
                      priceBreakdown: {
                        basePrice: BASE_PRICE,
                        freeKm: FREE_KM,
                        totalDistanceKm: totalDistanceKm.toFixed(2),
                        extraKm: extraKm.toFixed(2),
                        pricePerKm: pricePerKm,
                        distanceCharge: distanceCharge,
                        parkingCharge: currentTotalParkingCharge,
                        perMinuteCharge: perMinuteCharge,
                        total: newBookingPrice
                      }
                    });
                  });
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
    // socket.on("updateLocation123", async (data) => {
    //   try {
    //     const { userId, latitude, longitude, location } = data;

    //     if (!userId || latitude === undefined || longitude === undefined) {
    //       return socket.emit("updateLocation", {
    //         success: false,
    //         message: "User ID, latitude, and longitude are required"
    //       });
    //     }

    //     // Driver check
    //     const driver = await db.users.findOne({
    //       where: { id: userId, role: '2' }
    //     });

    //     if (!driver) {
    //       return socket.emit("updateLocation", {
    //         success: false,
    //         message: "Driver not found"
    //       });
    //     }

    //     // Update driver location
    //     await db.users.update({
    //       latitude: latitude.toString(),
    //       longitude: longitude.toString(),
    //       location: location || null
    //     }, {
    //       where: { id: userId }
    //     });

    //     // Get active booking (status '2' AND rideOpen = 1)
    //     const booking = await db.bookings.findOne({
    //       where: {
    //         driverId: userId,
    //         rideOpen: 1,
    //         status: '2',
    //         request: "1"
    //       }
    //     });

    //     if (booking && booking.rideOpen == 1) {
    //       const currentTime = new Date();

    //       // Get admin settings
    //       const adminData = await db.users.findOne({
    //         where: { role: '0' },
    //         attributes: ['parkingCharge', 'rideAmount'],
    //         raw: true
    //       });

    //       const PER_MINUTE_CHARGE_RATE = 5;
    //       const parkingRatePerMinute = parseFloat(adminData?.parkingCharge) || 5;
    //       const pricePerKm = adminData?.rideAmount ? parseFloat(adminData.rideAmount) : 10;

    //       let totalParkingCharge = parseFloat(booking.totalParkingCharge || 0);
    //       let totalPerMinuteCharge = 0;

    //       // ========== TIME-BASED CHARGES (Calculate from rideStartTime) ==========
    //       if (booking.rideStartTime && booking.rideStartTime !== "0") {
    //         const rideStartTime = new Date(booking.rideStartTime);

    //         // Calculate minutes passed - wait for 1 full minute before adding first ₹5
    //         // Using floor: 0-59 seconds = 0 minutes, 60-119 seconds = 1 minute
    //         const minutesPassed = Math.floor((currentTime - rideStartTime) / (1000 * 60));

    //         // Total per minute charge = minutes passed × ₹5
    //         // This means: first 60 seconds = ₹0, after 60 seconds = ₹5
    //         totalPerMinuteCharge = minutesPassed * PER_MINUTE_CHARGE_RATE;

    //         console.log(`⏱️ Ride started at: ${booking.rideStartTime}`);
    //         console.log(`⏱️ Minutes passed (full minutes completed): ${minutesPassed}`);
    //         console.log(`⏱️ Total per minute charge: ₹${totalPerMinuteCharge}`);

    //         // ========== EXTRA PARKING CHARGE (Calculate from startParkTime) ==========
    //         if (booking.parkingActive === "1" && booking.startParkTime && booking.startParkTime !== "") {
    //           const parkStartTime = new Date(booking.startParkTime);
    //           const totalParkMinutesThisSession = Math.floor((currentTime - parkStartTime) / (1000 * 60));

    //           if (totalParkMinutesThisSession > 5) {
    //             const chargeableMinutes = totalParkMinutesThisSession - 5;
    //             const previousChargeableMinutes = parseFloat(booking.lastParkingMinutes || 0);

    //             if (chargeableMinutes > previousChargeableMinutes) {
    //               const additionalParkMinutes = chargeableMinutes - previousChargeableMinutes;
    //               const additionalParkedCharge = additionalParkMinutes * parkingRatePerMinute;
    //               totalParkingCharge += additionalParkedCharge;

    //               await booking.update({
    //                 totalParkingCharge: totalParkingCharge.toString(),
    //                 lastParkingMinutes: chargeableMinutes.toString()
    //               });

    //               console.log(`🅿️ EXTRA PARKING CHARGE: +₹${additionalParkedCharge}`);
    //             }
    //           }
    //         }
    //       }

    //       // ========== DISTANCE CALCULATION ==========
    //       let totalDistanceKm = parseFloat(booking.travelledDistance || 0);

    //       const startLat = booking.lastLatitude && booking.lastLatitude !== ""
    //         ? parseFloat(booking.lastLatitude)
    //         : parseFloat(booking.pickupLatitude);

    //       const startLng = booking.lastLongitude && booking.lastLongitude !== ""
    //         ? parseFloat(booking.lastLongitude)
    //         : parseFloat(booking.pickupLongitude);

    //       const currLat = parseFloat(latitude);
    //       const currLng = parseFloat(longitude);

    //       if (!isNaN(startLat) && !isNaN(startLng) && !isNaN(currLat) && !isNaN(currLng)) {
    //         const toRad = v => v * Math.PI / 180;
    //         const calculateDistance = (a, b, c, d) => {
    //           const R = 6371;
    //           const dLat = toRad(c - a);
    //           const dLon = toRad(d - b);
    //           const x = Math.sin(dLat / 2) ** 2 +
    //             Math.cos(toRad(a)) * Math.cos(toRad(c)) *
    //             Math.sin(dLon / 2) ** 2;
    //           return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
    //         };

    //         const segmentDistanceKm = calculateDistance(startLat, startLng, currLat, currLng);

    //         // Only add distance if moved more than 5 meters AND not in parking mode
    //         if (segmentDistanceKm > 0.005 && booking.parkingActive !== "1") {
    //           totalDistanceKm += segmentDistanceKm;

    //           await booking.update({
    //             travelledDistance: totalDistanceKm.toString(),
    //             lastLatitude: currLat.toString(),
    //             lastLongitude: currLng.toString()
    //           });

    //           console.log(`📏 DISTANCE ADDED: +${segmentDistanceKm.toFixed(3)}km`);
    //         }
    //       }

    //       // ========== CALCULATE TOTAL PRICE ==========
    //       const BASE_PRICE = 100;
    //       const FREE_KM = 3;

    //       const extraKm = Math.max(0, totalDistanceKm - FREE_KM);
    //       const distanceCharge = Math.round(extraKm * pricePerKm);
    //       const calculatedPrice = Math.round(BASE_PRICE + distanceCharge + totalPerMinuteCharge + totalParkingCharge);

    //       const minutesPassed = Math.floor((currentTime - new Date(booking.rideStartTime)) / (1000 * 60));

    //       console.log(`========== PRICE BREAKDOWN ==========`);
    //       console.log(`💰 TOTAL PRICE: ₹${calculatedPrice}`);
    //       console.log(`   Base: ₹${BASE_PRICE}`);
    //       console.log(`   Distance: ₹${distanceCharge} (${totalDistanceKm.toFixed(2)}km)`);
    //       console.log(`   Per Minute (₹5 × ${minutesPassed} completed minutes): ₹${totalPerMinuteCharge}`);
    //       console.log(`   Extra Parking: ₹${totalParkingCharge}`);
    //       console.log(`====================================`);

    //       // Update booking with all values
    //       await booking.update({
    //         dropLatitude: latitude.toString(),
    //         dropLongitude: longitude.toString(),
    //         dropLocation: location || booking.dropLocation,
    //         bookingPrice: calculatedPrice.toString(),
    //         totalPerMinuteCharge: totalPerMinuteCharge.toString(),
    //         totalParkingCharge: totalParkingCharge.toString(),
    //         lastUpdateTime: currentTime
    //       });

    //       // Send real-time update to user
    //       if (global.onlineUsers && onlineUsers[booking.userId]) {
    //         onlineUsers[booking.userId].forEach(sockId => {
    //           io.to(sockId).emit("rideStatusUpdate", {
    //             success: true,
    //             bookingId: booking.id,
    //             bookingPrice: calculatedPrice.toString(),
    //             rideDistanceKm: totalDistanceKm.toFixed(2),
    //             totalPerMinuteCharge: totalPerMinuteCharge,
    //             totalParkingCharge: totalParkingCharge,
    //             totalMinutesSinceRideStart: minutesPassed
    //           });
    //         });
    //       }
    //     }

    //     // Send success response to driver
    //     const updatedDriver = await db.users.findOne({
    //       where: { id: userId }
    //     });

    //     socket.emit("updateLocation", {
    //       success: true,
    //       message: "Location updated successfully",
    //       data: {
    //         driverId: updatedDriver.id,
    //         latitude: updatedDriver.latitude,
    //         longitude: updatedDriver.longitude,
    //         location: updatedDriver.location
    //       }
    //     });

    //     socket.broadcast.emit("updateLocation", {
    //       driverId: updatedDriver.id,
    //       latitude: updatedDriver.latitude,
    //       longitude: updatedDriver.longitude,
    //       location: updatedDriver.location
    //     });

    //   } catch (error) {
    //     console.error("Error updating location:", error);
    //     socket.emit("updateLocation", {
    //       success: false,
    //       message: "Something went wrong while updating location",
    //       error: error.message
    //     });
    //   }
    // });
    socket.on("updateLocation", async (data) => {
      try {
        const { userId, latitude, longitude, location } = data;

        if (!userId || latitude === undefined || longitude === undefined) {
          return socket.emit("updateLocation", {
            success: false,
            message: "User ID, latitude, and longitude are required"
          });
        }

        // Driver check
        const driver = await db.users.findOne({
          where: { id: userId, role: '2' }
        });

        if (!driver) {
          return socket.emit("updateLocation", {
            success: false,
            message: "Driver not found"
          });
        }

        // Update driver location
        await db.users.update({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          location: location || null
        }, {
          where: { id: userId }
        });

        // Get active booking (status '2')
        const booking = await db.bookings.findOne({
          where: {
            driverId: userId,
            status: '2',
            request: "1"
          }
        });

        if (booking) {
          const currentTime = new Date();

          // Get admin settings
          const adminData = await db.users.findOne({
            where: { role: '0' },
            attributes: ['parkingCharge', 'rideAmount'],
            raw: true
          });

          const PER_MINUTE_CHARGE_RATE = 5;
          const parkingRatePerMinute = parseFloat(adminData?.parkingCharge) || 5;
          const pricePerKm = adminData?.rideAmount ? parseFloat(adminData.rideAmount) : 10;

          let totalParkingCharge = parseFloat(booking.totalParkingCharge || 0);
          let totalPerMinuteCharge = 0;

          // ========== CONDITION: ONLY WHEN rideOpen = 1 ==========
          if (booking.rideOpen == 1) {

            if (booking.rideStartTime && booking.rideStartTime !== "0") {
              const rideStartTime = new Date(booking.rideStartTime);
              const timeDiffMs = currentTime - rideStartTime;
              const timeDiffSeconds = Math.floor(timeDiffMs / 1000);
              const minutesPassed = Math.floor(timeDiffSeconds / 120);

              totalPerMinuteCharge = minutesPassed * PER_MINUTE_CHARGE_RATE;

              // ========== EXTRA PARKING CHARGE (Calculate from startParkTime) ==========
              if (booking.parkingActive === "1" && booking.startParkTime && booking.startParkTime !== "") {
                const parkStartTime = new Date(booking.startParkTime);
                const parkTimeDiffMs = currentTime - parkStartTime;
                const parkTimeDiffSeconds = Math.floor(parkTimeDiffMs / 1000);
                const totalParkMinutesThisSession = Math.floor(parkTimeDiffSeconds / 60);

                if (totalParkMinutesThisSession > 5) {
                  const chargeableMinutes = totalParkMinutesThisSession - 5;
                  const previousChargeableMinutes = parseFloat(booking.lastParkingMinutes || 0);

                  if (chargeableMinutes > previousChargeableMinutes) {
                    const additionalParkMinutes = chargeableMinutes - previousChargeableMinutes;
                    const additionalParkedCharge = additionalParkMinutes * parkingRatePerMinute;
                    totalParkingCharge += additionalParkedCharge;

                    await booking.update({
                      totalParkingCharge: totalParkingCharge.toString(),
                      lastParkingMinutes: chargeableMinutes.toString()
                    });

                  }
                }
              }
            }
          } else {
            totalPerMinuteCharge = 0;
            totalParkingCharge = 0;
          }

          // ========== DISTANCE CALCULATION (Always runs) ==========
          let totalDistanceKm = parseFloat(booking.travelledDistance || 0);

          const startLat = booking.lastLatitude && booking.lastLatitude !== ""
            ? parseFloat(booking.lastLatitude)
            : parseFloat(booking.pickupLatitude);

          const startLng = booking.lastLongitude && booking.lastLongitude !== ""
            ? parseFloat(booking.lastLongitude)
            : parseFloat(booking.pickupLongitude);

          const currLat = parseFloat(latitude);
          const currLng = parseFloat(longitude);

          if (!isNaN(startLat) && !isNaN(startLng) && !isNaN(currLat) && !isNaN(currLng)) {
            const toRad = v => v * Math.PI / 180;
            const calculateDistance = (a, b, c, d) => {
              const R = 6371;
              const dLat = toRad(c - a);
              const dLon = toRad(d - b);
              const x = Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(a)) * Math.cos(toRad(c)) *
                Math.sin(dLon / 2) ** 2;
              return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
            };

            const segmentDistanceKm = calculateDistance(startLat, startLng, currLat, currLng);

            // Only add distance if moved more than 5 meters
            if (segmentDistanceKm > 0.005) {
              totalDistanceKm += segmentDistanceKm;

              await booking.update({
                travelledDistance: totalDistanceKm.toString(),
                lastLatitude: currLat.toString(),
                lastLongitude: currLng.toString()
              });

              console.log(`📏 DISTANCE ADDED: +${segmentDistanceKm.toFixed(3)}km`);
            }
          }

          // ========== CALCULATE TOTAL PRICE ==========
          const BASE_PRICE = 100;
          const FREE_KM = 3;

          const extraKm = Math.max(0, totalDistanceKm - FREE_KM);
          const distanceCharge = Math.round(extraKm * pricePerKm);

          // Calculate final price based on rideOpen
          let calculatedPrice;
          let minutesPassed = 0;
          let timeElapsedSeconds = 0;

          if (booking.rideOpen == 1 && booking.rideStartTime && booking.rideStartTime !== "0") {
            const rideStartTime = new Date(booking.rideStartTime);
            timeElapsedSeconds = Math.floor((currentTime - rideStartTime) / 1000);
            minutesPassed = Math.floor(timeElapsedSeconds / 60);

            // rideOpen = 1: Base + Distance + Per Minute + Parking
            calculatedPrice = Math.round(BASE_PRICE + distanceCharge + totalPerMinuteCharge + totalParkingCharge);

           
          } else {
            // rideOpen = 0: Only Base + Distance (No per minute, no parking)
            calculatedPrice = Math.round(BASE_PRICE + distanceCharge);

          }

          // Update booking with all values
          const updateData = {
            dropLatitude: latitude.toString(),
            dropLongitude: longitude.toString(),
            dropLocation: location || booking.dropLocation,
            bookingPrice: calculatedPrice.toString(),
            lastUpdateTime: currentTime
          };

          // Only update per minute and parking charges if rideOpen = 1
          if (booking.rideOpen == 1) {
            updateData.totalPerMinuteCharge = totalPerMinuteCharge.toString();
            updateData.totalParkingCharge = totalParkingCharge.toString();
          }

          await booking.update(updateData);

          // Send real-time update to user
          if (global.onlineUsers && onlineUsers[booking.userId]) {
            const emitData = {
              success: true,
              bookingId: booking.id,
              bookingPrice: calculatedPrice.toString(),
              rideDistanceKm: totalDistanceKm.toFixed(2),
              rideOpen: booking.rideOpen
            };

            if (booking.rideOpen == 1) {
              emitData.totalPerMinuteCharge = totalPerMinuteCharge;
              emitData.totalParkingCharge = totalParkingCharge;
              emitData.totalMinutesSinceRideStart = minutesPassed;
              emitData.timeElapsedSeconds = timeElapsedSeconds;
            }

            onlineUsers[booking.userId].forEach(sockId => {
              io.to(sockId).emit("rideStatusUpdate", emitData);
            });
          }
        }

        // Send success response to driver
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

                  // CHECK WHEN LAST LOCATION UPDATE WAS RECEIVED
                  const lastUpdateTime = currentBooking.lastUpdateTime
                    ? new Date(currentBooking.lastUpdateTime)
                    : new Date(currentBooking.createdAt);

                  const currentTime = new Date();
                  const secondsSinceLastUpdate = (currentTime - lastUpdateTime) / 1000;

                  console.log(`📡 Last location update was ${Math.round(secondsSinceLastUpdate)} seconds ago`);

                  // IF MORE THAN 60 SECONDS - ADD FALLBACK PER-MINUTE CHARGE
                  if (secondsSinceLastUpdate >= 60) {
                    const minutesSinceLastUpdate = Math.floor(secondsSinceLastUpdate / 60);
                    const PRICE_PER_MINUTE = 5;
                    const fallbackCharge = minutesSinceLastUpdate * PRICE_PER_MINUTE;

                    if (fallbackCharge > 0) {
                      const currentPrice = parseFloat(currentBooking.bookingPrice || 100);
                      const newPrice = currentPrice + fallbackCharge;
                      const totalMinutes = (parseInt(currentBooking.totalMinutes) || 0) + minutesSinceLastUpdate;

                      await db.bookings.update(
                        {
                          bookingPrice: newPrice.toString(),
                          totalMinutes: totalMinutes.toString(),
                          lastPriceUpdate: currentTime.toISOString(),
                        },
                        { where: { id: bookingId } }
                      );

                      console.log(`⚠️ FALLBACK CHARGE: No location update for ${Math.round(secondsSinceLastUpdate)}s`);
                      console.log(`   Added: +${fallbackCharge} MRU (${minutesSinceLastUpdate} min × ₹${PRICE_PER_MINUTE})`);
                      console.log(`   New Price: ${newPrice} MRU`);

                      // Send notification to both driver and user
                      if (onlineUsers[currentBooking.driverId]) {
                        onlineUsers[currentBooking.driverId].forEach(sockId => {
                          io.to(sockId).emit("priceUpdate", {
                            bookingId: bookingId,
                            newPrice: newPrice.toString(),
                            totalMinutes: totalMinutes,
                            addedAmount: fallbackCharge,
                            reason: "no_location_update",
                            minutesWithoutUpdate: minutesSinceLastUpdate,
                            timestamp: currentTime.toISOString()
                          });
                        });
                      }

                      if (onlineUsers[currentBooking.userId]) {
                        onlineUsers[currentBooking.userId].forEach(sockId => {
                          io.to(sockId).emit("priceUpdate", {
                            bookingId: bookingId,
                            newPrice: newPrice.toString(),
                            totalMinutes: totalMinutes,
                            addedAmount: fallbackCharge,
                            reason: "no_location_update",
                            minutesWithoutUpdate: minutesSinceLastUpdate,
                            timestamp: currentTime.toISOString()
                          });
                        });
                      }
                    }
                  } else {
                    console.log(`✅ Recent location update (${Math.round(secondsSinceLastUpdate)}s ago) - No fallback charge`);
                  }

                } catch (error) {
                  console.error(`Error in price interval for booking ${bookingId}:`, error);
                }
              }, 30000); // Check every 30 seconds instead of 60 for quicker detection

              global.priceIntervals[bookingId] = intervalId;
              if (!global.lastLocationUpdateTimes) {
                global.lastLocationUpdateTimes = {};
              }
              global.lastLocationUpdateTimes[bookingId] = new Date();

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
            rideStartTime = moment().format("YYYY-MM-DD HH:mm");
            await booking.update({
              status: "2",
              rideStartTime: rideStartTime,
              lastPerMinuteCalculation: new Date(),
              totalPerMinuteCharge: "0",
              totalParkingCharge: "0"
              // lastUpdateTime: new Date() // ← Set lastUpdateTime at ride start so per-minute calc is accurate
            });

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

          case "3": // FINISHED - COMMISSION CUT HOGA YAHAN
            await stopRealTimePricing(bookingId);

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

            let commissionPercent = parseFloat(adminUser.adminCommission) || 15;
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

            const commissionAmount = (roundedFinalPrice * commissionPercent) / 100;
            const driverBalance = parseFloat(driverDetails.totalAmount) || 0;
            const newDriverBalance = driverBalance - commissionAmount;

            console.log(`Booking price: ${roundedFinalPrice} MRU`);
            console.log(`Commission calculation: ${roundedFinalPrice} × ${commissionPercent}% = ${commissionAmount} MRU`);
            console.log(`Driver balance before deduction: ${driverBalance} MRU`);
            console.log(`Driver balance after deduction: ${newDriverBalance} MRU`);

            const driverUpdate = await db.users.update(
              { totalAmount: newDriverBalance.toFixed(2).toString() },
              { where: { id: driverId, role: "2" } }
            );

            console.log(`Driver update result: ${driverUpdate[0]} row(s) updated`);

            const adminBalance = parseFloat(adminUser.totalAmount) || 0;
            const newAdminBalance = adminBalance + commissionAmount;

            const adminUpdate = await db.users.update(
              { totalAmount: newAdminBalance.toFixed(2).toString() },
              { where: { id: adminUser.id, role: '0' } }
            );

            console.log(`Admin update result: ${adminUpdate[0]} row(s) updated`);
            console.log(`Admin balance: ${adminBalance} → ${newAdminBalance} MRU (added ${commissionAmount} MRU)`);

            // ===== CREATE TRANSACTION RECORDS =====
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

            await db.bookings.update(
              {
                bookingPrice: roundedFinalPrice.toString(),
                status: "3",
                adminAmountCut: commissionAmount.toString()
              },
              { where: { id: bookingId } }
            );

            console.log("========== COMMISSION PROCESSING COMPLETE ==========");

            await emitToBoth(
              getUserMsg(`Ride finished successfully.`,
                `تم الانتهاء من الرحلة بنجاح. السعر النهائي`,
                `Trajet terminé avec succès. Prix final`),
              getDriverMsg(`Ride finished successfully. `,
                `تم الانتهاء من الرحلة بنجاح. السعر النهائي`,
                `Trajet terminé avec succès. Prix final`),
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
    socket.on("parkingStatus", async (data) => {
      try {
        const { userId, bookingId, status } = data;

        if (!userId || !bookingId || status === undefined) {
          return socket.emit("parkingStatus", {
            success: false,
            message: "User ID, Booking ID, and status are required"
          });
        }

        if (!['0', '1'].includes(status.toString())) {
          return socket.emit("parkingStatus", {
            success: false,
            message: "Status must be 0 (stop) or 1 (start)"
          });
        }

        const driver = await db.users.findOne({
          where: { id: userId, role: '2' }
        });

        if (!driver) {
          return socket.emit("parkingStatus", {
            success: false,
            message: "Driver not found"
          });
        }

        const booking = await db.bookings.findOne({
          where: {
            id: bookingId,
            driverId: userId,
            rideOpen: 1,
            status: '2'
          },
          include: [{
            model: db.users,
            as: 'userbook',
            attributes: ['id', 'deviceToken', 'languagee_type']
          }]
        });

        if (!booking) {
          return socket.emit("parkingStatus", {
            success: false,
            message: "Active booking not found"
          });
        }

        const user = booking.userbook;
        if (!user) {
          return socket.emit("parkingStatus", {
            success: false,
            message: "User not found"
          });
        }

        const currentTime = new Date();
        const currentTimeString = currentTime.toISOString();

        // Language helper for user
        const getUserMsg = (en, ar, fr) => {
          const lang = user.languagee_type;
          if (lang === 1) return ar;
          if (lang === 2) return fr;
          return en;
        };

        if (status == 1) {
          // START PARKING
          if (booking.startParkTime && booking.startParkTime !== "") {
            return socket.emit("parkingStatus", {
              success: false,
              message: "Parking already active"
            });
          }

          await booking.update({
            startParkTime: currentTimeString,
            endParkTime: "",
            parkingActive: "1"
          });


          // Send notification to user
           const parkingStopMessage = getUserMsg(
        `Driver has stopped parking. Total parking time: ${totalParkMinutes} minutes. ${chargeableMinutes > 0 ? `Parking charge: ${chargeableMinutes} × 5 MRU = ${chargeableMinutes * 5} MRU` : "No parking charge (first 5 minutes free)"}.`,
        `توقف السائق عن ركن السيارة. إجمالي وقت الوقوف: ${totalParkMinutes} دقيقة. ${chargeableMinutes > 0 ? `رسوم الوقوف: ${chargeableMinutes} × 5 أوقية = ${chargeableMinutes * 5} أوقية` : "لا توجد رسوم وقوف (أول 5 دقائق مجانية)"}.`,
        `Le conducteur a arrêté de se garer. Durée totale de stationnement: ${totalParkMinutes} minutes. ${chargeableMinutes > 0 ? `Frais de stationnement: ${chargeableMinutes} × 5 MRU = ${chargeableMinutes * 5} MRU` : "Pas de frais de stationnement (5 premières minutes gratuites)"}.`
      );
          // Send via socket
          if (global.onlineUsers && onlineUsers[booking.userId]) {
            onlineUsers[booking.userId].forEach(sockId => {
              io.to(sockId).emit("parkingStatusUpdate", {
                success: true,
                bookingId: booking.id,
                parkingStatus: 1,
                startParkTime: currentTimeString,
                message: parkingStartMessage
              });
            });
          }

          // Send push notification
          if (user.deviceToken) {
            helper.sendNotification_android(user.deviceToken, {
              message: parkingStartMessage,
              type: 10, // Parking started type
              senderId: userId,
              bookingId: booking.id
            });
          }

          socket.emit("parkingStatus", {
            success: true,
            message: "Parking started",
            data: {
              bookingId: booking.id,
              parkingStatus: 1,
              startParkTime: currentTimeString
            }
          });

        } else if (status == 0) {
          // STOP PARKING
          if (!booking.startParkTime || booking.startParkTime === "") {
            return socket.emit("parkingStatus", {
              success: false,
              message: "No active parking"
            });
          }

          // Calculate parking duration
          const parkStartTime = new Date(booking.startParkTime);
          const totalParkMinutes = Math.floor((currentTime - parkStartTime) / (1000 * 60));
          const chargeableMinutes = totalParkMinutes > 5 ? totalParkMinutes - 5 : 0;

          await booking.update({
            endParkTime: currentTimeString,
            startParkTime: "",
            parkingActive: "0"
          });
          // Send notification to user
          const parkingStopMessage = getUserMsg(
            `Driver has stopped parking. Total parking time: ${totalParkMinutes} minutes. ${chargeableMinutes > 0 ? `Parking charge: ${chargeableMinutes} × ₹5 = ₹${chargeableMinutes * 5}` : "No parking charge (first 5 minutes free)"}.`,
            `توقف السائق عن ركن السيارة. إجمالي وقت الوقوف: ${totalParkMinutes} دقيقة. ${chargeableMinutes > 0 ? `رسوم الوقوف: ${chargeableMinutes} × 5 = ${chargeableMinutes * 5} روبية` : "لا توجد رسوم وقوف (أول 5 دقائق مجانية)"}.`,
            `Le conducteur a arrêté de se garer. Durée totale de stationnement: ${totalParkMinutes} minutes. ${chargeableMinutes > 0 ? `Frais de stationnement: ${chargeableMinutes} × 5 = ${chargeableMinutes * 5} roupies` : "Pas de frais de stationnement (5 premières minutes gratuites)"}.`
          );

          // Send via socket
          if (global.onlineUsers && onlineUsers[booking.userId]) {
            onlineUsers[booking.userId].forEach(sockId => {
              io.to(sockId).emit("parkingStatusUpdate", {
                success: true,
                bookingId: booking.id,
                parkingStatus: 0,
                endParkTime: currentTimeString,
                totalParkMinutes: totalParkMinutes,
                chargeableMinutes: chargeableMinutes,
                message: parkingStopMessage
              });
            });
          }

          // Send push notification
          if (user.deviceToken) {
            helper.sendNotification_android(user.deviceToken, {
              message: parkingStopMessage,
              type: 11, // Parking stopped type
              senderId: userId,
              bookingId: booking.id,
              totalParkMinutes: totalParkMinutes,
              chargeableMinutes: chargeableMinutes
            });
          }

          socket.emit("parkingStatus", {
            success: true,
            message: "Parking stopped",
            data: {
              bookingId: booking.id,
              parkingStatus: 0,
              endParkTime: currentTimeString,
              totalParkMinutes: totalParkMinutes,
              chargeableMinutes: chargeableMinutes
            }
          });
        }

      } catch (error) {
        console.error("Parking status error:", error);
        socket.emit("parkingStatus", {
          success: false,
          message: "Something went wrong",
          error: error.message
        });
      }
    });

    // socket.on("rideStatusUpdate", async (data) => {
    //   try {
    //     let { bookingId, status, driverId } = data;

    //     if (!bookingId || !status) {
    //       return socket.emit("rideStatusUpdate", {
    //         success: false,
    //         message: "Booking ID and status are required."
    //       });
    //     }

    //     // If driverId is null or empty, fetch it from booking
    //     if (!driverId) {
    //       console.log("driverId is null/empty, fetching from booking...");
    //       const bookingInfo = await db.bookings.findOne({
    //         where: { id: bookingId },
    //         attributes: ['driverId'],
    //         raw: true
    //       });

    //       if (!bookingInfo || !bookingInfo.driverId) {
    //         return socket.emit("rideStatusUpdate", {
    //           success: false,
    //           message: "Booking not found or no driver assigned."
    //         });
    //       }

    //       driverId = bookingInfo.driverId;
    //       console.log(`Fetched driverId from booking: ${driverId}`);
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
    //               const pricePerMin = 5;

    //               let newPrice = currentPrice + pricePerMin;
    //               const totalMinutes = (parseInt(currentBooking.totalMinutes) || 0) + 5;

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
    //                     addedAmount: 5,
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
    //                     addedAmount: 5,
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

    //         const finalBooking = await db.bookings.findOne({
    //           where: { id: bookingId },
    //           raw: true
    //         });

    //         // Round final price to nearest 5
    //         let finalPrice = parseFloat(finalBooking.bookingPrice);
    //         let roundedFinalPrice = roundToNearest5(finalPrice);

    //         console.log("========== RIDE COMPLETED - COMMISSION PROCESSING ==========");
    //         console.log(`Booking ID: ${bookingId}`);
    //         console.log(`Final price: ${finalPrice} → ${roundedFinalPrice} MRU`);

    //         // ===== GET COMMISSION PERCENTAGE FROM ADMIN =====
    //         const adminUser = await db.users.findOne({
    //           where: { role: '0' },
    //           attributes: ['id', 'totalAmount', 'adminCommission'],
    //           raw: true
    //         });

    //         if (!adminUser) {
    //           console.log("❌ Admin user not found!");
    //           return socket.emit("rideStatusUpdate", {
    //             success: false,
    //             message: "Admin configuration not found."
    //           });
    //         }

    //         // Admin ka commission percent
    //         let commissionPercent = parseFloat(adminUser.adminCommission) || 15; // Default 15% 
    //         console.log(`Admin commission percent from DB: ${commissionPercent}%`);

    //         // ===== GET DRIVER DETAILS =====
    //         const driverDetails = await db.users.findOne({
    //           where: { id: driverId, role: "2" },
    //           attributes: ['id', 'totalAmount'],
    //           raw: true
    //         });

    //         if (!driverDetails) {
    //           console.log("❌ Driver not found!");
    //           return socket.emit("rideStatusUpdate", {
    //             success: false,
    //             message: "Driver not found."
    //           });
    //         }

    //         //  Commission calculate karo BOOKING PRICE se
    //         const commissionAmount = (roundedFinalPrice * commissionPercent) / 100;

    //         // Driver ka current balance
    //         const driverBalance = parseFloat(driverDetails.totalAmount) || 0;

    //         // Driver ke account se commission CUT karo (subtract)
    //         const newDriverBalance = driverBalance - commissionAmount;

    //         console.log(`Booking price: ${roundedFinalPrice} MRU`);
    //         console.log(`Commission calculation: ${roundedFinalPrice} × ${commissionPercent}% = ${commissionAmount} MRU`);
    //         console.log(`Driver balance before deduction: ${driverBalance} MRU`);
    //         console.log(`Driver balance after deduction: ${newDriverBalance} MRU`);

    //         // ===== UPDATE DRIVER'S totalAmount (SUBTRACT COMMISSION) =====
    //         const driverUpdate = await db.users.update(
    //           { totalAmount: newDriverBalance.toFixed(2).toString() },
    //           { where: { id: driverId, role: "2" } }
    //         );

    //         console.log(`Driver update result: ${driverUpdate[0]} row(s) updated`);

    //         // ===== UPDATE ADMIN'S totalAmount (ADD COMMISSION) =====
    //         const adminBalance = parseFloat(adminUser.totalAmount) || 0;
    //         const newAdminBalance = adminBalance + commissionAmount;

    //         const adminUpdate = await db.users.update(
    //           { totalAmount: newAdminBalance.toFixed(2).toString() },
    //           { where: { id: adminUser.id, role: '0' } }
    //         );

    //         console.log(`Admin update result: ${adminUpdate[0]} row(s) updated`);
    //         console.log(`Admin balance: ${adminBalance} → ${newAdminBalance} MRU (added ${commissionAmount} MRU)`);

    //         // ===== CREATE TRANSACTION RECORDS =====

    //         // Admin transaction (commission earning)
    //         try {
    //           await db.transactions.create({
    //             userId: adminUser.id,
    //             bookingId: bookingId,
    //             amount: commissionAmount.toString(),
    //             type: 'commission_earning',
    //             description: `Commission earned from ride #${bookingId} (${commissionPercent}% of booking price)`,
    //             status: 'completed'
    //           });
    //           console.log("Admin transaction created successfully");
    //         } catch (txError) {
    //           console.log("Admin transaction error:", txError.message);
    //         }

    //         // Driver transaction (commission deduction)
    //         try {
    //           await db.transactions.create({
    //             userId: driverId,
    //             bookingId: bookingId,
    //             amount: commissionAmount.toString(),
    //             type: 'commission_deduction',
    //             description: `Admin commission ${commissionPercent}% deducted for ride #${bookingId}`,
    //             status: 'completed'
    //           });
    //           console.log("Driver transaction created successfully");
    //         } catch (txError) {
    //           console.log("Driver transaction error:", txError.message);
    //         }

    //         // Update booking with rounded price and status
    //         await db.bookings.update(
    //           {
    //             bookingPrice: roundedFinalPrice.toString(),
    //             status: "3"
    //           },
    //           { where: { id: bookingId } }
    //         );
    //         // ===== UPDATE BOOKING WITH adminAmountCut =====
    //         await db.bookings.update(
    //           {
    //             bookingPrice: roundedFinalPrice.toString(),
    //             status: "3",
    //             adminAmountCut: commissionAmount.toString()  // ← Yahan commission amount save ho jayega
    //           },
    //           { where: { id: bookingId } }
    //         );
    //         console.log("========== COMMISSION PROCESSING COMPLETE ==========");

    //         // Send notifications
    //         await emitToBoth(
    //           getUserMsg(`Ride finished successfully.`,
    //             `تم الانتهاء من الرحلة بنجاح. السعر النهائي`,
    //             `Trajet terminé avec succès. Prix final`),
    //           getDriverMsg(`Ride finished successfully. `,
    //             `تم الانتهاء من الرحلة بنجاح. السعر النهائي`,
    //             `Trajet terminé avec succès. Prix final`),
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
