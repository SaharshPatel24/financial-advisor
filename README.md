# Mini Personal Finance Advisor

An AI-first mobile finance app built with **React Native (Expo)**, **NestJS**, and **Anthropic Claude**.

## Monorepo Structure

```
financial-advisor/
├── apps/
│   ├── api/        # NestJS backend (port 3000)
│   └── mobile/     # Expo React Native app (port 8081)
└── packages/
    └── shared/     # Shared TypeScript types
```

## Quick Start

```bash
# Install all dependencies
npm install

# Start the API (requires PostgreSQL running)
npm run api

# Start the mobile app
npm run mobile

# Run DB migrations
npm run db:migrate
```

## Environment Setup

Copy `apps/api/.env.example` to `apps/api/.env` and fill in:
- `DATABASE_URL` – PostgreSQL connection string
- `ANTHROPIC_API_KEY` – your Anthropic API key
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` – random secrets

## Sprint 1 Features
- Automated transaction categorization via AI
- Spending insights (weekly/monthly)
- Savings goal recommendations
- AI-generated weekly challenges
