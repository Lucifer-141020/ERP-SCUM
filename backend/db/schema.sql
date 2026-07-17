-- ============================================================
-- ERP14-SCUM 数据库表结构
-- 数据库: SQLite 3
-- 创建日期: 2026-07-06
-- ============================================================

-- 启用外键约束
PRAGMA foreign_keys = ON;

-- ============================================================
-- 0. admin — 管理员账号表
-- ============================================================
CREATE TABLE IF NOT EXISTS admin (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    UNIQUE NOT NULL,           -- 管理员用户名
    password_hash TEXT    NOT NULL,                  -- bcrypt 密码哈希
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP -- 创建时间
);

-- 管理员账号由服务器启动时根据环境变量初始化；生产环境不得使用默认凭据。

-- ============================================================
-- 1. config — 网站配置表
--    以 key-value 形式存储站点全局配置项
-- ============================================================
CREATE TABLE IF NOT EXISTS config (
    key         TEXT PRIMARY KEY,                  -- 配置键名
    value       TEXT,                              -- 配置值（JSON 格式存储）
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP -- 最后更新时间
);

-- 初始化配置数据
INSERT OR IGNORE INTO config (key, value) VALUES
    ('site_title',       '"ERP 14"'),
    ('site_description', '"一个面向长期玩家的 SCUM 生存服务器。"'),
    ('season_text',      '"赛季进行中 · 长期稳定开放"'),
    ('server_no',        '"Erp 14-A"'),
    ('server_ip',        '"127.0.0.1:7777"'),
    ('group_number',     '"123456789"'),
    ('join_text',        '"加入玩家群"'),
    ('join_url',         '"https://qm.qq.com/q/mJgyxzi2YM"'),
    ('join_application', '"申请加入时请备注你的 SCUM 游戏内名称。"'),
    ('theme_color',      '"#1f7a4d"');


-- ============================================================
-- 2. requests — 玩家建议表
--    玩家提交的建议/反馈，支持投票和管理回复
-- ============================================================
CREATE TABLE IF NOT EXISTS requests (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT NOT NULL,
    content       TEXT NOT NULL,
    category      TEXT DEFAULT '优化',             -- 分类
    status        TEXT DEFAULT 'pending',           -- pending / planned / done / rejected
    user          TEXT NOT NULL,
    contact       TEXT,
    agree         INTEGER DEFAULT 0,
    disagree      INTEGER DEFAULT 0,
    admin_reply   TEXT,
    reject_reason TEXT,
    images        JSON,                            -- 图片路径数组
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引：按状态、分类、时间查询
CREATE INDEX IF NOT EXISTS idx_requests_status   ON requests (status);
CREATE INDEX IF NOT EXISTS idx_requests_category ON requests (category);
CREATE INDEX IF NOT EXISTS idx_requests_created  ON requests (created_at DESC);


-- ============================================================
-- 3. events — 活动表
--    周常活动/公告，支持报名和排名结果
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT NOT NULL,
    type            TEXT DEFAULT 'signup',          -- signup / fixed
    status          TEXT DEFAULT '报名中',           -- 报名中 / 进行中 / 已结束 / 已颁奖 / 常驻
    content         TEXT,                           -- 活动内容/规则
    schedule        TEXT,                           -- 开放时间
    reward          TEXT,                           -- 奖励说明
    signup_deadline DATETIME,
    event_end_at    DATETIME,
    results         JSON,                           -- [{rank, player, score, reward}]
    reward_date     TEXT,
    published       BOOLEAN DEFAULT 1,
    notes           TEXT,
    sort_order      INTEGER DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引：按类型、发布状态、截止时间查询
CREATE INDEX IF NOT EXISTS idx_events_type      ON events (type);
CREATE INDEX IF NOT EXISTS idx_events_status    ON events (status);
CREATE INDEX IF NOT EXISTS idx_events_published ON events (published, created_at DESC);


-- ============================================================
-- 4. signups — 报名表
--    玩家活动报名记录
-- ============================================================
CREATE TABLE IF NOT EXISTS signups (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id    INTEGER NOT NULL,
    player_name TEXT NOT NULL,
    note        TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
);

-- 索引：按活动查询报名列表、按时间倒序
CREATE INDEX IF NOT EXISTS idx_signups_event_id ON signups (event_id);
CREATE INDEX IF NOT EXISTS idx_signups_created  ON signups (created_at DESC);


-- ============================================================
-- 5. images — 图片表
--    统一管理所有上传图片，支持按类型和业务关联
-- ============================================================
CREATE TABLE IF NOT EXISTS images (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    url         TEXT NOT NULL,                     -- 图片访问路径
    name        TEXT,                              -- 图片名称
    type        TEXT,                              -- hero / play / template / group / rules / library / request
    target_id   INTEGER,                           -- 关联的业务 ID（如 play 的 id）
    sort_order  INTEGER DEFAULT 0,                 -- 排序
    size        INTEGER,                           -- 文件大小（字节）
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引：按类型查询、按类型+关联 ID 查询、按排序
CREATE INDEX IF NOT EXISTS idx_images_type         ON images (type);
CREATE INDEX IF NOT EXISTS idx_images_target       ON images (type, target_id);
CREATE INDEX IF NOT EXISTS idx_images_sort_order   ON images (type, sort_order);


-- ============================================================
-- 6. logs — 操作日志表
--    记录管理员的增删改查和登录等操作
-- ============================================================
CREATE TABLE IF NOT EXISTS logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_name  TEXT,
    action      TEXT,                              -- 操作类型：创建/更新/删除/登录/导出
    detail      TEXT,                              -- 详细描述
    ip          TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引：按操作类型、时间倒序查询
CREATE INDEX IF NOT EXISTS idx_logs_action    ON logs (action);
CREATE INDEX IF NOT EXISTS idx_logs_created   ON logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_admin     ON logs (admin_name, created_at DESC);


-- ============================================================
-- 结束
-- ============================================================
