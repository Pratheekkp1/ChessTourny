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
  const [speed, setSpeed] = React.useState(1.0);
  const [flipped, setFlipped] = React.useState(game.black === 'You');
  const [showExportSheet, setShowExportSheet] = React.useState(false);
  const [exportLoading, setExportLoading] = React.useState(false);
  const [exportToast, setExportToast] = React.useState(null);
  const [showImageOverlay, setShowImageOverlay] = React.useState(false);
  const moveListRef = React.useRef(null);

  // Swipe-to-navigate on the board
  const swipeRef = React.useRef(null);
  const swipeStart = React.useRef(null);

  const handleBoardPointerDown = (e) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const handleBoardPointerUp = (e) => {
    if (!swipeStart.current) return;
    const dx = e.clientX - swipeStart.current.x;
    const dy = e.clientY - swipeStart.current.y;
    swipeStart.current = null;
    // Only register as swipe if horizontal motion dominates
    if (Math.abs(dx) < 24 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0) {
      // Swipe left → next ply
      setPly(p => Math.min(totalPlies - 1, p + 1));
    } else {
      // Swipe right → prev ply
      setPly(p => Math.max(0, p - 1));
    }
  };

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

  // Keyboard navigation
  React.useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') setPly(p => Math.min(totalPlies - 1, p + 1));
      if (e.key === 'ArrowLeft')  setPly(p => Math.max(0, p - 1));
      if (e.key === 'ArrowUp')    setPly(0);
      if (e.key === 'ArrowDown')  setPly(totalPlies - 1);
      if (e.key === ' ')          setPlaying(p => !p);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [totalPlies]);

  const showToast = (msg, ok = true) => {
    setExportToast({ msg, ok });
    setTimeout(() => setExportToast(null), 2800);
  };

  const handleCopyPGN = async () => {
    setShowExportSheet(false);
    setExportLoading(true);
    try {
      let text;
      if (game._backendId) {
        text = await apiGetGamePGN(game._backendId);
      } else {
        // Build a minimal PGN from move san strings
        const pairs = [];
        for (let i = 0; i < moves.length; i += 2) {
          const num = Math.floor(i / 2) + 1;
          const w = moves[i]?.san || '';
          const b = moves[i + 1]?.san || '';
          pairs.push(`${num}. ${w}${b ? ' ' + b : ''}`);
        }
        text = `[White "${game.white}"]\n[Black "${game.black}"]\n[Result "${game.result}"]\n\n${pairs.join(' ')} ${game.result}`;
      }
      await navigator.clipboard.writeText(text);
      showToast('PGN copied to clipboard');
    } catch (e) {
      showToast('Failed to copy PGN', false);
    } finally {
      setExportLoading(false);
    }
  };

  const handleViewScoreSheet = () => {
    setShowExportSheet(false);
    if (!game._backendId || !game.hasImage) {
      showToast('No score sheet image for this game', false);
      return;
    }
    setShowImageOverlay(true);
  };

  const currentPosition = positions[ply];
  const currentMove = ply > 0 ? lastMoves[ply] : null;
  const youWhite = game.white === 'You';
  const perspective = youWhite ? 'w' : 'b';

  const tournT = game.tournament
    ? TOURNAMENTS.find(t => t.id === game.tournament)
    : null;
  const tournamentName = tournT
    ? tournT.name + (game.round ? ' · Rd ' + game.round : '')
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
          <IconBtn onClick={() => setShowExportSheet(true)} title="Share / export">
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

      {/* board — swipeable, with evaluation bar */}
      <div
        ref={swipeRef}
        onPointerDown={handleBoardPointerDown}
        onPointerUp={handleBoardPointerUp}
        style={{
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          padding: '4px 20px 12px',
          touchAction: 'pan-y',
          userSelect: 'none',
          gap: 10,
        }}
      >
        {/* Evaluation bar (left of board) */}
        <EvalBar position={currentPosition} flipped={flipped} height={348} />

        <div style={{
          padding: 4, borderRadius: 8,
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-2)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          <ChessBoard position={currentPosition} lastMove={currentMove} size={320} flipped={flipped} />
        </div>
      </div>

      {/* swipe hint */}
      {ply === 0 && moves.length > 0 && (
        <div style={{
          textAlign: 'center',
          fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
          letterSpacing: 0.6, textTransform: 'uppercase', marginTop: -6, marginBottom: 4,
          opacity: 0.7,
        }}>← swipe to navigate →</div>
      )}

      {/* current move + comment */}
      <div style={{
        padding: '4px 20px 6px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        minHeight: 24,
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-3)',
          letterSpacing: 0.4, fontWeight: 600,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: '55%',
        }}>
          {ply === 0
            ? (game.eco && game.eco !== '—' ? game.eco.split(' — ').pop() : 'Starting position')
            : `Move ${Math.ceil(ply / 2)}${ply % 2 === 1 ? '' : '…'}`}
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

      {/* User note (from edit-game screen) */}
      {game.note && (() => {
        const userNote = game.note.split('\n').find(w => w.startsWith('[user note]'));
        const text = userNote ? userNote.replace('[user note]', '').trim() : null;
        return text ? (
          <div style={{
            margin: '0 20px 8px',
            background: 'var(--surface-2)', borderRadius: 10,
            border: '1px solid var(--border)',
            padding: '8px 12px',
            fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--fg-2)',
            lineHeight: 1.5,
          }}>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
              textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginRight: 8,
            }}>Note</span>
            {text}
          </div>
        ) : null;
      })()}

      {/* transport */}
      <div style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        paddingBottom: 34,
      }}>
        {/* Speed control row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, padding: '10px 24px 2px',
        }}>
          {[0.5, 1.0, 1.5, 2.0].map(s => (
            <div key={s} onClick={() => setSpeed(s)} style={{
              padding: '4px 10px', borderRadius: 8,
              background: speed === s ? 'var(--ink)' : 'var(--surface-2)',
              border: '1px solid ' + (speed === s ? 'transparent' : 'var(--border)'),
              color: speed === s ? 'var(--paper)' : 'var(--fg-3)',
              fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 0.3,
              transition: 'all 0.12s',
            }}>{s === 1 ? '1×' : s + '×'}</div>
          ))}
        </div>

        {/* Transport buttons */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 24px 0',
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

      {/* export action sheet */}
      {showExportSheet && (
        <div
          onClick={() => setShowExportSheet(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', borderRadius: '20px 20px 0 0',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              padding: '16px 0 40px',
            }}
          >
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: 'var(--border-strong)',
              margin: '0 auto 20px',
            }} />
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
              textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700,
              textAlign: 'center', marginBottom: 16,
            }}>Game Options</div>
            {[
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 6h8M5 9h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
                label: 'Copy PGN',
                sub: 'Copy game notation to clipboard',
                action: handleCopyPGN,
              },
              ...(game._backendId && game.hasImage ? [{
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 6h8M5 9h6M5 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                    <circle cx="13" cy="13" r="4" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M11 13l1.5 1.5L15 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                ),
                label: 'View Score Sheet',
                sub: 'See the original handwritten notation',
                action: handleViewScoreSheet,
              }] : []),
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 3v9M9 12l-3-3M9 12l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M3 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
                label: 'Download PGN',
                sub: 'Save PGN file to device',
                action: async () => {
                  setShowExportSheet(false);
                  setExportLoading(true);
                  try {
                    let text;
                    if (game._backendId) {
                      text = await apiGetGamePGN(game._backendId);
                    } else {
                      const pairs = [];
                      for (let i = 0; i < moves.length; i += 2) {
                        const num = Math.floor(i / 2) + 1;
                        const w = moves[i]?.san || '';
                        const b = moves[i + 1]?.san || '';
                        pairs.push(`${num}. ${w}${b ? ' ' + b : ''}`);
                      }
                      text = `[White "${game.white}"]\n[Black "${game.black}"]\n[Result "${game.result}"]\n\n${pairs.join(' ')} ${game.result}`;
                    }
                    const blob = new Blob([text], { type: 'application/x-chess-pgn' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${game.white}_vs_${game.black}.pgn`.replace(/\s+/g, '_');
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('PGN downloaded');
                  } catch (e) {
                    showToast('Download failed', false);
                  } finally {
                    setExportLoading(false);
                  }
                },
              },
            ].map((item, idx) => (
              <div key={idx} onClick={item.action} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 24px', cursor: 'pointer',
                borderBottom: idx < 2 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--fg-2)', flexShrink: 0,
                }}>{item.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--sans)', fontSize: 16, fontWeight: 600,
                    color: 'var(--fg)',
                  }}>{item.label}</div>
                  <div style={{
                    fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--fg-3)',
                    marginTop: 2,
                  }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* score sheet image overlay */}
      {showImageOverlay && game._backendId && (
        <div
          onClick={() => setShowImageOverlay(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'flex-start',
          }}
        >
          {/* header bar */}
          <div style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '54px 20px 16px',
          }}>
            <div style={{
              fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600,
              color: '#fff',
            }}>Score Sheet</div>
            <div
              onClick={() => setShowImageOverlay(false)}
              style={{
                width: 32, height: 32, borderRadius: 16,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          {/* image */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1, width: '100%', overflow: 'auto',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              padding: '0 12px 40px',
            }}
          >
            <img
              src={apiGetGameImageUrl(game._backendId)}
              alt="Score sheet"
              style={{
                maxWidth: '100%', borderRadius: 12,
                boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                showToast('Score sheet image not available', false);
                setShowImageOverlay(false);
              }}
            />
          </div>
        </div>
      )}

      {/* toast */}
      {exportToast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%',
          transform: 'translateX(-50%)',
          background: exportToast.ok ? 'var(--ink)' : 'var(--loss)',
          color: 'var(--paper)',
          borderRadius: 12, padding: '10px 20px',
          fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
          zIndex: 500, whiteSpace: 'nowrap',
          boxShadow: 'var(--shadow-2)',
          animation: 'fadeInUp 0.2s ease',
        }}>{exportToast.msg}</div>
      )}

      {/* export loading indicator */}
      {exportLoading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 450,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.2)',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg-3)',
            letterSpacing: 0.5, textTransform: 'uppercase',
            background: 'var(--surface)', padding: '14px 24px', borderRadius: 12,
            border: '1px solid var(--border)',
          }}>Exporting…</div>
        </div>
      )}
    </div>
  );
}

// ── Material-based evaluation bar ────────────────────────────────────────────
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function materialBalance(position) {
  let score = 0;
  for (const row of position) {
    for (const p of row) {
      if (!p) continue;
      const val = PIECE_VALUES[p.toLowerCase()] || 0;
      score += p === p.toUpperCase() ? val : -val; // white positive, black negative
    }
  }
  return score; // clamped display range ±15
}

function EvalBar({ position, flipped, height }) {
  const raw = materialBalance(position);
  const clamped = Math.max(-15, Math.min(15, raw));
  // pct = white's portion of the bar (50% = equal, 100% = white up 15+)
  const whitePct = ((clamped + 15) / 30) * 100;
  const whiteTop = flipped ? whitePct : (100 - whitePct); // top of bar = "top side" player

  return (
    <div style={{
      width: 12, height: height, borderRadius: 6,
      background: 'var(--border)', overflow: 'hidden',
      flexShrink: 0, alignSelf: 'stretch',
      position: 'relative',
    }}>
      {/* Black portion (top) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: `${100 - whitePct}%`,
        background: '#14151A',
        transition: 'height 0.4s ease',
        borderRadius: raw > 0 ? '6px 6px 0 0' : 6,
      }} />
      {/* White portion (bottom) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: `${whitePct}%`,
        background: '#FFFFFF',
        transition: 'height 0.4s ease',
        borderRadius: raw < 0 ? '0 0 6px 6px' : 6,
      }} />
      {/* Score label */}
      {Math.abs(raw) >= 1 && (
        <div style={{
          position: 'absolute',
          top: raw < 0 ? 4 : undefined,
          bottom: raw >= 0 ? 4 : undefined,
          left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700,
          color: raw < 0 ? '#fff' : '#14151A',
          letterSpacing: 0,
          writingMode: 'vertical-rl',
        }}>{raw > 0 ? '+' : ''}{raw}</div>
      )}
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

Object.assign(window, { ReplayScreen, PlayerRow, ResultStrip, Scrubber, TransportBtn, IconBtn, EvalBar });
