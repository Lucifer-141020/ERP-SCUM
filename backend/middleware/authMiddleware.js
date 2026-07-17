// ============================================================
// authMiddleware.js — JWT 认证中间件
// ============================================================
// 验证 Bearer token 并注入 req.admin
// 使用方式：
//   const verifyToken = require('./middleware/authMiddleware');
//   app.use('/api/admin', verifyToken);
//   app.post('/api/admin/login', handler); // 无需认证
// ============================================================

const jwt = require('jsonwebtoken');

const { jwtSecret: JWT_SECRET } = require('../config');

/**
 * JWT 认证中间件
 * 从 Authorization header 提取 Bearer token，验证后将 decoded payload 注入 req.admin
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. 检查是否有 Authorization header 且格式为 Bearer
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '未登录，请先登录'
    });
  }

  // 2. 提取 token
  const token = authHeader.split(' ')[1];

  // 3. 验证 token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;   // { username, role, iat, exp }
    next();
  } catch (error) {
    // token 过期或无效
    return res.status(401).json({
      code: 401,
      message: '登录已过期，请重新登录'
    });
  }
}

module.exports = verifyToken;
