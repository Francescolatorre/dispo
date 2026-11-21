# DispoMVP - Resource Planning System

## Overview

DispoMVP is a comprehensive resource planning system designed to help organizations efficiently manage and allocate their resources. The system provides tools for project management, employee assignment, and workload visualization.

## Features

- Project Management
  - Create and manage projects
  - Define project requirements
  - Track project timelines
  - Monitor project status

- Resource Management
  - Employee profiles and skills
  - Resource allocation
  - Workload visualization
  - Capacity planning

- Timeline Visualization
  - Interactive timeline view
  - Drag-and-drop assignments
  - Resource conflicts detection
  - Workload indicators

- Assignment Management
  - Create and edit assignments
  - Set allocation percentages
  - Define roles and responsibilities
  - Track assignment status

## Tech Stack

- Frontend
  - React with TypeScript
  - Chakra UI for components
  - Vite for build tooling
  - Vitest for testing

- Backend
  - Node.js
  - Express
  - PostgreSQL
  - Jest for testing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/DispoMVP.git
cd DispoMVP
```

2. Install backend dependencies:

```bash
npm install
```

3. Install frontend dependencies:

```bash
cd client
npm install
```

4. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Start and migrate the database: see [Backend](#backend-api) below.

### Development

1. Start the backend server:

```bash
npm run dev
```

2. Start the frontend development server:

```bash
cd client
npm run dev
```

3. Run tests:

```bash
# Backend tests
npm test

# Frontend tests
cd client
npm test
```

## Backend (API)

Slim Express 4 + PostgreSQL 17 REST API under `/api`, mirroring the client `Repository`
interface (`client/src/data/repository.ts`). Ids are strings, dates `YYYY-MM-DD`, JSON is camelCase.
Endpoint reference: [docs/api.md](docs/api.md).

Requires Node >= 22 and Docker (e.g. Rancher Desktop).

```bash
cp .env.example .env    # optional - defaults match docker-compose.yml
npm install
npm run db:up           # postgres:17-alpine on localhost:5433 (DB_HOST_PORT), creates dispo + dispo_test
npm run db:migrate      # applies server/migrations/*.sql to DATABASE_URL
npm run dev             # API on http://localhost:3001/api (node --watch); `npm start` without watch
npm test                # integration tests against TEST_DATABASE_URL (dispo_test), container must be up
npm run lint
npm run db:down         # stops the container, keeps the data volume
```

### Client data source

The client picks its data source at startup via `VITE_DATA_SOURCE` (see `client/.env.example`):
`auto` (default) probes `GET /api/health` (1.5 s timeout) and uses the API if it answers, otherwise
the browser (`localStorage`); `api` / `local` force one side. The Vite dev server proxies `/api` to
`http://localhost:3001`. With the API active and an empty database, the demo seed is written once
(fixed ids `emp-01`, `prj-01`, …). The sidebar footer shows the active source
("Datenquelle: Server" / "Lokal (Browser)"). Vitest runs with `VITE_DATA_SOURCE=local` (`client/.env.test`).

Integration check of the client against a running API (creates and removes its own records):

```bash
npm start                                   # repo root, API on :3001
cd client && DISPO_API_IT=1 npx vitest run src/data/httpRepository.integration.test.ts
```

E2E (`client/playwright.config.ts`): by default only the Vite dev server in local mode;
`E2E_DATA_SOURCE=api` also starts `node server/index.js` and pins the client to the API.

## Project Structure

```
DispoMVP/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── tests/             # Frontend tests
├── server/                # Backend: Express + Postgres REST API
│   ├── migrations/       # SQL migrations (applied by server/migrate.js)
│   └── test/             # API integration tests (node:test + supertest)
├── db/init/               # Postgres container init scripts
└── docs/                 # Documentation
```

## Documentation

- [API Documentation](docs/api.md)
- [User Stories](cline_docs/userStories.md)
- [System Patterns](cline_docs/systemPatterns.md)
- [Technical Requirements](cline_docs/technicalRequirements.md)

## Testing

The project uses a comprehensive testing strategy:

- Unit Tests: Testing individual components and functions
- Integration Tests: Testing API endpoints and database interactions
- End-to-End Tests: Testing complete user workflows
- Component Tests: Testing React components in isolation

Run tests with:

```bash
# Run all tests
npm test

# Run specific test file
npm test path/to/test.js

# Run with coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.