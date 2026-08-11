"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Send,
  Circle,
  Car,
  Phone,
  Calendar,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigation } from "@/lib/store";
import { api, formatTime, formatDate } from "@/lib/api";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import { SosButton } from "@/components/safety/sos-button";

interface BookingForChat {
  id: string;
  status: string;
  trip: {
    id: string;
    originLabel: string;
    destinationLabel: string;
    departureAt: string;
    driver: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
      phone: string | null;
    };
  };
  isPassenger: boolean;
  counterpart: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

const POLL_INTERVAL = 2000; // 2 seconds

export function ChatView({ bookingId }: { bookingId: string }) {
  const { navigate, back } = useNavigation();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const listRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);

  const { data, isLoading: bookingLoading } = useQuery({
    queryKey: ["booking-chat", bookingId],
    enabled: !!bookingId && isAuthenticated,
    queryFn: () =>
      api.get<{ booking: BookingForChat }>(`/api/bookings/${bookingId}`),
  });
  const booking = data?.booking;

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Fetch messages from the server
  const fetchMessages = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await api.get<{ messages: ChatMessage[] }>(
        `/api/bookings/${bookingId}/messages`
      );
      setMessages(res.messages);
      setConnected(true);
    } catch (err) {
      console.error("[chat] fetch error", err);
      setConnected(false);
    }
  }, [bookingId]);

  // Poll for new messages every 2 seconds
  useEffect(() => {
    if (!bookingId || !user?.id) return;

    // Initial fetch
    fetchMessages().then(() => {
      requestAnimationFrame(scrollToBottom);
    });

    // Set up polling
    const interval = setInterval(fetchMessages, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [bookingId, user?.id, fetchMessages, scrollToBottom]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    requestAnimationFrame(scrollToBottom);
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await api.post("/api/messages", { bookingId, text: trimmed });
      setText("");
      // Immediately fetch new messages (don't wait for next poll cycle)
      setTimeout(fetchMessages, 200);
    } catch (err) {
      toast.error("Failed to send message");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (isLoading || bookingLoading) {
    return (
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <Skeleton className="h-16 mb-4" />
        <Skeleton className="h-96" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={Car}
        title="Sign in to chat"
        action={
          <Button
            onClick={() => navigate("signin")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </Button>
        }
      />
    );
  }

  if (!booking) {
    return (
      <EmptyState
        icon={Car}
        title="Booking not found"
        description="This booking may have been cancelled."
        action={<Button onClick={() => navigate("bookings")}>Back to bookings</Button>}
      />
    );
  }

  const isMe = (senderId?: string) => senderId === user?.id;

  return (
    <main className="container mx-auto px-4 py-4 md:py-6 max-w-3xl">
      <div className="flex flex-col h-[calc(100vh-9rem)] md:h-[calc(100vh-7rem)] rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/60 bg-background flex items-center gap-3">
          <button
            onClick={back}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </button>
          <UserAvatar
            name={booking.counterpart.name}
            avatarUrl={booking.counterpart.avatarUrl}
            className="size-10"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">
              {booking.counterpart.name ?? "User"}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Circle
                className={`size-2 ${connected ? "fill-green-500 text-green-500" : "fill-muted text-muted"}`}
              />
              {connected ? "Live" : "Connecting..."}
            </p>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {booking.isPassenger ? "Passenger" : "Driver"}
          </Badge>
        </div>

        {/* Trip banner */}
        <button
          onClick={() => navigate("trip-detail", { id: booking.trip.id })}
          className="px-4 py-2.5 border-b border-border/60 bg-accent/30 text-left hover:bg-accent/50 transition"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {booking.trip.originLabel} →{" "}
                <span className="text-primary">
                  {booking.trip.destinationLabel}
                </span>
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {formatDate(booking.trip.departureAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatTime(booking.trip.departureAt)}
                </span>
              </p>
            </div>
            {booking.trip.driver.phone && (
              <a
                href={`tel:${booking.trip.driver.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 hover:bg-primary/20"
                aria-label="Call driver"
              >
                <Phone className="size-4" />
              </a>
            )}
          </div>
        </button>

        {/* Messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-warm"
        >
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">
              No messages yet. Say hello! 👋
            </div>
          )}
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe(m.senderId) ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                    isMe(m.senderId)
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  {!isMe(m.senderId) && m.sender?.name && (
                    <p className="text-[10px] font-semibold text-primary mb-0.5">
                      {m.sender.name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {m.text}
                  </p>
                  <p
                    className={`text-[10px] mt-0.5 ${
                      isMe(m.senderId) ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}
                  >
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="p-3 border-t border-border/60 bg-background flex items-center gap-2"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="rounded-full flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!text.trim() || sending}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 size-10"
            aria-label="Send"
          >
            {sending ? (
              <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
      </div>
      <SosButton bookingId={bookingId} tripId={booking.trip.id} />
    </main>
  );
}
