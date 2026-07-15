# Server Notice Admin Implementation Plan

> **状态：已完成 / 仅供历史排查**
>
> 服务器通知后台编辑已经实现并完成专项测试与浏览器验收。本计划不再作为待执行任务；当前入口和真实行号以 `代码地图.md` 为准。

> **固定工作区**：`C:\Users\Administrator\Desktop\SCUM用户网页`
> **依赖规格**：`docs/superpowers/specs/2026-07-16-server-notice-admin-design.md`
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将服务器通知从 `frontend/index.html` 硬编码内容改成后台可编辑的 `server_notice` 配置，同时保留默认内容、版本关闭状态和现有视觉结构。

**Architecture:** 复用现有 `config` 表（`backend/db/schema.sql`）、公共 `GET /api/config`、管理员 `GET /api/admin/config`、`PUT /api/admin/config` 接口。新增 `normalizeServerNotice` / `renderServerNotice` / `populateServerNoticeForm` / `saveServerNotice` 四个函数；扩展 `setupNoticeFloating` 支持版本化关闭；扩展 `applyPublicBackendConfig` 接入 `server_notice` 配置（`applyFullBackendConfig` 内部调用 `applyPublicBackendConfig`，因此管理员配置自动继承此改动）。

**Tech Stack:** 原生 HTML、CSS、JavaScript、Express + SQLite、Node.js 内置测试工具、Playwright 浏览器验收。

---

## 〇、全局约束（适用于全部 Task）

1. **固定工作区**：`C:\Users\Administrator\Desktop\SCUM用户网页`（以下命令均以此为当前目录执行）。
2. **生产页 `erp14-server-showcase.html` 本阶段暂不同步**。
3. **禁止修改**：
   - `erp14-server-showcase.html`（生产页）
   - `backend/db/schema.sql`
   - 新建 API 或路由
   - 新建数据库表或列
   - `AGENTS.md`
   - `dist/`
   - 验收截图目录
4. **功能阶段允许修改（按 Task 分配）**：
   - **Task 1**：新增 `scripts/test-server-notice-admin.js`
   - **Task 2**：修改 `frontend/index.html`
   - **Task 3**：修改 `frontend/js/main.js`
   - **Task 4**：修改 `backend/server.js` + `frontend/css/main.css`
   - **Task 5**：不修改功能代码
   - **Task 6**：修改 `代码地图.md` + `更新日志.md`
5. **最终文档阶段才允许修改**：`代码地图.md`、`更新日志.md`。
6. **不得清理、覆盖、还原或提交工作区已有无关改动**。
7. **每个修改任务开始前必须创建带时间戳备份**，备份不提交 Git。
8. **每个任务独立提交**，只暂存该任务允许的文件，**不得夹带其他文件的改动**。
9. **生产页 SHA256 在每个构建或浏览器验收阶段前后记录并保持不变**。
10. **每个 Task 完成后必须立即停止，不自动进入下一 Task**。

### 测试冻结规则（test freeze）

1. `scripts/test-server-notice-admin.js` **只允许在 Task 1 创建和提交**。
2. **Task 2、Task 3、Task 4 不得修改该测试文件**。
3. Task 2 暂存仅 `frontend/index.html`。
4. Task 3 暂存仅 `frontend/js/main.js`。
5. Task 4 暂存仅 `backend/server.js` 和 `frontend/css/main.css`。
6. 禁止出现以下操作：
   - "必要时微调测试"
   - "更新测试断言"
   - "调整测试适配实现"
   - 将测试文件加入 Task 2–4 的 git add
7. Task 1 必须一次性建立足够完整的 DOM mock、localStorage mock、fetch mock 和异步 runner。
8. 红灯失败必须来自功能尚未实现，不能来自 ReferenceError、测试依赖缺失、异步未 await 或错误的源码提取。
9. 如果后续发现测试脚手架自身确有缺陷：
   - 当前功能 Task **立即停止**
   - 单独提交测试修复报告
   - 只能创建独立的测试维护 Task
   - 只修改测试文件
   - 修复后重新证明预期红灯
   - **不得在功能提交中夹带测试修改**

### 隐藏状态规则

1. 采用原生 `hidden` 属性作为唯一隐藏机制。
2. `renderServerNotice` 中通过 `noticeFloating.hidden = true / false` 控制显示。
3. 不得新增 `.notice-hidden` 类。
4. CSS 使用 `[hidden]` 属性选择器确保隐藏：
   ```
   .notice-floating[hidden] { display: none !important; }
   ```
5. 不得同时设计 class 和 hidden 两套隐藏状态。

### 配置加载路径

`applyFullBackendConfig(config)`（`:1706`）内部调用 `applyPublicBackendConfig(config)`（`:1707`）。因此：

- 只在 `applyPublicBackendConfig` 中接入 `server_notice` 配置。
- 管理员完整配置会通过该调用链自动接入。
- 测试必须真实执行 `applyFullBackendConfig`，证明后台配置可以更新通知和回填表单。
- 公共配置加载后更新 `serverNotice` 并渲染。
- 管理员完整配置加载后更新 `serverNotice`。
- 管理员表单正确回填。
- 缺少 `server_notice` 时保留默认内容。

### 测试数量总览

| 分组 | 编号范围 | 数量 | 类型 |
|------|----------|:----:|------|
| Structure | S01–S12 | **12** | 静态 DOM / 模板字符串检查 |
| JS Behavior | J01–J40 | **40** | 沙箱真实执行 |
| Backend | B01–B08 | **8** | 后端接口/白名单静态检查 |
| CSS | C01–C10 | **10** | 静态样式检查 |
| **Node 测试总数** | — | **70** | — |
| Browser | D01–D07 | **7** | 浏览器验收（单独统计） |

### 真实代码锚点（读取确认，仅供定位，不修改这些位置以外的逻辑）

| 文件 | 位置（行号） | 内容 |
| --- | --- | --- |
| `frontend/index.html` | `258-278` | 前台通知区硬编码 DOM（`#noticeFloating` / `#noticeBubble` / `#noticePanel` / `#noticeClose` / 4 个静态 `<li>`） |
| `frontend/index.html` | `216` | 后台 `data-panel="homeManage"` 导航入口 |
| `frontend/js/main.js` | `361-415` | `homeManage` 模板（含 `saveHomeHero` / `saveHomeRules` / `saveHomeFeatures` / `saveHomeStats` 四个保存按钮） |
| `frontend/js/main.js` | `3914-3917` | 四个现有首页保存按钮事件绑定 |
| `frontend/js/main.js` | `3976` | `setupNoticeFloating()` 函数 |
| `frontend/js/main.js` | `1662-1678` | `applyPublicBackendConfig(config)` — 公共配置合并入口 |
| `frontend/js/main.js` | `1706` | `applyFullBackendConfig(config)` — 内部调用 `applyPublicBackendConfig` |
| `frontend/js/main.js` | `1724-1779` | `loadPublicBackendConfig()` — 访客并行拉取 |
| `frontend/js/main.js` | `1956` | `loadFullBackendConfig()` — 管理员登录后拉取 |
| `frontend/js/main.js` | `979-999` | `saveBackendData()` — 基于 `FIELD_MAP` 逐字段保存（不含 `server_notice`） |
| `frontend/css/main.css` | `954-1123` | `.notice-floating` / `.notice-floating-bubble` / `.notice-floating-panel` / `.notice-floating-head` / `.notice-floating-close` / `.server-notice-card` / `.server-notice-lines` 全部样式 |
| `frontend/css/main.css` | `1054-1075` | 手机端 `@media (max-width: 680px)` 通知样式 |
| `frontend/css/main.css` | `3702-3710` | 手机端 `@media (max-width: 767px)` 通知换行 |
| `frontend/css/main.css` | `4679-4683` | 暗色主题通知样式 |
| `backend/server.js` | `865-869` | `ALLOWED_CONFIG_KEYS` 白名单（当前 10 个键） |
| `backend/server.js` | `656-674` | `GET /api/config` — 公共配置读取 |
| `backend/server.js` | `871-888` | `GET /api/admin/config` — 管理员配置读取 |
| `backend/server.js` | `889-912` | `PUT /api/admin/config` — 配置保存（含白名单校验） |
| `backend/db/schema.sql` | `27` | `config` 表定义（`key TEXT PK, value TEXT, updated_at DATETIME`） |
| `docs/superpowers/specs/2026-07-16-server-notice-admin-design.md` | 全文 | 完整设计规格 |

---

## Task 1：新增服务器通知红灯测试

**Files:**
- 新增 `scripts/test-server-notice-admin.js`

**修改范围:**
- 只新增测试文件

**明确禁止修改:**
- `frontend/index.html`
- `frontend/js/main.js`
- `frontend/css/main.css`
- `backend/server.js`
- `backend/db/schema.sql`
- 所有其他现有文件

**测试分组与编号：**

### Structure（S01–S12，共 12 条）

| 编号 | 测试名 | 检查内容 |
|------|--------|----------|
| S01 | 前台 #noticeTitle 节点存在 | DOM 模板含 `id="noticeTitle"` |
| S02 | 前台 #noticeLines 节点存在 | DOM 模板含 `id="noticeLines"` |
| S03 | 后台 #editNoticeEnabled 存在 | 模板含 `id="editNoticeEnabled"` |
| S04 | 后台 #editNoticeTitle 存在 | 模板含 `id="editNoticeTitle"` |
| S05 | 后台 #editNoticeLines textarea 存在 | 模板含 `<textarea id="editNoticeLines"` |
| S06 | 后台 #saveServerNotice button 存在 | 模板含 `id="saveServerNotice"` |
| S07 | 后台 #saveNoticeHint 存在 | 模板含 `id="saveNoticeHint"` |
| S08 | #noticeBubble 有 aria-controls | 含 `aria-controls="noticePanel"` |
| S09 | #noticeBubble 有 aria-expanded | 含 `aria-expanded` |
| S10 | #noticeClose 有 aria-label | 含 `aria-label` |
| S11 | label for/id 关联完整 | enabled/title/lines 三个字段均关联 |
| S12 | 保存按钮 type="button" | `type="button"` |

### JS Behavior（J01–J40，共 40 条）

全部通过真实沙箱执行，参照 `test-request-image-flow.js` 的沙箱模式，使用 `async` 运行器。

**normalizeServerNotice（J01–J10）：**
- J01: 合法数据保持（enabled/title/lines/version 原样保留）
- J02: enabled 缺失默认 true
- J03: enabled 非布尔值安全回退 true
- J04: title trim
- J05: title 空白回退"服务器通知"
- J06: lines 每项 trim
- J07: lines 过滤空行
- J08: lines 非数组安全回退默认 4 条
- J09: version 缺失→空字符串
- J10: 后端无 server_notice 时使用当前四条默认内容

**renderServerNotice（J11–J20）：**
- J11: enabled=false 隐藏整个通知区域
- J12: lines 为空隐藏整个通知区域
- J13: 标题通过 textContent 写入
- J14: 每条通知通过 createElement('li') 创建
- J15: 通知内容通过 li.textContent 写入
- J16: 不写入 innerHTML
- J17: 不调用 insertAdjacentHTML
- J18: 恶意标题 `<img src=x onerror=alert(1)>` 不生成 img 节点
- J19: 恶意通知行 `<script>alert(1)</script>` 不生成 script 节点
- J20: 不出现二次转义可见文本

**版本化关闭（J21–J30）：**
- J21: 同版本关闭状态默认折叠
- J22: 新版本默认展开
- J23: 点击关闭写入当前 version
- J24: 点击气泡删除 dismissed-version 记录
- J25: 无 version 时兼容旧键 erp14-notice-collapsed
- J26: localStorage 读取异常不崩溃
- J27: localStorage 写入异常不崩溃
- J28: 默认内容 version 为空时折叠状态走旧键兼容
- J29: 多轮关闭/展开不产生重复版本记录
- J30: 页面不存在 dismissed-version 时默认展开

**saveServerNotice（J31–J40）：**
- J31: textarea 按行拆分并过滤空行
- J32: 保存时自动生成 version（不为空字符串）
- J33: 普通页面加载不生成 version
- J34: 保存成功后才更新内存通知
- J35: 保存成功后重新渲染并提示成功
- J36: 保存失败保留表单内容
- J37: 保存失败不更新内存 version
- J38: 保存失败不显示成功提示
- J39: 保存期间防止重复点击
- J40: 保存结束恢复按钮状态

### Backend（B01–B08，共 8 条）

| 编号 | 测试名 | 检查内容 |
|------|--------|----------|
| B01 | ALLOWED_CONFIG_KEYS 包含 server_notice | 字符串匹配 |
| B02 | GET /api/config 路径存在 | 路由定义存在 |
| B03 | GET /api/admin/config 路径存在 | 路由定义存在 |
| B04 | PUT /api/admin/config 路径存在 | 路由定义存在 |
| B05 | 白名单校验拒绝非白名单 key | 源码含 400 返回 |
| B06 | 后端不解析 server_notice 内部字段 | 无专用解析代码 |
| B07 | schema.sql 无变化 | 仍含 `config` 表定义 |
| B08 | 未新增通知专用 API | 无独立 notice 路由 |

### CSS（C01–C10，共 10 条）

| 编号 | 测试名 | 检查内容 |
|------|--------|----------|
| C01 | 后台编辑区布局存在 | selector 存在 |
| C02 | textarea 可纵向调整或合理最小高度 | min-height 或 resize |
| C03 | 保存状态提示样式存在 | selector 存在 |
| C04 | `[hidden]` 隐藏规则存在 | `.notice-floating[hidden]` |
| C05 | 手机端表单无溢出 | max-width 限制 |
| C06 | 手机端按钮触控 ≥44px | `.btn-primary` 在 767px 媒体查询 |
| C07 | 横屏 coarse 按钮 ≥44px | 横屏媒体查询含 .btn-primary |
| C08 | 通知标题和列表允许换行 | overflow-wrap / word-break |
| C09 | 面板最大宽度不导致横向滚动 | max-width 限制 |
| C10 | 暗色主题可读 | `[data-theme="dark"]` 下颜色规则 |

**逐步操作清单:**
1. 创建 `scripts/test-server-notice-admin.js`。
2. 按照上述编号实现全部 70 条测试。
3. DOM mock：前台和后台模板的 `innerHTML` 或字符串查找。
4. localStorage mock：使用对象模拟，包 try/catch 分支。
5. fetch mock：支持成功和失败两种响应。
6. 异步 runner：使用 `async run()` 遍历执行，`await item.fn()`。
7. Task 1 必须一次性建立足够完整的 mock 和 runner。
8. 红灯失败必须来自功能尚未实现，不能来自 ReferenceError、测试依赖缺失、异步未 await 或错误的源码提取。

**验证命令:**
```
node scripts/test-server-notice-admin.js --group=structure
node scripts/test-server-notice-admin.js --group=js
node scripts/test-server-notice-admin.js --group=backend
node scripts/test-server-notice-admin.js --group=css
node scripts/test-server-notice-admin.js --group=all
```

**预期红绿灯:**
- structure：整体 ❌ 红灯（HTML 尚未加 ID，S01–S12 全部失败）
- js：整体 ❌ 红灯（函数未实现，J01–J40 全部失败）
- backend：整体 ❌ 红灯（白名单未加 server_notice，B01–B08 全部失败）
- css：允许已有保护项（如 C06/C07 手机端按钮规则已存在）通过，但整体 ❌ 红灯
- all：非零

**Git 暂存:**
```
git add -- scripts/test-server-notice-admin.js
```

**提交信息:**
```
test: define server notice admin tests
```

**完成报告要求:**
1. 备份路径（无修改则报告无备份）
2. 各分组测试总数、通过数、失败数
3. 所有转绿的保护测试名称
4. 所有红灯的失败原因
5. 是否涉及任意明文密码/Token/Cookie（不展示内容）
6. 确认未修改任何功能文件
7. 确认 git diff --cached --name-only 仅含新增测试

**停止点:** 提交完成后立即停止，不进入 Task 2。

---

## Task 2：实现前台和后台 HTML 结构

**Files:**
- `frontend/index.html`
- `frontend/js/main.js`（严格限定范围，见下方）

**修改范围:**
- `frontend/index.html`：只改 HTML 结构（前台通知增加 id、后台表单 DOM）
- `frontend/js/main.js`：**只修改 `panelTemplates` 中 `homeManage: () =>` 返回的模板字符串**，在该模板字符串内新增后台编辑表单：`#editNoticeEnabled`、`#editNoticeTitle`、`#editNoticeLines`、`#saveServerNotice`、`#saveNoticeHint`、关联 label for/id、保存按钮 type="button"

**明确禁止:**
- `scripts/test-server-notice-admin.js`（测试冻结）
- `frontend/js/main.js` 中**除 `homeManage` 模板字符串以外的任何修改**（变量声明、函数、事件绑定、配置加载、保存逻辑、setupNoticeFloating、applyPublicBackendConfig、applyFullBackendConfig 等 JS 行为逻辑全部不允许）
- `frontend/css/main.css`
- `backend/server.js`
- `backend/db/schema.sql`
- 所有其他文件

**任务边界说明:**
- Task 2 和 Task 3 **连续修改同一个文件 `frontend/js/main.js`**，但修改区域不同：Task 2 是模板 HTML（`homeManage` 字符串内），Task 3 是 JavaScript 行为逻辑
- 两个修改各自独立提交，不允许合并在同一个提交

**前置确认:**
- `node --check frontend/js/main.js`

**Git add:**
- `git add -- frontend/index.html frontend/js/main.js`

**提交信息保持:**
```
feat: add notice editor structure and DOM IDs
```

**完成报告须额外确认:**
- `frontend/js/main.js` 只修改了 `homeManage` 模板字符串
- 没有新增或修改任何 JS 行为逻辑
- 使用修改前备份比较，列出 `main.js` 的全部差异区块

**实现接口:**
前台通知区改造：
- 保留 `#noticeFloating`、`#noticeBubble`、`#noticePanel`、`#noticeClose`
- 现有 `<strong>` 标题增加稳定 `id="noticeTitle"`
- 现有 `<ul class="server-notice-lines">` 增加稳定 `id="noticeLines"`
- 删除前台 4 个静态 `<li>` 内容（保留 `<ul>` 容器本身）
- `#noticeBubble` 增加 `aria-controls="noticePanel"`
- `#noticeBubble` 增加 `aria-expanded`（初始由 JS 决定）
- `#noticeClose` 确认已有 `aria-label`

后台 `homeManage` 模板新增「服务器通知」区块：
- 在现有 4 个 `.card.pad` 之后新增第 5 个 `.card.pad`
- 区块标题「服务器通知」
- `checkbox`：`id="editNoticeEnabled"`，`label` 通过 `for` 关联
- `text` 输入：`id="editNoticeTitle"`，`label` 通过 `for` 关联
- `textarea`：`id="editNoticeLines"`，`label` 通过 `for` 关联，`rows` 合理（如 4-6 行）
- `button`：`id="saveServerNotice"`，`type="button"`，显示「保存服务器通知」
- 状态提示：`id="saveNoticeHint"`（初始为空或占位说明）
- 删除 4 个静态 `<li>` 后，Task 2 阶段前台通知列表内容暂时为空（默认内容由 Task 3 的 JS 恢复）
- 不允许为了 Task 2 临时在另一处复制硬编码内容

**逐步操作清单:**
1. 备份 `frontend/index.html`。
2. 前台通知区加 ID：`noticeTitle` + `noticeLines` + `aria-controls`/`aria-expanded`。
3. 前台删除 4 个硬编码 `<li>` 内容（保留 `<ul>` 容器）。
4. 后台 `homeManage` 模板新增「服务器通知」编辑区块。
5. 运行结构测试验证全部通过。

**验证命令:**
```
node scripts/test-server-notice-admin.js --group=structure
```

**预期红绿灯:**
- structure：全部转 🟢 通过（S01–S12）
- js：仍 ❌ 红灯
- backend：仍 ❌ 红灯
- css：按真实结果记录
- all：非零
- preview 在 Task 2 阶段前台通知列表内容暂时为空（JS 默认内容尚未实现），此为阶段性状态
- 不在 Task 2 构建或宣告页面功能完成
- 只宣告 HTML 结构分组通过

**Git 暂存:**
```
git add -- frontend/index.html
```

**提交信息:**
```
feat: add notice editor structure and DOM IDs
```

**完成报告要求:**
1. 备份路径
2. 前台改动的准确位置
3. 后台新增区块的模板内容摘要
4. 前台删除的静态内容是否与设计规格一致（4 个硬编码 li）
5. structure 分组测试完整统计（S01–S12 全通过）
6. 前台通知列表在 Task 2 阶段为空是否为已知阶段性状态
7. 确认未修改测试、JS、CSS、backend、schema 和生产页

**停止点:** 提交完成后立即停止，不进入 Task 3。

---

## Task 3：实现 JavaScript 配置、渲染、关闭版本和保存交互

**Files:**
- `frontend/js/main.js`

**修改范围:**
- 只改 JS

**明确禁止修改:**
- `scripts/test-server-notice-admin.js`（测试冻结）
- `frontend/index.html`
- `frontend/css/main.css`
- `backend/server.js`
- `backend/db/schema.sql`
- 所有其他文件

**实现接口:**
新增 4 个函数：
1. `normalizeServerNotice(value = {})` — 规范化配置对象
   - 设计规格 §16 空值和异常处理规则
   - 返回 `{ enabled, title, lines, version }`
2. `renderServerNotice()` — 按当前 `serverNotice` 渲染前台面板
   - `enabled === false` → `noticeFloating.hidden = true`，return
   - `lines` 为空 → 同样隐藏，return
   - 否则 `noticeFloating.hidden = false`
   - `#noticeTitle.textContent = title`（禁止 innerHTML）
   - 清空 `#noticeLines`，每条 `createElement('li')` + `textContent` + `appendChild`（禁止 insertAdjacentHTML）
   - 依据版本化关闭状态设置初始 `.collapsed` 类
   - 更新 `aria-expanded`
3. `populateServerNoticeForm()` — 将内存设置回填到后台表单
4. `saveServerNotice()` — 异步保存
   - 防重复点击（锁标志）
   - 读表单 → 生成 `version = String(Date.now())`
   - `PUT /api/admin/config`（`key: 'server_notice'`）
   - 成功→更新内存+重渲染+成功提示+解锁
   - 失败→保留表单+失败提示+解锁

扩展现有函数：
5. `setupNoticeFloating()` — 改为版本化关闭逻辑
   - 读取 `erp14-notice-dismissed-version`
   - 同版本折叠、新版本展开、无 version 回退旧键 `erp14-notice-collapsed`
   - 关闭→写当前 version
   - 气泡展开→删除关闭记录
   - 所有 localStorage 操作包 try/catch
6. `applyPublicBackendConfig(config)` — 新增：
   ```js
   if (config.server_notice) {
     serverNotice = normalizeServerNotice(config.server_notice);
   }
   renderServerNotice();
   ```
   `applyFullBackendConfig` 内部已调用 `applyPublicBackendConfig`，自动继承此改动。
7. 绑定事件：`homeManage` 面板打开时调用 `populateServerNoticeForm()`；`saveServerNotice` 按钮绑定点击事件
8. 声明全局 `let serverNotice = normalizeServerNotice()`（使用默认 4 条内容恢复通知列表）

**逐步操作清单:**
1. 备份 `frontend/js/main.js`。
2. 声明 `let serverNotice = normalizeServerNotice()`（默认配置，恢复 4 条默认内容）。
3. 实现 `normalizeServerNotice(value = {})`。
4. 实现 `renderServerNotice()`（使用原生 `hidden` 属性，不使用 `.notice-hidden` 类）。
5. 实现 `populateServerNoticeForm()`。
6. 实现 `saveServerNotice()`。
7. 重写 `setupNoticeFloating()` 为版本化逻辑（保留 `.collapsed` 类控制，关闭状态判断改为版本比较）。
8. 在 `applyPublicBackendConfig` 中接入 `server_notice`。
9. 在事件初始化区添加 `saveServerNotice` 绑定和面板回填调用。
10. 运行 JS 沙箱测试验证全部通过。

**验证命令:**
```
node scripts/test-server-notice-admin.js --group=structure
node scripts/test-server-notice-admin.js --group=js
node scripts/test-server-notice-admin.js --group=all
```

**预期红绿灯:**
- structure：全部 🟢 通过
- js：全部 🟢 通过（J01–J40）
- backend：仍 ❌ 红灯
- css：允许部分 🟢 通过
- all：非零

**Git 暂存:**
```
git add -- frontend/js/main.js
```

**提交信息:**
```
feat: implement server notice config, render and save
```

**完成报告要求:**
1. 备份路径
2. 每个新增函数的行号和职责
3. 每个扩展函数的行号和改动摘要
4. JS 沙箱测试完整统计（40/40）
5. J01–J40 是否全部通过
6. XSS 安全渲染验证结果
7. localStorage 异常处理是否包 try/catch
8. 版本化关闭逻辑是否覆盖新旧键兼容
9. `hidden` 属性是否取代 `.notice-hidden`
10. `applyPublicBackendConfig` 接入方式
11. `applyFullBackendConfig` 是否通过内部调用链自动继承
12. 确认未修改测试、HTML、CSS、backend、schema 和生产页
13. 确认 structure + js 分组全部通过

**停止点:** 提交完成后立即停止，不进入 Task 4。

---

## Task 4：后端配置白名单与样式完善

**Files:**
- `backend/server.js`（仅 `ALLOWED_CONFIG_KEYS` 增加 `'server_notice'`）
- `frontend/css/main.css`

**修改范围:**
- 后端白名单 + CSS

**明确禁止修改:**
- `scripts/test-server-notice-admin.js`（测试冻结）
- `frontend/index.html`
- `frontend/js/main.js`
- `backend/db/schema.sql`
- 所有其他文件

**实现接口:**
后端：
- `ALLOWED_CONFIG_KEYS` 数组增加 `'server_notice'`（1 行）

CSS 新增：
- 后台通知编辑区 `.card.pad` 内 label/textarea/button 布局
- textarea 合理最小高度（如 `min-height: 80px`）
- 保存提示 `.submit-hint` 颜色（成功/失败）
- `.notice-floating[hidden] { display: none !important; }` 确保隐藏
- 手机端表单防溢出（max-width: 100%）
- 暗色主题表单元素可读
- 手机端保存按钮 `min-height: 44px`（如现有 `.btn-primary` 未覆盖则补充）
- 横屏 coarse 设备保存按钮 `min-height: 44px`（如未覆盖则补充）

**后端提交防护规则：**

因 `backend/server.js` 曾发生混合提交（+2017/-180 含大量历史改动），Task 4 必须执行以下防护：

1. 修改前备份 `backend/server.js`。
2. 只修改 `ALLOWED_CONFIG_KEYS` 那一行（增加 `'server_notice'`）。
3. 修改后执行 `git diff -- backend/server.js`。
4. 如果相对 Git 基线的差异除了增加 `'server_notice'` 外还有大量无关差异：
   - **不得直接 `git add backend/server.js`**
   - **立即停止并报告**
5. 完成报告必须同时包含：
   - 备份 vs 当前文件的差异（确认只有 `+1` 行）
   - Git 基线 vs 当前文件的差异（确认是否混入历史改动）
6. 禁止再次提交整个历史后端重构。
7. 不允许把 CSS 改动与后端历史差异混淆。

**逐步操作清单:**
1. 备份 `backend/server.js` 和 `frontend/css/main.css`。
2. `ALLOWED_CONFIG_KEYS` 增加 `'server_notice'`。
3. 检查备份 vs 当前文件差异（只应有 1 行变化）。
4. 检查 `git diff -- backend/server.js`。
5. 如果 git 基线差异超出预期，停止并报告。
6. 新增 CSS 规则。
7. 运行全部分组测试。
8. 运行回归测试。

**验证命令:**
```
diff 备份/xxx.js backend/server.js
git diff -- backend/server.js
node scripts/test-server-notice-admin.js --group=structure
node scripts/test-server-notice-admin.js --group=js
node scripts/test-server-notice-admin.js --group=backend
node scripts/test-server-notice-admin.js --group=css
node scripts/test-server-notice-admin.js --group=all
node scripts/test-home-structure.js
node scripts/test-settings-panel.js
node scripts/test-mobile-touch-targets.js
node scripts/test-activity-overflow.js
node --check frontend/js/main.js
node --check backend/server.js
```

**预期红绿灯:**
- structure/js/backend/css/all：全部 🟢 通过（首次全绿）
- 所有回归测试通过
- 才允许宣告功能代码完成

**Git 暂存:**
```
# 仅当 git diff -- backend/server.js 确认只有 server_notice 一行变化时
git add -- backend/server.js frontend/css/main.css
```

**提交信息:**
```
feat: allow server_notice in config and polish notice styles
```

**完成报告要求:**
1. 两个备份路径
2. 后端白名单修改位置和内容
3. 备份 vs 当前文件差异（确认只有 +1 行）
4. git 基线 vs 当前文件差异（确认是否混入历史改动）
5. CSS 新增行的行号和选择器列表
6. 所有 5 个分组测试完整统计（全部转绿）
7. 所有回归测试统计
8. 确认前端 JS/HTML、backend schema、生产页未被修改
9. 确认所有测试全部通过

**停止点:** 提交完成后立即停止，不进入 Task 5。

---

## Task 5：构建预览和真实浏览器验收

**Files:**
- 不修改功能代码
- 验收截图保存到 `验收截图/服务器通知/`

**修改范围:**
- 只构建预览、启动服务、浏览器验收、截图

**明确禁止修改:**
- 所有功能源码和测试
- 生产页

**实现接口:**
构建与服务器：
```
node scripts/build-frontend-preview.js
```

使用隔离后端和临时数据库（避免写入正式数据库）。

**浏览器验收（D01–D07，单独统计，不计入 Node 测试 70 条总数）：**

| 编号 | 检查内容 | 视口 |
|------|----------|------|
| D01 | 后台表单在 320px 不溢出、保存按钮可点 | 320×800 |
| D02 | 通知面板在最小视口不溢出 | 320×800 |
| D03 | 亮色主题通知可读 | 1440×900 |
| D04 | 暗色主题通知可读 | 1440×900 |
| D05 | 保存交互真实成功（刷新后出现新内容） | 375×812 触控 |
| D06 | 保存失败保留表单且无误提示 | 375×812 触控 |
| D07 | 新版本重新显示（关闭旧版→保存新版→刷新展开） | 375×812 触控 |

每个视口记录 `console.error` 和 `pageerror` 计数。

**逐步操作清单:**
1. 记录生产页 SHA256 基线。
2. `node scripts/build-frontend-preview.js`。
3. 启动本地 HTTP 预览（端口 52395）。
4. 通过 Playwright 浏览器验收（使用隔离后端 + 临时数据库）。
5. 如无合法管理员会话，在隔离数据库中使用测试管理员，不输出凭据。
6. 验证完毕后停止预览服务。
7. 不要使用 `page.evaluate` 直接调用 `saveServerNotice` 冒充后台点击。

**验证命令:**
```
sha256sum erp14-server-showcase.html
node scripts/build-frontend-preview.js
node scripts/test-build-frontend-preview.js
node scripts/test-server-notice-admin.js --group=all
# Playwright 浏览器验收脚本
```

**预期:**
- 构建成功
- 所有自动测试通过
- 浏览器验收确认后台保存和前台展示正常
- `console.error` / `pageerror` 计数均为 0

**Git:** 不创建提交。

**完成报告要求:**
1. 生产页 SHA256（前后一致）
2. preview 文件大小和时间
3. 构建测试统计
4. 浏览器验收 D01–D07 逐条结果
5. 控制台错误数
6. 是否使用隔离数据库
7. 正式数据库是否被写入
8. 截图路径和大小
9. 确认未修改任何功能代码和测试
10. 确认未创建提交

**停止点:** 完成后立即停止，不进入 Task 6。

---

## Task 6：代码地图与更新日志收尾

**Files:**
- `代码地图.md`
- `更新日志.md`

**修改范围:**
- 只改文档

**明确禁止修改:**
- 所有功能源码、测试、生产页、后端、数据库

**实现接口:**
代码地图：
- 新增「服务器通知后台编辑」功能定位
- 使用 `rg` 获取真实行号
- 涵盖前台 HTML ID、JS 新增函数、CSS 新增规则、后端白名单

更新日志：
- 记录完整的实施方案、备份位置、测试结果、浏览器验收结果
- 如实记录测试数量和每个分组的通过/失败
- 明确生产页未同步
- 明确截图和临时数据库未提交

**逐步操作清单:**
1. 使用 `rg` 获取所有新增和扩展的真实行号。
2. 更新 `代码地图.md`。
3. 更新 `更新日志.md` 顶部日期区块。
4. 验证 git diff。

**验证命令:**
```
rg -n "noticeTitle|noticeLines|editNoticeEnabled|editNoticeTitle|editNoticeLines|saveServerNotice|saveNoticeHint|normalizeServerNotice|renderServerNotice|populateServerNoticeForm|server_notice|notice-floating[[]hidden[]]" frontend/index.html frontend/js/main.js frontend/css/main.css backend/server.js
git diff --check -- 代码地图.md 更新日志.md
git diff --cached --name-only
```

**Git 暂存:**
```
git add -- 代码地图.md 更新日志.md
```

**提交信息:**
```
docs: record server notice management
```

**完成报告要求:**
1. 代码地图新增行的精确行号和内容
2. 更新日志新增内容的摘要
3. rg 真实行号列表
4. git diff --check 结果
5. git diff --cached --name-only
6. 确认只修改两份文档
7. 确认未修改功能代码、测试、生产页、后端、数据库
8. 截图和临时数据库未提交

**停止点:** 提交完成后，项目整体完成。
