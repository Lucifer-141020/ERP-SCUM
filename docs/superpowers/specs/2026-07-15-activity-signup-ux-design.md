# 活动报名前台体验优化设计规格

> 固定工作区：`C:\Users\Administrator\Desktop\SCUM用户网页`
> 阶段：Task 0 固化设计规格（仅文档，不写实施代码）
> 关联审计：活动报名前台体验优化 Task 1 现状审计（2026-07-11 产出）

---

## 1. 背景

SCUM 游戏服务器官网前台的活动报名区，目前能完成报名主流程，但玩家在前台缺少三项关键体验：

- 不知道报名还剩多久（无倒计时）。
- 不能一眼区分「报名中 / 即将截止 / 已截止 / 已结束」。
- 报名成功后没有明确的「我已报名」状态，刷新后也无法确认自己是否报过。

本规格只优化**前台体验**，不涉及后端、数据库、账号系统或生产页直接改动。所有数据均复用现有 `events` / `signups` 字段与现有报名接口。

---

## 2. 当前问题

| 问题 | 现状 | 影响 |
| --- | --- | --- |
| 无倒计时 | `renderActivitySignups()`（main.js:2166）仅静态显示 `报名截止 {formatDateText}` | 玩家无法感知紧迫度 |
| 状态单一 | `getActivityStatusBadge()`（main.js:2236）只有 常驻 / 已颁奖 / 已结束 / 进行中 / 报名中，无「即将截止」「报名已截止」 | 临近截止无警示 |
| 成功提示弱 | `submitEventSignup()`（main.js:2342）成功时 `showToast('报名已提交','success')` | 未体现活动名称，无「已报名」感 |
| 无本地报名记录 | 仅 `erp14-player-name` 存玩家名，不存报名了哪些活动 | 刷新后无法识别「我已报名」 |
| 首页徽章固定 | 首页报名项固定显示「可报名」徽章（main.js:2185），未随状态变化 | 截止后仍可能显示可报名 |

---

## 3. 目标

1. 报名期间持续显示剩余时间倒计时（秒级刷新）。
2. 用清晰的状态词区分：报名中 / 即将截止 / 报名已截止 / 已结束。
3. 报名成功后提示明确，且按钮立即变为不可点击的「玩家已报名」。
4. 刷新页面后，本设备保留「玩家已报名」状态（基于本地记录，非账号系统）。
5. 全部复用现有字段、接口、toast、localStorage 机制、卡片与弹窗结构。

---

## 4. 非目标

以下明确**不**在本次范围内：

- 新增玩家账号系统、登录体系、积分体系。
- 修改 `backend/`（任何接口、路由、逻辑）。
- 修改数据库表结构（`backend/db/schema.sql`）。
- 修改 `erp14-server-showcase.html` 生产页（本阶段）。
- 改变现有报名弹窗结构与输入字段。
- 改变活动结果展示、后台编辑、删除、合并等现有功能。
- 跨设备同步报名状态。
- 国际化、大规模重构、复杂权限管理。

---

## 5. 已确认交互文案

以下文案已由总指挥与用户确认，实施时不得更改：

| 场景 | 文案 |
| --- | --- |
| 剩余时间 > 24 小时 | `报名截止：还剩 X天 X小时` |
| 剩余时间 ≤ 24 小时 | `即将截止：还剩 HH:MM:SS` |
| 截止时间已过 | `报名已截止` |
| 无有效截止时间 | 不显示倒计时（不凭空创建时间） |
| 状态：常驻活动 | `常驻` |
| 状态：已有结果 | `已结束` |
| 状态：明确结束 | `已结束` |
| 状态：超过 24 小时可报 | `报名中` |
| 状态：≤ 24 小时可报 | `即将截止` |
| 状态：截止未结束 | `报名已截止` |
| 未报名且可报 | `立即报名 →`（可点击） |
| 已报名 | `玩家已报名`（不可点击） |
| 报名成功提示 | `报名成功！你已报名「活动名称」`（不含玩家名） |

> 成功提示不显示玩家名称，避免截图或直播时暴露玩家信息。

---

## 6. 状态判断规则

状态必须按以下**优先级顺序**判定，先命中先返回，避免互相冲突。
`getActivityStatusBadge(item)` 与 `isSignupVisible(item)`（main.js:796）必须使用一致的 `signupDeadline` / `eventEndAt` 时间判断，禁止一个显示「报名中」而另一个仍显示报名按钮。

| 优先级 | 条件 | 状态 |
| --- | --- | --- |
| 1 | `inferActivityType(item) === 'fixed'` | `常驻` |
| 2 | `item.results` 存在且长度 > 0 | `已结束` |
| 3 | `item.status` 含「结束」或「已结束」 | `已结束` |
| 4 | `eventEndAt` 已过（`new Date(eventEndAt).getTime() < Date.now()`） | `已结束` |
| 5 | `signupDeadline` 已过 | `报名已截止` |
| 6 | `signupDeadline` 剩余 ≤ 24 小时（含等于） | `即将截止` |
| 7 | `item.status` 含「进行」或「开始」 | `进行中` |
| 8 | 其他仍可报名的临时活动 | `报名中` |

说明：

- 「报名已截止」**不等于**活动已结束。截止后隐藏或禁用「立即报名」。
- 已结束活动不允许报名（`isSignupVisible` 返回 false）。
- 时间判断统一使用浏览器本地时间（见「已知限制」）。
- 现有 `getActivityStatusBadge` 的「已颁奖」状态保留为第 2 优先级的呈现别名（results 存在即视为已结束并标注已颁奖样式）。

---

## 7. 倒计时规则

倒计时只针对**仍可报名**的活动（即 `isSignupVisible` 为 true 的项）。

| 条件 | 显示文案 |
| --- | --- |
| `signupDeadline` 有效且剩余 > 24h | `报名截止：还剩 X天 X小时` |
| `signupDeadline` 有效且剩余 ≤ 24h | `即将截止：还剩 HH:MM:SS` |
| `signupDeadline` 已过 | `报名已截止` |
| `signupDeadline` 无效 / 为空 / 解析失败 | 不显示倒计时 |

实现约束：

1. 倒计时**每秒**更新一次。
2. **不允许**每秒完整重绘全部活动卡片。
3. 使用**单一、可复用**的定时器（`startSignupCountdownTimer()`），只更新带倒计时标识的 DOM 节点（如 `data-countdown` 属性节点）。
4. 页面多次调用渲染函数时，不得叠加多个 `setInterval`；定时器只能存在一个。
5. 当状态跨越 24 小时边界或截止时间时，应更新状态徽章与按钮；允许在边界发生时触发**一次**活动区域重绘（`renderActivitySignups()` / `renderUpdates()`），但不得每秒重绘。
6. 倒计时 DOM 节点在每次卡片渲染时写入，例如：
   `<span class="signup-countdown" data-countdown="2026-07-20T20:00:00">报名截止：还剩 2天 3小时</span>`
   `updateSignupCountdownNodes()` 仅读取 `data-countdown` 并刷新其文本。

格式化细节（`formatSignupCountdown`）：

- 剩余 > 24h：`days = floor(ms / 86400000)`，`hours = floor((ms % 86400000) / 3600000)`；展示 `还剩 {days}天 {hours}小时`；当 `days === 0` 时展示 `还剩 {hours}小时`（可读性优化，仍属「X天 X小时」规则子集）。
- 剩余 ≤ 24h：`HH = floor(ms/3600000)`，`MM = floor((ms%3600000)/60000)`，`SS = floor((ms%60000)/1000)`；各段补零到两位，展示 `还剩 {HH}:{MM}:{SS}`。

---

## 8. 本地报名记录结构

新增 localStorage 键：

```
erp14-event-signups
```

推荐数据结构（JSON 字符串）：

```json
{
  "活动ID": {
    "playerName": "玩家名称",
    "recordedAt": "ISO时间"
  }
}
```

约定：

1. 只在**后端返回报名成功后**写入（见「数据流」）。
2. `eventId` 统一转成字符串作为键，与 `activeSignupEventId`（`getUpdateId(item, index)`，main.js:784）保持一致；即 `String(getUpdateId(item, index))`。
3. `playerName` 保存实际成功提交的玩家名称（trim 后）。
4. `recordedAt` 使用 `new Date().toISOString()`。
5. 读取时必须 `try/catch` 安全解析 JSON。
6. 数据不存在、格式错误或 localStorage 不可用时，返回空对象 `{}`，不让页面报错。
7. 不修改现有 `erp14-player-name` 键的用途。
8. 不跨设备同步，不读取全部后端报名名单来模拟账号系统。

---

## 9. 数据流

### 9.1 渲染阶段（读）

`renderActivitySignups()`（main.js:2166）与 `renderUpdates()`（main.js:2257）：

1. 调用 `getSignupTimeState(item, Date.now())` 得到 `{ state, remainingMs }` 纯数据。
2. 状态徽章改用扩展后的 `getActivityStatusBadge(item)`，覆盖 常驻 / 已结束 / 报名已截止 / 即将截止 / 进行中 / 报名中。
3. 若 `isSignupVisible(item)` 为真：
   - 若 `isLocalPlayerSignedUp(eventId, activePlayerName)` 为真 → 渲染不可点击的 `玩家已报名`。
   - 否则 → 渲染可点击的 `立即报名 →`（`data-open-signup`）。
4. 若 `signupDeadline` 有效 → 渲染带 `data-countdown` 的倒计时节点，初始文本由 `formatSignupCountdown(remainingMs)` 生成。
5. 调用 `startSignupCountdownTimer()` 确保全局唯一定时器运行。

### 9.2 报名提交阶段（写）

`submitEventSignup(event)`（main.js:2342）成功分支调整：

```
const data = await fetchWithFallback(backendUrl(`/api/events/${eventIdNum}/signup`), {...});
// 进入成功分支（fetchWithFallback 仅在 HTTP 2xx 时返回，否则抛错进入 catch）
eventSignupCounts[activeSignupEventId] = data.count || (... + 1);
if (playerName) {
  activePlayerName = playerName;
  localStorage.setItem('erp14-player-name', playerName);   // 现有逻辑保留
  saveLocalEventSignup(activeSignupEventId, playerName);  // 新增：仅成功后写
}
closeEventSignup();
renderActivitySignups();      // 重渲染后按钮变为「玩家已报名」
loadAdminEventSignups();
showToast(`报名成功！你已报名「${item.title}」`, 'success');  // 文案调整，不含玩家名
```

### 9.3 边界重绘

当 `updateSignupCountdownNodes()` 发现某节点从「>24h」跨入「≤24h」或从「可报」跨入「已截止」时，调用一次 `renderActivitySignups()` 刷新徽章与按钮，随后继续只更新文本。

---

## 10. 函数职责

遵循项目现有单文件 JavaScript 风格（main.js），不新建模块或框架。函数名可在核对现有风格后微调，但职责不变：

| 函数 | 职责 |
| --- | --- |
| `getSignupTimeState(item, now)` | 纯函数。返回 `{ state: '报名中'|'即将截止'|'报名已截止'|'已结束'|'常驻', remainingMs: number }`。基于 `signupDeadline` / `eventEndAt` / `results` / `status` 计算，不操作 DOM。 |
| `formatSignupCountdown(remainingMs)` | 纯函数。将剩余毫秒格式化为第 7 节规定的文案。 |
| `readLocalEventSignups()` | 安全读取 `erp14-event-signups`，返回对象；任何异常返回 `{}`。 |
| `saveLocalEventSignup(eventId, playerName)` | 仅报名成功后调用。读旧对象 → 设 `obj[String(eventId)] = { playerName, recordedAt: new Date().toISOString() }` → 写回。localStorage 异常时吞掉，不影响主流程。 |
| `isLocalPlayerSignedUp(eventId, playerName)` | 判断当前浏览器、当前玩家是否有成功记录。见第 11 节匹配规则。 |
| `startSignupCountdownTimer()` | 确保全局仅一个 `setInterval`（模块级变量持有句柄）。已存在则直接返回。每秒调用 `updateSignupCountdownNodes()`。 |
| `updateSignupCountdownNodes()` | 仅查询 `[data-countdown]` 节点，按 `data-countdown` 时间戳刷新文本；发现跨边界时触发一次重绘。不重绘整页。 |

> 现有 `isSignupVisible`（main.js:796）、`isFutureDate`（main.js:790）、`formatDateText`（main.js:802）、`showToast`（main.js:716）、`getUpdateId`（main.js:784）保持不变或仅做最小扩展。

---

## 11. 错误处理

### 11.1 本地记录写入失败

1. localStorage 读写失败**不能**阻止正常报名。
2. localStorage 保存失败时，后端报名成功仍然算成功。
3. localStorage 保存失败可继续显示成功 toast，但刷新后可能不保留「玩家已报名」。

### 11.2 后端 / 网络错误

沿用现有 `submitEventSignup` 的 catch 逻辑：

1. 网络失败、后端 409（重复报名）、截止、活动不存在等错误，继续使用后端真实 `message`。
2. 失败响应**不得**关闭弹窗。
3. 失败响应**不得**写本地成功记录。
4. 失败时按钮保持「立即报名」，弹窗保持现有错误处理逻辑（在 `#signupSubmitHint` 显示错误）。

### 11.3 成功判定唯一闸门

只有 `fetchWithFallback` 返回成功（HTTP 2xx，响应 `success` 为 true）的响应才能：

- 写入本地记录（`saveLocalEventSignup`）；
- 关闭弹窗（`closeEventSignup`）；
- 显示成功 toast（`报名成功！你已报名「活动名称」`）；
- 让按钮变为「玩家已报名」。

不把重复报名错误自动当作成功，不自动写入本地记录。

### 11.4 「玩家已报名」匹配规则

`isLocalPlayerSignedUp(eventId, playerName)` 判定：

1. `eventId` 必须匹配本地记录键（字符串比较）。
2. 当前 `activePlayerName` 非空时，保存的 `playerName` 也必须匹配。
3. 名称比较沿用项目现有清理方式：`a.trim().toLowerCase() === b.trim().toLowerCase()`（同 main.js:3735 的 `playerSessions` 比较）。
4. 若 `activePlayerName` 为空，**不得**仅凭其他玩家留下的记录误判当前玩家已报名（返回 false）。
5. 本地记录丢失后重复报名，继续由后端现有重复报名检查（409）阻止。

---

## 12. 文件修改边界

### 预计修改

- `frontend/js/main.js` — 新增 7 个函数，扩展 `getActivityStatusBadge` / `renderActivitySignups` / `renderUpdates` / `submitEventSignup`，接入定时器与本地记录。
- `frontend/css/main.css` — 新增状态徽章样式（即将截止 / 报名已截止 / 玩家已报名）、倒计时节点样式，复用现有 `--brand` / `--danger` / `--accent-warm` 等变量。
- 新增一个活动报名体验专项测试文件（具体名称在实施计划中确定，如 `scripts/test-activity-signup-ux.js`）。

### 原则上不需要修改

- `frontend/index.html` — 现有 `#eventSignupModal` 弹窗结构（行 311-326）保持不变。
- `backend/` — 不改任何接口或逻辑。
- `backend/db/schema.sql` — 不改表结构。
- `erp14-server-showcase.html` — 本阶段不动（后续同步阶段再处理）。
- 现有活动数据结构（`events` / `signups` 字段）。
- 现有报名弹窗结构与输入字段。

### 最终文档阶段才允许修改

- `代码地图.md` — 补充新函数位置。
- `更新日志.md` — 记录本次改动。

---

## 13. 测试要求

新增专项测试必须覆盖以下 20 项（除说明外均为纯函数 / 静态结构断言，不依赖后端）：

1. 剩余 > 24 小时 → 状态 `报名中`。
2. 剩余正好 24 小时 → 状态 `即将截止`。
3. 剩余 < 24 小时 → 状态 `即将截止`。
4. 截止时间已过 → 状态 `报名已截止`。
5. 活动明确结束（status 含「已结束」） → 状态 `已结束`。
6. 已有 `results` → 状态 `已结束`。
7. 无有效截止时间 → 不显示倒计时（不创建时间）。
8. 倒计时格式：天/小时形式正确（`还剩 X天 X小时`）。
9. 倒计时格式：HH:MM:SS 形式正确（补零）。
10. 未报名且可报 → 显示 `立即报名`。
11. 本地成功记录存在 → 显示 `玩家已报名`。
12. 不同玩家名称不能误判为已报名（activePlayerName 不匹配时返回未报名）。
13. 报名失败不写 localStorage（catch 分支不调用 `saveLocalEventSignup`）。
14. 报名成功后才写 localStorage（成功分支调用 `saveLocalEventSignup`）。
15. localStorage 损坏时页面不报错（`readLocalEventSignups` 返回 `{}`）。
16. 定时器不会重复创建（`startSignupCountdownTimer` 多次调用只保留一个 `setInterval`）。
17. 不每秒重绘整个活动区域（`updateSignupCountdownNodes` 只更新 `[data-countdown]` 节点）。
18. 现有活动测试继续通过（`test-activity-content` / `test-activity-overflow` / `test-activity-merge` / `test-activity-delete`）。
19. 320 / 375 / 414 手机视口无横向溢出。
20. 控制台错误为 0，报名弹窗在手机上完整显示。

---

## 14. 浏览器验收标准

使用 `dist/erp14-server-showcase.preview.html` 预览（由 `scripts/build-frontend-preview.js` 生成），覆盖以下视口：

| 视口 | 方向 | 检查重点 |
| --- | --- | --- |
| 320 × 800 | 竖屏 | 无横向滚动；倒计时不溢出卡片；按钮 ≥ 44px 触控高度 |
| 375 × 812 | 竖屏 | 状态徽章清晰；倒计时可读 |
| 414 × 896 | 竖屏 | 活动卡片不溢出父容器 |
| 667 × 375 | 横屏 | 主视觉与活动区高度合理 |
| 812 × 375 | 横屏 | 活动区布局正常 |
| 896 × 414 | 横屏 | 弹窗不被上下裁切 |
| 1440 × 900 | 桌面参考 | 状态与倒计时样式协调 |

通用验收：

- 倒计时每秒刷新且跨边界时状态/按钮更新正确。
- `立即报名` 点击打开弹窗；`玩家已报名` 不可点击。
- 报名成功 toast 显示 `报名成功！你已报名「活动名称」` 且无玩家名。
- 刷新页面后本设备「玩家已报名」保留。
- 亮色 / 暗色主题均清晰。
- 控制台 0 错误。

---

## 15. 已知限制

1. **浏览器时间依赖**：倒计时与状态边界使用浏览器本地时间。玩家修改本机时钟会导致显示偏差。属已确认接受的限制，不在本次解决。
2. **本地记录非账号级**：`erp14-event-signups` 仅存于当前浏览器。清除数据、隐身模式、换设备后状态消失；多玩家共用一台设备会覆盖彼此记录。这不视为「账号级」或「跨设备」识别。
3. **不校验后端真实报名**：本地「玩家已报名」不代表后端一定成功（如本地写入后后端回滚）；但后端重复报名检查仍独立生效。
4. **生产页不同步**：`erp14-server-showcase.html` 本阶段不改动，需后续同步阶段处理。
5. **活动自动状态未后台化**：`status` 字段若未由管理员及时更新为「已结束」，前端仍按时间推导（截止后显示「报名已截止」，结束时间过后显示「已结束」）。

---

## 16. 后续生产页同步边界

1. 本阶段所有功能代码改动只在 `frontend/` 拆分源码（main.js / main.css）。
2. `erp14-server-showcase.html` 生产页**不**在本阶段修改。
3. 生产页同步放到独立的「同步阶段」执行：将 `frontend/` 改动合并回单文件生产页，并运行 `scripts/check-frontend-sync.js` 与 `scripts/verify-all.js` 验证。
4. 同步阶段才允许更新 `代码地图.md` 与 `更新日志.md`。
5. 不修改 `backend/` 与数据库结构，生产页同步时亦同。
