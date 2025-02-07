export const LEVEL_CODES = {
  Junior: 'JR',
  Mid: 'MID',
  Senior: 'SR',
  Lead: 'LD',
  Principal: 'PR'
} as const;

export type LevelCode = typeof LEVEL_CODES[keyof typeof LEVEL_CODES];

export const SENIORITY_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal'] as const;

export type SeniorityLevel = typeof SENIORITY_LEVELS[number];

export const getLevelCode = (seniorityLevel: SeniorityLevel): LevelCode => {
  return LEVEL_CODES[seniorityLevel];
};

export const getSeniorityLevel = (levelCode: LevelCode): SeniorityLevel => {
  const entry = Object.entries(LEVEL_CODES).find(([_, code]) => code === levelCode);
  if (!entry) {
    throw new Error(`Invalid level code: ${levelCode}`);
  }
  return entry[0] as SeniorityLevel;
};