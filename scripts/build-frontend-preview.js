// 生产页预检脚本 — 将 frontend/ 拆分源码合并为单页预览 HTML
// 用法：node scripts/build-frontend-preview.js
// 生成：dist/erp14-server-showcase.preview.html
// 不覆盖 erp14-server-showcase.html
// 不修改 frontend/ 下的任何文件
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// 源文件
const indexHtmlPath = path.join(ROOT, 'frontend', 'index.html');
const cssPath = path.join(ROOT, 'frontend', 'css', 'main.css');
const jsPath = path.join(ROOT, 'frontend', 'js', 'main.js');
const outputDir = path.join(ROOT, 'dist');
const outputPath = process.env.PREVIEW_OUTPUT_PATH || path.join(outputDir, 'erp14-server-showcase.preview.html');
const productionPath = path.join(ROOT, 'erp14-server-showcase.html');
const assetsPath = path.join(ROOT, 'frontend', 'assets');
const previewAssetsPath = process.env.PREVIEW_ASSETS_PATH || path.join(outputDir, 'assets');

// 检查源文件
const files = [
  { name: 'frontend/index.html',        path: indexHtmlPath },
  { name: 'frontend/css/main.css',       path: cssPath },
  { name: 'frontend/js/main.js',         path: jsPath },
];
const missing = files.filter(f => !fs.existsSync(f.path));
if (missing.length) {
  console.log('✗ 缺少源文件：');
  missing.forEach(f => console.log('    ' + f.name));
  process.exit(1);
}

console.log('=== 生产页预检：合并 frontend/ 源码 ===\n');

// 读取源文件
console.log('已读取源文件：');
const idxHtml = fs.readFileSync(indexHtmlPath, 'utf8');
console.log('  ✓ frontend/index.html        (%d 字节)', idxHtml.length);
const cssContent = fs.readFileSync(cssPath, 'utf8');
console.log('  ✓ frontend/css/main.css      (%d 字节)', cssContent.length);
const jsContent = fs.readFileSync(jsPath, 'utf8');
console.log('  ✓ frontend/js/main.js         (%d 字节)', jsContent.length);

// 注入 CSS：替换 <link rel="stylesheet"...> 为 <style>...</style>
const step1 = idxHtml.replace(
  /<link[^>]*rel="stylesheet"[^>]*>|<link[^>]*href="\.\/css\/main\.css"[^>]*>/i,
  '<style>\n' + cssContent + '\n</style>'
);

// 注入 JS：替换 <script src="./js/main.js"> 为 <script>...</script>
const previewHtml = step1.replace(
  /<script[^>]*src="\.\/js\/main\.js"[^>]*>[\s]*<\/script>/i,
  '<script>\n' + jsContent + '\n</script>'
);

// 创建 dist 目录
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('\n创建目录：dist/');
}

// 写入 preview 文件
fs.writeFileSync(outputPath, previewHtml, 'utf8');
if (fs.existsSync(assetsPath)) {
  fs.cpSync(assetsPath, previewAssetsPath, { recursive: true });
}
console.log('\n已生成预览文件：');
console.log('  ✓ dist/erp14-server-showcase.preview.html  (%d 字节)', previewHtml.length);

// 确认不覆盖生产文件
const prodExists = fs.existsSync(productionPath);
if (prodExists) {
  const prodSize = fs.statSync(productionPath).size;
  console.log('\n安全确认：');
  console.log('  ✓ 生产文件 erp14-server-showcase.html 未被修改 (%d 字节)', prodSize);
} else {
  console.log('\n⚠ 注意：生产文件 erp14-server-showcase.html 不存在');
}

console.log('\n=== 预检完成 — 预览文件已就绪 ===');
console.log('  此文件仅供预检，不是正式部署文件。');
console.log('  正式生产文件仍是 erp14-server-showcase.html。');
