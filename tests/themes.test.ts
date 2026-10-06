import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getWordTheme, themes } from '../src/core/themes';
import { words, validGuesses } from '../src/core/wordRepository';
import { createPuzzle, submitGuess } from '../src/core/gameEngine';

describe('meaning-based themes', () => {
  it('gives every curated word a known theme without revealing its spelling', () => {
    for (const word of words) {
      const theme = getWordTheme(word);
      assert.notEqual(theme.id,'ord',word.word);
      assert.ok(theme.title && theme.icon && theme.clue,word.word);
      assert.ok(!(word.clue ?? theme.clue).toUpperCase().split(/[\s.,!?]+/u).includes(word.word),word.word);
      if (word.difficulty === 2 || word.difficulty === 3) assert.ok(word.clue,word.word);
    }
  });
  it('uses semantically fitting themes for animals, body parts and weather', () => {
    const expected = { KUA:'gard',SAU:'gard',ULL:'gard',EGG:'gard',OST:'mat',KAKE:'mat',EPLE:'mat',BÆR:'mat',SKO:'klar',LUE:'klar',HATT:'klar',KATT:'dyr',HUND:'dyr',KANIN:'dyr',BOK:'lek',BALL:'lek',SNØ:'vaer',SEKK:'fjell',KART:'fjell',ARM:'kropp',ØYE:'kropp',HJERTE:'kropp',SOL:'vaer',REGN:'vaer',REV:'skog',BÅT:'hav',RAKETT:'rom' };
    for (const [word,id] of Object.entries(expected)) assert.equal(getWordTheme(words.find(w=>w.word===word)!).id,id);
  });
  it('uses the first recognized category and safely handles future categories', () => {
    assert.equal(getWordTheme({categories:['future','hav','skog']}),themes.hav);
    assert.equal(getWordTheme({categories:[]}).id,'ord');
    assert.equal(getWordTheme({categories:['constructor','unknown']}).id,'ord');
  });
  it('keeps themes independent from difficulty, guess validation and requested hints', () => {
    assert.equal(getWordTheme(words.find(w=>w.word==='REV')!).id,getWordTheme(words.find(w=>w.word==='FROSK')!).id);
    const sol=words.find(w=>w.word==='SOL')!;
    const result=submitGuess(createPuzzle(sol),sol,'BIL',validGuesses.nb);
    assert.equal(result.error,null); assert.deepEqual(result.puzzle.hints,[]);
  });
});
