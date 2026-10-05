import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { availableLetters, createPuzzle, evaluateGuess, keyboardFeedback, normalizeWord, requestHint, submitGuess, suggestedHint, validateGuess } from '../src/core/gameEngine';
import { words, validGuesses } from '../src/core/wordRepository';
const sol = words[0];
describe('two-pass matching', () => {
  const cases: [string,string,string[]][] = [
    ['KATT','TAKK',['present','correct','present','absent']],
    ['BANAN','ANNAN',['present','absent','correct','correct','correct']],
    ['BIL','ILL',['present','absent','correct']],
    ['BÅT','ÅÅÅ',['absent','correct','absent']],
    ['NØKKEL','KOKKEL',['absent','absent','correct','correct','correct','correct']],
    ['SOL','SOL',['correct','correct','correct']],
  ];
  for (const [answer,guess,expected] of cases) it(`${answer} with ${guess}`, () => assert.deepEqual(evaluateGuess(answer,guess).map(c => c.state),expected));
  it('normalizes Norwegian lowercase and decomposed Å', () => {
    assert.equal(normalizeWord('  ba\u030at '),'BÅT'); assert.ok(evaluateGuess('øye','ØYE').every(c => c.state === 'correct'));
  });
  it('rejects unequal lengths', () => assert.throws(() => evaluateGuess('SOL','SKOG')));
  it('never credits more occurrences than the answer contains (729 duplicate cases)', () => {
    const triples = Array.from({length:27},(_,i) => [i%3,Math.floor(i/3)%3,Math.floor(i/9)%3].map(n => 'AØÅ'[n]).join(''));
    for (const a of triples) for (const g of triples) {
      const result = evaluateGuess(a,g);
      for (const l of 'AØÅ') assert.equal(result.filter(c => c.letter === l && c.state !== 'absent').length,Math.min([...a].filter(c => c === l).length,[...g].filter(c => c === l).length));
      result.forEach((c,i) => assert.equal(c.state === 'correct',g[i] === a[i]));
    }
  });
});
describe('validation and supportive hints', () => {
  it('validates length, alphabet and dictionary independently', () => {
    assert.equal(validateGuess('sol',sol,validGuesses.nb),null);
    assert.equal(validateGuess('BIL',sol,validGuesses.nb),null);
    assert.match(validateGuess('XX',sol,validGuesses.nb)!,/3/);
    assert.match(validateGuess('S1L',sol,validGuesses.nb)!,/bokstavene/);
    assert.match(validateGuess('ZZZ',sol,validGuesses.nb)!,/ordlista/);
  });
  it('does not consume invalid or duplicate guesses', () => {
    const p = createPuzzle(sol);
    assert.equal(submitGuess(p,sol,'XYZ',validGuesses.nb).puzzle,p);
    const next = submitGuess(p,sol,'BIL',validGuesses.nb).puzzle;
    assert.equal(submitGuess(next,sol,'BIL',validGuesses.nb).puzzle,next);
    assert.equal(p.guesses.length,0);
  });
  it('allows more than six attempts and then solving', () => {
    let p = createPuzzle(sol);
    for (const guess of ['BIL','HUS','REV','MUS','SAU','LAM','MAT']) p = submitGuess(p,sol,guess,validGuesses.nb).puzzle;
    assert.equal(p.guesses.length,7); assert.equal(p.solved,false);
    p = submitGuess(p,sol,'SOL',validGuesses.nb).puzzle; assert.equal(p.solved,true);
    assert.equal(submitGuess(p,sol,'BIL',validGuesses.nb).puzzle,p);
  });
  it('records distinct hints immutably and preserves answer letters when reducing keyboard', () => {
    const p = createPuzzle(sol); const hinted = requestHint(p,'remove-letters');
    assert.deepEqual(p.hints,[]); assert.equal(requestHint(hinted,'remove-letters'),hinted);
    assert.deepEqual(availableLetters(sol,hinted).sort(),['L','O','S']);
    for (const word of words) assert.ok([...word.word].every(l => availableLetters(word,createPuzzle(word)).includes(l)));
  });
  it('offers escalating optional help', () => {
    const p = {...createPuzzle(sol),guesses:['BIL','HUS']};
    assert.equal(suggestedHint(p),'picture'); assert.equal(suggestedHint(requestHint(p,'picture')),'first-letter');
  });
  it('retains strongest keyboard feedback for duplicate letters', () => {
    const bil = words.find(w => w.word === 'BIL')!;
    assert.equal(keyboardFeedback(bil,{...createPuzzle(bil),guesses:['ILL']}).L,'correct');
  });
});
