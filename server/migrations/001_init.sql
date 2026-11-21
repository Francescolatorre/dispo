-- Planning MVP schema. Ids are text so clients may supply their own (seed data, undo);
-- otherwise the database generates a UUID.

CREATE TABLE employees (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        text NOT NULL CHECK (length(trim(name)) > 0),
  role        text NOT NULL,
  seniority   text NOT NULL CHECK (seniority IN ('junior', 'mid', 'senior', 'lead')),
  capacity    numeric(3, 2) NOT NULL CHECK (capacity BETWEEN 0.1 AND 1.0),
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        text NOT NULL CHECK (length(trim(name)) > 0),
  color       text NOT NULL,
  start_date  date NOT NULL,
  end_date    date NOT NULL,
  status      text NOT NULL CHECK (status IN ('planned', 'active', 'done')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_dates_check CHECK (end_date >= start_date)
);

CREATE TABLE assignments (
  id           text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id  text NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
  project_id   text NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  allocation   integer NOT NULL CHECK (allocation BETWEEN 10 AND 100 AND allocation % 10 = 0),
  role         text NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assignments_dates_check CHECK (end_date >= start_date)
);

CREATE INDEX assignments_employee_period_idx ON assignments (employee_id, start_date, end_date);
CREATE INDEX assignments_project_idx ON assignments (project_id);
