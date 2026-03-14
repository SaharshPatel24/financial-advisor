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

---

## Prerequisites

- **Node.js** 22+
- **npm** 10+
- **PostgreSQL** 14+ running locally
- **Expo Go** app installed on your iOS/Android device (for physical device testing)

---

## First-Time Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the API environment

Create `apps/api/.env`:

```env
DATABASE_URL="postgresql://<your-pg-user>@localhost:5432/financial_advisor"
JWT_ACCESS_SECRET="your-random-access-secret"
JWT_REFRESH_SECRET="your-random-refresh-secret"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
ANTHROPIC_API_KEY="sk-ant-..."
PORT=3000
```

> Replace `<your-pg-user>` with your local PostgreSQL username (e.g. `saharsh` or `postgres`).

### 3. Create the database

```bash
psql -d postgres -c "CREATE DATABASE financial_advisor;"
```

### 4. Run database migrations

```bash
npm run db:migrate
```

### 5. Set up the mobile environment (optional)

Create `apps/mobile/.env` only if you need to override the API URL (e.g. using a physical device over a different network):

```env
EXPO_PUBLIC_API_URL=http://<your-mac-lan-ip>:3000/api
```

> **On the same WiFi network, this file is not needed.** The mobile app auto-detects the Mac's LAN IP from the Metro bundler host and connects to port 3000 automatically.

---

## Running Locally

Open two terminal windows from the project root:

```bash
# Terminal 1 — start the NestJS API
npm run api

# Terminal 2 — start the Expo mobile app
npm run mobile
```

- API will be available at `http://localhost:3000/api`
- Expo will print a QR code — scan it with Expo Go on your device

### How the mobile app finds the API

The app uses `expo-constants` to read the Metro bundler's host (e.g. `192.168.1.5:8081`) and automatically points to `http://192.168.1.5:3000/api`. This works automatically when your Mac and device are on the same WiFi network.

If you're using **Expo tunnel mode** (`npm run mobile:tunnel`), the auto-detection won't work. In that case, set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to your Mac's LAN IP:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.5:3000/api
```

> Keep the API running locally on port 3000 — do not tunnel the API. This way NestJS request logs remain visible in your terminal.

---

## Available Scripts

All scripts run from the **monorepo root**:

| Script | Description |
|---|---|
| `npm run api` | Start NestJS API in watch/dev mode |
| `npm run api:prod` | Start NestJS API in production mode |
| `npm run mobile` | Start Expo Metro bundler |
| `npm run mobile:tunnel` | Start Expo with tunnel (for remote devices) |
| `npm run mobile:android` | Start Expo targeting Android |
| `npm run mobile:ios` | Start Expo targeting iOS |
| `npm run test` | Run all tests (API + mobile) |
| `npm run test:api` | Run API unit tests only |
| `npm run test:mobile` | Run mobile unit tests only |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:migrate:prod` | Run Prisma migrations (production) |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run build:shared` | Build shared TypeScript package |

---

## Features

- JWT authentication (register, login, token refresh)
- Automated transaction categorization via AI
- Spending insights (weekly/monthly AI analysis)
- Savings goal creation with AI recommendations
- AI-generated weekly financial challenges
