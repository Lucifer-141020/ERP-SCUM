# 玩家建议前台详情轻量优化 — 设计规格（Task 0.1）

> 本文档**仅固化设计规格**，不实现功能、不修改测试、不构建预览、不部署。
> 功能实现阶段请参阅本文件第四节「文件修改边界」与第六节「函数职责」。

---

## 1. 背景

玩家建议前台（`#requests` 视图）目前以卡片列表形式展示（`renderRequests()`，位于 `frontend/js/main.js` 约 2096 行）。每张卡片只显示摘要：状态标签、提交人、标题、截断后的内容、图片缩略图、分类/联系标签、投票按钮与「讨论」按钮、以及一条管理员说明（`admin-note`）。

管理员在后台填写的**处理说明**（`adminReply`）与**拒绝原因**（`rejectReason`）目前只在卡片底部以一条 `admin-note` 行显示，建议内容在卡片中会被截断（`<p>` 直接渲染 `item.text`，长文本无省略但卡片较高）。玩家想在卡片内快速查看**完整内容与管理员处理细节**，但当前没有统一的「展开详情」入口。

本优化目标：在建议卡片底部操作区最左侧增加「查看详情」按钮，点击后在**当前卡片内部**展开详情区，避免跳转、不新增弹窗、不新增复杂工单系统。

---

## 2. 当前真实结构

### 2.1 前台数据来源
`frontend/js/main.js` 中的 `requests` 数组由后端 `config.requests`（JSON 配置）加载并合并种子默认值（种子见 main.js 约 107–114 行）。**前端公开页不使用 `/api/requests` 数据库表接口**，因此可用字段以 `config.requests` 的 JSON 结构为准。

### 2.2 真实字段清单（来自种子与 `renderRequests` 实测）
| 字段名（前端驼峰） | 类型 | 说明 | 后台 DB 列名 |
| --- | --- | --- | --- |
| `status` | string | 原始状态：`pending` / `planned` / `done` / `rejected` | `status` |
| `category` | string | 分类原文，如 `新玩法/活动`、`优化`、`BUG` | `category` |
| `contact` | string | 联系方式 | `contact` |
| `images` | array<string> | 图片 URL 数组 | `images` (JSON) |
| `title` | string | 建议标题 | `title` |
| `user` | string | 提交人 / 玩家名称 | `user` |
| `text` | string | 建议完整内容 | `content` |
| `agree` | number | 同意数 | `agree` |
| `disagree` | number | 否定数 | `disagree` |
| `adminReply` | string | 管理员回复 / 完成说明（见第 7 节） | `admin_reply` |
| `rejectReason` | string | 拒绝原因（见第 7 节） | `reject_reason`（后台面板字段名） |

**重要缺口（必须如实记录，不得虚构）：**
- ❌ **`created_at` 不在前台 `requests` 数组中**。后端 `requests` 数据库表确有 `created_at`（`backend/server.js` 约 495 行 SELECT 包含），但前端 `config.requests` 配置与种子数据（108–113 行）**未携带该字段**，前台公开页也未从 `/api/requests` 读取。因此「提交时间」在真实前台数据中**当前不存在**。
- ❌ **无稳定 `id` 字段**。种子数据无 `id`；稳定 ID 由 `getRequestId(item, index)` 在运行时按需生成并写回 `item.id`（main.js 约 827 行）。

### 2.3 现有渲染逻辑（不可破坏）
- `normalizeRequestStatus(status)`：将 `planned` 规范为 `pending`，其余原样（默认 `pending`）。
- `requestLabel(status)`：映射 `pending→待讨论`、`done→已完成`、`rejected→已拒绝`。
- `requestCategoryLabel(category)`：`BUG→BUG`、`优化→优化项`、其他 `→新建议`。
- `escapeHtml(value)` / `escapeAttr(value)`：对所有动态文本做 HTML 转义（main.js 约 770 / 780 行），**所有玩家/管理员文本必须经由这两个函数**。
- 管理员说明现状（`renderRequests` 2111–2115）：
  - `done` → `完成说明：${item.adminReply || '已完成处理'}`
  - `rejected` → `拒绝原因：${item.rejectReason || item.adminReply || '管理员未填写拒绝原因'}`
  - 其他 → `管理员回复：${item.adminReply}`（仅当 `adminReply` 非空）

### 2.4 DOM 结构（来自 `frontend/index.html` 153–176 行）
```
#requests (section.view)
├─ #requestTabs (.tabs)        状态筛选：pending(默认激活)/done/rejected
├─ #requestSearch (.search)    关键词搜索
├─ #requestCategoryFilters     分类筛选：全部/BUG/新建议/优化项
└─ #requestGrid (.suggestion-grid)   卡片渲染容器（innerHTML 由 renderRequests 生成）
```
卡片由 `renderRequests()` 生成，每张为 `<article class="request-card ${frontStatus}">`，内含 `.request-head`、`<h3>`、`<p>`、`.request-images`、`.tag-row`、`.vote-row`（含 `.vote-counts` 与 `.vote-actions`），以及可选的 `.admin-note` 状态说明。

---

## 3. 目标

- 在建议卡片底部操作区（`.vote-actions`）**最左侧**新增「查看详情」按钮。
- 点击后在**当前卡片内部**展开详情区；按钮文案切换为「收起详情」。
- 同一时间仅展开一张卡片；切换或重新筛选时安全重置。
- 详情区复用真实字段，安全转义，不新增后端字段 / API / 数据结构。
- 满足移动端（320/375/414）无横向溢出、横屏触控可点击（≥44px）、亮暗主题可读、键盘可聚焦与 `aria-expanded` / `aria-controls` 可访问性。

---

## 4. 非目标（明确不做）

- ❌ 不新增独立详情弹窗 / 模态框。
- ❌ 不新增复杂工单、通知、聊天、追踪系统。
- ❌ 不新增后端字段、不修改 API、不修改数据库 schema。
- ❌ 不修改现有建议数据结构（`config.requests` 字段集合不变）。
- ❌ 不虚构 `reply` / `rejectReason`（注：`rejectReason` 是**真实存在字段**，非虚构）/ `completionNote` 等独立字段。
- ❌ 不修改生产页 `erp14-server-showcase.html`、管理后台、活动报名、玩家账号系统。
- ❌ 不点击整张卡片触发展开（避免与投票、图片、讨论按钮冲突）。
- ❌ 不建立复杂状态管理器、不使用 `localStorage` 记忆展开状态、刷新后不恢复展开。

---

## 5. 已确认交互（来自总指挥 35 条设计决定）

1. 采用「卡片内展开详情」方案。
2. 不新增独立详情弹窗。
3. 不新增复杂工单系统。
4. 在建议卡片底部现有操作区最左侧增加「查看详情」按钮。
5. 「查看详情」按钮与现有操作按钮并列，不覆盖、不替换现有功能。
6. 点击「查看详情」后，在当前卡片内部展开详情。
7. 展开后按钮文案改为「收起详情」。
8. 再次点击后收起。
9. 同一时间只允许展开一张建议卡片。
10. 点击另一张卡片的「查看详情」时，前一张自动收起。
11. 筛选条件改变或建议列表重新渲染后，展开状态安全重置。
12. 不允许点击整张卡片触发展开。
13. 手机端「查看详情」按钮触控高度不得低于 44px。
14. 不增加后端字段。
15. 不修改现有 API。
16. 不修改现有建议数据结构。
17. 只展示后端真实存在并已返回前台的字段。
18. 字段不存在或值为空时，对应详情行不显示，不展示 `undefined` / `null` / 空标题。
19. 不虚构「拒绝原因」「完成说明」等独立字段。
20. 若现有系统用同一字段承载回复/拒绝/完成说明，须按真实状态调标题但仍读同一真实字段。
21. `pending`/`planned` 状态显示适合当前真实语义的管理员说明标题。
22. `done` 状态将现有管理员说明字段显示为「完成说明」。
23. `rejected` 状态将现有管理员说明字段显示为「拒绝原因」。
24. 若真实数据结构与 21–23 无法对应，规格须按真实字段修正，不得擅自新增字段。
25. 状态沿用现有标准化逻辑：`planned→pending`、`pending→待讨论`、`done→已完成`、`rejected→已拒绝`。
26. 状态颜色复用现有样式，不建立第二套状态系统。
27. 建议卡片原有摘要、状态、分类、图片、投票及其他操作保持不变。
28. 展开详情不得重复显示没有额外价值的信息。
29. 展开区域需有清晰视觉分隔，但保持现有网站视觉风格。
30. 亮色与暗色主题下都必须清晰可读。
31. 320/375/414 手机宽度下不得横向溢出。
32. 667×375、812×375、896×414 横屏触控环境下按钮仍应容易点击。
33. 键盘用户可聚焦并触发「查看详情」按钮。
34. 按钮必须具有明确的 `aria-expanded` 状态。
35. 展开区域应具有稳定、唯一且可关联的 id，并由 `aria-controls` 指向。

---

## 6. 真实字段映射表（详情区展示）

> 优先顺序：1 完整内容 → 2 提交时间 → 3 玩家名称 → 4 分类 → 5 状态 → 6 管理员说明 → 7 图片。
> 所有值须经 `escapeHtml` / `escapeAttr` 转义。

| 展示项 | 真实字段 | 渲染条件 | 空值处理 |
| --- | --- | --- | --- |
| 1. 建议完整内容 | `item.text` | 始终 | `escapeHtml(item.text)`；空则整条不渲染（与卡片一致） |
| 2. 提交时间 | `item.created_at` | **仅当字段存在且非空** | ⚠️ 真实前台数据**当前无此字段**；不存在时不渲染该行（见第 18 条 / 已知限制） |
| 3. 玩家名称 | `item.user` | 始终 | `escapeHtml(item.user)` |
| 4. 建议分类 | `item.category` | 始终 | `requestCategoryLabel(item.category \|\| '')` |
| 5. 当前处理状态 | `normalizeRequestStatus(item.status)` + `requestLabel(...)` | 始终 | 复用现有标签与状态色类 |
| 6. 管理员说明 | `item.adminReply` / `item.rejectReason`（按状态选标题，见第 7 节） | 仅当对应字段非空 | 空则不渲染说明区 |
| 7. 图片 / 附件 | `item.images` | 仅当 `Array.isArray(item.images) && item.images.length` | 空则不渲染图片区；多图复用现有缩略图逻辑 |

> **与任务书假设的差异（重要）**：任务书第 20 条假设「同一字段承载管理员回复 / 拒绝说明 / 完成说明」。但**真实代码使用两个独立真实字段**：`adminReply` 与 `rejectReason`（见 `renderRequests` 2111–2115、后台 `renderRequestManagePanel` 1119/1123）。因此本规格按真实字段修正：标题随状态变化，但分别读取两个真实字段，而非单一字段。这满足第 24 条「按真实字段修正，不擅自新增字段」。

---

## 7. 各状态下管理员说明标题规则

真实字段：`adminReply`（管理员回复）、`rejectReason`（拒绝原因）。

| 规范后状态 | 标题 | 读取字段 | 回退 |
| --- | --- | --- | --- |
| `done` | **完成说明** | `item.adminReply` | 空时显示「已完成处理」 |
| `rejected` | **拒绝原因** | `item.rejectReason` | 空时回退 `item.adminReply`，再空显示「管理员未填写拒绝原因」 |
| `pending` / `planned` | **管理员回复** | `item.adminReply` | 空时不渲染说明区 |

> 此规则与现有 `renderRequests` 的 `statusNote` 逻辑完全一致，仅将「是否展开」从始终显示改为「仅在详情区（或卡片底部）按现有样式展示」，确保前后台语义统一、不新增字段。

---

## 8. 展开和收起状态规则

- **默认**：所有卡片收起，详情区不渲染；「查看详情」按钮 `aria-expanded="false"`。
- **点击展开**：当前卡片渲染详情区，按钮文案变「收起详情」，`aria-expanded="true"`，`aria-controls` 指向该详情区唯一 id。
- **再次点击**：收起当前卡片，文案还原，`aria-expanded="false"`。
- **切换卡片**：点击另一张的「查看详情」时，先收起已展开卡片（将 `expandedRequestId` 置空并重渲染或就地收起），再展开新卡片；保证同一时间仅一张展开。
- **重新筛选 / 搜索 / 重渲染**：`renderRequests()` 每次重渲染时依据 `expandedRequestId` 决定哪张展开；若当前展开 ID 不在筛选结果内，则该卡片不存在，等同于收起（安全重置，无残留展开态引用）。
- **不记忆**：不使用 `localStorage`，刷新后 `expandedRequestId` 恢复初始值（无展开）。

---

## 9. DOM 与可访问性设计

### 9.1 按钮位置
在 `.vote-actions` 内、**最左侧**插入：
```html
<button class="mini-btn" type="button"
        data-action="toggle-request-detail"
        data-request-id="${requestId}"
        aria-expanded="false"
        aria-controls="request-detail-${requestId}">查看详情</button>
```
- 复用现有 `.mini-btn` 类，与「同意 / 否定 / 讨论」按钮并列，不替换任何现有按钮。
- `requestId` 由 `getRequestId(item, index)` 取得（稳定 ID，见第 10 节）。

### 9.2 详情区
在卡片 `<article>` 内、`.vote-row` 之后（或 `.admin-note` 之后）插入：
```html
<div class="request-detail" id="request-detail-${requestId}"
     role="region" aria-label="建议详情" hidden>
  …（第 6 节映射的字段行）…
</div>
```
- `id` 稳定唯一，与按钮 `aria-controls` 严格对应。
- `hidden` 属性控制显隐（默认 `hidden`）；展开时移除 `hidden`。
- 视觉分隔：使用现有 `.admin-note` 同款圆角/内边距风格或新增极简 `.request-detail` 类（见第 13 节），保持网站既有视觉。

### 9.3 可访问性
- 按钮 `type="button"`，可键盘聚焦（`.mini-btn` 为原生 `<button>`，默认可聚焦）。
- `aria-expanded` 在展开/收起时同步切换 `true` / `false`。
- `aria-controls` 指向详情区 `id`。
- 详情区 `role="region"` + `aria-label`，便于屏幕阅读器定位。

---

## 10. 数据流

### 10.1 展开状态
```js
let expandedRequestId = null; // 默认：无卡片展开
```
- 使用稳定建议 ID（`getRequestId(item, index)` 返回值），**不优先用数组下标**。
- `getRequestId` 行为：若 `item.id` 存在则返回；否则生成 `req-${Date.now()}-${index}-${随机}` 并写回 `item.id`，保证同一次会话内稳定。
- **降级方案**：若 `getRequestId` 因异常无法生成（极端情况），回退使用 `index` 作为 key，并在测试与验收中明确该降级路径。

### 10.2 渲染联动
- `renderRequests()` 在生成每张卡片时，依据 `expandedRequestId === requestId` 决定详情区是否带 `hidden`、按钮 `aria-expanded` 与文案。
- 点击委托：在既有事件委托处（或新增独立委托）识别 `data-action="toggle-request-detail"`，读取 `data-request-id`，将其赋值给 `expandedRequestId`，然后调用 `renderRequests()` 重渲染（或就地切换 `hidden` + `aria-expanded`）。重渲染方案与现有 `vote-request` 委托一致，最简单可靠。

### 10.3 不持久化
- 不写 `localStorage`、不调用后端；刷新后 `expandedRequestId` 为 `null`。

---

## 11. 函数职责

| 函数 | 职责 | 是否新增 |
| --- | --- | --- |
| `renderRequests()` | 生成卡片时按 `expandedRequestId` 决定详情区显隐、按钮文案与 `aria-*`；不变更其他卡片逻辑 | 修改（增强） |
| `getRequestId(item, index)` | 取稳定 ID；详情展开状态 key 复用此函数 | 复用（已存在，main.js 约 827 行） |
| `normalizeRequestStatus` / `requestLabel` / `requestCategoryLabel` | 状态/分类标签映射 | 复用 |
| `escapeHtml` / `escapeAttr` | 动态文本转义 | 复用（强制使用） |
| 事件委托（识别 `toggle-request-detail`） | 设置 `expandedRequestId` 并重渲染 | 修改（新增一个 `data-action` 分支） |
| 详情区字段拼装（建议抽 `buildRequestDetail(item)` 小函数） | 按第 6/7 节生成详情 HTML，空值行不渲染 | 新增（小函数，可选） |

> 不为一次功能建立复杂状态管理器；`expandedRequestId` 为唯一新增状态变量。

---

## 12. 空字段和异常处理

- 字段不存在或值为空 → 对应详情行**不渲染**，绝不输出 `undefined` / `null` / 空标题。
- 管理员说明为空 → 不渲染说明区（与现状一致）。
- 图片数组为空 / 非数组 → 不渲染图片区。
- `created_at` 不存在 → **不渲染时间行**（当前真实数据即如此；若未来后端注入该字段，自动显示，无需改代码）。
- 文本一律经 `escapeHtml`；属性值（如 `id`、图片 `src`、`aria-controls`）经 `escapeAttr`，禁止未转义拼入 HTML。

---

## 13. CSS 与移动端边界

- 新增 `.request-detail` 类：仅做轻量视觉分隔（圆角、内边距、顶部细边框、柔和背景），复用现有设计令牌（`--radius`、`--border`、`--surface-soft` 等），不引入新颜色体系。
- 「查看详情」按钮复用 `.mini-btn`：
  - 桌面端 `.mini-btn` 为 `height: 30px`（`main.css` 约 1848 行）。
  - 手机端（`@media (max-width: 767px)`）与横屏触控（`@media (max-height: 450px) and (pointer: coarse)`）已在既有规则中将 `.mini-btn, .modal-close` 提升至 `min-height: 44px`（`main.css` 约 4411 / 4424 行），因此「查看详情」按钮**自动满足 ≥44px 触控高度**，无需额外样式。
- 不修改图标尺寸、颜色、圆角、边框、导航布局、交互逻辑。
- 320/375/414 竖屏、667×375 / 812×375 / 896×414 横屏：沿用现有 `.request-card` 网格与 `.vote-actions` flex 布局，按钮换行时由 `flex-wrap` 容纳，确保无横向溢出（与现有卡片行为一致）。
- 亮色 / 暗色：`.request-detail` 颜色使用与 `.admin-note` 一致的设计令牌；暗色下已由 `[data-theme="dark"] .admin-note` 等规则保证可读，新增类需补充对应暗色规则（若复用令牌则自动继承）。
- 不需要展开动画；若现有样式能极少 CSS 安全实现轻量过渡，可使用，但不作为功能依赖。

---

## 14. 文件修改边界

### 14.1 功能阶段允许修改
1. `frontend/js/main.js` —— 增强 `renderRequests()`、新增 `toggle-request-detail` 委托分支、可选 `buildRequestDetail()`、新增 `expandedRequestId` 变量。
2. `frontend/css/main.css` —— 新增 `.request-detail` 轻量样式（含暗色）。
3. 新增 `scripts/test-request-detail.js`（玩家建议详情专项测试），或在最合适现有测试文件中补充。

### 14.2 除非审计证明必须，否则不修改
1. `frontend/index.html` —— 卡片由 JS 动态生成，无需改静态结构（除非发现容器缺失，经核实后再议）。

### 14.3 最终文档阶段才允许修改
1. `代码地图.md`
2. `更新日志.md`

### 14.4 明确禁止修改
1. `erp14-server-showcase.html`（生产页）
2. `backend/`（含 `server.js`、数据库、schema）
3. 数据库和 schema
4. 现有 API（`/api/requests` 等）
5. 管理后台（仅前台公开页改动）
6. 活动报名功能
7. 玩家账号系统
8. 复杂工单 / 通知 / 聊天 / 追踪系统
9. `AGENTS.md`
10. `dist/`
11. 验收截图目录

---

## 15. 测试要求

建议新增 `scripts/test-request-detail.js`（纯 Node `fs` + `assert`，风格参照 `scripts/test-request-manage.js`，读取 `frontend/js/main.js` 或生产页 HTML 进行静态/结构断言；如需 DOM 行为，可沿用项目既有测试约定）。至少覆盖以下 **27** 项：

1. 「查看详情」按钮存在（卡片模板含 `data-action="toggle-request-detail"`）。
2. 按钮位于建议卡片底部操作区（`.vote-actions` 内，最左侧）。
3. 默认状态不展开详情（详情区 `hidden`）。
4. 点击后展开当前卡片（移除 `hidden`）。
5. 按钮文案变为「收起详情」。
6. `aria-expanded` 从 `false` 变为 `true`。
7. `aria-controls` 正确关联详情区域 id。
8. 再次点击收起。
9. 同一时间只展开一张卡片。
10. 点击另一张时前一张自动收起。
11. 重新筛选后展开状态安全重置。
12. 完整建议内容（`item.text`）正确显示并转义。
13. `created_at` 或真实时间字段正确显示（**仅当字段存在**；当前真实数据无此字段，测试应断言「不存在时不渲染时间行」）。
14. `pending` / `planned` 状态说明标题为「管理员回复」。
15. `done` 状态说明标题为「完成说明」。
16. `rejected` 状态说明标题为「拒绝原因」。
17. 管理员说明为空时不渲染空区块。
18. 不存在的字段不显示 `undefined` / `null`。
19. 图片为空时不渲染空图片区。
20. 状态颜色继续使用现有类名（`.request-card.done` / `.rejected` / `.pending` 及 `.tag` 状态色）。
21. 原有投票、讨论、筛选或其他按钮不回归。
22. 320/375/414 无横向滚动。
23. 横屏触控视口按钮可点击（≥44px）。
24. 查看详情按钮触控高度不低于 44px。
25. 亮色和暗色主题可读。
26. 控制台无 JavaScript 错误。
27. 生产页（`erp14-server-showcase.html`）保持不变（同步检查 `/api/config` 与 `check-frontend-sync.js` 不报差异）。

---

## 16. 浏览器验收标准

- 桌面 / 320 / 375 / 414 竖屏 / 667×375 / 812×375 / 896×414 横屏共 7 视口：
  - 「查看详情」按钮可见、可点击、键盘可聚焦（Tab 到达、`Enter`/`Space` 触发）。
  - 点击展开后详情区出现，按钮变「收起详情」，`aria-expanded=true`。
  - 切换卡片前一张自动收起；筛选 / 搜索后展开态重置。
  - 无横向滚动、无元素重叠、控制台零错误。
  - 暗色主题下详情区与说明文字清晰可读。
- 生产页 SHA256 与基准一致（`check-frontend-sync.js` 通过）。

---

## 17. 已知限制

1. **提交时间字段缺口**：真实前台 `requests` 数据（`config.requests`）当前**不含 `created_at`**，因此详情区「提交时间」行在当前数据下**不会显示**。后台 `requests` 数据库表虽有 `created_at`，但前台公开页不走该接口。若未来需要显示时间，须由后端将 `created_at` 注入 `config.requests` 或前端改走 `/api/requests` —— 均属超出本任务范围的改动，本规格仅做条件渲染预留，不擅自新增字段。
2. **稳定 ID 依赖运行时生成**：种子数据无 `id`，`getRequestId` 在会话内生成并写回 `item.id`；刷新后 ID 可能变化，但因 `expandedRequestId` 不持久化，无影响。
3. **两个独立管理字段**：`adminReply` 与 `rejectReason` 为真实独立字段，与任务书「同一字段承载」假设不同；本规格按真实字段修正（第 6/7 节），标题随状态变化但分别取真实字段。
4. **无展开动画**：本任务不依赖动画；如需轻量过渡由 CSS 承担且不阻塞功能。

---

## 18. 生产页同步边界

- 功能实现阶段**只改 `frontend/` 拆分源码**（`main.js` / `main.css`）；按项目既有流程，如需同步到 `erp14-server-showcase.html` 生产页，须在最终文档阶段由总指挥确认后执行（不在本 Task 0.1 范围）。
- 本规格本身不触碰任何生产文件；提交仅含规格文档。
- 所有改动须通过 `scripts/check-frontend-sync.js` 与 `scripts/verify-all.js`（功能阶段），确保生产页与 `frontend/` 不出现非预期差异。

---

## 附：规格自检结论（Task 0.1 收尾核对）

- ✅ 无 TBD / TODO / 待确认 / 模糊占位符。
- ✅ 字段映射全部来自真实代码（`renderRequests` 2111–2126、种子 108–113、后台 `server.js` 495/570）。
- ✅ 未虚构 `reply` / `completionNote`；`rejectReason`、`adminReply` 为真实字段。
- ✅ 「同一字段按状态改变标题」规则已明确修正为「两个真实字段、标题随状态变化」（第 6/7/17 节），并标注与任务书假设的偏差。
- ✅ 未要求修改 backend / 数据库 / API（第 14.4 节明确禁止）。
- ✅ 未要求修改生产页（第 14.4、18 节明确禁止）。
- ✅ 测试数量（27 项）与第 15 节描述一致。
- ✅ `git diff --check` 通过（仅新增文档，无空白错误）。
