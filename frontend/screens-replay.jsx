// screens-replay.jsx — interactive game replay (modern)

// ReplayScreen: loads game (lazily fetching moves if needed), then hands off to ReplayView
function ReplayScreen({ nav, params }) {
  const [game, setGame] = React.useState(
    params.game || GAMES.find(g => g.id === params.id) || null
  );
  const [loading, setLoading] = React.useState(
    !game || !game.moves || game.moves.length === 0
  );

  React.useEffect(() => {
    if (!loading) return;
    const id = params.id || (game && game.id);
    if (!id) { setLoading(false); return; }
    loadGameMoves(id).then(g => {
      if (g) setGame({ ...g });
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{
      position: 'absolute', inset: 0, background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg-3)',
        letterSpacing: 0.5, textTransform: 'uppercase',
      }}>Loading game…</div>
    </div>
  );
  if (!game) return (
    <div style={{
      position: 'absolute', inset: 0, background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 16, color: 'var(--loss)' }}>
        Game not found.
      </div>
    </div>
  );

  const safeMoves = (game.moves || []).filter(Boolean);
  return <ReplayView nav={nav} game={game} moves={safeMoves} />;
}

function ReplayView({ nav, game, moves }) {
  const { positions, lastMoves } = React.useMemo(() => computePositions(moves), [moves.length]);
  const totalPlies = positions.length;
  const [ply, setPly] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [speed] = React.useState(1.0);
  const [flipped, setFlipped] = React.useState(game.black === 'You');
  const moveListRef = React.useRef(null);

  React.useEffect(() => {
    if (!playing) return;
    if (ply >= totalPlies - 1) { setPlaying(false); return; }
    const id = setTimeout(() => setPly(p => Math.min(p + 1, totalPlies - 1)), 900 / speed);
    return () => clearTimeout(id);
  }, [playing, ply, totalPlies, speed]);

  React.useEffect(() => {
    if (!moveListRef.current) return;
    const el = moveListRef.current.querySelector('[data-current="true"]');
    if (el && moveListRef.current) {
      const target = el.offsetLeft - moveListRef.current.clientWidth / 2 + el.clientWidth / 2;
      moveListRef.current.scrollTo({ left: target, behavior: 'smooth' });
    }
  }, [ply]);

  const currentPosition = positions[ply];
  const currentMove = ply > 0 ? lastMoves[ply] : null;
  const youWhite = game.white === 'You';
  const perspective = youWhite ? 'w' : 'b';

  const tournamentName = game.tournament
    ? TOURNAMENTS.find(t => t.id === game.tournament).name + ' · Rd ' + game.round
    : 'Casual';

  return (
    <div style={{
      paddingTop: 54, paddingBottom: 0,
      background: 'var(--bg)', minHeight: '100%',
      display: 'flex', flexDirection: 'column', color: 'var(--fg)',
    }}>
      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 20px 0', gap: 12,
      }}>
        <BackButton onClick={() => nav.back()} />
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
          letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          flex: 1, textAlign: 'center', minWidth: 0,
        }}>{tournamentName}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <IconBtn onClick={() => setFlipped(f => !f)} title="Flip board">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 5l3-3 3 3M5 2v12M14 11l-3 3-3-3M11 14V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </IconBtn>
          <IconBtn>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v8M7 10l-3-3M7 10l3-3M2 11v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </IconBtn>
        </div>
      </div>

      {/* players + result */}
      <div style={{ padding: '14px 20px 8px' }}>
        <PlayerRow
          name={flipped ? game.white : game.black}
          rating={1654}
          youTag={flipped ? game.white === 'You' : game.black === 'You'}
          color={flipped ? 'w' : 'b'}
        />
        <ResultStrip game={game} perspective={perspective} />
        <PlayerRow
          name={flipped ? game.black : game.white}
          rating={USER.rating}
          youTag={flipped ? game.black === 'You' : game.white === 'You'}
          color={flipped ? 'b' : 'w'}
        />
      </div>

      {/* board */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        padding: '4px 20px 12px',
      }}>
        <div style={{
          padding: 4, borderRadius: 8,
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-2)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          <ChessBoard position={currentPosition} lastMove={currentMove} size={340} flipped={flipped} />
        </div>
      </div>

      {/* current move + comment */}
      <div style={{
        padding: '4px 20px 6px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        minHeight: 24,
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-3)',
          letterSpacing: 0.4, fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
          {ply === 0 ? 'STARTING POSITION' : `MOVE ${Math.ceil(ply / 2)}${ply % 2 === 1 ? '' : '…'}`}
        </div>
        {currentMove?.comment && (
          <div style={{
            fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
            color: 'var(--accent)', maxWidth: '60%', textAlign: 'right',
          }}>{currentMove.comment}</div>
        )}
      </div>

      {/* move chips */}
      <div ref={moveListRef} style={{
        display: 'flex', gap: 4, overflowX: 'auto',
        padding: '4px 16px 12px', scrollbarWidth: 'none',
      }}>
        {moves.map((m, i) => {
          const isWhite = i % 2 === 0;
          const moveNum = Math.floor(i / 2) + 1;
          const isCurrent = ply === i + 1;
          return (
            <div key={i} data-current={isCurrent} onClick={() => setPly(i + 1)} style={{
              flexShrink: 0, padding: '5px 9px', borderRadius: 7,
              border: '1px solid ' + (isCurrent ? 'transparent' : 'var(--border)'),
              background: isCurrent ? 'var(--ink)' : 'var(--surface)',
              color: isCurrent ? 'var(--paper)' : 'var(--fg)',
              fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'background 0.12s',
            }}>
              {isWhite && <span style={{
                fontSize: 9, opacity: 0.6,
                fontWeight: 500, letterSpacing: 0.2,
              }}>{moveNum}.</span>}
              <span>{m.san}</span>
            </div>
          );
        })}
      </div>

      {/* scrubber */}
      <div style={{ padding: '0 20px 8px' }}>
        <Scrubber value={ply} max={totalPlies - 1} onChange={setPly} />
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginTop: 4,
          fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
          letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
          <span>Start</span>
          <span style={{ color: 'var(--fg-2)' }}>{ply} / {totalPlies - 1}</span>
          <span>End</span>
        </div>
      </div>

      {/* transport */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px 34px',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <TransportBtn onClick={() => setPly(0)}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2v10M12 2L4 7l8 5V2z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" strokeLinejoin="round"/></svg>
        </TransportBtn>
        <TransportBtn onClick={() => setPly(p => Math.max(0, p - 1))}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M10 2L4 7l6 5V2z" fill="currentColor"/></svg>
        </TransportBtn>
        <div onClick={() => setPlaying(p => !p)} style={{
          width: 56, height: 56, borderRadius: 18,
          background: 'var(--ink)', color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: 'var(--shadow-2)',
        }}>
          {playing
            ? <svg width="14" height="16" viewBox="0 0 14 16"><rect x="1" y="1" width="4" height="14" rx="1" fill="currentColor"/><rect x="9" y="1" width="4" height="14" rx="1" fill="currentColor"/></svg>
            : <svg width="14" height="16" viewBox="0 0 14 16" style={{ marginLeft: 2 }}><path d="M2 1.5l11 6.5L2 14.5V1.5z" fill="currentColor"/></svg>
          }
        </div>
        <TransportBtn onClick={() => setPly(p => Math.min(totalPlies - 1, p + 1))}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M4 2l6 5-6 5V2z" fill="currentColor"/></svg>
        </TransportBtn>
        <TransportBtn onClick={() => setPly(totalPlies - 1)}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M12 2v10M2 2l8 5-8 5V2z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" strokeLinejoin="round"/></svg>
        </TransportBtn>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title }) {
  return (
    <div onClick={onClick} title={title} style={{
      width: 36, height: 36, borderRadius: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: 'var(--fg)',
      background: 'var(--surface)', border: '1px solid var(--border)',
    }}>{children}</div>
  );
}

function TransportBtn({ children, onClick }) {
  return (
    <div onClick={onClick} style={{
      width: 44, height: 44, borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: 'var(--fg)',
    }}>{children}</div>
  );
}

function PlayerRow({ name, rating, youTag, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 0', minWidth: 0,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: color === 'w' ? '#FFFFFF' : '#14151A',
        border: '1px solid var(--border-strong)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"DejaVu Sans", "Arial Unicode MS", sans-serif',
        fontSize: 18,
        color: color === 'w' ? '#14151A' : '#FFFFFF',
      }}>♚</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--display)', fontSize: 16, color: 'var(--fg)',
          fontWeight: 600, letterSpacing: -0.2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>{name}</span>
          {youTag && (
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
              padding: '1px 6px', borderRadius: 4,
              background: 'var(--ink)', color: 'var(--paper)',
              textTransform: 'uppercase', letterSpacing: 0.6, flexShrink: 0,
            }}>You</span>
          )}
        </div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-3)',
          marginTop: 1, letterSpacing: 0.3, fontWeight: 500,
        }}>{rating}</div>
      </div>
    </div>
  );
}

function ResultStrip({ game, perspective }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 0',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      margin: '4px 0',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
          letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>{game.eco?.split(' — ')[0]}</div>
        <div style={{
          fontFamily: 'var(--sans)', fontSize: 12,
          color: 'var(--fg-2)', marginTop: 1, fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{game.eco?.split(' — ')[1] || 'Opening'}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <ResultBadge result={game.result} perspective={perspective} />
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
          letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>{daysAgo(game.date)}</div>
      </div>
    </div>
  );
}

function Scrubber({ value, max, onChange }) {
  const ref = React.useRef(null);
  const handleDown = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onChange(Math.round(pct * max));
  };
  const handleMove = (e) => {
    if (e.buttons !== 1) return;
    handleDown(e);
  };
  const handleTouch = (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = ref.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    onChange(Math.round(pct * max));
  };
  const pct = max === 0 ? 0 : (value / max) * 100;
  return (
    <div ref={ref}
      onMouseDown={handleDown} onMouseMove={handleMove}
      onTouchStart={handleTouch} onTouchMove={handleTouch}
      style={{
        height: 28, display: 'flex', alignItems: 'center',
        position: 'relative', cursor: 'pointer', userSelect: 'none',
      }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2,
        background: 'var(--surface-2)',
      }} />
      <div style={{
        position: 'absolute', left: 0, height: 4, borderRadius: 2,
        width: pct + '%', background: 'var(--ink)',
      }} />
      {/* tick marks every 4 plies */}
      {Array.from({ length: Math.floor(max / 4) + 1 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: ((i * 4) / max) * 100 + '%',
          width: 1, height: 6,
          background: 'var(--fg-3)', opacity: 0.4,
          transform: 'translateX(-0.5px)', top: '50%', marginTop: 6,
        }} />
      ))}
      <div style={{
        position: 'absolute', left: pct + '%',
        width: 16, height: 16, borderRadius: '50%',
        background: 'var(--ink)', border: '3px solid var(--surface)',
        transform: 'translateX(-50%)',
        boxShadow: 'var(--shadow-2)',
      }} />
    </div>
  );
}

Object.assign(window, { ReplayScreen, PlayerRow, ResultStrip, Scrubber, TransportBtn, IconBtn });
