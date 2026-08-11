"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Car,
  Calendar,
  Users,
  ArrowRight,
  Plus,
  CheckCircle2,
  Route as RouteIcon,
  Repeat,
  MapPin,
  X,
  Venus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigation } from "@/lib/store";
import { api, formatNGN } from "@/lib/api";
import { MapPicker, type GeoPoint, RoutePreviewMap } from "@/components/map-picker";

const WEEKDAYS = [
  { id: 1, label: "Mon", full: "Monday" },
  { id: 2, label: "Tue", full: "Tuesday" },
  { id: 3, label: "Wed", full: "Wednesday" },
  { id: 4, label: "Thu", full: "Thursday" },
  { id: 5, label: "Fri", full: "Friday" },
  { id: 6, label: "Sat", full: "Saturday" },
  { id: 0, label: "Sun", full: "Sunday" },
];

const schema = z.object({
  origin: z.custom<GeoPoint>((v) => !!v && typeof v === "object" && typeof v.lat === "number" && typeof v.lng === "number", "Pick origin on map"),
  destination: z.custom<GeoPoint>((v) => !!v && typeof v === "object" && typeof v.lat === "number" && typeof v.lng === "number", "Pick destination on map"),
  departureAt: z.string(),
  seatsTotal: z.number().int().min(1).max(8),
  pricePerSeat: z.number().int().min(0),
  vehicleModel: z.string().min(1, "Vehicle model required"),
  vehicleColor: z.string().min(1, "Vehicle colour required"),
  vehiclePlate: z.string().min(1, "Plate number required"),
  waypoints: z
    .array(z.object({ label: z.string(), lat: z.number(), lng: z.number() }))
    .max(6),
  isRecurring: z.boolean(),
  recurrenceDays: z.array(z.number()),
  femaleOnly: z.boolean(),
}).refine(
  (d) => !isNaN(Date.parse(d.departureAt)) && new Date(d.departureAt).getTime() > Date.now(),
  { path: ["departureAt"], message: "Pick a future date & time" },
).refine(
  (d) => !d.isRecurring || d.recurrenceDays.length > 0,
  { path: ["recurrenceDays"], message: "Select at least one weekday" },
);

type FormValues = z.infer<typeof schema>;

export function CreateTripView() {
  const { user } = useCurrentUser();
  const { navigate } = useNavigation();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      origin: null,
      destination: null,
      departureAt: "",
      seatsTotal: 3,
      pricePerSeat: 5000,
      vehicleModel: "",
      vehicleColor: "",
      vehiclePlate: "",
      waypoints: [],
      isRecurring: false,
      recurrenceDays: [],
      femaleOnly: false,
    } as unknown as FormValues,
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const body = {
        originLabel: values.origin.label,
        originLat: values.origin.lat,
        originLng: values.origin.lng,
        destinationLabel: values.destination.label,
        destinationLat: values.destination.lat,
        destinationLng: values.destination.lng,
        waypoints: values.waypoints,
        departureAt: values.departureAt,
        seatsTotal: values.seatsTotal,
        pricePerSeat: values.pricePerSeat,
        vehicleModel: values.vehicleModel,
        vehicleColor: values.vehicleColor,
        vehiclePlate: values.vehiclePlate,
        isRecurring: values.isRecurring,
        recurrenceRule: values.isRecurring
          ? `WEEKLY:${values.recurrenceDays.join(",")}`
          : null,
        femaleOnly: values.femaleOnly,
      };
      await api.post(`/api/trips`, body);
      toast.success(
        values.isRecurring
          ? "Recurring trip created! Future instances will be auto-generated."
          : "Trip created! Passengers can now book.",
      );
      qc.invalidateQueries({ queryKey: ["my-trips"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      navigate("my-trips");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create trip",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDay = (id: number) => {
    const current = form.getValues("recurrenceDays");
    const next = current.includes(id)
      ? current.filter((d) => d !== id)
      : [...current, id].sort();
    form.setValue("recurrenceDays", next);
  };

  const origin = form.watch("origin") as GeoPoint | null;
  const destination = form.watch("destination") as GeoPoint | null;
  const waypoints = form.watch("waypoints") as GeoPoint[];
  const isRecurring = form.watch("isRecurring");
  const recurrenceDays = form.watch("recurrenceDays");

  if (user?.role === "PASSENGER") {
    return (
      <main className="container mx-auto px-4 py-12">
        <Card className="border-2">
          <CardContent className="p-8 max-w-md mx-auto text-center">
            <Car className="size-12 mx-auto text-muted-foreground mb-3" />
            <h2 className="font-display font-bold text-xl">Drivers only</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Update your account role to DRIVER or BOTH to offer trips.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 md:py-10">
      <header className="mb-8">
        <Badge variant="secondary" className="mb-3 gap-1">
          <Plus className="size-3.5" />
          Offer a ride
        </Badge>
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
          Where are you heading?
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-lg">
          Drop pins on the map to set your route. Share your empty seats with passengers going your way.
        </p>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Route section */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <RouteIcon className="size-5 text-primary" />
                  Route
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <MapPicker
                  label="Pickup point"
                  pickup={origin}
                  onChange={(p) => form.setValue("origin", p as GeoPoint, { shouldValidate: true })}
                  height="260px"
                />
                <MapPicker
                  label="Drop-off point"
                  pickup={destination}
                  onChange={(p) => form.setValue("destination", p as GeoPoint, { shouldValidate: true })}
                  height="260px"
                />

                {origin && destination && waypoints.length === 0 && (
                  <div className="space-y-2">
                    <Label>Waypoints (optional, up to 6)</Label>
                    <p className="text-xs text-muted-foreground">
                      Add stops you'll pass through — passengers along the way can match.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.setValue("waypoints", [
                          ...waypoints,
                          { label: "Mid-point", lat: (origin.lat + destination.lat) / 2, lng: (origin.lng + destination.lng) / 2 },
                        ]);
                      }}
                      className="gap-1.5 rounded-full"
                    >
                      <Plus className="size-3.5" />
                      Add waypoint
                    </Button>
                  </div>
                )}

                {waypoints.length > 0 && (
                  <div className="space-y-2">
                    <Label>Waypoints (tap map preview to edit)</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {waypoints.map((w, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          <MapPin className="size-3" />
                          {w.label}
                          <button
                            type="button"
                            onClick={() => {
                              const cur = form.getValues("waypoints");
                              form.setValue("waypoints", cur.filter((_, idx) => idx !== i));
                            }}
                            className="ml-1 hover:text-destructive"
                            aria-label="Remove waypoint"
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {origin && destination && (
                  <RoutePreviewMap
                    origin={origin}
                    destination={destination}
                    waypoints={waypoints}
                    height="220px"
                  />
                )}

                {form.formState.errors.origin && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.origin.message as string}
                  </p>
                )}
                {form.formState.errors.destination && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.destination.message as string}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Trip details */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Calendar className="size-5 text-primary" />
                  Trip details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Departure date &amp; time</Label>
                  <Input
                    type="datetime-local"
                    {...form.register("departureAt")}
                    className="rounded-full"
                  />
                  {form.formState.errors.departureAt && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.departureAt.message as string}
                    </p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Seats available</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9 rounded-full"
                        onClick={() =>
                          form.setValue("seatsTotal", Math.max(1, form.getValues("seatsTotal") - 1))
                        }
                      >
                        −
                      </Button>
                      <span className="font-display font-bold text-lg w-8 text-center flex items-center justify-center">
                        <Users className="size-4 inline mr-1" />
                        {form.watch("seatsTotal")}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9 rounded-full"
                        onClick={() =>
                          form.setValue("seatsTotal", Math.min(8, form.getValues("seatsTotal") + 1))
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Price per seat (₦)</Label>
                    <Input
                      type="number"
                      step={500}
                      min={0}
                      value={form.watch("pricePerSeat")}
                      onChange={(e) => form.setValue("pricePerSeat", Number(e.target.value))}
                      className="rounded-full"
                    />
                  </div>
                </div>

                {/* Recurring trips */}
                <div className="rounded-2xl border-2 border-border/60 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Repeat className="size-4 text-primary" />
                        <span className="font-semibold">Recurring trip</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto-replicate this trip on selected weekdays. Great for daily commutes.
                      </p>
                    </div>
                    <Switch
                      checked={isRecurring}
                      onCheckedChange={(v) => form.setValue("isRecurring", v)}
                    />
                  </div>
                  {isRecurring && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2 overflow-hidden"
                    >
                      <Label className="text-xs">Repeat on</Label>
                      <div className="flex gap-1.5 flex-wrap">
                        {WEEKDAYS.map((d) => {
                          const selected = recurrenceDays.includes(d.id);
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => toggleDay(d.id)}
                              className={`size-10 rounded-full text-xs font-semibold border-2 transition ${
                                selected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-foreground/70 border-border hover:border-primary/40"
                              }`}
                              aria-pressed={selected}
                              title={d.full}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                      {form.formState.errors.recurrenceDays && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.recurrenceDays.message as string}
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Female-only ride */}
                <div className="rounded-2xl border-2 border-chart-4/30 bg-chart-4/5 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Venus className="size-4 text-chart-4" />
                        <span className="font-semibold">Women-only ride</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only female passengers can book this trip. Great for female drivers or passengers who feel safer with other women.
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("femaleOnly")}
                      onCheckedChange={(v) => form.setValue("femaleOnly", v)}
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-primary/8 p-4 text-sm flex items-center justify-between border-2 border-primary/20">
                  <span className="text-muted-foreground">You earn per full trip</span>
                  <span className="font-display font-bold text-primary text-xl">
                    {formatNGN(form.watch("pricePerSeat") * form.watch("seatsTotal"))}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Car className="size-5 text-primary" />
                  Vehicle details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Model</Label>
                  <Input placeholder="Toyota Camry" {...form.register("vehicleModel")} className="rounded-full" />
                  {form.formState.errors.vehicleModel && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.vehicleModel.message as string}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Colour</Label>
                  <Input placeholder="Silver" {...form.register("vehicleColor")} className="rounded-full" />
                  {form.formState.errors.vehicleColor && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.vehicleColor.message as string}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Plate number</Label>
                  <Input placeholder="ABC-123-XY" {...form.register("vehiclePlate")} className="rounded-full" />
                  {form.formState.errors.vehiclePlate && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.vehiclePlate.message as string}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sticky summary */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card className="border-2 card-stamp">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-display font-bold text-lg">Trip summary</h3>
                <div className="text-sm space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">Route</span>
                    <span className="font-medium text-right text-xs">
                      {origin?.label ?? "—"}
                      <ArrowRight className="size-3 mx-1 inline" />
                      {destination?.label ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Departure</span>
                    <span className="font-medium text-xs">
                      {form.watch("departureAt")
                        ? new Date(form.watch("departureAt")).toLocaleString("en-NG", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Seats</span>
                    <span className="font-medium">{form.watch("seatsTotal")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Per seat</span>
                    <span className="font-medium">{formatNGN(form.watch("pricePerSeat"))}</span>
                  </div>
                  {isRecurring && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Repeats</span>
                      <Badge variant="secondary" className="gap-1">
                        <Repeat className="size-3" />
                        {recurrenceDays.length} days/week
                      </Badge>
                    </div>
                  )}
                  {form.watch("femaleOnly") && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Women only</span>
                      <Badge variant="secondary" className="gap-1 bg-chart-4/15 text-chart-4">
                        <Venus className="size-3" />
                        Yes
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="border-t-2 border-border/30 pt-3 flex items-center justify-between">
                  <span className="text-sm font-medium">Potential total</span>
                  <span className="text-3xl font-display font-bold text-primary">
                    {formatNGN(form.watch("pricePerSeat") * form.watch("seatsTotal"))}
                  </span>
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-full font-semibold h-12 shadow-lg shadow-primary/20"
                >
                  {submitting ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      Publish trip
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  We keep 10% as platform commission.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </main>
  );
}
