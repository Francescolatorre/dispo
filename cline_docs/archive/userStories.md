# User Stories and Acceptance Criteria

## 1. Benutzerverwaltung

### US-1: Administrator User Management
**Als** Administrator  
**möchte ich** Benutzer anlegen können  
**damit** sie auf das System zugreifen können

**Akzeptanzkriterien:**
- [ ] Benutzeranlage-Formular enthält:
  - Username (required, min 3 chars, alphanumeric)
  - Password (required, min 8 chars, 1 uppercase, 1 number, 1 special char)
  - Role selection (required, "admin" or "project_leader")
- [ ] System validiert:
  - Username-Uniqueness in Echtzeit
  - Passwort-Komplexität während der Eingabe
  - Vollständigkeit aller Pflichtfelder
- [ ] Nach erfolgreicher Anlage:
  - Benutzer erhält Bestätigungs-Email
  - Benutzer kann sich sofort einloggen
  - Admin sieht Erfolgsmeldung
- [ ] Bei Fehlern:
  - Formular behält eingegebene Daten (außer Passwort)
  - Spezifische Fehlermeldungen pro Feld
  - Keine Benutzeranlage bei Validierungsfehlern
- [ ] Testfälle für Edge Cases:
  - Maximale Länge Username (50 Zeichen)
  - Sonderzeichen im Username (nicht erlaubt)
  - Passwort mit Leerzeichen (erlaubt)
  - Doppelte Email-Adressen (nicht erlaubt)
  - Gleichzeitiges Anlegen des gleichen Usernames
- [ ] Fehlerszenarien:
  - Email-Server nicht erreichbar
  - Datenbank-Verbindung unterbrochen
  - Session-Timeout während Anlage
  - Browser-Refresh während Anlage

## 2. Projektmanagement

### US-2: Project Creation and Management
**Als** Administrator oder Projektleiter  
**möchte ich** neue Projekte erstellen und verwalten können  
**damit** ich den Projektstatus und relevante Informationen verfolgen kann

**Akzeptanzkriterien:**
- [x] Projektanlage-Formular validiert:
  - Name (required, unique, 3-50 chars)
  - Start-Datum (required, nicht in Vergangenheit)
  - End-Datum (required, nach Start-Datum)
  - Projektleiter (required, Dropdown mit aktiven Mitarbeitern)
  - Dokumentations-Links (optional, gültige URLs)
- [x] Bei Projektanlage:
  - System prüft Verfügbarkeit des Projektleiters
  - Automatische Zuweisung des Projektleiters mit 20% Mindestauslastung
  - Projekt erscheint sofort in Projektübersicht
- [x] Bearbeitung existierender Projekte:
  - Änderungshistorie wird protokolliert
  - Keine Kürzung der Projektlaufzeit bei existierenden Zuweisungen
  - Email-Benachrichtigung an Projektleiter bei Änderungen
- [x] Archivierungsprozess:
  - Nur möglich wenn alle Zuweisungen beendet
  - Archivierte Projekte in separater Ansicht
  - Wiederherstellung möglich durch Admin

### US-2.1: Project Resource Assignment
**Als** Projektleiter  
**möchte ich** Mitarbeiter mit spezifischen Zeiträumen Projekten zuweisen können  
**damit** ich die Ressourcenplanung effektiv verwalten kann

**Akzeptanzkriterien:**
- [ ] Zuweisungsformular validiert:
  - Start-Datum (innerhalb Projektlaufzeit)
  - End-Datum (innerhalb Projektlaufzeit)
  - Auslastung (10-100%, in 10er Schritten)
  - Keine Überschneidung mit Abwesenheiten
- [ ] Mehrfachzuweisungen:
  - System prüft Gesamtauslastung ≤ 100%
  - Warnung bei > 80% Auslastung
  - Übersicht aller Zuweisungen des Mitarbeiters
- [ ] Änderungen an Zuweisungen:
  - Protokollierung aller Änderungen
  - Email-Benachrichtigung an betroffene Mitarbeiter
  - Keine rückwirkenden Änderungen erlaubt
- [ ] Testfälle für Edge Cases:
  - Zuweisung genau am Projektstart/-ende
  - Mitarbeiter in Teilzeit (Auslastung anpassen)
  - Überlappende Zuweisungen mit 90% + 20%
  - Zuweisung während geplanter Urlaub/Krankheit
  - Zuweisung über Vertragsende hinaus
  - Mehrere gleichzeitige Zuweisungen nahe 100%
- [ ] Fehlerszenarien:
  - Projekt während Zuweisung archiviert
  - Mitarbeiter während Zuweisung deaktiviert
  - Gleichzeitige Zuweisungen durch mehrere Projektleiter
  - Massenänderung von Zuweisungen
  - Netzwerkfehler während Speichervorgang

## 3. Mitarbeiter- und Ressourcenplanung

### US-3.1: Basis-Mitarbeiterverwaltung
**Als** Administrator  
**möchte ich** Mitarbeiter anlegen und deren Stammdaten verwalten können  
**damit** ich eine zentrale Mitarbeiterdatenbank pflegen kann

**Akzeptanzkriterien:**
- [x] Mitarbeiteranlage validiert:
  - Name (required, 2-50 chars)
  - Personalnummer (required, unique, Format: "EMP-YYYY-XXXX")
  - Eintrittsdatum (required, nicht in Zukunft)
  - Vertragsende (optional, nach Eintrittsdatum)
  - E-Mail (required, gültiges Format, Firmen-Domain)
  - Telefonnummer (required, gültiges Format)
- [x] Bei Änderungen:
  - Automatische Versionierung aller Änderungen
  - Protokollierung von Bearbeiter und Zeitpunkt
  - Email-Benachrichtigung an Personalwesen
- [ ] Archivierungsprozess:
  - Automatisch bei Erreichen des Vertragsendes
  - Manuelle Archivierung mit Begründung möglich
  - Archivierte Mitarbeiter in separater Ansicht
- [ ] Daten-Export:
  - PDF-Export der Mitarbeiterdaten
  - Excel-Export für Massendatenverarbeitung
  - Filterung nach aktiv/archiviert

### US-3.2: Qualifikationsmanagement
**Als** Administrator  
**möchte ich** die Qualifikationen und Fähigkeiten der Mitarbeiter verwalten können  
**damit** ich passende Mitarbeiter für Projekte finden kann

**Akzeptanzkriterien:**
- [ ] Qualifikationserfassung:
  - Technische Skills:
    * Name (aus vordefinierter Liste)
    * Level (1-5, mit Beschreibung pro Level)
    * Erfahrung in Jahren
    * Letzter Einsatz
  - Zertifizierungen:
    * Name (aus vordefinierter Liste)
    * Ausstellungsdatum
    * Ablaufdatum
    * PDF-Upload des Zertifikats
  - Sprachkenntnisse:
    * Sprache (aus ISO-Liste)
    * Niveau (A1-C2)
    * Zertifikat (optional)
  - Soft Skills:
    * Kategorie (aus vordefinierter Liste)
    * Bewertung (1-5)
    * Bemerkungen
- [ ] Skill-Matching:
  - Suchfunktion nach einzelnen/kombinierten Skills
  - Filterung nach Skill-Level
  - Berücksichtigung von Zertifikatsablauf
  - Export der Suchergebnisse
- [ ] Weiterbildungsplanung:
  - Dokumentation geplanter Schulungen
  - Tracking von Zertifikatserneuerungen
  - Automatische Erinnerungen vor Ablauf
- [ ] Testfälle für Edge Cases:
  - Skill ohne Level-Angabe
  - Abgelaufene Zertifikate
  - Skill-Level Änderung während Projekt
  - Maximale Anzahl Skills pro Mitarbeiter (100)
  - Duplikate bei Soft Skills
  - Zertifikat kurz vor Ablauf
  - Sprachniveau ohne Zertifikat
  - Skill mit 0 Jahren Erfahrung
- [ ] Fehlerszenarien:
  - Ungültiges Zertifikats-PDF (>10MB)
  - Skill-Level außerhalb 1-5
  - Zertifikat ohne Ablaufdatum
  - Inkonsistente Sprachniveau-Angaben
  - Nicht-existierende Skill-Kategorie
  - Doppelte Zertifikatseinträge
  - Fehler beim PDF-Upload

### US-3.3: Abwesenheitsverwaltung
**Als** Administrator oder Projektleiter  
**möchte ich** Mitarbeiterabwesenheiten erfassen und verwalten können  
**damit** ich diese in der Ressourcenplanung berücksichtigen kann

**Akzeptanzkriterien:**
- [ ] Abwesenheitserfassung validiert:
  - Typ (required, aus Liste: Urlaub/Krankheit/Weiterbildung/Sonderurlaub)
  - Zeitraum (Start/Ende, keine Überlappung)
  - Begründung (required für Sonderurlaub)
  - Vertretung (optional, muss verfügbar sein)
- [ ] Systemprüfungen:
  - Keine Überschneidung mit 100% Projektzuweisung
  - Urlaubskonto wird automatisch aktualisiert
  - Benachrichtigung an Projektleiter betroffener Projekte
- [ ] Visualisierung:
  - Kalenderansicht mit Farbkodierung nach Typ
  - Teamübersicht mit Filtern
  - Export für Zeiterfassungssystem
- [ ] Reporting:
  - Abwesenheitsstatistiken pro Mitarbeiter/Team
  - Urlaubskontostand
  - Krankheitsquote
- [ ] Testfälle für Edge Cases:
  - Krankheit während Urlaub (Urlaubstage gutschreiben)
  - Feiertage in Abwesenheitsperiode (nicht zählen)
  - Halbe Urlaubstage (vormittags/nachmittags)
  - Überlappende Abwesenheiten verschiedener Typen
  - Abwesenheit über Jahreswechsel (Urlaubskonto)
  - Kurzfristige Krankmeldung
  - Vertretung selbst abwesend
  - Sonderurlaub ohne Begründung
- [ ] Fehlerszenarien:
  - Urlaubskonto überzogen
  - Vertretung nicht verfügbar
  - Stornierung bereits begonnener Abwesenheit
  - Krankmeldung für vergangene Tage
  - Doppelte Abwesenheitsmeldung
  - Fehler in Kalendersynchronisation
  - Inkonsistente Urlaubsberechnung

### US-3.4: Verfügbarkeitsmanagement
**Als** Projektleiter  
**möchte ich** die Verfügbarkeit von Mitarbeitern einsehen können  
**damit** ich realistische Projektplanungen erstellen kann

**Akzeptanzkriterien:**
- [ ] Verfügbarkeitsanzeige:
  - Tagesgenau für die nächsten 6 Monate
  - Prozentuale Auslastung pro Woche
  - Farbkodierung (grün ≤70%, gelb ≤90%, rot >90%)
- [ ] Berechnungsfaktoren:
  - Teilzeitfaktor wird korrekt einberechnet
  - Projektzuweisungen werden summiert
  - Abwesenheiten werden berücksichtigt
  - Vertragsende wird markiert
- [ ] Warnungen:
  - Email bei Überlastung >100%
  - Markierung bei Vertragsende in nächsten 3 Monaten
  - Hinweis auf lange Abwesenheiten
- [ ] Planungstools:
  - "Was-wäre-wenn" Simulation neuer Zuweisungen
  - Team-Kapazitätsplanung
  - Export der Auslastungsdaten
- [ ] Testfälle für Edge Cases:
  - Verfügbarkeit bei flexibler Arbeitszeit
  - Berechnung bei Teilzeit-Änderung
  - Feiertage in verschiedenen Standorten
  - Ressourcenplanung über Jahreswechsel
  - Berücksichtigung von Bereitschaftszeiten
  - Mitarbeiter mit mehreren Teilzeitverträgen
  - Überlappende Projektphasen
  - Langzeitabwesenheiten
- [ ] Fehlerszenarien:
  - Inkonsistente Auslastungsdaten
  - Fehlerhafte Teilzeitberechnung
  - Überlappende Planungsszenarien
  - Verfügbarkeitsberechnung bei ungültigen Daten
  - Gleichzeitige Simulationen mehrerer Nutzer
  - Fehler in der Feiertags-API
  - Timeout bei komplexen Berechnungen

### US-3.5: Skill-Entwicklung und Karriereplanung
**Als** Administrator  
**möchte ich** die Entwicklung der Mitarbeiterqualifikationen planen können  
**damit** ich gezielte Weiterbildungsmaßnahmen einleiten kann

**Akzeptanzkriterien:**
- [ ] Entwicklungsziele:
  - SMART-Kriterien für jedes Ziel
  - Zeitplan mit Meilensteinen
  - Verknüpfung mit Weiterbildungsmaßnahmen
  - Status-Tracking
- [ ] Maßnahmentracking:
  - Geplante Zertifizierungen mit Terminen
  - Budgetierung von Weiterbildungen
  - Erfolgsquote der Maßnahmen
  - Feedback-Erfassung
- [ ] Karriereentwicklung:
  - Definition von Karrierepfaden
  - Skill-Gap-Analyse mit Soll/Ist-Vergleich
  - Automatische Vorschläge für Weiterbildungen
- [ ] Reporting:
  - Entwicklungsfortschritt pro Mitarbeiter
  - Team-Skill-Matrix
  - Weiterbildungsbudget-Tracking

## 4. Projektvisualisierung und Analyse

### US-4.1: Ressourcenauslastung
**Als** Projektleiter oder Administrator  
**möchte ich** die Ressourcenauslastung visualisieren können  
**damit** ich Engpässe und Optimierungspotenziale erkennen kann

**Akzeptanzkriterien:**
- [ ] Timeline-Ansicht:
  - Monatsweise scrollbar
  - Farbkodierte Auslastungsgrade
  - Drill-down zu Projektdetails
  - Filter nach Teams/Skills
- [ ] Auslastungsberechnung:
  - Berücksichtigung von Teilzeit
  - Einbeziehung von Abwesenheiten
  - Warnung bei Über-/Unterlast
- [ ] Export-Funktionen:
  - PDF-Report
  - Excel-Datenexport
  - Automatische Reports
