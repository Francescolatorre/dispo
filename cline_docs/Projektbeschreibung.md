### Projektanforderungen und Architektur

#### 1. **Benutzerverwaltung**
   - **Benutzeranlage:** Admins legen Benutzer an.
   - **Passwort-Wiederherstellung:** Keine Passwort-Wiederherstellungsfunktion.

#### 2. **Projektmanagement**
   - **Projektattribute:** 
     - Name
     - Start-Datum
     - End-Datum
     - Projektleiter
     - Links zu Dokumentation
   - **Projektarchivierung:** Möglichkeit, Projekte zu archivieren, wenn sie abgeschlossen sind.

#### 3. **Mitarbeiter- und Ressourcenplanung**
   - **Mitarbeiterattribute:**
     - Name
     - Seniorität
     - Qualifikationen
     - Arbeitszeitfaktor
   - **Abwesenheiten:** Erfassung und Berücksichtigung geplanter Abwesenheiten (Urlaub, Krankheit).
   - **Ablaufende Arbeitsverträge:** Anzeige von ablaufenden Arbeitsverträgen und entsprechende Berücksichtigung in der Ressourcenplanung.

#### 4. **Benachrichtigungen und Kommunikation**
   - **E-Mail-Benachrichtigungen:** Keine E-Mail-Benachrichtigungen.
   - **Interne Kommunikationsfunktion:** Keine interne Kommunikationsfunktion.

#### 5. **Berichtswesen und Analyse**
   - **Berichtetypen:** Ressourcenüberblick, filterbar nach Teams.
   - **Filtermöglichkeiten:** 
     - Projekte: Filter nach Namen.
     - Mitarbeiter: Filter nach Namen und Team.

#### 6. **Sicherheitsanforderungen**
   - **Sicherheitsrichtlinien:** Umsetzung aktueller Sicherheitsbest Practices und Empfehlungen, z.B. HTTPS, sichere Passwort-Speicherung.

#### 7. **Zugriffskontrolle**
   - Keine restriktiven Zugriffskontrollen basierend auf Projekten oder Mitarbeiterdaten.

#### 8. **Integration und Datenimport/-export**
   - **Datenformate:** Unterstützung von CSV für den Start.
   - **Schnittstellen:** Planung für spätere Anbindung an andere Tools zur Verwaltung von Mitarbeiterstammdaten.

#### 9. **Benutzerfreundlichkeit und UX**
   - **Responsives Design:** Benutzeroberfläche soll auf verschiedenen Geräten optimal nutzbar sein.

### Architektonische Komponenten

#### Backend:
- **Technologie:** Node.js mit Express
- **Funktionalität:**
  - RESTful API zur Verwaltung von Benutzern, Projekten und Mitarbeitern
  - Verbindung zu PostgreSQL-Datenbank
  - Endpoint für CSV-Import und -Export

#### Datenbanken:
- **Technologie:** PostgreSQL
- **Nutzung:**
  - Speicherung von Benutzern, Projekten und Mitarbeiterdaten
  - Speicherung und Verwaltung von Abwesenheiten und Arbeitsverträgen

#### Frontend:
- **Technologie:** React
- **Funktionalität:**
  - Formulareingabe und Darstellung von Projekten und Mitarbeiterdaten
  - Filterfunktionen für Projekte und Mitarbeiter
  - Responsive Design unter Verwendung von Material-UI-Komponenten

#### UI-Komponenten:
- **Technologie:** Material-UI
- **Nutzung:**
  - Einheitliche und benutzerfreundliche Benutzeroberfläche
  - Verwendung von vorgefertigten Komponenten für Formulare, Tabellen, Buttons usw.

#### Datenimport/-export:
- **Technologie:** Papa Parse
- **Funktionalität:**
  - Parsing und Verarbeitung von CSV-Dateien für den Import-/Export-Prozess

#### Sicherheit:
- **Technologie:** bcrypt.js
- **Funktionalität:**
  - Sicheres Hashing von Passwörtern zur Benutzerauthentifizierung

#### API-Dokumentation und Test:
- **Technologie:** Swagger (OpenAPI)
- **Nutzung:**
  - Dokumentation der API-Endpunkte
  - Möglichkeit der API-Tests und Validierung

#### Hosting/Deployment:
- **Plattform:** Heroku
- **Nutzung:**
  - Bereitstellung des Backends und Frontends
  - Skalierbarkeit und einfache Verwaltung

---

### Zusammenfassung:
Dieses Design fokussiert sich auf die Implementierung eines Minimum Viable Product (MVP), das die wichtigsten Funktionen für Benutzerverwaltung, Projektmanagement, Mitarbeiter- und Ressourcenplanung bietet. Mit Node.js und Express als Backend, PostgreSQL als Datenbank, React als Frontend und Material-UI zur Gestaltung der Benutzeroberfläche, weist das MVP eine hohe Flexibilität und Skalierbarkeit auf. Die Implementierung unterstützt CSV-Imports/-Exports und berücksichtigt Sicherheitsbest Practices, während die Nutzung von Heroku eine schnelle und effiziente Bereitstellung ermöglicht.



### User Stories mit Akzeptanzkriterien

#### 1. **Benutzerverwaltung**

**User Story:** Als Administrator möchte ich Benutzer anlegen können, damit sie auf das System zugreifen können.

**Akzeptanzkriterien:**
- Ein Administrator kann mithilfe eines Formulars einen neuen Benutzer anlegen.
- Das Formular enthält Felder für Benutzernamen und Passwort.
- Der neu angelegte Benutzer kann sich mit den angegebenen Anmeldedaten einloggen.
- Benutzer können nicht ihre eigenen Passwörter zurücksetzen (keine Passwort-Wiederherstellungsfunktion).

#### 2. **Projektmanagement**

**User Story:** Als Administrator oder Projektleiter möchte ich neue Projekte erstellen und verwalten können, um den Projektstatus und relevante Informationen zu verfolgen.

**Akzeptanzkriterien:**
- Ein Benutzer kann ein neues Projekt anlegen und dabei die erforderlichen Informationen eingeben (Name, Start-Datum, End-Datum, Projektleiter, Links zur Dokumentation).
- Bestehende Projekte können bearbeitet werden.
- Benutzer können Projekte archivieren, sobald sie abgeschlossen sind.
- Archivierte Projekte werden nicht in der aktiven Projektliste angezeigt, sind aber weiterhin abrufbar.

#### 3. **Mitarbeiter- und Ressourcenplanung**

**User Story:** Als Administrator möchte ich Mitarbeiter hinzufügen und deren Verfügbarkeit sowie Qualifikationen verfolgen können, um Ressourcen effizient zu planen.

**Akzeptanzkriterien:**
- Ein Benutzer kann neue Mitarbeiter hinzufügen, indem er deren Name, Seniorität, Qualifikationen und Arbeitszeitfaktor eingibt.
- Bestehende Mitarbeiterdaten können bearbeitet werden.
- Administratoren können Abwesenheiten (z. B. Urlaub, Krankheit) erfassen und anzeigen.
- Das System berücksichtigt bei der Ressourcenplanung ablaufende Arbeitsverträge und plant diese Mitarbeiter entsprechend nicht ein.

#### 4. **Benachrichtigungen und Kommunikation**

**User Story:** Als Benutzer möchte ich in der Lage sein, Änderungen und Aktualisierungen im System ohne E-Mail-Benachrichtigungen zu verfolgen.

**Akzeptanzkriterien:**
- E-Mail-Benachrichtigungen sind im System vorgesehen.
- Benutzer können keine Nachrichten oder Kommentare innerhalb des Systems austauschen.

#### 5. **Berichtswesen und Analyse**

**User Story:** Als Projektleiter möchte ich Berichte über die Ressourcennutzung erstellen können, um die Effizienz der Teams zu analysieren.

**Akzeptanzkriterien:**
- Das System bietet Berichte, die einen Überblick über die Ressourcenauslastung geben.
- Berichte können nach Team gefiltert werden.
- Projektleiter können die Berichte nach Projektnamen filtern.
- Es ist möglich, die Mitarbeiterberichte nach Namen und Team zu filtern.

#### 6. **Sicherheitsanforderungen**

**User Story:** Als Systembetreiber möchte ich sicherstellen, dass das System die aktuellen Sicherheitsbest Practices einhält, um Benutzerdaten zu schützen.

**Akzeptanzkriterien:**
- Das System verwendet HTTPS für sichere Datenübertragung.
- Passwörter werden sicher unter Verwendung von bcrypt.js gehasht.
- Alle gespeicherten Daten entsprechen den aktuellen Sicherheitsrichtlinien und Best Practices.

#### 7. **Zugriffskontrolle**

**User Story:** Als Benutzer möchte ich auf alle erforderlichen Daten zugreifen können, ohne durch restriktive Zugriffskontrollen eingeschränkt zu werden.

**Akzeptanzkriterien:**
- Das System implementiert keine restriktiven Zugriffskontrollen basierend auf Projektebenen oder Mitarbeiterdaten.
- Jeder Benutzer mit den entsprechenden Rechten kann auf die notwendigen Daten zugreifen und diese verwalten.

#### 8. **Integration und Datenimport/-export**

**User Story:** Als Benutzer möchte ich Projektdaten und Mitarbeiterinformationen im CSV-Format importieren und exportieren können, um Daten leicht austauschen und migrieren zu können.

**Akzeptanzkriterien:**
- Benutzer können Daten im CSV-Format importieren und exportieren.
- Der Importvorgang validiert die CSV-Datei und zeigt Fehler an, falls das Format oder die Daten ungültig sind.
- Der Exportvorgang generiert eine CSV-Datei, die die aktuellen Daten des Systems enthält.

#### 9. **Benutzerfreundlichkeit und UX**

**User Story:** Als Benutzer möchte ich das System sowohl auf Desktop- als auch auf mobilen Geräten problemlos nutzen können.

**Akzeptanzkriterien:**
- Die Benutzeroberfläche ist vollständig responsiv und passt sich verschiedenen Bildschirmgrößen an.
- Wichtige Elemente und Funktionen sind auf allen Gerätetypen zugänglich und benutzerfreundlich.

Mit diesen User Stories und Akzeptanzkriterien lässt sich das MVP strukturiert und zielgerichtet entwickeln, wobei die wichtigsten Anforderungen und Funktionalitäten klar definiert sind.