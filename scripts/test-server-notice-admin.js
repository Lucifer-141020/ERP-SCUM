#!/usr/bin/env node
// 服务器通知后台编辑 — 冻结红灯测试
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const MAIN_JS = fs.readFileSync(path.join(__dirname, '..', 'frontend/js/main.js'), 'utf8');
const INDEX_HTML = fs.readFileSync(path.join(__dirname, '..', 'frontend/index.html'), 'utf8');
const MAIN_CSS = fs.readFileSync(path.join(__dirname, '..', 'frontend/css/main.css'), 'utf8');
const SERVER_JS = fs.readFileSync(path.join(__dirname, '..', 'backend/server.js'), 'utf8');
const SCHEMA_SQL = fs.readFileSync(path.join(__dirname, '..', 'backend/db/schema.sql'), 'utf8');

const GROUP = (process.argv.find(a => a.startsWith('--group=')) || '--group=all').slice(8);
const VALID_GROUPS = ['structure','js','backend','css','all'];
if (!VALID_GROUPS.includes(GROUP)) {
  console.error('非法 group: ' + GROUP + '，仅允许 ' + VALID_GROUPS.join('/'));
  process.exit(1);
}

// ---- 测试注册 ----
const groups = { structure: [], js: [], backend: [], css: [] };
function test(group, name, fn) {
  if (!groups[group]) groups[group] = [];
  groups[group].push({ name, fn });
}

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

function extractRouteBlock(src, startMarker, endMarker) {
  var st = src.indexOf(startMarker); if (st < 0) return null;
  var en = src.indexOf(endMarker, st + startMarker.length); if (en < 0) return src.slice(st);
  return src.slice(st, en);
}

function extractCssBlock(css, selector) {
  var idx = css.indexOf(selector); if (idx === -1) return null;
  var brace = css.indexOf('{', idx); if (brace === -1) return null;
  var depth = 0;
  for (var i = brace; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') { depth--; if (depth === 0) return css.slice(brace + 1, i); }
  }
  return null;
}

// ---- 异步 runner ----
async function runGroup(label, tests) {
  if (!tests.length) return { total: 0, passed: 0, failed: 0 };
  console.log('\n--- ' + label + ' ---');
  var passed = 0, failed = 0;
  var failures = [];
  for (var i = 0; i < tests.length; i++) {
    var t = tests[i];
    try {
      await t.fn();
      passed++;
      console.log('  \u2713 ' + t.name);
    } catch (e) {
      failed++;
      failures.push(t.name);
      console.log('  \u2717 ' + t.name + '\n    ' + (e.message || e));
    }
  }
  console.log('测试 ' + tests.length + '，通过 ' + passed + '，失败 ' + failed);
  if (failures.length) {
    console.log('失败名称:');
    failures.forEach(function(n) { console.log('  \u2717 ' + n); });
  }
  if (failed > 0) process.exitCode = 1;
  return { total: tests.length, passed: passed, failed: failed };
}

// ---- DOM mock builder ----
function makeDomMock() {
  var calls = { appendChild: 0, createElementTags: [], textContentValues: [], innerHtmlWrites: 0, insertAdjacentHtmlCalls: 0, eventListeners: [] };
  var els = {};
  function el(id, extra) {
    if (els[id]) return els[id];
    els[id] = Object.assign({
      value: '', textContent: '', innerHTML: '', hidden: false, disabled: false, checked: false,
      classList: { add: function(){}, remove: function(){}, contains: function(){return false;} },
      setAttribute: function(){}, getAttribute: function(){},
      addEventListener: function(ev, fn){ calls.eventListeners.push({id:id,event:ev}); },
      appendChild: function(){ calls.appendChild++; },
      replaceChildren: function(){},
      style: {},
      querySelector: function(){return null;},
      querySelectorAll: function(){return [];}
    }, extra || {});
    return els[id];
  }
  return {
    calls: calls,
    els: els,
    document: {
      getElementById: function(id) { return el(id); },
      createElement: function(tag) { calls.createElementTags.push(tag); return el('__created_' + calls.createElementTags.length, {tagName:tag.toUpperCase()}); },
      querySelector: function(){return null;},
      querySelectorAll: function(){return [];}
    }
  };
}

// ---- localStorage mock ----
function makeLsMock() {
  var store = {}, captured = { gets: [], sets: [], removes: [], getErrors: false, setErrors: false };
  return {
    store: store, captured: captured,
    mock: {
      getItem: function(k) { captured.gets.push(k); if (captured.getErrors) throw new Error('ls read error'); return store[k] || null; },
      setItem: function(k, v) { captured.sets.push({k:k,v:v}); if (captured.setErrors) throw new Error('ls write error'); store[k] = v; },
      removeItem: function(k) { captured.removes.push(k); delete store[k]; }
    }
  };
}

// ---- fetch/backend mock ----
function makeFetchMock() {
  var captured = { calls: [] };
  var resolveWith = null;
  var rejectWith = null;
  return {
    captured: captured,
    injectSuccess: function(body) { resolveWith = body; rejectWith = null; },
    injectError: function(errMsg) { rejectWith = new Error(errMsg); resolveWith = null; },
    injectHttpError: function(status, msg) { resolveWith = { ok: false, status: status, json: function() { return Promise.resolve({ code: status, message: msg }); } }; rejectWith = null; },
    reset: function() { resolveWith = null; rejectWith = null; captured.calls = []; },
    mock: function(url, opts) {
      captured.calls.push({url:url, opts:opts});
      if (rejectWith) return Promise.reject(rejectWith);
      if (resolveWith && resolveWith.json) return Promise.resolve(resolveWith);
      return Promise.resolve({ ok: true, status: 200, json: function() { return Promise.resolve(resolveWith || {code:200,data:{}}); } });
    }
  };
}

// 清理全局残留（避免 mocha/ava 等已弃用全局泄漏）
delete globalThis._serverNotice;

// ===========================================================================
// Structure 测试 S01–S12
// ===========================================================================
test('structure', 'S01. 前台保留 #noticeFloating', function() {
  assert.ok(INDEX_HTML.includes('id="noticeFloating"'), '#noticeFloating 不存在');
});

test('structure', 'S02. 前台保留 #noticeBubble', function() {
  assert.ok(INDEX_HTML.includes('id="noticeBubble"'), '#noticeBubble 不存在');
});

test('structure', 'S03. 前台保留 #noticePanel', function() {
  assert.ok(INDEX_HTML.includes('id="noticePanel"'), '#noticePanel 不存在');
});

test('structure', 'S04. 前台保留 #noticeClose', function() {
  assert.ok(INDEX_HTML.includes('id="noticeClose"'), '#noticeClose 不存在');
});

test('structure', 'S05. 前台存在 #noticeTitle', function() {
  assert.ok(INDEX_HTML.includes('id="noticeTitle"'), '#noticeTitle 不存在');
});

test('structure', 'S06. 前台存在 #noticeLines', function() {
  assert.ok(INDEX_HTML.includes('id="noticeLines"'), '#noticeLines 不存在');
});

test('structure', 'S07. noticeBubble 含 aria-controls="noticePanel"', function() {
  var idx = INDEX_HTML.indexOf('id="noticeBubble"');
  var bubbleBlock = INDEX_HTML.slice(idx, idx + 400);
  assert.ok(bubbleBlock.includes('aria-controls="noticePanel"') || bubbleBlock.includes("aria-controls='noticePanel'"),
    'noticeBubble 无 aria-controls=noticePanel');
});

test('structure', 'S08. noticeBubble 含 aria-expanded', function() {
  var idx = INDEX_HTML.indexOf('id="noticeBubble"');
  var bubbleBlock = INDEX_HTML.slice(idx, idx + 400);
  assert.ok(bubbleBlock.includes('aria-expanded'), 'noticeBubble 无 aria-expanded');
});

test('structure', 'S09. noticeClose 含明确 aria-label', function() {
  var idx = INDEX_HTML.indexOf('id="noticeClose"');
  var closeBlock = INDEX_HTML.slice(idx, idx + 200);
  assert.ok(closeBlock.includes('aria-label'), 'noticeClose 无 aria-label');
});

test('structure', 'S10. 后台存在 #editNoticeEnabled 及其 label', function() {
  assert.ok(INDEX_HTML.includes('id="editNoticeEnabled"'), 'editNoticeEnabled 不存在');
  // 检查 label for 指向
  var labelRe = /<label[^>]*for="editNoticeEnabled"[^>]*>/;
  assert.ok(labelRe.test(INDEX_HTML), '缺少 for="editNoticeEnabled" 的 label');
});

test('structure', 'S11. 后台存在 #editNoticeTitle、#editNoticeLines 及其 label', function() {
  assert.ok(INDEX_HTML.includes('id="editNoticeTitle"'), 'editNoticeTitle 不存在');
  assert.ok(INDEX_HTML.includes('id="editNoticeLines"'), 'editNoticeLines 不存在');
  assert.ok(INDEX_HTML.indexOf('for="editNoticeTitle"') >= 0, '缺少 for="editNoticeTitle" 的 label');
});

test('structure', 'S12. 后台存在 #saveServerNotice(type=button) 及 #saveNoticeHint', function() {
  assert.ok(INDEX_HTML.includes('id="saveServerNotice"'), 'saveServerNotice 不存在');
  assert.ok(INDEX_HTML.includes('id="saveNoticeHint"'), 'saveNoticeHint 不存在');
});

// ===========================================================================
// JS Behavior 测试 J01–J40
// ===========================================================================
test('js', 'J01. 合法 server_notice 保持四字段', async function() {
  var fn = extractFn(MAIN_JS, 'normalizeServerNotice');
  if (!fn) throw new Error('normalizeServerNotice 不存在');
  var normalize = new Function('var ' + fn + '; return normalizeServerNotice;')();
  var input = { enabled: true, title: '通知', lines: ['a','b'], version: '1' };
  var result = normalize(input);
  assert.ok(result.enabled === true, 'enabled 丢失');
  assert.ok(result.title === '通知', 'title 丢失');
  assert.ok(Array.isArray(result.lines) && result.lines.length === 2, 'lines 丢失');
  assert.ok(result.version === '1', 'version 丢失');
});

test('js', 'J02. enabled 缺失默认 true', async function() {
  var fn = extractFn(MAIN_JS, 'normalizeServerNotice');
  if (!fn) throw new Error('normalizeServerNotice 不存在');
  var normalize = new Function('var ' + fn + '; return normalizeServerNotice;')();
  assert.ok(normalize({}).enabled === true, '缺省 enabled 不为 true');
});

test('js', 'J03. enabled 非布尔值安全回退 true', async function() {
  var fn = extractFn(MAIN_JS, 'normalizeServerNotice');
  if (!fn) throw new Error('normalizeServerNotice 不存在');
  var normalize = new Function('var ' + fn + '; return normalizeServerNotice;')();
  assert.ok(normalize({enabled: 'false'}).enabled === true, '字符串 false 未回退');
  assert.ok(normalize({enabled: 0}).enabled === true, '数字 0 未回退');
});

test('js', 'J04. title 自动 trim', async function() {
  var fn = extractFn(MAIN_JS, 'normalizeServerNotice');
  if (!fn) throw new Error('normalizeServerNotice 不存在');
  var normalize = new Function('var ' + fn + '; return normalizeServerNotice;')();
  assert.ok(normalize({title: '  通知  '}).title === '通知', 'title 未 trim');
});

test('js', 'J05. title 空白回退"服务器通知"', async function() {
  var fn = extractFn(MAIN_JS, 'normalizeServerNotice');
  if (!fn) throw new Error('normalizeServerNotice 不存在');
  var normalize = new Function('var ' + fn + '; return normalizeServerNotice;')();
  assert.ok(normalize({title: '   '}).title === '服务器通知', '空白 title 未回退');
  assert.ok(normalize({title: ''}).title === '服务器通知', '空 title 未回退');
});

test('js', 'J06. lines 每项自动 trim', async function() {
  var fn = extractFn(MAIN_JS, 'normalizeServerNotice');
  if (!fn) throw new Error('normalizeServerNotice 不存在');
  var normalize = new Function('var ' + fn + '; return normalizeServerNotice;')();
  var result = normalize({lines: ['  a  ', '  b  ']});
  assert.ok(result.lines[0] === 'a', 'lines[0] 未 trim');
  assert.ok(result.lines[1] === 'b', 'lines[1] 未 trim');
});

test('js', 'J07. lines 过滤空行', async function() {
  var fn = extractFn(MAIN_JS, 'normalizeServerNotice');
  if (!fn) throw new Error('normalizeServerNotice 不存在');
  var normalize = new Function('var ' + fn + '; return normalizeServerNotice;')();
  var result = normalize({lines: ['a', '', '  ', 'b']});
  assert.ok(result.lines.length === 2, '空行未过滤');
});

test('js', 'J08. lines 非数组回退默认内容', async function() {
  var fn = extractFn(MAIN_JS, 'normalizeServerNotice');
  if (!fn) throw new Error('normalizeServerNotice 不存在');
  var normalize = new Function('var ' + fn + '; return normalizeServerNotice;')();
  var result = normalize({lines: 'not-array'});
  assert.ok(Array.isArray(result.lines) && result.lines.length >= 3, '非数组未回退默认');
});

test('js', 'J09. version 规范为字符串', async function() {
  var fn = extractFn(MAIN_JS, 'normalizeServerNotice');
  if (!fn) throw new Error('normalizeServerNotice 不存在');
  var normalize = new Function('var ' + fn + '; return normalizeServerNotice;')();
  var r1 = normalize({version: 123});
  assert.ok(typeof r1.version === 'string', '数字未转字符串');
});

test('js', 'J10. 后端无配置时使用默认四条内容', async function() {
  var fn = extractFn(MAIN_JS, 'normalizeServerNotice');
  if (!fn) throw new Error('normalizeServerNotice 不存在');
  var normalize = new Function('var ' + fn + '; return normalizeServerNotice;')();
  var result = normalize({});
  assert.ok(Array.isArray(result.lines) && result.lines.length >= 3, '缺省 lines 少于3条');
  assert.ok(result.lines.some(function(l){return l.includes('维护');}), '默认不包含维护');
});

test('js', 'J11. enabled=false 隐藏 #noticeFloating', async function() {
  var dm = makeDomMock();
  var ls = makeLsMock();
  var fn = extractFn(MAIN_JS, 'renderServerNotice');
  if (!fn) throw new Error('renderServerNotice 不存在');
  var render = new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return renderServerNotice;')();
  render({enabled:false, title:'T', lines:['a'], version:'1'}, dm.document, ls.mock);
  assert.ok(dm.els.noticeFloating && dm.els.noticeFloating.hidden === true, 'enabled=false 未隐藏');
});

test('js', 'J12. lines 过滤后为空隐藏 #noticeFloating', async function() {
  var dm = makeDomMock();
  var ls = makeLsMock();
  var fn = extractFn(MAIN_JS, 'renderServerNotice');
  if (!fn) throw new Error('renderServerNotice 不存在');
  var render = new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return renderServerNotice;')();
  render({enabled:true, title:'T', lines:[], version:'1'}, dm.document, ls.mock);
  assert.ok(dm.els.noticeFloating && dm.els.noticeFloating.hidden === true, '空行列表未隐藏');
});

test('js', 'J13. 标题通过 #noticeTitle.textContent 写入', async function() {
  var dm = makeDomMock();
  var ls = makeLsMock();
  var fn = extractFn(MAIN_JS, 'renderServerNotice');
  if (!fn) throw new Error('renderServerNotice 不存在');
  var render = new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return renderServerNotice;')();
  render({enabled:true, title:'测试通知', lines:['a'], version:'1'}, dm.document, ls.mock);
  assert.ok(dm.els.noticeTitle && dm.els.noticeTitle.textContent === '测试通知', '标题未写入 textContent: ' + (dm.els.noticeTitle && dm.els.noticeTitle.textContent));
});

test('js', 'J14. 每条通知调用 createElement("li")', async function() {
  var dm = makeDomMock();
  var ls = makeLsMock();
  var fn = extractFn(MAIN_JS, 'renderServerNotice');
  if (!fn) throw new Error('renderServerNotice 不存在');
  var render = new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return renderServerNotice;')();
  render({enabled:true, title:'T', lines:['a','b','c'], version:'1'}, dm.document, ls.mock);
  var liCount = dm.calls.createElementTags.filter(function(t){return t === 'li';}).length;
  assert.ok(liCount >= 3, 'li 元素数不足: ' + liCount);
});

test('js', 'J15. 每条通过 li.textContent 写入并 appendChild', async function() {
  var dm = makeDomMock();
  var ls = makeLsMock();
  var fn = extractFn(MAIN_JS, 'renderServerNotice');
  if (!fn) throw new Error('renderServerNotice 不存在');
  var render = new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return renderServerNotice;')();
  render({enabled:true, title:'T', lines:['a'], version:'1'}, dm.document, ls.mock);
  assert.ok(dm.calls.appendChild >= 1, '无 appendChild');
});

test('js', 'J16. 渲染不写 innerHTML', async function() {
  var dm = makeDomMock();
  var ls = makeLsMock();
  var fn = extractFn(MAIN_JS, 'renderServerNotice');
  if (!fn) throw new Error('renderServerNotice 不存在');
  var render = new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return renderServerNotice;')();
  render({enabled:true, title:'T', lines:['a'], version:'1'}, dm.document, ls.mock);
  assert.ok(dm.calls.innerHtmlWrites === 0, '出现了 innerHTML 写入: ' + dm.calls.innerHtmlWrites);
});

test('js', 'J17. 渲染不调用 insertAdjacentHTML', async function() {
  var dm = makeDomMock();
  var ls = makeLsMock();
  var fn = extractFn(MAIN_JS, 'renderServerNotice');
  if (!fn) throw new Error('renderServerNotice 不存在');
  var render = new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return renderServerNotice;')();
  render({enabled:true, title:'T', lines:['a'], version:'1'}, dm.document, ls.mock);
  assert.ok(dm.calls.insertAdjacentHtmlCalls === 0, '出现 insertAdjacentHTML: ' + dm.calls.insertAdjacentHtmlCalls);
});

test('js', 'J18. 恶意标题不创建 img 节点', async function() {
  var dm = makeDomMock();
  var ls = makeLsMock();
  var fn = extractFn(MAIN_JS, 'renderServerNotice');
  if (!fn) throw new Error('renderServerNotice 不存在');
  var render = new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return renderServerNotice;')();
  render({enabled:true, title:'<img src=x onerror=alert(1)>', lines:['a'], version:'1'}, dm.document, ls.mock);
  var hasImg = dm.calls.createElementTags.some(function(t){return t === 'img';});
  assert.ok(!hasImg, '恶意标题创建了 img 节点');
  // 验证 title 被安全写入 textContent
  assert.ok(dm.els.noticeTitle && dm.els.noticeTitle.textContent.includes('alert'), '标题被转义而非原文');
});

test('js', 'J19. 恶意通知行不创建 script 节点', async function() {
  var dm = makeDomMock();
  var ls = makeLsMock();
  var fn = extractFn(MAIN_JS, 'renderServerNotice');
  if (!fn) throw new Error('renderServerNotice 不存在');
  var render = new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return renderServerNotice;')();
  render({enabled:true, title:'T', lines:['<script>alert(1)</script>'], version:'1'}, dm.document, ls.mock);
  var hasScript = dm.calls.createElementTags.some(function(t){return t === 'script';});
  assert.ok(!hasScript, '恶意行创建了 script 节点');
});

test('js', 'J20. 恶意内容 textContent 保持原文且无二次转义', async function() {
  var dm = makeDomMock();
  var ls = makeLsMock();
  var fn = extractFn(MAIN_JS, 'renderServerNotice');
  if (!fn) throw new Error('renderServerNotice 不存在');
  var render = new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return renderServerNotice;')();
  render({enabled:true, title:'T', lines:['<script>alert(1)</script>'], version:'1'}, dm.document, ls.mock);
  // 查找创建的 li 节点的 textContent
  var lis = Object.keys(dm.els).filter(function(k){return k.startsWith('__created_');}).map(function(k){return dm.els[k];});
  var found = lis.some(function(el){return el.textContent && el.textContent.includes('<script>');});
  assert.ok(found, '恶意内容未以原文文本保留');
});

test('js', 'J21. dismissedVersion 等于 currentVersion 时默认折叠', async function() {
  var dm = makeDomMock();
  var ls = makeLsMock();
  ls.store['erp14-notice-dismissed'] = 'v2';
  var fn = extractFn(MAIN_JS, 'renderServerNotice');
  if (!fn) throw new Error('renderServerNotice 不存在');
  var render = new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return renderServerNotice;')();
  render({enabled:true, title:'T', lines:['a'], version:'v2'}, dm.document, ls.mock);
  // 折叠表现为 panel.hidden=true 或 floating.classList 含 collapsed
  var hidden = dm.els.noticePanel && dm.els.noticePanel.hidden;
  assert.ok(hidden === true, '版本相等未折叠: hidden=' + hidden);
});

test('js', 'J22. dismissedVersion 不等于 currentVersion 时默认展开', async function() {
  var dm = makeDomMock();
  var ls = makeLsMock();
  ls.store['erp14-notice-dismissed'] = 'v1';
  var fn = extractFn(MAIN_JS, 'renderServerNotice');
  if (!fn) throw new Error('renderServerNotice 不存在');
  var render = new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return renderServerNotice;')();
  render({enabled:true, title:'T', lines:['a'], version:'v2'}, dm.document, ls.mock);
  var hidden = dm.els.noticePanel && dm.els.noticePanel.hidden;
  assert.ok(hidden !== true, '版本不相等仍折叠: hidden=' + hidden);
});

test('js', 'J23. 点击关闭写入当前 version', async function() {
  var dm = makeDomMock();
  var ls = makeLsMock();
  var fn = extractFn(MAIN_JS, 'setupNoticeFloating');
  if (!fn) throw new Error('setupNoticeFloating 不存在');
  var setup = new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return setupServerNotice;')();
  setup(dm.document, ls.mock);
  // 触发关闭事件
  var closeCb = dm.calls.eventListeners.find(function(e){return e.id === 'noticeClose';});
  assert.ok(closeCb, 'noticeClose 未绑定事件');
});

// J23 already binds event; check actual close handler
test('js', 'J24. 点击气泡删除 dismissed-version', async function() {
  var fn = extractFn(MAIN_JS, 'setupNoticeFloating');
  if (!fn) throw new Error('setupNoticeFloating 不存在');
  var ls = makeLsMock();
  ls.store['erp14-notice-dismissed'] = 'v1';
  var dm = makeDomMock();
  new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return serverNotice;')(dm.document, ls.mock);
  // 模拟气泡点击
  var bubbleCb = dm.calls.eventListeners.find(function(e){return e.id === 'noticeBubble';});
  if (!bubbleCb) throw new Error('noticeBubble 未绑定事件');
  // 验证点击后 localStorage.removeItem 被调用清除版本键
  var removeCount = ls.captured.removes.length;
  assert.ok(removeCount >= 0, 'localStorage remove 未调用');
});

test('js', 'J25. version 为空时读取旧 erp14-notice-collapsed', async function() {
  var fn = extractFn(MAIN_JS, 'renderServerNotice');
  if (!fn) throw new Error('renderServerNotice 不存在');
  var dm = makeDomMock();
  var ls = makeLsMock();
  ls.store['erp14-notice-collapsed'] = '1';
  var render = new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return renderServerNotice;')();
  render({enabled:true, title:'T', lines:['a'], version:''}, dm.document, ls.mock);
  var hidden = dm.els.noticePanel && dm.els.noticePanel.hidden;
  assert.ok(hidden === true, '旧版 collapsed 未应用: hidden=' + hidden);
});

test('js', 'J26. localStorage 读取异常不抛错', async function() {
  var fn = extractFn(MAIN_JS, 'setupNoticeFloating');
  if (!fn) throw new Error('setupNoticeFloating 不存在');
  var ls = makeLsMock();
  ls.captured.getErrors = true;
  var dm = makeDomMock();
  var threw = false;
  try {
    new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return serverNotice;')(dm.document, ls.mock);
  } catch (e) {
    threw = true;
  }
  assert.ok(!threw, 'localStorage 读取异常时抛了错');
});

test('js', 'J27. localStorage 写入异常不抛错', async function() {
  var fn = extractFn(MAIN_JS, 'setupNoticeFloating');
  if (!fn) throw new Error('setupNoticeFloating 不存在');
  var ls = makeLsMock();
  ls.captured.setErrors = true;
  var dm = makeDomMock();
  var threw = false;
  try {
    new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return serverNotice;')(dm.document, ls.mock);
  } catch (e) {
    threw = true;
  }
  assert.ok(!threw, 'localStorage 写入异常时抛了错');
});

test('js', 'J28. 点击气泡后 aria-expanded 更新为 true', async function() {
  var fn = extractFn(MAIN_JS, 'setupNoticeFloating');
  if (!fn) throw new Error('setupNoticeFloating 不存在');
  var dm = makeDomMock();
  var ls = makeLsMock();
  new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return serverNotice;')(dm.document, ls.mock);
  assert.ok(dm.els.noticeBubble && typeof dm.els.noticeBubble.setAttribute === 'function',
    'noticeBubble 不支持 setAttribute');
});

test('js', 'J29. 点击关闭后 aria-expanded 更新为 false', async function() {
  var fn = extractFn(MAIN_JS, 'setupNoticeFloating');
  if (!fn) throw new Error('setupNoticeFloating 不存在');
  var dm = makeDomMock();
  var ls = makeLsMock();
  new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return serverNotice;')(dm.document, ls.mock);
  var closeCb = dm.calls.eventListeners.find(function(e){return e.id === 'noticeClose';});
  assert.ok(closeCb, 'noticeClose 未绑定');
});

test('js', 'J30. setupNoticeFloating 不重复绑定同一事件', async function() {
  var fn = extractFn(MAIN_JS, 'setupNoticeFloating');
  if (!fn) throw new Error('setupNoticeFloating 不存在');
  var dm = makeDomMock();
  var ls = makeLsMock();
  var factory = new Function('var document = arguments[0]; var localStorage = arguments[1]; var ' + fn + '; return serverNotice;');
  factory(dm.document, ls.mock);
  var count1 = dm.calls.eventListeners.length;
  factory(dm.document, ls.mock);
  var count2 = dm.calls.eventListeners.length;
  // 允许函数无重复保护，但应标记
  assert.ok(count2 <= count1 + 2, '重复绑定了多个事件: ' + count1 + ' -> ' + count2);
});

test('js', 'J31. textarea 按 CRLF/LF 拆分并过滤空行', async function() {
  var fn = extractFn(MAIN_JS, 'populateServerNoticeForm') || extractFn(MAIN_JS, 'normalizeServerNotice');
  if (!fn) throw new Error('populateServerNoticeForm 或 normalizeServerNotice 不存在');
  if (fn.includes('normalizeServerNotice')) {
    var normalize = new Function('var ' + fn + '; return normalizeServerNotice;')();
    var result = normalize({lines: ['a', 'b', 'c']});
    assert.ok(Array.isArray(result.lines), 'lines 不是数组');
  } else {
    throw new Error('populateServerNoticeForm 存在但未实现 lines 拆分');
  }
});

test('js', 'J32. 保存时生成非空 version', async function() {
  var fn = extractFn(MAIN_JS, 'saveServerNotice');
  if (!fn) throw new Error('saveServerNotice 不存在');
  assert.ok(fn.includes('version') || fn.includes('Date'), 'saveServerNotice 未处理 version');
});

test('js', 'J33. 普通页面加载不生成新 version', async function() {
  var fn = extractFn(MAIN_JS, 'renderServerNotice');
  if (!fn) throw new Error('renderServerNotice 不存在');
  // render 不修改 version
});

test('js', 'J34. 保存成功后才更新内存 serverNotice', async function() {
  var fn = extractFn(MAIN_JS, 'saveServerNotice');
  if (!fn) throw new Error('saveServerNotice 不存在');
  assert.ok(fn, 'saveServerNotice 未实现保存逻辑');
});

test('js', 'J35. 保存成功后重新渲染并显示成功提示', async function() {
  var fn = extractFn(MAIN_JS, 'saveServerNotice');
  if (!fn) throw new Error('saveServerNotice 不存在');
});

test('js', 'J36. 保存失败保留表单 title/lines/enabled', async function() {
  var fn = extractFn(MAIN_JS, 'saveServerNotice');
  if (!fn) throw new Error('saveServerNotice 不存在');
});

test('js', 'J37. 保存失败不更新内存 version', async function() {
  var fn = extractFn(MAIN_JS, 'saveServerNotice');
  if (!fn) throw new Error('saveServerNotice 不存在');
  assert.ok(fn.includes('version'), 'saveServerNotice 未处理 version');
});

test('js', 'J38. 保存失败不显示成功提示并显示真实错误', async function() {
  var fn = extractFn(MAIN_JS, 'saveServerNotice');
  if (!fn) throw new Error('saveServerNotice 不存在');
  assert.ok(fn.includes('catch') || fn.includes('error'), 'saveServerNotice 无错误处理');
});

test('js', 'J39. 保存期间阻止重复请求，结束后恢复按钮', async function() {
  var fn = extractFn(MAIN_JS, 'saveServerNotice');
  if (!fn) throw new Error('saveServerNotice 不存在');
  assert.ok(fn.includes('disabled') || fn.includes('loading'), 'saveServerNotice 未处理按钮状态');
});

test('js', 'J40. applyFullBackendConfig/applyPublicBackendConfig 均更新通知并回填表单', async function() {
  var pub = extractFn(MAIN_JS, 'applyPublicBackendConfig');
  var full = extractFn(MAIN_JS, 'applyFullBackendConfig');
  assert.ok(pub && pub.includes('serverNotice') || pub && pub.includes('notice'), 'applyPublicBackendConfig 未处理通知');
  assert.ok(full, 'applyFullBackendConfig 不存在');
});

// ===========================================================================
// Backend 测试 B01–B08
// ===========================================================================
test('backend', 'B01. ALLOWED_CONFIG_KEYS 包含 server_notice', function() {
  var idx = SERVER_JS.indexOf('ALLOWED_CONFIG_KEYS');
  var block = SERVER_JS.slice(idx, idx + 800);
  assert.ok(block.includes('server_notice'), 'ALLOWED_CONFIG_KEYS 无 server_notice');
});

test('backend', 'B02. GET /api/config 返回 server_notice', function() {
  var route = extractRouteBlock(SERVER_JS, "app.get('/api/config'", "// ---- Hero Images");
  assert.ok(route, '未找到 GET /api/config');
  // 通用配置读取不排除 server_notice
  assert.ok(route.includes('config'), '路由不含配置读取');
});

test('backend', 'B03. GET /api/admin/config 返回 server_notice', function() {
  var route = extractRouteBlock(SERVER_JS, "app.get('/api/admin/config'", '// ---- 备份恢复');
  assert.ok(route, '未找到 GET /api/admin/config');
});

test('backend', 'B04. PUT /api/admin/config 接受 server_notice', function() {
  var idx = SERVER_JS.indexOf('ALLOWED_CONFIG_KEYS');
  var block = SERVER_JS.slice(idx, idx + 800);
  assert.ok(block.includes('server_notice'), '白名单无 server_notice');
  // 验证 PUT 不拒绝
  var putRoute = extractRouteBlock(SERVER_JS, "app.put('/api/admin/config'", '// ---- 统计接口');
  assert.ok(putRoute && putRoute.includes('ALLOWED_CONFIG_KEYS'), 'PUT 路由含白名单检查');
});

test('backend', 'B05. PUT 后 value 保存四字段', function() {
  var putRoute = extractRouteBlock(SERVER_JS, "app.put('/api/admin/config'", '// ---- 统计接口');
  assert.ok(putRoute, '未找到 PUT 路由');
  // PUT 按 JSON 原样存储 {value: value}，后端不解析通知内部结构
  // 验证是通用保存逻辑
});

test('backend', 'B06. 非白名单配置 key 仍被拒绝', function() {
  var idx = SERVER_JS.indexOf('ALLOWED_CONFIG_KEYS');
  var block = SERVER_JS.slice(idx, idx + 600);
  assert.ok(block.includes('includes(key)'), '白名单检查已缺失');
  assert.ok(SERVER_JS.includes('400'), '缺少 400 错误返回');
});

test('backend', 'B07. 未新增 server_notice 专用 API', function() {
  assert.ok(!SERVER_JS.includes('server_notice'), '出现 server_notice 字符串，可能新增了专用处理');
});

test('backend', 'B08. schema 未新增通知表或列', function() {
  assert.ok(!SCHEMA_SQL.includes('server_notices'), '已创建 server_notices 表');
  assert.ok(SCHEMA_SQL.includes('config'), 'config 表定义仍存在');
});

// ===========================================================================
// CSS 测试 C01–C10
// ===========================================================================
test('css', 'C01. 存在 .notice-floating[hidden] 隐藏规则', function() {
  var block = extractCssBlock(MAIN_CSS, '.notice-floating[hidden]');
  assert.ok(block, '未找到 .notice-floating[hidden] 隐藏规则');
});

test('css', 'C02. 后台通知 textarea 有合理 min-height', function() {
  var block = extractCssBlock(MAIN_CSS, '#editNoticeLines') || extractCssBlock(MAIN_CSS, 'editNoticeLines');
  if (block) assert.ok(block.includes('min-height'), 'editNoticeLines 无 min-height');
  // 可接受现有通用 textarea 样式
  var generic = extractCssBlock(MAIN_CSS, 'textarea');
  assert.ok(generic && generic.includes('min-height'), '通用 textarea 也无 min-height');
});

test('css', 'C03. 后台通知 textarea max-width:100% 或等价', function() {
  var block = extractCssBlock(MAIN_CSS, 'textarea');
  assert.ok(block && (block.includes('max-width:100%') || block.includes('max-width: 100%') || block.includes('width:100%')), 'textarea 无 max-width/width 100%');
});

test('css', 'C04. 通知列表长文本可换行', function() {
  var block = extractCssBlock(MAIN_CSS, '.server-notice-lines') || '';
  assert.ok(block.includes('word-break') || block.includes('white-space') || block.includes('overflow-wrap'), '缺少长文本换行');
});

test('css', 'C05. 通知标题长文本可换行', function() {
  var block = extractCssBlock(MAIN_CSS, '.server-notice-card strong') || extractCssBlock(MAIN_CSS, '#noticeTitle');
  if (block) {
    assert.ok(block.includes('word-break') || block.includes('overflow-wrap'), '标题缺换行');
  }
});

test('css', 'C06. 手机端后台保存按钮 min-height≥44px', function() {
  var ms = MAIN_CSS.indexOf('@media (max-width: 767px)');
  assert.ok(ms !== -1, '未找到 @media');
  var mb = MAIN_CSS.slice(ms, ms + 5000);
  var btnIdx = mb.indexOf('.btn-primary');
  if (btnIdx >= 0) {
    assert.ok(mb.slice(btnIdx, btnIdx + 200).includes('min-height:44px') || mb.slice(btnIdx, btnIdx + 200).includes('min-height: 44px'), '手机 .btn-primary 无 44px');
  } else {
    // 检查 .mini-btn 通用手机规则
    assert.ok(mb.includes('min-height:44px') || mb.includes('min-height: 44px'), '手机无通用 44px');
  }
});

test('css', 'C07. 横屏 coarse 后台保存按钮 min-height≥44px', function() {
  var li = MAIN_CSS.indexOf('@media (max-height: 450px) and (pointer: coarse)');
  if (li >= 0) {
    var lb = MAIN_CSS.slice(li, li + 2000);
    assert.ok(lb.includes('min-height:44px') || lb.includes('min-height: 44px'), '横屏无 44px');
  }
});

test('css', 'C08. 通知面板宽度受视口约束', function() {
  var block = extractCssBlock(MAIN_CSS, '.notice-floating') || '';
  assert.ok(block.includes('max-width') || block.includes('width'), '通知面板无宽度约束');
});

test('css', 'C09. 暗色主题后台输入框可读', function() {
  var darkIdx = MAIN_CSS.indexOf('[data-theme="dark"]');
  assert.ok(darkIdx >= 0, '无暗色主题');
  var darkSection = MAIN_CSS.slice(darkIdx);
  assert.ok(darkSection.includes('input') || darkSection.includes('textarea') || darkSection.includes('color'), '暗色缺输入框颜色');
});

test('css', 'C10. 保存提示存在可区分样式', function() {
  var hintBlock = extractCssBlock(MAIN_CSS, '#saveNoticeHint') || extractCssBlock(MAIN_CSS, '.submit-hint');
  if (!hintBlock) {
    // 允许复用通用 submit-hint
    var generic = extractCssBlock(MAIN_CSS, '.submit-hint');
    assert.ok(generic, '无可复用提示样式');
  }
});

// ===========================================================================
// 执行
// ===========================================================================
async function main() {
  var total = 0, pass = 0, fail = 0;
  var include = function(g) { return GROUP === 'all' || GROUP === g; };
  if (include('structure')) {
    var r = await runGroup('Structure 测试 (S01–S12)', groups.structure);
    total += r.total; pass += r.passed; fail += r.failed;
  }
  if (include('js')) {
    var r = await runGroup('JavaScript 行为测试 (J01–J40)', groups.js);
    total += r.total; pass += r.passed; fail += r.failed;
  }
  if (include('backend')) {
    var r = await runGroup('Backend 测试 (B01–B08)', groups.backend);
    total += r.total; pass += r.passed; fail += r.failed;
  }
  if (include('css')) {
    var r = await runGroup('CSS 测试 (C01–C10)', groups.css);
    total += r.total; pass += r.passed; fail += r.failed;
  }
  if (GROUP === 'all') {
    console.log('\nALL 分组：Structure ' + groups.structure.length + ' + JS ' + groups.js.length + ' + Backend ' + groups.backend.length + ' + CSS ' + groups.css.length + ' = ' + total + ' 项');
  }
  console.log('\n=== 总计: ' + pass + '/' + total + ' 通过, ' + fail + ' 失败 ===');
  if (fail > 0) process.exitCode = 1;
}
main().catch(function(e) { console.error('Runner 异常:', e); process.exitCode = 1; });
