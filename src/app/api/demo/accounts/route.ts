import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { recalcTrustScore } from "@/lib/trust";

// Demo account constants — created on first request and reused.
const DEMO_PASSENGER = {
  email: "demo@naijaride.demo",
  name: "Demo Passenger",
  phone: "+2348000000001",
  password: "demo1234",
  role: "PASSENGER" as const,
  gender: "FEMALE" as const,
};

const DEMO_DRIVER = {
  email: "driver@naijaride.demo",
  name: "Demo Driver",
  phone: "+2348000000002",
  password: "demo1234",
  role: "DRIVER" as const,
  gender: "MALE" as const,
};

const DEMO_FEMALE_DRIVER = {
  email: "ada@naijaride.demo",
  name: "Ada Driver",
  phone: "+2348000000004",
  password: "demo1234",
  role: "DRIVER" as const,
  gender: "FEMALE" as const,
};

const DEMO_ADMIN = {
  email: "admin@naijaride.demo",
  name: "Demo Admin",
  phone: "+2348000000003",
  password: "demo1234",
  role: "ADMIN" as const,
  gender: "PREFER_NOT_TO_SAY" as const,
};

async function findOrCreate(p: typeof DEMO_PASSENGER) {
  const existing = await db.user.findUnique({ where: { email: p.email } });
  if (existing) {
    // For older records that may not have safety fields, update them
    return db.user.update({
      where: { id: existing.id },
      data: {
        gender: existing.gender ?? p.gender,
      },
    });
  }
  return db.user.create({
    data: {
      email: p.email,
      name: p.name,
      phone: p.phone,
      password: await bcrypt.hash(p.password, 10),
      role: p.role,
      gender: p.gender,
      isDemo: true,
      avatarUrl: null,
    },
  });
}

async function ensureVerifications(userId: string, types: string[]) {
  for (const t of types) {
    const existing = await db.verification.findUnique({
      where: { userId_type: { userId, type: t as "NIN" | "DRIVERS_LICENSE" | "VEHICLE_PLATE" | "SELFIE" | "PHONE" | "EMAIL" } },
    });
    if (!existing) {
      await db.verification.create({
        data: {
          userId,
          type: t as "NIN" | "DRIVERS_LICENSE" | "VEHICLE_PLATE" | "SELFIE" | "PHONE" | "EMAIL",
          status: "APPROVED",
          reference: `DEMO-${t}-${userId.slice(-6)}`,
          reviewedAt: new Date(),
        },
      });
    }
  }
}

async function ensureEmergencyContact(userId: string, name: string, phone: string, rel: string) {
  const existing = await db.emergencyContact.findFirst({ where: { userId, phone } });
  if (!existing) {
    await db.emergencyContact.create({
      data: { userId, name, phone, relationship: rel },
    });
  }
}

function dateFromNow(days: number, hour = 7, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/**
 * GET /api/demo/accounts
 * Returns the demo credentials and ensures the demo accounts + trips exist.
 */
export async function GET() {
  try {
    const passenger = await findOrCreate(DEMO_PASSENGER);
    const driver = await findOrCreate(DEMO_DRIVER);
    const femaleDriver = await findOrCreate(DEMO_FEMALE_DRIVER);
    const admin = await findOrCreate(DEMO_ADMIN);

    // Ensure verifications for driver
    await ensureVerifications(driver.id, ["NIN", "DRIVERS_LICENSE", "VEHICLE_PLATE", "SELFIE", "PHONE", "EMAIL"]);
    await ensureVerifications(femaleDriver.id, ["NIN", "DRIVERS_LICENSE", "VEHICLE_PLATE", "SELFIE", "PHONE", "EMAIL"]);
    await ensureVerifications(passenger.id, ["PHONE", "EMAIL"]);

    // Recompute trust scores (verifications affect score + isVerified flag)
    await recalcTrustScore(driver.id);
    await recalcTrustScore(femaleDriver.id);
    await recalcTrustScore(passenger.id);
    await recalcTrustScore(admin.id);

    // Emergency contacts
    await ensureEmergencyContact(passenger.id, "Tunde Passenger", "+2348031111111", "Brother");
    await ensureEmergencyContact(driver.id, "Bisi Driver", "+2348032222222", "Wife");

    // Optionally seed demo trips — check for trips departing in the next 7 days
    const upcomingTrips = await db.trip.count({
      where: {
        driverId: driver.id,
        departureAt: { gte: new Date() },
      },
    });

    if (upcomingTrips === 0) {
      // Mark old demo trips as cancelled first (so we don't accumulate stale ones)
      await db.trip.updateMany({
        where: { driverId: driver.id, departureAt: { lt: new Date() } },
        data: { status: "COMPLETED" },
      });
      await db.trip.updateMany({
        where: { driverId: femaleDriver.id, departureAt: { lt: new Date() } },
        data: { status: "COMPLETED" },
      });

      // Driver 1: Lagos → Abuja (tomorrow 7am, via Ibadan + Ilorin)
      await db.trip.create({
        data: {
          driverId: driver.id,
          originLabel: "Yaba, Lagos",
          originLat: 6.5244,
          originLng: 3.3792,
          destinationLabel: "Wuse II, Abuja",
          destinationLat: 9.0765,
          destinationLng: 7.3986,
          waypointsJson: JSON.stringify([
            { label: "Ibadan", lat: 7.3776, lng: 3.947 },
            { label: "Ilorin", lat: 8.4966, lng: 4.5421 },
          ]),
          departureAt: dateFromNow(1, 7),
          seatsTotal: 3,
          seatsAvailable: 3,
          pricePerSeat: 18000,
          vehicleModel: "Toyota Camry 2022",
          vehicleColor: "Sandstone Beige",
          vehiclePlate: "NR-DEMO-01",
          status: "OPEN",
        },
      });

      // Driver 1: Lagos → Abuja (in 3 days, 6am)
      await db.trip.create({
        data: {
          driverId: driver.id,
          originLabel: "Lekki Phase 1, Lagos",
          originLat: 6.4506,
          originLng: 3.4737,
          destinationLabel: "Garki, Abuja",
          destinationLat: 9.025,
          destinationLng: 7.4875,
          waypointsJson: "[]",
          departureAt: dateFromNow(3, 6),
          seatsTotal: 4,
          seatsAvailable: 2, // partially booked to show activity
          pricePerSeat: 16500,
          vehicleModel: "Toyota Camry 2022",
          vehicleColor: "Sandstone Beige",
          vehiclePlate: "NR-DEMO-01",
          status: "OPEN",
        },
      });

      // Female driver: Lagos → Ibadan (tomorrow 8am, FEMALE-ONLY trip)
      await db.trip.create({
        data: {
          driverId: femaleDriver.id,
          originLabel: "Victoria Island, Lagos",
          originLat: 6.4297,
          originLng: 3.4219,
          destinationLabel: "Ibadan",
          destinationLat: 7.3776,
          destinationLng: 3.947,
          waypointsJson: "[]",
          departureAt: dateFromNow(1, 8),
          seatsTotal: 3,
          seatsAvailable: 3,
          pricePerSeat: 5500,
          vehicleModel: "Honda Civic 2021",
          vehicleColor: "Pearl White",
          vehiclePlate: "NR-DEMO-02",
          status: "OPEN",
          femaleOnly: true,
        },
      });

      // Female driver: Lagos → Lekki (in 2 days, 5pm — short commute)
      await db.trip.create({
        data: {
          driverId: femaleDriver.id,
          originLabel: "Ikeja, Lagos",
          originLat: 6.6018,
          originLng: 3.3515,
          destinationLabel: "Lekki Phase 1, Lagos",
          destinationLat: 6.4506,
          destinationLng: 3.4737,
          waypointsJson: "[]",
          departureAt: dateFromNow(2, 17),
          seatsTotal: 3,
          seatsAvailable: 3,
          pricePerSeat: 3500,
          vehicleModel: "Honda Civic 2021",
          vehicleColor: "Pearl White",
          vehiclePlate: "NR-DEMO-02",
          status: "OPEN",
          femaleOnly: true,
        },
      });
    }

    return NextResponse.json({
      passenger: { email: DEMO_PASSENGER.email, password: DEMO_PASSENGER.password, id: passenger.id },
      driver: { email: DEMO_DRIVER.email, password: DEMO_DRIVER.password, id: driver.id },
      femaleDriver: { email: DEMO_FEMALE_DRIVER.email, password: DEMO_FEMALE_DRIVER.password, id: femaleDriver.id },
      admin: { email: DEMO_ADMIN.email, password: DEMO_ADMIN.password, id: admin.id },
    });
  } catch (err) {
    console.error("[demo] seed failed", err);
    return NextResponse.json(
      { error: "Failed to prepare demo accounts: " + (err instanceof Error ? err.message : "unknown") },
      { status: 500 },
    );
  }
}
