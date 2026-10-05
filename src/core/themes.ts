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
  hjem: { id: 'hjem', title: 'Hjemme', clue: 'Vi leter etter noe som hører til hjemme hos oss.', icon: '🏡' },
  byen: { id: 'byen', title: 'Byen', clue: 'Vi leter etter noe vi kan møte eller bruke i byen.', icon: '🏘️' },
  fjell: { id: 'fjell', title: 'På fjellet', clue: 'Vi leter etter noe vi kan finne på en fjelltur.', icon: '🏔️' },
  rom: { id: 'rom', title: 'Verdensrommet', clue: 'Vi leter etter noe som hører til i verdensrommet.', icon: '✨' },
  natur: { id: 'natur', title: 'Mat og planter', clue: 'Vi leter etter en plante eller noe vi kan spise.', icon: '🌿' },
  gard: { id: 'gard', title: 'På gården', clue: 'Vi leter etter noe som hører til på en gård.', icon: '🚜' },
  kropp: { id: 'kropp', title: 'Kroppen vår', clue: 'Vi leter etter en del av kroppen vår.', icon: '🧒' },
  vaer: { id: 'vaer', title: 'Vær og himmel', clue: 'Vi leter etter noe vi kan se ute eller på himmelen.', icon: '🌤️' },
};

const fallback: WordTheme = { id: 'ord', title: 'På oppdagelse', clue: 'Vi leter etter et ord vi kan bli kjent med.', icon: '🧭' };

/** Categories are ordered: first recognized category supplies the theme clue. */
export function getWordTheme(word: Pick<Word, 'categories'>): WordTheme {
  for (const category of word.categories) {
    if (Object.hasOwn(themes, category)) return themes[category];
  }
  return fallback;
}
