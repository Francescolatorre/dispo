# DispoMVP Documentation

## Overview
This documentation covers all aspects of the DispoMVP project, from architecture and technical specifications to user guides and testing strategies.

## Core Documentation

### Project Context
- [Product Context](core/context/productContext.md) - Project goals and business requirements
- [System Patterns](core/context/systemPatterns.md) - Architectural patterns and design decisions
- [Technical Context](core/context/techContext.md) - Technical stack and infrastructure

### Development Status
- [Active Context](core/activeContext.md) - Current development status and priorities
- [Implementation Sequence](core/implementation-sequence.md) - Development phases and timeline
- [Backlog Prioritization](core/backlog-prioritization.md) - Task prioritization and planning

## Technical Documentation

### Specifications
- [Employee Management Spec](technical/specs/employee-management-spec.md) - Employee system technical specification
- [Migration Plan](technical/migrations/employee-system-migration.md) - Database and system migration procedures
- [Phase 1 Readiness](technical/specs/phase1-readiness.md) - Implementation readiness assessment

### Testing
- [Testing Strategy](testing/strategy/testing-strategy.md) - Overall testing approach and standards
- [Test Data](testing/data/test-data.md) - Test data management and fixtures
- [Test Results](testing/results/) - Test execution results and analysis

## Feature Documentation

### Employee Management
- [Component Design](features/employee/component-design.md) - UI component specifications
- [Technical Overview](features/employee/technical-overview.md) - System architecture and integration
- [User Guide](guides/user/employee-management.md) - End-user documentation

### Timeline
- [Component Design](features/timeline/component-design.md) - Timeline UI specifications
- [Technical Overview](features/timeline/technical-overview.md) - Implementation details
- [User Guide](guides/user/timeline.md) - Timeline feature usage

### Workload Management
- [Validation](features/workload/validation.md) - Workload calculation and validation
- [Technical Overview](features/workload/technical-overview.md) - System architecture
- [User Guide](guides/user/workload.md) - Workload management usage

## Developer Guides

### Setup & Configuration
- [Development Environment](guides/dev/setup.md) - Environment setup instructions
- [Database Setup](guides/dev/database.md) - Database configuration and management
- [Testing Setup](guides/dev/testing.md) - Test environment configuration

### Best Practices
- [Coding Standards](guides/dev/coding-standards.md) - Code style and best practices
- [Git Workflow](guides/dev/git-workflow.md) - Version control procedures
- [Documentation Guide](guides/dev/documentation.md) - Documentation standards

## API Documentation

### Backend Services
- [Authentication](technical/api/auth.md) - Authentication endpoints
- [Employee API](technical/api/employee.md) - Employee management endpoints
- [Timeline API](technical/api/timeline.md) - Timeline feature endpoints

### Frontend Services
- [State Management](technical/api/state.md) - Frontend state management
- [API Integration](technical/api/integration.md) - Backend integration
- [Component Library](technical/api/components.md) - Reusable components

## Deployment

### Infrastructure
- [Architecture](technical/deployment/architecture.md) - System architecture
- [Configuration](technical/deployment/configuration.md) - Environment configuration
- [Monitoring](technical/deployment/monitoring.md) - System monitoring and alerts

### Procedures
- [Deployment Guide](technical/deployment/deployment.md) - Deployment procedures
- [Backup & Recovery](technical/deployment/backup.md) - Data backup procedures
- [Scaling](technical/deployment/scaling.md) - System scaling guidelines

## Contributing

### Guidelines
- [Contributing Guide](guides/dev/contributing.md) - Contribution guidelines
- [Code Review](guides/dev/code-review.md) - Code review process
- [Release Process](guides/dev/releases.md) - Release management

### Templates
- [Issue Template](guides/templates/issue.md) - Issue creation template
- [PR Template](guides/templates/pr.md) - Pull request template
- [RFC Template](guides/templates/rfc.md) - RFC document template

## Archive
Historical documentation is maintained in the [archive](archive/) directory for reference.

## Maintenance
This documentation is actively maintained. For questions or updates:
1. Create an issue in the repository
2. Follow the [documentation guide](guides/dev/documentation.md)
3. Submit a pull request with proposed changes

## Search
Use the repository search function or refer to the [documentation index](INDEX.md) for specific topics.