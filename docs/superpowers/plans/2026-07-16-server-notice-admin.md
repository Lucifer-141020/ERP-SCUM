# Server Notice Admin Implementation Plan

> **固定工作区**：`C:\Users\Administrator\Desktop\SCUM用户网页`
> **依赖规格**：`docs/superpowers/specs/2026-07-16-server-notice-admin-design.md`
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将服务器通知从 `frontend/index.html` 硬编码内容改成后台可编辑的 `server_notice` 配置，同时保留默认内容、版本关闭状态和现有视觉结构。

**Architecture:** 复用现有 `config` 表（`backend/db/schema.sql`）、公共 `GET /api/config`、管理员 `GET /api/admin/config`、`PUT /api/admin/config` 接口。新增 `normalizeServerNotice` / `renderServerNotice` / `populateServerNoticeForm` / `saveServerNotice` 四个函数；扩展 `setupNoticeFloating` 支持版本化关闭；扩展 `applyPublicBackendConfig` 接入 `server_notice` 配置。

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
4. **功能阶段允许修改**：
   - `frontend/index.html`（通知区加 ID、后台 `homeManage` 新增区块）
   - `frontend/js/main.js`（新增 4 个函数 + 扩展现有函数）
   - `frontend/css/main.css`（少量新增样式）
   - `backend/server.js`（仅 `ALLOWED_CONFIG_KEYS` 增加 `'server_notice'`）
   - `scripts/test-server-notice-admin.js`（新增专项测试）
5. **最终文档阶段才允许修改**：`代码地图.md`、`更新日志.md`。
6. **不得清理、覆盖、还原或提交工作区已有无关改动**。
7. **每个修改任务开始前必须创建带时间戳备份**，备份不提交 Git。
8. **每个任务独立提交**，只暂存该任务允许的文件。
9. **生产页 SHA256 在每个构建或浏览器验收阶段前后记录并保持不变**。
10. **每个 Task 完成后必须立即停止，不自动进入下一 Task**。

### 真实代码锚点（读取确认，仅供定位，不修改这些位置以外的逻辑）

| 文件 | 位置（行号） | 内容 |
| --- | --- | --- |
| `frontend/index.html` | `258-278` | 前台通知区硬编码 DOM（`#noticeFloating` / `#noticeBubble` / `#noticePanel` / `#noticeClose` / 4 个静态 `<li>`） |
| `frontend/index.html` | `216` | 后台 `data-panel="homeManage"` 导航入口 |
| `frontend/js/main.js` | `361-415` | `homeManage` 模板（含 `saveHomeHero` / `saveHomeRules` / `saveHomeFeatures` / `saveHomeStats` 四个保存按钮） |
| `frontend/js/main.js` | `3914-3917` | 四个现有首页保存按钮事件绑定 |
| `frontend/js/main.js` | `3976` | `setupNoticeFloating()` 函数 |
| `frontend/js/main.js` | `1662-1678` | `applyPublicBackendConfig(config)` — 公共配置合并入口 |
| `frontend/js/main.js` | `1706` | `applyFullBackendConfig(config)` — 管理员完整配置合并入口 |
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
- 不修改其他文件

**修改范围:**
- 只新增测试文件

**明确禁止修改:**
- `frontend/index.html`
- `frontend/js/main.js`
- `frontend/css/main.css`
- `backend/server.js`
- `backend/db/schema.sql`
- 所有其他现有文件

**实现接口:**
测试文件必须支持以下分组执行：
```
node scripts/test-server-notice-admin.js --group=structure
node scripts/test-server-notice-admin.js --group=js
node scripts/test-server-notice-admin.js --group=backend
node scripts/test-server-notice-admin.js --group=css
node scripts/test-server-notice-admin.js --group=all
```

**逐步操作清单:**
1. 创建 `scripts/test-server-notice-admin.js`。
2. Structure 分组（至少 12 条测试）：
   - `#noticeTitle` 节点存在
   - `#noticeLines` 节点存在
   - `#editNoticeEnabled` 存在（后台）
   - `#editNoticeTitle` 存在（后台）
   - `#editNoticeLines`（textarea）存在（后台）
   - `#saveServerNotice`（button）存在（后台）
   - `#saveNoticeHint` 存在（后台）
   - `#noticeBubble` 有 `aria-controls` 属性
   - `#noticeBubble` 有 `aria-expanded` 属性
   - `#noticeClose` 有 `aria-label` 属性
   - `label` 的 `for` 与对应 `input`/`textarea` 的 `id` 匹配
   - 保存按钮 `type="button"`
3. JS 行为分组（至少 40 条测试，见设计规格 §22.B）：
   - 使用沙箱真实执行函数，参照 `test-request-image-flow.js` 的沙箱模式
   - 使用 `async` 运行器，避免同步断言错误
   - `normalizeServerNotice` 全覆盖（合法保持、enabled 类型回退、title trim/默认值、lines trim/过滤/非数组回退、version 空字符串化）
   - `renderServerNotice` 真实 DOM 操作验证（textContent、createElement、appendChild、禁止 innerHTML、恶意输入安全）
   - enabled=false 隐藏、空 lines 隐藏
   - 版本化关闭：同版本折叠、新版本展开、点击关闭存版本、点击气泡删关闭记录
   - localStorage 异常不崩溃
   - 保存成功后才更新、失败保留表单、重复点击保护
   - 40 条 JS 行为测试全部通过真实沙箱执行
4. Backend 分组：
   - `ALLOWED_CONFIG_KEYS` 包含 `'server_notice'`
   - `PUT /api/admin/config` 可保存 `server_notice`
   - `GET /api/config` 能返回 `server_notice`
   - `GET /api/admin/config` 能返回 `server_notice`
   - 非白名单 key 仍被拒绝 400
   - `schema.sql` 无变化
   - 后端不解析 `server_notice` 内部字段
5. CSS 分组：
   - 后台编辑区布局存在
   - textarea 可纵向调整或合理最小高度
   - 保存状态提示样式存在
   - `.notice-hidden` 或 `[hidden]` 类存在
   - 手机端表单无溢出检测
   - 手机端按钮 ≥44px
   - 横屏 coarse 按钮 ≥44px
   - 通知标题/列表允许换行
   - 面板最大宽度不横向滚动
   - 暗色主题可读

**验证命令:**
```
node scripts/test-server-notice-admin.js --group=structure
node scripts/test-server-notice-admin.js --group=js
node scripts/test-server-notice-admin.js --group=backend
node scripts/test-server-notice-admin.js --group=css
node scripts/test-server-notice-admin.js --group=all
```

**预期通过/失败分组:**
- structure：❌ 红灯（HTML 未新增 ID，测试检查不到）
- js：❌ 红灯（函数未实现）
- backend：❌ 红灯（白名单未加 `server_notice`）
- css：部分通过但整体❌ 红灯
- all：非零
- 所有失败必须明确指向尚未实现的新功能
- 不允许 ReferenceError 来自测试 mock 缺失
- 保护测试（如 `schema.sql` 未变化）可以绿色

**Git 暂存边界:**
```
git add -- scripts/test-server-notice-admin.js
```

**提交信息:**
```
test: define server notice admin tests
```

**完成报告要求:**
1. 备份路径（如果有）
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
- 必要时微调 `scripts/test-server-notice-admin.js` 中的结构测试

**修改范围:**
- 只改 HTML 结构 + 测试的结构断言

**明确禁止修改:**
- `frontend/js/main.js`
- `frontend/css/main.css`
- `backend/server.js`
- `backend/db/schema.sql`
- 所有其他文件

**实现接口:**
前台通知区改造：
- 保留 `#noticeFloating`、`#noticeBubble`、`#noticePanel`、`#noticeClose`
- 现有 `<strong>` 标题增加稳定 `id="noticeTitle"`
- 现有 `<ul class="server-notice-lines">` 增加稳定 `id="noticeLines"`
- 删除前台静态标题的硬编码绑定方式和 4 个静态 `<li>` 内容
- 默认 4 条内容移入 JavaScript 默认配置（`normalizeServerNotice` 兜底值）
- `#noticeBubble` 增加 `aria-controls="noticePanel"`（面板 ID 关联）
- `#noticeBubble` 增加 `aria-expanded`（初始由 JS 决定）
- `#noticeClose` 已有 `aria-label`，确认存在

后台 `homeManage` 模板新增「服务器通知」区块：
- 在现有 4 个 `.card.pad` 之后新增第 5 个 `.card.pad`
- 区块标题「服务器通知」
- `checkbox`：`id="editNoticeEnabled"`，`label` 通过 `for` 关联
- `text` 输入：`id="editNoticeTitle"`，`label` 通过 `for` 关联
- `textarea`：`id="editNoticeLines"`，`label` 通过 `for` 关联，`rows` 合理（如 4-6 行）
- `button`：`id="saveServerNotice"`，`type="button"`，显示「保存服务器通知」
- 状态提示：`id="saveNoticeHint"`（初始为空或占位说明）

**逐步操作清单:**
1. 备份 `frontend/index.html`。
2. 前台通知区加 ID：`noticeTitle` + `noticeLines` + `aria-controls`/`aria-expanded`。
3. 前台删除 4 个硬编码 `<li>` 内容（保留 `<ul>` 容器）。
4. 后台 `homeManage` 模板新增「服务器通知」编辑区块。
5. 更新测试中结构断言的行号/选择器。
6. 运行结构测试验证全部通过。

**验证命令:**
```
node scripts/test-server-notice-admin.js --group=structure
node scripts/test-server-notice-admin.js --group=all
```

**预期通过/失败分组:**
- structure：全部通过 🟢
- js：仍红灯（JS 函数未实现）
- backend：仍红灯
- css：允许仍红灯
- all：非零
- 只能宣告 HTML 结构分组通过

**Git 暂存边界:**
```
git add -- frontend/index.html scripts/test-server-notice-admin.js
```

**提交信息:**
```
feat: add notice editor structure and DOM IDs
```

**完成报告要求:**
1. 备份路径
2. 前台改动的准确位置
3. 后台新增区块的模板内容摘要
4. 前台删除的静态内容是否与设计规格一致
5. structure 分组测试完整统计
6. 确认未修改 JS/CSS/backend/schema 和生产页
7. 确认 structure 分组全部通过

**停止点:** 提交完成后立即停止，不进入 Task 3。

---

## Task 3：实现 JavaScript 配置、渲染、关闭版本和保存交互

**Files:**
- `frontend/js/main.js`
- 必要时微调 `scripts/test-server-notice-admin.js` 中的 JS/结构测试

**修改范围:**
- 只改 JS + 测试

**明确禁止修改:**
- `frontend/index.html`
- `frontend/css/main.css`
- `backend/server.js`
- `backend/db/schema.sql`
- 所有其他文件

**实现接口:**
新增 4 个函数：
1. `normalizeServerNotice(value = {})` — 规范化配置对象
   - `enabled` 缺失/非布尔 → `true`
   - `title` 缺失/空白 → "服务器通知"
   - `lines` 非数组 → 默认 4 条；逐项 trim 并过滤空行
   - `version` 缺失 → 空字符串
   - 返回 `{ enabled, title, lines, version }`
2. `renderServerNotice()` — 按当前 `serverNotice` 渲染前台面板
   - 已隐藏 → return
   - `enabled === false` → `#noticeFloating` 加 `[hidden]`，return
   - `lines` 为空 → 同样隐藏，return
   - `#noticeTitle.textContent = title`（禁止 innerHTML）
   - 清空 `#noticeLines`，每条 `createElement('li')` + `textContent` + `appendChild`（禁止 insertAdjacentHTML）
   - 依据版本化关闭状态设置初始折叠
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
7. 绑定事件：`homeManage` 面板打开时调用 `populateServerNoticeForm()`；`saveServerNotice` 按钮绑定点击事件

**逐步操作清单:**
1. 备份 `frontend/js/main.js`。
2. 声明全局 `let serverNotice = normalizeServerNotice()`（默认配置）。
3. 实现 `normalizeServerNotice(value = {})`。
4. 实现 `renderServerNotice()`。
5. 实现 `populateServerNoticeForm()`。
6. 实现 `saveServerNotice()`。
7. 重写 `setupNoticeFloating()` 为版本化逻辑。
8. 在 `applyPublicBackendConfig` 中接入 `server_notice`。
9. 在事件初始化区添加 `saveServerNotice` 绑定和面板回填调用。
10. 更新 JS 测试确保新函数被正确覆盖。
11. 运行 JS 沙箱测试验证全部通过。

**验证命令:**
```
node scripts/test-server-notice-admin.js --group=structure
node scripts/test-server-notice-admin.js --group=js
node scripts/test-server-notice-admin.js --group=all
```

**预期通过/失败分组:**
- structure：通过 🟢
- js：全部通过 🟢（40 条沙箱测试）
- backend：仍红灯
- css：允许仍红灯
- all：仍非零
- 只能宣告前台结构和 JS 行为通过

**Git 暂存边界:**
```
git add -- frontend/js/main.js scripts/test-server-notice-admin.js
```

**提交信息:**
```
feat: implement server notice config, render and save
```

**完成报告要求:**
1. 备份路径
2. 每个新增函数的行号和职责
3. 每个扩展函数的行号和改动摘要
4. JS 沙箱测试完整统计（通过数/总数）
5. 所有 40 条 JS 行为测试是否全部通过
6. XSS 安全渲染验证结果（恶意输入是否仅显示为纯文本）
7. localStorage 异常处理是否包 try/catch
8. 版本化关闭逻辑是否覆盖新旧键兼容
9. 确认未修改 HTML/CSS/backend/schema 和生产页
10. 确认 structure 和 js 分组全部通过

**停止点:** 提交完成后立即停止，不进入 Task 4。

---

## Task 4：后端配置白名单与样式完善

**Files:**
- `backend/server.js`（仅一行：ALLOWED_CONFIG_KEYS 增加 `'server_notice'`）
- `frontend/css/main.css`（新增 `.notice-hidden` 等少量样式 + 后台表单样式）
- 必要时微调 `scripts/test-server-notice-admin.js` 中的 backend/CSS 测试

**修改范围:**
- 后端白名单 + CSS + 测试调整

**明确禁止修改:**
- `frontend/index.html`
- `frontend/js/main.js`
- `backend/db/schema.sql`
- 所有其他文件

**实现接口:**
后端：
- `ALLOWED_CONFIG_KEYS` 数组增加 `'server_notice'`（1 行）

CSS 新增：
- `.notice-hidden` / `[hidden]` 样式
- 后台通知编辑区 `.card.pad` 内 label/textarea/button 布局
- textarea 合理最小高度（如 `min-height: 80px`）
- 保存提示 `.submit-hint` 颜色（成功/失败）
- 手机端表单防溢出（max-width: 100%）
- 暗色主题表单元素可读
- 手机端保存按钮 `min-height: 44px`（复用现有 `.btn-primary` 即可满足）
- 横屏 coarse 设备保存按钮 `min-height: 44px`

**逐步操作清单:**
1. 备份 `backend/server.js` 和 `frontend/css/main.css`。
2. `ALLOWED_CONFIG_KEYS` 增加 `'server_notice'`。
3. 新增 `.notice-hidden` 样式。
4. 后台通知编辑区样式完善。
5. 更新 backend 和 CSS 测试。
6. 运行所有分组测试验证全部通过。

**验证命令:**
```
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

**预期通过/失败分组:**
- structure/js/backend/css/all：全部通过 🟢（首次全绿）
- 所有回归测试通过
- 才允许宣告功能代码完成

**Git 暂存边界:**
```
git add -- backend/server.js frontend/css/main.css scripts/test-server-notice-admin.js
```

**提交信息:**
```
feat: allow server_notice in config and polish notice styles
```

**完成报告要求:**
1. 两个备份路径
2. 后端白名单修改位置
3. CSS 新增行的行号和选择器列表
4. 所有 5 个分组测试完整统计（全部转绿）
5. 所有回归测试统计
6. 确认前端 JS/HTML、backend schema、生产页未被修改
7. 确认所有测试全部通过

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

**逐步操作清单:**
1. 记录生产页 SHA256 基线。
2. `node scripts/build-frontend-preview.js`。
3. 启动本地 HTTP 预览（端口 52395）。
4. 通过 Playwright 真实浏览器验证：
   - 使用隔离后端 + 临时数据库
   - 在合法管理员会话中测试后台保存和前台加载
   - 如无合法会话，可在隔离数据库中使用测试管理员
   - 不输出凭据
5. 验证视口（同设计规格 §23）。
6. 验证交互（保存成功/失败、版本展开/折叠、暗色可读）。
7. 生成截图。
8. 验证后停止预览服务。

**验证命令:**
```
sha256sum erp14-server-showcase.html
node scripts/build-frontend-preview.js
node scripts/test-build-frontend-preview.js
node scripts/test-server-notice-admin.js --group=all
# 再加上 Playwright 浏览器验收脚本
```

**预期通过/失败分组:**
- 构建成功
- 所有自动测试通过
- 浏览器验收确认后台保存和前台展示正常

**Git:** 不创建提交。

**完成报告要求:**
1. 生产页 SHA256（前后一致）
2. preview 文件大小和时间
3. 构建测试统计
4. 浏览器验收的视口列表和每个视口的关键检查
5. 控制台错误数
6. 截图路径和大小
7. 是否使用隔离数据库
8. 正式数据库是否被写入
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

**逐步操作清单:**
1. 使用 `rg` 获取所有新增和扩展的真实行号。
2. 更新 `代码地图.md`。
3. 更新 `更新日志.md` 顶部日期区块。
4. 验证 git diff。

**验证命令:**
```
rg -n "noticeTitle\|noticeLines\|editNoticeEnabled\|editNoticeTitle\|editNoticeLines\|saveServerNotice\|saveNoticeHint\|normalizeServerNotice\|renderServerNotice\|populateServerNoticeForm\|server_notice\|notice-hidden" frontend/index.html frontend/js/main.js frontend/css/main.css backend/server.js
git diff --check -- 代码地图.md 更新日志.md
git diff --cached --name-only
```

**Git 暂存边界:**
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
