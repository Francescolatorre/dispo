# API Documentation

## Overview

The DispoMVP API is organized around REST. Our API accepts JSON-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes and authentication.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Authentication details will be added in a future update.

## Endpoints

### Employees

#### GET /api/employees
List all employees.

**Response**
```json
{
  "employees": [
    {
      "id": "string",
      "name": "string",
      "role": "string",
      "skills": ["string"],
      "availability": "number"
    }
  ]
}
```

#### POST /api/employees
Create a new employee.

**Request Body**
```json
{
  "name": "string",
  "role": "string",
  "skills": ["string"],
  "availability": "number"
}
```

### Projects

#### GET /api/projects
List all projects.

**Response**
```json
{
  "projects": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "startDate": "string",
      "endDate": "string",
      "status": "string"
    }
  ]
}
```

#### POST /api/projects
Create a new project.

**Request Body**
```json
{
  "name": "string",
  "description": "string",
  "startDate": "string",
  "endDate": "string"
}
```

### Requirements

#### GET /api/requirements
List all requirements.

**Response**
```json
{
  "requirements": [
    {
      "id": "string",
      "projectId": "string",
      "description": "string",
      "priority": "string",
      "status": "string"
    }
  ]
}
```

#### POST /api/requirements
Create a new requirement.

**Request Body**
```json
{
  "projectId": "string",
  "description": "string",
  "priority": "string"
}
```

### Assignments

#### GET /api/assignments
List all assignments.

**Response**
```json
{
  "assignments": [
    {
      "id": "string",
      "employeeId": "string",
      "projectId": "string",
      "requirementId": "string",
      "startDate": "string",
      "endDate": "string"
    }
  ]
}
```

#### POST /api/assignments
Create a new assignment.

**Request Body**
```json
{
  "employeeId": "string",
  "projectId": "string",
  "requirementId": "string",
  "startDate": "string",
  "endDate": "string"
}
```

## Error Handling

The API uses conventional HTTP response codes to indicate the success or failure of an API request:

- 200: Success
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Internal server error

Error responses will include a message providing more details about the error:

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}