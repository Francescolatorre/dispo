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
  - Projektleiter (muss existierender Mitarbeiter sein)
  - Links zu Dokumentation
- [x] Projektleiter wird automatisch als Projektmitglied hinzugefügt
- [x] Bearbeitung bestehender Projekte
- [x] Archivierungsfunktion für abgeschlossene Projekte
- [x] Archivierte Projekte sind separat abrufbar

### US-2.1: Project Resource Assignment
**Als** Projektleiter  
**möchte ich** Mitarbeiter mit spezifischen Zeiträumen Projekten zuweisen können  
**damit** ich die Ressourcenplanung effektiv verwalten kann

**Akzeptanzkriterien:**
- [ ] Mitarbeiterzuweisung zu Projekten mit:
  - Start-Datum (muss innerhalb Projektlaufzeit liegen)
  - End-Datum (muss innerhalb Projektlaufzeit liegen)
  - Auslastung in Prozent
- [ ] Ein Mitarbeiter kann mehreren Projekten gleichzeitig zugewiesen sein
- [ ] Ein Projekt kann mehrere Mitarbeiter haben
- [ ] Validierung der Zuweisungszeiträume gegen Projektlaufzeit

## 3. Mitarbeiter- und Ressourcenplanung

### US-3.1: Basis-Mitarbeiterverwaltung
**Als** Administrator  
**möchte ich** Mitarbeiter anlegen und deren Stammdaten verwalten können  
**damit** ich eine zentrale Mitarbeiterdatenbank pflegen kann

**Akzeptanzkriterien:**
- [x] Mitarbeiteranlage mit folgenden Pflichtfeldern:
  - Name
  - Personalnummer
  - Eintrittsdatum
  - Vertragsende (optional)
  - E-Mail
  - Telefonnummer
- [x] Bearbeitung bestehender Mitarbeiterdaten
- [ ] Archivierung ausgeschiedener Mitarbeiter
- [ ] Historisierung von Änderungen

seement
**Als** Administrator  
**möchte ich** die Qualifikationen und Fähigkeiten der Mitarbeiter verwalten können  
**damit** ich passende Mitarbeiter für Projekte finden kann

**Akzeptanzkriterien:**
- [ ] Verwaltung von:
  - Technischen Skills (z.B. Programmiersprachen, Tools)
  - Zertifizierungen mit Gültigkeitsdatum
  - Sprachkenntnissen mit Niveau
  - Soft Skills
- [ ] Skill-Level-Definition (1-5)
- [ ] Dokumentation von Weiterbildungen
- [ ] Suchfunktion nach Skills

### US-3.3: Abwesenheitsverwaltung
**Als** Administrator oder Projektleiter  
**möchte ich** Mitarbeiterabwesenheiten erfassen und verwalten können  
**damit** ich diese in der Ressourcenplanung berücksichtigen kann

**Akzeptanzkriterien:**
- [ ] Erfassung verschiedener Abwesenheitsarten:
  - Urlaub
  - Krankheit
  - Weiterbildung
  - Sonderurlaub
- [ ] Validierung gegen bestehende Projektzuweisungen
- [ ] Übersicht der Abwesenheiten pro Mitarbeiter
- [ ] Kalenderansicht der Teamabwesenheiten
- [ ] Export der Abwesenheitsdaten

### US-3.4: Verfügbarkeitsmanagement
**Als** Projektleiter  
**möchte ich** die Verfügbarkeit von Mitarbeitern einsehen können  
**damit** ich realistische Projektplanungen erstellen kann

**Akzeptanzkriterien:**
- [ ] Anzeige der Gesamtauslastung pro Mitarbeiter
- [ ] Berücksichtigung von:
  - Teilzeitfaktoren
  - Projektzuweisungen
  - Abwesenheiten
  - Vertragsenden
- [ ] Warnungen bei Überlastung (>100%)
- [ ] Vorschau der Verfügbarkeit für die nächsten 6 Monate

### US-3.5: Skill-Entwicklung und Karriereplanung
**Als** Administrator  
**möchte ich** die Entwicklung der Mitarbeiterqualifikationen planen können  
**damit** ich gezielte Weiterbildungsmaßnahmen einleiten kann

**Akzeptanzkriterien:**
- [ ] Erfassung von Entwicklungszielen
- [ ] Tracking von:
  - Geplanten Zertifizierungen
  - Weiterbildungsmaßnahmen
  - Karrierestufen
- [ ] Dokumentation von Entwicklungsgesprächen
- [ ] Skill-Gap-Analyse

[Rest of the file unchanged from line 66 onwards...]

## 4. Projektvisualisierung und Analyse

[Previous content continues unchanged...]
