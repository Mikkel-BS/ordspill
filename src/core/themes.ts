import type { Word } from './types';

export interface WordTheme {
  id: string;
  title: string;
  clue: string;
  icon: string;
}

/** Broad meaning clues, separate from difficulty and optional letter/picture hints. */
export const themes: Readonly<Record<string, WordTheme>> = {
  skog: { id: 'skog', title: 'Skogen', clue: 'Vi leter etter noe som hører til i skogen.', icon: '🌲' },
  hav: { id: 'hav', title: 'Ved havet', clue: 'Vi leter etter noe vi kan finne på, i eller ved havet.', icon: '🌊' },
  hjem: { id: 'hjem', title: 'Hus og møbler', clue: 'Vi leter etter noe ved boligen eller noe vi bruker inne hjemme.', icon: '🏡' },
  byen: { id: 'byen', title: 'Byen', clue: 'Vi leter etter noe vi kan møte eller bruke i byen.', icon: '🏘️' },
  fjell: { id: 'fjell', title: 'På tur', clue: 'Vi leter etter noe vi kan finne eller bruke når vi er ute på utflukt.', icon: '🥾' },
  rom: { id: 'rom', title: 'Verdensrommet', clue: 'Vi leter etter noe som hører til i verdensrommet.', icon: '✨' },
  natur: { id: 'natur', title: 'Blomster og planter', clue: 'Vi leter etter noe som vokser og kan ha vakre farger.', icon: '🌿' },
  mat: { id: 'mat', title: 'Mat', clue: 'Vi leter etter noe vi kan spise.', icon: '🍎' },
  klar: { id: 'klar', title: 'Klær', clue: 'Vi leter etter noe vi kan ha på oss.', icon: '🧥' },
  dyr: { id: 'dyr', title: 'Kjæledyr', clue: 'Vi leter etter et dyr som mennesker kan ha som venn hjemme.', icon: '🐾' },
  lek: { id: 'lek', title: 'Lek og lesing', clue: 'Vi leter etter noe vi bruker når vi leker eller leser.', icon: '📖' },
  gard: { id: 'gard', title: 'På gården', clue: 'Vi leter etter noe som hører til på en gård.', icon: '🚜' },
  kropp: { id: 'kropp', title: 'Kroppen vår', clue: 'Vi leter etter en del av kroppen vår.', icon: '🧒' },
  vaer: { id: 'vaer', title: 'Vær og himmel', clue: 'Vi leter etter noe som har med været eller himmelen å gjøre.', icon: '🌤️' },
};

const fallback: WordTheme = { id: 'ord', title: 'På oppdagelse', clue: 'Vi leter etter et ord vi kan bli kjent med.', icon: '🧭' };

export function isThemeSelection(value: unknown): value is string {
  return typeof value === 'string' && (value === 'all' || Object.hasOwn(themes, value));
}

/** The primary meaning clue also defines the selectable theme. */
export function belongsToTheme(word: Pick<Word, 'categories'>, theme: string): boolean {
  return theme === 'all' || getWordTheme(word).id === theme;
}

/** Categories are ordered: first recognized category supplies the theme clue. */
export function getWordTheme(word: Pick<Word, 'categories'>): WordTheme {
  for (const category of word.categories) {
    if (Object.hasOwn(themes, category)) return themes[category];
  }
  return fallback;
}
