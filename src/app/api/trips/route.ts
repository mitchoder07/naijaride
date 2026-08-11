import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

const createTripSchema = z.object({
  originLabel: z.string().min(2, "Origin is required"),
  originLat: z.number(),
  originLng: z.number(),
  destinationLabel: z.string().min(2, "Destination is required"),
  destinationLat: z.number(),
  destinationLng: z.number(),
  waypoints: z
    .array(z.object({ label: z.string(), lat: z.number(), lng: z.number() }))
    .max(6)
    .optional(),
  departureAt: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid date",
  }),
  seatsTotal: z.number().int().min(1).max(8),
  pricePerSeat: z.number().int().min(0),
  vehicleModel: z.string().min(1),
  vehicleColor: z.string().min(1),
  vehiclePlate: z.string().min(1),
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: z.string().nullable().optional(),
  femaleOnly: z.boolean().optional().default(false),
});

export async function GET() {
  try {
    const trips = await db.trip.findMany({
      where: {
        status: "OPEN",
        seatsAvailable: { gt: 0 },
        departureAt: { gte: new Date() },
        parentId: null, // show only parent trips in the listing
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            trustScore: true,
            isVerified: true,
          },
        },
      },
      orderBy: { departureAt: "asc" },
      take: 12,
    });
    return NextResponse.json({ trips });
  } catch (err) {
    console.error("[trips GET]", err);
    return NextResponse.json(
      { error: "Failed to load trips" },
      { status: 500 },
    );
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Generate child trips for a recurring parent trip.
 * Creates one child for each of the next 8 occurrences on the rule's weekdays.
 */
async function generateRecurringChildren(
  parentId: string,
  departure: Date,
  recurrenceRule: string,
  baseData: {
    driverId: string;
    originLabel: string;
    originLat: number;
    originLng: number;
    destinationLabel: string;
    destinationLat: number;
    destinationLng: number;
    waypointsJson: string;
    seatsTotal: number;
    pricePerSeat: number;
    vehicleModel: string;
    vehicleColor: string;
    vehiclePlate: string;
    femaleOnly: boolean;
  },
) {
  // Parse rule like "WEEKLY:1,2,3,4,5"
  const match = recurrenceRule.match(/^WEEKLY:([0-6,]+)$/);
  if (!match) return;
  const weekdays = match[1]
    .split(",")
    .map((d) => parseInt(d, 10))
    .filter((d) => !isNaN(d));
  if (weekdays.length === 0) return;

  // JS getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const occurrences: Date[] = [];
  let cursor = new Date(departure.getTime() + DAY_MS); // start looking from tomorrow
  // Generate up to 12 occurrences over the next 60 days
  while (occurrences.length < 12 && cursor.getTime() - departure.getTime() < 60 * DAY_MS) {
    if (weekdays.includes(cursor.getDay())) {
      const inst = new Date(cursor);
      inst.setHours(departure.getHours(), departure.getMinutes(), 0, 0);
      occurrences.push(inst);
    }
    cursor = new Date(cursor.getTime() + DAY_MS);
  }

  if (occurrences.length === 0) return;

  await db.trip.createMany({
    data: occurrences.map((d) => ({
      parentId,
      driverId: baseData.driverId,
      originLabel: baseData.originLabel,
      originLat: baseData.originLat,
      originLng: baseData.originLng,
      destinationLabel: baseData.destinationLabel,
      destinationLat: baseData.destinationLat,
      destinationLng: baseData.destinationLng,
      waypointsJson: baseData.waypointsJson,
      departureAt: d,
      seatsTotal: baseData.seatsTotal,
      seatsAvailable: baseData.seatsTotal,
      pricePerSeat: baseData.pricePerSeat,
      vehicleModel: baseData.vehicleModel,
      vehicleColor: baseData.vehicleColor,
      vehiclePlate: baseData.vehiclePlate,
      status: "OPEN",
      femaleOnly: baseData.femaleOnly,
    })),
  });
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = createTripSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    if (user.role === "PASSENGER") {
      return NextResponse.json(
        { error: "Only drivers can create trips" },
        { status: 403 },
      );
    }
    const departure = new Date(parsed.data.departureAt);
    if (departure.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Departure must be in the future" },
        { status: 400 },
      );
    }

    const waypointsJson = JSON.stringify(parsed.data.waypoints ?? []);
    const isRecurring = !!parsed.data.isRecurring;
    const recurrenceRule = parsed.data.recurrenceRule ?? null;
    const femaleOnly = !!parsed.data.femaleOnly;

    const trip = await db.trip.create({
      data: {
        driverId: user.id,
        originLabel: parsed.data.originLabel,
        originLat: parsed.data.originLat,
        originLng: parsed.data.originLng,
        destinationLabel: parsed.data.destinationLabel,
        destinationLat: parsed.data.destinationLat,
        destinationLng: parsed.data.destinationLng,
        waypointsJson,
        departureAt: departure,
        seatsTotal: parsed.data.seatsTotal,
        seatsAvailable: parsed.data.seatsTotal,
        pricePerSeat: parsed.data.pricePerSeat,
        vehicleModel: parsed.data.vehicleModel,
        vehicleColor: parsed.data.vehicleColor,
        vehiclePlate: parsed.data.vehiclePlate,
        isRecurring,
        recurrenceRule,
        femaleOnly,
      },
    });

    // Generate child trips for recurring parents
    if (isRecurring && recurrenceRule) {
      await generateRecurringChildren(trip.id, departure, recurrenceRule, {
        driverId: user.id,
        originLabel: parsed.data.originLabel,
        originLat: parsed.data.originLat,
        originLng: parsed.data.originLng,
        destinationLabel: parsed.data.destinationLabel,
        destinationLat: parsed.data.destinationLat,
        destinationLng: parsed.data.destinationLng,
        waypointsJson,
        seatsTotal: parsed.data.seatsTotal,
        pricePerSeat: parsed.data.pricePerSeat,
        vehicleModel: parsed.data.vehicleModel,
        vehicleColor: parsed.data.vehicleColor,
        vehiclePlate: parsed.data.vehiclePlate,
        femaleOnly,
      });
    }

    return NextResponse.json({ trip }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[trips POST]", err);
    return NextResponse.json(
      { error: "Failed to create trip" },
      { status: 500 },
    );
  }
}
