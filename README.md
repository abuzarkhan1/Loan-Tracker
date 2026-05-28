# Loan Tracker

A production-structured Loan Tracker app with a Node.js/Express/TypeScript/MongoDB backend and an Expo React Native frontend.

## Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

If you do not have MongoDB running locally, use the in-memory development server:

```bash
cd backend
npm run dev:memory
```

API base URL: `http://localhost:5050/api`

Useful checks:

```bash
npm run build
npm test
```

## Mobile

```bash
cd mobile
npm install
cp .env.example .env
npm run start
```

For a physical phone, set `EXPO_PUBLIC_API_URL` to your computer's LAN IP, for example:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.10:5050/api
```

Useful check:

```bash
npm run typecheck
```
