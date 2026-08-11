"use client";

import { useState, useEffect } from "react";
import { Siren, X, Phone, MapPin, Send, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface SosButtonProps {
  bookingId?: string;
  tripId?: string;
  className?: string;
}

/**
 * Floating SOS / Panic button.
 * On click: opens a confirmation dialog with location capture + message.
 * On confirm: POST /api/safety/sos, which:
 *   - Logs the alert
 *   - Notifies all user's emergency contacts (mock SMS via Notification)
 *   - Notifies platform admins
 *   - If booking/trip context, includes driver + route info
 */
export function SosButton({ bookingId, tripId, className }: SosButtonProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [message, setMessage] = useState("");

  const captureLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("geo error", err),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  useEffect(() => {
    if (open) captureLocation();
  }, [open]);

  const trigger = async () => {
    setSending(true);
    try {
      await api.post(`/api/safety/sos`, {
        bookingId,
        tripId,
        lat: location?.lat,
        lng: location?.lng,
        message: message || "I feel unsafe. Please check on me.",
      });
      toast.success("SOS sent — emergency contacts and NaijaRide safety team have been alerted.");
      setOpen(false);
      setMessage("");
    } catch (err) {
      toast.error("Failed to send SOS. Call 112 or 199 directly.");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 size-16 rounded-full bg-destructive text-destructive-foreground shadow-2xl shadow-destructive/40 flex items-center justify-center font-bold gap-1 flex-col border-4 border-background animate-glow-pulse-destructive ${className ?? ""}`}
        aria-label="SOS — Send emergency alert"
      >
        <Siren className="size-5" />
        <span className="text-[10px] tracking-wider">SOS</span>
      </motion.button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-2 border-destructive/40 max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center">
                <ShieldAlert className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-destructive">Send SOS alert</DialogTitle>
                <DialogDescription>
                  This will alert your emergency contacts and NaijaRide&apos;s safety team with your live location.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-2xl bg-destructive/5 border-2 border-destructive/20 p-4 space-y-2">
              <p className="text-sm font-medium text-destructive">In immediate danger?</p>
              <p className="text-xs text-muted-foreground">
                Call <span className="font-bold">112</span> (Nigeria Emergency) or{" "}
                <span className="font-bold">199</span> (Police) directly. SOS alerts your network —
                but emergency services respond faster.
              </p>
              <div className="flex gap-2 pt-1">
                <a href="tel:112" className="flex-1">
                  <Button variant="destructive" size="sm" className="w-full gap-1 rounded-full">
                    <Phone className="size-3.5" /> Call 112
                  </Button>
                </a>
                <a href="tel:199" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1 rounded-full">
                    <Phone className="size-3.5" /> Call Police
                  </Button>
                </a>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Your location</Label>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                {location ? (
                  <Badge variant="secondary" className="gap-1">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Capturing…</span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={captureLocation}
                  className="ml-auto text-xs"
                >
                  Retry
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sos-msg">Message (optional)</Label>
              <Textarea
                id="sos-msg"
                placeholder="e.g. Driver took a different route, I feel unsafe"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => setOpen(false)}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-full gap-1.5"
                onClick={trigger}
                disabled={sending}
              >
                {sending ? (
                  <span className="size-4 rounded-full border-2 border-destructive-foreground/30 border-t-destructive-foreground animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {sending ? "Sending…" : "Send SOS now"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
