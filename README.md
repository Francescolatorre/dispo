# DispoMVP - Resource Management System

A comprehensive resource management system for managing employees, projects, requirements, and assignments.

## 🚀 Features

- Employee management with detailed profiles
- Project planning and timeline visualization
- Requirement tracking and assignment
- Interactive dashboard
- Comprehensive reporting system

## 🛠️ Tech Stack

### Frontend
- React 
- TypeScript
- Vite
- Playwright for E2E testing
- Vitest for unit testing

### Backend
- Node.js
- Express
- PostgreSQL
- Jest for testing

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🔧 Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd DispoMVP
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and other configurations
```

3. Install backend dependencies:
```bash
npm install
```

4. Install frontend dependencies:
```bash
cd client
npm install
```

5. Set up the database:
```bash
# Run database migrations
node src/db/init.sql
```

## 🚀 Development

1. Start the backend server:
```bash
npm run dev
```

2. Start the frontend development server:
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 🧪 Testing

### Backend Tests
```bash
npm test
```

### Frontend Tests

Unit and Integration Tests:
```bash
cd client
npm test
```

E2E Tests:
```bash
cd client
npm run test:e2e
```

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   └── tests/            # E2E tests
├── src/                   # Backend application
│   ├── config/           # Configuration files
│   ├── db/               # Database migrations and setup
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   └── services/         # Business logic
└── meta/                 # Project metadata and schemas
    └── schemas/          # JSON schemas
```

## 🔄 Development Workflow

1. Create a new branch for your feature/fix
2. Write tests for new functionality
3. Implement your changes
4. Ensure all tests pass
5. Submit a pull request

## 📝 API Documentation

API endpoints are organized around the following resources:

- `/api/employees` - Employee management
- `/api/projects` - Project management
- `/api/requirements` - Requirement tracking
- `/api/assignments` - Resource assignments

Detailed API documentation is available in the [API Documentation](docs/api.md).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- [Team Member 1] - Project Lead
- [Team Member 2] - Frontend Developer
- [Team Member 3] - Backend Developer
- [Team Member 4] - QA Engineer

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to our early adopters and testers