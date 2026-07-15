#!/usr/bin/env node
// 玩家建议前台详情专项测试（Task 1 返工版）
// 纯 Node fs + assert，无外部依赖。
// 支持 --group=js / --group=css / --group=all（默认 all）
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const MAIN_JS = fs.readFileSync(path.join(__dirname, '..', 'frontend/js/main.js'), 'utf8');
const MAIN_CSS = fs.readFileSync(path.join(__dirname, '..', 'frontend/css/main.css'), 'utf8');

// ---- 分组解析 ----
const GROUP = (process.argv.find(a => a.startsWith('--group=')) || '--group=all').slice(8);
if (!['js', 'css', 'all'].includes(GROUP)) {
  console.error('非法 group: ' + GROUP + '，仅允许 js / css / all');
  process.exit(1);
}

// ---- 测试注册 ----
const jsTests = [];
const cssTests = [];
function test(group, name, fn) {
  const entry = { name, fn };
  if (group === 'js' || group === 'all') jsTests.push(entry);
  if (group === 'css' || group === 'all') cssTests.push(entry);
}

// ---- 提取函数（兼容 async + 默认参数） ----
function extractFunction(src, name) {
  const marker = 'function ' + name + '(';
  let start = src.indexOf(marker);
  if (start === -1) return null;
  if (start >= 6 && src.slice(start - 6, start) === 'async ') start -= 6;
  let i = src.indexOf('(', start);
  if (i === -1) return null;
  let depth = 0, inStr = null, escape = false;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) { if (escape) { escape = false; continue; } if (ch === '\\') { escape = true; continue; } if (ch === inStr) { inStr = null; continue; } continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '(') depth++;
    if (ch === ')') { depth--; if (depth === 0) { i++; break; } }
  }
  const fnOpen = src.indexOf('{', i);
  if (fnOpen === -1) return null;
  depth = 0; inStr = null; escape = false;
  for (let j = fnOpen; j < src.length; j++) {
    const ch = src[j];
    if (inStr) { if (escape) { escape = false; continue; } if (ch === '\\') { escape = true; continue; } if (ch === inStr) { inStr = null; continue; } continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  return null;
}

// 提取变量声明
function extractVariableAssignment(src, varName) {
  const re = new RegExp('(?:let|var|const)\\s+' + varName + '\\s*=\\s*([^;]+);');
  const m = re.exec(src);
  return m ? m[0] : null;
}

// escapeHtml/escapeAttr 因函数体含正则（/<>&"'/g 含引号），extractFunction 无法正确解析。
// 提供等价实现内联到沙箱。
const ESCAPE_HTML_SRC = `
function escapeHtml(value) {
  if (!value && value !== 0) return '';
  return String(value).replace(/[&<>"']/g, function(c) {
    if (c === '&') return '&amp;'; if (c === '<') return '&lt;'; if (c === '>') return '&gt;';
    if (c === '"') return '&quot;'; if (c === "'") return '&#39;'; return c;
  });
}
function escapeAttr(value) { return escapeHtml(value); }
`;

// ---- 提取真实依赖的公共辅助 ----
const THELPERS = ['getPlayerVote','normalizeRequestStatus','requestLabel',
  'normalizeRequestCategory','requestCategoryLabel','getRequestId','getCurrentVoterName'];
const EXTRACTED_HELPERS = THELPERS.map(name => ({ name, src: extractFunction(MAIN_JS, name) }));

function helperSource() {
  return EXTRACTED_HELPERS.filter(h => h.src).map(h => h.src).join('\n');
}

// ---- 精确定位事件处理器函数体（跳过诱饵引用） ----
function extractHandlerBody(src, elementId, eventName, useQuerySelectorAll) {
  if (useQuerySelectorAll) {
    var pattern = "document.querySelectorAll('#" + elementId + " button').forEach";
    var idx = src.indexOf(pattern);
    if (idx === -1) return null;
    var arrowIdx = src.indexOf('=>', idx);
    if (arrowIdx === -1 || arrowIdx > idx + 300) return null;
    var bodyStart = src.indexOf('{', arrowIdx);
    if (bodyStart === -1) return null;
    var depth = 0;
    for (var i = bodyStart; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(bodyStart, i + 1); }
    }
    return null;
  }
  var pattern = "document.getElementById('" + elementId + "').addEventListener('" + eventName + "',";
  var idx = src.indexOf(pattern);
  if (idx === -1) return null;
  var funcStart = idx + pattern.length;
  if (src[funcStart] === '{') {
    // Arrow function: () => { ... }
    var bodyStart = funcStart;
    var depth = 0;
    for (var i = bodyStart; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(bodyStart, i + 1); }
    }
    return null;
  }
  // function() { ... }
  var fnIdx = src.indexOf('function', funcStart);
  if (fnIdx === -1 || fnIdx > funcStart + 30) return null;
  var bodyStart = src.indexOf('{', fnIdx);
  if (bodyStart === -1) return null;
  var depth = 0;
  for (var i = bodyStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(bodyStart, i + 1); }
  }
  return null;
}

// ---- 精确定位自检（不增加 test 数） ----
(function selfCheckHandlerLocator() {
  var synthSrc =
    "var q = document.getElementById('requestSearch').value.trim();\n" +
    "document.getElementById('requestSearch').addEventListener('input', function() { resetExpandedRequest(); renderRequests(); });";
  var body = extractHandlerBody(synthSrc, 'requestSearch', 'input', false);
  if (!body) throw new Error('自检失败 extractHandlerBody(gid) 返回 null');
  if (!body.includes('resetExpandedRequest')) throw new Error('自检失败 gid body 不含 resetExpandedRequest');
  if (body.includes('trim')) throw new Error('自检失败 gid body 混入诱饵');
  // querySelectorAll 模式自检
  var synthSrc2 =
    "var x = document.querySelectorAll('#requestTabs button');\n" +
    "document.querySelectorAll('#requestTabs button').forEach(btn => { resetExpandedRequest(); renderRequests(); });";
  var body2 = extractHandlerBody(synthSrc2, 'requestTabs', 'click', true);
  if (!body2) throw new Error('自检失败 extractHandlerBody(qsa) 返回 null');
  if (!body2.includes('resetExpandedRequest')) throw new Error('自检失败 qsa body 不含 resetExpandedRequest');
  if (body2.includes('querySelectorAll')) throw new Error('自检失败 qsa body 混入诱饵');
})();

// 生成 document mock
function docMock(activeStatus) {
  var st = activeStatus || 'pending';
  return `const document = {
    getElementById: (id) => {
      if (id === 'requestGrid') {
        const b = { _html: '' };
        Object.defineProperty(b, 'innerHTML', { get(){return this._html;}, set(v){this._html=v; captured.requestGrid=v;} });
        return b;
      }
      if (id === 'requestTabs' || id === 'requestCategoryFilters' || id === 'requestSearch') {
        return { innerHTML:'', value:'', textContent:'', classList:{add(){},remove(){}}, setAttribute(){}, addEventListener(){},
          querySelector(){return null}, querySelectorAll(){return []} };
      }
      return { innerHTML:'', value:'', textContent:'', classList:{add(){},remove(){}}, setAttribute(){}, addEventListener(){},
        querySelector(){return null}, querySelectorAll(){return []} };
    },
    querySelector: (sel) => {
      if (sel === '#requestTabs button.active') return { dataset: { status: '${st}' } };
      if (sel === '#requestCategoryFilters button.active') return null;
      return null;
    },
    querySelectorAll: () => []
  };
  const location = { hash: '' };`;
}

function sandboxPrelude(seed, getRequestIdOverride, activeStatus) {
  const gid = getRequestIdOverride
    ? `function getRequestId(item, index) { return item && item.id === 'BROKEN' ? '' : (item.id || 'id_' + index); }`
    : (EXTRACTED_HELPERS.find(h => h.name === 'getRequestId')?.src || 'function getRequestId(item, index) { return item.id || "id_" + index; }');
  return `
    let requests = ${JSON.stringify(seed.requests)};
    const captured = { requestGrid: '' };
    function applyIcons() {}
    const requestVotes = {};
    const activePlayerName = "测试玩家";
    ${gid}
    ${ESCAPE_HTML_SRC}
    ${EXTRACTED_HELPERS.filter(h => h.name !== 'getRequestId').map(h => h.src).join('\n')}
    ${docMock(activeStatus)}
  `;
}

// ---- 构建基线沙箱（只含现有函数，不含新详情函数） ----
function buildBaselineSandbox(seed, activeStatus) {
  const renderSrc = extractFunction(MAIN_JS, 'renderRequests');
  const decl = extractVariableAssignment(MAIN_JS, 'expandedRequestId');
  const expDecl = decl || 'let expandedRequestId = null;';
  const wrapper = `
    ${sandboxPrelude(seed, null, activeStatus)}
    ${expDecl}
    ${renderSrc || 'function renderRequests() { captured.requestGrid = "<div>no-render</div>"; }'}
    return {
      get grid(){ return captured.requestGrid; },
      render: () => { try { renderRequests(); } catch(e) { captured.requestGrid = '__RENDER_ERROR__:' + e.message; throw e; } return captured.requestGrid; }
    };
  `;
  return new Function('Date', 'Math', 'JSON', 'console', wrapper)(Date, Math, JSON, console);
}

// ---- 构建详情功能沙箱 ----
function buildDetailSandbox(seed, getRequestIdOverride, activeStatus) {
  const renderSrc = extractFunction(MAIN_JS, 'renderRequests');
  const detailFns = ['getRequestAdminDetail','buildRequestDetail','resetExpandedRequest','toggleRequestDetail']
    .map(name => ({ name, src: extractFunction(MAIN_JS, name) }));
  const wrapper = `
    ${sandboxPrelude(seed, getRequestIdOverride, activeStatus)}
    let expandedRequestId = null;
    ${renderSrc || 'function renderRequests() { captured.requestGrid = "<div>no-render</div>"; }'}
    ${detailFns.map(h => h.src || '// ' + h.name + ' 不存在').join('\n')}
    return {
      get expandedRequestId(){ return expandedRequestId; },
      set expandedRequestId(v){ expandedRequestId = v; },
      get grid(){ return captured.requestGrid; },
      render: () => { try { renderRequests(); } catch(e) { captured.requestGrid = '__RENDER_ERROR__:' + e.message; throw e; } return captured.requestGrid; },
      toggle: (id) => typeof toggleRequestDetail !== 'undefined' ? toggleRequestDetail(id) : (()=>{ throw new Error('toggleRequestDetail 不存在'); })(),
      reset: () => typeof resetExpandedRequest !== 'undefined' ? resetExpandedRequest() : (()=>{ throw new Error('resetExpandedRequest 不存在'); })(),
      adminDetail: (item, status) => typeof getRequestAdminDetail !== 'undefined' ? getRequestAdminDetail(item, status) : (()=>{ throw new Error('getRequestAdminDetail 不存在'); })(),
      build: (item, id) => typeof buildRequestDetail !== 'undefined' ? buildRequestDetail(item, id) : 'no-buildRequestDetail'
    };
  `;
  return new Function('Date', 'Math', 'JSON', 'console', wrapper)(Date, Math, JSON, console);
}

// ---- 沙箱自检（不增加 test() 计数） ----
(function selfCheck() {
  // activeStatus=done 时 mock 返回 done
  var dm = new Function(docMock('done') + ' return document;')();
  var tabBtn = dm.querySelector('#requestTabs button.active');
  var tabStatus = tabBtn ? tabBtn.dataset.status : 'MISSING';
  if (tabStatus !== 'done') throw new Error('沙箱自检失败：docMock(done) 返回 ' + tabStatus);
  // 默认 activeStatus=pending
  dm = new Function(docMock() + ' return document;')();
  tabBtn = dm.querySelector('#requestTabs button.active');
  tabStatus = tabBtn ? tabBtn.dataset.status : 'MISSING';
  if (tabStatus !== 'pending') throw new Error('沙箱自检失败：docMock() 默认返回 ' + tabStatus);
  // baseline 注入 expandedRequestId 不抛 ReferenceError
  var decl = extractVariableAssignment(MAIN_JS, 'expandedRequestId');
  var es = new Function('"use strict"; ' + (decl || 'let expandedRequestId = null;') + ' return expandedRequestId;')();
  if (es !== null) throw new Error('沙箱自检失败：expandedRequestId 初始值不是 null');
})();

// ============ A. JS 结构测试 ============
test('js', 'A1. expandedRequestId 声明存在', () => {
  const decl = extractVariableAssignment(MAIN_JS, 'expandedRequestId');
  assert.ok(decl, 'main.js 中未找到 let/var/const expandedRequestId = ... 声明');
});

test('js', 'A2. data-action="toggle-request-detail" 存在', () => {
  assert.ok(
    MAIN_JS.includes('data-action="toggle-request-detail"'),
    'main.js 中未找到 data-action="toggle-request-detail"'
  );
});

test('js', 'A3. data-request-id 存在', () => {
  assert.ok(
    MAIN_JS.includes('data-request-id'),
    'main.js 中未找到 data-request-id'
  );
});

test('js', 'A4. aria-expanded 存在于卡片模板', () => {
  const renderIdx = MAIN_JS.indexOf('function renderRequests()');
  const renderSection = MAIN_JS.slice(renderIdx, renderIdx + 2000);
  assert.ok(
    renderSection.includes('aria-expanded'),
    'renderRequests 卡片模板中未找到 aria-expanded'
  );
});

test('js', 'A5. aria-controls 存在于卡片模板', () => {
  const renderIdx = MAIN_JS.indexOf('function renderRequests()');
  const renderSection = MAIN_JS.slice(renderIdx, renderIdx + 2000);
  assert.ok(
    renderSection.includes('aria-controls'),
    'renderRequests 卡片模板中未找到 aria-controls'
  );
});

test('js', 'A6. 详情区稳定 id 结构 "request-detail-" 存在于卡片模板', () => {
  const renderIdx = MAIN_JS.indexOf('function renderRequests()');
  const renderSection = MAIN_JS.slice(renderIdx, renderIdx + 2000);
  assert.ok(
    renderSection.includes('request-detail-'),
    'renderRequests 卡片模板中未找到 "request-detail-" 稳定 id 结构'
  );
});

test('js', 'A7. "查看详情" 和 "收起详情" 文案存在于卡片模板', () => {
  const renderIdx = MAIN_JS.indexOf('function renderRequests()');
  const renderSection = MAIN_JS.slice(renderIdx, renderIdx + 2000);
  assert.ok(
    renderSection.includes('查看详情'),
    'renderRequests 卡片模板中未找到 "查看详情" 文案'
  );
  assert.ok(
    renderSection.includes('收起详情'),
    'renderRequests 卡片模板中未找到 "收起详情" 文案'
  );
});

// ============ B. JavaScript 行为测试 ============

// ---- 逐字符标签属性解析器（for 索引、无正则） ----
// 步骤：跳过 < 与标签名；逐字符读属性名；跳过空白；识别 =；跳过空白；
// 若首字符是 ' 或 "，则保存 quote 并扫描到相同真实 quote（&quot; 只按普通文本处理）；
// 否则扫描到空白或 >。禁止正则提取。
function parseTagAttributes(tagHtml) {
  const attrs = {};
  let i = 0;
  // 跳过 '<'
  while (i < tagHtml.length && tagHtml[i] !== '<') i++;
  i++; // 跳过 '<'
  // 跳过标签名（非空白、非 >）
  while (i < tagHtml.length && tagHtml[i] !== ' ' && tagHtml[i] !== '>' && tagHtml[i] !== '\t' && tagHtml[i] !== '\n') i++;
  // 逐属性扫描
  while (i < tagHtml.length && tagHtml[i] !== '>') {
    // 跳过空白
    while (i < tagHtml.length && (tagHtml[i] === ' ' || tagHtml[i] === '\t' || tagHtml[i] === '\n' || tagHtml[i] === '\r' || tagHtml[i] === '/')) i++;
    if (i >= tagHtml.length || tagHtml[i] === '>') break;
    // 读取属性名
    const nameStart = i;
    while (i < tagHtml.length && tagHtml[i] !== '=' && tagHtml[i] !== ' ' && tagHtml[i] !== '\t' && tagHtml[i] !== '\n' && tagHtml[i] !== '>' && tagHtml[i] !== '/') i++;
    if (nameStart === i) break;
    const attrName = tagHtml.slice(nameStart, i);
    // 跳过空白
    while (i < tagHtml.length && (tagHtml[i] === ' ' || tagHtml[i] === '\t')) i++;
    if (i >= tagHtml.length) break;
    let attrValue = '';
    if (tagHtml[i] === '=') {
      i++; // 跳过 '='
      // 跳过空白
      while (i < tagHtml.length && (tagHtml[i] === ' ' || tagHtml[i] === '\t')) i++;
      if (i >= tagHtml.length) break;
      // 判断值的引号
      const quote = tagHtml[i];
      if (quote === '"' || quote === "'") {
        i++; // 跳过起始引号
        // 扫描到相同真实 quote（&quot; 是普通文本，不是真实引号）
        const valStart = i;
        while (i < tagHtml.length && tagHtml[i] !== quote) i++;
        attrValue = tagHtml.slice(valStart, i);
        if (i < tagHtml.length) i++; // 跳过结束引号
      } else {
        // 无引号值：扫描到空白或 >
        const valStart = i;
        while (i < tagHtml.length && tagHtml[i] !== ' ' && tagHtml[i] !== '\t' && tagHtml[i] !== '>' && tagHtml[i] !== '/') i++;
        attrValue = tagHtml.slice(valStart, i);
      }
    } else {
      // 布尔属性
      attrValue = '';
    }
    // HTML 实体解码
    const decoded = attrValue.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
    attrs[attrName] = decoded;
  }
  return attrs;
}

// ---- 解析器自检 ----
(function testParser() {
  // 安全标签：src 中的 &quot; 不是真实引号，不形成 onerror 属性
  const safe = '<img src="x&amp;quot; onerror=&amp;quot;alert(1)" class="request-detail-img">';
  const safeAttrs = parseTagAttributes(safe);
  const safeKeys = Object.keys(safeAttrs);
  assert.ok(safeKeys.length === 2, '安全标签属性数不是 2: ' + JSON.stringify(safeKeys));
  assert.ok(!('onerror' in safeAttrs), '安全标签误判 onerror');
  assert.ok(safeAttrs.src === 'x" onerror="alert(1)', '安全标签 src 解码错: ' + JSON.stringify(safeAttrs.src));
  assert.ok(safeAttrs.class === 'request-detail-img', '安全标签 class 错');
  // 不安全标签：真实双引号闭合 src，后跟独立 onerror
  const unsafe = '<img src="x" onerror="alert(1)">';
  const unsafeAttrs = parseTagAttributes(unsafe);
  assert.ok('src' in unsafeAttrs, '不安全缺 src');
  assert.ok('onerror' in unsafeAttrs, '不安全漏判 onerror');
  assert.ok(unsafeAttrs.src === 'x', '不安全 src 错');
  // 单引号属性
  const singleQ = "<img src='hello' onclick='world'>";
  const sqAttrs = parseTagAttributes(singleQ);
  assert.ok(sqAttrs.src === 'hello', '单引号 src 错');
  assert.ok(sqAttrs.onclick === 'world', '单引号 onclick 错');
  // 无引号属性
  const noQ = '<img src=hello.png alt=world>';
  const nqAttrs = parseTagAttributes(noQ);
  assert.ok(nqAttrs.src === 'hello.png', '无引号 src 错: ' + nqAttrs.src);
  assert.ok(nqAttrs.alt === 'world', '无引号 alt 错');
})();

// B1: 用提取的变量声明验证
test('js', 'B1. 默认 expandedRequestId 为 null', () => {
  const decl = extractVariableAssignment(MAIN_JS, 'expandedRequestId');
  assert.ok(decl, '生产代码中不存在 expandedRequestId 声明');
  // 验证声明的值确实是 null
  const evalDecl = new Function(decl + ' return expandedRequestId;');
  const val = evalDecl();
  assert.strictEqual(val, null, 'expandedRequestId 初始值不是 null');
});

// B2–B5: 使用详情沙箱
test('js', 'B2. 点击未展开 ID 后展开', () => {
  const sandbox = buildDetailSandbox({ requests: [{ id: 'X', title: '测试', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] }] });
  if (!sandbox.toggle) throw new Error('toggleRequestDetail 函数不存在');
  sandbox.toggle('X');
  assert.strictEqual(sandbox.expandedRequestId, 'X', 'toggle 后 expandedRequestId 未变为 X');
  const grid = sandbox.grid || '';
  const xDetailRe = /id="request-detail-X"/;
  assert.ok(xDetailRe.test(grid), '展开后 HTML 中未找到 id="request-detail-X"');
  // X 详情区不应有 hidden
  const xSection = grid.match(/id="request-detail-X"[^>]*>/);
  assert.ok(xSection && !xSection[0].includes('hidden'), '展开后详情区仍有 hidden');
});

test('js', 'B3. 再次点击相同 ID 后收起', () => {
  const sandbox = buildDetailSandbox({ requests: [{ id: 'X', title: '测试', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] }] });
  if (!sandbox.toggle) throw new Error('toggleRequestDetail 函数不存在');
  sandbox.toggle('X');
  sandbox.toggle('X');
  assert.strictEqual(sandbox.expandedRequestId, null, '再次点击后 expandedRequestId 不是 null');
  const grid = sandbox.grid || '';
  const xSection = grid.match(/id="request-detail-X"[^>]*>/);
  if (xSection) {
    assert.ok(xSection[0].includes('hidden'), '再次点击后详情区未重新 hidden');
  }
});

test('js', 'B4. 点击不同 ID 后切换', () => {
  const sandbox = buildDetailSandbox({ requests: [
    { id: 'X', title: 'X题', text: 'X内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] },
    { id: 'Y', title: 'Y题', text: 'Y内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] }
  ] });
  if (!sandbox.toggle) throw new Error('toggleRequestDetail 函数不存在');
  sandbox.toggle('X');
  sandbox.toggle('Y');
  assert.strictEqual(sandbox.expandedRequestId, 'Y', '切换后 expandedRequestId 不是 Y');
  const grid = sandbox.grid || '';
  // X 区必须有 hidden
  const xSection = grid.match(/id="request-detail-X"[^>]*>/);
  assert.ok(xSection, '未找到 X 详情区');
  assert.ok(xSection[0].includes('hidden'), 'X 区未重新 hidden');
  // Y 区不能有 hidden
  const ySection = grid.match(/id="request-detail-Y"[^>]*>/);
  assert.ok(ySection, '未找到 Y 详情区');
  assert.ok(!ySection[0].includes('hidden'), 'Y 区有 hidden');
});

test('js', 'B5. 同时仅一张卡片展开', () => {
  const sandbox = buildDetailSandbox({ requests: [
    { id: 'X', title: 'X', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] },
    { id: 'Y', title: 'Y', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] }
  ] });
  if (!sandbox.toggle) throw new Error('toggleRequestDetail 函数不存在');
  sandbox.toggle('X');
  sandbox.toggle('Y');
  const grid = sandbox.grid || '';
  // 查找所有 request-detail- 开头的 id 属性，统计不含 hidden 的数量
  const detailTags = grid.match(/id="request-detail-[^"]*"[^>]*>/g) || [];
  const expandedCount = detailTags.filter(tag => !tag.includes('hidden')).length;
  assert.strictEqual(expandedCount, 1, '同时展开的详情区数量不是 1，实际: ' + expandedCount);
});

// B6–B9: 接线扫描 + reset 行为
test('js', 'B6. 状态筛选清空展开状态（resetExpandedRequest 行为 + 接线扫描）', () => {
  const sandbox = buildDetailSandbox({ requests: [] });
  if (!sandbox.reset) throw new Error('resetExpandedRequest 函数不存在');
  sandbox.expandedRequestId = 'X';
  sandbox.reset();
  assert.strictEqual(sandbox.expandedRequestId, null, 'reset 后 expandedRequestId 不是 null');
  var body = extractHandlerBody(MAIN_JS, 'requestTabs', 'click', true);
  assert.ok(body && body.includes('resetExpandedRequest'), 'requestTabs forEach 回调内未调用 resetExpandedRequest');
});

test('js', 'B7. 分类筛选清空展开状态（resetExpandedRequest 行为 + 接线扫描）', () => {
  const sandbox = buildDetailSandbox({ requests: [] });
  if (!sandbox.reset) throw new Error('resetExpandedRequest 函数不存在');
  sandbox.expandedRequestId = 'X';
  sandbox.reset();
  assert.strictEqual(sandbox.expandedRequestId, null, 'reset 后 expandedRequestId 不是 null');
  var body = extractHandlerBody(MAIN_JS, 'requestCategoryFilters', 'click', true);
  assert.ok(body && body.includes('resetExpandedRequest'), 'requestCategoryFilters forEach 回调内未调用 resetExpandedRequest');
});

test('js', 'B8. 搜索变化清空展开状态（接线扫描）', () => {
  var body = extractHandlerBody(MAIN_JS, 'requestSearch', 'input', false);
  assert.ok(body && body.includes('resetExpandedRequest'), 'requestSearch addEventListener 回调内未调用 resetExpandedRequest');
});

test('js', 'B9. 数据重载清空展开状态（接线扫描）', () => {
  const renderAllIdx = MAIN_JS.indexOf('function renderAll');
  const renderAllSection = MAIN_JS.slice(renderAllIdx, renderAllIdx + 500);
  assert.ok(renderAllSection.includes('resetExpandedRequest'), 'renderAll 处理区未调用 resetExpandedRequest');
});

test('js', 'B10. 普通重绘保留展开状态', () => {
  const sandbox = buildDetailSandbox({ requests: [
    { id: 'X', title: '测试', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] }
  ] });
  if (!sandbox.toggle) throw new Error('toggleRequestDetail 函数不存在');
  sandbox.toggle('X');
  if (!sandbox.render) throw new Error('render 不存在');
  sandbox.render();
  assert.strictEqual(sandbox.expandedRequestId, 'X', '普通重绘后 expandedRequestId 变了');
});

// B11–B15: getRequestAdminDetail
test('js', 'B11. done + adminReply 返回 完成说明', () => {
  if (!extractFunction(MAIN_JS, 'getRequestAdminDetail')) throw new Error('getRequestAdminDetail 不存在');
  const sandbox = buildDetailSandbox({ requests: [] });
  const result = sandbox.adminDetail({ status: 'done', adminReply: '已修复', rejectReason: '' }, 'done');
  assert.ok(result && result.label === '完成说明' && result.value === '已修复', 'done 不正确: ' + JSON.stringify(result));
});

test('js', 'B12. pending/planned + adminReply 返回 管理员回复', () => {
  if (!extractFunction(MAIN_JS, 'getRequestAdminDetail')) throw new Error('getRequestAdminDetail 不存在');
  const sandbox = buildDetailSandbox({ requests: [] });
  const r1 = sandbox.adminDetail({ status: 'pending', adminReply: '收到', rejectReason: '' }, 'pending');
  assert.ok(r1 && r1.label === '管理员回复' && r1.value === '收到', 'pending 不正确: ' + JSON.stringify(r1));
  const r2 = sandbox.adminDetail({ status: 'planned', adminReply: '已计划', rejectReason: '' }, 'planned');
  assert.ok(r2 && r2.label === '管理员回复' && r2.value === '已计划', 'planned 不正确: ' + JSON.stringify(r2));
});

test('js', 'B13. rejected 优先使用 rejectReason，标题为 拒绝原因', () => {
  if (!extractFunction(MAIN_JS, 'getRequestAdminDetail')) throw new Error('getRequestAdminDetail 不存在');
  const sandbox = buildDetailSandbox({ requests: [] });
  const result = sandbox.adminDetail({ status: 'rejected', rejectReason: '不符合', adminReply: '不通过' }, 'rejected');
  assert.ok(result && result.label === '拒绝原因' && result.value === '不符合', 'rejected rejectReason 优先不正确: ' + JSON.stringify(result));
});

test('js', 'B14. rejected 的 rejectReason 为空时回退真实 adminReply', () => {
  if (!extractFunction(MAIN_JS, 'getRequestAdminDetail')) throw new Error('getRequestAdminDetail 不存在');
  const sandbox = buildDetailSandbox({ requests: [] });
  const result = sandbox.adminDetail({ status: 'rejected', rejectReason: '', adminReply: '仍可参加' }, 'rejected');
  assert.ok(result && result.label === '拒绝原因' && result.value === '仍可参加', 'rejected 回退 adminReply 不正确: ' + JSON.stringify(result));
});

test('js', 'B15. 管理员字段全部为空时返回 null', () => {
  if (!extractFunction(MAIN_JS, 'getRequestAdminDetail')) throw new Error('getRequestAdminDetail 不存在');
  const sandbox = buildDetailSandbox({ requests: [] });
  assert.strictEqual(sandbox.adminDetail({ status: 'done', adminReply: '' }, 'done'), null, 'done 空值未返回 null');
  assert.strictEqual(sandbox.adminDetail({ status: 'rejected', rejectReason: '', adminReply: '' }, 'rejected'), null, 'rejected 空值未返回 null');
  assert.strictEqual(sandbox.adminDetail({ status: 'pending', adminReply: '' }, 'pending'), null, 'pending 空值未返回 null');
});

test('js', 'B16. created_at 缺失时不渲染时间行', () => {
  if (!extractFunction(MAIN_JS, 'buildRequestDetail')) throw new Error('buildRequestDetail 不存在');
  const sandbox = buildDetailSandbox({ requests: [] });
  const html = sandbox.build({ text: '内容', created_at: undefined, user: 'A', category: 'BUG', status: 'pending' }, 'id1');
  assert.ok(!html.includes('提交时间'), 'created_at 缺失时仍渲染了提交时间行');
});

test('js', 'B17. images 缺失或空数组时不渲染图片区', () => {
  if (!extractFunction(MAIN_JS, 'buildRequestDetail')) throw new Error('buildRequestDetail 不存在');
  const sandbox = buildDetailSandbox({ requests: [] });
  const html1 = sandbox.build({ text: '内容', images: undefined }, 'id2');
  assert.ok(!html1.includes('request-detail-images'), 'images undefined 时仍渲染了图片区');
  const html2 = sandbox.build({ text: '内容', images: [] }, 'id3');
  assert.ok(!html2.includes('request-detail-images'), 'images 空数组时仍渲染了图片区');
});

// B18: 无有效 ID 测试 — 使用 getRequestIdOverride
test('js', 'B18. 无有效 requestId 时该卡片不提供详情入口且列表不崩溃', () => {
  // 注入自定义 getRequestId：对 BROKEN 返回空，对 NORMAL 返回稳定值
  const idInject = `function getRequestId(item, index) { return item && (item.id === 'BROKEN' ? '' : (item.id || 'id_' + index)); }`;
  const sandbox = buildDetailSandbox({
    requests: [
      { id: 'BROKEN', title: '异常卡', text: '此卡无ID', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] },
      { id: 'NORMAL', title: '正常卡', text: '此卡正常', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] }
    ]
  }, idInject);

  let threw = false;
  let grid = '';
  try {
    grid = sandbox.render();
  } catch (e) {
    threw = true;
    grid = sandbox.grid || '';
  }
  assert.ok(!threw, 'renderRequests 抛出了异常');
  assert.ok(grid.includes('异常卡'), '异常卡片内容未出现在 HTML 中');
  assert.ok(grid.includes('正常卡'), '正常卡片内容未出现在 HTML 中');
  // 异常卡片不应有 data-request-id="BROKEN"
  const brokenRe = /data-request-id="BROKEN"/;
  assert.ok(!brokenRe.test(grid), '异常卡片出现了 data-request-id="BROKEN"');
  // 异常卡片不应有 request-detail-BROKEN
  const brokenDetailRe = /request-detail-BROKEN/;
  assert.ok(!brokenDetailRe.test(grid), '异常卡片出现了 request-detail-BROKEN');
  // 正常卡片应有查看详情按钮（data-request-id="NORMAL"）
  const normalBtnRe = /data-request-id="NORMAL"/;
  assert.ok(normalBtnRe.test(grid), '正常卡片缺少 data-request-id="NORMAL"');
  assert.ok(grid.includes('id="request-detail-NORMAL"'), '正常卡片缺少 request-detail-NORMAL');
});

// B19, B20, B24: 基线沙箱（只用现有函数，不含新详情函数）
test('js', 'B19. 渲染结果不出现 undefined 或 null', () => {
  const sandbox = buildBaselineSandbox({ requests: [
    { title: '测试', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0 }
  ] });
  const grid = sandbox.render() || '';
  assert.ok(!grid.includes('undefined'), 'HTML 中包含 undefined 字样');
  assert.ok(!grid.includes('>null<'), 'HTML 中包含 null 字样');
});

test('js', 'B20. 建议正文经过 HTML 转义', () => {
  const sandbox = buildBaselineSandbox({ requests: [
    { id: 'X', title: '<script>alert(1)</script>', text: '<b>恶意</b>内容', user: '" onerror="alert(1)', status: 'pending', category: 'BUG', contact: 'test', adminReply: '', rejectReason: '', agree: 0, disagree: 0 }
  ] });
  const grid = sandbox.render() || '';
  // 不包含原始的 <script> 标签
  const scriptTagRe = /<script[\s>]/;
  assert.ok(!scriptTagRe.test(grid), '未转义的 <script> 出现在 HTML 中');
  // 包含转义后的 &lt;script&gt;
  assert.ok(grid.includes('&lt;script&gt;') || grid.includes('&#60;script&#62;'), '转义后的 <script> 未正确显示');
  // 不包含原始的 <b> 标签
  assert.ok(!grid.includes('<b>恶意</b>'), '未转义的 <b> 标签出现在 HTML 中');
  // 包含转义后的 &lt;b&gt;
  assert.ok(grid.includes('&lt;b&gt;') || grid.includes('&#60;b&#62;'), '转义后的 <b> 未正确显示');
  // 玩家名中的双引号不突破标签结构（仅检查文本节点有转义，不负责图片属性）
  assert.ok(grid.includes('&lt;script&gt;') || grid.includes('&#60;script&#62;'), 'script 转义未正确显示');
  assert.ok(grid.includes('&lt;b&gt;') || grid.includes('&#60;b&#62;'), 'b 标签转义未正确显示');
  assert.ok(!grid.includes('<script>alert(1)</script>'), '原始 script 标签未转义');
  assert.ok(!grid.includes('<b>恶意</b>'), '原始 b 标签未转义');
});

test('js', 'B21. requestId、图片地址等属性经过属性转义', () => {
  const sandbox = buildDetailSandbox({ requests: [
    { id: 'X', title: '测试', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: ['http://test.com/x" onerror="alert(1)'] }
  ] });
  const grid = sandbox.render() || '';
  // 提取 img 开始标签
  const imgTagMatch = grid.match(/<img\s[^>]*>/);
  if (!imgTagMatch) throw new Error('详情渲染未生成 img 标签（详情功能尚未实现）');
  const imgTag = imgTagMatch[0];
  const attrs = parseTagAttributes(imgTag);
  // src 属性必须存在
  assert.ok('src' in attrs, 'img 标签缺少 src 属性');
  assert.ok(attrs.src.length > 0, 'img 标签 src 属性为空');
  // 不得有任何以 on 开头的事件属性
  const onAttrs = Object.keys(attrs).filter(name => name.startsWith('on'));
  assert.ok(onAttrs.length === 0, 'img 标签存在未转义的事件属性: ' + onAttrs.join(','));
  // src 值中的双引号被转义（src 属性值实际含 &quot; 实体）
  const rawSrcStart = imgTag.indexOf('src=');
  if (rawSrcStart !== -1) {
    const afterSrc = imgTag.slice(rawSrcStart + 4);
    const firstChar = afterSrc.trim()[0];
    if (firstChar === '"' || firstChar === "'") {
      const quote = firstChar;
      const valPart = afterSrc.trim().slice(1);
      const endQuote = valPart.indexOf(quote);
      if (endQuote !== -1) {
        const rawVal = valPart.slice(0, endQuote);
        assert.ok(rawVal.includes('&quot;') || rawVal.includes('&#34;') || rawVal.includes('&#x22;'),
          'src 属性值中双引号未转义: ' + rawVal.slice(0, 50));
      }
    }
  }
});

test('js', 'B22. 三种状态标题映射在详情 HTML 中正确', () => {
  if (!extractFunction(MAIN_JS, 'renderRequests') || !extractFunction(MAIN_JS, 'getRequestAdminDetail')) {
    throw new Error('详情相关函数不存在');
  }
  const dSandbox = buildDetailSandbox({ requests: [{ id: 'D', title: '完成', text: '内容', user: '玩家', status: 'done', category: 'BUG', contact: 'QQ', adminReply: '已修复', rejectReason: '', agree: 0, disagree: 0, images: [] }] }, null, 'done');
  const dGrid = dSandbox.render() || '';
  assert.ok(dGrid.includes('完成说明'), 'done 未显示 "完成说明"');
  const pSandbox = buildDetailSandbox({ requests: [{ id: 'P', title: '待办', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '已收到', rejectReason: '', agree: 0, disagree: 0, images: [] }] }, null, 'pending');
  const pGrid = pSandbox.render() || '';
  assert.ok(pGrid.includes('管理员回复'), 'pending 未显示 "管理员回复"');
  const rSandbox = buildDetailSandbox({ requests: [{ id: 'R', title: '拒绝', text: '内容', user: '玩家', status: 'rejected', category: 'BUG', contact: 'QQ', adminReply: '不通过', rejectReason: '不符合', agree: 0, disagree: 0, images: [] }] }, null, 'rejected');
  const rGrid = rSandbox.render() || '';

  assert.ok(rGrid.includes('拒绝原因'), 'rejected 未显示 "拒绝原因"');
});

test('js', 'B23. 管理员说明为空时详情 HTML 不包含空说明区', () => {
  if (!extractFunction(MAIN_JS, 'buildRequestDetail')) throw new Error('buildRequestDetail 不存在');
  const sandbox = buildDetailSandbox({ requests: [] });
  const html = sandbox.build({ text: '内容', user: '玩家', category: 'BUG', status: 'pending', adminReply: '' }, 'idE');
  assert.ok(!html.includes('完成说明'), '空 adminReply 仍渲染了完成说明标签');
  assert.ok(!html.includes('管理员回复'), '空 adminReply 仍渲染了管理员回复标签');
  assert.ok(!html.includes('拒绝原因'), '空 adminReply 仍渲染了拒绝原因标签');
});

test('js', 'B24. 原有投票、否定和讨论操作结构仍存在', () => {
  const sandbox = buildBaselineSandbox({ requests: [
    { id: 'X', title: '测试', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] }
  ] });
  const grid = sandbox.render() || '';
  assert.ok(grid.includes('data-action="vote-request"'), 'vote-request 结构不存在');
  assert.ok(grid.includes('讨论'), '讨论按钮不存在');
});

// ============ C. CSS 结构测试 ============
test('css', 'C1. .request-detail 样式存在', () => {
  assert.ok(
    MAIN_CSS.includes('.request-detail'),
    'main.css 中未找到 .request-detail 选择器'
  );
});

test('css', 'C2. 详情区与卡片正文有明确分隔（border-top 或 margin-top 且非 0）', () => {
  const detailIdx = MAIN_CSS.indexOf('.request-detail');
  if (detailIdx === -1) throw new Error('.request-detail 不存在');
  const block = MAIN_CSS.slice(detailIdx, detailIdx + 400);
  assert.ok(
    (block.includes('border-top') || block.includes('margin-top')),
    '.request-detail 缺少 border-top 或 margin-top'
  );
  assert.ok(
    !block.includes('border-top:0') && !block.includes('margin-top:0') && !block.includes('margin-top: 0'),
    '.request-detail 的 border-top 或 margin-top 为 0'
  );
});

test('css', 'C3. 暗色主题覆盖存在', () => {
  assert.ok(
    MAIN_CSS.includes('[data-theme="dark"] .request-detail') || MAIN_CSS.includes('[data-theme="dark"].request-detail'),
    'main.css 中未找到暗色 .request-detail 覆盖'
  );
});

test('css', 'C4. 手机端 @media (max-width:767px) 内 .mini-btn 含 min-height:44px', () => {
  const mobileStart = MAIN_CSS.indexOf('@media (max-width: 767px)');
  assert.ok(mobileStart !== -1, '未找到 @media (max-width:767px)');
  const mobileEnd = mobileStart + 5000;
  const mobileBlock = MAIN_CSS.slice(mobileStart, mobileEnd);
  const miniIdx = mobileBlock.indexOf('.mini-btn');
  if (miniIdx === -1) throw new Error('手机区块中未找到 .mini-btn');
  const miniBlock = mobileBlock.slice(miniIdx, miniIdx + 200);
  assert.ok(
    miniBlock.includes('min-height:44px') || miniBlock.includes('min-height: 44px'),
    '手机区块 .mini-btn 未设置 min-height:44px'
  );
});

test('css', 'C5. 横屏粗指针 @media (max-height:450px) and (pointer:coarse) 内 .mini-btn 含 min-height:44px', () => {
  const lpIdx = MAIN_CSS.indexOf('@media (max-height: 450px) and (pointer: coarse)');
  if (lpIdx === -1) throw new Error('未找到横屏粗指针媒体查询');
  const lpBlock = MAIN_CSS.slice(lpIdx, lpIdx + 2000);
  const miniIdx = lpBlock.indexOf('.mini-btn');
  if (miniIdx === -1) throw new Error('横屏粗指针区块中未找到 .mini-btn');
  const miniBlock = lpBlock.slice(miniIdx, miniIdx + 200);
  assert.ok(
    miniBlock.includes('min-height:44px') || miniBlock.includes('min-height: 44px'),
    '横屏粗指针 .mini-btn 未设置 min-height:44px'
  );
});

test('css', 'C6. .request-detail-value 含 word-break 或 white-space:pre-wrap', () => {
  const valIdx = MAIN_CSS.indexOf('.request-detail-value');
  if (valIdx === -1) throw new Error('.request-detail-value 不存在');
  const valBlock = MAIN_CSS.slice(valIdx, valIdx + 200);
  assert.ok(
    valBlock.includes('word-break') || valBlock.includes('white-space'),
    '.request-detail-value 缺少 word-break 或 white-space 换行属性'
  );
});

test('css', 'C7. .request-detail-images 与 .request-detail-img 存在', () => {
  assert.ok(MAIN_CSS.includes('.request-detail-images'), 'main.css 中未找到 .request-detail-images');
  assert.ok(MAIN_CSS.includes('.request-detail-img'), 'main.css 中未找到 .request-detail-img');
});

// ============ 运行器 ============
function runGroup(label, tests) {
  if (!tests.length) return;
  console.log(`\n--- ${label} ---`);
  let passed = 0;
  const failures = [];
  tests.forEach(({ name, fn }) => {
    try {
      fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (e) {
      failures.push(name);
      console.error(`  ✗ ${name}`);
      console.error(`    ${e.message}`);
      process.exitCode = 1;
    }
  });
  console.log(`\n测试 ${tests.length}，通过 ${passed}，失败 ${failures.length}`);
  if (failures.length) {
    console.log('失败名称:');
    failures.forEach(n => console.log('  ✗ ' + n));
  }
}

if (GROUP === 'js' || GROUP === 'all') {
  runGroup('JS 结构测试 (A1–A7)', jsTests.filter(t => t.name.startsWith('A')));
  runGroup('JavaScript 行为测试 (B1–B5, B10)', jsTests.filter(t => {
    const n = t.name;
    return n.startsWith('B') && !n.includes('B6') && !n.includes('B7') && !n.includes('B8') && !n.includes('B9') && !n.includes('B11') && !n.includes('B12') && !n.includes('B13') && !n.includes('B14') && !n.includes('B15') && !n.includes('B16') && !n.includes('B17') && !n.includes('B18') && !n.includes('B19') && !n.includes('B20') && !n.includes('B21') && !n.includes('B22') && !n.includes('B23') && !n.includes('B24');
  }));
  runGroup('JavaScript 行为测试 (B6–B9 接线)', jsTests.filter(t => ['B6','B7','B8','B9'].some(p => t.name.startsWith(p))));
  runGroup('JavaScript 行为测试 (B11–B17 详情字段)', jsTests.filter(t => ['B11','B12','B13','B14','B15','B16','B17'].some(p => t.name.startsWith(p))));
  runGroup('JavaScript 行为测试 (B18 无ID安全)', jsTests.filter(t => t.name.startsWith('B18')));
  runGroup('JavaScript 行为测试 (B19–B24 基线+详情)', jsTests.filter(t => ['B19','B20','B21','B22','B23','B24'].some(p => t.name.startsWith(p))));
}
if (GROUP === 'css' || GROUP === 'all') {
  runGroup('CSS 结构测试 (C1–C7)', cssTests);
}

if (GROUP === 'all') {
  console.log(`\nALL 分组：JS ${jsTests.length} 项 + CSS ${cssTests.length} 项 = ${jsTests.length + cssTests.length} 项`);
}
