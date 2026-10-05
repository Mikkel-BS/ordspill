import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { completePuzzle, generatePuzzleWord } from '../src/core/progressionEngine';
import { loadProfiles, saveProfiles } from '../src/core/profiles';
import { createPuzzle } from '../src/core/gameEngine';
import { words, validGuesses } from '../src/core/wordRepository';
import type { LocalProfile } from '../src/core/types';
const profile: LocalProfile = {id:'child',nickname:'Ada',avatar:0,currentLevel:1,discoveredWords:[],puzzleHistory:[]};
describe('word repository', () => {
  it('has 56 complete unique child-friendly answers and a larger separate guess set', () => {
    assert.equal(words.length,56); assert.equal(new Set(words.map(w => w.id)).size,56);
    assert.ok(validGuesses.nb.size > words.length * 8);
    for (const w of words) {
      assert.ok(validGuesses[w.language].has(w.word)); assert.ok(w.word.length >= 3 && w.word.length <= 6);
      assert.ok(w.image && w.example && w.definition); assert.ok(w.syllables > 0);
    }
    for (let level=1;level<=4;level++) assert.equal(words.filter(w => w.difficulty === level).length,14);
    assert.ok(words.some(w => w.difficulty > 1 && w.word.length === 3));
  });
});
describe('progression', () => {
  it('records hint use and independent solving separately without mutating input', () => {
    const p = {...createPuzzle(words[0]),solved:true,guesses:['SOL']};
    const next = completePuzzle(profile,p,'2026-10-05');
    assert.equal(next.puzzleHistory[0].independent,true); assert.deepEqual(profile.discoveredWords,[]);
    assert.equal(completePuzzle(profile,{...p,hints:['picture']}).puzzleHistory[0].independent,false);
  });
  it('unlocks through unique discoveries, not repeat farming', () => {
    let p = profile;
    for (const w of words.slice(0,8)) p = completePuzzle(p,{...createPuzzle(w),solved:true,guesses:[w.word]});
    assert.equal(p.currentLevel,2); assert.equal(p.discoveredWords.length,8);
    p = completePuzzle(p,{...createPuzzle(words[0]),solved:true,guesses:['SOL']}); assert.equal(p.discoveredWords.length,8);
  });
  it('selects unvisited words and safely replays completed groups', () => {
    assert.equal(generatePuzzleWord(words,profile,1).word,'SOL');
    assert.equal(generatePuzzleWord(words,{...profile,discoveredWords:[words[0].id]},1).word,'BIL');
    assert.equal(generatePuzzleWord(words,{...profile,discoveredWords:words.map(w => w.id)},4).difficulty,4);
  });
  it('does not record an unfinished puzzle', () => assert.equal(completePuzzle(profile,createPuzzle(words[0])),profile));
});
describe('local profiles', () => {
  it('round trips isolated player progress and resumable hints', () => {
    let saved=''; const storage={setItem: (_key:string,value:string) => {saved=value;},getItem: () => saved};
    const ada = {...profile,activePuzzle:{...createPuzzle(words[0]),hints:['picture' as const],guesses:['BIL']}};
    const ben = {...profile,id:'ben',nickname:'Ben'};
    assert.equal(saveProfiles([ada,ben],storage),true); assert.deepEqual(loadProfiles(storage),[ada,ben]);
  });
  it('handles corrupt, unknown-word and unavailable storage gracefully', () => {
    assert.deepEqual(loadProfiles({getItem:()=>'{oops'}),[]);
    assert.deepEqual(loadProfiles({getItem:()=>JSON.stringify([{...profile,activePuzzle:{wordId:'missing',guesses:[],hints:[],solved:false}}])}),[]);
    assert.deepEqual(loadProfiles({getItem:()=>{throw Error();}}),[]);
    assert.equal(saveProfiles([profile],{setItem:()=>{throw Error();}}),false);
  });
});
