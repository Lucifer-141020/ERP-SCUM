// 生产页预检脚本专项测试
// 检验 build-frontend-preview.js：
//   - 不修改源文件（SHA256 校验）
//   - 能正确生成 preview 文件
//   - preview 文件结构完整
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');
const os = require('os');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + ' — ' + e.message); process.exitCode = 1; }
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

console.log('生产页预检脚本专项测试（加强版）：\n');

// ---- 0. SHA256 校验：构建前后源文件不得变更 ----
const guardedFiles = [
  { name: 'erp14-server-showcase.html',      path: path.join(ROOT, 'erp14-server-showcase.html') },
  { name: 'frontend/index.html',              path: path.join(ROOT, 'frontend', 'index.html') },
  { name: 'frontend/css/main.css',            path: path.join(ROOT, 'frontend', 'css', 'main.css') },
  { name: 'frontend/js/main.js',              path: path.join(ROOT, 'frontend', 'js', 'main.js') },
];

console.log('  记录源文件 SHA256...');
const beforeHashes = {};
guardedFiles.forEach(function(f) {
  beforeHashes[f.name] = sha256(f.path);
  console.log('    %s: %s', f.name, beforeHashes[f.name].slice(0, 16) + '...');
});

// ---- 1. 脚本存在 ----
test('build-frontend-preview.js 存在', function () {
  assert.ok(fs.existsSync(path.join(ROOT, 'scripts', 'build-frontend-preview.js')), '脚本不存在');
});

// ---- 2. 构建前清除旧 preview 文件 ----
const previewPath = path.join(os.tmpdir(), 'erp14-frontend-preview-test-' + process.pid + '.html');
const previewAssetsPath = path.join(os.tmpdir(), 'erp14-frontend-preview-assets-' + process.pid);
if (fs.existsSync(previewPath)) {
  console.log('  删除旧 preview 文件...');
  // 不删除旧 preview：预览服务可能正在读取它，Windows 会因此返回 EPERM。
  console.log('    旧文件已删除');
}

// ---- 3. 运行构建脚本（不允许吞错误） ----
console.log('  运行 build-frontend-preview.js...');
execSync('node scripts/build-frontend-preview.js', {
  cwd: ROOT,
  stdio: ['pipe', 'ignore', 'ignore'],
  env: { ...process.env, PREVIEW_OUTPUT_PATH: previewPath, PREVIEW_ASSETS_PATH: previewAssetsPath }
});
console.log('    构建完成');

// ---- 4. 验证 preview 文件已重新生成 ----
test('构建后 dist/erp14-server-showcase.preview.html 已重新生成', function () {
  assert.ok(fs.existsSync(previewPath), 'preview 文件未生成');
});
const previewSize = fs.statSync(previewPath).size;
test('preview 文件大小大于 0', function () {
  assert.ok(previewSize > 0, 'preview 文件为空');
});
console.log('  预览文件大小: %d 字节', previewSize);

// ---- 5. SHA256 校验：确认源文件未被修改 ----
console.log('  校验源文件 SHA256（构建后）...');
guardedFiles.forEach(function(f) {
  const afterHash = sha256(f.path);
  test('"' + f.name + '" 构建前后一致', function () {
    assert.strictEqual(afterHash, beforeHashes[f.name], 'SHA256 不一致！文件被意外修改');
  });
});

// ---- 6. preview 包含主要结构 ----
const previewContent = fs.readFileSync(previewPath, 'utf8');
const checks = ['topbar', 'nav', 'home', 'play', 'requests', 'events', 'panel'];
checks.forEach(function(key) {
  test('preview 文件含 "' + key + '"', function () {
    assert.ok(previewContent.indexOf(key) !== -1, '缺少 ' + key);
  });
});

// ---- 7. preview 包含内嵌 CSS（main.css 中的关键样式） ----
const cssChecks = ['.backup-section', '.library-item', '.panel-side', '.activity-panel', '.log-table'];
cssChecks.forEach(function(cls) {
  test('preview 文件含 CSS 类 "' + cls + '"', function () {
    assert.ok(previewContent.indexOf(cls) !== -1, '缺少 CSS 类 ' + cls);
  });
});

// ---- 8. preview 包含内嵌 JS（关键函数） ----
const fnChecks = ['renderAll', 'renderPanel', 'renderPlay', 'renderRequestManagePanel', 'renderImageLibraryPanel', 'renderBackupPanel'];
fnChecks.forEach(function(fn) {
  test('preview 文件含函数 "' + fn + '"', function () {
    assert.ok(previewContent.indexOf('function ' + fn) !== -1 || previewContent.indexOf('async function ' + fn) !== -1, '缺少函数 ' + fn);
  });
});

// ---- 9. 不覆盖生产文件 ----
test('脚本不覆盖 erp14-server-showcase.html', function () {
  const prodPath = path.join(ROOT, 'erp14-server-showcase.html');
  assert.ok(fs.existsSync(prodPath), '生产文件不存在');
  assert.notStrictEqual(previewPath, prodPath, 'preview 路径与生产文件路径相同');
});
test('preview 文件名不叫 erp14-server-showcase.html', function () {
  assert.ok(path.basename(previewPath) !== 'erp14-server-showcase.html', 'preview 文件名与生产文件同名');
});

// ---- 10. preview 文件结构合理 ----
test('preview 文件有 <style> 标签内嵌 CSS', function () {
  const styleMatch = previewContent.match(/<style>[\s\S]*?<\/style>/);
  assert.ok(styleMatch !== null, '缺少 <style> 标签');
  assert.ok(styleMatch[0].length > 1000, '<style> 内容过短');
});
test('preview 文件有 <script> 标签内嵌 JS', function () {
  const scriptMatch = previewContent.match(/<script>[\s\S]*?<\/script>/);
  assert.ok(scriptMatch !== null, '缺少 <script> 标签');
  assert.ok(scriptMatch[0].length > 1000, '<script> 内容过短');
});
test('preview 文件不含外部引用 ./css/main.css', function () {
  assert.ok(previewContent.indexOf('./css/main.css') === -1, '仍含外部 CSS 引用');
});
test('preview 文件不含外部引用 ./js/main.js', function () {
  assert.ok(previewContent.indexOf('./js/main.js') === -1, '仍含外部 JS 引用');
});

console.log('\n通过 ' + passed + ' / ' + passed + (process.exitCode ? ' （有失败）' : ' 全部通过'));
