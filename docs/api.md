# DispoMVP API

Base URL: `http://localhost:3001/api`. No authentication (MVP). CORS: `CORS_ORIGIN` (default `http://localhost:5173`).

Conventions: JSON in/out, camelCase fields, string ids, dates as `YYYY-MM-DD` (calendar days, no time zone;
`start`/`end` are inclusive). The shapes match `client/src/domain/types.ts`.

## Endpoints

| Method | Path | Success |
|---|---|---|
| GET | `/health` | 200 `{status:'ok', db:'ok'}` / 503 if the DB is unreachable |
| GET | `/employees` | 200 `Employee[]` (by name) |
| POST | `/employees` | 201 `Employee` |
| PUT | `/employees/:id` | 200 `Employee` |
| DELETE | `/employees/:id` | 204 (cascades the employee's assignments) |
| GET | `/projects` | 200 `Project[]` (by start) |
| POST | `/projects` | 201 `Project` |
| PUT | `/projects/:id` | 200 `Project` |
| DELETE | `/projects/:id` | 204 (cascades the project's assignments) |
| GET | `/assignments?from&to&employeeId&projectId` | 200 `Assignment[]` (by start) |
| POST | `/assignments` | 201 `Assignment` |
| PUT | `/assignments/:id` | 200 `Assignment` |
| DELETE | `/assignments/:id` | 204 |

- **POST** takes the full input; an optional client-supplied `id` (`[A-Za-z0-9_.:-]{1,100}`) is kept,
  otherwise a UUID is generated. Existing id: 409 `CONFLICT`. `Employee.active` defaults to `true`.
- **PUT** has patch semantics: omitted fields stay unchanged. For assignments `role: null` clears the role;
  an unset role is omitted from responses.
- **GET /assignments** `from`/`to` return assignments overlapping `[from, to]` (inclusive, either bound optional).

## Entities

- `Employee { id, name, role, seniority: junior|mid|senior|lead, capacity: 0.1–1.0, active }`
- `Project { id, name, color, start, end (>= start), status: planned|active|done }`
- `Assignment { id, employeeId, projectId, start, end (>= start), allocation: 10–100 step 10, role? }`

Workload/overbooking is **not** validated by the API: the client shows warnings and the planner decides.

## Errors

```json
{ "error": { "code": "VALIDATION", "message": "Invalid request", "details": [{ "field": "allocation", "message": "..." }] } }
```

| Status | code | When |
|---|---|---|
| 400 | `VALIDATION` | invalid field/date/query, `end < start`, unknown `employeeId`/`projectId`, malformed JSON |
| 404 | `NOT_FOUND` | unknown id or route |
| 409 | `CONFLICT` | POST with an id that already exists |
| 500 | `INTERNAL` | unexpected error (logged server-side, no stack trace in the response) |
