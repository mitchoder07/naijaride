"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Star, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

const schema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

export function ReviewModal({
  open,
  bookingId,
  onClose,
}: {
  open: boolean;
  bookingId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0 },
  });

  const submit = async () => {
    if (rating < 1) {
      toast.error("Please choose a rating");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/reviews`, { bookingId, rating, comment });
      toast.success("Thanks for your review!");
      qc.invalidateQueries({ queryKey: ["trip-detail"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setRating(0);
      setComment("");
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit review",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How was your trip?</DialogTitle>
          <DialogDescription>
            Your feedback helps other passengers and rewards good drivers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.button
                key={i}
                type="button"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRating(i)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(0)}
                className="p-1"
                aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
              >
                <Star
                  className={
                    "size-9 transition-colors " +
                    (i <= (hovered || rating)
                      ? "fill-primary text-primary"
                      : "fill-accent text-muted-foreground")
                  }
                />
              </motion.button>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Tell us more (optional)
            </label>
            <Textarea
              placeholder="What went well? What could be better?"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>
          <Button
            onClick={submit}
            disabled={submitting || rating < 1}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit review"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
