# OPROX OS

## Purpose
OPROX OS is an enterprise-grade Corporate Innovation Showcase and Live Autonomous AI Software Engineering Operating System. It provides modular vertical solutions, developer tools, AI agent swarms, and real-time execution engines.

## Architecture Overview
OPROX OS is built as a full-stack web application:
- **Frontend**: React 19 SPA powered by Vite, Tailwind CSS, Lucide icons, Motion, and Recharts.
- **Backend**: Express.js server executed via `tsx` in development and bundled using `esbuild` for production runtime.
- **Database Layer**: PostgreSQL managed via Drizzle ORM and Drizzle Kit migrations.
- **AI Engine**: Server-side integrations using the `@google/genai` SDK for governed autonomous workflows and agent interactions.

## Repository Structure
```
├── drizzle/              # PostgreSQL schema migrations and journal metadata
├── scripts/              # Infrastructure and build orchestration scripts
├── server/               # Express API routes, auth, audit logging, and AI services
├── src/                  # React components, UI views, assets, and shared utilities
│   ├── components/       # Workspace views, vertical studios, and UI components
│   ├── db/               # Drizzle ORM table definitions and database config
│   ├── integration/      # Navigation registry and platform integrations
│   └── lib/              # Core business logic, state stores, and encryption helpers
├── tests/                # Automated Vitest test suites
├── server.ts             # Main backend application entry point
├── package.json          # Dependency manifest and npm scripts
└── README.md             # Project documentation
```

## Development Requirements
- Node.js (v20+ recommended)
- npm or yarn package manager
- PostgreSQL instance (optional, memory/fallback mode supported for local testing)

## Local Development
To start the development server with live reloading:
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

## Build
To build the application and compile the server bundle for production:
```bash
npm run build
```

## Tests
To execute the automated test suite:
```bash
npm run test
```

## Environment Variables
Refer to `.env.example` for required and optional environment variables:
- `PORT`: Server port (defaults to 3000)
- `NODE_ENV`: Runtime mode (`development` or `production`)
- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: API key for AI features (kept strictly server-side)
- `JWT_SECRET`: Secret key for authentication token signing

## License
MIT
