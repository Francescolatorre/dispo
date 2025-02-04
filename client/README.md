# DispoMVP Client

A modern React application for managing employee dispositions and project scheduling.

## Technologies

- React 18 with TypeScript
- Material-UI (MUI) for components and theming
- React Router for navigation
- Vite for build tooling
- Vitest for testing

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm 7 or higher

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Project Structure

```
src/
├── components/         # Reusable UI components
│   └── layout/        # Layout components (Navigation, Layout)
├── pages/             # Page components
├── styles/            # Global styles and theme
├── test/             # Test utilities and setup
└── App.tsx           # Root component
```

## Testing

The project uses Vitest and React Testing Library for testing. Tests are co-located with their components. The testing setup includes:

- Jest-like assertions
- React Testing Library for component testing
- Custom test utilities for common testing scenarios
- Automatic test environment setup

### Test Files

- `*.test.tsx` - Component tests
- `test/utils.tsx` - Testing utilities
- `test/setup.ts` - Test environment configuration

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Component Architecture

### Layout Components

- `Layout.tsx` - Main layout wrapper
  - Handles page structure
  - Manages navigation drawer
  - Provides consistent spacing

- `Navigation.tsx` - Navigation component
  - Responsive drawer
  - Route management
  - MUI integration

### Pages

- `Dashboard.tsx` - Main dashboard view
- `Projects.tsx` - Project management
- `Employees.tsx` - Employee management
- `Reports.tsx` - Reporting interface

## Contributing

1. Create a feature branch
2. Make your changes
3. Write or update tests
4. Submit a pull request

## License

This project is private and confidential.
