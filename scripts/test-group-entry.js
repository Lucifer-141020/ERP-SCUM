/**
 * 玩家群入口结构及数据兼容性验证测试（TDD：先写失败，再最小修改让其通过）
 *
 * 验证内容（第二阶段第4小步：整理"玩家群入口"后台页面）：
 * 1. groupManage 面板存在，标题与菜单一致（"玩家群入口"）。
 * 2. 面板内部按用途分成清晰区域（至少 2 个 `card pad` 区块），避免所有输入框堆在一起。
 * 3. 原有 4 个字段全部保留且 id 不变：groupJoinText / groupJoinUrl / groupJoinApplication / groupJoinQr。
 * 4. 保存按钮唯一（id="saveGroupSettings" 全文件仅 1 个）。
 * 5. 旧数据兼容：saveGroupSettings 只写入 join 字段（joinText/joinUrl/joinApplication/joinQr），
 *    不覆盖"网站基础信息"中的其他字段（如 serverInfo.group / editGroup）。
 * 6. 未把"网站基础信息"的 QQ群字段（editGroup）错误搬入本页。
 * 7. 未改动其他后台模块（首页内容/玩法内容/建筑模板/活动管理）。
 *
 * 不依赖任何外部包，仅使用 Node 内置模块。
 */

var fs = require('fs');
var path = require('path');

var html = fs.readFileSync(
  path.join(__dirname, '..', 'erp14-server-showcase.html'),
  'utf8'
);

var tests = [];
var passed = 0;
var failed = 0;

function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

function runTests() {
  console.log('TAP version 13');
  tests.forEach(function(t, i) {
    try {
      t.fn();
      passed++;
      console.log('ok ' + (i + 1) + ' - ' + t.name);
    } catch (e) {
      failed++;
      console.log('not ok ' + (i + 1) + ' - ' + t.name);
      console.log('  ---');
      console.log('  message: ' + e.message);
      console.log('  ...');
    }
  });
  console.log('1..' + tests.length);
  console.log('# tests ' + tests.length);
  console.log('# pass ' + passed);
  if (failed > 0) console.log('# fail ' + failed);
  process.exit(failed > 0 ? 1 : 0);
}

// 提取 groupManage 面板块
var groupStart = html.indexOf("groupManage: () => `");
if (groupStart === -1) {
  console.log('not ok - groupManage template not found');
  process.exit(1);
}
var groupEnd = html.indexOf("templateManage: () =>", groupStart);
if (groupEnd === -1) {
  console.log('not ok - templateManage boundary not found');
  process.exit(1);
}
var groupBlock = html.substring(groupStart, groupEnd);

// ====== 测试用例 ======

// 1. 面板标题与菜单一致
test('groupManage 面板标题为"玩家群入口"（与菜单一致）', function() {
  if (groupBlock.indexOf('<h3>玩家群入口</h3>') === -1) {
    throw new Error('groupManage 面板标题不是"玩家群入口"（当前可能为"玩家群设置"）');
  }
});

// 2. 至少 2 个清晰区域（card pad 区块）
test('groupManage 内部按用途分成至少 2 个清晰区域', function() {
  var count = 0;
  var idx = groupBlock.indexOf('class="card pad"');
  while (idx !== -1) {
    count++;
    idx = groupBlock.indexOf('class="card pad"', idx + 1);
  }
  if (count < 2) {
    throw new Error('清晰区域数量不足：仅 ' + count + ' 个 card pad，期望 >= 2');
  }
});

// 3. 原有 4 个字段全部保留且 id 不变
test('原有 4 个字段 id 全部保留（joinText/Url/Application/Qr）', function() {
  var ids = ['groupJoinText', 'groupJoinUrl', 'groupJoinApplication', 'groupJoinQr'];
  var missing = ids.filter(function(id) {
    return groupBlock.indexOf('id="' + id + '"') === -1;
  });
  if (missing.length > 0) {
    throw new Error('缺失字段 id：' + missing.join(', '));
  }
});

// 4. 保存按钮唯一
test('保存按钮 id="saveGroupSettings" 全文件唯一', function() {
  var count = 0;
  var idx = html.indexOf('id="saveGroupSettings"');
  while (idx !== -1) {
    count++;
    idx = html.indexOf('id="saveGroupSettings"', idx + 1);
  }
  if (count !== 1) {
    throw new Error('saveGroupSettings 按钮出现 ' + count + ' 次，应为 1 次');
  }
});

// 5. 旧数据兼容：saveGroupSettings 只写 join 字段，不碰 group
test('saveGroupSettings 只写入 join 字段，不覆盖 serverInfo.group', function() {
  var start = html.indexOf('function saveGroupSettings() {');
  if (start === -1) throw new Error('saveGroupSettings 函数丢失');
  var end = html.indexOf('function saveServerSettings()', start);
  var block = html.substring(start, end === -1 ? start + 400 : end);
  var mustHave = ['serverInfo.joinText', 'serverInfo.joinUrl', 'serverInfo.joinApplication', 'serverInfo.joinQr'];
  var miss = mustHave.filter(function(s) { return block.indexOf(s) === -1; });
  if (miss.length > 0) throw new Error('saveGroupSettings 缺少写入：' + miss.join(', '));
  if (block.indexOf('serverInfo.group') !== -1) {
    throw new Error('saveGroupSettings 误写了 serverInfo.group（会覆盖网站基础信息）');
  }
});

// 6. 未把网站基础信息的 QQ群字段（editGroup）搬入本页
test('groupManage 未包含网站基础信息的 QQ群字段 editGroup', function() {
  if (groupBlock.indexOf('id="editGroup"') !== -1) {
    throw new Error('groupManage 错误地包含了 editGroup（QQ群属于网站基础信息）');
  }
});

// 7. 未改动其他后台模块编辑函数
test('未误伤首页内容/玩法内容/建筑模板/活动管理的编辑函数', function() {
  var fns = [
    'function saveHomeHeroImages()',
    'function renderPlayEditor(item, index)',
    'function renderTemplateEditor(item, index)',
    'function renderUpdateEditor(item, index)'
  ];
  var missing = fns.filter(function(f) { return html.indexOf(f) === -1; });
  if (missing.length > 0) {
    throw new Error('相关函数定义疑似被误删：' + missing.join(', '));
  }
});

runTests();
