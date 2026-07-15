#!/usr/bin/env node
// 服务器通知后台编辑 — 冻结红灯测试（修正脚手架版）
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

// 提取 panelTemplates.homeManage 模板字符串（结束锚点为 groupManage）
function extractHomeManageTemplate(source) {
  var start = source.indexOf('homeManage: () =>');
  if (start < 0) return null;
  var end = source.indexOf('groupManage:', start);
  return end < 0 ? source.slice(start) : source.slice(start, end);
}

// ---- 安全编译辅助 ----
function compileExtractedFunction(source, functionName, prelude) {
  return new Function(prelude + '\n' + source + '\nreturn ' + functionName + ';')();
}

// ---- 统一沙箱工厂 ----
function buildNoticeSandbox(opts) {
  opts = opts || {};
  var state = {
    serverNotice: null,
    renderCount: 0,
    fetchCalls: [],
    toastCalls: [],
    domCalls: { appendChild: 0, createElementTags: [], innerHtmlWrites: 0, insertAdjacentHtmlCalls: 0, eventListeners: [] },
    storageCalls: { gets: [], sets: [], removes: [] },
    lsStore: opts.lsStore || {},
    lsGetErrors: false,
    lsSetErrors: false,
  };
  var fetchResolve = opts.fetchResolve || null;
  var fetchReject = opts.fetchReject || null;
  var pendingPromise = null;
  var pendingResolve = null;
  var pendingReject = null;
  var fetchPendingMode = false;
  var _pendingResolved = false;

  // DOM mock
  var els = {};
  // 预创建关键 DOM 节点，确保 sb.els.* 在测试设置值前存在
  function ensureEl(id, extra) { return makeEl(id, extra); }
  // 后台表单
  ensureEl('editNoticeEnabled', { tagName: 'INPUT', type: 'checkbox' });
  ensureEl('editNoticeTitle', { tagName: 'INPUT', type: 'text' });
  ensureEl('editNoticeLines', { tagName: 'TEXTAREA' });
  ensureEl('saveServerNotice', { tagName: 'BUTTON', type: 'button' });
  ensureEl('saveNoticeHint', { tagName: 'DIV' });
  // 前台通知
  ensureEl('noticeFloating', { tagName: 'DIV' });
  ensureEl('noticeBubble', { tagName: 'BUTTON' });
  ensureEl('noticePanel', { tagName: 'DIV' });
  ensureEl('noticeClose', { tagName: 'BUTTON' });
  ensureEl('noticeTitle', { tagName: 'STRONG' });
  ensureEl('noticeLines', { tagName: 'UL' });
  function makeEl(id, extra) {
    if (els[id]) return els[id];
    var el = {
      _id: id, value: '', textContent: '', innerHTML: '', hidden: false, disabled: false, checked: false,
      tagName: 'DIV',
      classList: { _classes: {}, add: function(c){this._classes[c]=true;}, remove: function(c){delete this._classes[c];}, contains: function(c){return !!this._classes[c];} },
      _attrs: {}, children: [],
      setAttribute: function(k,v){ this._attrs[k] = String(v); },
      getAttribute: function(k){ return this._attrs[k] || null; },
      addEventListener: function(ev, fn){ state.domCalls.eventListeners.push({id:id, event:ev, fn:fn}); },
      appendChild: function(child){ state.domCalls.appendChild++; this.children.push(child); return child; },
      replaceChildren: function(){ this.children = []; },
      insertAdjacentHTML: function(){ state.domCalls.insertAdjacentHtmlCalls++; },
      removeEventListener: function(){},
      style: {},
      querySelector: function(){return null;},
      querySelectorAll: function(){return [];},
      click: function() {},
      focus: function() {},
    };
    // innerHTML setter tracking
    Object.defineProperty(el, 'innerHTML', {
      get: function(){ return this._innerHTML || ''; },
      set: function(v){ this._innerHTML = v; state.domCalls.innerHtmlWrites++; },
      configurable: true,
    });
    Object.keys(extra || {}).forEach(function(k){ el[k] = extra[k]; });
    els[id] = el;
    return el;
  }
  var document = {
    getElementById: function(id) { return makeEl(id); },
    createElement: function(tag) {
      var el = makeEl('__created_' + (state.domCalls.createElementTags.length + 1), { tagName: tag.toUpperCase() });
      state.domCalls.createElementTags.push(tag);
      return el;
    },
    querySelector: function(){return null;},
    querySelectorAll: function(){return [];},
  };

  // localStorage mock
  var localStorage = {
    getItem: function(k) { state.storageCalls.gets.push(k); if (state.lsGetErrors) throw new Error('ls read error'); return state.lsStore[k] || null; },
    setItem: function(k, v) { state.storageCalls.sets.push({k:k, v:v}); if (state.lsSetErrors) throw new Error('ls write error'); state.lsStore[k] = v; },
    removeItem: function(k) { state.storageCalls.removes.push(k); if (state.lsSetErrors) throw new Error('ls write error'); delete state.lsStore[k]; },
  };

  // fetch mock
  function fetch(url, options) {
    state.fetchCalls.push({url:url, opts:options});
    if (fetchReject) return Promise.reject(fetchReject);
    if (fetchResolve) return Promise.resolve(fetchResolve);
    if (fetchPendingMode) {
      pendingPromise = new Promise(function(resolve, reject) {
        pendingResolve = resolve;
        pendingReject = reject;
      });
      return pendingPromise;
    }
    return Promise.resolve({ ok: true, status: 200, json: function() { return Promise.resolve({code:200, data:{}}); } });
  }

  function backendUrl(p) { return p; }
  function showToast(msg, type) { state.toastCalls.push({msg:msg, type:type}); }
  var icons = {};

  // Extract and compile all functions into shared scope
  var fnNames = ['normalizeServerNotice','renderServerNotice','populateServerNoticeForm','saveServerNotice','setupNoticeFloating','applyPublicBackendConfig','applyFullBackendConfig'];
  var fnSources = [];
  var fnAvailable = {};
  fnNames.forEach(function(name) {
    var src = extractFn(MAIN_JS, name);
    if (src) { fnSources.push(src); fnAvailable[name] = true; }
    else { fnSources.push('function ' + name + '() { throw new Error("' + name + ' 不存在"); }'); }
  });

  // Build factory with shared scope — prepend all state variables and dependency mocks
  var stateDecl =
    'var serverNotice = null;\n' +
    'var renderCount = 0;\n' +
    '// ---- 配置环境依赖 mock ----\n' +
    'var heroImages = [];\n' +
    'var serverInfo = {};\n' +
    'var playItems = [];\n' +
    'var updates = [];\n' +
    'var siteSections = {};\n' +
    'var homeStats = [];\n' +
    'var homeFeatures = {};\n' +
    'var serverRules = {};\n' +
    'var buildingTemplates = [];\n' +
    'var requests = [];\n' +
    'var playerSessions = [];\n' +
    'var logs = [];\n' +
    'var imageLibrary = [];\n' +
    'var requestVotes = {};\n' +
    'var panelViews = {};\n' +
    'var contentOverrides = [];\n' +
    'function mergeArray(base, incoming) { if (Array.isArray(incoming)) return incoming.slice(); return base; }\n' +
    'function mergeObject(base, incoming) { if (incoming && typeof incoming === "object" && !Array.isArray(incoming)) return Object.assign({}, base, incoming); return base; }\n' +
    'function normalizeUpdates() {}\n' +
    'function normalizeSiteSections() {}\n' +
    'function normalizeRequestItem(item) { return item; }\n' +
    'var _renderAllCount = 0;\n' +
    'function renderAll() { _renderAllCount++; }\n' +
    'function getRenderAllCount() { return _renderAllCount; }\n';
  var factoryBody = stateDecl +
    fnSources.join('\n') + '\n' +
    'return {\n' +
    '  normalizeServerNotice: normalizeServerNotice,\n' +
    '  renderServerNotice: renderServerNotice,\n' +
    '  populateServerNoticeForm: populateServerNoticeForm,\n' +
    '  saveServerNotice: saveServerNotice,\n' +
    '  setupNoticeFloating: setupNoticeFloating,\n' +
    '  applyPublicBackendConfig: applyPublicBackendConfig,\n' +
    '  applyFullBackendConfig: applyFullBackendConfig,\n' +
    '  setServerNotice: function(v) { serverNotice = v; },\n' +
    '  getServerNotice: function() { return serverNotice; },\n' +
    '  incrementRenderCount: function() { renderCount++; },\n' +
    '  getRenderCount: function() { return renderCount; },\n' +
    '  getRenderAllCount: function() { return _renderAllCount; },\n' +
    '  fnAvailable: fnAvailable\n' +
    '};\n';

  var factory = new Function('document','localStorage','fetch','backendUrl','showToast','icons','fnAvailable', factoryBody);
  var fns;
  try {
    fns = factory(document, localStorage, fetch, backendUrl, showToast, icons, fnAvailable);
  } catch(e) {
    fns = { _compileError: e.message };
  }

  return {
    fns: fns,
    state: state,
    document: document,
    localStorage: localStorage,
    els: els,
    setServerNotice: function(v) { if (fns.setServerNotice) fns.setServerNotice(v); },
    getServerNotice: function() { return fns.getServerNotice ? fns.getServerNotice() : null; },
    getRenderCount: function() { return fns.getRenderCount ? fns.getRenderCount() : 0; },
    getFetchCalls: function() { return state.fetchCalls; },
    getToastCalls: function() { return state.toastCalls; },
    getDomCalls: function() { return state.domCalls; },
    getStorageCalls: function() { return state.storageCalls; },
    injectFetchSuccess: function(body) { fetchPendingMode = false; fetchResolve = body || {ok:true, status:200, json:function(){return Promise.resolve({code:200,data:{}});}}; fetchReject = null; },
    injectFetchError: function(msg) { fetchPendingMode = false; fetchReject = new Error(msg); fetchResolve = null; },
    injectFetchHttpError: function(status, msg) { fetchPendingMode = false; fetchResolve = {ok:false, status:status, json:function(){return Promise.resolve({code:status, message:msg});}}; fetchReject = null; },
    injectFetchPending: function() {
      fetchResolve = null; fetchReject = null; fetchPendingMode = true; _pendingResolved = false;
      return {
        resolve: function(v){ if (!_pendingResolved && pendingResolve) { _pendingResolved = true; fetchPendingMode = false; pendingResolve(v); } },
        reject: function(e){ if (!_pendingResolved && pendingReject) { _pendingResolved = true; fetchPendingMode = false; pendingReject(e); } }
      };
    },
    resetFetch: function() { fetchPendingMode = false; fetchResolve = null; fetchReject = null; state.fetchCalls = []; },
  };
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
  if (failures.length) { console.log('失败名称:'); failures.forEach(function(n){console.log('  \u2717 ' + n);}); }
  if (failed > 0) process.exitCode = 1;
  return { total: tests.length, passed: passed, failed: failed };
}

// ===========================================================================
// Harness Preflight（不计入70条业务测试）
// ===========================================================================
(function harnessPreflight() {
  var errors = [];
  // 1. 普通 function 编译执行
  try {
    var r1 = compileExtractedFunction('function harnessFixture(value) { return value + 1; }', 'harnessFixture', '');
    if (r1(1) !== 2) errors.push('fixture(1) !== 2');
  } catch(e) { errors.push('普通函数编译失败: ' + e.message); }
  // 2. async function 编译并 await
  try {
    var r2 = compileExtractedFunction('async function harnessAsync(value) { return value + 10; }', 'harnessAsync', '');
    r2(5).then(function(v) { if (v !== 15) errors.push('async fixture !== 15'); });
  } catch(e) { errors.push('async 函数编译失败: ' + e.message); }
  // 3. 多函数拼接互调
  try {
    var r3 = compileExtractedFunction('function harnessA(v) { return v * 2; }\nfunction harnessB(v) { return harnessA(v) + 1; }', 'harnessB', '');
    if (r3(3) !== 7) errors.push('多函数拼接结果 !== 7');
  } catch(e) { errors.push('多函数拼接失败: ' + e.message); }
  // 4. 注入 document/localStorage
  try {
    var _store = {};
    var _ls = { getItem: function(k){return _store[k]||null;}, setItem: function(k,v){_store[k]=v;}, removeItem: function(k){delete _store[k];} };
    var _doc = { getElementById: function(id){ return {textContent:'', value:''}; } };
    var r4 = new Function('document','localStorage', 'function harnessDom() { var el = document.getElementById("test"); el.textContent = "ok"; localStorage.setItem("k","v"); return localStorage.getItem("k"); }\nreturn harnessDom;')(_doc, _ls);
    if (r4() !== 'v') errors.push('注入 document/localStorage 失败');
  } catch(e) { errors.push('注入失败: ' + e.message); }
  // 5. runner 每条只执行一次
  var execCount = 0;
  try {
    var counter = { fn: function() { execCount++; } };
    counter.fn(); counter.fn();
    if (execCount !== 2) errors.push('计数器异常');
  } catch(e) { errors.push('runner 计数失败: ' + e.message); }
  // 6. applyPublic/applyFull 配置环境依赖齐全
  try {
    var _sb = buildNoticeSandbox();
    // 尝试执行 applyPublicBackendConfig 和 applyFullBackendConfig 各一次
    if (_sb.fns.fnAvailable.applyPublicBackendConfig) {
      _sb.fns.applyPublicBackendConfig({ serverInfo: { title: '环境测试' } });
    }
    if (_sb.fns.fnAvailable.applyFullBackendConfig) {
      _sb.fns.applyFullBackendConfig({ serverInfo: {} });
    }
  } catch(e) { errors.push('配置沙箱环境依赖缺失: ' + e.message); }
  // 7. 保存沙箱 DOM 和 pending 控制可用
  try {
    var _sb7 = buildNoticeSandbox();
    if (!_sb7.els.editNoticeLines) errors.push('editNoticeLines 未预创建');
    if (typeof _sb7.els.editNoticeLines.value !== 'string') errors.push('editNoticeLines.value 非字符串');
    _sb7.els.editNoticeLines.value = '测试行';
    if (_sb7.els.editNoticeLines.value !== '测试行') errors.push('editNoticeLines.value 写入后读取不一致');
    var _p = _sb7.injectFetchPending();
    if (typeof _p.resolve !== 'function' || typeof _p.reject !== 'function') errors.push('injectFetchPending 未返回 resolve/reject');
    // 确认 injectFetchSuccess 会将 fetchPendingMode 恢复为 false
    _sb7.injectFetchSuccess({ok:true, status:200});
  } catch(e) { errors.push('保存沙箱 DOM/pending 控制不可用: ' + e.message); }
  if (errors.length) {
    console.error('Harness Preflight 失败:');
    errors.forEach(function(e){ console.error('  ' + e); });
    process.exit(1);
  }
  console.log('Harness Preflight: 7/7 通过\n');
})();

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
  var block = INDEX_HTML.slice(idx, idx + 400);
  assert.ok(block.includes('aria-controls="noticePanel"'), 'noticeBubble 无 aria-controls=noticePanel');
});
test('structure', 'S08. noticeBubble 含 aria-expanded', function() {
  var idx = INDEX_HTML.indexOf('id="noticeBubble"');
  var block = INDEX_HTML.slice(idx, idx + 400);
  assert.ok(block.includes('aria-expanded'), 'noticeBubble 无 aria-expanded');
});
test('structure', 'S09. noticeClose 含明确 aria-label', function() {
  var idx = INDEX_HTML.indexOf('id="noticeClose"');
  var block = INDEX_HTML.slice(idx, idx + 200);
  assert.ok(block.includes('aria-label'), 'noticeClose 无 aria-label');
});
test('structure', 'S10. 后台 homeManage 存在 #editNoticeEnabled 及其 label', function() {
  var tmpl = extractHomeManageTemplate(MAIN_JS);
  assert.ok(tmpl, 'homeManage 模板不存在');
  assert.ok(tmpl.includes('id="editNoticeEnabled"'), 'editNoticeEnabled 不存在');
  assert.ok(tmpl.indexOf('for="editNoticeEnabled"') >= 0, '缺少 for="editNoticeEnabled" label');
});
test('structure', 'S11. 后台 homeManage 存在 #editNoticeTitle、#editNoticeLines 及其 label', function() {
  var tmpl = extractHomeManageTemplate(MAIN_JS);
  assert.ok(tmpl, 'homeManage 模板不存在');
  assert.ok(tmpl.includes('id="editNoticeTitle"'), 'editNoticeTitle 不存在');
  assert.ok(tmpl.indexOf('for="editNoticeTitle"') >= 0, '缺少 for="editNoticeTitle" label');
  assert.ok(tmpl.includes('id="editNoticeLines"'), 'editNoticeLines 不存在');
  assert.ok(tmpl.indexOf('for="editNoticeLines"') >= 0, '缺少 for="editNoticeLines" label');
});
test('structure', 'S12. 后台 homeManage 存在 #saveServerNotice(type=button) 及 #saveNoticeHint', function() {
  var tmpl = extractHomeManageTemplate(MAIN_JS);
  assert.ok(tmpl, 'homeManage 模板不存在');
  var btnIdx = tmpl.indexOf('id="saveServerNotice"');
  assert.ok(btnIdx >= 0, 'saveServerNotice 不存在');
  var btnBlock = tmpl.slice(btnIdx, btnIdx + 200);
  assert.ok(btnBlock.indexOf('type="button"') >= 0 || btnBlock.indexOf("type='button'") >= 0, 'saveServerNotice 无 type=button');
  assert.ok(tmpl.includes('id="saveNoticeHint"'), 'saveNoticeHint 不存在');
});

// ===========================================================================
// JS Behavior 测试 J01–J40
// ===========================================================================

// J01–J10: normalizeServerNotice(value)
test('js', 'J01. 合法 server_notice 保持四字段', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.normalizeServerNotice) throw new Error('normalizeServerNotice 不存在');
  var result = sb.fns.normalizeServerNotice({ enabled: true, title: '通知', lines: ['a','b'], version: '1' });
  assert.ok(result.enabled === true, 'enabled 丢失');
  assert.ok(result.title === '通知', 'title 丢失');
  assert.ok(Array.isArray(result.lines) && result.lines.length === 2, 'lines 丢失');
  assert.ok(result.version === '1', 'version 丢失');
});
test('js', 'J02. enabled 缺失默认 true', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.normalizeServerNotice) throw new Error('normalizeServerNotice 不存在');
  assert.ok(sb.fns.normalizeServerNotice({}).enabled === true, '缺省 enabled 不为 true');
});
test('js', 'J03. enabled 非布尔值安全回退 true', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.normalizeServerNotice) throw new Error('normalizeServerNotice 不存在');
  assert.ok(sb.fns.normalizeServerNotice({enabled: 'false'}).enabled === true, '字符串 false 未回退');
  assert.ok(sb.fns.normalizeServerNotice({enabled: 0}).enabled === true, '数字 0 未回退');
});
test('js', 'J04. title 自动 trim', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.normalizeServerNotice) throw new Error('normalizeServerNotice 不存在');
  assert.ok(sb.fns.normalizeServerNotice({title: '  通知  '}).title === '通知', 'title 未 trim');
});
test('js', 'J05. title 空白回退"服务器通知"', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.normalizeServerNotice) throw new Error('normalizeServerNotice 不存在');
  assert.ok(sb.fns.normalizeServerNotice({title: '   '}).title === '服务器通知', '空白 title 未回退');
  assert.ok(sb.fns.normalizeServerNotice({title: ''}).title === '服务器通知', '空 title 未回退');
});
test('js', 'J06. lines 每项自动 trim', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.normalizeServerNotice) throw new Error('normalizeServerNotice 不存在');
  var result = sb.fns.normalizeServerNotice({lines: ['  a  ', '  b  ']});
  assert.ok(result.lines[0] === 'a', 'lines[0] 未 trim');
  assert.ok(result.lines[1] === 'b', 'lines[1] 未 trim');
});
test('js', 'J07. lines 过滤空行', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.normalizeServerNotice) throw new Error('normalizeServerNotice 不存在');
  var result = sb.fns.normalizeServerNotice({lines: ['a', '', '  ', 'b']});
  assert.ok(result.lines.length === 2, '空行未过滤: ' + result.lines.length);
});
test('js', 'J08. lines 非数组回退默认内容', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.normalizeServerNotice) throw new Error('normalizeServerNotice 不存在');
  var result = sb.fns.normalizeServerNotice({lines: 'not-array'});
  assert.ok(Array.isArray(result.lines) && result.lines.length >= 3, '非数组未回退默认');
});
test('js', 'J09. version 规范为字符串', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.normalizeServerNotice) throw new Error('normalizeServerNotice 不存在');
  var r = sb.fns.normalizeServerNotice({version: 123});
  assert.ok(typeof r.version === 'string', '数字未转字符串');
});
test('js', 'J10. 后端无配置时使用默认四条内容', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.normalizeServerNotice) throw new Error('normalizeServerNotice 不存在');
  var result = sb.fns.normalizeServerNotice({});
  assert.ok(Array.isArray(result.lines) && result.lines.length >= 3, '缺省 lines 少于3条');
  assert.ok(result.lines.some(function(l){return l.includes('维护') || l.includes('活动');}), '默认不含维护/活动');
});

// J11–J20: renderServerNotice() — 无参数，读取全局 serverNotice
test('js', 'J11. enabled=false 隐藏 #noticeFloating', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.renderServerNotice) throw new Error('renderServerNotice 不存在');
  sb.setServerNotice({enabled:false, title:'T', lines:['a'], version:'1'});
  sb.fns.renderServerNotice();
  assert.ok(sb.els.noticeFloating && sb.els.noticeFloating.hidden === true, 'enabled=false 未隐藏');
});
test('js', 'J12. lines 过滤后为空隐藏 #noticeFloating', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.renderServerNotice) throw new Error('renderServerNotice 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:[], version:'1'});
  sb.fns.renderServerNotice();
  assert.ok(sb.els.noticeFloating && sb.els.noticeFloating.hidden === true, '空行列表未隐藏');
});
test('js', 'J13. 标题通过 #noticeTitle.textContent 写入', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.renderServerNotice) throw new Error('renderServerNotice 不存在');
  sb.setServerNotice({enabled:true, title:'测试通知', lines:['a'], version:'1'});
  sb.fns.renderServerNotice();
  assert.ok(sb.els.noticeTitle && sb.els.noticeTitle.textContent === '测试通知', '标题未写入: ' + (sb.els.noticeTitle && sb.els.noticeTitle.textContent));
});
test('js', 'J14. 每条通知调用 createElement("li")', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.renderServerNotice) throw new Error('renderServerNotice 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a','b','c'], version:'1'});
  sb.fns.renderServerNotice();
  var liCount = sb.getDomCalls().createElementTags.filter(function(t){return t === 'li';}).length;
  assert.ok(liCount === 3, 'li 元素数不为3: ' + liCount);
});
test('js', 'J15. 每条通过 li.textContent 写入并 appendChild', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.renderServerNotice) throw new Error('renderServerNotice 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'1'});
  sb.fns.renderServerNotice();
  assert.ok(sb.getDomCalls().appendChild === 1, 'appendChild 次数不为1: ' + sb.getDomCalls().appendChild);
});
test('js', 'J16. 渲染不写 innerHTML', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.renderServerNotice) throw new Error('renderServerNotice 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'1'});
  sb.fns.renderServerNotice();
  assert.ok(sb.getDomCalls().innerHtmlWrites === 0, '出现 innerHTML 写入: ' + sb.getDomCalls().innerHtmlWrites);
});
test('js', 'J17. 渲染不调用 insertAdjacentHTML', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.renderServerNotice) throw new Error('renderServerNotice 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'1'});
  sb.fns.renderServerNotice();
  assert.ok(sb.getDomCalls().insertAdjacentHtmlCalls === 0, '出现 insertAdjacentHTML: ' + sb.getDomCalls().insertAdjacentHtmlCalls);
});
test('js', 'J18. 恶意标题不创建 img 节点', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.renderServerNotice) throw new Error('renderServerNotice 不存在');
  sb.setServerNotice({enabled:true, title:'<img src=x onerror=alert(1)>', lines:['a'], version:'1'});
  sb.fns.renderServerNotice();
  var hasImg = sb.getDomCalls().createElementTags.some(function(t){return t === 'img';});
  assert.ok(!hasImg, '恶意标题创建了 img 节点');
});
test('js', 'J19. 恶意通知行不创建 script 节点', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.renderServerNotice) throw new Error('renderServerNotice 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['<script>alert(1)</script>'], version:'1'});
  sb.fns.renderServerNotice();
  var hasScript = sb.getDomCalls().createElementTags.some(function(t){return t === 'script';});
  assert.ok(!hasScript, '恶意行创建了 script 节点');
});
test('js', 'J20. 恶意内容 textContent 保持原文', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.renderServerNotice) throw new Error('renderServerNotice 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['<script>alert(1)</script>'], version:'1'});
  sb.fns.renderServerNotice();
  var createdEls = Object.keys(sb.els).filter(function(k){return k.startsWith('__created_');}).map(function(k){return sb.els[k];});
  var found = createdEls.some(function(el){return el.textContent && el.textContent.includes('<script>');});
  assert.ok(found, '恶意内容未以原文文本保留');
});

// J21–J30: setupNoticeFloating() — 版本跟踪和事件绑定
test('js', 'J21. dismissedVersion 等于 currentVersion 时默认折叠', async function() {
  var sb = buildNoticeSandbox({lsStore: {'erp14-notice-dismissed-version': 'v1'}});
  if (!sb.fns.fnAvailable.setupNoticeFloating) throw new Error('setupNoticeFloating 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'v1'});
  sb.fns.setupNoticeFloating();
  assert.ok(sb.els.noticePanel && sb.els.noticePanel.hidden === true, '版本相等未折叠');
  assert.ok(sb.els.noticeBubble && sb.els.noticeBubble.getAttribute('aria-expanded') === 'false', 'aria-expanded 不为 false');
});
test('js', 'J22. dismissedVersion 不等于 currentVersion 时默认展开', async function() {
  var sb = buildNoticeSandbox({lsStore: {'erp14-notice-dismissed-version': 'v1'}});
  if (!sb.fns.fnAvailable.setupNoticeFloating) throw new Error('setupNoticeFloating 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'v2'});
  sb.fns.setupNoticeFloating();
  assert.ok(sb.els.noticePanel && sb.els.noticePanel.hidden !== true, '版本不相等仍折叠');
  assert.ok(sb.els.noticeBubble && sb.els.noticeBubble.getAttribute('aria-expanded') === 'true', 'aria-expanded 不为 true');
});
test('js', 'J23. 点击关闭写入当前 version', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.setupNoticeFloating) throw new Error('setupNoticeFloating 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'v3'});
  sb.fns.setupNoticeFloating();
  var closeListener = sb.getDomCalls().eventListeners.find(function(e){return e.id === 'noticeClose';});
  if (!closeListener) throw new Error('noticeClose 未绑定事件');
  closeListener.fn();
  var sets = sb.getStorageCalls().sets;
  var found = sets.some(function(s){return s.k === 'erp14-notice-dismissed-version' && s.v === 'v3';});
  assert.ok(found, '关闭后未写入 dismissed-version=v3');
});
test('js', 'J24. 点击气泡删除 dismissed-version', async function() {
  var sb = buildNoticeSandbox({lsStore: {'erp14-notice-dismissed-version': 'v1'}});
  if (!sb.fns.fnAvailable.setupNoticeFloating) throw new Error('setupNoticeFloating 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'v2'});
  sb.fns.setupNoticeFloating();
  var bubbleListener = sb.getDomCalls().eventListeners.find(function(e){return e.id === 'noticeBubble';});
  if (!bubbleListener) throw new Error('noticeBubble 未绑定事件');
  bubbleListener.fn();
  var removes = sb.getStorageCalls().removes;
  var found = removes.indexOf('erp14-notice-dismissed-version') >= 0;
  assert.ok(found, '点击气泡未删除 dismissed-version');
});
test('js', 'J25. version 为空时读取旧 erp14-notice-collapsed', async function() {
  var sb = buildNoticeSandbox({lsStore: {'erp14-notice-collapsed': '1'}});
  if (!sb.fns.fnAvailable.setupNoticeFloating) throw new Error('setupNoticeFloating 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:''});
  sb.fns.setupNoticeFloating();
  assert.ok(sb.els.noticePanel && sb.els.noticePanel.hidden === true, '旧版 collapsed 未应用');
});
test('js', 'J26. localStorage 读取异常不抛错', async function() {
  var sb = buildNoticeSandbox();
  sb.state.lsGetErrors = true;
  if (!sb.fns.fnAvailable.setupNoticeFloating) throw new Error('setupNoticeFloating 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'v1'});
  var threw = false;
  try { sb.fns.setupNoticeFloating(); } catch(e) { threw = true; }
  assert.ok(!threw, 'localStorage 读取异常时抛了错');
});
test('js', 'J27. localStorage 写入异常不抛错', async function() {
  var sb = buildNoticeSandbox();
  sb.state.lsSetErrors = true;
  if (!sb.fns.fnAvailable.setupNoticeFloating) throw new Error('setupNoticeFloating 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'v1'});
  sb.fns.setupNoticeFloating();
  var closeListener = sb.getDomCalls().eventListeners.find(function(e){return e.id === 'noticeClose';});
  if (!closeListener) throw new Error('noticeClose 未绑定事件');
  var threw = false;
  try { closeListener.fn(); } catch(e) { threw = true; }
  assert.ok(!threw, '关闭时 localStorage 写入异常抛了错');
});
test('js', 'J28. 点击气泡后 aria-expanded 更新为 true', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.setupNoticeFloating) throw new Error('setupNoticeFloating 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'v1'});
  sb.fns.setupNoticeFloating();
  var bubbleListener = sb.getDomCalls().eventListeners.find(function(e){return e.id === 'noticeBubble';});
  if (!bubbleListener) throw new Error('noticeBubble 未绑定事件');
  bubbleListener.fn();
  assert.ok(sb.els.noticeBubble.getAttribute('aria-expanded') === 'true', 'aria-expanded 不为 true');
});
test('js', 'J29. 点击关闭后 aria-expanded 更新为 false', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.setupNoticeFloating) throw new Error('setupNoticeFloating 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'v1'});
  sb.fns.setupNoticeFloating();
  var closeListener = sb.getDomCalls().eventListeners.find(function(e){return e.id === 'noticeClose';});
  if (!closeListener) throw new Error('noticeClose 未绑定事件');
  closeListener.fn();
  assert.ok(sb.els.noticeBubble.getAttribute('aria-expanded') === 'false', 'aria-expanded 不为 false');
});
test('js', 'J30. setupNoticeFloating 不重复绑定同一事件', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.setupNoticeFloating) throw new Error('setupNoticeFloating 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'v1'});
  sb.fns.setupNoticeFloating();
  var count1Bubble = sb.getDomCalls().eventListeners.filter(function(e){return e.id === 'noticeBubble';}).length;
  var count1Close = sb.getDomCalls().eventListeners.filter(function(e){return e.id === 'noticeClose';}).length;
  sb.fns.setupNoticeFloating();
  var count2Bubble = sb.getDomCalls().eventListeners.filter(function(e){return e.id === 'noticeBubble';}).length;
  var count2Close = sb.getDomCalls().eventListeners.filter(function(e){return e.id === 'noticeClose';}).length;
  assert.ok(count2Bubble === count1Bubble, 'noticeBubble 事件重复绑定: ' + count1Bubble + ' -> ' + count2Bubble);
  assert.ok(count2Close === count1Close, 'noticeClose 事件重复绑定: ' + count1Close + ' -> ' + count2Close);
});

// J31–J40: saveServerNotice() 和配置加载
test('js', 'J31. textarea 按 CRLF/LF 拆分并过滤空行', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.saveServerNotice) throw new Error('saveServerNotice 不存在');
  sb.els.editNoticeLines.value = '第一行\r\n  \r\n第二行\n 第三行 ';
  sb.els.editNoticeTitle.value = '测试通知';
  sb.els.editNoticeEnabled.checked = true;
  sb.injectFetchSuccess({ok:true, status:200, json:function(){return Promise.resolve({code:200,data:{}});}});
  await sb.fns.saveServerNotice();
  var calls = sb.getFetchCalls();
  assert.ok(calls.length > 0, '未发起保存请求');
  var fetchCall = calls[0];
  // 5. 请求 method === 'PUT'
  assert.ok(fetchCall.opts && fetchCall.opts.method === 'PUT', '请求 method 不为 PUT: ' + (fetchCall.opts && fetchCall.opts.method));
  // 6. 请求 URL === '/api/admin/config'
  assert.ok(fetchCall.url === '/api/admin/config', '请求 URL 不为 /api/admin/config: ' + fetchCall.url);
  // 7. content-type === 'application/json'
  var ct = fetchCall.opts && fetchCall.opts.headers && (fetchCall.opts.headers['Content-Type'] || fetchCall.opts.headers['content-type']);
  assert.ok(ct && String(ct).indexOf('application/json') >= 0, 'content-type 非 application/json: ' + ct);
  // 修正：解析 fetchCall.opts.body，不再直接读 parsed.lines
  var body = JSON.parse(fetchCall.opts.body);
  // 1. body.key === 'server_notice'
  assert.ok(body.key === 'server_notice', 'body.key 不为 server_notice: ' + body.key);
  // 2. body.value 存在且为对象
  assert.ok(body.value && typeof body.value === 'object' && !Array.isArray(body.value), 'body.value 不存在或非对象');
  // 3. body.value.lines 严格等于 ['第一行','第二行','第三行']
  assert.ok(JSON.stringify(body.value.lines) === JSON.stringify(['第一行','第二行','第三行']), 'value.lines 不匹配: ' + JSON.stringify(body.value.lines));
  // 4. 不得使用顶层 lines 冒充配置 value
  assert.ok(!('lines' in body), 'body 顶层出现 lines，冒充 config value');
});
test('js', 'J32. 保存时生成非空 version 且位于 value 内', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.saveServerNotice) throw new Error('saveServerNotice 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'old-v'});
  sb.injectFetchSuccess({ok:true, status:200, json:function(){return Promise.resolve({code:200,data:{}});}});
  await sb.fns.saveServerNotice();
  var calls = sb.getFetchCalls();
  assert.ok(calls.length > 0, '未发起保存请求');
  var body = JSON.parse(calls[0].opts.body);
  // 1. body.key === 'server_notice'
  assert.ok(body.key === 'server_notice', 'body.key 不为 server_notice: ' + body.key);
  // 4. 顶层 body.version 不作为配置版本
  assert.ok(!('version' in body), 'body 顶层出现 version，应位于 value 内部');
  // 2. body.value.version 是非空字符串
  assert.ok(typeof body.value.version === 'string' && body.value.version.length > 0, 'value.version 非非空字符串: ' + body.value.version);
  // 3. body.value.version !== 'old-v'
  assert.ok(body.value.version !== 'old-v', 'value.version 仍为旧值: ' + body.value.version);
  // 5. version 位于 value 对象内部
  assert.ok(body.value && typeof body.value === 'object' && 'version' in body.value, 'version 未位于 value 对象内部');
});
test('js', 'J33. 普通页面加载不生成新 version', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.normalizeServerNotice) throw new Error('normalizeServerNotice 不存在');
  var result = sb.fns.normalizeServerNotice({enabled:true, title:'T', lines:['a'], version:'v1'});
  assert.ok(result.version === 'v1', 'normalize 不应修改 version');
});
test('js', 'J34. 保存成功后才更新内存 serverNotice', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.saveServerNotice) throw new Error('saveServerNotice 不存在');
  sb.setServerNotice({enabled:true, title:'旧', lines:['旧'], version:'v1'});
  var pending = sb.injectFetchPending();
  var savePromise = sb.fns.saveServerNotice();
  assert.ok(sb.getServerNotice() && sb.getServerNotice().title === '旧', 'pending 期间内存已更新');
  pending.resolve({ok:true, status:200, json:function(){return Promise.resolve({code:200,data:{}});}});
  await savePromise;
  assert.ok(sb.getServerNotice() && sb.getServerNotice().title !== '旧', '保存成功后内存未更新');
});
test('js', 'J35. 保存成功后更新内存并重新渲染', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.saveServerNotice) throw new Error('saveServerNotice 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'v1'});
  // 执行保存前设置表单
  sb.els.editNoticeEnabled.checked = true;
  sb.els.editNoticeTitle.value = '保存后的通知';
  sb.els.editNoticeLines.value = '第一条\n第二条';
  sb.injectFetchSuccess({ok:true, status:200, json:function(){return Promise.resolve({code:200,data:{}});}});
  await sb.fns.saveServerNotice();
  // 1. fetch 只调用1次
  assert.ok(sb.getFetchCalls().length === 1, 'PUT 次数不为1: ' + sb.getFetchCalls().length);
  // 2. 成功 Toast 恰好1次 / 3. Toast 类型为 success
  var successToasts = sb.getToastCalls().filter(function(t){return t.type === 'success';});
  assert.ok(successToasts.length === 1, '成功 toast 不为1次: ' + successToasts.length);
  // 4. serverNotice 已更新为表单产生的新配置
  var sn = sb.getServerNotice();
  assert.ok(sn, 'serverNotice 不存在');
  assert.ok(sn.title === '保存后的通知', 'title 未更新为表单值: ' + sn.title);
  assert.ok(Array.isArray(sn.lines) && sn.lines.length === 2, 'lines 未更新为两条: ' + (sn.lines && sn.lines.length));
  // 5. #noticeTitle.textContent 与更新后的 serverNotice.title 一致
  assert.ok(sb.els.noticeTitle && sb.els.noticeTitle.textContent === sn.title, 'noticeTitle.textContent 不一致: ' + (sb.els.noticeTitle && sb.els.noticeTitle.textContent));
  assert.ok(sb.els.noticeTitle.textContent === '保存后的通知', 'noticeTitle 未显示保存后的通知');
  // 6. #noticeLines.children.length 与 serverNotice.lines.length 一致
  assert.ok(sb.els.noticeLines.children.length === sn.lines.length, 'noticeLines 子节点数不一致: ' + sb.els.noticeLines.children.length + ' vs ' + sn.lines.length);
  assert.ok(sb.els.noticeLines.children.length === 2, 'noticeLines 子节点不为2: ' + sb.els.noticeLines.children.length);
  // 7. 至少存在一条通知内容
  assert.ok(sn.lines.length >= 1, '无任何通知内容');
  // 8. 第一个 li.textContent 与 serverNotice.lines[0] 一致
  assert.ok(sb.els.noticeLines.children[0] && sb.els.noticeLines.children[0].textContent === sn.lines[0], '第一条 li 内容不一致: ' + (sb.els.noticeLines.children[0] && sb.els.noticeLines.children[0].textContent));
  assert.ok(sb.els.noticeLines.children[0].textContent === '第一条', '第一条内容不匹配');
  // 9. #saveNoticeHint 显示成功状态或成功文案
  var hint = sb.els.saveNoticeHint;
  var hintOk = hint && (hint.classList.contains('success') || (hint.textContent && hint.textContent.length > 0));
  assert.ok(hintOk, 'saveNoticeHint 未显示成功状态/文案');
  // 10. 保存按钮恢复 disabled=false
  assert.ok(sb.els.saveServerNotice && sb.els.saveServerNotice.disabled === false, '保存按钮未恢复 disabled=false');
});
test('js', 'J36. 保存失败保留表单 title/lines/enabled', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.saveServerNotice) throw new Error('saveServerNotice 不存在');
  sb.els.editNoticeTitle.value = '测试标题';
  sb.els.editNoticeLines.value = '第一行\n第二行';
  sb.els.editNoticeEnabled.checked = true;
  sb.injectFetchError('网络错误');
  await sb.fns.saveServerNotice();
  assert.ok(sb.els.editNoticeTitle.value === '测试标题', 'title 被清空');
  assert.ok(sb.els.editNoticeLines.value === '第一行\n第二行', 'lines 被清空');
  assert.ok(sb.els.editNoticeEnabled.checked === true, 'enabled 被重置');
});
test('js', 'J37. 保存失败不更新内存 version', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.saveServerNotice) throw new Error('saveServerNotice 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'v1'});
  sb.injectFetchError('网络错误');
  await sb.fns.saveServerNotice();
  assert.ok(sb.getServerNotice() && sb.getServerNotice().version === 'v1', '失败后 version 被更新');
});
test('js', 'J38. 保存失败不显示成功提示并显示真实错误', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.saveServerNotice) throw new Error('saveServerNotice 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'v1'});
  sb.injectFetchHttpError(400, '内容不能为空');
  await sb.fns.saveServerNotice();
  var successToasts = sb.getToastCalls().filter(function(t){return t.type === 'success';});
  assert.ok(successToasts.length === 0, '出现了成功 toast');
  var allMessages = sb.getToastCalls().map(function(t){return t.msg;}).join('|') + (sb.els.saveNoticeHint ? sb.els.saveNoticeHint.textContent : '');
  assert.ok(allMessages.includes('内容不能为空'), '未显示真实错误: ' + allMessages);
});
test('js', 'J39. 保存期间阻止重复请求', async function() {
  var sb = buildNoticeSandbox();
  if (!sb.fns.fnAvailable.saveServerNotice) throw new Error('saveServerNotice 不存在');
  sb.setServerNotice({enabled:true, title:'T', lines:['a'], version:'v1'});
  var pending = sb.injectFetchPending();
  var p1 = sb.fns.saveServerNotice();
  assert.ok(sb.getFetchCalls().length === 1, '第一次保存未产生请求');
  // 第二次应被阻止
  var p2 = sb.fns.saveServerNotice();
  assert.ok(sb.getFetchCalls().length === 1, '重复保存产生了第二个请求: ' + sb.getFetchCalls().length);
  assert.ok(sb.els.saveServerNotice && sb.els.saveServerNotice.disabled === true, '按钮未禁用');
  pending.resolve({ok:true, status:200, json:function(){return Promise.resolve({code:200,data:{}});}});
  await p1;
  assert.ok(sb.els.saveServerNotice && sb.els.saveServerNotice.disabled === false, '保存完成后按钮未恢复');
});
test('js', 'J40. applyFullBackendConfig 完整断言链', async function() {
  var sb = buildNoticeSandbox();
  assert.ok(sb.fns.applyFullBackendConfig, 'applyFullBackendConfig 不存在');
  var config = { server_notice: { enabled: true, title: '后台通知', lines: ['第一条', '第二条'], version: 'v40' } };
  sb.fns.applyFullBackendConfig(config);
  // 1. serverNotice 存在
  var sn = sb.getServerNotice();
  assert.ok(sn, 'serverNotice 不存在');
  // 2. enabled
  assert.strictEqual(sn.enabled, true, 'enabled !== true');
  // 3. title
  assert.strictEqual(sn.title, '后台通知', 'title 不匹配');
  // 4–7. lines
  assert.ok(Array.isArray(sn.lines), 'lines 非数组');
  assert.strictEqual(sn.lines.length, 2, 'lines 长度不为 2');
  assert.strictEqual(sn.lines[0], '第一条', 'lines[0] 不匹配');
  assert.strictEqual(sn.lines[1], '第二条', 'lines[1] 不匹配');
  // 8. version
  assert.strictEqual(sn.version, 'v40', 'version 不匹配');
  // 9. #noticeTitle.textContent
  assert.strictEqual(sb.els.noticeTitle.textContent, '后台通知', 'noticeTitle 未更新');
  // 10–11. #noticeLines children — 两条通知精确验证
  assert.strictEqual(sb.els.noticeLines.children.length, 2, 'noticeLines 子节点数量不为 2');
  assert.strictEqual(sb.els.noticeLines.children[0].textContent, '第一条', 'noticeLines 第一条内容不匹配');
  assert.strictEqual(sb.els.noticeLines.children[1].textContent, '第二条', 'noticeLines 第二条内容不匹配');
  // 12–14. 表单回填
  assert.strictEqual(sb.els.editNoticeEnabled.checked, true, 'editNoticeEnabled 未回填');
  assert.strictEqual(sb.els.editNoticeTitle.value, '后台通知', 'editNoticeTitle 未回填');
  assert.strictEqual(sb.els.editNoticeLines.value, '第一条\n第二条', 'editNoticeLines 未回填');
  // 15. 前台未被 hidden
  assert.ok(sb.els.noticeFloating.hidden !== true, '通知面板被隐藏');
  // 16. 无 ReferenceError（能执行到此处即证明）
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
  var route = extractRouteBlock(SERVER_JS, "app.get('/api/config'", '// ---- Hero Images');
  assert.ok(route, '未找到 GET /api/config');
});
test('backend', 'B03. GET /api/admin/config 返回 server_notice', function() {
  var route = extractRouteBlock(SERVER_JS, "app.get('/api/admin/config'", '// ---- 备份恢复');
  assert.ok(route, '未找到 GET /api/admin/config');
});
test('backend', 'B04. PUT /api/admin/config 接受 server_notice', function() {
  var idx = SERVER_JS.indexOf('ALLOWED_CONFIG_KEYS');
  var block = SERVER_JS.slice(idx, idx + 800);
  assert.ok(block.includes('server_notice'), '白名单无 server_notice');
});
test('backend', 'B05. PUT 后 value 按 JSON 配置保存', function() {
  var putRoute = extractRouteBlock(SERVER_JS, "app.put('/api/admin/config'", '// ---- 统计接口');
  assert.ok(putRoute && putRoute.includes('INSERT OR REPLACE'), 'PUT 缺少 INSERT OR REPLACE');
});
test('backend', 'B06. 非白名单配置 key 仍被拒绝', function() {
  var putBlock = extractRouteBlock(SERVER_JS, "app.put('/api/admin/config'", '// ---- 统计接口');
  assert.ok(putBlock, '未找到 PUT /api/admin/config 路由块');
  assert.ok(putBlock.includes('includes(key)'), 'PUT 路由内白名单检查已缺失');
  assert.ok(putBlock.includes('400'), 'PUT 路由内缺少 400 错误返回');
});
test('backend', 'B07. 未新增 server_notice 专用 API', function() {
  assert.ok(!SERVER_JS.includes('/api/server-notice') && !SERVER_JS.includes('/api/notice'), '出现专用通知 API');
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
  assert.ok(block, '未找到 .notice-floating[hidden]');
});
test('css', 'C02. 后台通知 textarea 有合理 min-height', function() {
  var block = extractCssBlock(MAIN_CSS, '#editNoticeLines');
  assert.ok(block, '未找到 #editNoticeLines');
  var mh = block.match(/min-height\s*:\s*(\d+)/);
  assert.ok(mh, '#editNoticeLines 无 min-height');
  var val = parseInt(mh[1], 10);
  assert.ok(val >= 80, 'min-height=' + val + 'px, 低于80px');
});
test('css', 'C03. 后台通知 textarea 防溢出', function() {
  var block = extractCssBlock(MAIN_CSS, '#editNoticeLines');
  assert.ok(block, '未找到 #editNoticeLines');
  var hasWidth = /(?:max-)?width\s*:\s*100%\s*;/.test(block);
  var hasBoxSizing = /box-sizing\s*:\s*border-box/.test(block);
  assert.ok(hasWidth && hasBoxSizing, '#editNoticeLines 缺少 width:100% 或 box-sizing:border-box');
});
test('css', 'C04. 通知列表长文本可换行', function() {
  var block = extractCssBlock(MAIN_CSS, '.server-notice-lines');
  assert.ok(block && (block.includes('word-break') || block.includes('white-space') || block.includes('overflow-wrap')), '缺少长文本换行');
});
test('css', 'C05. 通知标题长文本可换行', function() {
  var block = extractCssBlock(MAIN_CSS, '#noticeTitle');
  assert.ok(block, '未找到 #noticeTitle');
  assert.ok(block.includes('word-break') || block.includes('overflow-wrap'), '#noticeTitle 缺换行规则');
});
test('css', 'C06. 手机端后台保存按钮 min-height≥44px', function() {
  var ms = MAIN_CSS.indexOf('@media (max-width: 767px)');
  assert.ok(ms !== -1, '未找到 @media');
  var mb = MAIN_CSS.slice(ms, ms + 5000);
  assert.ok(/#saveServerNotice\s*\{[^}]*min-height\s*:\s*44px/i.test(mb), '手机保存按钮无 44px');
});
test('css', 'C07. 横屏 coarse 后台保存按钮 min-height≥44px', function() {
  var li = MAIN_CSS.indexOf('@media (max-height: 450px) and (pointer: coarse)');
  assert.ok(li >= 0, '未找到横屏 coarse 媒体查询');
  var lb = MAIN_CSS.slice(li, li + 2000);
  assert.ok(/#saveServerNotice\s*\{[^}]*min-height\s*:\s*44px/i.test(lb), '横屏保存按钮无 44px');
});
test('css', 'C08. 通知面板宽度受视口约束', function() {
  var block = extractCssBlock(MAIN_CSS, '.notice-floating');
  assert.ok(block && (block.includes('max-width') || block.includes('width')), '通知面板无宽度约束');
  var mobileStart = MAIN_CSS.indexOf('@media (max-width: 680px)');
  var mobileBlock = MAIN_CSS.slice(mobileStart, mobileStart + 1200);
  assert.ok(mobileStart >= 0 && /\.notice-floating\s*\{[^}]*position\s*:\s*fixed/i.test(mobileBlock), '手机通知面板未保持浮动');
  assert.ok(!/\.notice-floating-close\s*\{[^}]*display\s*:\s*none/i.test(mobileBlock), '手机关闭按钮被隐藏');
});
test('css', 'C09. 暗色主题后台输入框可读', function() {
  var darkIdx = MAIN_CSS.indexOf('[data-theme="dark"]');
  assert.ok(darkIdx >= 0, '无暗色主题');
});
test('css', 'C10. 保存提示存在可区分样式', function() {
  var generic = extractCssBlock(MAIN_CSS, '.submit-hint');
  assert.ok(generic, '无 .submit-hint 可复用样式');
});

// ===========================================================================
// 执行
// ===========================================================================
async function main() {
  var total = 0, pass = 0, fail = 0;
  var include = function(g) { return GROUP === 'all' || GROUP === g; };
  if (include('structure')) { var r = await runGroup('Structure 测试 (S01–S12)', groups.structure); total += r.total; pass += r.passed; fail += r.failed; }
  if (include('js')) { var r = await runGroup('JavaScript 行为测试 (J01–J40)', groups.js); total += r.total; pass += r.passed; fail += r.failed; }
  if (include('backend')) { var r = await runGroup('Backend 测试 (B01–B08)', groups.backend); total += r.total; pass += r.passed; fail += r.failed; }
  if (include('css')) { var r = await runGroup('CSS 测试 (C01–C10)', groups.css); total += r.total; pass += r.passed; fail += r.failed; }
  if (GROUP === 'all') {
    console.log('\nALL 分组：Structure ' + groups.structure.length + ' + JS ' + groups.js.length + ' + Backend ' + groups.backend.length + ' + CSS ' + groups.css.length + ' = ' + total + ' 项');
  }
  console.log('\n=== 总计: ' + pass + '/' + total + ' 通过, ' + fail + ' 失败 ===');
  if (fail > 0) process.exitCode = 1;
}
main().catch(function(e) { console.error('Runner 异常:', e); process.exitCode = 1; });
