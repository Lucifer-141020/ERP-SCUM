// 阶段三第 3 小步：图片库页面专项测试
// 纯 Node fs + assert，无外部依赖。
// 目标：验证图片库面板功能完整，未误伤其他模块。
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'erp14-server-showcase.html'), 'utf8');

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

console.log('图片库页面专项测试：');

// ---- 1. 面板标题 ----
test('renderImageLibraryPanel 标题为"图片库"', function () {
  const start = HTML.indexOf('function renderImageLibraryPanel()');
  assert.ok(start !== -1, '未找到 renderImageLibraryPanel');
  const fn = HTML.slice(start, start + 2000);
  assert.ok(fn.indexOf('>图片库<') !== -1, '标题不为"图片库"');
});

// ---- 2. 上传入口 ----
test('上传入口仍存在（upload-library-image）', function () {
  assert.ok(HTML.indexOf('data-action="upload-library-image"') !== -1, '缺少上传入口');
});

// ---- 3. 图片列表渲染函数 ----
test('renderImageLibraryPanel 函数存在', function () {
  assert.ok(HTML.indexOf('function renderImageLibraryPanel()') !== -1, 'renderImageLibraryPanel 缺失');
});

test('loadImageLibrary 函数存在', function () {
  assert.ok(HTML.indexOf('async function loadImageLibrary()') !== -1, 'loadImageLibrary 缺失');
});

// ---- 4. 复制地址入口 ----
test('复制地址按钮入口存在（copy-image-url）', function () {
  assert.ok(HTML.indexOf('data-action="copy-image-url"') !== -1, '缺少复制地址入口');
});

// ---- 5. 单张删除入口 ----
test('单张删除按钮入口存在（delete-single-image）', function () {
  assert.ok(HTML.indexOf('data-action="delete-single-image"') !== -1, '缺少单张删除入口');
});

// ---- 6. 批量选择入口 ----
test('批量选择入口存在（image-checkbox）', function () {
  assert.ok(HTML.indexOf('class="image-checkbox"') !== -1, '缺少批量选择复选框');
});

test('全选复选框存在（selectAllImages）', function () {
  assert.ok(HTML.indexOf('id="selectAllImages"') !== -1, '缺少全选复选框');
});

// ---- 7. 批量删除入口 ----
test('批量删除按钮存在（batchDeleteImages）', function () {
  assert.ok(HTML.indexOf('id="batchDeleteImages"') !== -1, '缺少批量删除按钮');
});

test('批量删除有确认逻辑（confirmAction）', function () {
  const start = HTML.indexOf('async function handleBatchDeleteImages()');
  assert.ok(start !== -1, '未找到 handleBatchDeleteImages');
  const fn = HTML.slice(start, start + 1500);
  assert.ok(fn.indexOf('confirmAction') !== -1, '批量删除缺少 confirmAction 确认');
  assert.ok(fn.indexOf('ids.length') !== -1, '批量删除未检查选中数量');
});

// ---- 8. 功能完整：图片网格和库操作函数仍在 ----
test('图片网格容器存在于渲染函数中（imageLibraryGrid）', function () {
  assert.ok(HTML.indexOf('id="imageLibraryGrid"') !== -1, '缺少图片网格容器');
});

test('initImageBatchSelection 函数存在', function () {
  assert.ok(HTML.indexOf('function initImageBatchSelection()') !== -1, 'initImageBatchSelection 缺失');
});

test('selectLibraryImage 函数存在', function () {
  assert.ok(HTML.indexOf('function selectLibraryImage') !== -1, 'selectLibraryImage 缺失');
});

test('库操作显示库图像（library-thumb 类）', function () {
  assert.ok(HTML.indexOf('class="library-thumb"') !== -1, '缺少缩略图展示');
});

test('库操作显示库名称（library-name 类）', function () {
  assert.ok(HTML.indexOf('class="library-name"') !== -1, '缺少图片名称展示');
});

test('库操作显示库元信息（library-meta 类）', function () {
  assert.ok(HTML.indexOf('class="library-meta"') !== -1, '缺少元信息展示');
});

// ---- 9. 未误伤其他后台模块 ----
test('活动管理入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="updateManage"') !== -1, '缺少 updateManage');
});
test('建筑模板入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="templateManage"') !== -1, '缺少 templateManage');
});
test('玩家群入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="groupManage"') !== -1, '缺少 groupManage');
});
test('玩家建议入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="requestManage"') !== -1, '缺少 requestManage');
});
test('首页管理入口仍存在', function () {
  assert.ok(HTML.indexOf('data-panel="homeManage"') !== -1, '缺少 homeManage');
});

// ---- 10. 中文文件名修复检查 ----
test('后端 safeOrigName 函数存在（中文文件名编码修正）', function () {
  const BACKEND = fs.readFileSync(path.join(__dirname, '..', 'backend', 'server.js'), 'utf8');
  assert.ok(BACKEND.indexOf('function safeOrigName') !== -1, '后端缺少 safeOrigName 函数');
  assert.ok(BACKEND.indexOf('latin1') !== -1, 'safeOrigName 缺少 latin1 编码转换');
  assert.ok(BACKEND.indexOf("Buffer.from(file.originalname, 'latin1').toString('utf8')") !== -1, 'safeOrigName 未做 latin1→utf8 转换');
});

test('前端 upload-library-image 使用 file.name（原始文件名）而非合成名', function () {
  assert.ok(HTML.indexOf('file.name') !== -1, '上传处理器未使用 file.name');
  // 确认旧的合成名模式已移除
  assert.ok(HTML.indexOf('图片 \${nowText()}') === -1, '仍存在旧的合成文件名模式');
});

test('前端 upload-library-image 不生成 "图片 日期-序号" 合成名', function () {
  const start = HTML.indexOf('if (action === \'upload-library-image\')');
  const section = HTML.slice(start, start + 1500);
  assert.ok(section.indexOf('file.name') !== -1, 'upload-library-image 未使用 file.name');
  assert.ok(section.indexOf('图片 \${nowText()}') === -1, 'upload-library-image 仍含合成名逻辑');
});

console.log('\n通过 ' + passed + ' / ' + passed + (process.exitCode ? ' （有失败）' : ' 全部通过'));
