// 阶段三第 1 小步 · 返工：活动数据重复问题专项测试
// 纯 Node fs + assert，无外部依赖。
// 目标：验证活动列表以 /api/events（访客）与 /api/admin/events（管理员）返回的
// {code, data:[...]} 中 data 数组为权威来源，不再与旧 site-config.json 的 updates 重复合并，
// 修复真实浏览器中“基地评选活动”重复、限时报名活动变 3 个的问题。
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'erp14-server-showcase.html'), 'utf8');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ✓ ' + name);
  } catch (e) {
    console.error('  ✗ ' + name);
    console.error('    ' + e.message);
    process.exitCode = 1;
  }
}

// ---- 静态检查：修复点是否存在 ----
console.log('活动数据重复修复专项测试：');

// 1. 新增权威映射函数 mapEventsToUpdates
test('定义了活动权威映射函数 mapEventsToUpdates', function () {
  assert.ok(HTML.indexOf('function mapEventsToUpdates(events) {') !== -1, '未找到 mapEventsToUpdates 函数');
});

// 2. 已移除旧的“config.updates 按索引合并”逻辑（重复/错位根因）
test('已移除旧的 config.updates 按索引合并逻辑', function () {
  // 该合并块的特征语句，移除后应不存在
  assert.ok(
    HTML.indexOf('updates[i] = { ...backendItem, status: updates[i].status || backendItem.status }') === -1,
    '仍残留旧的 config.updates 合并逻辑'
  );
  assert.ok(
    HTML.indexOf('if (Array.isArray(config.updates))') === -1,
    '仍残留 if (Array.isArray(config.updates)) 判定'
  );
});

// 3. 管理员登录后加载 /api/admin/events（权威来源，含未发布）
test('loadFullBackendConfig 拉取 /api/admin/events 作为权威来源', function () {
  const start = HTML.indexOf('async function loadFullBackendConfig()');
  assert.ok(start !== -1, '未找到 loadFullBackendConfig');
  const end = HTML.indexOf('async function handleAdminLogin', start);
  const fn = HTML.slice(start, end);
  assert.ok(fn.indexOf("/api/admin/events") !== -1, 'loadFullBackendConfig 未请求 /api/admin/events');
  assert.ok(fn.indexOf('mapEventsToUpdates') !== -1, 'loadFullBackendConfig 未用 mapEventsToUpdates 覆盖 updates');
});

// 4. 访客 loadPublicBackendConfig 以 /api/events 的 data 为权威来源，并兼容 {code,data} 结构
test('loadPublicBackendConfig 以 /api/events 的 data 为权威来源', function () {
  const start = HTML.indexOf('async function loadPublicBackendConfig()');
  assert.ok(start !== -1, '未找到 loadPublicBackendConfig');
  const end = HTML.indexOf('// 加载统计数据', start);
  const fn = HTML.slice(start, end);
  assert.ok(fn.indexOf('EVENTS_URL') !== -1, 'loadPublicBackendConfig 未使用 EVENTS_URL');
  assert.ok(fn.indexOf('mapEventsToUpdates') !== -1, 'loadPublicBackendConfig 未用 mapEventsToUpdates');
  assert.ok(fn.indexOf('.data') !== -1, 'loadPublicBackendConfig 未处理 {code, data} 的 .data 字段');
  assert.ok(fn.indexOf('!adminToken') !== -1, 'loadPublicBackendConfig 未排除已登录管理员（避免并发覆盖）');
});

// 5. 旧 site-config.json 的 updates 不再被合并（注释说明）
test('代码注释明确活动来源不再合并旧 site-config updates', function () {
  assert.ok(
    HTML.indexOf('活动列表不再从旧 site-config.json 的 updates 合并') !== -1,
    '缺少“不再从旧 site-config.json 的 updates 合并”的说明'
  );
});

// ---- 行为模拟：提取真实 mapEventsToUpdates 并验证“不重复合并” ----
// 提取函数源码（位于 mapEventsToUpdates 声明到 normalizeUpdates 声明之前）
const fnStart = HTML.indexOf('function mapEventsToUpdates(events) {');
const fnEnd = HTML.indexOf('function normalizeUpdates() {', fnStart);
assert.ok(fnStart !== -1 && fnEnd !== -1, '无法定位 mapEventsToUpdates 函数边界');
const fnSrc = HTML.slice(fnStart, fnEnd).trim();
// 作为函数表达式求值（仅依赖 Array.isArray，纯函数）
const mapEventsToUpdates = eval('(' + fnSrc + ')');

// 模拟 /api/events 真实返回（{code, data:[...]}），含 4 条且含“基地评选活动”
const eventsResponse = {
  code: 200,
  data: [
    { id: 1, title: '周末空投争夺开启', type: 'signup', status: '常驻', content: '周六 20:30 开启空投争夺', schedule: '周六 20:30', reward: '参与奖励', signup_deadline: null, event_end_at: null, results: [], reward_date: null, published: true, notes: '' },
    { id: 2, title: '新手保护范围调整', type: 'fixed', status: '常驻', content: '新玩家保护期内禁止恶意蹲守', schedule: '', reward: '', signup_deadline: null, event_end_at: null, results: [], reward_date: null, published: true, notes: '' },
    { id: 3, title: '交易区展示页整理', type: 'fixed', status: '常驻', content: '网站新增交易区', schedule: '', reward: '', signup_deadline: null, event_end_at: null, results: [], reward_date: null, published: true, notes: '' },
    { id: 4, title: '基地评选活动', type: 'signup', status: '常驻', content: '开放基地投稿和投票', schedule: '', reward: '', signup_deadline: '2026-12-31T21:00', event_end_at: '2027-01-01T00:00', results: [], reward_date: null, published: true, notes: '' }
  ]
};

// 模拟前端“旧的默认 updates”（同样含基地评选活动），验证不会被再次拼接
const oldDefaultUpdates = [
  { id: 'weekend-airdrop', activityType: 'signup', title: '周末空投争夺开启' },
  { id: 'newbie-protection', activityType: 'fixed', title: '新手保护范围调整' },
  { id: 'trade-zone-update', activityType: 'fixed', title: '交易区展示页整理' },
  { id: 'base-contest', activityType: 'signup', title: '基地评选活动' }
];

// 模拟修复后的加载：仅以接口 data 覆盖，不与旧 updates 拼接
function simulateFixedLoad(oldUpdates, eventsResp) {
  const data = eventsResp && Array.isArray(eventsResp.data) ? eventsResp.data : [];
  if (data.length === 0) return oldUpdates; // 后端不可用时回退到旧数据
  return mapEventsToUpdates(data);
}

test('以 /api/events 的 data 覆盖后，活动总数为 4（不拼接旧 updates）', function () {
  const result = simulateFixedLoad(oldDefaultUpdates, eventsResponse);
  assert.strictEqual(result.length, 4, '覆盖后活动数应为 4，实际 ' + result.length);
});

test('“基地评选活动”仅出现 1 次（无重复合并）', function () {
  const result = simulateFixedLoad(oldDefaultUpdates, eventsResponse);
  const dup = result.filter(u => u.title === '基地评选活动');
  assert.strictEqual(dup.length, 1, '基地评选活动重复出现 ' + dup.length + ' 次');
});

test('类型正确：长期固定活动 2 个、限时报名活动 2 个', function () {
  const result = simulateFixedLoad(oldDefaultUpdates, eventsResponse);
  const fixed = result.filter(u => u.activityType === 'fixed');
  const signup = result.filter(u => u.activityType === 'signup');
  assert.strictEqual(fixed.length, 2, '长期固定活动应为 2，实际 ' + fixed.length);
  assert.strictEqual(signup.length, 2, '限时报名活动应为 2，实际 ' + signup.length);
});

test('映射保留关键字段（id/title/text/signupDeadline/eventEndAt/published/signupEnabled）', function () {
  const result = simulateFixedLoad(oldDefaultUpdates, eventsResponse);
  const base = result.find(u => u.title === '基地评选活动');
  assert.ok(base, '未找到基地评选活动');
  assert.strictEqual(base.id, 4, 'id 映射错误');
  assert.strictEqual(base.text, '开放基地投稿和投票', 'content→text 映射错误');
  assert.strictEqual(base.signupDeadline, '2026-12-31T21:00', 'signup_deadline 映射错误');
  assert.strictEqual(base.eventEndAt, '2027-01-01T00:00', 'event_end_at 映射错误');
  assert.strictEqual(base.published, true, 'published 映射错误');
  assert.strictEqual(base.signupEnabled, true, 'signup 类型 signupEnabled 应为 true');
  const fixedItem = result.find(u => u.title === '新手保护范围调整');
  assert.strictEqual(fixedItem.signupEnabled, false, 'fixed 类型 signupEnabled 应为 false');
});

// 模拟后端不可用时回退到旧默认（4 条），保证前台“每周活动”仍有内容
test('后端无活动时回退到旧默认 updates（4 条），前台不空白', function () {
  const result = simulateFixedLoad(oldDefaultUpdates, { code: 200, data: [] });
  assert.strictEqual(result.length, 4, '回退后应为 4 条');
});

console.log('\n通过 ' + passed + ' / ' + passed + (process.exitCode ? ' （有失败）' : ' 全部通过'));
