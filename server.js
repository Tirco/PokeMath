// server.js
require("dotenv").config();

const WebSocket = require("ws");
const express = require("express");
const mysql = require("mysql2");
const crypto = require("crypto");
const validator = require("validator");
const fs = require("fs");
const path = require("path");
const http = require("http");
const nodemailer = require("nodemailer");

// ---------------------------------------------------------------------------
// Bingo prize constants
// ---------------------------------------------------------------------------
const BINGO_LEGENDARIES = [144,145,146,150,243,244,245,249,250,377,378,379,380,381,382,383,384,480,481,482,483,484,485,486,487,488,638,639,640,641,642,643,644,645,646,716,717,718,772,773,785,786,787,788,789,790,791,792,800,888,889,890,891,892,894,895,896,897,898,905,1001,1002,1003,1004,1007,1008];
const BINGO_MYTHICS     = [151,251,385,386,489,490,491,492,493,494,647,648,649,719,720,721,801,802,807,808,809,893];
const BINGO_COINS       = { easy: 5000, medium: 10000, hard: 25000, extreme: 35000, unik: 50000 };

function generateBingoPrize(prizeType, difficulty) {
  const all = ["coins", "legendary", "mythic", "shiny", "participation_coins", "stardust"];
  const resolved = prizeType === "random" ? all[Math.floor(Math.random() * all.length)] : prizeType;
  if (resolved === "participation_coins") {
    return { type: "participation_coins" }; // per-player amount computed at distribution time
  }
  if (resolved === "per_catch_coins") {
    return { type: "per_catch_coins" }; // 50 coins × player's own catch count
  }
  if (resolved === "coins") {
    return { type: "coins", amount: BINGO_COINS[difficulty] || 10000 };
  }
  if (resolved === "legendary") {
    const id = BINGO_LEGENDARIES[Math.floor(Math.random() * BINGO_LEGENDARIES.length)];
    return { type: "pokemon", entry: "N" + id, pokedexId: id, shiny: false, legendary: true, mythic: false };
  }
  if (resolved === "mythic") {
    const id = BINGO_MYTHICS[Math.floor(Math.random() * BINGO_MYTHICS.length)];
    return { type: "pokemon", entry: "N" + id, pokedexId: id, shiny: false, legendary: false, mythic: true };
  }
  if (resolved === "stardust") {
    return { type: "stardust", amount: 1 };
  }
  // shiny — 3 different random pokémon (1–1008)
  const shinyIds = new Set();
  while (shinyIds.size < 3) shinyIds.add(Math.floor(Math.random() * 1008) + 1);
  return [...shinyIds].map(id => ({ type: "pokemon", entry: "S" + id, pokedexId: id, shiny: true, legendary: false, mythic: false }));
}

const bingoTasks = require("./bingo-tasks");
const tasks = bingoTasks.tasks || [];
const difficultyConfig = bingoTasks.difficultyConfig || bingoTasks.difficulty || {};
const generateUniqueIdTasks = bingoTasks.generateUniqueIdTasks;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json({ limit: "256kb" }));

// Prevent browsers from caching API responses
app.use((_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

// Security headers (defence-in-depth; Apache .htaccess sets these too)
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
    "img-src 'self' data: https://raw.githubusercontent.com; " +
    "connect-src 'self' wss:; " +
    "frame-ancestors 'none';"
  );
  next();
});

// -----------------------------------------------------------------------------
// Helpers: Random task generators (safe)
// -----------------------------------------------------------------------------
function generateRandomNumberTaskSafe() {
  if (typeof bingoTasks.generateRandomNumberTask === "function") return bingoTasks.generateRandomNumberTask();
  if (typeof bingoTasks.generateRandomTask === "function") return bingoTasks.generateRandomTask();
  return {
    id: 50001 + Math.floor(Math.random() * 150),
    name: "Tilfeldig Pokémon",
    description: "Fallback",
    image: "",
    rule: { kind: "pokedexExact", id: 1 + Math.floor(Math.random() * 150) }
  };
}

function generateRandomRangeTaskSafe() {
  if (typeof bingoTasks.generateRandomRangeTask === "function") return bingoTasks.generateRandomRangeTask();
  if (typeof bingoTasks.generateRandomTaskRange === "function") return bingoTasks.generateRandomTaskRange();
  const start = 1 + Math.floor(Math.random() * 100) * 10;
  return {
    id: 40000 + start,
    name: `#${start}–#${start + 9}`,
    description: "Fang en Pokémon i dette intervallet",
    image: "",
    rule: { kind: "pokedexRange", start, end: start + 9 }
  };
}

// -----------------------------------------------------------------------------
// Logging / time
// -----------------------------------------------------------------------------
function getOsloTime() {
  const osloTime = new Date().toLocaleString("en-GB", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return osloTime.replace(",", "");
}

function logWithTimestamp(message, type = "message") {
  const timestamp = getOsloTime();
  const formattedMessage = `[${timestamp}] ${message}`;

  switch (type.toLowerCase()) {
    case "error":
      console.error(`\x1b[31m${formattedMessage}\x1b[0m`);
      break;
    case "warning":
      console.warn(`\x1b[33m${formattedMessage}\x1b[0m`);
      break;
    case "message":
    default:
      console.log(`\x1b[32m${formattedMessage}\x1b[0m`);
      break;
  }
}

// --- Per-lobby file logging ---
const BINGO_LOGS_DIR = path.join(__dirname, "bingo_logs");
try { fs.mkdirSync(BINGO_LOGS_DIR, { recursive: true }); } catch {}

function safeLobbyLogName(name) {
  return String(name || "Unknown").replace(/[^a-zA-ZæøåÆØÅ0-9_-]/g, "_").slice(0, 40);
}

function getLobbyLogPath(teacherName, code) {
  return path.join(BINGO_LOGS_DIR, `${safeLobbyLogName(teacherName)}_${code}.log`);
}

function logToLobby(lobby, message) {
  try {
    const logPath = getLobbyLogPath(lobby.teacherName, lobby.code);
    const line = `[${getOsloTime()}] ${message}\n`;
    fs.appendFileSync(logPath, line, "utf8");
  } catch (e) {
    logWithTimestamp("logToLobby write error: " + e, "error");
  }
}

// --- Bingo log retention (90 days) ---
const BINGO_LOG_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
function purgeStaleBingoLogs() {
  try {
    const now = Date.now();
    const files = fs.readdirSync(BINGO_LOGS_DIR);
    let removed = 0;
    for (const file of files) {
      if (!file.endsWith(".log")) continue;
      const filePath = path.join(BINGO_LOGS_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > BINGO_LOG_MAX_AGE_MS) {
        fs.unlinkSync(filePath);
        removed++;
      }
    }
    if (removed > 0) logWithTimestamp(`Log retention: removed ${removed} bingo log(s) older than 90 days.`);
  } catch (e) {
    logWithTimestamp("purgeStaleBingoLogs error: " + e, "error");
  }
}
purgeStaleBingoLogs();
setInterval(purgeStaleBingoLogs, 24 * 60 * 60 * 1000);

process.on("uncaughtException", (err) => {
  try {
    logWithTimestamp("UNCAUGHT EXCEPTION: " + (err?.stack || String(err)), "error");
  } catch {
    console.error(err);
  }
});
process.on("unhandledRejection", (err) => {
  try {
    logWithTimestamp("UNHANDLED REJECTION: " + (err?.stack || String(err)), "error");
  } catch {
    console.error(err);
  }
});

// -----------------------------------------------------------------------------
// ENV / CONSTANTS
// -----------------------------------------------------------------------------
const SECRET_KEY = process.env.SECRET_KEY; // required

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Redeem rate limit: 60 per 5 minutes per IP (covers whole classrooms on shared WiFi)
const redeemIpMap = new Map();
const REDEEM_IP_MAX    = 60;
const REDEEM_IP_WINDOW = 5 * 60 * 1000;

function redeemRateLimit(req, res, next) {
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim()
          || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const entry = redeemIpMap.get(ip);
  if (!entry || now - entry.windowStart > REDEEM_IP_WINDOW) {
    redeemIpMap.set(ip, { count: 1, windowStart: now });
    return next();
  }
  if (entry.count >= REDEEM_IP_MAX) {
    return res.status(429).json({ ok: false, message: "For mange forsøk. Vent litt og prøv igjen." });
  }
  entry.count++;
  next();
}
setInterval(() => {
  const cutoff = Date.now() - REDEEM_IP_WINDOW;
  for (const [ip, v] of redeemIpMap) {
    if (v.windowStart < cutoff) redeemIpMap.delete(ip);
  }
}, REDEEM_IP_WINDOW);

// -----------------------------------------------------------------------------
// EMAIL (nodemailer)
// Required env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
// Optional env: SMTP_SECURE (true/false), SMTP_FROM, SITE_URL
// SQL migration needed:
//   ALTER TABLE teachers
//     ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0,
//     ADD COLUMN email_verify_token VARCHAR(64) DEFAULT NULL,
//     ADD COLUMN last_seen DATETIME DEFAULT NULL;
// -----------------------------------------------------------------------------
const SITE_URL = (process.env.SITE_URL || "https://pokemath.online").replace(/\/$/, "");
const SMTP_FROM = process.env.SMTP_FROM || "PokeMath <no-reply@pokemath.online>";

let mailTransport = null;
if (process.env.SMTP_HOST) {
  mailTransport = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  logWithTimestamp("Email transport configured (SMTP_HOST=" + process.env.SMTP_HOST + ")");
} else {
  logWithTimestamp("WARNING: SMTP_HOST not set – email sending is disabled.", "warning");
}

async function sendMail(to, subject, html) {
  if (!mailTransport) throw new Error("E-post ikke konfigurert på server (SMTP_HOST mangler).");
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  await mailTransport.sendMail({ from: SMTP_FROM, to, subject, html, text });
  logWithTimestamp(`Email sent to ${to}: "${subject}"`);
}

if (!SECRET_KEY) {
  logWithTimestamp("FATAL WARNING: SECRET_KEY is missing. Teacher sessions will fail.", "warning");
}
if (!ADMIN_PASSWORD) {
  logWithTimestamp("FATAL WARNING: ADMIN_PASSWORD is missing. Admin endpoints will be disabled.", "warning");
}

// Extract Bearer token from Authorization header (used by admin endpoints)
function getBearer(req) {
  const auth = (req.headers.authorization || "").toString();
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

// -----------------------------------------------------------------------------
// MYSQL POOL
// -----------------------------------------------------------------------------
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function handleDisconnect() {
  logWithTimestamp("handleDisconnect(): pool will be reused; attempting a ping", "warning");
  pool.query("SELECT 1", (err) => {
    if (err) logWithTimestamp("Ping failed after disconnect: " + err, "error");
    else logWithTimestamp("Ping OK after disconnect attempt.", "message");
  });
}

pool.on("error", (err) => {
  logWithTimestamp("MySQL pool error: " + err, "error");
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    logWithTimestamp("Attempting to reconnect...", "warning");
    handleDisconnect();
  }
});

pool.query(`CREATE TABLE IF NOT EXISTS teacher_password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(64) NOT NULL DEFAULT '',
  expires_at DATETIME NOT NULL DEFAULT '2000-01-01',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reset_email (email)
)`, (err) => {
  if (err) logWithTimestamp("Failed to create teacher_password_resets table: " + err, "error");
  else {
    // Migration: add columns if the table existed with the old schema (just email).
    // Uses ER_DUP_FIELDNAME to silently ignore "column already exists" on any MySQL version.
    pool.query("ALTER TABLE teacher_password_resets ADD COLUMN token VARCHAR(64) NOT NULL DEFAULT ''", (e) => {
      if (e && e.code !== "ER_DUP_FIELDNAME") logWithTimestamp("reset table migration (token): " + e, "warning");
    });
    pool.query("ALTER TABLE teacher_password_resets ADD COLUMN expires_at DATETIME NOT NULL DEFAULT '2000-01-01'", (e) => {
      if (e && e.code !== "ER_DUP_FIELDNAME") logWithTimestamp("reset table migration (expires_at): " + e, "warning");
    });
  }
});

pool.query(`CREATE TABLE IF NOT EXISTS bingo_prizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bingo_code VARCHAR(10) NOT NULL,
  uuid VARCHAR(36) NOT NULL,
  prize_json TEXT NOT NULL,
  claimed TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_uuid (uuid),
  INDEX idx_code (bingo_code)
)`, (err) => {
  if (err) logWithTimestamp("Failed to create bingo_prizes table: " + err, "error");
});

// Add locked column to bingo_lobbies if it doesn't exist yet (safe to run repeatedly)
pool.query("ALTER TABLE bingo_lobbies ADD COLUMN locked TINYINT(1) NOT NULL DEFAULT 0", (err) => {
  if (err && err.code !== "ER_DUP_FIELDNAME") logWithTimestamp("ALTER TABLE bingo_lobbies (locked): " + err, "error");
});

// Add code_tokens to teachers (default 5 per teacher)
pool.query("ALTER TABLE teachers ADD COLUMN code_tokens INT NOT NULL DEFAULT 5", (err) => {
  if (err && err.code !== "ER_DUP_FIELDNAME") logWithTimestamp("ALTER TABLE teachers (code_tokens): " + err, "error");
});

pool.query(`CREATE TABLE IF NOT EXISTS secret_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plaintext_code VARCHAR(100) NOT NULL,
  label VARCHAR(200) NOT NULL,
  prize_type VARCHAR(30) NOT NULL DEFAULT 'message',
  prize_value VARCHAR(200) DEFAULT NULL,
  prize_image VARCHAR(300) DEFAULT NULL,
  repeatable TINYINT(1) NOT NULL DEFAULT 0,
  teacher_visible TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_by VARCHAR(255) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_code (plaintext_code)
)`, (err) => {
  if (err) { logWithTimestamp("Failed to create secret_codes table: " + err, "error"); return; }
  // Migration for existing installations that predate the created_by column
  pool.query("ALTER TABLE secret_codes ADD COLUMN created_by VARCHAR(255) NOT NULL DEFAULT 'admin'", (e) => {
    if (e && e.code !== "ER_DUP_FIELDNAME") logWithTimestamp("ALTER TABLE secret_codes (created_by): " + e, "error");
  });
});

pool.query(`CREATE TABLE IF NOT EXISTS code_redemptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code_id INT NOT NULL,
  uuid VARCHAR(36) NOT NULL,
  redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_redemption (code_id, uuid),
  INDEX idx_uuid (uuid)
)`, (err) => {
  if (err) logWithTimestamp("Failed to create code_redemptions table: " + err, "error");
});

// -----------------------------------------------------------------------------
// TOKEN / UUID VALIDATION
// -----------------------------------------------------------------------------
function generateToken(uuid) {
  const secret = process.env.SECRET_KEY;
  return crypto.createHmac("sha256", secret).update(uuid).digest("hex");
}

const isValidUUID = (uuid) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);

function validateToken(uuid, token) {
  const expectedToken = crypto.createHmac("sha256", SECRET_KEY).update(`${uuid}`).digest("hex");
  if (expectedToken !== token) {
    logWithTimestamp(`Invalid token for UUID ${uuid}.`, "warning");
    return false;
  }
  return true;
}

// --- retryTracker: bounded + TTL to prevent RAM growth ------------------------
const retryTracker = new Map(); // uuid -> { retries, timestamp }

const RETRY_MAX = 20000;
const RETRY_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function retryGet(uuid) {
  const v = retryTracker.get(uuid);
  if (!v) return null;
  if (Date.now() - v.timestamp > RETRY_TTL_MS) {
    retryTracker.delete(uuid);
    return null;
  }
  return v;
}

function retrySet(uuid, obj) {
  if (retryTracker.size >= RETRY_MAX) {
    // remove oldest ~10%
    const removeCount = Math.ceil(RETRY_MAX * 0.1);
    let i = 0;
    for (const key of retryTracker.keys()) {
      retryTracker.delete(key);
      if (++i >= removeCount) break;
    }
  }
  retryTracker.set(uuid, obj);
}

setInterval(() => {
  const now = Date.now();
  for (const [uuid, obj] of retryTracker.entries()) {
    if (!obj?.timestamp || (now - obj.timestamp) > RETRY_TTL_MS) retryTracker.delete(uuid);
  }
}, 30 * 60 * 1000);

// -----------------------------------------------------------------------------
// Rate limiter: teacher login (per email)
// -----------------------------------------------------------------------------
const loginAttempts = new Map(); // email -> { count, lockedUntil }
const LOGIN_MAX = 10;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

setInterval(() => {
  const now = Date.now();
  for (const [email, v] of loginAttempts.entries()) {
    if (now > v.lockedUntil && v.count === 0) loginAttempts.delete(email);
  }
}, 30 * 60 * 1000);

// -----------------------------------------------------------------------------
// Rate limiter: teacher auth endpoints (per IP)
// Covers login, register, and forgot-password
// -----------------------------------------------------------------------------
const authIpMap = new Map(); // ip -> { count, windowStart }
const AUTH_IP_MAX    = 15;                 // max requests per window
const AUTH_IP_WINDOW = 15 * 60 * 1000;    // 15-minute window

function authIpRateLimit(req, res, next) {
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim()
          || req.socket?.remoteAddress
          || "unknown";
  const now = Date.now();
  const entry = authIpMap.get(ip);
  if (!entry || now - entry.windowStart > AUTH_IP_WINDOW) {
    authIpMap.set(ip, { count: 1, windowStart: now });
    return next();
  }
  if (entry.count >= AUTH_IP_MAX) {
    return res.status(429).json({ ok: false, message: "For mange forsøk. Prøv igjen om 15 minutter." });
  }
  entry.count++;
  next();
}

setInterval(() => {
  const cutoff = Date.now() - AUTH_IP_WINDOW;
  for (const [ip, v] of authIpMap) {
    if (v.windowStart < cutoff) authIpMap.delete(ip);
  }
}, 30 * 60 * 1000);

// -----------------------------------------------------------------------------
// Rate limiter: WS catchPokemon (per player per lobby)
// -----------------------------------------------------------------------------
const catchRateMap = new Map(); // `${code}:${uuid}` -> { count, windowStart }
const CATCH_WINDOW_MS = 5000;
const CATCH_PER_WINDOW = 20; // max 20 catches per 5 s

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of catchRateMap.entries()) {
    if (now - v.windowStart > CATCH_WINDOW_MS * 12) catchRateMap.delete(k);
  }
}, 60 * 1000);

// Max students per lobby
const MAX_LOBBY_PLAYERS = 60;

// -----------------------------------------------------------------------------
// ROUTES: validate-user
// -----------------------------------------------------------------------------
app.get("/validate-user", (req, res) => {
  const { uuid, token } = req.query;

  if (!uuid || !isValidUUID(uuid)) {
    logWithTimestamp("Missing or invalid uuid " + uuid);
    return res.status(400).json({ error: "Missing or invalid uuid " });
  }

  let retries = retryGet(uuid);
  if (!retries) {
    retries = { retries: 0, timestamp: Date.now() };
    retrySet(uuid, retries);
  }

  if (retries.retries >= 5) {
    const cooldown = 30 * 60 * 1000;
    if (Date.now() - retries.timestamp < cooldown) {
      return res.status(429).json({ error: "Too many attempts. Please try again later." });
    } else {
      retries = { retries: 0, timestamp: Date.now() };
      retrySet(uuid, retries);
    }
  }

  pool.query("SELECT * FROM user_uuids WHERE uuid = ?", [uuid], (err, results) => {
    if (err) {
      logWithTimestamp("Error querying the database:" + err, "error");
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      const expectedToken = generateToken(uuid);
      if (token === expectedToken) {
        retries.retries = 0;
        retries.timestamp = Date.now();
        retrySet(uuid, retries);

        pool.query("UPDATE user_uuids SET last_updated = NOW() WHERE uuid = ?", [uuid], (updateErr) => {
          if (updateErr) {
            logWithTimestamp("Error updating last_updated field:" + updateErr, "error");
            return res.status(500).json({ error: "Database update error" });
          }
          return res.json({ valid: true });
        });
      } else {
        retries.retries++;
        retries.timestamp = Date.now();
        retrySet(uuid, retries);

        logWithTimestamp(`Invalid token for UUID ${uuid}.`, "warning");
        return res.status(401).json({ valid: false, error: "Invalid token" });
      }
    } else {
      const newToken = generateToken(uuid);
      pool.query("INSERT INTO user_uuids (uuid) VALUES (?)", [uuid], (insertErr) => {
        if (insertErr) {
          logWithTimestamp("Error inserting into the database: " + insertErr, "error");
          return res.status(500).json({ error: "Database error" });
        }
        retries.retries = 0;
        retries.timestamp = Date.now();
        retrySet(uuid, retries);

        res.json({ unique: true, token: newToken });
      });
    }
  });
});

// -----------------------------------------------------------------------------
// ROUTES: update-user-stats
// -----------------------------------------------------------------------------
app.post("/update-user-stats", (req, res) => {
  try {
    const { uuid, token, state, shopOptions } = req.body;

    if (!validateToken(uuid, token)) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const clampInt = (v, min, max) => Math.max(min, Math.min(max, Math.floor(Number(v) || 0)));
    const clampStr = (v, max) => String(v || "").slice(0, max);

    const username   = clampStr(state.username, 32);
    const totalScore = clampInt(state.totalScore, 0, 1_000_000_000);
    const pkmnCaught = clampInt(state.pkmnCaught, 0, 2000);
    const pkmnList   = Array.isArray(state.pkmnList) ? state.pkmnList.slice(0, 2000) : [];
    const tier1Solved  = clampInt(state.tier1Solved,  0, 10_000_000);
    const tier2Solved  = clampInt(state.tier2Solved,  0, 10_000_000);
    const tier3Solved  = clampInt(state.tier3Solved,  0, 10_000_000);
    const tier4Solved  = clampInt(state.tier4Solved,  0, 10_000_000);
    const tier5Solved  = clampInt(state.tier5Solved,  0, 10_000_000);
    const customSolved = clampInt(state.customSolved, 0, 10_000_000);

    const background       = clampStr(shopOptions.background,  64) || null;
    const playerIcon       = clampStr(shopOptions.playerIcon,  64) || null;
    const boughtBackgrounds  = Array.isArray(shopOptions.boughtBackgrounds)  ? shopOptions.boughtBackgrounds.slice(0, 200)  : [];
    const boughtPlayerIcons  = Array.isArray(shopOptions.boughtPlayerIcons)  ? shopOptions.boughtPlayerIcons.slice(0, 200)  : [];
    const shinyLevel   = clampInt(shopOptions.shinyLevel,   0, 200);
    const mythicLevel  = clampInt(shopOptions.mythicLevel,  0, 200);
    const legendLevel  = clampInt(shopOptions.legendLevel,  0, 200);
    const specialLevel = clampInt(shopOptions.specialLevel, 0, 200);
    const coinLevel    = clampInt(shopOptions.coinLevel,    0, 200);

    const now = new Date();

    pool.query(
      `INSERT INTO user_stats (
        uuid, username, total_score, pkmn_caught, pkmn_list,
        tier1_solved, tier2_solved, tier3_solved, tier4_solved, tier5_solved, custom_solved,
        bought_backgrounds, bought_player_icons,
        shiny_level, mythic_level, legend_level, special_level, coin_level,
        background, player_icon, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        username = VALUES(username),
        total_score = VALUES(total_score),
        pkmn_caught = VALUES(pkmn_caught),
        pkmn_list = VALUES(pkmn_list),
        tier1_solved = VALUES(tier1_solved),
        tier2_solved = VALUES(tier2_solved),
        tier3_solved = VALUES(tier3_solved),
        tier4_solved = VALUES(tier4_solved),
        tier5_solved = VALUES(tier5_solved),
        custom_solved = VALUES(custom_solved),
        bought_backgrounds = VALUES(bought_backgrounds),
        bought_player_icons = VALUES(bought_player_icons),
        shiny_level = VALUES(shiny_level),
        mythic_level = VALUES(mythic_level),
        legend_level = VALUES(legend_level),
        special_level = VALUES(special_level),
        coin_level = VALUES(coin_level),
        background = VALUES(background),
        player_icon = VALUES(player_icon),
        last_updated = VALUES(last_updated)`,
      [
        uuid,
        username,
        totalScore,
        pkmnCaught,
        JSON.stringify(pkmnList),
        tier1Solved,
        tier2Solved,
        tier3Solved,
        tier4Solved,
        tier5Solved,
        customSolved,
        JSON.stringify(boughtBackgrounds),
        JSON.stringify(boughtPlayerIcons),
        shinyLevel,
        mythicLevel,
        legendLevel,
        specialLevel,
        coinLevel,
        background,
        playerIcon,
        now,
      ],
      (err) => {
        if (err) {
          logWithTimestamp("Error updating user stats: " + err, "error");
          return res.status(500).json({ error: "Database error" });
        }
        res.json({ success: true, lastUpdated: now });
      }
    );
  } catch (error) {
    logWithTimestamp("Error handling update request: " + error.message, "error");
    res.status(400).json({ error: "Invalid request" });
  }
});

// /create-board removed — bingo lobbies are created via WebSocket (hostCreateLobby)


// -----------------------------------------------------------------------------
// Matching helpers
// -----------------------------------------------------------------------------
function getGenFromId(id) {
  if (id >= 1 && id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  if (id <= 905) return 8;
  if (id <= 1017) return 9;
  return null;
}

// Category lists
const CATEGORY_IDS = {
  // All starter Pokémon — full evolution lines, all 9 generations
  starter: new Set([
    1,2,3,4,5,6,7,8,9,                          // Gen 1
    152,153,154,155,156,157,158,159,160,         // Gen 2
    252,253,254,255,256,257,258,259,260,         // Gen 3
    387,388,389,390,391,392,393,394,395,         // Gen 4
    495,496,497,498,499,500,501,502,503,         // Gen 5
    650,651,652,653,654,655,656,657,658,         // Gen 6
    722,723,724,725,726,727,728,729,730,         // Gen 7
    810,811,812,813,814,815,816,817,818,         // Gen 8
    906,907,908,909,910,911,912,913,914,         // Gen 9
  ]),
  // Dog/canine/wolf Pokémon
  dog: new Set([
    58,59,                   // Growlithe, Arcanine
    133,136,197,             // Eevee, Flareon, Umbreon (kept from original)
    209,210,                 // Snubbull, Granbull
    228,229,                 // Houndour, Houndoom
    243,244,245,             // Raikou, Entei, Suicune
    261,262,                 // Poochyena, Mightyena
    263,264,                 // Zigzagoon, Linoone
    293,294,295,             // Whismur line (original)
    309,310,                 // Electrike, Manectric
    403,404,405,             // Shinx, Luxio, Luxray
    434,435,                 // Stunky, Skuntank
    447,448,                 // Riolu, Lucario
    506,507,508,             // Lillipup, Herdier, Stoutland
    509,510,                 // Purrloin, Liepard (original)
    676,700,                 // Furfrou, Sylveon
    734,735,                 // Yungoos, Gumshoos
    744,745,                 // Rockruff, Lycanroc
    827,828,                 // Nickit, Thievul
    835,836,                 // Yamper, Boltund
    888,889,                 // Zacian, Zamazenta
    926,927,                 // Maschiff, Mabosstiff
    942,943,                 // Fidough, Dachsbun
  ]),
  // Bird Pokémon
  bird: new Set([
    16,17,18,                // Pidgey, Pidgeotto, Pidgeot
    21,22,                   // Spearow, Fearow
    83,84,85,                // Farfetch'd, Doduo, Dodrio
    142,                     // Aerodactyl
    144,145,146,             // Articuno, Zapdos, Moltres
    163,164,                 // Hoothoot, Noctowl
    177,178,                 // Natu, Xatu
    187,188,189,             // Hoppip, Skiploom, Jumpluff
    198,                     // Murkrow
    225,                     // Delibird
    227,                     // Skarmory
    249,250,                 // Lugia, Ho-Oh
    276,277,278,279,         // Taillow, Swellow, Wingull, Pelipper
    333,334,                 // Swablu, Altaria
    396,397,398,             // Starly, Staravia, Staraptor
    430,441,468,             // Honchkrow, Chatot, Togekiss
    519,520,521,             // Pidove, Tranquill, Unfezant
    527,528,                 // Woobat, Swoobat
    561,                     // Sigilyph
    566,567,                 // Archen, Archeops
    580,581,                 // Ducklett, Swanna
    627,628,629,630,         // Rufflet, Braviary, Vullaby, Mandibuzz
    661,662,663,             // Fletchling, Fletchinder, Talonflame
    701,                     // Hawlucha
    714,715,                 // Noibat, Noivern
    731,732,733,             // Pikipek, Trumbeak, Toucannon
    741,                     // Oricorio
    821,822,823,             // Rookidee, Corvisquire, Corviknight
    845,                     // Cramorant
    931,                     // Squawkabilly
    940,941,                 // Wattrel, Kilowattrel
  ]),
  // Fish / aquatic Pokémon
  fish: new Set([
    118,119,                 // Goldeen, Seaking
    129,130,                 // Magikarp, Gyarados
    138,139,140,141,         // Omanyte, Omastar, Kabuto, Kabutops
    170,171,                 // Chinchou, Lanturn
    211,                     // Qwilfish
    222,                     // Corsola
    223,224,                 // Remoraid, Octillery
    318,319,                 // Carvanha, Sharpedo
    339,340,                 // Barboach, Whiscash
    349,350,                 // Feebas, Milotic
    366,367,368,             // Clamperl, Huntail, Gorebyss
    370,                     // Luvdisc
    422,423,                 // Shellos, Gastrodon
    456,457,                 // Finneon, Lumineon
    458,                     // Mantyke
    550,                     // Basculin
    592,593,594,             // Frillish, Jellicent, Alomomola
    692,693,                 // Clauncher, Clawitzer
    746,747,748,             // Wishiwashi, Mareanie, Toxapex
    779,                     // Bruxish
    846,847,                 // Arrokuda, Barraskewda
    882,883,                 // Dracovish, Arctovish
    963,964,965,             // Veluza, Finizen, Palafin
    976,977,                 // (Gen 9 water)
  ]),
  // Plant / grass Pokémon
  plant: new Set([
    1,2,3,                   // Bulbasaur line
    43,44,45,46,47,          // Oddish, Gloom, Vileplume, Paras, Parasect
    69,70,71,                // Bellsprout, Weepinbell, Victreebel
    102,103,                 // Exeggcute, Exeggutor
    114,465,                 // Tangela, Tangrowth
    152,153,154,             // Chikorita line
    182,                     // Bellossom
    187,188,189,             // Hoppip, Skiploom, Jumpluff
    191,192,                 // Sunkern, Sunflora
    252,253,254,             // Treecko line
    270,271,272,             // Lotad, Lombre, Ludicolo
    273,274,275,             // Seedot, Nuzleaf, Shiftry
    285,286,                 // Shroomish, Breloom
    315,                     // Roselia
    345,346,                 // Lileep, Cradily
    387,388,389,             // Turtwig line
    406,407,                 // Budew, Roserade
    412,420,421,             // Burmy, Cherubi, Cherrim
    455,459,460,             // Carnivine, Snover, Abomasnow
    492,                     // Shaymin
    495,496,497,             // Snivy line
    511,512,                 // Pansage, Simisage
    540,541,542,             // Sewaddle, Swadloon, Leavanny
    546,547,548,549,         // Cottonee, Whimsicott, Petilil, Lilligant
    556,                     // Maractus
    585,586,                 // Deerling, Sawsbuck
    590,591,                 // Foongus, Amoonguss
    597,598,                 // Ferroseed, Ferrothorn
    640,                     // Virizion
    650,651,652,             // Chespin line
    672,673,                 // Skiddo, Gogoat
    708,709,                 // Phantump, Trevenant
    710,711,                 // Pumpkaboo, Gourgeist
    722,723,724,             // Rowlet line
    753,754,                 // Fomantis, Lurantis
    755,756,                 // Morelull, Shiinotic
    761,762,763,764,         // Bounsweet, Steenee, Tsareena, Comfey
    810,811,812,             // Grookey line
    829,830,                 // Gossifleur, Eldegoss
    841,842,                 // Flapple, Appletun
    906,907,908,             // Sprigatito line
  ]),
  // Cat/feline Pokémon
  cat: new Set([
    52,53,                   // Meowth, Persian
    300,301,                 // Skitty, Delcatty
    431,432,                 // Glameow, Purugly
    509,510,                 // Purrloin, Liepard
    667,668,                 // Litleo, Pyroar
    677,678,                 // Espurr, Meowstic
    725,726,727,             // Litten, Torracat, Incineroar
    863,                     // Perrserker (Galarian Meowth evo)
    906,907,908,             // Sprigatito, Floragato, Meowscarada
  ]),
  // Mouse/rodent Pokémon
  mouse: new Set([
    19,20,                   // Rattata, Raticate
    25,26,172,               // Pikachu, Raichu, Pichu
    161,162,                 // Sentret, Furret
    183,184,                 // Marill, Azumarill
    311,312,                 // Plusle, Minun
    417,                     // Pachirisu
    587,                     // Emolga
    702,                     // Dedenne
    777,                     // Togedemaru
    877,                     // Morpeko
    924,925,                 // Tandemaus, Maushold
  ]),
  // Eevee and all its evolutions
  eevee: new Set([133,134,135,136,196,197,470,471,700]),
  // Cosmic / Ultra Beast / other-dimension Pokémon
  alien: new Set([
    35,36,173,               // Clefairy, Clefable, Cleffa
    120,121,                 // Staryu, Starmie
    201,                     // Unown
    337,338,                 // Lunatone, Solrock
    343,344,                 // Baltoy, Claydol
    384,                     // Rayquaza
    385,386,                 // Jirachi, Deoxys
    483,484,                 // Dialga, Palkia
    487,                     // Giratina
    491,                     // Darkrai
    605,606,                 // Elgyem, Beheeyem
    774,                     // Minior
    789,790,791,792,         // Cosmog, Cosmoem, Solgaleo, Lunala
    793,794,795,796,797,798,799, // Ultra Beasts (Nihilego–Guzzlord)
    800,                     // Necrozma
    803,804,805,806,         // Poipole, Naganadel, Stakataka, Blacephalon
    890,                     // Eternatus
  ]),
  // Machine / robot / mechanical Pokémon
  machine: new Set([
    81,82,462,               // Magnemite, Magneton, Magnezone
    100,101,                 // Voltorb, Electrode
    137,233,474,             // Porygon, Porygon2, Porygon-Z
    374,375,376,             // Beldum, Metang, Metagross
    379,                     // Registeel
    436,437,                 // Bronzor, Bronzong
    476,                     // Probopass
    479,                     // Rotom
    599,600,601,             // Klink, Klang, Klinklang
    623,                     // Golurk
    624,625,983,             // Pawniard, Bisharp, Kingambit
    649,                     // Genesect
    679,680,681,             // Honedge, Doublade, Aegislash
    707,                     // Klefki
    808,809,                 // Meltan, Melmetal
    990,991,992,993,994,995,1006, // Iron Treads–Iron Valiant
  ]),
  // Farm animal Pokémon
  farm: new Set([
    77,78,                   // Ponyta, Rapidash
    83,84,85,                // Farfetch'd, Doduo, Dodrio
    128,                     // Tauros
    179,180,181,             // Mareep, Flaaffy, Ampharos
    220,221,473,             // Swinub, Piloswine, Mamoswine
    241,                     // Miltank
    255,256,257,             // Torchic, Combusken, Blaziken
    325,326,                 // Spoink, Grumpig
    498,499,500,             // Tepig, Pignite, Emboar
    522,523,                 // Blitzle, Zebstrika
    626,                     // Bouffalant
    672,673,                 // Skiddo, Gogoat
    749,750,                 // Mudbray, Mudsdale
    831,832,                 // Wooloo, Dubwool
    915,916,                 // Lechonk, Oinkologne
  ]),
};

function taskMatchesCatch(task, catchData) {
  if (!task || task.id === -1) return false;

  const id = Number(catchData?.pokedexId || 0);
  if (!id) return false;

  const gen = getGenFromId(id);
  const types = (catchData?.types || []).map((t) => String(t || "").toLowerCase());
  const flags = catchData?.flags || {};

  // Preferred: rule-based matching
  if (task.rule && task.rule.kind) {
    const r = task.rule;

    if (r.kind === "gen") return gen === Number(r.gen);
    if (r.kind === "type") return types.includes(String(r.type).toLowerCase());

    if (r.kind === "flag") {
      const f = String(r.flag).toLowerCase();
      return !!flags[f];
    }

    if (r.kind === "pokedexExact") {
      const ruleId = Number(r.id);
      // If rule.id > 1010 it was stored with the task-id instead of the pokédex id (old bug).
      // Fall back to arithmetic: task.id = 50000 + pokedexId.
      if (ruleId > 1010 && task.id >= 50001 && task.id <= 51050) return id === task.id - 50000;
      return id === ruleId;
    }
    if (r.kind === "pokedexRange") return id >= Number(r.start) && id <= Number(r.end);

    if (r.kind === "category") {
      const cat = String(r.category).toLowerCase();
      const set = CATEGORY_IDS[cat];
      return !!set && set.has(id);
    }
    return false;
  }

  // Fallback for older tasks (id-based)
  if (task.id >= 10001 && task.id <= 10009) return gen === (task.id - 10000);
  if (task.id >= 10010 && task.id <= 10022) {
    const type = String(task.name || "").toLowerCase().split("-")[0];
    return types.includes(type);
  }
  if (task.id === 20009) return !!flags.mega;
  if (task.id === 20010) return !!flags.gmax;
  if (task.id === 20011) return !!flags.hisuian;
  if (task.id === 20012) return !!flags.alolan;
  if (task.id === 20013) return CATEGORY_IDS.starter.has(id);
  if (task.id === 20014) return CATEGORY_IDS.dog.has(id);
  if (task.id === 20015) return CATEGORY_IDS.bird.has(id);
  if (task.id === 20016) return CATEGORY_IDS.fish.has(id);
  if (task.id === 20017) return CATEGORY_IDS.plant.has(id);
  if (task.id === 20018) return CATEGORY_IDS.cat.has(id);
  if (task.id === 20019) return CATEGORY_IDS.mouse.has(id);
  if (task.id === 20020) return CATEGORY_IDS.eevee.has(id);
  if (task.id === 20021) return CATEGORY_IDS.alien.has(id);
  if (task.id === 20022) return CATEGORY_IDS.machine.has(id);
  if (task.id === 20023) return CATEGORY_IDS.farm.has(id);
  if (task.id === 30001) return !!flags.shiny;
  if (task.id === 30002) return !!flags.legendary;
  if (task.id === 30003) return !!flags.mythic;

  if (task.id >= 50001 && task.id <= 51050) return id === task.id - 50000;
  if (task.id >= 40001 && task.id <= 41000) {
    const start = task.id - 40000;
    const end = start + 9;
    return id >= start && id <= end;
  }

  return false;
}

// -----------------------------------------------------------------------------
// ADMIN: Memory usage endpoint (password protected)
// -----------------------------------------------------------------------------
app.get("/admin/mem", (req, res) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });

  const mem = process.memoryUsage(); // bytes
  const toMB = (b) => Math.round((b / 1024 / 1024) * 10) / 10;

  // Optional extra: how many lobbies/players/events currently in memory
  let players = 0;
  let events = 0;
  for (const l of ACTIVE_LOBBIES.values()) {
    players += l.players?.size || 0;
    events += l.events?.length || 0;
  }

  res.json({
    ok: true,
    ts: Date.now(),
    memBytes: mem,
    memMB: {
      rss: toMB(mem.rss),
      heapTotal: toMB(mem.heapTotal),
      heapUsed: toMB(mem.heapUsed),
      external: toMB(mem.external),
      arrayBuffers: toMB(mem.arrayBuffers || 0),
    },
    lobbies: ACTIVE_LOBBIES.size,
    players,
    events,
    retryTrackerSize: retryTracker.size,
  });
});

// -----------------------------------------------------------------------------
// ADMIN STATS (existing)
// -----------------------------------------------------------------------------
app.get("/admin-stats", async (req, res) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) {
    logWithTimestamp("Unauthorized admin-stats attempt.", "warning");
    return res.status(403).json({ error: "Unauthorized access" });
  }

  try {
    const queries = {
      uniqueUsersToday: `
        SELECT COUNT(DISTINCT uuid) AS count
        FROM user_uuids
        WHERE DATE(CONVERT_TZ(last_updated, '+00:00', '+02:00')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+02:00'))
      `,
      uniqueUsersWeek: `
        SELECT COUNT(DISTINCT uuid) AS count
        FROM user_uuids
        WHERE YEARWEEK(CONVERT_TZ(last_updated, '+00:00', '+02:00'), 1) = YEARWEEK(CONVERT_TZ(NOW(), '+00:00', '+02:00'), 1)
      `,
      uniqueUsersMonth: `
        SELECT COUNT(DISTINCT uuid) AS count
        FROM user_uuids
        WHERE YEAR(CONVERT_TZ(last_updated, '+00:00', '+02:00')) = YEAR(CONVERT_TZ(NOW(), '+00:00', '+02:00'))
          AND MONTH(CONVERT_TZ(last_updated, '+00:00', '+02:00')) = MONTH(CONVERT_TZ(NOW(), '+00:00', '+02:00'))
      `,
      createdToday: `
        SELECT COUNT(DISTINCT uuid) AS count
        FROM user_uuids
        WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+02:00')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+02:00'))
      `,
      createdWeek: `
        SELECT COUNT(DISTINCT uuid) AS count
        FROM user_uuids
        WHERE YEARWEEK(CONVERT_TZ(created_at, '+00:00', '+02:00'), 1) = YEARWEEK(CONVERT_TZ(NOW(), '+00:00', '+02:00'), 1)
      `,
      createdMonth: `
        SELECT COUNT(DISTINCT uuid) AS count
        FROM user_uuids
        WHERE YEAR(CONVERT_TZ(created_at, '+00:00', '+02:00')) = YEAR(CONVERT_TZ(NOW(), '+00:00', '+02:00'))
          AND MONTH(CONVERT_TZ(created_at, '+00:00', '+02:00')) = MONTH(CONVERT_TZ(NOW(), '+00:00', '+02:00'))
      `,
      returnedToday: `
        SELECT COUNT(DISTINCT uuid) AS count
        FROM user_uuids
        WHERE DATE(CONVERT_TZ(last_updated, '+00:00', '+02:00')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+02:00'))
          AND DATE(CONVERT_TZ(created_at, '+00:00', '+02:00')) != DATE(CONVERT_TZ(NOW(), '+00:00', '+02:00'))
      `,
      returnedWeek: `
        SELECT COUNT(DISTINCT uuid) AS count
        FROM user_uuids
        WHERE YEARWEEK(CONVERT_TZ(last_updated, '+00:00', '+02:00'), 1) = YEARWEEK(CONVERT_TZ(NOW(), '+00:00', '+02:00'), 1)
          AND YEARWEEK(CONVERT_TZ(created_at, '+00:00', '+02:00'), 1) != YEARWEEK(CONVERT_TZ(NOW(), '+00:00', '+02:00'), 1)
      `,
      returnedMonth: `
        SELECT COUNT(DISTINCT uuid) AS count
        FROM user_uuids
        WHERE YEAR(CONVERT_TZ(last_updated, '+00:00', '+02:00')) = YEAR(CONVERT_TZ(NOW(), '+00:00', '+02:00'))
          AND MONTH(CONVERT_TZ(last_updated, '+00:00', '+02:00')) = MONTH(CONVERT_TZ(NOW(), '+00:00', '+02:00'))
          AND (YEAR(CONVERT_TZ(created_at, '+00:00', '+02:00')) != YEAR(CONVERT_TZ(NOW(), '+00:00', '+02:00'))
               OR MONTH(CONVERT_TZ(created_at, '+00:00', '+02:00')) != MONTH(CONVERT_TZ(NOW(), '+00:00', '+02:00')))
      `,
      totalUsers: `
        SELECT COUNT(DISTINCT uuid) AS count
        FROM user_uuids
      `,
    };

    const stats = {};
    const connection = pool.promise();

    for (const [key, query] of Object.entries(queries)) {
      const [rows] = await connection.query(query);
      stats[key] = rows[0].count;
    }

    const logFilePath = path.resolve(process.env.HOME, ".pm2", "logs", "pokemathServer-out.log");
    let logs = [];
    try {
      const logData = fs.readFileSync(logFilePath, "utf8");
      logs = logData.split("\n").slice(-100);
    } catch (logError) {
      logWithTimestamp("Error reading PM2 log file: " + logError, "error");
      logs = ["Unable to read logs."];
    }

    stats.logs = logs;
    stats.activeMathNow = activeMathSessions.size;
    res.json(stats);
    logWithTimestamp("Admin stats successfully fetched and sent.");
  } catch (error) {
    logWithTimestamp("Error fetching admin stats: " + error.message, "error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// -----------------------------------------------------------------------------
// ACTIVE MATH SESSIONS (in-memory heartbeat tracker)
// -----------------------------------------------------------------------------
const activeMathSessions = new Map(); // uuid → lastSeen timestamp

app.post("/math-ping", (req, res) => {
  const uuid = req.body?.uuid;
  if (uuid && typeof uuid === "string" && uuid.length < 64) {
    activeMathSessions.set(uuid, Date.now());
  }
  res.json({ ok: true });
});

setInterval(() => {
  const cutoff = Date.now() - 420_000; // 7 minutes
  for (const [uuid, ts] of activeMathSessions) {
    if (ts < cutoff) activeMathSessions.delete(uuid);
  }
}, 60_000);

// -----------------------------------------------------------------------------
// REALTIME BINGO LOBBIES (in-memory) + WS HANDLERS (HARDENED)
// -----------------------------------------------------------------------------
const ACTIVE_LOBBIES = new Map();

// --- Lobby DB persistence ---------------------------------------------------
const pendingLobbySaves = new Map(); // code → timeout handle

function queueLobbySave(lobby) {
  if (pendingLobbySaves.has(lobby.code)) return; // already queued
  const handle = setTimeout(() => {
    pendingLobbySaves.delete(lobby.code);
    saveLobbyToDB(lobby).catch(e => logWithTimestamp("saveLobbyToDB error: " + e, "error"));
  }, 5000); // debounce: write at most once per 5s per lobby
  pendingLobbySaves.set(lobby.code, handle);
}

async function saveLobbyToDB(lobby) {
  const players = [...lobby.players.values()].map(p => ({
    uuid: p.uuid, name: p.name, icon: p.icon || null,
    catchCount: p.catchCount, lastDifficulty: p.lastDifficulty, connected: false
  }));
  await pool.promise().query(
    `INSERT INTO bingo_lobbies
       (code, teacher_id, teacher_name, teacher_email, board_json, settings_json,
        total_catches, players_json, events_json, created_at, last_activity, ended, locked)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?)
     ON DUPLICATE KEY UPDATE
       board_json=VALUES(board_json), total_catches=VALUES(total_catches),
       players_json=VALUES(players_json), events_json=VALUES(events_json),
       last_activity=VALUES(last_activity), locked=VALUES(locked)`,
    [
      lobby.code, lobby.teacherId, lobby.teacherName, lobby.teacherEmail,
      JSON.stringify(lobby.board), JSON.stringify(lobby.settings || {}),
      lobby.totalCatches,
      JSON.stringify(players),
      JSON.stringify(lobby.events.slice(-200)),
      lobby.createdAt, lobby.lastActivity,
      lobby.locked ? 1 : 0,
    ]
  );
}

async function loadLobbyFromDB(code) {
  const [rows] = await pool.promise().query(
    "SELECT * FROM bingo_lobbies WHERE code = ? AND ended = 0", [code]
  );
  if (!rows.length) return null;
  const row = rows[0];
  const board = JSON.parse(row.board_json);
  const settings = JSON.parse(row.settings_json || "{}");
  const playersArr = JSON.parse(row.players_json || "[]");
  const events = JSON.parse(row.events_json || "[]");

  const playerMap = new Map();
  for (const p of playersArr) {
    playerMap.set(p.uuid, { ...p, connected: false, lastSeen: null, ws: null });
  }

  return {
    code: row.code,
    createdAt: row.created_at,
    lastActivity: Date.now(),
    totalCatches: row.total_catches,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    teacherEmail: row.teacher_email,
    settings,
    board,
    locked: !!row.locked,
    hostWs: null,
    players: playerMap,
    events,
  };
}

const CODE_ALPHABET = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I, no O
function generateLobbyCode(len = 6) {
  for (let tries = 0; tries < 50; tries++) {
    let out = "";
    for (let i = 0; i < len; i++) {
      out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    if (!ACTIVE_LOBBIES.has(out)) return out;
  }
  return crypto.randomBytes(6).toString("hex").toUpperCase().slice(0, 6);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildTaskBoard(settings) {
  const difficulty = (settings?.difficulty || "easy").toLowerCase();
  const config = (difficultyConfig && (difficultyConfig[difficulty] || difficultyConfig.easy)) || {
    easy: 16,
    medium: 7,
    hard: 0,
    extreme: 0,
    random: 1,
    randomRange: 0,
  };

  let available = [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  if (difficulty === "unik") {
    available = generateUniqueIdTasks(24);
  } else {
    available = available.concat(shuffleArray(safeTasks.filter((t) => t.difficulty === "easy")).slice(0, config.easy));
    available = available.concat(shuffleArray(safeTasks.filter((t) => t.difficulty === "medium")).slice(0, config.medium));
    available = available.concat(shuffleArray(safeTasks.filter((t) => t.difficulty === "hard")).slice(0, config.hard));
    available = available.concat(shuffleArray(safeTasks.filter((t) => t.difficulty === "extreme")).slice(0, config.extreme));
    for (let i = 0; i < (config.random || 0); i++) available.push(generateRandomNumberTaskSafe());
    for (let i = 0; i < (config.randomRange || 0); i++) available.push(generateRandomRangeTaskSafe());
  }

  const cardTasks = shuffleArray(available).slice(0, 24);

  const cells = [];
  let taskPtr = 0;

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const cellId = String.fromCharCode(65 + c) + (r + 1); // A1..E5

      if (r === 2 && c === 2) {
        cells.push({
          cellId,
          free: true,
          marked: true,
          markedBy: "FREE",
          markedAt: Date.now(),
          hits: 0,
          task: { id: -1, name: "FREE SPACE", description: "", image: "images/compass.png" },
        });
      } else {
        const task = cardTasks[taskPtr++];
        if (!task) {
          cells.push({
            cellId,
            free: false,
            marked: false,
            markedBy: null,
            markedAt: null,
            hits: 0,
            task: { id: 999999, name: "Oppgave mangler", description: "Sjekk server-logg", image: "" },
          });
        } else {
          cells.push({
            cellId,
            free: false,
            marked: false,
            markedBy: null,
            markedAt: null,
            hits: 0,
            task,
          });
        }
      }
    }
  }

  return { difficulty, rows: 5, cols: 5, cells };
}

function wsSendSafe(ws, obj) {
  try {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  } catch (_) {}
}

function lobbyPlayersArray(lobby) {
  return [...lobby.players.values()].map((p) => ({
    uuid: p.uuid,
    name: p.name,
    icon: p.icon || null,
    connected: p.connected,
    lastDifficulty: p.lastDifficulty || null,
    lastCatch: p.lastCatch || null,
    lastSeen: p.lastSeen || null,
    catchCount: p.catchCount || 0,
  }));
}

// --- WS keepalive with terminate-on-no-pong (prevents leaked sockets) --------
wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => (ws.isAlive = true));
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    try { ws.ping(); } catch {}
  });
}, 30000);

let wsConnCount = 0;

wss.on("connection", (ws) => {
  wsConnCount++;

  ws.__role = "unknown";
  ws.__lobbyCode = null;
  ws.__uuid = null;

  ws.on("message", async (raw) => {
    try {
      let data;
      try {
        data = JSON.parse(raw.toString());
      } catch (err) {
        logWithTimestamp("Failed to parse WebSocket message: " + err, "error");
        wsSendSafe(ws, { type: "error", message: "Ugyldig melding (JSON)." });
        return;
      }

      // ---------------- HOST create lobby ----------------
      if (data.type === "hostCreateLobby") {
        try {
          const teacherSession = (data.teacherSession || "").toString();
          const teacher = verifyTeacherSession(teacherSession);
          if (!teacher) {
            wsSendSafe(ws, { type: "error", message: "Ugyldig lærer-innlogging." });
            return;
          }

          const settings = data.settings || {};
          const code = generateLobbyCode(6);
          const board = buildTaskBoard(settings);

          const lobby = {
            code,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            totalCatches: 0,
            teacherId: teacher.id,
            teacherName: teacher.name,
            teacherEmail: teacher.email,
            settings: { difficulty: board.difficulty, rows: 5, cols: 5, ruleSet: "tasks", minLevel: settings.minLevel || "alle", className: (settings.className || "").toString().trim().slice(0, 40), prizeType: (settings.prizeType || "random").toString() },
            board,
            hostWs: ws,
            players: new Map(),
            events: [],
          };

          ACTIVE_LOBBIES.set(code, lobby);
          queueLobbySave(lobby);

          ws.__role = "host";
          ws.__lobbyCode = code;

          logWithTimestamp(`Bingo lobby created: ${code} by teacher ${teacher.email}`);
          logToLobby(lobby, `LOBBY CREATED by ${teacher.name} (${teacher.email}) | difficulty=${board.difficulty}`);

          wsSendSafe(ws, {
            type: "lobbyCreated",
            code,
            board: lobby.board,
            players: lobbyPlayersArray(lobby),
            totalCatches: lobby.totalCatches,
            className: lobby.settings.className || "",
          });
        } catch (err) {
          logWithTimestamp("hostCreateLobby ERROR: " + (err?.stack || err), "error");
          wsSendSafe(ws, { type: "error", message: "Serverfeil ved oppretting av lobby (se logs)." });
        }
        return;
      }

      // ---------------- HOST join lobby ----------------
      if (data.type === "hostJoinLobby") {
        const teacherSession = (data.teacherSession || "").toString();
        const teacher = verifyTeacherSession(teacherSession);
        const code = (data.code || "").toString().toUpperCase();

        if (!teacher) {
          wsSendSafe(ws, { type: "error", message: "Ugyldig lærer-innlogging." });
          return;
        }

        let lobby = ACTIVE_LOBBIES.get(code);
        let restored = false;

        if (!lobby || lobby.teacherId !== teacher.id) {
          // Not in memory — try restoring from DB
          try {
            const fromDb = await loadLobbyFromDB(code);
            if (fromDb && fromDb.teacherId === teacher.id) {
              fromDb.hostWs = ws;
              ACTIVE_LOBBIES.set(code, fromDb);
              lobby = fromDb;
              restored = true;
              logWithTimestamp(`Lobby ${code} restored from DB for ${teacher.email}`);
            }
          } catch (e) {
            logWithTimestamp("loadLobbyFromDB error: " + e, "error");
          }
        }

        if (!lobby) {
          wsSendSafe(ws, { type: "lobbyNotFound", code });
          return;
        }

        lobby.hostWs = ws;
        lobby.lastActivity = Date.now();

        ws.__role = "host";
        ws.__lobbyCode = code;

        wsSendSafe(ws, {
          type: "lobbyState",
          code,
          board: lobby.board,
          players: lobbyPlayersArray(lobby),
          events: lobby.events.slice(-50),
          totalCatches: lobby.totalCatches || 0,
          restored,
          className: lobby.settings?.className || "",
        });
        return;
      }

      // ---------------- STUDENT join ----------------
      if (data.type === "joinLobby") {
        const code = (data.code || "").toString().toUpperCase();
        const uuid = (data.uuid || "").toString();
        const name =
          (typeof data.name === "string" && data.name.trim())
            ? data.name.trim().slice(0, 32)
            : "Ash";
        const icon =
          (typeof data.icon === "string" && /^[\w-]{1,64}$/.test(data.icon.trim()))
            ? data.icon.trim()
            : null;

        const lobby = ACTIVE_LOBBIES.get(code);
        if (!lobby) {
          wsSendSafe(ws, { type: "joinResult", ok: false, message: "Ugyldig kode." });
          return;
        }

        if (!uuid || !isValidUUID(uuid)) {
          wsSendSafe(ws, { type: "joinResult", ok: false, message: "Mangler eller ugyldig UUID." });
          return;
        }

        if (!lobby.players.has(uuid) && lobby.players.size >= MAX_LOBBY_PLAYERS) {
          wsSendSafe(ws, { type: "joinResult", ok: false, message: "Lobbyen er full." });
          return;
        }

        lobby.lastActivity = Date.now();

        let player = lobby.players.get(uuid);
        if (!player) {
          player = {
            uuid,
            name,
            icon,
            connected: true,
            lastDifficulty: null,
            lastCatch: null,
            catchCount: 0,
            lastSeen: Date.now(),
          };
          lobby.players.set(uuid, player);
        } else {
          player.name = name;
          if (icon) player.icon = icon;
          player.connected = true;
          player.lastSeen = Date.now();
        }

        ws.__role = "student";
        ws.__lobbyCode = code;
        ws.__uuid = uuid;

        wsSendSafe(ws, {
          type: "joinResult",
          ok: true,
          code,
          settings: lobby.settings,
          boardMeta: { rows: lobby.board.rows, cols: lobby.board.cols, difficulty: lobby.board.difficulty },
        });

        wsSendSafe(lobby.hostWs, { type: "playersUpdate", players: lobbyPlayersArray(lobby) });
        queueLobbySave(lobby);

        // Deliver any pending admin popups this student hasn't seen yet
        if (lobby.pendingPopups?.length) {
          for (const popup of lobby.pendingPopups) {
            if (!popup.seenBy.has(uuid)) {
              wsSendSafe(ws, { type: "adminPopup", message: popup.message, duration: popup.duration, position: popup.position });
              popup.seenBy.add(uuid);
            }
          }
        }

        // Notify student if they have unclaimed prizes waiting in DB
        pool.query("SELECT id FROM bingo_prizes WHERE uuid = ? AND claimed = 0 LIMIT 1", [uuid], (err, rows) => {
          if (!err && rows && rows.length > 0) {
            wsSendSafe(ws, { type: "bingoReward", code });
          }
        });

        logWithTimestamp(`Student joined lobby ${code}: name="${name}" uuid=${uuid}`);
        logToLobby(lobby, `STUDENT ${player.catchCount > 0 ? "REJOINED" : "JOINED"} | name="${name}" uuid=${uuid}`);
        return;
      }

      // ---------------- STUDENT catch ----------------
      if (data.type === "catchPokemon") {
        const code = (data.code || "").toString().toUpperCase();
        const lobby = ACTIVE_LOBBIES.get(code);
        if (!lobby) return;

        lobby.lastActivity = Date.now();

        const uuid = (data.uuid || "").toString();
        const name =
          (typeof data.name === "string" && data.name.trim())
            ? data.name.trim().slice(0, 32)
            : "Ash";

        const difficulty = (data.difficulty || "").toString().slice(0, 16);
        const pokemonCode = (data.pokemonCode || "").toString().slice(0, 32);

        if (!uuid || !isValidUUID(uuid) || !pokemonCode) return;

        // Reject catches if lobby is locked (full board achieved)
        if (lobby.locked) return;

        // Per-player catch rate limiting
        const rateKey = `${code}:${uuid}`;
        const now = Date.now();
        const rate = catchRateMap.get(rateKey) || { count: 0, windowStart: now };
        if (now - rate.windowStart > CATCH_WINDOW_MS) {
          rate.count = 0;
          rate.windowStart = now;
        }
        rate.count++;
        catchRateMap.set(rateKey, rate);
        if (rate.count > CATCH_PER_WINDOW) return; // silently drop flood

        // Min-level check
        const minLevel = lobby.settings?.minLevel || "alle";
        const catchDifficultyRaw = (data.difficulty || "").toString();
        let belowLevel = false;
        if (minLevel !== "alle") {
          const minNum = parseInt(minLevel.replace("stage", ""), 10);
          const catchNum = catchDifficultyRaw.startsWith("stage")
            ? parseInt(catchDifficultyRaw.replace("stage", ""), 10)
            : null;
          belowLevel = catchNum !== null && catchNum < minNum;
        }

        const player =
          lobby.players.get(uuid) || {
            uuid,
            name: name || "Ash",
            connected: true,
            lastDifficulty: null,
            lastCatch: null,
            catchCount: 0,
            lastSeen: Date.now(),
          };

        player.name = name || player.name;
        player.lastDifficulty = difficulty || player.lastDifficulty;
        player.lastCatch = pokemonCode;
        player.lastSeen = Date.now();
        player.connected = true;
        lobby.players.set(uuid, player);

        // If below min level: log it but don't count catch or affect board
        if (belowLevel) {
          const belowEvent = {
            ts: Date.now(), uuid, name: player.name,
            difficulty: catchDifficultyRaw, pokemonCode,
            pokedexId: Number(data.pokedexId ?? 0),
            pokemonName: data.pokemonName || null,
            types: data.types || [], flags: data.flags || {},
            matched: false, belowLevel: true,
          };
          lobby.events.push(belowEvent);
          if (lobby.events.length > 200) lobby.events.splice(0, lobby.events.length - 200);
          wsSendSafe(lobby.hostWs, { type: "toastCatch", ...belowEvent });
          wsSendSafe(lobby.hostWs, { type: "playersUpdate", players: lobbyPlayersArray(lobby) });
          return;
        }

        player.catchCount = (player.catchCount || 0) + 1;
        lobby.totalCatches = (lobby.totalCatches || 0) + 1;

        const catchData = {
          pokemonCode,
          pokedexId: Number(data.pokedexId ?? 0),
          types: data.types || [],
          flags: data.flags || {},
        };

        const matchedCells = [];
        for (const cell of lobby.board.cells) {
          if (cell.free) continue;
          if (taskMatchesCatch(cell.task, catchData)) matchedCells.push(cell);
        }

        for (const cell of matchedCells) {
          cell.hits = (cell.hits || 0) + 1;
          if (!cell.marked) {
            cell.marked = true;
            cell.markedBy = uuid;
            cell.markedAt = Date.now();
          }
        }

        const matched = matchedCells.length > 0;
        const matchedCellIds = matchedCells.map((c) => c.cellId);
        const matchedTaskNames = matchedCells.map((c) => c.task?.name).filter(Boolean);

        const event = {
          ts: Date.now(),
          uuid,
          name: player.name,
          difficulty: player.lastDifficulty,
          pokemonCode,
          pokedexId: catchData.pokedexId,
          pokemonName: data.pokemonName || null,
          types: catchData.types,
          flags: catchData.flags,
          matched,
          matchedCells: matchedCellIds,
          totalCatches: lobby.totalCatches
        };

        lobby.events.push(event);
        if (lobby.events.length > 200) lobby.events.splice(0, lobby.events.length - 200);

        wsSendSafe(lobby.hostWs, {
          type: "toastCatch",
          uuid,
          name: player.name,
          pokemonCode,
          matched,
          matchedCells: matchedCellIds,
          matchedTaskNames,
          pokedexId: catchData.pokedexId,
          flags: catchData.flags,
          types: catchData.types,
          pokemonName: data.pokemonName || null,
          difficulty: player.lastDifficulty,
          totalCatches: lobby.totalCatches,
        });

        wsSendSafe(lobby.hostWs, {
          type: "boardUpdate",
          board: lobby.board,
          lastEvent: event,
          totalCatches: lobby.totalCatches,
        });

        wsSendSafe(lobby.hostWs, { type: "playersUpdate", players: lobbyPlayersArray(lobby) });

        const matchLog = matched
          ? `HIT cells=[${matchedCellIds.join(",")}] tasks=[${matchedTaskNames.join(", ")}]`
          : "NO MATCH";
        logToLobby(lobby, `CATCH | player="${player.name}" uuid=${uuid} pokemon=${pokemonCode} (dex#${catchData.pokedexId}) diff=${difficulty} ${matchLog} | totalCatches=${lobby.totalCatches}`);
        queueLobbySave(lobby);
        return;
      }

      // ---------------- HOST lock lobby (full board) ----------------
      if (data.type === "hostLockLobby") {
        const code = (data.code || "").toString().toUpperCase();
        const teacherSession = (data.teacherSession || "").toString();
        const teacher = verifyTeacherSession(teacherSession);
        const lobby = ACTIVE_LOBBIES.get(code);
        if (!teacher || !lobby || lobby.teacherId !== teacher.id) return;
        if (lobby.locked) return; // idempotent

        lobby.locked = true;
        logToLobby(lobby, `LOBBY LOCKED – full board achieved | totalCatches=${lobby.totalCatches}`);

        // Award prizes to eligible players (caught ≥ 1 pokemon)
        const eligible = [...lobby.players.values()].filter(p => (p.catchCount || 0) > 0);
        const prizeType = lobby.settings?.prizeType || "random";
        // generateBingoPrize returns array for shiny (3 different), single object otherwise
        const basePrize = generateBingoPrize(prizeType, lobby.settings?.difficulty || "medium");
        const prizes = Array.isArray(basePrize) ? basePrize : [basePrize];

        logToLobby(lobby, `PRIZE: eligible=${eligible.length} | ${JSON.stringify(prizes)}`);

        // Build per-player prize rows: one DB row per prize item
        const perPlayerPrizes = new Map(); // uuid → prize[] for host display / WS notify
        const vals = [];
        for (const p of eligible) {
          let playerPrizes;
          if (prizes[0]?.type === "participation_coins") {
            const pot = 2000 * eligible.length + 50 * (lobby.totalCatches || 0);
            const totalCatches = eligible.reduce((s, pl) => s + (pl.catchCount || 0), 0);
            const share = totalCatches > 0
              ? Math.floor(pot * (p.catchCount || 0) / totalCatches)
              : Math.floor(pot / eligible.length);
            logToLobby(lobby, `PRIZE SHARE | player="${p.name}" uuid=${p.uuid} catches=${p.catchCount} share=${share} (pot=${pot}, totalCatches=${totalCatches})`);
            playerPrizes = [{ type: "coins", amount: share, participationPot: pot }];
          } else if (prizes[0]?.type === "per_catch_coins") {
            const share = 50 * (p.catchCount || 0);
            logToLobby(lobby, `PRIZE SHARE | player="${p.name}" uuid=${p.uuid} catches=${p.catchCount} coins=${share} (50×catches)`);
            playerPrizes = [{ type: "coins", amount: share }];
          } else {
            playerPrizes = prizes; // same set for everyone (shiny: 3 different per player)
          }
          perPlayerPrizes.set(p.uuid, playerPrizes);
          for (const pr of playerPrizes) vals.push([code, p.uuid, JSON.stringify(pr)]);
        }

        if (eligible.length > 0) {
          try {
            await pool.promise().query("INSERT INTO bingo_prizes (bingo_code, uuid, prize_json) VALUES ?", [vals]);
          } catch (e) {
            logWithTimestamp("Failed to store bingo prizes: " + e, "error");
          }
          // Notify connected eligible students (reward arrives before lobbyEnded)
          for (const client of wss.clients) {
            if (client.__lobbyCode === code && client.__role === "student") {
              const playerPrizes = perPlayerPrizes.get(client.__uuid);
              if (playerPrizes) wsSendSafe(client, { type: "bingoReward", prizes: playerPrizes, code });
            }
          }
        }

        // Tell host the prize details (first prize entry is representative)
        const firstPrize = prizes[0] || {};
        const hostPrize = firstPrize.type === "participation_coins"
          ? { type: "participation_coins", pot: 2000 * eligible.length }
          : prizes;
        wsSendSafe(ws, { type: "lobbyPrize", prize: hostPrize, eligibleCount: eligible.length, code });

        // Persist locked=1 immediately so server restarts don't re-award prizes
        saveLobbyToDB(lobby).catch(e => logWithTimestamp("Failed to save locked lobby: " + e, "error"));

        // Tell all students the lobby is done
        for (const client of wss.clients) {
          if (client.__lobbyCode === code && client.__role === "student") {
            wsSendSafe(client, { type: "lobbyEnded", code });
          }
        }
        return;
      }

      // ---------------- HOST manually mark/unmark cell ----------------
      if (data.type === "hostMarkCell") {
        const code = (data.code || "").toString().toUpperCase();
        const teacherSession = (data.teacherSession || "").toString();
        const teacher = verifyTeacherSession(teacherSession);
        const lobby = ACTIVE_LOBBIES.get(code);

        if (!teacher || !lobby || lobby.teacherId !== teacher.id) return;

        const cellId = (data.cellId || "").toString();
        const mark = data.mark !== false; // default true = mark as done
        const cell = lobby.board.cells.find(c => c.cellId === cellId);
        if (!cell || cell.free) return;

        if (cell.marked === mark) return; // no change

        cell.marked = mark;
        if (mark) {
          cell.markedBy = "HOST";
          cell.markedAt = Date.now();
          cell.hits = (cell.hits || 0) + 1;
        } else {
          cell.markedBy = null;
          cell.markedAt = null;
        }

        const event = {
          ts: Date.now(),
          uuid: "HOST",
          name: "Lærer",
          pokemonCode: "",
          pokedexId: null,
          pokemonName: mark
            ? `Manuell godkjenning: ${cell.task?.name || cellId}`
            : `Godkjenning fjernet: ${cell.task?.name || cellId}`,
          types: [],
          flags: {},
          matched: mark,
          matchedCells: mark ? [cellId] : [],
          totalCatches: lobby.totalCatches,
        };

        lobby.events.push(event);
        if (lobby.events.length > 200) lobby.events.splice(0, lobby.events.length - 200);

        wsSendSafe(lobby.hostWs, {
          type: "boardUpdate",
          board: lobby.board,
          lastEvent: event,
          totalCatches: lobby.totalCatches,
        });

        logToLobby(lobby, `HOST MARK | cell=${cellId} task="${cell.task?.name}" mark=${mark}`);
        queueLobbySave(lobby);
        return;
      }

      // ---------------- HOST end lobby ----------------
      if (data.type === "hostEndLobby") {
        const code = (data.code || "").toString().toUpperCase();
        const teacherSession = (data.teacherSession || "").toString();
        const teacher = verifyTeacherSession(teacherSession);
        const lobby = ACTIVE_LOBBIES.get(code);

        if (!teacher || !lobby || lobby.teacherId !== teacher.id) return;

        logToLobby(lobby, `LOBBY ENDED by host | totalCatches=${lobby.totalCatches} players=${lobby.players.size}`);

        // Notify all students so they clear their stored code
        for (const client of wss.clients) {
          if (client.__lobbyCode === code && client.__role === "student") {
            wsSendSafe(client, { type: "lobbyEnded", code });
          }
        }

        ACTIVE_LOBBIES.delete(code);
        pool.query("UPDATE bingo_lobbies SET ended=1 WHERE code=?", [code], () => {});
        wsSendSafe(ws, { type: "ended", code });
        logWithTimestamp(`Lobby ended: ${code}`);
        return;
      }

    } catch (err) {
      logWithTimestamp("WS MESSAGE HANDLER CRASH: " + (err?.stack || err), "error");
      wsSendSafe(ws, { type: "error", message: "Serverfeil i WS-handler (se logs)." });
    }
  });

  ws.on("close", (e) => {
    const code = ws.__lobbyCode;
    logWithTimestamp(
      `WS closed role=${ws.__role} lobby=${code || "-"} code=${e?.code} reason=${e?.reason || "-"}`,
      "warning"
    );

    if (!code) return;
    const lobby = ACTIVE_LOBBIES.get(code);
    if (!lobby) return;

    if (ws.__role === "host") {
      lobby.hostWs = null;
      logToLobby(lobby, `HOST DISCONNECTED | totalCatches=${lobby.totalCatches} players=${lobby.players.size}`);
    } else if (ws.__role === "student") {
      const uuid = ws.__uuid;
      const p = lobby.players.get(uuid);
      if (p) {
        p.connected = false;
        p.lastSeen = Date.now();
        lobby.players.set(uuid, p);
        logToLobby(lobby, `STUDENT DISCONNECTED | name="${p.name}" uuid=${uuid} catches=${p.catchCount}`);
        wsSendSafe(lobby.hostWs, { type: "playersUpdate", players: lobbyPlayersArray(lobby) });
      }
    }
  });
});

// -----------------------------------------------------------------------------
// TEACHER AUTH
// -----------------------------------------------------------------------------
function hashPassword(password, salt) {
  const iterations = 120000;
  const keylen = 32;
  const digest = "sha256";
  const derived = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);
  return `${iterations}.${salt}.${derived.toString("hex")}`;
}

function verifyPassword(password, stored) {
  try {
    const [iterationsStr, salt, hashHex] = stored.split(".");
    const iterations = Number(iterationsStr);
    const keylen = Buffer.from(hashHex, "hex").length;
    const derived = crypto.pbkdf2Sync(password, salt, iterations, keylen, "sha256").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hashHex, "hex"), Buffer.from(derived, "hex"));
  } catch {
    return false;
  }
}

function signTeacherSession(payloadObj) {
  if (!SECRET_KEY) throw new Error("SECRET_KEY is missing (needed for teacher sessions).");
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET_KEY).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyTeacherSession(token) {
  try {
    const [payload, sig] = token.split(".");
    const expected = crypto.createHmac("sha256", SECRET_KEY).update(payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const obj = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!obj || !obj.id || !obj.email) return null;
    if (obj.exp && Date.now() > obj.exp) return null;
    return obj;
  } catch {
    return null;
  }
}

// POST /teacher/register
app.post("/teacher/register", authIpRateLimit, (req, res) => {
  const email = (req.body.email || "").toString().trim().toLowerCase();
  const name = (req.body.name || "").toString().trim().slice(0, 40);
  const password = (req.body.password || "").toString();

  const county = (req.body.county || "").toString().trim().slice(0, 60);
  const municipality = (req.body.municipality || "").toString().trim().slice(0, 60);
  const schoolName = (req.body.schoolName || "").toString().trim().slice(0, 80);
  const howFound = (req.body.howFound || "").toString().trim().slice(0, 120);

  if (!validator.isEmail(email)) return res.status(400).json({ ok: false, message: "Ugyldig e-post." });
  if (!name || name.length < 2) return res.status(400).json({ ok: false, message: "Ugyldig navn." });
  if (!password || password.length < 8) return res.status(400).json({ ok: false, message: "Passord må være minst 8 tegn." });

  const salt = crypto.randomBytes(16).toString("hex");
  const passHash = hashPassword(password, salt);
  const verifyToken = crypto.randomBytes(32).toString("hex");

  pool.query(
    `INSERT INTO teachers
       (email, name, password_hash, approved, email_verified, email_verify_token,
        county, municipality, school_name, how_found)
     VALUES (?, ?, ?, 0, 0, ?, ?, ?, ?, ?)`,
    [email, name, passHash, verifyToken,
     county || null, municipality || null, schoolName || null, howFound || null],
    async (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          // Already registered – resend a fresh verify token
          const newToken = crypto.randomBytes(32).toString("hex");
          pool.query(
            "UPDATE teachers SET email_verify_token = ? WHERE email = ? AND email_verified = 0",
            [newToken, email],
            async (uerr, ures) => {
              if (!uerr && ures.affectedRows > 0) {
                try {
                  await sendVerifyEmail(email, name, newToken);
                } catch {}
                return res.json({ ok: true, message: "Allerede registrert – ny bekreftelseslenke er sendt." });
              }
              return res.json({ ok: true, message: "Allerede registrert. Vent på godkjenning." });
            }
          );
          return;
        }
        logWithTimestamp("teacher/register db error: " + err, "error");
        return res.status(500).json({ ok: false, message: "Databasefeil." });
      }
      try {
        await sendVerifyEmail(email, name, verifyToken);
      } catch (mailErr) {
        logWithTimestamp("Register: email send failed: " + mailErr.message, "error");
      }
      return res.json({ ok: true, message: "Registrert! Sjekk e-posten din for å bekrefte adressen." });
    }
  );
});

async function sendVerifyEmail(email, name, token) {
  const link = `${SITE_URL}/verify-email.html?token=${encodeURIComponent(token)}`;
  await sendMail(
    email,
    "Bekreft e-posten din – PokeMath Lærer",
    `<p>Hei ${name},</p>
     <p>Takk for at du registrerte deg som lærer på PokeMath!</p>
     <p>Klikk på lenken under for å bekrefte e-postadressen din:</p>
     <p><a href="${link}">${link}</a></p>
     <p>Etter bekreftelse vil kontoen din bli gjennomgått og godkjent av admin.</p>
     <p>– PokeMath</p>`
  );
}

// GET /teacher/verify-email?token=xxx
app.get("/teacher/verify-email", (req, res) => {
  const token = (req.query.token || "").toString().trim();
  if (!token || token.length < 32) return res.status(400).json({ ok: false, message: "Ugyldig token." });

  pool.query(
    "SELECT id, email, name FROM teachers WHERE email_verify_token = ? AND email_verified = 0",
    [token],
    (err, rows) => {
      if (err) {
        logWithTimestamp("verify-email db error: " + err, "error");
        return res.status(500).json({ ok: false, message: "Databasefeil." });
      }
      if (!rows || rows.length === 0) {
        return res.status(400).json({ ok: false, message: "Ugyldig eller allerede brukt bekreftelseslenke." });
      }
      const teacher = rows[0];
      pool.query(
        "UPDATE teachers SET email_verified = 1, email_verify_token = NULL WHERE id = ?",
        [teacher.id],
        (uerr) => {
          if (uerr) {
            logWithTimestamp("verify-email update error: " + uerr, "error");
            return res.status(500).json({ ok: false, message: "Databasefeil." });
          }
          logWithTimestamp(`Teacher email verified: ${teacher.email}`);
          return res.json({ ok: true, name: teacher.name, email: teacher.email });
        }
      );
    }
  );
});

app.post("/teacher/forgot-password", authIpRateLimit, async (req, res) => {
  const email = (req.body.email || "").toString().trim().toLowerCase();
  if (!validator.isEmail(email)) return res.status(400).json({ ok:false, message:"Ugyldig e-post." });

  // Always return the same response regardless of whether email exists (prevents enumeration)
  const OK_MSG = "Hvis e-posten finnes hos oss, vil du snart motta en link for å tilbakestille passordet.";

  try {
    const [rows] = await pool.promise().query(
      "SELECT id, name FROM teachers WHERE email = ? AND approved = 1",
      [email]
    );

    if (rows.length > 0) {
      const teacher = rows[0];
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Remove any existing reset tokens for this email, then insert new one
      await pool.promise().query("DELETE FROM teacher_password_resets WHERE email = ?", [email]);
      await pool.promise().query(
        "INSERT INTO teacher_password_resets (email, token, expires_at) VALUES (?, ?, ?)",
        [email, token, expiresAt]
      );

      const link = `${SITE_URL}/lærer/reset-password.html?token=${encodeURIComponent(token)}`;
      try {
        await sendMail(
          email,
          "Tilbakestill passordet ditt – PokeMath Lærer",
          `<p>Hei ${teacher.name},</p>
           <p>Vi mottok en forespørsel om å tilbakestille passordet for din PokeMath-lærerkonto.</p>
           <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#2cbb63;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Tilbakestill passord</a></p>
           <p>Linken er gyldig i <strong>1 time</strong>.</p>
           <p>Hvis du ikke ba om dette, kan du ignorere denne e-posten – passordet ditt er uendret.</p>
           <p style="color:#999;font-size:12px;">Direkte link: ${link}</p>
           <p>– PokeMath</p>`
        );
      } catch (mailErr) {
        logWithTimestamp("forgot-password email failed: " + mailErr.message, "error");
      }
    }

    return res.json({ ok:true, message: OK_MSG });
  } catch (err) {
    logWithTimestamp("teacher/forgot-password error: " + err, "error");
    return res.status(500).json({ ok:false, message:"Databasefeil." });
  }
});

app.post("/teacher/reset-password", authIpRateLimit, async (req, res) => {
  const token    = (req.body.token    || "").toString().trim();
  const password = (req.body.password || "").toString();

  if (!token) return res.status(400).json({ ok:false, message:"Mangler token." });
  if (password.length < 8) return res.status(400).json({ ok:false, message:"Passordet må være minst 8 tegn." });

  try {
    const [rows] = await pool.promise().query(
      "SELECT email FROM teacher_password_resets WHERE token = ? AND expires_at > NOW()",
      [token]
    );
    if (!rows.length) return res.status(400).json({ ok:false, message:"Linken er ugyldig eller utløpt. Be om en ny." });

    const email = rows[0].email;
    const salt = crypto.randomBytes(16).toString("hex");
    const passHash = hashPassword(password, salt);

    await pool.promise().query("UPDATE teachers SET password_hash = ? WHERE email = ?", [passHash, email]);
    await pool.promise().query("DELETE FROM teacher_password_resets WHERE email = ?", [email]);

    logWithTimestamp(`Teacher password reset: ${email}`);
    return res.json({ ok:true, message:"Passordet er oppdatert! Du kan nå logge inn." });
  } catch (err) {
    logWithTimestamp("teacher/reset-password error: " + err, "error");
    return res.status(500).json({ ok:false, message:"Databasefeil." });
  }
});

app.post("/teacher/login", authIpRateLimit, (req, res) => {
  const email = (req.body.email || "").toString().trim().toLowerCase();
  const password = (req.body.password || "").toString();

  if (!validator.isEmail(email)) return res.status(400).json({ ok: false, message: "Ugyldig e-post." });

  // Rate limiting
  const attempt = loginAttempts.get(email) || { count: 0, lockedUntil: 0 };
  if (Date.now() < attempt.lockedUntil) {
    return res.status(429).json({ ok: false, message: "For mange forsøk. Prøv igjen om 15 minutter." });
  }

  pool.query("SELECT id, email, name, password_hash, approved, email_verified FROM teachers WHERE email = ?", [email], (err, rows) => {
    if (err) {
      logWithTimestamp("teacher/login db error: " + err, "error");
      return res.status(500).json({ ok: false, message: "Databasefeil." });
    }

    const failed = () => {
      attempt.count++;
      if (attempt.count >= LOGIN_MAX) {
        attempt.lockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
        attempt.count = 0;
      }
      loginAttempts.set(email, attempt);
    };

    if (!rows || rows.length === 0) { failed(); return res.status(401).json({ ok: false, message: "Feil innlogging." }); }

    const t = rows[0];
    if (!verifyPassword(password, t.password_hash)) { failed(); return res.status(401).json({ ok: false, message: "Feil innlogging." }); }
    if (!t.email_verified) return res.status(403).json({ ok: false, message: "E-post ikke bekreftet. Sjekk innboksen din for bekreftelseslenken." });
    if (!t.approved) return res.status(403).json({ ok: false, message: "Ikke godkjent ennå. Admin vil godkjenne kontoen din snart." });

    loginAttempts.delete(email); // reset on success

    const teacherSession = signTeacherSession({
      id: t.id,
      email: t.email,
      name: t.name,
      exp: Date.now() + 1000 * 60 * 60 * 12,
    });

    return res.json({ ok: true, teacherSession, name: t.name, email: t.email });
  });
});

app.get("/teacher/session", async (req, res) => {
  const auth = (req.headers.authorization || "").toString();
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const t = verifyTeacherSession(token);
  if (!t) return res.status(401).json({ ok: false });
  pool.query("UPDATE teachers SET last_seen = NOW() WHERE id = ?", [t.id], () => {});
  try {
    const [rows] = await pool.promise().query("SELECT code_tokens FROM teachers WHERE id = ?", [t.id]);
    const code_tokens = rows.length ? rows[0].code_tokens : 0;
    res.json({ ok: true, teacher: { name: t.name, email: t.email, id: t.id, exp: t.exp, code_tokens } });
  } catch {
    res.json({ ok: true, teacher: { name: t.name, email: t.email, id: t.id, exp: t.exp, code_tokens: 0 } });
  }
});

app.get("/admin/teachers", (req, res) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });

  pool.query(
    `SELECT id, email, name, approved, email_verified,
            county, municipality, school_name, how_found,
            created_at, last_seen, code_tokens
     FROM teachers
     ORDER BY approved ASC, created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ ok: false });
      return res.json({ ok: true, teachers: rows });
    }
  );
});

app.post("/admin/teachers/approve", (req, res) => {
  const pw = getBearer(req);
  const id = Number(req.body.id);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });
  if (!id) return res.status(400).json({ ok: false });

  pool.query(
    "SELECT email, name, approved FROM teachers WHERE id = ?",
    [id],
    async (err, rows) => {
      if (err || !rows.length) return res.status(500).json({ ok: false });
      const t = rows[0];

      pool.query("UPDATE teachers SET approved = 1 WHERE id = ?", [id], async (uerr) => {
        if (uerr) return res.status(500).json({ ok: false });

        if (!t.approved) {
          // First-time approval — notify teacher by email
          try {
            await sendMail(
              t.email,
              "Kontoen din er godkjent – PokeMath Lærer",
              `<p>Hei ${t.name},</p>
               <p>Kontoen din på PokeMath Lærer er nå godkjent!</p>
               <p>Du kan nå logge inn og starte Bingo-spill for klassen din:</p>
               <p><a href="${SITE_URL}/lærer/index.html">${SITE_URL}/lærer/index.html</a></p>
               <p>– PokeMath</p>`
            );
          } catch (mailErr) {
            logWithTimestamp("approve: email failed: " + mailErr.message, "error");
          }
        }
        return res.json({ ok: true });
      });
    }
  );
});

app.post("/admin/teachers/delete", (req, res) => {
  const pw = getBearer(req);
  const id = Number(req.body.id);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });
  if (!id) return res.status(400).json({ ok: false });

  pool.query("SELECT email, name FROM teachers WHERE id = ?", [id], (err, rows) => {
    if (err || !rows.length) return res.status(500).json({ ok: false });

    // Delete codes created by this teacher
    pool.query("DELETE FROM secret_codes WHERE created_by = ?", [rows[0].email], () => {});

    pool.query("DELETE FROM teachers WHERE id = ?", [id], async (derr) => {
      if (derr) return res.status(500).json({ ok: false });
      logWithTimestamp(`Admin deleted teacher id=${id} (${rows[0].email})`);
      return res.json({ ok: true });
    });
  });
});

// POST /admin/email  – send custom email to one, several, or all approved teachers
app.post("/admin/email", async (req, res) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });

  const subject = (req.body.subject || "").toString().trim().slice(0, 200);
  const body    = (req.body.body    || "").toString().trim().slice(0, 10000);
  const ids     = req.body.ids; // array of numbers, or "all"

  if (!subject || !body) return res.status(400).json({ ok: false, message: "Subject og body kreves." });

  let query, params;
  if (ids === "all") {
    query  = "SELECT email, name FROM teachers WHERE approved = 1";
    params = [];
  } else if (Array.isArray(ids) && ids.length) {
    const safeIds = ids.map(Number).filter(n => n > 0);
    if (!safeIds.length) return res.status(400).json({ ok: false, message: "Ingen gyldige IDs." });
    query  = `SELECT email, name FROM teachers WHERE approved = 1 AND id IN (${safeIds.map(() => "?").join(",")})`;
    params = safeIds;
  } else {
    return res.status(400).json({ ok: false, message: "ids må være 'all' eller en liste med IDs." });
  }

  pool.query(query, params, async (err, rows) => {
    if (err) return res.status(500).json({ ok: false });
    if (!rows.length) return res.json({ ok: true, sent: 0 });

    const html = `<p>${body.replace(/\n/g, "<br>")}</p><hr><p style="font-size:12px;color:#999;">– PokeMath Admin</p>`;
    let sent = 0, failed = 0;
    for (const t of rows) {
      try {
        await sendMail(t.email, subject, `<p>Hei ${t.name},</p>\n${html}`);
        sent++;
      } catch {
        failed++;
      }
    }
    logWithTimestamp(`Admin bulk email: sent=${sent} failed=${failed} subject="${subject}"`);
    return res.json({ ok: true, sent, failed });
  });
});

// DELETE /teacher/account – teacher self-deletion (requires valid session)
app.delete("/teacher/account", (req, res) => {
  const auth = (req.headers.authorization || "").toString();
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const t = verifyTeacherSession(token);
  if (!t) return res.status(401).json({ ok: false, message: "Ikke innlogget." });

  pool.query("SELECT id, email, name FROM teachers WHERE id = ?", [t.id], (err, rows) => {
    if (err || !rows.length) return res.status(500).json({ ok: false, message: "Databasefeil." });
    const teacher = rows[0];

    // Delete codes created by this teacher
    pool.query("DELETE FROM secret_codes WHERE created_by = ?", [teacher.email], () => {});

    pool.query("DELETE FROM teachers WHERE id = ?", [teacher.id], async (derr) => {
      if (derr) return res.status(500).json({ ok: false, message: "Databasefeil." });

      logWithTimestamp(`Teacher self-deleted: ${teacher.email}`);

      try {
        await sendMail(
          teacher.email,
          "Kontoen din er slettet – PokeMath Lærer",
          `<p>Hei ${teacher.name},</p>
           <p>Kontoen din på PokeMath Lærer er nå slettet, og all tilhørende data er fjernet fra databasen vår.</p>
           <p>Hvis dette var en feil, ta kontakt med oss.</p>
           <p>– PokeMath</p>`
        );
      } catch (mailErr) {
        logWithTimestamp("self-delete: confirmation email failed: " + mailErr.message, "error");
      }

      return res.json({ ok: true });
    });
  });
});

// -----------------------------------------------------------------------------
// ADMIN: List/End active bingo lobbies (password protected)
// -----------------------------------------------------------------------------
app.get("/admin/lobbies", (req, res) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });

  const items = [];
  for (const [code, lobby] of ACTIVE_LOBBIES.entries()) {
    items.push({
      code,
      teacherEmail: lobby.teacherEmail || null,
      teacherName: lobby.teacherName || null,
      className: lobby.settings?.className || "",
      difficulty: lobby.settings?.difficulty || "",
      createdAt: lobby.createdAt || null,
      lastActivity: lobby.lastActivity || null,
      totalCatches: lobby.totalCatches || 0,
      players: lobby.players ? lobby.players.size : 0,
      locked: lobby.locked || false,
      joinUrl: `/bingo_join.html/${code}`,
      hostUrl: `/lærer/bingo_host.html?code=${code}`
    });
  }

  items.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
  res.json({ ok: true, lobbies: items });
});

app.post("/admin/lobbies/end", (req, res) => {
  const pw = getBearer(req);
  const code = (req.body.code || "").toString().toUpperCase().trim();
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });
  if (!code) return res.status(400).json({ ok: false, message: "Missing code" });

  const lobby = ACTIVE_LOBBIES.get(code);
  if (!lobby) return res.json({ ok: true, ended: false, message: "Not found (already ended)" });

  try {
    if (lobby.hostWs && lobby.hostWs.readyState === WebSocket.OPEN) {
      lobby.hostWs.send(JSON.stringify({ type: "ended", code }));
    }
  } catch {}

  ACTIVE_LOBBIES.delete(code);
  pool.query("UPDATE bingo_lobbies SET ended=1 WHERE code=?", [code], () => {});
  logWithTimestamp(`Admin ended lobby: ${code}`, "warning");
  res.json({ ok: true, ended: true });
});

// GET /admin/lobbies/board – full board state for a specific lobby
app.get("/admin/lobbies/board", (req, res) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });
  const code = (req.query.code || "").toString().toUpperCase().trim();
  if (!code) return res.status(400).json({ ok: false, message: "Missing code" });
  const lobby = ACTIVE_LOBBIES.get(code);
  if (!lobby) return res.json({ ok: false, message: "Not found" });
  res.json({
    ok: true, code,
    board: lobby.board,
    events: lobby.events.slice(-100),
    players: lobbyPlayersArray(lobby),
    totalCatches: lobby.totalCatches,
    locked: lobby.locked,
    teacherName: lobby.teacherName,
    teacherEmail: lobby.teacherEmail,
    settings: lobby.settings,
    createdAt: lobby.createdAt,
  });
});

// POST /admin/lobbies/popup – send a custom popup to host and/or students
app.post("/admin/lobbies/popup", (req, res) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });
  const code = (req.body.code || "").toString().toUpperCase().trim();
  const message = (req.body.message || "").toString().trim().slice(0, 500);
  const duration = Math.max(1, Math.min(120, Number(req.body.duration) || 5));
  const position = (req.body.position || "top-center").toString();
  const target = (req.body.target || "both").toString(); // "both" | "host" | "students"
  const sound = (req.body.sound || "").toString().replace(/[^a-zA-Z0-9_.]/g, "");
  if (!message) return res.status(400).json({ ok: false, message: "Missing message" });
  const lobby = ACTIVE_LOBBIES.get(code);
  if (!lobby) return res.json({ ok: false, message: "Lobby not found" });

  const popupPayload = { type: "adminPopup", message, duration, position };
  const soundPayload = sound ? { type: "adminSound", file: sound } : null;

  const sendToHost = target === "both" || target === "host";
  const sendToStudents = target === "both" || target === "students";

  if (sendToHost) {
    wsSendSafe(lobby.hostWs, popupPayload);
    if (soundPayload) wsSendSafe(lobby.hostWs, soundPayload);
  }

  // Store for offline students only if sending to students
  if (sendToStudents) {
    if (!lobby.pendingPopups) lobby.pendingPopups = [];
    const popup = { message, duration, position, seenBy: new Set() };
    lobby.pendingPopups.push(popup);
  }

  let studentCount = 0;
  if (sendToStudents) {
    for (const client of wss.clients) {
      if (client.__lobbyCode === code && client.__role === "student") {
        wsSendSafe(client, popupPayload);
        if (lobby.pendingPopups?.length) {
          const popup = lobby.pendingPopups[lobby.pendingPopups.length - 1];
          if (client.__uuid) popup.seenBy.add(client.__uuid);
        }
        studentCount++;
      }
    }
  }

  logWithTimestamp(`Admin popup → lobby ${code} (target=${target}, sound=${sound || "none"}, ${studentCount} students): "${message.slice(0, 60)}"`, "warning");
  res.json({ ok: true, students: studentCount });
});

// POST /admin/lobbies/gift – give a pokémon/prize to all players in a lobby
app.post("/admin/lobbies/gift", async (req, res) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });
  const code = (req.body.code || "").toString().toUpperCase().trim();
  const lobby = ACTIVE_LOBBIES.get(code);
  if (!lobby) return res.json({ ok: false, message: "Lobby not found" });

  // --- Sound trigger (host-only, no prize stored) ---
  if (req.body.sound) {
    const sound = (req.body.sound || "").toString().replace(/[^a-zA-Z0-9_.]/g, "");
    wsSendSafe(lobby.hostWs, { type: "adminSound", file: sound });
    logWithTimestamp(`Admin sound ${sound} → lobby ${code}`, "warning");
    return res.json({ ok: true, sent: 1 });
  }

  // --- Coins gift ---
  if (req.body.coins !== undefined) {
    const amount = Math.max(1, Math.min(1000000, parseInt(req.body.coins, 10) || 0));
    if (!amount) return res.status(400).json({ ok: false, message: "Ugyldig beløp" });
    const prize = { type: "coins", amount, source: "admin" };
    const players = [...lobby.players.values()];
    if (players.length > 0) {
      try {
        const vals = players.map(p => [code, p.uuid, JSON.stringify(prize)]);
        await pool.promise().query("INSERT INTO bingo_prizes (bingo_code, uuid, prize_json) VALUES ?", [vals]);
      } catch (e) { logWithTimestamp("Admin gift coins error: " + e, "error"); }
      for (const client of wss.clients) {
        if (client.__lobbyCode === code && client.__role === "student")
          wsSendSafe(client, { type: "bingoReward", code });
      }
    }
    logWithTimestamp(`Admin gift ${amount} coins → ${players.length} players in lobby ${code}`, "warning");
    return res.json({ ok: true, sent: players.length });
  }

  // --- Stardust gift ---
  if (req.body.stardust !== undefined) {
    const amount = Math.max(1, Math.min(20, parseInt(req.body.stardust, 10) || 0));
    if (!amount) return res.status(400).json({ ok: false, message: "Ugyldig antall Stardust" });
    const prize = { type: "stardust", amount, source: "admin" };
    const players = [...lobby.players.values()];
    if (players.length > 0) {
      try {
        const vals = players.map(p => [code, p.uuid, JSON.stringify(prize)]);
        await pool.promise().query("INSERT INTO bingo_prizes (bingo_code, uuid, prize_json) VALUES ?", [vals]);
      } catch (e) { logWithTimestamp("Admin gift stardust error: " + e, "error"); }
      for (const client of wss.clients) {
        if (client.__lobbyCode === code && client.__role === "student")
          wsSendSafe(client, { type: "bingoReward", code });
      }
    }
    logWithTimestamp(`Admin gift ${amount} stardust → ${players.length} players in lobby ${code}`, "warning");
    return res.json({ ok: true, sent: players.length });
  }

  // --- Pokémon gift ---
  const entry = (req.body.entry || "").toString().trim().toUpperCase();
  if (!entry) return res.status(400).json({ ok: false, message: "Missing entry" });
  const isShiny = /^S/i.test(entry);
  const rawId = entry.replace(/^[NS]/i, "");
  const baseId = Number(rawId.split("-")[0]);
  if (!baseId || isNaN(baseId) || baseId < 1 || baseId > 1100) {
    return res.status(400).json({ ok: false, message: "Ugyldig entry-kode (eks: N142 eller S25-1)" });
  }
  const prize = { type: "pokemon", entry, pokedexId: baseId, shiny: isShiny, legendary: false, mythic: false, source: "admin" };
  const players = [...lobby.players.values()];
  if (players.length > 0) {
    try {
      const vals = players.map(p => [code, p.uuid, JSON.stringify(prize)]);
      await pool.promise().query("INSERT INTO bingo_prizes (bingo_code, uuid, prize_json) VALUES ?", [vals]);
    } catch (e) { logWithTimestamp("Admin gift prizes insert error: " + e, "error"); }
    for (const client of wss.clients) {
      if (client.__lobbyCode === code && client.__role === "student")
        wsSendSafe(client, { type: "bingoReward", code });
    }
  }
  logWithTimestamp(`Admin gift ${entry} → ${players.length} players in lobby ${code}`, "warning");
  res.json({ ok: true, sent: players.length });
});

// -----------------------------------------------------------------------------
// DEBUG ENDPOINTS
// -----------------------------------------------------------------------------
app.get("/__routes", (req, _res2) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return _res2.status(401).send("Unauthorized");
  const routes = [];
  try {
    app._router.stack.forEach((m) => {
      if (m.route && m.route.path) {
        const methods = Object.keys(m.route.methods).join(",").toUpperCase();
        routes.push(`${methods} ${m.route.path}`);
      }
    });
  } catch (e) {
    return _res2.status(500).type("text/plain").send("Failed to read routes: " + e);
  }
  _res2.type("text/plain").send(routes.sort().join("\n"));
});

app.get("/__healthz", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.get("/__wsinfo", (req, _res3) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return _res3.status(401).json({ ok: false });
  _res3.json({ ok: true, wsClients: wss.clients.size });
});

// -----------------------------------------------------------------------------
// GRACEFUL SHUTDOWN
// -----------------------------------------------------------------------------
process.on("SIGINT", () => {
  pool.end((err) => {
    if (err) console.error("Error closing MySQL connection:", err);
    logWithTimestamp("MySQL connection closed.");
  });
  server.close(() => {
    logWithTimestamp("Server and WebSocket closed.");
    process.exit(0);
  });
});

// -----------------------------------------------------------------------------
// ANALYTICS — table init + endpoints
// -----------------------------------------------------------------------------
const db = pool.promise();

async function initAnalyticsTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS bingo_lobbies (
      code VARCHAR(16) PRIMARY KEY,
      teacher_id INT NOT NULL,
      teacher_name VARCHAR(128),
      teacher_email VARCHAR(256),
      board_json MEDIUMTEXT NOT NULL,
      settings_json TEXT,
      total_catches INT NOT NULL DEFAULT 0,
      players_json TEXT,
      events_json MEDIUMTEXT,
      created_at BIGINT,
      last_activity BIGINT,
      ended TINYINT(1) NOT NULL DEFAULT 0
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS pokemon_catches (
      period VARCHAR(16) PRIMARY KEY,
      count BIGINT NOT NULL DEFAULT 0
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS page_hits (
      page VARCHAR(128) NOT NULL,
      hit_date DATE NOT NULL,
      hits INT NOT NULL DEFAULT 0,
      PRIMARY KEY (page, hit_date)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS stage_usage (
      stage VARCHAR(32) NOT NULL,
      usage_date DATE NOT NULL,
      count INT NOT NULL DEFAULT 0,
      PRIMARY KEY (stage, usage_date)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS easter_catches (
      period VARCHAR(16) PRIMARY KEY,
      count BIGINT NOT NULL DEFAULT 0
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS easter_milestones (
      segment INT PRIMARY KEY,
      count BIGINT NOT NULL,
      reached_at BIGINT NOT NULL
    )
  `);
}
initAnalyticsTables().catch(e => logWithTimestamp("Analytics table init error: " + e, "error"));

// Simple IP rate limiter for /track-* endpoints
// Allows up to 30 requests per IP per 5-minute window
const trackRateMap = new Map(); // ip → { count, windowStart }
const TRACK_LIMIT = 30;
const TRACK_WINDOW = 5 * 60 * 1000;

function trackRateLimit(req, res, next) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = trackRateMap.get(ip);
  if (!entry || now - entry.windowStart > TRACK_WINDOW) {
    trackRateMap.set(ip, { count: 1, windowStart: now });
    return next();
  }
  if (entry.count >= TRACK_LIMIT) return res.status(429).json({ ok: false });
  entry.count++;
  next();
}

// Clean up old rate map entries every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - TRACK_WINDOW;
  for (const [ip, e] of trackRateMap) {
    if (e.windowStart < cutoff) trackRateMap.delete(ip);
  }
}, 10 * 60 * 1000);

app.post("/track-catch", trackRateLimit, (_req, res) => {
  res.json({ ok: true }); // respond immediately, do DB work async
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const periods = ["total", String(year), `${year}-${month}`];
    for (const period of periods) {
      pool.query(
        "INSERT INTO pokemon_catches (period, count) VALUES (?, 1) ON DUPLICATE KEY UPDATE count = count + 1",
        [period],
        (err) => { if (err) logWithTimestamp("track-catch DB error: " + err, "error"); }
      );
    }
  } catch (e) { logWithTimestamp("track-catch error: " + e, "error"); }
});

// ── Easter event endpoints ────────────────────────────────────────────────────
const easterUuidMap = new Map(); // uuid → lastCatchMs
const EASTER_UUID_INTERVAL = 2000; // min 2s between catches per UUID

setInterval(() => {
  const cutoff = Date.now() - 60000;
  for (const [k, v] of easterUuidMap) {
    if (v < cutoff) easterUuidMap.delete(k);
  }
}, 60000);

app.get('/api/easter/global', async (_req, res) => {
  try {
    const [[row]] = await db.query(
      "SELECT count FROM easter_catches WHERE period = 'total'"
    );
    const total = row ? Number(row.count) : 0;
    const [milestones] = await db.query(
      "SELECT segment, count, reached_at FROM easter_milestones ORDER BY segment"
    );
    res.json({ ok: true, total, cap: 2500000, milestones });
  } catch (e) {
    logWithTimestamp('easter/global error: ' + e, 'error');
    res.json({ ok: true, total: 0, cap: 2500000, milestones: [] });
  }
});

app.post('/api/easter/catch', async (req, res) => {
  const uuid = String(req.body?.uuid || '').slice(0, 64);
  if (!uuid) return res.json({ ok: false, message: 'no_uuid' });

  const now = Date.now();
  const last = easterUuidMap.get(uuid) || 0;
  if (now - last < EASTER_UUID_INTERVAL) {
    return res.json({ ok: false, message: 'rate_limited' });
  }
  easterUuidMap.set(uuid, now);

  res.json({ ok: true }); // respond immediately

  try {
    await db.query(
      "INSERT INTO easter_catches (period, count) VALUES ('total', 1) ON DUPLICATE KEY UPDATE count = count + 1"
    );
    // Check if any milestone was just crossed, record it
    const [[row]] = await db.query(
      "SELECT count FROM easter_catches WHERE period = 'total'"
    );
    const total = row ? Number(row.count) : 0;
    const GLOBAL_STEP = 250000;
    const segment = Math.floor(total / GLOBAL_STEP);
    if (segment >= 1 && segment <= 10 && total % GLOBAL_STEP < 5) {
      // We just crossed a segment boundary (allow slight jitter from concurrent requests)
      await db.query(
        "INSERT IGNORE INTO easter_milestones (segment, count, reached_at) VALUES (?, ?, ?)",
        [segment, total, now]
      );
    }
  } catch (e) {
    logWithTimestamp('easter/catch DB error: ' + e, 'error');
  }
});

app.post("/track-page", trackRateLimit, (req, res) => {
  res.json({ ok: true });
  try {
    const page = String(req.body?.page || "").slice(0, 128).replace(/[^a-zA-Z0-9/_.-æøåÆØÅ]/g, "") || "unknown";
    pool.query(
      "INSERT INTO page_hits (page, hit_date, hits) VALUES (?, CURDATE(), 1) ON DUPLICATE KEY UPDATE hits = hits + 1",
      [page],
      (err) => { if (err) logWithTimestamp("track-page DB error: " + err, "error"); }
    );
  } catch (e) { logWithTimestamp("track-page error: " + e, "error"); }
});

app.post("/track-stage", trackRateLimit, (req, res) => {
  res.json({ ok: true });
  try {
    const stage = String(req.body?.stage || "").slice(0, 32).replace(/[^a-zA-Z0-9_-]/g, "") || "unknown";
    pool.query(
      "INSERT INTO stage_usage (stage, usage_date, count) VALUES (?, CURDATE(), 1) ON DUPLICATE KEY UPDATE count = count + 1",
      [stage],
      (err) => { if (err) logWithTimestamp("track-stage DB error: " + err, "error"); }
    );
  } catch (e) { logWithTimestamp("track-stage error: " + e, "error"); }
});

// -----------------------------------------------------------------------------
// Bingo prize claim
// -----------------------------------------------------------------------------
app.get("/bingo/claim-prizes", async (req, res) => {
  const uuid = (req.query.uuid || "").toString().trim();
  if (!isValidUUID(uuid)) return res.status(400).json({ ok: false });
  try {
    // Atomically mark unclaimed → claimed and return only what we just claimed
    const [upd] = await pool.promise().query(
      "UPDATE bingo_prizes SET claimed = 1 WHERE uuid = ? AND claimed = 0",
      [uuid]
    );
    if (upd.affectedRows === 0) return res.json({ ok: true, prizes: [] });
    // changedRows gives us the rows we just flipped; fetch them by claimed_at window isn't safe,
    // so we rely on the fact that claimed_at is set on UPDATE — just re-select what we changed
    // using the last-insert pattern: since multiple rows updated, select the newest N we just claimed
    const [rows] = await pool.promise().query(
      "SELECT prize_json FROM bingo_prizes WHERE uuid = ? AND claimed = 1 ORDER BY id DESC LIMIT ?",
      [uuid, upd.affectedRows]
    );
    const prizes = rows.map(r => JSON.parse(r.prize_json));
    res.json({ ok: true, prizes });
  } catch (e) {
    logWithTimestamp("bingo/claim-prizes error: " + e, "error");
    res.status(500).json({ ok: false });
  }
});

app.get("/admin/analytics", async (req, res) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });
  try {
    const [catches] = await db.query("SELECT period, count FROM pokemon_catches ORDER BY period");
    const [pages] = await db.query(
      "SELECT page, SUM(hits) AS total, MAX(hit_date) AS last_seen FROM page_hits GROUP BY page ORDER BY total DESC LIMIT 30"
    );
    const [stages] = await db.query(
      "SELECT stage, SUM(count) AS total FROM stage_usage GROUP BY stage ORDER BY total DESC"
    );
    const [pagesMonth] = await db.query(
      "SELECT page, SUM(hits) AS total FROM page_hits WHERE hit_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY page ORDER BY total DESC LIMIT 30"
    );
    res.json({ ok: true, catches, pages, stages, pagesMonth });
  } catch (e) {
    logWithTimestamp("admin/analytics error: " + e, "error");
    res.status(500).json({ ok: false });
  }
});

// -----------------------------------------------------------------------------
// ADMIN: Hourly active users (last 72 h)
// -----------------------------------------------------------------------------
app.get("/admin/user-activity", async (req, res) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });
  try {
    const [rows] = await pool.promise().query(`
      SELECT FLOOR(UNIX_TIMESTAMP(last_updated) / 3600) * 3600 AS ts,
             COUNT(DISTINCT uuid)                               AS cnt
      FROM user_uuids
      WHERE UNIX_TIMESTAMP(last_updated) >= UNIX_TIMESTAMP() - 72 * 3600
      GROUP BY ts ORDER BY ts
    `);
    const map = new Map(rows.map(r => [Number(r.ts), Number(r.cnt)]));
    const nowTs = Math.floor(Date.now() / 3600000) * 3600;
    const slots = [];
    for (let i = 71; i >= 0; i--) {
      const ts = nowTs - i * 3600;
      slots.push({ ts, count: map.get(ts) || 0 });
    }
    res.json({ ok: true, slots });
  } catch (e) {
    logWithTimestamp("admin/user-activity error: " + e, "error");
    res.status(500).json({ ok: false });
  }
});

// -----------------------------------------------------------------------------
// Secret codes (redeem system)
// -----------------------------------------------------------------------------

// POST /redeem  –  student submits a code
app.post("/redeem", redeemRateLimit, async (req, res) => {
  const code = (req.body.code || "").toString().trim();
  if (!code) return res.json({ ok: false, message: "Ugyldig kode! Har du husket store og små bokstaver?" });

  try {
    const [rows] = await pool.promise().query(
      "SELECT * FROM secret_codes WHERE LOWER(plaintext_code) = LOWER(?) AND active = 1", [code]
    );
    if (!rows.length) return res.json({ ok: false, message: "Ugyldig kode! Har du husket store og små bokstaver?" });

    const sc = rows[0];
    res.json({ ok: true, prize: { type: sc.prize_type, value: sc.prize_value, image: sc.prize_image, label: sc.label } });
  } catch (e) {
    logWithTimestamp("redeem error: " + e, "error");
    res.status(500).json({ ok: false, message: "Serverfeil – prøv igjen." });
  }
});

// GET /teacher/codes  –  teacher sees codes marked teacher_visible
app.get("/teacher/codes", async (req, res) => {
  const session = (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "").trim();
  const teacher = verifyTeacherSession(session);
  if (!teacher) return res.status(401).json({ ok: false });
  try {
    const [rows] = await pool.promise().query(
      "SELECT id, plaintext_code, label, prize_type, prize_value, prize_image, repeatable FROM secret_codes WHERE teacher_visible = 1 AND active = 1 ORDER BY id"
    );
    res.json({ ok: true, codes: rows });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// GET /admin/codes  –  admin sees all codes
app.get("/admin/codes", async (req, res) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });
  try {
    const [rows] = await pool.promise().query(
      "SELECT id, plaintext_code, label, prize_type, prize_value, prize_image, repeatable, teacher_visible, active, created_by, created_at FROM secret_codes ORDER BY id"
    );
    res.json({ ok: true, codes: rows });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// POST /admin/codes  –  create a new code
app.post("/admin/codes", async (req, res) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });
  const { plaintext_code, label, prize_type, prize_value, prize_image, repeatable, teacher_visible } = req.body || {};
  if (!plaintext_code || !label || !prize_type)
    return res.status(400).json({ ok: false, message: "Mangler kode, label eller prize_type." });
  try {
    await pool.promise().query(
      "INSERT INTO secret_codes (plaintext_code, label, prize_type, prize_value, prize_image, repeatable, teacher_visible, created_by) VALUES (?,?,?,?,?,?,?,?)",
      [String(plaintext_code), String(label), String(prize_type),
       prize_value ? String(prize_value) : null, prize_image ? String(prize_image) : null,
       repeatable ? 1 : 0, teacher_visible ? 1 : 0, "admin"]
    );
    res.json({ ok: true });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.json({ ok: false, message: "Koden finnes allerede." });
    res.status(500).json({ ok: false, message: String(e) });
  }
});

// PATCH /admin/codes/:id  –  toggle active / teacher_visible
app.patch("/admin/codes/:id", async (req, res) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });
  const id = Number(req.params.id);
  const updates = {};
  if (req.body.active !== undefined)          updates.active          = req.body.active ? 1 : 0;
  if (req.body.teacher_visible !== undefined) updates.teacher_visible = req.body.teacher_visible ? 1 : 0;
  if (!Object.keys(updates).length) return res.status(400).json({ ok: false });
  const sets = Object.keys(updates).map(k => `${k}=?`).join(", ");
  await pool.promise().query(`UPDATE secret_codes SET ${sets} WHERE id = ?`, [...Object.values(updates), id]);
  res.json({ ok: true });
});

// DELETE /admin/codes/:id  –  delete a code (and its redemption history)
app.delete("/admin/codes/:id", async (req, res) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });
  const id = Number(req.params.id);
  await pool.promise().query("DELETE FROM secret_codes WHERE id = ?", [id]);
  await pool.promise().query("DELETE FROM code_redemptions WHERE code_id = ?", [id]);
  res.json({ ok: true });
});

// POST /teacher/codes  –  teacher creates a code (uses a token)
app.post("/teacher/codes", async (req, res) => {
  const auth = (req.headers.authorization || "").toString();
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const t = verifyTeacherSession(token);
  if (!t) return res.status(401).json({ ok: false, message: "Ikke innlogget." });

  try {
    const [tRows] = await pool.promise().query(
      "SELECT id, email, approved, email_verified, code_tokens FROM teachers WHERE id = ?", [t.id]
    );
    if (!tRows.length) return res.status(401).json({ ok: false, message: "Kontoen din finnes ikke lenger." });
    const teacher = tRows[0];

    if (!teacher.approved || !teacher.email_verified)
      return res.status(403).json({ ok: false, message: "Kontoen din er ikke godkjent ennå." });
    if (teacher.code_tokens <= 0)
      return res.status(403).json({ ok: false, message: "Du har ikke flere kode-tokens. Ta kontakt med PokeMorten for å få flere." });

    const { plaintext_code, label, prize_type, prize_value, prize_image, repeatable } = req.body || {};
    if (!plaintext_code || !label || !prize_type)
      return res.status(400).json({ ok: false, message: "Mangler kode, label eller premie-type." });

    // Prize-specific validation
    if (prize_type === "coins") {
      const amt = Number(prize_value);
      if (!prize_value || isNaN(amt) || amt <= 0 || amt > 50000)
        return res.status(400).json({ ok: false, message: "Mynter må være mellom 1 og 50 000." });
    }
    if (prize_type === "pokemon") {
      const entry = String(prize_value || "");
      if (!entry) return res.status(400).json({ ok: false, message: "Pokémon-kode mangler." });
      if (/U/i.test(entry)) return res.status(400).json({ ok: false, message: "Unike Pokémon (U-varianter) kan ikke brukes." });
      if (!/^[NSns]\d+(-\d+)?$/.test(entry)) return res.status(400).json({ ok: false, message: "Ugyldig Pokémon-kode. Bruk N{id} eller S{id}." });
      const baseId = Number(entry.replace(/^[NSns]/, "").split("-")[0]);
      if (baseId < 1 || baseId > 1008) return res.status(400).json({ ok: false, message: "Pokémon-ID må være 1–1008." });
    }

    // Restrict image to the allowed dropdown values
    const ALLOWED_IMAGES = new Set([
      "", "images/events/christmas/14.png", "images/logo.png",
      "images/under_construction.png", "images/hisuian_ball.png", "images/gigantamax.png",
      "images/mega.png", "images/up-arrow.png", "images/smarthphone.png",
      "images/shinycharm.png", "images/player.png", "images/player-fem.png",
      "images/lure_legend.sng", "images/lure.svg", "images/gear.png",
      "images/compass.png", "images/down-arrow.png", "images/conbag.svg", "images/backpack.png",
    ]);
    const imageVal = prize_image ? String(prize_image) : "";
    if (!ALLOWED_IMAGES.has(imageVal))
      return res.status(400).json({ ok: false, message: "Ugyldig bildeverdi." });

    await pool.promise().query(
      "INSERT INTO secret_codes (plaintext_code, label, prize_type, prize_value, prize_image, repeatable, teacher_visible, created_by) VALUES (?,?,?,?,?,?,?,?)",
      [String(plaintext_code), String(label), String(prize_type),
       prize_value ? String(prize_value) : null,
       prize_image ? String(prize_image) : null,
       (prize_type === "message" && repeatable) ? 1 : 0, 1, teacher.email]
    );
    await pool.promise().query("UPDATE teachers SET code_tokens = code_tokens - 1 WHERE id = ?", [teacher.id]);
    const remaining = teacher.code_tokens - 1;
    logWithTimestamp(`Teacher code created: email=${teacher.email} code="${plaintext_code}" tokens_left=${remaining}`);
    res.json({ ok: true, code_tokens: remaining });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.json({ ok: false, message: "En kode med det teksten finnes allerede." });
    logWithTimestamp("teacher/codes create error: " + e, "error");
    res.status(500).json({ ok: false, message: "Serverfeil." });
  }
});

// PATCH /admin/teachers/:id/tokens  –  admin sets or adds tokens for a teacher
app.patch("/admin/teachers/:id/tokens", async (req, res) => {
  const pw = getBearer(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) return res.status(401).json({ ok: false });
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false });
  try {
    const { set, add } = req.body || {};
    if (set !== undefined) {
      const val = Math.max(0, Number(set) || 0);
      await pool.promise().query("UPDATE teachers SET code_tokens = ? WHERE id = ?", [val, id]);
      res.json({ ok: true, code_tokens: val });
    } else if (add !== undefined) {
      await pool.promise().query(
        "UPDATE teachers SET code_tokens = GREATEST(0, code_tokens + ?) WHERE id = ?", [Number(add) || 0, id]
      );
      const [rows] = await pool.promise().query("SELECT code_tokens FROM teachers WHERE id = ?", [id]);
      res.json({ ok: true, code_tokens: rows[0]?.code_tokens ?? 0 });
    } else {
      res.status(400).json({ ok: false });
    }
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// -----------------------------------------------------------------------------
// Privacy policy redirects
// -----------------------------------------------------------------------------
app.get("/privacy",    (_req, res) => res.redirect(301, "/about.html#privacy"));
app.get("/policy",     (_req, res) => res.redirect(301, "/about.html#privacy"));
app.get("/personvern", (_req, res) => res.redirect(301, "/about.html#privacy"));

// -----------------------------------------------------------------------------
// Start listening
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  logWithTimestamp(`PokeMath Server running on port ${PORT}`);
});