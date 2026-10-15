# NaijaRide 🚗

**Carpooling platform for Lagos/Abuja — built for Nigerian roads.**

Connects drivers and passengers travelling the same way. Save money, build community, and travel safely, with anti-kidnapping safety infrastructure built in.

## Features

### Core carpooling
- Map-based trip search (Leaflet + OpenStreetMap)
- Smart matching (Haversine distance + departure time scoring)
- Mock Paystack payments (ready for real keys)
- Real-time chat (Socket.io locally / Pusher on Vercel)
- Recurring trips, female-only rides, reviews & ratings
- Driver wallet with 10% platform commission

### Safety infrastructure (anti-kidnapping)
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

Betul Betul Betul
