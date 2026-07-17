// 一键验证总脚本专项测试
// 检查 verify-all.js 的结构完整性，不实际运行全部验证
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const SCRIPT = fs.readFileSync(path.join(ROOT, 'scripts', 'verify-all.js'), 'utf8');

let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + ' — ' + e.message); process.exitCode = 1; }
}

console.log('一键验证总脚本专项测试：\n');

// ---- 1. 文件存在 ----
test('verify-all.js 文件存在', function () {
  assert.ok(fs.existsSync(path.join(ROOT, 'scripts', 'verify-all.js')), '文件不存在');
});

// ---- 2. 包含 check-frontend-sync.js ----
test('包含 check-frontend-sync.js', function () {
  assert.ok(SCRIPT.indexOf('check-frontend-sync.js') !== -1, '缺少 check-frontend-sync.js');
});

// ---- 3. 包含 build-frontend-preview.js ----
test('包含 build-frontend-preview.js', function () {
  assert.ok(SCRIPT.indexOf('build-frontend-preview.js') !== -1, '缺少 build-frontend-preview.js');
});

// ---- 4. 包含 test-build-frontend-preview.js ----
test('包含 test-build-frontend-preview.js', function () {
  assert.ok(SCRIPT.indexOf('test-build-frontend-preview.js') !== -1, '缺少 test-build-frontend-preview.js');
});

// ---- 5. 包含 HTML 内联 JS 语法检查 ----
test('包含 HTML 内联 JS 语法检查', function () {
  assert.ok(SCRIPT.indexOf('erp14-server-showcase.html') !== -1, '缺少 erp14-server-showcase.html 引用');
  assert.ok(SCRIPT.indexOf('<script>') !== -1, '缺少 <script> 标签检查');
  assert.ok(SCRIPT.indexOf('new Function') !== -1, '缺少 new Function 语法检查');
});

// ---- 6. 包含 main.js 语法检查 ----
test('包含 main.js 语法检查', function () {
  assert.ok(SCRIPT.indexOf('main.js') !== -1, '缺少 main.js 引用');
  assert.ok(SCRIPT.indexOf('frontend/js/main.js') !== -1, '缺少 frontend/js/main.js 路径');
});

// ---- 7. 包含 backend npm test ----
test('包含 backend npm test', function () {
  assert.ok(SCRIPT.indexOf('npm test') !== -1, '缺少 npm test');
  assert.ok(SCRIPT.indexOf('backend') !== -1, '缺少 backend 路径');
});

// ---- 8. 包含 test-*.js 扫描逻辑 ----
test('包含 test-*.js 扫描逻辑（fs.readdirSync + filter 匹配 test-）', function () {
  assert.ok(SCRIPT.indexOf('test-') !== -1, '缺少 test- 模式');
  assert.ok(SCRIPT.indexOf('readdirSync') !== -1 || SCRIPT.indexOf('readdir') !== -1, '缺少目录扫描');
});

// ---- 9. 明确跳过/避免重复运行 test-build-frontend-preview.js ----
test('跳过重复运行 test-build-frontend-preview.js', function () {
  const skipPattern = SCRIPT.indexOf('test-build-frontend-preview.js') !== SCRIPT.lastIndexOf('test-build-frontend-preview.js');
  // 模式1：先单独运行（第3步），再在全量测试中跳过
  const hasSkipLogic = SCRIPT.indexOf('跳过') !== -1 || SCRIPT.indexOf('skip') !== -1 || SCRIPT.indexOf('filter') !== -1;
  // 模式2：只运行一次
  assert.ok(hasSkipLogic || !skipPattern, '未能识别跳过逻辑');
});

// ---- 10. 失败时中断 ----
test('失败时中断（无 catch 后吞错继续）', function () {
  // 检查是否使用 execSync（同步执行，失败抛出异常）
  const syncCalls = (SCRIPT.match(/execSync/g) || []).length;
  assert.ok(syncCalls > 0, '缺少 execSync 同步执行调用');
  // 确认没有 catch(e){} 吞错误模式
  const swallowPatterns = SCRIPT.match(/catch\s*\([^)]*\)\s*\{[\s]*\}[\s]*\/\//);
  // 没有明确的吞错误空 catch 块即可
  const hasSwallowIssue = SCRIPT.indexOf('catch (e) {}') !== -1 || SCRIPT.indexOf('catch(e){}') !== -1;
  assert.ok(!hasSwallowIssue, '存在吞错误模式 catch (e) {}');
});

// ---- 11. 检查是否包含部署命令 ----
test('不包含部署命令', function () {
  const deployCmds = ['rsync', 'scp', 'deploy', '上传', '服务器'];
  deployCmds.forEach(function(cmd) {
    assert.ok(SCRIPT.indexOf(cmd) === -1, '包含部署命令 "' + cmd + '"');
  });
});

// ---- 12. 全部通过时有正确输出 ----
test('全部通过时输出"全部验证通过"', function () {
  assert.ok(SCRIPT.indexOf('全部验证通过') !== -1, '缺少通过消息');
});

// ---- 13. 失败时有退出码 1 ----
test('失败时调用 process.exit(1)', function () {
  assert.ok(SCRIPT.indexOf('process.exit(1)') !== -1, '缺少 process.exit(1)');
});

// ---- 14. 不修改业务代码 ----
test('不修改 erp14-server-showcase.html', function () {
  assert.ok(SCRIPT.indexOf('erp14-server-showcase.html') === SCRIPT.lastIndexOf('erp14-server-showcase.html'), '多次引用生产文件');
  // 只读引用，没有写入操作
  assert.ok(SCRIPT.indexOf('writeFileSync') === -1 || SCRIPT.indexOf('erp14-server-showcase') === -1, '检查到写入 erp14-server-showcase 的操作');
});

console.log('\n通过 ' + passed + ' / ' + passed + (process.exitCode ? ' （有失败）' : ' 全部通过'));
