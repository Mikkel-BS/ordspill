import { useEffect, useRef, useState } from 'react';
import { ALPHABET, availableLetters, createPuzzle, evaluateGuess, keyboardFeedback, normalizeWord, requestHint, submitGuess, suggestedHint } from './core/gameEngine';
import { completePuzzle, generatePuzzleWord } from './core/progressionEngine';
import { loadProfiles, newProfile, saveProfiles } from './core/profiles';
import { getWord, groups, validGuesses, words } from './core/wordRepository';
import type { HintKind, LocalProfile, Puzzle, Word } from './core/types';
import { Landscape, Picture } from './components/Artwork';
const avatars = ['🦊', '🐻', '🐰', '🐸', '🦉', '🐱'];
const stateNames = { correct: 'Riktig plass', present: 'En annen plass', absent: 'Ikke i ordet' };
const symbols = { correct: '✓', present: '↔', absent: '−' };
const hintNames: Record<HintKind, string> = { picture: 'Se et bilde', 'first-letter': 'Første bokstav', 'remove-letters': 'Færre bokstaver', syllables: 'Tell stavelser', 'reveal-letter': 'En bokstav til' };
const hintIcons: Record<HintKind, string> = { picture: '▧', 'first-letter': 'Aa', 'remove-letters': '✂', syllables: '♪', 'reveal-letter': '✦' };
function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(text); speech.lang = 'nb-NO'; speech.rate = 0.75;
  window.speechSynthesis.speak(speech);
}
function Discovery({ word, onNext, result }: { word: Word; onNext: () => void; result?: Puzzle }) {
  const [quiz, setQuiz] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  return <section className="discovery card" aria-labelledby="discovery-title">
    <span className="eyebrow">ET NYTT ORD Å TA MED SEG</span><h2 id="discovery-title">Du fant {word.word.toLocaleLowerCase('nb')}!</h2>
    <div className="discovery-picture"><Picture image={word.image} label={word.definition ?? word.word}/><span className="spark s1">✦</span><span className="spark s2">✧</span></div>
    <h3 className="discovered-word">{word.word}</h3><p>{word.definition}</p><blockquote>{word.example}</blockquote>
    <div className="word-meta"><span>{word.syllables} {word.syllables === 1 ? 'stavelse' : 'stavelser'}</span>{'speechSynthesis' in window && <button className="text-button" onClick={() => speak(word.word)}>♪ Hør ordet</button>}</div>
    {result && <p className="quiet">{result.hints.length ? 'Du brukte hjelp og fant veien. Så fint!' : 'Du fant ordet helt selv. Så fint!'} Ordet er i ordboka di.</p>}
    {!quiz ? <button className="text-button" onClick={() => setQuiz(true)}>Vil du klappe stavelsene? <span aria-hidden="true">↗</span></button> : <div className="mini-quiz"><p>Si ordet sakte. Hvor mange klapp blir det?</p><div>{[1, 2, 3].map(n => <button className={answer === n ? 'selected' : ''} key={n} onClick={() => setAnswer(n)}>{n} klapp</button>)}</div><p role="status">{answer !== null ? answer === word.syllables ? 'Ja! Du hørte stavelsene.' : 'Prøv å si ordet sakte en gang til.' : ''}</p></div>}
    <button className="primary" onClick={onNext}>Neste oppdagelse <span aria-hidden="true">→</span></button>
  </section>;
}
export default function App() {
  const [profiles, setProfiles] = useState<LocalProfile[]>(loadProfiles);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [page, setPage] = useState<'game' | 'collection'>('game');
  const [nickname, setNickname] = useState(''); const [avatar, setAvatar] = useState(0);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null); const [guess, setGuess] = useState('');
  const [message, setMessage] = useState(''); const [storageIssue, setStorageIssue] = useState(false);
  const [detail, setDetail] = useState<Word | null>(null); const [showInfo, setShowInfo] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const profile = profiles.find(p => p.id === profileId);
  const word = puzzle ? getWord(puzzle.wordId) : undefined;
  useEffect(() => { setStorageIssue(!saveProfiles(profiles)); }, [profiles]);
  useEffect(() => { const board = bottom.current?.parentElement?.parentElement; if (board) board.scrollTop = board.scrollHeight; }, [puzzle?.guesses.length]);
  function updateProfile(updated: LocalProfile) { setProfiles(current => current.map(p => p.id === updated.id ? updated : p)); }
  function start(p: LocalProfile, level = p.currentLevel) {
    const next = createPuzzle(generatePuzzleWord(words, p, level));
    setPuzzle(next); setGuess(''); setMessage(''); setPage('game'); setDetail(null);
    updateProfile({ ...p, activePuzzle: next });
  }
  function choose(p: LocalProfile) {
    setProfileId(p.id); setPage('game'); setGuess(''); setMessage(''); setDetail(null);
    if (p.activePuzzle) setPuzzle(p.activePuzzle); else start(p);
  }
  function addProfile(event: React.FormEvent) {
    event.preventDefault(); if (!nickname.trim()) return;
    const p = newProfile(nickname, avatar);
    const next = createPuzzle(generatePuzzleWord(words, p, 1));
    setProfiles(current => [...current, { ...p, activePuzzle: next }]);
    setProfileId(p.id); setPuzzle(next); setNickname(''); setPage('game'); setGuess(''); setMessage(''); setDetail(null);
  }
  function changePuzzle(next: Puzzle) {
    if (!profile) return;
    setPuzzle(next);
    updateProfile(next.solved ? completePuzzle(profile, next) : { ...profile, activePuzzle: next });
  }
  function addLetter(letter: string) {
    if (!word || !puzzle || puzzle.solved || !availableLetters(word, puzzle).includes(letter)) return;
    setMessage(''); setGuess(current => current.length < word.word.length ? current + letter : current);
  }
  function check() {
    if (!word || !puzzle || puzzle.solved) return;
    const result = submitGuess(puzzle, word, guess, validGuesses[word.language]);
    if (result.error) { setMessage(result.error); return; }
    changePuzzle(result.puzzle); setGuess('');
    setMessage(result.puzzle.solved ? '' : 'Nye spor! Se på bokstavene og prøv igjen.');
  }
  function hint(kind: HintKind) {
    if (!puzzle || !word) return;
    const next = requestHint(puzzle, kind); changePuzzle(next);
    if (kind === 'remove-letters') setGuess(current => Array.from(current).filter(l => word.word.includes(l)).join(''));
    setMessage(kind === 'first-letter' ? `Ordet begynner med ${word.word[0]}.` : 'Her er litt hjelp til neste steg.');
  }
  useEffect(() => {
    if (!profile || page !== 'game' || !puzzle || puzzle.solved || showInfo) return;
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName))) return;
      if (event.key === 'Enter') { event.preventDefault(); check(); }
      else if (event.key === 'Backspace') { event.preventDefault(); setGuess(current => current.slice(0, -1)); setMessage(''); }
      else { const letter = normalizeWord(event.key); if (letter.length === 1 && ALPHABET.includes(letter)) { event.preventDefault(); addLetter(letter); } }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  });
  useEffect(() => {
    if (!showInfo) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role=dialog]');
    const close = dialog?.querySelector<HTMLButtonElement>('button');
    close?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowInfo(false);
      if (event.key === 'Tab') { event.preventDefault(); close?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); previous?.focus(); };
  }, [showInfo]);
  const letters = word && puzzle ? availableLetters(word, puzzle) : [];
  const feedback = word && puzzle ? keyboardFeedback(word, puzzle) : {};
  const suggestion = puzzle ? suggestedHint(puzzle) : undefined;
  const discovered = profile ? words.filter(w => profile.discoveredWords.includes(w.id)) : [];
  const shownWord = detail ?? word;
  return <div className="app-shell">
    <header className="site-header"><button className="brand" onClick={() => { setPage('game'); setDetail(null); }} aria-label="Ordreise, gå til spillet"><span className="brand-icon" aria-hidden="true">✳</span><span>ordreise<span className="brand-dot">.</span></span></button>
      {profile && <nav aria-label="Hovedmeny"><button className={page === 'game' ? 'nav-active' : ''} onClick={() => { setPage('game'); setDetail(null); }}>Utforsk</button><button className={page === 'collection' ? 'nav-active' : ''} onClick={() => { setPage('collection'); setDetail(null); }}>Min ordbok <span className="badge">{discovered.length}</span></button></nav>}
      <button className="profile-button" onClick={() => { setProfileId(null); setShowInfo(false); }}><span aria-hidden="true">{profile ? avatars[profile.avatar] : '☺'}</span>{profile ? profile.nickname : 'Små ord. Store oppdagelser.'}{profile && <span aria-hidden="true">⌄</span>}</button>
    </header>
    {storageIssue && <div className="storage-alert" role="alert">Vi får ikke lagret på denne enheten. Du kan spille, men fremgangen kan forsvinne når du lukker siden.</div>}
    {!profile ? <main className="welcome"><section className="welcome-story"><span className="eyebrow">EN LITEN REISE I BOKSTAVENES VERDEN</span><h1>Små ord.<br/>Store <em>oppdagelser.</em></h1><p>Finn ord, følg spor og bli kjent med nye ord.<br/>Her er det god tid til å prøve.</p><Landscape/><div className="welcome-note"><span aria-hidden="true">✦</span> Ett ord av gangen. I ditt eget tempo.</div></section>
      <section className="profile-card card"><span className="eyebrow">KLAR FOR EN ORDREISE?</span><h2>Hvem skal utforske?</h2>{profiles.length > 0 && <div className="saved-profiles">{profiles.map(p => <button key={p.id} onClick={() => choose(p)}><span aria-hidden="true">{avatars[p.avatar]}</span><span>{p.nickname}<small>{p.discoveredWords.length} ord funnet</small></span><span aria-hidden="true">→</span></button>)}<p className="quiet">Eller lag en ny spiller</p></div>}
      <form onSubmit={addProfile}><label htmlFor="nickname">Hva vil du bli kalt?</label><input id="nickname" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Kallenavnet ditt" maxLength={20} required autoComplete="off"/><fieldset><legend>Velg en liten turvenn</legend><div className="avatar-options">{avatars.map((a,i) => <button type="button" key={a} className={avatar === i ? 'selected' : ''} aria-label={`Velg ${['rev','bjørn','kanin','frosk','ugle','katt'][i]}`} aria-pressed={avatar === i} onClick={() => setAvatar(i)}>{a}</button>)}</div></fieldset><button className="primary" type="submit">La oss utforske <span aria-hidden="true">→</span></button></form><p className="privacy-note">⌂ Bare på denne enheten. Ingen innlogging.</p></section>
    </main> : <main className="workspace">
      <div className="page-heading"><div><span className="eyebrow">{page === 'game' ? 'DIN LILLE ORDREISE' : 'ORD DU HAR BLITT KJENT MED'}</span><h1>{page === 'game' ? `Hei, ${profile.nickname}!` : 'Min ordbok'}</h1><p>{page === 'game' ? 'Et nytt ord venter på deg. Skal vi finne det sammen?' : 'Hver oppdagelse har fått en plass her.'}</p></div><span className="journey-label"><span aria-hidden="true">🌱</span> {discovered.length} av 56 ord oppdaget</span></div>
      <div className="workspace-grid"><div className="main-column">
      {page === 'collection' ? detail ? <Discovery key={detail.id} word={detail} onNext={() => setDetail(null)}/> : <section className="collection card"><div className="section-heading"><h2>Mine oppdagelser</h2><span>{discovered.length} ord</span></div>{discovered.length ? <div className="word-grid">{discovered.map(w => <button key={w.id} onClick={() => setDetail(w)}><Picture image={w.image} label={w.word} size="small"/><strong>{w.word}</strong><span>Se ordet ↗</span></button>)}</div> : <div className="empty"><span aria-hidden="true">📖</span><h3>Ordboka di venter på sitt første ord.</h3><p>Finn et ord, så dukker det opp her!</p><button className="primary" onClick={() => setPage('game')}>Finn mitt første ord →</button></div>}</section>
      : puzzle && shownWord && (puzzle.solved ? <Discovery key={shownWord.id} word={shownWord} result={puzzle} onNext={() => start(profile)}/> : <section className="game-card card" aria-labelledby="puzzle-title"><div className="section-heading"><span className="level-label"><span aria-hidden="true">{groups[shownWord.difficulty-1].icon}</span> {groups[shownWord.difficulty-1].name}</span><span className="length-label">{shownWord.word.length} bokstaver</span></div>
      <h2 id="puzzle-title">Hvilket ord gjemmer seg her?</h2><p className="game-intro">Prøv et ord. Bokstavene viser deg veien.</p>
      <div className="board" role="log" aria-label="Ordene du har prøvd"><div className="board-inner">{puzzle.guesses.map((g,row) => <div className="guess-row" key={row} aria-label={`Forsøk ${row+1}: ${g}`}>{evaluateGuess(shownWord.word,g).map((cell,i) => <span className={`tile ${cell.state}`} key={i} aria-label={`${cell.letter}: ${stateNames[cell.state]}`}><span>{cell.letter}</span><small aria-hidden="true">{symbols[cell.state]}</small></span>)}</div>)}
      <div className="guess-row current" aria-label={`Ditt ord: ${guess || 'ingen bokstaver'}`}>{Array.from({length:shownWord.word.length},(_,i) => <span key={i} className={`tile ${guess[i] ? 'filled' : ''} ${i === guess.length ? 'cursor' : ''}`} aria-label={guess[i] ?? 'Tom rute'}>{guess[i] ?? ''}</span>)}</div><div ref={bottom}/></div></div>
      <div className="legend">{(['correct','present','absent'] as const).map(state => <span key={state}><i className={state} aria-hidden="true">{symbols[state]}</i>{stateNames[state]}</span>)}</div>
      <div className="status-message" role="status" aria-live="polite">{message || 'Du kan prøve så mange ganger du vil.'}</div>
      {suggestion && <button className="help-suggestion" onClick={() => hint(suggestion)}>✦ Litt hjelp på veien? {hintNames[suggestion]} <span aria-hidden="true">→</span></button>}
      <div className="keyboard" aria-label="Norsk tastatur">{['QWERTYUIOPÅ','ASDFGHJKLØÆ','ZXCVBNM'].map((row,r) => <div className="keyboard-row" key={r}>{Array.from(row).filter(l => shownWord.difficulty > 1 || letters.includes(l)).map(l => <button key={l} className={`key ${feedback[l] ?? ''}`} disabled={!letters.includes(l)} onClick={() => addLetter(l)} aria-label={`${l}${feedback[l] ? `, ${stateNames[feedback[l]]}` : ''}`}><span>{l}</span>{feedback[l] && <small aria-hidden="true">{symbols[feedback[l]]}</small>}</button>)}</div>)}<div className="keyboard-actions"><button onClick={() => { setGuess(g => g.slice(0,-1)); setMessage(''); }} aria-label="Slett siste bokstav">⌫ <span>Slett</span></button><button className="primary" onClick={check} disabled={guess.length !== shownWord.word.length}>Prøv ordet <span aria-hidden="true">→</span></button></div></div>
      <div className="hints"><div className="hint-heading"><span aria-hidden="true">✦</span><h3>Alle utforskere kan få hjelp</h3><span>Velg et hint</span></div><div className="hint-buttons">{(['picture','first-letter','remove-letters'] as const).map(h => <button key={h} aria-pressed={puzzle.hints.includes(h)} onClick={() => hint(h)}><span aria-hidden="true">{hintIcons[h]}</span>{hintNames[h]}{puzzle.hints.includes(h) && <span aria-hidden="true"> ✓</span>}</button>)}</div>
      {puzzle.hints.length > 0 && <div className="hint-result">{puzzle.hints.includes('picture') && <Picture image={shownWord.image} label={shownWord.definition ?? 'Et bilde av det skjulte ordet'} size="small"/>}<div>{puzzle.hints.includes('first-letter') && <p>Første bokstav er <strong>{shownWord.word[0]}</strong>.</p>}{puzzle.hints.includes('remove-letters') && <p>Nå vises bare bokstaver som er med i ordet.</p>}{puzzle.hints.includes('syllables') && <p>Ordet har <strong>{shownWord.syllables}</strong> {shownWord.syllables === 1 ? 'stavelse' : 'stavelser'}.</p>}{puzzle.hints.includes('reveal-letter') && <p>Siste bokstav er <strong>{shownWord.word.at(-1)}</strong>.</p>}</div></div>}</div>
      </section>)}
      </div><aside className="journey-sidebar"><section className="journey-card card"><div className="section-heading"><h2>Din vei videre</h2><span aria-hidden="true">↗</span></div><p>Små steg, nye oppdagelser.</p><div className="journey-stops">{groups.map(g => <button key={g.level} className={`journey-stop ${word?.difficulty === g.level && page === 'game' ? 'active' : ''}`} disabled={g.level > profile.currentLevel} onClick={() => start(profile,g.level)} aria-label={`${g.name}${g.level > profile.currentLevel ? ', åpnes etter flere oppdagelser' : ', spill'}`}><span className="stop-icon" aria-hidden="true">{g.level > profile.currentLevel ? '⌑' : g.icon}</span><span><strong>{g.name}</strong><small>{g.level > profile.currentLevel ? `Åpnes ved ${(g.level-1)*8} ord` : g.description}</small></span>{g.level <= profile.currentLevel && <span aria-hidden="true">→</span>}</button>)}</div><div className="progress-block"><span>{discovered.length} ord i ordboka di <span>{Math.round(discovered.length/56*100)} %</span></span><progress value={discovered.length} max={56} aria-label="Oppdagede ord"/></div></section>
      <section className="companion-card"><Landscape/><div><h3>Det er lov å prøve.</h3><p>Noen ord er lette. Andre trenger litt hjelp. Begge deler er en del av reisen.</p></div></section>
      <div className="local-note"><span aria-hidden="true">⌂</span><p>Fremgangen din lagres bare<br/>på denne enheten.</p></div></aside></div>
    </main>}
    <footer><span>laget for nysgjerrige små lesere</span><button onClick={() => setShowInfo(true)}>Til voksne <span aria-hidden="true">↗</span></button><span>Bokmål · I ditt eget tempo</span></footer>
    {showInfo && <div className="modal-backdrop" onClick={() => setShowInfo(false)}><section className="info-modal card" role="dialog" aria-modal="true" aria-labelledby="info-title" onClick={e => e.stopPropagation()}><h2 id="info-title">En rolig ordreise</h2><p>For barn som øver på lesing, omtrent 6–9 år. Prøv gjerne sammen i starten. ✓ betyr riktig plass, ↔ betyr at bokstaven er på en annen plass, og − betyr at bokstaven ikke finnes i ordet. Gjentatte bokstaver teller én gang for hver gang de finnes.</p><p>56 håndplukkede Bokmål-ord i fire grupper. Nye grupper åpnes for hver åttende nye oppdagelse. Hjelp er alltid lov, og det er ingen grense for antall forsøk. Første gruppe bruker færre bokstaver.</p><p>Ordlista for gjetting er en begrenset startliste; noen ekte ord mangler. Bilder er enkle piktogrammer. Valgfri opplesning bruker enhetens stemme og kan trenge nett eller en installert norsk stemme.</p><p>Ingen konto, reklame eller analyseverktøy. Profiler og hintbruk lagres lokalt i nettleseren. Slett nettstedsdata i nettleseren for å fjerne alt. Frakoblet spill virker etter første fullstendige innlasting. Privat nettlesing og sletting av nettstedsdata kan fjerne fremgangen.</p><button autoFocus className="primary" onClick={() => setShowInfo(false)}>Tilbake til ordreisen</button></section></div>}
  </div>;
}
