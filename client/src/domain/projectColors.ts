/**
 * Project palette ("Leitstand" design direction): 8 hues, none of them red, orange, yellow
 * or green. Those colours are reserved for the workload signal (green = frei/Luft,
 * red = überbucht), so a project bar can never be mistaken for a workload state. Teal is
 * excluded because it collides with "frei", pink because it reads as red under protanopia.
 *
 * Each key is a Chakra colour scale defined in `theme.ts` (Tailwind values):
 * `.600` = edge (bar leading edge, dot, swatch), `.100` = tint, `.800` = text on the tint.
 */
export const PROJECT_COLORS = ['sky', 'cobalt', 'indigo', 'violet', 'grape', 'fuchsia', 'cyan', 'slate'] as const;

export type ProjectColor = (typeof PROJECT_COLORS)[number];

export const PROJECT_COLOR_LABELS: Record<ProjectColor, string> = {
  sky: 'Himmel',
  cobalt: 'Kobalt',
  indigo: 'Indigo',
  violet: 'Violett',
  grape: 'Traube',
  fuchsia: 'Fuchsia',
  cyan: 'Cyan',
  slate: 'Schiefer',
};

/** Colour names of earlier versions (Chakra defaults) → palette key, used for display only. */
const LEGACY_COLORS: Record<string, ProjectColor> = {
  blue: 'cobalt',
  purple: 'violet',
  teal: 'cyan',
  pink: 'fuchsia',
  red: 'indigo',
  orange: 'slate',
  green: 'cyan',
  yellow: 'sky',
  gray: 'slate',
};

export function isProjectColor(value: unknown): value is ProjectColor {
  return typeof value === 'string' && (PROJECT_COLORS as readonly string[]).includes(value);
}

/** Palette key to render for a stored colour; legacy and unknown names are mapped, never shown raw. */
export function projectColor(name: string | undefined | null): ProjectColor {
  if (isProjectColor(name)) return name;
  return (name && LEGACY_COLORS[name]) || 'slate';
}

export interface ProjectColorTokens {
  /** Bar leading edge, dot, swatch (≥ 3:1 on white). */
  edge: string;
  /** Highlight fill (project filter active), drawer header. */
  tint: string;
  /** Text on `tint`. */
  fg: string;
}

/** Chakra colour tokens of a (possibly legacy) project colour. */
export function projectColorTokens(name: string | undefined | null): ProjectColorTokens {
  const c = projectColor(name);
  return { edge: `${c}.600`, tint: c === 'slate' ? 'slate.200' : `${c}.100`, fg: `${c}.800` };
}

/** First palette colour not yet used by `usedColors` (cycles when all are taken). */
export function suggestProjectColor(usedColors: readonly string[]): ProjectColor {
  const used = new Set(usedColors);
  return PROJECT_COLORS.find((c) => !used.has(c)) ?? PROJECT_COLORS[usedColors.length % PROJECT_COLORS.length];
}
