const db = require('../../models');
const bcrypt = require('bcryptjs');
const helper = require('../../helper/helper');
const { Validator } = require('node-input-validator');
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { Sequelize } = require('sequelize');
const io = require("../../socket/socket")
const axios = require("axios")
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

    // bookRide: (io) => {
    //     return async (req, res) => {
    //         let languageType = Number(req.headers.languagetype) || 0;

    //         const getPushMessage = (lang, en, ar, fr) => {
    //             if (lang === 1) return ar;
    //             if (lang === 2) return fr;
    //             return en;
    //         };

    //         try {
    //             const userId = req.user.id;

    //             // ---------------- USER STATUS ----------------
    //             const userStatus = await db.users.findOne({
    //                 where: { id: userId },
    //                 attributes: ['status', 'block', 'suspend', 'role'],
    //                 raw: true
    //             });

    //             if (!userStatus) {
    //                 return helper.failure(res,
    //                     languageType === 1 ? "المستخدم غير موجود." :
    //                         languageType === 2 ? "Utilisateur non trouvé." :
    //                             "User not found."
    //                 );
    //             }
    //             if (userStatus.status === "0") {
    //                 return helper.error2(res,
    //                     languageType === 1 ? "تم تعطيل حسابك من قبل المسؤول." :
    //                         languageType === 2 ? "Votre compte a été désactivé par l'administrateur." :
    //                             "Your account has been deactivated by admin."
    //                 );
    //             }
    //             if (userStatus.block === "1") {
    //                 return helper.error1(res,
    //                     languageType === 1 ? "تم حظر حسابك من قبل المسؤول." :
    //                         languageType === 2 ? "Votre compte a été bloqué par l'administrateur." :
    //                             "Your account has been blocked by admin."
    //                 );
    //             }
    //             if (userStatus.suspend === "1") {
    //                 return helper.error3(res,
    //                     languageType === 1 ? "تم تعليق حسابك من قبل المسؤول." :
    //                         languageType === 2 ? "Votre compte a été suspendu par l'administrateur." :
    //                             "Your account has been suspended by admin."
    //                 );
    //             }

    //             const {
    //                 pickupLocation,
    //                 dropLocation,
    //                 pickupLatitude,
    //                 pickupLongitude,
    //                 dropLatitude,
    //                 dropLongitude,
    //                 rideOpen,
    //                 callerPhone,
    //                 callerCountryCode,
    //                 callerName,
    //             } = req.body;

    //             // ---------------- PICKUP / DROP VALIDATION ----------------
    //             if (!pickupLocation || !pickupLatitude || !pickupLongitude) {
    //                 return helper.failure(res,
    //                     languageType === 1 ? "موقع الالتقاط والإحداثيات مطلوبة." :
    //                         languageType === 2 ? "Le lieu de prise en charge et les coordonnées sont requis." :
    //                             "Pickup location and coordinates are required."
    //                 );
    //             }
    //             if (rideOpen == 0 && (!dropLocation || !dropLatitude || !dropLongitude)) {
    //                 return helper.failure(res,
    //                     languageType === 1 ? "مواقع الالتقاط والتسليم مطلوبة." :
    //                         languageType === 2 ? "Les lieux de prise en charge et de dépôt sont requis." :
    //                             "Pickup and drop locations are required."
    //                 );
    //             }

    //             const pickupLat = parseFloat(pickupLatitude);
    //             const pickupLng = parseFloat(pickupLongitude);

    //             // ---------------- GOOGLE ROUTES API (NEW) ----------------
    //             const calculateGoogleDistance = async (originLat, originLng, destLat, destLng) => {
    //                 try {
    //                     const googleMapsKey = "AIzaSyDT712NfS8CFhtKud9s9lfxa5MLdQID91A";

    //                     console.log("🔍 TESTING API CONNECTION...");
    //                     console.log(`📍 From: ${originLat}, ${originLng} → To: ${destLat}, ${destLng}`);

    //                     const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${googleMapsKey}`;

    //                     console.log("📡 Calling URL:", url);

    //                     const response = await axios.get(url);

    //                     console.log("📊 Full Response:", JSON.stringify(response.data, null, 2));

    //                     if (response.data.status === 'OK') {
    //                         if (response.data.rows[0].elements[0].status === 'OK') {
    //                             const distanceInMeters = response.data.rows[0].elements[0].distance.value;
    //                             const distanceInKm = distanceInMeters / 1000;
    //                             console.log(`✅ SUCCESS! Road distance: ${distanceInKm} km`);
    //                             return distanceInKm;
    //                         } else {
    //                             console.log("❌ Element status:", response.data.rows[0].elements[0].status);
    //                             return null;
    //                         }
    //                     } else {
    //                         console.log("❌ API Status:", response.data.status);
    //                         if (response.data.error_message) {
    //                             console.log("Error message:", response.data.error_message);
    //                         }
    //                         return null;
    //                     }
    //                 } catch (error) {
    //                     console.error("❌ API Call Failed:", error.message);
    //                     if (error.response) {
    //                         console.log("Error response:", error.response.data);
    //                     }
    //                     return null;
    //                 }
    //             };

    //             // ---------------- FALLBACK HAVERSINE FORMULA (KM) ----------------
    //             const toRad = v => v * Math.PI / 180;
    //             const calculateHaversineDistance = (a, b, c, d) => {
    //                 const R = 6371; // Earth's radius in KM
    //                 const dLat = toRad(c - a);
    //                 const dLon = toRad(d - b);
    //                 const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(dLon / 2) ** 2;
    //                 return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
    //             };

    //             let rideDistanceKm = "";
    //             let bookingPrice = "";
    //             let basePrice = "";
    //             let totalMinutes = 0;
    //             let totalDistance = 0;

    //             // ---------------- ADMIN PRICE ----------------
    //             const adminData = await db.users.findOne({
    //                 where: { role: '0' },
    //                 attributes: ['rideAmount', 'priceRushHour', 'status'],
    //                 raw: true
    //             });


    //             // Use admin rideAmount for all pricing 
    //             const ADMIN_PRICE_PER_KM = parseFloat(adminData?.rideAmount) || 10;
    //             const BASE_PRICE = 100;
    //             const FREE_KM = 1;

    //             const pricePerKmOpen = ADMIN_PRICE_PER_KM;
    //             const pricePerMinOpen = 1;

    //             const roundToNearest5 = (num) => {
    //                 return Math.round(parseFloat(num) / 5) * 5;
    //             };

    //             if (rideOpen == 0) {
    //                 const dropLat = parseFloat(dropLatitude);
    //                 const dropLng = parseFloat(dropLongitude);

    //                 let distance = await calculateGoogleDistance(pickupLat, pickupLng, dropLat, dropLng);

    //                 if (distance === null || distance === undefined) {
    //                     console.log("Using Haversine fallback");
    //                     distance = calculateHaversineDistance(pickupLat, pickupLng, dropLat, dropLng);
    //                 }

    //                 rideDistanceKm = distance;
    //                 totalDistance = distance;

    //                 // ---------------- CHECK IF RIDE DISTANCE EXCEEDS 30KM ----------------
    //                 const MAX_RIDE_DISTANCE_KM = 30;
    //                 if (rideDistanceKm > MAX_RIDE_DISTANCE_KM) {
    //                     return helper.failure(res,
    //                         languageType === 1 ? `لا يمكن حجز رحلة تزيد مسافتها عن ٣٠ كم (المسافة: ${rideDistanceKm.toFixed(2)} كم)` :
    //                             languageType === 2 ? `Impossible de réserver une course de plus de 30 km (Distance: ${rideDistanceKm.toFixed(2)} km)` :
    //                                 `Cannot book ride longer than 30km (Distance: ${rideDistanceKm.toFixed(2)} km)`
    //                     );
    //                 }

    //                 // Calculate price: First 1km = 100 MRU,
    //                 let calculatedPrice;
    //                 if (rideDistanceKm <= FREE_KM) {
    //                     calculatedPrice = BASE_PRICE;
    //                 } else {
    //                     const extraKm = rideDistanceKm - FREE_KM;
    //                     const extraCharge = extraKm * ADMIN_PRICE_PER_KM; // Use admin amount
    //                     calculatedPrice = BASE_PRICE + extraCharge;
    //                 }

    //                 // APPLY ROUNDING TO NEAREST 5
    //                 bookingPrice = roundToNearest5(calculatedPrice).toString();
    //                 basePrice = bookingPrice;

    //                 console.log(`Regular ride (rideOpen=0) - Distance: ${rideDistanceKm} km, Price: ${bookingPrice} MRU (First ${FREE_KM}km = ${BASE_PRICE} MRU, then ${ADMIN_PRICE_PER_KM} MRU/km)`);

    //             } else if (rideOpen == 1) {
    //                 rideDistanceKm = "";
    //                 let calculatedPrice = BASE_PRICE;

    //                 bookingPrice = roundToNearest5(calculatedPrice).toString();
    //                 basePrice = bookingPrice;

    //                 console.log(`Open ride (rideOpen=1) - Base price: ${bookingPrice} MRU (First ${FREE_KM}km included), Per km after ${FREE_KM}km: ${ADMIN_PRICE_PER_KM} MRU, Per min: ${pricePerMinOpen} MRU (will be added in real-time)`);
    //             }

    //             // ---------------- ACTIVE RIDE CHECK (ROLE BASED) ----------------
    //             if (userStatus.role != '3') {
    //                 const existingBooking = await db.bookings.findOne({
    //                     where: {
    //                         userId,
    //                         status: { [Sequelize.Op.in]: ['0', '1', '2'] },
    //                         request: '0'
    //                     }
    //                 });
    //                 if (existingBooking) {
    //                     return helper.failure(res,
    //                         languageType === 1 ? "لديك بالفعل طلب رحلة نشطة" :
    //                             languageType === 2 ? "Vous avez déjà une demande de course active" :
    //                                 "You already have an active ride request"
    //                     );
    //                 }
    //             }

    //             // ---------------- GET FREE DRIVERS ----------------
    //             const drivers = await db.users.findAll({
    //                 where: {
    //                     role: '2',
    //                     online: '1',
    //                     approve: '1'
    //                 },
    //                 attributes: ['id', 'latitude', 'longitude', 'totalAmount'],
    //                 include: [{
    //                     model: db.bookings,
    //                     as: "driverbook",
    //                     required: false,
    //                     where: {
    //                         status: { [Sequelize.Op.in]: ['0', '1', '2'] },
    //                         request: '1'
    //                     }
    //                 }]
    //             });

    //             // Filter drivers who are free (no active bookings) AND totalAmount > 5
    //             const freeDrivers = drivers.filter(d => {
    //                 const hasActiveBooking = d.driverbook && d.driverbook.length > 0;
    //                 const hasValidBalance = d.totalAmount !== null && parseFloat(d.totalAmount) > 5;
    //                 return !hasActiveBooking && hasValidBalance;
    //             });

    //             if (!freeDrivers.length) {
    //                 return helper.failure(res,
    //                     languageType === 1 ? "لا يوجد سائقون متاحون" :
    //                         languageType === 2 ? "Aucun chauffeur disponible" :
    //                             "No drivers available"
    //                 );
    //             }

    //             // ---------------- FILTER DRIVERS WITHIN 40KM RADIUS ----------------
    //             const MAX_DRIVER_DISTANCE_KM = 40; // Changed from 50km to 40km
    //             const nearbyDrivers = [];

    //             for (const driver of freeDrivers) {
    //                 if (!driver.latitude || !driver.longitude) continue;

    //                 const driverLat = parseFloat(driver.latitude);
    //                 const driverLng = parseFloat(driver.longitude);

    //                 const distance = calculateHaversineDistance(pickupLat, pickupLng, driverLat, driverLng);

    //                 if (distance <= MAX_DRIVER_DISTANCE_KM) {
    //                     nearbyDrivers.push({
    //                         id: driver.id,
    //                         distance: distance,
    //                         latitude: driver.latitude,
    //                         longitude: driver.longitude
    //                     });
    //                 }
    //             }

    //             if (!nearbyDrivers.length) {
    //                 return helper.failure(res,
    //                     languageType === 1 ? "لا يوجد سائقون متاحون ضمن نطاق ٤٠ كم" :
    //                         languageType === 2 ? "Aucun chauffeur disponible dans un rayon de 40 km" :
    //                             "No drivers available within 40km radius"
    //                 );
    //             }

    //             // Sort drivers by distance (closest first)
    //             nearbyDrivers.sort((a, b) => a.distance - b.distance);

    //             // ---------------- CREATE BOOKING ----------------
    //             const orderId = Math.floor(100000 + Math.random() * 900000).toString();

    //             // Use admin amount for price per km for both ride types
    //             const pricePerKmToStore = ADMIN_PRICE_PER_KM; // Use admin amount for both
    //             const pricePerMinToStore = rideOpen == 1 ? pricePerMinOpen : 0; // Only open rides have per minute charge

    //             const newBooking = await db.bookings.create({
    //                 userId,
    //                 orderId,
    //                 status: '0',
    //                 pickupLocation,
    //                 dropLocation: dropLocation || "",
    //                 pickupLatitude,
    //                 pickupLongitude,
    //                 dropLatitude: dropLatitude || "",
    //                 dropLongitude: dropLongitude || "",
    //                 bookingPrice,
    //                 basePrice: basePrice,
    //                 request: '0',
    //                 rideOpen,
    //                 callerPhone,
    //                 callerCountryCode,
    //                 callerName,
    //                 // Store additional info for real-time calculation
    //                 rideDistance: rideDistanceKm ? rideDistanceKm.toString() : "",
    //                 pricePerKm: pricePerKmToStore.toString(),
    //                 pricePerMin: pricePerMinToStore.toString(),
    //                 totalMinutes: totalMinutes.toString(),
    //                 totalDistance: totalDistance.toString(),
    //                 lastPriceUpdate: new Date().toISOString(),
    //                 rideStartTime: rideOpen == 1 ? new Date().toISOString() : null,
    //                 freeKm: FREE_KM.toString()
    //             });

    //             // ---------------- CREATE RIDE REQUEST (bulkCreate) ----------------
    //             const rideRequestData = nearbyDrivers.map(driver => ({
    //                 bookingId: newBooking.id,
    //                 userId,
    //                 driverId: driver.id,
    //                 status: 0,
    //                 driverDistance: driver.distance.toFixed(2)
    //             }));

    //             if (rideRequestData.length > 0) {
    //                 await db.rideRequest.bulkCreate(rideRequestData);
    //             }

    //             if (!global.onlineUsers) {
    //                 global.onlineUsers = {};
    //             }

    //             nearbyDrivers.forEach(driver => {
    //                 if (global.onlineUsers[driver.id]) {
    //                     global.onlineUsers[driver.id].forEach(sockId => {
    //                         io.to(sockId).emit("newRideRequest", {
    //                             bookingId: newBooking.id,
    //                             orderId: newBooking.orderId,
    //                             pickupLocation,
    //                             dropLocation,
    //                             pickupLatitude,
    //                             pickupLongitude,
    //                             dropLatitude,
    //                             dropLongitude,
    //                             status: '0',
    //                             request: '0',
    //                             rideOpen,
    //                             callerCountryCode,
    //                             callerPhone,
    //                             callerName,
    //                             bookingPrice,
    //                             basePrice: basePrice,
    //                             perMinPrice: pricePerMinToStore,
    //                             perKmPrice: ADMIN_PRICE_PER_KM, // Use admin amount
    //                             freeKm: FREE_KM,
    //                             rideDistance: rideDistanceKm ? rideDistanceKm.toFixed(2) : "",
    //                             driverDistance: driver.distance.toFixed(2),
    //                             message: `Distance from pickup: ${driver.distance.toFixed(2)} km`,
    //                             timestamp: new Date().toISOString()
    //                         });
    //                     });
    //                 }
    //             });

    //             // ---------------- NOTIFICATION PUSH TO NEARBY DRIVERS ----------------
    //             const notificationPromises = [];
    //             for (const driver of nearbyDrivers) {
    //                 if (!driver.id) continue;

    //                 try {
    //                     const driverToken = await db.users.findOne({
    //                         where: { id: driver.id },
    //                         attributes: ["deviceToken", "languagee_type", "firstName"],
    //                         raw: true
    //                     });

    //                     if (!driverToken) continue;

    //                     const msg = getPushMessage(
    //                         Number(driverToken.languagee_type),
    //                         `New ride request available `,
    //                         `طلب رحلة جديد متاح (على بعد `,
    //                         `Nouvelle demande de course disponible `
    //                     );

    //                     if (driverToken.deviceToken && driverToken.deviceToken.length > 10) {
    //                         helper.sendNotification_android(driverToken.deviceToken, {
    //                             message: msg,
    //                             type: 1,
    //                             senderId: userId.toString(),
    //                             bookingId: newBooking.id,
    //                             distance: driver.distance.toFixed(2)
    //                         });
    //                     }

    //                     const notificationPromise = db.notifications.create({
    //                         sender_id: userId,
    //                         receiver_id: driver.id,
    //                         message: msg,
    //                         type: 1,
    //                         status: 0,
    //                         bookingId: newBooking.id,
    //                         is_read: 0
    //                     }).then(async (notification) => {
    //                         const unreadCount = await db.notifications.count({
    //                             where: {
    //                                 receiver_id: driver.id,
    //                                 is_read: 0
    //                             }
    //                         });

    //                         if (global.onlineUsers[driver.id]) {
    //                             global.onlineUsers[driver.id].forEach(sockId => {
    //                                 io.to(sockId).emit("notification_count", {
    //                                     type: "ride_request",
    //                                     message: msg,
    //                                     bookingId: newBooking.id,
    //                                     unreadCount: unreadCount,
    //                                 });
    //                             });
    //                         }

    //                         return notification;
    //                     }).catch(error => {
    //                         console.error(`Failed to create notification for driver ${driver.id}:`, error);
    //                         return null;
    //                     });

    //                     notificationPromises.push(notificationPromise);

    //                 } catch (error) {
    //                     console.error(`Error processing driver ${driver.id}:`, error);
    //                 }
    //             }
    //             await Promise.all(notificationPromises);

    //             // ---------------- SCHEDULER FOR 3 MINUTE TIMER ----------------
    //             const bookingTimeout = setTimeout(async () => {
    //                 try {
    //                     const booking = await db.bookings.findOne({
    //                         where: { id: newBooking.id },
    //                         raw: true
    //                     });
    //                     if (
    //                         !booking ||
    //                         booking.driverId ||
    //                         booking.status !== '0'
    //                     ) {
    //                         return;
    //                     }

    //                     const acceptedRequest = await db.rideRequest.findOne({
    //                         where: {
    //                             bookingId: newBooking.id,
    //                             status: 1
    //                         }
    //                     });
    //                     if (!acceptedRequest) {

    //                         await db.bookings.update(
    //                             {
    //                                 status: '6',
    //                                 request: '2'
    //                             },
    //                             {
    //                                 where: {
    //                                     id: newBooking.id,
    //                                     driverId: null,
    //                                     status: '0'
    //                                 }
    //                             }
    //                         );

    //                         await db.rideRequest.update(
    //                             { status: 6 },
    //                             {
    //                                 where: {
    //                                     bookingId: newBooking.id,
    //                                     status: 0
    //                                 }
    //                             }
    //                         );

    //                         const userMsg = getPushMessage(
    //                             languageType,
    //                             "No driver accepted your ride request",
    //                             "لم يقبل أي سائق طلب الرحلة الخاص بك",
    //                             "Aucun chauffeur n'a accepté votre demande de course"
    //                         );

    //                         if (global.onlineUsers[userId]) {
    //                             global.onlineUsers[userId].forEach(sockId => {
    //                                 io.to(sockId).emit("rideStatusUpdate", {
    //                                     bookingId: newBooking.id,
    //                                     orderId: newBooking.orderId,
    //                                     status: '6',
    //                                     message: userMsg,
    //                                     timestamp: new Date().toISOString()
    //                                 });
    //                             });
    //                         }
    //                     }

    //                 } catch (err) {
    //                     console.error("Scheduler failed:", err);
    //                 }
    //             }, 180000);

    //             await db.bookings.update(
    //                 {
    //                     timeoutRef:
    //                         bookingTimeout[Symbol.toPrimitive]?.() ||
    //                         bookingTimeout.toString()
    //                 },
    //                 {
    //                     where: { id: newBooking.id }
    //                 }
    //             );

    //             // ---------------- RESPONSE ----------------
    //             return helper.success(res,
    //                 languageType === 1 ? "تم إرسال طلب حجز الرحلة بنجاح" :
    //                     languageType === 2 ? "Demande de réservation envoyée avec succès" :
    //                         "Ride booking request sent successfully",
    //                 {
    //                     bookingId: newBooking.id,
    //                     orderId: newBooking.orderId,
    //                     status: newBooking.status,
    //                     request: newBooking.request,
    //                     bookingPrice,
    //                     basePrice: basePrice,
    //                     rideDistanceKm: rideDistanceKm ? rideDistanceKm.toFixed(2) : "",
    //                     message: languageType === 1 ? "في انتظار قبول السائق لطلبك" :
    //                         languageType === 2 ? "En attente que le chauffeur accepte votre demande" :
    //                             "Waiting for driver to accept your request",
    //                     callerPhone,
    //                     callerName,
    //                     callerCountryCode,
    //                     nearbyDriversCount: nearbyDrivers.length,
    //                     maxDriverDistance: MAX_DRIVER_DISTANCE_KM,
    //                     maxRideDistance: 30,
    //                     notificationsSent: notificationPromises.length,
    //                     // Price details
    //                     priceDetails: {
    //                         basePrice: BASE_PRICE,
    //                         freeKm: FREE_KM,
    //                         perKmPrice: ADMIN_PRICE_PER_KM, // Use admin amount
    //                         perMinPrice: rideOpen == 1 ? pricePerMinOpen : 0,
    //                         totalDistance: rideDistanceKm ? rideDistanceKm.toFixed(2) : "0",
    //                         isOpenRide: rideOpen == 1,
    //                         initialPrice: bookingPrice,
    //                         // pricingModel: rideOpen == 0 ?
    //                         //     `First ${FREE_KM}km = ${BASE_PRICE} MRU, then ${ADMIN_PRICE_PER_KM} MRU/km` :
    //                         //     `First ${FREE_KM}km = ${BASE_PRICE} MRU, then ${ADMIN_PRICE_PER_KM} MRU/km + ${pricePerMinOpen} MRU/min (real-time)`,
    //                         // adminRate: ADMIN_PRICE_PER_KM 
    //                     },
    //                     // For open rides, return pricing info for real-time calculation
    //                     perMinPrice: rideOpen == 1 ? pricePerMinOpen : 0,
    //                     perKmPrice: ADMIN_PRICE_PER_KM, // Use admin amount
    //                     freeKm: FREE_KM,
    //                     // priceUpdateMessage: rideOpen == 1 ?
    //                     //     `Real-time pricing: First ${FREE_KM}km = ${BASE_PRICE} MRU, then +${ADMIN_PRICE_PER_KM} MRU/km + ${pricePerMinOpen} MRU/min` :
    //                     //     `Fixed price: First ${FREE_KM}km = ${BASE_PRICE} MRU, then ${ADMIN_PRICE_PER_KM} MRU/km - Total: ${bookingPrice} MRU`,
    //                     // adminRate: ADMIN_PRICE_PER_KM
    //                 }
    //             );

    //         } catch (error) {
    //             console.error('Booking error:', error);
    //             return helper.failure(res,
    //                 languageType === 1 ? "حدث خطأ أثناء حجز الرحلة." :
    //                     languageType === 2 ? "Une erreur est survenue lors de la réservation." :
    //                         "Something went wrong while booking the ride."
    //             );
    //         }
    //     };
    // },
    bookRide: (io) => {
        return async (req, res) => {
            let languageType = Number(req.headers.languagetype) || 0;

            const getPushMessage = (lang, en, ar, fr) => {
                if (lang === 1) return ar;
                if (lang === 2) return fr;
                return en;
            };

            try {
                const userId = req.user.id;

                // ---------------- USER STATUS ----------------
                const userStatus = await db.users.findOne({
                    where: { id: userId },
                    attributes: ['status', 'block', 'suspend', 'role'],
                    raw: true
                });

                if (!userStatus) {
                    return helper.failure(res,
                        languageType === 1 ? "المستخدم غير موجود." :
                            languageType === 2 ? "Utilisateur non trouvé." :
                                "User not found."
                    );
                }
                if (userStatus.status === "0") {
                    return helper.error2(res,
                        languageType === 1 ? "تم تعطيل حسابك من قبل المسؤول." :
                            languageType === 2 ? "Votre compte a été désactivé par l'administrateur." :
                                "Your account has been deactivated by admin."
                    );
                }
                if (userStatus.block === "1") {
                    return helper.error1(res,
                        languageType === 1 ? "تم حظر حسابك من قبل المسؤول." :
                            languageType === 2 ? "Votre compte a été bloqué par l'administrateur." :
                                "Your account has been blocked by admin."
                    );
                }
                if (userStatus.suspend === "1") {
                    return helper.error3(res,
                        languageType === 1 ? "تم تعليق حسابك من قبل المسؤول." :
                            languageType === 2 ? "Votre compte a été suspendu par l'administrateur." :
                                "Your account has been suspended by admin."
                    );
                }

                const {
                    pickupLocation,
                    dropLocation,
                    pickupLatitude,
                    pickupLongitude,
                    dropLatitude,
                    dropLongitude,
                    rideOpen,
                    callerPhone,
                    callerCountryCode,
                    callerName,
                } = req.body;

                // ---------------- PICKUP / DROP VALIDATION ----------------
                if (!pickupLocation || !pickupLatitude || !pickupLongitude) {
                    return helper.failure(res,
                        languageType === 1 ? "موقع الالتقاط والإحداثيات مطلوبة." :
                            languageType === 2 ? "Le lieu de prise en charge et les coordonnées sont requis." :
                                "Pickup location and coordinates are required."
                    );
                }
                if (rideOpen == 0 && (!dropLocation || !dropLatitude || !dropLongitude)) {
                    return helper.failure(res,
                        languageType === 1 ? "مواقع الالتقاط والتسليم مطلوبة." :
                            languageType === 2 ? "Les lieux de prise en charge et de dépôt sont requis." :
                                "Pickup and drop locations are required."
                    );
                }

                const pickupLat = parseFloat(pickupLatitude);
                const pickupLng = parseFloat(pickupLongitude);

                // ---------------- GOOGLE ROUTES API (NEW) ----------------
                const calculateGoogleDistance = async (originLat, originLng, destLat, destLng) => {
                    try {
                        const googleMapsKey = "AIzaSyDT712NfS8CFhtKud9s9lfxa5MLdQID91A";

                        console.log("🔍 TESTING API CONNECTION...");
                        console.log(`📍 From: ${originLat}, ${originLng} → To: ${destLat}, ${destLng}`);

                        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${googleMapsKey}`;

                        console.log("📡 Calling URL:", url);

                        const response = await axios.get(url);

                        console.log("📊 Full Response:", JSON.stringify(response.data, null, 2));

                        if (response.data.status === 'OK') {
                            if (response.data.rows[0].elements[0].status === 'OK') {
                                const distanceInMeters = response.data.rows[0].elements[0].distance.value;
                                const distanceInKm = distanceInMeters / 1000;
                                console.log(`✅ SUCCESS! Road distance: ${distanceInKm} km`);
                                return distanceInKm;
                            } else {
                                console.log("❌ Element status:", response.data.rows[0].elements[0].status);
                                return null;
                            }
                        } else {
                            console.log("❌ API Status:", response.data.status);
                            if (response.data.error_message) {
                                console.log("Error message:", response.data.error_message);
                            }
                            return null;
                        }
                    } catch (error) {
                        console.error("❌ API Call Failed:", error.message);
                        if (error.response) {
                            console.log("Error response:", error.response.data);
                        }
                        return null;
                    }
                };

                // ---------------- FALLBACK HAVERSINE FORMULA (KM) ----------------
                const toRad = v => v * Math.PI / 180;
                const calculateHaversineDistance = (a, b, c, d) => {
                    const R = 6371; // Earth's radius in KM
                    const dLat = toRad(c - a);
                    const dLon = toRad(d - b);
                    const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(dLon / 2) ** 2;
                    return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
                };

                let rideDistanceKm = "";
                let bookingPrice = "";
                let basePrice = "";
                let totalMinutes = 0;
                let totalDistance = 0;

                // ---------------- ADMIN PRICE ----------------
                const adminData = await db.users.findOne({
                    where: { role: '0' },
                    attributes: ['rideAmount', 'priceRushHour', 'status'],
                    raw: true
                });

                let ADMIN_PRICE_PER_KM = 0;

                // Normal pricing
                if (adminData && adminData.status == 0) {
                    ADMIN_PRICE_PER_KM = parseFloat(adminData.rideAmount);
                }
                // Rush hour pricing
                if (adminData && adminData.status == 1) {
                    ADMIN_PRICE_PER_KM = parseFloat(adminData.priceRushHour);
                }
                // const ADMIN_PRICE_PER_KM = parseFloat(adminData?.rideAmount) || 10;
                const BASE_PRICE = 100;
                const FREE_KM = 1;

                const pricePerKmOpen = ADMIN_PRICE_PER_KM;
                const pricePerMinOpen = 1;

                const roundToNearest5 = (num) => {
                    return Math.round(parseFloat(num) / 5) * 5;
                };

                if (rideOpen == 0) {
                    const dropLat = parseFloat(dropLatitude);
                    const dropLng = parseFloat(dropLongitude);

                    let distance = await calculateGoogleDistance(pickupLat, pickupLng, dropLat, dropLng);

                    if (distance === null || distance === undefined) {
                        console.log("Using Haversine fallback");
                        distance = calculateHaversineDistance(pickupLat, pickupLng, dropLat, dropLng);
                    }

                    rideDistanceKm = distance;
                    totalDistance = distance;

                    // ---------------- CHECK IF RIDE DISTANCE EXCEEDS 30KM ----------------
                    const MAX_RIDE_DISTANCE_KM = 30;
                    if (rideDistanceKm > MAX_RIDE_DISTANCE_KM) {
                        return helper.failure(res,
                            languageType === 1 ? `لا يمكن حجز رحلة تزيد مسافتها عن ٣٠ كم (المسافة: ${rideDistanceKm.toFixed(2)} كم)` :
                                languageType === 2 ? `Impossible de réserver une course de plus de 30 km (Distance: ${rideDistanceKm.toFixed(2)} km)` :
                                    `Cannot book ride longer than 30km (Distance: ${rideDistanceKm.toFixed(2)} km)`
                        );
                    }

                    // Calculate price: First 1km = 100 MRU,
                    let calculatedPrice;
                    if (rideDistanceKm <= FREE_KM) {
                        calculatedPrice = BASE_PRICE;
                    } else {
                        const extraKm = rideDistanceKm - FREE_KM;
                        const extraCharge = extraKm * ADMIN_PRICE_PER_KM; // Use admin amount
                        calculatedPrice = BASE_PRICE + extraCharge;
                    }

                    // APPLY ROUNDING TO NEAREST 5
                    bookingPrice = roundToNearest5(calculatedPrice).toString();
                    basePrice = bookingPrice;

                    console.log(`Regular ride (rideOpen=0) - Distance: ${rideDistanceKm} km, Price: ${bookingPrice} MRU (First ${FREE_KM}km = ${BASE_PRICE} MRU, then ${ADMIN_PRICE_PER_KM} MRU/km)`);

                } else if (rideOpen == 1) {
                    rideDistanceKm = "";
                    let calculatedPrice = BASE_PRICE;

                    bookingPrice = roundToNearest5(calculatedPrice).toString();
                    basePrice = bookingPrice;

                    console.log(`Open ride (rideOpen=1) - Base price: ${bookingPrice} MRU (First ${FREE_KM}km included), Per km after ${FREE_KM}km: ${ADMIN_PRICE_PER_KM} MRU, Per min: ${pricePerMinOpen} MRU (will be added in real-time)`);
                }

                // ---------------- ACTIVE RIDE CHECK (ROLE BASED) ----------------
                if (userStatus.role != '3') {
                    const existingBooking = await db.bookings.findOne({
                        where: {
                            userId,
                            status: { [Sequelize.Op.in]: ['0', '1', '2'] },
                            request: '0'
                        }
                    });
                    if (existingBooking) {
                        return helper.failure(res,
                            languageType === 1 ? "لديك بالفعل طلب رحلة نشطة" :
                                languageType === 2 ? "Vous avez déjà une demande de course active" :
                                    "You already have an active ride request"
                        );
                    }
                }

                // ---------------- GET FREE DRIVERS ----------------
                const drivers = await db.users.findAll({
                    where: {
                        role: '2',
                        online: '1',
                        approve: '1'
                    },
                    attributes: ['id', 'latitude', 'longitude', 'totalAmount'],
                    include: [{
                        model: db.bookings,
                        as: "driverbook",
                        required: false,
                        where: {
                            status: { [Sequelize.Op.in]: ['0', '1', '2'] },
                            request: '1'
                        }
                    }]
                });

                // Filter drivers who are free (no active bookings) AND totalAmount > 5
                const freeDrivers = drivers.filter(d => {
                    const hasActiveBooking = d.driverbook && d.driverbook.length > 0;
                    const hasValidBalance = d.totalAmount !== null && parseFloat(d.totalAmount) > 5;
                    return !hasActiveBooking && hasValidBalance;
                });

                if (!freeDrivers.length) {
                    return helper.failure(res,
                        languageType === 1 ? "لا يوجد سائقون متاحون" :
                            languageType === 2 ? "Aucun chauffeur disponible" :
                                "No drivers available"
                    );
                }

                // ---------------- FILTER DRIVERS WITHIN 40KM RADIUS ----------------
                const MAX_DRIVER_DISTANCE_KM = 40; // Changed from 50km to 40km
                const nearbyDrivers = [];

                for (const driver of freeDrivers) {
                    if (!driver.latitude || !driver.longitude) continue;

                    const driverLat = parseFloat(driver.latitude);
                    const driverLng = parseFloat(driver.longitude);

                    const distance = calculateHaversineDistance(pickupLat, pickupLng, driverLat, driverLng);

                    if (distance <= MAX_DRIVER_DISTANCE_KM) {
                        nearbyDrivers.push({
                            id: driver.id,
                            distance: distance,
                            latitude: driver.latitude,
                            longitude: driver.longitude
                        });
                    }
                }

                if (!nearbyDrivers.length) {
                    return helper.failure(res,
                        languageType === 1 ? "لا يوجد سائقون متاحون ضمن نطاق ٤٠ كم" :
                            languageType === 2 ? "Aucun chauffeur disponible dans un rayon de 40 km" :
                                "No drivers available within 40km radius"
                    );
                }

                // Sort drivers by distance (closest first)
                nearbyDrivers.sort((a, b) => a.distance - b.distance);

                // ---------------- CREATE BOOKING ----------------
                const orderId = Math.floor(100000 + Math.random() * 900000).toString();

                // Use admin amount for price per km for both ride types
                const pricePerKmToStore = ADMIN_PRICE_PER_KM; // Use admin amount for both
                const pricePerMinToStore = rideOpen == 1 ? pricePerMinOpen : 0; // Only open rides have per minute charge

                const newBooking = await db.bookings.create({
                    userId,
                    orderId,
                    status: '0',
                    pickupLocation,
                    dropLocation: dropLocation || "",
                    pickupLatitude,
                    pickupLongitude,
                    dropLatitude: dropLatitude || "",
                    dropLongitude: dropLongitude || "",
                    bookingPrice,
                    basePrice: basePrice,
                    request: '0',
                    rideOpen,
                    callerPhone,
                    callerCountryCode,
                    callerName,
                    // Store additional info for real-time calculation
                    rideDistance: rideDistanceKm ? rideDistanceKm.toString() : "",
                    pricePerKm: pricePerKmToStore.toString(),
                    pricePerMin: pricePerMinToStore.toString(),
                    totalMinutes: totalMinutes.toString(),
                    totalDistance: totalDistance.toString(),
                    lastPriceUpdate: new Date().toISOString(),
                    rideStartTime: rideOpen == 1 ? new Date().toISOString() : null,
                    freeKm: FREE_KM.toString()
                });

                // ---------------- CREATE RIDE REQUEST (bulkCreate) ----------------
                const rideRequestData = nearbyDrivers.map(driver => ({
                    bookingId: newBooking.id,
                    userId,
                    driverId: driver.id,
                    status: 0,
                    driverDistance: driver.distance.toFixed(2)
                }));

                if (rideRequestData.length > 0) {
                    await db.rideRequest.bulkCreate(rideRequestData);
                }

                if (!global.onlineUsers) {
                    global.onlineUsers = {};
                }

                nearbyDrivers.forEach(driver => {
                    if (global.onlineUsers[driver.id]) {
                        global.onlineUsers[driver.id].forEach(sockId => {
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
                                rideOpen,
                                callerCountryCode,
                                callerPhone,
                                callerName,
                                bookingPrice,
                                basePrice: basePrice,
                                perMinPrice: pricePerMinToStore,
                                perKmPrice: ADMIN_PRICE_PER_KM, // Use admin amount
                                freeKm: FREE_KM,
                                rideDistance: rideDistanceKm ? rideDistanceKm.toFixed(2) : "",
                                driverDistance: driver.distance.toFixed(2),
                                message: `Distance from pickup: ${driver.distance.toFixed(2)} km`,
                                timestamp: new Date().toISOString()
                            });
                        });
                    }
                });

                // ---------------- NOTIFICATION PUSH TO NEARBY DRIVERS ----------------
                const notificationPromises = [];
                for (const driver of nearbyDrivers) {
                    if (!driver.id) continue;

                    try {
                        const driverToken = await db.users.findOne({
                            where: { id: driver.id },
                            attributes: ["deviceToken", "languagee_type", "firstName"],
                            raw: true
                        });

                        if (!driverToken) continue;

                        const msg = getPushMessage(
                            Number(driverToken.languagee_type),
                            `New ride request available `,
                            `طلب رحلة جديد متاح (على بعد `,
                            `Nouvelle demande de course disponible `
                        );

                        if (driverToken.deviceToken && driverToken.deviceToken.length > 10) {
                            helper.sendNotification_android(driverToken.deviceToken, {
                                message: msg,
                                type: 1,
                                senderId: userId.toString(),
                                bookingId: newBooking.id,
                                distance: driver.distance.toFixed(2)
                            });
                        }

                        const notificationPromise = db.notifications.create({
                            sender_id: userId,
                            receiver_id: driver.id,
                            message: msg,
                            type: 1,
                            status: 0,
                            bookingId: newBooking.id,
                            is_read: 0
                        }).then(async (notification) => {
                            const unreadCount = await db.notifications.count({
                                where: {
                                    receiver_id: driver.id,
                                    is_read: 0
                                }
                            });

                            if (global.onlineUsers[driver.id]) {
                                global.onlineUsers[driver.id].forEach(sockId => {
                                    io.to(sockId).emit("notification_count", {
                                        type: "ride_request",
                                        message: msg,
                                        bookingId: newBooking.id,
                                        unreadCount: unreadCount,
                                    });
                                });
                            }

                            return notification;
                        }).catch(error => {
                            console.error(`Failed to create notification for driver ${driver.id}:`, error);
                            return null;
                        });

                        notificationPromises.push(notificationPromise);

                    } catch (error) {
                        console.error(`Error processing driver ${driver.id}:`, error);
                    }
                }
                await Promise.all(notificationPromises);

                // ---------------- SCHEDULER FOR 3 MINUTE TIMER ----------------
                const bookingTimeout = setTimeout(async () => {
                    try {
                        const booking = await db.bookings.findOne({
                            where: { id: newBooking.id },
                            raw: true
                        });
                        if (
                            !booking ||
                            booking.driverId ||
                            booking.status !== '0'
                        ) {
                            return;
                        }

                        const acceptedRequest = await db.rideRequest.findOne({
                            where: {
                                bookingId: newBooking.id,
                                status: 1
                            }
                        });
                        if (!acceptedRequest) {
                            await db.bookings.update(
                                {
                                    status: '6',
                                    request: '2'
                                },
                                {
                                    where: {
                                        id: newBooking.id,
                                        driverId: null,
                                        status: '0'
                                    }
                                }
                            );

                            await db.rideRequest.update(
                                { status: 6 },
                                {
                                    where: {
                                        bookingId: newBooking.id,
                                        status: 0
                                    }
                                }
                            );

                            const userMsg = getPushMessage(
                                languageType,
                                "No driver accepted your ride request",
                                "لم يقبل أي سائق طلب الرحلة الخاص بك",
                                "Aucun chauffeur n'a accepté votre demande de course"
                            );

                            if (global.onlineUsers[userId]) {
                                global.onlineUsers[userId].forEach(sockId => {
                                    io.to(sockId).emit("rideStatusUpdate", {
                                        bookingId: newBooking.id,
                                        orderId: newBooking.orderId,
                                        status: '6',
                                        message: userMsg,
                                        timestamp: new Date().toISOString()
                                    });
                                });
                            }
                        }

                    } catch (err) {
                        console.error("Scheduler failed:", err);
                    }
                }, 60000);

                await db.bookings.update(
                    {
                        timeoutRef:
                            bookingTimeout[Symbol.toPrimitive]?.() ||
                            bookingTimeout.toString()
                    },
                    {
                        where: { id: newBooking.id }
                    }
                );

                // ---------------- RESPONSE ----------------
                return helper.success(res,
                    languageType === 1 ? "تم إرسال طلب حجز الرحلة بنجاح" :
                        languageType === 2 ? "Demande de réservation envoyée avec succès" :
                            "Ride booking request sent successfully",
                    {
                        bookingId: newBooking.id,
                        orderId: newBooking.orderId,
                        status: newBooking.status,
                        request: newBooking.request,
                        bookingPrice,
                        basePrice: basePrice,
                        rideDistanceKm: rideDistanceKm ? rideDistanceKm.toFixed(2) : "",
                        message: languageType === 1 ? "في انتظار قبول السائق لطلبك" :
                            languageType === 2 ? "En attente que le chauffeur accepte votre demande" :
                                "Waiting for driver to accept your request",
                        callerPhone,
                        callerName,
                        callerCountryCode,
                        nearbyDriversCount: nearbyDrivers.length,
                        maxDriverDistance: MAX_DRIVER_DISTANCE_KM,
                        maxRideDistance: 30,
                        notificationsSent: notificationPromises.length,
                        // Price details
                        priceDetails: {
                            basePrice: BASE_PRICE,
                            freeKm: FREE_KM,
                            perKmPrice: ADMIN_PRICE_PER_KM, // Use admin amount
                            perMinPrice: rideOpen == 1 ? pricePerMinOpen : 0,
                            totalDistance: rideDistanceKm ? rideDistanceKm.toFixed(2) : "0",
                            isOpenRide: rideOpen == 1,
                            initialPrice: bookingPrice,
                            // pricingModel: rideOpen == 0 ?
                            //     `First ${FREE_KM}km = ${BASE_PRICE} MRU, then ${ADMIN_PRICE_PER_KM} MRU/km` :
                            //     `First ${FREE_KM}km = ${BASE_PRICE} MRU, then ${ADMIN_PRICE_PER_KM} MRU/km + ${pricePerMinOpen} MRU/min (real-time)`,
                            // adminRate: ADMIN_PRICE_PER_KM 
                        },
                        // For open rides, return pricing info for real-time calculation
                        perMinPrice: rideOpen == 1 ? pricePerMinOpen : 0,
                        perKmPrice: ADMIN_PRICE_PER_KM, // Use admin amount
                        freeKm: FREE_KM,

                    }
                );

            } catch (error) {
                console.error('Booking error:', error);
                return helper.failure(res,
                    languageType === 1 ? "حدث خطأ أثناء حجز الرحلة." :
                        languageType === 2 ? "Une erreur est survenue lors de la réservation." :
                            "Something went wrong while booking the ride."
                );
            }
        };
    },


    updateDropLocationAndPrice: (io) => {
        return async (req, res) => {
            try {
                const userId = req.user.id;
                const { bookingId, dropLocation, dropLatitude, dropLongitude } = req.body;

                if (!bookingId || !dropLatitude || !dropLongitude) {
                    return helper.failure(res, 'Booking ID and drop coordinates are required.');
                }

                const booking = await db.bookings.findOne({
                    where: {
                        id: bookingId,
                        userId,
                        rideOpen: 1,
                        status: '0',
                        request: '1'
                    }
                });

                if (!booking) return helper.failure(res, 'Active open ride booking not found.');

                const startLat = booking.lastLatitude
                    ? parseFloat(booking.lastLatitude)
                    : parseFloat(booking.pickupLatitude);

                const startLng = booking.lastLongitude
                    ? parseFloat(booking.lastLongitude)
                    : parseFloat(booking.pickupLongitude);

                const dropLat = parseFloat(dropLatitude);
                const dropLng = parseFloat(dropLongitude);

                if (isNaN(startLat) || isNaN(startLng) || isNaN(dropLat) || isNaN(dropLng)) {
                    return helper.failure(res, 'Invalid coordinates.');
                }

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
                    dropLat,
                    dropLng
                );

                if (segmentDistanceKm > 30) {
                    return helper.failure(res, 'Drop location must be within 30 km of your current location');
                }

                // ---------------- ADMIN PRICE PER KM ----------------
                const adminData = await db.users.findOne({
                    where: { role: '0' },
                    attributes: ['rideAmount'],
                    raw: true
                });

                const pricePerKm = adminData?.rideAmount
                    ? parseFloat(adminData.rideAmount)
                    : 10; // safety fallback

                if (isNaN(pricePerKm) || pricePerKm <= 0) {
                    return helper.failure(res, 'Invalid ride amount set by admin');
                }

                // ---------------- ACCUMULATE DISTANCE & PRICE ----------------
                const totalDistanceKm =
                    parseFloat(booking.travelledDistance || 0) + segmentDistanceKm;

                const newBookingPrice = Math.round(
                    totalDistanceKm * pricePerKm
                ).toString();

                // ---------------- UPDATE BOOKING ----------------
                await booking.update({
                    dropLocation: dropLocation || "",
                    dropLatitude: dropLatitude.toString(),
                    dropLongitude: dropLongitude.toString(),
                    travelledDistance: totalDistanceKm.toString(),
                    bookingPrice: newBookingPrice,
                    lastLatitude: dropLat.toString(),
                    lastLongitude: dropLng.toString()
                });

                // ---------------- SOCKET UPDATE ----------------
                if (global.onlineUsers) {
                    Object.keys(onlineUsers).forEach(driverId => {
                        onlineUsers[driverId].forEach(sockId => {
                            io.to(sockId).emit("rideStatusUpdate", {
                                bookingId: booking.id,
                                dropLocation,
                                dropLatitude,
                                dropLongitude,
                                bookingPrice: newBookingPrice,
                                rideDistanceKm: totalDistanceKm.toFixed(2)
                            });
                        });
                    });
                }

                // ---------------- RESPONSE ----------------
                return helper.success(res, 'Drop location updated successfully', {
                    bookingId: booking.id,
                    dropLocation,
                    dropLatitude,
                    dropLongitude,
                    bookingPrice: newBookingPrice,
                    rideDistanceKm: totalDistanceKm.toFixed(2)
                });

            } catch (error) {
                console.error('Update drop error:', error);
                return helper.failure(res, 'Something went wrong while updating drop location.');
            }
        };
    },


    driverAccptReject: (io) => {
        return async (req, res) => {
            let languageType = Number(req.headers.languagetype);

            const getPushMessage = (lang, en, ar, fr) => {
                if (lang === 1) return ar;
                if (lang === 2) return fr;
                return en;
            };

            try {

                const driverId = req.user.id;
                const { bookingId, request } = req.body;

                if (!bookingId || !request) {
                    let msg = "Booking ID and request value are required.";
                    if (languageType == 1) msg = "مطلوب معرف الحجز وقيمة الطلب.";
                    else if (languageType == 2) msg = "ID de réservation et valeur de la demande requis.";
                    return helper.failure(res, msg);
                }

                if (!['1', '2'].includes(request)) {
                    let msg = 'Invalid request value. Must be "1" (accept) or "2" (reject).';
                    if (languageType == 1) msg = 'قيمة الطلب غير صالحة.';
                    else if (languageType == 2) msg = 'Valeur de la demande invalide.';
                    return helper.failure(res, msg);
                }

                // ===== DRIVER CHECK =====
                const driver = await db.users.findOne({
                    where: { id: driverId },
                    attributes: [
                        'approve', 'status', 'block', 'suspend',
                        'firstName', 'lastName', 'image',
                        'deviceToken', 'languagee_type', 'totalAmount'
                    ],
                    raw: true
                });
                console.log(driver, "driverdriver>>>>");


                if (driver.status === "0") {
                    let msg = "Your account has been deactivated by admin.";
                    if (languageType == 1) msg = "تم تعطيل حسابك من قبل المسؤول.";
                    else if (languageType == 2) msg = "Votre compte a été désactivé.";
                    return helper.failure(res, msg);
                }

                if (driver.block === "1") {
                    let msg = "Your account has been blocked by admin.";
                    if (languageType == 1) msg = "تم حظر حسابك.";
                    else if (languageType == 2) msg = "Votre compte a été bloqué.";
                    return helper.failure(res, msg);
                }

                if (driver.suspend === "1") {
                    let msg = "Your account has been suspended by admin.";
                    if (languageType == 1) msg = "تم تعليق حسابك.";
                    else if (languageType == 2) msg = "Votre compte a été suspendu.";
                    return helper.failure(res, msg);
                }

                if (driver.approve !== "1") {
                    let msg = "Your account is not approved by admin yet.";
                    if (languageType == 1) msg = "حسابك غير معتمد.";
                    else if (languageType == 2) msg = "Votre compte n’est pas encore approuvé.";
                    return helper.failure(res, msg);
                }

                // ===== ACTIVE RIDE CHECK =====
                const activeRide = await db.bookings.findOne({
                    where: { driverId, status: { [Sequelize.Op.in]: ['0', '1', '2'] } }
                });

                if (activeRide) {
                    let msg = "You already have an active ride.";
                    if (languageType == 1) msg = "لديك رحلة نشطة.";
                    else if (languageType == 2) msg = "Vous avez déjà une course active.";
                    return helper.failure(res, msg);
                }

                // ===== CHECK IF DRIVER ALREADY ACCEPTED THIS BOOKING =====
                const checkExistingBooking = await db.bookings.findOne({
                    where: {
                        id: bookingId,
                        driverId: driverId,
                        request: '1'
                    }
                });

                const isDriverAlreadyAccepted = checkExistingBooking ? true : false;

                // ================= ACCEPT =================
                if (request === '1') {
                    const bookingCheck = await db.bookings.findOne({
                        where: { id: bookingId }
                    });

                    if (!bookingCheck) {
                        let msg = "Booking not found";
                        return helper.failure(res, msg);
                    }

                    if (bookingCheck.driverId) {
                        let msg = "Booking already processed";
                        if (languageType == 1) msg = "تمت معالجة الحجز بالفعل";
                        else if (languageType == 2) msg = "Réservation déjà traitée";
                        return helper.failure(res, msg);
                    }

                    // ===== ADMIN COMMISSION CHECK =====
                    const adminUser = await db.users.findOne({
                        where: { role: '0' },
                        attributes: ['adminCommission'],
                        raw: true
                    });

                    // If no admin commission found, default to 0
                    const adminCommissionPercentage = adminUser ? parseFloat(adminUser.adminCommission) || 0 : 0;

                    // Calculate commission amount based on booking price
                    const bookingPrice = parseFloat(bookingCheck.bookingPrice) || 0;
                    const commissionAmount = (bookingPrice * adminCommissionPercentage) / 100;

                    const driverBalance = parseFloat(driver.totalAmount) || 0;

                    if (driverBalance < commissionAmount) {
                        const requiredAmount = (commissionAmount - driverBalance).toFixed(2);

                        let msg = `Insufficient Balance. Recharge with ${requiredAmount} MRU to continue`;
                        if (languageType == 1) msg = `رصيد غير كاف. أعد الشحن بمبلغ ${requiredAmount} MRU للمتابعة`;
                        else if (languageType == 2) msg = `Solde insuffisant. Rechargez avec ${requiredAmount} MRU pour continuer`;

                        return helper.failure(res, msg);
                    }

                    const [updated] = await db.bookings.update(
                        {
                            driverId,
                            request: '1',
                            status: '0',
                            adminCommission: commissionAmount.toString()
                        },
                        {
                            where: {
                                id: bookingId
                            }
                        }
                    );

                    if (!updated) {
                        let msg = "Booking already processed";
                        if (languageType == 1) msg = "تمت معالجة الحجز بالفعل";
                        else if (languageType == 2) msg = "Réservation déjà traitée";
                        return helper.failure(res, msg);
                    }

                    // Accept for current driver
                    await db.rideRequest.update(
                        { status: 1 },
                        { where: { bookingId, driverId } }
                    );

                    // Reject for all other drivers
                    await db.rideRequest.update(
                        { status: 2 },
                        {
                            where: {
                                bookingId,
                                driverId: { [Sequelize.Op.ne]: driverId }
                            }
                        }
                    );

                    // ===== SOCKET: Remove booking for other drivers =====
                    const otherDrivers = await db.rideRequest.findAll({
                        where: {
                            bookingId,
                            driverId: { [Sequelize.Op.ne]: driverId }
                        },
                        include: [{ model: db.users, as: 'user', attributes: ['socketId'] }]
                    });
                    console.log(otherDrivers, "otherDriversotherDriversotherDrivers>>>");


                    otherDrivers.forEach(item => {
                        if (item.user?.socketId) {
                            io.to(item.user.socketId).emit("rideStatusUpdate", {
                                success: true,
                                bookingId,
                                message: "Ride accepted by another driver",
                                status: '6'
                            });
                        }
                    });
                }

                // ================= REJECT =================
                if (request === '2') {

                    await db.rideRequest.update(
                        { status: 2 },
                        { where: { bookingId, driverId } }
                    );

                    if (isDriverAlreadyAccepted) {
                        await db.bookings.update(
                            {
                                driverId: null,
                                request: '0'
                            },
                            {
                                where: {
                                    id: bookingId,
                                    driverId: driverId
                                }
                            }
                        );
                    }
                }

                // ================= FETCH BOOKING =================
                const booking = await db.bookings.findOne({
                    where: { id: bookingId },
                    include: [{
                        model: db.users,
                        as: 'userbook',
                        attributes: ['id', 'socketId', 'deviceToken', 'languagee_type']
                    }]
                });

                const userLang = Number(booking.userbook.languagee_type) || 0;

                // ================= USER PUSH =================
                let shouldSendPush = false;
                let pushMessage = "";

                if (request === "1") {
                    shouldSendPush = true;
                    pushMessage = getPushMessage(
                        userLang,
                        "Driver has accepted your ride request",
                        "قبل السائق طلب رحلتك",
                        "Le chauffeur a accepté votre demande de course"
                    );
                }
                else if (request === "2" && isDriverAlreadyAccepted) {
                    shouldSendPush = true;
                    pushMessage = getPushMessage(
                        userLang,
                        "Driver has cancelled your ride request",
                        "ألغى السائق طلب رحلتك",
                        "Le chauffeur a annulé votre demande de course"
                    );
                }

                if (shouldSendPush && booking.userbook?.deviceToken) {

                    helper.sendNotification_android(
                        booking.userbook.deviceToken,
                        {
                            message: pushMessage,
                            type: 2,
                            senderId: driverId,
                            bookingId: booking.id,
                            sender_name: driver.firstName + " " + driver.lastName,
                            sender_image: driver.image
                        }
                    );

                    if (booking.userbook?.socketId) {
                        io.to(booking.userbook.socketId).emit("rideStatusUpdate", {
                            success: true,
                            message: pushMessage,
                            bookingId: booking.id,
                            driverId,
                            request,
                            status: '0'
                        });
                    }
                }

                let resMsgAccept = "Booking accepted successfully. Driver on the way.";
                let resMsgReject = "Booking rejected successfully";

                if (languageType == 1) {
                    resMsgAccept = "تم قبول الحجز بنجاح. السائق في الطريق.";
                    resMsgReject = "تم رفض الحجز بنجاح";
                } else if (languageType == 2) {
                    resMsgAccept = "Réservation acceptée avec succès. Le chauffeur est en route.";
                    resMsgReject = "Réservation rejetée avec succès";
                }

                return helper.success(
                    res,
                    request === '1' ? resMsgAccept : resMsgReject,
                    { bookingId, request }
                );

            } catch (error) {
                console.error(error);

                let msg = "Something went wrong while processing the booking.";
                if (languageType == 1) msg = "حدث خطأ أثناء معالجة الحجز.";
                else if (languageType == 2) msg = "Une erreur est survenue.";

                return helper.failure(res, msg);
            }
        };
    },

    requestList: (io) => {
        return async (req, res) => {
            try {
                const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default=English
                const driverId = req.user.id;

                // ===== DRIVER CHECK =====
                const driver = await db.users.findOne({
                    where: { id: driverId, role: '2' },
                    attributes: [
                        'status',
                        'block',
                        'suspend',
                        'approve',
                        'lastFreeTime',
                        'online'
                    ],
                    raw: true
                });

                if (!driver) {
                    let msg = "Driver not found.";
                    if (languageType == 1) msg = "السائق غير موجود.";
                    else if (languageType == 2) msg = "Chauffeur non trouvé.";
                    return helper.error(res, msg);
                }

                if (driver.status === "0") {
                    let msg = "Your account has been deactivated by admin.";
                    if (languageType == 1) msg = "تم تعطيل حسابك من قبل المسؤول.";
                    else if (languageType == 2) msg = "Votre compte a été désactivé par l’administrateur.";
                    return helper.error2(res, msg);
                }

                if (driver.block === "1") {
                    let msg = "Your account has been blocked by admin.";
                    if (languageType == 1) msg = "تم حظر حسابك من قبل المسؤول.";
                    else if (languageType == 2) msg = "Votre compte a été bloqué par l’administrateur.";
                    return helper.error1(res, msg);
                }

                if (driver.suspend === "1") {
                    let msg = "Your account has been suspended by admin.";
                    if (languageType == 1) msg = "تم تعليق حسابك من قبل المسؤول.";
                    else if (languageType == 2) msg = "Votre compte a été suspendu par l’administrateur.";
                    return helper.error3(res, msg);
                }

                if (driver.approve !== "1") {
                    let msg = "Your account is not approved by admin yet.";
                    if (languageType == 1) msg = "لم يتم اعتماد حسابك من قبل المسؤول بعد.";
                    else if (languageType == 2) msg = "Votre compte n’a pas encore été approuvé par l’administrateur.";
                    return helper.success(res, msg, { totalRequests: 0, requests: [] });
                }

                // ===== ONLINE CHECK (ONLY ADDITION) =====
                if (driver.online !== "1") {
                    let msg = "You are offline.";
                    if (languageType == 1) msg = "أنت غير متصل.";
                    else if (languageType == 2) msg = "Vous êtes hors ligne.";
                    return helper.success(res, msg, { totalRequests: 0, requests: [] });
                }

                // ===== CLEAN EXPIRED BOOKINGS =====
                const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

                const expiredBookings = await db.bookings.findAll({
                    where: {
                        driverId: null,
                        status: '0',
                        request: '0',
                        rejectCount: '0',
                        bookingDate: { [Sequelize.Op.lt]: oneMinuteAgo }
                    },
                    attributes: ['id', 'userId'],
                    raw: true
                });

                // await db.bookings.destroy({
                //     where: {
                //         driverId: null,
                //         status: '0',
                //         request: '0',
                //         rejectCount: '0',
                //         bookingDate: { [Sequelize.Op.lt]: oneMinuteAgo }
                //     },
                //     force: true
                // });
                await db.bookings.update(
                    { status: '6', request: '2' }, // mark as cancelled due to timeout
                    {
                        where: {
                            driverId: null,
                            status: '0',
                            request: '0',
                            rejectCount: '0',
                            bookingDate: { [Sequelize.Op.lt]: oneMinuteAgo }
                        },
                        force: true
                    }
                );

                // SOCKET EMIT FOR USER SIDE
                if (expiredBookings.length > 0) {
                    expiredBookings.forEach(b => {
                        io.emit("rideStatusUpdate", {
                            bookingId: b.id,
                            status: "6",
                            message: "Ride request expired"
                        });
                    });
                }

                // await db.bookings.update(
                //     { status: '6', request: '2' }, // mark as cancelled due to timeout
                //     {
                //         where: {
                //             driverId: null,
                //             status: '0',
                //             request: '0',
                //             rejectCount: '0',
                //             bookingDate: { [Sequelize.Op.lt]: oneMinuteAgo }
                //         },
                //         force: true
                //     }
                // );

                // ===== ACTIVE RIDE CHECK =====
                const activeRide = await db.bookings.findOne({
                    where: { driverId, status: { [Sequelize.Op.in]: ['0', '1', '2'] } }
                });

                if (activeRide) {
                    let msg = "You are currently on a ride";
                    if (languageType == 1) msg = "أنت حاليًا في رحلة";
                    else if (languageType == 2) msg = "Vous êtes actuellement en course";
                    return helper.success(res, msg, { totalRequests: 0, requests: [] });
                }

                // ===== GET DRIVER LAST FREE TIME =====
                let lastFreeTime = driver.lastFreeTime
                    ? new Date(driver.lastFreeTime)
                    : new Date(Date.now() - 60 * 1000);

                // ===== REJECTED REQUESTS FILTER =====
                const rejectedRequests = await db.rideRequest.findAll({
                    where: { driverId, status: 2 },
                    attributes: ['bookingId'],
                    raw: true
                });

                const rejectedBookingIds = rejectedRequests.map(r => r.bookingId);

                // ===== FETCH REQUESTS =====
                const requests = await db.bookings.findAll({
                    where: {
                        status: "0"
                    },
                    include: [
                        {
                            model: db.rideRequest,
                            as: "rideRequests",
                            required: true,
                            where: {
                                driverId: driverId,
                                status: 0
                            }
                        },
                        {
                            model: db.users,
                            as: "userbook"
                        }
                    ],
                    order: [['id', 'DESC']]
                });

                // ===== DISTANCE LOGIC (UNCHANGED) =====
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

                let successMsg = "Pending ride requests fetched successfully";
                if (languageType == 1) successMsg = "تم جلب طلبات الرحلات المعلقة بنجاح";
                else if (languageType == 2) successMsg = "Demandes de course en attente récupérées avec succès";

                return helper.success(res, successMsg, {
                    totalRequests: requests.length,
                    requests: requests.map(booking => {
                        let rideDistanceKm = "";

                        if (
                            booking.pickupLatitude &&
                            booking.pickupLongitude &&
                            booking.dropLatitude &&
                            booking.dropLongitude
                        ) {
                            const pickupLat = parseFloat(booking.pickupLatitude);
                            const pickupLng = parseFloat(booking.pickupLongitude);
                            const dropLat = parseFloat(booking.dropLatitude);
                            const dropLng = parseFloat(booking.dropLongitude);

                            if (
                                !isNaN(pickupLat) &&
                                !isNaN(pickupLng) &&
                                !isNaN(dropLat) &&
                                !isNaN(dropLng)
                            ) {
                                rideDistanceKm = calculateDistance(
                                    pickupLat,
                                    pickupLng,
                                    dropLat,
                                    dropLng
                                ).toFixed(2);
                            }
                        }

                        return {
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
                            bookingPrice: booking.bookingPrice,
                            orderId: booking.orderId,
                            rideOpen: booking.rideOpen,
                            rideDistanceKm
                        };
                    })
                });

            } catch (error) {
                console.log("requestList error:", error);
                let msg = "Something went wrong while fetching requests.";
                if (languageType == 1) msg = "حدث خطأ أثناء جلب الطلبات.";
                else if (languageType == 2) msg = "Une erreur est survenue lors de la récupération des demandes.";
                return helper.error(res, msg);
            }
        };
    },

    updatedPickupLocation: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default=English
            const userId = req.user.id;
            const { bookingId, pickupLocation, pickupLatitude, pickupLongitude } = req.body;

            // Optional: validate required fields
            // if (!bookingId || !pickupLocation || !pickupLatitude || !pickupLongitude) {
            //     let msg = "Booking ID, pickup location, and coordinates are required.";
            //     if (languageType == 1) msg = "معرف الحجز وموقع الالتقاط والإحداثيات مطلوبة.";
            //     else if (languageType == 2) msg = "ID de réservation, lieu de prise en charge et coordonnées requis.";
            //     return helper.failure(res, msg);
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
                let msg = "Booking not found or cannot be updated";
                if (languageType == 1) msg = "الحجز غير موجود أو لا يمكن تحديثه";
                else if (languageType == 2) msg = "Réservation introuvable ou ne peut pas être mise à jour";
                return helper.failure(res, msg, 404);
            }

            await booking.update({
                pickupLocation: pickupLocation,
                pickupLatitude: pickupLatitude.toString(),
                pickupLongitude: pickupLongitude.toString()
            });

            let successMsg = "Pickup location updated successfully";
            if (languageType == 1) successMsg = "تم تحديث موقع الالتقاط بنجاح";
            else if (languageType == 2) successMsg = "Lieu de prise en charge mis à jour avec succès";

            return helper.success(res, successMsg, {
                bookingId: booking.id,
                pickupLocation: booking.pickupLocation,
                pickupLatitude: booking.pickupLatitude,
                pickupLongitude: booking.pickupLongitude
            });

        } catch (error) {
            let errMsg = "Something went wrong while updating pickup location.";
            if (languageType == 1) errMsg = "حدث خطأ أثناء تحديث موقع الالتقاط.";
            else if (languageType == 2) errMsg = "Une erreur est survenue lors de la mise à jour du lieu de prise en charge.";
            return helper.failure(res, errMsg);
        }
    },

    bookingHistory: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default=English
            const userId = req.user.id;

            const userStatus = await db.users.findOne({
                where: { id: userId },
                attributes: ['status', 'block', 'suspend'],
                raw: true
            });

            if (!userStatus) {
                let msg = "User not found.";
                if (languageType == 1) msg = "المستخدم غير موجود.";
                else if (languageType == 2) msg = "Utilisateur non trouvé.";
                return helper.failure(res, msg);
            }
            if (userStatus.status === "0") {
                let msg = "Your account has been deactivated by admin.";
                if (languageType == 1) msg = "تم تعطيل حسابك من قبل المسؤول.";
                else if (languageType == 2) msg = "Votre compte a été désactivé par l'administrateur.";
                return helper.error2(res, msg);
            }
            if (userStatus.block === "1") {
                let msg = "Your account has been blocked by admin.";
                if (languageType == 1) msg = "تم حظر حسابك من قبل المسؤول.";
                else if (languageType == 2) msg = "Votre compte a été bloqué par l'administrateur.";
                return helper.error1(res, msg);
            }
            if (userStatus.suspend === "1") {
                let msg = "Your account has been suspended by admin.";
                if (languageType == 1) msg = "تم تعليق حسابك من قبل المسؤول.";
                else if (languageType == 2) msg = "Votre compte a été suspendu par l'administrateur.";
                return helper.error3(res, msg);
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

            let successMsg = "Booking history fetched successfully";
            if (languageType == 1) successMsg = "تم جلب سجل الحجز بنجاح";
            else if (languageType == 2) successMsg = "Historique des réservations récupéré avec succès";

            return helper.success(res, successMsg, {
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
            let errMsg = "Something went wrong while fetching booking history.";
            if (languageType == 1) errMsg = "حدث خطأ أثناء جلب سجل الحجز.";
            else if (languageType == 2) errMsg = "Une erreur est survenue lors de la récupération de l'historique des réservations.";
            return helper.failure(res, errMsg);
        }
    },

    bookingDetail: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default=English
            const userId = req.user.id;
            const { id } = req.params;

            const userStatus = await db.users.findOne({
                where: { id: userId },
                attributes: ['status', 'block', 'suspend'],
                raw: true
            });

            if (!userStatus) {
                let msg = "User not found.";
                if (languageType == 1) msg = "المستخدم غير موجود.";
                else if (languageType == 2) msg = "Utilisateur non trouvé.";
                return helper.failure(res, msg);
            }
            if (userStatus.status === "0") {
                let msg = "Your account has been deactivated by admin.";
                if (languageType == 1) msg = "تم تعطيل حسابك من قبل المسؤول.";
                else if (languageType == 2) msg = "Votre compte a été désactivé par l'administrateur.";
                return helper.error2(res, msg);
            }
            if (userStatus.block === "1") {
                let msg = "Your account has been blocked by admin.";
                if (languageType == 1) msg = "تم حظر حسابك من قبل المسؤول.";
                else if (languageType == 2) msg = "Votre compte a été bloqué par l'administrateur.";
                return helper.error1(res, msg);
            }
            if (userStatus.suspend === "1") {
                let msg = "Your account has been suspended by admin.";
                if (languageType == 1) msg = "تم تعليق حسابك من قبل المسؤول.";
                else if (languageType == 2) msg = "Votre compte a été suspendu par l'administrateur.";
                return helper.error3(res, msg);
            }

            if (!id) {
                let msg = "Booking ID is required.";
                if (languageType == 1) msg = "رقم تعريف الحجز مطلوب.";
                else if (languageType == 2) msg = "L'ID de réservation est requis.";
                return helper.failure(res, msg);
            }

            const booking = await db.bookings.findOne({
                where: { id: id },
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
                let msg = "Booking not found.";
                if (languageType == 1) msg = "الحجز غير موجود.";
                else if (languageType == 2) msg = "Réservation non trouvée.";
                return helper.failure(res, msg);
            }

            /* ================= DISTANCE CALCULATION (NEW ONLY) ================= */

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

            let rideDistanceKm = "";

            if (
                booking.pickupLatitude &&
                booking.pickupLongitude &&
                booking.dropLatitude &&
                booking.dropLongitude
            ) {
                const pickupLat = parseFloat(booking.pickupLatitude);
                const pickupLng = parseFloat(booking.pickupLongitude);
                const dropLat = parseFloat(booking.dropLatitude);
                const dropLng = parseFloat(booking.dropLongitude);

                if (
                    !isNaN(pickupLat) &&
                    !isNaN(pickupLng) &&
                    !isNaN(dropLat) &&
                    !isNaN(dropLng)
                ) {
                    rideDistanceKm = calculateDistance(
                        pickupLat,
                        pickupLng,
                        dropLat,
                        dropLng
                    ).toFixed(2);
                }
            }

            /* ================= END DISTANCE ================= */

            let successMsg = "Booking details fetched successfully";
            if (languageType == 1) successMsg = "تم جلب تفاصيل الحجز بنجاح";
            else if (languageType == 2) successMsg = "Détails de la réservation récupérés avec succès";

            return helper.success(res, successMsg, {
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
                rideDistanceKm
            });

        } catch (error) {
            console.error('Ride details error:', error);
            let errMsg = "Something went wrong while fetching ride details.";
            if (languageType == 1) errMsg = "حدث خطأ أثناء جلب تفاصيل الحجز.";
            else if (languageType == 2) errMsg = "Une erreur est survenue lors de la récupération des détails de la réservation.";
            return helper.failure(res, errMsg);
        }
    },

    cancelRide: (io) => {
        return async (req, res) => {

            const getPushMessage = (lang, en, ar, fr) => {
                if (lang === 1) return ar;
                if (lang === 2) return fr;
                return en;
            };

            try {
                const languageType = Number(req.headers.languagetype) || 0;
                const loggedInUserId = req.user.id;
                const loggedInUserRole = req.user.role; // "1"=user, "2"=driver, "3"=user-like
                const { bookingId } = req.body;

                // ================= VALIDATION =================
                if (!bookingId) {
                    let msg = "Booking ID is required.";
                    if (languageType === 1) msg = "رقم تعريف الحجز مطلوب.";
                    else if (languageType === 2) msg = "L'ID de réservation est requis.";
                    return helper.failure(res, msg);
                }

                const whereCond = {
                    id: bookingId,
                    status: { [Op.in]: ["0", "1", "2"] }
                };

                if (loggedInUserRole === "1" || loggedInUserRole === "3") whereCond.userId = loggedInUserId;
                else if (loggedInUserRole === "2") whereCond.driverId = loggedInUserId;
                else return helper.failure(res, "Unauthorized role");

                const booking = await db.bookings.findOne({ where: whereCond });
                if (!booking) {
                    return helper.failure(res, "booking not found.");
                }

                const newStatus = loggedInUserRole === "1" || loggedInUserRole === "3" ? "5" : "4";

                // ================= UPDATE BOOKING =================
                await booking.update({
                    status: newStatus,
                });
                await db.rideRequest.update(
                    { status: 6 },
                    { where: { bookingId: booking.id } }
                );
                io.emit("rideStatusUpdate", {
                    bookingId: booking.id,
                    status: newStatus,
                    cancelledBy: loggedInUserRole === "1" || loggedInUserRole === "3" ? "user" : "driver"
                });
                // ================= SELF NOTIFICATION =================
                await db.notifications.create({
                    userId: loggedInUserId,
                    bookingId: booking.id,
                    type: 3,
                    message:
                        loggedInUserRole === "1" || loggedInUserRole === "3"
                            ? "You have cancelled the ride"
                            : "Ride cancelled by driver",
                    status: 0
                });
                // ================= USER CANCEL ======================

                if (loggedInUserRole === "1" || loggedInUserRole === "3") {

                    const acceptedRideRequest = await db.rideRequest.findOne({
                        where: {
                            bookingId: booking.id,
                            status: 1
                        }
                    });

                    if (booking.request === "1" && acceptedRideRequest) {

                        const driver = await db.users.findOne({
                            where: { id: acceptedRideRequest.driverId, approve: "1" },
                            attributes: ["deviceToken", "languagee_type"],
                            raw: true
                        });

                        if (driver?.deviceToken) {
                            const pushMsg = getPushMessage(
                                Number(driver.languagee_type),
                                "Ride request cancelled by user",
                                "تم إلغاء طلب الرحلة بواسطة المستخدم",
                                "Demande de course annulée par l'utilisateur"
                            );

                            helper.sendNotification_android(driver.deviceToken, {
                                senderId: loggedInUserId,
                                targetRole: 2,
                                notificationId: 0,
                                bookingId: booking.id,
                                sound: "user_app.caf",
                                type: 3,
                                titleData: "Notification",
                                message: pushMsg
                            });
                        }
                    }
                }


                // ================= DRIVER CANCEL ====================

                if (loggedInUserRole === "2") {

                    const user = await db.users.findOne({
                        where: { id: booking.userId, approve: "1" },
                        attributes: ["deviceToken", "languagee_type"],
                        raw: true
                    });

                    if (user?.deviceToken) {
                        const pushMsg = getPushMessage(
                            Number(user.languagee_type),
                            "Ride cancelled by driver",
                            "تم إلغاء الرحلة بواسطة السائق",
                            "Course annulée par le conducteur"
                        );

                        helper.sendNotification_android(user.deviceToken, {
                            senderId: loggedInUserId,
                            targetRole: 1,
                            notificationId: 0,
                            bookingId: booking.id,
                            sound: "driver_app.caf",
                            type: 4,
                            titleData: "Notification",
                            message: pushMsg
                        });
                    }
                }

                // ================= RESPONSE (UNCHANGED) =================
                return helper.success(res, "Ride cancelled successfully.", {
                    bookingId: booking.id,
                    cancelledBy: loggedInUserRole === "1" || loggedInUserRole === "3" ? "user" : "driver",
                    status: newStatus
                });

            } catch (error) {
                console.error(error);
                return helper.failure(res, "Something went wrong.");
            }
        };
    },


    report: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default=English

            const v = new Validator(req.body, {
                reportTo: "required",
            });
            const errorResponse = await helper.checkValidation(v);
            if (errorResponse) {
                let msgValidation = errorResponse;
                if (languageType == 1) msgValidation = "حقل 'reportTo' مطلوب.";
                else if (languageType == 2) msgValidation = "Le champ 'reportTo' est requis.";
                return helper.error(res, msgValidation);
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

            let msgAlreadyReported = "You have already reported this user.";
            if (languageType == 1) msgAlreadyReported = "لقد قمت بالإبلاغ عن هذا المستخدم بالفعل.";
            else if (languageType == 2) msgAlreadyReported = "Vous avez déjà signalé cet utilisateur.";

            if (existingReport) {
                return helper.failure(res, msgAlreadyReported);
            }

            // Create a new report
            const newReport = await db.reports.create({
                ...req.body,
            });

            let msgSuccess = "Report added successfully";
            if (languageType == 1) msgSuccess = "تم إضافة البلاغ بنجاح";
            else if (languageType == 2) msgSuccess = "Signalement ajouté avec succès";

            return helper.success(res, msgSuccess, newReport);

        } catch (error) {
            console.error("Error:", error);

            let msgError = "Something went wrong.";
            if (languageType == 1) msgError = "حدث خطأ ما.";
            else if (languageType == 2) msgError = "Une erreur est survenue.";

            return helper.error(res, msgError, error);
        }
    },

    blockUser: (io) => {
        return async (req, res) => {
            try {
                const languageType = Number(req.headers.languagetype); // 1=Arabic, 2=French, default=English

                const v = new Validator(req.body, {
                    userId: "required",
                    block: "required|in:0,1"
                });

                const errorResponse = await helper.checkValidation(v);
                if (errorResponse) {
                    let msgValidation = errorResponse;
                    if (languageType == 1) msgValidation = "حقل 'userId' و 'block' مطلوبان وصحيحة.";
                    else if (languageType == 2) msgValidation = "Les champs 'userId' et 'block' sont requis et valides.";
                    return helper.failure(res, msgValidation);
                }

                const blockBy = req.user.id;
                const blockTo = req.body.userId;

                let msgSelfBlock = "You cannot block yourself.";
                if (languageType == 1) msgSelfBlock = "لا يمكنك حظر نفسك.";
                else if (languageType == 2) msgSelfBlock = "Vous ne pouvez pas vous bloquer vous-même.";

                if (blockBy == blockTo) {
                    return helper.failure(res, msgSelfBlock);
                }

                await db.users.update(
                    { block: req.body.block },
                    { where: { id: blockTo } }
                );

                let message =
                    req.body.block === "1"
                        ? "User blocked successfully"
                        : "User unblocked successfully";

                if (languageType == 1) message = req.body.block === "1" ? "تم حظر المستخدم بنجاح" : "تم إلغاء حظر المستخدم بنجاح";
                else if (languageType == 2) message = req.body.block === "1" ? "Utilisateur bloqué avec succès" : "Utilisateur débloqué avec succès";

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

                let msgError = "Something went wrong.";
                if (languageType == 1) msgError = "حدث خطأ ما.";
                else if (languageType == 2) msgError = "Une erreur est survenue.";

                return helper.failure(res, msgError);
            }
        };
    },

    driverWaletRecharge: async (req, res) => {
        try {
            const languageType = Number(req.headers.languagetype) || 0;
            const amount = Number(req.body.amount);

            if (!amount || amount <= 0) {
                return helper.failure(res, "Invalid amount");
            }

            const data = await db.transferscreenshot.create({
                driverId: req.user.id,
                amount: amount,
            });

            const driver = await db.users.findOne({
                where: { id: req.user.id }
            });

            if (!driver) {
                return helper.failure(res, "Driver not found");
            }

            const newTotal = Number(driver.totalAmount || 0) + amount;

            await db.users.update(
                { totalAmount: newTotal },
                { where: { id: req.user.id } }
            );

            let successMessage = "Driver Wallet Recharge created successfully";
            if (languageType === 1) successMessage = "تم إنشاء إعادة شحن محفظة السائق بنجاح";
            else if (languageType === 2) successMessage = "Recharge du portefeuille du conducteur créée avec succès";

            return helper.success(res, successMessage, {
                recharge: data,
                totalAmount: newTotal
            });

        } catch (error) {
            console.error(error);

            let errorMessage = "Something went wrong";
            if (languageType === 1) errorMessage = "حدث خطأ ما";
            else if (languageType === 2) errorMessage = "Une erreur est survenue";

            return helper.failure(res, errorMessage);
        }
    },

    Notificationlist: async (req, res) => {
        try {
            const notifications = await db.notifications.findAll({


                attributes: {
                    include: [
                        [
                            db.sequelize.literal(
                                `(SELECT firstName FROM users WHERE users.id = notifications.sender_id)`
                            ),
                            'senderName'
                        ],
                        [
                            db.sequelize.literal(
                                `(SELECT image FROM users WHERE users.id = notifications.sender_id)`
                            ),
                            'senderImage'
                        ]
                    ],

                },
                where: {
                    receiver_id: req.user.id,
                },
                order: [['id', 'DESC']]
            });
            return helper.success(res, "Get All Notifications Successfully", notifications);
        } catch (error) {
            console.error("Error fetching notifications:", error);

        }

    },

    notificationClear: async (req, res) => {
        try {
            const userId = req.user.id;

            const deletedCount = await db.notifications.destroy({
                where: {
                    receiver_id: userId
                }
            });
            return helper.success(
                res,
                "Notifications cleared successfully",
                { deletedCount }
            );

        } catch (error) {
            console.log("notificationClear error:", error);
            return helper.failed(res, "Something went wrong");
        }
    },


    languageTypeChange: async (req, res) => {
        try {
            const userId = req.user.id;
            const { languagee_type } = req.body;  // 0 = English, 1 = Arabic, 2 = French
            if (languagee_type === undefined) {
                return helper.error(res, "languagee_type is required");
            }

            await db.users.update(
                { languagee_type },
                { where: { id: userId } }
            );

            const data = await db.users.findOne({
                where: { id: userId }
            });

            return helper.success(res, "Language change successfully", data
            );
        } catch (error) {
            console.log("languageTypeChange error =>", error);
            return helper.error(res, "Something went wrong");
        }
    },

    driverWaletBalance: async (req, res) => {
        try {
            const userId = req.user.id;
            const driver = await db.users.findOne({
                where: {
                    id: userId,
                    role: "2"
                },
                attributes: ['id', 'firstName', 'lastName', 'totalAmount']
            });
            if (!driver) {
                return helper.failure(res, "Driver not found");
            }
            return helper.success(
                res, "Driver wallet balance",
                {
                    driverId: driver.id,
                    firstName: driver.firstName,
                    lastName: driver.lastName,
                    walletBalance: parseFloat(driver.totalAmount)
                }
            );
        } catch (error) {
            console.log(error, "error");
            return helper.failure(res, "Something went wrong");
        }
    }



}