// chess.jsx — minimal chess board state + renderer
// Pieces: uppercase=white, lowercase=black. K Q R B N P.

const PIECE_GLYPHS = {
  K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

const FILES = ['a','b','c','d','e','f','g','h'];

function parseSquare(s) {
  // returns [rowIdx, colIdx] where row 0 = rank 8 (top of board for white)
  const col = s.charCodeAt(0) - 97;
  const rank = parseInt(s[1], 10);
  return [8 - rank, col];
}

function squareName(row, col) {
  return FILES[col] + (8 - row);
}

function initialBoard() {
  return [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R'],
  ];
}

function applyMove(board, move) {
  const next = board.map(row => row.slice());
  if (move.castle) {
    // figure out king's row
    const row = move.from ? parseSquare(move.from)[0] : (move.color === 'w' ? 7 : 0);
    if (move.castle === 'K') {
      next[row][6] = next[row][4];
      next[row][4] = '';
      next[row][5] = next[row][7];
      next[row][7] = '';
    } else {
      next[row][2] = next[row][4];
      next[row][4] = '';
      next[row][3] = next[row][0];
      next[row][0] = '';
    }
    return next;
  }
  const [fr, fc] = parseSquare(move.from);
  const [tr, tc] = parseSquare(move.to);
  const piece = next[fr][fc];
  next[tr][tc] = move.promotion || piece;
  next[fr][fc] = '';
  if (move.enPassant) next[fr][tc] = '';
  return next;
}

function computePositions(moves) {
  const positions = [initialBoard()];
  const lastMoves = [null];
  for (const m of moves) {
    const prev = positions[positions.length - 1];
    positions.push(applyMove(prev, m));
    lastMoves.push(m);
  }
  return { positions, lastMoves };
}

// ──────────────────────────────────────────────────────────
// Board renderer — paper-and-ink style
// ──────────────────────────────────────────────────────────
function ChessBoard({ position, lastMove, size = 320, flipped = false, showCoords = true, onSquareTap }) {
  const cell = size / 8;
  const rows = flipped ? [...position].reverse().map(r => [...r].reverse()) : position;

  // squares we want to highlight
  let fromSq = null, toSq = null;
  if (lastMove) {
    if (lastMove.castle) {
      const kingRow = parseSquare(lastMove.from || (lastMove.color === 'w' ? 'e1' : 'e8'))[0];
      fromSq = [kingRow, 4];
      toSq = [kingRow, lastMove.castle === 'K' ? 6 : 2];
    } else {
      fromSq = parseSquare(lastMove.from);
      toSq = parseSquare(lastMove.to);
    }
  }

  const isHighlight = (r, c) => {
    const actualR = flipped ? 7 - r : r;
    const actualC = flipped ? 7 - c : c;
    return (fromSq && fromSq[0] === actualR && fromSq[1] === actualC) ||
           (toSq && toSq[0] === actualR && toSq[1] === actualC);
  };

  return (
    <div style={{
      width: size, height: size, position: 'relative',
      borderRadius: 4, overflow: 'hidden',
    }}>
      {rows.map((row, r) => (
        <div key={r} style={{ display: 'flex', height: cell }}>
          {row.map((piece, c) => {
            const light = (r + c) % 2 === 0;
            const hl = isHighlight(r, c);
            const actualR = flipped ? 7 - r : r;
            const actualC = flipped ? 7 - c : c;
            const isWhitePiece = piece && piece === piece.toUpperCase();
            return (
              <div
                key={c}
                onClick={onSquareTap ? () => onSquareTap(squareName(actualR, actualC)) : undefined}
                style={{
                  width: cell, height: cell, position: 'relative',
                  background: light ? 'var(--board-light)' : 'var(--board-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: onSquareTap ? 'pointer' : 'default',
                }}
              >
                {hl && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'var(--move-tint)',
                    mixBlendMode: 'multiply',
                  }} />
                )}
                {piece && (
                  <span style={{
                    fontSize: cell * 0.72,
                    lineHeight: 1,
                    color: isWhitePiece ? '#F5F2E8' : '#1A1A1A',
                    textShadow: isWhitePiece
                      ? '0 0 0.5px #1A1A1A, 0.5px 0 0 #1A1A1A, -0.5px 0 0 #1A1A1A, 0 0.5px 0 #1A1A1A, 0 -0.5px 0 #1A1A1A, 1px 1px 0 #1A1A1A, -1px 1px 0 #1A1A1A, 1px -1px 0 #1A1A1A, -1px -1px 0 #1A1A1A'
                      : 'none',
                    position: 'relative',
                    fontFamily: '"DejaVu Sans", "Arial Unicode MS", sans-serif',
                  }}>
                    {PIECE_GLYPHS[piece]}
                  </span>
                )}
                {/* coords */}
                {showCoords && c === 0 && (
                  <span style={{
                    position: 'absolute', left: 3, top: 2,
                    fontSize: 9, fontWeight: 600,
                    fontFamily: 'Geist Mono, ui-monospace, monospace',
                    color: light ? 'var(--board-dark)' : 'var(--board-light)',
                    opacity: 0.85,
                  }}>{flipped ? r + 1 : 8 - r}</span>
                )}
                {showCoords && r === 7 && (
                  <span style={{
                    position: 'absolute', right: 3, bottom: 2,
                    fontSize: 9, fontWeight: 600,
                    fontFamily: 'Geist Mono, ui-monospace, monospace',
                    color: light ? 'var(--board-dark)' : 'var(--board-light)',
                    opacity: 0.85,
                  }}>{flipped ? FILES[7 - c] : FILES[c]}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Mini board for game cards
function MiniBoard({ position, size = 56 }) {
  const cell = size / 8;
  return (
    <div style={{
      width: size, height: size, position: 'relative',
      borderRadius: 3, overflow: 'hidden',
    }}>
      {position.map((row, r) => (
        <div key={r} style={{ display: 'flex', height: cell }}>
          {row.map((piece, c) => {
            const light = (r + c) % 2 === 0;
            const isWhitePiece = piece && piece === piece.toUpperCase();
            return (
              <div key={c} style={{
                width: cell, height: cell,
                background: light ? 'var(--board-light)' : 'var(--board-dark)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {piece && (
                  <span style={{
                    fontSize: cell * 0.85, lineHeight: 1,
                    color: isWhitePiece ? '#F5F2E8' : '#1A1A1A',
                    textShadow: isWhitePiece
                      ? '0.3px 0 0 #1A1A1A, -0.3px 0 0 #1A1A1A, 0 0.3px 0 #1A1A1A, 0 -0.3px 0 #1A1A1A'
                      : 'none',
                    fontFamily: '"DejaVu Sans", "Arial Unicode MS", sans-serif',
                  }}>{PIECE_GLYPHS[piece]}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  PIECE_GLYPHS, FILES, parseSquare, squareName,
  initialBoard, applyMove, computePositions,
  ChessBoard, MiniBoard,
});
