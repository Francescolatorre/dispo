# DispoMVP API Documentation

## Base URL
All API endpoints are relative to: `http://localhost:3000/api`

## Authentication
Authentication is required for all endpoints. Send an Authorization header with a valid JWT token:
```
Authorization: Bearer <token>
```

## Error Handling
All endpoints follow the same error response format:
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## Endpoints

### Projects

#### GET /projects
List all projects.

**Response**
```json
[
  {
    "id": 1,
    "name": "Project A",
    "description": "Project description",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "status": "active"
  }
]
```

#### GET /projects/:id
Get project details.

**Response**
```json
{
  "id": 1,
  "name": "Project A",
  "description": "Project description",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "status": "active"
}
```

### Assignments

#### GET /assignments
List assignments with optional filters.

**Query Parameters**
- `projectId`: Filter by project ID
- `employeeId`: Filter by employee ID
- `status`: Filter by status (active, completed, cancelled)
- `startDate`: Filter by start date
- `endDate`: Filter by end date

**Response**
```json
[
  {
    "id": 1,
    "project_id": 1,
    "employee_id": 1,
    "role": "Developer",
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "allocation_percentage": 100,
    "status": "active",
    "project_name": "Project A",
    "employee_name": "John Doe"
  }
]
```

#### POST /assignments
Create a new assignment.

**Request Body**
```json
{
  "project_id": 1,
  "employee_id": 1,
  "role": "Developer",
  "start_date": "2024-01-01",
  "end_date": "2024-03-31",
  "allocation_percentage": 100,
  "status": "active"
}
```

**Response**
```json
{
  "id": 1,
  "project_id": 1,
  "employee_id": 1,
  "role": "Developer",
  "start_date": "2024-01-01",
  "end_date": "2024-03-31",
  "allocation_percentage": 100,
  "status": "active"
}
```

#### PUT /assignments/:id
Update an existing assignment.

**Request Body**
```json
{
  "role": "Senior Developer",
  "allocation_percentage": 80
}
```

**Response**
```json
{
  "id": 1,
  "project_id": 1,
  "employee_id": 1,
  "role": "Senior Developer",
  "start_date": "2024-01-01",
  "end_date": "2024-03-31",
  "allocation_percentage": 80,
  "status": "active"
}
```

#### POST /assignments/validate
Validate assignment data.

**Request Body**
```json
{
  "project_id": 1,
  "employee_id": 1,
  "start_date": "2024-01-01",
  "end_date": "2024-03-31",
  "allocation_percentage": 100
}
```

**Response**
```json
{
  "isValid": true,
  "errors": {},
  "warning": false,
  "message": null
}
```

### Employees

#### GET /employees
List all employees.

**Response**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Developer",
    "status": "active"
  }
]
```

#### GET /employees/:id/assignments
Get employee assignments.

**Response**
```json
[
  {
    "id": 1,
    "project_id": 1,
    "employee_id": 1,
    "role": "Developer",
    "start_date": "2024-01-01",
    "end_date": "2024-03-31",
    "allocation_percentage": 100,
    "status": "active",
    "project_name": "Project A"
  }
]
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per minute per IP address. The following headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1612345678