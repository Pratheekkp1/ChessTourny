// screens-scan.jsx — score-sheet scanning flow (modern)

function ScoreSheetPaper({ moves, scannedThrough = -1, jitter = false }) {
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) pairs.push([moves[i], moves[i+1]]);
  return (
    <div style={{
      width: '100%', aspectRatio: '0.74',
      background: '#F8F5EE',
      borderRadius: 4,
      border: '1px solid rgba(20,21,26,0.15)',
      boxShadow: '0 12px 30px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.2)',
      position: 'relative', overflow: 'hidden',
      transform: jitter ? 'rotate(-1.5deg)' : 'none',
      transition: 'transform 0.6s',
      color: '#14151A',
    }}>
      <div style={{
        padding: '12px 14px 10px',
        borderBottom: '1px solid rgba(20,21,26,0.12)',
        display: 'flex', justifyContent: 'space-between',
        fontFamily: '"Geist Mono", ui-monospace, monospace',
      }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Bayfront Open · Rd 3</div>
          <div style={{ fontSize: 9, opacity: 0.7, marginTop: 4 }}>WHITE: M. Hale</div>
          <div style={{ fontSize: 9, opacity: 0.7 }}>BLACK: D. Halverson</div>
        </div>
        <div style={{ fontSize: 9, opacity: 0.7, letterSpacing: 0.4 }}>2026·05·22</div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '22px 1fr 1fr',
        fontFamily: '"Caveat", "Bradley Hand", "Marker Felt", cursive',
        fontSize: 13, fontWeight: 500,
        padding: '4px 10px 10px',
      }}>
        {pairs.map((pair, i) => {
          const moveIdx = i * 2;
          return (
            <React.Fragment key={i}>
              <div style={{
                fontFamily: '"Geist Mono", monospace', fontSize: 8, fontWeight: 600,
                color: 'rgba(20,21,26,0.5)',
                borderBottom: '0.5px solid rgba(20,21,26,0.15)',
                padding: '3px 0 1px',
              }}>{i+1}.</div>
              <div style={{
                color: moveIdx <= scannedThrough ? '#14151A' : 'rgba(20,21,26,0.75)',
                borderBottom: '0.5px solid rgba(20,21,26,0.15)',
                padding: '3px 4px 1px',
              }}>{pair[0]?.san}</div>
              <div style={{
                color: moveIdx + 1 <= scannedThrough ? '#14151A' : 'rgba(20,21,26,0.75)',
                borderBottom: '0.5px solid rgba(20,21,26,0.15)',
                padding: '3px 4px 1px',
              }}>{pair[1]?.san || ''}</div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ScanScreen({ nav, tournamentId, onGameSaved }) {
  // step: aim | capturing | reading | demo-reading | review | error
  const [step, setStep] = React.useState('aim');
  const [scannedThrough, setScannedThrough] = React.useState(-1);
  const [imageFile, setImageFile] = React.useState(null);
  const [apiGame, setApiGame] = React.useState(null);
  const [apiError, setApiError] = React.useState(null);
  const apiPromiseRef = React.useRef(null);

  // Real image selected → kick off API immediately, start capture animation
  function handleFileSelected(file) {
    if (!file) return;
    setImageFile(file);
    setApiGame(null);
    setApiError(null);
    apiPromiseRef.current = apiCreateGame(file, tournamentId != null ? tournamentId : undefined);
    setStep('capturing');
  }

  // Demo shutter (no real image) → use built-in OPERA animation
  function handleDemoCapture() {
    setImageFile(null);
    setApiGame(null);
    setStep('capturing');
  }

  // After capture flash → branch: real image uses API, demo uses animation
  function onCaptureDone() {
    setStep(imageFile ? 'reading' : 'demo-reading');
  }

  // Real reading: indeterminate progress while API resolves.
  // Progress asymptotically approaches 90 % so it never "completes" early —
  // the bar snaps to 100 % only when the server actually responds.
  React.useEffect(() => {
    if (step !== 'reading') return;
    let cancelled = false;
    let progress = 0;   // 0–100 virtual percentage

    // Tick every 250 ms: ease toward 90 % but never reach it
    const id = setInterval(() => {
      if (cancelled) return;
      progress = Math.min(90, progress + (90 - progress) * 0.04);
      setScannedThrough(Math.floor((progress / 100) * OPERA.length));
    }, 250);

    // Resolve immediately when the server responds (could be 5 s or 120 s)
    apiPromiseRef.current
      .then(result => {
        if (cancelled) return;
        clearInterval(id);
        setScannedThrough(OPERA.length - 1);   // snap to 100 %
        setApiGame(backendGameToFrontend(result));
        setTimeout(() => { if (!cancelled) setStep('review'); }, 350);
      })
      .catch(e => {
        if (cancelled) return;
        clearInterval(id);
        setApiError(e.message || 'OCR failed');
        setStep('error');
      });

    return () => { cancelled = true; clearInterval(id); };
  }, [step]);

  // Demo reading: animate through OPERA moves
  const [demoScanned, setDemoScanned] = React.useState(-1);
  React.useEffect(() => {
    if (step !== 'demo-reading') return;
    let i = -1;
    const id = setInterval(() => {
      i++;
      setDemoScanned(i);
      if (i >= OPERA.length - 1) {
        clearInterval(id);
        setTimeout(() => setStep('demo-review'), 600);
      }
    }, 110);
    return () => clearInterval(id);
  }, [step]);

  if (step === 'aim') return (
    <ScanAim nav={nav} tournamentId={tournamentId} onCapture={handleDemoCapture} onFileSelected={handleFileSelected} />
  );
  if (step === 'capturing') return <ScanCapturing onDone={onCaptureDone} />;
  if (step === 'reading') return <ScanReading moves={OPERA} scannedThrough={Math.floor(scannedThrough / 40 * OPERA.length)} label="Analyzing handwriting…" />;
  if (step === 'demo-reading') return <ScanReading moves={OPERA} scannedThrough={demoScanned} />;
  if (step === 'demo-review') return <ScanReview moves={OPERA} nav={nav} apiGame={null} onSaved={null} imageFile={null} />;
  if (step === 'review') return (
    <ScanReview
      moves={apiGame && apiGame.moves && apiGame.moves.length > 0 ? apiGame.moves.filter(Boolean) : OPERA}
      nav={nav}
      apiGame={apiGame}
      onSaved={onGameSaved}
      imageFile={imageFile}
    />
  );
  if (step === 'error') return (
    <ScanError error={apiError} nav={nav} tournamentId={tournamentId} onRetry={() => { setStep('aim'); setApiError(null); setImageFile(null); }} />
  );
  return null;
}

// ─── Camera permission bottom sheet ──────────────────────────────────────────
function CameraPermissionModal({ permState, onAllow, onDismiss }) {
  const isDenied     = permState === 'denied';
  const isRequesting = permState === 'requesting';
  const accentOk  = '#A8D88A';
  const accentErr = '#FF6B6B';
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        width: '100%',
        background: '#1C1D24',
        borderRadius: '24px 24px 0 0',
        padding: '28px 24px 44px',
        boxShadow: '0 -12px 48px rgba(0,0,0,0.7)',
      }}>
        {/* Icon bubble */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: isDenied ? 'rgba(255,107,107,0.12)' : 'rgba(168,216,138,0.12)',
            border: `1.5px solid ${isDenied ? 'rgba(255,107,107,0.4)' : 'rgba(168,216,138,0.4)'}`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isDenied ? (
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="11" stroke={accentErr} strokeWidth="2"/>
                <path d="M10 10l8 8M18 10l-8 8" stroke={accentErr} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="32" height="27" viewBox="0 0 32 27" fill="none">
                <rect x="2" y="7" width="28" height="18" rx="3.5" stroke={accentOk} strokeWidth="2"/>
                <circle cx="16" cy="16" r="5.5" stroke={accentOk} strokeWidth="2"/>
                <path d="M11 7l2.5-5h5l2.5 5" stroke={accentOk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="25.5" cy="11" r="1.5" fill={accentOk}/>
              </svg>
            )}
          </div>
        </div>

        <div style={{
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: 19, fontWeight: 700, letterSpacing: -0.3,
          color: '#fff', textAlign: 'center', marginBottom: 10,
        }}>
          {isDenied ? 'Camera Blocked' : '"ChessTourny" Would Like to\nAccess Your Camera'}
        </div>
        <div style={{
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: 14, color: 'rgba(255,255,255,0.55)',
          textAlign: 'center', lineHeight: 1.6,
          maxWidth: 290, margin: '0 auto 30px',
        }}>
          {isDenied
            ? 'Camera access was denied. Open your browser settings and allow camera access for this site, then try again.'
            : 'Used to photograph your handwritten score sheet so ChessTourny can read the moves automatically.'}
        </div>

        {isDenied ? (
          <div onClick={onDismiss} style={{
            height: 52, borderRadius: 14,
            background: 'rgba(255,255,255,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Space Grotesk", sans-serif', fontSize: 15, fontWeight: 600,
            color: '#fff', cursor: 'pointer',
          }}>OK</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              onClick={isRequesting ? undefined : onAllow}
              style={{
                height: 52, borderRadius: 14,
                background: isRequesting ? 'rgba(168,216,138,0.45)' : accentOk,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: '"Space Grotesk", sans-serif', fontSize: 15, fontWeight: 600,
                color: '#14151A',
                cursor: isRequesting ? 'default' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {isRequesting ? 'Requesting access…' : 'Allow Camera'}
            </div>
            <div onClick={onDismiss} style={{
              height: 52, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Space Grotesk", sans-serif', fontSize: 15, fontWeight: 600,
              color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
            }}>Don't Allow</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Scan aim screen ──────────────────────────────────────────────────────────
function ScanAim({ nav, tournamentId, onCapture, onFileSelected }) {
  const fileInputRef = React.useRef(null);
  const [showPermModal, setShowPermModal] = React.useState(false);
  const [permState, setPermState]         = React.useState('idle'); // idle | requesting | granted | denied

  function handleChange(e) {
    const f = e.target.files && e.target.files[0];
    if (f && onFileSelected) onFileSelected(f);
  }

  async function handleCameraPress() {
    // No camera API (plain desktop without webcam) → fall back to demo mode
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      onCapture(); return;
    }
    // If browser already granted permission, open camera immediately
    try {
      const perm = await navigator.permissions.query({ name: 'camera' });
      if (perm.state === 'granted') {
        fileInputRef.current && fileInputRef.current.click(); return;
      }
    } catch (_) { /* Permissions API unsupported — show prompt anyway */ }
    // Show the iOS-style permission bottom sheet
    setPermState('idle');
    setShowPermModal(true);
  }

  async function handleGrantCamera() {
    setPermState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(t => t.stop()); // only needed the permission grant
      setPermState('granted');
      setShowPermModal(false);
      setTimeout(() => fileInputRef.current && fileInputRef.current.click(), 100);
    } catch (_) {
      setPermState('denied');
    }
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#0A0B0E',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Hidden file input — capture=environment opens rear camera on mobile */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
        style={{ display: 'none' }} onChange={handleChange} />

      {/* Camera permission bottom sheet */}
      {showPermModal && (
        <CameraPermissionModal
          permState={permState}
          onAllow={handleGrantCamera}
          onDismiss={() => setShowPermModal(false)}
        />
      )}

      <div style={{
        position: 'absolute', top: 56, left: 0, right: 0, zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 16px',
      }}>
        <div onClick={() => nav.back()} style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M3 3l8 8M11 3l-8 8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{
          fontFamily: '"Space Grotesk", sans-serif', fontSize: 13, color: '#fff',
          letterSpacing: 0.2, fontWeight: 600, whiteSpace: 'nowrap',
        }}>Scan score sheet</div>
        <div style={{
          fontFamily: '"Geist Mono", monospace', fontSize: 9, color: 'rgba(255,255,255,0.7)',
          letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600,
          padding: '4px 8px', borderRadius: 6,
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(20px)',
        }}>AUTO</div>
      </div>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', padding: '110px 32px 0',
      }}>
        <CornerBrackets />
        <div style={{ width: '100%', maxWidth: 280, opacity: 0.95 }}>
          <ScoreSheetPaper moves={OPERA} jitter />
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        fontFamily: '"Space Grotesk", sans-serif', fontSize: 15, fontWeight: 500,
        color: 'rgba(255,255,255,0.95)',
        padding: '0 40px 20px',
      }}>
        Align the score sheet within the frame
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
          padding: '4px 12px', borderRadius: 999,
          background: 'rgba(140, 198, 119, 0.18)',
          border: '1px solid rgba(140, 198, 119, 0.4)',
          fontFamily: '"Geist Mono", monospace', fontSize: 10,
          color: '#A8D88A', letterSpacing: 0.6,
          textTransform: 'uppercase', fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#A8D88A' }} />
          Sheet detected
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 36px 16px',
      }}>
        {/* FILE — opens photo library directly (no camera permission needed) */}
        <div onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{
          width: 42, height: 42, borderRadius: 10,
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Geist Mono", monospace', fontSize: 9, color: '#fff',
          letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 700,
          cursor: 'pointer',
        }}>FILE</div>
        {/* Shutter — requests camera permission, then opens camera */}
        <div onClick={handleCameraPress} style={{
          width: 76, height: 76, borderRadius: '50%',
          border: '3px solid #fff', padding: 5,
          cursor: 'pointer',
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: '#fff',
            transition: 'transform 0.12s',
          }} />
        </div>
        {/* Camera icon — requests camera permission, then opens camera */}
        <div onClick={handleCameraPress} style={{
          width: 42, height: 42, borderRadius: 10,
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
            <rect x="2" y="3" width="16" height="11" rx="2" stroke="#fff" strokeWidth="1.5"/>
            <circle cx="10" cy="9" r="3" stroke="#fff" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>
      {/* Manual entry link */}
      <div onClick={() => nav.go('quick-add-game', { tournamentId })} style={{
        textAlign: 'center', paddingBottom: 40,
        fontFamily: '"Geist Mono", monospace', fontSize: 10,
        color: 'rgba(255,255,255,0.45)',
        letterSpacing: 0.6, textTransform: 'uppercase',
        fontWeight: 600, cursor: 'pointer',
        textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.2)',
      }}>Enter without scanning</div>
    </div>
  );
}

function CornerBrackets() {
  const c = { position: 'absolute', width: 26, height: 26, borderColor: '#A8D88A' };
  return (
    <>
      <div style={{ ...c, top: 100, left: 22, borderTop: '2px solid', borderLeft: '2px solid' }} />
      <div style={{ ...c, top: 100, right: 22, borderTop: '2px solid', borderRight: '2px solid' }} />
      <div style={{ ...c, bottom: 200, left: 22, borderBottom: '2px solid', borderLeft: '2px solid' }} />
      <div style={{ ...c, bottom: 200, right: 22, borderBottom: '2px solid', borderRight: '2px solid' }} />
    </>
  );
}

function ScanCapturing({ onDone }) {
  React.useEffect(() => {
    const id = setTimeout(onDone, 700);
    return () => clearTimeout(id);
  }, []);
  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#fff',
      animation: 'flashFade 0.7s forwards',
    }}>
      <style>{`@keyframes flashFade { 0% { opacity: 1; } 100% { opacity: 0; background: #0A0B0E; } }`}</style>
    </div>
  );
}

function ScanReading({ moves, scannedThrough, label }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#0A0B0E',
      display: 'flex', flexDirection: 'column',
      padding: '80px 32px 40px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{
          fontFamily: '"Space Grotesk", sans-serif', fontSize: 22,
          color: '#fff', fontWeight: 600, letterSpacing: -0.4,
        }}>{label || 'Reading moves'}</div>
        <div style={{
          fontFamily: '"Geist Mono", monospace', fontSize: 10, color: 'rgba(255,255,255,0.6)',
          letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 6, fontWeight: 600,
        }}>{scannedThrough + 1} / {moves.length} plies</div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <ScoreSheetPaper moves={moves} scannedThrough={scannedThrough} />
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #A8D88A, transparent)',
          boxShadow: '0 0 14px #A8D88A',
          top: `${Math.min(100, ((scannedThrough + 1) / moves.length) * 100)}%`,
          transition: 'top 0.1s linear',
        }} />
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{
          height: 5, background: 'rgba(255,255,255,0.10)', borderRadius: 3,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', background: '#A8D88A', borderRadius: 3,
            width: `${((scannedThrough + 1) / moves.length) * 100}%`,
            transition: 'width 0.1s linear',
            boxShadow: '0 0 12px #A8D88A',
          }} />
        </div>
      </div>
    </div>
  );
}

function ScanReview({ moves, nav, apiGame, onSaved, imageFile }) {
  const safeMoves = (moves || []).filter(Boolean);
  const positions = React.useMemo(() => computePositions(safeMoves).positions, [safeMoves.length]);
  const finalPos = positions[positions.length - 1];
  const [saving, setSaving] = React.useState(false);
  const [showImageOverlay, setShowImageOverlay] = React.useState(false);

  // Create a local object URL for the uploaded photo
  const imageUrl = React.useMemo(() => {
    if (!imageFile) return null;
    try { return URL.createObjectURL(imageFile); } catch (_) { return null; }
  }, [imageFile]);

  // Revoke the object URL when the component unmounts to avoid memory leaks
  React.useEffect(() => {
    return () => { if (imageUrl) URL.revokeObjectURL(imageUrl); };
  }, [imageUrl]);

  const isReal = !!apiGame;
  const whiteName  = isReal ? (apiGame.white || 'Unknown') : 'Marcus Hale';
  const blackName  = isReal ? (apiGame.black || 'Unknown') : 'D. Halverson';
  const resultStr  = isReal ? (apiGame.result || '?') : '1 – 0';
  const event      = isReal ? (apiGame.event || '—') : 'Bayfront Open · Rd 3';
  const gameDate   = isReal ? (apiGame.date || '—') : 'May 22, 2026';

  // Parse OCR warnings from the note field (newline-separated)
  const warnings = isReal && apiGame.note
    ? apiGame.note.split('\n').map(w => w.trim()).filter(Boolean)
    : [];
  // Separate user notes from OCR warnings
  const ocrWarnings = warnings.filter(w => !w.startsWith('[user note]'));

  async function handleSave() {
    if (!isReal) { nav.go('replay', { id: 'g1' }); return; }
    setSaving(true);
    if (onSaved) await onSaved();
    nav.go('replay', { id: apiGame.id, game: apiGame });
    setSaving(false);
  }

  return (
    <div style={{
      paddingTop: 54, paddingBottom: 110,
      background: 'var(--bg)', minHeight: '100%', color: 'var(--fg)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 20px 0',
      }}>
        <BackButton onClick={() => nav.back()} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 6,
          background: 'var(--surface)', border: '1px solid var(--border)',
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--win)',
          letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--win)' }} />
          {isReal ? `${safeMoves.length} plies` : '99% match'}
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          fontFamily: 'var(--display)', fontSize: 30, lineHeight: 1.05,
          color: 'var(--fg)', letterSpacing: -1, fontWeight: 700,
        }}>Game scanned</div>
        <div style={{
          fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--fg-2)', marginTop: 6,
        }}>{safeMoves.length} plies recognized. Tap any move to correct.</div>
      </div>

      {/* Score sheet thumbnail (only if real image was uploaded) */}
      {imageUrl && (
        <div
          onClick={() => setShowImageOverlay(true)}
          style={{
            margin: '14px 20px 0', borderRadius: 12, overflow: 'hidden',
            border: '1px solid var(--border)',
            position: 'relative', cursor: 'pointer',
            maxHeight: 120,
          }}
        >
          <img
            src={imageUrl}
            alt="Score sheet"
            style={{ width: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
          />
          {/* Overlay gradient + label */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)',
            display: 'flex', alignItems: 'flex-end',
            padding: '10px 14px',
          }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: '#fff',
              letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <rect x="1" y="2" width="10" height="7" rx="1.5" stroke="white" strokeWidth="1.3"/>
                <circle cx="6" cy="5.5" r="2" stroke="white" strokeWidth="1.3"/>
                <path d="M3.5 2L4.5 0.5h3L7.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              View score sheet
            </div>
          </div>
        </div>
      )}

      {/* OCR warnings */}
      {ocrWarnings.length > 0 && (
        <div style={{
          margin: '12px 20px 0',
          background: 'rgba(255, 190, 60, 0.08)',
          border: '1px solid rgba(255, 190, 60, 0.3)',
          borderRadius: 10, padding: '10px 14px',
        }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 9, color: '#FFBE3C',
            letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 700,
            marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1L9 9H1L5 1z" stroke="#FFBE3C" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M5 4v2.5" stroke="#FFBE3C" strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="5" cy="8" r="0.5" fill="#FFBE3C"/>
            </svg>
            OCR warnings ({ocrWarnings.length})
          </div>
          {ocrWarnings.slice(0, 3).map((w, i) => (
            <div key={i} style={{
              fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--fg-2)',
              lineHeight: 1.5, marginTop: i > 0 ? 4 : 0,
            }}>· {w}</div>
          ))}
          {ocrWarnings.length > 3 && (
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
              marginTop: 4,
            }}>+{ocrWarnings.length - 3} more</div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, padding: '14px 20px 0', alignItems: 'flex-start' }}>
        <div style={{
          flexShrink: 0, padding: 4, borderRadius: 8,
          background: 'var(--surface)', border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-1)',
        }}>
          <ChessBoard position={finalPos} size={imageUrl ? 100 : 128} showCoords={false} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Field label="White" value={whiteName} />
          <Field label="Black" value={blackName} />
          <Field label="Result" value={resultStr} />
          <Field label="Event" value={event} />
          <Field label="Date" value={gameDate} />
        </div>
      </div>

      <div style={{ padding: '22px 20px 0' }}>
        <SectionLabel action="Tap to edit">Moves</SectionLabel>
        <MoveGrid moves={safeMoves} />
      </div>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 20px 32px',
        background: 'linear-gradient(to top, var(--bg) 65%, transparent)',
        display: 'flex', gap: 10,
      }}>
        <div onClick={() => nav.back()} style={{
          flex: 1, height: 50, borderRadius: 14,
          border: '1px solid var(--border)', background: 'var(--surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
          color: 'var(--fg)', cursor: 'pointer',
        }}>Discard</div>
        <div onClick={saving ? undefined : handleSave} style={{
          flex: 2, height: 50, borderRadius: 14,
          background: saving ? 'var(--fg-3)' : 'var(--ink)',
          color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
          cursor: saving ? 'default' : 'pointer',
          opacity: saving ? 0.7 : 1,
          boxShadow: saving ? 'none' : 'var(--shadow-2)',
        }}>
          {saving ? 'Saving…' : 'Save & replay'}
          {!saving && <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>}
        </div>
      </div>

      {/* Full-screen score sheet image overlay */}
      {showImageOverlay && imageUrl && (
        <div
          onClick={() => setShowImageOverlay(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.94)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '54px 20px 16px',
          }}>
            <div style={{
              fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600, color: '#fff',
            }}>Score Sheet</div>
            <div
              onClick={() => setShowImageOverlay(false)}
              style={{
                width: 32, height: 32, borderRadius: 16,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1, overflow: 'auto', display: 'flex',
              alignItems: 'flex-start', justifyContent: 'center',
              padding: '0 12px 40px',
            }}
          >
            <img
              src={imageUrl}
              alt="Score sheet"
              style={{
                maxWidth: '100%', borderRadius: 12,
                boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{
      borderBottom: '1px solid var(--border)',
      padding: '7px 0',
    }}>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
        textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600,
      }}>{label}</div>
      <div style={{
        fontFamily: 'var(--display)', fontSize: 14, color: 'var(--fg)',
        marginTop: 2, fontWeight: 500,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{value}</div>
    </div>
  );
}

function MoveGrid({ moves, currentPly = -1, onTap }) {
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({ idx: i / 2 + 1, w: moves[i], b: moves[i+1], wPly: i, bPly: i+1 });
  }
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 12,
      border: '1px solid var(--border)',
      display: 'grid', gridTemplateColumns: '36px 1fr 1fr',
      fontFamily: 'var(--mono)', fontSize: 13, overflow: 'hidden',
    }}>
      {pairs.map((p, i) => (
        <React.Fragment key={i}>
          <div style={{
            padding: '8px 10px',
            borderRight: '1px solid var(--border)',
            borderBottom: i < pairs.length - 1 ? '1px solid var(--border)' : 'none',
            color: 'var(--fg-3)', textAlign: 'right',
            background: 'var(--surface-2)',
            fontWeight: 600, fontSize: 11,
          }}>{p.idx}</div>
          <div onClick={onTap ? () => onTap(p.wPly) : undefined} style={{
            padding: '8px 12px',
            borderRight: '1px solid var(--border)',
            borderBottom: i < pairs.length - 1 ? '1px solid var(--border)' : 'none',
            color: 'var(--fg)', fontWeight: 600,
            background: currentPly === p.wPly ? 'var(--highlight)' : 'transparent',
            cursor: onTap ? 'pointer' : 'default',
          }}>{p.w?.san}</div>
          <div onClick={onTap && p.b ? () => onTap(p.bPly) : undefined} style={{
            padding: '8px 12px',
            borderBottom: i < pairs.length - 1 ? '1px solid var(--border)' : 'none',
            color: 'var(--fg)', fontWeight: 500,
            background: currentPly === p.bPly ? 'var(--highlight)' : 'transparent',
            cursor: onTap && p.b ? 'pointer' : 'default',
          }}>{p.b?.san || ''}</div>
        </React.Fragment>
      ))}
    </div>
  );
}

function ScanError({ error, nav, onRetry, tournamentId }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 32px', color: 'var(--fg)',
    }}>
      <div style={{
        fontFamily: 'var(--display)', fontSize: 36, color: 'var(--loss)',
        fontWeight: 700, letterSpacing: -1, marginBottom: 12,
      }}>Hmm.</div>
      <div style={{
        fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--fg-2)',
        textAlign: 'center', marginBottom: 8, maxWidth: 280, lineHeight: 1.5,
      }}>Couldn't read the score sheet.</div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-3)',
        textAlign: 'center', marginBottom: 36, maxWidth: 300,
      }}>{error}</div>
      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 280 }}>
        <div onClick={() => nav.back()} style={{
          flex: 1, height: 48, borderRadius: 12,
          border: '1px solid var(--border)', background: 'var(--surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
          color: 'var(--fg)', cursor: 'pointer',
        }}>Cancel</div>
        <div onClick={onRetry} style={{
          flex: 1, height: 48, borderRadius: 12,
          background: 'var(--ink)', color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', boxShadow: 'var(--shadow-2)',
        }}>Try again</div>
      </div>
      <div
        onClick={() => nav.go('quick-add-game', { tournamentId })}
        style={{
          marginTop: 20,
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
          letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600,
          cursor: 'pointer', textDecoration: 'underline',
          textDecorationColor: 'var(--border-strong)',
        }}
      >Enter result manually instead</div>
    </div>
  );
}

Object.assign(window, {
  ScoreSheetPaper, ScanScreen, ScanAim, ScanCapturing,
  ScanReading, ScanReview, ScanError, Field, MoveGrid, CornerBrackets,
  CameraPermissionModal,
});
