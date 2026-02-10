# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GainsView - A premium Next.js options trading platform with P&L visualization, live market data, and AI assistant.

**Live Site:** https://options-calculator-one.vercel.app
**GitHub:** https://github.com/averycoffey28-code/GainsView

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
vercel --prod    # Deploy to production
```

## Architecture

### Tech Stack
- Next.js 16 (App Router) with TypeScript
- Tailwind CSS v4 with custom brand colors
- shadcn/ui components (in `components/ui/`)
- Recharts for P&L visualization
- Tradier API for live market data
- Clerk Auth (Google, Apple, Email) - handles sessions/auth
- Neon (PostgreSQL) - user data storage
- Groq AI (Llama 3.1 70B)

### Authentication Flow
1. User visits any page → Middleware checks auth
2. If not logged in → Redirect to /sign-in
3. User signs in via Clerk → Redirect to home
4. Clerk webhook syncs user to Neon database
5. All user data linked via user_id

### Key Files

**Core Logic:**
- `lib/calculations.ts` - Options math (P&L, break-even, max profit/loss)
- `lib/types.ts` - TypeScript interfaces for market data
- `hooks/useMarketData.ts` - State management for fetching quotes
- `hooks/useUserData.ts` - Hooks for user data (positions, trades, watchlist, chat)

**Auth & Database:**
- `middleware.ts` - Clerk auth middleware, protects all routes
- `lib/db.ts` - Neon/PostgreSQL client for database operations
- `app/api/webhooks/clerk/route.ts` - Syncs Clerk users to Neon database

**API Routes:**
- `app/api/stock/route.ts` - Fetches stock quotes from Tradier
- `app/api/options/route.ts` - Fetches options chains from Tradier
- `app/api/chat/route.ts` - AI Trading Assistant (Groq)
- `app/api/admin/users/route.ts` - Admin user management

**Main Components:**
- `app/page.tsx` - Main calculator page
- `components/BottomNav.tsx` - Mobile bottom navigation
- `components/TradingAssistant.tsx` - AI chat assistant

### Database Schema (Neon PostgreSQL)

Tables:
- `users` - User profiles (synced from Clerk)
- `positions` - Saved option contracts
- `watchlist` - Stocks being tracked
- `trades` - Manual P&L entries
- `chat_history` - AI conversation history
- `user_settings` - User preferences

Neon Console: https://console.neon.tech

### Brand Colors (from lion logo)

Custom CSS variables in `globals.css`:
- `--gold-400: #D4B896` - Primary accent
- `--brown-950: #141210` - Darkest background
- `--brown-800: #2A2420` - Card backgrounds
- `--brown-600: #4A403A` - Borders

### Environment Variables

Required in `.env.local`:
```
# Live market data (Tradier)
TRADIER_API_KEY=your_sandbox_token_here
TRADIER_API_URL=https://sandbox.tradier.com/v1

# AI Trading Assistant (Groq)
GROQ_API_KEY=your_groq_api_key_here

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...  # For user sync webhook

# Neon Database
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Routes

**Public (no auth required):**
- `/sign-in` - Clerk sign in
- `/sign-up` - Clerk sign up
- `/login` - Redirects to /sign-in
- `/signup` - Redirects to /sign-up

**Protected (auth required):**
- `/` - Main calculator (Home)
- `/portfolio` - Portfolio tracking
- `/pnl` - P&L tracking
- `/ai` - Full-screen AI assistant
- `/menu` - Settings & sign out

**Admin (gainsview@gmail.com only):**
- `/admin/users` - User management dashboard

### Data Hooks

```typescript
import { useUser, usePositions, useWatchlist, useTrades, useChatHistory } from "@/hooks/useUserData";

// Get current user
const { user, loading, clerkUser } = useUser();

// Positions CRUD
const { positions, addPosition, updatePosition, deletePosition } = usePositions();

// Watchlist
const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

// Trades
const { trades, addTrade, deleteTrade, totalPnL } = useTrades();

// Chat history
const { messages, addMessage, clearHistory } = useChatHistory();
```
