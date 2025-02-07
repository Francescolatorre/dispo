# System Patterns

## Architecture Overview

### Frontend Architecture
1. **Component Structure**
   - Wiederverwendbare UI-Komponenten
   - Container/Präsentations-Komponenten Pattern
   - Material-UI für konsistentes Design

2. **State Management**
   - Lokaler State für UI-Komponenten
   - Globaler State für App-weite Daten
   - Formularverwaltung mit kontrollierten Komponenten

3. **Routing**
   - Client-side Routing
   - Geschützte Routen für authentifizierte Benutzer
   - Breadcrumb Navigation

### Backend Architecture
1. **API Design**
   - RESTful Endpoints
   - Standardisierte Fehlerbehandlung
   - Validierung von Eingabedaten
   - JWT-basierte Authentifizierung
   - Rate Limiting für API-Zugriffe

2. **Datenbank Design**
   - Normalisierte Tabellenstruktur mit:
     * users (Benutzerverwaltung)
     * employees (Mitarbeiterdaten)
     * projects (Projektdaten mit Referenz auf Projektleiter)
     * project_assignments (Verknüpfungstabelle für Projekt-Mitarbeiter Zuweisungen)
     * requirements (Projektanforderungen)
     * absences (Mitarbeiterabwesenheiten)
     * qualifications (Mitarbeiterqualifikationen)
   - Referentielle Integrität durch Foreign Keys:
     * Projektleiter muss existierender Mitarbeiter sein
     * Projekt-Mitarbeiter Zuweisungen referenzieren gültige Projekte und Mitarbeiter
     * Abwesenheiten referenzieren gültige Mitarbeiter
     * Qualifikationen referenzieren gültige Mitarbeiter
   - Zeitliche Validierung:
     * Mitarbeiterzuweisungen müssen innerhalb der Projektlaufzeit liegen
     * Automatische Projektzuweisung für Projektleiter
     * Abwesenheiten dürfen sich nicht mit 100% Projektzuweisungen überschneiden
   - Indizierung für Performance
     * B-Tree Indizes für Fremdschlüssel
     * GiST Indizes für Zeiträume

3. **Authentication**
   - JWT-basierte Authentifizierung
   - Sichere Passwort-Speicherung mit bcrypt
   - Role-based Access Control (RBAC)
   - Token-Blacklisting für Logout

## Key Technical Decisions

### Frontend
1. **React & Material-UI**
   - Schnelle Entwicklung durch vorgefertigte Komponenten
   - Konsistentes Look & Feel
   - Responsive Design out of the box

2. **CSV Handling**
   - Papa Parse für zuverlässiges CSV Parsing
   - Clientseitige Validierung
   - Flexibles Mapping von Datenformaten
   - Batch-Processing für große Datensätze

### Backend
1. **Node.js & Express**
   - Einfache Skalierbarkeit
   - Große Community und Ecosystem
   - Schnelle Entwicklung

2. **PostgreSQL**
   - ACID Compliance
   - Robuste Datenkonsistenz
   - Erweiterbare Struktur
   - Native Unterstützung für JSON-Datentypen (für Qualifikationen)
   - Zeitraum-Operatoren für Verfügbarkeitsberechnung

### Deployment
1. **Heroku**
   - Einfaches Deployment
   - Automatische Skalierung
   - Integrierte PostgreSQL Hosting

## Design Patterns

### Frontend Patterns
1. **Component Patterns**
   - Higher-Order Components für Wiederverwendbarkeit
   - Render Props für flexible Komponenten
   - Custom Hooks für geteilte Logik

2. **Form Patterns**
   - Controlled Components
   - Form Validation
   - Error Handling
   - Dynamische Formulare für Qualifikationen

3. **Layout Patterns**
   - Responsive Grid System
   - Flexible Containers
   - Adaptive Design
   - Timeline Visualization:
     * Monatliche Zeitachse (X-Achse)
     * Projekte als horizontale Container
     * Projekt-Header mit Meta-Informationen:
       - Name, ID, Laufzeit, Standort, FTE
     * Mitarbeiter-Grid pro Projekt:
       - Spalten: DR, Position, Status, Name, Seniorität, Level
       - Numerische Spalten: AZF, Plan
       - Datum-Spalten: Start, End
       - Skills als Tags
     * Farbkodierung für Auslastungsgrade
     * Vertikale Anordnung mehrerer Projekte
     * Abwesenheitsanzeige im Timeline-View

### Backend Patterns
1. **API Patterns**
   - MVC Architecture
   - Middleware für Authentifizierung
   - Service Layer für Business Logic
   - Resource-based URL Structure
   - Bulk Operations für CSV Import/Export
   - Caching für Report-Generierung

2. **Database Patterns**
   - Repository Pattern
   - Unit of Work
   - Query Objects
   - Temporal Data Patterns:
     * Zeitbasierte Abfragen für Timeline
     * Überlappende Zeiträume für Zuweisungen
     * Validierung von Zeitspannen
     * Aggregation für Ressourcenauslastung

3. **Security Patterns**
   - Authentication Middleware
   - Input Sanitization
   - Rate Limiting
   - CORS Configuration
   - Request Validation
   - SQL Injection Prevention

## Code Organization

### Frontend Structure
```
src/
  components/    # Wiederverwendbare UI-Komponenten
  containers/    # Container Komponenten mit Business Logic
  services/      # API Integration
  utils/         # Hilfsfunktionen
  hooks/         # Custom React Hooks
  styles/        # Globale Styles
  types/         # TypeScript Definitionen
```

### Backend Structure
```
src/
  controllers/   # Request Handler
  models/        # Datenbank Models
  services/      # Business Logic
  middleware/    # Express Middleware
  utils/         # Hilfsfunktionen
  routes/        # API Routes
  validators/    # Request Validation
  types/         # TypeScript Definitionen
```

## Data Flow Patterns

1. **API Request Flow**
   - Request Validation
   - Authentication Check
   - Rate Limit Check
   - Business Logic Processing
   - Response Formatting

2. **Data Import Flow**
   - File Upload
   - Format Validation
   - Data Transformation
   - Batch Processing
   - Error Handling
   - Progress Tracking

3. **Report Generation Flow**
   - Data Aggregation
   - Caching Strategy
   - Pagination
   - Format Conversion
   - Error Handling
