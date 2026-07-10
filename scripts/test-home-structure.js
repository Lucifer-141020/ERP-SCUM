/**
 * 首页展示结构验证测试
 *
 * 验证内容（第二阶段第2小步：整理"首页内容"面板结构）：
 * 1. 首页内容页面包含5个区块：首页主视觉、首页轮播图、首页数据卡、首页特色卡、服务器注意事项
 * 2. 5个区块顺序正确
 * 3. 轮播图不再嵌在首页主视觉区块内（已拆为独立区块）
 * 4. 首页内容页面不存在第二个活动编辑入口
 * 5. 原保存函数（saveHomeHero / saveHomeRules / saveHomeFeatures / saveHomeStats）仍然存在
 * 6. 原保存按钮以及新增的"保存首页轮播图"按钮均存在
 * 7. 新增的 saveHomeHeroImages 函数存在
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

// 提取 homeManage 模板块
var homeStart = html.indexOf("homeManage: () => `");
if (homeStart === -1) {
  console.log('not ok - homeManage template not found');
  process.exit(1);
}
var homeEnd = html.indexOf("groupManage: () => `", homeStart);
if (homeEnd === -1) {
  console.log('not ok - groupManage boundary not found');
  process.exit(1);
}
var homeBlock = html.substring(homeStart, homeEnd);

// ====== 测试用例 ======

// 1. 5 个区块均存在
test('首页内容页面包含 5 个目标区块', function() {
  var blocks = ['首页主视觉', '首页轮播图', '首页数据卡', '首页特色卡', '服务器注意事项'];
  var missing = blocks.filter(function(b) {
    return homeBlock.indexOf('<h3>' + b + '</h3>') === -1;
  });
  if (missing.length > 0) {
    throw new Error('缺失区块：' + missing.join(', '));
  }
});

// 2. 区块顺序正确
test('5 个区块顺序正确', function() {
  var order = ['首页主视觉', '首页轮播图', '首页数据卡', '首页特色卡', '服务器注意事项'];
  var positions = order.map(function(b) {
    return homeBlock.indexOf('<h3>' + b + '</h3>');
  });
  for (var i = 1; i < positions.length; i++) {
    if (positions[i] <= positions[i - 1]) {
      throw new Error('区块顺序错误：' + order[i - 1] + ' 应在 ' + order[i] + ' 之前');
    }
  }
});

// 3. 轮播图不再嵌在首页主视觉区块内
test('轮播图已拆为独立区块，不在首页主视觉内', function() {
  var heroBlockH3 = homeBlock.indexOf('<h3>首页主视觉</h3>');
  var heroSaveBtn = homeBlock.indexOf('id="saveHomeHero"');
  var carouselBlockH3 = homeBlock.indexOf('<h3>首页轮播图</h3>');
  var carouselTextarea = homeBlock.indexOf('id="editHeroImages"');

  if (heroBlockH3 === -1) throw new Error('找不到首页主视觉区块');
  if (heroSaveBtn === -1) throw new Error('找不到保存首页主视觉按钮');
  if (carouselBlockH3 === -1) throw new Error('找不到首页轮播图区块');
  if (carouselTextarea === -1) throw new Error('找不到轮播图文本框');

  // 轮播图文本框必须在"保存首页主视觉"按钮之后（即不在首页主视觉卡片内）
  if (carouselTextarea < heroSaveBtn) {
    throw new Error('轮播图文本框仍位于首页主视觉区块内（在保存按钮之前）');
  }
  // 轮播图文本框必须在"首页轮播图"标题之后（即位于独立轮播图区块内）
  if (carouselTextarea < carouselBlockH3) {
    throw new Error('轮播图文本框位于首页轮播图标题之前');
  }
});

// 4. 不存在第二个活动编辑入口
test('首页内容页面不存在第二个活动编辑入口', function() {
  if (homeBlock.indexOf('data-action="add-update"') !== -1) {
    throw new Error('首页内容页面包含活动编辑入口 add-update');
  }
  if (homeBlock.indexOf('updateManage') !== -1) {
    throw new Error('首页内容页面引用了 updateManage（活动管理）');
  }
});

// 5. 原保存函数仍然存在
test('原保存函数 saveHomeHero 仍然存在', function() {
  if (html.indexOf('function saveHomeHero()') === -1) throw new Error('saveHomeHero 已丢失');
});
test('原保存函数 saveHomeRules 仍然存在', function() {
  if (html.indexOf('function saveHomeRules()') === -1) throw new Error('saveHomeRules 已丢失');
});
test('原保存函数 saveHomeFeatures 仍然存在', function() {
  if (html.indexOf('function saveHomeFeatures()') === -1) throw new Error('saveHomeFeatures 已丢失');
});
test('原保存函数 saveHomeStats 仍然存在', function() {
  if (html.indexOf('function saveHomeStats()') === -1) throw new Error('saveHomeStats 已丢失');
});

// 6. 保存按钮均存在
test('5 个保存按钮均存在', function() {
  var ids = ['saveHomeHero', 'saveHomeHeroImages', 'saveHomeRules', 'saveHomeFeatures', 'saveHomeStats'];
  var missing = ids.filter(function(id) {
    return html.indexOf('id="' + id + '"') === -1;
  });
  if (missing.length > 0) {
    throw new Error('缺失保存按钮：' + missing.join(', '));
  }
});

// 7. 新增的 saveHomeHeroImages 函数存在
test('新增保存函数 saveHomeHeroImages 存在', function() {
  if (html.indexOf('function saveHomeHeroImages()') === -1) {
    throw new Error('saveHomeHeroImages 未找到');
  }
});

// ====== 新手入服引导卡结构测试（Task 1） ======

test('首页应包含新手入服引导区', function() {
  if (html.indexOf('id="newPlayerGuideSection"') === -1) {
    throw new Error('首页应包含新手入服引导区');
  }
});

test('引导区应包含动态服务器 IP', function() {
  if (html.indexOf('id="guideServerIp"') === -1) {
    throw new Error('引导区应包含动态服务器 IP');
  }
});

test('引导区应包含动态 QQ 群号', function() {
  if (html.indexOf('id="guideGroupNumber"') === -1) {
    throw new Error('引导区应包含动态 QQ 群号');
  }
});

test('引导区应包含 copy-ip 操作', function() {
  if (html.indexOf('data-guide-action="copy-ip"') === -1) {
    throw new Error('引导区应包含 copy-ip 操作');
  }
});

test('引导区应包含 copy-group 操作', function() {
  if (html.indexOf('data-guide-action="copy-group"') === -1) {
    throw new Error('引导区应包含 copy-group 操作');
  }
});

test('引导区应包含 read-rules 操作', function() {
  if (html.indexOf('data-guide-action="read-rules"') === -1) {
    throw new Error('引导区应包含 read-rules 操作');
  }
});

test('引导区应包含 enter-server 操作', function() {
  if (html.indexOf('data-guide-action="enter-server"') === -1) {
    throw new Error('引导区应包含 enter-server 操作');
  }
});

test('引导区应包含 contact-admin 操作', function() {
  if (html.indexOf('data-guide-action="contact-admin"') === -1) {
    throw new Error('引导区应包含 contact-admin 操作');
  }
});

runTests();
