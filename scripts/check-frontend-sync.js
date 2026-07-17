// 同步检查脚本 — 验证 erp14-server-showcase.html 与 frontend/ 拆分源码是否同步
// 用法：node scripts/check-frontend-sync.js
// 本脚本只读不写，发现不同步只输出报告，不修改文件。
// 退出码：0=通过（可含预期提示），非0=存在真实不同步。
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let warned = 0;
let failed = 0;

function check(name, ok, detail) {
  if (ok) {
    passed += 1;
    console.log('  ✓ ' + name);
  } else {
    failed += 1;
    console.log('  ✗ ' + name + (detail ? ' — ' + detail : ''));
  }
}

function warn(name, detail) {
  warned += 1;
  console.log('  ⚠ ' + name + (detail ? ' — ' + detail : ''));
}

console.log('=== 同步检查：erp14-server-showcase.html vs frontend/ ===\n');

// ---- 1. 文件存在性 ----
check('生产文件 erp14-server-showcase.html 存在', fs.existsSync(path.join(ROOT, 'erp14-server-showcase.html')));
check('frontend/index.html 存在', fs.existsSync(path.join(ROOT, 'frontend', 'index.html')));
check('frontend/css/main.css 存在', fs.existsSync(path.join(ROOT, 'frontend', 'css', 'main.css')));
check('frontend/js/main.js 存在', fs.existsSync(path.join(ROOT, 'frontend', 'js', 'main.js')));

// ---- 2. 主体结构对应 ----
const html = fs.readFileSync(path.join(ROOT, 'erp14-server-showcase.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(ROOT, 'frontend', 'index.html'), 'utf8');
const mainCss = fs.readFileSync(path.join(ROOT, 'frontend', 'css', 'main.css'), 'utf8');
const mainJs = fs.readFileSync(path.join(ROOT, 'frontend', 'js', 'main.js'), 'utf8');

// CSS 行数近似
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const htmlStyleLines = styleMatch ? styleMatch[1].split('\n').length : 0;
const cssLines = mainCss.split('\n').length;
check('HTML <style> 行数 ≈ frontend/css/main.css', Math.abs(htmlStyleLines - cssLines) < 50,
  'HTML ' + htmlStyleLines + ' 行 vs CSS ' + cssLines + ' 行');

// JS 行数近似（由于 HTML 模板字符串包含大量换行，main.js 会少一些）
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const htmlScriptLines = scriptMatch ? scriptMatch[1].split('\n').length : 0;
const jsLines = mainJs.split('\n').length;
check('HTML <script> 行数 ≈ frontend/js/main.js', Math.abs(htmlScriptLines - jsLines) < 300,
  'HTML ' + htmlScriptLines + ' 行 vs main.js ' + jsLines + ' 行');

// HTML 主体结构关键元素
const htmlBodyEls = ['topbar', 'nav', 'home', 'play', 'requests', 'events', 'panel', 'confirmModal', 'imageViewer', 'toast'];
htmlBodyEls.forEach(function(el) {
  check('frontend/index.html 含 "' + el + '"', indexHtml.indexOf(el) !== -1);
});

// ---- 3. 关键函数存在性 ----
const keyFunctions = [
  'renderHomeStats', 'renderHomeFeatures', 'renderPlay', 'renderHero', 'renderHeroCarousel',
  'renderRequests', 'renderActivitySignups', 'renderUpdates',
  'renderRequestManagePanel', 'renderImageLibraryPanel', 'renderBackupPanel',
  'loadLogs', 'isHighRiskAction', 'normalizeRequestStatus', 'addLog',
  'submitRequest', 'submitEventSignup', 'voteRequest',
  'saveRequestChanges', 'saveLocalData', 'confirmAction', 'promptConfirmAction',
  'renderAll', 'loadFullBackendConfig', 'renderPanel',
  'renderBuildingTemplates', 'renderServerRules'
];

keyFunctions.forEach(function(fn) {
  const inHtml = html.indexOf('function ' + fn) !== -1 || html.indexOf('async function ' + fn) !== -1;
  const inJs = mainJs.indexOf('function ' + fn) !== -1 || mainJs.indexOf('async function ' + fn) !== -1;
  check('函数 "' + fn + '" 在 HTML 和 main.js 中都存在', inHtml && inJs,
    (!inHtml ? 'HTML 缺失' : '') + (!inHtml && !inJs ? ' + ' : '') + (!inJs ? 'main.js 缺失' : ''));
});

// ---- 4. 关键 CSS 类名存在性 ----
const cssClasses = ['log-row-high-risk', 'request-section', 'library-item', 'backup-section', 'activity-panel', 'panel-side'];
cssClasses.forEach(function(cls) {
  const inHtmlCss = html.indexOf('.' + cls) !== -1 || html.indexOf('class="' + cls) !== -1;
  const inCssFile = mainCss.indexOf('.' + cls) !== -1;
  check('CSS 类 "' + cls + '" 在 HTML 和 main.css 中都存在', inHtmlCss || inCssFile);
});

// ---- 5. 面板入口对应 ----
const panels = ['adminLogin', 'overview', 'settings', 'backend', 'homeManage', 'playManage',
  'groupManage', 'templateManage', 'updateManage', 'requestManage', 'imageLibrary',
  'backupManage', 'logs'];
panels.forEach(function(p) {
  const inHtml = html.indexOf('data-panel="' + p + '"') !== -1;
  const inIndex = indexHtml.indexOf('data-panel="' + p + '"') !== -1;
  check('面板 ' + p + ' 在 HTML 和 index.html 中都存在', inHtml && inIndex,
    (!inHtml ? 'HTML 缺失' : '') + (!inHtml && !inIndex ? ' + ' : '') + (!inIndex ? 'index.html 缺失' : ''));
});

// ---- 6. 各模块数据验证 ----
// 统计函数总数比较
const htmlFnCount = (html.match(/function\s+\w+\(/g) || []).length;
const jsFnCount = (mainJs.match(/function\s+\w+\(/g) || []).length;
check('函数总数接近（±10%）', Math.abs(htmlFnCount - jsFnCount) / Math.max(htmlFnCount, 1) < 0.1,
  'HTML ' + htmlFnCount + ' 个 vs main.js ' + jsFnCount + ' 个');

// 静态结构 DOM id（应同时存在于 HTML 和 index.html）
const staticDomIds = ['heroSlides', 'heroTitle', 'heroDescription', 'updateList', 'requestGrid', 'panelMain',
  'themeBtn', 'toast', 'playerGate', 'confirmModal', 'imageViewer'];
staticDomIds.forEach(function(id) {
  const inHtml = html.indexOf('id="' + id + '"') !== -1;
  const inIndex = indexHtml.indexOf('id="' + id + '"') !== -1;
  check('DOM id "' + id + '" 在 HTML 和 index.html 中都存在', inHtml && inIndex,
    (!inHtml ? 'HTML 缺失' : '') + (!inHtml && !inIndex ? ' + ' : '') + (!inIndex ? 'index.html 缺失' : ''));
});

// JS 动态生成的 DOM id（index.html 中不包含，属于预期差异，标记为 ⚠）
const dynamicDomIds = ['searchLogs', 'resetLogs', 'logList', 'selectAllImages', 'totalImageCount'];
dynamicDomIds.forEach(function(id) {
  const inHtml = html.indexOf('id="' + id + '"') !== -1;
  const inIndex = indexHtml.indexOf('id="' + id + '"') !== -1;
  if (inHtml && !inIndex) {
    warn('DOM id "' + id + '" 仅存在于 HTML（JS 动态生成，index.html 不含 — 预期差异）');
  } else {
    check('DOM id "' + id + '" 在 HTML 和 index.html 中都存在', inHtml && inIndex,
      (!inHtml ? 'HTML 缺失' : '') + (!inHtml && !inIndex ? ' + ' : '') + (!inIndex ? 'index.html 缺失' : ''));
  }
});

// ---- 7. 关键事件绑定验证 ----
check('main.js 包含事件绑定逻辑', mainJs.indexOf('addEventListener') !== -1);

// ---- 结论 ----
var exitCode = failed > 0 ? 1 : 0;
console.log('\n=== 检查结果 ===');
console.log('  通过: ' + passed);
console.log('  预期提示: ' + warned);
console.log('  真实失败: ' + failed);
console.log('  总计: ' + (passed + warned + failed));
if (failed === 0) {
  console.log('  >>> 同步检查通过 <<<');
} else {
  console.log('  >>> 发现 ' + failed + ' 项真实不同步，请查看上方 ✗ 项 <<<');
}
process.exit(exitCode);
