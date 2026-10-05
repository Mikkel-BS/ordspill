import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { completePuzzle, generatePuzzleWord, themeChoices } from '../src/core/progressionEngine';
import { getWordTheme } from '../src/core/themes';
import { loadProfiles, saveProfiles } from '../src/core/profiles';
import { createPuzzle } from '../src/core/gameEngine';
import { words, validGuesses } from '../src/core/wordRepository';
import type { LocalProfile } from '../src/core/types';
const profile: LocalProfile = {id:'child',nickname:'Ada',avatar:0,currentLevel:1,discoveredWords:[],puzzleHistory:[]};
describe('word repository', () => {
  it('has 120 complete unique child-friendly answers and a larger separate guess set', () => {
    assert.equal(words.length,120); assert.equal(new Set(words.map(w => w.id)).size,120);
    assert.equal(new Set(words.map(w => w.word)).size,120);
    assert.ok(validGuesses.nb.size > words.length * 8);
    for (const w of words) {
      assert.ok(validGuesses[w.language].has(w.word)); assert.ok(w.word.length >= 3 && w.word.length <= 6);
      assert.ok(w.image && w.example && w.definition); assert.ok(w.syllables > 0);
    }
    for (let level=1;level<=4;level++) assert.ok(words.filter(w => w.difficulty === level).length >= 20);
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
  it('offers meaningful theme pools and locks themes without suitable early words', () => {
    const early = themeChoices(words,1);
    assert.equal(early.length,10);
    for (const choice of early) assert.ok(choice.count >= 7,choice.id);
    assert.equal(early.find(t => t.id === 'hav')!.available,true);
    assert.equal(early.find(t => t.id === 'rom')!.available,false);
    assert.equal(early.find(t => t.id === 'rom')!.minimumLevel,2);
    assert.ok(themeChoices(words,4).every(t => t.available));
  });
  it('keeps every generated themed puzzle within the theme and at or below the requested level', () => {
    for (let level=1;level<=4;level++) for (const choice of themeChoices(words,level).filter(t => t.available)) {
      const result = generatePuzzleWord(words,{...profile,selectedTheme:choice.id},level);
      assert.equal(getWordTheme(result).id,choice.id);
      assert.ok(result.difficulty <= level);
    }
    assert.throws(() => generatePuzzleWord(words,{...profile,selectedTheme:'rom'},1),/No words/);
    assert.equal(generatePuzzleWord(words,{...profile,selectedTheme:'future'},1).word,'SOL');
  });
  it('uses easier unseen words in a theme before replaying and never borrows from another theme', () => {
    const sea = {...profile,selectedTheme:'hav',discoveredWords:words.filter(w => getWordTheme(w).id === 'hav' && w.difficulty === 4).map(w => w.id)};
    const next = generatePuzzleWord(words,sea,4);
    assert.equal(getWordTheme(next).id,'hav'); assert.equal(next.difficulty,3);
    const allSea = {...sea,discoveredWords:words.filter(w => getWordTheme(w).id === 'hav').map(w => w.id)};
    const repeat = generatePuzzleWord(words,allSea,4);
    assert.equal(getWordTheme(repeat).id,'hav'); assert.equal(repeat.difficulty,4);
    assert.deepEqual(sea.puzzleHistory,[]);
  });
  it('avoids consecutive replays, even when only easier alternatives exist', () => {
    const allFound = {...profile,discoveredWords:words.map(w => w.id)};
    const result = (wordId: string) => ({wordId,guesses:1,hints:[],independent:true,completedAt:'2026-10-05'});
    const first = generatePuzzleWord(words,allFound,2);
    assert.notEqual(generatePuzzleWord(words,{...allFound,puzzleHistory:[result(first.id)]},2).id,first.id);
    const smallPool = words.filter(w => ['nb-rom','nb-måne'].includes(w.id));
    assert.equal(generatePuzzleWord(smallPool,{...allFound,selectedTheme:'rom',puzzleHistory:[result('nb-måne')]},3).id,'nb-rom');
    // The engine still supports an intentional replay of a singleton pool.
    assert.equal(generatePuzzleWord(smallPool,{...allFound,selectedTheme:'rom',puzzleHistory:[result('nb-rom')]},2).id,'nb-rom');
  });
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
  it('persists isolated theme and practice preferences while keeping legacy profiles intact', () => {
    const ada = {...profile,selectedTheme:'hav',selectedLevel:1};
    const ben = {...profile,id:'ben',nickname:'Ben'};
    assert.deepEqual(loadProfiles({getItem:()=>JSON.stringify([ada,ben])}),[ada,ben]);
    assert.deepEqual(loadProfiles({getItem:()=>JSON.stringify([{...profile,selectedTheme:'unknown',selectedLevel:99}])}),[profile]);
    assert.equal(completePuzzle(ada,{...createPuzzle(words[0]),solved:true,guesses:['SOL']}).selectedTheme,'hav');
  });
});
