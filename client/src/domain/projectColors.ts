/**
 * Allowed project colours (Chakra colour scheme names).
 *
 * The board signals workload with green ("frei"), orange ("voll") and red ("überbucht"),
 * so project bars must never use red, orange, yellow or green — otherwise a project bar
 * could be mistaken for a workload warning. `indigo` is not a Chakra default; it is
 * defined in `theme.ts`.
 */
export const PROJECT_COLORS = ['blue', 'cyan', 'teal', 'indigo', 'purple', 'pink', 'gray'] as const;

export type ProjectColor = (typeof PROJECT_COLORS)[number];

export const PROJECT_COLOR_LABELS: Record<ProjectColor, string> = {
  blue: 'Blau',
  cyan: 'Cyan',
  teal: 'Petrol',
  indigo: 'Indigo',
  purple: 'Lila',
  pink: 'Rosa',
  gray: 'Grau',
};

export function isProjectColor(value: unknown): value is ProjectColor {
  return typeof value === 'string' && (PROJECT_COLORS as readonly string[]).includes(value);
}

/** First palette colour not yet used by `usedColors` (cycles when all are taken). */
export function suggestProjectColor(usedColors: readonly string[]): ProjectColor {
  const used = new Set(usedColors);
  return PROJECT_COLORS.find((c) => !used.has(c)) ?? PROJECT_COLORS[usedColors.length % PROJECT_COLORS.length];
}
