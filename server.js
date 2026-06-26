const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'pacman.db');

// ── Garante diretório do banco ──────────────────────────────
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ── Conexão SQLite (WAL mode) ───────────────────────────────
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    UNIQUE NOT NULL,
    password_hash TEXT   NOT NULL,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    token       TEXT    UNIQUE NOT NULL,
    created_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS scores (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    score        INTEGER NOT NULL CHECK (score >= 0 AND score <= 999999),
    player_email TEXT    NOT NULL,
    created_at   TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// ── Middleware ───────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// ── Helpers ─────────────────────────────────────────────────
function sanitize(v) {
  if (typeof v !== 'string') return '';
  return v.trim().replace(/[<>&'"]/g, '').slice(0, 255);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente' });
  }
  const token = header.slice(7);
  const session = db.prepare(
    'SELECT user_id FROM sessions WHERE token = ?'
  ).get(token);
  if (!session) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
  req.userId = session.user_id;
  next();
}

// ── Rotas de Autenticação ───────────────────────────────────

// POST /api/register
app.post('/api/register', (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = sanitize(email).toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'E-mail inválido' });
    }
    if (!password || password.length < 6 || password.length > 128) {
      return res.status(400).json({ error: 'Senha deve ter 6–128 caracteres' });
    }

    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (exists) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    const hash = bcrypt.hashSync(password, 12);
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)'
    ).run(cleanEmail, hash);

    const token = crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions (user_id, token) VALUES (?, ?)').run(lastInsertRowid, token);

    res.status(201).json({ token, email: cleanEmail });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/login
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = sanitize(email).toLowerCase();

    const user = db.prepare(
      'SELECT id, email, password_hash FROM users WHERE email = ?'
    ).get(cleanEmail);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions (user_id, token) VALUES (?, ?)').run(user.id, token);

    res.json({ token, email: user.email });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/logout
app.post('/api/logout', authMiddleware, (req, res) => {
  const token = req.headers.authorization.slice(7);
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.json({ ok: true });
});

// GET /api/me
app.get('/api/me', authMiddleware, (req, res) => {
  const user = db.prepare(
    'SELECT id, email, created_at FROM users WHERE id = ?'
  ).get(req.userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json({ id: user.id, email: user.email, created_at: user.created_at });
});

// ── Rotas de Pontuação ──────────────────────────────────────

// GET /api/scores?limit=10
app.get('/api/scores', (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const scores = db.prepare(
    'SELECT score, player_email, created_at FROM scores ORDER BY score DESC LIMIT ?'
  ).all(limit);
  res.json(scores);
});

// POST /api/scores  (autenticada)
app.post('/api/scores', authMiddleware, (req, res) => {
  try {
    const score = parseInt(req.body.score);
    if (isNaN(score) || score < 0 || score > 999999) {
      return res.status(400).json({ error: 'Pontuação inválida' });
    }
    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId);
    db.prepare(
      'INSERT INTO scores (user_id, score, player_email) VALUES (?, ?, ?)'
    ).run(req.userId, score, user.email);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Score error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── HTML5 History fallback ──────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎮 Pac-Man rodando em http://localhost:${PORT}`);
});
