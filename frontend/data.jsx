// data.jsx — sample tournaments + games with move sequences

// Move format: { from, to, san, capture?, check?, mate?, castle?, promotion?, comment? }
// SAN is the human-readable; from/to drive the board updates.

// OPERA GAME — Morphy vs Duke Karl & Count Isouard, Paris 1858
const OPERA = [
  { from:'e2', to:'e4', san:'e4' },
  { from:'e7', to:'e5', san:'e5' },
  { from:'g1', to:'f3', san:'Nf3' },
  { from:'d7', to:'d6', san:'d6' },
  { from:'d2', to:'d4', san:'d4' },
  { from:'c8', to:'g4', san:'Bg4' },
  { from:'d4', to:'e5', san:'dxe5', capture:true },
  { from:'g4', to:'f3', san:'Bxf3', capture:true },
  { from:'d1', to:'f3', san:'Qxf3', capture:true },
  { from:'d6', to:'e5', san:'dxe5', capture:true },
  { from:'f1', to:'c4', san:'Bc4' },
  { from:'g8', to:'f6', san:'Nf6' },
  { from:'f3', to:'b3', san:'Qb3' },
  { from:'d8', to:'e7', san:'Qe7' },
  { from:'b1', to:'c3', san:'Nc3' },
  { from:'c7', to:'c6', san:'c6' },
  { from:'c1', to:'g5', san:'Bg5' },
  { from:'b7', to:'b5', san:'b5' },
  { from:'c3', to:'b5', san:'Nxb5', capture:true },
  { from:'c6', to:'b5', san:'cxb5', capture:true },
  { from:'c4', to:'b5', san:'Bxb5+', capture:true, check:true },
  { from:'b8', to:'d7', san:'Nbd7' },
  { castle:'Q', from:'e1', san:'O-O-O', color:'w' },
  { from:'a8', to:'d8', san:'Rd8' },
  { from:'d1', to:'d7', san:'Rxd7', capture:true },
  { from:'d8', to:'d7', san:'Rxd7', capture:true },
  { from:'h1', to:'d1', san:'Rd1' },
  { from:'e7', to:'e6', san:'Qe6' },
  { from:'b5', to:'d7', san:'Bxd7+', capture:true, check:true },
  { from:'f6', to:'d7', san:'Nxd7', capture:true },
  { from:'b3', to:'b8', san:'Qb8+', check:true, comment:'Queen sac!' },
  { from:'d7', to:'b8', san:'Nxb8', capture:true },
  { from:'d1', to:'d8', san:'Rd8#', mate:true, comment:'Mate.' },
];

// Casual club game — short and decisive (Scholar's-mate-adjacent gone wrong)
const CLUB_GAME = [
  { from:'e2', to:'e4', san:'e4' },
  { from:'e7', to:'e5', san:'e5' },
  { from:'g1', to:'f3', san:'Nf3' },
  { from:'b8', to:'c6', san:'Nc6' },
  { from:'f1', to:'c4', san:'Bc4' },
  { from:'g8', to:'f6', san:'Nf6' },
  { from:'f3', to:'g5', san:'Ng5' },
  { from:'d7', to:'d5', san:'d5' },
  { from:'e4', to:'d5', san:'exd5', capture:true },
  { from:'f6', to:'d5', san:'Nxd5', capture:true },
  { from:'g5', to:'f7', san:'Nxf7', capture:true, comment:'Fried Liver!' },
  { from:'e8', to:'f7', san:'Kxf7', capture:true },
  { from:'d1', to:'f3', san:'Qf3+', check:true },
  { from:'f7', to:'e6', san:'Ke6' },
  { from:'b1', to:'c3', san:'Nc3' },
  { from:'c6', to:'b4', san:'Ncb4' },
];

// Quiet positional game — partial, in-progress feel
const POSITIONAL = [
  { from:'d2', to:'d4', san:'d4' },
  { from:'g8', to:'f6', san:'Nf6' },
  { from:'c2', to:'c4', san:'c4' },
  { from:'e7', to:'e6', san:'e6' },
  { from:'g1', to:'f3', san:'Nf3' },
  { from:'b7', to:'b6', san:'b6' },
  { from:'g2', to:'g3', san:'g3' },
  { from:'c8', to:'b7', san:'Bb7' },
  { from:'f1', to:'g2', san:'Bg2' },
  { from:'f8', to:'e7', san:'Be7' },
  { castle:'K', from:'e1', san:'O-O', color:'w' },
  { castle:'K', from:'e8', san:'O-O', color:'b' },
];

// Quick miniature — sharp Sicilian
const SICILIAN = [
  { from:'e2', to:'e4', san:'e4' },
  { from:'c7', to:'c5', san:'c5' },
  { from:'g1', to:'f3', san:'Nf3' },
  { from:'d7', to:'d6', san:'d6' },
  { from:'d2', to:'d4', san:'d4' },
  { from:'c5', to:'d4', san:'cxd4', capture:true },
  { from:'f3', to:'d4', san:'Nxd4', capture:true },
  { from:'g8', to:'f6', san:'Nf6' },
  { from:'b1', to:'c3', san:'Nc3' },
  { from:'a7', to:'a6', san:'a6' },
];

const GAMES = [
  {
    id: 'g1',
    white: 'You',
    black: 'D. Halverson',
    result: '1-0',
    date: '2026-05-22',
    eco: 'C41 — Philidor',
    moves: OPERA,
    tournament: 't1',
    round: 3,
    timeControl: 'G/90 +30',
    note: 'Opera Game line — clean finish.',
  },
  {
    id: 'g2',
    white: 'M. Okafor',
    black: 'You',
    result: '0-1',
    date: '2026-05-21',
    eco: 'C57 — Two Knights',
    moves: CLUB_GAME,
    tournament: 't1',
    round: 2,
    timeControl: 'G/90 +30',
  },
  {
    id: 'g3',
    white: 'You',
    black: 'R. Castellan',
    result: '½-½',
    date: '2026-05-20',
    eco: 'E15 — Queen\u2019s Indian',
    moves: POSITIONAL,
    tournament: 't1',
    round: 1,
    timeControl: 'G/90 +30',
    note: 'Solid prep, drew in 38.',
  },
  {
    id: 'g4',
    white: 'You',
    black: 'A. Petrov',
    result: '*',
    date: '2026-05-18',
    eco: 'B30 — Sicilian',
    moves: SICILIAN,
    tournament: 't2',
    round: 4,
    timeControl: 'G/60 +10',
    note: 'Adjourned at move 23.',
  },
  {
    id: 'g5',
    white: 'L. Beaumont',
    black: 'You',
    result: '0-1',
    date: '2026-05-11',
    eco: 'C41 — Philidor',
    moves: OPERA, // reuse for variety
    tournament: null,
    timeControl: 'Casual',
  },
  {
    id: 'g6',
    white: 'You',
    black: 'S. Whitfield',
    result: '1-0',
    date: '2026-05-04',
    eco: 'C57',
    moves: CLUB_GAME,
    tournament: 't3',
    round: 5,
    timeControl: 'G/45 +5',
  },
];

const TOURNAMENTS = [
  {
    id: 't1',
    name: 'Bayfront Open',
    venue: 'Bayfront Chess Club',
    rounds: 5,
    games: 3,
    startDate: '2026-05-20',
    endDate: '2026-05-24',
    standing: '4½ / 5',
    place: '2nd',
    color: 'walnut',
  },
  {
    id: 't2',
    name: 'Thursday Rapid',
    venue: 'Mercer St. Club',
    rounds: 6,
    games: 4,
    startDate: '2026-05-15',
    endDate: '2026-05-18',
    standing: '4 / 6',
    place: '5th',
    color: 'moss',
  },
  {
    id: 't3',
    name: 'Northside Classic',
    venue: 'Northside Library',
    rounds: 5,
    games: 5,
    startDate: '2026-05-01',
    endDate: '2026-05-04',
    standing: '3½ / 5',
    place: '4th',
    color: 'ink',
  },
];

const USER = {
  name: 'Marcus Hale',
  handle: '@mhale',
  rating: 1782,
  federation: 'USCF',
};

Object.assign(window, { GAMES, TOURNAMENTS, USER, OPERA, CLUB_GAME, POSITIONAL, SICILIAN });

// ── Live data loading from backend ───────────────────────────────────────────
// Replaces mock data with real API data. Falls back silently if backend is down.

let _liveDataListeners = [];
function onLiveDataReady(fn) { _liveDataListeners.push(fn); }

async function loadLiveData() {
  try {
    const [rawTournaments, rawGames] = await Promise.all([
      apiGetTournaments(),
      apiGetGames(),
    ]);
    const liveTournaments = rawTournaments.map((t, i) => backendTournamentToFrontend(t, i));
    const liveGames       = rawGames.map(backendGameSummaryToFrontend);
    TOURNAMENTS.length = 0;
    TOURNAMENTS.push(...liveTournaments);
    GAMES.length = 0;
    GAMES.push(...liveGames);
    window.LIVE_DATA_LOADED = true;
    _liveDataListeners.forEach(fn => fn());
    return { tournaments: liveTournaments, games: liveGames };
  } catch (e) {
    console.warn('Backend unreachable — using mock data:', e.message);
    window.LIVE_DATA_LOADED = false;
    return null;
  }
}

/** Load a single game's full move list; updates the GAMES entry in place. */
async function loadGameMoves(frontendId) {
  const g = GAMES.find(x => x.id === frontendId);
  if (!g || !g._backendId) return g;
  if (g.moves && g.moves.length > 0) return g;
  try {
    const full = await apiGetGame(g._backendId);
    const converted = backendGameToFrontend(full);
    Object.assign(g, converted);
    return g;
  } catch (e) {
    console.warn(`Could not load moves for game ${frontendId}:`, e.message);
    return g;
  }
}

Object.assign(window, { loadLiveData, loadGameMoves, onLiveDataReady });
