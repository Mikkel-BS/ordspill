import type { LocalProfile } from './types';
import { getWord } from './wordRepository';
import { isThemeSelection } from './themes';
const KEY = 'ordreise:profiles:v1';
const hints = ['picture', 'first-letter', 'remove-letters', 'syllables', 'reveal-letter'];
function isProfile(value: unknown): value is LocalProfile {
  if (!value || typeof value !== 'object') return false;
  const p = value as LocalProfile;
  return typeof p.id === 'string' && typeof p.nickname === 'string' && p.nickname.length > 0 && p.nickname.length <= 20 &&
    Number.isInteger(p.avatar) && p.avatar >= 0 && p.avatar < 6 && Number.isInteger(p.currentLevel) && p.currentLevel >= 1 && p.currentLevel <= 4 &&
    Array.isArray(p.discoveredWords) && p.discoveredWords.every(id => typeof id === 'string' && !!getWord(id)) &&
    Array.isArray(p.puzzleHistory) && p.puzzleHistory.every(r => r && !!getWord(r.wordId) && Number.isInteger(r.guesses) && r.guesses > 0 && Array.isArray(r.hints) && r.hints.every(h => hints.includes(h)) && typeof r.independent === 'boolean' && typeof r.completedAt === 'string') &&
    (!p.activePuzzle || (!!getWord(p.activePuzzle.wordId) && Array.isArray(p.activePuzzle.guesses) && p.activePuzzle.guesses.every(g => typeof g === 'string' && /^[A-ZÆØÅ]+$/u.test(g) && g.length === getWord(p.activePuzzle!.wordId)!.word.length) && Array.isArray(p.activePuzzle.hints) && p.activePuzzle.hints.every(h => hints.includes(h)) && p.activePuzzle.solved === false));
}
export function loadProfiles(storage?: Pick<Storage, 'getItem'>): LocalProfile[] {
  try {
    const data: unknown = JSON.parse((storage ?? globalThis.localStorage).getItem(KEY) ?? '[]');
    return Array.isArray(data) ? data.filter(isProfile).map(p => {
      const validTheme = p.selectedTheme === undefined || isThemeSelection(p.selectedTheme);
      const validLevel = p.selectedLevel === undefined || (Number.isInteger(p.selectedLevel) && p.selectedLevel >= 1 && p.selectedLevel <= p.currentLevel);
      if (validTheme && validLevel) return p;
      const restored = { ...p };
      if (!validTheme) delete restored.selectedTheme;
      if (!validLevel) delete restored.selectedLevel;
      return restored; // Invalid preferences must not erase a child's progress.
    }) : [];
  } catch { return []; }
}
export function saveProfiles(profiles: LocalProfile[], storage?: Pick<Storage, 'setItem'>): boolean {
  try { (storage ?? globalThis.localStorage).setItem(KEY, JSON.stringify(profiles)); return true; } catch { return false; }
}
export function newProfile(nickname: string, avatar: number): LocalProfile {
  const name = nickname.trim().slice(0, 20);
  if (!name) throw new Error('Nickname is required');
  return { id: crypto.randomUUID(), nickname: name, avatar, currentLevel: 1, discoveredWords: [], puzzleHistory: [] };
}
