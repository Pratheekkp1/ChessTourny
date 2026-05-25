# Chess Tourny — API Reference

Base URL: `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs`

---

## Tournaments

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/tournaments` | Create a new tournament (folder) |
| `GET` | `/tournaments` | List all tournaments with game counts |
| `GET` | `/tournaments/{id}` | Get tournament details |
| `PUT` | `/tournaments/{id}` | Rename / update a tournament |
| `DELETE` | `/tournaments/{id}` | Delete tournament (games become untournament'd) |

**Create body:**
```json
{
  "name": "Spring Open 2025",
  "description": "Club championship",
  "location": "Austin, TX",
  "start_date": "2025-03-01T00:00:00",
  "end_date": "2025-03-02T00:00:00"
}
```

---

## Games

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/games` | Upload score sheet photo → OCR → store game |
| `GET` | `/games?tournament_id=1` | List games (optionally filtered) |
| `GET` | `/games/{id}` | Full game details + all moves |
| `GET` | `/games/{id}/position/{ply}` | Board state at a specific ply (0 = start) |
| `GET` | `/games/{id}/pgn` | Export game as PGN text |
| `GET` | `/games/{id}/image` | Download original score sheet photo |
| `DELETE` | `/games/{id}` | Delete game + image |

**Create a game (multipart/form-data):**
```
image        : File  (JPEG/PNG/WEBP)
tournament_id: int?  (optional — leave blank for standalone game)
```

**Position response (for the board replay):**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "move_number": 1,
  "ply": 1,
  "san": "e4",
  "uci": "e2e4",
  "is_check": false,
  "is_checkmate": false,
  "is_game_over": false
}
```

**Game summary response:**
```json
{
  "id": 3,
  "tournament_id": 1,
  "game_number": 3,
  "display_name": "vs Smith, John",
  "white_player": "You",
  "black_player": "Smith, John",
  "game_date": "2025-03-01",
  "added_at": "2025-03-01T14:22:00",
  "result": "white_won",
  "total_moves": 42,
  "has_image": true
}
```

---

## Setup

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
./start.sh
```
