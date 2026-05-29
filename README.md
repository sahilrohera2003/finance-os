# Finance OS — Personal Finance Management

A production-ready personal financial operating system built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **ShadCN UI**, **MongoDB/Mongoose**, **NextAuth (Auth.js) v5**, **React Hook Form + Zod**, and **Recharts**.

Track **assets, liabilities, receivables, payables, income, expenses, transfers, loans, monthly obligations, and net worth** — all in one place, with always-accurate balances.

## Features

- 🔐 **Auth** — email **or** phone signup & login, bcrypt password hashing, JWT sessions, protected routes (middleware), per-user data isolation, logout.
- 💸 **Transactions** — income, expense, and transfer with automatic account-balance maintenance; filter by date range, category, tag, and account.
- 🏦 **Accounts** — cash, bank, and wallet accounts with live balances.
- 🤝 **Receivables / Payables** — track money owed to/by you; "mark received/paid" credits/debits a chosen account.
- 🏛️ **Loans** — outstanding balances, EMIs, and active-loan summary; counted as liabilities.
- 📅 **Monthly Obligations** — recurring commitments (rent, EMI, SIP, subscriptions…).
- 💎 **Assets** — registry of valuables (land, gold, vehicle…) feeding net worth.
- 📈 **Dashboard & Reports** — net-worth trend, income vs expense, category breakdown, cash flow, with historical net-worth snapshots.
- 🌗 **Dark / light mode**, mobile-first responsive layout (sidebar on desktop, bottom nav on mobile), loading/empty/error states, confirmation dialogs.

## Tech & Architecture

- **Route Handlers** under `src/app/api/**` provide a typed REST API.
- **Server Actions** under `src/server/actions/**` power the UI forms (with `revalidatePath`).
- **Service/repository layer** under `src/server/services/**` holds all business logic (balance maintenance, net-worth computation).
- **Zod** validates every input on both client and server.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

```env
MONGODB_URI=mongodb://localhost:27017/finance-os
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

> `NEXTAUTH_SECRET` is also read as `AUTH_SECRET` (Auth.js v5 convention) — setting `NEXTAUTH_SECRET` is enough.

### 3. (Optional) Seed demo data

```bash
npm run seed
```

Creates a demo user: **demo@finance.app** / **password123** with sample accounts, transactions, loans, and snapshots.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to **/login**. Register a new account or use the seeded demo credentials.

## Project Structure

```
src/
├── app/
│   ├── (auth)/                 # login, register
│   ├── (dashboard)/            # protected app shell + all feature pages
│   ├── api/                    # REST route handlers
│   ├── layout.tsx, page.tsx, error.tsx, not-found.tsx, globals.css
├── auth.ts, auth.config.ts     # NextAuth (Auth.js) v5 config
├── middleware.ts               # route protection
├── components/
│   ├── ui/                     # ShadCN primitives
│   ├── charts/                 # Recharts wrappers
│   └── shared/                 # nav, stat-card, empty-state, dialogs…
├── lib/                        # db connection, validations, utils, constants
├── models/                     # Mongoose schemas
└── server/
    ├── actions/                # server actions (mutations)
    └── services/               # business logic
scripts/seed.ts                 # demo data seeder
```

## Net Worth Formula

```
Assets       = cash/bank/wallet balances + asset registry value + pending receivables
Liabilities  = outstanding active loans + pending payables
Net Worth    = Assets − Liabilities
```

Snapshots are stored over time so the net-worth trend chart has history.

## API Overview

All routes require an authenticated session and operate only on the current user's data.

| Resource | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `[...nextauth]` |
| Accounts | `GET/POST /api/accounts`, `GET/PUT/DELETE /api/accounts/:id` |
| Transactions | `GET/POST /api/transactions`, `DELETE /api/transactions/:id` |
| Receivables | `GET/POST /api/receivables`, `PUT/DELETE /api/receivables/:id`, `POST /api/receivables/:id/receive` |
| Payables | `GET/POST /api/payables`, `PUT/DELETE /api/payables/:id`, `POST /api/payables/:id/pay` |
| Loans | `GET/POST /api/loans`, `PUT/DELETE /api/loans/:id` |
| Obligations | `GET/POST /api/obligations`, `PUT/DELETE /api/obligations/:id` |
| Assets | `GET/POST /api/assets`, `PUT/DELETE /api/assets/:id` |
| Categories / Tags | `GET/POST /api/categories`, `DELETE /api/categories/:id` (same for tags) |
| Net worth | `GET/POST /api/networth` |
| Dashboard | `GET /api/dashboard` |
```
