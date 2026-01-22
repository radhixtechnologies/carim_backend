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

                // ---------------- USER STATUS CHECK ----------------
                const userStatus = await db.users.findOne({
                    where: { id: userId },
                    attributes: ['status', 'block', 'suspend'],
                    raw: true
                });

                if (!userStatus) {
                    let msg = languageType === 1 ? "المستخدم غير موجود." : languageType === 2 ? "Utilisateur non trouvé." : "User not found.";
                    return helper.failure(res, msg);
                }
                if (userStatus.status === "0") {
                    let msg = languageType === 1 ? "تم تعطيل حسابك من قبل المسؤول." : languageType === 2 ? "Votre compte a été désactivé par l’administrateur." : "Your account has been deactivated by admin.";
                    return helper.error2(res, msg);
                }
                if (userStatus.block === "1") {
                    let msg = languageType === 1 ? "تم حظر حسابك من قبل المسؤول." : languageType === 2 ? "Votre compte a été bloqué par l’administrateur." : "Your account has been blocked by admin.";
                    return helper.error1(res, msg);
                }
                if (userStatus.suspend === "1") {
                    let msg = languageType === 1 ? "تم تعليق حسابك من قبل المسؤول." : languageType === 2 ? "Votre compte a été suspendu par l’administrateur." : "Your account has been suspended by admin.";
                    return helper.error3(res, msg);
                }

                const {
                    pickupLocation,
                    dropLocation,
                    pickupLatitude,
                    pickupLongitude,
                    dropLatitude,
                    dropLongitude,
                    rideOpen
                } = req.body;

                // ---------------- PICKUP REQUIRED ----------------
                if (!pickupLocation || !pickupLatitude || !pickupLongitude) {
                    let msg = languageType === 1 ? "موقع الالتقاط والإحداثيات مطلوبة." : languageType === 2 ? "Le lieu de prise en charge et les coordonnées sont requis." : "Pickup location and coordinates are required.";
                    return helper.failure(res, msg);
                }

                if (rideOpen == 0) {
                    if (!dropLocation || !dropLatitude || !dropLongitude) {
                        let msg = languageType === 1 ? "مواقع الالتقاط والتسليم مطلوبة." : languageType === 2 ? "Les lieux de prise en charge et de dépôt sont requis." : "Pickup and drop locations are required.";
                        return helper.failure(res, msg);
                    }
                }

                const pickupLat = parseFloat(pickupLatitude);
                const pickupLng = parseFloat(pickupLongitude);
                if (isNaN(pickupLat) || isNaN(pickupLng)) {
                    let msg = languageType === 1 ? "إحداثيات الالتقاط غير صالحة." : languageType === 2 ? "Coordonnées de prise en charge non valides." : "Invalid pickup coordinates.";
                    return helper.failure(res, msg);
                }

                // ---------------- DISTANCE CALCULATION ----------------
                const toRad = v => v * Math.PI / 180;
                const calculateDistance = (a, b, c, d) => {
                    const R = 6371;
                    const dLat = toRad(c - a);
                    const dLon = toRad(d - b);
                    const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(dLon / 2) ** 2;
                    return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
                };

                let rideDistanceKm = null;
                let bookingPrice = "";

                // ---------------- ADMIN PRICE ----------------
                const adminData = await db.users.findOne({
                    where: { role: '0' },
                    attributes: ['rideAmount'],
                    raw: true
                });

                const pricePerKm = adminData?.rideAmount ? parseFloat(adminData.rideAmount) : 10;
                if (isNaN(pricePerKm) || pricePerKm <= 0) {
                    let msg = languageType === 1 ? "المبلغ المحدد للرحلة من قبل المسؤول غير صالح" : languageType === 2 ? "Le montant du trajet défini par l’administrateur est invalide" : "Invalid ride amount set by admin";
                    return helper.failure(res, msg);
                }

                if (rideOpen == 0 || (rideOpen == 1 && dropLatitude && dropLongitude)) {
                    const dropLat = parseFloat(dropLatitude);
                    const dropLng = parseFloat(dropLongitude);
                    if (isNaN(dropLat) || isNaN(dropLng)) {
                        let msg = languageType === 1 ? "إحداثيات الوجهة غير صالحة." : languageType === 2 ? "Coordonnées de dépôt non valides." : "Invalid drop coordinates.";
                        return helper.failure(res, msg);
                    }

                    rideDistanceKm = calculateDistance(pickupLat, pickupLng, dropLat, dropLng);
                    if (rideDistanceKm > 30) {
                        let msg = languageType === 1 ? "يجب أن تكون وجهة التسليم ضمن 30 كم" : languageType === 2 ? "Le lieu de dépôt doit être dans un rayon de 30 km" : "Drop location must be within 30 km";
                        return helper.failure(res, msg);
                    }

                    bookingPrice = Math.round(rideDistanceKm * pricePerKm).toString();
                }

                // ---------------- ACTIVE RIDE CHECK ----------------
                const existingBooking = await db.bookings.findOne({
                    where: {
                        userId,
                        status: { [Sequelize.Op.in]: ['0', '1', '2'] },
                        request: '0'
                    }
                });

                if (existingBooking) {
                    let msg = languageType === 1 ? "لديك بالفعل طلب رحلة نشطة" : languageType === 2 ? "Vous avez déjà une demande de course active" : "You already have an active ride request";
                    return helper.failure(res, msg);
                }

                // ---------------- GET DRIVERS (BUSY FILTERED) ----------------
                const drivers = await db.users.findAll({
                    where: { role: '2', online: '1', approve: '1' },
                    attributes: ['id', 'latitude', 'longitude'],
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

                const freeDrivers = drivers.filter(d => !d.driverbook || d.driverbook.length === 0);

                // ---------------- CHECK DRIVER AVAILABILITY ----------------
                let driverAvailable = false;
                for (const driver of freeDrivers) {
                    if (!driver.latitude || !driver.longitude) continue;
                    const driverDistance = calculateDistance(pickupLat, pickupLng, parseFloat(driver.latitude), parseFloat(driver.longitude));
                    if (driverDistance <= 30) {
                        driverAvailable = true;
                        break;
                    }
                }

                if (!driverAvailable) {
                    let msg = languageType === 1 ? "لا يوجد سائقون متاحون ضمن 30 كم" : languageType === 2 ? "Aucun chauffeur disponible dans un rayon de 30 km" : "No drivers available within 30 km";
                    return helper.failure(res, msg);
                }

                // ---------------- CREATE BOOKING ----------------
                const orderId = Math.floor(100000 + Math.random() * 900000).toString();
                const isOpenRideWithoutDrop = rideOpen == 1 && (!dropLatitude || !dropLongitude);
                const finalDropLocation = isOpenRideWithoutDrop ? "" : dropLocation;
                const finalDropLatitude = isOpenRideWithoutDrop ? "" : dropLatitude?.toString();
                const finalDropLongitude = isOpenRideWithoutDrop ? "" : dropLongitude?.toString();
                const finalBookingPrice = isOpenRideWithoutDrop ? "" : bookingPrice;

                const newBooking = await db.bookings.create({
                    userId,
                    driverId: null,
                    orderId,
                    status: '0',
                    pickupLocation,
                    dropLocation: finalDropLocation,
                    pickupLatitude: pickupLatitude.toString(),
                    pickupLongitude: pickupLongitude.toString(),
                    dropLatitude: finalDropLatitude,
                    dropLongitude: finalDropLongitude,
                    bookingPrice: finalBookingPrice,
                    request: '0',
                    rideOpen
                });

                // ---------------- SAVE NOTIFICATION ----------------
                for (const driver of freeDrivers) {
                    await db.notifications.create({
                        sender_id: userId,
                        receiver_id: driver.id,
                        message: "New ride request created",
                        type: 1,
                        status: 0,
                        bookingId: newBooking.id
                    });
                }

                // ---------------- SEND PUSH NOTIFICATION ----------------
                for (const driver of freeDrivers) {
                    if (!driver.id) continue;

                    const driverToken = await db.users.findOne({
                        where: { id: driver.id },
                        attributes: ["deviceToken", "languagee_type"],
                        raw: true
                    });

                    if (driverToken?.deviceToken && driverToken.deviceToken.length > 10) {
                        const msg = getPushMessage(
                            Number(driverToken.languagee_type),
                            "New ride request available",
                            "طلب رحلة جديد متاح",
                            "Nouvelle demande de course disponible"
                        );
                        const notiData = {
                            message: msg,
                            type: 1,
                            senderId: userId.toString(),
                            sender_name: "",
                            sender_image: ""
                        };

                        try {
                            helper.sendNotification_android(driverToken.deviceToken, notiData);
                        } catch (err) {
                            console.log(`Error sending push notification for driver ${driver.id}:`, err.message);
                        }
                    }
                }

                // ---------------- CREATE RIDE REQUEST FOR FREE DRIVERS ----------------
                const rideRequestData = [];
                for (const driver of freeDrivers) {
                    if (!driver.latitude || !driver.longitude) continue;

                    const driverDistance = calculateDistance(pickupLat, pickupLng, parseFloat(driver.latitude), parseFloat(driver.longitude));
                    if (driverDistance <= 30) {
                        rideRequestData.push({
                            bookingId: newBooking.id,
                            userId: userId,
                            driverId: driver.id,
                            status: 0
                        });
                    }
                }
                if (rideRequestData.length > 0) {
                    await db.rideRequest.bulkCreate(rideRequestData);
                }

                // ---------------- SOCKET EMIT ----------------
                freeDrivers.forEach(driver => {
                    if (global.onlineUsers && onlineUsers[driver.id]?.length) {
                        onlineUsers[driver.id].forEach(sockId => {
                            io.to(sockId).emit("newRideRequest", {
                                bookingId: newBooking.id,
                                orderId: newBooking.orderId,
                                pickupLocation,
                                dropLocation: finalDropLocation,
                                pickupLatitude,
                                pickupLongitude,
                                dropLatitude: finalDropLatitude,
                                dropLongitude: finalDropLongitude,
                                status: '0',
                                request: '0',
                                rideOpen
                            });
                        });
                    }
                });

                // ---------------- RESPONSE ----------------
                let msg = languageType === 1 ? 'تم إرسال طلب حجز الرحلة بنجاح' : languageType === 2 ? 'Demande de réservation de course envoyée avec succès' : 'Ride booking request sent successfully';
                let waitingMsg = languageType === 1 ? 'في انتظار قبول السائق لطلبك' : languageType === 2 ? 'En attente que le chauffeur accepte votre demande' : 'Waiting for driver to accept your request';

                return helper.success(res, msg, {
                    bookingId: newBooking.id,
                    orderId: newBooking.orderId,
                    status: newBooking.status,
                    request: newBooking.request,
                    bookingPrice: finalBookingPrice,
                    rideDistanceKm: rideDistanceKm ? rideDistanceKm.toFixed(2) : "",
                    message: waitingMsg
                });

            } catch (error) {
                console.error('Booking error:', error);

                // ---------------- SAFE LANGUAGE TYPE ----------------
                languageType = Number(req.headers.languagetype) || 0;
                let msg = languageType === 1 ? "حدث خطأ أثناء حجز الرحلة." : languageType === 2 ? "Une erreur est survenue lors de la réservation de la course." : "Something went wrong while booking the ride.";
                return helper.failure(res, msg);
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


    // driverAccptReject: (io) => {
    //     return async (req, res) => {
    //         let languageType = Number(req.headers.languagetype);
    //         const getPushMessage = (lang, en, ar, fr) => {
    //             if (lang === 1) return ar;
    //             if (lang === 2) return fr;
    //             return en;
    //         };

    //         try {
    //             const driverId = req.user.id;
    //             const { bookingId, request } = req.body;

    //             if (!bookingId || !request) {
    //                 let msg = "Booking ID and request value are required.";
    //                 if (languageType == 1) msg = "مطلوب معرف الحجز وقيمة الطلب.";
    //                 else if (languageType == 2) msg = "ID de réservation et valeur de la demande requis.";
    //                 return helper.failure(res, msg);
    //             }

    //             if (!['1', '2'].includes(request)) {
    //                 let msg = 'Invalid request value. Must be "1" (accept) or "2" (reject).';
    //                 if (languageType == 1) msg = 'قيمة الطلب غير صالحة.';
    //                 else if (languageType == 2) msg = 'Valeur de la demande invalide.';
    //                 return helper.failure(res, msg);
    //             }

    //             const driver = await db.users.findOne({
    //                 where: { id: driverId },
    //                 attributes: [
    //                     'approve', 'status', 'block', 'suspend',
    //                     'firstName', 'lastName', 'image',
    //                     'deviceToken', 'languagee_type'
    //                 ],
    //                 raw: true
    //             });

    //             if (driver.status === "0") {
    //                 let msg = "Your account has been deactivated by admin.";
    //                 if (languageType == 1) msg = "تم تعطيل حسابك من قبل المسؤول.";
    //                 else if (languageType == 2) msg = "Votre compte a été désactivé.";
    //                 return helper.failure(res, msg);
    //             }

    //             if (driver.block === "1") {
    //                 let msg = "Your account has been blocked by admin.";
    //                 if (languageType == 1) msg = "تم حظر حسابك.";
    //                 else if (languageType == 2) msg = "Votre compte a été bloqué.";
    //                 return helper.failure(res, msg);
    //             }

    //             if (driver.suspend === "1") {
    //                 let msg = "Your account has been suspended by admin.";
    //                 if (languageType == 1) msg = "تم تعليق حسابك.";
    //                 else if (languageType == 2) msg = "Votre compte a été suspendu.";
    //                 return helper.failure(res, msg);
    //             }

    //             if (driver.approve !== "1") {
    //                 let msg = "Your account is not approved by admin yet.";
    //                 if (languageType == 1) msg = "حسابك غير معتمد.";
    //                 else if (languageType == 2) msg = "Votre compte n’est pas encore approuvé.";
    //                 return helper.failure(res, msg);
    //             }

    //             const activeRide = await db.bookings.findOne({
    //                 where: { driverId, status: { [Sequelize.Op.in]: ['0', '1', '2'] } }
    //             });

    //             if (activeRide) {
    //                 let msg = "You already have an active ride.";
    //                 if (languageType == 1) msg = "لديك رحلة نشطة.";
    //                 else if (languageType == 2) msg = "Vous avez déjà une course active.";
    //                 return helper.failure(res, msg);
    //             }

    //             // ================= ACCEPT =================
    //             if (request === '1') {
    //                 const [updated] = await db.bookings.update(
    //                     { driverId, request: '1', status: '0' },
    //                     { where: { id: bookingId, driverId: null, status: '0', request: '0' } }
    //                 );

    //                 if (!updated) {
    //                     let msg = "Booking already processed";
    //                     if (languageType == 1) msg = "تمت معالجة الحجز بالفعل";
    //                     else if (languageType == 2) msg = "Réservation déjà traitée";
    //                     return helper.failure(res, msg);
    //                 }

    //                 await db.rideRequest.update(
    //                     { status: 1 },
    //                     { where: { bookingId, driverId } }
    //                 );
    //             }

    //             // ================= FETCH BOOKING =================
    //             const booking = await db.bookings.findOne({
    //                 where: { id: bookingId },
    //                 include: [{
    //                     model: db.users,
    //                     as: 'userbook',
    //                     attributes: ['id', 'socketId', 'deviceToken', 'languagee_type']
    //                 }]
    //             });

    //             const userLang = Number(booking.userbook.languagee_type) || 0;

    //             // ================= USER PUSH =================
    //             if (booking.userbook?.deviceToken) {
    //                 let pushMessage =
    //                     request === "1"
    //                         ? getPushMessage(
    //                             userLang,
    //                             "Driver has accepted your ride request",
    //                             "قبل السائق طلب رحلتك",
    //                             "Le chauffeur a accepté votre demande de course"
    //                         )
    //                         : getPushMessage(
    //                             userLang,
    //                             "Driver has rejected your ride request",
    //                             "رفض السائق طلبك",
    //                             "Le chauffeur a rejeté votre demande de course"
    //                         );

    //                 helper.sendNotification_android(
    //                     booking.userbook.deviceToken,
    //                     {
    //                         message: pushMessage,
    //                         type: 2,
    //                         senderId: driverId,
    //                         bookingId: booking.id,
    //                         sender_name: driver.firstName + " " + driver.lastName,
    //                         sender_image: driver.image
    //                     }
    //                 );
    //             }

    //             // ================= SOCKET =================
    //             if (booking.userbook?.socketId) {
    //                 io.to(booking.userbook.socketId).emit("rideStatusUpdate", {
    //                     success: true,
    //                     message: 'Driver has accepted your ride request',
    //                     bookingId: booking.id,
    //                     driverId,
    //                     request,
    //                     status: '0'
    //                 });
    //             }

    //             let resMsgAccept = "Booking accepted successfully. Driver on the way.";
    //             let resMsgReject = "Booking rejected successfully";

    //             if (languageType == 1) {
    //                 resMsgAccept = "تم قبول الحجز بنجاح. السائق في الطريق.";
    //                 resMsgReject = "تم رفض الحجز بنجاح";
    //             } else if (languageType == 2) {
    //                 resMsgAccept = "Réservation acceptée avec succès. Le chauffeur est en route.";
    //                 resMsgReject = "Réservation rejetée avec succès";
    //             }

    //             return helper.success(
    //                 res,
    //                 request === '1' ? resMsgAccept : resMsgReject,
    //                 { bookingId, request }
    //             );

    //         } catch (error) {
    //             console.error(error);
    //             let msg = "Something went wrong while processing the booking.";
    //             if (languageType == 1) msg = "حدث خطأ أثناء معالجة الحجز.";
    //             else if (languageType == 2) msg = "Une erreur est survenue.";
    //             return helper.failure(res, msg);
    //         }
    //     };
    // },

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
                        'deviceToken', 'languagee_type'
                    ],
                    raw: true
                });

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

                // ================= ACCEPT =================
                if (request === '1') {
                    const [updated] = await db.bookings.update(
                        {
                            driverId,
                            request: '1',
                            status: '0',
                            rideOpen: '0'
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
                        include: [{ model: db.users, as: 'user', attributes: ['socketId'] }] // as 'user' must match association
                    });

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
                if (booking.userbook?.deviceToken) {
                    let pushMessage =
                        request === "1"
                            ? getPushMessage(
                                userLang,
                                "Driver has accepted your ride request",
                                "قبل السائق طلب رحلتك",
                                "Le chauffeur a accepté votre demande de course"
                            )
                            : getPushMessage(
                                userLang,
                                "Driver has rejected your ride request",
                                "رفض السائق طلبك",
                                "Le chauffeur a rejeté votre demande de course"
                            );

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
                }

                // ================= SOCKET TO USER =================
                if (booking.userbook?.socketId) {
                    io.to(booking.userbook.socketId).emit("rideStatusUpdate", {
                        success: true,
                        message: 'Driver has accepted your ride request',
                        bookingId: booking.id,
                        driverId,
                        request,
                        status: '0'
                    });
                }

                // ===== RESPONSES (UNCHANGED) =====
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
                    where: { id: driverId },
                    attributes: ['status', 'block', 'suspend', "approve", "lastFreeTime"],
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

                // ===== CLEAN EXPIRED BOOKINGS =====
                const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
                await db.bookings.destroy({
                    where: {
                        driverId: null,
                        status: '0',
                        request: '0',
                        rejectCount: '0',
                        bookingDate: { [Sequelize.Op.lt]: oneMinuteAgo }
                    },
                    force: true
                });

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
                    : new Date(Date.now() - 60 * 1000); // default 1 minute

                // ===== REJECTED REQUESTS FILTER =====
                const rejectedRequests = await db.rideRequest.findAll({
                    where: { driverId, status: 2 },
                    attributes: ['bookingId'],
                    raw: true
                });

                const rejectedBookingIds = rejectedRequests.map(r => r.bookingId);

                // ===== FETCH REQUESTS WITH lastFreeTime FILTER =====
                const requests = await db.bookings.findAll({
                    where: {
                        driverId: null,
                        status: '0',
                        request: '0',
                        bookingDate: { [Sequelize.Op.gt]: lastFreeTime },
                        ...(rejectedBookingIds.length && { id: { [Sequelize.Op.notIn]: rejectedBookingIds } })
                    },
                    include: [{ model: db.users, as: 'userbook' }],
                    order: [['id', 'DESC']]
                });

                let successMsg = "Pending ride requests fetched successfully";
                if (languageType == 1) successMsg = "تم جلب طلبات الرحلات المعلقة بنجاح";
                else if (languageType == 2) successMsg = "Demandes de course en attente récupérées avec succès";

                return helper.success(
                    res,
                    successMsg,
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
                rideOpen: booking.rideOpen
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
                const languageType = Number(req.headers.languagetype); // RESPONSE language (same as before)
                const loggedInUserId = req.user.id;
                const loggedInUserRole = req.user.role; // "1" = user, "2" = driver
                const { bookingId } = req.body;


                let msgBookingRequired = "Booking ID is required.";
                if (languageType == 1) msgBookingRequired = "رقم تعريف الحجز مطلوب.";
                else if (languageType == 2) msgBookingRequired = "L'ID de réservation est requis.";
                if (!bookingId) return helper.failure(res, msgBookingRequired);

                const whereCond = {
                    id: bookingId,
                    status: { [Op.in]: ["0", "1"] },
                    request: { [Op.in]: ["0", "1"] }
                };

                if (loggedInUserRole === "1") whereCond.userId = loggedInUserId;
                else if (loggedInUserRole === "2") whereCond.driverId = loggedInUserId;
                else {
                    let msgRoleErr = "Only users or drivers can cancel a ride.";
                    if (languageType == 1) msgRoleErr = "فقط المستخدمين أو السائقين يمكنهم إلغاء الرحلة.";
                    else if (languageType == 2) msgRoleErr = "Seuls les utilisateurs ou les conducteurs peuvent annuler une course.";
                    return helper.failure(res, msgRoleErr);
                }

                const booking = await db.bookings.findOne({ where: whereCond });
                let msgCannotCancel = "Ride cannot be cancelled or already processed.";
                if (languageType == 1) msgCannotCancel = "لا يمكن إلغاء الرحلة أو تم معالجتها بالفعل.";
                else if (languageType == 2) msgCannotCancel = "La course ne peut pas être annulée ou a déjà été traitée.";
                if (!booking) return helper.failure(res, msgCannotCancel);

                const driverId = booking.driverId;
                const request = booking.request;
                const newStatus = loggedInUserRole === "1" ? "5" : "4";
                await booking.update({ status: newStatus });

                await db.notifications.create({
                    userId: loggedInUserId,
                    bookingId: booking.id,
                    type: 3,
                    message:
                        languageType == 1 ? "لقد ألغيت الرحلة" :
                            languageType == 2 ? "Vous avez annulé la course" :
                                "You have cancelled the ride",
                    status: 0
                });

                const isDriverBusy = async (id) => {
                    return await db.bookings.findOne({
                        where: { driverId: id, status: { [Op.in]: ["0", "1", "2"] } }
                    });
                };

                /* ================= USER CANCEL ================= */
                if (loggedInUserRole === "1") {

                    if (request === "0" || request === "1") {
                        const busyRide = await isDriverBusy(driverId);

                        if (!busyRide && request === "1" && driverId) {

                            const driver = await db.users.findOne({
                                where: { id: driverId, approve: "1" },
                                attributes: ["deviceToken", "languagee_type"],
                                raw: true
                            });

                            if (driver?.deviceToken) {
                                const pushMsg = getPushMessage(
                                    Number(driver.languagee_type),
                                    "Ride cancelled by user",
                                    "تم إلغاء الرحلة بواسطة المستخدم",
                                    "Course annulée par l'utilisateur"
                                );

                                helper.sendNotification_android(driver.deviceToken, {
                                    message: pushMsg,
                                    type: 3,
                                    bookingId: booking.id.toString(),
                                    cancelledBy: "user"
                                });
                            }

                            if (global.onlineUsers?.[driverId]) {
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
                    }

                    /* REQUEST = 0 (broadcast drivers) */
                    if (request === "0") {

                        const pickupLat = parseFloat(booking.pickupLatitude);
                        const pickupLng = parseFloat(booking.pickupLongitude);
                        const MAX_DISTANCE = 30;

                        const drivers = await db.users.findAll({
                            where: { role: "2", online: "1", approve: "1" },
                            attributes: ["id", "latitude", "longitude", "deviceToken", "languagee_type"],
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

                        for (const driver of drivers) {
                            if (!driver.latitude || !driver.longitude) continue;
                            const dist = distanceInKm(pickupLat, pickupLng, parseFloat(driver.latitude), parseFloat(driver.longitude));
                            const busyRide = await isDriverBusy(driver.id);

                            if (dist <= MAX_DISTANCE && !busyRide && driver.deviceToken) {
                                const pushMsg = getPushMessage(
                                    Number(driver.languagee_type),
                                    "Ride request cancelled by user",
                                    "تم إلغاء طلب الرحلة بواسطة المستخدم",
                                    "Demande de course annulée par l'utilisateur"
                                );

                                helper.sendNotification_android(driver.deviceToken, {
                                    message: pushMsg,
                                    type: 3,
                                    bookingId: booking.id.toString(),
                                    cancelledBy: "user"
                                });
                            }
                        }
                    }
                }

                /* ================= DRIVER CANCEL ================= */
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
                            message: pushMsg,
                            type: 4,
                            bookingId: booking.id.toString(),
                            cancelledBy: "driver"
                        });
                    }

                    if (global.onlineUsers?.[booking.userId]) {
                        global.onlineUsers[booking.userId].forEach(socketId => {
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

                let msgSuccess = loggedInUserRole === "1"
                    ? "Ride cancelled by user successfully."
                    : "Ride cancelled by driver successfully.";

                if (languageType == 1)
                    msgSuccess = loggedInUserRole === "1"
                        ? "تم إلغاء الرحلة بواسطة المستخدم بنجاح."
                        : "تم إلغاء الرحلة بواسطة السائق بنجاح.";
                else if (languageType == 2)
                    msgSuccess = loggedInUserRole === "1"
                        ? "Course annulée par l'utilisateur avec succès."
                        : "Course annulée par le conducteur avec succès.";

                return helper.success(res, msgSuccess, {
                    bookingId: booking.id,
                    cancelledBy: loggedInUserRole === "1" ? "user" : "driver",
                    status: newStatus,
                    message: msgSuccess
                });

            } catch (error) {
                console.error(error);
                let errMsg = "Something went wrong while cancelling the ride.";
                if (languageType == 1) errMsg = "حدث خطأ أثناء إلغاء الرحلة.";
                else if (languageType == 2) errMsg = "Une erreur est survenue lors de l'annulation de la course.";
                return helper.failure(res, errMsg);
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
            const languageType = Number(req.headers.languagetype); // 1 = Arabic, 2 = French, default = English

            const data = await db.transferscreenshot.create({
                driverId: req.user.id,
                image: req.body.image
            });

            let successMessage = "Driver Wallet Recharge created successfully";
            if (languageType === 1) successMessage = "تم إنشاء إعادة شحن محفظة السائق بنجاح";
            else if (languageType === 2) successMessage = "Recharge du portefeuille du conducteur créée avec succès";

            return helper.success(res, successMessage, data);

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
                where: { receiver_id: req.user.id },
                order: [['id', 'DESC']]
            });
            return helper.success(res, "Get All Notifications Successfully", notifications);
        } catch (error) {
            console.error("Error fetching notifications:", error);

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
    }





}