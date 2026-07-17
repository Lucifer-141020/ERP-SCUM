-- ============================================================
-- ERP14-SCUM 数据库初始化脚本
-- 使用方式（命令行）:
--   sqlite3 erp14.db < schema.sql
--   sqlite3 erp14.db < init.sql
-- 使用方式（Node.js）:
--   const db = new sqlite3.Database('erp14.db');
--   db.exec(fs.readFileSync('schema.sql','utf8'));
--   db.exec(fs.readFileSync('init.sql','utf8'));
-- ============================================================

-- 先执行建表 + 索引
.read schema.sql

-- ============================================================
-- 初始化示例数据
-- ============================================================

-- config 已在 schema.sql 中初始化，此处跳过

-- requests：示例建议
INSERT OR IGNORE INTO requests (id, title, content, category, status, user, contact, agree, disagree, admin_reply, reject_reason, images)
VALUES
    (1, '增加周末车队护送活动',
     '希望每周固定一次护送活动，路线提前公布，劫车和护送双方都有奖励。',
     '新玩法/活动', 'pending', 'Lucifer', 'QQ 已登记', 12, 1, '', '', '[]'),

    (2, '开放新手补给领取',
     '建议新玩家第一次进入服务器可以领取基础工具、食物和小背包。',
     '优化', 'planned', '若云', 'QQ 已登记', 19, 0,
     '已进入计划，准备和新手礼包一起调整。', '', '[]'),

    (3, '优化交易区公告',
     '交易规则已经整理到网站首页，后续会加入更详细的商品分类说明。',
     '优化', 'done', '小颜', 'QQ 已登记', 8, 0,
     '已完成，后续继续补充商品分类。', '', '[]'),

    (4, '新增新手基地模板',
     '已加入适合新玩家购买的紧凑型基地模板，降低前期开荒建造成本。',
     '优化', 'done', '北风', 'QQ 已登记', 15, 1, '', '', '[]'),

    (5, '调整活动奖励说明',
     '活动奖励已经改为提前公示，玩家可以在活动前确认参与目标和领取规则。',
     '优化', 'done', 'Mint', 'Discord 已登记', 11, 0, '', '', '[]'),

    (6, '示例：无法复现的问题',
     '这是一个已拒绝建议示例，用于展示管理员拒绝原因。',
     'BUG', 'rejected', '玩家示例', 'QQ 已登记', 1, 0, '',
     '信息不足，暂时无法复现，请补充截图或具体位置。', '[]');

-- events：示例活动/公告
INSERT OR IGNORE INTO events (id, title, type, status, content, schedule, reward, signup_deadline, event_end_at, results, reward_date, published, notes)
VALUES
    (1, '周末空投争夺开启', 'signup', '报名中',
     '周六 20:30 开启空投争夺，活动区内允许 PVP，结束后统一发放参与奖励。',
     '每周六 20:30', '参与奖励 + 击杀奖励',
     '2026-12-31 20:00', '2026-12-31 23:00',
     '[]', NULL, 1, ''),

    (2, '基地评选活动', 'signup', '报名中',
     '开放基地投稿和投票，优秀作品会展示在网站首页。',
     '每月最后一周', '第一名：称号 + 金币奖励',
     '2026-12-31 21:00', '2027-01-01 00:00',
     '[]', NULL, 1, ''),

    (3, '新手保护范围调整', 'fixed', '常驻',
     '新玩家保护期内禁止恶意蹲守出生点，违规行为将记录并处罚。',
     '', '',
     NULL, NULL,
     '[]', NULL, 1, ''),

    (4, '交易区展示页整理', 'fixed', '常驻',
     '网站新增交易区、基地经营和活动玩法说明，方便玩家入服前了解规则。',
     '', '',
     NULL, NULL,
     '[]', NULL, 1, '');

-- signups：示例报名（关联 events[1] 周末空投）
INSERT OR IGNORE INTO signups (id, event_id, player_name, note)
VALUES
    (1, 1, 'Lucifer', '带 3 人小队参加'),
    (2, 1, '若云', '单人参加'),
    (3, 1, '北风', '第一次参加空投活动');

-- images：示例图片引用
INSERT OR IGNORE INTO images (id, url, name, type, target_id, sort_order)
VALUES
    (1, 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1800&q=80', '森林晨光', 'hero', NULL, 1),
    (2, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80', '山间湖泊', 'hero', NULL, 2),
    (3, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1800&q=80', '林间光影', 'hero', NULL, 3),
    (4, 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80', '新手安全屋', 'template', 1, 1);

-- logs：示例操作日志
INSERT OR IGNORE INTO logs (id, admin_name, action, detail, ip)
VALUES
    (1, '管理员', '登录', '管理员登录系统', '127.0.0.1'),
    (2, '管理员', '更新', '更新了周末空投活动的奖励说明', '127.0.0.1'),
    (3, '管理员', '回复', '回复了玩家"若云"的建议', '127.0.0.1');
