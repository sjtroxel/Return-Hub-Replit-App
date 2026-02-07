# ReturnHub - Return Tracking Dashboard

## Overview
ReturnHub is a unified, urgency-driven return tracking dashboard that protects shoppers' money through automated deadline monitoring. Users can track return windows across all retailers with countdown alerts.

## Architecture
- **Frontend**: React 18 + Vite, Tailwind CSS, shadcn/ui components, wouter routing
- **Backend**: Express 5, Custom JWT authentication, PostgreSQL via Drizzle ORM
- **Auth**: Custom JWT in HttpOnly cookies, bcrypt (12 rounds), 7-day expiry with auto-refresh
- **Notifications**: react-hot-toast (top-center desktop, bottom-center mobile)

## Project Structure
```
client/src/
  App.tsx              - Main app with routing, auth, theme providers
  lib/auth.tsx         - Auth context provider (login/signup/logout/me)
  lib/theme.tsx        - Theme context (light/dark/system with localStorage)
  lib/queryClient.ts   - TanStack Query client with apiRequest helper
  components/
    app-sidebar.tsx    - Desktop sidebar with navigation
    mobile-nav.tsx     - Bottom navigation for mobile
    theme-toggle.tsx   - Light/dark/system toggle dropdown
    countdown-badge.tsx - Urgency countdown badges (color-coded)
    return-card.tsx    - Return item card with skeleton loader
    add-return-dialog.tsx - Dialog form to add new returns
  pages/
    login.tsx          - Login page
    signup.tsx         - Signup page
    dashboard.tsx      - Main dashboard with stats, search, filter, returns grid

server/
  index.ts             - Express server setup
  routes.ts            - API routes (auth + returns CRUD)
  storage.ts           - Database storage interface
  db.ts                - Drizzle/PostgreSQL connection
  auth.ts              - JWT helpers, middleware, password hashing
  seed.ts              - Test user + sample data seeding

shared/
  schema.ts            - Drizzle schema, Zod validation schemas, types
```

## Key Features
- Custom JWT auth (signup/login/logout)
- Dashboard with return tracking cards
- Countdown badges (green/yellow/orange/red based on urgency)
- Stats summary (total owed, urgent, active, refunded)
- Search and status filtering
- Dark/light/system theme toggle
- Responsive: sidebar on desktop, bottom nav on mobile
- Test user: test@example.com / password123

## Theme
- Light: #F8F9FA background, white cards
- Dark: #1a1a2e background, dark cards with accent borders
- Primary: Deep navy (#000050)
- Accent: Orange (#ff6d0d) for urgency indicators
- Fonts: Inter (UI), Poppins (numbers/amounts)

## Database
- PostgreSQL with Drizzle ORM
- Tables: users, returns
- Returns have 30-day deadline computed from purchase_date
- Row-level security: all queries filtered by user_id from JWT

## Recent Changes
- Initial build: Feb 6, 2026
