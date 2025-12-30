const db = require('../../models');
const bcrypt = require('bcryptjs');
const helper = require('../../helper/helper');
const { Validator } = require('node-input-validator');
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { Sequelize } = require('sequelize');
const io = require("../../socket/socket")
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // in km
}
module.exports = {
    // findRide(main): async (req, res) => {
    //     try {
    //         const userId = req.user.id;

    //         // ---------------- USER STATUS CHECK ----------------
    //         const userStatus = await db.users.findOne({
    //             where: { id: userId },
    //             attributes: ['status', 'block', 'suspend'],
    //             raw: true
    //         });

    //         if (!userStatus) {
    //             return helper.failure(res, "User not found.");
    //         }
    //         if (userStatus.status === "0") {
    //             return helper.error2(res, "Your account has been deactivated by admin.");
    //         }
    //         if (userStatus.block === "1") {
    //             return helper.error1(res, "Your account has been blocked by admin.");
    //         }
    //         if (userStatus.suspend === "1") {
    //             return helper.error3(res, "Your account has been suspended by admin.");
    //         }

    //         // ---------------- REQUEST DATA ----------------
    //         const {
    //             pickupLatitude,
    //             pickupLongitude,
    //             dropLatitude,
    //             dropLongitude,
    //             pickupLocation,
    //             dropLocation
    //         } = req.body;

    //         if (!pickupLatitude || !pickupLongitude || !dropLatitude || !dropLongitude) {
    //             return helper.failure(res, 'Pickup and drop coordinates are required.');
    //         }

    //         const pickupLat = parseFloat(pickupLatitude);
    //         const pickupLng = parseFloat(pickupLongitude);
    //         const dropLat = parseFloat(dropLatitude);
    //         const dropLng = parseFloat(dropLongitude);

    //         if (
    //             isNaN(pickupLat) ||
    //             isNaN(pickupLng) ||
    //             isNaN(dropLat) ||
    //             isNaN(dropLng)
    //         ) {
    //             return helper.failure(res, 'Invalid coordinates provided.');
    //         }

    //         const maxRadius = 30; // KM

    //         // ---------------- DISTANCE UTILS ----------------
    //         const toRad = deg => deg * (Math.PI / 180);

    //         const calculateDistance = (lat1, lon1, lat2, lon2) => {
    //             const R = 6371;
    //             const dLat = toRad(lat2 - lat1);
    //             const dLon = toRad(lon2 - lon1);
    //             const a =
    //                 Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    //                 Math.cos(toRad(lat1)) *
    //                 Math.cos(toRad(lat2)) *
    //                 Math.sin(dLon / 2) *
    //                 Math.sin(dLon / 2);
    //             const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    //             return R * c;
    //         };

    //         // ---------------- PRICE CALCULATION ----------------
    //         const rideDistanceKm = calculateDistance(
    //             pickupLat,
    //             pickupLng,
    //             dropLat,
    //             dropLng
    //         );

    //         const bookingPrice = Math.round(rideDistanceKm * 10); // ₹10/km

    //         // ---------------- ACTIVE BOOKINGS ----------------
    //         const activeBookings = await db.bookings.findAll({
    //             where: {
    //                 status: { [Sequelize.Op.in]: ['0', '1', '2'] },
    //                 request: '0'
    //             },
    //             attributes: ['driverId', 'status', 'rideOpen'],
    //             raw: true
    //         });

    //         const busyDriverMap = {};
    //         const rideOpenMap = {};

    //         activeBookings.forEach(b => {
    //             busyDriverMap[b.driverId] = b.status;
    //             rideOpenMap[b.driverId] = b.rideOpen;
    //         });

    //         // ---------------- ONLINE DRIVERS ----------------
    //         const drivers = await db.users.findAll({
    //             where: {
    //                 role: '2',
    //                 online: '1',
    //                 status: "1",
    //                 block: "0",
    //                 suspend: "0"
    //             },
    //             include: [{
    //                 model: db.vehicleDetails,
    //                 as: 'vehicleDetail',
    //                 required: true
    //             }]
    //         });

    //         // ---------------- PICKUP DISTANCE FILTER ----------------
    //         const driversWithDistance = drivers
    //             .map(driver => {
    //                 if (!driver.latitude || !driver.longitude) return null;

    //                 const driverLat = parseFloat(driver.latitude);
    //                 const driverLng = parseFloat(driver.longitude);

    //                 if (isNaN(driverLat) || isNaN(driverLng)) return null;

    //                 const distance = calculateDistance(
    //                     pickupLat,
    //                     pickupLng,
    //                     driverLat,
    //                     driverLng
    //                 );

    //                 if (distance > maxRadius) return null;

    //                 return {
    //                     ...driver.toJSON(),
    //                     fullName: `${driver.firstName || ''} ${driver.lastName || ''}`.trim(),
    //                     distanceFromPickup: distance.toFixed(2),
    //                     distanceUnit: 'km',
    //                     isBusy: busyDriverMap[driver.id] ? true : false,
    //                     bookingStatus: busyDriverMap[driver.id] || null,
    //                     rideOpen: rideOpenMap[driver.id] ?? '1',
    //                     vehicleDetails: driver.vehicleDetail
    //                 };
    //             })
    //             .filter(Boolean)
    //             .sort((a, b) => a.distanceFromPickup - b.distanceFromPickup);

    //         // -------- PICKUP CHECK --------
    //         if (!driversWithDistance.length) {
    //             return helper.failure(
    //                 res,
    //                 'No drivers available within 30 km of your pickup location'
    //             );
    //         }

    //         // ---------------- DROP LOCATION CHECK (NEW) ----------------
    //         const driversNearDrop = drivers
    //             .map(driver => {
    //                 if (!driver.latitude || !driver.longitude) return null;

    //                 const driverLat = parseFloat(driver.latitude);
    //                 const driverLng = parseFloat(driver.longitude);

    //                 if (isNaN(driverLat) || isNaN(driverLng)) return null;

    //                 const distanceToDrop = calculateDistance(
    //                     dropLat,
    //                     dropLng,
    //                     driverLat,
    //                     driverLng
    //                 );

    //                 if (distanceToDrop > maxRadius) return null;

    //                 return driver.id;
    //             })
    //             .filter(Boolean);

    //         if (!driversNearDrop.length) {
    //             return helper.failure(
    //                 res,
    //                 'No drivers available within 30 km of your drop location'
    //             );
    //         }

    //         // ---------------- RESPONSE ----------------
    //         return helper.success(res, 'Nearby drivers found', {
    //             userId,
    //             bookingPrice,
    //             rideDistanceKm: rideDistanceKm.toFixed(2),

    //             pickupLocation: {
    //                 latitude: pickupLat,
    //                 longitude: pickupLng,
    //                 address: pickupLocation || null
    //             },
    //             dropLocation: {
    //                 latitude: dropLat,
    //                 longitude: dropLng,
    //                 address: dropLocation || null
    //             },

    //             searchRadius: `0-${maxRadius} km`,
    //             totalDriversNearPickup: driversWithDistance.length,

    //             drivers: driversWithDistance.map(driver => ({
    //                 id: driver.id,
    //                 fullName: driver.fullName,
    //                 firstName: driver.firstName,
    //                 lastName: driver.lastName,
    //                 phone: driver.phone,
    //                 profileImage: driver.profileImage,
    //                 vehicleDetails: driver.vehicleDetails,
    //                 latitude: driver.latitude,
    //                 longitude: driver.longitude,
    //                 distanceFromPickup: driver.distanceFromPickup,
    //                 distanceUnit: driver.distanceUnit,
    //                 isBusy: driver.isBusy,
    //                 bookingStatus: driver.bookingStatus,
    //                 rideOpen: driver.rideOpen
    //             }))
    //         });

    //     } catch (error) {
    //         console.error(error);
    //         return helper.failure(res, 'Something went wrong.');
    //     }
    // },
    findRide: async (req, res) => {
        try {
            const userId = req.user.id;

            // ---------------- USER STATUS CHECK ----------------
            const userStatus = await db.users.findOne({
                where: { id: userId },
                attributes: ['status', 'block', 'suspend'],
                raw: true
            });

            if (!userStatus) return helper.failure(res, "User not found.");
            if (userStatus.status === "0") return helper.error2(res, "Your account has been deactivated by admin.");
            if (userStatus.block === "1") return helper.error1(res, "Your account has been blocked by admin.");
            if (userStatus.suspend === "1") return helper.error3(res, "Your account has been suspended by admin.");

            const {
                pickupLatitude,
                pickupLongitude,
                dropLatitude,
                dropLongitude,
                pickupLocation,
                dropLocation
            } = req.body;

            if (!pickupLatitude || !pickupLongitude || !dropLatitude || !dropLongitude) {
                return helper.failure(res, 'Pickup and drop coordinates are required.');
            }

            const pickupLat = parseFloat(pickupLatitude);
            const pickupLng = parseFloat(pickupLongitude);
            const dropLat = parseFloat(dropLatitude);
            const dropLng = parseFloat(dropLongitude);

            if (
                isNaN(pickupLat) ||
                isNaN(pickupLng) ||
                isNaN(dropLat) ||
                isNaN(dropLng)
            ) {
                return helper.failure(res, 'Invalid coordinates provided.');
            }

            const maxRadius = 30;

            const toRad = deg => deg * (Math.PI / 180);
            const calculateDistance = (lat1, lon1, lat2, lon2) => {
                const R = 6371;
                const dLat = toRad(lat2 - lat1);
                const dLon = toRad(lon2 - lon1);
                const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(toRad(lat1)) *
                    Math.cos(toRad(lat2)) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            };

            const rideDistanceKm = calculateDistance(
                pickupLat,
                pickupLng,
                dropLat,
                dropLng
            );

            const bookingPrice = Math.round(rideDistanceKm * 10);

            const activeBookings = await db.bookings.findAll({
                where: {
                    status: { [Sequelize.Op.in]: ['0', '1', '2'] },
                    request: '0'
                },
                attributes: ['driverId', 'status', 'rideOpen'],
                raw: true
            });

            const busyDriverMap = {};
            const rideOpenMap = {};

            activeBookings.forEach(b => {
                busyDriverMap[b.driverId] = b.status;
                rideOpenMap[b.driverId] = b.rideOpen;
            });

            const drivers = await db.users.findAll({
                where: {
                    role: '2',
                    online: '1',
                    status: "1",
                    block: "0",
                    suspend: "0"
                },
                include: [{
                    model: db.vehicleDetails,
                    as: 'vehicleDetail',
                    required: true
                }]
            });

            const driversWithDistance = drivers
                .map(driver => {
                    if (!driver.latitude || !driver.longitude) return null;

                    const driverLat = parseFloat(driver.latitude);
                    const driverLng = parseFloat(driver.longitude);

                    if (isNaN(driverLat) || isNaN(driverLng)) return null;

                    const distance = calculateDistance(
                        pickupLat,
                        pickupLng,
                        driverLat,
                        driverLng
                    );

                    if (distance > maxRadius) return null;

                    return {
                        ...driver.toJSON(),
                        fullName: `${driver.firstName || ''} ${driver.lastName || ''}`.trim(),
                        distanceFromPickup: distance.toFixed(2),
                        distanceUnit: 'km',
                        isBusy: busyDriverMap[driver.id] ? true : false,
                        bookingStatus: busyDriverMap[driver.id] || null,
                        rideOpen: rideOpenMap[driver.id] ?? '1',
                        vehicleDetails: driver.vehicleDetail
                    };
                })
                .filter(Boolean)
                .sort((a, b) => a.distanceFromPickup - b.distanceFromPickup);

            if (!driversWithDistance.length) {
                return helper.failure(
                    res,
                    'No drivers available within 30 km of your pickup location'
                );
            }

            return helper.success(res, 'Nearby drivers found', {
                userId,
                bookingPrice,
                rideDistanceKm: rideDistanceKm.toFixed(2),
                pickupLocation,
                dropLocation,
                drivers: driversWithDistance
            });

        } catch (error) {
            console.error(error);
            return helper.failure(res, 'Something went wrong.');
        }
    },


    // bookRide(main): (io) => {
    //     return async (req, res) => {
    //         try {
    //             const userId = req.user.id;

    //             const userStatus = await db.users.findOne({
    //                 where: { id: userId },
    //                 attributes: ['status', 'block', 'suspend'],
    //                 raw: true
    //             });
    //             if (!userStatus) {
    //                 return helper.failure(res, "User not found.");
    //             }
    //             if (userStatus.status === "0") {
    //                 return helper.error2(res, "Your account has been deactivated by admin.");
    //             }
    //             if (userStatus.block === "1") {
    //                 return helper.error1(res, "Your account has been blocked by admin.");
    //             }
    //             if (userStatus.suspend === "1") {
    //                 return helper.error3(res, "Your account has been suspended by admin.");
    //             }

    //             const {
    //                 driverId,
    //                 pickupLocation,
    //                 dropLocation,
    //                 pickupLatitude,
    //                 pickupLongitude,
    //                 dropLatitude,
    //                 dropLongitude,
    //                 rideOpen
    //             } = req.body;

    //             if (!driverId) {
    //                 return helper.failure(res, 'Driver ID is required.');
    //             }

    //             if (!pickupLocation || !dropLocation) {
    //                 return helper.failure(res, 'Pickup and drop locations are required.');
    //             }

    //             if (!pickupLatitude || !pickupLongitude || !dropLatitude || !dropLongitude) {
    //                 return helper.failure(res, 'All coordinates are required.');
    //             }

    //             const pickupLat = parseFloat(pickupLatitude);
    //             const pickupLng = parseFloat(pickupLongitude);
    //             const dropLat = parseFloat(dropLatitude);
    //             const dropLng = parseFloat(dropLongitude);

    //             if (
    //                 isNaN(pickupLat) ||
    //                 isNaN(pickupLng) ||
    //                 isNaN(dropLat) ||
    //                 isNaN(dropLng)
    //             ) {
    //                 return helper.failure(res, 'Invalid coordinates provided.');
    //             }

    //             // ---------------- DISTANCE + PRICE CALCULATION (NEW) ----------------
    //             const toRad = (value) => value * Math.PI / 180;

    //             const calculateDistance = (lat1, lon1, lat2, lon2) => {
    //                 const R = 6371; // KM
    //                 const dLat = toRad(lat2 - lat1);
    //                 const dLon = toRad(lon2 - lon1);
    //                 const a =
    //                     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    //                     Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    //                     Math.sin(dLon / 2) * Math.sin(dLon / 2);
    //                 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    //                 return R * c;
    //             };

    //             const rideDistanceKm = calculateDistance(
    //                 pickupLat,
    //                 pickupLng,
    //                 dropLat,
    //                 dropLng
    //             );

    //             const bookingPrice = Math.round(rideDistanceKm * 10); // ₹10 per KM

    //             // -------- DRIVER FETCH ---------
    //             const driver = await db.users.findOne({
    //                 where: {
    //                     id: driverId,
    //                     role: '2',
    //                     online: '1'
    //                 },
    //                 include: [{
    //                     model: db.vehicleDetails,
    //                     as: 'vehicleDetail',
    //                     required: true
    //                 }]
    //             });

    //             if (!driver) {
    //                 return helper.failure(res, 'Driver not found or not available',);
    //             }

    //             // -------- RADIUS CHECK (0–30 KM) --------
    //             const maxRadius = 30;

    //             if (!driver.latitude || !driver.longitude) {
    //                 return helper.failure(res, 'Driver location not available',);
    //             }

    //             const driverLat = parseFloat(driver.latitude);
    //             const driverLng = parseFloat(driver.longitude);

    //             if (isNaN(driverLat) || isNaN(driverLng)) {
    //                 return helper.failure(res, 'Driver has invalid coordinates',);
    //             }

    //             const driverDistance = calculateDistance(
    //                 pickupLat,
    //                 pickupLng,
    //                 driverLat,
    //                 driverLng
    //             );

    //             if (!(driverDistance >= 0 && driverDistance <= maxRadius)) {
    //                 return helper.failure(
    //                     res,
    //                     'No drivers available within 30 km of your pickup location',
    //                 );
    //             }

    //             const existingBooking = await db.bookings.findOne({
    //                 where: {
    //                     userId,
    //                     status: { [Sequelize.Op.in]: ['0', '1', '2'] },
    //                     request: '0'
    //                 }
    //             });

    //             if (existingBooking) {
    //                 return helper.failure(res, 'You already have an active ride request');
    //             }

    //             const driverActiveBooking = await db.bookings.findOne({
    //                 where: {
    //                     driverId,
    //                     status: { [Sequelize.Op.in]: ['0', '1', '2'] },
    //                     request: '1'
    //                 }
    //             });

    //             if (driverActiveBooking) {
    //                 return helper.failure(
    //                     res,
    //                     'Driver is currently busy with another ride',
    //                 );
    //             }

    //             const generateOrderId = () => {
    //                 return Math.floor(100000 + Math.random() * 900000).toString();
    //             };

    //             let orderId;
    //             let isUnique = false;

    //             while (!isUnique) {
    //                 orderId = generateOrderId();
    //                 const existingOrder = await db.bookings.findOne({
    //                     where: { orderId }
    //                 });
    //                 if (!existingOrder) {
    //                     isUnique = true;
    //                 }
    //             }

    //             const newBooking = await db.bookings.create({
    //                 userId,
    //                 driverId,
    //                 orderId,
    //                 status: '0',
    //                 pickupLocation,
    //                 dropLocation,
    //                 pickupLatitude: pickupLatitude.toString(),
    //                 pickupLongitude: pickupLongitude.toString(),
    //                 dropLatitude: dropLatitude.toString(),
    //                 dropLongitude: dropLongitude.toString(),
    //                 bookingPrice: bookingPrice.toString(),
    //                 request: '0',
    //                 rideOpen
    //             });

    //             // -- SOCKET EMIT ---
    //             try {
    //                 let emitted = false;

    //                 if (io && global.onlineUsers && onlineUsers[driverId]?.length) {
    //                     onlineUsers[driverId].forEach(sockId => {
    //                         io.to(sockId).emit("newRideRequest", {
    //                             bookingId: newBooking.id,
    //                             orderId: newBooking.orderId,
    //                             userId,
    //                             driverId,
    //                             pickupLocation,
    //                             dropLocation,
    //                             pickupLatitude,
    //                             pickupLongitude,
    //                             dropLatitude,
    //                             dropLongitude,
    //                             status: '0',
    //                             request: '0',
    //                             rideOpen
    //                         });
    //                     });
    //                     emitted = true;
    //                 }

    //                 if (!emitted && driver.socketId) {
    //                     io.to(driver.socketId).emit("newRideRequest", {
    //                         bookingId: newBooking.id,
    //                         orderId: newBooking.orderId,
    //                         userId,
    //                         driverId,
    //                         pickupLocation,
    //                         dropLocation,
    //                         pickupLatitude,
    //                         pickupLongitude,
    //                         dropLatitude,
    //                         dropLongitude,
    //                         status: '0',
    //                         request: '0',
    //                         rideOpen
    //                     });
    //                 }
    //             } catch (e) {
    //                 console.log("Socket emit failed:", e);
    //             }
    //             // -----------------

    //             return helper.success(
    //                 res,
    //                 'Ride booking request sent successfully',
    //                 {
    //                     bookingId: newBooking.id,
    //                     orderId: newBooking.orderId,
    //                     userId,
    //                     driverId,
    //                     status: newBooking.status,
    //                     request: newBooking.request,
    //                     bookingPrice: bookingPrice,          //  SHOWN
    //                     rideDistanceKm: rideDistanceKm.toFixed(2), //  SHOWN
    //                     pickupLocation: newBooking.pickupLocation,
    //                     dropLocation: newBooking.dropLocation,
    //                     coordinates: {
    //                         pickup: {
    //                             latitude: newBooking.pickupLatitude,
    //                             longitude: newBooking.pickupLongitude
    //                         },
    //                         drop: {
    //                             latitude: newBooking.dropLatitude,
    //                             longitude: newBooking.dropLongitude
    //                         }
    //                     },
    //                     driverDetails: {
    //                         id: driver.id,
    //                         fullName: `${driver.firstName} ${driver.lastName}`,
    //                         phone: driver.phoneNumber,
    //                         profileImage: driver.image,
    //                         vehicleDetails: driver.vehicleDetail
    //                     },
    //                     message: 'Waiting for driver to accept your request'
    //                 }
    //             );

    //         } catch (error) {
    //             console.error('Booking error:', error);
    //             return helper.failure(
    //                 res,
    //                 "Something went wrong while booking the ride."
    //             );
    //         }
    //     };
    // },
    bookRide: (io) => {
        return async (req, res) => {
            try {
                const userId = req.user.id;

                // ---------------- USER STATUS CHECK ----------------
                const userStatus = await db.users.findOne({
                    where: { id: userId },
                    attributes: ['status', 'block', 'suspend'],
                    raw: true
                });

                if (!userStatus) return helper.failure(res, "User not found.");
                if (userStatus.status === "0") return helper.error2(res, "Your account has been deactivated by admin.");
                if (userStatus.block === "1") return helper.error1(res, "Your account has been blocked by admin.");
                if (userStatus.suspend === "1") return helper.error3(res, "Your account has been suspended by admin.");

                const {
                    pickupLocation,
                    dropLocation,
                    pickupLatitude,
                    pickupLongitude,
                    dropLatitude,
                    dropLongitude,
                    rideOpen
                } = req.body;

                if (!pickupLocation || !dropLocation) {
                    return helper.failure(res, 'Pickup and drop locations are required.');
                }

                if (!pickupLatitude || !pickupLongitude || !dropLatitude || !dropLongitude) {
                    return helper.failure(res, 'All coordinates are required.');
                }

                const pickupLat = parseFloat(pickupLatitude);
                const pickupLng = parseFloat(pickupLongitude);
                const dropLat = parseFloat(dropLatitude);
                const dropLng = parseFloat(dropLongitude);

                if (
                    isNaN(pickupLat) ||
                    isNaN(pickupLng) ||
                    isNaN(dropLat) ||
                    isNaN(dropLng)
                ) {
                    return helper.failure(res, 'Invalid coordinates provided.');
                }

                // ---------------- DISTANCE UTILS ----------------
                const toRad = v => v * Math.PI / 180;
                const calculateDistance = (a, b, c, d) => {
                    const R = 6371;
                    const dLat = toRad(c - a);
                    const dLon = toRad(d - b);
                    const x =
                        Math.sin(dLat / 2) ** 2 +
                        Math.cos(toRad(a)) *
                        Math.cos(toRad(c)) *
                        Math.sin(dLon / 2) ** 2;
                    return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
                };

                // ---------------- RIDE DISTANCE + PRICE ----------------
                const rideDistanceKm = calculateDistance(
                    pickupLat,
                    pickupLng,
                    dropLat,
                    dropLng
                );

                const maxRideDistance = 30; // km
                if (rideDistanceKm > maxRideDistance) {
                    return helper.failure(
                        res,
                        'Drop location must be within 30 km of pickup location'
                    );
                }
                const bookingPrice = Math.round(rideDistanceKm * 10);

                // ---------------- EXISTING USER RIDE CHECK ----------------
                const existingBooking = await db.bookings.findOne({
                    where: {
                        userId,
                        status: { [Sequelize.Op.in]: ['0', '1', '2'] },
                        request: '0'
                    }
                });

                if (existingBooking) {
                    return helper.failure(res, 'You already have an active ride request');
                }

                // ---------------- DRIVER AVAILABILITY CHECK (OLD LOGIC) ----------------
                const maxRadius = 30;

                const drivers = await db.users.findAll({
                    where: {
                        role: '2',
                        online: '1'
                    },
                    attributes: ['id', 'latitude', 'longitude'],
                    raw: true
                });

                let driverAvailable = false;

                for (const driver of drivers) {
                    if (!driver.latitude || !driver.longitude) continue;

                    const driverLat = parseFloat(driver.latitude);
                    const driverLng = parseFloat(driver.longitude);
                    if (isNaN(driverLat) || isNaN(driverLng)) continue;

                    const driverDistance = calculateDistance(
                        pickupLat,
                        pickupLng,
                        driverLat,
                        driverLng
                    );

                    // ✅ SAME CHECK AS OLD bookRide(main)
                    if (driverDistance >= 0 && driverDistance <= maxRadius) {
                        driverAvailable = true;
                        break;
                    }
                }

                if (!driverAvailable) {
                    return helper.failure(
                        res,
                        'No drivers available within 30 km of your pickup location'
                    );
                }

                // ---------------- ORDER ID ----------------
                const orderId = Math.floor(100000 + Math.random() * 900000).toString();

                // ---------------- CREATE BOOKING ----------------
                const newBooking = await db.bookings.create({
                    userId,
                    driverId: null, // ✅ IMPORTANT
                    orderId,
                    status: '0',
                    pickupLocation,
                    dropLocation,
                    pickupLatitude: pickupLatitude.toString(),
                    pickupLongitude: pickupLongitude.toString(),
                    dropLatitude: dropLatitude.toString(),
                    dropLongitude: dropLongitude.toString(),
                    bookingPrice: bookingPrice.toString(),
                    request: '0',
                    rideOpen
                });

                // ---------------- SOCKET EMIT (BROADCAST) ----------------
                drivers.forEach(driver => {
                    if (global.onlineUsers && onlineUsers[driver.id]?.length) {
                        onlineUsers[driver.id].forEach(sockId => {
                            io.to(sockId).emit("newRideRequest", {
                                bookingId: newBooking.id,
                                orderId: newBooking.orderId,
                                pickupLocation,
                                dropLocation,
                                pickupLatitude,
                                pickupLongitude,
                                dropLatitude,
                                dropLongitude,
                                status: '0',
                                request: '0',
                                rideOpen
                            });
                        });
                    }
                });

                // ---------------- RESPONSE ----------------
                return helper.success(res, 'Ride booking request sent successfully', {
                    bookingId: newBooking.id,
                    orderId: newBooking.orderId,
                    status: newBooking.status,
                    request: newBooking.request,
                    bookingPrice,
                    rideDistanceKm: rideDistanceKm.toFixed(2),
                    message: 'Waiting for driver to accept your request'
                });

            } catch (error) {
                console.error('Booking error:', error);
                return helper.failure(res, "Something went wrong while booking the ride.");
            }
        };
    },


    // driverAccptReject(main): (io) => {
    //     return async (req, res) => {
    //         try {
    //             const driverId = req.user.id;
    //             const { bookingId, request } = req.body;

    //             if (!bookingId || !request) {
    //                 return helper.failure(res, 'Booking ID and request value are required.');
    //             }
    //             if (!['1', '2'].includes(request)) {
    //                 return helper.failure(res, 'Invalid request value. Must be "1" (accept) or "2" (reject).');
    //             }

    //             const booking = await db.bookings.findOne({
    //                 where: {
    //                     id: bookingId,
    //                     driverId: driverId,
    //                     status: '0',
    //                     request: '0'
    //                 },
    //                 include: [{
    //                     model: db.users,
    //                     as: 'userbook',
    //                     attributes: ['id', 'socketId']
    //                 }]
    //             });

    //             if (!booking) {
    //                 return helper.failure(res, 'Booking already processed');
    //             }
    //             // Accept or reject
    //             if (request === '1') {
    //                 await booking.update({ request: request, status: '0' });   // Accept
    //             } else {
    //                 await booking.update({ request: request, status: '4' }); // Reject
    //             }
    //             // Notify user
    //             // if (booking.userbook && booking.userbook.socketId) {
    //             //     io.to(booking.userbook.socketId).emit("rideStatusUpdate", {
    //             //         bookingId: booking.id,
    //             //         driverId: driverId,
    //             //         request: request,
    //             //         status: request === "1" ? "Driver on the way" : "Booking rejected",
    //             //         message: request === "1"
    //             //             ? "Driver accepted your booking and is on the way"
    //             //             : "Driver rejected your booking"
    //             //     });
    //             // }
    //             if (booking.userbook && booking.userbook.socketId) {

    //                 let statusCode = request === "1" ? "0" : "4";
    //                 let msg = request === "1"
    //                     ? "Driver on the way"
    //                     : "Driver rejected the booking";

    //                 io.to(booking.userbook.socketId).emit("rideStatusUpdate", {
    //                     bookingId: booking.id,
    //                     driverId: driverId,
    //                     request: request,
    //                     status: statusCode,
    //                     message: msg
    //                 });
    //             }
    //             const message = request === '1'
    //                 ? 'Booking accepted successfully. Driver on the way.'
    //                 : 'Booking rejected successfully';

    //             const actionMessage = request === '1'
    //                 ? 'You have accepted the ride request. Driver on the way.'
    //                 : 'You have rejected the ride request';

    //             return helper.success(res, message, {
    //                 bookingId: booking.id,
    //                 request: request,
    //                 message: actionMessage
    //             });
    //         } catch (error) {
    //             return helper.failure(res, "Something went wrong while processing the booking.");
    //         }
    //     };
    // },
    driverAccptReject1: (io) => {
        return async (req, res) => {
            try {
                const driverId = req.user.id;
                const { bookingId, request } = req.body;

                if (!bookingId || !request) {
                    return helper.failure(res, 'Booking ID and request value are required.');
                }

                if (!['1', '2'].includes(request)) {
                    return helper.failure(
                        res,
                        'Invalid request value. Must be "1" (accept) or "2" (reject).'
                    );
                }

                // ---------------- ACCEPT ----------------
                if (request === '1') {
                    const [updated] = await db.bookings.update(
                        {
                            driverId: driverId,
                            request: '1',
                            status: '0'
                        },
                        {
                            where: {
                                id: bookingId,
                                driverId: null,
                                status: '0',
                                request: '0'
                            }
                        }
                    );

                    if (!updated) {
                        return helper.failure(res, 'Booking already processed');
                    }
                }

                // ---------------- REJECT ----------------
                if (request === '2') {
                    const booking = await db.bookings.findOne({
                        where: { id: bookingId },
                        include: [{
                            model: db.users,
                            as: 'userbook',
                            attributes: ['id', 'socketId']
                        }]
                    });

                    if (!booking) {
                        return helper.failure(res, 'Booking already processed');
                    }

                    // Only update status for reject
                    await booking.update({ request: '2', status: '4' });
                }

                // ---------------- FETCH BOOKING ----------------
                const booking = await db.bookings.findOne({
                    where: { id: bookingId },
                    include: [{
                        model: db.users,
                        as: 'userbook',
                        attributes: ['id', 'socketId']
                    }]
                });

                const statusCode = request === '1' ? '0' : '4';
                const msg = request === '1'
                    ? 'Driver on the way'
                    : 'Driver rejected the booking';

                // ---------------- EMIT TO USER ----------------
                if (booking.userbook && booking.userbook.socketId) {
                    io.to(booking.userbook.socketId).emit("rideStatusUpdate", {
                        bookingId: booking.id,
                        driverId: driverId,
                        request: request,
                        status: statusCode,
                        message: msg
                    });
                }

                // ---------------- EMIT TO DRIVER ----------------
                if (global.onlineUsers && onlineUsers[driverId]?.length) {
                    onlineUsers[driverId].forEach(sockId => {
                        io.to(sockId).emit("rideStatusUpdate", {
                            bookingId: booking.id,
                            request: request,
                            status: statusCode,
                            message: request === '1'
                                ? 'You accepted the ride request'
                                : 'You rejected the ride request'
                        });
                    });
                }

                const message = request === '1'
                    ? 'Booking accepted successfully. Driver on the way.'
                    : 'Booking rejected successfully';

                const actionMessage = request === '1'
                    ? 'You have accepted the ride request. Driver on the way.'
                    : 'You have rejected the ride request';

                return helper.success(res, message, {
                    bookingId,
                    request,
                    message: actionMessage
                });

            } catch (error) {
                console.error(error);
                return helper.failure(
                    res,
                    "Something went wrong while processing the booking."
                );
            }
        };
    },
    driverAccptReject: (io) => {
        return async (req, res) => {
            try {
                const driverId = req.user.id;
                const { bookingId, request } = req.body;

                if (!bookingId || !request) {
                    return helper.failure(res, 'Booking ID and request value are required.');
                }

                if (!['1', '2'].includes(request)) {
                    return helper.failure(
                        res,
                        'Invalid request value. Must be "1" (accept) or "2" (reject).'
                    );
                }

                // ---------------- ACCEPT ----------------
                if (request === '1') {
                    const [updated] = await db.bookings.update(
                        {
                            driverId: driverId,
                            request: '1',
                            status: '0'
                        },
                        {
                            where: {
                                id: bookingId,
                                driverId: null,
                                status: '0',
                                request: '0'
                            }
                        }
                    );

                    if (!updated) {
                        return helper.failure(res, 'Booking already processed');
                    }
                }

                // ---------------- REJECT ----------------
                // if (request === '2') {
                //     const booking = await db.bookings.findOne({
                //         where: { id: bookingId }
                //     });
                //     if (!booking) {
                //         return helper.failure(res, 'Booking already processed');
                //     }
                // // await booking.update({ driverId: null,request: '2', status: '4',rejectCount:'1' });
                // }
                /* ================= REJECT ================= */
                if (request === '2') {
                    const booking = await db.bookings.findOne({
                        where: { id: bookingId },
                        include: [{
                            model: db.users,
                            as: 'userbook',
                            attributes: ['socketId']
                        }]
                    });

                    if (!booking) {
                        return helper.failure(res, 'Booking already processed');
                    }

                    await booking.increment('rejectCount', { by: 1 });

                    // total nearby online drivers
                    const totalDrivers = await db.users.count({
                        where: { role: '2', online: '1' }
                    });

                    if (booking.rejectCount + 1 >= totalDrivers) {
                        await booking.update({
                            status: '4',   // no driver available
                            request: '2'
                        });
                        // user  emit
                        if (booking.userbook?.socketId) {
                            io.to(booking.userbook.socketId).emit("rideStatusUpdate", {
                                bookingId: booking.id,
                                status: '4',
                                request: '2',
                                message: 'No drivers available right now'
                            });
                        }
                    }
                }

                // ---------------- FETCH BOOKING ----------------
                const booking = await db.bookings.findOne({
                    where: { id: bookingId },
                    include: [{
                        model: db.users,
                        as: 'userbook',
                        attributes: ['id', 'socketId']
                    }]
                });

                const statusCode = request === '1' ? '0' : '4';
                const msg = request === '1'
                    ? 'Driver on the way'
                    : 'Driver rejected the booking';

                // ---------------- EMIT TO USER ----------------
                if (booking.userbook && booking.userbook.socketId) {
                    io.to(booking.userbook.socketId).emit("rideStatusUpdate", {
                        bookingId: booking.id,
                        driverId: driverId,
                        request: request,
                        status: statusCode,
                        message: msg
                    });
                }

                // ---------------- EMIT TO ACCEPTED DRIVER ----------------
                if (global.onlineUsers && global.onlineUsers[driverId]?.length) {
                    global.onlineUsers[driverId].forEach(sockId => {
                        io.to(sockId).emit("rideStatusUpdate", {
                            bookingId: booking.id,
                            request: request,
                            status: statusCode,
                            message:
                                request === '1'
                                    ? 'You accepted the ride request'
                                    : 'You rejected the ride request'
                        });
                    });
                }

                // ================= NEW PART (IMPORTANT) =================
                // ACCEPT ke baad bhi 30 KM ke andar ke drivers ko emit
                if (request === '1') {
                    const pickupLat = parseFloat(booking.pickupLatitude);
                    const pickupLng = parseFloat(booking.pickupLongitude);
                    const MAX_DISTANCE = 30;

                    const drivers = await db.users.findAll({
                        where: {
                            role: '2',
                            online: '1'
                        },
                        attributes: ['id', 'latitude', 'longitude'],
                        raw: true
                    });

                    const toRad = v => (v * Math.PI) / 180;
                    const distanceInKm = (lat1, lon1, lat2, lon2) => {
                        const R = 6371;
                        const dLat = toRad(lat2 - lat1);
                        const dLon = toRad(lon2 - lon1);
                        const a =
                            Math.sin(dLat / 2) ** 2 +
                            Math.cos(toRad(lat1)) *
                            Math.cos(toRad(lat2)) *
                            Math.sin(dLon / 2) ** 2;
                        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
                    };

                    for (const d of drivers) {
                        if (!d.latitude || !d.longitude) continue;

                        const dist = distanceInKm(
                            pickupLat,
                            pickupLng,
                            parseFloat(d.latitude),
                            parseFloat(d.longitude)
                        );

                        if (dist <= MAX_DISTANCE && global.onlineUsers?.[d.id]) {
                            global.onlineUsers[d.id].forEach(sockId => {
                                io.to(sockId).emit("rideStatusUpdate", {
                                    bookingId: booking.id,
                                    status: '0',
                                    request: '1',
                                    message: 'Ride has been accepted by another driver'
                                });
                            });
                        }
                    }
                }
                // ================= END NEW PART =================

                const message = request === '1'
                    ? 'Booking accepted successfully. Driver on the way.'
                    : 'Booking rejected successfully';

                const actionMessage = request === '1'
                    ? 'You have accepted the ride request. Driver on the way.'
                    : 'You have rejected the ride request';

                return helper.success(res, message, {
                    bookingId,
                    request,
                    message: actionMessage
                });

            } catch (error) {
                console.error(error);
                return helper.failure(
                    res,
                    "Something went wrong while processing the booking."
                );
            }
        };
    },




    // requestList(main): (io) => {
    //     return async (req, res) => {
    //         try {
    //             const driverId = req.user.id;

    //             const driver = await db.users.findOne({
    //                 where: { id: driverId },
    //                 attributes: ['status', 'block', 'suspend'],
    //                 raw: true
    //             });
    //             if (!driver) {
    //                 return helper.failure(res, "driver not found.");
    //             }
    //             if (driver.status === "0") {
    //                 return helper.error2(res, "Your account has been deactivated by admin.");
    //             }
    //             if (driver.block === "1") {
    //                 return helper.error1(res, "Your account has been blocked by admin.");
    //             }
    //             if (driver.suspend === "1") {
    //                 return helper.error3(res, "Your account has been suspended by admin.");
    //             }

    //             const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    //             const expiredBookings = await db.bookings.findAll({
    //                 where: {
    //                     driverId: driverId,
    //                     status: '0',
    //                     request: '0',
    //                     bookingDate: {
    //                         [Sequelize.Op.lt]: oneMinuteAgo
    //                     }
    //                 },
    //                 attributes: ['id', 'userId'],
    //                 raw: true
    //             });
    //             await db.bookings.destroy({
    //                 where: {
    //                     driverId: driverId,
    //                     status: '0',
    //                     request: '0',
    //                     bookingDate: {
    //                         [Sequelize.Op.lt]: oneMinuteAgo
    //                     }
    //                 }
    //             });
    //             // USER SOCKET EMIT ONLY
    //             if (expiredBookings.length) {
    //                 expiredBookings.forEach(b => {
    //                     if (global.onlineUsers && onlineUsers[b.userId]?.length) {
    //                         onlineUsers[b.userId].forEach(sockId => {
    //                             io.to(sockId).emit("rideStatusUpdate", {
    //                                 bookingId: b.id,
    //                                 message: "Driver did not respond. Please try again."
    //                             });
    //                         });
    //                     }
    //                 });
    //             }
    //             const requests = await db.bookings.findAll({
    //                 where: {
    //                     driverId: driverId,
    //                     status: '0',
    //                     request: '0'
    //                 },
    //                 include: [
    //                     {
    //                         model: db.users,
    //                         as: 'userbook',
    //                     }
    //                 ],
    //                 order: [['id', 'DESC']]
    //             });
    //             return helper.success(res, 'Pending ride requests fetched successfully', {
    //                 totalRequests: requests.length,
    //                 requests: requests.map(booking => ({
    //                     bookingId: booking.id,
    //                     userId: booking.userId,
    //                     userDetails: booking.userbook,
    //                     pickupLocation: booking.pickupLocation,
    //                     dropLocation: booking.dropLocation,
    //                     pickupLatitude: booking.pickupLatitude,
    //                     pickupLongitude: booking.pickupLongitude,
    //                     dropLatitude: booking.dropLatitude,
    //                     dropLongitude: booking.dropLongitude,
    //                     status: booking.status,
    //                     request: booking.request,
    //                     bookingDate: booking.bookingDate,
    //                     orderId: booking.orderId,
    //                     rideOpen: booking.rideOpen
    //                 }))
    //             });

    //         } catch (error) {
    //             console.log("requestList error:", error);
    //             return helper.failure(res, "Something went wrong while fetching requests.");
    //         }
    //     };
    // },
    // requestList: (io) => {
    //     return async (req, res) => {
    //         try {
    //             const driverId = req.user.id;

    //             const driver = await db.users.findOne({
    //                 where: { id: driverId },
    //                 attributes: ['status', 'block', 'suspend'],
    //                 raw: true
    //             });

    //             if (!driver) {
    //                 return helper.failure(res, "driver not found.");
    //             }
    //             if (driver.status === "0") {
    //                 return helper.error2(res, "Your account has been deactivated by admin.");
    //             }
    //             if (driver.block === "1") {
    //                 return helper.error1(res, "Your account has been blocked by admin.");
    //             }
    //             if (driver.suspend === "1") {
    //                 return helper.error3(res, "Your account has been suspended by admin.");
    //             }

    //             const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    //             const expiredBookings = await db.bookings.findAll({
    //                 where: {
    //                     driverId: driverId,
    //                     status: '0',
    //                     request: '0',
    //                     bookingDate: {
    //                         [Sequelize.Op.lt]: oneMinuteAgo
    //                     }
    //                 },
    //                 attributes: ['id', 'userId'],
    //                 raw: true
    //             });

    //             await db.bookings.destroy({
    //                 where: {
    //                     driverId: driverId,
    //                     status: '0',
    //                     request: '0',
    //                     bookingDate: {
    //                         [Sequelize.Op.lt]: oneMinuteAgo
    //                     }
    //                 }
    //             });

    //             // ================= SOCKET EMIT (USER + DRIVER) =================
    //             if (expiredBookings.length) {
    //                 expiredBookings.forEach(b => {

    //                     // USER notify (existing logic)
    //                     if (global.onlineUsers && onlineUsers[b.userId]?.length) {
    //                         onlineUsers[b.userId].forEach(sockId => {
    //                             io.to(sockId).emit("rideStatusUpdate", {
    //                                 bookingId: b.id,
    //                                 message: "Driver did not respond. Please try again."
    //                             });
    //                         });
    //                     }

    //                     // DRIVER notify (NEW - logic unchanged)
    //                     if (global.onlineUsers && onlineUsers[driverId]?.length) {
    //                         onlineUsers[driverId].forEach(sockId => {
    //                             io.to(sockId).emit("rideStatusUpdate", {
    //                                 bookingId: b.id,
    //                                 message: "Ride request expired due to no response."
    //                             });
    //                         });
    //                     }
    //                 });
    //             }
    //             // =================================================================

    //             const requests = await db.bookings.findAll({
    //                 where: {
    //                     driverId: driverId,
    //                     status: '0',
    //                     request: '0'
    //                 },
    //                 include: [
    //                     {
    //                         model: db.users,
    //                         as: 'userbook',
    //                     }
    //                 ],
    //                 order: [['id', 'DESC']]
    //             });

    //             return helper.success(
    //                 res,
    //                 'Pending ride requests fetched successfully',
    //                 {
    //                     totalRequests: requests.length,
    //                     requests: requests.map(booking => ({
    //                         bookingId: booking.id,
    //                         userId: booking.userId,
    //                         userDetails: booking.userbook,
    //                         pickupLocation: booking.pickupLocation,
    //                         dropLocation: booking.dropLocation,
    //                         pickupLatitude: booking.pickupLatitude,
    //                         pickupLongitude: booking.pickupLongitude,
    //                         dropLatitude: booking.dropLatitude,
    //                         dropLongitude: booking.dropLongitude,
    //                         status: booking.status,
    //                         request: booking.request,
    //                         bookingDate: booking.bookingDate,
    //                         orderId: booking.orderId,
    //                         rideOpen: booking.rideOpen
    //                     }))
    //                 }
    //             );

    //         } catch (error) {
    //             console.log("requestList error:", error);
    //             return helper.failure(res, "Something went wrong while fetching requests.");
    //         }
    //     };
    // },
    requestList: (io) => {
        return async (req, res) => {
            try {
                const driverId = req.user.id;

                // ---------------- DRIVER STATUS CHECK ----------------
                const driver = await db.users.findOne({
                    where: { id: driverId },
                    attributes: ['status', 'block', 'suspend'],
                    raw: true
                });

                if (!driver) {
                    return helper.failure(res, "Driver not found.");
                }
                if (driver.status === "0") {
                    return helper.error2(res, "Your account has been deactivated by admin.");
                }
                if (driver.block === "1") {
                    return helper.error1(res, "Your account has been blocked by admin.");
                }
                if (driver.suspend === "1") {
                    return helper.error3(res, "Your account has been suspended by admin.");
                }

                const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
                const expiredBookings = await db.bookings.findAll({
                    where: {
                        driverId: null,
                        status: '0',
                        request: '0',
                        bookingDate: {
                            [Sequelize.Op.lt]: oneMinuteAgo
                        }
                    },
                    attributes: ['id', 'userId'],
                    raw: true
                });

                await db.bookings.destroy({
                    where: {
                        driverId: null,
                        status: '0',
                        request: '0',
                        rejectCount: '0',
                        bookingDate: {
                            [Sequelize.Op.lt]: oneMinuteAgo
                        }
                    },
                    force: true
                });


                // ---------------- USER SOCKET EMIT ----------------
                if (expiredBookings.length) {
                    expiredBookings.forEach(b => {
                        if (global.onlineUsers && onlineUsers[b.userId]?.length) {
                            onlineUsers[b.userId].forEach(sockId => {
                                io.to(sockId).emit("rideStatusUpdate", {
                                    bookingId: b.id,
                                    message: "Driver did not respond. Please try again."
                                });
                            });
                        }
                    });
                }

                // ---------------- PENDING REQUESTS ----------------
                const requests = await db.bookings.findAll({
                    where: {
                        driverId: null,
                        status: '0',
                        request: '0'
                    },
                    include: [
                        {
                            model: db.users,
                            as: 'userbook'
                        }
                    ],
                    order: [['id', 'DESC']]
                });

                return helper.success(
                    res,
                    'Pending ride requests fetched successfully',
                    {
                        totalRequests: requests.length,
                        requests: requests.map(booking => ({
                            bookingId: booking.id,
                            userId: booking.userId,
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
                            orderId: booking.orderId,
                            rideOpen: booking.rideOpen
                        }))
                    }
                );

            } catch (error) {
                console.log("requestList error:", error);
                return helper.failure(
                    res,
                    "Something went wrong while fetching requests."
                );
            }
        };
    },





    updatedPickupLocation: async (req, res) => {
        try {
            const userId = req.user.id;
            const { bookingId, pickupLocation, pickupLatitude, pickupLongitude } = req.body;

            // if (!bookingId || !pickupLocation || !pickupLatitude || !pickupLongitude) {
            //     return helper.failure(res, 'Booking ID, pickup location, and coordinates are required.');
            // }

            const booking = await db.bookings.findOne({
                where: {
                    id: bookingId,
                    userId: userId,
                    status: '0',
                    request: '1'
                }
            });

            if (!booking) {
                return helper.failure(res, 'Booking not found or cannot be updated', 404);
            }

            await booking.update({
                pickupLocation: pickupLocation,
                pickupLatitude: pickupLatitude.toString(),
                pickupLongitude: pickupLongitude.toString()
            });

            return helper.success(res, 'Pickup location updated successfully', {
                bookingId: booking.id,
                pickupLocation: booking.pickupLocation,
                pickupLatitude: booking.pickupLatitude,
                pickupLongitude: booking.pickupLongitude
            });

        } catch (error) {
            return helper.failure(res, "Something went wrong while updating pickup location.");
        }
    },

    bookingHistory: async (req, res) => {
        try {
            const userId = req.user.id;

            const userStatus = await db.users.findOne({
                where: { id: userId },
                attributes: ['status', 'block', 'suspend'],
                raw: true
            });
            if (!userStatus) {
                return helper.failure(res, "User not found.");
            }
            if (userStatus.status === "0") {
                return helper.error2(res, "Your account has been deactivated by admin.");
            }
            if (userStatus.block === "1") {
                return helper.error1(res, "Your account has been blocked by admin.");
            }
            if (userStatus.suspend === "1") {
                return helper.error3(res, "Your account has been suspended by admin.");
            }

            const { status } = req.query;

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            let statusCondition = {};

            if (status) {
                if (['0', '1', '2'].includes(status)) {
                    statusCondition = { [Sequelize.Op.in]: ['0', '1', '2'] };
                } else if (status === '3') {
                    statusCondition = '3';
                } else if (status === '4') {
                    statusCondition = '4';
                }
            } else {
                statusCondition = { [Sequelize.Op.in]: ['0', '1', '2'] };
            }

            const totalBookings = await db.bookings.count({
                where: {
                    [Sequelize.Op.or]: [
                        { driverId: userId },
                        { userId: userId }
                    ],
                    status: statusCondition,
                    request: '1'
                }
            });

            const bookings = await db.bookings.findAll({
                where: {
                    [Sequelize.Op.or]: [
                        { driverId: userId },
                        { userId: userId }
                    ],
                    status: statusCondition,
                    request: '1'
                },
                include: [
                    {
                        model: db.users,
                        as: 'driverbook',
                        include: [{
                            model: db.vehicleDetails,
                            as: 'vehicleDetail',
                            required: false
                        }]
                    },
                    {
                        model: db.users,
                        as: 'userbook',
                    }
                ],
                limit: limit,
                offset: offset,
                order: [['id', 'DESC']]
            });

            return helper.success(res, 'Booking history fetched successfully', {
                totalBookings: totalBookings,
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
                    rideOpen: booking.rideOpen
                }))
            });

        } catch (error) {
            console.error('Booking history error:', error);
            return helper.failure(res, "Something went wrong while fetching booking history.");
        }
    },

    bookingDetail: async (req, res) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const userStatus = await db.users.findOne({
                where: { id: userId },
                attributes: ['status', 'block', 'suspend'],
                raw: true
            });
            if (!userStatus) {
                return helper.failure(res, "User not found.");
            }
            if (userStatus.status === "0") {
                return helper.error2(res, "Your account has been deactivated by admin.");
            }
            if (userStatus.block === "1") {
                return helper.error1(res, "Your account has been blocked by admin.");
            }
            if (userStatus.suspend === "1") {
                return helper.error3(res, "Your account has been suspended by admin.");
            }

            if (!id) {
                return helper.failure(res, 'Booking ID is required.');
            }

            const booking = await db.bookings.findOne({
                where: {
                    id: id,
                    // [Sequelize.Op.or]: [
                    //     // { driverId: userId },
                    //     { userId: userId }
                    // ]
                },
                include: [
                    {
                        model: db.users,
                        as: 'driverbook',
                        include: [{
                            model: db.vehicleDetails,
                            as: 'vehicleDetail',
                            required: false
                        }]
                    },
                    {
                        model: db.users,
                        as: 'userbook',
                    }
                ]
            });

            if (!booking) {
                return helper.failure(res, 'Booking not found',);
            }

            return helper.success(res, 'Booking details fetched successfully', {
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
            });

        } catch (error) {
            console.error('Ride details error:', error);
            return helper.failure(res, "Something went wrong while fetching ride details.");
        }
    },

    // cancelRide: (io) => {
    //     return async (req, res) => {
    //         try {
    //             const loggedInUserId = req.user.id;
    //             const loggedInUserRole = req.user.role; // "1" = user, "2" = driver
    //             const { bookingId } = req.body;

    //             if (!bookingId) {
    //                 return helper.failure(res, "Booking ID is required.");
    //             }

    //             // Only pending / accepted rides can be cancelled
    //             const cancellableStatus = ["0", "1"];

    //             const whereCond = {
    //                 id: bookingId,
    //                 status: { [Op.in]: cancellableStatus }
    //             };

    //             // Role based ownership check
    //             if (loggedInUserRole === "1") {
    //                 whereCond.userId = loggedInUserId;
    //             } else if (loggedInUserRole === "2") {
    //                 whereCond.driverId = loggedInUserId;
    //             } else {
    //                 return helper.failure(res, "Only users or drivers can cancel a ride.");
    //             }
    //             const booking = await db.bookings.findOne({ where: whereCond });
    //             if (!booking) {
    //                 return helper.failure(res, "Ride cannot be cancelled or already processed.");
    //             }

    //             // 5 = cancelled by user
    //             // 4 = cancelled by driver
    //             const newStatus = loggedInUserRole === "1" ? "5" : "4";
    //             await booking.update({ status: newStatus });

    //             // USER cancelled → notify DRIVER
    //             if (loggedInUserRole === "1") {
    //                 const driverId = booking.driverId;

    //                 if (driverId && global.onlineUsers?.[driverId]) {
    //                     global.onlineUsers[driverId].forEach(socketId => {
    //                         io.to(socketId).emit("rideStatusUpdate", {
    //                             success: true,
    //                             message: "Ride cancelled by user",
    //                             bookingId: booking.id,
    //                             status: "5",
    //                             cancelledBy: "user"
    //                         });
    //                     });
    //                 }
    //             }
    //             // DRIVER cancelled → notify USER
    //             if (loggedInUserRole === "2") {
    //                 const userId = booking.userId;

    //                 if (userId && global.onlineUsers?.[userId]) {
    //                     global.onlineUsers[userId].forEach(socketId => {
    //                         io.to(socketId).emit("rideStatusUpdate", {
    //                             success: true,
    //                             message: "Ride cancelled by driver",
    //                             bookingId: booking.id,
    //                             status: "4",
    //                             cancelledBy: "driver"
    //                         });
    //                     });
    //                 }
    //             }
    //             const msg =
    //                 loggedInUserRole === "1"
    //                     ? "Ride cancelled by user successfully."
    //                     : "Ride cancelled by driver successfully.";

    //             return helper.success(res, msg, {
    //                 bookingId: booking.id,
    //                 cancelledBy: loggedInUserRole === "1" ? "user" : "driver",
    //                 status: newStatus,
    //                 message: "Ride has been cancelled."
    //             });
    //         } catch (error) {
    //             console.error(error);
    //             return helper.failure(res, "Something went wrong while cancelling the ride.");
    //         }
    //     };
    // },
    cancelRide: (io) => {
        return async (req, res) => {
            try {
                const loggedInUserId = req.user.id;
                const loggedInUserRole = req.user.role; // "1" = user, "2" = driver
                const { bookingId } = req.body;

                if (!bookingId) {
                    return helper.failure(res, "Booking ID is required.");
                }

                const cancellableStatus = ["0", "1"];

                const whereCond = {
                    id: bookingId,
                    status: { [Op.in]: cancellableStatus }
                };

                if (loggedInUserRole === "1") {
                    whereCond.userId = loggedInUserId;
                } else if (loggedInUserRole === "2") {
                    whereCond.driverId = loggedInUserId;
                } else {
                    return helper.failure(res, "Only users or drivers can cancel a ride.");
                }

                const booking = await db.bookings.findOne({ where: whereCond });

                if (!booking) {
                    return helper.failure(res, "Ride cannot be cancelled or already processed.");
                }

                // 5 = cancelled by user
                // 4 = cancelled by driver
                const newStatus = loggedInUserRole === "1" ? "5" : "4";
                await booking.update({ status: newStatus });

                /* ================= USER CANCEL ================= */
                if (loggedInUserRole === "1") {

                    const driverId = booking.driverId;
                    const request = booking.request; // 0 / 1
                    const status = booking.status;   // old status before cancel

                    // 🔹 CASE 1: Driver already accepted (request = 1)
                    if (
                        request === "1" &&
                        driverId &&
                        global.onlineUsers?.[driverId]
                    ) {
                        global.onlineUsers[driverId].forEach(socketId => {
                            io.to(socketId).emit("rideStatusUpdate", {
                                success: true,
                                message: "Ride cancelled by user",
                                bookingId: booking.id,
                                status: "5",
                                cancelledBy: "user"
                            });
                        });
                    }

                    // 🔹 CASE 2: No driver accepted yet (request = 0, status = 0)
                    if (request === "0") {

                        const pickupLat = parseFloat(booking.pickupLatitude);
                        const pickupLng = parseFloat(booking.pickupLongitude);
                        const MAX_DISTANCE = 30; // KM

                        const drivers = await db.users.findAll({
                            where: {
                                role: "2",
                                online: "1"
                            },
                            attributes: ["id", "latitude", "longitude"],
                            raw: true
                        });

                        const toRad = (v) => (v * Math.PI) / 180;
                        const distanceInKm = (lat1, lon1, lat2, lon2) => {
                            const R = 6371;
                            const dLat = toRad(lat2 - lat1);
                            const dLon = toRad(lon2 - lon1);
                            const a =
                                Math.sin(dLat / 2) ** 2 +
                                Math.cos(toRad(lat1)) *
                                Math.cos(toRad(lat2)) *
                                Math.sin(dLon / 2) ** 2;
                            return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
                        };

                        for (const driver of drivers) {
                            if (!driver.latitude || !driver.longitude) continue;

                            const dist = distanceInKm(
                                pickupLat,
                                pickupLng,
                                parseFloat(driver.latitude),
                                parseFloat(driver.longitude)
                            );

                            if (dist <= MAX_DISTANCE && global.onlineUsers?.[driver.id]) {
                                global.onlineUsers[driver.id].forEach(socketId => {
                                    io.to(socketId).emit("rideStatusUpdate", {
                                        success: true,
                                        message: "Ride cancelled by user",
                                        bookingId: booking.id,
                                        status: "5",
                                        cancelledBy: "user"
                                    });
                                });
                            }
                        }
                    }
                }

                /* ================= DRIVER CANCEL ================= */
                if (loggedInUserRole === "2") {
                    const userId = booking.userId;

                    if (userId && global.onlineUsers?.[userId]) {
                        global.onlineUsers[userId].forEach(socketId => {
                            io.to(socketId).emit("rideStatusUpdate", {
                                success: true,
                                message: "Ride cancelled by driver",
                                bookingId: booking.id,
                                status: "4",
                                cancelledBy: "driver"
                            });
                        });
                    }
                }

                const msg =
                    loggedInUserRole === "1"
                        ? "Ride cancelled by user successfully."
                        : "Ride cancelled by driver successfully.";

                return helper.success(res, msg, {
                    bookingId: booking.id,
                    cancelledBy: loggedInUserRole === "1" ? "user" : "driver",
                    status: newStatus,
                    message: "Ride has been cancelled."
                });

            } catch (error) {
                console.error(error);
                return helper.failure(res, "Something went wrong while cancelling the ride.");
            }
        };
    },


    report: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                reportTo: "required",
            });
            const errorResponse = await helper.checkValidation(v);
            if (errorResponse) {
                return helper.error(res, errorResponse);
            }
            req.body.reportBy = req.user.id;
            // Check if the report already exists
            const existingReport = await db.reports.findOne({
                where: {
                    reportTo: req.body.reportTo,
                    reportBy: req.body.reportBy,
                },
                raw: true
            });

            if (existingReport) {
                return helper.failure(res, "You have already reported this user.");
            }

            // Create a new report if it doesn't exist
            const newReport = await db.reports.create({
                ...req.body,
            });

            return helper.success(res, "Report added successfully", newReport);

        } catch (error) {
            console.error("Error:", error);
            return helper.error(res, "Something went wrong.", error);
        }
    },


    blockUser: (io) => {
        return async (req, res) => {
            try {
                const v = new Validator(req.body, {
                    userId: "required",
                    block: "required|in:0,1"
                });

                const errorResponse = await helper.checkValidation(v);
                if (errorResponse) {
                    return helper.failure(res, errorResponse);
                }

                const blockBy = req.user.id;
                const blockTo = req.body.userId;

                if (blockBy == blockTo) {
                    return helper.failure(res, "You cannot block yourself.");
                }

                await db.users.update(
                    { block: req.body.block },
                    { where: { id: blockTo } }
                );

                const message =
                    req.body.block === "1"
                        ? "User blocked successfully"
                        : "User unblocked successfully";
                if (io && global.onlineUsers && onlineUsers[blockTo]) {
                    onlineUsers[blockTo].forEach(socketId => {
                        io.to(socketId).emit("blockedStatusChanged", {
                            by: blockBy,
                            status: req.body.block,
                            message
                        });
                    });
                }

                return helper.success(res, message);

            } catch (error) {
                console.error("Block user error:", error);
                return helper.failure(res, "Something went wrong.");
            }
        };
    },

    driverWaletRecharge: async (req, res) => {
        try {
            const data = await db.transferscreenshot.create({
                driverId: req.user.id,
                image: req.body.image
            });
            return helper.success(res, "Driver Wallet Recharge created successfully", data);
        } catch (error) {
            console.log(error);
            return helper.failure(res, "Something went wrong");
        }
    }




}