// api.jsx — all backend calls + data-format converters
// Backend: FastAPI at http://localhost:8000
// This file must be loaded BEFORE data.jsx / screens.

const API_BASE = 'http://localhost:8000';

// ── Raw fetch helpers ────────────────────────────────────────

async function apiFetch(path, opts = {}) {
  const r = await fetch(API_BASE + path, opts);
  if (!r.ok) {
    const msg = await r.text().catch(() => r.statusText);
    throw new Error(`API ${r.status}: ${msg}`);
  }
  return r.json();
}

// ── Tournaments ──────────────────────────────────────────────

async function apiGetTournaments() {
  return apiFetch('/tournaments');
}

async function apiCreateTournament({ name, description, location, startDate, endDate, numRounds, color }) {
  return apiFetch('/tournaments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      description: description || null,
      location: location || null,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      num_rounds: numRounds || null,
      color: color || null,
    }),
  });
}

async function apiUpdateTournament(id, updates) {
  return apiFetch(`/tournaments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

async function apiDeleteTournament(id) {
  const r = await fetch(`${API_BASE}/tournaments/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`Delete failed: ${r.status}`);
}

// ── Games ────────────────────────────────────────────────────

async function apiGetGames(tournamentId) {
  const qs = tournamentId != null ? `?tournament_id=${tournamentId}` : '';
  return apiFetch(`/games${qs}`);
}

async function apiGetGame(id) {
  return apiFetch(`/games/${id}`);
}

/** Upload score sheet image. Returns the full game object from the backend. */
async function apiCreateGame(imageFile, tournamentId) {
  const form = new FormData();
  form.append('image', imageFile);
  if (tournamentId != null) form.append('tournament_id', String(tournamentId));
  return apiFetch('/games', { method: 'POST', body: form });
}

async function apiDeleteGame(id) {
  const r = await fetch(`${API_BASE}/games/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`Delete failed: ${r.status}`);
}

/** Create a game without a score sheet (metadata-only, no OCR). */
async function apiCreateGameManual({ white, black, result, date, round, event, tournamentId }) {
  const RESULT_MAP = { '1-0': 'white_won', '0-1': 'black_won', '½-½': 'draw', '*': 'unknown' };
  return apiFetch('/games/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      white_player: white || null,
      black_player: black || null,
      result: RESULT_MAP[result] || 'unknown',
      game_date: date || null,
      round: round || null,
      event: event || null,
      tournament_id: tournamentId != null ? tournamentId : null,
    }),
  });
}

/** Patch editable metadata. Only provided keys are updated. */
async function apiUpdateGame(id, updates) {
  return apiFetch(`/games/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

/** Returns the URL of the original score sheet image (no fetch — just the URL string). */
function apiGetGameImageUrl(backendId) {
  return `${API_BASE}/games/${backendId}/image`;
}

/** Download PGN text for a game. */
async function apiGetGamePGN(backendId) {
  const r = await fetch(`${API_BASE}/games/${backendId}/pgn`);
  if (!r.ok) throw new Error(`PGN fetch failed: ${r.status}`);
  return r.text();
}

// ── Data converters ──────────────────────────────────────────

const RESULT_MAP = {
  white_won: '1-0',
  black_won: '0-1',
  draw: '½-½',
  unknown: '*',
};

const COLOR_MAP = ['walnut', 'moss', 'ink', 'brick'];

/**
 * Convert a UCI string (e.g. "e2e4", "e1g1") + SAN into the from/to move
 * format that chess.jsx's applyMove() and computePositions() expect.
 */
function uciToMove(uci, san) {
  if (!uci || !san) return null;
  const from = uci.slice(0, 2);
  const to   = uci.slice(2, 4);
  const promotionUci = uci.length === 5 ? uci[4].toUpperCase() : null;

  // Castling detection
  if ((from === 'e1' && to === 'g1') || san === 'O-O' && from[1] === '1')
    return { castle: 'K', from, san, color: 'w' };
  if ((from === 'e1' && to === 'c1') || san === 'O-O-O' && from[1] === '1')
    return { castle: 'Q', from, san, color: 'w' };
  if ((from === 'e8' && to === 'g8') || san === 'O-O' && from[1] === '8')
    return { castle: 'K', from, san, color: 'b' };
  if ((from === 'e8' && to === 'c8') || san === 'O-O-O' && from[1] === '8')
    return { castle: 'Q', from, san, color: 'b' };

  return {
    from, to, san,
    capture: san.includes('x'),
    check: san.endsWith('+'),
    mate: san.endsWith('#'),
    promotion: promotionUci,
  };
}

/** Convert a backend game object to the shape screens-home/replay expect. */
function backendGameToFrontend(g) {
  const moves = [];
  for (const m of (g.moves || [])) {
    if (m.white_san && m.white_uci) moves.push(uciToMove(m.white_uci, m.white_san));
    if (m.black_san && m.black_uci) moves.push(uciToMove(m.black_uci, m.black_san));
  }
  const dateStr = g.game_date
    ? g.game_date
    : (g.added_at ? g.added_at.split('T')[0] : null);
  return {
    id: String(g.id),
    _backendId: g.id,
    white: g.white_player || 'Unknown',
    black: g.black_player || 'Unknown',
    result: RESULT_MAP[g.result] || '*',
    date: dateStr || new Date().toISOString().split('T')[0],
    eco: g.opening || '—',
    moves,
    tournament: g.tournament_id != null ? String(g.tournament_id) : null,
    round: g.round ? parseInt(g.round) : null,
    board: g.board || null,
    section: g.section || null,
    timeControl: null,
    note: g.ocr_warnings || null,
    event: g.event || null,
  };
}

/** Convert backend summary (no moves) to the card format. */
function backendGameSummaryToFrontend(g) {
  const dateStr = g.game_date || (g.added_at ? g.added_at.split('T')[0] : null);
  return {
    id: String(g.id),
    _backendId: g.id,
    white: g.white_player || 'Unknown',
    black: g.black_player || 'Unknown',
    result: RESULT_MAP[g.result] || '*',
    date: dateStr || new Date().toISOString().split('T')[0],
    eco: '—',
    moves: [],            // filled lazily on replay
    tournament: g.tournament_id != null ? String(g.tournament_id) : null,
    round: null,
    timeControl: null,
  };
}

/** Convert backend tournament to the card format. */
function backendTournamentToFrontend(t, index) {
  const startDate = t.start_date ? t.start_date.split('T')[0] : null;
  const endDate   = t.end_date   ? t.end_date.split('T')[0]   : null;
  return {
    id: String(t.id),
    _backendId: t.id,
    name: t.name,
    venue: t.location || t.description || '',
    rounds: t.num_rounds || null,   // null = auto-compute from scanned games
    games: t.game_count || 0,
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate:   endDate   || new Date().toISOString().split('T')[0],
    standing: '—',
    place: '—',
    color: t.color || COLOR_MAP[index % COLOR_MAP.length],
  };
}

// Expose everything globally for the other JSX files
Object.assign(window, {
  API_BASE,
  apiGetTournaments,
  apiCreateTournament,
  apiUpdateTournament,
  apiDeleteTournament,
  apiGetGames,
  apiGetGame,
  apiCreateGame,
  apiCreateGameManual,
  apiDeleteGame,
  apiUpdateGame,
  apiGetGameImageUrl,
  apiGetGamePGN,
  uciToMove,
  backendGameToFrontend,
  backendGameSummaryToFrontend,
  backendTournamentToFrontend,
});
