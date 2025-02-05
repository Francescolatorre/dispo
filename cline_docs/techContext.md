# Technical Context

## Technology Stack

### Backend
- **Framework:** Node.js mit Express
- **API:** RESTful Architecture
- **Datenbank:** PostgreSQL
- **Sicherheit:** bcrypt.js für Passwort-Hashing

### Frontend
- **Framework:** React
- **UI Library:** Material-UI
- **CSV Handling:** Papa Parse

### Deployment
- **Platform:** Heroku
- **Documentation:** Swagger (OpenAPI)

## Development Setup

### Prerequisites
- Node.js und npm
- PostgreSQL Datenbank
- Git für Versionskontrolle

### Local Development
1. Backend und Frontend Server starten
2. PostgreSQL Datenbank einrichten
3. Environment Variablen konfigurieren
4. API-Tests mit Swagger durchführen

## Technical Constraints

### Security
- HTTPS Verschlüsselung
- Sichere Passwort-Speicherung
- Best Practices für Web Security

### Performance
- Optimierte Datenbankabfragen
- Effiziente Frontend-Komponenten
- Responsive Design für alle Geräte

### Scalability
- Horizontale Skalierung durch Heroku
- Modulare Architektur
- Erweiterbare API-Struktur

### Data Management
- CSV Import/Export Funktionalität
- Datenbank-Backup Strategien
- Datenvalidierung und Fehlerbehandlung

## Integration Points

### Current
- CSV Datei Import/Export
- PostgreSQL Datenbank

### Planned
- Schnittstelle für Mitarbeiterstammdaten
- Weitere Export-Formate

## Technical Debt Considerations
- Keine E-Mail-Integration
- Begrenzte Zugriffskontrollen
- Einfache Authentifizierung ohne Passwort-Reset
