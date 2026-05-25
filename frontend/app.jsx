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
      <TabItem label="Tourneys" active={current === 'tournaments'} onClick={() => nav.go('tournaments')}
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
      <TabItem label="Stats" active={current === 'stats'} onClick={() => nav.go('stats')}
        icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 17h14M5 14V8M9 14V4M13 14v-7M17 14v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>}
      />
      <TabItem label={userName.split(' ')[0]} active={current === 'profile'} onClick={() => nav.go('profile')}
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
  const [name, setName]         = React.useState('');
  const [venue, setVenue]       = React.useState('');
  const [rounds, setRounds]     = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate]   = React.useState('');
  const [color, setColor]       = React.useState('walnut');
  const [saving, setSaving]     = React.useState(false);
  const [error, setError]       = React.useState(null);

  async function handleCreate() {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError(null);
    try {
      const numRounds = rounds.trim() ? parseInt(rounds.trim()) : null;
      await apiCreateTournament({
        name: name.trim(),
        location: venue.trim() || null,
        startDate: startDate || null,
        endDate: endDate || null,
        numRounds: numRounds || null,
        color: color || null,
      });
      if (onCreated) await onCreated();
      nav.back();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const colorOptions = [
    { key: 'walnut', css: 'var(--walnut)' },
    { key: 'moss',   css: 'var(--moss)'   },
    { key: 'ink',    css: 'var(--ink)'    },
    { key: 'brick',  css: 'var(--brick)'  },
  ];

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
          <LiveFormField label="Rounds" placeholder="5" value={rounds} onChange={setRounds} flex />
          <LiveFormField label="Start date" placeholder="YYYY-MM-DD" value={startDate} onChange={setStartDate} flex />
        </div>
        <LiveFormField label="End date" placeholder="YYYY-MM-DD" value={endDate} onChange={setEndDate} />
        <SectionLabel>Folder color</SectionLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          {colorOptions.map(({ key, css }) => (
            <div key={key} onClick={() => setColor(key)} style={{
              flex: 1, height: 44, borderRadius: 10,
              border: color === key ? '3px solid var(--fg)' : '1px solid var(--border)',
              background: css,
              display: 'flex', alignItems: 'flex-end', padding: 6,
              color: '#fff', fontFamily: 'var(--mono)', fontSize: 9,
              textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer',
              fontWeight: 600,
              boxShadow: color === key ? 'var(--shadow-2)' : 'none',
            }}>{key}</div>
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
  else if (cur.screen === 'tournaments')
    content = <TournamentsListScreen key={dataVersion} nav={nav} />;
  else if (cur.screen === 'all-games')
    content = <GamesListScreen key={dataVersion} nav={nav} />;
  else if (cur.screen === 'edit-game')
    content = <EditGameScreen nav={nav} params={cur.params} />;
  else if (cur.screen === 'edit-tournament')
    content = <EditTournamentScreen nav={nav} params={cur.params} />;
  else if (cur.screen === 'quick-add-game')
    content = <QuickAddGameScreen nav={nav} params={cur.params} />;
  else if (cur.screen === 'stats')
    content = <StatsScreen key={dataVersion} nav={nav} user={liveUser} />;
  else if (cur.screen === 'profile')
    content = <ProfileScreen nav={nav} user={liveUser} t={t} setTweak={setTweak} />;
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
            {!['scan', 'replay', 'edit-game', 'edit-tournament', 'quick-add-game'].includes(cur.screen) && <TabBar nav={nav} current={cur.screen} userName={liveUser.name} />}
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
          <TweakButton label="All Tournaments" onClick={() => setStack([{ screen: 'tournaments', params: {} }])} />
          <TweakButton label="Tournament: Bayfront Open" onClick={() => setStack([{ screen: 'tournament', params: { id: 't1' } }])} />
          <TweakButton label="All Games" onClick={() => setStack([{ screen: 'all-games', params: {} }])} />
          <TweakButton label="Stats" onClick={() => setStack([{ screen: 'stats', params: {} }])} />
          <TweakButton label="Profile" onClick={() => setStack([{ screen: 'profile', params: {} }])} />
          <TweakButton label="Scan score sheet" onClick={() => setStack([{ screen: 'scan', params: {} }])} />
          <TweakButton label="Replay: Opera Game" onClick={() => setStack([{ screen: 'replay', params: { id: 'g1' } }])} />
          <TweakButton label="New tournament" onClick={() => setStack([{ screen: 'new-tournament', params: {} }])} />
          <TweakButton label="Edit game (Opera)" onClick={() => setStack([{ screen: 'edit-game', params: { id: 'g1' } }])} />
          <TweakButton label="Edit tournament (t1)" onClick={() => setStack([{ screen: 'edit-tournament', params: { id: 't1' } }])} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Stats screen
// ──────────────────────────────────────────────────────────
function StatsScreen({ nav, user }) {
  const [period, setPeriod] = React.useState('all'); // all | month | week
  const now = new Date();

  function inPeriod(isoDate) {
    if (period === 'all') return true;
    const d = parseLocal(isoDate);
    if (period === 'week') {
      const cutoff = new Date(now); cutoff.setDate(now.getDate() - 7); return d >= cutoff;
    }
    const cutoff = new Date(now.getFullYear(), now.getMonth(), 1); return d >= cutoff;
  }

  const games = GAMES.filter(g => g.date && inPeriod(g.date));
  const mine  = games.filter(g => g.white === 'You' || g.black === 'You');
  const won   = mine.filter(g => (g.result === '1-0' && g.white === 'You') || (g.result === '0-1' && g.black === 'You')).length;
  const lost  = mine.filter(g => (g.result === '0-1' && g.white === 'You') || (g.result === '1-0' && g.black === 'You')).length;
  const drew  = mine.filter(g => g.result === '½-½').length;
  const total = mine.length;

  // Opening frequency
  const openingCounts = {};
  games.forEach(g => {
    const eco = (g.eco || '—').split(' — ')[0];
    openingCounts[eco] = (openingCounts[eco] || 0) + 1;
  });
  const topOpenings = Object.entries(openingCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Per-tournament breakdown
  const tourneyMap = {};
  games.forEach(g => {
    if (!g.tournament) return;
    if (!tourneyMap[g.tournament]) tourneyMap[g.tournament] = { won: 0, lost: 0, drew: 0 };
    const m = tourneyMap[g.tournament];
    if ((g.result === '1-0' && g.white === 'You') || (g.result === '0-1' && g.black === 'You')) m.won++;
    else if ((g.result === '0-1' && g.white === 'You') || (g.result === '1-0' && g.black === 'You')) m.lost++;
    else m.drew++;
  });

  const periodChips = [
    { key: 'week',  label: '7 days' },
    { key: 'month', label: 'Month' },
    { key: 'all',   label: 'All time' },
  ];

  const barMax = Math.max(won, lost, drew, 1);
  function Bar({ val, color, label }) {
    return (
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ height: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{
            width: 32, borderRadius: '6px 6px 0 0',
            background: color,
            height: `${Math.max(4, (val / barMax) * 100)}%`,
            transition: 'height 0.4s ease',
          }} />
        </div>
        <div style={{
          fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700,
          color: 'var(--fg)', marginTop: 4,
        }}>{val}</div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
          textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginTop: 2,
        }}>{label}</div>
      </div>
    );
  }

  return (
    <div style={{
      paddingTop: 56, paddingBottom: 110,
      background: 'var(--bg)', minHeight: '100%', color: 'var(--fg)',
    }}>
      <div style={{ padding: '4px 20px 0' }}>
        <div style={{
          fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, letterSpacing: -0.5,
        }}>Stats</div>
        <div style={{
          fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--fg-2)', marginTop: 2,
        }}>{user.name} · {user.federation} {user.rating}</div>
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 20px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {periodChips.map(c => (
          <div key={c.key} onClick={() => setPeriod(c.key)} style={{
            flexShrink: 0, padding: '5px 16px', borderRadius: 999,
            background: period === c.key ? 'var(--ink)' : 'var(--surface)',
            border: '1px solid var(--border)',
            color: period === c.key ? 'var(--paper)' : 'var(--fg-2)',
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.15s',
          }}>{c.label}</div>
        ))}
      </div>

      {/* W/L/D bar chart */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          background: 'var(--surface)', borderRadius: 16,
          border: '1px solid var(--border)',
          padding: '20px 20px 16px',
          boxShadow: 'var(--shadow-1)',
        }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
            textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600,
            marginBottom: 16,
          }}>Results — {total} game{total !== 1 ? 's' : ''}</div>
          {total === 0 ? (
            <div style={{
              fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--fg-3)', textAlign: 'center', padding: '20px 0',
            }}>No games in this period</div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Bar val={won}  color="var(--win)"  label="Won" />
              <Bar val={lost} color="var(--loss)" label="Lost" />
              <Bar val={drew} color="var(--draw)" label="Draw" />
            </div>
          )}
          {total > 0 && (
            <div style={{
              marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)',
              display: 'flex', gap: 16,
              fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-2)', fontWeight: 500,
            }}>
              <span>Win rate: <strong style={{ color: 'var(--win)' }}>{Math.round((won / total) * 100)}%</strong></span>
              <span>Score: <strong>{won + drew * 0.5}/{total}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Tournament breakdown */}
      {Object.keys(tourneyMap).length > 0 && (
        <div style={{ padding: '18px 20px 0' }}>
          <SectionLabel>By tournament</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0 0' }}>
            {Object.entries(tourneyMap).map(([tid, r]) => {
              const t = TOURNAMENTS.find(x => x.id === tid);
              if (!t) return null;
              const tm = r.won + r.lost + r.drew;
              return (
                <div key={tid} onClick={() => nav.go('tournament', { id: tid })} style={{
                  background: 'var(--surface)', borderRadius: 12,
                  border: '1px solid var(--border)',
                  padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--display)', fontSize: 15, fontWeight: 600,
                      color: 'var(--fg)', letterSpacing: -0.2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{t.name}</div>
                    <div style={{
                      fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
                      marginTop: 3, fontWeight: 600,
                    }}>{r.won}W · {r.lost}L · {r.drew}D</div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700,
                    color: 'var(--fg)', letterSpacing: -0.5,
                  }}>{r.won + r.drew * 0.5}<span style={{ fontSize: 13, color: 'var(--fg-3)', fontWeight: 500 }}>/{tm}</span></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Opening frequency */}
      {topOpenings.length > 0 && (
        <div style={{ padding: '18px 20px 0' }}>
          <SectionLabel>Top openings</SectionLabel>
          <div style={{
            background: 'var(--surface)', borderRadius: 16,
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}>
            {topOpenings.map(([eco, count], i) => (
              <div key={eco} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px',
                borderBottom: i < topOpenings.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                  color: 'var(--fg-3)', width: 22, textAlign: 'right',
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg)', fontWeight: 600 }}>{eco}</div>
                </div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-3)', fontWeight: 600,
                }}>{count}×</div>
                <div style={{
                  width: 48, height: 5, borderRadius: 3,
                  background: 'var(--border)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: 'var(--ink)',
                    width: `${(count / topOpenings[0][1]) * 100}%`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Profile / settings screen
// ──────────────────────────────────────────────────────────
function ProfileScreen({ nav, user, t, setTweak }) {
  const initials = user.name.split(' ').map(s => s[0]).slice(0, 2).join('');
  const [name, setName] = React.useState(user.name);
  const [editing, setEditing] = React.useState(false);

  function saveNameEdit() {
    setTweak('userName', name.trim() || user.name);
    setEditing(false);
  }

  const THEMES = [
    { key: 'modern', label: 'Modern', sub: 'Clean sans-serif' },
    { key: 'paper',  label: 'Paper',  sub: 'Serif, classic feel' },
  ];
  const MODES = [
    { key: 'light', label: 'Light' },
    { key: 'dark',  label: 'Dark' },
  ];

  return (
    <div style={{
      paddingTop: 56, paddingBottom: 110,
      background: 'var(--bg)', minHeight: '100%', color: 'var(--fg)',
    }}>
      {/* Avatar */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '20px 20px 0',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'var(--ink)', color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--display)', fontSize: 24, fontWeight: 700,
          letterSpacing: 0.5, boxShadow: 'var(--shadow-2)',
        }}>{initials}</div>

        {editing ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <input
              value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveNameEdit()}
              autoFocus
              style={{
                height: 36, borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--surface)', padding: '0 12px',
                fontFamily: 'var(--display)', fontSize: 16, fontWeight: 600,
                color: 'var(--fg)', outline: 'none', textAlign: 'center',
              }}
            />
            <div onClick={saveNameEdit} style={{
              padding: '6px 12px', borderRadius: 8,
              background: 'var(--ink)', color: 'var(--paper)',
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}>Save</div>
          </div>
        ) : (
          <div onClick={() => setEditing(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginTop: 12, cursor: 'pointer',
          }}>
            <div style={{
              fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700,
              color: 'var(--fg)', letterSpacing: -0.3,
            }}>{user.name}</div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 9.5l1.5-1.5 6-6 1.5 1.5-6 6L1 9.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        <div style={{
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-3)',
          marginTop: 4, letterSpacing: 0.4,
        }}>{user.federation} · Rating {user.rating}</div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, padding: '20px 20px 0' }}>
        <StatTile value={GAMES.length} label="Total games" />
        <StatTile value={TOURNAMENTS.length} label="Tournaments" />
        <StatTile value={(() => {
          const mine = GAMES.filter(g => g.white === 'You' || g.black === 'You');
          const won = mine.filter(g => (g.result === '1-0' && g.white === 'You') || (g.result === '0-1' && g.black === 'You')).length;
          return mine.length > 0 ? Math.round((won / mine.length) * 100) + '%' : '—';
        })()} label="Win rate" accent="var(--win)" />
      </div>

      {/* Appearance */}
      <div style={{ padding: '22px 20px 0' }}>
        <SectionLabel>Appearance</SectionLabel>
        <div style={{
          background: 'var(--surface)', borderRadius: 16,
          border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          {/* Mode */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
              textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 10,
            }}>Mode</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {MODES.map(m => (
                <div key={m.key} onClick={() => setTweak('mode', m.key)} style={{
                  flex: 1, height: 38, borderRadius: 10,
                  border: `1.5px solid ${t.mode === m.key ? 'var(--ink)' : 'var(--border)'}`,
                  background: t.mode === m.key ? 'var(--ink)' : 'transparent',
                  color: t.mode === m.key ? 'var(--paper)' : 'var(--fg-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>{m.label}</div>
              ))}
            </div>
          </div>
          {/* Theme */}
          <div style={{ padding: '14px 16px' }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
              textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, marginBottom: 10,
            }}>Theme</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {THEMES.map(th => (
                <div key={th.key} onClick={() => setTweak('theme', th.key)} style={{
                  flex: 1, padding: '10px 14px', borderRadius: 12,
                  border: `1.5px solid ${t.theme === th.key ? 'var(--ink)' : 'var(--border)'}`,
                  background: t.theme === th.key ? 'var(--surface-2)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <div style={{
                    fontFamily: 'var(--display)', fontSize: 14, fontWeight: 600,
                    color: t.theme === th.key ? 'var(--fg)' : 'var(--fg-2)',
                  }}>{th.label}</div>
                  <div style={{
                    fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--fg-3)', marginTop: 2,
                  }}>{th.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* OCR backend */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionLabel>Scan settings</SectionLabel>
        <div style={{
          background: 'var(--surface)', borderRadius: 16,
          border: '1px solid var(--border)',
          padding: '14px 16px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 6,
          }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500, color: 'var(--fg)' }}>
              Handwriting model
            </div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
              padding: '3px 8px', borderRadius: 6,
              background: 'var(--surface-2)', color: 'var(--fg-2)',
              letterSpacing: 0.5,
            }}>TrOCR</div>
          </div>
          <div style={{
            fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.5,
          }}>
            Microsoft TrOCR (local, ~300 MB). Set OCR_BACKEND=ollama in .env for higher accuracy with a local vision model.
          </div>
        </div>
      </div>

      {/* Data */}
      <div style={{ padding: '18px 20px 0' }}>
        <SectionLabel>Data</SectionLabel>
        <div style={{
          background: 'var(--surface)', borderRadius: 16,
          border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--fg)' }}>Backend</div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 11, color: window.LIVE_DATA_LOADED ? 'var(--win)' : 'var(--fg-3)',
              fontWeight: 600,
            }}>{window.LIVE_DATA_LOADED ? 'Connected' : 'Mock data'}</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
          }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--fg)' }}>API endpoint</div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)', fontWeight: 500,
            }}>localhost:8000</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Expose shared UI primitives so later-loaded screens-*.jsx files can reference them
// (app.jsx loads last, but React renders after ALL scripts execute, so this is safe)
Object.assign(window, {
  LiveFormField, FormField, BackButton: window.BackButton || BackButton,
  StatsScreen, ProfileScreen,
});

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
