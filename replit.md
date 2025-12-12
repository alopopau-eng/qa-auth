# Tawtheeq - National Authentication System

## Overview

Tawtheeq is a Qatar government-style national authentication system built as a full-stack web application. It provides user registration with multi-step verification, OTP-based email verification, payment processing, and an admin dashboard for monitoring visitors and applications. The interface is primarily in Arabic with RTL (right-to-left) layout support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with shadcn/ui components (New York style)
- **UI Components**: Radix UI primitives with custom styling
- **Font**: Cairo (Arabic-optimized Google Font)
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript compiled with tsx
- **Session Management**: express-session with MemoryStore (development) or connect-pg-simple (production)
- **Real-time Communication**: WebSocket server (ws) for live updates
- **Password Hashing**: bcryptjs

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Migrations**: Drizzle Kit with `db:push` command
- **Key Tables**: users, admins, visitors, applications, user_otps, online_sessions

### Authentication Flow
1. Multi-step registration with account type selection
2. Personal data collection (Arabic/English names, contact info)
3. Email OTP verification (6-digit code with rate limiting)
4. Password setup with complexity requirements
5. Payment gateway integration (10 QAR registration fee)

### API Structure
- REST endpoints under `/api/*`
- WebSocket endpoint at `/ws` for real-time stats
- Session-based authentication for both users and admins
- Rate limiting on OTP requests

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # UI components and step forms
│   │   ├── pages/        # Route pages (Landing, Login, Register, Admin)
│   │   ├── hooks/        # Custom hooks (toast, mobile, websocket, tracking)
│   │   └── lib/          # API client and utilities
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database operations (Drizzle)
│   └── vite.ts       # Vite dev server integration
├── shared/           # Shared code
│   └── schema.ts     # Drizzle schema and Zod validation
└── migrations/       # Database migrations
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, etc.)
- **Lucide React**: Icon library
- **date-fns**: Date formatting utilities
- **class-variance-authority**: Component variant management

### Backend Libraries
- **express-session**: Session management
- **memorystore**: In-memory session store for development
- **connect-pg-simple**: PostgreSQL session store for production
- **ws**: WebSocket server for real-time features
- **zod**: Runtime validation with drizzle-zod integration

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key (defaults provided for development)