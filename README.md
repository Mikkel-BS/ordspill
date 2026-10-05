# Ordreise

A calm Norwegian reading and vocabulary game for children around 6–9. Children follow letter clues to discover a word, then connect it with a picture, meaning and example sentence. The interface is in Bokmål.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

```sh
npm test          # Pure TypeScript engine, progression, data and persistence tests
npm run build    # TypeScript check and production build
npm run preview  # Serve dist, including the offline service worker
```

Browser checks run against the production build on desktop and mobile:

```sh
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs unit tests, the production build and Playwright checks. Playwright verifies solving, discovery, optional syllable practice, independent player progress, saved hints, Norwegian letters, symbolic feedback, viewport overflow and offline reload.

## MVP

- 56 manually selected Bokmål answers; 14 in each of four difficulty groups.
- A separate, larger starter vocabulary of valid guesses. It is **not an exhaustive Norwegian dictionary**: the interface explains when a word is missing without saying the child's word is wrong.
- Three to six letters, including Æ, Ø and Å. Words are normalized to uppercase NFC.
- Familiarity, syllables, consonant clusters, double consonants and spelling features inform curated groups. Difficulty is not calculated from length alone.
- Limited letter selection in group one; full Norwegian keyboard in later groups. Physical keyboards also work.
- Correct two-pass repeated-letter matching. Exact matches consume letters first, then misplaced matches consume the remaining occurrences.
- Unlimited guesses. Invalid and repeated guesses do not consume an attempt.
- Optional picture, first-letter and letter-removal hints, followed by syllable and final-letter help when a child keeps trying.
- A solved-word page with a picture, definition, example, syllable count and optional syllable-clapping activity.
- Optional device speech synthesis for completed words. Norwegian voice availability and offline speech depend on the device; sound is never necessary.
- Multiple local nicknames and animal avatars. Each player's unfinished puzzle, history, discovered words and hint usage are stored separately.
- An illustrated personal word collection and a simple four-stop journey. Each eight unique discoveries unlock another group. Replaying a known word does not accelerate unlocking.
- Colour plus ✓ / ↔ / − feedback, accessible labels, live status messages, large controls, visible keyboard focus and reduced-motion support.

The MVP uses system pictograms plus local SVG artwork, not downloaded images. Some related words share a pictogram, so a picture is a clue rather than an exact quiz answer. All definitions and examples are bundled locally. Adult guidance is available from “Til voksne”.

## Architecture

```text
src/core/
  types.ts              Word, language, profile, puzzle and history contracts
  gameEngine.ts         Pure validation, two-pass evaluation, hints and keyboard feedback
  wordRepository.ts     Language-specific answer/guess repositories and group descriptions
  progressionEngine.ts  Pure puzzle selection, completion and simple unlock policy
  profiles.ts           Local persistence, schema guards and storage failure handling
src/data/
  answers.json          Curated answers with educational metadata
  validGuesses.json     Separate nb and nn guess sets (nn initially empty)
src/components/
  Artwork.tsx           Bundled landscape and word-picture rendering
src/App.tsx             Profile chooser, board, discovery, collection and journey UI
public/
  sw.js                 Same-origin offline cache
  manifest.webmanifest  App metadata
```

The core engine imports no React or browser APIs. Puzzle selection and completion are separate from evaluation. The data model supports `nb` and `nn`; Nynorsk needs its own reviewed answers, guesses and UI language choice before enabling it. Images and audio are optional fields and can later reference bundled assets.

History preserves guesses, exact hint kinds, completion time and whether each solve was independent. This supports later slow adaptation without changing letter evaluation. The current unlock policy deliberately uses unique discoveries rather than a complex performance score. It does not automatically make the game harder based on speed or punish help. Theme categories are ready for a future exploration map; a full theme map, achievements and advanced adaptation are outside this MVP.

## Offline and privacy

There is no account system, backend, advertising, third-party analytics, external font or remote image dependency. Progress stays in `localStorage` under `ordreise:profiles:v1`. The profile chooser appears after reopening the game so another child can use the device. A storage failure displays a clear notice while leaving play available.

The production service worker precaches the built HTML, JavaScript, CSS, icon and manifest. Offline play is available after the first successful load and worker installation. Test offline behaviour with `npm run preview`, not the Vite development server. Deploy over HTTPS or localhost. The build uses relative paths and can be hosted at a repository subpath such as `/ordspill/`.

Browser storage clearing, private browsing, switching browsers or changing the host can remove or separate progress. Adults can delete all progress by clearing this site's browser data. Device speech may require network access or an installed Norwegian voice; the game itself works without it.

## Validation

Unit tests include 729 exhaustive repeated-letter cases over a small Norwegian-letter alphabet, surplus duplicates, normalization, dictionary validation, more than six attempts, immutable hints, keyboard feedback, independent/hinted solving, unique-word unlocking, replay selection, profile isolation and corrupted/unavailable storage.

Before extending the word lists, review Bokmål spelling, child familiarity, syllables, examples and picture suitability with an educator. A full dictionary import should include its licensing and provenance rather than silently treating generated letter combinations as words.
