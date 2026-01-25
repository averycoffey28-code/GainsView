# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Options P&L Calculator - A Next.js app for visualizing options trading profit/loss scenarios with live market data integration.

**Live Site:** https://options-calculator-one.vercel.app
**GitHub:** https://github.com/averycoffey28-code/options-calculator

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

### Key Files

**Core Logic:**
- `lib/calculations.ts` - Options math (P&L, break-even, max profit/loss). Uses 100x contract multiplier.
- `lib/types.ts` - TypeScript interfaces for market data (StockQuote, OptionContract, OptionsChain)
- `hooks/useMarketData.ts` - State management for fetching quotes and options chains

**API Routes:**
- `app/api/stock/route.ts` - Fetches stock quotes from Tradier
- `app/api/options/route.ts` - Fetches options expirations and chains from Tradier
- `app/api/chat/route.ts` - AI Trading Assistant powered by Groq (Llama 3.1 70B)

**Main Components:**
- `app/page.tsx` - Main calculator page, manages all state
- `components/ContractInputForm.tsx` - Call/Put, Long/Short, strike, premium inputs
- `components/ProfitLossChart.tsx` - Recharts area chart with gradient fill
- `components/StockSearch.tsx` - Symbol search with live quote display
- `components/OptionsChainSelector.tsx` - Expiration picker and contract table
- `components/TradingAssistant.tsx` - AI chat assistant (floating button, slide-out panel)

### Brand Colors (from lion logo)

Custom CSS variables in `globals.css`:
- `--gold-400: #D4B896` - Primary accent (from lion outline)
- `--brown-950: #141210` - Darkest background
- `--brown-800: #2A2420` - Card backgrounds
- `--brown-600: #4A403A` - Borders

Finance conventions preserved:
- Green (`#10b981`) for profit
- Red (`#f43f5e`) for loss

### Environment Variables

Required in `.env.local`:
```
# Live market data (Tradier)
TRADIER_API_KEY=your_sandbox_token_here
TRADIER_API_URL=https://sandbox.tradier.com/v1

# AI Trading Assistant (Groq)
GROQ_API_KEY=your_groq_api_key_here
```

- Get free Tradier sandbox token at https://developer.tradier.com/
- Get free Groq API key at https://console.groq.com/
