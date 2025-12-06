# Rugby League Central - Sports Score Tracking Application

## Overview

Rugby League Central is a full-stack web application for tracking rugby league scores, news, and match information across multiple international leagues (NRL, Super League, International, and regional competitions). The application provides real-time score updates, match details, news articles, and user authentication with two-factor authentication support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Libraries:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing (replacing React Router)
- TanStack React Query for server state management and data fetching
- Tailwind CSS v4 with custom theme configuration for styling
- shadcn/ui component library (New York style variant) for pre-built accessible UI components

**Design Decisions:**
- Component-based architecture with shared UI components in `client/src/components/ui/`
- Custom components for domain-specific features (ScoreCard, NewsCard, Layout)
- Session-based welcome screen that only shows once per session
- Responsive design with mobile-first approach
- Custom fonts: Inter for body text, Teko for display/headings

**State Management:**
- React Context API for authentication state (`AuthProvider`)
- React Query for server data caching and synchronization
- Local component state for UI interactions
- Session storage for user preferences (welcome screen visibility)

### Backend Architecture

**Framework:**
- Express.js server with TypeScript
- HTTP server creation via Node's native `http` module
- Session-based authentication using express-session with PostgreSQL session store

**Authentication & Security:**
- Passport.js with Local Strategy for email/password authentication
- bcrypt for password hashing (10 salt rounds)
- Two-factor authentication using TOTP (otplib library)
- QR code generation for 2FA setup
- Session cookies with configurable security settings (httpOnly, secure in production, sameSite: lax)
- 7-day session expiration

**API Design:**
- RESTful endpoints under `/api` prefix
- Authentication endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/user`, etc.
- 2FA endpoints: `/api/auth/2fa/setup`, `/api/auth/2fa/enable`, `/api/auth/2fa/verify`
- Middleware-based authentication checks with `requireAuth` function

**Data Storage Layer:**
- Storage interface pattern (`IStorage`) for database abstraction
- `DatabaseStorage` class implements storage operations
- Separation of concerns: database logic isolated from route handlers

### Database Architecture

**ORM & Database:**
- Drizzle ORM for type-safe database operations
- PostgreSQL as the primary database (configured via `DATABASE_URL`)
- node-postgres (pg) driver for connection pooling

**Schema Design:**
- Users table with fields: id (UUID), email, passwordHash, twoFactorSecret, twoFactorEnabled, subscriptionStatus, subscriptionId, createdAt
- Sessions table managed by connect-pg-simple: sid, sess, expire
- Zod schemas for validation aligned with database schema
- Drizzle-zod integration for automatic schema validation generation

**Migration Strategy:**
- Drizzle Kit for schema migrations
- Migration files stored in `/migrations` directory
- Push-based deployment with `db:push` script

### Development vs Production

**Development Environment:**
- Vite dev server runs on port 5000
- HMR (Hot Module Replacement) enabled via WebSocket on `/vite-hmr` path
- Replit-specific plugins: cartographer (code mapping), dev-banner, runtime error overlay
- Vite middleware mode integrated with Express server
- Dynamic index.html reloading with cache-busting via nanoid

**Production Build:**
- Client: Vite builds to `dist/public`
- Server: esbuild bundles server code to `dist/index.cjs`
- Selective bundling: allowlisted dependencies are bundled, others treated as external
- Meta image plugin updates OpenGraph and Twitter card images to use correct Replit deployment domain

**Build Process:**
- Two-step build: client build via Vite, then server build via esbuild
- Server dependencies bundled to reduce file system calls (faster cold starts)
- Clean dist directory before each build

### External Dependencies

**UI Component Libraries:**
- Radix UI primitives for accessible, unstyled components (dialogs, dropdowns, menus, etc.)
- lucide-react for iconography
- cmdk for command palette functionality
- vaul for drawer/bottom sheet components
- embla-carousel-react for carousel functionality
- react-day-picker for date/calendar selection
- recharts for data visualization
- input-otp for OTP input fields

**Form Management:**
- react-hook-form for form state management
- @hookform/resolvers for validation integration
- Zod for schema validation

**Styling & Utilities:**
- Tailwind CSS with PostCSS processing
- class-variance-authority (cva) for component variant management
- clsx + tailwind-merge for className composition
- date-fns for date manipulation

**Authentication & Security:**
- passport + passport-local for authentication strategy
- bcrypt for password hashing
- otplib (authenticator) for TOTP 2FA
- qrcode for generating 2FA setup QR codes

**Database & Session:**
- drizzle-orm + drizzle-zod for ORM and validation
- pg (node-postgres) for PostgreSQL connection
- connect-pg-simple for PostgreSQL-backed session storage
- express-session for session middleware

**Development Tools:**
- tsx for TypeScript execution in development
- TypeScript with strict mode enabled
- Vite plugins for Replit integration (@replit/vite-plugin-*)

**Environment Configuration:**
- Required: `DATABASE_URL` for PostgreSQL connection
- Required: `SESSION_SECRET` for session encryption
- Optional: `REPL_ID` for Replit-specific features
- NODE_ENV for environment-specific behavior