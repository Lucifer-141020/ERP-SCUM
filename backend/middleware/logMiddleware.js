// ============================================================
// logMiddleware.js — 操作日志自动记录中间件
// ============================================================
// 自动拦截 POST / PUT / DELETE 请求，在成功响应时记录操作日志
// 使用方式：
//   const logOperation = require('./middleware/logMiddleware')(db);
//   app.use('/api/admin', verifyToken, logOperation);
// ============================================================

/**
 * 生成描述文本 —— 从请求中提取有意义的操作详情
 */
function extractDetail(req) {
  const body = req.body || {};

  // 登录
  if (req.path === '/api/admin/login') {
    return body.username || '管理员登录';
  }

  // 有 title 优先（建议、活动、配置等）
  if (body.title) return body.title;

  // 文件名
  if (req.file) return req.file.originalname;

  // name 字段
  if (body.name) return body.name;

  // 单 key 配置更新
  if (req.params && req.params.key) return `配置: ${req.params.key}`;

  // 批量配置更新
  if (req.path.includes('/site-config') && typeof body === 'object') {
    const keys = Object.keys(body);
    if (keys.length > 0) return `更新 ${keys.length} 个配置项`;
  }

  // ID 参数（删除等操作）
  if (req.params && req.params.id) return `ID: ${req.params.id}`;

  // 报名
  if (body.playerName) return `报名: ${body.playerName}`;

  return '无详情';
}

/**
 * 根据请求方法和路径生成操作名称
 */
function getActionName(method, path) {
  const map = {
    'POST /api/admin/login': '登录',
    'POST /api/admin/site-config': '更新配置',
    'PUT /api/admin/site-config': '更新配置',
    'POST /api/admin/requests': '创建建议',
    'PUT /api/admin/requests': '更新建议',
    'DELETE /api/admin/requests': '删除建议',
    'POST /api/admin/events': '创建活动',
    'PUT /api/admin/events': '更新活动',
    'DELETE /api/admin/events': '删除活动',
    'POST /api/images/upload': '上传图片',
    'POST /api/admin/images': '上传图片',
    'DELETE /api/admin/images': '删除图片',
    'DELETE /api/admin/signups': '取消报名',
    'GET /api/admin/export': '导出数据',
    'POST /api/admin/import': '导入数据',
    'POST /api/events/signup': '活动报名',
  };

  // 精确匹配
  const key = `${method} ${path}`;
  if (map[key]) return map[key];

  // 前缀匹配：/api/admin/requests/:id
  for (const [pattern, action] of Object.entries(map)) {
    const [m, p] = pattern.split(' ');
    if (m === method) {
      // 将模式中的 :id 替换为通配符
      const regex = new RegExp(
        '^' + p.replace(/:\w+/g, '[^/]+') + '$'
      );
      if (regex.test(path)) return action;
    }
  }

  return '未知操作';
}

/**
 * 创建日志中间件工厂函数
 * @param {Object} db - 数据库实例（需有 prepare().run() 方法）
 */
function createLogMiddleware(db) {
  if (!db) {
    console.warn('[logMiddleware] db 未传入，日志中间件禁用');
    return (req, res, next) => next();
  }

  return function logOperation(req, res, next) {
    // 只记录 POST、PUT、DELETE 请求
    const methods = ['POST', 'PUT', 'DELETE'];
    if (!methods.includes(req.method)) {
      return next();
    }

    // 跳过公开的玩家报名（/api/events/:id/signup）——已由路由内部自己记录
    // 跳过图片 GET 请求
    if (req.method === 'GET') return next();

    // 保存原始 res.json 方法
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      // 仅在响应成功时记录（code 200 或 201）
      if (data && (data.code === 200 || data.code === 201)) {
        try {
          const adminName = req.admin?.username || '系统';
          const action = getActionName(req.method, req.path);
          const detail = extractDetail(req);
          const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
          const now = new Date().toISOString();

          db.prepare(
            `INSERT INTO logs (admin_name, action, detail, ip, created_at)
             VALUES (?, ?, ?, ?, ?)`
          ).run(adminName, action, detail.slice(0, 500), ip, now);
        } catch (e) {
          console.error('[logMiddleware] 写入日志失败:', e.message);
        }
      }

      // 调用原始 res.json
      originalJson(data);
    };

    next();
  };
}

module.exports = createLogMiddleware;
