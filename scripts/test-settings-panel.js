/**
 * settings 面板精简验证测试
 *
 * 验证内容：
 * 1. settings 页面包含5个保留字段
 * 2. settings 页面不再包含被移除的重复字段
 * 3. 保存函数不再访问已移除的 DOM 元素
 * 4. 首页管理面板包含轮播图管理
 * 5. 首页管理、玩家群设置入口仍然存在
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

// ====== 测试用例 ======

// 1. settings 面板存在（通过模板函数确认）
test('settings panel template exists', function() {
  if (html.indexOf("settings: () => `") === -1) {
    throw new Error('settings panel template not found');
  }
});

// 2. settings 面板标题为"网站基础信息"
test('settings panel title is "网站基础信息"', function() {
  if (html.indexOf('<h3>网站基础信息</h3>') === -1) {
    throw new Error('settings panel title is not "网站基础信息"');
  }
});

// 3. settings 面板包含5个保留字段的ID
test('settings panel contains 5 required field IDs', function() {
  var required = ['editHeroTitle', 'editServerNo', 'editServerIp', 'editGroup', 'editSeason'];
  var missing = required.filter(function(id) {
    // Check only within settings template context
    var settingsStart = html.indexOf("settings: () => `");
    var settingsEnd = html.indexOf("backend: () => `", settingsStart);
    var settingsBlock = html.substring(settingsStart, settingsEnd);
    return settingsBlock.indexOf(id) === -1;
  });
  if (missing.length > 0) {
    throw new Error('Missing fields in settings: ' + missing.join(', '));
  }
});

// 4. settings 面板不再包含"首页介绍文字"
test('settings no longer contains "首页介绍文字"', function() {
  var settingsStart = html.indexOf("settings: () => `");
  var settingsEnd = html.indexOf("backend: () => `", settingsStart);
  var settingsBlock = html.substring(settingsStart, settingsEnd);
  if (settingsBlock.indexOf('首页介绍文字') !== -1) {
    throw new Error('settings still contains "首页介绍文字"');
  }
});

// 5. settings 面板不再包含"加入按钮文字"
test('settings no longer contains "加入按钮文字"', function() {
  var settingsStart = html.indexOf("settings: () => `");
  var settingsEnd = html.indexOf("backend: () => `", settingsStart);
  var settingsBlock = html.substring(settingsStart, settingsEnd);
  if (settingsBlock.indexOf('加入按钮文字') !== -1) {
    throw new Error('settings still contains "加入按钮文字"');
  }
});

// 6. settings 面板不再包含"加入链接"
test('settings no longer contains "加入链接"', function() {
  var settingsStart = html.indexOf("settings: () => `");
  var settingsEnd = html.indexOf("backend: () => `", settingsStart);
  var settingsBlock = html.substring(settingsStart, settingsEnd);
  if (settingsBlock.indexOf('加入链接') !== -1) {
    throw new Error('settings still contains "加入链接"');
  }
});

// 7. settings 面板不再包含"加入申请说明"
test('settings no longer contains "加入申请说明"', function() {
  var settingsStart = html.indexOf("settings: () => `");
  var settingsEnd = html.indexOf("backend: () => `", settingsStart);
  var settingsBlock = html.substring(settingsStart, settingsEnd);
  if (settingsBlock.indexOf('加入申请说明') !== -1) {
    throw new Error('settings still contains "加入申请说明"');
  }
});

// 8. settings 面板不再包含轮播图（editHeroImages）
test('settings no longer contains editHeroImages', function() {
  var settingsStart = html.indexOf("settings: () => `");
  var settingsEnd = html.indexOf("backend: () => `", settingsStart);
  var settingsBlock = html.substring(settingsStart, settingsEnd);
  if (settingsBlock.indexOf('editHeroImages') !== -1) {
    throw new Error('settings still contains editHeroImages');
  }
});

// 9. saveServerSettings 不再引用已移除的 DOM 元素
test('saveServerSettings no longer reads removed DOM elements', function() {
  var fnStart = html.indexOf("function saveServerSettings()");
  var fnEnd = html.indexOf("function saveBuildingTemplate", fnStart);
  var fnBody = html.substring(fnStart, fnEnd);
  var removed = ['editJoinText', 'editJoinUrl', 'editJoinApplication', 'editDescription', 'editHeroImages'];
  var found = removed.filter(function(id) {
    return fnBody.indexOf(id) !== -1;
  });
  if (found.length > 0) {
    throw new Error('saveServerSettings still references: ' + found.join(', '));
  }
});

// 10. saveServerSettings 保留5个字段的读取
test('saveServerSettings reads 5 core fields', function() {
  var fnStart = html.indexOf("function saveServerSettings()");
  var fnEnd = html.indexOf("function saveBuildingTemplate", fnStart);
  var fnBody = html.substring(fnStart, fnEnd);
  var required = ['editHeroTitle', 'editSeason', 'editServerNo', 'editServerIp', 'editGroup'];
  var missing = required.filter(function(id) {
    return fnBody.indexOf(id) === -1;
  });
  if (missing.length > 0) {
    throw new Error('Missing field reads in saveServerSettings: ' + missing.join(', '));
  }
});

// 11. homeManage 面板包含轮播图管理
test('homeManage panel contains hero image management', function() {
  var homeStart = html.indexOf("homeManage: () => `");
  var groupStart = html.indexOf("groupManage: () => `");
  var homeBlock = html.substring(homeStart, groupStart);
  if (homeBlock.indexOf('首页轮播图') === -1) {
    throw new Error('homeManage does not contain "首页轮播图"');
  }
  if (homeBlock.indexOf('editHeroImages') === -1) {
    throw new Error('homeManage does not contain editHeroImages textarea');
  }
});

// 12. saveHomeHero 函数现在保存 heroImages
test('saveHomeHero now saves heroImages', function() {
  var fnStart = html.indexOf("function saveHomeHero()");
  // Find the next function after saveHomeHero
  var fnEnd = html.indexOf("function", fnStart + 5);
  // Skip past var HOME_CARD_COLORS
  var afterFunctions = html.indexOf("var HOME_CARD_COLORS", fnStart);
  if (afterFunctions > -1 && afterFunctions < fnEnd) fnEnd = afterFunctions;
  var fnBody = html.substring(fnStart, fnEnd);
  if (fnBody.indexOf('heroImages') === -1) {
    throw new Error('saveHomeHero does not reference heroImages');
  }
});

// 13. 首页管理面板入口仍然存在
test('homeManage menu button exists', function() {
  if (html.indexOf('data-panel="homeManage"') === -1) {
    throw new Error('homeManage menu button not found');
  }
});

// 14. 玩家群设置面板入口仍然存在
test('groupManage menu button exists', function() {
  if (html.indexOf('data-panel="groupManage"') === -1) {
    throw new Error('groupManage menu button not found');
  }
});

// 15. settings 面板按3个分组显示
test('settings panel has 3 section groups', function() {
  var settingsStart = html.indexOf("settings: () => `");
  var settingsEnd = html.indexOf("backend: () => `", settingsStart);
  var settingsBlock = html.substring(settingsStart, settingsEnd);
  var groups = ['服务器身份', '连接信息', '运行状态'];
  var missing = groups.filter(function(g) {
    return settingsBlock.indexOf(g) === -1;
  });
  if (missing.length > 0) {
    throw new Error('Missing groups in settings: ' + missing.join(', '));
  }
});

runTests();
