import type { HintKind, LetterFeedback, Puzzle, Word } from './types';
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ';
export function normalizeWord(value: string): string { return value.trim().normalize('NFC').toLocaleUpperCase('nb-NO'); }
/** Exact matches consume letters before misplaced matches. Never mark surplus duplicates present. */
export function evaluateGuess(answer: string, guess: string): LetterFeedback[] {
  const target = Array.from(normalizeWord(answer));
  const input = Array.from(normalizeWord(guess));
  if (target.length !== input.length) throw new Error('Words must have equal length');
  const remaining = new Map<string, number>();
  const result: LetterFeedback[] = input.map((letter, i) => {
    if (letter === target[i]) return { letter, state: 'correct' };
    remaining.set(target[i], (remaining.get(target[i]) ?? 0) + 1);
    return { letter, state: 'absent' };
  });
  result.forEach(cell => {
    if (cell.state === 'correct') return;
    const count = remaining.get(cell.letter) ?? 0;
    if (count > 0) { cell.state = 'present'; remaining.set(cell.letter, count - 1); }
  });
  return result;
}
export function validateGuess(guess: string, word: Word, validGuesses: ReadonlySet<string>): string | null {
  const normalized = normalizeWord(guess);
  if (normalized.length !== word.word.length) return `Ordet trenger ${word.word.length} bokstaver. Prøv litt til!`;
  if (!/^[A-ZÆØÅ]+$/u.test(normalized)) return 'Bruk bokstavene på tastaturet.';
  if (!validGuesses.has(normalized)) return 'Dette ordet er ikke i ordlista vår ennå. Prøv et annet ord, eller få et hint.';
  return null;
}
export function createPuzzle(word: Word): Puzzle { return { wordId: word.id, guesses: [], hints: [], solved: false }; }
export function submitGuess(puzzle: Puzzle, word: Word, guess: string, validGuesses: ReadonlySet<string>): { puzzle: Puzzle; error: string | null } {
  if (puzzle.solved) return { puzzle, error: 'Du har allerede funnet ordet!' };
  const error = validateGuess(guess, word, validGuesses);
  if (error) return { puzzle, error };
  const normalized = normalizeWord(guess);
  if (puzzle.guesses.includes(normalized)) return { puzzle, error: 'Du har prøvd dette ordet. Prøv et nytt, eller bruk et hint.' };
  return { puzzle: { ...puzzle, guesses: [...puzzle.guesses, normalized], solved: normalized === word.word }, error: null };
}
export function requestHint(puzzle: Puzzle, kind: HintKind): Puzzle {
  if (puzzle.solved || puzzle.hints.includes(kind)) return puzzle;
  return { ...puzzle, hints: [...puzzle.hints, kind] };
}
export function usesFullKeyboard(word: Word, puzzle: Puzzle): boolean {
  return word.difficulty >= 3 || puzzle.fullKeyboard === true;
}
export function availableLetters(word: Word, puzzle: Puzzle): string[] {
  const limited = [...new Set([...word.word, ...(word.clueLetters ?? []), ...'SAEILORNTUB'])];
  const budget = word.difficulty === 1 ? 12 : word.word.length <= 3 ? 8 : 10;
  const pool = usesFullKeyboard(word, puzzle) ? Array.from(ALPHABET) : limited.slice(0, budget);
  return puzzle.hints.includes('remove-letters') ? pool.filter(letter => word.word.includes(letter)) : pool;
}
export function keyboardFeedback(word: Word, puzzle: Puzzle): Record<string, LetterFeedback['state']> {
  const result: Record<string, LetterFeedback['state']> = {};
  const rank = { absent: 0, present: 1, correct: 2 };
  for (const guess of puzzle.guesses) for (const cell of evaluateGuess(word.word, guess)) {
    if (!result[cell.letter] || rank[cell.state] > rank[result[cell.letter]]) result[cell.letter] = cell.state;
  }
  return result;
}
export function suggestedHint(puzzle: Puzzle): HintKind | undefined {
  const sequence: HintKind[] = ['picture', 'first-letter', 'remove-letters', 'syllables', 'reveal-letter'];
  return puzzle.guesses.length >= 2 ? sequence.find(hint => !puzzle.hints.includes(hint)) : undefined;
}
