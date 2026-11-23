# WebMCP – KI-Werkzeuge im Planungsboard

DispoMVP stellt seine Planungsfunktionen als **WebMCP-Tools** bereit. Ein Browser-Agent (z. B. Gemini in Chrome, eine Erweiterung oder ein über ein Relay angebundener Desktop-Agent) kann damit Auslastung lesen und Einsätze anlegen, ändern oder löschen – über **dieselbe Aktionsschicht wie die Oberfläche** (`client/src/domain/planningActions.ts`): gleiche Validierung, gleiche Undo-Historie, und das Board aktualisiert sich sofort.

Stand der API: W3C WebML CG Draft (Nov 2026), imperative API `document.modelContext.registerTool(tool, { signal })`. Abmelden erfolgt über das `AbortSignal` (es gibt kein `unregisterTool` mehr). `navigator.modelContext` wird als veralteter Fallback unterstützt.

## Code

| Datei | Zweck |
|---|---|
| `client/src/features/webmcp/modelContext.ts` | Dünner Adapter: `getModelContext()` (`document.modelContext ?? navigator.modelContext`), `registerTools(tools, signal)`, typisierte Minimal-Interfaces |
| `client/src/features/webmcp/tools.ts` | Reine Tool-Fabrik `createPlanningTools(getContext, hooks)` – Schemas, Eingabeprüfung, Namensauflösung, Ergebnisse |
| `client/src/features/webmcp/WebMCPBridge.tsx` | Unsichtbare Komponente in `<PlanningProvider>`: registriert alle Tools, sobald Daten geladen sind, meldet sie beim Unmount ab, zeigt Toasts bei Agent-Änderungen |
| `client/src/features/webmcp/status.ts`, `WebMCPStatusLine.tsx` | Anzahl registrierter Tools als Kontext (gesetzt in `App.tsx` über `onRegistered`) und die Statuszeile „KI-Werkzeuge aktiv (WebMCP)“ in der Seitenleiste |

Ohne WebMCP im Browser passiert nichts (kein Polyfill, keine zusätzliche Abhängigkeit). Nach erfolgreicher Registrierung zeigt die Seitenleiste „KI-Werkzeuge aktiv (WebMCP)“; im Dev-Build steht zusätzlich in der Konsole: `[WebMCP] 10 Werkzeuge registriert: …`.

Die E2E-Smoke-Tests (`client/tests/smoke.spec.ts`) prüfen Registrierung und `find_free_capacity` mit einem Stub für `document.modelContext`.

## Tools

Alle Tools nehmen ein JSON-Objekt (`additionalProperties: false`) und liefern JSON. Fehler werden **nicht geworfen**, sondern als `{ ok: false, error, … }` mit konkretem Hinweis zurückgegeben (z. B. „Rufe list_employees auf“). Datumsangaben: `YYYY-MM-DD` oder ISO-Woche `YYYY-Www` (als Start = Montag, als Ende = Freitag).

| Tool | Hinweise | Eingabe | Ausgabe |
|---|---|---|---|
| `get_guide` | readOnly | `topic?` (`all` Standard, `overview`, `concepts`, `workflow`, `sops`, `pitfalls`, `tools`) | Leitfaden für Agenten: Zweck und gelöste Probleme, Begriffe/Einheiten/Ampel (Schwellen live aus der Workload-Engine), Vorgehen und Rezepte, verbindliche SOPs (z. B. keine Überbuchung ohne Auftrag, Projektlaufzeit respektieren, erst dryRun), typische Fehler; dazu `context.today`/`currentWeek`. Inhalt: `client/src/features/webmcp/guide.ts` |
| `list_employees` | readOnly | `role?`, `activeOnly?` (Standard true), `query?` | `employees[]` mit `id, name, role, seniority, capacity, active` |
| `list_projects` | readOnly | `status?` (`planned`/`active`/`done`), `query?` | `projects[]` mit `id, name, status, start, end, assignmentCount` |
| `get_workload` | readOnly | `from?`, `to?` (Standard: diese Woche + 8 Wochen, max. 26), `employeeIds?` | `employees[].weeks[]`: `load, utilization, freePercent, status, assignmentIds` (nur IDs); `employees[].assignments[]`: die Einsätze der Person im Zeitraum (mit `id`) |
| `find_free_capacity` | readOnly | `from?`, `to?`, `minFreePercent` (Standard 20), `role?` | `candidates[]` sortiert nach freier Kapazität, mit Wochenwerten |
| `create_assignment` | – | `employeeId` \| `employeeName`, `projectId` \| `projectName`, `start`, `end`, `allocation` (10–100, 10er-Schritte), `role?`, `dryRun?` | Schreib-Ergebnis (s. u.) |
| `create_project` | – | `name`, `start`, `end`, `status?` (Standard: `active` wenn Start ≤ heute, sonst `planned`), `color?` (Palette; Standard: ungenutzte Farbe), `dryRun?` | `{ ok, dryRun, summary, project, warnings, nextStep, undoLabel }`; gleicher Name → Fehler mit `existing`, ähnliche Namen → Warnung. Laut SOP-10 nur auf ausdrücklichen Wunsch; Personen und Projekt-Änderungen bleiben in der Oberfläche |
| `update_assignment` | – | `id`, beliebig: `start`, `end`, `shiftWeeks`, `allocation`, `role` (leer = entfernen), `employeeId` \| `employeeName`, `dryRun?` | Schreib-Ergebnis |
| `delete_assignment` | consequentialHint | `id`, `dryRun?` | Schreib-Ergebnis, Hinweis auf `undo_last_change` |
| `undo_last_change` | consequentialHint | `expectedLabel?` (das `undoLabel` der Schreib-Antwort; schützt davor, eine fremde Änderung zurückzunehmen) | `{ ok, summary, undone, nextUndo }` |

**Schreib-Ergebnis:** `{ ok, dryRun, summary (ein deutscher Satz), assignment, warnings[], impact[], undoLabel, undoHint }`. `impact` listet jede Personen-Woche, deren Auslastung sich ändert: `utilizationBefore/After` und `statusBefore/After`. Der `status` ist genau das, was die Workload-Engine (`workloadStatus()` in `domain/workload.ts`) liefert – also dieselbe Ampel wie im Board. Überbuchung blockiert nicht, erscheint aber als Warnung. Blockierende Validierungsfehler (ungültiges Datum, Ende vor Start, Allokation außerhalb 10–100 / keine 10er-Schritte, unbekannte Person/Projekt) kommen als `errors[]` mit `code`.

**Namensauflösung:** erst exakter Name (Groß-/Kleinschreibung egal), dann Teilstring. Mehrere Treffer → `{ ok: false, error: "… mehrdeutig …", candidates: [...] }`; keiner → Hinweis auf `list_employees` / `list_projects`.

**Sichtbarkeit:** Jede vom Agenten ausgeführte Änderung erscheint als Toast „Einsatz verschoben – durch KI-Assistent“ (bzw. angelegt/geändert/gelöscht) mit **Rückgängig**-Button; ein Undo durch den Agenten zeigt „Rückgängig: … – durch KI-Assistent“.

## Ausprobieren

### Chrome (nativ)

1. Chrome ≥ 149 (aktuelle Stable 159). `chrome://flags/#enable-webmcp-testing` aktivieren und Chrome neu starten. Für lokale Entwicklung ist kein Origin-Trial-Token nötig.
2. `cd client && npm.cmd run dev` und `http://localhost:5173` öffnen.
3. DevTools-Konsole: `[WebMCP] 10 Werkzeuge registriert: …` erscheint. Prüfen mit `!!document.modelContext`.
4. **DevTools → Application → WebMCP**: listet die Tools mit Beschreibung; dort kann man ein Tool mit bearbeiteten Parametern manuell ausführen. Das Log „Invoked Tools“ zeigt Eingabe, Ausgabe und Fehler.
   Beispiel: `find_free_capacity` mit `{"from":"2026-W52","to":"2026-W53","minFreePercent":50}`, danach `create_assignment` mit `{"employeeName":"Felix","projectName":"KI-Assistent","start":"2026-W52","end":"2026-W53","allocation":50,"dryRun":true}`.
   **Verifiziert (2026-11-23, Chrome 158 mit Flag):** `document.modelContext` vorhanden (Methoden `registerTool`, `getTools`, `executeTool`), alle damals 8 Tools registriert, `find_free_capacity` liefert Ergebnisse. Aufruf aus der Konsole: `executeTool` erwartet das **Tool-Objekt aus `getTools()`** und ein **Objekt** als Eingabe (kein JSON-String):
   ```js
   const t = (await document.modelContext.getTools()).find(x => x.name === 'find_free_capacity');
   await document.modelContext.executeTool(t, { minFreePercent: 50 });
   ```
   Hinweis: Agenten, die eine Seite nur als DOM/Screenshot lesen (z. B. die Claude-in-Chrome-Erweiterung), sehen die WebMCP-Tools **nicht** von selbst – sie brauchen einen WebMCP-fähigen Konsumenten (eingebauter Chrome-Agent, Inspector-Erweiterung) oder rufen die Tools wie oben per JavaScript auf.
   **Schreibpfad verifiziert (2026-11-23, Browser-Agent über WebMCP):** `create_assignment` (Felix, KI-Assistent, 2026-W52–W53, 20 %) erst mit `dryRun` (impact 50 → 70 %, luft → ok, keine Warnungen), dann echt angelegt (Toast „Einsatz angelegt – durch KI-Assistent“, Balken im Board), danach `undo_last_change` mit `expectedLabel: "Einsatz anlegen"` (Toast „Rückgängig: …“, Balken weg, `get_workload` wieder 50 %, Redo aktiv).
5. Alternativ die Erweiterung **Model Context Tool Inspector** (Chrome Web Store): Tools auflisten, aufrufen oder per natürlicher Sprache mit eigenem Gemini-/OpenAI-/Anthropic-API-Key steuern lassen.

### Claude Code / Claude Desktop über das MCP-B Local Relay (ungetestet)

> **Nicht getestet.** Laut MCP-B-Doku; ob das Relay auch native `document.modelContext`-Tools (ohne `@mcp-b/global`) erkennt, ist offen.

1. Relay als MCP-Server registrieren (gepinnte Version):
   ```bash
   claude mcp add webmcp-local-relay -- npx -y @mcp-b/webmcp-local-relay@6.0.3 --widget-origin http://localhost:5173
   ```
   Das Relay lauscht auf `ws://127.0.0.1:9333`.
2. Das Embed-Skript in die Seite laden (nur lokal, nicht committen), z. B. in `client/index.html`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@mcp-b/webmcp-local-relay@6.0.3/dist/browser/embed.js"></script>
   ```
3. In Claude erscheinen `webmcp_list_tools` / `webmcp_call_tool`.

Alternative für Coding-Agenten: Chrome DevTools MCP mit `--categoryExperimentalWebmcp` (Tools `list_webmcp_tools`, `execute_webmcp_tool`) – ebenfalls ungetestet.

## Entscheidung: kein Polyfill

Es wird **kein** Polyfill und keine WebMCP-Bibliothek eingebunden. Gründe:
- Ein Polyfill allein bringt keinen Nutzen: Ohne Konsument (Browser-Agent, Relay-Embed) ruft niemand die Tools auf. Zum Ausprobieren reicht das Chrome-Flag mit dem DevTools-Panel.
- Die Kandidaten (`@w3c/webmcp-polyfill` 0.1.0 vom 3.11.2026, `@mcp-b/global` 6.0.3) sind jung bzw. bringen eine MCP-Runtime mit; der Adapter selbst ist ~100 Zeilen ohne Abhängigkeit.
- Die Tool-Logik ist rein und vollständig per Vitest getestet (`tools.test.ts`), die Registrierung mit einem gestubbten `document.modelContext` (`WebMCPBridge.test.tsx`).

Falls später das Relay gebraucht wird: `@mcp-b/global@6.0.3` nur im Dev-Build dynamisch importieren, **bevor** `<App/>` rendert (die Bridge liest `document.modelContext` beim Registrieren).

## Sicherheit

- Tools sind nur für die eigene Origin registriert (kein `exposedTo`).
- `consequentialHint` ist nur ein Hinweis; Agenten dürfen ihn ignorieren. Deshalb ist jede Änderung über `undo_last_change` bzw. den Toast-Button rücknehmbar, und `dryRun` erlaubt eine Vorschau.
- Personen-/Projektnamen werden als Daten zurückgegeben; es gibt keine Freitextfelder mit nutzergenerierten Inhalten außer `role`.
