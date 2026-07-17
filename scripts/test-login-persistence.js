/**
 * 登录状态持久化测试
 *
 * 测试内容：
 * 1. adminLogin 按钮默认有 active 类（HTML 初始状态）
 * 2. renderAll 中 adminToken 存在时自动切换到 overview
 * 3. loadFullBackendConfig 正确处理 401（allSettled rejected 分支）
 * 4. catch 块不再包含冗余的 401 逻辑
 * 5. Token 保存在 localStorage 中
 * 6. Token 从 localStorage 读取
 * 7. saveBackendData 的 401 检查
 * 8. loadFullBackendConfig 由 adminToken 守卫
 * 9. 刷新后 renderAll 不显示登录表单
 */

var fs = require('fs');
var path = require('path');

var html = fs.readFileSync(
  path.join(__dirname, '..', 'erp14-server-showcase.html'),
  'utf8'
);

// 提取所有 <script> 内容用于 JS 代码搜索
var scriptMatch = html.match(/<script[\s\S]*?<\/script>/gi);
var sc = '';
if (scriptMatch) {
  scriptMatch.forEach(function(s) {
    var m = s.match(/>([\s\S]*?)<\/script>/);
    if (m) sc += m[1] + '\n';
  });
}

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

// 1. adminLogin 按钮默认有 active 类
test('adminLogin button has active class by default in HTML', function() {
  var match = html.match(/<button[^>]*class="active"[^>]*data-panel="adminLogin"[^>]*>/);
  if (!match) {
    throw new Error('adminLogin button with class="active" not found in HTML');
  }
});

// 2. renderAll 中有 adminToken 检测 + adminLogin→overview 自动切换
test('renderAll auto-switches from adminLogin to overview when logged in', function() {
  // Find the adminToken check block inside renderAll
  var marker = '如果已登录但当前激活面板是 adminLogin，自动切换到运营总览';
  if (sc.indexOf(marker) === -1) {
    throw new Error('renderAll missing auto-switch comment');
  }
  var blockStart = sc.indexOf(marker);
  var blockEnd = sc.indexOf('const activePanel', blockStart);
  var block = sc.substring(blockStart, blockEnd);
  if (block.indexOf('adminToken') === -1) {
    throw new Error('auto-switch block missing adminToken check');
  }
  if (block.indexOf('adminLogin') === -1) {
    throw new Error('auto-switch block missing adminLogin reference');
  }
  if (block.indexOf('overview') === -1) {
    throw new Error('auto-switch block missing overview reference');
  }
});

// 3. loadFullBackendConfig 在 allSettled rejected 时正确处理 401
test('loadFullBackendConfig handles 401 via cfgResp.reason check', function() {
  var fnStart = sc.indexOf('function loadFullBackendConfig()');
  var fnEnd = sc.indexOf('function handleAdminLogin', fnStart);
  if (fnStart === -1 || fnEnd === -1) {
    throw new Error('Could not find loadFullBackendConfig function');
  }
  var fnBody = sc.substring(fnStart, fnEnd);
  // The code uses `cfgResp.reason && (...)` instead of `cfgResp.status === 'rejected'`
  // because Promise.allSettled returns {status: 'rejected', reason: Error}
  if (fnBody.indexOf('cfgResp.reason') === -1) {
    throw new Error('Missing cfgResp.reason check for rejection handling');
  }
  if (fnBody.indexOf('401') === -1 && fnBody.indexOf('未登录') === -1) {
    throw new Error('Missing 401 detection in rejection branch');
  }
  if (fnBody.indexOf('localStorage.removeItem') === -1 || fnBody.indexOf('redirectToAdminLogin') === -1) {
    throw new Error('Does not clear token on 401');
  }
});

// 4. catch 块不再包含冗余的 401 逻辑
test('catch block no longer contains 401 logic (moved inline)', function() {
  var fnStart = sc.indexOf('function loadFullBackendConfig()');
  var fnEnd = sc.indexOf('function handleAdminLogin', fnStart);
  var fnBody = sc.substring(fnStart, fnEnd);
  // Find the catch block
  var catchPos = fnBody.lastIndexOf('catch');
  if (catchPos === -1) {
    throw new Error('No catch block found');
  }
  var catchBlock = fnBody.substring(catchPos);
  if (catchBlock.indexOf('401') !== -1 || catchBlock.indexOf('未登录') !== -1) {
    throw new Error('Catch block still contains 401 handling');
  }
});

// 5. Token 保存在 localStorage
test('token saved to localStorage after login', function() {
  if (sc.indexOf("localStorage.setItem(ADMIN_TOKEN_KEY, adminToken)") === -1) {
    throw new Error('Token not saved to localStorage on login');
  }
});

// 6. Token 从 localStorage 读取
test('token read from localStorage on page load', function() {
  if (sc.indexOf("localStorage.getItem(ADMIN_TOKEN_KEY)") === -1) {
    throw new Error('Token not read from localStorage');
  }
});

// 7. saveBackendData 的 401 检查
test('saveBackendData checks 401 per-PUT-response', function() {
  var fnStart = sc.indexOf('async function saveBackendData()');
  var fnEnd = sc.indexOf('function queueBackendSave', fnStart);
  if (fnStart === -1 || fnEnd === -1) throw new Error('saveBackendData not found');
  var fnBody = sc.substring(fnStart, fnEnd);
  if (fnBody.indexOf('result.value.status === 401') === -1) {
    throw new Error('saveBackendData missing per-response 401 check');
  }
});

// 8. loadFullBackendConfig 由 adminToken 守卫
test('loadFullBackendConfig guarded by adminToken in init', function() {
  // 查找初始化代码中的 adminToken 守卫（靠近文件末尾）
  // 格式: if (adminToken) {\n      loadFullBackendConfig();
  var lastPart = sc.substring(sc.length - 800);
  if (lastPart.indexOf('if (adminToken)') === -1) {
    throw new Error('No adminToken guard found in init section');
  }
  var guardPos = lastPart.indexOf('if (adminToken)');
  var guardBlock = lastPart.substring(guardPos, guardPos + 100);
  if (guardBlock.indexOf('loadFullBackendConfig') === -1) {
    throw new Error('adminToken guard does not wrap loadFullBackendConfig');
  }
});

// 9. saveBackendData 不错误清除有效 token
test('saveBackendData only clears token on 401, not on success', function() {
  var fnStart = sc.indexOf('async function saveBackendData()');
  var fnEnd = sc.indexOf('function queueBackendSave', fnStart);
  if (fnStart === -1 || fnEnd === -1) throw new Error('saveBackendData not found');
  var fnBody = sc.substring(fnStart, fnEnd);
  if (fnBody.indexOf("adminToken = '';") === -1) {
    throw new Error('saveBackendData should be able to clear token on 401');
  }
  // Ensure clear is inside the 401 check
  var clearPos = fnBody.indexOf("adminToken = '';");
  var beforeClear = fnBody.substring(Math.max(0, clearPos - 100), clearPos);
  if (beforeClear.indexOf('status === 401') === -1 && beforeClear.indexOf('401') === -1) {
    throw new Error('Token clear should only happen inside 401 check');
  }
});

runTests();
