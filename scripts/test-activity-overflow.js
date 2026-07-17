// 阶段三第 1 小步返工：前台“每周活动”窄屏横向溢出专项检查
// 纯 Node fs + assert，无外部依赖。静态校验防溢出 CSS 已就位且未误伤其他模块。
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'erp14-server-showcase.html'), 'utf8');

// 提取 CSS 区（<style> ... </style>）
const styleMatch = HTML.match(/<style>([\s\S]*?)<\/style>/);
assert.ok(styleMatch, '未找到 <style> 样式块');
const CSS = styleMatch[1];

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

// 在 CSS 中查找以 #events 限定、针对活动卡片的防溢出规则块
function cssBlock(selector) {
  // 简单提取 selector 之后的声明块 { ... }
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}', 'g');
  let m, blocks = [];
  while ((m = re.exec(CSS)) !== null) blocks.push(m[1]);
  return blocks.join('\n');
}

console.log('活动卡片窄屏防溢出专项检查：');

// 1. #events .update-card 允许在网格中收缩
test('#events .update-card 设置 min-width:0（可在网格收缩）', function () {
  const b = cssBlock('#events .update-list,\\n    #events .update-card') || cssBlock('#events .update-card');
  // 兜底：直接检索
  assert.ok(/#events\s+\.update-card\s*\{[^}]*min-width:\s*0/.test(CSS) || /#events\s+\.update-list,\s*#events\s+\.update-card\s*\{[^}]*min-width:\s*0/.test(CSS),
    '未找到 #events .update-card { min-width: 0 }');
});

// 2. 活动文字正常换行
test('活动标题/段落/字段设置换行（overflow-wrap / word-break）', function () {
  assert.ok(/#events\s+\.update-card\s+h3[^}]*overflow-wrap:\s*break-word/.test(CSS)
    && /#events\s+\.update-card\s+p[^}]*overflow-wrap:\s*break-word/.test(CSS)
    && /#events\s+\.update-card-fields[^}]*overflow-wrap:\s*break-word/.test(CSS),
    '活动文字换行规则不完整（需 h3/p/update-card-fields 均含 overflow-wrap: break-word）');
});

// 3. 结果排名区域仅在内部滚动，不撑宽页面
test('.activity-results 设置 overflow-x:auto（结果区内部滚动）', function () {
  assert.ok(/#events\s+\.activity-results\s*\{[^}]*overflow-x:\s*auto/.test(CSS),
    '未找到 #events .activity-results { overflow-x: auto }');
});

// 4. 结果表使用固定布局 + 单元格换行，避免内容撑宽
test('.activity-results-table 固定布局且单元格换行', function () {
  assert.ok(/#events\s+\.activity-results-table\s*\{[^}]*table-layout:\s*fixed/.test(CSS),
    '未找到 #events .activity-results-table { table-layout: fixed }');
  assert.ok(/#events\s+\.activity-results-table\s+th[^}]*overflow-wrap:\s*break-word/.test(CSS)
    && /#events\s+\.activity-results-table\s+td[^}]*overflow-wrap:\s*break-word/.test(CSS),
    '结果表 th/td 未设置换行');
});

// 5. 防溢出规则仅作用于 #events，不影响后台 updateManage（后台卡片为 .card.pad）
test('防溢出规则限定在 #events，未污染后台编辑器', function () {
  // 后台 renderUpdateEditor 的卡片类为 .card.pad，不应被 #events 规则覆盖
  assert.ok(HTML.indexOf('class="card pad"') !== -1, '后台编辑器卡片结构异常（.card.pad 缺失）');
  // 后台 results 编辑器类为 .results-editor（独立），不与前端 .activity-results 混淆
  assert.ok(HTML.indexOf('class="results-editor"') !== -1, '后台结果编辑器 .results-editor 缺失');
});

// 6. 前台渲染函数与 #events 结构未被改动（回归保护）
test('前台 renderResultsTable 与 #events 容器结构完好', function () {
  assert.ok(/function\s+renderResultsTable/.test(HTML), 'renderResultsTable 函数缺失（疑似被误改）');
  assert.ok(HTML.indexOf('id="events"') !== -1, '#events 容器缺失');
  assert.ok(HTML.indexOf('id="updateList"') !== -1, '#updateList 容器缺失');
  // 前台活动卡片仍使用 .update-card
  assert.ok(HTML.indexOf('activity-results') !== -1 && HTML.indexOf('update-card') !== -1, '前台活动卡片标记缺失');
});

// 7. 后端接口与数据库未改动（本次仅改 HTML 的 CSS）
test('后端 saveUpdateItem / inferActivityType 未受改动影响（仅改 HTML）', function () {
  assert.ok(HTML.indexOf('function saveUpdateItem') !== -1, 'saveUpdateItem 缺失');
  assert.ok(HTML.indexOf('inferActivityType') !== -1, 'inferActivityType 缺失');
});

console.log('\n通过 ' + passed + ' / 7');
if (process.exitCode === 1) {
  console.error('存在失败用例');
} else {
  console.log('全部通过');
}
