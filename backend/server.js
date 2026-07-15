#!/usr/bin/env node

// ============================================================
// ERP14 SCUM RESTful API Server (Express + SQLite)
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const verifyToken = require('./middleware/authMiddleware');
const createLogMiddleware = require('./middleware/logMiddleware');

// ============================================================
// 配置
// ============================================================

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'erp14-secret-key-2026';
const TOKEN_EXPIRY = '7d';              // JWT 有效期 7 天
const DEFAULT_ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';     // 默认管理员用户名
const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';  // 默认管理员密码

const ROOT_DIR = __dirname;
const DB_PATH = process.env.ERP14_DB_PATH || path.join(ROOT_DIR, 'data', 'erp14.db');
const DB_DIR = path.dirname(DB_PATH);
const SCHEMA_PATH = path.join(ROOT_DIR, 'db', 'schema.sql');
const UPLOADS_DIR = process.env.ERP14_UPLOADS_DIR || path.join(ROOT_DIR, '..', 'uploads');
const STATIC_HTML = path.join(ROOT_DIR, '..', 'erp14-server-showcase.html');

// ============================================================
// 数据库初始化 (sql.js → better-sqlite3 兼容层)
// ============================================================

const initSqlJs = require('sql.js');

// better-sqlite3 兼容的 Statement 包装
class Statement {
  constructor(db, sql) {
    this._db = db;
    this._sql = sql;
  }
  _exec(params) {
    const stmt = this._db.prepare(this._sql);
    if (params && params.length > 0) stmt.bind(params);
    return stmt;
  }
  all(...params) {
    const stmt = this._exec(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }
  get(...params) {
    const stmt = this._exec(params);
    const row = stmt.step() ? stmt.getAsObject() : undefined;
    stmt.free();
    return row;
  }
  run(...params) {
    const stmt = this._exec(params);
    stmt.step();
    stmt.free();
    // sql.js 的 run() 直接执行并返回
    const lastId = this._db.exec("SELECT last_insert_rowid() as id")[0]?.values?.[0]?.[0];
    return { lastInsertRowid: lastId || 0, changes: this._db.getRowsModified() };
  }
}

// SQLite 数据库包装
class Database {
  constructor(sqlDb) {
    this._db = sqlDb;
  }
  prepare(sql) {
    return new Statement(this._db, sql);
  }
  exec(sql) {
    this._db.exec(sql);
  }
  run(sql, params) {
    if (params) {
      const stmt = this._db.prepare(sql);
      stmt.bind(params);
      stmt.step();
      stmt.free();
    } else {
      this._db.run(sql);
    }
  }
  getRowsModified() { return this._db.getRowsModified(); }
  export() { return this._db.export(); }
  close() { this._db.close(); }
}

let db;
let dbReady = false;
const dbReadyResolvers = [];

function ensureTableColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!columns.some(column => column.name === columnName)) {
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    console.log(`[DB] 已补齐字段: ${tableName}.${columnName}`);
  }
}

function seedDefaultEventsWhenEmpty() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM events').get().cnt;
  if (count > 0) return;
  const now = new Date().toISOString();
  const defaults = [
    ['周末空投争夺开启', 'signup', '报名中', '周六 20:30 开启空投争夺，活动区内允许 PVP，结束后统一发放参与奖励。', '周六 20:30', '参与奖励', '2026-12-31T20:00', '2026-12-31T23:00', 1],
    ['新手保护范围调整', 'fixed', '常驻', '新玩家保护期内禁止恶意蹲守出生点，违规行为将记录并处罚。', '', '', null, null, 2],
    ['交易区展示页整理', 'fixed', '常驻', '网站新增交易区、基地经营和活动玩法说明，方便玩家入服前了解规则。', '', '', null, null, 3],
    ['基地评选活动', 'signup', '报名中', '开放基地投稿和投票，优秀作品会展示在网站首页。', '', '优秀作品展示在网站首页', '2026-12-31T21:00', '2027-01-01T00:00', 4]
  ];
  const insert = db.prepare(`INSERT INTO events (title, type, status, content, schedule, reward, signup_deadline, event_end_at, results, published, notes, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`);
  defaults.forEach(item => {
    insert.run(item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7], JSON.stringify([]), '', item[8], now, now);
  });
  console.log('[DB] 默认活动已写入');
}
async function initDatabase() {
  fs.mkdirSync(DB_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const SQL = await initSqlJs();
  const dbExists = fs.existsSync(DB_PATH);

  let rawDb;
  if (dbExists) {
    const buffer = fs.readFileSync(DB_PATH);
    rawDb = new SQL.Database(buffer);
  } else {
    rawDb = new SQL.Database();
  }

  rawDb.run('PRAGMA foreign_keys = ON');
  db = new Database(rawDb);

  if (!dbExists) {
    if (fs.existsSync(SCHEMA_PATH)) {
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
      db.exec(schema);
      console.log('[DB] 表结构创建完成（新建数据库）');
    } else {
      console.error('[DB] schema.sql 不存在');
      process.exit(1);
    }
  }

  // 确保 admin 表存在（兼容已有数据库未建此表的情况）
  db.run(`CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  ensureTableColumn('events', 'sort_order', 'INTEGER DEFAULT 0');
  seedDefaultEventsWhenEmpty();

  // 初始化默认管理员账号（如无则创建）
  const existingAdmin = db.prepare('SELECT id FROM admin WHERE username = ?').get(DEFAULT_ADMIN_USER);
  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(DEFAULT_ADMIN_PASS, salt);
    db.prepare('INSERT INTO admin (username, password_hash, created_at) VALUES (?, ?, ?)')
      .run(DEFAULT_ADMIN_USER, hash, new Date().toISOString());
    console.log(`[Auth] 默认管理员已创建: ${DEFAULT_ADMIN_USER}`);
  } else {
    console.log('[Auth] 管理员账号已存在');
  }

  // 定时持久化
  const persistTimer = setInterval(() => {
    try {
      const data = db.export();
      fs.writeFileSync(DB_PATH, Buffer.from(data));
    } catch (e) {
      console.error('[DB] 保存失败:', e.message);
    }
  }, 5000);
  if (typeof persistTimer.unref === 'function') persistTimer.unref();

  process.on('SIGINT', () => { try { fs.writeFileSync(DB_PATH, Buffer.from(db.export())); } catch {} process.exit(0); });
  process.on('SIGTERM', () => { try { fs.writeFileSync(DB_PATH, Buffer.from(db.export())); } catch {} process.exit(0); });

  dbReady = true;
  dbReadyResolvers.forEach(r => r());

  // 数据库就绪后注册日志中间件
  const logOperation = createLogMiddleware(db);
  app.use('/api/admin', logOperation);
  // 也保护 /api/images/upload
  app.use('/api/images', logOperation);

  console.log(`[DB] 已连接: ${DB_PATH}`);
  console.log('[Log] 操作日志中间件已启用');
}

function waitForDb() {
  if (dbReady) return Promise.resolve();
  return new Promise(resolve => dbReadyResolvers.push(resolve));
}

// 启动数据库初始化（不阻塞服务器启动）
initDatabase().catch(e => {
  console.error('[DB] 初始化失败:', e.message);
  process.exit(1);
});

// ============================================================
// Express 应用
// ============================================================

const app = express();

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// 静态文件：上传目录
app.use('/uploads', express.static(UPLOADS_DIR));

// ============================================================
// 统一响应格式
// ============================================================

function success(data, message = 'success') {
  return { code: 200, data, message };
}

function created(data, message = '创建成功') {
  return { code: 201, data, message };
}

function error(statusCode, message, detail = '') {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.detail = detail;
  return err;
}

function sendError(res, err) {
  const code = err.statusCode || 500;
  res.status(code).json({
    code,
    message: err.message || '服务器错误',
    error: err.detail || ''
  });
}

// ============================================================
// Token 生成（导入的 authMiddleware 负责验证）
// ============================================================

function generateToken(username) {
  const token = jwt.sign(
    { username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
  // 从 token 中解码获取 exp
  const decoded = jwt.decode(token);
  return {
    token,
    expiresAt: decoded ? new Date(decoded.exp * 1000).toISOString() : ''
  };
}

// ============================================================
// 图片上传配置 (multer)
// ============================================================

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB（用户要求）
const UPLOAD_IMAGES_DIR = path.join(UPLOADS_DIR, 'images');

// 确保上传根目录存在
if (!fs.existsSync(UPLOAD_IMAGES_DIR)) {
  fs.mkdirSync(UPLOAD_IMAGES_DIR, { recursive: true });
}

//
// multer 实例 A — 类型分类存储（用于 /api/admin/images 向后兼容）
//
const typeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type || 'library';
    const subDir = ['hero', 'play', 'template', 'group', 'rules', 'library', 'requests'].includes(type) ? type : 'library';
    const dest = path.join(UPLOAD_IMAGES_DIR, subDir);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safeName);
  }
});

const uploadByType = multer({
  storage: typeStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFilter
});

//
// multer 实例 B — 日期目录存储（用于 /api/images/upload）
// 文件保存到 /uploads/images/{YYYY}/{MM}/{DD}/{timestamp}_{random}.{ext}
//
function pad2(n) { return String(n).padStart(2, '0'); }

const dateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const dir = path.join(UPLOAD_IMAGES_DIR, String(now.getFullYear()), pad2(now.getMonth() + 1), pad2(now.getDate()));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const now = new Date();
    const ts = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
    const rand = Math.random().toString(36).slice(2, 8);
    cb(null, `${ts}_${rand}${ext}`);
  }
});

const uploadByDate = multer({
  storage: dateStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFilter
});

// multer 将 Content-Disposition 中的 filename 按 latin1 解码，
// 中文字符会被损坏（如 "大.png" → "å¤§.png"）。
// 重新编码为 UTF-8 以修复中文文件名。
function safeOrigName(file) {
  return Buffer.from(file.originalname, 'latin1').toString('utf8');
}

// 公共文件过滤器
function imageFilter(req, file, cb) {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}，仅允许 JPEG/PNG/WebP/GIF`));
  }
}

// ============================================================
// 公共 API（无需登录）
// ============================================================

// ---- Auth（登录无需中间件，放最前面） ----
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return sendError(res, error(400, '参数错误', '请输入用户名和密码'));
    }

    // 从数据库查询管理员
    const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get(username.trim());
    if (!admin) {
      return sendError(res, error(401, '用户名或密码错误'));
    }

    // bcrypt 验证密码
    if (!bcrypt.compareSync(password, admin.password_hash)) {
      return sendError(res, error(401, '用户名或密码错误'));
    }

    // 生成 JWT Token
    const { token, expiresAt } = generateToken(admin.username);

    // 写入操作日志
    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(admin.username, '登录', '管理员登录系统', req.ip || '127.0.0.1', new Date().toISOString());

    res.json(success({
      token,
      expiresAt,
      username: admin.username
    }, '登录成功'));
  } catch (e) {
    sendError(res, error(500, '登录失败', e.message));
  }
});

// ---- Events (公开) ----
app.get('/api/events', (req, res) => {
  try {
    const { type, status, published } = req.query;
    let sql = 'SELECT * FROM events WHERE 1=1';
    const params = [];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (published !== undefined) {
      sql += ' AND published = ?';
      params.push(published === '1' || published === 'true' ? 1 : 0);
    } else {
      sql += ' AND published = 1';
    }

    sql += ' ORDER BY sort_order ASC, id DESC';

    const events = db.prepare(sql).all(...params);
    const result = events.map(e => ({
      id: e.id,
      title: e.title,
      type: e.type,
      status: e.status,
      content: e.content,
      schedule: e.schedule,
      reward: e.reward,
      signup_deadline: e.signup_deadline,
      event_end_at: e.event_end_at,
      results: e.results ? JSON.parse(e.results) : [],
      reward_date: e.reward_date,
      published: !!e.published,
      notes: e.notes,
      sort_order: e.sort_order ?? 0,
      created_at: e.created_at,
      updated_at: e.updated_at,
      signup_count: db.prepare('SELECT COUNT(*) as cnt FROM signups WHERE event_id = ?').get(e.id).cnt,
    }));
    res.json(success(result));
  } catch (e) {
    sendError(res, error(500, '读取活动失败', e.message));
  }
});

// ---- 活动报名 (公开) ----
app.post('/api/events/:id/signup', (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const { playerName, note } = req.body;

    if (!playerName || !playerName.trim()) {
      return sendError(res, error(400, '参数错误', '缺少玩家名称'));
    }

    const event = db.prepare('SELECT * FROM events WHERE id = ? AND published = 1').get(eventId);
    if (!event) {
      return sendError(res, error(404, '活动不存在'));
    }

    // 检查是否已报名
    const existing = db.prepare('SELECT id FROM signups WHERE event_id = ? AND player_name = ?')
      .get(eventId, playerName.trim());
    if (existing) {
      return sendError(res, error(409, `玩家「${playerName}」已报名此活动`));
    }

    const result = db.prepare('INSERT INTO signups (event_id, player_name, note, created_at) VALUES (?, ?, ?, ?)')
      .run(eventId, playerName.trim(), (note || '').trim(), new Date().toISOString());

    res.json(success({
      id: result.lastInsertRowid,
      eventId,
      playerName: playerName.trim(),
      count: db.prepare('SELECT COUNT(*) as cnt FROM signups WHERE event_id = ?').get(eventId).cnt,
    }, '报名成功'));
  } catch (e) {
    sendError(res, error(500, '报名失败', e.message));
  }
});

// ---- Requests (公开) ----
// ---- Requests (公开) ----
app.get('/api/requests', (req, res) => {
  try {
    const { status, category, q, page, limit } = req.query;
    let sql = "SELECT id, title, content, category, status, user, agree, disagree, admin_reply, created_at, contact, images, reject_reason FROM requests WHERE 1=1";
    const params = [];
    let countSql = "SELECT COUNT(*) as total FROM requests WHERE 1=1";
    const countParams = [];

    // 状态筛选
    if (status && status !== 'all') {
      const statuses = status.split(',');
      const placeholders = statuses.map(() => '?').join(',');
      sql += ' AND status IN (' + placeholders + ')';
      countSql += ' AND status IN (' + placeholders + ')';
      params.push(...statuses);
      countParams.push(...statuses);
    }

    // 分类筛选
    if (category) {
      sql += ' AND category = ?';
      countSql += ' AND category = ?';
      params.push(category);
      countParams.push(category);
    }

    // 关键词搜索
    if (q && q.trim()) {
      const keyword = `%${q.trim()}%`;
      sql += ' AND (title LIKE ? OR content LIKE ? OR user LIKE ?)';
      countSql += ' AND (title LIKE ? OR content LIKE ? OR user LIKE ?)';
      params.push(keyword, keyword, keyword);
      countParams.push(keyword, keyword, keyword);
    }

    // 总记录数
    const total = db.prepare(countSql).get(...countParams).total;

    // 分页
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const items = db.prepare(sql).all(...params);
    items.forEach((item) => {
      try {
        const parsed = JSON.parse(item.images || '[]');
        item.images = Array.isArray(parsed) ? parsed : [];
      } catch {
        item.images = [];
      }
    });
    res.json(success({
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }));
  } catch (e) {
    sendError(res, error(500, '读取建议失败', e.message));
  }
});

// ---- 玩家提交建议 (公开) ----
app.post('/api/requests', (req, res) => {
  try {
    const { title, content, category, user, contact, images } = req.body;
    if (!title || !title.trim()) {
      return sendError(res, error(400, '参数错误', '标题不能为空'));
    }
    if (!content || !content.trim()) {
      return sendError(res, error(400, '参数错误', '内容不能为空'));
    }
    if (!user || !user.trim() || user.trim().length < 2) {
      return sendError(res, error(400, '参数错误', '玩家名称至少 2 个字符'));
    }
    if (!contact || !contact.trim() || contact.trim().length < 2) {
      return sendError(res, error(400, '参数错误', '联系方式至少 2 个字符'));
    }
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO requests (title, content, category, status, user, contact, images, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)
    `).run(
      title.trim(), content.trim(), category || '优化',
      user.trim(), contact.trim(),
      JSON.stringify(images || []), now, now
    );
    res.status(201).json(success({ id: result.lastInsertRowid }, '建议已提交'));
  } catch (e) {
    sendError(res, error(500, '提交建议失败', e.message));
  }
});

// ---- 投票 (公开) ----
app.post('/api/requests/:id/vote', (req, res) => {
  try {
    const { id } = req.params;
    const { vote, voter } = req.body;

    // 确保 votes 表存在
    db.run(`CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      voter TEXT NOT NULL,
      vote TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(request_id, voter)
    )`);

    if (!vote || !['agree', 'disagree'].includes(vote)) {
      return sendError(res, error(400, '参数错误', '投票类型无效'));
    }
    if (!voter || !voter.trim() || voter.trim().length < 2) {
      return sendError(res, error(400, '参数错误', '投票者名称至少 2 个字符'));
    }

    const existing = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    if (!existing) {
      return sendError(res, error(404, '建议不存在'));
    }

    // 检查是否已投票
    const existingVote = db.prepare('SELECT * FROM votes WHERE request_id = ? AND voter = ?').get(id, voter.trim());
    let newVote;
    if (existingVote) {
      // 已投过：切换投票类型
      if (existingVote.vote === vote) {
        return sendError(res, error(409, `您已投过「${vote === 'agree' ? '同意' : '否定'}」`));
      }
      // 更新投票类型
      db.prepare('UPDATE votes SET vote = ?, created_at = ? WHERE request_id = ? AND voter = ?')
        .run(vote, new Date().toISOString(), id, voter.trim());
      // 调整计数
      const opposite = vote === 'agree' ? 'disagree' : 'agree';
      db.prepare(`UPDATE requests SET ${vote} = ${vote} + 1, ${opposite} = MAX(${opposite} - 1, 0), updated_at = ? WHERE id = ?`)
        .run(new Date().toISOString(), id);
      newVote = vote;
    } else {
      // 首次投票
      db.prepare('INSERT INTO votes (request_id, voter, vote) VALUES (?, ?, ?)')
        .run(id, voter.trim(), vote);
      db.prepare(`UPDATE requests SET ${vote} = ${vote} + 1, updated_at = ? WHERE id = ?`)
        .run(new Date().toISOString(), id);
      newVote = vote;
    }

    const updated = db.prepare('SELECT agree, disagree FROM requests WHERE id = ?').get(id);
    res.json(success({
      vote: newVote,
      agree: updated.agree,
      disagree: updated.disagree
    }, '投票成功'));
  } catch (e) {
    sendError(res, error(500, '投票失败', e.message));
  }
});

// ---- Config (公开) ----
app.get('/api/config', (req, res) => {
  try {
    const rows = db.prepare("SELECT key, value FROM config WHERE key NOT IN ('player_sessions','request_votes')").all();
    const config = {};
    for (const row of rows) {
      try {
        const parsed = JSON.parse(row.value);
        // 兼容 {value: "..."} 格式，也兼容纯字符串格式
        config[row.key] = parsed && typeof parsed === 'object' && 'value' in parsed ? parsed.value : parsed;
      } catch {
        config[row.key] = row.value;
      }
    }
    res.json(success(config));
  } catch (e) {
    sendError(res, error(500, '读取配置失败', e.message));
  }
});

// ---- Hero Images (公开) ----
app.get('/api/hero', (req, res) => {
  try {
    const rows = db.prepare("SELECT url FROM images WHERE type = 'hero' ORDER BY sort_order ASC").all();
    const urls = rows.map(r => r.url);
    res.json(success(urls));
  } catch (e) {
    sendError(res, error(500, '读取轮播图失败', e.message));
  }
});

// ---- Play Items (公开) ----
// ---- Play Items (公开) ----
app.get('/api/plays', (req, res) => {
  try {
    const playEvents = db.prepare("SELECT * FROM events WHERE type = 'fixed' ORDER BY id").all();
    const items = playEvents.map(e => {
      const notes = e.notes ? JSON.parse(e.notes) : {};
      const images = db.prepare("SELECT url FROM images WHERE type = 'play' AND target_id = ? ORDER BY sort_order")
        .all(e.id).map(r => r.url);
      return {
        id: e.id,
        key: notes.key || `play_${e.id}`,
        icon: notes.icon || 'package',
        title: e.title,
        subtitle: e.schedule || '',
        description: e.content || '',
        points: Array.isArray(notes.points) ? notes.points : [],
        images: images,
        sort_order: notes.sort_order ?? 0,
      };
    });
    res.json(success(items));
  } catch (e) {
    sendError(res, error(500, '读取玩法失败', e.message));
  }
});

// ---- Signups (公开) ----
// 获取报名名单（需指定 eventId）
app.get('/api/signups', (req, res) => {
  try {
    const { eventId } = req.query;
    const eid = parseInt(eventId);
    if (!eventId || isNaN(eid)) {
      return sendError(res, error(400, '参数错误', '缺少活动ID'));
    }

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eid);
    if (!event) {
      return sendError(res, error(404, '活动不存在'));
    }

    const list = db.prepare('SELECT id, player_name, note, created_at FROM signups WHERE event_id = ? ORDER BY created_at ASC').all(eid);
    const count = db.prepare('SELECT COUNT(*) as cnt FROM signups WHERE event_id = ?').get(eid).cnt;

    res.json(success({ count, list }));
  } catch (e) {
    sendError(res, error(500, '读取报名名单失败', e.message));
  }
});

// 报名
app.post('/api/signups', (req, res) => {
  try {
    const { event_id, player_name, note } = req.body;

    if (!event_id) {
      return sendError(res, error(400, '参数错误', '缺少活动ID'));
    }
    if (!player_name || !player_name.trim() || player_name.trim().length < 2) {
      return sendError(res, error(400, '参数错误', '玩家名称至少 2 个字符'));
    }

    const eid = parseInt(event_id);
    const event = db.prepare('SELECT * FROM events WHERE id = ? AND published = 1').get(eid);
    if (!event) {
      return sendError(res, error(404, '活动不存在或未发布'));
    }

    // 检查报名截止
    if (event.signup_deadline) {
      const deadline = new Date(event.signup_deadline).getTime();
      if (Number.isFinite(deadline) && deadline < Date.now()) {
        return sendError(res, error(400, '报名已截止'));
      }
    }

    // 检查重复报名
    const existing = db.prepare('SELECT id FROM signups WHERE event_id = ? AND player_name = ?')
      .get(eid, player_name.trim());
    if (existing) {
      return sendError(res, error(409, `玩家「${player_name}」已报名此活动`));
    }

    const now = new Date().toISOString();
    const result = db.prepare('INSERT INTO signups (event_id, player_name, note, created_at) VALUES (?, ?, ?, ?)')
      .run(eid, player_name.trim(), (note || '').trim(), now);

    res.status(201).json(success({
      id: result.lastInsertRowid,
      player_name: player_name.trim()
    }, '报名成功'));
  } catch (e) {
    sendError(res, error(500, '报名失败', e.message));
  }
});

// 取消报名（需验证 player_name 是本人）
app.delete('/api/signups/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { player_name } = req.body;
    const signup = db.prepare('SELECT * FROM signups WHERE id = ?').get(id);

    if (!signup) {
      return sendError(res, error(404, '报名记录不存在'));
    }
    if (!player_name || signup.player_name !== player_name.trim()) {
      return sendError(res, error(403, '只能取消自己的报名'));
    }

    db.prepare('DELETE FROM signups WHERE id = ?').run(id);
    res.json(success({ id: parseInt(id) }, '报名已取消'));
  } catch (e) {
    sendError(res, error(500, '取消报名失败', e.message));
  }
});

// ---- 图片上传（统一入口，需 JWT 鉴权） ----
app.post('/api/images/upload', verifyToken, (req, res, next) => {
  uploadByDate.single('file')(req, res, (err) => {
    // multer 自身错误处理
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, error(413, '文件太大', '图片大小不能超过 5MB'));
        }
        return sendError(res, error(400, '上传错误', err.message));
      }
      if (err.message && err.message.startsWith('不支持的文件类型')) {
        return sendError(res, error(400, '文件类型错误', err.message));
      }
      return sendError(res, error(500, '上传失败', err.message));
    }

    if (!req.file) {
      return sendError(res, error(400, '参数错误', '未接收到图片文件，请使用字段名 file'));
    }

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const url = `/uploads/images/${year}/${month}/${day}/${req.file.filename}`;

      const result = db.prepare(`
        INSERT INTO images (url, name, type, target_id, sort_order, size, created_at)
        VALUES (?, ?, ?, NULL, 0, ?, ?)
      `).run(url, safeOrigName(req.file), 'library', req.file.size, new Date().toISOString());

      // 写入操作日志
      db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
        .run('管理员', '上传', `上传图片: ${safeOrigName(req.file)} (${(req.file.size / 1024).toFixed(1)}KB)`, req.ip, new Date().toISOString());

      res.status(201).json(success({
        id: result.lastInsertRowid,
        url,
        name: safeOrigName(req.file),
        size: req.file.size,
        mime: req.file.mimetype,
      }, '图片上传成功'));
    } catch (e) {
      // 数据库写入失败时清理已保存的文件
      try { fs.unlinkSync(req.file.path); } catch {}
      sendError(res, error(500, '上传图片失败', e.message));
    }
  });
});

// ============================================================
// 管理 API（需登录）— 批量应用 JWT 中间件
// app.use('/api/admin', verifyToken) 保护其下所有路由
// login 路由已在前面注册，不受此影响
// ============================================================

app.use('/api/admin', verifyToken);

// ---- 新 Admin 路由 ----
const ALLOWED_CONFIG_KEYS = [
  'site_title', 'site_description', 'season_text',
  'server_no', 'server_ip', 'group_number',
  'join_text', 'join_url', 'join_application', 'join_qr',
  'server_notice'
];

app.get('/api/admin/config', (req, res) => {
  try {
    const rows = db.prepare("SELECT key, value FROM config").all();
    const config = {};
    for (const row of rows) {
      try {
        const parsed = JSON.parse(row.value);
        config[row.key] = parsed && typeof parsed === 'object' && 'value' in parsed ? parsed.value : parsed;
      } catch {
        config[row.key] = row.value;
      }
    }
    res.json(success(config));
  } catch (e) {
    sendError(res, error(500, '读取配置失败', e.message));
  }
});

app.put('/api/admin/config', (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || !ALLOWED_CONFIG_KEYS.includes(key)) {
      return sendError(res, error(400, '参数错误', `不允许的配置键: ${key}`));
    }

    // 存储为 {value: "..."} 格式
    const storeValue = JSON.stringify({ value: value ?? '' });
    const now = new Date().toISOString();

    db.prepare('INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, ?)')
      .run(key, storeValue, now);

    // 记录操作日志
    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '更新配置', `更新配置: ${key}`, req.ip, now);

    res.json(success({ key, value: value ?? '' }, '配置更新成功'));
  } catch (e) {
    sendError(res, error(500, '更新配置失败', e.message));
  }
});

// ---- 统计接口 ----
app.get('/api/admin/stats', (req, res) => {
  try {
    const configRows = db.prepare("SELECT key, value FROM config WHERE key IN ('playerSessions', 'requests')").all();
    const configMap = {};
    for (const row of configRows) {
      try { configMap[row.key] = JSON.parse(row.value); } catch { configMap[row.key] = row.value; }
    }

    const players = Array.isArray(configMap.playerSessions) ? configMap.playerSessions : [];
    const requests = Array.isArray(configMap.requests) ? configMap.requests : [];
    const pending = requests.filter(r => r.status === 'pending').length;
    const events = db.prepare("SELECT COUNT(*) as count FROM events WHERE status IN ('报名中','进行中')").get();
    const signups = db.prepare("SELECT COUNT(*) as count FROM signups").get();
    const logs = db.prepare("SELECT COUNT(*) as count FROM logs WHERE date(created_at) = date('now')").get();
    const lastLog = db.prepare("SELECT created_at FROM logs ORDER BY created_at DESC LIMIT 1").get();
    const images = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(COALESCE(size,0)),0) as size FROM images").get();

    res.json({
      code: 200,
      data: {
        totalPlayers: players.length,
        newPlayersToday: 0,
        pendingRequests: pending,
        totalRequests: requests.length,
        activeEvents: events.count || 0,
        totalSignups: signups.count || 0,
        todayOperations: logs.count || 0,
        lastOperation: lastLog ? lastLog.created_at.replace('T',' ').substring(0,19) : null,
        imageCount: images.count || 0,
        imageSize: images.size ? (images.size / 1024 / 1024).toFixed(1) + ' MB' : '0 MB'
      }
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: 'Failed to load stats', error: error.message });
  }
});

// ---- 操作日志 API ----
app.get('/api/admin/logs', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { startDate, endDate, action, adminName } = req.query;

    const conditions = [];
    const params = [];
    if (startDate) { conditions.push("date(created_at) >= ?"); params.push(startDate); }
    if (endDate) { conditions.push("date(created_at) <= ?"); params.push(endDate); }
    if (action) { conditions.push("action = ?"); params.push(action); }
    if (adminName) { conditions.push("admin_name LIKE ?"); params.push(`%${adminName}%`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM logs ${where}`).get(...params);
    const items = db.prepare(`SELECT id, admin_name, action, detail, ip, created_at FROM logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);

    res.json(success({
      items,
      pagination: {
        page,
        limit,
        total: countRow.total,
        totalPages: Math.ceil(countRow.total / limit)
      }
    }));
  } catch (e) {
    res.status(500).json(error(500, 'Failed to load logs', e.message));
  }
});

// ---- 活动增强 API ----
app.post('/api/admin/events/:id/duplicate', (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ code: 404, message: '活动不存在' });

    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO events (title, type, status, content, schedule, reward, notes, signup_deadline, event_end_at, published, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      (event.title || '新活动') + '（副本）', event.type, '报名中',
      event.content, event.schedule, event.reward, event.notes,
      event.signup_deadline, event.event_end_at, event.published,
      (event.sort_order || 0) + 1, now, now
    );

    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '复制活动', `复制了活动「${event.title}」为新一期`, req.ip, now);

    res.json({ code: 200, message: '复制成功', data: { id: result.lastInsertRowid } });
  } catch (e) {
    res.status(500).json({ code: 500, message: '复制失败', error: e.message });
  }
});

app.post('/api/admin/events/:id/end', (req, res) => {
  try {
    const event = db.prepare('SELECT title FROM events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ code: 404, message: '活动不存在' });

    const now = new Date().toISOString();
    db.prepare("UPDATE events SET status = '已结束', updated_at = ? WHERE id = ?").run(now, req.params.id);

    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '结束活动', `结束了活动「${event.title}」`, req.ip, now);

    res.json({ code: 200, message: '活动已结束' });
  } catch (e) {
    res.status(500).json({ code: 500, message: '操作失败', error: e.message });
  }
});

app.post('/api/admin/events/:id/import-signups', (req, res) => {
  try {
    const event = db.prepare('SELECT title FROM events WHERE id = ?').get(req.params.id);
    if (!event) return res.status(404).json({ code: 404, message: '活动不存在' });

    const signups = db.prepare('SELECT player_name, note FROM signups WHERE event_id = ?').all(req.params.id);
    if (!signups.length) return res.status(400).json({ code: 400, message: '暂无报名名单' });

    const results = signups.map((s, i) => ({ rank: i + 1, player: s.player_name, score: '', reward: '参与奖' }));
    const now = new Date().toISOString();
    db.prepare('UPDATE events SET results = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(results), now, req.params.id);

    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '导入报名到结果', `导入了 ${signups.length} 名报名玩家到活动「${event.title}」`, req.ip, now);

    res.json({ code: 200, message: `成功导入 ${signups.length} 名玩家`, data: { results } });
  } catch (e) {
    res.status(500).json({ code: 500, message: '导入失败', error: e.message });
  }
});

// ---- Hero CRUD (管理) ----
// 新增轮播图
app.post('/api/admin/hero', (req, res) => {
  try {
    const { url, name } = req.body;
    if (!url || !url.trim()) {
      return sendError(res, error(400, '参数错误', '图片URL不能为空'));
    }
    // 获取当前最大 sort_order
    const maxSort = db.prepare("SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM images WHERE type = 'hero'").get();
    const nextOrder = (maxSort.max_sort || 0) + 1;
    const now = new Date().toISOString();

    const result = db.prepare(
      'INSERT INTO images (url, name, type, target_id, sort_order, size, created_at) VALUES (?, ?, ?, NULL, ?, 0, ?)'
    ).run(url.trim(), (name || '').trim() || `hero_${nextOrder}`, 'hero', nextOrder, now);

    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '创建', `新增轮播图: ${url.trim()}`, req.ip, now);

    res.json(success({ id: result.lastInsertRowid, url: url.trim() }, '轮播图添加成功'));
  } catch (e) {
    sendError(res, error(500, '添加轮播图失败', e.message));
  }
});

// 批量替换轮播图（全量更新）
app.put('/api/admin/hero', (req, res) => {
  try {
    const data = req.body;
    const now = new Date().toISOString();
    db.run('BEGIN');
    try {
      // 清除旧的 hero 图片
      db.prepare("DELETE FROM images WHERE type = 'hero'").run();
      // 插入新的
      const images = Array.isArray(data) ? data : (data.images || []);
      images.forEach((url, i) => {
        if (url && typeof url === 'string' && url.length > 10) {
          db.prepare('INSERT INTO images (url, name, type, target_id, sort_order, size, created_at) VALUES (?, ?, ?, NULL, ?, 0, ?)')
            .run(url, `hero_${i + 1}`, 'hero', i + 1, now);
        }
      });
      db.run('COMMIT');
    } catch (txErr) {
      db.run('ROLLBACK');
      throw txErr;
    }
    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '更新', `批量更新轮播图: ${Array.isArray(data) ? data.length : 0} 张`, req.ip, now);
    res.json(success({ count: Array.isArray(data) ? data.length : 0 }, '轮播图已更新'));
  } catch (e) {
    sendError(res, error(500, '更新轮播图失败', e.message));
  }
});

// 更新单张轮播图
app.put('/api/admin/hero/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM images WHERE id = ? AND type = ?').get(id, 'hero');
    if (!existing) {
      return sendError(res, error(404, '轮播图不存在'));
    }
    const { url, sort_order } = req.body;
    const now = new Date().toISOString();

    const updates = [];
    const params = [];
    if (url !== undefined) { updates.push('url = ?'); params.push(url); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(parseInt(sort_order)); }
    if (updates.length === 0) {
      return sendError(res, error(400, '参数错误', '没有需要更新的字段'));
    }
    params.push(id);

    db.prepare(`UPDATE images SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '更新', `更新轮播图 #${id}`, req.ip, now);

    res.json(success({ id: parseInt(id), url: url || existing.url }, '轮播图已更新'));
  } catch (e) {
    sendError(res, error(500, '更新轮播图失败', e.message));
  }
});

// 删除单张轮播图
app.delete('/api/admin/hero/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM images WHERE id = ? AND type = ?').get(id, 'hero');
    if (!existing) {
      return sendError(res, error(404, '轮播图不存在'));
    }
    const now = new Date().toISOString();

    db.prepare('DELETE FROM images WHERE id = ? AND type = ?').run(id, 'hero');

    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '删除', `删除轮播图 #${id}: ${existing.url}`, req.ip, now);

    // 尝试删除物理文件
    if (existing.url && existing.url.startsWith('/uploads/')) {
      const filePath = path.join(ROOT_DIR, '..', existing.url);
      try { fs.unlinkSync(filePath); } catch {}
    }

    res.json(success({ id: parseInt(id) }, '轮播图已删除'));
  } catch (e) {
    sendError(res, error(500, '删除轮播图失败', e.message));
  }
});

app.put('/api/admin/plays', (req, res) => {
  try {
    const data = req.body;
    const now = new Date().toISOString();
    db.run('BEGIN');
    try {
      // 清除旧的玩法记录
      db.prepare("DELETE FROM events WHERE type = 'fixed'").run();
      db.prepare("DELETE FROM images WHERE type = 'play'").run();
      // 插入新的
      const items = Array.isArray(data) ? data : (data.items || []);
      items.forEach((item, i) => {
        const eid = i + 1;
        db.prepare('INSERT INTO events (id, title, type, status, content, schedule, reward, published, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)')
          .run(eid, item.title || '', 'fixed', '常驻', item.text || '', item.subtitle || '', '',
            JSON.stringify({ key: item.key || `play_${eid}`, icon: item.icon || 'package' }), now, now);
        // 插入配图
        const allImgs = [];
        if (item.image) allImgs.push(item.image);
        if (item.images) item.images.forEach(im => { if (!allImgs.includes(im)) allImgs.push(im); });
        allImgs.forEach((url, j) => {
          if (url && url.length > 10) {
            db.prepare('INSERT INTO images (url, name, type, target_id, sort_order, size, created_at) VALUES (?, ?, ?, NULL, ?, 0, ?)')
              .run(url, `${item.key || `play_${eid}`}_${j + 1}`, 'play', j + 1, now);
          }
        });
      });
      db.run('COMMIT');
    } catch (txErr) {
      db.run('ROLLBACK');
      throw txErr;
    }
    res.json(success({ count: items.length }, '玩法已更新'));
  } catch (e) {
    sendError(res, error(500, '更新玩法失败', e.message));
  }
});

// ---- Play Items CRUD (管理) ----
// 新增玩法
app.post('/api/admin/plays', (req, res) => {
  try {
    const { key, icon, title, subtitle, description, points, images } = req.body;
    if (!title) {
      return sendError(res, error(400, '参数错误', '标题不能为空'));
    }
    const now = new Date().toISOString();
    // 获取下一个可用 ID
    const maxId = db.prepare("SELECT COALESCE(MAX(id), 0) as max_id FROM events").get();
    const eid = maxId.max_id + 1;
    const notes = JSON.stringify({
      key: key || `play_${eid}`,
      icon: icon || 'package',
      points: Array.isArray(points) ? points : [],
      sort_order: 0
    });

    db.prepare('INSERT INTO events (id, title, type, status, content, schedule, reward, published, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)')
      .run(eid, title, 'fixed', '常驻', description || '', subtitle || '', '', notes, now, now);

    // 插入配图
    const allImgs = Array.isArray(images) ? images : [];
    allImgs.forEach((url, j) => {
      if (url && url.length > 10) {
        db.prepare('INSERT INTO images (url, name, type, target_id, sort_order, size, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)')
          .run(url, `${key || `play_${eid}`}_${j + 1}`, 'play', eid, j + 1, now);
      }
    });

    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '创建', `新增玩法: ${title}`, req.ip, now);

    res.status(201).json(success({ id: eid, key: key || `play_${eid}` }, '玩法创建成功'));
  } catch (e) {
    sendError(res, error(500, '创建玩法失败', e.message));
  }
});

// 更新单个玩法
app.put('/api/admin/plays/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM events WHERE id = ? AND type = ?').get(id, 'fixed');
    if (!existing) {
      return sendError(res, error(404, '玩法不存在'));
    }
    const { key, icon, title, subtitle, description, points, images } = req.body;
    const now = new Date().toISOString();
    const oldNotes = existing.notes ? JSON.parse(existing.notes) : {};

    const notes = JSON.stringify({
      key: key ?? oldNotes.key,
      icon: icon ?? oldNotes.icon,
      points: Array.isArray(points) ? points : (oldNotes.points || []),
      sort_order: oldNotes.sort_order ?? 0
    });

    db.prepare('UPDATE events SET title=?, content=?, schedule=?, notes=?, updated_at=? WHERE id=?')
      .run(title ?? existing.title, description ?? existing.content, subtitle ?? existing.schedule, notes, now, id);

    // 更新配图：先删旧图再插新图
    if (images !== undefined) {
      db.prepare("DELETE FROM images WHERE type = 'play' AND target_id = ?").run(id);
      const allImgs = Array.isArray(images) ? images : [];
      allImgs.forEach((url, j) => {
        if (url && url.length > 10) {
          db.prepare('INSERT INTO images (url, name, type, target_id, sort_order, size, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)')
            .run(url, `${key || `play_${id}`}_${j + 1}`, 'play', id, j + 1, now);
        }
      });
    }

    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '更新', `更新玩法 #${id}: ${title || existing.title}`, req.ip, now);

    res.json(success({ id: parseInt(id) }, '玩法已更新'));
  } catch (e) {
    sendError(res, error(500, '更新玩法失败', e.message));
  }
});

// 删除单个玩法
app.delete('/api/admin/plays/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM events WHERE id = ? AND type = ?').get(id, 'fixed');
    if (!existing) {
      return sendError(res, error(404, '玩法不存在'));
    }
    const now = new Date().toISOString();

    db.prepare("DELETE FROM images WHERE type = 'play' AND target_id = ?").run(id);
    db.prepare('DELETE FROM events WHERE id = ? AND type = ?').run(id, 'fixed');

    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '删除', `删除玩法 #${id}: ${existing.title}`, req.ip, now);

    res.json(success({ id: parseInt(id) }, '玩法已删除'));
  } catch (e) {
    sendError(res, error(500, '删除玩法失败', e.message));
  }
});

// ---- 统一建议更新接口 (管理) ----
app.put('/api/requests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    if (!existing) {
      return sendError(res, error(404, '建议不存在'));
    }
    const { title, content, category, status, user, contact, agree, disagree, admin_reply, reject_reason, images } = req.body;
    db.prepare(`
      UPDATE requests SET title=?, content=?, category=?, status=?, user=?, contact=?,
        agree=?, disagree=?, admin_reply=?, reject_reason=?, images=?, updated_at=?
      WHERE id=?
    `).run(
      title ?? existing.title, content ?? existing.content, category ?? existing.category,
      status ?? existing.status, user ?? existing.user, contact ?? existing.contact,
      agree ?? existing.agree, disagree ?? existing.disagree,
      admin_reply ?? existing.admin_reply, reject_reason ?? existing.reject_reason,
      JSON.stringify(images ?? JSON.parse(existing.images)),
      new Date().toISOString(), id
    );
    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(req.admin?.username || '管理员', '更新', `更新建议 #${id}: ${title || existing.title}`, req.ip, new Date().toISOString());
    res.json(success({ id: parseInt(id) }, '建议已更新'));
  } catch (e) {
    sendError(res, error(500, '更新建议失败', e.message));
  }
});

// ---- Requests CRUD (管理) ----
app.get('/api/admin/requests', (req, res) => {
  try {
    const { status, category, q, page, limit } = req.query;
    let sql = 'SELECT * FROM requests WHERE 1=1';
    const params = [];
    let countSql = 'SELECT COUNT(*) as total FROM requests WHERE 1=1';
    const countParams = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      countSql += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }
    if (category) {
      sql += ' AND category = ?';
      countSql += ' AND category = ?';
      params.push(category);
      countParams.push(category);
    }
    if (q && q.trim()) {
      const keyword = `%${q.trim()}%`;
      sql += ' AND (title LIKE ? OR content LIKE ? OR user LIKE ?)';
      countSql += ' AND (title LIKE ? OR content LIKE ? OR user LIKE ?)';
      params.push(keyword, keyword, keyword);
      countParams.push(keyword, keyword, keyword);
    }

    const total = db.prepare(countSql).get(...countParams).total;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const requests = db.prepare(sql).all(...params);
    requests.forEach(r => {
      try { r.images = JSON.parse(r.images); } catch { r.images = []; }
    });
    res.json(success({
      items: requests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }));
  } catch (e) {
    sendError(res, error(500, '读取建议失败', e.message));
  }
});

app.post('/api/admin/requests', (req, res) => {
  try {
    const { title, content, category, status, user, contact, images } = req.body;
    if (!title || !content) {
      return sendError(res, error(400, '参数错误', '标题和内容不能为空'));
    }
    const result = db.prepare(`
      INSERT INTO requests (title, content, category, status, user, contact, images, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title, content, category || '优化', status || 'pending',
      user || '匿名', contact || '',
      JSON.stringify(images || []),
      new Date().toISOString(), new Date().toISOString()
    );
    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '创建', `创建建议: ${title}`, req.ip, new Date().toISOString());
    res.status(201).json(success({ id: result.lastInsertRowid }, '建议已创建'));
  } catch (e) {
    sendError(res, error(500, '创建建议失败', e.message));
  }
});

app.put('/api/admin/requests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, status, user, contact, agree, disagree, admin_reply, reject_reason, images } = req.body;

    const existing = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    if (!existing) {
      return sendError(res, error(404, '建议不存在'));
    }

    db.prepare(`
      UPDATE requests SET title=?, content=?, category=?, status=?, user=?, contact=?,
        agree=?, disagree=?, admin_reply=?, reject_reason=?, images=?, updated_at=?
      WHERE id=?
    `).run(
      title ?? existing.title, content ?? existing.content, category ?? existing.category,
      status ?? existing.status, user ?? existing.user, contact ?? existing.contact,
      agree ?? existing.agree, disagree ?? existing.disagree,
      admin_reply ?? existing.admin_reply, reject_reason ?? existing.reject_reason,
      JSON.stringify(images ?? JSON.parse(existing.images)),
      new Date().toISOString(), id
    );
    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '更新', `更新建议 #${id}: ${title || existing.title}`, req.ip, new Date().toISOString());
    res.json(success({ id: parseInt(id) }, '建议已更新'));
  } catch (e) {
    sendError(res, error(500, '更新建议失败', e.message));
  }
});

app.delete('/api/admin/requests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    if (!existing) {
      return sendError(res, error(404, '建议不存在'));
    }
    db.prepare('DELETE FROM requests WHERE id = ?').run(id);
    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '删除', `删除建议 #${id}: ${existing.title}`, req.ip, new Date().toISOString());
    res.json(success({ id: parseInt(id) }, '建议已删除'));
  } catch (e) {
    sendError(res, error(500, '删除建议失败', e.message));
  }
});

// ---- Events CRUD (管理) ----
app.get('/api/admin/events', (req, res) => {
  try {
    const events = db.prepare('SELECT * FROM events ORDER BY created_at DESC').all();
    events.forEach(e => {
      try { e.results = JSON.parse(e.results); } catch { e.results = []; }
    });
    res.json(success(events));
  } catch (e) {
    sendError(res, error(500, '读取活动失败', e.message));
  }
});

app.post('/api/admin/events', (req, res) => {
  try {
    const { title, type, status, content, schedule, reward, signup_deadline, event_end_at, results, reward_date, published, notes } = req.body;
    if (!title) {
      return sendError(res, error(400, '参数错误', '标题不能为空'));
    }
    const result = db.prepare(`
      INSERT INTO events (title, type, status, content, schedule, reward, signup_deadline, event_end_at, results, reward_date, published, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title, type || 'fixed', status || '报名中', content || '', schedule || '', reward || '',
      signup_deadline || null, event_end_at || null,
      JSON.stringify(results || []), reward_date || null, published !== undefined ? (published ? 1 : 0) : 1,
      notes || '', new Date().toISOString(), new Date().toISOString()
    );
    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '创建', `创建活动: ${title}`, req.ip, new Date().toISOString());
    res.status(201).json(success({ id: result.lastInsertRowid }, '活动已创建'));
  } catch (e) {
    sendError(res, error(500, '创建活动失败', e.message));
  }
});

app.put('/api/admin/events/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    if (!existing) {
      return sendError(res, error(404, '活动不存在'));
    }
    const { title, type, status, content, schedule, reward, signup_deadline, event_end_at, results, reward_date, published, notes } = req.body;

    db.prepare(`
      UPDATE events SET title=?, type=?, status=?, content=?, schedule=?, reward=?,
        signup_deadline=?, event_end_at=?, results=?, reward_date=?, published=?, notes=?, updated_at=?
      WHERE id=?
    `).run(
      title ?? existing.title, type ?? existing.type, status ?? existing.status,
      content ?? existing.content, schedule ?? existing.schedule, reward ?? existing.reward,
      signup_deadline !== undefined ? signup_deadline : existing.signup_deadline,
      event_end_at !== undefined ? event_end_at : existing.event_end_at,
      results ? JSON.stringify(results) : existing.results,
      reward_date !== undefined ? reward_date : existing.reward_date,
      published !== undefined ? (published ? 1 : 0) : existing.published,
      notes ?? existing.notes, new Date().toISOString(), id
    );
    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '更新', `更新活动 #${id}: ${title || existing.title}`, req.ip, new Date().toISOString());
    res.json(success({ id: parseInt(id) }, '活动已更新'));
  } catch (e) {
    sendError(res, error(500, '更新活动失败', e.message));
  }
});

app.delete('/api/admin/events/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    if (!existing) {
      return sendError(res, error(404, '活动不存在'));
    }
    db.run('BEGIN');
    try {
      db.prepare('DELETE FROM signups WHERE event_id = ?').run(id);
      db.prepare('DELETE FROM events WHERE id = ?').run(id);
      db.run('COMMIT');
    } catch (txErr) {
      db.run('ROLLBACK');
      throw txErr;
    }
    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '删除', `删除活动 #${id}: ${existing.title}`, req.ip, new Date().toISOString());
    res.json(success({ id: parseInt(id) }, '活动已删除'));
  } catch (e) {
    sendError(res, error(500, '删除活动失败', e.message));
  }
});

// ---- Signups (管理) ----
app.get('/api/admin/signups', (req, res) => {
  try {
    const { event_id } = req.query;
    let sql = 'SELECT s.*, e.title as event_title FROM signups s JOIN events e ON s.event_id = e.id';
    const params = [];
    if (event_id) {
      sql += ' WHERE s.event_id = ?';
      params.push(event_id);
    }
    sql += ' ORDER BY s.created_at DESC';
    const signups = db.prepare(sql).all(...params);
    res.json(success(signups));
  } catch (e) {
    sendError(res, error(500, '读取报名失败', e.message));
  }
});

app.delete('/api/admin/signups/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT s.*, e.title as event_title FROM signups s JOIN events e ON s.event_id = e.id WHERE s.id = ?').get(id);
    if (!existing) {
      return sendError(res, error(404, '报名记录不存在'));
    }
    db.prepare('DELETE FROM signups WHERE id = ?').run(id);
    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '删除', `取消报名 #${id}: ${existing.player_name} 从 ${existing.event_title}`, req.ip, new Date().toISOString());
    res.json(success({ id: parseInt(id) }, '报名已取消'));
  } catch (e) {
    sendError(res, error(500, '取消报名失败', e.message));
  }
});

// ---- Signups: 管理员手动报名 ----
app.post('/api/admin/signups', (req, res) => {
  try {
    const { event_id, player_name, note } = req.body;
    if (!event_id || !player_name) {
      return sendError(res, error(400, '参数错误', '活动ID和玩家名称不能为空'));
    }
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(event_id);
    if (!event) {
      return sendError(res, error(404, '活动不存在'));
    }
    const result = db.prepare('INSERT INTO signups (event_id, player_name, note, created_at) VALUES (?, ?, ?, ?)')
      .run(event_id, player_name, note || '', new Date().toISOString());
    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '创建', `管理员手动报名: ${player_name} -> ${event.title}`, req.ip, new Date().toISOString());
    res.status(201).json(success({ id: result.lastInsertRowid }, '报名成功'));
  } catch (e) {
    sendError(res, error(500, '报名失败', e.message));
  }
});

// ---- Images (管理) 含统计 ----
app.get('/api/admin/images', (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT id, url, name, size, created_at FROM images WHERE 1=1';
    const params = [];
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    sql += ' ORDER BY created_at DESC';
    const items = db.prepare(sql).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(COALESCE(size,0)),0) as totalSize FROM images').get();
    res.json(success({
      items,
      total: total.count || 0,
      totalSize: total.totalSize || 0
    }));
  } catch (e) {
    sendError(res, error(500, '读取图片失败', e.message));
  }
});

app.post('/api/admin/images', uploadByType.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, error(400, '参数错误', '请上传图片文件'));
    }
    const { type, target_id, name, sort_order } = req.body;
    const imageType = type || 'library';
    const url = `/uploads/images/${imageType}/${req.file.filename}`;

    const result = db.prepare(`
      INSERT INTO images (url, name, type, target_id, sort_order, size, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      url, name || safeOrigName(req.file), imageType,
      target_id ? parseInt(target_id) : null,
      sort_order ? parseInt(sort_order) : 0,
      req.file.size, new Date().toISOString()
    );

    res.status(201).json(success({
      id: result.lastInsertRowid,
      url,
      name: name || safeOrigName(req.file),
      type: imageType,
    }, '图片已上传'));
  } catch (e) {
    // 上传失败时清理已保存的文件
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    sendError(res, error(500, '上传图片失败', e.message));
  }
});

// ---- 图片上传（新版，日期目录） ----
app.post('/api/admin/images/upload', (req, res, next) => {
  uploadByDate.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, error(413, '文件太大', '图片大小不能超过 5MB'));
        }
        return sendError(res, error(400, '上传错误', err.message));
      }
      if (err.message && err.message.startsWith('不支持的文件类型')) {
        return sendError(res, error(400, '文件类型错误', err.message));
      }
      return sendError(res, error(500, '上传失败', err.message));
    }

    if (!req.file) {
      return sendError(res, error(400, '参数错误', '未接收到图片文件'));
    }

    try {
      const now = new Date();
      const url = `/uploads/images/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${req.file.filename}`;
      const reqType = req.body?.type || 'library';

      const result = db.prepare(`
        INSERT INTO images (url, name, type, target_id, sort_order, size, created_at)
        VALUES (?, ?, ?, NULL, 0, ?, ?)
      `).run(url, safeOrigName(req.file), reqType, req.file.size, new Date().toISOString());

      db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
        .run('管理员', '上传', `上传图片: ${safeOrigName(req.file)} (${(req.file.size / 1024).toFixed(1)}KB)`, req.ip, new Date().toISOString());

      res.status(201).json(success({
        id: result.lastInsertRowid,
        url,
        name: safeOrigName(req.file),
        size: req.file.size,
      }, '上传成功'));
    } catch (e) {
      try { fs.unlinkSync(req.file.path); } catch {}
      sendError(res, error(500, '上传图片失败', e.message));
    }
  });
});

// ---- 批量删除图片 ----
app.delete('/api/admin/images/batch', (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return sendError(res, error(400, '参数错误', '请提供要删除的 IDs'));
    }
    const idList = ids.split(',').map(Number).filter(id => id > 0);
    if (idList.length === 0) {
      return sendError(res, error(400, '参数错误', '无效的 IDs'));
    }

    // 获取图片路径
    const placeholders = idList.map(() => '?').join(',');
    const images = db.prepare(`SELECT url FROM images WHERE id IN (${placeholders})`).all(...idList);

    // 删除物理文件
    images.forEach(img => {
      if (img.url && !img.url.startsWith('http')) {
        const filePath = path.join(UPLOADS_DIR, img.url.replace('/uploads/', ''));
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
      }
    });

    // 删除数据库记录
    db.prepare(`DELETE FROM images WHERE id IN (${placeholders})`).run(...idList);

    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '批量删除图片', `删除了 ${idList.length} 张图片`, req.ip, new Date().toISOString());
    res.json(success({ deleted: idList.length }, `成功删除 ${idList.length} 张图片`));
  } catch (e) {
    sendError(res, error(500, '批量删除失败', e.message));
  }
});

app.delete('/api/admin/images/:id', (req, res) => {
  try {
    const { id } = req.params;
    const image = db.prepare('SELECT * FROM images WHERE id = ?').get(id);
    if (!image) {
      return sendError(res, error(404, '图片不存在'));
    }
    // 尝试删除文件
    const filePath = path.join(UPLOADS_DIR, image.url.replace('/uploads/', ''));
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}

    db.prepare('DELETE FROM images WHERE id = ?').run(id);

    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '删除图片', `删除了图片 ID:${id}`, req.ip, new Date().toISOString());
    res.json(success({ id: parseInt(id) }, '图片已删除'));
  } catch (e) {
    sendError(res, error(500, '删除图片失败', e.message));
  }
});

// ---- Logs (管理) 分页 + 筛选 ----
app.get('/api/admin/logs', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { action, adminName, startDate, endDate } = req.query;

    let countSql = 'SELECT COUNT(*) as total FROM logs WHERE 1=1';
    let dataSql = 'SELECT * FROM logs WHERE 1=1';
    const params = [];
    const countParams = [];

    // 操作类型筛选
    if (action) {
      dataSql += ' AND action = ?';
      countSql += ' AND action = ?';
      params.push(action);
      countParams.push(action);
    }

    // 操作人筛选
    if (adminName) {
      dataSql += ' AND admin_name = ?';
      countSql += ' AND admin_name = ?';
      params.push(adminName);
      countParams.push(adminName);
    }

    // 开始日期筛选
    if (startDate) {
      dataSql += ' AND created_at >= ?';
      countSql += ' AND created_at >= ?';
      params.push(startDate);
      countParams.push(startDate);
    }

    // 结束日期筛选
    if (endDate) {
      dataSql += ' AND created_at <= ?';
      countSql += ' AND created_at <= ?';
      params.push(endDate + 'T23:59:59');
      countParams.push(endDate + 'T23:59:59');
    }

    // 获取总数
    const total = db.prepare(countSql).get(...countParams).total;

    // 获取分页数据
    dataSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const items = db.prepare(dataSql).all(...params);

    res.json(success({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    }));
  } catch (e) {
    sendError(res, error(500, '读取日志失败', e.message));
  }
});

// ---- Dashboard Stats (管理) ----
app.get('/api/admin/dashboard', (req, res) => {
  try {
    const stats = {
      configCount: db.prepare('SELECT COUNT(*) as cnt FROM config').get().cnt,
      requestCount: db.prepare('SELECT COUNT(*) as cnt FROM requests').get().cnt,
      requestByStatus: {
        pending: db.prepare("SELECT COUNT(*) as cnt FROM requests WHERE status = 'pending'").get().cnt,
        planned: db.prepare("SELECT COUNT(*) as cnt FROM requests WHERE status = 'planned'").get().cnt,
        done: db.prepare("SELECT COUNT(*) as cnt FROM requests WHERE status = 'done'").get().cnt,
        rejected: db.prepare("SELECT COUNT(*) as cnt FROM requests WHERE status = 'rejected'").get().cnt,
      },
      eventCount: db.prepare('SELECT COUNT(*) as cnt FROM events').get().cnt,
      signupCount: db.prepare('SELECT COUNT(*) as cnt FROM signups').get().cnt,
      imageCount: db.prepare('SELECT COUNT(*) as cnt FROM images').get().cnt,
      imageByType: db.prepare('SELECT type, COUNT(*) as cnt FROM images GROUP BY type').all(),
      logCount: db.prepare('SELECT COUNT(*) as cnt FROM logs').get().cnt,
      recentLogs: db.prepare('SELECT * FROM logs ORDER BY created_at DESC LIMIT 5').all(),
    };
    res.json(success(stats));
  } catch (e) {
    sendError(res, error(500, '读取仪表盘失败', e.message));
  }
});

// ============================================================
// 静态页面服务
// ============================================================

app.get('/', (req, res) => {
  res.sendFile(STATIC_HTML);
});

app.get('/erp14-server-showcase.html', (req, res) => {
  res.sendFile(STATIC_HTML);
});

// ============================================================
// Multer 错误处理
// ============================================================

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, error(413, '文件太大', '图片大小不能超过 5MB'));
    }
    return sendError(res, error(400, '上传错误', err.message));
  }
  if (err.message && (err.message.startsWith('不支持的文件类型') || err.message.startsWith('Unexpected field'))) {
    return sendError(res, error(400, '文件类型错误', err.message));
  }
  next(err);
});

// ============================================================
// 备份恢复 API
// ============================================================

// 按模块导出
app.get('/api/admin/export', (req, res) => {
  try {
    const { modules } = req.query;
    if (!modules) {
      return sendError(res, error(400, '参数错误', '请指定要导出的模块'));
    }
    const moduleList = modules.split(',');
    const result = {};

    if (moduleList.includes('config')) {
      const configs = db.prepare('SELECT key, value FROM config').all();
      result.config = Object.fromEntries(configs.map(c => [c.key, JSON.parse(c.value)]));
    }
    if (moduleList.includes('requests')) {
      result.requests = db.prepare('SELECT * FROM requests').all();
    }
    if (moduleList.includes('events')) {
      result.events = db.prepare('SELECT * FROM events').all();
    }
    if (moduleList.includes('signups')) {
      result.signups = db.prepare('SELECT * FROM signups').all();
    }
    if (moduleList.includes('images')) {
      result.images = db.prepare('SELECT id, url, name, size, type, created_at FROM images').all();
    }

    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '导出数据', `导出了 ${modules} 模块`, req.ip, new Date().toISOString());
    res.json(success(result, '导出成功'));
  } catch (e) {
    sendError(res, error(500, '导出失败', e.message));
  }
});

// 按模块导入
app.post('/api/admin/import', (req, res) => {
  try {
    const { modules, data } = req.body;
    if (!modules || !data) {
      return sendError(res, error(400, '参数错误', '请提供模块列表和数据'));
    }

    // 先备份当前数据到文件
    const backupDir = path.join(ROOT_DIR, '..', 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const backup = {};
    backup.config = db.prepare('SELECT key, value FROM config').all();
    backup.requests = db.prepare('SELECT * FROM requests').all();
    backup.events = db.prepare('SELECT * FROM events').all();
    backup.signups = db.prepare('SELECT * FROM signups').all();
    backup.images = db.prepare('SELECT * FROM images').all();
    const backupFile = path.join(backupDir, `auto_backup_${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    const imported = [];

    if (modules.includes('config') && data.config) {
      for (const [key, value] of Object.entries(data.config)) {
        db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
      }
      imported.push('配置');
    }
    if (modules.includes('requests') && data.requests) {
      db.prepare('DELETE FROM requests').run();
      for (const item of data.requests) {
        db.prepare('INSERT INTO requests (id, title, content, category, status, user, contact, agree, disagree, admin_reply, reject_reason, images, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          item.id, item.title, item.content, item.category, item.status, item.user, item.contact, item.agree || 0, item.disagree || 0, item.admin_reply || null, item.reject_reason || null, item.images || null, item.created_at, item.updated_at
        );
      }
      imported.push('建议');
    }
    if (modules.includes('events') && data.events) {
      db.prepare('DELETE FROM events').run();
      for (const item of data.events) {
        db.prepare('INSERT INTO events (id, title, type, status, content, schedule, reward, notes, signup_deadline, event_end_at, results, reward_date, published, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          item.id, item.title, item.type, item.status, item.content, item.schedule, item.reward, item.notes, item.signup_deadline, item.event_end_at, item.results, item.reward_date, item.published ?? 1, item.sort_order || 0, item.created_at, item.updated_at
        );
      }
      imported.push('活动');
    }
    if (modules.includes('signups') && data.signups) {
      db.prepare('DELETE FROM signups').run();
      for (const item of data.signups) {
        db.prepare('INSERT INTO signups (id, event_id, player_name, note, created_at) VALUES (?, ?, ?, ?, ?)').run(
          item.id, item.event_id, item.player_name, item.note, item.created_at
        );
      }
      imported.push('报名');
    }
    if (modules.includes('images') && data.images) {
      db.prepare('DELETE FROM images').run();
      for (const item of data.images) {
        db.prepare('INSERT INTO images (id, url, name, size, type, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
          item.id, item.url, item.name, item.size || 0, item.type || 'library', item.created_at
        );
      }
      imported.push('图片');
    }

    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '导入数据', `导入了 ${imported.join('、')} 模块，备份已保存`, req.ip, new Date().toISOString());
    res.json(success({ imported: imported.join('、'), backup: backupFile }, `成功导入 ${imported.join('、')}`));
  } catch (e) {
    sendError(res, error(500, '导入失败', e.message));
  }
});

// 重置默认数据
app.post('/api/admin/reset', (req, res) => {
  try {
    // 先备份
    const backupDir = path.join(ROOT_DIR, '..', 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const backup = {};
    backup.config = db.prepare('SELECT key, value FROM config').all();
    backup.requests = db.prepare('SELECT * FROM requests').all();
    backup.events = db.prepare('SELECT * FROM events').all();
    backup.signups = db.prepare('SELECT * FROM signups').all();
    backup.images = db.prepare('SELECT * FROM images').all();
    const backupFile = path.join(backupDir, `reset_backup_${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    // 重新运行 schema 初始化（删除旧数据）
    const schemaPath = path.join(ROOT_DIR, 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      // 删除所有数据（保留表结构）
      db.prepare('DELETE FROM signups').run();
      db.prepare('DELETE FROM events').run();
      db.prepare('DELETE FROM requests').run();
      db.prepare('DELETE FROM images').run();
      db.prepare('DELETE FROM config').run();
      db.prepare('DELETE FROM logs').run();
      // 重新插入默认配置
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      // 只提取 INSERT OR IGNORE INTO config 语句
      const configInserts = schema.match(/INSERT OR IGNORE INTO config[\s\S]*?;/g);
      if (configInserts) {
        configInserts.forEach(sql => { try { db.exec(sql); } catch {} });
      }
    }

    db.prepare('INSERT INTO logs (admin_name, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?)')
      .run('管理员', '重置数据', '已恢复默认数据，备份已保存', req.ip, new Date().toISOString());
    res.json(success({ backup: backupFile }, '已恢复默认数据'));
  } catch (e) {
    sendError(res, error(500, '恢复失败', e.message));
  }
});

// ============================================================
// 404 处理
// ============================================================

app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', error: `路径 ${req.method} ${req.path} 未找到` });
});

// ============================================================
// 全局错误处理
// ============================================================

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    code: statusCode,
    message: err.message || '服务器内部错误',
    error: err.detail || (process.env.NODE_ENV === 'development' ? err.stack : ''),
  });
});

// ============================================================
// 启动服务器
// ============================================================

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('  ERP14 SCUM RESTful API Server (Express + SQLite)');
    console.log(`  端口: ${PORT}`);
    console.log(`  页面: http://127.0.0.1:${PORT}/`);
    console.log(`  管理员: ${DEFAULT_ADMIN_USER} / <由环境变量或默认值设置>`);
    console.log(`  数据库: ${DB_PATH}`);
    console.log('='.repeat(60));
  });
}

module.exports = { app, waitForDb };
