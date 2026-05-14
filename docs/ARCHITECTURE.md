# Architecture - Jašterka Hlohovec

## Tech Stack
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS 4
- **State:** Zustand
- **Backend:** Express (Node.js) + Server Actions (simulated in Vite/Node environment)
- **DB:** Prisma + PostgreSQL
- **Maps:** Google Maps Platform

## Modules
1. **Client (Web):** Single Page Application.
2. **Admin:** Protected routes for management.
3. **Kitchen:** High-density dashboard for staff.
4. **Courier:** Mobile-optimized interface for delivery.

## Key Patterns
- Service layer for DB access.
- Typed Zod schemas for validation.
- Real-time updates via polling or WebSockets.
