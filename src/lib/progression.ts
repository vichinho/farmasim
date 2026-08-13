export const XP_PER_LEVEL = 250;

export function getLevelProgress(totalXp: number) {
  const currentLevelXp = totalXp % XP_PER_LEVEL;

  return {
    currentLevelXp,
    percentage: Math.round((currentLevelXp / XP_PER_LEVEL) * 100),
  };
}
