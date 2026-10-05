import type { LocalProfile, Puzzle, Word } from './types';
import { belongsToTheme, isThemeSelection, themes } from './themes';
/** Deliberately simple MVP progression; performance is stored for a later adaptive policy. */
export function completePuzzle(profile: LocalProfile, puzzle: Puzzle, now = new Date().toISOString()): LocalProfile {
  if (!puzzle.solved) return profile;
  const discoveredWords = [...new Set([...profile.discoveredWords, puzzle.wordId])];
  return { ...profile, discoveredWords, currentLevel: Math.min(4, 1 + Math.floor(discoveredWords.length / 8)),
    puzzleHistory: [...profile.puzzleHistory, { wordId: puzzle.wordId, guesses: puzzle.guesses.length, hints: [...puzzle.hints], independent: puzzle.hints.length === 0, completedAt: now }], activePuzzle: undefined };
}
export function themeChoices(words: Word[], level: number) {
  return Object.values(themes).map(theme => {
    const pool = words.filter(word => word.language === 'nb' && belongsToTheme(word, theme.id));
    return { ...theme, minimumLevel: Math.min(...pool.map(word => word.difficulty)), available: pool.some(word => word.difficulty <= level), count: pool.length };
  });
}

export function generatePuzzleWord(words: Word[], profile: LocalProfile, level: number, selection = profile.selectedTheme ?? 'all'): Word {
  const target = Math.max(1, Math.min(4, level));
  const theme = isThemeSelection(selection) ? selection : 'all';
  const pool = words.filter(word => word.language === 'nb' && belongsToTheme(word, theme) && (theme === 'all' ? word.difficulty === target : word.difficulty <= target));
  if (!pool.length) throw new Error('No words available for this group');
  // Prefer the chosen level, then easier unseen words; never move up to fill a theme.
  const ranked = [...pool].sort((a,b) => b.difficulty - a.difficulty);
  const unseen = ranked.find(word => !profile.discoveredWords.includes(word.id));
  if (unseen) return unseen;
  // Avoid consecutive repeats whenever the eligible pool has an alternative,
  // including an easier word in the same theme.
  const lastId = profile.puzzleHistory.at(-1)?.wordId;
  const alternatives = ranked.filter(word => word.id !== lastId);
  const replayPool = alternatives.length ? alternatives : ranked;
  const repeats = replayPool.filter(word => word.difficulty === replayPool[0].difficulty);
  return repeats[profile.puzzleHistory.length % repeats.length];
}
