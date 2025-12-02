const db = require('../../models');
const bcrypt = require('bcryptjs');
const helper = require('../../helper/helper');
const { Validator } = require('node-input-validator');
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

module.exports = {
    findRide: async (req, res) => {
        try {
            const { userId, pickupLocation, dropLocation } = req.body;

            const v = new Validator(req.body, {
                userId: 'required|integer',
                pickupLocation: 'required|string',
                dropLocation: 'required|string',
            });

            const matched = await v.check();
            if (!matched) {
                return res.status(422).json({ status: false, message: v.errors });
            }
            const [pickupLat, pickupLng] = pickupLocation.split(',').map(coord => parseFloat(coord.trim()));
            const [dropLat, dropLng] = dropLocation.split(',').map(coord => parseFloat(coord.trim()));

            if (isNaN(pickupLat) || isNaN(pickupLng) || isNaN(dropLat) || isNaN(dropLng)) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid location coordinates format. Use "latitude,longitude"'
                });
            }

            const radius = 5; 

            const nearbyDrivers = await db.users.findAll({
                where: {
                    role: '2',
                },
          
            });
            const driversWithDistance = nearbyDrivers
                .map(driver => {
                    if (!driver.latitude || !driver.longitude) return null;

                    const distance = calculateDistance(
                        pickupLat,
                        pickupLng,
                        parseFloat(driver.latitude),
                        parseFloat(driver.longitude)
                    );

                    return {
                        ...driver.toJSON(),
                        distance: distance.toFixed(2),
                        distanceUnit: 'km'
                    };
                })
                .filter(driver => driver !== null && driver.distance <= radius)
                .sort((a, b) => a.distance - b.distance); 

            function calculateDistance(lat1, lon1, lat2, lon2) {
                const R = 6371;
                const dLat = toRad(lat2 - lat1);
                const dLon = toRad(lon2 - lon1);
                const a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            }

            function toRad(degrees) {
                return degrees * (Math.PI / 180);
            }

            if (driversWithDistance.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: 'No drivers available near your location'
                });
            }

            return res.status(200).json({
                status: true,
                message: 'Nearby drivers found',
                data: {
                    pickupLocation: { latitude: pickupLat, longitude: pickupLng },
                    dropLocation: { latitude: dropLat, longitude: dropLng },
                    totalDrivers: driversWithDistance.length,
                    drivers: driversWithDistance
                }
            });
        } catch (error) {
            console.error('Error in findRide:', error);
            return res.status(500).json({ status: false, message: 'Internal Server Error' });
        }
    }


}