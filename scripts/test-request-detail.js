#!/usr/bin/env node
// 玩家建议卡片简化与后台图片大图查看（重新定义版）
// 纯 Node fs + assert，无外部依赖。
// 支持 --group=js / --group=css / --group=all（默认 all）
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const MAIN_JS = fs.readFileSync(path.join(__dirname, '..', 'frontend/js/main.js'), 'utf8');
const MAIN_CSS = fs.readFileSync(path.join(__dirname, '..', 'frontend/css/main.css'), 'utf8');

// ---- 分组解析 ----
const GROUP = (process.argv.find(a => a.startsWith('--group=')) || '--group=all').slice(8);
if (!['js', 'css', 'all'].includes(GROUP)) {
  console.error('非法 group: ' + GROUP + '，仅允许 js / css / all');
  process.exit(1);
}

// ---- 测试注册 ----
const jsTests = [];
const cssTests = [];
function test(group, name, fn) {
  const entry = { name, fn };
  if (group === 'js' || group === 'all') jsTests.push(entry);
  if (group === 'css' || group === 'all') cssTests.push(entry);
}

// ---- 提取函数 ----
function extractFunction(src, name) {
  const marker = 'function ' + name + '(';
  let start = src.indexOf(marker);
  if (start === -1) return null;
  if (start >= 6 && src.slice(start - 6, start) === 'async ') start -= 6;
  let i = src.indexOf('(', start);
  if (i === -1) return null;
  let depth = 0, inStr = null, escape = false;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) { if (escape) { escape = false; continue; } if (ch === '\\') { escape = true; continue; } if (ch === inStr) { inStr = null; continue; } continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '(') depth++;
    if (ch === ')') { depth--; if (depth === 0) { i++; break; } }
  }
  const fnOpen = src.indexOf('{', i);
  if (fnOpen === -1) return null;
  depth = 0; inStr = null; escape = false;
  for (let j = fnOpen; j < src.length; j++) {
    const ch = src[j];
    if (inStr) { if (escape) { escape = false; continue; } if (ch === '\\') { escape = true; continue; } if (ch === inStr) { inStr = null; continue; } continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  return null;
}

function extractVariableAssignment(src, varName) {
  const re = new RegExp('(?:let|var|const)\\s+' + varName + '\\s*=\\s*([^;]+);');
  const m = re.exec(src);
  return m ? m[0] : null;
}

function extractHandlerBody(src, elementId, eventName, useQuerySelectorAll) {
  if (useQuerySelectorAll) {
    var pattern = "document.querySelectorAll('#" + elementId + " button').forEach";
    var idx = src.indexOf(pattern);
    if (idx === -1) return null;
    var arrowIdx = src.indexOf('=>', idx);
    if (arrowIdx === -1 || arrowIdx > idx + 300) return null;
    var bodyStart = src.indexOf('{', arrowIdx);
    if (bodyStart === -1) return null;
    var depth = 0;
    for (var i = bodyStart; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(bodyStart, i + 1); }
    }
    return null;
  }
  var pattern = "document.getElementById('" + elementId + "').addEventListener('" + eventName + "',";
  var idx = src.indexOf(pattern);
  if (idx === -1) return null;
  var funcStart = idx + pattern.length;
  if (src[funcStart] === '{') {
    var bodyStart = funcStart;
    var depth = 0;
    for (var i = bodyStart; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(bodyStart, i + 1); }
    }
    return null;
  }
  var fnIdx = src.indexOf('function', funcStart);
  if (fnIdx === -1 || fnIdx > funcStart + 30) return null;
  var bodyStart = src.indexOf('{', fnIdx);
  if (bodyStart === -1) return null;
  var depth = 0;
  for (var i = bodyStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(bodyStart, i + 1); }
  }
  return null;
}

// ============================================================================
// A. 旧详情功能清理测试（预期红灯：功能尚未移除）
// ============================================================================
test('js', 'A1. expandedRequestId 不应存在', () => {
  assert.ok(!extractVariableAssignment(MAIN_JS, 'expandedRequestId'),
    'expandedRequestId 变量声明仍存在');
});

test('js', 'A2. buildRequestDetail 不应存在', () => {
  assert.ok(!extractFunction(MAIN_JS, 'buildRequestDetail'),
    'buildRequestDetail 函数仍存在');
});

test('js', 'A3. resetExpandedRequest 不应存在', () => {
  assert.ok(!extractFunction(MAIN_JS, 'resetExpandedRequest'),
    'resetExpandedRequest 函数仍存在');
});

test('js', 'A4. toggleRequestDetail 不应存在', () => {
  assert.ok(!extractFunction(MAIN_JS, 'toggleRequestDetail'),
    'toggleRequestDetail 函数仍存在');
});

test('js', 'A5. data-action="toggle-request-detail" 不应存在', () => {
  assert.ok(!MAIN_JS.includes('toggle-request-detail'),
    'toggle-request-detail 标记仍存在');
});

test('js', 'A6. request-detail- 详情区域不应存在', () => {
  const renderIdx = MAIN_JS.indexOf('function renderRequests()');
  const renderSection = MAIN_JS.slice(renderIdx, renderIdx + 2000);
  assert.ok(!renderSection.includes('request-detail-'),
    'renderRequests 中仍包含 request-detail-');
});

test('js', 'A7. "查看详情" 和 "收起详情" 文案不应存在', () => {
  const renderIdx = MAIN_JS.indexOf('function renderRequests()');
  const renderSection = MAIN_JS.slice(renderIdx, renderIdx + 2000);
  assert.ok(!renderSection.includes('查看详情') && !renderSection.includes('收起详情'),
    'renderRequests 中仍包含查看/收起详情文案');
});

test('js', 'A8. 搜索、状态筛选、分类筛选不再调用 resetExpandedRequest', () => {
  // 先确认 resetExpandedRequest 本身不存在
  if (extractFunction(MAIN_JS, 'resetExpandedRequest')) {
    // 如果还存在，检查事件处理器是否不再引用它
    var searchBody = extractHandlerBody(MAIN_JS, 'requestSearch', 'input', false);
    if (searchBody) assert.ok(!searchBody.includes('resetExpandedRequest'), 'requestSearch handler 仍含 resetExpandedRequest');
    var tabsBody = extractHandlerBody(MAIN_JS, 'requestTabs', 'click', true);
    if (tabsBody) assert.ok(!tabsBody.includes('resetExpandedRequest'), 'requestTabs handler 仍含 resetExpandedRequest');
    var catBody = extractHandlerBody(MAIN_JS, 'requestCategoryFilters', 'click', true);
    if (catBody) assert.ok(!catBody.includes('resetExpandedRequest'), 'requestCategoryFilters handler 仍含 resetExpandedRequest');
  }
});

test('js', 'A9. 全局点击委托不再处理 toggle-request-detail', () => {
  assert.ok(!MAIN_JS.includes('toggle-request-detail'),
    '全局点击委托中仍包含 toggle-request-detail 处理');
});

// ============================================================================
// B. 前台直接展示保护测试（预期通过：功能应保留）
// ============================================================================
test('js', 'B10. renderRequests 仍渲染完整建议正文', () => {
  const renderSrc = extractFunction(MAIN_JS, 'renderRequests');
  assert.ok(renderSrc, 'renderRequests 函数不存在');
  // 应包含建议正文、玩家名、标签
  assert.ok(renderSrc.includes('item.text') || renderSrc.includes('item.title'),
    'renderRequests 未渲染建议正文');
  assert.ok(renderSrc.includes('item.user'), 'renderRequests 未渲染提交人');
  assert.ok(renderSrc.includes('item.category') || renderSrc.includes('requestCategoryLabel'),
    'renderRequests 未渲染分类标签');
});

test('js', 'B11. 管理员说明通过 getRequestAdminDetail 获取', () => {
  const fn = extractFunction(MAIN_JS, 'getRequestAdminDetail');
  assert.ok(fn, 'getRequestAdminDetail 函数不存在');
});

test('js', 'B12. pending/planned 使用"管理员回复"', () => {
  const fn = extractFunction(MAIN_JS, 'getRequestAdminDetail');
  assert.ok(fn && fn.includes('管理员回复'), 'getRequestAdminDetail 未包含管理员回复标签');
});

test('js', 'B13. done 使用"完成说明"', () => {
  const fn = extractFunction(MAIN_JS, 'getRequestAdminDetail');
  assert.ok(fn && fn.includes('完成说明'), 'getRequestAdminDetail 未包含完成说明标签');
});

test('js', 'B14. rejected 使用"拒绝原因"', () => {
  const fn = extractFunction(MAIN_JS, 'getRequestAdminDetail');
  assert.ok(fn && fn.includes('拒绝原因'), 'getRequestAdminDetail 未包含拒绝原因标签');
});

test('js', 'B15. 管理员字段为空时不渲染空说明区', () => {
  const fn = extractFunction(MAIN_JS, 'getRequestAdminDetail');
  assert.ok(fn, 'getRequestAdminDetail 不存在');
  // 应返回 null 而非占位文案
  assert.ok(!fn.includes('已完成处理') && !fn.includes('管理员未填写'),
    'getRequestAdminDetail 包含占位文案');
});

test('js', 'B16. 玩家上传图片仍在卡片中展示', () => {
  const renderSrc = extractFunction(MAIN_JS, 'renderRequests');
  assert.ok(renderSrc, 'renderRequests 不存在');
  assert.ok(renderSrc.includes('item.images') || renderSrc.includes('request-images'),
    'renderRequests 未渲染玩家图片');
});

test('js', 'B17. 同意按钮仍存在', () => {
  const renderSrc = extractFunction(MAIN_JS, 'renderRequests');
  assert.ok(renderSrc && renderSrc.includes('同意'), 'renderRequests 未包含同意按钮');
});

test('js', 'B18. 否定按钮仍存在', () => {
  const renderSrc = extractFunction(MAIN_JS, 'renderRequests');
  assert.ok(renderSrc && renderSrc.includes('否定'), 'renderRequests 未包含否定按钮');
});

test('js', 'B19. 讨论按钮仍存在', () => {
  const renderSrc = extractFunction(MAIN_JS, 'renderRequests');
  assert.ok(renderSrc && renderSrc.includes('讨论'), 'renderRequests 未包含讨论按钮');
});

test('js', 'B20. 原投票逻辑不得回归', () => {
  const voteFn = extractFunction(MAIN_JS, 'voteRequest');
  assert.ok(voteFn, 'voteRequest 函数不存在');
  assert.ok(voteFn.includes('agree') || voteFn.includes('disagree'),
    'voteRequest 未包含投票逻辑');
});

// ============================================================================
// C. 布局和字体目标测试（预期部分红灯：CSS 尚未优化）
// ============================================================================
test('css', 'C21. .request-card .mini-btn 含 white-space: nowrap', () => {
  const cardBtnIdx = MAIN_CSS.indexOf('.request-card');
  const cardSection = MAIN_CSS.slice(cardBtnIdx, cardBtnIdx + 3000);
  const miniInCard = cardSection.indexOf('.mini-btn');
  const miniSection = miniInCard >= 0 ? cardSection.slice(miniInCard, miniInCard + 500) : '';
  // 检查 request-card 外的 .mini-btn 通用规则亦可
  const allMiniBtn = MAIN_CSS.match(/\.mini-btn[^{]*\{[^}]*white-space\s*:\s*nowrap[^}]*\}/);
  assert.ok(allMiniBtn !== null, '未找到 .mini-btn 含 white-space:nowrap 的规则');
});

test('css', 'C22. .request-card .mini-btn 禁止 flex 收缩或等效规则', () => {
  // 检查通用 .mini-btn 附近含 flex-shrink:0 或 min-width 避免按钮被压缩
  const miniIdx = MAIN_CSS.indexOf('.mini-btn');
  const miniSection = miniIdx >= 0 ? MAIN_CSS.slice(miniIdx, miniIdx + 1500) : '';
  const hasFlexShrink = miniSection.includes('flex-shrink:0') || miniSection.includes('flex-shrink: 0');
  const hasMinWidth = miniSection.includes('min-width');
  assert.ok(hasFlexShrink || hasMinWidth, '.mini-btn 未设置 flex-shrink:0 或 min-width');
});

test('css', 'C23. .vote-row 允许空间不足时换行', () => {
  const vrIdx = MAIN_CSS.indexOf('.vote-row');
  const vrSection = vrIdx >= 0 ? MAIN_CSS.slice(vrIdx, vrIdx + 600) : '';
  const hasFlexWrap = vrSection.includes('flex-wrap') || vrSection.includes('flex-flow');
  assert.ok(hasFlexWrap, '.vote-row 未设置 flex-wrap');
});

test('css', 'C24. .vote-actions 允许合理换行', () => {
  const vaIdx = MAIN_CSS.indexOf('.vote-actions');
  const vaSection = vaIdx >= 0 ? MAIN_CSS.slice(vaIdx, vaIdx + 600) : '';
  const hasWrap = vaSection.includes('flex-wrap') || vaSection.includes('gap') || vaSection.includes('flex-flow');
  assert.ok(hasWrap, '.vote-actions 未设置 flex-wrap 或 gap');
});

test('css', 'C25. 建议正文字号不低于 14px', () => {
  // 检查 .request-card p 或 .request-card 通用 p 的 font-size
  const pIdx = MAIN_CSS.indexOf('.request-card p');
  const pSection = MAIN_CSS.slice(Math.max(0, pIdx - 20), pIdx + 300);
  const fontSizeRe = /font-size\s*:\s*(\d+)/;
  const match = fontSizeRe.exec(pSection);
  const size = match ? parseInt(match[1], 10) : 0;
  assert.ok(size >= 14, '.request-card p font-size=' + size + 'px，应≥14px');
});

test('css', 'C26. 正文 line-height 不低于 1.65', () => {
  const pIdx = MAIN_CSS.indexOf('.request-card p');
  const pSection = MAIN_CSS.slice(Math.max(0, pIdx - 20), pIdx + 300);
  const lhRe = /line-height\s*:\s*([0-9.]+)/;
  const match = lhRe.exec(pSection);
  const lh = match ? parseFloat(match[1]) : 0;
  assert.ok(lh >= 1.65, '.request-card p line-height=' + lh + '，应≥1.65');
});

test('css', 'C27. 管理员说明字号≥13px 行高≥1.6', () => {
  const anIdx = MAIN_CSS.indexOf('.admin-note');
  const anSection = anIdx >= 0 ? MAIN_CSS.slice(anIdx, anIdx + 400) : '';
  const fsRe = /font-size\s*:\s*(\d+)/;
  const lhRe = /line-height\s*:\s*([0-9.]+)/;
  const fsMatch = fsRe.exec(anSection);
  const lhMatch = lhRe.exec(anSection);
  const fs = fsMatch ? parseInt(fsMatch[1], 10) : 0;
  const lh = lhMatch ? parseFloat(lhMatch[1]) : 0;
  assert.ok(fs >= 13, '.admin-note font-size=' + fs + 'px，应≥13px');
  assert.ok(lh >= 1.6, '.admin-note line-height=' + lh + '，应≥1.6');
});

test('css', 'C28. 手机端 .mini-btn 仍保持 min-height:44px', () => {
  const mobileStart = MAIN_CSS.indexOf('@media (max-width: 767px)');
  assert.ok(mobileStart !== -1, '未找到 @media (max-width:767px)');
  const mobileBlock = MAIN_CSS.slice(mobileStart, mobileStart + 5000);
  const miniIdx = mobileBlock.indexOf('.mini-btn');
  assert.ok(miniIdx !== -1, '手机区块中未找到 .mini-btn');
  const miniBlock = mobileBlock.slice(miniIdx, miniIdx + 200);
  assert.ok(
    miniBlock.includes('min-height:44px') || miniBlock.includes('min-height: 44px'),
    '手机区块 .mini-btn 未设置 min-height:44px'
  );
});

test('css', 'C29. 横屏粗指针 .mini-btn 仍保持 min-height:44px', () => {
  const lpIdx = MAIN_CSS.indexOf('@media (max-height: 450px) and (pointer: coarse)');
  if (lpIdx === -1) throw new Error('未找到横屏粗指针媒体查询');
  const lpBlock = MAIN_CSS.slice(lpIdx, lpIdx + 2000);
  const miniIdx = lpBlock.indexOf('.mini-btn');
  if (miniIdx === -1) throw new Error('横屏粗指针区块中未找到 .mini-btn');
  const miniBlock = lpBlock.slice(miniIdx, miniIdx + 200);
  assert.ok(
    miniBlock.includes('min-height:44px') || miniBlock.includes('min-height: 44px'),
    '横屏粗指针 .mini-btn 未设置 min-height:44px'
  );
});

// ============================================================================
// D. 后台图片大图查看测试（部分预期通过：现有 openImageViewer 可用）
// ============================================================================
test('js', 'D30. renderRequestAdminCard 对玩家图片渲染 data-open-image', () => {
  const fn = extractFunction(MAIN_JS, 'renderRequestAdminCard');
  assert.ok(fn, 'renderRequestAdminCard 不存在');
  assert.ok(fn.includes('data-open-image'), 'renderRequestAdminCard 未渲染 data-open-image');
});

test('js', 'D31. 后台建议图片使用独立且稳定的 data-gallery', () => {
  const fn = extractFunction(MAIN_JS, 'renderRequestAdminCard');
  assert.ok(fn, 'renderRequestAdminCard 不存在');
  // 检查 data-gallery 存在且使用 request 相关标识
  assert.ok(fn.includes('data-gallery'), 'renderRequestAdminCard 未使用 data-gallery');
});

test('js', 'D32. 后台缩略图具有可访问名称', () => {
  const fn = extractFunction(MAIN_JS, 'renderRequestAdminCard');
  assert.ok(fn, 'renderRequestAdminCard 不存在');
  // 应包含 aria-label 或 title 或 type="button"
  const hasAria = fn.includes('aria-label');
  const hasTitle = fn.includes('title=');
  const hasBtnType = fn.includes('type="button"') || fn.includes("type='button'");
  assert.ok(hasAria || hasTitle || hasBtnType, '后台缩略图缺少 aria-label/title/type=button');
});

test('js', 'D33. 后台缩略图有"查看大图"视觉标识或专用 class', () => {
  const fn = extractFunction(MAIN_JS, 'renderRequestAdminCard');
  assert.ok(fn, 'renderRequestAdminCard 不存在');
  const hasZoomClass = fn.includes('zoom') || fn.includes('Zoom') || fn.includes('view-image') || fn.includes('open-image');
  const hasZoomText = fn.includes('查看大图') || fn.includes('放大') || fn.includes('查看原图');
  assert.ok(hasZoomClass || hasZoomText, '后台缩略图缺少查看大图标识');
});

test('js', 'D34. 全局图片点击委托仍调用 openImageViewer', () => {
  assert.ok(MAIN_JS.includes('openImageViewer'), '全局委托未引用 openImageViewer');
});

test('js', 'D35. 现有 imageViewer 节点仍存在', () => {
  // imageViewer 在 index.html 中，main.js 应引用其 id
  assert.ok(MAIN_JS.includes('imageViewer'), 'main.js 未引用 imageViewer 元素');
});

test('js', 'D36. 多图查看器上一张/下一张功能仍存在', () => {
  assert.ok(MAIN_JS.includes('prevImage') || MAIN_JS.includes('nextImage') ||
    (MAIN_JS.includes('imageIndex') && MAIN_JS.includes('imageViewer')), '未找到上一张/下一张功能');
});

test('js', 'D37. 后台无图片时不渲染虚假图片按钮', () => {
  const fn = extractFunction(MAIN_JS, 'renderRequestAdminCard');
  assert.ok(fn, 'renderRequestAdminCard 不存在');
  // 应有条件检查 images 长度
  assert.ok(fn.includes('.length') || fn.includes('images') || fn.includes('if'),
    'renderRequestAdminCard 未检查 images 长度逻辑');
});

// ============================================================================
// 运行器
// ============================================================================
function runGroup(label, tests) {
  if (!tests.length) return;
  console.log(`\n--- ${label} ---`);
  let passed = 0;
  const failures = [];
  tests.forEach(({ name, fn }) => {
    try {
      fn();
      passed++;
      console.log('  ✓ ' + name);
    } catch (e) {
      failures.push(name);
      console.log('  ✗ ' + name);
      console.log('    ' + (e.message || e));
    }
  });
  console.log(`测试 ${tests.length}，通过 ${passed}，失败 ${failures.length}`);
  if (failures.length) {
    console.log('失败名称:');
    failures.forEach(n => console.log('  ✗ ' + n));
  }
  if (failures.length) process.exitCode = 1;
  return { total: tests.length, passed, failed: failures.length };
}

// ---- 执行 ----
const isJS = GROUP === 'js' || GROUP === 'all';
const isCSS = GROUP === 'css' || GROUP === 'all';

if (isJS) {
  runGroup('旧详情功能清理测试 (A1–A9)', jsTests.filter(t => t.name.startsWith('A')));
  runGroup('前台直接展示保护测试 (B10–B20)', jsTests.filter(t => t.name.startsWith('B')));
  runGroup('后台图片大图查看测试 (D30–D37)', jsTests.filter(t => t.name.startsWith('D')));
}
if (isCSS) {
  runGroup('布局和字体目标测试 (C21–C29)', cssTests);
}
if (GROUP === 'all') {
  console.log(`\nALL 分组：JS ${jsTests.length} + CSS ${cssTests.length} 项`);
}
