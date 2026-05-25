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
          <span>{game.eco?.split(' — ')[0]}</span>
          <span style={{ color: 'var(--fg-3)' }}>·</span>
          <span>{moveCount} moves</span>
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
// Home screen
// ──────────────────────────────────────────────────────────
function HomeScreen({ nav, today, user, mode }) {
  const tournaments = TOURNAMENTS;
  const recentGames = GAMES.slice(0, 4);

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
        <StatTile value="14" label="Games / month" />
        <StatTile value="8–4–2" label="W–L–D" />
        <StatTile value="74%" label="Accuracy" accent="var(--win)" />
      </div>

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
            flexShrink: 0, width: 96,
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

      <div style={{ marginTop: 4 }}>
        <SectionLabel action="View all">Recent games</SectionLabel>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          padding: '0 20px',
        }}>
          {recentGames.map(g => (
            <GameCard key={g.id} game={g} onTap={() => nav.go('replay', { id: g.id })} />
          ))}
        </div>
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
  if (!t) return null;

  const rounds = Array.from({ length: t.rounds }, (_, i) => i + 1);
  const gamesByRound = {};
  games.forEach(g => { if (g.round) gamesByRound[g.round] = g; });

  const colorMap = {
    walnut: 'var(--walnut)',
    moss:   'var(--moss)',
    ink:    'var(--ink)',
    brick:  'var(--brick)',
  };
  const accent = colorMap[t.color] || 'var(--walnut)';

  return (
    <div style={{
      paddingTop: 56, paddingBottom: 100,
      background: 'var(--bg)', minHeight: '100%', color: 'var(--fg)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 20px 0',
      }}>
        <BackButton onClick={() => nav.back()} />
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
          letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600,
        }}>Tournament</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          display: 'inline-block',
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
          padding: '3px 8px', borderRadius: 6,
          background: accent, color: '#fff',
          letterSpacing: 0.8, textTransform: 'uppercase',
          marginBottom: 10, whiteSpace: 'nowrap',
        }}>{t.place} place</div>
        <div style={{
          fontFamily: 'var(--display)', fontSize: 32, lineHeight: 1.05,
          color: 'var(--fg)', letterSpacing: -1, fontWeight: 700,
        }}>{t.name}</div>
        <div style={{
          fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--fg-2)',
          marginTop: 6,
        }}>{t.venue} · {formatDate(t.startDate)} – {formatDate(t.endDate)}</div>

        {/* stat tiles */}
        <div style={{
          display: 'flex', gap: 8, marginTop: 18,
        }}>
          <StatTile value={t.standing} label="Standing" />
          <StatTile value={t.games + '/' + t.rounds} label="Played" />
          <StatTile value="—" label="Perf rating" />
        </div>
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        <SectionLabel action={t.games + ' scanned'}>Rounds</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rounds.map(r => {
            const g = gamesByRound[r];
            return (
              <div key={r}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
                }}>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
                    textTransform: 'uppercase', letterSpacing: 0.8,
                    whiteSpace: 'nowrap', fontWeight: 600,
                  }}>Round {r}</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                {g
                  ? <GameCard game={g} onTap={() => nav.go('replay', { id: g.id })} />
                  : <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 14px',
                      border: '1px dashed var(--border-strong)',
                      borderRadius: 14,
                      color: 'var(--fg-3)',
                    }}>
                      <span style={{
                        fontFamily: 'var(--sans)', fontSize: 13,
                      }}>Not yet scanned</span>
                      <div onClick={() => nav.go('scan')} style={{
                        fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                        padding: '4px 10px', borderRadius: 6,
                        background: 'var(--ink)', color: 'var(--paper)',
                        letterSpacing: 0.6, textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}>Scan</div>
                    </div>
                }
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  AppHeader, SectionLabel, TournamentCard, GameCard, ResultBadge, StatTile,
  HomeScreen, TournamentScreen,
  formatDate, daysAgo, TODAY, parseLocal,
});
