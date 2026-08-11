# NaijaRide — Complete Deployment Guide

## From zero to live on Vercel with Neon PostgreSQL

This guide walks you through every single step — from unzipping the code to having a live website on the internet. Don't skip any step.

---

## What you'll need before starting

1. **A computer** with terminal access (Windows PowerShell, Mac Terminal, or Linux)
2. **[Bun](https://bun.sh/)** installed (Node.js also works, but Bun is faster)
3. **A GitHub account** — [github.com](https://github.com) (free)
4. **A Vercel account** — [vercel.com](https://vercel.com) (free, sign in with GitHub)
5. **A Neon account** — [neon.tech](https://neon.tech) (free, no credit card needed)
6. **A Pusher account** — [pusher.com](https://pusher.com) (free, for real-time chat)
7. **[Git](https://git-scm.com/)** installed on your computer

That's it. Total cost: ₦0. All services have free tiers that handle hundreds of users.

---

## Step 1: Unzip the project

### 1.1 Download the zip
Download `naijaride.zip` from the live preview (visit `/naijaride.zip` in your browser).

### 1.2 Unzip it

**On Windows:**
```powershell
# Open PowerShell
Expand-Archive -Path "naijaride.zip" -DestinationPath "C:\Users\YourName\naijaride"
cd C:\Users\YourName\naijaride
```

**On Mac/Linux:**
```bash
unzip naijaride.zip -d naijaride
cd naijaride
```

### 1.3 Open in VS Code
```bash
code .
```
Or open VS Code → File → Open Folder → select the `naijaride` folder.

### 1.4 Delete the zip from public folder
Before deploying, you need to remove the zip file from the project so it doesn't get served on your live site:
```bash
rm public/naijaride.zip
```

---

## Step 2: Install dependencies

### 2.1 Install Bun (if you don't have it)

**Mac/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows (PowerShell):**
```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

Verify it's installed:
```bash
bun --version
```
You should see something like `1.1.x`.

### 2.2 Install project dependencies

In your terminal, inside the `naijaride` folder:
```bash
bun install
```

This installs all the packages listed in `package.json` (Next.js, React, Prisma, Tailwind, shadcn/ui, etc.). It takes about 30 seconds.

You'll see a `node_modules/` folder appear — that's where all the packages went.

---

## Step 3: Set up Neon (PostgreSQL database)

### 3.1 Create a Neon account
1. Go to [neon.tech](https://neon.tech)
2. Click **"Sign up"** → sign up with GitHub or Google
3. No credit card needed

### 3.2 Create a new project
1. Click **"New Project"**
2. **Project name:** `naijaride`
3. **Database name:** `naijaride` (default)
4. **Region:** Pick the one closest to your users:
   - `AWS AP Southeast 1 (Singapore)` — best for Nigeria
   - `AWS US East 1 (N. Virginia)` — also fine
5. **Postgres version:** 17 (default)
6. Click **"Create project"**

### 3.3 Copy your connection string
After creating the project, Neon shows you a page with a connection string. It looks like:
```
postgresql://USERNAME:PASSWORD@HOSTNAME/DATABASE?sslmode=require
```

**Copy this entire string.** You'll need it in Steps 4 and 9.

> ⚠️ **Keep this string private.** It contains your database password. Never commit it to GitHub.

### 3.4 Create your .env file
In your project root, create a file called `.env` (no filename before the dot):
```bash
# Mac/Linux
touch .env

# Windows PowerShell
New-Item .env -ItemType File
```

Open `.env` in VS Code and paste this in, replacing the values with your actual Neon connection string:

```env
# Your Neon PostgreSQL connection string (from Step 3.3)
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOSTNAME/DATABASE?sslmode=require"

# Generate a random secret (see Step 3.5 below)
NEXTAUTH_SECRET="your-generated-secret-here"

# For local development
NEXTAUTH_URL="http://localhost:3000"
```

### 3.5 Generate the NEXTAUTH_SECRET
Open a new terminal and run:
```bash
openssl rand -base64 32
```

You'll get output like:
```
K7x9mP2vQ8rT4wY6aB3nC5dF1gH2jK4lM6nO8pQ0rS2tU4vW6xY8zA0bC2dE4fG6h
```

Copy that string and paste it as your `NEXTAUTH_SECRET` value in `.env`.

> **Windows note:** If `openssl` isn't available, use this PowerShell command instead:
> ```powershell
> [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
> ```

### 3.6 Push the database schema
Now create all the tables (User, Trip, Booking, Safety models, etc.) in your Neon database:

```bash
bun run db:push
```

You should see:
```
🚀  Your database is now in sync with your Prisma schema.
```

This creates ~15 tables in your Neon database. You can verify by going to your Neon dashboard → "Tables" tab — you'll see User, Trip, Booking, Message, Review, WalletTransaction, Verification, EmergencyContact, SafetyIncident, Block, TripShare, SosAlert, NotificationLog, etc.

### 3.7 Generate the Prisma Client
```bash
bun run db:generate
```

This creates the TypeScript client that lets your code talk to the database.

---

## Step 4: Test locally

### 4.1 Start the dev server
```bash
bun run dev
```

You should see:
```
▲ Next.js 16.1.3 (Turbopack)
- Local:        http://localhost:3000
✓ Ready in 649ms
```

### 4.2 Open the app
Open your browser to **http://localhost:3000**

You should see the NaijaRide landing page with:
- Hero section "Share the road. Share the journey."
- Popular routes (Lagos → Abuja, etc.)
- "How it works" 3-step section
- "Available trips now" (may be empty since DB is fresh)

### 4.3 Seed demo data
Open this URL in your browser:
```
http://localhost:3000/api/demo/accounts
```

This creates 4 demo accounts + 4 demo trips + verifications + emergency contacts. You'll see JSON output with the demo credentials.

### 4.4 Test the demo accounts
Go back to http://localhost:3000 → click **"Sign in"** (top-right) → under "Try NaijaRide as a demo user", click:

- **Passenger** → see the rider dashboard
- **Driver** → see the driver dashboard with pre-loaded trips
- **Admin** → see the admin dashboard with GMV chart

Test these features:
1. **Find a ride** → drop pins on the maps → search → see matching trips
2. **Safety Center** → click "Safety" in navbar → verify NIN, add emergency contacts, test SOS button
3. **Sign out** → click avatar → sign out → should redirect to landing

### 4.5 Start the chat service (for real-time messaging)

Open a **second terminal** (keep the first one running `bun run dev`):

```bash
cd mini-services/chat-service
bun install
mkdir -p prisma
cp ../../prisma/schema.prisma prisma/
DATABASE_URL="postgresql://your-neon-connection-string-here" bunx prisma generate
bun run dev
```

You should see:
```
[chat-service] listening on :3003
```

Now test: sign in as passenger in one browser, sign in as driver in another (incognito), book a trip, open chat, send messages back and forth.

### 4.6 Stop the servers
When you're done testing, press `Ctrl+C` in both terminals.

---

## Step 5: Set up Pusher (for real-time chat on Vercel)

> **Why:** Vercel can't run the separate chat service on port 3003 (it's a serverless platform, not a long-running server). Pusher is a managed service that handles real-time messaging for you.

### 5.1 Create a Pusher account
1. Go to [pusher.com](https://pusher.com)
2. Sign up (free, no credit card)
3. Click **"Get Started"** → **"Channels"** (not Beams)

### 5.2 Create a Channels app
1. **App name:** `naijaride`
2. **Cluster:** `ap1` (Singapore) or `us2` (US East) — pick the one closest to your Neon region
3. Click **"Create app"**

### 5.3 Copy your API keys
On the **"App Keys"** tab, you'll see 4 values:
- `app_id` (e.g. `1234567`)
- `key` (e.g. `a1b2c3d4e5f6g7h8i9j0`)
- `secret` (e.g. `k1l2m3n4o5p6q7r8s9t0`)
- `cluster` (e.g. `ap1`)

**Copy all 4 values.** You'll need them in Steps 5.4 and 9.

### 5.4 Install the Pusher packages
In your main project terminal (not the chat-service one):
```bash
bun add pusher pusher-js
```

### 5.5 Create the Pusher server file
Create a new file at `src/lib/pusher.ts`:
```typescript
import Pusher from "pusher";

if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET) {
  throw new Error("Missing Pusher environment variables");
}

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export const PUSHER_KEY = process.env.PUSHER_KEY!;
export const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER!;
```

### 5.6 Update the messages API to use Pusher
Open `src/app/api/messages/route.ts` and replace its entire contents with:
```typescript
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { pusher } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { bookingId, text } = body;

    const trimmed = (text ?? "").trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const message = await db.message.create({
      data: { bookingId, senderId: user.id, text: trimmed },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });

    // Broadcast via Pusher (replaces Socket.io)
    await pusher.trigger(`booking-${bookingId}`, "chat:message", { message });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[messages POST]", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
```

### 5.7 Update the chat view to use Pusher
Open `src/components/views/chat-view.tsx` and find the Socket.io connection code (around line 70-90). Replace it with:

```typescript
// At the top of the file, replace:
// import { io, Socket } from "socket.io-client";
// with:
import Pusher from "pusher-js";

// In the useEffect that connects to socket, replace with:
useEffect(() => {
  if (!bookingId || !user?.id) return;

  const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });

  const channel = pusher.subscribe(`booking-${bookingId}`);
  channel.bind("chat:message", (data: { message: ChatMessage }) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === data.message.id)) return prev;
      return [...prev, data.message];
    });
  });

  // Load history
  api.get<{ messages: ChatMessage[] }>(`/api/bookings/${bookingId}/messages`)
    .then((res) => setMessages(res.messages))
    .catch(console.error);

  return () => {
    pusher.unsubscribe(`booking-${bookingId}`);
  };
}, [bookingId, user?.id]);

// Replace the send function with:
const sendMessage = async () => {
  const trimmed = text.trim();
  if (!trimmed) return;
  try {
    await api.post("/api/messages", { bookingId, text: trimmed });
    setText(""); // Pusher will broadcast back — no need to update state manually
  } catch (err) {
    toast.error("Failed to send message");
    console.error(err);
  }
};
```

### 5.8 Add Pusher env vars to your .env
Append these to your `.env` file (replace with your actual Pusher keys):
```env
# Pusher (for real-time chat)
PUSHER_APP_ID="1234567"
PUSHER_KEY="a1b2c3d4e5f6g7h8i9j0"
PUSHER_SECRET="k1l2m3n4o5p6q7r8s9t0"
PUSHER_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_KEY="a1b2c3d4e5f6g7h8i9j0"
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
```

### 5.9 Delete the Socket.io chat service
You no longer need it:
```bash
rm -rf mini-services/chat-service
```

### 5.10 Test locally with Pusher
```bash
bun run dev
```
Open http://localhost:3000 → sign in as passenger → sign in as driver in incognito → book a trip → open chat → send messages. Should work via Pusher now.

---

## Step 6: Push to GitHub

### 6.1 Initialize Git
```bash
git init
```

### 6.2 Create .gitignore (already exists, but verify)
Make sure your `.gitignore` includes:
```
node_modules
.next
.env
*.db
.vercel
```

### 6.3 Add all files
```bash
git add .
```

### 6.4 Commit
```bash
git commit -m "NaijaRide — production-ready with PostgreSQL + Pusher"
```

### 6.5 Create a GitHub repository
1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `naijaride`
3. **Description:** "Carpooling platform for Lagos/Abuja"
4. **Private or Public** — your choice
5. **Don't** check "Add README" — you already have one
6. Click **"Create repository"**

### 6.6 Connect and push
GitHub will show you commands. Run these:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/naijaride.git
git push -u origin main
```

When prompted, enter your GitHub username and personal access token (not password). If you don't have a token:
1. GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Generate new token → check `repo` scope → copy the token
3. Use that token as your password

### 6.7 Verify
Go to `https://github.com/YOUR_USERNAME/naijaride` — you should see all your files.

> ⚠️ **Important:** Make sure `.env` is NOT in your GitHub repo. Check: `https://github.com/YOUR_USERNAME/naijaride/blob/main/.env` — if it exists, your `.gitignore` is broken.

---

## Step 7: Deploy to Vercel

### 7.1 Import to Vercel
1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. Click **"Add New"** → **"Project"**
3. Find `naijaride` in the list → click **"Import"**

### 7.2 Configure build settings
Vercel auto-detects Next.js. **Don't change any build settings.**

### 7.3 Add environment variables
**Before clicking Deploy**, expand the **"Environment Variables"** section. Add each of these:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Neon connection string (from Step 3.3) |
| `NEXTAUTH_SECRET` | The secret you generated (from Step 3.5) |
| `NEXTAUTH_URL` | Leave empty for now — you'll update after first deploy |
| `PUSHER_APP_ID` | From Pusher dashboard |
| `PUSHER_KEY` | From Pusher dashboard |
| `PUSHER_SECRET` | From Pusher dashboard |
| `PUSHER_CLUSTER` | e.g. `ap1` |
| `NEXT_PUBLIC_PUSHER_KEY` | Same value as `PUSHER_KEY` |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Same value as `PUSHER_CLUSTER` |

> ⚠️ **Make sure** to select "Production", "Preview", AND "Development" environments for each variable (checkboxes appear when adding).

### 7.4 Deploy
Click **"Deploy"**. Vercel builds for ~2-3 minutes.

You'll see a live build log. Watch for:
- ✅ `Running build command: next build`
- ✅ `Creating an optimized production build`
- ✅ `Compiled successfully`
- ✅ `Build completed`

If it fails, check the error — most likely a missing env var or a typo in the DATABASE_URL.

### 7.5 Get your URL
After successful deploy, Vercel gives you a URL like:
```
https://naijaride-xxx.vercel.app
```

**Copy this URL.**

### 7.6 Update NEXTAUTH_URL
1. Go to Vercel → your project → **Settings** → **Environment Variables**
2. Find `NEXTAUTH_URL` → edit it → set value to your Vercel URL:
   ```
   https://naijaride-xxx.vercel.app
   ```
3. Click **Save**
4. Go to **Deployments** tab → click the 3 dots on latest deployment → **Redeploy**

### 7.7 Push the database schema to production
Your Neon database already has the schema (from Step 3.6). But if you made any changes, push them:
```bash
# Run locally
bun run db:push
```

### 7.8 Seed the production database
Visit this URL in your browser:
```
https://naijaride-xxx.vercel.app/api/demo/accounts
```

You'll see JSON with the demo credentials. This creates:
- 4 demo users (passenger, driver, female driver, admin)
- 4 demo trips
- 6 verifications for each driver
- Emergency contacts

---

## Step 8: Test the live site

### 8.1 Open the live URL
```
https://naijaride-xxx.vercel.app
```

### 8.2 Test the demo flows
1. Click **"Sign in"** → click **"Passenger"** demo button
2. Should redirect to dashboard with "Welcome, Demo"
3. Click **"Find a ride"** → drop pins on maps → search → see trips
4. Click **"Safety"** → verify NIN → add emergency contact → test SOS
5. Sign out → should redirect to landing

### 8.3 Test chat
1. Open the live URL in Chrome → sign in as passenger
2. Open the live URL in Firefox/Incognito → sign in as driver
3. As driver → find your trip → wait for passenger to book
4. As passenger → book the trip → open chat → send a message
5. As driver → see the message appear in real-time (via Pusher)

### 8.4 Test admin
1. Sign out
2. Sign in as admin → should see admin dashboard
3. Check GMV chart, recent trips, recent bookings, newest users

---

## Step 9: Optional — Add real Paystack payments

### 9.1 Sign up for Paystack
1. Go to [paystack.com](https://paystack.com)
2. Create a business account (free)
3. Verify your business (they'll ask for CAC docs or similar)

### 9.2 Get your API keys
1. Dashboard → **Settings** → **API Keys & Webhooks**
2. Copy your **Test Secret Key** (a test secret key)
3. Copy your **Test Public Key** (a test public key)

### 9.3 Add to Vercel
Go to Vercel → Settings → Environment Variables:
| Name | Value |
|------|-------|
| `PAYSTACK_SECRET_KEY` | the test secret key |
| `NEXT_PUBLIC_PAYSTACK_KEY` | the test public key |

Redeploy.

### 9.4 Update the payment route
Open `src/app/api/bookings/[id]/pay/route.ts` and replace the mock payment with a real Paystack Initialize Transaction call. See [Paystack docs](https://paystack.com/docs/payments/accept-payments) for the exact code.

### 9.5 Set up webhook
1. In Paystack dashboard → Settings → API Keys & Webhooks → **Add Webhook URL**
2. URL: `https://naijaride-xxx.vercel.app/api/paystack/webhook`
3. Create the webhook route at `src/app/api/paystack/webhook/route.ts` to verify Paystack signatures and confirm bookings

---

## Step 10: Optional — Custom domain

### 10.1 Buy a domain
Buy `naijaride.com.ng` from [Whogohost](https://whogohost.com), [DomainKing](https://domainking.ng), or [Namecheap](https://namecheap.com). ~₦3,000/year.

### 10.2 Add to Vercel
1. Vercel → your project → **Settings** → **Domains**
2. Click **"Add"** → enter `naijaride.com.ng`
3. Click **"Add"**

### 10.3 Update DNS
Vercel shows you DNS records to add. Go to your domain registrar's DNS panel and add:

**A record (for apex domain):**
- **Name/Host:** `@`
- **Value:** `76.76.21.21`
- **TTL:** Automatic

**CNAME record (for www):**
- **Name/Host:** `www`
- **Value:** `cname.vercel-dns.com`
- **TTL:** Automatic

### 10.4 Wait for DNS propagation
Takes 5 minutes to 24 hours. Check with:
```bash
dig naijaride.com.ng
```

### 10.5 Update NEXTAUTH_URL
Once DNS is live, update `NEXTAUTH_URL` in Vercel env vars to:
```
https://naijaride.com.ng
```
Redeploy.

### 10.6 Update Paystack webhook
Update the webhook URL in Paystack dashboard to:
```
https://naijaride.com.ng/api/paystack/webhook
```

---

## Troubleshooting

### "Prisma Client did not initialize yet"
```bash
bun run db:generate
```
Then redeploy on Vercel.

### "Database connection failed"
- Check `DATABASE_URL` is set in Vercel env vars
- Make sure `?sslmode=require` is at the end of the connection string
- Verify your Neon project is active (not suspended — free tier suspends after 5 days of inactivity)

### Chat doesn't work on Vercel
Make sure you completed Step 5 (Pusher setup). Socket.io cannot run on Vercel.

### Login fails
- Check `NEXTAUTH_URL` matches your exact Vercel URL (no trailing slash, no http — must be https)
- Check `NEXTAUTH_SECRET` is set and is a long random string

### Maps don't load
Leaflet uses OpenStreetMap tiles (free, no API key). If maps are gray, check browser console for CSP errors. They should work everywhere.

### "Failed to submit verification"
This was a Zod v4 bug — it's fixed in this version. If you still see it, make sure your code has `parsed.success` (not `parsed.success()`) in the safety API routes.

### Build fails on Vercel
Check the build log. Common causes:
- Missing env vars → add them in Vercel Settings
- TypeScript errors → the project has `typescript.ignoreBuildErrors: true` in next.config.ts, so this shouldn't happen
- Package not installed → run `bun install` locally and commit `bun.lock`

### Push fails with "secret scanning" error
GitHub blocks pushes that look like they contain API keys. If this happens:
1. Find the flagged file (GitHub tells you which file and line)
2. Replace the fake key with a placeholder like `YOUR_API_KEY_HERE`
3. Commit and push again

---

## Quick reference: all environment variables

| Variable | Where to get it | Required? |
|----------|-----------------|-----------|
| `DATABASE_URL` | Neon dashboard | ✅ Yes |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | ✅ Yes |
| `NEXTAUTH_URL` | Your Vercel URL | ✅ Yes |
| `PUSHER_APP_ID` | Pusher dashboard | ✅ Yes (for chat) |
| `PUSHER_KEY` | Pusher dashboard | ✅ Yes |
| `PUSHER_SECRET` | Pusher dashboard | ✅ Yes |
| `PUSHER_CLUSTER` | Pusher dashboard (e.g. `ap1`) | ✅ Yes |
| `NEXT_PUBLIC_PUSHER_KEY` | Same as `PUSHER_KEY` | ✅ Yes |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Same as `PUSHER_CLUSTER` | ✅ Yes |
| `PAYSTACK_SECRET_KEY` | Paystack dashboard | ❌ Optional (mock works) |
| `NEXT_PUBLIC_PAYSTACK_KEY` | Paystack dashboard | ❌ Optional |

---

## Demo accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Passenger | `demo@naijaride.demo` | `demo1234` |
| Driver | `driver@naijaride.demo` | `demo1234` |
| Female Driver | `ada@naijaride.demo` | `demo1234` |
| Admin | `admin@naijaride.demo` | `demo1234` |

---

## File structure

```
naijaride/
├── prisma/
│   └── schema.prisma              # PostgreSQL database schema
├── src/
│   ├── app/
│   │   ├── api/                  # All API routes
│   │   ├── globals.css           # Design system
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Single-route SPA
│   ├── components/                # UI components
│   │   ├── views/                # 15 view components
│   │   ├── safety/               # SOS button, trust badges
│   │   └── ui/                   # shadcn/ui library
│   ├── lib/                      # Utilities (db, auth, api, trust)
│   └── hooks/                    # React hooks
├── public/                       # Static assets
├── package.json
├── .env                          # Your local env vars
├── .gitignore
└── README.md
```

---

Built with ❤️ for Nigerian roads. Good luck!
