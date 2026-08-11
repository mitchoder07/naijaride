# NaijaRide 🚗

**Carpooling platform for Lagos/Abuja — built for Nigerian roads.**

Connects drivers and passengers travelling the same way. Save money, build community, and travel safely — with anti-kidnapping safety infrastructure built in.

---

## Quick start (local development)

### Prerequisites
- **[Bun](https://bun.sh/)** or Node.js 20+
- **[Git](https://git-scm.com/)**

### Steps

```bash
# 1. Unzip and enter the project
unzip naijaride.zip -d naijaride
cd naijaride

# 2. Install dependencies
bun install

# 3. Create a Neon PostgreSQL database (free)
#    Go to https://neon.tech → create project → copy connection string
#    Put it in .env:
echo 'DATABASE_URL="postgresql://user:pass@ep-xxx.aws.neon.tech/naijaride?sslmode=require"' > .env
echo 'NEXTAUTH_SECRET="'$(openssl rand -base64 32)'"' >> .env
echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env

# 4. Push the database schema
bun run db:push

# 5. Start the dev server
bun run dev
```

Open **http://localhost:3000** → click **Sign in** → **Try Demo** (Passenger/Driver/Admin)

---

## 🚀 Deploy to Vercel

Read **`DEPLOY-TO-VERCEL.md`** for the complete step-by-step guide.

The short version:
1. Create a Neon PostgreSQL database (free)
2. Create a Pusher Channels app for real-time chat (free)
3. Push to GitHub
4. Import on Vercel → add env vars → deploy
5. Visit `/api/demo/accounts` to seed demo data

---

## ✨ Features

### Core carpooling
- Map-based trip search (Leaflet + OpenStreetMap)
- Smart matching (Haversine distance + departure time scoring)
- Mock Paystack payments (ready for real keys)
- Real-time chat (Socket.io locally / Pusher on Vercel)
- Recurring trips, female-only rides, reviews & ratings
- Driver wallet with 10% platform commission

### 🛡️ Safety infrastructure (anti-kidnapping)
- Identity verification (NIN, license, plate, selfie, phone, email)
- Trust score (0-100) with color-coded badges
- SOS panic button (alerts emergency contacts + admins)
- Live trip sharing with tokenized links
- Block & report system with incident escalation
- Female-only rides for women's safety

### Platform
- Admin dashboard (GMV, commission, top routes, users)
- Demo accounts (one-click Passenger/Driver/Admin)
- Push notifications via service worker
- Light + dark mode

---

## 🛠️ Tech stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Database:** Prisma ORM + PostgreSQL (Neon)
- **Auth:** NextAuth.js v4
- **Real-time:** Pusher (production) / Socket.io (local dev only)
- **Maps:** react-leaflet + Leaflet
- **State:** Zustand + TanStack Query
- **Animations:** Framer Motion

---

Built with ❤️ for Nigerian roads.
