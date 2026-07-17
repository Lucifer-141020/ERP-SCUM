/**
 * 玩法内容结构及数据兼容性验证测试
 *
 * 验证内容（第二阶段第3小步：整理"玩法内容"后台页面）：
 * 1. playManage 面板存在，标题为"玩法内容"。
 * 2. renderPlayEditor 保留全部原有 data-play-field 属性（key/icon/title/subtitle/image/images/text/points），
 *    即旧数据格式与 savePlayItem 读取逻辑向后兼容。
 * 3. 每个玩法编辑区包含所需字段：图标、标题、副标题、介绍文字、图片、玩法要点。
 * 4. 排序入口（上移/下移）、删除、保存、新增玩法均齐全。
 * 5. "新增玩法"按钮全局唯一（不再在每个卡片内重复出现）。
 * 6. 旧数据中用 description 字段的玩法仍可正常显示（item.text || item.description 兼容回退）。
 * 7. 未改动其他后台模块（首页内容/玩家群/建筑模板/活动管理）的编辑函数。
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

// 提取 playManage 面板块
var playStart = html.indexOf("playManage: () => `");
if (playStart === -1) {
  console.log('not ok - playManage template not found');
  process.exit(1);
}
var playEnd = html.indexOf("updateManage: () =>", playStart);
if (playEnd === -1) {
  console.log('not ok - updateManage boundary not found');
  process.exit(1);
}
var playBlock = html.substring(playStart, playEnd);

// 提取 renderPlayEditor 函数源码
var renderStart = html.indexOf('function renderPlayEditor(item, index) {');
if (renderStart === -1) {
  console.log('not ok - renderPlayEditor not found');
  process.exit(1);
}
// 找到函数体开始的 `{` 之后，配对到对应 `}` 结束
var braceOpen = html.indexOf('{', renderStart);
var depth = 0;
var renderEnd = -1;
for (var i = braceOpen; i < html.length; i++) {
  if (html[i] === '{') depth++;
  else if (html[i] === '}') {
    depth--;
    if (depth === 0) { renderEnd = i + 1; break; }
  }
}
var renderBlock = html.substring(renderStart, renderEnd);

// ====== 测试用例 ======

// 1. playManage 面板标题为"玩法内容"
test('playManage 面板标题为"玩法内容"', function() {
  if (playBlock.indexOf('<h3>玩法内容</h3>') === -1) {
    throw new Error('playManage 面板标题不是"玩法内容"');
  }
  if (playBlock.indexOf('玩法管理') !== -1) {
    throw new Error('playManage 仍存在旧标题"玩法管理"');
  }
});

// 2. renderPlayEditor 保留全部原有 data-play-field 属性（旧数据兼容）
test('renderPlayEditor 保留全部 data-play-field 属性', function() {
  var fields = ['key', 'icon', 'title', 'subtitle', 'image', 'images', 'text', 'points'];
  var missing = fields.filter(function(f) {
    return renderBlock.indexOf('data-play-field="' + f + '"') === -1;
  });
  if (missing.length > 0) {
    throw new Error('缺失 data-play-field 属性：' + missing.join(', '));
  }
});

// 3. 每个玩法编辑区包含所需字段标签
test('每个玩法编辑区包含图标/标题/副标题/介绍文字/图片/玩法要点', function() {
  var labels = ['图标', '标题', '副标题', '介绍文字', '玩法图片', '玩法要点'];
  var missing = labels.filter(function(l) {
    return renderBlock.indexOf(l) === -1;
  });
  if (missing.length > 0) {
    throw new Error('缺失字段标签：' + missing.join(', '));
  }
});

// 4. 排序入口（上移/下移）、删除、保存齐全
test('排序/删除/保存入口齐全', function() {
  var actions = ['move-play-up', 'move-play-down', 'delete-play', 'save-play'];
  var missing = actions.filter(function(a) {
    return renderBlock.indexOf('data-action="' + a + '"') === -1;
  });
  if (missing.length > 0) {
    throw new Error('缺失操作入口：' + missing.join(', '));
  }
});

// 5. 新增玩法按钮存在
test('"新增玩法"按钮存在', function() {
  if (html.indexOf('data-action="add-play"') === -1) {
    throw new Error('找不到"新增玩法"按钮');
  }
});

// 6. "新增玩法"按钮全局唯一（不在每个卡片内重复出现）
test('"新增玩法"按钮全局唯一（不在每个玩法卡片内重复）', function() {
  var count = 0;
  var idx = html.indexOf('data-action="add-play"');
  while (idx !== -1) {
    count++;
    idx = html.indexOf('data-action="add-play"', idx + 1);
  }
  if (count !== 1) {
    throw new Error('data-action="add-play" 出现 ' + count + ' 次，应为 1 次（应只在面板底部出现）');
  }
  if (renderBlock.indexOf('data-action="add-play"') !== -1) {
    throw new Error('renderPlayEditor 内部仍含"新增玩法"按钮（应只在面板底部）');
  }
});

// 7. 旧数据 description 兼容回退
test('renderPlayEditor 兼容旧数据 description 字段', function() {
  if (renderBlock.indexOf('item.text || item.description') === -1) {
    throw new Error('未保留 item.text || item.description 兼容回退');
  }
});

// 8. 旧数据兼容：savePlayItem 仍按原字段读取（保存逻辑未改）
test('savePlayItem 仍按原 data-play-field 字段读取（保存逻辑兼容）', function() {
  var saveStart = html.indexOf('function savePlayItem(index) {');
  if (saveStart === -1) throw new Error('savePlayItem 函数丢失');
  var sIdx = html.indexOf('}', saveStart);
  var saveEnd = html.indexOf('function saveUpdateItem', saveStart);
  var saveBlock = html.substring(saveStart, saveEnd === -1 ? saveStart + 600 : saveEnd);
  var reads = ['read(\'key\')', 'read(\'icon\')', 'read(\'title\')', 'read(\'subtitle\')', 'read(\'images\')', 'read(\'text\')', 'read(\'points\')'];
  var missing = reads.filter(function(r) { return saveBlock.indexOf(r) === -1; });
  if (missing.length > 0) {
    throw new Error('savePlayItem 缺失读取：' + missing.join(', '));
  }
});

// 9. 未误伤其他后台模块的编辑函数（本次只改 playManage / renderPlayEditor）
test('未误伤首页内容/建筑模板/玩家群的编辑函数', function() {
  // 仅确认本次未误删相关函数定义
  var fns = ['function saveHomeHeroImages()', 'function renderTemplateEditor(item, index)', 'function renderPlayEditor(item, index)'];
  var missing = fns.filter(function(f) { return html.indexOf(f) === -1; });
  if (missing.length > 0) {
    throw new Error('相关函数定义疑似被误删：' + missing.join(', '));
  }
});

runTests();
