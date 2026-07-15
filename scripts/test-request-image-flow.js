#!/usr/bin/env node
// 玩家建议图片数据流缺陷测试 — 真实沙箱执行
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
  for (; i < src.length; i++) {
    const c = src[i];
    if (is) { if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === is) { is = null; continue; } continue; }
    if (c === '"' || c === "'" || c === '`') { is = c; continue; }
    if (c === '(') d++; if (c === ')') { d--; if (d === 0) { i++; break; } }
  }
  const o = src.indexOf('{', i); if (o === -1) return null;
  d = 0; is = null; esc = false;
  for (let j = o; j < src.length; j++) {
    const c = src[j];
    if (is) { if (esc) { esc = false; continue; } if (c === '\\') { esc = true; continue; } if (c === is) { is = null; continue; } continue; }
    if (c === '"' || c === "'" || c === '`') { is = c; continue; }
    if (c === '{') d++; if (c === '}') { d--; if (d === 0) return src.slice(s, j + 1); }
  }
  return null;
}

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

// 精确提取路由代码块
function extractRouteBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start < 0) return null;
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end < 0) return source.slice(start);
  return source.slice(start, end);
}

// ---- 标准化函数提取（修复 runNormalize：函数声明前不能加 var） ----
function runNormalize(input) {
  const src = extractFn(MAIN_JS, 'normalizeRequestItem');
  if (!src) throw new Error('normalizeRequestItem 不存在');

  const normalize = new Function(
    src + '\nreturn normalizeRequestItem;'
  )();

  return normalize(input);
}

// ---- 异步沙箱（修复 buildSubmitSandbox：通过 new Function 参数注入 fetchResponse，await submitRequest） ----
async function buildSubmitSandbox(fetchResponse) {
  const capture = {
    fetchUrl: null,
    fetchOpts: null,
    closeCallCount: 0,
    renderCallCount: 0,
    switchRouteArg: null,
    toasts: [],
    hintText: '',
    requests: [],
    pendingRequestImages: [],
    unhandled: null
  };

  const fnSrc = extractFn(MAIN_JS, 'submitRequest');
  if (!fnSrc) throw new Error('submitRequest 不存在');

  const factory = new Function(
    'capture',
    'fetchResponse',
    `
      return (async function () {
        var requests = [];
        var pendingRequestImages = ['data:image/png;base64,TEST'];
        var activePlayerName = '测试玩家';

        var backendUrl = function(path) { return path; };
        var addLog = function() {};
        var saveLocalData = function() {};
        var renderAll = function() {
          capture.renderCallCount++;
        };
        var switchRoute = function(route) {
          capture.switchRouteArg = route;
        };
        var showToast = function(message, type) {
          capture.toasts.push({ msg: message, type: type });
        };
        var closeRequestModal = function() {
          capture.closeCallCount++;
        };

        var requestSubmitHint = {
          set textContent(value) {
            capture.hintText = value;
          },
          get textContent() {
            return capture.hintText;
          }
        };

        var fields = {
          requestTitle: {
            value: '图片测试建议',
            classList: { add(){}, remove(){} }
          },
          requestText: {
            value: '这是带图片的测试建议内容',
            classList: { add(){}, remove(){} }
          },
          requestCategory: {
            value: 'BUG',
            classList: { add(){}, remove(){} }
          },
          requestContact: {
            value: '测试联系方式',
            classList: { add(){}, remove(){} }
          },
          requestSubmitHint: requestSubmitHint
        };

        var document = {
          getElementById: function(id) {
            return fields[id] || {
              value: '',
              textContent: '',
              classList: { add(){}, remove(){} }
            };
          },
          querySelectorAll: function() {
            return [];
          }
        };

        var fetch = async function(url, options) {
          capture.fetchUrl = url;
          capture.fetchOpts = options;
          return await fetchResponse(url, options);
        };

        var event = {
          preventDefault: function() {}
        };

        ${fnSrc}

        try {
          await submitRequest(event);
        } catch (error) {
          capture.unhandled = error.message;
        }

        capture.requests = requests.map(function(item) {
          return {
            id: item.id,
            text: item.text,
            images: item.images
          };
        });

        capture.pendingRequestImages =
          pendingRequestImages.slice();

        return capture;
      })();
    `
  );

  return await factory(capture, fetchResponse);
}

// ---- fetch mock 复用 helper ----
async function successFetch() {
  return {
    ok: true,
    status: 201,
    json: async () => ({
      code: 200,
      data: { id: 123 }
    })
  };
}

async function failedFetch() {
  throw new Error('图片保存失败');
}

async function badRequestFetch() {
  return {
    ok: false,
    status: 400,
    json: async () => ({
      code: 400,
      message: '内容不能为空'
    })
  };
}

// ---- 测试登记（不再同步执行，避免重复运行） ----
const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

// ===========================================================================
// A. 前端提交数据测试
// ===========================================================================
console.log('\n--- A. 前端提交数据测试 ---');

// A1-A5: 静态结构检查
test('A1. submitRequest 是 async function', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src && src.includes('async '), 'submitRequest 不是 async');
});

test('A2. 不存在 .catch(() => {}) 空吞错', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src && !/\.catch\s*\(\s*(?:\(\)\s*=>\s*|function\s*\()\s*\{\s*\}\s*\)/.test(src),
    '存在 .catch(() => {}) 吞错');
});

test('A3. 存在 await fetchWithFallback 或 await fetch + response.ok 检查', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src, 'submitRequest 不存在');
  const hasAwaitFallback = src.includes('await fetchWithFallback');
  const hasAwaitFetch = src.includes('await fetch') && src.includes('response.ok');
  assert.ok(hasAwaitFallback || hasAwaitFetch, '未使用 await fetchWithFallback 或 fetch + ok 检查');
});

test('A4. 错误分支引用 requestSubmitHint', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src, 'submitRequest 不存在');
  assert.ok(src.includes('requestSubmitHint'), '错误分支未引用 requestSubmitHint');
});

test('A5. 成功后使用后端返回的 id', () => {
  const src = extractFn(MAIN_JS, 'submitRequest');
  assert.ok(src, 'submitRequest 不存在');
  const hasIdRef = src.includes('.id') || src.includes("['id']") || src.includes('["id"]');
  assert.ok(hasIdRef, '未引用后端返回 id');
});

// ---- 成功沙箱 ----
test('A6. 成功沙箱：请求地址为 /api/requests', async () => {
  const capture = await buildSubmitSandbox(successFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  assert.strictEqual(capture.fetchUrl, '/api/requests', 'URL 不符, 实际=' + capture.fetchUrl);
});

test('A7. 成功沙箱：method 为 POST', async () => {
  const capture = await buildSubmitSandbox(successFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  assert.strictEqual(capture.fetchOpts.method, 'POST', 'method=' + (capture.fetchOpts && capture.fetchOpts.method));
});

test('A8. 成功沙箱：content-type 为 application/json', async () => {
  const capture = await buildSubmitSandbox(successFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const ct = capture.fetchOpts.headers && capture.fetchOpts.headers['content-type'];
  assert.strictEqual(ct, 'application/json', 'content-type=' + ct);
});

test('A9. 成功沙箱：body.content 等于 requestText', async () => {
  const capture = await buildSubmitSandbox(successFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const body = JSON.parse(capture.fetchOpts.body);
  assert.strictEqual(body.content, '这是带图片的测试建议内容', 'body.content=' + body.content);
});

test('A10. 成功沙箱：body 含 content 字段', async () => {
  const capture = await buildSubmitSandbox(successFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const body = JSON.parse(capture.fetchOpts.body);
  assert.ok(body.content, 'body 无 content 字段');
  assert.ok(!body.text || body.text === '这是带图片的测试建议内容',
    'body 中 text=' + body.text + ' 与 content=' + body.content + ' 不一致');
});

test('A11. 成功沙箱：body.images 是数组', async () => {
  const capture = await buildSubmitSandbox(successFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const body = JSON.parse(capture.fetchOpts.body);
  assert.ok(Array.isArray(body.images), 'images 不是数组');
  assert.ok(body.images[0] && body.images[0].includes('TEST'), 'images 内容不符');
});

test('A12. 成功沙箱：requests 有 1 项且 renderCallCount 为 1', async () => {
  const capture = await buildSubmitSandbox(successFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  assert.strictEqual(capture.requests.length, 1, 'requests.length=' + capture.requests.length);
  assert.strictEqual(capture.renderCallCount, 1, 'renderCallCount=' + capture.renderCallCount);
});

test('A13. 成功沙箱：closeRequestModal 调用 1 次', async () => {
  const capture = await buildSubmitSandbox(successFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  assert.strictEqual(capture.closeCallCount, 1, 'closeCallCount=' + capture.closeCallCount);
});

test('A14. 成功沙箱：switchRoute 收到 requests', async () => {
  const capture = await buildSubmitSandbox(successFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  assert.strictEqual(capture.switchRouteArg, 'requests', 'switchRoute 参数=' + capture.switchRouteArg);
});

test('A15. 成功沙箱：成功 toast 出现 1 次', async () => {
  const capture = await buildSubmitSandbox(successFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const successToasts = capture.toasts.filter(t => t.msg.includes('建议已提交到后台'));
  assert.strictEqual(successToasts.length, 1, '成功 toast 出现 ' + successToasts.length + ' 次');
});

test('A16. 成功沙箱：success toast 含"建议已提交到后台"', async () => {
  const capture = await buildSubmitSandbox(successFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const msg = capture.toasts.map(t => t.msg).join('|');
  assert.ok(msg.includes('建议已提交到后台'), 'toast 不含建议已提交: ' + msg);
  assert.strictEqual(capture.hintText, '', 'hintText=' + capture.hintText);
});

// ---- 网络失败分支 ----
test('A17. 失败沙箱：requests 长度仍为 0 且不触发渲染/切换/关闭', async () => {
  const capture = await buildSubmitSandbox(failedFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  assert.strictEqual(capture.requests.length, 0, 'requests.length=' + capture.requests.length);
  assert.strictEqual(capture.renderCallCount, 0, 'renderCallCount=' + capture.renderCallCount);
  assert.strictEqual(capture.switchRouteArg, null, 'switchRouteArg=' + capture.switchRouteArg);
  assert.strictEqual(capture.pendingRequestImages.length, 1, 'pendingRequestImages.length=' + capture.pendingRequestImages.length);
});

test('A18. 失败沙箱：closeRequestModal 调用 0 次', async () => {
  const capture = await buildSubmitSandbox(failedFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  assert.strictEqual(capture.closeCallCount, 0, 'closeCallCount=' + capture.closeCallCount);
});

test('A19. 失败沙箱：不显示成功 toast', async () => {
  const capture = await buildSubmitSandbox(failedFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const hasSuccess = capture.toasts.some(t => t.msg.includes('建议已提交到后台'));
  assert.ok(!hasSuccess, '出现成功 toast');
});

test('A20. 失败沙箱：requestSubmitHint 含错误信息', async () => {
  const capture = await buildSubmitSandbox(failedFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  assert.strictEqual(capture.hintText, '图片保存失败', 'hint=' + capture.hintText);
});

test('A21. 失败沙箱：无未处理异常', async () => {
  const capture = await buildSubmitSandbox(failedFetch);
  assert.strictEqual(capture.unhandled, null, '存在未处理异常: ' + capture.unhandled);
});

// ---- HTTP 4xx 分支 ----
test('A22. 4xx 沙箱：requestSubmitHint 显示服务器错误且未写入列表', async () => {
  const capture = await buildSubmitSandbox(badRequestFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  assert.strictEqual(capture.hintText, '内容不能为空', 'hint=' + capture.hintText);
  assert.strictEqual(capture.requests.length, 0, 'requests.length=' + capture.requests.length);
  assert.strictEqual(capture.closeCallCount, 0, 'closeCallCount=' + capture.closeCallCount);
});

test('A23. 4xx 沙箱：不显示成功 toast', async () => {
  const capture = await buildSubmitSandbox(badRequestFetch);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const hasSuccess = capture.toasts.some(t => t.msg.includes('建议已提交到后台'));
  assert.ok(!hasSuccess, '出现成功 toast');
});

test('A24. 4xx 沙箱：无未处理异常', async () => {
  const capture = await buildSubmitSandbox(badRequestFetch);
  assert.strictEqual(capture.unhandled, null, '存在未处理异常: ' + capture.unhandled);
});

// ===========================================================================
// B. 请求数据标准化测试
// ===========================================================================
console.log('\n--- B. 请求数据标准化测试 ---');

test('B25. normalizeRequestItem 存在', () => {
  assert.ok(extractFn(MAIN_JS, 'normalizeRequestItem'), 'normalizeRequestItem 不存在');
});

test('B26. {content:"正文"} → text === "正文"', () => {
  const result = runNormalize({content:'正文'});
  assert.ok(result && result.text === '正文', 'text=' + (result && result.text));
});

test('B27. {text:"已有正文",content:""} → text 不被空 content 覆盖', () => {
  const result = runNormalize({text:'已有正文', content:''});
  assert.ok(result && result.text === '已有正文', 'text=' + (result && result.text));
});

test('B28. {admin_reply:"回复"} → adminReply', () => {
  const result = runNormalize({admin_reply:'回复'});
  assert.ok(result && result.adminReply === '回复', 'adminReply=' + (result && result.adminReply));
});

test('B29. {reject_reason:"原因"} → rejectReason', () => {
  const result = runNormalize({reject_reason:'原因'});
  assert.ok(result && result.rejectReason === '原因', 'rejectReason=' + (result && result.rejectReason));
});

test('B30. contact 保留', () => {
  const result = runNormalize({contact:'QQ123'});
  assert.ok(result && result.contact === 'QQ123', 'contact=' + (result && result.contact));
});

test('B31. images 数组保持数组', () => {
  const result = runNormalize({images:['a.png']});
  assert.ok(Array.isArray(result && result.images), 'images 不是数组');
  assert.ok(result.images.length === 1, 'images 长度=' + result.images.length);
});

test('B32. images JSON 字符串→数组', () => {
  const result = runNormalize({images:'["a.png","b.png"]'});
  assert.ok(Array.isArray(result && result.images), 'images 不是数组');
  assert.ok(result.images.length === 2, 'images 长度=' + result.images.length);
});

test('B33. images 无效 JSON → 空数组', () => {
  const result = runNormalize({images:'invalid-json'});
  assert.ok(Array.isArray(result && result.images), 'images 不是数组');
  assert.ok(result.images.length === 0, 'images 长度=' + result.images.length);
});

test('B34. images 缺失 → 空数组', () => {
  const result = runNormalize({text:'无图'});
  assert.ok(Array.isArray(result && result.images), 'images 不是数组');
  assert.ok(result.images.length === 0, 'images 长度=' + result.images.length);
});

test('B35. id/title/status/category/user/agree/disagree/created_at 保留', () => {
  const input = {id:1,title:'T',status:'pending',category:'BUG',user:'U',agree:5,disagree:2,created_at:'2026-01-01'};
  const result = runNormalize(input);
  assert.ok(result.id === 1, 'id 丢失');
  assert.ok(result.title === 'T', 'title 丢失');
  assert.ok(result.status === 'pending', 'status 丢失');
  assert.ok(result.category === 'BUG', 'category 丢失');
  assert.ok(result.user === 'U', 'user 丢失');
  assert.ok(result.agree === 5, 'agree 丢失');
  assert.ok(result.disagree === 2, 'disagree 丢失');
  assert.ok(result.created_at === '2026-01-01', 'created_at 丢失');
});

test('B36. 输出 images 始终为数组且无字符串残留', () => {
  const r1 = runNormalize({images:['a.png']});
  const r2 = runNormalize({images:'["b.png"]'});
  const r3 = runNormalize({});
  [r1, r2, r3].forEach((r, i) => {
    assert.ok(Array.isArray(r.images), i + ': images 不是数组: ' + typeof r.images);
    assert.ok(typeof r.images !== 'string', i + ': images 是字符串');
  });
});

// ===========================================================================
// C. 后端公开接口结构测试（精确路由块）
// ===========================================================================
console.log('\n--- C. 后端公开接口结构测试 ---');

const publicGetRoute = extractRouteBlock(SERVER_JS,
  "app.get('/api/requests'",
  '// ---- 玩家提交建议');
const publicPostRoute = extractRouteBlock(SERVER_JS,
  "app.post('/api/requests'",
  '// ---- 投票');

// GET SELECT 字段段（从 SELECT 到 FROM requests）
const getSelectIdx = (publicGetRoute || '').indexOf('SELECT');
const getFromIdx = (publicGetRoute || '').indexOf('FROM requests');
const getSelectBlock = getSelectIdx >= 0 && getFromIdx > getSelectIdx
  ? publicGetRoute.slice(getSelectIdx, getFromIdx) : '';

test('C37. GET SELECT 包含 contact', () => {
  assert.ok(publicGetRoute, '未找到公开 GET 路由');
  assert.ok(getSelectBlock.includes('contact'), 'SELECT 缺 contact');
});

test('C38. GET SELECT 包含 images', () => {
  assert.ok(publicGetRoute, '未找到公开 GET 路由');
  assert.ok(getSelectBlock.includes('images'), 'SELECT 缺 images');
});

test('C39. GET SELECT 包含 reject_reason', () => {
  assert.ok(publicGetRoute, '未找到公开 GET 路由');
  assert.ok(getSelectBlock.includes('reject_reason'), 'SELECT 缺 reject_reason');
});

test('C40. GET SELECT 包含 admin_reply', () => {
  assert.ok(publicGetRoute, '未找到公开 GET 路由');
  assert.ok(getSelectBlock.includes('admin_reply'), 'SELECT 缺 admin_reply');
});

test('C41. GET 遍历结果并 JSON.parse images', () => {
  assert.ok(publicGetRoute, '未找到公开 GET 路由');
  // 必须同时包含对 items 的遍历和 JSON.parse(item.images)
  const hasIterate = publicGetRoute.includes('items.forEach') || publicGetRoute.includes('items.map');
  const hasParse = publicGetRoute.includes('JSON.parse') && (publicGetRoute.includes('.images') || publicGetRoute.includes('images'));
  assert.ok(hasIterate && hasParse, 'GET 路由中缺少遍历或 JSON.parse images');
});

test('C42. GET images 解析有 try/catch 安全回退', () => {
  assert.ok(publicGetRoute, '未找到公开 GET 路由');
  const hasTry = publicGetRoute.includes('try');
  const hasCatch = publicGetRoute.includes('catch');
  const hasParse = publicGetRoute.includes('JSON.parse');
  const hasFallback = publicGetRoute.includes('= []') || publicGetRoute.includes('=[]');
  assert.ok(hasTry && hasCatch && hasParse && hasFallback, '缺少 try + catch + JSON.parse + =[] 回退');
});

test('C43. schema 未修改', () => {
  assert.ok(SCHEMA_SQL.includes('images        JSON'), 'images 列丢失');
  assert.ok(SCHEMA_SQL.includes('content       TEXT'), 'content 列丢失');
  assert.ok(SCHEMA_SQL.includes('reject_reason TEXT'), 'reject_reason 列丢失');
});

test('C44. POST 接受 content/images', () => {
  assert.ok(publicPostRoute, '未找到公开 POST 路由');
  // 解构 content 和 images
  assert.ok(publicPostRoute.includes('content'), 'POST 未解构 content');
  assert.ok(publicPostRoute.includes('images'), 'POST 未解构 images');
  // INSERT 写入 content 和 images
  assert.ok(publicPostRoute.includes('INSERT'), 'POST 无 INSERT');
  assert.ok(publicPostRoute.includes('JSON.stringify(images'), 'POST 未 JSON.stringify images');
});

test('C45. POST 写入 images 并返回 id', () => {
  assert.ok(publicPostRoute, '未找到公开 POST 路由');
  assert.ok(publicPostRoute.includes('JSON.stringify(images'), 'POST 未序列化 images');
  assert.ok(publicPostRoute.includes('lastInsertRowid'), 'POST 未返回 lastInsertRowid');
});

// ===========================================================================
// D. 数据加载接线测试
// ===========================================================================
console.log('\n--- D. 数据加载接线测试 ---');

test('D46. loadPublicBackendConfig 标准化 requests', () => {
  var fn = extractFn(MAIN_JS, 'loadPublicBackendConfig');
  assert.ok(fn, 'loadPublicBackendConfig 不存在');
  assert.ok(
    fn.includes('.map(normalizeRequestItem)') ||
    fn.includes('.map(item => normalizeRequestItem(item))') ||
    fn.includes('.map(function') && fn.includes('normalize'),
    'loadPublicBackendConfig 未对 requests 调用 normalizeRequestItem'
  );
});

test('D47. loadFullBackendConfig 标准化 requests', () => {
  var fn = extractFn(MAIN_JS, 'loadFullBackendConfig');
  assert.ok(fn, 'loadFullBackendConfig 不存在');
  assert.ok(
    fn.includes('.map(normalizeRequestItem)') ||
    fn.includes('.map(item => normalizeRequestItem(item))') ||
    fn.includes('.map(function') && fn.includes('normalize'),
    'loadFullBackendConfig 未对 requests 调用 normalizeRequestItem'
  );
});

test('D48. renderRequests 保留 data-open-image', () => {
  var fn = extractFn(MAIN_JS, 'renderRequests');
  assert.ok(fn && fn.includes('data-open-image'), 'renderRequests 缺 data-open-image');
});

// ===========================================================================
// 异步运行器（仅此负责执行，避免每条测试被执行两次）
// ===========================================================================
async function run() {
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const item of tests) {
    try {
      await item.fn();
      passed++;
      console.log('  ✓ ' + item.name);
    } catch (error) {
      failed++;
      failures.push(item.name);
      console.log('  ✗ ' + item.name);
      console.log('    ' + (error.message || error));
    }
  }

  console.log(
    '\n=== 总计: ' + passed + '/' + tests.length +
    ' 通过, ' + failed + ' 失败 ==='
  );

  if (failures.length) {
    console.log('失败:');
    failures.forEach(name => console.log('  ✗ ' + name));
    process.exitCode = 1;
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
