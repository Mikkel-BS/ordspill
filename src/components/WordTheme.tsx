import { getWordTheme } from '../core/themes';
import type { Word } from '../core/types';

export function ThemeClue({ word }: { word: Word }) {
  const theme = getWordTheme(word);
  return <aside className="theme-clue" aria-label="Temaspor">
    <span className="theme-icon" aria-hidden="true">{theme.icon}</span>
    <div><span className="theme-title">Tema: {theme.title}</span><p>{theme.clue}</p></div>
  </aside>;
}

export function ThemeTag({ word }: { word: Word }) {
  const theme = getWordTheme(word);
  return <span className="theme-tag"><span aria-hidden="true">{theme.icon}</span> Tema: {theme.title}</span>;
}
