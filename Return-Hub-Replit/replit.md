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
    return-card.tsx    - Return item card with progress bar, urgency styling, status toggle, delete, click-to-edit
    add-return-dialog.tsx - Create/edit return modal (shared form)
    delete-confirm-dialog.tsx - Delete confirmation modal
  utils/
    notifications.ts   - Browser notification system (daily 9am check, grouped alerts)
  pages/
    login.tsx          - Login page
    signup.tsx         - Signup page
    dashboard.tsx      - Main dashboard with stats, search, filter chips, sort, urgent section, returns grid

server/
  index.ts             - Express server setup
  routes.ts            - API routes (auth + returns CRUD + delete)
  storage.ts           - Database storage interface (includes deleteReturn)
  db.ts                - Drizzle/PostgreSQL connection
  auth.ts              - JWT helpers, middleware, password hashing
  seed.ts              - Test user + sample data seeding

shared/
  schema.ts            - Drizzle schema, Zod validation schemas, types
```

## Key Features
- Custom JWT auth (signup/login/logout) + one-click demo mode
- Landing page with hero, feature cards, Try Demo/Login/Sign Up CTAs
- Dashboard with return tracking cards
- Progress bars that drain from 100% → 0% as deadline approaches (green/yellow/red gradient)
- Human-readable time strings ("Tomorrow at Midnight", "Due Friday", "Expired 3 days ago")
- Countdown badges (green/yellow/orange/red based on urgency, "Due today" for day-of)
- Urgent returns (≤3 days) auto-float to top with pulsing red border animation
- Visual divider ("Other Returns") separates urgent from normal returns
- Browser notification system: daily 9am alerts for urgent returns, permission banner
- Enhanced Urgent stat card with pulsing alert icon when count > 0
- Stats summary (total owed, urgent, active, refunded) — uses computed status (excludes expired)
- Search by store/item name
- Filter chips: All / Pending / Shipped / Refunded / Expired (with counts)
- Sort dropdown: Deadline soonest, Price highest, Date newest
- Click card to edit (reuses add-return form in edit mode)
- Status toggle: Pending → Shipped → Refunded (linear progression, refunded is final)
- Delete with confirmation modal
- Dark/light/system theme toggle
- Responsive: sidebar on desktop, bottom nav on mobile
- Test user: test@example.com / password123

## API Routes
- POST /api/auth/signup - Create account
- POST /api/auth/login - Login
- POST /api/auth/logout - Logout
- GET /api/auth/me - Current user
- GET /api/returns - List user's returns
- POST /api/returns - Create return (validated: price > 0, max lengths, no future dates)
- PUT /api/returns/:id - Update return (ownership check, linear status progression)
- DELETE /api/returns/:id - Delete return (ownership check)

## Progress Bar Logic
- getProgressData(): calculates % remaining based on purchase date → deadline
- Color thresholds: green (<50% elapsed), yellow (50-75%), red (75%+)
- Gray 100% bar for refunded, 0% red bar for expired
- totalDays guarded against zero (Math.max(1, ...))
- ARIA: role="progressbar", aria-valuenow, aria-valuemin=0, aria-valuemax=100

## Human Time Strings
- getHumanTime(): returns context-aware time description
- 0 days: "Due Today - Last Chance!", 1 day: "Tomorrow at Midnight"
- 2-3 days: "Due {weekday} ({n} days)", 4-7 days: "Due {weekday}"
- 8-14 days: "Ends {date} ({n} days)", 15+: "Ends {full date}"
- Expired: "Expired {n} days ago", Refunded: "Refund received"
- Shipped: "In transit - awaiting refund"

## Urgency System
- Urgent = daysLeft >= 0 && daysLeft <= 3 && not refunded && not expired
- Urgent cards: pulsing red border (animate-pulse-border, ring-2 ring-red-500)
- Auto-sorted to top, dashed divider between urgent and non-urgent
- Pulse animation respects prefers-reduced-motion

## Browser Notifications
- Permission banner on first visit (dismissible, persists in localStorage)
- Daily 9am check via startNotificationWatcher (1-hour interval)
- Grouped notifications for multiple urgent returns (max 3 stores listed)
- Single notification per day (tracked via notification-last-sent in localStorage)
- Visibility change handler re-checks on tab focus

## Expired Logic
- "Expired" is a computed status, never stored in DB
- A return is expired when: returnDeadline < today AND status IN (pending, shipped)
- getComputedStatus() in return-card.tsx is the single source of truth
- Stats (totalOwed, active) exclude expired returns
- Filter chips count expired separately

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
- Feature 4: Instant Demo Engine - Feb 10, 2026
  - POST /api/auth/demo creates guest accounts with 5 auto-seeded returns
  - Seeded returns: Nike Sneakers (urgent), Coffee Maker (refunded), Kitchen Mixer, Wireless Earbuds, Gaming Mouse
  - JWT session auto-login, rate limiting (5 per 15min)
  - Background cleanup every 60min for guest accounts >48 hours old
  - Guest deletion on logout (only the current guest, not all guests)
  - Landing page at / with hero, feature cards, Try Demo/Login/Sign Up CTAs
  - Demo mode badge and dismissible banner on dashboard
  - Guest email format: guest_{timestamp}@demo.com
  - Database index idx_users_guest_created for efficient cleanup queries
- Feature 3: Visual Countdown & Urgency System - Feb 7, 2026
  - Progress bars with gradient fills (green/yellow/red) draining from 100% → 0%
  - Human-readable time strings ("Tomorrow at Midnight", "Due Friday", etc.)
  - Urgent cards (≤3 days) auto-float to top with pulsing red border
  - Visual divider "Other Returns" between urgent and non-urgent sections
  - Browser notification permission banner with Enable/Dismiss
  - Notification watcher: daily 9am alerts for urgent returns
  - Enhanced Urgent stat card: pulsing alert icon, red text, action subtext
  - pulse-border animation in tailwind config, reduced-motion support
  - ARIA accessibility on progress bars
- Feature 2: Advanced Dashboard Controls & Return Management - Feb 7, 2026
  - Filter chips with counts, sort dropdown, search
  - Click-to-edit cards, status progression, delete with confirmation
  - Fixed expired logic (computed status, aligned across stats/filters/badges)
  - Added DELETE /api/returns/:id, enhanced PUT with linear status validation
- Feature 1: Enhanced Manual Return Entry Form - Feb 6, 2026
  - Custom modal with glass-morphism backdrop, mobile bottom sheet
  - Auto-focus, $ prefix, live deadline preview, validation
- Initial build: Feb 6, 2026
