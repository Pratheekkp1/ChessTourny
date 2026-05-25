// screens-home.jsx — home, tournament detail screens

function parseLocal(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const TODAY = parseLocal('2026-05-24');

function formatDate(iso, opts = {}) {
  const d = parseLocal(iso);
  const { mode = 'short' } = opts;
  if (mode === 'long')   return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  if (mode === 'header') return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysAgo(iso) {
  const d = parseLocal(iso);
  const diff = Math.round((TODAY - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)   return diff + 'd ago';
  if (diff < 30)  return Math.floor(diff / 7) + 'w ago';
  return formatDate(iso);
}

// ──────────────────────────────────────────────────────────
// Header — name top-left, date top-right
// ──────────────────────────────────────────────────────────
function AppHeader({ user, date, mode, onToggleMode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '4px 20px 0', gap: 12,
    }}>
      <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--ink)', color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700,
          letterSpacing: 0.4,
          flexShrink: 0,
          boxShadow: 'var(--shadow-1)',
        }}>{user.name.split(' ').map(s => s[0]).slice(0, 2).join('')}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: 'var(--display)', fontSize: 16, lineHeight: 1.1,
            color: 'var(--fg)', letterSpacing: -0.3, fontWeight: 600,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{user.name}</div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
            marginTop: 3, letterSpacing: 0.3, fontWeight: 500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{user.federation} · <span style={{ color: 'var(--fg-2)' }}>{user.rating}</span>
            <span style={{ color: 'var(--win)', marginLeft: 5, fontWeight: 600 }}>↑18</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--display)', fontSize: 15, lineHeight: 1.1,
            color: 'var(--fg)', letterSpacing: -0.2, fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>{formatDate(date, { mode: 'header' })}</div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
            marginTop: 2, letterSpacing: 0.4, fontWeight: 500,
          }}>{parseLocal(date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</div>
        </div>
        <div onClick={onToggleMode} style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--fg)', flexShrink: 0,
        }}>
          {mode === 'light'
            ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12 8.5A4.5 4.5 0 016.5 3a4 4 0 00-0.2 0 5 5 0 105.7 5.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
            : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M7 0.8v1.4M7 11.8v1.4M13.2 7h-1.4M2.2 7H0.8M11.4 2.6l-1 1M3.6 10.4l-1 1M11.4 11.4l-1-1M3.6 3.6l-1-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          }
        </div>
      </div>
    </div>
  );
}

// Section heading
function SectionLabel({ children, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '0 20px', marginBottom: 10,
    }}>
      <span style={{
        fontFamily: 'var(--display)', fontSize: 13, fontWeight: 600,
        color: 'var(--fg)', letterSpacing: 0.5,
        textTransform: 'uppercase', whiteSpace: 'nowrap',
      }}>{children}</span>
      {action && (
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
          letterSpacing: 0.4, whiteSpace: 'nowrap', flexShrink: 0,
          fontWeight: 500,
        }}>{action}</span>
      )}
    </div>
  );
}

// Result badge
function ResultBadge({ result, perspective }) {
  // perspective: 'w' or 'b' — what color the player was
  if (result === '*') return (
    <div style={{
      padding: '3px 8px', borderRadius: 6,
      background: 'var(--surface-2)', color: 'var(--fg-2)',
      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
      letterSpacing: 0.5, whiteSpace: 'nowrap', display: 'inline-block',
    }}>ONGOING</div>
  );
  let kind = 'draw';
  if (result === '1-0') kind = perspective === 'w' ? 'win' : 'loss';
  else if (result === '0-1') kind = perspective === 'b' ? 'win' : 'loss';
  const bg = kind === 'win' ? 'var(--win)' : kind === 'loss' ? 'var(--loss)' : 'var(--draw)';
  const label = kind === 'win' ? '+1' : kind === 'loss' ? '–1' : '½';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px', borderRadius: 6,
      background: bg, color: '#fff',
      fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
      letterSpacing: 0.3, whiteSpace: 'nowrap',
    }}>
      <span>{label}</span>
      <span style={{ opacity: 0.75, fontSize: 10, fontWeight: 500 }}>{result}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Tournament card — modern
// ──────────────────────────────────────────────────────────
function TournamentCard({ tournament, onTap }) {
  const t = tournament;
  const colorMap = {
    walnut: 'var(--walnut)',
    moss:   'var(--moss)',
    ink:    'var(--ink)',
    brick:  'var(--brick)',
  };
  const accent = colorMap[t.color] || 'var(--walnut)';
  return (
    <div onClick={onTap} style={{
      flexShrink: 0, width: 220,
      background: 'var(--surface)', borderRadius: 16,
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-1)',
      display: 'flex', flexDirection: 'column',
      cursor: 'pointer', overflow: 'hidden',
    }}>
      {/* accent strip with rank + game count */}
      <div style={{
        background: accent,
        padding: '8px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        whiteSpace: 'nowrap',
      }}>
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
          color: '#fff', letterSpacing: 1, textTransform: 'uppercase',
        }}>R{t.rounds} · {t.games} games</span>
        <span style={{
          fontFamily: 'var(--display)', fontSize: 11, fontWeight: 700,
          color: '#fff', opacity: 0.95, letterSpacing: 0.3,
        }}>{t.place}</span>
      </div>

      <div style={{ padding: 14 }}>
        <div style={{
          fontFamily: 'var(--display)', fontSize: 17, lineHeight: 1.1,
          color: 'var(--fg)', fontWeight: 600, letterSpacing: -0.3,
        }}>{t.name}</div>
        <div style={{
          fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--fg-2)',
          marginTop: 3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{t.venue}</div>

        {/* Big standing */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 4,
          marginTop: 14,
        }}>
          <span style={{
            fontFamily: 'var(--display)', fontSize: 30, lineHeight: 1,
            color: 'var(--fg)', fontWeight: 700, letterSpacing: -1,
          }}>{t.standing.split(' / ')[0]}</span>
          <span style={{
            fontFamily: 'var(--display)', fontSize: 16, lineHeight: 1,
            color: 'var(--fg-3)', fontWeight: 500,
          }}>/ {t.standing.split(' / ')[1]}</span>
        </div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
          marginTop: 4, letterSpacing: 0.4, fontWeight: 500,
          whiteSpace: 'nowrap',
        }}>{formatDate(t.startDate)} — {formatDate(t.endDate)}</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Game card — modern
// ──────────────────────────────────────────────────────────
function GameCard({ game, onTap }) {
  const positions = React.useMemo(() => computePositions(game.moves).positions, [game.id]);
  const lastPos = positions[positions.length - 1];
  const moveCount = Math.ceil(game.moves.length / 2);
  const youWhite = game.white === 'You';
  const perspective = youWhite ? 'w' : 'b';
  const opponent = youWhite ? game.black : game.white;

  return (
    <div onClick={onTap} style={{
      background: 'var(--surface)', borderRadius: 14,
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-1)',
      padding: 12, display: 'flex', gap: 12,
      cursor: 'pointer', alignItems: 'center',
    }}>
      <div style={{ borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
        <MiniBoard position={lastPos} size={60} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* color chip + opponent */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 11, height: 11, borderRadius: 3,
            background: perspective === 'w' ? '#fff' : '#14151A',
            border: '1px solid var(--border-strong)',
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
            letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600,
          }}>vs</span>
          <span style={{
            fontFamily: 'var(--display)', fontSize: 16,
            color: 'var(--fg)', fontWeight: 600, letterSpacing: -0.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            minWidth: 0, flex: 1,
          }}>{opponent}</span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: 5,
          fontFamily: 'var(--mono)', fontSize: 10,
          color: 'var(--fg-2)', fontWeight: 500, letterSpacing: 0.2,
          whiteSpace: 'nowrap', overflow: 'hidden',
        }}>
          {moveCount > 0 ? (
            <>
              <span>{game.eco?.split(' — ')[0]}</span>
              <span style={{ color: 'var(--fg-3)' }}>·</span>
              <span>{moveCount} moves</span>
            </>
          ) : (
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
              padding: '1px 6px', borderRadius: 4,
              background: 'var(--surface-2)', color: 'var(--fg-3)',
              letterSpacing: 0.6, textTransform: 'uppercase',
              border: '1px solid var(--border)',
            }}>No score sheet</span>
          )}
          <span style={{ color: 'var(--fg-3)' }}>·</span>
          <span>{daysAgo(game.date)}</span>
        </div>

        <div style={{ marginTop: 8 }}>
          <ResultBadge result={game.result} perspective={perspective} />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Stat tile — small numeric cards on home
// ──────────────────────────────────────────────────────────
function StatTile({ value, label, accent }) {
  return (
    <div style={{
      flex: 1, padding: 12,
      background: 'var(--surface)', borderRadius: 12,
      border: '1px solid var(--border)',
    }}>
      <div style={{
        fontFamily: 'var(--display)', fontSize: 26, lineHeight: 1,
        color: accent || 'var(--fg)', fontWeight: 700, letterSpacing: -0.8,
        whiteSpace: 'nowrap',
      }}>{value}</div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
        marginTop: 6, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{label}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Computed stats helpers
// ──────────────────────────────────────────────────────────
function computeUserStats(games, userName) {
  let wins = 0, losses = 0, draws = 0;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let gamesThisMonth = 0;

  for (const g of games) {
    if (!g.date) continue;
    const youWhite = (g.white === 'You' || g.white === userName);
    const youBlack = (g.black === 'You' || g.black === userName);
    if (!youWhite && !youBlack) continue;

    const gDate = parseLocal(g.date);
    if (gDate >= monthStart) gamesThisMonth++;

    if (g.result === '1-0') { youWhite ? wins++ : losses++; }
    else if (g.result === '0-1') { youBlack ? wins++ : losses++; }
    else if (g.result === '½-½' || g.result === '1/2-1/2') draws++;
  }
  return { wins, losses, draws, gamesThisMonth, total: wins + losses + draws };
}

// ──────────────────────────────────────────────────────────
// Home screen
// ──────────────────────────────────────────────────────────
function HomeScreen({ nav, today, user, mode }) {
  const tournaments = TOURNAMENTS;
  const recentGames = GAMES.slice(0, 4);
  const stats = computeUserStats(GAMES, user.name);
  const wld = stats.total > 0 ? `${stats.wins}–${stats.losses}–${stats.draws}` : '—';
  const winPct = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) + '%' : '—';

  // Find the first active tournament with an upcoming unplayed round
  const upcomingRound = (() => {
    for (const t of TOURNAMENTS) {
      if (!t.rounds) continue;
      const tGames = GAMES.filter(g => g.tournament === t.id);
      const scannedRounds = tGames.map(g => g.round).filter(Boolean).map(Number);
      const maxScanned = scannedRounds.length > 0 ? Math.max(...scannedRounds) : 0;
      const nextRound = maxScanned + 1;
      if (nextRound <= t.rounds) return { tournament: t, round: nextRound };
    }
    return null;
  })();

  const colorMap = { walnut: 'var(--walnut)', moss: 'var(--moss)', ink: 'var(--ink)', brick: 'var(--brick)' };

  return (
    <div style={{
      paddingBottom: 110, paddingTop: 54,
      background: 'var(--bg)', minHeight: '100%',
    }}>
      <AppHeader user={user} date={today} mode={mode} onToggleMode={() => nav.toggleMode()} />

      {/* Stats strip */}
      <div style={{
        display: 'flex', gap: 8,
        padding: '20px 20px 4px',
      }}>
        <StatTile value={stats.gamesThisMonth || GAMES.length} label="Games / month" />
        <StatTile value={wld} label="W–L–D" />
        <StatTile value={winPct} label="Win rate" accent="var(--win)" />
      </div>

      {/* Upcoming round prompt */}
      {upcomingRound && (
        <div style={{ padding: '14px 20px 0' }}>
          <div
            onClick={() => nav.go('quick-add-game', {
              tournamentId: upcomingRound.tournament.id,
              round: String(upcomingRound.round),
            })}
            style={{
              background: colorMap[upcomingRound.tournament.color] || 'var(--walnut)',
              borderRadius: 14,
              padding: '13px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-2)',
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 4v5l3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="1.6"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(255,255,255,0.75)',
                textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700,
                marginBottom: 2,
              }}>Up next</div>
              <div style={{
                fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700,
                color: '#fff', letterSpacing: -0.2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                Round {upcomingRound.round} · {upcomingRound.tournament.name}
              </div>
            </div>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2l5 5-5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 22 }}>
        <SectionLabel action={tournaments.length + ' active'}>Tournaments</SectionLabel>
        <div style={{
          display: 'flex', gap: 10, overflowX: 'auto',
          padding: '4px 20px 18px', scrollbarWidth: 'none',
        }}>
          {tournaments.map(t => (
            <TournamentCard key={t.id} tournament={t} onTap={() => nav.go('tournament', { id: t.id })} />
          ))}
          <div onClick={() => nav.go('new-tournament')} style={{
            flexShrink: 0, width: 96, minHeight: 130,
            border: '1px dashed var(--border-strong)',
            borderRadius: 16,
            background: 'transparent',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6,
            cursor: 'pointer', color: 'var(--fg-3)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600,
              color: 'var(--fg-2)',
            }}>+</div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
              textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600,
              textAlign: 'center', padding: '0 6px',
            }}>New folder</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 4, paddingBottom: 20 }}>
        <SectionLabel action={
          <span style={{ cursor: 'pointer' }} onClick={() => nav.go('all-games')}>View all →</span>
        }>Recent games</SectionLabel>
        {recentGames.length === 0 ? (
          <EmptyState
            icon="♟"
            title="No games yet"
            body="Scan a score sheet to record your first game."
            action="Scan now"
            onAction={() => nav.go('scan')}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px' }}>
            {recentGames.map(g => (
              <GameCard key={g.id} game={g} onTap={() => nav.go('replay', { id: g.id })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Tournament Detail screen
// ──────────────────────────────────────────────────────────
function TournamentScreen({ nav, params }) {
  const t = TOURNAMENTS.find(x => x.id === params.id);
  const games = GAMES.filter(g => g.tournament === params.id);
  const [confirmDelete, setConfirmDelete] = React.useState(null); // gameId to delete
  const [deleting, setDeleting] = React.useState(false);
  const [showTournamentOptions, setShowTournamentOptions] = React.useState(false);
  const [deletingTournament, setDeletingTournament] = React.useState(false);
  if (!t) return (
    <div style={{ padding: 40, color: 'var(--fg-3)', fontFamily: 'var(--sans)', fontSize: 14 }}>
      Tournament not found.
    </div>
  );

  // Compute real standing from scanned games
  const youGames = games.filter(g => g.white === 'You' || g.black === 'You');
  const won  = youGames.filter(g => (g.result === '1-0' && g.white === 'You') || (g.result === '0-1' && g.black === 'You')).length;
  const drew = youGames.filter(g => g.result === '½-½').length;
  const pts  = won + drew * 0.5;
  const standing = youGames.length > 0 ? `${pts} / ${youGames.length}` : (t.standing || '—');

  // Group games by round; also collect no-round games
  const gamesByRound = {};
  const noRoundGames = [];
  games.forEach(g => {
    if (g.round) gamesByRound[g.round] = g;
    else noRoundGames.push(g);
  });

  // Determine rounds to display
  const roundNums = t.rounds
    ? Array.from({ length: t.rounds }, (_, i) => i + 1)
    : Object.keys(gamesByRound).map(Number).sort((a, b) => a - b);

  const colorMap = { walnut: 'var(--walnut)', moss: 'var(--moss)', ink: 'var(--ink)', brick: 'var(--brick)' };
  const accent = colorMap[t.color] || 'var(--walnut)';

  async function handleDeleteGame(gameId, backendId) {
    setDeleting(true);
    try {
      if (backendId) await apiDeleteGame(backendId);
      const idx = GAMES.findIndex(g => g.id === gameId);
      if (idx !== -1) GAMES.splice(idx, 1);
    } catch (e) { console.warn('Delete failed:', e); }
    setConfirmDelete(null);
    setDeleting(false);
    // Force re-render by triggering nav refresh
    nav.go('tournament', { id: params.id });
    nav.back();
  }

  return (
    <div style={{
      paddingTop: 56, paddingBottom: 110,
      background: 'var(--bg)', minHeight: '100%', color: 'var(--fg)',
    }}>
      {/* Confirm delete game sheet */}
      {confirmDelete && (
        <ActionSheet
          title="Delete this game?"
          body="This will permanently remove the game and its score sheet image."
          actions={[
            { label: deleting ? 'Deleting…' : 'Delete game', danger: true, onClick: () => handleDeleteGame(confirmDelete.id, confirmDelete._backendId) },
          ]}
          onDismiss={() => setConfirmDelete(null)}
        />
      )}

      {/* Tournament options sheet */}
      {showTournamentOptions && (
        <ActionSheet
          title={t.name}
          body="What would you like to do with this tournament?"
          actions={[
            { label: 'Edit tournament', onClick: () => { setShowTournamentOptions(false); nav.go('edit-tournament', { tournament: t }); } },
            { label: deletingTournament ? 'Deleting…' : 'Delete tournament', danger: true, onClick: async () => {
              setDeletingTournament(true);
              try {
                if (t._backendId) await apiDeleteTournament(t._backendId);
                const idx = TOURNAMENTS.findIndex(x => x.id === t.id);
                if (idx !== -1) TOURNAMENTS.splice(idx, 1);
                nav.reset();
              } catch (e) { console.warn('Delete tournament failed:', e); }
              setDeletingTournament(false);
              setShowTournamentOptions(false);
            }},
          ]}
          onDismiss={() => setShowTournamentOptions(false)}
        />
      )}

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 20px 0',
      }}>
        <BackButton onClick={() => nav.back()} />
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
          letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600,
        }}>Tournament</div>
        {/* Options button */}
        <div onClick={() => setShowTournamentOptions(true)} style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--fg)',
          background: 'var(--surface)', border: '1px solid var(--border)',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="4" r="1.2" fill="currentColor"/>
            <circle cx="8" cy="8" r="1.2" fill="currentColor"/>
            <circle cx="8" cy="12" r="1.2" fill="currentColor"/>
          </svg>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          display: 'inline-block',
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
          padding: '3px 8px', borderRadius: 6,
          background: accent, color: '#fff',
          letterSpacing: 0.8, textTransform: 'uppercase',
          marginBottom: 10, whiteSpace: 'nowrap',
        }}>{t.place || (youGames.length > 0 ? `${won}W ${drew}D` : 'In progress')}</div>
        <div style={{
          fontFamily: 'var(--display)', fontSize: 32, lineHeight: 1.05,
          color: 'var(--fg)', letterSpacing: -1, fontWeight: 700,
        }}>{t.name}</div>
        <div style={{
          fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--fg-2)',
          marginTop: 6,
        }}>{t.venue}{t.venue && ' · '}{formatDate(t.startDate)} – {formatDate(t.endDate)}</div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <StatTile value={standing} label="Standing" />
          <StatTile value={games.length + (t.rounds ? '/' + t.rounds : '')} label="Played" />
          <StatTile value={youGames.length > 0 ? Math.round((won / youGames.length) * 100) + '%' : '—'} label="Win rate" />
        </div>

        {/* Performance score bar */}
        {youGames.length > 0 && (() => {
          const lost = youGames.length - won - drew;
          const total = t.rounds || youGames.length;
          const maxPts = total;
          const scorePct = Math.round((pts / maxPts) * 100);
          return (
            <div style={{ marginTop: 18 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                marginBottom: 8,
              }}>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
                  textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600,
                }}>Tournament performance</div>
                <div style={{
                  fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: 'var(--fg)',
                }}>{pts}<span style={{ fontSize: 11, color: 'var(--fg-3)', fontWeight: 500 }}>/{maxPts} pts</span></div>
              </div>
              {/* Stacked W/D/L bar */}
              <div style={{
                height: 10, borderRadius: 999, overflow: 'hidden',
                background: 'var(--surface-2)', display: 'flex',
                border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: `${(won / maxPts) * 100}%`,
                  background: 'var(--win)', transition: 'width 0.5s ease',
                }} />
                <div style={{
                  width: `${(drew / maxPts) * 50}%`,
                  background: 'var(--draw)', transition: 'width 0.5s ease',
                }} />
                <div style={{
                  width: `${(lost / maxPts) * 100}%`,
                  background: 'var(--loss)', opacity: 0.35, transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{
                display: 'flex', gap: 14, marginTop: 8,
                fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)', fontWeight: 600,
              }}>
                <span style={{ color: 'var(--win)' }}>{won}W</span>
                <span style={{ color: 'var(--draw)' }}>{drew}D</span>
                <span style={{ color: 'var(--loss)', opacity: 0.6 }}>{lost}L</span>
                <span style={{ marginLeft: 'auto' }}>{scorePct}% score</span>
              </div>
            </div>
          );
        })()}
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        <SectionLabel action={games.length + ' scanned'}>Rounds</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {roundNums.map(r => {
            const g = gamesByRound[r];
            return (
              <div key={r}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
                    textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap', fontWeight: 600,
                  }}>Round {r}</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                {g ? (
                  <SwipeableGameCard
                    game={g}
                    onTap={() => nav.go('replay', { id: g.id })}
                    onDelete={() => setConfirmDelete(g)}
                    onEdit={() => nav.go('edit-game', { game: g })}
                  />
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px',
                    border: '1px dashed var(--border-strong)',
                    borderRadius: 14, color: 'var(--fg-3)',
                    gap: 8,
                  }}>
                    <span style={{ fontFamily: 'var(--sans)', fontSize: 13, flex: 1 }}>Not yet scanned</span>
                    <div onClick={() => nav.go('quick-add-game', { tournamentId: t.id, round: String(r) })} style={{
                      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                      padding: '4px 10px', borderRadius: 6,
                      background: 'var(--surface-2)', color: 'var(--fg-2)',
                      border: '1px solid var(--border)',
                      letterSpacing: 0.6, textTransform: 'uppercase', cursor: 'pointer',
                    }}>+ Add</div>
                    <div onClick={() => nav.go('scan', { tournamentId: t.id })} style={{
                      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                      padding: '4px 10px', borderRadius: 6,
                      background: 'var(--ink)', color: 'var(--paper)',
                      letterSpacing: 0.6, textTransform: 'uppercase', cursor: 'pointer',
                    }}>Scan</div>
                  </div>
                )}
              </div>
            );
          })}
          {/* Games with no round number */}
          {noRoundGames.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
                  textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap', fontWeight: 600,
                }}>Other games</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              {noRoundGames.map(g => (
                <div key={g.id} style={{ marginBottom: 10 }}>
                  <SwipeableGameCard
                    game={g}
                    onTap={() => nav.go('replay', { id: g.id })}
                    onDelete={() => setConfirmDelete(g)}
                    onEdit={() => nav.go('edit-game', { game: g })}
                  />
                </div>
              ))}
            </div>
          )}
          {/* Always offer to scan an additional game */}
          <div onClick={() => nav.go('scan', { tournamentId: t.id })} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '16px', marginTop: 4,
            border: '1px dashed var(--border)',
            borderRadius: 14, color: 'var(--fg-3)', cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500 }}>Add another game</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Swipeable game card (shows edit/delete actions)
// ──────────────────────────────────────────────────────────
function SwipeableGameCard({ game, onTap, onDelete, onEdit }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 14 }}>
      {/* Slide-out actions */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        display: 'flex', alignItems: 'stretch',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.22s ease',
        zIndex: 1,
      }}>
        <div onClick={onEdit} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 64, background: 'var(--ink)', color: 'var(--paper)',
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer', gap: 4,
          flexDirection: 'column',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 10.5l1.5-1.5 7-7 1.5 1.5-7 7L2 10.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Edit
        </div>
        <div onClick={onDelete} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 64, background: 'var(--loss)', color: '#fff',
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer', gap: 4,
          flexDirection: 'column',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5h10M5 3.5V2h4v1.5M5.5 6v4.5M8.5 6v4.5M3.5 3.5l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Delete
        </div>
      </div>

      {/* The card itself — slides left to reveal actions */}
      <div
        style={{ transform: open ? 'translateX(-128px)' : 'translateX(0)', transition: 'transform 0.22s ease', position: 'relative', zIndex: 2 }}
        onPointerDown={(e) => {
          const startX = e.clientX;
          const onUp = (eu) => {
            const dx = eu.clientX - startX;
            if (dx < -40) setOpen(true);
            else if (dx > 20) setOpen(false);
            document.removeEventListener('pointerup', onUp);
          };
          document.addEventListener('pointerup', onUp);
        }}
      >
        <GameCard game={game} onTap={open ? () => setOpen(false) : onTap} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Swipeable Tournament card (swipe left → Edit / Delete)
// ──────────────────────────────────────────────────────────
function SwipeableTournamentCard({ tournament: t, onTap, onEdit, onDelete }) {
  const [offset, setOffset] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const startX = React.useRef(null);
  const startY = React.useRef(null);
  const locked = React.useRef(null);
  const REVEAL = 140;

  const onPointerDown = (e) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    locked.current = null;
    setDragging(false);
  };
  const onPointerMove = (e) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (!locked.current) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        locked.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      }
    }
    if (locked.current !== 'h') return;
    setDragging(true);
    e.stopPropagation();
    setOffset(Math.max(-REVEAL, Math.min(0, dx)));
  };
  const onPointerUp = () => {
    startX.current = null; startY.current = null; locked.current = null;
    setDragging(false);
    setOffset(prev => (prev < -REVEAL / 2 ? -REVEAL : 0));
  };

  const tGames = GAMES.filter(g => g.tournament === t.id);
  const won = tGames.filter(g =>
    (g.result === '1-0' && g.white === 'You') || (g.result === '0-1' && g.black === 'You')
  ).length;
  const drew = tGames.filter(g => g.result === '½-½').length;
  const colorMap = { walnut: 'var(--walnut)', moss: 'var(--moss)', ink: 'var(--ink)', brick: 'var(--brick)' };
  const accent = colorMap[t.color] || 'var(--walnut)';

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
      {/* Action buttons revealed on swipe */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        display: 'flex', alignItems: 'center', paddingRight: 4,
      }}>
        <div onClick={onEdit} style={{
          width: 62, height: '88%', borderRadius: 12,
          background: 'var(--draw)', color: '#fff',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 4,
          cursor: 'pointer', marginRight: 4,
          fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
          Edit
        </div>
        <div onClick={onDelete} style={{
          width: 62, height: '88%', borderRadius: 12,
          background: 'var(--loss)', color: '#fff',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 4,
          cursor: 'pointer',
          fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M6 7v4M8 7v4M3 4l.8 7.2a1 1 0 001 .8h4.4a1 1 0 001-.8L11 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Delete
        </div>
      </div>

      {/* Card body (slides left on swipe) */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => { if (offset === 0 && !dragging) onTap(); }}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.22s ease',
          background: 'var(--surface)', borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-1)',
          overflow: 'hidden', cursor: 'pointer',
          userSelect: 'none', touchAction: 'pan-y',
        }}
      >
        <div style={{
          background: accent, padding: '8px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
            color: '#fff', letterSpacing: 1, textTransform: 'uppercase',
          }}>{tGames.length} game{tGames.length !== 1 ? 's' : ''} scanned</span>
          {t.place && t.place !== '—' && (
            <span style={{ fontFamily: 'var(--display)', fontSize: 11, fontWeight: 700, color: '#fff' }}>{t.place}</span>
          )}
        </div>
        <div style={{ padding: '12px 14px' }}>
          <div style={{
            fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600,
            color: 'var(--fg)', letterSpacing: -0.3,
          }}>{t.name}</div>
          <div style={{
            fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--fg-2)', marginTop: 2,
          }}>{t.venue || 'No venue'} · {formatDate(t.startDate)}</div>
          {tGames.length > 0 && (
            <div style={{
              display: 'flex', gap: 10, marginTop: 10,
              fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-3)', fontWeight: 600,
            }}>
              <span style={{ color: 'var(--win)' }}>{won}W</span>
              <span style={{ color: 'var(--loss)' }}>{tGames.length - won - drew}L</span>
              <span style={{ color: 'var(--draw)' }}>{drew}D</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// All Tournaments list screen
// ──────────────────────────────────────────────────────────
function TournamentsListScreen({ nav }) {
  const [q, setQ] = React.useState('');
  const [confirmDeleteT, setConfirmDeleteT] = React.useState(null);
  const [deletingT, setDeletingT] = React.useState(false);

  const filtered = TOURNAMENTS.filter(t =>
    !q || t.name.toLowerCase().includes(q.toLowerCase()) || (t.venue || '').toLowerCase().includes(q.toLowerCase())
  );

  async function handleDeleteTournament(t) {
    setDeletingT(true);
    try {
      if (t._backendId) await apiDeleteTournament(t._backendId);
      const idx = TOURNAMENTS.findIndex(x => x.id === t.id);
      if (idx !== -1) TOURNAMENTS.splice(idx, 1);
    } catch (e) { console.warn('Delete failed:', e); }
    setConfirmDeleteT(null);
    setDeletingT(false);
  }

  return (
    <div style={{
      paddingTop: 56, paddingBottom: 110,
      background: 'var(--bg)', minHeight: '100%', color: 'var(--fg)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 20px 0',
      }}>
        <div style={{
          fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700,
          letterSpacing: -0.5, color: 'var(--fg)',
        }}>Tournaments</div>
        <div onClick={() => nav.go('new-tournament')} style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--ink)', color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-2)',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '0 14px', height: 42,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--fg-3)', flexShrink: 0 }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search tournaments…"
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--fg)',
              outline: 'none',
            }}
          />
          {q && <div onClick={() => setQ('')} style={{ color: 'var(--fg-3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</div>}
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDeleteT && (
        <ActionSheet
          title="Delete tournament?"
          body={`"${confirmDeleteT.name}" and all its data will be permanently removed.`}
          actions={[
            { label: deletingT ? 'Deleting…' : 'Delete tournament', danger: true, onClick: () => handleDeleteTournament(confirmDeleteT) },
          ]}
          onDismiss={() => setConfirmDeleteT(null)}
        />
      )}

      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="🏆"
            title={q ? 'No matches' : 'No tournaments yet'}
            body={q ? 'Try a different search.' : 'Create a tournament to group your games.'}
            action={q ? null : 'New tournament'}
            onAction={q ? null : () => nav.go('new-tournament')}
          />
        ) : (
          filtered.map(t => (
            <SwipeableTournamentCard
              key={t.id}
              tournament={t}
              onTap={() => nav.go('tournament', { id: t.id })}
              onEdit={() => nav.go('edit-tournament', { tournament: t })}
              onDelete={() => setConfirmDeleteT(t)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// All Games list screen
// ──────────────────────────────────────────────────────────
function GamesListScreen({ nav }) {
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState('all'); // all | win | loss | draw
  const [confirmDelete, setConfirmDelete] = React.useState(null);
  const [deleting, setDeleting] = React.useState(false);

  async function handleDeleteGame(gameId, backendId) {
    setDeleting(true);
    try {
      if (backendId) await apiDeleteGame(backendId);
      const idx = GAMES.findIndex(g => g.id === gameId);
      if (idx !== -1) GAMES.splice(idx, 1);
    } catch (e) { console.warn('Delete failed:', e); }
    setConfirmDelete(null);
    setDeleting(false);
  }

  const filtered = GAMES.filter(g => {
    if (q) {
      const search = q.toLowerCase();
      if (!(g.white || '').toLowerCase().includes(search) &&
          !(g.black || '').toLowerCase().includes(search) &&
          !(g.eco || '').toLowerCase().includes(search)) return false;
    }
    if (filter === 'win')  return (g.result === '1-0' && g.white === 'You') || (g.result === '0-1' && g.black === 'You');
    if (filter === 'loss') return (g.result === '0-1' && g.white === 'You') || (g.result === '1-0' && g.black === 'You');
    if (filter === 'draw') return g.result === '½-½';
    return true;
  });

  const chips = [
    { key: 'all',  label: 'All' },
    { key: 'win',  label: 'Won' },
    { key: 'loss', label: 'Lost' },
    { key: 'draw', label: 'Draw' },
  ];

  return (
    <div style={{
      paddingTop: 56, paddingBottom: 110,
      background: 'var(--bg)', minHeight: '100%', color: 'var(--fg)',
    }}>
      {/* Delete confirmation */}
      {confirmDelete && (
        <ActionSheet
          title="Delete this game?"
          body="The game and its score sheet will be permanently removed."
          actions={[
            { label: deleting ? 'Deleting…' : 'Delete game', danger: true, onClick: () => handleDeleteGame(confirmDelete.id, confirmDelete._backendId) },
          ]}
          onDismiss={() => setConfirmDelete(null)}
        />
      )}

      <div style={{ padding: '4px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackButton onClick={() => nav.back()} />
        <div style={{
          fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700,
          letterSpacing: -0.5, flex: 1,
        }}>All Games</div>
        <div onClick={() => nav.go('quick-add-game', {})} style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--fg)', flexShrink: 0,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '0 14px', height: 42,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--fg-3)', flexShrink: 0 }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search by player or opening…"
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--fg)', outline: 'none',
            }}
          />
          {q && <div onClick={() => setQ('')} style={{ color: 'var(--fg-3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</div>}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 20px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {chips.map(c => (
          <div key={c.key} onClick={() => setFilter(c.key)} style={{
            flexShrink: 0, padding: '5px 14px', borderRadius: 999,
            background: filter === c.key ? 'var(--ink)' : 'var(--surface)',
            border: '1px solid var(--border)',
            color: filter === c.key ? 'var(--paper)' : 'var(--fg-2)',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', letterSpacing: 0.3,
            transition: 'background 0.15s',
          }}>{c.label}</div>
        ))}
      </div>

      <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="♟"
            title="No games found"
            body={q || filter !== 'all' ? 'Try changing your search or filter.' : 'Scan a score sheet to get started.'}
            action={q || filter !== 'all' ? null : 'Scan now'}
            onAction={q || filter !== 'all' ? null : () => nav.go('scan')}
          />
        ) : (
          filtered.map(g => {
            const tName = g.tournament ? (TOURNAMENTS.find(t => t.id === g.tournament) || {}).name : null;
            return (
              <div key={g.id}>
                {tName && g.round && (
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                    letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600,
                    padding: '0 2px 5px',
                  }}>{tName} · Rd {g.round}</div>
                )}
                <SwipeableGameCard
                  game={g}
                  onTap={() => nav.go('replay', { id: g.id })}
                  onDelete={() => setConfirmDelete(g)}
                  onEdit={() => nav.go('edit-game', { game: g })}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Edit Game screen — fix OCR mistakes
// ──────────────────────────────────────────────────────────
function EditGameScreen({ nav, params }) {
  const game = params.game || GAMES.find(g => g.id === params.id);
  if (!game) return null;

  const RESULTS = [
    { v: '1-0',  label: 'White won (1–0)' },
    { v: '0-1',  label: 'Black won (0–1)' },
    { v: '½-½',  label: 'Draw (½–½)' },
    { v: '*',    label: 'Unknown / ongoing' },
  ];
  const RESULT_TO_BACKEND = { '1-0': 'white_won', '0-1': 'black_won', '½-½': 'draw', '*': 'unknown' };

  const [white, setWhite]   = React.useState(game.white || '');
  const [black, setBlack]   = React.useState(game.black || '');
  const [result, setResult] = React.useState(game.result || '*');
  const [date, setDate]     = React.useState(game.date || '');
  const [round, setRound]   = React.useState(String(game.round || ''));
  const [event, setEvent]   = React.useState(game.event || '');
  const [notes, setNotes]   = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError]   = React.useState(null);

  async function handleSave() {
    setSaving(true); setError(null);
    try {
      const updates = {
        white_player: white.trim() || null,
        black_player: black.trim() || null,
        result: RESULT_TO_BACKEND[result] || 'unknown',
        game_date: date || null,
        round: round.trim() || null,
        event: event.trim() || null,
        notes: notes.trim() || null,
      };
      if (game._backendId) {
        const updated = await apiUpdateGame(game._backendId, updates);
        // Patch local cache
        const idx = GAMES.findIndex(g => g.id === game.id);
        if (idx !== -1) {
          GAMES[idx] = { ...GAMES[idx],
            white: updated.white_player || white,
            black: updated.black_player || black,
            result: { white_won: '1-0', black_won: '0-1', draw: '½-½', unknown: '*' }[updated.result] || result,
            date: updated.game_date || date,
            round: updated.round || round,
            event: updated.event || event,
          };
        }
      } else {
        // Mock data — just patch in place
        const idx = GAMES.findIndex(g => g.id === game.id);
        if (idx !== -1) Object.assign(GAMES[idx], { white, black, result, date, round: parseInt(round) || null, event });
      }
      nav.back();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      paddingTop: 56, paddingBottom: 110,
      background: 'var(--bg)', minHeight: '100%', color: 'var(--fg)',
    }}>
      <div style={{ padding: '4px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackButton onClick={() => nav.back()} />
        <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, flex: 1 }}>Edit game</div>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <LiveFormField label="White player" placeholder="e.g. Kasparov" value={white} onChange={setWhite} />
        <LiveFormField label="Black player" placeholder="e.g. Karpov"   value={black} onChange={setBlack} />

        <div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
            textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600, marginBottom: 6,
          }}>Result</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {RESULTS.map(r => (
              <div key={r.v} onClick={() => setResult(r.v)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${result === r.v ? 'var(--ink)' : 'var(--border)'}`,
                background: result === r.v ? 'var(--surface-inv)' : 'var(--surface)',
                color: result === r.v ? 'var(--fg-inv)' : 'var(--fg)',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: `2px solid ${result === r.v ? 'var(--fg-inv)' : 'var(--border-strong)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {result === r.v && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--fg-inv)' }} />}
                </div>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 14 }}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <LiveFormField label="Date" placeholder="YYYY-MM-DD" value={date} onChange={setDate} flex />
          <LiveFormField label="Round" placeholder="e.g. 3" value={round} onChange={setRound} flex />
        </div>
        <LiveFormField label="Event / Tournament name" placeholder="e.g. City Open" value={event} onChange={setEvent} />
        <LiveFormField label="Notes" placeholder="Add a personal note…" value={notes} onChange={setNotes} />

        {error && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--loss)', padding: '4px 0' }}>
            {error}
          </div>
        )}
      </div>

      <div style={{
        position: 'absolute', bottom: 92, left: 0, right: 0,
        padding: '14px 20px 0',
        background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
      }}>
        <div onClick={saving ? undefined : handleSave} style={{
          height: 52, width: '100%', borderRadius: 14,
          background: saving ? 'var(--fg-3)' : 'var(--ink)',
          color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600,
          cursor: saving ? 'default' : 'pointer',
          opacity: saving ? 0.7 : 1,
          boxShadow: saving ? 'none' : 'var(--shadow-2)',
        }}>{saving ? 'Saving…' : 'Save changes'}</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Quick-add game screen (no score sheet required)
// ──────────────────────────────────────────────────────────
function QuickAddGameScreen({ nav, params }) {
  const tournamentId = params && params.tournamentId;
  const tournament = tournamentId ? TOURNAMENTS.find(t => t.id === tournamentId) : null;

  const RESULTS = [
    { v: '1-0',  label: 'White won (1–0)' },
    { v: '0-1',  label: 'Black won (0–1)' },
    { v: '½-½',  label: 'Draw (½–½)' },
    { v: '*',    label: 'Unknown / ongoing' },
  ];

  const [white, setWhite]   = React.useState('');
  const [black, setBlack]   = React.useState('');
  const [result, setResult] = React.useState('*');
  const [date, setDate]     = React.useState(new Date().toISOString().split('T')[0]);
  const [round, setRound]   = React.useState(params && params.round ? String(params.round) : '');
  const [event, setEvent]   = React.useState(tournament ? tournament.name : '');
  const [saving, setSaving] = React.useState(false);
  const [error, setError]   = React.useState(null);

  async function handleSave() {
    if (!white.trim() && !black.trim()) {
      setError('Enter at least one player name.'); return;
    }
    setSaving(true); setError(null);
    try {
      let savedGame;
      if (window.LIVE_DATA_LOADED) {
        // Try backend
        const raw = await apiCreateGameManual({
          white: white.trim() || 'Unknown',
          black: black.trim() || 'Unknown',
          result,
          date: date || null,
          round: round.trim() || null,
          event: event.trim() || null,
          tournamentId: tournamentId ? parseInt(tournamentId) : null,
        });
        savedGame = backendGameToFrontend(raw);
      } else {
        // Mock fallback
        savedGame = {
          id: 'm' + Date.now(),
          _backendId: null,
          white: white.trim() || 'Unknown',
          black: black.trim() || 'Unknown',
          result,
          date: date || new Date().toISOString().split('T')[0],
          eco: '—',
          moves: [],
          tournament: tournamentId || null,
          round: round ? parseInt(round) : null,
          event: event.trim() || null,
        };
      }
      GAMES.unshift(savedGame);
      nav.back();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      paddingTop: 56, paddingBottom: 110,
      background: 'var(--bg)', minHeight: '100%', color: 'var(--fg)',
    }}>
      <div style={{ padding: '4px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackButton onClick={() => nav.back()} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700 }}>Add game</div>
          {tournament && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)', letterSpacing: 0.4, marginTop: 1 }}>
              {tournament.name}
            </div>
          )}
        </div>
      </div>

      <div style={{
        margin: '14px 20px 0',
        background: 'rgba(255, 190, 60, 0.08)',
        border: '1px solid rgba(255, 190, 60, 0.25)',
        borderRadius: 10, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1.5L12.5 12H1.5L7 1.5z" stroke="#FFBE3C" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M7 5.5v3" stroke="#FFBE3C" strokeWidth="1.3" strokeLinecap="round"/>
          <circle cx="7" cy="10" r="0.6" fill="#FFBE3C"/>
        </svg>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.5 }}>
          No score sheet — moves won't be available for replay.
          To analyze the game, scan a score sheet instead.
        </div>
      </div>

      <div style={{ padding: '18px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <LiveFormField label="White player" placeholder="e.g. Kasparov" value={white} onChange={setWhite} />
        <LiveFormField label="Black player" placeholder="e.g. Karpov"   value={black} onChange={setBlack} />

        <div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
            textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600, marginBottom: 6,
          }}>Result</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {RESULTS.map(r => (
              <div key={r.v} onClick={() => setResult(r.v)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${result === r.v ? 'var(--ink)' : 'var(--border)'}`,
                background: result === r.v ? 'var(--surface-inv)' : 'var(--surface)',
                color: result === r.v ? 'var(--fg-inv)' : 'var(--fg)',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: `2px solid ${result === r.v ? 'var(--fg-inv)' : 'var(--border-strong)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {result === r.v && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--fg-inv)' }} />}
                </div>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 14 }}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <LiveFormField label="Date" placeholder="YYYY-MM-DD" value={date} onChange={setDate} flex />
          <LiveFormField label="Round" placeholder="e.g. 3" value={round} onChange={setRound} flex />
        </div>
        <LiveFormField label="Event" placeholder="e.g. City Open" value={event} onChange={setEvent} />

        {error && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--loss)' }}>{error}</div>
        )}
      </div>

      <div style={{
        position: 'absolute', bottom: 92, left: 0, right: 0,
        padding: '14px 20px 0',
        background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
      }}>
        <div onClick={saving ? undefined : handleSave} style={{
          height: 52, width: '100%', borderRadius: 14,
          background: saving ? 'var(--fg-3)' : 'var(--ink)',
          color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600,
          cursor: saving ? 'default' : 'pointer',
          opacity: saving ? 0.7 : 1,
          boxShadow: saving ? 'none' : 'var(--shadow-2)',
        }}>{saving ? 'Saving…' : 'Add game'}</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Edit Tournament screen
// ──────────────────────────────────────────────────────────
function EditTournamentScreen({ nav, params }) {
  const t = params.tournament || TOURNAMENTS.find(x => x.id === params.id);
  if (!t) return null;

  const [name, setName]           = React.useState(t.name || '');
  const [venue, setVenue]         = React.useState(t.venue || '');
  const [rounds, setRounds]       = React.useState(t.rounds ? String(t.rounds) : '');
  const [startDate, setStartDate] = React.useState(t.startDate || '');
  const [endDate, setEndDate]     = React.useState(t.endDate || '');
  const [color, setColor]         = React.useState(t.color || 'walnut');
  const [saving, setSaving]       = React.useState(false);
  const [error, setError]         = React.useState(null);

  const colorOptions = [
    { key: 'walnut', css: 'var(--walnut)' },
    { key: 'moss',   css: 'var(--moss)'   },
    { key: 'ink',    css: 'var(--ink)'    },
    { key: 'brick',  css: 'var(--brick)'  },
  ];

  async function handleSave() {
    if (!name.trim()) { setError('Tournament name is required.'); return; }
    setSaving(true); setError(null);
    try {
      const numRounds = rounds.trim() ? parseInt(rounds.trim()) : null;
      const updates = {
        name: name.trim(),
        location: venue.trim() || null,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date:   endDate   ? new Date(endDate).toISOString()   : null,
        num_rounds: numRounds,
        color: color || null,
      };
      if (t._backendId) {
        await apiUpdateTournament(t._backendId, updates);
      }
      // Patch local cache
      const idx = TOURNAMENTS.findIndex(x => x.id === t.id);
      if (idx !== -1) {
        Object.assign(TOURNAMENTS[idx], {
          name: name.trim(),
          venue: venue.trim(),
          rounds: numRounds,
          startDate: startDate || t.startDate,
          endDate:   endDate   || t.endDate,
          color,
        });
      }
      nav.back();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      paddingTop: 56, paddingBottom: 110,
      background: 'var(--bg)', minHeight: '100%', color: 'var(--fg)',
    }}>
      <div style={{ padding: '4px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackButton onClick={() => nav.back()} />
        <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700, flex: 1 }}>Edit tournament</div>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <LiveFormField label="Tournament name" placeholder="e.g. Bay Area Open" value={name} onChange={setName} />
        <LiveFormField label="Venue / Location" placeholder="e.g. Golden Gate Chess Club" value={venue} onChange={setVenue} />
        <div style={{ display: 'flex', gap: 10 }}>
          <LiveFormField label="Rounds" placeholder="e.g. 5" value={rounds} onChange={setRounds} flex />
          <LiveFormField label="Start date" placeholder="YYYY-MM-DD" value={startDate} onChange={setStartDate} flex />
        </div>
        <LiveFormField label="End date" placeholder="YYYY-MM-DD" value={endDate} onChange={setEndDate} />

        <div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
            textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600, marginBottom: 8,
          }}>Folder color</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {colorOptions.map(({ key, css }) => (
              <div key={key} onClick={() => setColor(key)} style={{
                flex: 1, height: 40, borderRadius: 10,
                border: color === key ? '3px solid var(--fg)' : '1px solid var(--border)',
                background: css,
                display: 'flex', alignItems: 'flex-end', padding: 5,
                color: '#fff', fontFamily: 'var(--mono)', fontSize: 9,
                textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
                fontWeight: 600,
                boxShadow: color === key ? 'var(--shadow-2)' : 'none',
              }}>{key}</div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--loss)', padding: '4px 0' }}>
            {error}
          </div>
        )}
      </div>

      <div style={{
        position: 'absolute', bottom: 92, left: 0, right: 0,
        padding: '14px 20px 0',
        background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
      }}>
        <div onClick={saving ? undefined : handleSave} style={{
          height: 52, width: '100%', borderRadius: 14,
          background: saving ? 'var(--fg-3)' : 'var(--ink)',
          color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600,
          cursor: saving ? 'default' : 'pointer',
          opacity: saving ? 0.7 : 1,
          boxShadow: saving ? 'none' : 'var(--shadow-2)',
        }}>{saving ? 'Saving…' : 'Save changes'}</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Action sheet (modal bottom sheet with destructive options)
// ──────────────────────────────────────────────────────────
function ActionSheet({ title, body, actions, onDismiss }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onDismiss}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        background: 'var(--surface)',
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px 36px',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
      }}>
        {title && (
          <div style={{
            fontFamily: 'var(--display)', fontSize: 17, fontWeight: 700,
            color: 'var(--fg)', marginBottom: body ? 6 : 16, letterSpacing: -0.2,
          }}>{title}</div>
        )}
        {body && (
          <div style={{
            fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--fg-2)',
            marginBottom: 18, lineHeight: 1.5,
          }}>{body}</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actions.map((a, i) => (
            <div key={i} onClick={a.onClick} style={{
              height: 50, borderRadius: 12,
              background: a.danger ? 'var(--loss)' : 'var(--ink)',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600,
              cursor: 'pointer',
            }}>{a.label}</div>
          ))}
          <div onClick={onDismiss} style={{
            height: 50, borderRadius: 12,
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600,
            color: 'var(--fg-2)', cursor: 'pointer',
          }}>Cancel</div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Empty state
// ──────────────────────────────────────────────────────────
function EmptyState({ icon, title, body, action, onAction }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 32px',
      color: 'var(--fg)',
    }}>
      <div style={{ fontSize: 40, marginBottom: 16, lineHeight: 1 }}>{icon}</div>
      <div style={{
        fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700,
        letterSpacing: -0.3, marginBottom: 8, textAlign: 'center',
      }}>{title}</div>
      <div style={{
        fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--fg-2)',
        textAlign: 'center', lineHeight: 1.5, maxWidth: 240, marginBottom: 20,
      }}>{body}</div>
      {action && onAction && (
        <div onClick={onAction} style={{
          padding: '10px 22px', borderRadius: 12,
          background: 'var(--ink)', color: 'var(--paper)',
          fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', boxShadow: 'var(--shadow-2)',
        }}>{action}</div>
      )}
    </div>
  );
}

Object.assign(window, {
  AppHeader, SectionLabel, TournamentCard, GameCard, ResultBadge, StatTile,
  HomeScreen, TournamentScreen, TournamentsListScreen, GamesListScreen,
  EditGameScreen, EditTournamentScreen, QuickAddGameScreen,
  SwipeableGameCard, SwipeableTournamentCard,
  ActionSheet, EmptyState,
  computeUserStats,
  formatDate, daysAgo, TODAY, parseLocal,
});
