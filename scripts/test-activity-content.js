// 阶段三第 1 小步：整理“长期 / 限时活动”页面结构专项测试
// 纯 Node fs + assert，无外部依赖。TDD：先写失败，再最小修改转绿。
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

// 提取 updateManage 面板函数体（从声明到下一个面板声明 imageLibrary 之前）
function extractUpdateManage() {
  const start = HTML.indexOf('updateManage: () => {');
  assert.ok(start !== -1, '未找到 updateManage 面板声明');
  const end = HTML.indexOf('imageLibrary: () =>', start);
  assert.ok(end !== -1, '未找到 updateManage 结束位置');
  return HTML.slice(start, end);
}

// 提取 renderUpdateEditor 函数体
function extractRenderUpdateEditor() {
  const start = HTML.indexOf('function renderUpdateEditor(item, index)');
  assert.ok(start !== -1, '未找到 renderUpdateEditor 函数');
  // 找到函数体结束的最后一个 '}'（在下一个 function 声明之前）
  const nextFn = HTML.indexOf('const IMAGE_UPLOAD_MAX_BYTES', start);
  assert.ok(nextFn !== -1, '未找到 renderUpdateEditor 结束位置');
  return HTML.slice(start, nextFn);
}

const updateManage = extractUpdateManage();
const renderUpdateEditor = extractRenderUpdateEditor();

console.log('活动管理专项测试：');

// 1. 页面标题为“长期 / 限时活动”
test('页面标题为“长期 / 限时活动”', function () {
  assert.ok(updateManage.indexOf('长期 / 限时活动') !== -1, 'updateManage 中未出现标题“长期 / 限时活动”');
  assert.ok(updateManage.indexOf('每周活动管理') === -1, 'updateManage 仍残留旧标题“每周活动管理”');
});

// 2. 长期固定活动(fixed)区域排在限时报名活动(signup)前面
test('长期固定活动区域排在限时报名活动区域前面', function () {
  const fixedIdx = updateManage.indexOf('长期固定活动（');
  const signupIdx = updateManage.indexOf('限时报名活动（');
  assert.ok(fixedIdx !== -1, '未找到“长期固定活动”区域');
  assert.ok(signupIdx !== -1, '未找到“限时报名活动”区域');
  assert.ok(fixedIdx < signupIdx, '“长期固定活动”应排在“限时报名活动”之前（当前顺序相反）');
});

// 3. 两类新增按钮各自唯一且文案正确
test('两类新增按钮各自唯一且文案正确', function () {
  const cFixed = (updateManage.match(/新增长期固定活动/g) || []).length;
  const cSignup = (updateManage.match(/新增限时报名活动/g) || []).length;
  assert.strictEqual(cFixed, 1, '“新增长期固定活动”按钮应恰好 1 个，实际 ' + cFixed);
  assert.strictEqual(cSignup, 1, '“新增限时报名活动”按钮应恰好 1 个，实际 ' + cSignup);
  // 不应残留旧命名
  assert.ok(updateManage.indexOf('新增临时报名活动') === -1, '仍残留旧命名“新增临时报名活动”');
});

// 4. fixed、signup 数据值保持不变
test('fixed、signup 数据值保持不变', function () {
  // 区域按钮 data-type 仍为 fixed / signup
  assert.ok(updateManage.indexOf('data-type="fixed"') !== -1, '缺少 data-type="fixed"');
  assert.ok(updateManage.indexOf('data-type="signup"') !== -1, '缺少 data-type="signup"');
  // inferActivityType 仍识别 fixed / signup
  assert.ok(HTML.indexOf("item.activityType === 'fixed'") !== -1, 'inferActivityType 未保留 fixed 判定');
  assert.ok(HTML.indexOf("item.activityType === 'signup'") !== -1, 'inferActivityType 未保留 signup 判定');
});

// 5. 原有活动字段全部保留
test('原有活动字段全部保留', function () {
  const fields = ['title', 'schedule', 'reward', 'rules', 'notes', 'signupDeadline', 'eventEndAt', 'status', 'version', 'rewardDate', 'activityType-select'];
  fields.forEach(function (f) {
    assert.ok(HTML.indexOf('data-update-field="' + f + '"') !== -1, '缺少字段 data-update-field="' + f + '"');
  });
  // 复选框
  assert.ok(HTML.indexOf('data-update-check="published"') !== -1, '缺少 data-update-check="published"');
  assert.ok(HTML.indexOf('data-update-check="signupEnabled"') !== -1, '缺少 data-update-check="signupEnabled"');
});

// 6. 报名设置只在 signup 类型显示
test('报名设置只在 signup 类型显示', function () {
  const guardIdx = renderUpdateEditor.indexOf("activityType === 'signup' ?");
  const regionIdx = renderUpdateEditor.indexOf('<summary>报名设置</summary>');
  assert.ok(guardIdx !== -1, 'renderUpdateEditor 未对报名设置做 signup 判定');
  assert.ok(regionIdx !== -1, 'renderUpdateEditor 未包含“报名设置”区域');
  assert.ok(guardIdx < regionIdx, '“报名设置”应包裹在 signup 判定内');
});

// 7. 排名和发奖字段保留
test('排名和发奖字段保留', function () {
  ['data-results-rank', 'data-results-player', 'data-results-score', 'data-results-reward',
   'data-update-field="rewardDate"', 'data-action="add-result-row"', 'data-action="import-signups-to-results"'
  ].forEach(function (s) {
    assert.ok(HTML.indexOf(s) !== -1, '缺少 ' + s);
  });
});

// 8. 保存、排序、复制、结束、删除入口齐全
test('保存、排序、复制、结束、删除入口齐全', function () {
  ['save-update', 'move-update-up', 'move-update-down', 'duplicate-update', 'end-event', 'delete-update']
    .forEach(function (a) {
      assert.ok(HTML.indexOf('data-action="' + a + '"') !== -1, '缺少 data-action="' + a + '"');
    });
});

// 9. saveUpdateItem 原有读取和后端同步逻辑未损坏
test('saveUpdateItem 读取与后端同步逻辑未损坏', function () {
  const fnIdx = HTML.indexOf('async function saveUpdateItem(index)');
  assert.ok(fnIdx !== -1, '未找到 saveUpdateItem 函数');
  const fn = HTML.slice(fnIdx, HTML.indexOf('function getUpdateId', fnIdx) !== -1 ? HTML.indexOf('function getUpdateId', fnIdx) : fnIdx + 4000);
  assert.ok(fn.indexOf('data-update-field=') !== -1, 'saveUpdateItem 未读取 data-update-field');
  assert.ok(fn.indexOf("read('activityType')") !== -1 || fn.indexOf('selectEl.value') !== -1, 'saveUpdateItem 未读取 activityType');
  assert.ok(fn.indexOf('activityType: activityType') !== -1, 'saveUpdateItem 未保留 activityType 写入');
  assert.ok(fn.indexOf("type: newItem.activityType") !== -1, 'saveUpdateItem 未向后端同步 activityType');
});

// 10. 未误伤其他后台模块
test('未误伤其他后台模块', function () {
  ['groupManage', 'templateManage', 'playManage', 'homeManage',
   'function saveGroupSettings', 'function saveBuildingTemplate',
   'function renderTemplateEditor', 'function renderPlayEditor',
   'function inferActivityType', 'function getUpdateId'
  ].forEach(function (s) {
    assert.ok(HTML.indexOf(s) !== -1, '疑似误删/误伤：' + s);
  });
});

console.log('\n通过 ' + passed + ' / 10');
if (process.exitCode === 1) {
  console.error('存在失败用例（红阶段符合预期）');
} else {
  console.log('全部通过');
}
