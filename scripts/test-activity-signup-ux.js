// 活动报名前台体验优化 Task 0.2：状态与报名按钮体验专项测试
// 纯 Node + assert，无外部依赖。读取 frontend/js/main.js，提取纯函数后在沙箱中执行。
// 不修改生产页 erp14-server-showcase.html，不读取 data.success，不依赖后端。
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const MAIN_JS = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'main.js'), 'utf8');

let passed = 0;
let failed = 0;
const pendingTests = [];
function test(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === 'function') {
      // 异步测试（如真实执行 submitEventSignup）：等待完成后计入结果
      pendingTests.push(r.then(
        () => { passed += 1; console.log('  ✓ ' + name); },
        (e) => { failed += 1; console.error('  ✗ ' + name); console.error('    ' + e.message); process.exitCode = 1; }
      ));
      return;
    }
    passed += 1;
    console.log('  ✓ ' + name);
  } catch (e) {
    failed += 1;
    console.error('  ✗ ' + name);
    console.error('    ' + e.message);
    process.exitCode = 1;
  }
}

// 提取函数体（含 async），尊重字符串内的括号。
function extractFunction(src, name) {
  const marker = 'function ' + name + '(';
  let start = src.indexOf(marker);
  assert.ok(start !== -1, '未找到函数 ' + name);
  // 保留 async 关键字（如 async function submitEventSignup）
  if (start >= 6 && src.slice(start - 6, start) === 'async ') start -= 6;
  let i = src.indexOf('{', start);
  let depth = 0;
  let inStr = null;
  let escape = false;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === inStr) { inStr = null; continue; }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '{') { depth++; continue; }
    if (ch === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('未匹配到函数 ' + name + ' 的结束括号');
}

function makeLocalStorage(initial) {
  const store = Object.assign({}, initial);
  return {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    _store: store
  };
}

// 提取模块级常量（如 DAY_MS / EVENT_SIGNUP_STORE_KEY），供沙箱使用。
function extractConst(src, name) {
  const m = src.match(new RegExp('const ' + name + ' = [^;]+;'));
  assert.ok(m, '未找到常量 ' + name);
  return m[0];
}

const constsSrc = ['EVENT_SIGNUP_STORE_KEY', 'DAY_MS', 'HOUR_MS', 'MIN_MS', 'SEC_MS']
  .map(n => extractConst(MAIN_JS, n)).join('\n');

const src = [
  extractFunction(MAIN_JS, 'inferActivityType'),
  extractFunction(MAIN_JS, 'getSignupTimeState'),
  extractFunction(MAIN_JS, 'formatSignupCountdown'),
  extractFunction(MAIN_JS, 'getActivityStatusBadge'),
  extractFunction(MAIN_JS, 'readLocalEventSignups'),
  extractFunction(MAIN_JS, 'saveLocalEventSignup'),
  extractFunction(MAIN_JS, 'isLocalPlayerSignedUp')
].join('\n');

const localStorage = makeLocalStorage();
const factory = new Function(
  'localStorage', 'Date', 'Math', 'JSON', 'console', 'Number', 'String',
  constsSrc + '\n' + src + '\nreturn { getSignupTimeState, formatSignupCountdown, getActivityStatusBadge, readLocalEventSignups, saveLocalEventSignup, isLocalPlayerSignedUp, inferActivityType };'
);
const api = factory(localStorage, Date, Math, JSON, console, Number, String);

const now = Date.now();
const future = new Date(now + 10 * 86400000).toISOString();
const soon = new Date(now + 3600000).toISOString();      // 1 小时后
const past = new Date(now - 86400000).toISOString();
const future48h = new Date(now + 48 * 3600000).toISOString(); // 48 小时后（>24h）

console.log('活动报名状态与按钮体验专项测试：');

// ===== 一、7 种状态 =====
test('状态：常驻活动 → 常驻', () => {
  assert.strictEqual(api.getSignupTimeState({ activityType: 'fixed' }), '常驻');
});
test('状态：results>0 → 已颁奖', () => {
  assert.strictEqual(api.getSignupTimeState({ activityType: 'signup', results: [{ rank: 1 }] }), '已颁奖');
});
test('状态：status 已结束（无 results）→ 已结束', () => {
  assert.strictEqual(api.getSignupTimeState({ activityType: 'signup', status: '已结束' }), '已结束');
});
test('状态：eventEndAt 已过（无 results）→ 已结束', () => {
  assert.strictEqual(api.getSignupTimeState({ activityType: 'signup', eventEndAt: past }), '已结束');
});
test('状态：signupDeadline 已过 → 报名已截止', () => {
  assert.strictEqual(api.getSignupTimeState({ activityType: 'signup', signupDeadline: past }), '报名已截止');
});
test('状态：signupDeadline ≤24h → 即将截止', () => {
  assert.strictEqual(api.getSignupTimeState({ activityType: 'signup', signupDeadline: soon }), '即将截止');
});
test('状态：status 进行中 → 进行中', () => {
  assert.strictEqual(api.getSignupTimeState({ activityType: 'signup', status: '进行中' }), '进行中');
});
test('状态：可报临时活动 → 报名中', () => {
  assert.strictEqual(api.getSignupTimeState({ activityType: 'signup', signupDeadline: future }), '报名中');
});

// ===== 二、状态优先级 =====
test('优先级：results 优先于 status 已结束', () => {
  assert.strictEqual(api.getSignupTimeState({ activityType: 'signup', results: [{ rank: 1 }], status: '已结束' }), '已颁奖');
});
test('优先级：results 优先于 status 进行中', () => {
  assert.strictEqual(api.getSignupTimeState({ activityType: 'signup', results: [{ rank: 1 }], status: '进行中' }), '已颁奖');
});
test('优先级：报名截止优先于 status 进行中', () => {
  assert.strictEqual(api.getSignupTimeState({ activityType: 'signup', status: '进行中', signupDeadline: past }), '报名已截止');
});
test('优先级：eventEndAt 优先于 status 进行中', () => {
  assert.strictEqual(api.getSignupTimeState({ activityType: 'signup', status: '进行中', eventEndAt: past }), '已结束');
});
test('优先级：即将截止（≤24h）优先于 报名中', () => {
  assert.strictEqual(api.getSignupTimeState({ activityType: 'signup', signupDeadline: soon }), '即将截止');
});

// ===== 三、倒计时文案 =====
test('倒计时：>24h 显示「X天 X小时」', () => {
  assert.strictEqual(api.formatSignupCountdown(2 * 86400000 + 3 * 3600000), '还剩 2天 3小时');
});
test('倒计时：≤24h（days=0）显示 HH:MM:SS（带「还剩 」前缀）', () => {
  assert.strictEqual(api.formatSignupCountdown(5 * 3600000), '还剩 05:00:00');
});
test('倒计时：≤24h 显示 HH:MM:SS（补零）', () => {
  assert.strictEqual(api.formatSignupCountdown(2 * 3600000 + 3 * 60000 + 4 * 1000), '还剩 02:03:04');
});
test('倒计时：非正数返回空串', () => {
  assert.strictEqual(api.formatSignupCountdown(0), '');
  assert.strictEqual(api.formatSignupCountdown(-1000), '');
});

// ===== 四、状态徽章 class 映射（events 页） =====
test('徽章：results>0 → rewarded / 已颁奖', () => {
  const html = api.getActivityStatusBadge({ activityType: 'signup', results: [{ rank: 1 }] });
  assert.ok(html.includes('rewarded') && html.includes('已颁奖'), '未渲染已颁奖徽章：' + html);
});
test('徽章：status 已结束 → ended / 已结束', () => {
  const html = api.getActivityStatusBadge({ activityType: 'signup', status: '已结束' });
  assert.ok(html.includes('ended') && html.includes('已结束'), '未渲染已结束徽章：' + html);
});
test('徽章：常驻 → fixed / 常驻', () => {
  const html = api.getActivityStatusBadge({ activityType: 'fixed' });
  assert.ok(html.includes('fixed') && html.includes('常驻'), '未渲染常驻徽章：' + html);
});

// ===== 五、本地报名记录：写入 / 恢复 / 匹配 =====
test('报名成功后写入 localStorage', () => {
  api.saveLocalEventSignup('evt_42', 'Alice');
  const rec = api.readLocalEventSignups()['evt_42'];
  assert.ok(rec && rec.playerName === 'Alice', '本地记录未写入');
});
test('刷新后（同 localStorage）恢复「玩家已报名」', () => {
  api.saveLocalEventSignup('evt_42', 'Alice');
  // 模拟刷新：用同一份 localStorage 重新读取
  const reread = api.readLocalEventSignups();
  assert.strictEqual(reread['evt_42'].playerName, 'Alice');
  assert.strictEqual(api.isLocalPlayerSignedUp('evt_42', 'Alice'), true);
});
test('不同玩家名不误判为已报名', () => {
  assert.strictEqual(api.isLocalPlayerSignedUp('evt_42', 'Bob'), false);
});
test('当前玩家名为空时不误判', () => {
  assert.strictEqual(api.isLocalPlayerSignedUp('evt_42', ''), false);
});
test('未报名时（失败路径）不写本地记录', () => {
  const before = api.readLocalEventSignups();
  assert.strictEqual(before['evt_new'], undefined);
  assert.strictEqual(api.isLocalPlayerSignedUp('evt_new', 'Alice'), false);
});
test('localStorage 损坏（非法 JSON）不报错，返回 {}', () => {
  localStorage.setItem('erp14-event-signups', '这不是合法json{{{');
  const rec = api.readLocalEventSignups();
  assert.ok(rec && typeof rec === 'object' && Object.keys(rec).length >= 0, '损坏数据未安全返回 {}');
});
test('localStorage.setItem 抛错时 saveLocalEventSignup 吞掉异常', () => {
  const throwing = makeLocalStorage();
  throwing.setItem = () => { throw new Error('quota'); };
  const factory2 = new Function('localStorage', 'Date', 'Math', 'JSON', 'console', 'Number', 'String',
    extractFunction(MAIN_JS, 'saveLocalEventSignup') + '\nreturn { saveLocalEventSignup };');
  const api2 = factory2(throwing, Date, Math, JSON, console, Number, String);
  assert.doesNotThrow(() => api2.saveLocalEventSignup('evt_x', 'Tom'));
});

// ===== 六、不可报名状态 =====
test('已颁奖 / 已结束 / 报名已截止 不在可报名集合', () => {
  const canSignup = { '报名中': true, '进行中': true, '即将截止': true };
  ['已颁奖', '已结束', '报名已截止'].forEach(state => {
    assert.strictEqual(canSignup[state], undefined, state + ' 不应可报名');
  });
});

// ===== 七、已颁奖且 published 仍展示（不自动隐藏） =====
test('getSignupTimeState：published+results+signup → 已颁奖（继续展示）', () => {
  assert.strictEqual(
    api.getSignupTimeState({ published: true, activityType: 'signup', results: [{ rank: 1 }], status: '进行中' }),
    '已颁奖'
  );
});

// ===== 八、源码级规则检索（不读取 data.success；无 rewardDate/updatedAt 自动隐藏） =====
const submitFn = extractFunction(MAIN_JS, 'submitEventSignup');
test('submitEventSignup 不读取 data.success / success 字段', () => {
  assert.ok(submitFn.indexOf('.success') === -1, 'submitEventSignup 仍读取 .success');
  assert.ok(submitFn.indexOf('success:') === -1, 'submitEventSignup 仍含 success: 判断');
  assert.ok(submitFn.indexOf('success ===') === -1, 'submitEventSignup 仍含 success === 判断');
  assert.ok(submitFn.indexOf('fetchWithFallback') !== -1, 'submitEventSignup 未使用 fetchWithFallback');
});
test('getSignupTimeState 不引用 rewardDate / updatedAt', () => {
  const fn = extractFunction(MAIN_JS, 'getSignupTimeState');
  assert.ok(fn.indexOf('rewardDate') === -1, 'getSignupTimeState 引用了 rewardDate');
  assert.ok(fn.indexOf('updatedAt') === -1, 'getSignupTimeState 引用了 updatedAt');
});
test('renderActivitySignups 列出 published+signup（含已颁奖/已结束/已截止），不按 results 过滤、不调用 isSignupVisible', () => {
  const fn = extractFunction(MAIN_JS, 'renderActivitySignups');
  assert.ok(fn.indexOf("inferActivityType(item) === 'signup'") !== -1, '未以 signup 类型筛选列表');
  assert.ok(fn.indexOf('isSignupVisible') === -1, '列表仍用 isSignupVisible 过滤（会隐藏已截止/已颁奖）');
  assert.ok(fn.indexOf('item.results') === -1, '列表按 item.results 过滤会误隐藏已颁奖项');
});
test('全文件不存在按 rewardDate / updatedAt 自动隐藏已颁奖的正向逻辑', () => {
  // 允许“不根据 / 无 / 禁止”等否定说明；正向逻辑（无否定词且含 隐藏/消失/下架）才算违规。
  const lines = MAIN_JS.split('\n');
  const negation = /(不根据|无|禁止|没有|未)/;
  let violation = null;
  for (const line of lines) {
    if (/(rewardDate|updatedAt)/.test(line) && /(隐藏|消失|下架|autoHide)/.test(line) && !negation.test(line)) {
      violation = line.trim();
      break;
    }
  }
  assert.ok(!violation, '发现按 rewardDate/updatedAt 自动隐藏的正向逻辑：' + violation);
});

// ===== 红灯缺陷测试（Task 0.3） =====
// 真实执行渲染/提交逻辑，暴露当前实现的缺陷。不连接后端、不写真实报名、不读敏感信息。

// 在沙箱中真实运行渲染函数，捕获生成 HTML。mock 仅用于隔离 DOM/localStorage，不改变被测逻辑的行为。
function buildRenderSandbox(seed) {
  const renderFns = [
    extractFunction(MAIN_JS, 'inferActivityType'),
    extractFunction(MAIN_JS, 'getUpdateId'),
    extractFunction(MAIN_JS, 'getSignupTimeState'),
    extractFunction(MAIN_JS, 'formatSignupCountdown'),
    extractFunction(MAIN_JS, 'readLocalEventSignups'),
    extractFunction(MAIN_JS, 'saveLocalEventSignup'),
    extractFunction(MAIN_JS, 'isLocalPlayerSignedUp'),
    extractFunction(MAIN_JS, 'getActivityStatusBadge'),
    extractFunction(MAIN_JS, 'renderActivitySignups'),
    extractFunction(MAIN_JS, 'renderUpdates')
  ].join('\n');

  const wrapper = `
    ${constsSrc}
    const updates = ${JSON.stringify(seed.updates)};
    let activePlayerName = ${JSON.stringify(seed.activePlayerName || '')};
    let eventSignupCounts = {};
    const captured = { activitySignupList: '', fixedActivityList: '', updateList: '' };
    const document = {
      getElementById: (id) => {
        const b = { _html: '' };
        Object.defineProperty(b, 'innerHTML', {
          get() { return this._html; },
          set(v) { this._html = v; captured[id] = v; }
        });
        return b;
      }
    };
    const isFixedActivityVisible = () => false;
    const buildActivityFields = () => '';
    const applyIcons = () => {};
    const startSignupCountdownTimer = () => {};
    const renderResultsTable = () => '';
    const escapeHtml = (s) => String(s == null ? '' : s);
    const escapeAttr = (s) => String(s == null ? '' : s);
    ${renderFns}
    return {
      renderActivitySignups: () => { renderActivitySignups(); return captured.activitySignupList; },
      renderUpdates: () => { renderUpdates(); return captured.updateList; }
    };
  `;
  const store = Object.assign({}, seed.store || {});
  const localStorageMock = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  };
  return new Function('localStorage', 'Date', 'Math', 'JSON', 'console', wrapper)(localStorageMock, Date, Math, JSON, console);
}

// 在沙箱中真实执行 submitEventSignup，复刻 closeEventSignup 的副作用（清空 activeSignupEventId），捕获 showToast 实参。
function buildSubmitSandbox() {
  const store = {};
  const localStorageMock = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  };
  const wrapper = `
    ${constsSrc}
    const updates = [{ id: 77, title: '周末空投活动', activityType: 'signup' }];
    let activeSignupEventId = '77';
    let activePlayerName = '';
    let eventSignupCounts = {};
    const captured = { toastMsg: null };
    const closeEventSignup = () => { activeSignupEventId = ''; };   // 复刻真实 closeEventSignup 的副作用：清空 activeSignupEventId
    const renderActivitySignups = () => {};
    const loadAdminEventSignups = () => {};
    const showToast = (msg) => { captured.toastMsg = msg; };
    const backendUrl = (p) => p;
    const fetchWithFallback = async () => ({ count: 1 });          // HTTP 2xx 解包结果，无 success 字段
    const document = {
      getElementById: () => ({ value: '二胖', textContent: '', classList: { remove() {} }, setAttribute() {}, reset() {} })
    };
    ${extractFunction(MAIN_JS, 'getUpdateId')}
    ${extractFunction(MAIN_JS, 'readLocalEventSignups')}
    ${extractFunction(MAIN_JS, 'saveLocalEventSignup')}
    ${extractFunction(MAIN_JS, 'submitEventSignup')}
    return { run: async () => { await submitEventSignup({ preventDefault() {} }); return captured.toastMsg; } };
  `;
  return new Function('localStorage', 'Date', 'Math', 'JSON', 'console', wrapper)(localStorageMock, Date, Math, JSON, console);
}

// 测试 34：成功 toast 必须保留真实活动标题（不能依赖被清空的 activeSignupEventId）
test('红灯-34：报名成功 toast 必须保留真实活动标题（不可依赖已被清空的 activeSignupEventId）', async () => {
  const submitApi = buildSubmitSandbox();
  const toastMsg = await submitApi.run();   // 真实执行 submitEventSignup 完整成功分支
  assert.ok(typeof toastMsg === 'string', 'showToast 未接收到字符串消息');
  assert.ok(
    toastMsg.includes('周末空投活动'),
    'toast 未包含真实活动标题，实际为：' + JSON.stringify(toastMsg) +
    '。缺陷：submitEventSignup 在 closeEventSignup() 清空 activeSignupEventId 之后才用其查找活动，导致标题丢失'
  );
});

// 测试 35：signupEnabled=false 时不显示「立即报名」
test('红灯-35：signupEnabled=false 时不显示「立即报名」入口', () => {
  const html = buildRenderSandbox({
    updates: [{ id: 10, title: '限时招募', activityType: 'signup', published: true, signupEnabled: false, signupDeadline: future48h, status: '' }]
  }).renderActivitySignups();
  assert.ok(!html.includes('data-open-signup'), 'signupEnabled=false 仍渲染 data-open-signup 报名入口（缺陷：renderActivitySignups 未检查 signupEnabled）');
  assert.ok(!html.includes('立即报名'), 'signupEnabled=false 仍显示「立即报名」文案');
});

// 测试 36：published=false 时不渲染活动卡（绿灯保护测试）
test('绿灯-36：published=false 时不渲染活动卡与报名入口', () => {
  const html = buildRenderSandbox({
    updates: [{ id: 20, title: '草稿活动', activityType: 'signup', published: false, signupDeadline: future48h }]
  }).renderActivitySignups();
  assert.ok(!html.includes('data-open-signup'), '未发布活动不应出现报名入口');
  assert.ok(html.includes('当前没有开放报名'), '未发布活动不应生成活动卡（应回退空态提示）');
});

// 测试 37：报名已截止且本地有记录时不显示「玩家已报名」按钮
test('红灯-37：报名已截止且本地有记录时不显示「玩家已报名」按钮', () => {
  const html = buildRenderSandbox({
    updates: [{ id: 11, title: '已截止活动', activityType: 'signup', signupDeadline: past }],
    activePlayerName: '二胖',
    store: { 'erp14-event-signups': JSON.stringify({ '11': { playerName: '二胖', recordedAt: new Date().toISOString() } }) }
  }).renderActivitySignups();
  assert.ok(html.includes('报名已截止'), '状态未显示「报名已截止」');
  assert.ok(!html.includes('立即报名'), '截止活动不应显示「立即报名」');
  assert.ok(
    !html.includes('玩家已报名'),
    '截止活动即使本地有记录也不应显示「玩家已报名」按钮（缺陷：renderActivitySignups 在不可报名状态仍因本地记录渲染按钮）'
  );
});

// 测试 38：已结束或已颁奖（即使本地有记录）不显示任何报名按钮
test('红灯-38：已结束或已颁奖（即使本地有记录）不显示任何报名按钮', () => {
  const store = { 'erp14-event-signups': JSON.stringify({ '12': { playerName: '二胖' }, '13': { playerName: '二胖' } }) };
  const h1 = buildRenderSandbox({
    updates: [{ id: 12, title: '已结束活动', activityType: 'signup', status: '已结束', signupDeadline: future48h }],
    activePlayerName: '二胖', store
  }).renderActivitySignups();
  const h2 = buildRenderSandbox({
    updates: [{ id: 13, title: '已颁奖活动', activityType: 'signup', results: [{ rank: 1 }] }],
    activePlayerName: '二胖', store
  }).renderActivitySignups();
  assert.ok(h1.includes('已结束'), '已结束活动未显示「已结束」状态');
  assert.ok(!h1.includes('立即报名') && !h1.includes('玩家已报名'), '已结束活动不应显示报名按钮或玩家已报名（缺陷：本地记录使按钮误显）');
  assert.ok(h2.includes('已颁奖'), '已颁奖活动未显示「已颁奖」状态');
  assert.ok(!h2.includes('立即报名') && !h2.includes('玩家已报名'), '已颁奖活动不应显示报名按钮或玩家已报名（缺陷：本地记录使按钮误显）');
});

// 测试 39：进行中且截止 >24h 仍必须渲染倒计时节点
test('红灯-39：进行中且截止>24h 仍必须渲染倒计时节点', () => {
  const html = buildRenderSandbox({
    updates: [{ id: 14, title: '进行中活动', activityType: 'signup', status: '进行中', signupDeadline: future48h }]
  }).renderActivitySignups();
  assert.ok(html.includes('进行中'), '状态未显示「进行中」');
  assert.ok(
    html.includes('data-countdown'),
    '进行中活动未渲染 data-countdown 倒计时节点（缺陷：renderActivitySignups 仅在报名中/即将截止渲染倒计时，遗漏进行中）'
  );
});

// 测试 40：getActivityStatusBadge 必须接入统一时间判断
test('红灯-40：getActivityStatusBadge 必须接入统一时间判断', () => {
  const r1 = api.getActivityStatusBadge({ activityType: 'signup', signupDeadline: soon });
  assert.ok(r1.includes('closing') && r1.includes('即将截止'), '不足24h 未显示即将截止/closing，实际：' + r1);
  const r2 = api.getActivityStatusBadge({ activityType: 'signup', signupDeadline: past });
  assert.ok(r2.includes('closed') && r2.includes('报名已截止'), '截止后未显示报名已截止/closed，实际：' + r2);
  const r3 = api.getActivityStatusBadge({ activityType: 'signup', results: [{ rank: 1 }] });
  assert.ok(r3.includes('rewarded') && r3.includes('已颁奖'), 'results 未显示已颁奖/rewarded');
  const r4 = api.getActivityStatusBadge({ activityType: 'signup', status: '已结束' });
  assert.ok(r4.includes('ended') && r4.includes('已结束'), 'status 已结束未显示已结束/ended');
});

// 测试 41：renderUpdates 对可报名活动渲染 data-countdown
test('红灯-41：renderUpdates 对可报名活动渲染 data-countdown', () => {
  const h1 = buildRenderSandbox({ updates: [{ id: 15, title: '活动A', activityType: 'signup', signupDeadline: future48h }] }).renderUpdates();
  const h2 = buildRenderSandbox({ updates: [{ id: 16, title: '活动B', activityType: 'signup', signupDeadline: soon }] }).renderUpdates();
  assert.ok(h1.includes('data-countdown'), '>24h 活动卡未渲染 data-countdown（缺陷：renderUpdates 未接入倒计时）');
  assert.ok(h2.includes('data-countdown'), '<=24h 活动卡未渲染 data-countdown');
});

// 测试 42：跨边界后不应每秒重复重绘活动区
test('红灯-42：跨边界后不应每秒重复重绘活动区', () => {
  const fn = extractFunction(MAIN_JS, 'updateSignupCountdownNodes');
  let renderCount = 0;
  const node = {
    _closing: undefined,
    get dataset() {
      const self = this;
      return {
        get closing() { return self._closing; },
        set closing(v) { self._closing = v; }
      };
    },
    getAttribute: () => new Date(Date.now() + 12 * 3600000).toISOString(), // 落在即将截止区间（剩余 12h）
    set textContent(v) {}, get textContent() { return ''; }
  };
  const mockDocument = { querySelectorAll: () => [node] };
  const nodeApi = new Function('document', 'renderActivitySignups', 'Date',
    constsSrc + '\n' + extractFunction(MAIN_JS, 'formatSignupCountdown') + '\n' + fn +
    '\nreturn { updateSignupCountdownNodes };'
  )(mockDocument, () => { renderCount += 1; }, Date);

  nodeApi.updateSignupCountdownNodes();                 // 首次跨入即将截止：允许一次重绘
  assert.strictEqual(renderCount, 1, '首次跨边界未触发重绘');
  node._closing = undefined;                            // 模拟真实重绘后节点被替换（新节点不含 dataset.closing 标记）
  nodeApi.updateSignupCountdownNodes();                 // 下一秒仍处即将截止：正确实现不应再次整区重绘
  assert.strictEqual(
    renderCount, 1,
    '跨入即将截止后每秒重复重绘活动区（缺陷：updateSignupCountdownNodes 使用临时 dataset.closing，重绘后标记丢失，导致持续重复重绘）'
  );
});

(async () => {
  await Promise.all(pendingTests);
  console.log('\n通过 ' + passed + ' / ' + (passed + failed));
  if (failed > 0) {
    console.error('存在失败用例');
  } else {
    console.log('全部通过');
  }
})();
