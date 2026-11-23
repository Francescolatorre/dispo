# Product Context

## Purpose
DispoMVP ist ein Minimum Viable Product für die Ressourcen- und Projektplanung in Unternehmen. Das System ermöglicht die effiziente Verwaltung von Projekten und Mitarbeitern mit Fokus auf:

- Projektmanagement mit grundlegenden Attributen
- Mitarbeiter- und Ressourcenplanung
- Berücksichtigung von Abwesenheiten und Vertragsenden
- Berichtswesen mit Filtermöglichkeiten

## Target Users
- Administratoren: Verwalten Benutzer und Systemeinstellungen
- Projektleiter: Erstellen und verwalten Projekte
- Team Manager: Verwalten Ressourcen und Mitarbeiter

## Core Problems Solved
1. Zentrale Verwaltung von Projekt- und Mitarbeiterdaten
2. Transparente Ressourcenplanung unter Berücksichtigung von:
   - Mitarbeiterqualifikationen
   - Arbeitszeitfaktoren
   - Projektspezifische Zeiträume und Auslastung
   - Abwesenheiten
   - Vertragsenden
3. Filterbare Berichterstellung für Ressourcenübersicht
4. Einfacher Datenaustausch durch CSV-Import/-Export

## Expected Workflow
1. Administratoren legen Benutzer an
2. Projekte werden mit Basis-Attributen und Projektleiter erstellt
   - Projektleiter wird automatisch als Projektmitglied zugewiesen
3. Mitarbeiter werden mit Qualifikationen erfasst
4. Ressourcenplanung erfolgt durch:
   - Zuweisung von Mitarbeitern zu Projekten
   - Definition von Start- und Enddatum pro Zuweisung
   - Festlegung der prozentualen Auslastung und Rolle
   - Mehrere parallele Projektzuweisungen möglich
5. Projektübersicht in wochenbasierter Timeline
   - Visualisierung aller Projektlaufzeiten
   - Detailansicht der Mitarbeiterzuweisungen per Klick
   - Anzeige von Rollen und Zeiträumen
6. Berichtswesen ermöglicht Analyse der Ressourcenauslastung
7. Abgeschlossene Projekte können archiviert werden

## Key Features
- Benutzer- und Projektverwaltung
- Mitarbeiter-Ressourcenplanung
- Wochenbasierte Projekt-Timeline
- Detaillierte Ressourcenzuweisung mit Rollen
- Abwesenheitsmanagement
- Berichtswesen mit Filterfunktionen
- CSV-Import/-Export
- Responsive Design für verschiedene Endgeräte

## Non-Features (Bewusst nicht implementiert)
- Passwort-Wiederherstellung
- E-Mail-Benachrichtigungen
- Interne Kommunikationsfunktion
- Restriktive Zugriffskontrollen
