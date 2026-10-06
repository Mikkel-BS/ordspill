import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ALPHABET, availableLetters, createPuzzle, requestHint, usesFullKeyboard } from '../src/core/gameEngine';
import { loadProfiles } from '../src/core/profiles';
import { words } from '../src/core/wordRepository';

describe('gradual reading support', () => {
  it('limits level 2 choice while preserving all answer letters including Æ Ø Å and doubles', () => {
    for (const word of words.filter(w => w.difficulty === 2)) {
      const puzzle = createPuzzle(word);
      const letters = availableLetters(word,puzzle);
      assert.equal(letters.length,word.word.length === 3 ? 8 : 10,word.word);
      for (const letter of word.word) assert.ok(letters.includes(letter),word.word);
      assert.equal(usesFullKeyboard(word,puzzle),false);
      assert.deepEqual(puzzle.hints,[]);
    }
  });
  it('lets children expand the keyboard without adding a hint or discarding attempts', () => {
    const word = words.find(w => w.word === 'EGG')!;
    const puzzle = {...createPuzzle(word),guesses:['OST'],fullKeyboard:true};
    assert.equal(availableLetters(word,puzzle).join(''),ALPHABET);
    const reduced = requestHint(puzzle,'remove-letters');
    assert.deepEqual(availableLetters(word,reduced),['E','G']);
    assert.deepEqual(puzzle.hints,[]); assert.deepEqual(reduced.guesses,['OST']);
    const saved = {id:'support',nickname:'Ada',avatar:0,currentLevel:2,discoveredWords:[],puzzleHistory:[],activePuzzle:puzzle};
    assert.deepEqual(loadProfiles({getItem:()=>JSON.stringify([saved])}),[saved]);
    const invalid = {...saved,activePuzzle:{...puzzle,fullKeyboard:'bad'}};
    const loaded = loadProfiles({getItem:()=>JSON.stringify([invalid])})[0];
    assert.equal(loaded.activePuzzle?.fullKeyboard,undefined);
    assert.deepEqual(loaded.activePuzzle?.guesses,['OST']);
  });
  it('uses the full keyboard at later levels and postpones less familiar or ambiguous short words', () => {
    for (const word of words.filter(w => w.difficulty >= 3)) assert.equal(availableLetters(word,createPuzzle(word)).length,29);
    for (const word of ['HØY','ÅRE','MOSE']) assert.equal(words.find(w => w.word === word)!.difficulty,3);
  });
});
