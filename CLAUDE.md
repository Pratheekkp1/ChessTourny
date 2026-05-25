# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Running the app

**Backend** (FastAPI + SQLite):
```bash
cd backend && ./start.sh
# → http://localhost:8000  |  docs: http://localhost:8000/docs
```
`start.sh` creates the virtualenv, installs deps, copies `.env.example` → `.env` if missing, then runs uvicorn with `--reload`.

**Frontend** (Live Server in VS Code):
- Open VS Code → right-click `frontend/ChessTourny.html` → "Open with Live Server"
- Configured to serve on port 3000 via `.vscode/settings.json`
- No build step — Babel standalone transpiles JSX in the browser at runtime

**Quick OCR test** (no DB write):
```bash
curl -F "image=@/path/to/scoresheet.jpg" http://localhost:8000/games/ocr-test
```

---

## Architecture

### Frontend — no bundler, global scope, file-load order matters
All JSX files are loaded as `<script type="text/babel">` tags in `ChessTourny.html`. Babel standalone compiles them in-browser. **Load order in the HTML is the dependency graph** — changing it breaks things.

Current order (each file exposes globals via `Object.assign(window, {...})`):
1. `ios-frame.jsx` — `IOSDevice` phone shell component
2. `tweaks-panel.jsx` — dev overlay (theme/mode/name switcher)
3. `chess.jsx` — `ChessBoard`, `MiniBoard`, `computePositions()`, `applyMove()`
4. `api.jsx` — all `apiFetch`/`apiGet*`/`apiCreate*` calls + data converters (`backendGameToFrontend`, `uciToMove`, etc.)
5. `data.jsx` — mock `GAMES`, `TOURNAMENTS`, `USER` arrays + `loadLiveData()`, `loadGameMoves()`
6. `screens-home.jsx` — `HomeScreen`, `TournamentScreen`, shared UI atoms (`GameCard`, `TournamentCard`, `SectionLabel`, `BackButton`, `ResultBadge`, `StatTile`)
7. `screens-scan.jsx` — `ScanScreen`, `CameraPermissionModal`, `ScanAim`, `ScanReview`, etc.
8. `screens-replay.jsx` — `ReplayScreen`, `ReplayView`
9. `app.jsx` — `Root`, `TabBar`, `NewTournamentScreen`, palette system, routing — **mounts React app**

### Routing — stack-based, no router library
`Root` in `app.jsx` maintains a `stack` array of `{ screen, params }`. Navigation:
- `nav.go('screen', params)` — push
- `nav.back()` — pop
- `nav.reset()` — go home

Screens: `'home'` | `'tournament'` | `'tournaments'` | `'all-games'` | `'scan'` | `'replay'` | `'new-tournament'` | `'edit-game'` | `'edit-tournament'` | `'stats'` | `'profile'`  
TabBar is hidden during `scan`, `replay`, `edit-game`, and `edit-tournament` screens.

### Theming
CSS custom properties injected as inline `style` on the `IOSDevice` wrapper. Two themes (`modern`, `paper`) × two modes (`light`, `dark`) = 4 palettes in `PALETTES` map in `app.jsx`. All components use `var(--bg)`, `var(--fg)`, `var(--ink)`, `var(--moss)`, etc. — never hardcoded colors.

### Data flow
1. `Root` calls `loadLiveData()` on mount → `apiGetTournaments()` + `apiGetGames()` in parallel
2. Results replace the mock `TOURNAMENTS`/`GAMES` arrays in-place (length reset + push)
3. `setDataVersion(v+1)` re-renders with `key={dataVersion}` so screens pick up fresh data
4. Individual game moves load lazily: `loadGameMoves(id)` in `ReplayScreen`
5. After a scan, `onGameSaved → refreshData()` triggers a full reload

### Backend — FastAPI + async SQLAlchemy + SQLite
```
app/
  main.py          — CORS, static /uploads mount, OCR model warm-up at startup
  config.py        — Settings (pydantic-settings, reads .env)
  database.py      — async engine + session + Base
  models/          — SQLAlchemy ORM: Tournament, Game, Move
  routers/         — tournaments.py, games.py (all REST endpoints)
  schemas/         — Pydantic response models
  services/
    ocr_service.py    — CRAFT (EasyOCR) + TrOCR pipeline; Ollama fallback
    chess_service.py  — python-chess: SAN validation, UCI, FEN, PGN
    storage_service.py — image save/delete, HEIC→JPEG conversion
```

### OCR pipeline (easyocr backend, default)
`CRAFT detect → TrOCR recognize → layout parse → chess validate`
- `_preprocess()`: EXIF-rotate, downscale to ≤2800px, adaptive threshold
- `_run_ocr_pipeline()`: returns `(blocks, img_w, img_h)` in preprocessed coordinate space
- Top 28% of image = header (Event/White/Black/Date), rest = move table
- `warm_up_models()` runs at startup in a thread pool executor

Set `OCR_BACKEND=ollama` in `.env` for higher accuracy (requires Ollama + a vision model).

### Move format (frontend)
`chess.jsx` expects moves as `{ from, to, san, capture?, check?, mate?, castle?, promotion? }`.  
`uciToMove(uci, san)` in `api.jsx` converts backend UCI strings to this format.  
`computePositions(moves)` returns `{ positions: FEN[], lastMoves: move[] }` for the replay board.

### Key backend field names vs frontend field names
| Backend | Frontend |
|---------|----------|
| `white_player` | `white` |
| `black_player` | `black` |
| `game_date` | `date` |
| `tournament_id` | `tournament` (stringified) |
| `result: "white_won"` | `result: "1-0"` |
| `id: 3 (int)` | `id: "3" (string)`, `_backendId: 3` |

---

## Implementation plan & status

This is the living feature checklist. Update it as work completes.

### ✅ Done
- [x] OCR pipeline: CRAFT + TrOCR handwriting recognition
- [x] Chess move validation with python-chess (SAN → UCI → FEN)
- [x] Score sheet upload → OCR → game stored in SQLite
- [x] Game replay screen with board + move list
- [x] HEIC/HEIF support (iOS photos)
- [x] EXIF rotation fix for phone photos
- [x] Camera permission modal (iOS-style bottom sheet)
- [x] Indeterminate scan progress bar (waits for real API)
- [x] Tournament creation (NewTournamentScreen + POST /tournaments)
- [x] Mock data fallback when backend is down
- [x] Two themes (modern, paper) × two modes (light, dark)
- [x] **Tournaments list screen** — `TournamentsListScreen` with search + real W/L/D per tournament
- [x] **Stats screen** — `StatsScreen` with period selector, W/L/D bar chart, per-tournament breakdown, openings list
- [x] **Profile/settings screen** — `ProfileScreen` with inline name edit, theme/mode toggles, backend status
- [x] **All Games list** — `GamesListScreen` with scroll, search, and filter chips (All/Won/Lost/Draw)
- [x] **Real standings** — TournamentScreen computes W/L/D from scanned games
- [x] **Scan from tournament** — "Scan" button passes `tournamentId` to ScanScreen
- [x] **Swipe-to-reveal** — `SwipeableGameCard` (swipe left → Edit / Delete slide-out actions)
- [x] **Delete game** — `ActionSheet` confirmation + `apiDeleteGame` call
- [x] **Edit game metadata** — `EditGameScreen` form (names, result, date, round, event, notes) + `PATCH /games/{id}`
- [x] **Game notes** — notes field appended to `ocr_warnings` via PATCH endpoint
- [x] **PATCH /games/{id}** backend endpoint — GameUpdate schema, update route
- [x] **Real home stats** — `computeUserStats()` derives W/L/D, games-this-month from `GAMES` array
- [x] **Replay: swipe navigation** — swipe left/right on board to step through plies
- [x] **Replay: keyboard navigation** — ArrowLeft/Right/Up/Down + Space controls
- [x] **Replay: copy PGN** — export action sheet → copy PGN to clipboard via `apiGetGamePGN`
- [x] **Replay: download PGN** — export action sheet → save `.pgn` file via Blob download
- [x] **Replay: view score sheet** — full-screen overlay showing original scan image via `apiGetGameImageUrl`
- [x] **Replay: tournament name fix** — safe lookup (no crash if tournament not in local list)
- [x] **CSS animations** — `fadeInUp`, `fadeIn`, `slideUp` keyframes added to ChessTourny.html
- [x] **ScanReview: score sheet thumbnail** — object URL preview of uploaded photo + tap-to-fullscreen overlay
- [x] **ScanReview: OCR warnings** — amber warning card with up to 3 warnings + overflow count
- [x] **Tournament edit** — `EditTournamentScreen` (name, venue, start/end dates) + `apiUpdateTournament`
- [x] **Tournament delete** — `ActionSheet` confirmation + `apiDeleteTournament`; also in TournamentScreen ⋮ menu
- [x] **SwipeableTournamentCard** — swipe-left reveals Edit/Delete in TournamentsListScreen
- [x] **Replay: speed control** — 0.5×/1×/1.5×/2× chip row above transport buttons
- [x] **GamesListScreen: swipeable cards** — upgraded to `SwipeableGameCard` with edit/delete
- [x] **Evaluation bar** — `EvalBar` shows material balance (Q=9 R=5 B/N=3 P=1) alongside board; animated transitions
- [x] **Quick-add game (no scan)** — `QuickAddGameScreen`: enter opponent, result, date, round, event without a score sheet
  - Backend: `POST /games/manual` (JSON body, no image required)
  - Frontend: accessible from ScanAim "Enter without scanning" + TournamentScreen "+ Add" + GamesListScreen "+" button

- [x] **Tournament `rounds` field** — `num_rounds` in Tournament model + auto-migration + schema + frontend converter
- [x] **NewTournamentScreen**: rounds, end date, color picker are all wired to state and saved
- [x] **EditTournamentScreen**: rounds field added + color picker, both saved to backend
- [x] **No-moves badge on GameCard** — quick-add games show "No score sheet" instead of move count
- [x] **Tournament `color` field** — persisted in DB (`color VARCHAR(32)` column + auto-migration); sent on create and update; `backendTournamentToFrontend` uses backend color with index fallback
- [x] **Retry OCR** — `ScanError` shows "Retry OCR" (re-submits same image, skips capture animation) + "Try new photo" (resets to aim); `handleRetryWithSame` in `ScanScreen`
- [x] **Upcoming round prompts** — `HomeScreen` computes next unplayed round from tournaments with `rounds` set; shows colored banner tapping into `QuickAddGameScreen` pre-filled with round number

### 🔲 TODO — ordered by priority

#### Scan improvements
- [ ] **Manual move entry** — fallback if OCR fails: tap to select moves from a piece picker

#### Home & general
- [ ] **Rating history graph** — track rating over time per session (requires storing rating per game)

#### Backend
- [ ] **Performance rating** — Buchholz / FIDE perf formula per tournament
- [ ] **Search endpoint** — `GET /games?q=smith` for player name full-text search

---

## Patterns to follow

**Adding a new screen**: define the component in the appropriate `screens-*.jsx` file, add `window.MyScreen` to its `Object.assign`, add a case in `Root`'s render block in `app.jsx`, and add navigation in `TabBar` or wherever the entry point is.

**Adding a new tab**: add a `TabItem` in `TabBar` in `app.jsx` with the screen name.

**API call pattern**: all calls go through `apiFetch` in `api.jsx`. The function throws on non-OK responses with the error text from the server. Always try/catch at the call site and show errors in component state.

**CSS pattern**: always use CSS custom properties (`var(--fg)`, `var(--surface)`, etc.). Never hardcode colors. For dark/light conditional logic that CSS vars can't handle, use the `mode` prop passed down from `Root`.

**Backend response pattern**: routers call `_serialize_game()` / `_serialize_summary()` helpers; add new fields there plus to `GameResponse` / `GameSummary` schemas in `app/schemas/game.py`.
