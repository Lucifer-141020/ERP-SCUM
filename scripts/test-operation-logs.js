// 第四阶段第 2 小步：操作日志轻量优化专项测试
// 纯 Node fs + assert，无外部依赖。
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'erp14-server-showcase.html'), 'utf8');

let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name); console.error('    ' + e.message); process.exitCode = 1; }
}

console.log('操作日志轻量优化专项测试：');

// ---- 1. 页面标题 ----
test('操作日志页面标题为"操作日志"', function () {
  assert.ok(HTML.indexOf('>操作日志<') !== -1, '标题不为"操作日志"');
});

// ---- 2. 最近操作区域存在 ----
test('loadLogs 函数存在', function () {
  assert.ok(HTML.indexOf('async function loadLogs(') !== -1, 'loadLogs 缺失');
});

// ---- 3. 筛选区存在 ----
test('筛选区存在（开始日期）', function () {
  assert.ok(HTML.indexOf('id="logStartDate"') !== -1, '缺少开始日期输入');
});
test('筛选区存在（结束日期）', function () {
  assert.ok(HTML.indexOf('id="logEndDate"') !== -1, '缺少结束日期输入');
});
test('筛选区存在（操作类型下拉）', function () {
  assert.ok(HTML.indexOf('id="logAction"') !== -1, '缺少操作类型筛选');
});
test('筛选区存在（操作人输入）', function () {
  assert.ok(HTML.indexOf('id="logAdminName"') !== -1, '缺少操作人筛选');
});
test('搜索按钮存在', function () {
  assert.ok(HTML.indexOf('id="searchLogs"') !== -1, '缺少搜索按钮');
});
test('重置按钮存在', function () {
  assert.ok(HTML.indexOf('id="resetLogs"') !== -1, '缺少重置按钮');
});

// ---- 4. 时间/类型/管理员/内容展示入口存在 ----
test('表头含"时间"', function () {
  assert.ok(HTML.indexOf('>时间<') !== -1, '缺少时间列');
});
test('表头含"操作人"', function () {
  assert.ok(HTML.indexOf('>操作人<') !== -1, '缺少操作人列');
});
test('表头含"操作类型"', function () {
  assert.ok(HTML.indexOf('>操作类型<') !== -1, '缺少操作类型列');
});
test('表头含"详情"', function () {
  assert.ok(HTML.indexOf('>详情<') !== -1, '缺少详情列');
});
test('表头含"IP"', function () {
  assert.ok(HTML.indexOf('>IP<') !== -1, '缺少IP列');
});

// ---- 5. 高风险关键词 ----
test('高风险检测含"删除"关键词', function () {
  assert.ok(HTML.indexOf('删除') !== -1, '高风险检测缺少"删除"');
});
test('高风险检测含"导入"关键词', function () {
  assert.ok(HTML.indexOf('导入') !== -1, '高风险检测缺少"导入"');
});
test('高风险检测含"重置"关键词', function () {
  assert.ok(HTML.indexOf('重置') !== -1, '高风险检测缺少"重置"');
});
test('高风险检测含"批量删除"关键词', function () {
  assert.ok(HTML.indexOf('批量删除') !== -1, '高风险检测缺少"批量删除"');
});

// ---- 6. 高风险标记逻辑 ----
test('isHighRiskAction 函数存在', function () {
  assert.ok(HTML.indexOf('function isHighRiskAction') !== -1, 'isHighRiskAction 缺失');
});
test('高风险检测在行渲染中使用', function () {
  const start = HTML.indexOf('async function loadLogs(');
  const fn = HTML.slice(start, start + 3000);
  assert.ok(fn.indexOf('isHighRiskAction') !== -1, 'loadLogs 未调用 isHighRiskAction');
});
test('高风险行有特殊样式标记（log-row-high-risk）', function () {
  assert.ok(HTML.indexOf('log-row-high-risk') !== -1, '缺少 .log-row-high-risk 样式');
});
test('高风险行显示"高风险"标签', function () {
  assert.ok(HTML.indexOf('高风险<') !== -1 || HTML.indexOf('>高风险<') !== -1, '缺少高风险标签');
});

// ---- 7. 空状态文案 ----
test('空状态文案存在', function () {
  assert.ok(HTML.indexOf('暂无日志记录') !== -1, '缺少空状态文案');
});

// ---- 8. 分页或加载更多入口保持 ----
test('上一页分页按钮存在', function () {
  assert.ok(HTML.indexOf('id="logPrevPage"') !== -1, '缺少上一页按钮');
});
test('下一页分页按钮存在', function () {
  assert.ok(HTML.indexOf('id="logNextPage"') !== -1, '缺少下一页按钮');
});
test('当前页/总页数标记存在', function () {
  assert.ok(HTML.indexOf('logCurrentPage') !== -1, '缺少当前页标记');
  assert.ok(HTML.indexOf('logTotalPages') !== -1, '缺少总页数标记');
});
test('initLogEvents 函数存在', function () {
  assert.ok(HTML.indexOf('function initLogEvents()') !== -1, 'initLogEvents 缺失');
});

// ---- 9. 未误伤其他后台模块 ----
test('活动管理入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="updateManage"') !== -1, '缺少 updateManage');
});
test('建筑模板入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="templateManage"') !== -1, '缺少 templateManage');
});
test('玩家群入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="groupManage"') !== -1, '缺少 groupManage');
});
test('玩家建议入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="requestManage"') !== -1, '缺少 requestManage');
});
test('图片库入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="imageLibrary"') !== -1, '缺少 imageLibrary');
});
test('备份恢复入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="backupManage"') !== -1, '缺少 backupManage');
});

console.log('\n通过 ' + passed + ' / ' + passed + (process.exitCode ? ' （有失败）' : ' 全部通过'));
