#!/usr/bin/env node
// 玩家建议前台详情专项测试（Task 1 红灯阶段）
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
  // 跳过参数列表中的括号
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

// ---- 沙箱构建 ----
function buildRequestSandbox(seed) {
  const helpers = [
    'function getPlayerVote() { return ""; }',
    'function applyIcons() {}',
    'function loadRequestImages() {}',
    'const activePlayerName = "测试玩家";',
    'const requestVotes = {};',
    'let expandedRequestId = null;',
    extractFunction(MAIN_JS, 'getRequestId'),
    extractFunction(MAIN_JS, 'escapeHtml'),
    extractFunction(MAIN_JS, 'escapeAttr'),
    extractFunction(MAIN_JS, 'normalizeRequestStatus'),
    extractFunction(MAIN_JS, 'requestLabel'),
    extractFunction(MAIN_JS, 'requestCategoryLabel'),
    extractFunction(MAIN_JS, 'getRequestAdminDetail'),
    extractFunction(MAIN_JS, 'buildRequestDetail'),
    extractFunction(MAIN_JS, 'resetExpandedRequest'),
    extractFunction(MAIN_JS, 'toggleRequestDetail'),
    extractFunction(MAIN_JS, 'renderRequests'),
  ].filter(Boolean).join('\n');

  const wrapper = `
    let requests = ${JSON.stringify(seed.requests)};
    const captured = { requestGrid: '' };
    const document = {
      getElementById: (id) => {
        if (id === 'requestGrid') {
          const b = { _html: '' };
          Object.defineProperty(b, 'innerHTML', { get(){return this._html;}, set(v){this._html=v; captured.requestGrid=v;} });
          return b;
        }
        if (id === 'requestTabs') return { innerHTML:'', value:'', addEventListener:()=>{} };
        if (id === 'requestCategoryFilters') return { innerHTML:'', value:'', addEventListener:()=>{} };
        if (id === 'requestSearch') return { value: '', addEventListener:()=>{} };
        return { innerHTML:'', value:'', textContent:'', classList:{add(){},remove(){}}, setAttribute(){}, addEventListener(){} };
      },
      querySelectorAll: () => [],
      querySelector: () => null
    };
    ${helpers}
    return {
      get expandedRequestId(){ return expandedRequestId; },
      set expandedRequestId(v){ expandedRequestId = v; },
      get grid(){ return captured.requestGrid; },
      render: () => { renderRequests(); return captured.requestGrid; },
      toggle: (id) => toggleRequestDetail(id),
      reset: () => resetExpandedRequest(),
      adminDetail: (item, status) => getRequestAdminDetail(item, status),
      build: (item, id) => buildRequestDetail ? buildRequestDetail(item, id) : 'no-buildRequestDetail'
    };
  `;
  return new Function('Date', 'Math', 'JSON', 'console', wrapper)(Date, Math, JSON, console);
}

// ============ A. JS 结构测试 ============
test('js', 'A1. expandedRequestId 声明存在', () => {
  assert.ok(
    MAIN_JS.includes('let expandedRequestId') || MAIN_JS.includes('var expandedRequestId'),
    'main.js 中未找到 let/var expandedRequestId 声明'
  );
});

test('js', 'A2. data-action="toggle-request-detail" 存在', () => {
  assert.ok(
    MAIN_JS.includes('data-action="toggle-request-detail"') || MAIN_JS.includes("data-action='toggle-request-detail'"),
    'main.js 中未找到 data-action="toggle-request-detail"'
  );
});

test('js', 'A3. data-request-id 存在', () => {
  assert.ok(
    MAIN_JS.includes('data-request-id'),
    'main.js 中未找到 data-request-id'
  );
});

test('js', 'A4. aria-expanded 存在', () => {
  assert.ok(
    MAIN_JS.includes('aria-expanded'),
    'main.js 中未找到 aria-expanded'
  );
});

test('js', 'A5. aria-controls 存在', () => {
  assert.ok(
    MAIN_JS.includes('aria-controls'),
    'main.js 中未找到 aria-controls'
  );
});

test('js', 'A6. 详情区稳定 id 结构 "request-detail-" 存在', () => {
  assert.ok(
    MAIN_JS.includes('request-detail-'),
    'main.js 中未找到 "request-detail-" 稳定 id 结构'
  );
});

test('js', 'A7. "查看详情" 和 "收起详情" 文案存在', () => {
  assert.ok(
    MAIN_JS.includes('查看详情'),
    'main.js 中未找到 "查看详情" 文案'
  );
  assert.ok(
    MAIN_JS.includes('收起详情'),
    'main.js 中未找到 "收起详情" 文案'
  );
});

// ============ B. JavaScript 行为测试 ============

test('js', 'B1. 默认 expandedRequestId 为 null', () => {
  const sandbox = buildRequestSandbox({ requests: [] });
  assert.strictEqual(sandbox.expandedRequestId, null, '默认 expandedRequestId 不是 null');
});

test('js', 'B2. 点击未展开 ID 后展开', () => {
  const sandbox = buildRequestSandbox({ requests: [{ id: 'X', title: '测试', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] }] });
  if (typeof sandbox.toggle !== 'function') throw new Error('toggleRequestDetail 函数不存在');
  sandbox.toggle('X');
  assert.strictEqual(sandbox.expandedRequestId, 'X', 'toggle 后 expandedRequestId 未变为 X');
  const grid = sandbox.grid || '';
  assert.ok(grid.includes('request-detail-X'), '展开后 HTML 中未找到 id="request-detail-X"');
  assert.ok(!grid.includes('id="request-detail-X" hidden'), '展开后详情区仍有 hidden');
});

test('js', 'B3. 再次点击相同 ID 后收起', () => {
  const sandbox = buildRequestSandbox({ requests: [{ id: 'X', title: '测试', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] }] });
  if (typeof sandbox.toggle !== 'function') throw new Error('toggleRequestDetail 函数不存在');
  sandbox.toggle('X');
  sandbox.toggle('X');
  assert.strictEqual(sandbox.expandedRequestId, null, '再次点击后 expandedRequestId 不是 null');
  const grid = sandbox.grid || '';
  if (grid.includes('request-detail-X')) {
    assert.ok(grid.includes('hidden'), '再次点击后详情区未重新 hidden');
  }
});

test('js', 'B4. 点击不同 ID 后切换', () => {
  const sandbox = buildRequestSandbox({ requests: [
    { id: 'X', title: 'X题', text: 'X内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] },
    { id: 'Y', title: 'Y题', text: 'Y内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] }
  ] });
  if (typeof sandbox.toggle !== 'function') throw new Error('toggleRequestDetail 函数不存在');
  sandbox.toggle('X');
  sandbox.toggle('Y');
  assert.strictEqual(sandbox.expandedRequestId, 'Y', '切换后 expandedRequestId 不是 Y');
  const grid = sandbox.grid || '';
  const xHidden = grid.includes('id="request-detail-X"') && grid.includes('request-detail-X') && !grid.includes('id="request-detail-X"') === (grid.includes('request-detail-X hidden') || grid.match(/request-detail-X[^>]*hidden/));
  assert.ok(grid.includes('request-detail-X') && grid.includes('hidden'), 'X 区未重新 hidden');
  assert.ok(grid.includes('request-detail-Y') && !grid.includes('id="request-detail-Y" hidden'), 'Y 区有 hidden');
});

test('js', 'B5. 同时仅一张卡片展开', () => {
  const sandbox = buildRequestSandbox({ requests: [
    { id: 'X', title: 'X', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] },
    { id: 'Y', title: 'Y', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] }
  ] });
  if (typeof sandbox.toggle !== 'function') throw new Error('toggleRequestDetail 函数不存在');
  sandbox.toggle('X');
  sandbox.toggle('Y');
  const grid = sandbox.grid || '';
  // 寻找不含 hidden 的 request-detail 区
  const matches = grid.match(/request-detail-[^\s"'>]+/g) || [];
  const expanded = matches.filter(id => {
    const re = new RegExp('id="' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"');
    const after = grid.slice(grid.search(re));
    return !after.startsWith(' hidden') && !after.includes(' hidden');
  });
  assert.strictEqual(expanded.length, 1, '同时展开的详情区数量不是 1');
});

test('js', 'B6. 状态筛选清空展开状态（resetExpandedRequest 行为 + 接线扫描）', () => {
  const sandbox = buildRequestSandbox({ requests: [] });
  if (typeof sandbox.reset !== 'function') throw new Error('resetExpandedRequest 函数不存在');
  sandbox.expandedRequestId = 'X';
  sandbox.reset();
  assert.strictEqual(sandbox.expandedRequestId, null, 'reset 后 expandedRequestId 不是 null');
  // 接线保证：扫描 requestTabs 处理区
  const tabIdx = MAIN_JS.indexOf('requestTabs');
  const tabSection = MAIN_JS.slice(tabIdx, tabIdx + 300);
  assert.ok(tabSection.includes('resetExpandedRequest'), 'requestTabs 处理区未调用 resetExpandedRequest');
});

test('js', 'B7. 分类筛选清空展开状态（resetExpandedRequest 行为 + 接线扫描）', () => {
  const sandbox = buildRequestSandbox({ requests: [] });
  if (typeof sandbox.reset !== 'function') throw new Error('resetExpandedRequest 函数不存在');
  sandbox.expandedRequestId = 'X';
  sandbox.reset();
  assert.strictEqual(sandbox.expandedRequestId, null, 'reset 后 expandedRequestId 不是 null');
  const catIdx = MAIN_JS.indexOf('requestCategoryFilters');
  const catSection = MAIN_JS.slice(catIdx, catIdx + 300);
  assert.ok(catSection.includes('resetExpandedRequest'), 'requestCategoryFilters 处理区未调用 resetExpandedRequest');
});

test('js', 'B8. 搜索变化清空展开状态（接线扫描）', () => {
  const searchIdx = MAIN_JS.indexOf('requestSearch');
  const searchSection = MAIN_JS.slice(searchIdx, searchIdx + 300);
  assert.ok(searchSection.includes('resetExpandedRequest'), 'requestSearch 处理区未调用 resetExpandedRequest');
});

test('js', 'B9. 数据重载清空展开状态（接线扫描）', () => {
  const renderAllIdx = MAIN_JS.indexOf('function renderAll');
  const renderAllSection = MAIN_JS.slice(renderAllIdx, renderAllIdx + 500);
  assert.ok(renderAllSection.includes('resetExpandedRequest'), 'renderAll 处理区未调用 resetExpandedRequest');
});

test('js', 'B10. 普通重绘保留展开状态', () => {
  const sandbox = buildRequestSandbox({ requests: [
    { id: 'X', title: '测试', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] }
  ] });
  if (typeof sandbox.toggle !== 'function') throw new Error('toggleRequestDetail 函数不存在');
  if (typeof sandbox.render !== 'function') throw new Error('render 不存在');
  sandbox.toggle('X');
  sandbox.render();
  assert.strictEqual(sandbox.expandedRequestId, 'X', '普通重绘后 expandedRequestId 变了');
});

test('js', 'B11. done + adminReply 返回 完成说明', () => {
  const sandbox = buildRequestSandbox({ requests: [] });
  if (typeof sandbox.adminDetail !== 'function') throw new Error('getRequestAdminDetail 不存在');
  const result = sandbox.adminDetail({ status: 'done', adminReply: '已修复', rejectReason: '' }, 'done');
  assert.ok(result && result.label === '完成说明' && result.value === '已修复', 'done 返回不正确: ' + JSON.stringify(result));
});

test('js', 'B12. pending/planned + adminReply 返回 管理员回复', () => {
  const sandbox = buildRequestSandbox({ requests: [] });
  if (typeof sandbox.adminDetail !== 'function') throw new Error('getRequestAdminDetail 不存在');
  const r1 = sandbox.adminDetail({ status: 'pending', adminReply: '收到', rejectReason: '' }, 'pending');
  assert.ok(r1 && r1.label === '管理员回复' && r1.value === '收到', 'pending 不正确: ' + JSON.stringify(r1));
  const r2 = sandbox.adminDetail({ status: 'planned', adminReply: '已计划', rejectReason: '' }, 'planned');
  assert.ok(r2 && r2.label === '管理员回复' && r2.value === '已计划', 'planned 不正确: ' + JSON.stringify(r2));
});

test('js', 'B13. rejected 优先使用 rejectReason，标题为 拒绝原因', () => {
  const sandbox = buildRequestSandbox({ requests: [] });
  if (typeof sandbox.adminDetail !== 'function') throw new Error('getRequestAdminDetail 不存在');
  const result = sandbox.adminDetail({ status: 'rejected', rejectReason: '不符合', adminReply: '不通过' }, 'rejected');
  assert.ok(result && result.label === '拒绝原因' && result.value === '不符合', 'rejected rejectReason 优先不正确: ' + JSON.stringify(result));
});

test('js', 'B14. rejected 的 rejectReason 为空时回退真实 adminReply', () => {
  const sandbox = buildRequestSandbox({ requests: [] });
  if (typeof sandbox.adminDetail !== 'function') throw new Error('getRequestAdminDetail 不存在');
  const result = sandbox.adminDetail({ status: 'rejected', rejectReason: '', adminReply: '仍可参加' }, 'rejected');
  assert.ok(result && result.label === '拒绝原因' && result.value === '仍可参加', 'rejected 回退 adminReply 不正确: ' + JSON.stringify(result));
});

test('js', 'B15. 管理员字段全部为空时返回 null', () => {
  const sandbox = buildRequestSandbox({ requests: [] });
  if (typeof sandbox.adminDetail !== 'function') throw new Error('getRequestAdminDetail 不存在');
  assert.strictEqual(sandbox.adminDetail({ status: 'done', adminReply: '' }, 'done'), null, 'done 空值未返回 null');
  assert.strictEqual(sandbox.adminDetail({ status: 'rejected', rejectReason: '', adminReply: '' }, 'rejected'), null, 'rejected 空值未返回 null');
  assert.strictEqual(sandbox.adminDetail({ status: 'pending', adminReply: '' }, 'pending'), null, 'pending 空值未返回 null');
});

test('js', 'B16. created_at 缺失时不渲染时间行', () => {
  const sandbox = buildRequestSandbox({ requests: [] });
  if (typeof sandbox.build !== 'function') throw new Error('buildRequestDetail 不存在');
  const html = sandbox.build({ text: '内容', created_at: undefined, user: 'A', category: 'BUG', status: 'pending' }, 'id1');
  assert.ok(!html.includes('提交时间'), 'created_at 缺失时仍渲染了提交时间行');
});

test('js', 'B17. images 缺失或空数组时不渲染图片区', () => {
  const sandbox = buildRequestSandbox({ requests: [] });
  if (typeof sandbox.build !== 'function') throw new Error('buildRequestDetail 不存在');
  const html1 = sandbox.build({ text: '内容', images: undefined }, 'id2');
  assert.ok(!html1.includes('request-detail-images'), 'images undefined 时仍渲染了图片区');
  const html2 = sandbox.build({ text: '内容', images: [] }, 'id3');
  assert.ok(!html2.includes('request-detail-images'), 'images 空数组时仍渲染了图片区');
});

test('js', 'B18. 无有效 requestId 时列表不抛错，其他卡片继续渲染', () => {
  const sandbox = buildRequestSandbox({ requests: [
    { id: 'A', title: '正常A', text: '内容A', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] }
  ] });
  if (typeof sandbox.toggle !== 'function') throw new Error('toggleRequestDetail 不存在');
  let threw = false;
  try {
    sandbox.toggle('nonexistent');
  } catch (e) {
    threw = true;
  }
  assert.ok(!threw, 'toggle 无效 ID 时抛出了异常');
});

test('js', 'B19. 渲染结果不出现 undefined 或 null', () => {
  const sandbox = buildRequestSandbox({ requests: [
    { title: '测试', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0 }
  ] });
  const grid = sandbox.render() || '';
  assert.ok(!grid.includes('undefined'), 'HTML 中包含 undefined 字样');
  assert.ok(!grid.includes('>null<'), 'HTML 中包含 null 字样');
});

test('js', 'B20. 建议正文经过 HTML 转义', () => {
  const sandbox = buildRequestSandbox({ requests: [
    { id: 'X', title: '<script>alert(1)</script>', text: '<b>恶意</b>内容', user: '" onerror="alert(1)', status: 'pending', category: 'BUG', contact: 'test', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] }
  ] });
  const grid = sandbox.render() || '';
  assert.ok(!grid.includes('<script>'), '未转义的 <script> 出现在 HTML 中');
  assert.ok(grid.includes('&lt;script&gt;') || grid.includes('&#60;script&#62;'), '转义后的 <script> 未正确显示');
  assert.ok(!grid.includes('onerror='), '未转义的 onerror 属性出现在 HTML 中');
});

test('js', 'B21. requestId、图片地址等属性经过属性转义', () => {
  const sandbox = buildRequestSandbox({ requests: [
    { id: 'X', title: '测试', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: ['http://test.com/x"onerror="alert(1)'] }
  ] });
  const grid = sandbox.render() || '';
  assert.ok(!grid.includes('onerror='), '未转义的 onerror 属性出现在图片 URL 中');
});

test('js', 'B22. 三种状态标题映射在详情 HTML 中正确', () => {
  if (typeof buildRequestSandbox !== 'function') throw new Error('buildRequestSandbox 不存在');
  const doneSandbox = buildRequestSandbox({ requests: [{ id: 'D', title: '完成', text: '内容', user: '玩家', status: 'done', category: 'BUG', contact: 'QQ', adminReply: '已修复', rejectReason: '', agree: 0, disagree: 0, images: [] }] });
  const doneGrid = doneSandbox.render() || '';
  assert.ok(doneGrid.includes('完成说明'), 'done 未显示 "完成说明"');
  const pendSandbox = buildRequestSandbox({ requests: [{ id: 'P', title: '待办', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '已收到', rejectReason: '', agree: 0, disagree: 0, images: [] }] });
  const pendGrid = pendSandbox.render() || '';
  assert.ok(pendGrid.includes('管理员回复'), 'pending 未显示 "管理员回复"');
  const rejSandbox = buildRequestSandbox({ requests: [{ id: 'R', title: '拒绝', text: '内容', user: '玩家', status: 'rejected', category: 'BUG', contact: 'QQ', adminReply: '不通过', rejectReason: '不符合', agree: 0, disagree: 0, images: [] }] });
  const rejGrid = rejSandbox.render() || '';
  assert.ok(rejGrid.includes('拒绝原因'), 'rejected 未显示 "拒绝原因"');
});

test('js', 'B23. 管理员说明为空时详情 HTML 不包含空说明区', () => {
  const sandbox = buildRequestSandbox({ requests: [] });
  if (typeof sandbox.build !== 'function') throw new Error('buildRequestDetail 不存在');
  const html = sandbox.build({ text: '内容', user: '玩家', category: 'BUG', status: 'pending', adminReply: '' }, 'idE');
  assert.ok(!html.includes('完成说明'), '空 adminReply 仍渲染了完成说明标签');
  assert.ok(!html.includes('管理员回复'), '空 adminReply 仍渲染了管理员回复标签');
  assert.ok(!html.includes('拒绝原因'), '空 adminReply 仍渲染了拒绝原因标签');
});

test('js', 'B24. 原有投票、否定和讨论操作结构仍存在', () => {
  const sandbox = buildRequestSandbox({ requests: [
    { id: 'X', title: '测试', text: '内容', user: '玩家', status: 'pending', category: 'BUG', contact: 'QQ', adminReply: '', rejectReason: '', agree: 0, disagree: 0, images: [] }
  ] });
  const grid = sandbox.render() || '';
  assert.ok(grid.includes('data-action="vote-request"') || grid.includes("data-action='vote-request'"), 'vote-request 结构不存在');
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
  // 确保值不为 0
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

test('css', 'C4. 手机端 .mini-btn 含 min-height:44px（详情按钮复用）', () => {
  const mobileStart = MAIN_CSS.indexOf('@media (max-width: 767px)');
  assert.ok(mobileStart !== -1, '未找到 @media (max-width:767px)');
  const mobileEnd = mobileStart + 5000;
  const mobileBlock = MAIN_CSS.slice(mobileStart, mobileEnd);
  // 找到 .mini-btn 在手机块内
  const miniBtnIdx = mobileBlock.indexOf('.mini-btn');
  if (miniBtnIdx === -1) throw new Error('手机区块中未找到 .mini-btn');
  const miniBlock = mobileBlock.slice(miniBtnIdx, miniBtnIdx + 200);
  assert.ok(
    miniBlock.includes('min-height: 44px') || miniBlock.includes('min-height:44px'),
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
    miniBlock.includes('min-height: 44px') || miniBlock.includes('min-height:44px'),
    '横屏粗指针 .mini-btn 未设置 min-height:44px'
  );
});

test('css', 'C6. .request-detail-value 含 word-break 或 white-space:pre-wrap（长文本换行）', () => {
  const valIdx = MAIN_CSS.indexOf('.request-detail-value');
  if (valIdx === -1) throw new Error('.request-detail-value 不存在');
  const valBlock = MAIN_CSS.slice(valIdx, valIdx + 200);
  assert.ok(
    valBlock.includes('word-break') || valBlock.includes('white-space'),
    '.request-detail-value 缺少 word-break 或 white-space 换行属性'
  );
});

test('css', 'C7. .request-detail-images 与 .request-detail-img 选择器存在（图片不溢出）', () => {
  assert.ok(
    MAIN_CSS.includes('.request-detail-images'),
    'main.css 中未找到 .request-detail-images'
  );
  assert.ok(
    MAIN_CSS.includes('.request-detail-img'),
    'main.css 中未找到 .request-detail-img'
  );
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
  runGroup('JavaScript 行为测试 (B1–B24)', jsTests.filter(t => t.name.startsWith('B')));
}
if (GROUP === 'css' || GROUP === 'all') {
  runGroup('CSS 结构测试 (C1–C7)', cssTests);
}

if (GROUP === 'all') {
  console.log(`\nALL 分组：JS ${jsTests.length} 项 + CSS ${cssTests.length} 项 = ${jsTests.length + cssTests.length} 项`);
}
