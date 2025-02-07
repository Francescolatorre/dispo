# API Documentation

## Overview

The DispoMVP API is organized around REST. Our API accepts JSON-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes and authentication.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Authentication is handled via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Endpoints

### Users

#### POST /api/users
Create a new user (Admin only).

**Request Body**
```json
{
  "username": "string",
  "password": "string",
  "role": "string" // "admin" or "project_leader"
}
```

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
      "personnelNumber": "string",
      "entryDate": "string",
      "contractEndDate": "string",
      "email": "string",
      "phone": "string",
      "qualifications": {
        "technicalSkills": [
          {
            "name": "string",
            "level": number // 1-5
          }
        ],
        "certifications": [
          {
            "name": "string",
            "validUntil": "string"
          }
        ],
        "languages": [
          {
            "language": "string",
            "level": "string"
          }
        ],
        "softSkills": ["string"]
      }
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
  "personnelNumber": "string",
  "entryDate": "string",
  "contractEndDate": "string",
  "email": "string",
  "phone": "string",
  "qualifications": {
    "technicalSkills": [],
    "certifications": [],
    "languages": [],
    "softSkills": []
  }
}
```

### Projects

#### GET /api/projects
List all projects.

**Query Parameters**
- `includeArchived` (boolean): Include archived projects in response

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
      "projectLeader": "string",
      "documentationLinks": ["string"],
      "isArchived": boolean,
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
  "endDate": "string",
  "projectLeader": "string",
  "documentationLinks": ["string"]
}
```

#### PATCH /api/projects/{id}/archive
Archive a project.

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
      "endDate": "string",
      "workload": number // percentage
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
  "endDate": "string",
  "workload": number
}
```

### Absences

#### GET /api/absences
List all absences.

**Query Parameters**
- `employeeId` (string): Filter by employee
- `startDate` (string): Filter by start date
- `endDate` (string): Filter by end date

**Response**
```json
{
  "absences": [
    {
      "id": "string",
      "employeeId": "string",
      "type": "string", // "vacation", "sick", "training", "special"
      "startDate": "string",
      "endDate": "string",
      "description": "string"
    }
  ]
}
```

#### POST /api/absences
Create a new absence.

**Request Body**
```json
{
  "employeeId": "string",
  "type": "string",
  "startDate": "string",
  "endDate": "string",
  "description": "string"
}
```

### Reports

#### GET /api/reports/resource-utilization
Get resource utilization report.

**Query Parameters**
- `startDate` (string): Start of reporting period
- `endDate` (string): End of reporting period
- `teamId` (string, optional): Filter by team

**Response**
```json
{
  "employees": [
    {
      "id": "string",
      "name": "string",
      "utilization": number,
      "assignments": [
        {
          "projectId": "string",
          "workload": number,
          "period": {
            "start": "string",
            "end": "string"
          }
        }
      ],
      "absences": [
        {
          "type": "string",
          "period": {
            "start": "string",
            "end": "string"
          }
        }
      ]
    }
  ]
}
```

### Data Import/Export

#### POST /api/import/csv
Import data from CSV.

**Request Body**
```
multipart/form-data
- file: CSV file
- type: "employees" | "projects" | "assignments" | "absences"
```

#### GET /api/export/csv
Export data to CSV.

**Query Parameters**
- `type`: "employees" | "projects" | "assignments" | "absences"
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

## Error Handling

The API uses conventional HTTP response codes to indicate the success or failure of an API request:

- 200: Success
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 409: Conflict
- 500: Internal server error

Error responses include a message providing more details about the error:

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}