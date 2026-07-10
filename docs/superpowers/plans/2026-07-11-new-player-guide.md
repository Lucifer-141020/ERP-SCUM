# 新手入服引导卡实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在首页增加可直接操作的五步新手入服引导，并保证桌面端、320/375/414 像素手机端正常使用。

**Architecture:** 在现有首页 HTML 中增加一个无后端依赖的引导区域；CSS 只负责该区域的桌面五列和移动端单列布局；JavaScript 复用 `serverInfo`、`showToast()` 和现有事件绑定模式完成复制、滚动和提示。先写结构测试，再实施最小代码，最后构建预览并做浏览器验收。

**Tech Stack:** 原生 HTML、CSS、JavaScript、Node.js 结构测试、现有前端预览构建脚本。

## Global Constraints

- 正确工作区固定为 `C:\Users\Administrator\Desktop\SCUM用户网页`。
- 修改前先在 `备份/` 中备份将要改动的文件，文件名带执行时间。
- 只修改 `frontend/index.html`、`frontend/css/main.css`、`frontend/js/main.js`、`scripts/test-home-structure.js`、`代码地图.md`、`更新日志.md`。
- 不修改后端、数据库、后台表单、活动报名、玩家建议和生产页 `erp14-server-showcase.html`。
- 不新增 npm 依赖，不发起新接口请求，不保存玩家入服进度。
- IP 必须读取 `serverInfo.ip`，QQ群号必须读取 `serverInfo.group`。
- QQ 采用方案 A：复制群号并提示玩家打开 QQ 搜索，不调用 QQ 群链接。
- 每个任务完成后先停止，让总指挥验收；未经允许不得继续下一任务。
- 不得提交、输出或记录任何密钥、密码、令牌和敏感配置。

---

### Task 1: 用测试锁定引导卡结构

**Files:**
- Modify: `scripts/test-home-structure.js`
- Test: `scripts/test-home-structure.js`

**Interfaces:**
- Consumes: `frontend/index.html` 的静态结构。
- Produces: 对 `newPlayerGuideSection`、五个 `data-guide-action` 按钮及动态值节点的结构约束。

- [ ] **Step 1: 备份测试文件**

在 PowerShell 中执行：

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item -LiteralPath 'scripts/test-home-structure.js' -Destination "备份/test-home-structure.$stamp.js"
```

预期：`备份/` 中出现带时间戳的测试文件副本。

- [ ] **Step 2: 添加当前必然失败的结构断言**

沿用 `scripts/test-home-structure.js` 当前的读取和断言风格，新增以下等价断言；不要重写测试框架：

```js
assert.match(html, /id="newPlayerGuideSection"/, '首页应包含新手入服引导区');
assert.match(html, /id="guideServerIp"/, '引导区应包含动态服务器 IP');
assert.match(html, /id="guideGroupNumber"/, '引导区应包含动态 QQ 群号');
for (const action of ['copy-ip', 'copy-group', 'read-rules', 'enter-server', 'contact-admin']) {
  assert.match(html, new RegExp(`data-guide-action="${action}"`), `引导区应包含 ${action} 操作`);
}
```

- [ ] **Step 3: 运行测试并确认先失败**

Run:

```powershell
node scripts/test-home-structure.js
```

Expected: 退出码非 0，失败原因包含“首页应包含新手入服引导区”。如果测试直接通过，停止并报告总指挥，说明断言没有真正覆盖新结构。

- [ ] **Step 4: 只提交测试改动**

```powershell
git add -- scripts/test-home-structure.js
git commit -m "test: define new player guide structure"
```

预期：提交只包含 `scripts/test-home-structure.js`。

#### Task 1 执行提示词

```text
你是执行者 1。工作区固定为 C:\Users\Administrator\Desktop\SCUM用户网页。
只执行计划 Task 1：先备份 scripts/test-home-structure.js，再按现有测试风格加入新手入服引导结构断言，并运行测试确认它因为结构尚不存在而失败。
禁止修改 frontend、后端、生产页和其他文件。不要为了让测试通过而降低断言。完成后提交，报告：备份路径、修改文件、测试命令、实际失败摘要、提交号，然后停止等待验收。
```

---

### Task 2: 实现引导卡静态结构和响应式样式

**Files:**
- Modify: `frontend/index.html:80-82`
- Modify: `frontend/css/main.css`（放在首页相关样式区；移动端规则并入现有 `@media (max-width: 767px)`）
- Test: `scripts/test-home-structure.js`

**Interfaces:**
- Consumes: Task 1 定义的 DOM ID 和 `data-guide-action` 名称。
- Produces: `#newPlayerGuideSection`、`#guideServerIp`、`#guideGroupNumber` 和五个可点击按钮，供 Task 3 绑定数据与交互。

- [ ] **Step 1: 备份两个前端文件**

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item -LiteralPath 'frontend/index.html' -Destination "备份/frontend-index.$stamp.html"
Copy-Item -LiteralPath 'frontend/css/main.css' -Destination "备份/frontend-main.$stamp.css"
```

- [ ] **Step 2: 在主视觉之后、数据卡之前增加 HTML**

把下面结构插入 `</div>`（`home-hero-shell` 结束）之后、`homeStatsSection` 之前：

```html
<section class="section-block newbie-guide" id="newPlayerGuideSection" aria-labelledby="newPlayerGuideTitle">
  <div class="section-head newbie-guide-head">
    <div>
      <span class="newbie-guide-kicker">新玩家必看</span>
      <h2 id="newPlayerGuideTitle">5 步加入服务器</h2>
      <p>照着操作，几分钟即可完成入服准备。</p>
    </div>
  </div>
  <ol class="newbie-guide-steps">
    <li class="card newbie-guide-step"><span class="newbie-guide-number">1</span><div><h3>复制服务器 IP</h3><p>当前地址：<strong id="guideServerIp">127.0.0.1:7777</strong></p></div><button class="btn btn-primary" type="button" data-guide-action="copy-ip">复制 IP</button></li>
    <li class="card newbie-guide-step"><span class="newbie-guide-number">2</span><div><h3>加入 QQ 群</h3><p>群号：<strong id="guideGroupNumber">123456789</strong></p></div><button class="btn btn-secondary" type="button" data-guide-action="copy-group">复制群号</button></li>
    <li class="card newbie-guide-step"><span class="newbie-guide-number">3</span><div><h3>阅读规则</h3><p>入服前先了解服务器注意事项。</p></div><button class="btn btn-secondary" type="button" data-guide-action="read-rules">查看规则</button></li>
    <li class="card newbie-guide-step"><span class="newbie-guide-number">4</span><div><h3>进入服务器</h3><p>打开 SCUM，使用服务器 IP 搜索或直连。</p></div><button class="btn btn-secondary" type="button" data-guide-action="enter-server">进入说明</button></li>
    <li class="card newbie-guide-step"><span class="newbie-guide-number">5</span><div><h3>遇到问题</h3><p>进入 QQ 群联系管理员协助处理。</p></div><button class="btn btn-secondary" type="button" data-guide-action="contact-admin">联系管理员</button></li>
  </ol>
</section>
```

- [ ] **Step 3: 添加最小桌面样式**

在首页样式区加入：

```css
.newbie-guide-kicker {
  display: inline-block;
  margin-bottom: 6px;
  color: var(--brand);
  font-size: 13px;
  font-weight: 700;
}

.newbie-guide-steps {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.newbie-guide-step {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.newbie-guide-step h3,
.newbie-guide-step p { margin: 0; }

.newbie-guide-step p {
  margin-top: 6px;
  color: var(--text-muted);
  overflow-wrap: anywhere;
}

.newbie-guide-step .btn { margin-top: auto; width: 100%; }

.newbie-guide-number {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  background: var(--brand);
  color: #fff;
  font-weight: 700;
}
```

- [ ] **Step 4: 添加移动端单列规则**

在现有 `@media (max-width: 767px)` 内加入：

```css
.newbie-guide-steps { grid-template-columns: 1fr; }
.newbie-guide-step {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: start;
}
.newbie-guide-step .btn { grid-column: 2; width: 100%; }
```

- [ ] **Step 5: 运行结构和语法检查**

```powershell
node scripts/test-home-structure.js
node --check frontend/js/main.js
```

Expected: 两条命令退出码均为 0；结构测试报告全部通过。

- [ ] **Step 6: 提交结构与样式**

```powershell
git add -- frontend/index.html frontend/css/main.css
git commit -m "feat: add new player guide layout"
```

#### Task 2 执行提示词

```text
你是执行者 2。工作区固定为 C:\Users\Administrator\Desktop\SCUM用户网页。
只执行计划 Task 2。先备份 frontend/index.html 和 frontend/css/main.css；严格复用 Task 1 约定的 ID 与 data-guide-action，不改 JavaScript、不改生产页。
目标是桌面五列、767px 以下单列，不能引入横向滚动。运行结构测试和 JS 语法检查。完成后提交并报告：备份路径、修改行位置、测试输出摘要、提交号，然后停止等待验收。
```

---

### Task 3: 绑定动态数据和五个交互

**Files:**
- Modify: `frontend/js/main.js:716-736, 1967-1978, 3757-3769`
- Test: `scripts/test-home-structure.js`

**Interfaces:**
- Consumes: `serverInfo.ip: string`、`serverInfo.group: string`、`showToast(message, type, duration)`、Task 2 DOM。
- Produces: `copyGuideText(value, successMessage, failureMessage): Promise<void>`、`renderNewPlayerGuide(): void`、五个引导动作。

- [ ] **Step 1: 备份 JavaScript**

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item -LiteralPath 'frontend/js/main.js' -Destination "备份/frontend-main.$stamp.js"
```

- [ ] **Step 2: 增加兼容复制函数**

放在 `showToast()` 后：

```js
async function copyGuideText(value, successMessage, failureMessage) {
  const text = String(value || '').trim();
  if (!text) {
    showToast(failureMessage, 'warning');
    return;
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const input = document.createElement('input');
      input.value = text;
      input.setAttribute('readonly', '');
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand('copy');
      input.remove();
      if (!copied) throw new Error('copy failed');
    }
    showToast(successMessage, 'success');
  } catch (error) {
    showToast(failureMessage, 'warning');
  }
}
```

- [ ] **Step 3: 增加动态渲染函数并接入 `renderAll()`**

放在 `renderHero()` 后，并在 `renderAll()` 的 `renderHero();` 后调用：

```js
function renderNewPlayerGuide() {
  const ip = document.getElementById('guideServerIp');
  const group = document.getElementById('guideGroupNumber');
  if (ip) ip.textContent = serverInfo.ip || '暂未配置';
  if (group) group.textContent = serverInfo.group || '暂未配置';
}
```

`renderAll()` 中应为：

```js
renderHero();
renderNewPlayerGuide();
renderHeroCarousel();
```

- [ ] **Step 4: 绑定五个操作**

在现有初始化事件绑定区加入一个委托监听器：

```js
document.getElementById('newPlayerGuideSection')?.addEventListener('click', event => {
  const button = event.target.closest('[data-guide-action]');
  if (!button) return;
  const action = button.dataset.guideAction;
  if (action === 'copy-ip') {
    copyGuideText(serverInfo.ip, '服务器 IP 已复制', '复制失败，请手动复制页面上的服务器 IP');
  }
  if (action === 'copy-group') {
    copyGuideText(serverInfo.group, '群号已复制，请打开 QQ 搜索并申请加入', '复制失败，请手动复制页面上的 QQ 群号');
  }
  if (action === 'read-rules') {
    document.getElementById('homeRulesSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (action === 'enter-server') {
    showToast('请打开 SCUM，使用已复制的服务器 IP 搜索或直连', 'info');
  }
  if (action === 'contact-admin') {
    showToast('请复制 QQ 群号，进群后联系管理员', 'info');
  }
});
```

- [ ] **Step 5: 运行测试**

```powershell
node --check frontend/js/main.js
node scripts/test-home-structure.js
node scripts/browser-sim-test.js
```

Expected: 三条命令退出码均为 0；浏览器模拟不得出现未捕获异常。

- [ ] **Step 6: 提交交互**

```powershell
git add -- frontend/js/main.js
git commit -m "feat: add new player guide interactions"
```

#### Task 3 执行提示词

```text
你是执行者 3。工作区固定为 C:\Users\Administrator\Desktop\SCUM用户网页。
只执行计划 Task 3。先备份 frontend/js/main.js，然后实现动态 IP/QQ群号、兼容复制、规则滚动和两条说明提示。
必须复用 serverInfo 和 showToast，不新增接口、本地存储或依赖。复制失败必须给手动复制提示。运行 node --check、首页结构测试、browser-sim-test。完成后提交并报告实际测试结果和提交号，然后停止等待验收。
```

---

### Task 4: 构建预览、移动端验收和文档收尾

**Files:**
- Modify: `代码地图.md`
- Modify: `更新日志.md`
- Generated for verification only: `dist/erp14-server-showcase.preview.html`

**Interfaces:**
- Consumes: Tasks 1-3 完整前端功能。
- Produces: 可复核预览、320/375/414 像素验收证据、代码定位和更新记录。

- [ ] **Step 1: 构建前端预览**

```powershell
node scripts/build-frontend-preview.js
node scripts/check-frontend-sync.js
```

Expected: 构建命令成功；同步检查确认 `frontend/` 与生成预览内容一致。不得覆盖生产页 `erp14-server-showcase.html`。

- [ ] **Step 2: 运行完整前端检查**

```powershell
node scripts/verify-all.js
```

Expected: 所有既有检查通过。若失败，只报告与本功能有关的失败，不修改无关功能。

- [ ] **Step 3: 浏览器检查桌面与三种手机宽度**

启动本地静态服务并打开生成的预览页，依次检查桌面、320、375、414 像素：

```powershell
python -m http.server 52395 --bind 127.0.0.1
```

验证地址：`http://127.0.0.1:52395/dist/erp14-server-showcase.preview.html`

每个宽度必须确认：

- 五个步骤顺序正确且没有横向滚动。
- 按钮高度适合触摸，没有文字遮挡。
- IP 和 QQ 群号显示与主视觉一致。
- 复制 IP、复制群号均出现正确提示。
- “阅读规则”滚动到服务器注意事项。
- “进入说明”和“联系管理员”提示正确。
- 亮色和暗色主题均能看清文字和按钮。

- [ ] **Step 4: 更新代码地图和更新日志**

在 `代码地图.md` 的首页功能表增加：引导区 HTML、`.newbie-guide-*` 样式、`renderNewPlayerGuide()`、`copyGuideText()` 和事件绑定位置。

在 `更新日志.md` 顶部新增 2026-07-11 条目，明确记录：新增五步入服引导、复用 IP/QQ群配置、移动端单列适配、验证命令及结果、生产页未切换。

- [ ] **Step 5: 最终检查改动边界**

```powershell
git status --short
git diff --check
git diff --name-only HEAD~3..HEAD
```

Expected: 没有空白错误；功能提交只涉及计划允许的文件。现有用户改动不得被还原或混入提交。

- [ ] **Step 6: 提交文档收尾**

```powershell
git add -- 代码地图.md 更新日志.md
git commit -m "docs: record new player guide"
```

#### Task 4 执行提示词

```text
你是最终验收执行者。工作区固定为 C:\Users\Administrator\Desktop\SCUM用户网页。
只执行计划 Task 4，不修改功能代码。构建预览但绝对不能覆盖 erp14-server-showcase.html；运行 check-frontend-sync 和 verify-all；在桌面及 320/375/414 宽度实测全部五个交互和亮暗主题。
然后只更新 代码地图.md 与 更新日志.md，记录真实结果，不得把失败写成通过。提交文档后报告：预览地址、每条命令结果、四种宽度验收表、生产页 SHA256 是否保持不变、提交号，然后停止等待总指挥最终复核。
```

---

## 总指挥验收顺序

1. Task 1：确认测试确实先失败，且未修改功能代码。
2. Task 2：确认结构测试通过，桌面/手机布局边界清晰。
3. Task 3：确认动态数据和五个动作全部来自现有配置与组件。
4. Task 4：确认完整检查、浏览器尺寸检查、代码地图和更新日志真实完整。
5. 最终确认生产页 `erp14-server-showcase.html` 未被本轮覆盖或切换。

任何一步失败：执行者必须停止，只提交失败证据给总指挥；不得顺手重构、扩展功能或修改后端。
