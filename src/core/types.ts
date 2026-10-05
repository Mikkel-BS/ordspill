export type Language = 'nb' | 'nn';
export interface Word {
  id: string; word: string; language: Language; difficulty: number; ageBand: 'early' | 'middle';
  categories: string[]; syllables: number; spellingFeatures: string[];
  definition?: string; example?: string; image?: string; audio?: string; clueLetters?: string[];
}
export type LetterState = 'correct' | 'present' | 'absent';
export interface LetterFeedback { letter: string; state: LetterState }
export type HintKind = 'picture' | 'first-letter' | 'remove-letters' | 'syllables' | 'reveal-letter';
export interface Puzzle { wordId: string; guesses: string[]; hints: HintKind[]; solved: boolean }
export interface PuzzleResult { wordId: string; guesses: number; hints: HintKind[]; independent: boolean; completedAt: string }
export interface LocalProfile {
  id: string; nickname: string; avatar: number; currentLevel: number;
  discoveredWords: string[]; puzzleHistory: PuzzleResult[]; activePuzzle?: Puzzle;
  /** Missing on older profiles; 'all' means no theme filter. */
  selectedTheme?: string;
  /** Optional practice group; absent means follow normal progression. */
  selectedLevel?: number;
}
