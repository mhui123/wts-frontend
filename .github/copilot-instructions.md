# AI Coding Agent Instructions for WTS-Frontend

## Project Overview
This is a React + TypeScript + Vite frontend for a stock trading and portfolio management system with dual API integration:
- **Primary API**: Spring Boot backend at `:9789` (general trading, portfolio data)  
- **Kiwoom API**: Korean stock trading API with separate JWT auth at `:19789` (specialized trading features)

## Architecture & Key Patterns

### Dual API Structure
- **Main API client**: [`src/api/client.ts`](src/api/client.ts) - cookie-based auth, auto-redirects 401→login
- **Kiwoom API client**: [`src/api/kiwoomApi.ts`](src/api/kiwoomApi.ts) - JWT Bearer auth via `KiwoomTokenManager`
- **API routing**: `/api/*` → backend, `/kiwoom/*` → Kiwoom API (see [`vite.config.ts`](vite.config.ts))

### Authentication System
- **Standard auth**: Cookie/session-based via [`AuthContext`](src/contexts/AuthContext.tsx)
- **Kiwoom auth**: JWT tokens managed by [`KiwoomTokenManager`](src/utils/kiwoomTokenManager.ts) utility class
- **Protected routes**: Use `LoginRequired` component for auth gates

### Component Organization
```
src/
├── components/
│   ├── common/          # Shared UI components
│   ├── dashboard/       # Portfolio charts & metrics
│   └── kiwoom/          # Kiwoom API specific features
├── pages/               # Route-level components  
└── contexts/            # React contexts for global state
```

### Data Flow Patterns
- **Portfolio data**: Backend API → [`DashboardHome_Renew`](src/pages/DashboardHome_Renew.tsx) → currency conversion logic
- **Chart components**: Use Recharts with `ResponsiveContainer` (height: 300px containers for chart stability)
- **Currency handling**: USD/KRW toggle with real-time conversion in portfolio calculations

## Development Workflow

### Setup Commands
```bash
npm install          # Install dependencies
npm run dev         # Start dev server on :5173 (proxies to backend :9789)
npm run build       # TypeScript compile + Vite build
npm run lint        # ESLint validation
```

### Key File Patterns
- **API calls**: Always use `api` or `kiwoomApi` clients, never raw fetch/axios
- **Types**: Define in [`src/types/`](src/types/) directory (e.g., `dashboard.ts`, interfaces)
- **Styling**: Global CSS in [`src/styles/`](src/styles/), component-specific CSS co-located

### Documentation Conventions
The team maintains extensive documentation in [`mds/`](mds/) folder:
- **Guides**: [`mds/guides/`](mds/guides/) - Implementation patterns & best practices
- **Solutions**: [`mds/solutions/`](mds/solutions/) - Specific problem resolutions  
- **Plans**: [`mds/plans/`](mds/plans/) - Feature development roadmaps
- **Temp tasks**: [`mds/ask_temp/`](mds/ask_temp/) - Current analysis requests

## Critical Implementation Details

### Currency Conversion Logic
Portfolio components handle dual currency display:
```tsx
const getAdjustedValue = (amount: number) => {
  return currency === 'KRW' ? Math.round(amount * (usdToKrwRate || 0)) : amount;
}
```

### Chart Container Patterns  
Recharts components require explicit height containers:
```tsx
<div style={{ height: '300px' }}>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={chartData}>
```

### Kiwoom API Integration
- **JWT management**: Use `KiwoomTokenManager.getToken()` for auth headers
- **Route patterns**: `/api/kiwoom/public/*` (no auth) vs `/api/kiwoom/*` (JWT required)
- **Error handling**: Token expiry auto-handled by interceptors

### State Management
- **Auth state**: Managed via `AuthContext` with `useAuth()` hook
- **Portfolio data**: Component-level state with currency toggle effects
- **Loading states**: Consistent loading UI patterns across dashboard components

## Common Gotchas
- **Chart sizing**: Always wrap Recharts in fixed-height containers to prevent render warnings
- **API routing**: Check [`vite.config.ts`](vite.config.ts) proxy config for endpoint routing
- **Currency calculations**: Handle undefined exchange rates gracefully with fallbacks
- **Documentation**: Check [`mds/guides/`](mds/guides/) before implementing common patterns