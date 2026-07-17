// scripts/test-template-content.js
// 阶段二第5小步：整理后台"首页展示 > 建筑模板"页面结构专项测试
// 纯 Node（fs + assert），无外部依赖，不自动安装依赖。
// 用法：node scripts/test-template-content.js

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HTML_PATH = path.join(__dirname, '..', 'erp14-server-showcase.html');
const html = fs.readFileSync(HTML_PATH, 'utf8');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  PASS  ' + name);
  } catch (e) {
    failed++;
    failures.push(name + ' :: ' + e.message);
    console.log('  FAIL  ' + name + ' :: ' + e.message);
  }
}

function count(substr) {
  return html.split(substr).length - 1;
}

console.log('=== test-template-content ===');

// 1. 页面标题统一为“建筑模板”
test('面板标题为“建筑模板”', function () {
  // 左侧菜单按钮已是“建筑模板”，此处要求面板标题也对齐
  assert.ok(html.includes('>建筑模板</h3>'), '未找到面板标题 >建筑模板</h3>');
  // 旧标题应已移除
  assert.ok(!html.includes('建筑模板管理</h3>'), '仍存在旧标题“建筑模板管理”');
});

// 2. 9 个现有字段全部保留（data-template-field）
const fields = ['title', 'price', 'onShelf', 'stock', 'limit', 'buyUrl', 'images', 'description', 'note'];
test('9 个现有字段的 data-template-field 全部保留', function () {
  const missing = fields.filter(f => !html.includes('data-template-field="' + f + '"'));
  assert.strictEqual(missing.length, 0, '缺少字段: ' + missing.join(', '));
});

// 3. 旧图片字段兼容（normalizeTemplateImages 仍处理 item.image / item.images）
test('旧图片字段兼容（normalizeTemplateImages 保留）', function () {
  assert.ok(html.includes('function normalizeTemplateImages'), 'normalizeTemplateImages 函数丢失');
});

// 4. “新增建筑模板”按钮全局唯一，仅在模板列表底部
test('新增建筑模板按钮全局唯一（data-action="add-template" 唯一）', function () {
  assert.strictEqual(count('data-action="add-template"'), 1, 'add-template 按钮数量不为 1');
});

// 5. 上移、下移、保存、删除入口齐全
test('上移/下移/保存/删除入口齐全', function () {
  const actions = ['move-template-up', 'move-template-down', 'save-template', 'delete-template'];
  const missing = actions.filter(a => !html.includes('data-action="' + a + '"'));
  assert.strictEqual(missing.length, 0, '缺少操作入口: ' + missing.join(', '));
});

// 6. saveBuildingTemplate 仍读取原字段
test('saveBuildingTemplate 仍读取原字段', function () {
  assert.ok(html.includes('function saveBuildingTemplate('), 'saveBuildingTemplate 函数丢失');
  const readFields = ['title', 'price', 'onShelf', 'stock', 'limit', 'buyUrl', 'images', 'description', 'note'];
  const missing = readFields.filter(f => !html.includes("read('" + f + "')"));
  assert.strictEqual(missing.length, 0, 'saveBuildingTemplate 未读取字段: ' + missing.join(', '));
});

// 7. onShelf、stock、limit、buyUrl 作为 data-template-field 存在（不丢失）
test('onShelf/stock/limit/buyUrl 字段不丢失', function () {
  const must = ['onShelf', 'stock', 'limit', 'buyUrl'];
  const missing = must.filter(f => !html.includes('data-template-field="' + f + '"'));
  assert.strictEqual(missing.length, 0, '丢失字段: ' + missing.join(', '));
});

// 8. 每个模板分成 4 个清晰区域
test('模板编辑器含 4 个清晰区域（基本信息/库存与购买/图片与说明/操作区）', function () {
  const regions = ['基本信息', '库存与购买', '图片与说明', '操作区'];
  const missing = regions.filter(r => !html.includes(r));
  assert.strictEqual(missing.length, 0, '缺少区域: ' + missing.join(', '));
});

// 9. 未误伤其他后台页面与函数
test('未误伤其他后台页面与函数', function () {
  const mustExist = [
    'function renderPlayEditor(item, index)',
    'function renderTemplateEditor(item, index)',
    'function saveGroupSettings(',
    'function saveHomeHeroImages(',
    'function saveHomeHero(',
    'homeManage:',
    'playManage:',
    'groupManage:'
  ];
  const missing = mustExist.filter(s => !html.includes(s));
  assert.strictEqual(missing.length, 0, '疑似误删: ' + missing.join(', '));
});

console.log('\n=== 结果: ' + passed + ' 通过, ' + failed + ' 失败 ===');
if (failed > 0) {
  console.log('\n失败项:');
  failures.forEach(f => console.log(' - ' + f));
  process.exit(1);
}
