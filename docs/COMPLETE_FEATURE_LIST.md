# Dispo – vollständige Feature-Liste

Master-Inventar aller umgesetzten Funktionen, abgeleitet aus dem Code (`client/src`, `server/`).
Bei jeder funktionalen Änderung aktualisieren.

Legende: ✅ fertig · ⚠️ eingeschränkt · ⏳ geplant / nicht umgesetzt

## Planungsboard

| Status | Funktion | Beschreibung |
|---|---|---|
| ✅ | Wochenraster | ISO-Kalenderwochen als Spalten; Standard 2 Wochen zurück bis 14 voraus (17 Spalten), Monats- und KW-Kopf, aktuelle Woche hervorgehoben |
| ✅ | Navigation | ‹ / › verschieben den Zeitraum um 4 Wochen, „Heute“ springt zurück |
| ✅ | Zoom S/M/L | Spaltenbreite 56 / 88 / 128 px (Segmentschalter „Spaltenbreite“) |
| ✅ | Dichte | „Ansicht“-Menü: Komfort oder Kompakt (kompakt blendet die Metazeile aus) |
| ✅ | Auslastungs-Heatmap | Jede Personen-Woche eingefärbt nach Auslastung relativ zur Kapazität: frei / ≤ 50 % Luft / 51–99 % / 100 % voll / > 100 % überbucht (rot mit Symbol) |
| ✅ | Lauflängen-Beschriftung | Prozentwert nur am Beginn einer Folge gleicher Werte; alle Werte bei Hover/Fokus der Zeile |
| ✅ | Projektbalken | Leicht getönte Karten mit 3-px-Kante in Projektfarbe; Name bleibt beim Scrollen sichtbar (sticky), Allokation ab 120 px Breite, Initialen bei schmalen Balken |
| ✅ | Abgeschnittene Balken | Beginn/Ende außerhalb des Zeitraums: gerade Kante plus Chevron; die Farbkante bleibt am sichtbaren linken Rand |
| ✅ | Spuren | Überlappende Einsätze einer Person in Spuren; ab mehr Spuren als Platz „+N weitere“, aufklappbar („Einklappen“) |
| ✅ | Heute-Linie | Dünne Akzentlinie am heutigen Tag, nur im Balkenbereich; Markierung im Kopf |
| ✅ | Wochenenden | Balken rasten auf Arbeitswochen ein (Ende Fr–So = Wochenende der Spalte) |
| ✅ | Personenspalte | Sticky: Initialen, Name, Rolle · Seniorität, Teilzeit-Kapazität, „inaktiv“-Marke |
| ✅ | Legende und Zähler | Fußzeile mit Auslastungsskala, Heute-Symbol, „X von Y Personen“ |
| ✅ | Lade-, Fehler- und Leerzustände | Struktur-Skelett beim Laden, Fehler mit „Erneut versuchen“, Leerzustand mit „Filter zurücksetzen“ |
| ⚠️ | Große Teams | Keine Zeilenvirtualisierung; ab etwa 100 Personen wird das Board träge |

## Filter

| Status | Funktion | Beschreibung |
|---|---|---|
| ✅ | Personensuche | Freitext auf den Namen; als `?q=` in der URL |
| ✅ | Rollenfilter | Menü mit allen vorkommenden Rollen |
| ✅ | Projektfilter | Zeigt nur beteiligte Personen, hebt Balken des Projekts hervor und dimmt die übrigen; als `?project=` in der URL |
| ✅ | Schnellfilter „überbucht“ | Chip mit Anzahl überbuchter Personenwochen der nächsten 4 Wochen; filtert auf betroffene Personen |
| ✅ | Schnellfilter „mit Luft“ | Chip mit Anzahl Personen, die in jeder der nächsten 4 Wochen ≥ 20 % frei haben |
| ✅ | Inaktive Personen | Standardmäßig ausgeblendet; „Ansicht“ → „Inaktive zeigen“ |

## Interaktionen

| Status | Funktion | Beschreibung |
|---|---|---|
| ✅ | Verschieben per Ziehen | Balken wochenweise verschieben (Maus, Stift, Touch); Ziehen auf eine andere Zeile weist den Einsatz der Person zu |
| ✅ | Dauer ändern | Greifzonen an Anfang und Ende, rasten auf ganze Wochen ein |
| ✅ | Anlegen per Ziehen | Ziehen auf leerer Zeilenfläche öffnet die Anlegen-Seitenleiste mit vorbelegter Person und Zeitraum |
| ✅ | Live-Vorschau | Während des Ziehens: Geisterbalken, projizierte Auslastung („90 → 120“), Hinweisblase mit Folgen; Esc bricht ab |
| ✅ | Klick vs. Ziehen | Erst nach einer Mindeststrecke wird aus dem Klick ein Ziehen; Klick öffnet die Bearbeiten-Seitenleiste |
| ✅ | Einsatz-Seitenleiste | Anlegen/Bearbeiten (Person, Projekt, Zeitraum, Allokation, Rolle) mit Live-Folgenvorschau (Dry-Run); blockierende Fehler inline, Warnungen blockieren nicht; Löschen |
| ✅ | „+ Einsatz“ | Toolbar-Button öffnet eine leere Anlegen-Seitenleiste |
| ✅ | Tastatur | Fokussierter Balken: Pfeile verschieben um eine Woche, Umschalt+Pfeile ändern das Ende, Entf/Rücktaste löscht |
| ✅ | Rückgängig/Wiederholen | Jede Änderung mit Toast und „Rückgängig“; Buttons in der Kopfzeile; Strg+Z, Strg+Umschalt+Z, Strg+Y |
| ⚠️ | Touch | Verschieben und Dauer ändern funktionieren; Anlegen per Ziehen auf leerer Fläche ist eingeschränkt |
| ⏳ | Autoscroll | Kein automatisches Scrollen am Rand während des Ziehens |

## Personen

| Status | Funktion | Beschreibung |
|---|---|---|
| ✅ | Personentabelle | Name, Rolle · Seniorität, Kapazität, 8-Wochen-Auslastungsstreifen, „frei ab“ (erste Woche mit ≥ 20 % frei), Status, Anzahl Einsätze |
| ✅ | Suche und Filter | Name/Rolle, Rollenfilter, inaktive ein-/ausblenden |
| ✅ | Im Board zeigen | Sprung ins Board mit Personensuche (`/?q=`) |
| ✅ | Anlegen/Bearbeiten | Seitenleiste: Name, Rolle (Freitext mit Vorschlägen), Seniorität (Junior/Mid/Senior/Lead), Kapazität 10–100 % in 10er-Schritten, Aktiv |
| ✅ | Live-Warnung | Senken der Kapazität zeigt sofort, in welchen Wochen die Person überbucht wäre |
| ✅ | Löschen | Mit Hinweis auf mitgelöschte Einsätze; per Toast rückgängig (gleiche IDs, Einsätze kommen zurück) |
| ⏳ | Abwesenheiten | Urlaub, Krankheit, Feiertage werden nicht abgebildet |
| ⏳ | Skills | Keine Fähigkeiten/Qualifikationen je Person |

## Projekte

| Status | Funktion | Beschreibung |
|---|---|---|
| ✅ | Projekttabelle | Farbe, Name, Status (geplant/aktiv/abgeschlossen), Laufzeit, Zeitachse mit Heute-Marke, Personen, FTE der laufenden Woche |
| ✅ | Suche und Statusfilter | Projektname, Status |
| ✅ | Im Board zeigen | Sprung ins Board mit Projektfilter (`/?project=`) |
| ✅ | Anlegen/Bearbeiten | Seitenleiste mit Name, Status, Zeitraum, Farbwahl aus 8 Palettenfarben (keine Ampelfarben) |
| ✅ | Validierung | Ende vor Beginn blockiert; Einsätze außerhalb der neuen Laufzeit werden live gewarnt; Altfarben außerhalb der Palette werden markiert |
| ✅ | Löschen | Mit Hinweis auf mitgelöschte Einsätze; per Toast rückgängig |
| ⏳ | Projektbedarfe | Keine Anforderungen/Soll-Besetzung je Projekt |

## Auslastungslogik

| Status | Funktion | Beschreibung |
|---|---|---|
| ✅ | Auslastung relativ zur Kapazität | Allokation in FTE-%; Auslastung = Last / (Kapazität × 100); Teilzeit eingerechnet |
| ✅ | Freie Kapazität | Wie viel FTE-% bis 100 % Auslastung noch frei ist |
| ✅ | Statusskala | frei / Luft / ok / voll / überbucht; genau 100 % ist „voll“, keine Warnung |
| ✅ | Überbuchung nie blockiert | Validierung trennt blockierende Fehler (Datum, Allokation, unbekannte Referenz) von Warnungen (Überbuchung, außerhalb der Projektlaufzeit, inaktive Person) |
| ✅ | Folgenberechnung | Jede Schreibaktion liefert die betroffenen Personen-Wochen mit Auslastung vorher/nachher |
| ✅ | Einziger Schreibpfad | `planningActions` für UI und WebMCP: validieren, anwenden, Undo/Redo-Historie |

## Datenhaltung und API

| Status | Funktion | Beschreibung |
|---|---|---|
| ✅ | Lokale Daten | `LocalRepository` im localStorage (versionierter Schlüssel), Demodaten relativ zu heute beim ersten Start |
| ✅ | REST-API | Express + Postgres: CRUD für Personen, Projekte, Einsätze (`docs/api.md`), Patch-Semantik bei PUT, kaskadierendes Löschen, Health-Check |
| ✅ | Validierung im Server | Eingabeprüfung plus DB-Constraints; Fehler als 400/404/409 mit Feldangaben |
| ✅ | Automatische Quellenwahl | `VITE_DATA_SOURCE=auto|api|local`; `auto` prüft `/api/health` |
| ✅ | Demodaten im Server | Leere Datenbank wird beim ersten Client-Start einmalig mit den Demodaten befüllt |
| ✅ | Anzeige der Quelle | Seitenleiste: „Lokale Daten“ / „Server“, Popover mit Datenübersicht |
| ✅ | Migrationen und Docker | `npm run db:up`, `npm run db:migrate`; Testdatenbank `dispo_test` |
| ⚠️ | Mehrbenutzerbetrieb | Keine Anmeldung, keine Rechte, keine Konflikterkennung („last write wins“), kein Live-Abgleich |

## WebMCP (KI-Werkzeuge)

| Status | Funktion | Beschreibung |
|---|---|---|
| ✅ | Registrierung | 9 Werkzeuge über `document.modelContext` (Fallback `navigator.modelContext`), Abmelden per AbortSignal; ohne WebMCP passiert nichts |
| ✅ | Lesewerkzeuge | `list_employees`, `list_projects`, `get_workload`, `find_free_capacity` |
| ✅ | Schreibwerkzeuge | `create_assignment`, `update_assignment`, `delete_assignment` (mit `dryRun`, Namensauflösung, Folgen), `undo_last_change` |
| ✅ | Sichtbarkeit | Änderungen des Assistenten erscheinen als Toast „… – durch KI-Assistent“ mit Rückgängig |
| ✅ | Statuszeile | Seitenleiste zeigt „KI-Werkzeuge aktiv (WebMCP)“, sobald Werkzeuge registriert sind |
| ⚠️ | Native Browser | Nur mit Test-Stub geprüft (Unit- und E2E-Tests); natives Chrome und Claude über das MCP-B-Relay ungetestet |

## Design und Barrierefreiheit

| Status | Funktion | Beschreibung |
|---|---|---|
| ✅ | Leitstand-Design | Eigene Tokens (Geist-Schrift, Farbskala), Auslastung als einzige laute Farbe; Projektpalette ohne Rot/Orange/Gelb/Grün |
| ✅ | Shell | Seitenleiste mit Marke, Navigation (Planung, Personen, Projekte), Datenquelle; unter 1280 px schmale Icon-Leiste |
| ✅ | Toasts | Dunkle Toasts unten mittig, Folgen mit ⚠, „Rückgängig“-Aktion |
| ✅ | Tastaturbedienung | Fokusring auf allen Bedienelementen, Balken fokussier- und per Tastatur bedienbar, Esc schließt Seitenleisten |
| ✅ | Screenreader | Board als `grid` mit Zeilen-/Spaltenköpfen, sprechende Zellen- und Balkenbeschriftungen, Status nicht nur über Farbe (Wort/Symbol) |
| ✅ | Sprache | Oberfläche Deutsch, `lang="de"`, Titel „Dispo – Kapazitätsplanung“ |
| ⚠️ | Bundle-Größe | Ein Chunk > 500 kB, kein Code-Splitting |

## Qualitätssicherung

| Status | Funktion | Beschreibung |
|---|---|---|
| ✅ | Unit- und Komponententests | Vitest + Testing Library (Domäne, Daten, Board, Interaktionen, Seiten, WebMCP) |
| ✅ | API-Tests | node:test + supertest gegen Postgres (`dispo_test`) |
| ✅ | E2E-Smoke-Tests | Playwright/Chromium: Board laden, Filter, Ziehen + Rückgängig, Kapazität + Warnung, WebMCP-Registrierung |
