# User Stories and Acceptance Criteria

## 1. Benutzerverwaltung

### US-1: Administrator User Management
**Als** Administrator  
**möchte ich** Benutzer anlegen können  
**damit** sie auf das System zugreifen können

**Akzeptanzkriterien:**
- [ ] Formular zur Benutzeranlage mit Feldern für Benutzername und Passwort
- [ ] Erfolgreiche Benutzeranlage ermöglicht Login
- [ ] Keine Passwort-Wiederherstellungsfunktion implementiert
- [ ] Validierung der Eingabefelder

## 2. Projektmanagement

### US-2: Project Creation and Management
**Als** Administrator oder Projektleiter  
**möchte ich** neue Projekte erstellen und verwalten können  
**damit** ich den Projektstatus und relevante Informationen verfolgen kann

**Akzeptanzkriterien:**
- [x] Projektanlage mit folgenden Pflichtfeldern:
  - Name
  - Start-Datum
  - End-Datum
  - Projektleiter
  - Links zu Dokumentation
- [x] Bearbeitung bestehender Projekte
- [x] Archivierungsfunktion für abgeschlossene Projekte
- [x] Archivierte Projekte sind separat abrufbar

## 3. Mitarbeiter- und Ressourcenplanung

### US-3: Employee Management
**Als** Administrator  
**möchte ich** Mitarbeiter hinzufügen und deren Details verwalten können  
**damit** ich Ressourcen effizient planen kann

**Akzeptanzkriterien:**
- [x] Mitarbeiteranlage mit folgenden Feldern:
  - Name
  - Seniorität
  - Qualifikationen
  - Arbeitszeitfaktor
- [x] Bearbeitung bestehender Mitarbeiterdaten
- [ ] Erfassung von Abwesenheiten
- [ ] Berücksichtigung von Vertragsenden in der Planung

## 4. Berichtswesen und Analyse

### US-4: Resource Reporting
**Als** Projektleiter  
**möchte ich** Berichte über die Ressourcennutzung erstellen können  
**damit** ich die Effizienz der Teams analysieren kann

**Akzeptanzkriterien:**
- [ ] Ressourcenübersicht mit Filteroptionen
- [ ] Filterung nach:
  - Team
  - Projektname
  - Mitarbeitername
- [ ] Export der gefilterten Daten

## 5. Integration und Datenimport/-export

### US-5: Data Import/Export
**Als** Benutzer  
**möchte ich** Daten im CSV-Format importieren und exportieren können  
**damit** ich Daten leicht austauschen und migrieren kann

**Akzeptanzkriterien:**
- [ ] CSV-Import für:
  - Projekte
  - Mitarbeiter
  - Abwesenheiten
- [ ] CSV-Export für alle Datenbereiche
- [ ] Validierung der Import-Daten
- [ ] Fehlerbehandlung bei ungültigen Daten

## 6. Benutzerfreundlichkeit

### US-6: Responsive Design
**Als** Benutzer  
**möchte ich** das System auf verschiedenen Geräten nutzen können  
**damit** ich flexibel arbeiten kann

**Akzeptanzkriterien:**
- [x] Responsive Layout
- [x] Material-UI Komponenten implementiert
- [ ] Optimierte Darstellung auf:
  - Desktop
  - Tablet
  - Mobilgeräten

## Status-Legende
- [x] Implementiert und getestet
- [ ] Noch nicht implementiert

## Tracking-Notizen
- Grün markierte User Stories sind vollständig implementiert
- Teilweise implementierte Stories zeigen einzelne erfüllte Akzeptanzkriterien
- Regelmäßige Überprüfung und Aktualisierung des Status
