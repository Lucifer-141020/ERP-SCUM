#!/usr/bin/env node
// 一键验证总脚本 — 按顺序运行所有验证步骤
// 任意步骤失败时立即停止并输出失败信息。
// 用法：node scripts/verify-all.js
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

function run(label, cmd) {
  console.log('\n=== [' + label + '] ===');
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
    console.log('  [' + label + '] 通过');
  } catch (e) {
    console.error('\n❌ 验证失败：[' + label + '] 退出码 ' + e.status);
    process.exit(1);
  }
}

console.log('========================================');
console.log('  一键验证总脚本');
console.log('========================================');

// 1) 同步检查
run('同步检查', 'node scripts/check-frontend-sync.js');

// 2) 生产页预检
run('生产页预检', 'node scripts/build-frontend-preview.js');

// 3) preview 构建测试
run('preview 构建测试', 'node scripts/test-build-frontend-preview.js');

// 4) HTML 内嵌 JS 语法检查
run('HTML 语法检查', 'node -e "var s=require(\'fs\').readFileSync(\'erp14-server-showcase.html\',\'utf8\');var m=s.match(/<script>([\\s\\S]*?)<\\/script>/);new Function(m[1]);console.log(\'  HTML JS 语法通过\');"');

// 5) frontend/js/main.js 语法检查
run('main.js 语法检查', 'node -e "new Function(require(\'fs\').readFileSync(\'frontend/js/main.js\',\'utf8\'));console.log(\'  main.js 语法通过\');"');

// 6) 后端测试
run('后端测试', 'cd backend && npm test');

// 7) 全部 test-*.js 专项测试（跳过 test-build-frontend-preview.js，已在第 3 步运行）
console.log('\n=== [全部专项测试] ===');
const scriptsDir = path.join(ROOT, 'scripts');
const allTests = fs.readdirSync(scriptsDir)
  .filter(function(f) { return f.startsWith('test-') && f.endsWith('.js'); })
  .filter(function(f) { return f !== 'test-build-frontend-preview.js'; })
  .sort();

allTests.forEach(function(f) {
  run('test-' + f.replace(/^test-/, '').replace(/\.js$/, ''), 'node scripts/' + f);
});

console.log('\n========================================');
console.log('  全部验证通过');
console.log('========================================');
process.exit(0);
