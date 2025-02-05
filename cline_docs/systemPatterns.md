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

2. **Datenbank Design**
   - Normalisierte Tabellenstruktur mit:
     * employees (Mitarbeiterdaten)
     * projects (Projektdaten mit Referenz auf Projektleiter)
     * project_assignments (Verknüpfungstabelle für Projekt-Mitarbeiter Zuweisungen)
   - Referentielle Integrität durch Foreign Keys:
     * Projektleiter muss existierender Mitarbeiter sein
     * Projekt-Mitarbeiter Zuweisungen referenzieren gültige Projekte und Mitarbeiter
   - Zeitliche Validierung:
     * Mitarbeiterzuweisungen müssen innerhalb der Projektlaufzeit liegen
     * Automatische Projektzuweisung für Projektleiter
   - Indizierung für Performance

3. **Authentication**
   - Token-basierte Authentifizierung
   - Sichere Passwort-Speicherung
   - Session Management

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

### Backend
1. **Node.js & Express**
   - Einfache Skalierbarkeit
   - Große Community und Ecosystem
   - Schnelle Entwicklung

2. **PostgreSQL**
   - ACID Compliance
   - Robuste Datenkonsistenz
   - Erweiterbare Struktur

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

### Backend Patterns
1. **API Patterns**
   - MVC Architecture
   - Middleware für Authentifizierung
   - Service Layer für Business Logic

2. **Database Patterns**
   - Repository Pattern
   - Unit of Work
   - Query Objects
   - Temporal Data Patterns:
     * Zeitbasierte Abfragen für Timeline
     * Überlappende Zeiträume für Zuweisungen
     * Validierung von Zeitspannen

3. **Security Patterns**
   - Authentication Middleware
   - Input Sanitization
   - Rate Limiting

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
