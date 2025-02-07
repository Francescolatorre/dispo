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

5. Initialize the database:

```bash
npm run db:init
```

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
├── src/                   # Backend Node.js application
│   ├── config/           # Configuration files
│   ├── db/               # Database migrations and setup
│   ├── middleware/       # Express middleware
│   ├── routes/          # API routes
│   └── services/        # Business logic
├── docs/                 # Documentation
└── meta/                # Meta-models and schemas
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