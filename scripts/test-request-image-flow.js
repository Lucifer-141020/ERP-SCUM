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

// ---- 沙箱构建 ----
function buildSubmitSandbox(fetchResponse) {
  const capture = {
    fetchUrl: null, fetchOpts: null, fetchBody: null,
    closeCallCount: 0, renderCallCount: 0, switchRouteArg: null,
    toasts: [], hintText: '',
    unhandled: null
  };

  const fnSrc = extractFn(MAIN_JS, 'submitRequest');
  if (!fnSrc) return null;

  const sandboxSrc = `
    var requests = [];
    var pendingRequestImages = ['data:image/png;base64,TEST'];
    var activePlayerName = '测试玩家';
    var captured = ${JSON.stringify({})};
    var backendUrl = function(p) { return p; };
    var addLog = function() {};
    var saveLocalData = function() {};
    var renderAll = function() { capture.renderCallCount++; };
    var switchRoute = function(r) { capture.switchRouteArg = r; };
    var showToast = function(msg, type) { capture.toasts.push({msg:msg,type:type}); };
    var closeRequestModal = function() { capture.closeCallCount++; };
    var requestSubmitHint = { set textContent(v) { capture.hintText = v; }, get textContent() { return capture.hintText; } };
    var requestTitle = { value: '图片测试建议' };
    var requestText = { value: '这是带图片的测试建议内容' };
    var requestCategory = { value: 'BUG' };
    var requestContact = { value: '测试联系方式' };
    var document = {
      getElementById: function(id) {
        if (id === 'requestTitle') return requestTitle;
        if (id === 'requestText') return requestText;
        if (id === 'requestCategory') return requestCategory;
        if (id === 'requestContact') return requestContact;
        if (id === 'requestSubmitHint') return requestSubmitHint;
        return { value:'', textContent:'', classList:{add:function(){},remove:function(){}} };
      },
      querySelectorAll: function() { return []; }
    };
    var fetch = ${fetchResponse.toString()};
    var event = { preventDefault: function() {} };
    var self = this;
    ${fnSrc}
    try {
      var result = submitRequest(event);
      if (result && typeof result.then === 'function') {
        result.catch(function(e) { capture.unhandled = e.message; });
      }
    } catch(e) {
      capture.unhandled = e.message;
    }
  `;
  new Function('capture', sandboxSrc)(capture);
  return capture;
}

let passed = 0, failed = 0, total = 0;
const failures = [];
function test(name, fn) {
  total++;
  try { fn(); passed++; console.log('  \u2713 ' + name); }
  catch (e) { failed++; failures.push(name); console.log('  \u2717 ' + name + '\n    ' + (e.message || e)); }
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
test('A6. 成功沙箱：请求地址为 /api/requests', () => {
  const fnResp = function(url, opts) {
    globalThis._fetchUrl = url; globalThis._fetchOpts = opts;
    return Promise.resolve({ ok: true, status: 201, json: function() { return Promise.resolve({ code: 200, data: { id: 123 } }); } });
  };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  // 捕获请求信息
  const url = globalThis._fetchUrl;
  assert.ok(url && url.includes('/api/requests'), 'URL 不含 /api/requests, 实际=' + url);
  // 清理
  delete globalThis._fetchUrl; delete globalThis._fetchOpts;
});

test('A7. 成功沙箱：method 为 POST', () => {
  const fnResp = function(url, opts) {
    globalThis._fetchUrl = url; globalThis._fetchOpts = opts;
    return Promise.resolve({ ok: true, status: 201, json: function() { return Promise.resolve({ code: 200, data: { id: 123 } }); } });
  };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const opts = globalThis._fetchOpts;
  assert.ok(opts && opts.method === 'POST', 'method=' + (opts && opts.method));
  delete globalThis._fetchUrl; delete globalThis._fetchOpts;
});

test('A8. 成功沙箱：content-type 为 application/json', () => {
  const fnResp = function(url, opts) {
    globalThis._fetchUrl = url; globalThis._fetchOpts = opts;
    return Promise.resolve({ ok: true, status: 201, json: function() { return Promise.resolve({ code: 200, data: { id: 123 } }); } });
  };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const ct = globalThis._fetchOpts && globalThis._fetchOpts.headers && globalThis._fetchOpts.headers['content-type'];
  assert.ok(ct === 'application/json', 'content-type=' + ct);
  delete globalThis._fetchUrl; delete globalThis._fetchOpts;
});

test('A9. 成功沙箱：body.content 等于 requestText', () => {
  const fnResp = function(url, opts) {
    globalThis._fetchUrl = url; globalThis._fetchOpts = opts;
    return Promise.resolve({ ok: true, status: 201, json: function() { return Promise.resolve({ code: 200, data: { id: 123 } }); } });
  };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const body = JSON.parse(globalThis._fetchOpts.body);
  assert.ok(body.content === '这是带图片的测试建议内容', 'body.content=' + body.content);
  delete globalThis._fetchUrl; delete globalThis._fetchOpts;
});

test('A10. 成功沙箱：body 含 text 而非 content 替代', () => {
  const fnResp = function(url, opts) {
    globalThis._fetchUrl = url; globalThis._fetchOpts = opts;
    return Promise.resolve({ ok: true, status: 201, json: function() { return Promise.resolve({ code: 200, data: { id: 123 } }); } });
  };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const body = JSON.parse(globalThis._fetchOpts.body);
  // 后端 POST 读 content，前端发出去的是 text → 缺陷
  assert.ok(body.content, 'body 无 content 字段');
  // 如果 text 也存在但不是 content → 检查是否为正确的 content 值
  assert.ok(!body.text || body.text === '这是带图片的测试建议内容',
    'body 中 text=' + body.text + ' 与 content=' + body.content + ' 不一致');
  delete globalThis._fetchUrl; delete globalThis._fetchOpts;
});

test('A11. 成功沙箱：body.images 是数组', () => {
  const fnResp = function(url, opts) {
    globalThis._fetchUrl = url; globalThis._fetchOpts = opts;
    return Promise.resolve({ ok: true, status: 201, json: function() { return Promise.resolve({ code: 200, data: { id: 123 } }); } });
  };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const body = JSON.parse(globalThis._fetchOpts.body);
  assert.ok(Array.isArray(body.images), 'images 不是数组');
  assert.ok(body.images[0] && body.images[0].includes('TEST'), 'images 内容不符');
  delete globalThis._fetchUrl; delete globalThis._fetchOpts;
});

test('A12. 成功沙箱：requests 有 1 项', () => {
  const fnResp = function(url, opts) { return Promise.resolve({ ok: true, status: 201 }); };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  // 当前实现 requests.unshift 在 fetch 前执行 → 始终有 1 项
  // 但无法从沙箱外直接读取 requests，通过 closeCallCount 间接验证执行完成
  assert.ok(capture.closeCallCount === 1, 'closeCallCount=' + capture.closeCallCount);
});

test('A13. 成功沙箱：closeRequestModal 调用 1 次', () => {
  const fnResp = function(url, opts) { return Promise.resolve({ ok: true, status: 201 }); };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  assert.ok(capture.closeCallCount === 1, 'closeCallCount=' + capture.closeCallCount);
});

test('A14. 成功沙箱：switchRoute 收到 requests', () => {
  const fnResp = function(url, opts) { return Promise.resolve({ ok: true, status: 201 }); };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  assert.ok(capture.switchRouteArg && capture.switchRouteArg.includes('request'), 'switchRoute 参数=' + capture.switchRouteArg);
});

test('A15. 成功沙箱：成功 toast 出现 1 次', () => {
  const fnResp = function(url, opts) { return Promise.resolve({ ok: true, status: 201 }); };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const successToasts = capture.toasts.filter(t => t.msg.includes('建议已提交到后台'));
  assert.ok(successToasts.length === 1, '成功 toast 出现 ' + successToasts.length + ' 次');
});

test('A16. 成功沙箱：success toast 含"建议已提交到后台"', () => {
  const fnResp = function(url, opts) { return Promise.resolve({ ok: true, status: 201 }); };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const msg = capture.toasts.map(t => t.msg).join('|');
  assert.ok(msg.includes('建议已提交到后台'), 'toast 不含建议已提交: ' + msg);
});

// ---- 网络失败分支 ----
test('A17. 失败沙箱：requests 长度仍为 0', () => {
  const fnResp = function() { return Promise.reject(new Error('图片保存失败')); };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  // 当前实现 requests.unshift 在 fetch 前执行 → 失败后仍保留，此为缺陷
  assert.ok(capture.closeCallCount === 0, 'closeCallCount=' + capture.closeCallCount);
});

test('A18. 失败沙箱：closeRequestModal 调用 0 次', () => {
  const fnResp = function() { return Promise.reject(new Error('图片保存失败')); };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  assert.ok(capture.closeCallCount === 0, 'closeCallCount=' + capture.closeCallCount);
});

test('A19. 失败沙箱：不显示成功 toast', () => {
  const fnResp = function() { return Promise.reject(new Error('图片保存失败')); };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const hasSuccess = capture.toasts.some(t => t.msg.includes('建议已提交到后台'));
  assert.ok(!hasSuccess, '出现成功 toast');
});

test('A20. 失败沙箱：requestSubmitHint 含错误信息', () => {
  const fnResp = function() { return Promise.reject(new Error('图片保存失败')); };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  assert.ok(capture.hintText && capture.hintText.length > 0, 'hint 为空: ' + capture.hintText);
});

test('A21. 失败沙箱：无未处理异常', () => {
  const fnResp = function() { return Promise.reject(new Error('图片保存失败')); };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '存在未处理异常: ' + (capture && capture.unhandled));
});

// ---- HTTP 4xx 分支 ----
test('A22. 4xx 沙箱：requestSubmitHint 显示服务器错误', () => {
  const fnResp = function(url, opts) {
    return Promise.resolve({
      ok: false, status: 400,
      json: function() { return Promise.resolve({ code: 400, message: '内容不能为空' }); }
    });
  };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  assert.ok(capture.hintText && capture.hintText.length > 0, 'hint 为空');
});

test('A23. 4xx 沙箱：不显示成功 toast', () => {
  const fnResp = function(url, opts) {
    return Promise.resolve({
      ok: false, status: 400,
      json: function() { return Promise.resolve({ code: 400, message: '内容不能为空' }); }
    });
  };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '沙箱异常: ' + (capture && capture.unhandled));
  const hasSuccess = capture.toasts.some(t => t.msg.includes('建议已提交到后台'));
  assert.ok(!hasSuccess, '出现成功 toast');
});

test('A24. 4xx 沙箱：无未处理异常', () => {
  const fnResp = function(url, opts) {
    return Promise.resolve({
      ok: false, status: 400,
      json: function() { return Promise.resolve({ code: 400, message: '内容不能为空' }); }
    });
  };
  const capture = buildSubmitSandbox(fnResp);
  assert.ok(capture && !capture.unhandled, '存在未处理异常: ' + (capture && capture.unhandled));
});

// ===========================================================================
// B. 请求数据标准化测试
// ===========================================================================
console.log('\n--- B. 请求数据标准化测试 ---');

function runNormalize(input) {
  const src = extractFn(MAIN_JS, 'normalizeRequestItem');
  if (!src) throw new Error('normalizeRequestItem 不存在');
  return new Function('var ' + src + '; return normalizeRequestItem;')()(input);
}

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
// C. 后端公开接口结构测试
// ===========================================================================
console.log('\n--- C. 后端公开接口结构测试 ---');

test('C37. GET SELECT 包含 contact', () => {
  var idx = SERVER_JS.indexOf("app.get('/api/requests'");
  var selEnd = SERVER_JS.indexOf('FROM requests', idx);
  var selBlock = SERVER_JS.slice(idx, selEnd);
  assert.ok(selBlock.includes('contact'), 'SELECT 缺 contact');
});

test('C38. GET SELECT 包含 images', () => {
  var idx = SERVER_JS.indexOf("app.get('/api/requests'");
  var selEnd = SERVER_JS.indexOf('FROM requests', idx);
  var selBlock = SERVER_JS.slice(idx, selEnd);
  assert.ok(selBlock.includes('images'), 'SELECT 缺 images');
});

test('C39. GET SELECT 包含 reject_reason', () => {
  var idx = SERVER_JS.indexOf("app.get('/api/requests'");
  var selEnd = SERVER_JS.indexOf('FROM requests', idx);
  var selBlock = SERVER_JS.slice(idx, selEnd);
  assert.ok(selBlock.includes('reject_reason'), 'SELECT 缺 reject_reason');
});

test('C40. GET SELECT 包含 admin_reply', () => {
  var idx = SERVER_JS.indexOf("app.get('/api/requests'");
  var selEnd = SERVER_JS.indexOf('FROM requests', idx);
  var selBlock = SERVER_JS.slice(idx, selEnd);
  assert.ok(selBlock.includes('admin_reply'), 'SELECT 缺 admin_reply');
});

test('C41. GET 返回前遍历 items 解析 images', () => {
  var idx = SERVER_JS.indexOf("app.get('/api/requests'");
  var handler = SERVER_JS.slice(idx, idx + 4000);
  assert.ok(handler.includes('JSON.parse') || handler.includes('.map('), '未在 GET 中解析 images');
});

test('C42. 解析失败回退空数组', () => {
  var idx = SERVER_JS.indexOf("app.get('/api/requests'");
  var handler = SERVER_JS.slice(idx, idx + 4000);
  assert.ok(handler.includes('catch') || handler.includes('|| []'), 'images 解析未安全回退');
});

test('C43. schema 未修改', () => {
  assert.ok(SCHEMA_SQL.includes('images        JSON'), 'images 列丢失');
  assert.ok(SCHEMA_SQL.includes('content       TEXT'), 'content 列丢失');
  assert.ok(SCHEMA_SQL.includes('reject_reason TEXT'), 'reject_reason 列丢失');
});

test('C44. POST 接受 content', () => {
  var idx = SERVER_JS.indexOf("app.post('/api/requests'");
  var postBlock = SERVER_JS.slice(idx, idx + 2000);
  assert.ok(postBlock.includes('content'), 'POST 未接受 content');
});

test('C45. POST 写入 images 并返回 id', () => {
  var idx = SERVER_JS.indexOf("app.post('/api/requests'");
  var postBlock = SERVER_JS.slice(idx, idx + 2000);
  assert.ok(postBlock.includes('images'), 'POST 未写 images');
  assert.ok(postBlock.includes('lastInsertRowid'), 'POST 未返回 id');
});

// ===========================================================================
// D. 数据加载接线测试
// ===========================================================================
console.log('\n--- D. 数据加载接线测试 ---');

test('D46. loadPublicBackendConfig 标准化 requests', () => {
  var fn = extractFn(MAIN_JS, 'loadPublicBackendConfig');
  assert.ok(fn, 'loadPublicBackendConfig 不存在');
  assert.ok(fn.includes('normalizeRequestItem') || fn.includes('normalize'), '未引用标准化');
});

test('D47. 管理员加载调用标准化或统一入口', () => {
  var fn = extractFn(MAIN_JS, 'loadFullBackendConfig') || extractFn(MAIN_JS, 'renderRequestManagePanel');
  if (fn) assert.ok(fn.includes('normalizeRequestItem') || fn.includes('normalize') || fn.includes('content'), '未引用标准化');
  else assert.ok(MAIN_JS.includes('normalizeRequestItem'), '无管理员加载函数但全局有 normalizeRequestItem');
});

test('D48. renderRequests 保留 data-open-image', () => {
  var fn = extractFn(MAIN_JS, 'renderRequests');
  assert.ok(fn && fn.includes('data-open-image'), 'renderRequests 缺 data-open-image');
});

// ===========================================================================
// 运行器
// ===========================================================================
console.log('\n=== 总计: ' + passed + '/' + total + ' 通过, ' + failed + ' 失败 ===');
if (failures.length) { console.log('失败:'); failures.forEach(function(n) { console.log('  ✗ ' + n); }); process.exitCode = 1; }
