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
    // findRide1: async (req, res) => {
    //     try {
    //         const userId = req.user.id;
    //         const { pickupLatitude, pickupLongitude, dropLatitude, dropLongitude, pickupLocation, dropLocation } = req.body;

    //         if (!pickupLatitude || !pickupLongitude || !dropLatitude || !dropLongitude) {
    //             return helper.failure(res, 'Pickup and drop coordinates are required.');
    //         }

    //         const pickupLat = parseFloat(pickupLatitude);
    //         const pickupLng = parseFloat(pickupLongitude);
    //         const dropLat = parseFloat(dropLatitude);
    //         const dropLng = parseFloat(dropLongitude);

    //         if (isNaN(pickupLat) || isNaN(pickupLng) || isNaN(dropLat) || isNaN(dropLng)) {
    //             return helper.failure(res, 'Invalid coordinates provided.');
    //         }

    //         console.log("Parsed Pickup Coordinates:", pickupLat, pickupLng);
    //         console.log("Parsed Drop Coordinates:", dropLat, dropLng);
    //         console.log("Pickup Address:", pickupLocation || 'Not provided');
    //         console.log("Drop Address:", dropLocation || 'Not provided');

    //         const maxRadius = 30;

    //         // NEW CODE — FETCH BUSY DRIVERS (status 0,1,2 and request 0)
    //         const busyDrivers = await db.bookings.findAll({
    //             where: {
    //                 status: { [Sequelize.Op.in]: ['0', '1', '2'] },
    //                 request: '0'
    //             },
    //             attributes: ['driverId']
    //         });
    //         const busyDriverIds = busyDrivers.map(b => b.driverId);
    //         // END NEW CODE

    //         const nearbyDrivers = await db.users.findAll({
    //             where: {
    //                 role: '2',
    //                 online: '1',
    //                 id: { [Sequelize.Op.notIn]: busyDriverIds }
    //             },
    //             include: [{
    //                 model: db.vehicleDetails,
    //                 as: 'vehicleDetail',
    //                 required: true
    //             }],
    //         });

    //         function calculateDistance(lat1, lon1, lat2, lon2) {
    //             const R = 6371;
    //             const dLat = toRad(lat2 - lat1);
    //             const dLon = toRad(lon2 - lon1);
    //             const a =
    //                 Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    //                 Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    //                 Math.sin(dLon / 2) * Math.sin(dLon / 2);
    //             const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    //             return R * c;
    //         }

    //         function toRad(degrees) {
    //             return degrees * (Math.PI / 180);
    //         }

    //         const driversWithDistance = nearbyDrivers
    //             .map(driver => {
    //                 if (!driver.latitude || !driver.longitude) {
    //                     console.log(`Driver ${driver.id} has missing latitude/longitude`);
    //                     return null;
    //                 }

    //                 const driverLat = parseFloat(driver.latitude);
    //                 const driverLng = parseFloat(driver.longitude);

    //                 if (isNaN(driverLat) || isNaN(driverLng)) {
    //                     console.log(`Driver ${driver.id} has invalid coordinates`);
    //                     return null;
    //                 }

    //                 console.log(`Driver ${driver.firstName} ${driver.lastName} Location:`, driverLat, driverLng);

    //                 const distance = calculateDistance(
    //                     pickupLat,
    //                     pickupLng,
    //                     driverLat,
    //                     driverLng
    //                 );

    //                 console.log(`Distance from pickup to driver ${driver.firstName} ${driver.lastName}: ${distance} km`);

    //                 if (distance >= 0 && distance <= maxRadius) {
    //                     const fullName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim();

    //                     return {
    //                         ...driver.toJSON(),
    //                         fullName: fullName,
    //                         distanceFromPickup: distance.toFixed(2),
    //                         distanceUnit: 'km',
    //                         vehicleDetails: driver.vehicleDetail
    //                     };
    //                 }
    //                 return null;
    //             })
    //             .filter(driver => driver !== null)
    //             .sort((a, b) => a.distanceFromPickup - b.distanceFromPickup);

    //         console.log('Drivers within 0-30 km radius:', driversWithDistance.length);

    //         if (driversWithDistance.length === 0) {
    //             return helper.error(res, 'No drivers available within 30 km of your pickup location', 404);
    //         }

    //         return helper.success(res, 'Nearby drivers found', {
    //             userId: userId,
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
    //                 distanceUnit: driver.distanceUnit
    //             }))
    //         });

    //     } catch (error) {
    //         return helper.failure(res, "Something went wrong.");
    //     }
    // },
    findRide: async (req, res) => {
        try {
            const userId = req.user.id;
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

            console.log("Parsed Pickup Coordinates:", pickupLat, pickupLng);
            console.log("Parsed Drop Coordinates:", dropLat, dropLng);
            console.log("Pickup Address:", pickupLocation || 'Not provided');
            console.log("Drop Address:", dropLocation || 'Not provided');

            const maxRadius = 30;

            // -------- DISTANCE UTILS --------
            function toRad(degrees) {
                return degrees * (Math.PI / 180);
            }

            function calculateDistance(lat1, lon1, lat2, lon2) {
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
            }

            // -------- PRICE CALCULATION (NEW) --------
            const rideDistanceKm = calculateDistance(
                pickupLat,
                pickupLng,
                dropLat,
                dropLng
            );

            const bookingPrice = Math.round(rideDistanceKm * 10); // ₹10 per KM
            // ----------------------------------------

            // -------- FETCH BUSY DRIVERS --------
            const busyDrivers = await db.bookings.findAll({
                where: {
                    status: { [Sequelize.Op.in]: ['0', '1', '2'] },
                    request: '0'
                },
                attributes: ['driverId']
            });

            const busyDriverIds = busyDrivers.map(b => b.driverId);

            // -------- FETCH NEARBY DRIVERS --------
            const nearbyDrivers = await db.users.findAll({
                where: {
                    role: '2',
                    online: '1',
                    id: { [Sequelize.Op.notIn]: busyDriverIds }
                },
                include: [{
                    model: db.vehicleDetails,
                    as: 'vehicleDetail',
                    required: true
                }],
            });

            const driversWithDistance = nearbyDrivers
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

                    if (distance >= 0 && distance <= maxRadius) {
                        return {
                            ...driver.toJSON(),
                            fullName: `${driver.firstName || ''} ${driver.lastName || ''}`.trim(),
                            distanceFromPickup: distance.toFixed(2),
                            distanceUnit: 'km',
                            vehicleDetails: driver.vehicleDetail
                        };
                    }
                    return null;
                })
                .filter(Boolean)
                .sort((a, b) => a.distanceFromPickup - b.distanceFromPickup);

            if (driversWithDistance.length === 0) {
                return helper.failure(
                    res,
                    'No drivers available within 30 km of your pickup location',
                                    );
            }

            // -------- RESPONSE --------
            return helper.success(res, 'Nearby drivers found', {
                userId: userId,

                bookingPrice: bookingPrice,
                rideDistanceKm: rideDistanceKm.toFixed(2), // optional (safe)

                pickupLocation: {
                    latitude: pickupLat,
                    longitude: pickupLng,
                    address: pickupLocation || null
                },
                dropLocation: {
                    latitude: dropLat,
                    longitude: dropLng,
                    address: dropLocation || null
                },
                searchRadius: `0-${maxRadius} km`,
                totalDriversNearPickup: driversWithDistance.length,
                drivers: driversWithDistance.map(driver => ({
                    id: driver.id,
                    fullName: driver.fullName,
                    firstName: driver.firstName,
                    lastName: driver.lastName,
                    phone: driver.phone,
                    profileImage: driver.profileImage,
                    vehicleDetails: driver.vehicleDetails,
                    latitude: driver.latitude,
                    longitude: driver.longitude,
                    distanceFromPickup: driver.distanceFromPickup,
                    distanceUnit: driver.distanceUnit
                }))
            });

        } catch (error) {
            console.error(error);
            return helper.failure(res, "Something went wrong.");
        }
    },

    // bookRide: (io) => {
    //     return async (req, res) => {
    //         try {
    //             const userId = req.user.id;
    //             const {
    //                 driverId, pickupLocation, dropLocation, pickupLatitude, pickupLongitude, dropLatitude, dropLongitude,
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

    //             if (isNaN(pickupLat) || isNaN(pickupLng) || isNaN(dropLat) || isNaN(dropLng)) {
    //                 return helper.failure(res, 'Invalid coordinates provided.');
    //             }

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
    //                 return helper.error(res, 'Driver not found or not available', 404);
    //             }

    //             //  ADD YOUR SAME RADIUS CHECK (0–30 KM LIMIT)
    //             const maxRadius = 30;

    //             if (!driver.latitude || !driver.longitude) {
    //                 return helper.error(res, 'Driver location not available', 404);
    //             }

    //             const driverLat = parseFloat(driver.latitude);
    //             const driverLng = parseFloat(driver.longitude);

    //             if (isNaN(driverLat) || isNaN(driverLng)) {
    //                 return helper.error(res, 'Driver has invalid coordinates', 404);
    //             }

    //             const driverDistance = calculateDistance(
    //                 pickupLat,
    //                 pickupLng,
    //                 driverLat,
    //                 driverLng
    //             );

    //             console.log(`Driver distance from pickup: ${driverDistance} km`);

    //             if (!(driverDistance >= 0 && driverDistance <= maxRadius)) {
    //                 return helper.error(res, 'No drivers available within 30 km of your pickup location', 404);
    //             }

    //             const existingBooking = await db.bookings.findOne({
    //                 where: {
    //                     userId: userId,
    //                     status: { [Sequelize.Op.in]: ['0', '1', '2'] },
    //                     request: '0'
    //                 }
    //             });

    //             if (existingBooking) {
    //                 return helper.error(res, 'You already have an active ride request');
    //             }

    //             const driverActiveBooking = await db.bookings.findOne({
    //                 where: {
    //                     driverId: driverId,
    //                     status: { [Sequelize.Op.in]: ['0', '1', '2'] },
    //                     request: '0'
    //                 }
    //             });

    //             if (driverActiveBooking) {
    //                 return helper.error(res, 'Driver is currently busy with another ride', 400);
    //             }

    //             const generateOrderId = () => {
    //                 return Math.floor(100000 + Math.random() * 900000).toString();
    //             };

    //             let orderId;
    //             let isUnique = false;

    //             while (!isUnique) {
    //                 orderId = generateOrderId();
    //                 const existingOrder = await db.bookings.findOne({
    //                     where: { orderId: orderId }
    //                 });
    //                 if (!existingOrder) {
    //                     isUnique = true;
    //                 }
    //             }

    //             const newBooking = await db.bookings.create({
    //                 userId: userId,
    //                 driverId: driverId,
    //                 orderId: orderId,
    //                 status: '0',
    //                 pickupLocation: pickupLocation,
    //                 dropLocation: dropLocation,
    //                 pickupLatitude: pickupLatitude.toString(),
    //                 pickupLongitude: pickupLongitude.toString(),
    //                 dropLatitude: dropLatitude.toString(),
    //                 dropLongitude: dropLongitude.toString(),
    //                 request: '0'
    //             });

    //             console.log(`Booking created for user ${userId} with driver ${driverId}, Order ID: ${orderId}`);

    //             // SOCKET EMIT
    //             try {
    //                 if (io && global.onlineUsers && onlineUsers[driverId]) {
    //                     onlineUsers[driverId].forEach(sockId => {
    //                         io.to(sockId).emit("newRideRequest", {
    //                             bookingId: newBooking.id,
    //                             orderId: newBooking.orderId,
    //                             userId: userId,
    //                             driverId: driverId,
    //                             pickupLocation,
    //                             dropLocation,
    //                             pickupLatitude,
    //                             pickupLongitude,
    //                             dropLatitude,
    //                             dropLongitude,
    //                             status: '0',
    //                             request: '0'
    //                         });
    //                     });
    //                 }
    //             } catch (e) {
    //                 console.log("Socket emit failed:", e);
    //             }

    //             return helper.success(res, 'Ride booking request sent successfully', {
    //                 bookingId: newBooking.id,
    //                 orderId: newBooking.orderId,
    //                 userId: userId,
    //                 driverId: driverId,
    //                 status: newBooking.status,
    //                 request: newBooking.request,
    //                 pickupLocation: newBooking.pickupLocation,
    //                 dropLocation: newBooking.dropLocation,
    //                 coordinates: {
    //                     pickup: {
    //                         latitude: newBooking.pickupLatitude,
    //                         longitude: newBooking.pickupLongitude
    //                     },
    //                     drop: {
    //                         latitude: newBooking.dropLatitude,
    //                         longitude: newBooking.dropLongitude
    //                     }
    //                 },
    //                 driverDetails: {
    //                     id: driver.id,
    //                     fullName: `${driver.firstName} ${driver.lastName}`,
    //                     phone: driver.phoneNumber,
    //                     profileImage: driver.image,
    //                     vehicleDetails: driver.vehicleDetail
    //                 },
    //                 message: 'Waiting for driver to accept your request'
    //             });

    //         } catch (error) {
    //             console.error('Booking error:', error);
    //             return helper.failure(res, "Something went wrong while booking the ride.");
    //         }
    //     };
    // },

    // 1bookRide: (io) => {
    //     return async (req, res) => {
    //         try {
    //             const userId = req.user.id;
    //             const {
    //                 driverId,
    //                 pickupLocation,
    //                 dropLocation,
    //                 pickupLatitude,
    //                 pickupLongitude,
    //                 dropLatitude,
    //                 dropLongitude,
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
    //                 return helper.error(res, 'Driver not found or not available', 404);
    //             }

    //             // -------- RADIUS CHECK (0–30 KM) --------
    //             const maxRadius = 30;

    //             if (!driver.latitude || !driver.longitude) {
    //                 return helper.error(res, 'Driver location not available', 404);
    //             }

    //             const driverLat = parseFloat(driver.latitude);
    //             const driverLng = parseFloat(driver.longitude);

    //             if (isNaN(driverLat) || isNaN(driverLng)) {
    //                 return helper.error(res, 'Driver has invalid coordinates', 404);
    //             }

    //             const driverDistance = calculateDistance(
    //                 pickupLat,
    //                 pickupLng,
    //                 driverLat,
    //                 driverLng
    //             );

    //             if (!(driverDistance >= 0 && driverDistance <= maxRadius)) {
    //                 return helper.error(
    //                     res,
    //                     'No drivers available within 30 km of your pickup location',
    //                     404
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
    //                 return helper.error(res, 'You already have an active ride request');
    //             }

    //             const driverActiveBooking = await db.bookings.findOne({
    //                 where: {
    //                     driverId,
    //                     status: { [Sequelize.Op.in]: ['0', '1', '2'] },
    //                     request: '0'
    //                 }
    //             });

    //             if (driverActiveBooking) {
    //                 return helper.error(
    //                     res,
    //                     'Driver is currently busy with another ride',
    //                     400
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
    //                 request: '0'
    //             });

    //             console.log(
    //                 `Booking created for user ${userId} with driver ${driverId}, Order ID: ${orderId}`
    //             );

    //             // ---------------- SOCKET EMIT (FULL SAFE) ----------------
    //             try {
    //                 let emitted = false;

    //                 // 1️⃣ Emit using onlineUsers (old drivers)
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
    //                             request: '0'
    //                         });
    //                     });
    //                     emitted = true;
    //                 }

    //                 // 2️⃣ Fallback → DB socketId (NEW DRIVER CASE)
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
    //                         request: '0'
    //                     });
    //                 }

    //             } catch (e) {
    //                 console.log("Socket emit failed:", e);
    //             }
    //             // ---------------------------------------------------------

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
                const {
                    driverId,
                    pickupLocation,
                    dropLocation,
                    pickupLatitude,
                    pickupLongitude,
                    dropLatitude,
                    dropLongitude,
                    rideOpen
                } = req.body;

                if (!driverId) {
                    return helper.failure(res, 'Driver ID is required.');
                }

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

                // ---------------- DISTANCE + PRICE CALCULATION (NEW) ----------------
                const toRad = (value) => value * Math.PI / 180;

                const calculateDistance = (lat1, lon1, lat2, lon2) => {
                    const R = 6371; // KM
                    const dLat = toRad(lat2 - lat1);
                    const dLon = toRad(lon2 - lon1);
                    const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    return R * c;
                };

                const rideDistanceKm = calculateDistance(
                    pickupLat,
                    pickupLng,
                    dropLat,
                    dropLng
                );

                const bookingPrice = Math.round(rideDistanceKm * 10); // ₹10 per KM
                // --------------------------------------------------------------------

                // -------- DRIVER FETCH ---------
                const driver = await db.users.findOne({
                    where: {
                        id: driverId,
                        role: '2',
                        online: '1'
                    },
                    include: [{
                        model: db.vehicleDetails,
                        as: 'vehicleDetail',
                        required: true
                    }]
                });

                if (!driver) {
                    return helper.failure(res, 'Driver not found or not available',);
                }

                // -------- RADIUS CHECK (0–30 KM) --------
                const maxRadius = 30;

                if (!driver.latitude || !driver.longitude) {
                    return helper.failure(res, 'Driver location not available',);
                }

                const driverLat = parseFloat(driver.latitude);
                const driverLng = parseFloat(driver.longitude);

                if (isNaN(driverLat) || isNaN(driverLng)) {
                    return helper.failure(res, 'Driver has invalid coordinates',);
                }

                const driverDistance = calculateDistance(
                    pickupLat,
                    pickupLng,
                    driverLat,
                    driverLng
                );

                if (!(driverDistance >= 0 && driverDistance <= maxRadius)) {
                    return helper.failure(
                        res,
                        'No drivers available within 30 km of your pickup location',
                                            );
                }

                const existingBooking = await db.bookings.findOne({
                    where: {
                        userId,
                        status: { [Sequelize.Op.in]: ['0', '1', '2'] },
                        request: '0'
                    }
                });

                if (existingBooking) {
                    return helper.error(res, 'You already have an active ride request');
                }

                const driverActiveBooking = await db.bookings.findOne({
                    where: {
                        driverId,
                        status: { [Sequelize.Op.in]: ['0', '1', '2'] },
                        request: '0'
                    }
                });

                if (driverActiveBooking) {
                    return helper.failure(
                        res,
                        'Driver is currently busy with another ride',
                    );
                }

                const generateOrderId = () => {
                    return Math.floor(100000 + Math.random() * 900000).toString();
                };

                let orderId;
                let isUnique = false;

                while (!isUnique) {
                    orderId = generateOrderId();
                    const existingOrder = await db.bookings.findOne({
                        where: { orderId }
                    });
                    if (!existingOrder) {
                        isUnique = true;
                    }
                }

                // ---------------- SAVE bookingPrice (NEW) ----------------
                const newBooking = await db.bookings.create({
                    userId,
                    driverId,
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
                // ---------------------------------------------------------

                // ---------------- SOCKET EMIT (UNCHANGED) ----------------
                try {
                    let emitted = false;

                    if (io && global.onlineUsers && onlineUsers[driverId]?.length) {
                        onlineUsers[driverId].forEach(sockId => {
                            io.to(sockId).emit("newRideRequest", {
                                bookingId: newBooking.id,
                                orderId: newBooking.orderId,
                                userId,
                                driverId,
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
                        emitted = true;
                    }

                    if (!emitted && driver.socketId) {
                        io.to(driver.socketId).emit("newRideRequest", {
                            bookingId: newBooking.id,
                            orderId: newBooking.orderId,
                            userId,
                            driverId,
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
                    }
                } catch (e) {
                    console.log("Socket emit failed:", e);
                }
                // ---------------------------------------------------------

                return helper.success(
                    res,
                    'Ride booking request sent successfully',
                    {
                        bookingId: newBooking.id,
                        orderId: newBooking.orderId,
                        userId,
                        driverId,
                        status: newBooking.status,
                        request: newBooking.request,
                        bookingPrice: bookingPrice,          // 👈 SHOWN
                        rideDistanceKm: rideDistanceKm.toFixed(2), // 👈 SHOWN
                        pickupLocation: newBooking.pickupLocation,
                        dropLocation: newBooking.dropLocation,
                        coordinates: {
                            pickup: {
                                latitude: newBooking.pickupLatitude,
                                longitude: newBooking.pickupLongitude
                            },
                            drop: {
                                latitude: newBooking.dropLatitude,
                                longitude: newBooking.dropLongitude
                            }
                        },
                        driverDetails: {
                            id: driver.id,
                            fullName: `${driver.firstName} ${driver.lastName}`,
                            phone: driver.phoneNumber,
                            profileImage: driver.image,
                            vehicleDetails: driver.vehicleDetail
                        },
                        message: 'Waiting for driver to accept your request'
                    }
                );

            } catch (error) {
                console.error('Booking error:', error);
                return helper.failure(
                    res,
                    "Something went wrong while booking the ride."
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
                    return helper.failure(res, 'Invalid request value. Must be "1" (accept) or "2" (reject).');
                }

                const booking = await db.bookings.findOne({
                    where: {
                        id: bookingId,
                        driverId: driverId,
                        status: '0',
                        request: '0'
                    },
                    include: [{
                        model: db.users,
                        as: 'userbook',
                        attributes: ['id', 'socketId']
                    }]
                });

                if (!booking) {
                    return helper.error(res, 'Booking already processed');
                }
                // Accept or reject
                if (request === '1') {
                    await booking.update({ request: request, status: '0' });   // Accept
                } else {
                    await booking.update({ request: request, status: '4' }); // Reject
                }
                // Notify user
                // if (booking.userbook && booking.userbook.socketId) {
                //     io.to(booking.userbook.socketId).emit("rideStatusUpdate", {
                //         bookingId: booking.id,
                //         driverId: driverId,
                //         request: request,
                //         status: request === "1" ? "Driver on the way" : "Booking rejected",
                //         message: request === "1"
                //             ? "Driver accepted your booking and is on the way"
                //             : "Driver rejected your booking"
                //     });
                // }
                if (booking.userbook && booking.userbook.socketId) {

                    let statusCode = request === "1" ? "0" : "4";
                    let msg = request === "1"
                        ? "Driver on the way"
                        : "Driver rejected the booking";

                    io.to(booking.userbook.socketId).emit("rideStatusUpdate", {
                        bookingId: booking.id,
                        driverId: driverId,
                        request: request,
                        status: statusCode,
                        message: msg
                    });
                }
                const message = request === '1'
                    ? 'Booking accepted successfully. Driver on the way.'
                    : 'Booking rejected successfully';

                const actionMessage = request === '1'
                    ? 'You have accepted the ride request. Driver on the way.'
                    : 'You have rejected the ride request';

                return helper.success(res, message, {
                    bookingId: booking.id,
                    request: request,
                    message: actionMessage
                });
            } catch (error) {
                return helper.failure(res, "Something went wrong while processing the booking.");
            }
        };
    },

    requestList: async (req, res) => {
        try {
            const driverId = req.user.id;

            const requests = await db.bookings.findAll({
                where: {
                    driverId: driverId,
                    status: '0',
                    request: '0'
                },
                include: [{
                    model: db.users,
                    as: 'userbook',
                }]
            });

            return helper.success(res, 'Pending ride requests fetched successfully', {
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
                    orderId: booking.orderId
                }))
            });

        } catch (error) {
            return helper.failure(res, "Something went wrong while fetching requests.");
        }
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
                return helper.error(res, 'Booking not found or cannot be updated', 404);
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
                    bookingDate: booking.bookingDate
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

            if (!id) {
                return helper.failure(res, 'Booking ID is required.');
            }

            const booking = await db.bookings.findOne({
                where: {
                    id: id,
                    [Sequelize.Op.or]: [
                        { driverId: userId },
                        { userId: userId }
                    ]
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
                return helper.error(res, 'Booking not found', 404);
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
                bookingPrice: booking.bookingPrice
            });

        } catch (error) {
            console.error('Ride details error:', error);
            return helper.failure(res, "Something went wrong while fetching ride details.");
        }
    },

    cancelRide: (io) => {
        return async (req, res) => {
            try {
                const loggedInUserId = req.user.id;
                const loggedInUserRole = req.user.role; // "1" = user, "2" = driver
                const { bookingId } = req.body;

                if (!bookingId) {
                    return helper.failure(res, "Booking ID is required.");
                }

                // Only pending / accepted rides can be cancelled
                const cancellableStatus = ["0", "1"];

                const whereCond = {
                    id: bookingId,
                    status: { [Op.in]: cancellableStatus }
                };

                // Role based ownership check
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

                // USER cancelled → notify DRIVER
                if (loggedInUserRole === "1") {
                    const driverId = booking.driverId;

                    if (driverId && global.onlineUsers?.[driverId]) {
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
                }
                // DRIVER cancelled → notify USER
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
                return helper.error(res, "You have already reported this user.");
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

    // blockUser: async (req, res) => {
    //     try {
    //         const v = new Validator(req.body, {
    //             userId: "required",
    //             block: "required|in:0,1"   // 0 = unblock, 1 = block
    //         });
    //         const errorResponse = await helper.checkValidation(v);
    //         if (errorResponse) {
    //             return helper.error(res, errorResponse);
    //         }

    //         const blockBy = req.user.id;
    //         const blockTo = req.body.userId;

    //         if (blockBy == blockTo) {
    //             return helper.error(res, "You cannot block yourself.");
    //         }

    //         // Update block status
    //         await db.users.update(
    //             { block: req.body.block },
    //             { where: { id: blockTo } }
    //         );

    //         const message = req.body.block === "1"
    //             ? "User blocked successfully"
    //             : "User unblocked successfully";

    //         return helper.success(res, message);

    //     } catch (error) {
    //         console.error("Error:", error);
    //         return helper.error(res, "Something went wrong.", error);
    //     }
    // },

    blockUser: (io) => {
        return async (req, res) => {
            try {
                const v = new Validator(req.body, {
                    userId: "required",
                    block: "required|in:0,1"
                });

                const errorResponse = await helper.checkValidation(v);
                if (errorResponse) {
                    return helper.error(res, errorResponse);
                }

                const blockBy = req.user.id;
                const blockTo = req.body.userId;

                if (blockBy == blockTo) {
                    return helper.error(res, "You cannot block yourself.");
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
                return helper.error(res, "Something went wrong.");
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