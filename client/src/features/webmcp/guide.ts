/**
 * Static operating guide for AI agents using the Dispo WebMCP tools.
 * Returned by the `get_guide` tool. Thresholds are read from the workload engine so the
 * guide never drifts from what the board shows.
 */
import { isoWeekKey } from '../../domain/dates';
import type { ISODate } from '../../domain/types';
import { WORKLOAD_THRESHOLDS } from '../../domain/workload';

export const GUIDE_TOPICS = ['all', 'overview', 'concepts', 'workflow', 'sops', 'pitfalls', 'tools'] as const;
export type GuideTopic = (typeof GUIDE_TOPICS)[number];

type Section = Record<string, unknown>;

function overview(): Section {
  return {
    purpose:
      'Dispo ist eine Kapazitätsplanung: Wer arbeitet wann mit wie viel Prozent auf welchem Projekt? Das Board zeigt Personen × ISO-Kalenderwochen mit einer Auslastungs-Ampel.',
    problemsSolved: [
      'Sofort sehen, wer in einem Zeitraum Luft hat („Wer kann ab KW 52 zwei Wochen mit 50 % auf Projekt X?“).',
      'Überbuchungen erkennen, bevor sie zum Problem werden (Personenwochen über 100 % der eigenen Kapazität).',
      'Einsätze umplanen (verschieben, verlängern, übergeben) und die Auswirkung auf die Auslastung vorab sehen.',
      'Teilzeit korrekt berücksichtigen: 80 % Einsatz bei einer 0,8-Teilzeitkraft ist eine volle Woche.',
    ],
    whoUsesIt: 'Teamleads, Projektleitungen und Ressourcenplaner. Der Agent arbeitet im Auftrag der Person, die die Seite geöffnet hat, mit deren Rechten.',
    golden_rule:
      'Der Mensch entscheidet. Lies zuerst, rechne mit dryRun vor, schreibe nur, was der Nutzer will, und berichte danach kurz, was sich geändert hat.',
  };
}

function concepts(): Section {
  return {
    entities: {
      employee: 'Person mit role, seniority, capacity (Teilzeitfaktor 0.1–1.0) und active. Inaktive Personen nicht neu einplanen.',
      project: 'Projekt mit start/end und status (planned | active | done). Einsätze sollen innerhalb der Projektlaufzeit liegen.',
      assignment: 'Einsatz = Person × Projekt × Zeitraum × allocation (10–100 % in 10er-Schritten einer Vollzeitwoche), optional role.',
    },
    units: {
      allocation_load_freePercent: 'Prozent einer VOLLZEIT-Woche (FTE-%).',
      utilization: 'Prozent der EIGENEN Kapazität der Person. Beispiel: capacity 0.5 und 50 % Einsatz = 100 % utilization.',
      week: 'ISO-Woche, Montag bis Sonntag; gerechnet wird mit Arbeitstagen Mo–Fr. Ein Einsatz bis Mittwoch zählt 3/5 der Woche.',
    },
    workloadStatus: {
      free: 'nichts geplant (0 %)',
      luft: `bis ${WORKLOAD_THRESHOLDS.luft} % utilization – deutlich freie Kapazität`,
      ok: `über ${WORKLOAD_THRESHOLDS.luft} % und unter 100 %`,
      full: 'genau 100 % – „voll“, das ist ein normaler, vollständig geplanter Zustand und KEINE Warnung',
      over: `über ${WORKLOAD_THRESHOLDS.over} % – überbucht (rot im Board)`,
    },
    overbooking:
      'Überbuchung ist technisch erlaubt (Produktentscheidung: anzeigen, nicht blockieren). Sie ist aber nie ein Ziel. Der Agent erzeugt sie nur, wenn der Nutzer es ausdrücklich will.',
    dates: 'Datumsangaben als YYYY-MM-DD oder ISO-Woche YYYY-Www. Als Start bedeutet eine Woche Montag, als Ende Freitag.',
    undo: 'Jede Änderung (auch aus der Oberfläche) landet in einer gemeinsamen Undo-Historie. undo_last_change nimmt die jüngste zurück.',
  };
}

function workflow(): Section {
  return {
    standardFlow: [
      '1. Verstehen: Was genau will der Nutzer (Person/Rolle, Projekt, Zeitraum, Prozent)? Fehlt etwas Wesentliches, nachfragen statt raten.',
      '2. Lesen: list_projects / list_employees für IDs und Laufzeiten; get_workload oder find_free_capacity für die Lage.',
      '3. Vorschlagen: Kandidaten mit Begründung nennen (freie Kapazität, Rolle, Seniorität).',
      '4. Vorrechnen: Schreib-Tool mit dryRun: true aufrufen; warnings und impact (utilizationBefore → After) prüfen.',
      '5. Bereinigen: Warnungen beheben (z. B. Zeitraum an die Projektlaufzeit anpassen) und erneut dryRun, bis keine unerwünschten Warnungen bleiben.',
      '6. Schreiben: erst jetzt ohne dryRun – nur mit Zustimmung des Nutzers oder wenn der Auftrag eindeutig war.',
      '7. Berichten: summary in einem Satz wiedergeben, verbleibende Warnungen nennen, auf Rückgängig hinweisen.',
    ],
    recipes: {
      'Wer hat Luft?': 'find_free_capacity(from, to, minFreePercent, role?) → Kandidaten sind nach minimaler freier Kapazität über ALLE Wochen sortiert.',
      'Person einplanen': 'list_projects (Laufzeit!) → find_free_capacity → create_assignment {dryRun:true} → create_assignment.',
      'Neues Projekt staffen':
        'list_projects (gibt es das Projekt schon?) → create_project {dryRun:true} → create_project → find_free_capacity für die Projektlaufzeit → je Person create_assignment {dryRun:true} → create_assignment.',
      'Überbuchung auflösen': 'get_workload für die Woche → betroffene Einsätze (assignmentIds) → update_assignment mit kleinerer allocation, shiftWeeks oder Übergabe an eine freie Person (employeeName) – jeweils erst dryRun.',
      'Einsatz verschieben': 'update_assignment {id, shiftWeeks: n} behält die Dauer bei.',
      'Fehler korrigieren': 'undo_last_change {expectedLabel: <undoLabel der eigenen Schreib-Antwort>} – so wird keine fremde Änderung zurückgenommen.',
    },
  };
}

function sops(): Section {
  return {
    'SOP-1 Keine Überbuchung ohne Auftrag':
      'Führt ein Vorschlag zu status "over", nicht schreiben. Stattdessen Alternativen anbieten (andere Person, weniger Prozent, anderer Zeitraum) oder ausdrücklich nachfragen.',
    'SOP-2 Projektlaufzeit respektieren':
      'Einsätze liegen innerhalb von project.start–project.end. Erscheint die Warnung „außerhalb der Projektlaufzeit“, den Zeitraum anpassen – Projektdaten ändert der Agent nicht.',
    'SOP-3 Erst dryRun, dann schreiben': 'Jeder Schreibvorgang wird vorher mit dryRun geprüft; der Nutzer soll die Auswirkung kennen.',
    'SOP-4 Eindeutig identifizieren':
      'Bei mehrdeutigen Namen (candidates in der Antwort) nie selbst wählen, sondern den Nutzer fragen oder IDs verwenden.',
    'SOP-5 Teilzeit beachten': 'Immer utilization/freePercent der Engine verwenden, nicht allocation-Summen selbst rechnen.',
    'SOP-6 Inaktive Personen': 'Inaktive Personen nicht neu einplanen; bestehende Einsätze nur auf Wunsch ändern.',
    'SOP-7 Löschen ist die Ausnahme':
      'Statt zu löschen lieber verkürzen oder übergeben. Wenn gelöscht wird: Nutzer vorher fragen und danach auf Rückgängig hinweisen.',
    'SOP-8 Kleine Schritte': 'Mehrere Änderungen einzeln ausführen und berichten, damit jede einzeln rückgängig gemacht werden kann.',
    'SOP-9 Transparenz': 'Jede Änderung erscheint im Board als Toast „– durch KI-Assistent“. Der Agent fasst am Ende zusammen, was er geändert hat.',
    'SOP-10 Stammdaten sparsam':
      'Projekte nur auf ausdrücklichen Wunsch anlegen (create_project, erst dryRun) und vorher mit list_projects prüfen, ob es das Projekt schon gibt. Personen anlegen/ändern sowie Projekte ändern oder löschen macht der Mensch in der Oberfläche.',
  };
}

function pitfalls(): Section {
  return {
    items: [
      '100 % („full“) ist kein Problem – nicht als Warnung melden.',
      'freePercent ist FTE-%: Eine 0,5-Teilzeitkraft hat höchstens 50 frei, auch wenn nichts geplant ist.',
      'find_free_capacity bewertet JEDE Woche des Zeitraums; eine Person mit einer vollen Woche fällt heraus, obwohl sie sonst frei ist.',
      'Ein Ende-Datum mitten in der Woche zählt nur anteilig (Arbeitstage/5).',
      'Ohne dryRun wird sofort gespeichert – die Oberfläche aktualisiert sich live.',
      'undo_last_change betrifft die jüngste Änderung insgesamt, auch eine des Menschen – deshalb expectedLabel setzen.',
    ],
  };
}

function tools(): Section {
  return {
    read: {
      get_guide: 'Dieser Leitfaden (topic optional).',
      list_employees: 'Personen und IDs.',
      list_projects: 'Projekte, Laufzeiten, Status.',
      get_workload: 'Auslastung je Person und Woche inkl. Einsätze mit IDs.',
      find_free_capacity: 'Kandidaten mit freier Kapazität im Zeitraum.',
    },
    write: {
      create_project: 'Projekt anlegen (dryRun möglich, nur auf ausdrücklichen Wunsch).',
      create_assignment: 'Einsatz anlegen (dryRun möglich).',
      update_assignment: 'Zeitraum, Prozent, Rolle ändern, verschieben (shiftWeeks) oder übergeben (dryRun möglich).',
      delete_assignment: 'Einsatz löschen (dryRun möglich, rückgängig machbar).',
      undo_last_change: 'Jüngste Änderung zurücknehmen.',
    },
  };
}

const BUILDERS: Record<Exclude<GuideTopic, 'all'>, () => Section> = {
  overview,
  concepts,
  workflow,
  sops,
  pitfalls,
  tools,
};

export function buildGuide(topic: GuideTopic, today: ISODate): Record<string, unknown> {
  const context = { today, currentWeek: isoWeekKey(today) };
  if (topic === 'all') {
    return {
      context,
      ...Object.fromEntries(Object.entries(BUILDERS).map(([k, build]) => [k, build()])),
    };
  }
  return { context, [topic]: BUILDERS[topic]() };
}
