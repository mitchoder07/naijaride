import Pusher from "pusher";

if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET) {
  throw new Error("Missing Pusher environment variables. Check your .env file.");
}

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// These are public values — safe to expose to the browser
export const PUSHER_KEY = process.env.PUSHER_KEY!;
export const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER!;