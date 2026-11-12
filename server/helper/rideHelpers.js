const VEHICLE_TYPES = ["2 Wheeler", "3 Wheeler", "4 Wheeler"];

const VEHICLE_PRICING = {
  "2 Wheeler": { basePrice: 30, freeKm: 2, perKmFactor: 0.45, minPerKm: 8 },
  "3 Wheeler": { basePrice: 50, freeKm: 2, perKmFactor: 0.7, minPerKm: 12 },
  "4 Wheeler": { basePrice: 100, freeKm: 2, perKmFactor: 1.0, minPerKm: 20 },
};

function normalizeVehicleType(val) {
  if (val === undefined || val === null) return "";
  const raw = String(val).trim().toLowerCase().replace(/[_-]+/g, " ");
  if (!raw) return "";
  if (
    raw === "2" ||
    raw === "2w" ||
    raw === "2 wheeler" ||
    raw === "two wheeler" ||
    raw === "bike" ||
    raw === "moto" ||
    raw === "scooter"
  ) {
    return "2 Wheeler";
  }
  if (
    raw === "3" ||
    raw === "3w" ||
    raw === "3 wheeler" ||
    raw === "three wheeler" ||
    raw === "auto" ||
    raw === "rickshaw" ||
    raw === "e rickshaw"
  ) {
    return "3 Wheeler";
  }
  if (
    raw === "4" ||
    raw === "4w" ||
    raw === "4 wheeler" ||
    raw === "four wheeler" ||
    raw === "car" ||
    raw === "cab"
  ) {
    return "4 Wheeler";
  }
  return String(val).trim();
}

function defaultPassengerCountForType(vehicleType, fallback = 4) {
  const normalized = normalizeVehicleType(vehicleType);
  if (normalized === "2 Wheeler") return 1;
  if (normalized === "3 Wheeler") return 3;
  if (normalized === "4 Wheeler") return 4;
  return fallback;
}

function getVehiclePricingConfig(vehicleType, baseCarPerKm = 23) {
  const normalized = normalizeVehicleType(vehicleType) || "4 Wheeler";
  const tier = VEHICLE_PRICING[normalized] || VEHICLE_PRICING["4 Wheeler"];
  const carRate = Number(baseCarPerKm) > 0 ? Number(baseCarPerKm) : 23;
  const perKmRate =
    normalized === "4 Wheeler"
      ? carRate
      : Math.max(tier.minPerKm, Math.round(carRate * tier.perKmFactor));
  return {
    vehicleType: normalized,
    basePrice: tier.basePrice,
    freeKm: tier.freeKm,
    perKmRate,
  };
}

function calculateFareForVehicle(vehicleType, distanceKm, baseCarPerKm = 23) {
  const cfg = getVehiclePricingConfig(vehicleType, baseCarPerKm);
  const dist = Number(distanceKm) || 0;
  let amount = cfg.basePrice;
  if (dist > cfg.freeKm) {
    amount += (dist - cfg.freeKm) * cfg.perKmRate;
  }
  return Math.round(amount / 5) * 5;
}

function toOffsetDateKey(dateInput, tzOffsetMinutes = 330) {
  const dt = new Date(dateInput);
  if (Number.isNaN(dt.getTime())) return null;
  const shifted = new Date(dt.getTime() + tzOffsetMinutes * 60000);
  return {
    dateKey: shifted.toISOString().slice(0, 10),
    dayMidnightUtcMs: Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate()
    ),
  };
}

async function calculateDriverEarnings(db, driverId, tzOffsetMinutes = 330) {
  const safeOffset = Number.isFinite(Number(tzOffsetMinutes))
    ? Number(tzOffsetMinutes)
    : 330;

  const [driverUser, completedRides] = await Promise.all([
    db.users.findOne({
      where: { id: driverId },
      attributes: ["id", "totalAmount"],
      raw: true,
    }),
    db.bookings.findAll({
      where: {
        driverId,
        status: "3",
      },
      attributes: [
        "id",
        "bookingPrice",
        "adminAmountCut",
        "bookingDate",
        "createdAt",
        "updatedAt",
      ],
      order: [["id", "DESC"]],
      raw: true,
    }),
  ]);

  const nowInfo = toOffsetDateKey(new Date(), safeOffset);
  const todayMidnightMs = nowInfo.dayMidnightUtcMs;
  const weekStartMs = todayMidnightMs - 6 * 86400000;
  const monthStartMs = todayMidnightMs - 29 * 86400000;

  let totalEarnings = 0;
  let todayEarnings = 0;
  let lastWeekEarnings = 0;
  let lastMonthEarnings = 0;
  let totalCommission = 0;

  let totalRides = 0;
  let todayRides = 0;
  let lastWeekRides = 0;
  let lastMonthRides = 0;

  for (const ride of completedRides) {
    const fare = parseFloat(ride.bookingPrice) || 0;
    const commission = parseFloat(ride.adminAmountCut) || 0;
    const info = toOffsetDateKey(
      ride.updatedAt || ride.bookingDate || ride.createdAt,
      safeOffset
    );

    totalEarnings += fare;
    totalCommission += commission;
    totalRides += 1;

    if (info) {
      if (info.dayMidnightUtcMs === todayMidnightMs) {
        todayEarnings += fare;
        todayRides += 1;
      }
      if (info.dayMidnightUtcMs >= weekStartMs && info.dayMidnightUtcMs <= todayMidnightMs) {
        lastWeekEarnings += fare;
        lastWeekRides += 1;
      }
      if (info.dayMidnightUtcMs >= monthStartMs && info.dayMidnightUtcMs <= todayMidnightMs) {
        lastMonthEarnings += fare;
        lastMonthRides += 1;
      }
    }
  }

  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

  return {
    totalEarnings: round2(totalEarnings),
    todayEarnings: round2(todayEarnings),
    lastWeekEarnings: round2(lastWeekEarnings),
    lastMonthEarnings: round2(lastMonthEarnings),
    netTotalEarnings: round2(Math.max(0, totalEarnings - totalCommission)),
    totalCommission: round2(totalCommission),
    totalRides,
    todayRides,
    lastWeekRides,
    lastMonthRides,
    walletBalance: round2(parseFloat(driverUser?.totalAmount || 0) || 0),
  };
}

module.exports = {
  VEHICLE_TYPES,
  normalizeVehicleType,
  defaultPassengerCountForType,
  getVehiclePricingConfig,
  calculateFareForVehicle,
  calculateDriverEarnings,
};
