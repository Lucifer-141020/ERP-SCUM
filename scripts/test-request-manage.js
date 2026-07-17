// 阶段三第 2 小步：建议处理页面专项测试
// 纯 Node fs + assert，无外部依赖。
// 目标：验证建议处理面板按状态分三区展示，不破坏已有功能。
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

console.log('建议处理页面专项测试：');

// ---- 1. 面板标题 ----
test('renderRequestManagePanel 标题为"建议处理"', function () {
  const start = HTML.indexOf('function renderRequestManagePanel()');
  assert.ok(start !== -1, '未找到 renderRequestManagePanel');
  const end = HTML.indexOf('function formatBytes', start);
  const fn = HTML.slice(start, end);
  assert.ok(fn.indexOf('建议处理') !== -1, '面板标题不包含"建议处理"');
});

// ---- 2. 三个分区存在，顺序：待讨论 → 已完成 → 已拒绝 ----
test('renderRequestManagePanel 包含"待讨论 / 新提交建议"分区', function () {
  const start = HTML.indexOf('function renderRequestManagePanel()');
  const end = HTML.indexOf('function formatBytes', start);
  const fn = HTML.slice(start, end);
  assert.ok(fn.indexOf('待讨论') !== -1, '缺少"待讨论"分区');
  assert.ok(fn.indexOf('新提交建议') !== -1, '缺少"新提交建议"分区');
});

test('renderRequestManagePanel 包含"已完成"分区', function () {
  const start = HTML.indexOf('function renderRequestManagePanel()');
  const end = HTML.indexOf('function formatBytes', start);
  const fn = HTML.slice(start, end);
  assert.ok(fn.indexOf('已完成') !== -1, '缺少"已完成"分区');
});

test('renderRequestManagePanel 包含"已拒绝"分区', function () {
  const start = HTML.indexOf('function renderRequestManagePanel()');
  const end = HTML.indexOf('function formatBytes', start);
  const fn = HTML.slice(start, end);
  assert.ok(fn.indexOf('已拒绝') !== -1, '缺少"已拒绝"分区');
});

test('三个分区顺序：待讨论在前，已完成居中，已拒绝在后', function () {
  const start = HTML.indexOf('function renderRequestManagePanel()');
  const end = HTML.indexOf('function formatBytes', start);
  const fn = HTML.slice(start, end);
  const pendingIdx = fn.indexOf('待讨论');
  const doneIdx = fn.indexOf('已完成');
  const rejectedIdx = fn.indexOf('已拒绝');
  assert.ok(pendingIdx !== -1 && doneIdx !== -1 && rejectedIdx !== -1, '缺少分区');
  assert.ok(pendingIdx < doneIdx && doneIdx < rejectedIdx, '分区顺序应为：待讨论 → 已完成 → 已拒绝');
});

// ---- 3. 每条建议保留字段 ----
test('renderRequestAdminCard 保留标题字段', function () {
  const start = HTML.indexOf('function renderRequestAdminCard');
  assert.ok(start !== -1, '未找到 renderRequestAdminCard');
  const end = HTML.indexOf('function formatBytes', start);
  const fn = HTML.slice(start, end);
  assert.ok(fn.indexOf('title') !== -1, '缺少标题');
  assert.ok(fn.indexOf('item.text') !== -1, '缺少建议内容');
  assert.ok(fn.indexOf('item.user') !== -1, '缺少玩家名');
});

test('renderRequestAdminCard 保留分类、同意/否定数', function () {
  const start = HTML.indexOf('function renderRequestAdminCard');
  const end = HTML.indexOf('function formatBytes', start);
  const fn = HTML.slice(start, end);
  assert.ok(fn.indexOf('category') !== -1, '缺少分类');
  assert.ok(fn.indexOf('agree') !== -1, '缺少同意数');
  assert.ok(fn.indexOf('disagree') !== -1, '缺少否定数');
});

test('renderRequestAdminCard 保留状态选择器', function () {
  const start = HTML.indexOf('function renderRequestAdminCard');
  const end = HTML.indexOf('function formatBytes', start);
  const fn = HTML.slice(start, end);
  assert.ok(fn.indexOf('data-request-status') !== -1, '缺少状态选择器 data-request-status');
});

test('renderRequestAdminCard 保留管理员回复和拒绝原因', function () {
  const start = HTML.indexOf('function renderRequestAdminCard');
  const end = HTML.indexOf('function formatBytes', start);
  const fn = HTML.slice(start, end);
  assert.ok(fn.indexOf('data-request-reply') !== -1, '缺少管理员回复 data-request-reply');
  assert.ok(fn.indexOf('data-request-reason') !== -1, '缺少拒绝原因 data-request-reason');
});

test('renderRequestAdminCard 保留查看、上移、下移、删除操作按钮', function () {
  const start = HTML.indexOf('function renderRequestAdminCard');
  const end = HTML.indexOf('function formatBytes', start);
  const fn = HTML.slice(start, end);
  assert.ok(fn.indexOf('data-action="view-request"') !== -1, '缺少查看按钮');
  assert.ok(fn.indexOf('data-action="delete-request"') !== -1, '缺少删除按钮');
  assert.ok(fn.indexOf('move-request-up') !== -1, '缺少上移按钮');
  assert.ok(fn.indexOf('move-request-down') !== -1, '缺少下移按钮');
});

// ---- 4. 保存函数仍存在且可调用 ----
test('saveRequestChanges 函数仍存在', function () {
  assert.ok(HTML.indexOf('function saveRequestChanges()') !== -1, '未找到 saveRequestChanges');
  assert.ok(HTML.indexOf("renderPanel('requestManage')") !== -1, '保存后未重新渲染面板');
  assert.ok(HTML.indexOf('saveLocalData') !== -1, '保存未存本地');
});

// ---- 5. 删除函数仍存在 ----
test('delete-request 处理函数仍存在且可调用', function () {
  assert.ok(HTML.indexOf("if (action === 'delete-request')") !== -1, '未找到 delete-request 处理器');
  assert.ok(HTML.indexOf("requests.splice(index, 1)") !== -1, '删除未 splice 数组');
  assert.ok(HTML.indexOf("renderPanel('requestManage')") !== -1, '删除后未重新渲染面板');
});

// ---- 6. 其他后台模块入口仍存在 ----
test('活动管理入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="updateManage"') !== -1, '缺少 updateManage 入口');
});
test('建筑模板入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="templateManage"') !== -1, '缺少 templateManage 入口');
});
test('玩家群入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="groupManage"') !== -1, '缺少 groupManage 入口');
});
test('首页管理入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="homeManage"') !== -1, '缺少 homeManage 入口');
});
test('玩法管理入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="playManage"') !== -1, '缺少 playManage 入口');
});

// ---- 7. 前台玩家建议提交流程不受影响 ----
test('前台建议提交流程未改动', function () {
  assert.ok(HTML.indexOf('function openRequestModal') !== -1, '前台建议提交弹窗函数缺失');
  assert.ok(HTML.indexOf('function closeRequestModal') !== -1, '前台建议提交关闭函数缺失');
  assert.ok(HTML.indexOf('function submitRequest') !== -1, '前台建议提交函数缺失');
  assert.ok(HTML.indexOf('function voteRequest') !== -1, '前台投票功能缺失');
});

// ---- 8. 前端建议展示渲染不受影响 ----
test('前台 renderRequests 函数未改动', function () {
  const start = HTML.indexOf('function renderRequests()');
  assert.ok(start !== -1, '未找到前台 renderRequests 函数');
  const fn = HTML.slice(start, start + 5000);
  assert.ok(fn.indexOf('request-card') !== -1, '前台建议卡片模板缺失');
  assert.ok(fn.indexOf('vote-request') !== -1, '前台投票按钮缺失');
});

console.log('\n通过 ' + passed + ' / ' + passed + (process.exitCode ? ' （有失败）' : ' 全部通过'));
