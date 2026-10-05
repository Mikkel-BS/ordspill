import answers from '../data/answers.json';
import guesses from '../data/validGuesses.json';
import type { Language, Word } from './types';
export const words = answers as Word[];
export const validGuesses: Record<Language, ReadonlySet<string>> = { nb: new Set(guesses.nb), nn: new Set(guesses.nn) };
export function getWord(id: string): Word | undefined { return words.find(word => word.id === id); }
export const groups = [
  { level: 1, name: 'Små oppdagelser', description: 'Kjente ord og noen få bokstaver', icon: '🌱' },
  { level: 2, name: 'Nye spor', description: 'Flere bokstaver og doble lyder', icon: '🍃' },
  { level: 3, name: 'På ordjakt', description: 'Stavelser og bokstaver sammen', icon: '🌳' },
  { level: 4, name: 'Store eventyr', description: 'Lengre ord og nye utfordringer', icon: '🏔️' },
];
