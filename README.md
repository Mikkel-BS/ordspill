# Ordreise

Play: **https://mikkel-bs.github.io/ordspill/**

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

- 120 manually selected Bokmål answers across four difficulty groups (21 / 44 / 33 / 22). Each has a meaning, example sentence, picture and syllable count.
- 38,269 valid Bokmål guesses and inflected forms imported from Norsk ordbank (2022-02-01 snapshot, CC BY 4.0). It is **not an exhaustive or continuously updated Norwegian dictionary**: the interface explains when a word is missing without saying the child's word is wrong.
- Three to six letters, including Æ, Ø and Å. Words are normalized to uppercase NFC.
- A visible meaning-based theme clue above every board, also shown on discovery and in the word collection. Themes are independent of difficulty.
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
  themes.ts             Theme metadata, semantic clues and safe category fallback and theme membership
  wordRepository.ts     Language-specific answer/guess repositories and group descriptions
  progressionEngine.ts  Pure puzzle selection, completion and simple unlock policy
  profiles.ts           Local persistence, schema guards and storage failure handling
src/data/
  answers.json          Curated answers with educational metadata
  validGuesses.json     Imported nb forms, source/license metadata; nn initially empty
src/components/
  Artwork.tsx           Bundled landscape and word-picture rendering
src/App.tsx             Profile chooser, board, discovery, collection and journey UI
public/
  sw.js                 Same-origin offline cache
  manifest.webmanifest  App metadata
```

The core engine imports no React or browser APIs. Puzzle selection and completion are separate from evaluation. The data model supports `nb` and `nn`; Nynorsk needs its own reviewed answers, guesses and UI language choice before enabling it. Images and audio are optional fields and can later reference bundled assets.

History preserves guesses, exact hint kinds, completion time and whether each solve was independent. This supports later slow adaptation without changing letter evaluation. The current unlock policy deliberately uses unique discoveries rather than a complex performance score. It does not automatically make the game harder based on speed or punish help. Ordered categories now supply a broad theme clue through `src/core/themes.ts`. Farm animals/materials, body parts and weather have specific categories so each clue fits the word. The theme is a standard scaffold, not a requested hint; all valid guesses of the right length remain accepted. The per-player theme selector defaults to “Overrask meg”. Ten themes contain 7–19 curated words each. Generation prefers unseen answers at the chosen level, then easier unseen words in the same theme; it never substitutes a harder answer. Themes without an eligible word are disabled with their first available group. A fresh board can switch immediately; typed letters, guesses and hints preserve the active puzzle, with the preference applied to the next puzzle. Choosing a practice group persists independently of theme; “Følg min vei videre” returns to automatic progression. Choosing a lower group without words in the selected theme explicitly returns to all themes. Old profiles without preferences continue to load; unknown preferences are discarded without losing progress. At theme completion, the discovery screen explicitly offers “Utforsk et annet tema” (switching to all themes) and a separate replay button. Automatic replay excludes the most recently solved word whenever any eligible alternative exists, including an easier word in the same theme. Singleton pools can repeat only through explicit replay or choosing that theme again. A full theme map, achievements and advanced adaptation remain outside this MVP.

## Offline and privacy

There is no account system, backend, advertising, third-party analytics, external font or remote image dependency. Progress stays in `localStorage` under `ordreise:profiles:v1`. The profile chooser appears after reopening the game so another child can use the device. A storage failure displays a clear notice while leaving play available.

The production service worker precaches the built HTML, JavaScript, CSS, icon and manifest. Offline play is available after the first successful load and worker installation. Test offline behaviour with `npm run preview`, not the Vite development server. Deploy over HTTPS or localhost. The build uses relative paths and can be hosted at a repository subpath such as `/ordspill/`.

Browser storage clearing, private browsing, switching browsers or changing the host can remove or separate progress. Adults can delete all progress by clearing this site's browser data. Device speech may require network access or an installed Norwegian voice; the game itself works without it.

## Validation

Unit tests include 729 exhaustive repeated-letter cases over a small Norwegian-letter alphabet, surplus duplicates, normalization, dictionary validation, more than six attempts, immutable hints, keyboard feedback, independent/hinted solving, unique-word unlocking, replay selection, profile isolation and corrupted/unavailable storage.

Before extending the word lists, review Bokmål spelling, child familiarity, syllables, examples and picture suitability with an educator. A full dictionary import should include its licensing and provenance rather than silently treating generated letter combinations as words.

## GitHub Pages deployment

The `Deploy GitHub Pages` workflow builds and publishes `dist/` after each push to `main`, or when manually run from Actions. Repository Settings → Pages must use **GitHub Actions** as its source. Deployment uses the protected `github-pages` environment with Pages-write and OIDC permissions. The existing relative Vite asset paths and service-worker scope support `/ordspill/` without a separate hosting build.

After publishing, the workflow runs desktop/mobile browser checks against the live Pages URL, including offline reload and continued play. The tests use isolated browser profiles and do not modify any real player progress. The published URL is also shown in the deployment environment.

## Guess dictionary source and regeneration

`src/data/validGuesses.json` contains 38,269 forms from **Norsk ordbank – bokmål 2005**, created by Universitetet i Bergen and Språkrådet and provided by Språkbanken at Nasjonalbiblioteket, under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Source: [Språkbanken resource catalogue](https://www.nb.no/sprakbanken/ressurskatalog/oai-nb-no-sbr-5/), snapshot 2022-02-01. The imported archive SHA-256 and modification notice are stored in `_source`. Attribution and links are also available in the app under “Til voksne”.

Only `normert` full forms active on 2026-10-05 are imported, with lowercase spelling, 3–6 letters and the supported A–Z/Æ/Ø/Å alphabet. Proper names, abbreviations written with capitals, historical/unofficial forms, punctuation and unsupported accented letters are excluded. Forms are converted to uppercase NFC, deduplicated and combined with the curated answers. The fullform list includes uncommon but normatively possible inflections; accepting a guess does not make it a puzzle answer. All 120 curated answers are already represented in the imported guess list; expanding the answer set does not broaden or replace the guess dictionary.

To reproduce the import, download the pinned archive linked in `_source.downloadUrl`, then run (Python 3):

```sh
python3 scripts/import_wordbank.py path/to/20220201_norsk_ordbank_nob_2005.tar.gz
python3 -m unittest discover -s tests -p wordbank_test.py
```

The downloaded source archive stays outside version control. The generated dictionary is bundled with the app and works offline; no dictionary API requests occur during play.
