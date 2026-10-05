import type { LocalProfile, Puzzle, Word } from './types';
/** Deliberately simple MVP progression; performance is stored for a later adaptive policy. */
export function completePuzzle(profile: LocalProfile, puzzle: Puzzle, now = new Date().toISOString()): LocalProfile {
  if (!puzzle.solved) return profile;
  const discoveredWords = [...new Set([...profile.discoveredWords, puzzle.wordId])];
  return { ...profile, discoveredWords, currentLevel: Math.min(4, 1 + Math.floor(discoveredWords.length / 8)),
    puzzleHistory: [...profile.puzzleHistory, { wordId: puzzle.wordId, guesses: puzzle.guesses.length, hints: [...puzzle.hints], independent: puzzle.hints.length === 0, completedAt: now }], activePuzzle: undefined };
}
export function generatePuzzleWord(words: Word[], profile: LocalProfile, level: number): Word {
  const pool = words.filter(word => word.language === 'nb' && word.difficulty === Math.max(1, Math.min(4, level)));
  if (!pool.length) throw new Error('No words available for this group');
  return pool.find(word => !profile.discoveredWords.includes(word.id)) ?? pool[profile.puzzleHistory.length % pool.length];
}
