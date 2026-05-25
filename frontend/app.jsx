// app.jsx — main app shell, routing, tab bar, tweaks panel

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "light",
  "theme": "modern",
  "accent": "#739552",
  "userName": "Marcus Hale"
}/*EDITMODE-END*/;

// ──────────────────────────────────────────────────────────
// Palette system: theme x mode
// ──────────────────────────────────────────────────────────
const PALETTES = {
  'modern-light': {
    '--bg':           '#F5F4EF',
    '--surface':      '#FFFFFF',
    '--surface-2':    '#EDECE5',
    '--surface-inv':  '#14151A',
    '--fg':           '#14151A',
    '--fg-2':         'rgba(20,21,26,0.62)',
    '--fg-3':         'rgba(20,21,26,0.38)',
    '--fg-inv':       '#F5F4EF',
    '--border':       'rgba(20,21,26,0.10)',
    '--border-strong':'rgba(20,21,26,0.22)',
    '--paper':        '#FFFFFF',
    '--paper-bg':     '#F5F4EF',
    '--ink':          '#14151A',
    '--ink-2':        'rgba(20,21,26,0.62)',
    '--ink-3':        'rgba(20,21,26,0.38)',
    '--board-light':  '#EBECD0',
    '--board-dark':   '#739552',
    '--highlight':    'rgba(247, 223, 116, 0.85)',
    '--move-tint':    'rgba(247, 223, 76, 0.55)',
    '--win':          '#5D8E2F',
    '--loss':         '#B85648',
    '--draw':         '#8B8B86',
    '--walnut':       '#6B5840',
    '--moss':         '#5D8E2F',
    '--brick':        '#B85648',
    '--shadow-1':     '0 1px 2px rgba(20,21,26,0.04), 0 1px 0 rgba(20,21,26,0.02)',
    '--shadow-2':     '0 4px 12px rgba(20,21,26,0.06), 0 1px 2px rgba(20,21,26,0.04)',
    '--shadow-3':     '0 8px 28px rgba(20,21,26,0.10), 0 2px 4px rgba(20,21,26,0.04)',
  },
  'modern-dark': {
    '--bg':           '#14161A',
    '--surface':      '#1D2024',
    '--surface-2':    '#262A2F',
    '--surface-inv':  '#F0EFE9',
    '--fg':           '#F0EFE9',
    '--fg-2':         'rgba(240,239,233,0.70)',
    '--fg-3':         'rgba(240,239,233,0.40)',
    '--fg-inv':       '#14161A',
    '--border':       'rgba(240,239,233,0.10)',
    '--border-strong':'rgba(240,239,233,0.22)',
    '--paper':        '#1D2024',
    '--paper-bg':     '#14161A',
    '--ink':          '#F0EFE9',
    '--ink-2':        'rgba(240,239,233,0.70)',
    '--ink-3':        'rgba(240,239,233,0.40)',
    '--board-light':  '#EBECD0',
    '--board-dark':   '#739552',
    '--highlight':    'rgba(247, 223, 116, 0.85)',
    '--move-tint':    'rgba(247, 223, 76, 0.55)',
    '--win':          '#9BCB5E',
    '--loss':         '#E07A6B',
    '--draw':         '#8C8C88',
    '--walnut':       '#C4A574',
    '--moss':         '#9BCB5E',
    '--brick':        '#E07A6B',
    '--shadow-1':     '0 1px 2px rgba(0,0,0,0.20)',
    '--shadow-2':     '0 4px 14px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.18)',
    '--shadow-3':     '0 12px 32px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.2)',
  },
  'paper-light': {
    '--bg':           '#EBE4D3',
    '--surface':      '#F4EFE3',
    '--surface-2':    '#E3DAC3',
    '--surface-inv':  '#1A1612',
    '--fg':           '#1A1612',
    '--fg-2':         'rgba(26,22,18,0.65)',
    '--fg-3':         'rgba(26,22,18,0.4)',
    '--fg-inv':       '#F4EFE3',
    '--border':       'rgba(26,22,18,0.20)',
    '--border-strong':'rgba(26,22,18,0.85)',
    '--paper':        '#F4EFE3',
    '--paper-bg':     '#EBE4D3',
    '--ink':          '#1A1612',
    '--ink-2':        'rgba(26,22,18,0.65)',
    '--ink-3':        'rgba(26,22,18,0.4)',
    '--board-light':  '#E8DFC8',
    '--board-dark':   '#A89878',
    '--highlight':    '#F0DA9D',
    '--move-tint':    'rgba(229, 196, 75, 0.45)',
    '--win':          '#5D6E4A',
    '--loss':         '#9A4B36',
    '--draw':         '#8B8576',
    '--walnut':       '#6B5840',
    '--moss':         '#5D6E4A',
    '--brick':        '#9A4B36',
    '--shadow-1':     '0 1px 0 rgba(26,22,18,0.08)',
    '--shadow-2':     '3px 4px 0 -1px rgba(26,22,18,0.12)',
    '--shadow-3':     '4px 6px 0 -2px rgba(26,22,18,0.15)',
  },
  'paper-dark': {
    '--bg':           '#1A1A18',
    '--surface':      '#252320',
    '--surface-2':    '#332F2A',
    '--surface-inv':  '#F0EBDF',
    '--fg':           '#F0EBDF',
    '--fg-2':         'rgba(240,235,223,0.70)',
    '--fg-3':         'rgba(240,235,223,0.40)',
    '--fg-inv':       '#1A1A18',
    '--border':       'rgba(240,235,223,0.20)',
    '--border-strong':'rgba(240,235,223,0.85)',
    '--paper':        '#252320',
    '--paper-bg':     '#1A1A18',
    '--ink':          '#F0EBDF',
    '--ink-2':        'rgba(240,235,223,0.70)',
    '--ink-3':        'rgba(240,235,223,0.40)',
    '--board-light':  '#D4C5A4',
    '--board-dark':   '#7F6E4F',
    '--highlight':    '#E8C97A',
    '--move-tint':    'rgba(212, 156, 47, 0.5)',
    '--win':          '#A3B584',
    '--loss':         '#C97A5F',
    '--draw':         '#9C968A',
    '--walnut':       '#C4A574',
    '--moss':         '#A3B584',
    '--brick':        '#C97A5F',
    '--shadow-1':     '0 1px 2px rgba(0,0,0,0.3)',
    '--shadow-2':     '0 4px 14px rgba(0,0,0,0.45)',
    '--shadow-3':     '0 12px 32px rgba(0,0,0,0.55)',
  },
};

const TYPE_VARS = {
  modern: {
    '--display': '"Space Grotesk", -apple-system, sans-serif',
    '--sans':    '"Inter", "Space Grotesk", -apple-system, sans-serif',
    '--mono':    '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
    '--serif':   '"Space Grotesk", -apple-system, sans-serif', // alias
    '--script':  '"Geist Mono", ui-monospace, monospace',
    '--display-weight': '600',
    '--italic':  'normal',
  },
  paper: {
    '--display': '"Instrument Serif", "Times New Roman", serif',
    '--sans':    '"Geist", -apple-system, sans-serif',
    '--mono':    '"Geist Mono", ui-monospace, monospace',
    '--serif':   '"Instrument Serif", "Times New Roman", serif',
    '--script':  '"Caveat", "Bradley Hand", cursive',
    '--display-weight': '400',
    '--italic':  'italic',
  },
};

// ──────────────────────────────────────────────────────────
// Tab bar
// ──────────────────────────────────────────────────────────
function TabBar({ nav, current, userName }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 28, paddingTop: 10, paddingLeft: 16, paddingRight: 16,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 4,
      zIndex: 5,
    }}>
      <TabItem label="Games" active={current === 'home'} onClick={() => nav.reset()}
        icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M3 7h14M3 13h14M7 3v14M13 3v14" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        </svg>}
      />
      <TabItem label="Tourneys" active={current === 'tournament'} onClick={() => nav.go('tournament', { id: 't1' })}
        icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M5 3h10v2a4 4 0 01-4 4H9a4 4 0 01-4-4V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M3 4h2v1a3 3 0 003 3M17 4h-2v1a3 3 0 01-3 3M8 13h4M10 9v4M7 17h6M9 13v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>}
      />
      <div onClick={() => nav.go('scan')} style={{
        width: 54, height: 54, borderRadius: 16,
        background: 'var(--moss)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
        boxShadow: 'var(--shadow-2)',
        margin: '0 6px',
        transform: 'translateY(-6px)',
      }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M2 7V4a2 2 0 012-2h3M20 7V4a2 2 0 00-2-2h-3M2 15v3a2 2 0 002 2h3M20 15v3a2 2 0 01-2 2h-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M2 11h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <TabItem label="Stats"
        icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 17h14M5 14V8M9 14V4M13 14v-7M17 14v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>}
      />
      <TabItem label={userName.split(' ')[0]}
        icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>}
      />
    </div>
  );
}

function TabItem({ label, icon, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 4, padding: '6px 4px',
      color: active ? 'var(--ink)' : 'var(--ink-3)',
      cursor: 'pointer',
    }}>
      {icon}
      <div style={{
        fontFamily: 'var(--sans)',
        fontSize: 10, fontWeight: active ? 600 : 500,
        letterSpacing: 0.2,
      }}>{label}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// New tournament — stub
// ──────────────────────────────────────────────────────────
function NewTournamentScreen({ nav, onCreated }) {
  const [name, setName] = React.useState('');
  const [venue, setVenue] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  async function handleCreate() {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError(null);
    try {
      await apiCreateTournament({ name: name.trim(), location: venue.trim() || null, startDate: startDate || null });
      if (onCreated) await onCreated();
      nav.back();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      paddingTop: 56, paddingBottom: 120,
      background: 'var(--bg)', minHeight: '100%', color: 'var(--fg)',
    }}>
      <div style={{ padding: '8px 20px 0' }}>
        <BackButton onClick={() => nav.back()} />
      </div>
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{
          fontFamily: 'var(--display)', fontSize: 32, lineHeight: 1.05,
          color: 'var(--fg)', letterSpacing: -0.8, fontWeight: 'var(--display-weight)',
        }}>New tournament</div>
        <div style={{
          fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--fg-2)',
          marginTop: 6, lineHeight: 1.4,
        }}>Group games under one tournament. Add games by scanning score sheets later.</div>
      </div>
      <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <LiveFormField label="Name" placeholder="e.g. Northside Classic" value={name} onChange={setName} />
        <LiveFormField label="Venue" placeholder="e.g. Northside Library" value={venue} onChange={setVenue} />
        <div style={{ display: 'flex', gap: 10 }}>
          <FormField label="Rounds" placeholder="5" flex />
          <LiveFormField label="Start date" placeholder="2025-05-01" value={startDate} onChange={setStartDate} flex />
        </div>
        <FormField label="Time control" placeholder="G/90 +30" />
        <SectionLabel>Folder color</SectionLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['walnut','var(--walnut)'],['moss','var(--moss)'],['ink','var(--ink)'],['brick','var(--brick)']].map(([n,c]) => (
            <div key={n} style={{
              flex: 1, height: 44, borderRadius: 10,
              border: '1px solid var(--border)', background: c,
              display: 'flex', alignItems: 'flex-end', padding: 6,
              color: '#fff', fontFamily: 'var(--mono)', fontSize: 9,
              textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
              fontWeight: 600,
            }}>{n}</div>
          ))}
        </div>
        {error && (
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--loss)',
            padding: '4px 0',
          }}>{error}</div>
        )}
      </div>
      <div style={{
        position: 'absolute', bottom: 92, left: 0, right: 0,
        padding: '14px 20px 0',
        background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
      }}>
        <div onClick={saving ? undefined : handleCreate} style={{
          height: 52, width: '100%',
          borderRadius: 14,
          background: saving ? 'var(--fg-3)' : 'var(--ink)',
          color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600,
          cursor: saving ? 'default' : 'pointer',
          opacity: saving ? 0.7 : 1,
          boxShadow: saving ? 'none' : 'var(--shadow-2)',
        }}>{saving ? 'Creating…' : 'Create tournament'}</div>
      </div>
    </div>
  );
}

/** Editable input field matching the design system */
function LiveFormField({ label, placeholder, value, onChange, flex }) {
  return (
    <div style={{ flex: flex ? 1 : undefined }}>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
        textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600,
      }}>{label}</div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          marginTop: 5, height: 44, width: '100%',
          borderRadius: 10, border: '1px solid var(--border)',
          background: 'var(--surface)',
          padding: '0 14px', boxSizing: 'border-box',
          fontFamily: 'var(--sans)', fontSize: 14,
          color: 'var(--fg)', outline: 'none',
        }}
      />
    </div>
  );
}

function FormField({ label, placeholder, flex }) {
  return (
    <div style={{ flex: flex ? 1 : undefined }}>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
        textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600,
      }}>{label}</div>
      <div style={{
        marginTop: 5, height: 44,
        borderRadius: 10,
        border: '1px solid var(--border)', background: 'var(--surface)',
        display: 'flex', alignItems: 'center', padding: '0 14px',
        fontFamily: 'var(--sans)', fontSize: 14,
        color: 'var(--fg-3)',
      }}>{placeholder}</div>
    </div>
  );
}

// Reusable back button — uses chevron, not arrow
function BackButton({ onClick }) {
  return (
    <div onClick={onClick} style={{
      width: 36, height: 36, borderRadius: 10,
      background: 'var(--surface)', border: '1px solid var(--border)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: 'var(--fg)',
      boxShadow: 'var(--shadow-1)',
    }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Root
// ──────────────────────────────────────────────────────────
function Root() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [stack, setStack] = React.useState([{ screen: 'home', params: {} }]);
  const [dataVersion, setDataVersion] = React.useState(0);

  const nav = React.useMemo(() => ({
    go: (screen, params = {}) => setStack(s => [...s, { screen, params }]),
    back: () => setStack(s => s.length > 1 ? s.slice(0, -1) : s),
    reset: () => setStack([{ screen: 'home', params: {} }]),
    toggleMode: () => setTweak('mode', t.mode === 'light' ? 'dark' : 'light'),
  }), [t.mode]);

  // Boot: load real data from backend, fall back gracefully to mock data
  React.useEffect(() => {
    loadLiveData().then(() => setDataVersion(v => v + 1));
  }, []);

  async function refreshData() {
    await loadLiveData();
    setDataVersion(v => v + 1);
  }

  const today = new Date().toISOString().split('T')[0];
  const liveUser = { ...USER, name: t.userName };
  const cur = stack[stack.length - 1];

  const paletteKey = `${t.theme}-${t.mode}`;
  const palette = PALETTES[paletteKey] || PALETTES['modern-light'];
  const typeVars = TYPE_VARS[t.theme] || TYPE_VARS.modern;
  const theme = { ...palette, ...typeVars };

  let content;
  if (cur.screen === 'home')
    content = <HomeScreen key={dataVersion} nav={nav} today={today} user={liveUser} mode={t.mode} />;
  else if (cur.screen === 'tournament')
    content = <TournamentScreen key={dataVersion} nav={nav} params={cur.params} />;
  else if (cur.screen === 'scan')
    content = (
      <ScanScreen
        nav={nav}
        tournamentId={cur.params && cur.params.tournamentId}
        onGameSaved={refreshData}
      />
    );
  else if (cur.screen === 'replay')
    content = <ReplayScreen nav={nav} params={cur.params} />;
  else if (cur.screen === 'new-tournament')
    content = <NewTournamentScreen nav={nav} onCreated={refreshData} />;
  else
    content = <HomeScreen key={dataVersion} nav={nav} today={today} user={liveUser} mode={t.mode} />;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: t.mode === 'dark' ? '#08090C' : '#1c1f1a',
      padding: 20, boxSizing: 'border-box', overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: t.mode === 'dark'
          ? 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)'
          : 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
        pointerEvents: 'none',
      }} />

      <div style={theme}>
        <IOSDevice width={402} height={874} dark={t.mode === 'dark'}>
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            background: 'var(--bg)',
            color: 'var(--fg)',
            overflow: 'hidden',
          }}>
            {content}
            {cur.screen !== 'scan' && cur.screen !== 'replay' && <TabBar nav={nav} current={cur.screen} userName={liveUser.name} />}
          </div>
        </IOSDevice>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Appearance">
          <TweakRadio label="Mode" value={t.mode}
            options={['light', 'dark']}
            onChange={(v) => setTweak('mode', v)} />
          <TweakRadio label="Theme" value={t.theme}
            options={['modern', 'paper']}
            onChange={(v) => setTweak('theme', v)} />
        </TweakSection>
        <TweakSection label="Account">
          <TweakText label="Display name" value={t.userName}
            onChange={(v) => setTweak('userName', v)} />
        </TweakSection>
        <TweakSection label="Jump to screen">
          <TweakButton label="Home" onClick={() => setStack([{ screen: 'home', params: {} }])} />
          <TweakButton label="Tournament: Bayfront Open" onClick={() => setStack([{ screen: 'tournament', params: { id: 't1' } }])} />
          <TweakButton label="Scan score sheet" onClick={() => setStack([{ screen: 'scan', params: {} }])} />
          <TweakButton label="Replay: Opera Game" onClick={() => setStack([{ screen: 'replay', params: { id: 'g1' } }])} />
          <TweakButton label="New tournament" onClick={() => setStack([{ screen: 'new-tournament', params: {} }])} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
