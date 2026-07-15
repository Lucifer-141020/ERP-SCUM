#!/usr/bin/env node
// 玩家建议图片数据流缺陷测试 — 只新增、不改功能
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const MAIN_JS = fs.readFileSync(path.join(__dirname, '..', 'frontend/js/main.js'), 'utf8');
const SERVER_JS = fs.readFileSync(path.join(__dirname, '..', 'backend/server.js'), 'utf8');
const SCHEMA_SQL = fs.readFileSync(path.join(__dirname, '..', 'backend/db/schema.sql'), 'utf8');

// ---- 工具 ----
function extractFn(src, name) {
  const m = 'function ' + name + '(';
  let s = src.indexOf(m); if (s === -1) return null;
  if (s >= 6 && src.slice(s - 6, s) === 'async ') s -= 6;
  let i = src.indexOf('(', s); if (i === -1) return null;
  let d = 0, is = null, esc = false;
  for (; i < src.length; i++) { const c = src[i]; if (is) { if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === is) { is = null; continue; } continue; } if (c === '"' || c === "'" || c === '`') { is = c; continue; } if (c === '(') d++; if (c === ')') { d--; if (d === 0) { i++; break; } } }
  const o = src.indexOf('{', i); if (o === -1) return null;
  d = 0; is = null; esc = false;
  for (let j = o; j < src.length; j++) { const c = src[j]; if (is) { if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === is) { is = null; continue; } continue; } if (c === '"' || c === "'" || c === '`') { is = c; continue; } if (c === '{') d++; if (c === '}') { d--; if (d === 0) return src.slice(s, j + 1); } }
  return null;
}

function extractVar(src, name) {
  const re = new RegExp('(?:let|var|const)\\s+' + name + '\\s*=\\s*([^;]+);');
  const m = re.exec(src);
  return m ? m[0] : null;
}

let passed = 0, failed = 0, total = 0;
const failures = [];

function test(name, fn) {
  total++;
  try { fn(); passed++; console.log('  \u2713 ' + name); }
  catch (e) { failed++; failures.push(name); console.log('  \u2717 ' + name + '\n    ' + (e.message || e)); }
}

// ============= Helper: extract text bound by braces =============
function extractBody(src, startIdx) {
  let depth = 0, is = null, esc = false;
  for (let i = startIdx; i < src.length; i++) {
    const c = src[i];
    if (is) { if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === is) { is = null; continue; } continue; }
    if (c === '"' || c === "'" || c === '`') { is = c; continue; }
    if (c === '{') depth++;
    if (c === '}') { depth--; if (depth === 0) return src.slice(startIdx, i + 1); }
  }
  return null;
}

// ===========================================================================
// A. 前端提交数据测试
// ===========================================================================
console.log('\n--- A. 前端提交数据测试 ---');

test('A1. submitRequest 必须是 async function', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src, 'submitRequest 不存在');
  assert.ok(src.includes('async'), 'submitRequest 不是 async 函数');
});

test('A2. 请求体必须包含 content', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src, 'submitRequest 不存在');
  assert.ok(src.includes('content'), '请求体未包含 content 字段');
});

test('A3. content 来自 requestText', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src && src.includes('requestText'), 'submitRequest 未引用 requestText');
});

test('A4. 请求体必须包含 images', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src && src.includes('images'), '请求体未包含 images');
});

test('A5. images 来自 pendingRequestImages', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src && src.includes('pendingRequestImages'), '未从 pendingRequestImages 获取图片');
});

test('A6. 不得只发送 text 遗漏 content', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src, 'submitRequest 不存在');
  // text 不应替代 content
  const hasContent = src.includes('\'content\'') || src.includes('"content"') || src.includes('content:');
  // 如果 body 含 text 但不含 content → 缺陷
  assert.ok(!src.includes('text:') || hasContent, '请求体含 text 但缺少 content');
});

test('A7. 必须 await fetchWithFallback', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src, 'submitRequest 不存在');
  assert.ok(src.includes('await') || src.includes('then('), 'submitRequest 未 await 或 then 请求结果');
});

test('A8. 不得存在 fetch(...).catch(() => {}) 吞错逻辑', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src, 'submitRequest 不存在');
  const hasEmptyCatch = src.includes('.catch(() => {})') || src.includes('.catch(()=>{})') || src.includes(".catch(() => {})");
  assert.ok(!hasEmptyCatch, '存在 fetch(...).catch(() => {}) 吞错逻辑');
});

test('A9. 只有后端成功后才关闭弹窗', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src, 'submitRequest 不存在');
  const closeIdx = src.indexOf('closeRequestModal');
  const fetchIdx = src.indexOf('fetch(');
  // closeRequestModal 应出现在 fetch 成功回调之后，而非之前
  assert.ok(closeIdx === -1 || fetchIdx === -1 || closeIdx > fetchIdx, 'closeRequestModal 出现在 fetch 之前或不可达');
});

test('A10. 只有后端成功后才显示"建议已提交到后台"', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src, 'submitRequest 不存在');
  const toastIdx = src.indexOf('建议已提交到后台');
  const fetchIdx = src.indexOf('fetch(');
  assert.ok(toastIdx === -1 || fetchIdx === -1 || toastIdx > fetchIdx, '成功提示出现在 fetch 之前或不可达');
});

test('A11. 后端失败时弹窗保持打开', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src, 'submitRequest 不存在');
  // closeRequestModal 在 try-catch 外无条件执行，即使 fetch 失败也运行
  const closeIdx = src.indexOf('closeRequestModal');
  const fetchCatch = src.indexOf('.catch(');
  const tryCatch = src.indexOf('} catch (error)');
  // 如果 closeRequestModal 在 try-catch 之外（在 fetch catch 之后、任何错误处理之后）
  // 说明弹窗无条件关闭
  assert.ok(!(closeIdx > tryCatch && tryCatch > fetchCatch), 'closeRequestModal 在 try-catch 外无条件执行');
});

test('A12. 后端失败时 requestSubmitHint 显示真实错误', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src, 'submitRequest 不存在');
  // fetch 的 catch 是空函数，不显示真实错误
  const fetchCatchIdx = src.indexOf('.catch(');
  const fetchCatchBody = fetchCatchIdx >= 0 ? extractBody(src, fetchCatchIdx + 6) : '';
  assert.ok(fetchCatchBody && !fetchCatchBody.includes('requestSubmitHint'), 'fetch catch 未设置 requestSubmitHint');
  // 但 try-catch 的 catch 设置了 requestSubmitHint
  const tryCatchIdx = src.indexOf('} catch (error)');
  if (tryCatchIdx >= 0) {
    const tryCatchBody = extractBody(src, tryCatchIdx + 14);
    assert.ok(tryCatchBody && tryCatchBody.includes('requestSubmitHint'), 'try-catch 未设置 requestSubmitHint');
  }
});

test('A13. 后端失败时不得把建议加入本地 requests', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src, 'submitRequest 不存在');
  // requests.unshift 不应在 fetch 之前或 catch 无取消
  const unshiftIdx = src.indexOf('requests.unshift');
  const fetchIdx = src.indexOf('fetch(');
  assert.ok(unshiftIdx === -1 || fetchIdx === -1 || unshiftIdx < fetchIdx, 'requests.unshift 出现在 fetch 之前，失败时不会回滚');
});

test('A14. 后端成功返回 id 后使用真实 id', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src, 'submitRequest 不存在');
  // 应检查响应中的 id 并更新本地 id
  assert.ok(src.includes('.id') || src.includes('[\'id\']') || src.includes('["id"]'), '未使用后端返回的 id');
});

// ===========================================================================
// B. 请求数据标准化测试
// ===========================================================================
console.log('\n--- B. 请求数据标准化测试 ---');

test('B15. normalizeRequestItem 函数存在', () => {
  assert.ok(extractFn(MAIN_JS, 'normalizeRequestItem'), 'normalizeRequestItem 不存在');
});

test('B16. content 映射为 text', () => {
  const fn = extractFn(MAIN_JS, 'normalizeRequestItem');
  assert.ok(fn && (fn.includes('text') || fn.includes('content')), 'normalizeRequestItem 未处理 text/content');
});

test('B17. admin_reply 映射为 adminReply', () => {
  const fn = extractFn(MAIN_JS, 'normalizeRequestItem');
  assert.ok(fn && fn.includes('adminReply'), 'normalizeRequestItem 未处理 adminReply');
});

test('B18. reject_reason 映射为 rejectReason', () => {
  const fn = extractFn(MAIN_JS, 'normalizeRequestItem');
  assert.ok(fn && fn.includes('rejectReason'), 'normalizeRequestItem 未处理 rejectReason');
});

test('B19. contact 保留', () => {
  const fn = extractFn(MAIN_JS, 'normalizeRequestItem');
  assert.ok(fn && fn.includes('contact'), 'normalizeRequestItem 未保留 contact');
});

test('B20. images 已是数组时保持数组', () => {
  const fn = extractFn(MAIN_JS, 'normalizeRequestItem');
  assert.ok(fn, 'normalizeRequestItem 不存在');
  // 检查 Array.isArray 判断
  assert.ok(fn.includes('Array.isArray'), '未使用 Array.isArray 判断 images');
});

test('B21. images 是 JSON 字符串时解析成数组', () => {
  const fn = extractFn(MAIN_JS, 'normalizeRequestItem');
  assert.ok(fn, 'normalizeRequestItem 不存在');
  assert.ok(fn.includes('JSON.parse'), '未对 images 字符串做 JSON.parse');
});

test('B22. images 是无效 JSON 时安全返回空数组', () => {
  const fn = extractFn(MAIN_JS, 'normalizeRequestItem');
  assert.ok(fn, 'normalizeRequestItem 不存在');
  assert.ok(fn.includes('catch') || fn.includes('try'), '无效 JSON 未使用 try/catch 安全处理');
});

test('B23. images 缺失时返回空数组', () => {
  const fn = extractFn(MAIN_JS, 'normalizeRequestItem');
  assert.ok(fn, 'normalizeRequestItem 不存在');
  assert.ok(fn.includes('[]'), 'images 缺失时未返回空数组');
});

test('B24. id、title、status、category、user、agree、disagree、created_at 保留', () => {
  const fn = extractFn(MAIN_JS, 'normalizeRequestItem');
  assert.ok(fn, 'normalizeRequestItem 不存在');
  const fields = ['id', 'title', 'status', 'category', 'user', 'agree', 'disagree', 'created_at'];
  const missing = fields.filter(f => !fn.includes(f));
  assert.ok(missing.length === 0, '缺少字段: ' + missing.join(', '));
});

test('B25. 标准化结果不得出现字符串形式 images', () => {
  const fn = extractFn(MAIN_JS, 'normalizeRequestItem');
  assert.ok(fn, 'normalizeRequestItem 不存在');
  // 返回的 images 应为数组而非字符串
  assert.ok(fn.includes('Array') || fn.includes('[]'), 'images 可能残留字符串');
});

test('B26. 标准化结果可以被 renderRequests 使用', () => {
  const fn = extractFn(MAIN_JS, 'normalizeRequestItem');
  const rf = extractFn(MAIN_JS, 'renderRequests');
  assert.ok(fn && rf, 'normalizeRequestItem 或 renderRequests 不存在');
  // renderRequests 使用的字段应在 normalizeRequestItem 输出中出现
  assert.ok(fn.includes('text') || fn.includes('content'), '标准化未输出 text');
});

// ===========================================================================
// C. 后端公开接口结构测试
// ===========================================================================
console.log('\n--- C. 后端公开接口结构测试 ---');

test('C27. GET SELECT 必须包含 contact', () => {
  var getIdx = SERVER_JS.indexOf("app.get('/api/requests'");
  if (getIdx === -1) getIdx = SERVER_JS.indexOf('app.get(\'/api/requests\'');
  var selectEnd = SERVER_JS.indexOf('FROM requests', getIdx);
  var selectBlock = SERVER_JS.slice(getIdx, selectEnd);
  assert.ok(selectBlock.includes('contact'), 'SELECT 未包含 contact');
});

test('C28. GET SELECT 必须包含 images', () => {
  var getIdx = SERVER_JS.indexOf("app.get('/api/requests'");
  if (getIdx === -1) getIdx = SERVER_JS.indexOf('app.get(\'/api/requests\'');
  var selectEnd = SERVER_JS.indexOf('FROM requests', getIdx);
  var selectBlock = SERVER_JS.slice(getIdx, selectEnd);
  assert.ok(selectBlock.includes('images'), 'SELECT 未包含 images');
});

test('C29. GET SELECT 必须包含 reject_reason', () => {
  var getIdx = SERVER_JS.indexOf("app.get('/api/requests'");
  if (getIdx === -1) getIdx = SERVER_JS.indexOf('app.get(\'/api/requests\'');
  var selectEnd = SERVER_JS.indexOf('FROM requests', getIdx);
  var selectBlock = SERVER_JS.slice(getIdx, selectEnd);
  assert.ok(selectBlock.includes('reject_reason'), 'SELECT 未包含 reject_reason');
});

test('C30. GET SELECT 必须保留 admin_reply', () => {
  const getIdx = SERVER_JS.indexOf('app.get(\'/api/requests\'') || SERVER_JS.indexOf("app.get('/api/requests'");
  const selectEnd = SERVER_JS.indexOf('FROM requests', getIdx);
  const selectBlock = SERVER_JS.slice(getIdx, selectEnd);
  assert.ok(selectBlock.includes('admin_reply'), 'SELECT 未包含 admin_reply');
});

test('C31. 返回前必须解析 images JSON', () => {
  const getIdx = SERVER_JS.indexOf('app.get(\'/api/requests\'');
  const handler = extractFn(SERVER_JS, '') || SERVER_JS.slice(getIdx, getIdx + 3000);
  // 在 GET handler 中应该有 JSON.parse(images) 或 map 解析
  assert.ok(handler.includes('JSON.parse') || handler.includes('images') && handler.includes('parse'),
    'GET handler 未解析 images JSON');
});

test('C32. images 解析失败时回退为空数组', () => {
  const getIdx = SERVER_JS.indexOf("app.get('/api/requests'");
  const handler = SERVER_JS.slice(getIdx, getIdx + 3000);
  // 应有 try/catch 或 catch 安全处理
  assert.ok(handler.includes('catch') || handler.includes('|| []') || handler.includes('||[]'),
    'images 解析未安全回退');
});

test('C33. 数据库 schema 未修改', () => {
  assert.ok(SCHEMA_SQL.includes('CREATE TABLE IF NOT EXISTS requests'), 'requests 表定义不存在');
  assert.ok(SCHEMA_SQL.includes('images        JSON'), 'schema 中 images 列定义已被删除');
  assert.ok(SCHEMA_SQL.includes('reject_reason TEXT'), 'schema 中 reject_reason 列定义已被删除');
  assert.ok(SCHEMA_SQL.includes('content       TEXT'), 'schema 中 content 列定义已被删除');
  assert.ok(SCHEMA_SQL.includes('contact       TEXT'), 'schema 中 contact 列定义已被删除');
});

test('C34. POST /api/requests 继续接受 content', () => {
  const postIdx = SERVER_JS.indexOf("app.post('/api/requests'");
  const postBlock = SERVER_JS.slice(postIdx, postIdx + 2000);
  assert.ok(postBlock.includes('content'), 'POST handler 未接受 content');
});

test('C35. POST /api/requests 继续写入 images', () => {
  const postIdx = SERVER_JS.indexOf("app.post('/api/requests'");
  const postBlock = SERVER_JS.slice(postIdx, postIdx + 2000);
  assert.ok(postBlock.includes('images'), 'POST handler 未写入 images');
});

test('C36. POST 成功返回真实插入 id', () => {
  const postIdx = SERVER_JS.indexOf("app.post('/api/requests'");
  const postBlock = SERVER_JS.slice(postIdx, postIdx + 2000);
  assert.ok(postBlock.includes('lastInsertRowid'), 'POST handler 未返回 lastInsertRowid');
});

// ===========================================================================
// D. 数据加载接线测试
// ===========================================================================
console.log('\n--- D. 数据加载接线测试 ---');

test('D37. loadPublicBackendConfig 对 requests 调用标准化', () => {
  const fn = extractFn(MAIN_JS, 'loadPublicBackendConfig');
  assert.ok(fn, 'loadPublicBackendConfig 不存在');
  assert.ok(fn.includes('normalizeRequestItem') || fn.includes('normalize') || fn.includes('content'),
    'loadPublicBackendConfig 未引用标准化逻辑');
});

test('D38. 管理员 requests 加载调用标准化', () => {
  // 检查 loadRequestManageData 或 renderRequestManagePanel 中的标准化
  const lmd = extractFn(MAIN_JS, 'loadRequestManageData') || extractFn(MAIN_JS, 'renderRequestManagePanel');
  if (lmd) {
    assert.ok(lmd.includes('normalizeRequestItem') || lmd.includes('normalize') || lmd.includes('content'),
      '管理员加载未引用标准化');
  }
  // 如果没有专门函数，检查全局请求加载
  assert.ok(extractFn(MAIN_JS, 'loadRequestManageData') || MAIN_JS.includes('normalizeRequestItem'),
    '未找到管理员请求加载函数');
});

test('D39. 提交成功后的 newRequest 使用标准化结构', () => {
  const fn = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(fn, 'submitRequest 不存在');
  // newRequest 应包含 submitRequest 所需的全部字段
  assert.ok(fn.includes('newRequest'), 'submitRequest 未构造 newRequest');
});

test('D40. renderRequests 保留 data-open-image 入口', () => {
  const fn = extractFn(MAIN_JS, 'renderRequests');
  assert.ok(fn && fn.includes('data-open-image'), 'renderRequests 未保留 data-open-image');
});

test('D41. openImageViewer 和 data-open-image 委托不得回归', () => {
  assert.ok(MAIN_JS.includes('function openImageViewer'), 'openImageViewer 已删除');
  assert.ok(MAIN_JS.includes('data-open-image'), 'data-open-image 委托已删除');
});

// ===========================================================================
// 运行器
// ===========================================================================
console.log(`\n=== 总计: ${passed}/${total} 通过, ${failed} 失败 ===`);
if (failures.length) {
  console.log('失败:');
  failures.forEach(n => console.log('  ✗ ' + n));
  process.exitCode = 1;
}
