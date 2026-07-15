#!/usr/bin/env node
// 玩家建议卡片简化与后台图片大图查看（严格断言版）
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const MAIN_JS = fs.readFileSync(path.join(__dirname, '..', 'frontend/js/main.js'), 'utf8');
const MAIN_CSS = fs.readFileSync(path.join(__dirname, '..', 'frontend/css/main.css'), 'utf8');
const INDEX_HTML = fs.readFileSync(path.join(__dirname, '..', 'frontend/index.html'), 'utf8');

const GROUP = (process.argv.find(a => a.startsWith('--group=')) || '--group=all').slice(8);
if (!['js', 'css', 'all'].includes(GROUP)) {
  console.error('非法 group: ' + GROUP + '，仅允许 js / css / all');
  process.exit(1);
}

const jsTests = [];
const cssTests = [];
function test(group, name, fn) {
  const entry = { name, fn };
  if (group === 'js' || group === 'all') jsTests.push(entry);
  if (group === 'css' || group === 'all') cssTests.push(entry);
}

// ---- 工具函数 ----
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

// escapeHtml/escapeAttr（用于 D37 沙箱）
const ESCAPE_HTML_SRC = `
function escapeHtml(value) {
  if (!value && value !== 0) return '';
  return String(value).replace(/[&<>"']/g, function(c) {
    if (c === '&') return '&amp;'; if (c === '<') return '&lt;'; if (c === '>') return '&gt;';
    if (c === '"') return '&quot;'; if (c === "'") return '&#39;'; return c;
  });
}
function escapeAttr(value) { return escapeHtml(value); }
`;

// 提取 CSS 规则块：找到 selector 后的花括号平衡区间
function extractCssBlock(css, selector) {
  var idx = css.indexOf(selector);
  if (idx === -1) return null;
  var brace = css.indexOf('{', idx);
  if (brace === -1) return null;
  var depth = 0;
  for (var i = brace; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') { depth--; if (depth === 0) return css.slice(brace + 1, i); }
  }
  return null;
}

// escapeHtml 内联（用于 D37 沙箱）
const ESCAPE_HTML = function escapeHtml(value) {
  if (!value && value !== 0) return '';
  return String(value).replace(/[&<>"']/g, function(c) {
    if (c === '&') return '&amp;'; if (c === '<') return '&lt;'; if (c === '>') return '&gt;';
    if (c === '"') return '&quot;'; if (c === "'") return '&#39;'; return c;
  });
};
const escapeAttr = function escapeAttr(v) { return ESCAPE_HTML(v); };

// ============================================================================
// A. 旧详情功能清理测试（预期红灯）
// ============================================================================
test('js', 'A1. expandedRequestId 不应存在', () => {
  assert.ok(!extractVariableAssignment(MAIN_JS, 'expandedRequestId'), 'expandedRequestId 声明仍存在');
});
test('js', 'A2. buildRequestDetail 不应存在', () => {
  assert.ok(!extractFunction(MAIN_JS, 'buildRequestDetail'), 'buildRequestDetail 仍存在');
});
test('js', 'A3. resetExpandedRequest 不应存在', () => {
  assert.ok(!extractFunction(MAIN_JS, 'resetExpandedRequest'), 'resetExpandedRequest 仍存在');
});
test('js', 'A4. toggleRequestDetail 不应存在', () => {
  assert.ok(!extractFunction(MAIN_JS, 'toggleRequestDetail'), 'toggleRequestDetail 仍存在');
});
test('js', 'A5. data-action="toggle-request-detail" 不应存在', () => {
  assert.ok(!MAIN_JS.includes('toggle-request-detail'), 'toggle-request-detail 仍存在');
});
test('js', 'A6. renderRequests 中 request-detail- 不应存在', () => {
  var ri = MAIN_JS.indexOf('function renderRequests()');
  var rs = MAIN_JS.slice(ri, ri + 2000);
  assert.ok(!rs.includes('request-detail-'), 'renderRequests 仍含 request-detail-');
});
test('js', 'A7. renderRequests 中查看/收起详情文案不应存在', () => {
  var ri = MAIN_JS.indexOf('function renderRequests()');
  var rs = MAIN_JS.slice(ri, ri + 2000);
  assert.ok(!rs.includes('查看详情') && !rs.includes('收起详情'), '仍含查看/收起详情');
});
test('js', 'A8. 筛选/搜索不再调用 resetExpandedRequest', () => {
  if (extractFunction(MAIN_JS, 'resetExpandedRequest')) {
    var sb = extractHandlerBody(MAIN_JS, 'requestSearch', 'input', false);
    if (sb) assert.ok(!sb.includes('resetExpandedRequest'), 'requestSearch 仍含 resetExpandedRequest');
    var tb = extractHandlerBody(MAIN_JS, 'requestTabs', 'click', true);
    if (tb) assert.ok(!tb.includes('resetExpandedRequest'), 'requestTabs 仍含 resetExpandedRequest');
    var cb = extractHandlerBody(MAIN_JS, 'requestCategoryFilters', 'click', true);
    if (cb) assert.ok(!cb.includes('resetExpandedRequest'), 'requestCategoryFilters 仍含 resetExpandedRequest');
  }
});
test('js', 'A9. 全局点击委托不再处理 toggle-request-detail', () => {
  assert.ok(!MAIN_JS.includes('toggle-request-detail'), '全局委托仍含 toggle-request-detail');
});

// ============================================================================
// B. 前台直接展示保护测试（预期通过）
// ============================================================================
test('js', 'B10. renderRequests 渲染建议正文/玩家/标签', () => {
  var rs = extractFunction(MAIN_JS, 'renderRequests');
  assert.ok(rs, 'renderRequests 不存在');
  assert.ok(rs.includes('item.text') || rs.includes('item.title'), '未渲染正文');
  assert.ok(rs.includes('item.user'), '未渲染提交人');
  assert.ok(rs.includes('item.category') || rs.includes('requestCategoryLabel'), '未渲染分类');
});
test('js', 'B11. getRequestAdminDetail 存在', () => {
  assert.ok(extractFunction(MAIN_JS, 'getRequestAdminDetail'), 'getRequestAdminDetail 不存在');
});
test('js', 'B12. 含"管理员回复"标签', () => {
  var fn = extractFunction(MAIN_JS, 'getRequestAdminDetail');
  assert.ok(fn && fn.includes('管理员回复'), '未含管理员回复');
});
test('js', 'B13. 含"完成说明"标签', () => {
  var fn = extractFunction(MAIN_JS, 'getRequestAdminDetail');
  assert.ok(fn && fn.includes('完成说明'), '未含完成说明');
});
test('js', 'B14. 含"拒绝原因"标签', () => {
  var fn = extractFunction(MAIN_JS, 'getRequestAdminDetail');
  assert.ok(fn && fn.includes('拒绝原因'), '未含拒绝原因');
});
test('js', 'B15. 无占位文案', () => {
  var fn = extractFunction(MAIN_JS, 'getRequestAdminDetail');
  assert.ok(fn, 'getRequestAdminDetail 不存在');
  assert.ok(!fn.includes('已完成处理') && !fn.includes('管理员未填写'), '含占位文案');
});
test('js', 'B16. 前台图片渲染', () => {
  var rs = extractFunction(MAIN_JS, 'renderRequests');
  assert.ok(rs && (rs.includes('item.images') || rs.includes('request-images')), '未渲染图片');
});
test('js', 'B17. 同意按钮', () => {
  assert.ok(extractFunction(MAIN_JS, 'renderRequests').includes('同意'), '未含同意');
});
test('js', 'B18. 否定按钮', () => {
  assert.ok(extractFunction(MAIN_JS, 'renderRequests').includes('否定'), '未含否定');
});
test('js', 'B19. 讨论按钮', () => {
  assert.ok(extractFunction(MAIN_JS, 'renderRequests').includes('讨论'), '未含讨论');
});
test('js', 'B20. voteRequest 存在', () => {
  assert.ok(extractFunction(MAIN_JS, 'voteRequest'), 'voteRequest 不存在');
});

// ============================================================================
// C. 布局和字体（预期：C21-C25 红灯，C26-C29 通过）
// ============================================================================
test('css', 'C21. .request-card .mini-btn 含 white-space:nowrap', () => {
  // 只检查专用选择器，不接受全局 .mini-btn
  var block = extractCssBlock(MAIN_CSS, '.request-card .mini-btn') ||
              extractCssBlock(MAIN_CSS, '.request-card .vote-actions .mini-btn');
  assert.ok(block && block.includes('white-space:nowrap') || block && block.includes('white-space: nowrap'),
    '.request-card .mini-btn 未设置 white-space:nowrap');
});
test('css', 'C22. .request-card .mini-btn 含 flex-shrink:0', () => {
  var block = extractCssBlock(MAIN_CSS, '.request-card .mini-btn') ||
              extractCssBlock(MAIN_CSS, '.request-card .vote-actions .mini-btn');
  assert.ok(block && (block.includes('flex-shrink:0') || block.includes('flex-shrink: 0') || block.includes('flex:0 0 auto') || block.includes('flex: 0 0 auto')),
    '.request-card .mini-btn 未设置 flex-shrink:0');
});
test('css', 'C23. .vote-row 含 flex-wrap', () => {
  var block = extractCssBlock(MAIN_CSS, '.vote-row') || '';
  assert.ok(block.includes('flex-wrap'), '.vote-row 未设置 flex-wrap');
});
test('css', 'C24. .vote-actions 含 flex-wrap 或 gap', () => {
  var block = extractCssBlock(MAIN_CSS, '.vote-actions') || '';
  assert.ok(block.includes('flex-wrap') || block.includes('gap') || block.includes('flex-flow'), '.vote-actions 未设 flex-wrap/gap');
});
test('css', 'C25. .request-card p font-size ≥14px', () => {
  var pi = MAIN_CSS.indexOf('.request-card p');
  var ps = MAIN_CSS.slice(Math.max(0, pi - 20), pi + 300);
  var m = /font-size\s*:\s*(\d+)/.exec(ps);
  var sz = m ? parseInt(m[1], 10) : 0;
  assert.ok(sz >= 14, '.request-card p font-size=' + sz + 'px, ≥14px');
});
test('css', 'C26. .request-card p line-height ≥1.65', () => {
  var pi = MAIN_CSS.indexOf('.request-card p');
  var ps = MAIN_CSS.slice(Math.max(0, pi - 20), pi + 300);
  var m = /line-height\s*:\s*([0-9.]+)/.exec(ps);
  var lh = m ? parseFloat(m[1]) : 0;
  assert.ok(lh >= 1.65, 'line-height=' + lh + ', ≥1.65');
});
test('css', 'C27. .admin-note font≥13px lh≥1.6', () => {
  var ai = MAIN_CSS.indexOf('.admin-note');
  var as = ai >= 0 ? MAIN_CSS.slice(ai, ai + 400) : '';
  var fs = /font-size\s*:\s*(\d+)/.exec(as);
  var lh = /line-height\s*:\s*([0-9.]+)/.exec(as);
  assert.ok(fs && parseInt(fs[1], 10) >= 13, 'font-size 不足');
  assert.ok(lh && parseFloat(lh[1]) >= 1.6, 'line-height 不足');
});
test('css', 'C28. 手机 .mini-btn min-height:44px', () => {
  var ms = MAIN_CSS.indexOf('@media (max-width: 767px)');
  assert.ok(ms !== -1, '未找到 @media');
  var mb = MAIN_CSS.slice(ms, ms + 5000);
  var mi = mb.indexOf('.mini-btn');
  assert.ok(mi !== -1, '手机区块无 .mini-btn');
  assert.ok(mb.slice(mi, mi + 200).includes('min-height:44px') || mb.slice(mi, mi + 200).includes('min-height: 44px'), '未设置 44px');
});
test('css', 'C29. 横屏粗指针 .mini-btn min-height:44px', () => {
  var li = MAIN_CSS.indexOf('@media (max-height: 450px) and (pointer: coarse)');
  assert.ok(li !== -1, '未找到 @media');
  var lb = MAIN_CSS.slice(li, li + 2000);
  var mi = lb.indexOf('.mini-btn');
  assert.ok(mi !== -1, '横屏区块无 .mini-btn');
  assert.ok(lb.slice(mi, mi + 200).includes('min-height:44px') || lb.slice(mi, mi + 200).includes('min-height: 44px'), '未设置 44px');
});

// ============================================================================
// D. 后台图片大图查看测试
// ============================================================================
test('js', 'D30. renderRequestAdminCard 含 data-open-image', () => {
  var fn = extractFunction(MAIN_JS, 'renderRequestAdminCard');
  assert.ok(fn && fn.includes('data-open-image'), 'renderRequestAdminCard 未含 data-open-image');
});
test('js', 'D31. 后台含独立 data-gallery="admin-request-"', () => {
  var fn = extractFunction(MAIN_JS, 'renderRequestAdminCard');
  assert.ok(fn && fn.includes('data-gallery="admin-request-') || fn && fn.includes("data-gallery='admin-request-"),
    '后台建议图片未使用独立 admin-request- gallery');
});
test('js', 'D32. 后台缩略图含 aria-label/title 含"查看大图"', () => {
  var fn = extractFunction(MAIN_JS, 'renderRequestAdminCard');
  assert.ok(fn, 'renderRequestAdminCard 不存在');
  // type="button" 不能替代可访问名称；必须含 aria-label 或 title 且包含 查看大图
  var hasAria = fn.includes('aria-label') && fn.includes('查看大图');
  var hasTitle = fn.includes('title=') && fn.includes('查看大图');
  assert.ok(hasAria || hasTitle, '后台缩略图缺少 aria-label/title 含"查看大图"');
});
test('js', 'D33a. renderRequestAdminCard 使用后台大图专用 class', () => {
  var fn = extractFunction(MAIN_JS, 'renderRequestAdminCard');
  assert.ok(fn, 'renderRequestAdminCard 不存在');
  // 禁止 data-open-image 或 type=button 或 request-thumb 单独通过
  var hasDedicatedClass = fn.includes('admin-request-thumb') || fn.includes('request-thumb-zoom') || fn.includes('admin-thumb');
  assert.ok(hasDedicatedClass, '后台缩略图未使用专用 class 如 admin-request-thumb');
});
test('css', 'D33b. CSS 对专用 class 含提示规则', () => {
  // 检查是否存在对 admin-request-thumb / request-thumb-zoom 的 hover/::after/transform 规则
  var hasHover = MAIN_CSS.includes('admin-request-thumb') || MAIN_CSS.includes('request-thumb-zoom') || MAIN_CSS.includes('admin-thumb');
  if (hasHover) {
    // 如果有专用 class，检查有 hover 或 ::after 提示
    var idx = MAIN_CSS.indexOf(hasHover ? (MAIN_CSS.includes('admin-request-thumb') ? 'admin-request-thumb' : 'request-thumb-zoom') : '');
    if (idx >= 0) {
      var block = MAIN_CSS.slice(idx, idx + 400);
      assert.ok(block.includes(':hover') || block.includes('::after') || block.includes('::before') || block.includes('transform'), '专用 class 缺少 hover/伪元素提示');
    }
  }
  // 没有专用 class → 红灯
  assert.ok(hasHover, 'CSS 中无后台大图专用 class');
});
test('js', 'D34. data-open-image 点击委托精确调用 openImageViewer', () => {
  // 定位 event.target.closest('[data-open-image]') 处理块
  var delegateIdx = MAIN_JS.indexOf("event.target.closest('[data-open-image]')");
  if (delegateIdx === -1) delegateIdx = MAIN_JS.indexOf('closest([data-open-image]');
  if (delegateIdx === -1) delegateIdx = MAIN_JS.indexOf('data-open-image', 4000);
  assert.ok(delegateIdx !== -1, '未找到 data-open-image 点击委托');
  // 从委托位置向后搜索 openImageViewer( 调用，距离可达900字符
  var afterIdx = MAIN_JS.indexOf('openImageViewer(', delegateIdx);
  assert.ok(afterIdx !== -1 && afterIdx < delegateIdx + 1200, 'data-open-image 委托块未调用 openImageViewer()');
});
test('js', 'D35. imageViewer 节点存在且 JS 操作', () => {
  // HTML 节点
  assert.ok(INDEX_HTML.includes('id="imageViewer"'), 'index.html 无 id="imageViewer"');
  assert.ok(INDEX_HTML.includes('id="imageViewerImg"'), 'index.html 无 id="imageViewerImg"');
  assert.ok(INDEX_HTML.includes('id="closeImageViewer"'), 'index.html 无 id="closeImageViewer"');
  // JS openImageViewer 操作 imageViewer
  var oiv = extractFunction(MAIN_JS, 'openImageViewer');
  assert.ok(oiv && oiv.includes('imageViewer'), 'openImageViewer 未操作 imageViewer');
});
test('js', 'D36. 上一张/下一张节点与绑定', () => {
  assert.ok(INDEX_HTML.includes('id="imageViewerPrev"'), 'index.html 无 imageViewerPrev');
  assert.ok(INDEX_HTML.includes('id="imageViewerNext"'), 'index.html 无 imageViewerNext');
  // 检查 main.js 中有 addEventListener 绑定
  var hasPrevListener = MAIN_JS.indexOf("document.getElementById('imageViewerPrev')") >= 0;
  var hasNextListener = MAIN_JS.indexOf("document.getElementById('imageViewerNext')") >= 0;
  assert.ok(hasPrevListener && hasNextListener, 'imageViewerPrev/Next 无 JS 绑定');
  // 检查 openImageViewer 引用这些元素（直接在源码中扫描 body）
  var oivStart = MAIN_JS.indexOf('function openImageViewer(');
  var oivEnd = MAIN_JS.indexOf('function moveImageViewer(');
  var oivBody = MAIN_JS.slice(oivStart, oivEnd >= 0 ? oivEnd : oivStart + 3000);
  assert.ok(oivBody.includes('imageViewerPrev') && oivBody.includes('imageViewerNext'),
    'openImageViewer 未操作 Prev/Next');
});
test('js', 'D37. 无图不渲染, 有图才渲染（沙箱执行）', () => {
  var fnSrc = extractFunction(MAIN_JS, 'renderRequestAdminCard');
  var rlSrc = extractFunction(MAIN_JS, 'requestLabel');
  var nrsSrc = extractFunction(MAIN_JS, 'normalizeRequestStatus');
  assert.ok(fnSrc && rlSrc && nrsSrc, '依赖函数缺失');
  // 构建沙箱函数：将辅助函数定义后返回 renderRequestAdminCard
  var factory = new Function(nrsSrc + '\n' + rlSrc + '\n' + ESCAPE_HTML_SRC + '\nreturn ' + fnSrc + ';');
  var renderFn = factory();
  // 测试1: 空图片
  var html1 = renderFn({ id:1, title:'无图', text:'内容', user:'玩家', status:'pending', category:'BUG', contact:'QQ', adminReply:'', rejectReason:'', agree:0, disagree:0, images:[] }, 0);
  assert.ok(typeof html1 === 'string' && !html1.includes('data-open-image'), '无图分支仍渲染 data-open-image');
  // 测试2: 有图片
  var html2 = renderFn({ id:2, title:'有图', text:'内容', user:'玩家', status:'pending', category:'BUG', contact:'QQ', adminReply:'', rejectReason:'', agree:0, disagree:0, images:['data:image/png;base64,TEST'] }, 1);
  assert.ok(typeof html2 === 'string' && html2.includes('data-open-image'), '有图分支未渲染 data-open-image');
  assert.ok(html2.includes('data-gallery="admin-request-') || html2.includes("data-gallery='admin-request-"), '有图分支未用 admin-request- gallery');
  assert.ok(html2.includes('admin-request-thumb') || html2.includes('request-thumb-zoom') || html2.includes('admin-thumb'),
    '有图分支未使用后台专用 class');
});

// ============================================================================
// 运行器
// ============================================================================
function runGroup(label, tests) {
  if (!tests.length) return;
  console.log('\n--- ' + label + ' ---');
  var passed = 0, failures = [];
  tests.forEach(function(t) {
    try {
      t.fn();
      passed++;
      console.log('  \u2713 ' + t.name);
    } catch (e) {
      failures.push(t.name);
      console.log('  \u2717 ' + t.name + '\n    ' + (e.message || e));
    }
  });
  console.log('测试 ' + tests.length + '，通过 ' + passed + '，失败 ' + failures.length);
  if (failures.length) {
    console.log('失败名称:');
    failures.forEach(function(n) { console.log('  \u2717 ' + n); });
  }
  if (failures.length) process.exitCode = 1;
}

var isJS = GROUP === 'js' || GROUP === 'all';
var isCSS = GROUP === 'css' || GROUP === 'all';
if (isJS) {
  runGroup('旧详情功能清理测试 (A1–A9)', jsTests.filter(function(t) { return t.name[0] === 'A'; }));
  runGroup('前台直接展示保护测试 (B10–B20)', jsTests.filter(function(t) { return t.name[0] === 'B'; }));
  runGroup('后台图片大图查看测试 (D30–D37)', jsTests.filter(function(t) { return t.name[0] === 'D'; }));
}
if (isCSS) {
  runGroup('布局和字体目标测试 (C21–C29)', cssTests);
}
if (GROUP === 'all') {
  console.log('\nALL 分组：JS ' + jsTests.length + ' 项 + CSS ' + cssTests.length + ' 项 = ' + (jsTests.length + cssTests.length) + ' 项');
}
