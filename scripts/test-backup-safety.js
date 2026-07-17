// 第四阶段第 1 小步：备份恢复安全加固专项测试
// 纯 Node fs + assert，无外部依赖。
// 目标：验证备份恢复页面已加固，导入/重置前自动备份，重置有二次确认，未误伤其他模块。
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

console.log('备份恢复安全加固专项测试：');

// ---- 1. 页面标题 ----
test('renderBackupPanel 标题为"备份恢复"', function () {
  const start = HTML.indexOf('function renderBackupPanel()');
  assert.ok(start !== -1, '未找到 renderBackupPanel');
  const fn = HTML.slice(start, start + 500);
  assert.ok(fn.indexOf('>备份恢复<') !== -1, '标题不为"备份恢复"');
});

// ---- 2. 导入/导出/重置入口仍存在 ----
test('导入入口仍存在（importSelected）', function () {
  assert.ok(HTML.indexOf('id="importSelected"') !== -1, '缺少导入按钮');
});
test('导出入口仍存在（exportSelected）', function () {
  assert.ok(HTML.indexOf('id="exportSelected"') !== -1, '缺少导出按钮');
});
test('重置入口仍存在（resetSiteData）', function () {
  assert.ok(HTML.indexOf('id="resetSiteData"') !== -1, '缺少重置按钮');
});

// ---- 3. 导入前自动备份逻辑 ----
test('importSelectedModules 函数调用 autoBackupForSafety', function () {
  const start = HTML.indexOf('async function importSelectedModules()');
  assert.ok(start !== -1, '未找到 importSelectedModules');
  const fn = HTML.slice(start, start + 3000);
  assert.ok(fn.indexOf('autoBackupForSafety(\'导入\')') !== -1 || fn.indexOf('autoBackupForSafety("导入")') !== -1,
    '导入前未调用 autoBackupForSafety');
});

// ---- 4. 重置前自动备份逻辑 ----
test('resetSiteData 函数调用 autoBackupForSafety', function () {
  const start = HTML.indexOf('async function resetSiteData()');
  assert.ok(start !== -1, '未找到 resetSiteData');
  const fn = HTML.slice(start, start + 2000);
  assert.ok(fn.indexOf('autoBackupForSafety(\'重置\')') !== -1 || fn.indexOf('autoBackupForSafety("重置")') !== -1,
    '重置前未调用 autoBackupForSafety');
});

// ---- 5. autoBackupForSafety 函数存在 ----
test('autoBackupForSafety 函数存在', function () {
  assert.ok(HTML.indexOf('function autoBackupForSafety') !== -1, '缺少 autoBackupForSafety 函数');
});
test('autoBackupForSafety 失败时返回 false（操作停止）', function () {
  const start = HTML.indexOf('function autoBackupForSafety');
  assert.ok(start !== -1, '未找到 autoBackupForSafety');
  const fn = HTML.slice(start, start + 2000);
  assert.ok(fn.indexOf('return false') !== -1, 'autoBackupForSafety 缺少失败返回 false');
});

// ---- 6. 导入确认文案包含会覆盖的模块 ----
test('导入确认弹窗文案包含模块列表', function () {
  const start = HTML.indexOf('async function importSelectedModules()');
  const fn = HTML.slice(start, start + 4000);
  assert.ok(fn.indexOf('即将导入以下模块') !== -1, '导入确认未列出模块');
  assert.ok(fn.indexOf('网站配置') !== -1, '导入确认缺少"网站配置"');
  assert.ok(fn.indexOf('玩家建议') !== -1, '导入确认缺少"玩家建议"');
  assert.ok(fn.indexOf('活动数据') !== -1, '导入确认缺少"活动数据"');
  assert.ok(fn.indexOf('报名名单') !== -1, '导入确认缺少"报名名单"');
  assert.ok(fn.indexOf('图片列表') !== -1, '导入确认缺少"图片列表"');
});

// ---- 7. 重置要求输入"确认重置" ----
test('resetSiteData 调用 promptConfirmAction 要求输入"确认重置"', function () {
  const start = HTML.indexOf('async function resetSiteData()');
  const fn = HTML.slice(start, start + 2000);
  assert.ok(fn.indexOf('promptConfirmAction') !== -1, '重置未使用 promptConfirmAction');
  assert.ok(fn.indexOf('确认重置') !== -1, '重置确认未要求输入"确认重置"');
});

// ---- 8. promptConfirmAction 函数存在 ----
test('promptConfirmAction 函数存在（输入确认弹窗）', function () {
  assert.ok(HTML.indexOf('function promptConfirmAction') !== -1, '缺少 promptConfirmAction 函数');
});
test('promptConfirmAction 输入正确文字前禁用确认按钮', function () {
  const start = HTML.indexOf('function promptConfirmAction');
  assert.ok(start !== -1, '未找到 promptConfirmAction');
  const fn = HTML.slice(start, start + 2000);
  assert.ok(fn.indexOf('okBtn.disabled = true') !== -1, '未在初始时禁用确认按钮');
  assert.ok(fn.indexOf('input.value.trim() === requiredText') !== -1, '未验证输入内容');
});

// ---- 9. 重置存在二次确认或强确认逻辑 ----
test('resetSiteData 有两次确认（一次普通 + 一次输入确认）', function () {
  const start = HTML.indexOf('async function resetSiteData()');
  const fn = HTML.slice(start, start + 2000);
  assert.ok(fn.indexOf('confirmAction') !== -1, '缺少第一次确认（confirmAction）');
  assert.ok(fn.indexOf('promptConfirmAction') !== -1, '缺少第二次确认（promptConfirmAction）');
});

// ---- 10. 安全提示存在 ----
test('页面包含"普通代码更新不需要导入或重置数据"类安全提示', function () {
  assert.ok(
    HTML.indexOf('普通代码更新不需要导入或重置数据') !== -1 ||
    HTML.indexOf('普通代码更新不要覆盖服务器运行数据') !== -1,
    '缺少安全提示'
  );
});

// ---- 11. 未误伤其他后台模块 ----
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

console.log('\n通过 ' + passed + ' / ' + passed + (process.exitCode ? ' （有失败）' : ' 全部通过'));
