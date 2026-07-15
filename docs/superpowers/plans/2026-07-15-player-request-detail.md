# Player Request Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在玩家建议卡片底部增加“查看详情”按钮，点击后在卡片内部展开真实详情，同时保持现有投票、筛选、提交和后台功能不变。

**Architecture:** 使用单一 `expandedRequestId` 保存当前展开建议的运行时 ID。建议卡仍由 `renderRequests()` 生成，详情区与按钮状态由该变量决定；筛选、搜索和数据重载时显式清空展开状态，不新增后端字段、API、弹窗或持久化。

**Tech Stack:** 原生 HTML、CSS、JavaScript、Node.js 内置测试工具、项目现有构建与浏览器验收流程。

---

## 〇、全局约束（适用于全部 Task）

1. **固定工作区**：`C:\Users\Administrator\Desktop\SCUM用户网页`（以下命令均以此为当前目录执行）。
2. **只修改 `frontend/` 拆分源码**，不同步生产页。
3. **禁止修改**：
   - `erp14-server-showcase.html`（生产页）
   - `backend/`（含 `server.js`、数据库、schema）
   - 现有 API（`/api/requests` 等）
   - 管理后台
   - `frontend/index.html`
   - `AGENTS.md`
   - 活动报名功能
   - 玩家账号系统
   - `dist/`
   - 验收截图目录
4. **功能阶段预计修改**：`frontend/js/main.js`、`frontend/css/main.css`。
5. **测试阶段新增**：`scripts/test-request-detail.js`。
6. **最终文档阶段才允许修改**：`代码地图.md`、`更新日志.md`。
7. **不得清理、覆盖、还原或提交工作区已有无关改动**。
8. **每个修改任务开始前必须创建带时间戳备份**，备份不提交 Git。
9. **每个任务独立提交**，只暂存该任务允许的文件。
10. **生产页 SHA256 在每个构建或浏览器验收阶段前后记录并保持不变**。

### 真实代码锚点（读取确认，仅供定位，不修改这些位置以外的逻辑）

| 文件 | 位置 | 内容 |
| --- | --- | --- |
| `frontend/js/main.js` | `770` | `escapeHtml(value = '')` |
| `frontend/js/main.js` | `780` | `escapeAttr(value = '')` |
| `frontend/js/main.js` | `809-811` | `normalizeRequestStatus(status)` |
| `frontend/js/main.js` | `813-815` | `requestLabel(status)` |
| `frontend/js/main.js` | `823-825` | `requestCategoryLabel(category)` |
| `frontend/js/main.js` | `827-832` | `getRequestId(item, index)`，缺 `id` 时生成并写回 `item.id` |
| `frontend/js/main.js` | `2096-2138` | `renderRequests()`，卡片模板与 `.vote-actions`（2127-2133） |
| `frontend/js/main.js` | `3271-3298` | `voteRequest()`，内部多次调用 `renderRequests()`（3276/3288/3295） |
| `frontend/js/main.js` | `3965` | `requestSearch` 的 `input` 监听直接绑定 `renderRequests` |
| `frontend/js/main.js` | `3966-3972` | `requestTabs` 按钮点击 → `renderRequests()`（3970） |
| `frontend/js/main.js` | `3973-3979` | `requestCategoryFilters` 按钮点击 → `renderRequests()`（3977） |
| `frontend/js/main.js` | `4014` | `document.addEventListener('click', ...)` 前台事件委托起点 |
| `frontend/js/main.js` | `4024-4028` | `vote-request` 委托分支（同区域新增 `toggle-request-detail` 分支） |
| `frontend/js/main.js` | `4064-4080` | `renderAll()`，整体重绘入口（含 4074 `renderRequests()`） |
| `frontend/css/main.css` | `1843-1855` | `.vote-actions`、`.mini-btn`（`min-height:30px` 桌面） |
| `frontend/css/main.css` | `2690-2701` | `.admin-note`、`.admin-note.reject`、`.admin-note.done` 视觉令牌 |
| `frontend/css/main.css` | `4411-4415` | `@media (max-width:767px)` 内 `.mini-btn, .modal-close` `min-height:44px` |
| `frontend/css/main.css` | `4424-4430` | `@media (max-height:450px) and (pointer:coarse)` 内 `44px` |
| `frontend/css/main.css` | `4561-4568` | `[data-theme="dark"] .request-card` / `.admin-note` 暗色令牌 |
| `frontend/index.html` | `153-176` | `#requests` 静态容器（`requestTabs` / `requestSearch` / `requestCategoryFilters` / `requestGrid`），卡片由 JS 动态生成，无需改动 |

> 说明：`.mini-btn` 在手机端（≤767px）与横屏粗指针下已是 `min-height:44px`，因此“查看详情”按钮复用 `.mini-btn` 即满足 ≥44px 触控高度，无需额外样式（与设计规格第 13 节一致）。

### 生产页 SHA256 基准

- 已知基准（来自 `更新日志.md` / `代码地图.md`）：`4b18022b8c98ccb2d4112a8fc6d78e9947843401bb8cdabc6abfc1e127e9010a`
- 该基准为历史记录值。**执行阶段（Task 4）必须以运行时刻重新计算为准**，不可直接信任此常量。重新计算命令见 Task 4。

---

## 一、Task 1：增加玩家建议详情红灯测试

**Files（只修改）：**
- `scripts/test-request-detail.js`（新建）

**Interfaces：**
- 纯 Node `fs` + `assert`，风格参照 `scripts/test-request-manage.js`。
- 读取 `frontend/js/main.js` 与 `frontend/css/main.css` 全文做静态/结构断言。
- 暴露 `test(name, fn)` 与 `passed` 计数，失败置 `process.exitCode = 1`。

**Steps：**
- [ ] 1. 创建 `scripts/test-request-detail.js`，头部注释说明：纯 Node、读取 `frontend/js/main.js` 与 `frontend/css/main.css`、验证玩家建议详情的 32 项要求（断言总数在报告末尾列出）。
- [ ] 2. 读取两个源文件并缓存为字符串 `JS` 与 `CSS`。
- [ ] 3. 编写断言分组（明确每项断言对应的规格编号与搜索串）：
  - [ ] 3.1 状态变量：`JS` 含 `expandedRequestId`（规格 8/10/11-14）。
  - [ ] 3.2 详情按钮模板：`JS` 含 `data-action="toggle-request-detail"`（规格 1、2、9、31）。
  - [ ] 3.3 按钮位于 `.vote-actions` 内最左侧：模板中 `toggle-request-detail` 出现在 `vote-request` 之前（规格 2）。
  - [ ] 3.4 `data-request-id` 由 `getRequestId` 取得：`JS` 含 `data-request-id="${` 与 `getRequestId(item, index)` 调用（规格 9、31）。
  - [ ] 3.5 `aria-expanded`、`aria-controls`：`JS` 含 `aria-expanded=` 与 `aria-controls="request-detail-`（规格 6、7）。
  - [ ] 3.6 稳定详情区 `id`：`JS` 含 `id="request-detail-${`（规格 7、31）。
  - [ ] 3.7 文案切换：`JS` 含 `查看详情` 与 `收起详情`（规格 5、8）。
  - [ ] 3.8 同时仅展开一张：`JS` 含 `expandedRequestId === requestId` 比较逻辑与切换分支（规格 9、10）。
  - [ ] 3.9 三类筛选/搜索清空：`JS` 含在 `requestSearch` 监听、`requestTabs` 点击、`requestCategoryFilters` 点击处调用 `resetExpandedRequest()`（或等价 `expandedRequestId = null`）（规格 11、12、13、15）。
  - [ ] 3.10 数据重载清空：`JS` 含在 `renderAll()` 或 requests 重新赋值处调用 `resetExpandedRequest()`（规格 15）。
  - [ ] 3.11 普通重绘保留：`renderRequests()` 内部不得无条件写 `expandedRequestId = null`（规格 14）。（反向断言：在 `renderRequests` 函数切片内不应出现 `expandedRequestId = null`）
  - [ ] 3.12 `adminReply` / `rejectReason` 映射：`JS` 含 `getRequestAdminDetail(` 或等价函数名，且含 `完成说明`、`拒绝原因`、`管理员回复` 三标题（规格 18-20）。
  - [ ] 3.13 空管理员说明不渲染：函数逻辑含当字段为空返回 `null` 的分支（规格 21）。
  - [ ] 3.14 `created_at` 缺失不渲染：`JS` 含对 `item.created_at` 的存在性判断（规格 17）。
  - [ ] 3.15 `images` 缺失不渲染：`JS` 含 `Array.isArray(item.images) && item.images.length` 判断（规格 23）。
  - [ ] 3.16 无有效 ID 安全降级：`JS` 含当 `requestId` 为空时跳过按钮与详情区、列表不崩溃的分支（规格 31）。
  - [ ] 3.17 HTML 与属性转义：`JS` 含 `escapeHtml(item.text)` 与 `escapeAttr(requestId)`（或 `escapeAttr` 包裹 `id`/`src`）（规格 16、22）。
  - [ ] 3.18 移动端/横屏 44px：`CSS` 含 `.mini-btn` 在 `@media (max-width:767px)` 与 `@media (max-height:450px) and (pointer:coarse)` 下的 `min-height:44px`（规格 26、27、28）。
  - [ ] 3.19 暗色主题样式：`CSS` 含 `[data-theme="dark"]` 下与 `.request-detail` 或 `.admin-note` 相关的可读配色（规格 29）。
  - [ ] 3.20 原有投票/讨论操作仍存在：`JS` 含 `data-action="vote-request"` 与 `讨论` 按钮模板（规格 25）。
  - [ ] 3.21 生产页暂未同步：`JS` 或测试断言确认存在 `erp14-server-showcase.html` 且本功能不修改它；`check-frontend-sync.js` 允许报预期差异（规格 32）。
  - [ ] 3.22 控制台无 JS 错误 / 不出现 undefined、null：通过静态检查 `JS` 不得直接拼接 `undefined` / `null` 字面量到详情模板（规格 22、30）。
- [ ] 4. 报告末尾打印 `通过 X / 总计 Y` 与 `断言总数：Z`（Z 为所有 `test()` 调用中 `assert.ok/StrictEqual` 的实际条数；若合并断言，Z 须等于合并后真实断言数）。

**Commands：**
```bash
cd "C:\Users\Administrator\Desktop\SCUM用户网页"
node scripts/test-request-detail.js
echo "--- 回归 ---"
node scripts/test-request-manage.js
node scripts/test-home-structure.js
node scripts/test-mobile-touch-targets.js
node --check frontend/js/main.js
```

**Expected：**
- `node scripts/test-request-detail.js` 退出码非零（红灯），新详情断言失败；报告列出失败项（至少 3.1/3.2/3.5/3.6/3.7/3.9 等核心项失败）。
- 回归脚本全部通过：`test-request-manage.js`、`test-home-structure.js`、`test-mobile-touch-targets.js` 通过；`node --check frontend/js/main.js` 语法通过。
- 不修改 `frontend/` 任何文件。

**Git 暂存边界：**
```bash
git add scripts/test-request-detail.js
```

**Commit message：**
```
test: define player request details
```

**Stop point：** 提交后立即停止，**不进入 Task 2**（不实现功能）。

---

## 二、Task 2：实现 JavaScript 详情交互

**Files（只修改）：**
- `frontend/js/main.js`

**不修改：** `frontend/css/main.css`、任何测试文件、`frontend/index.html`、生产页、后端。

**Interfaces（函数职责与签名，前后一致）：**

1. 状态变量（在 `main.js` 既有状态声明区，紧邻 `requests` / `requestVotes` 附近新增）：
   ```js
   let expandedRequestId = null; // 默认：无卡片展开
   ```

2. `getRequestAdminDetail(item, status)` → 返回 `{ label, value }` 或 `null`：
   ```js
   function getRequestAdminDetail(item, status) {
     const norm = normalizeRequestStatus(status);
     if (norm === 'done') {
       const text = (item.adminReply || '').trim();
       return text ? { label: '完成说明', value: text } : null;
     }
     if (norm === 'rejected') {
       const reason = (item.rejectReason || '').trim();
       if (reason) return { label: '拒绝原因', value: reason };
       const reply = (item.adminReply || '').trim();
       return reply ? { label: '拒绝原因', value: reply } : null;
     }
     // pending / planned
     const reply = (item.adminReply || '').trim();
     return reply ? { label: '管理员回复', value: reply } : null;
   }
   ```

3. `buildRequestDetail(item, requestId)` → 返回详情区内部 HTML 字符串：
   ```js
   function requestDetailRow(label, valueHtml) {
     return `<div class="request-detail-row"><span class="request-detail-label">${escapeHtml(label)}</span><div class="request-detail-value">${valueHtml}</div></div>`;
   }
   function buildRequestDetail(item, requestId) {
     const rows = [];
     rows.push(requestDetailRow('建议内容', escapeHtml(item.text)));
     if (item.created_at) rows.push(requestDetailRow('提交时间', escapeHtml(item.created_at)));
     rows.push(requestDetailRow('提交人', escapeHtml(item.user)));
     rows.push(requestDetailRow('分类', escapeHtml(requestCategoryLabel(item.category || ''))));
     rows.push(requestDetailRow('状态', escapeHtml(requestLabel(item.status))));
     const admin = getRequestAdminDetail(item, item.status);
     if (admin) rows.push(requestDetailRow(admin.label, escapeHtml(admin.value)));
     let imagesHtml = '';
     if (Array.isArray(item.images) && item.images.length) {
       imagesHtml = `<div class="request-detail-images">${item.images.map(src => `<img class="request-detail-img" src="${escapeAttr(src)}" alt="${escapeAttr(item.title || '建议图片')}" loading="lazy">`).join('')}</div>`;
     }
     return `<div class="request-detail-inner">${rows.join('')}${imagesHtml}</div>`;
   }
   ```

4. `resetExpandedRequest()`：
   ```js
   function resetExpandedRequest() {
     expandedRequestId = null;
   }
   ```

5. `toggleRequestDetail(requestId)`：
   ```js
   function toggleRequestDetail(requestId) {
     if (!requestId) return;
     expandedRequestId = (expandedRequestId === requestId) ? null : requestId;
     renderRequests();
   }
   ```

**Steps：**
- [ ] 1. 创建带时间戳备份：`备份/main.js.YYYYMMDD-HHMMSS.bak`（仅备份，不提交）。
- [ ] 2. 在状态声明区新增 `let expandedRequestId = null;`。
- [ ] 3. 在 `getRequestId` 附近新增 `getRequestAdminDetail`、`requestDetailRow`、`buildRequestDetail`、`resetExpandedRequest`、`toggleRequestDetail`（签名与上面一致）。
- [ ] 4. 修改 `renderRequests()`（`main.js` 2096-2138）：
  - [ ] 4.1 在 `.map(({ item, index }) => {` 内部，用 `const requestId = getRequestId(item, index);` 取得稳定 ID（与 `getPlayerVote` 同款写法）。
  - [ ] 4.2 计算 `const isExpanded = expandedRequestId === requestId;`。
  - [ ] 4.3 构造详情按钮（仅当 `requestId` 有效）：
    ```js
    const detailBtn = requestId
      ? `<button class="mini-btn" type="button" data-action="toggle-request-detail" data-request-id="${escapeAttr(requestId)}" aria-expanded="${isExpanded ? 'true' : 'false'}" aria-controls="request-detail-${escapeAttr(requestId)}">${isExpanded ? '收起详情' : '查看详情'}</button>`
      : '';
    ```
  - [ ] 4.4 在 `.vote-actions` 内、最左侧（`${voteActions}` 之前）插入 `${detailBtn}`。
  - [ ] 4.5 构造详情区（仅当 `requestId` 有效），放在 `${statusNote}` 之后、闭合 `</article>` 之前：
    ```js
    const detailRegion = requestId
      ? `<div class="request-detail" id="request-detail-${escapeAttr(requestId)}" role="region" aria-label="建议详情" ${isExpanded ? '' : 'hidden'}>${buildRequestDetail(item, requestId)}</div>`
      : '';
    ```
  - [ ] 4.6 当 `!requestId` 时，`detailBtn` 与 `detailRegion` 均为空串，列表继续正常渲染（规格 31 安全降级）。
  - [ ] 4.7 不改动投票、`disagree`、`.request-images`、`.tag-row`、`statusNote` 任何现有逻辑。
- [ ] 5. 在 `document.addEventListener('click', ...)`（`main.js` 4014 起）的 `vote-request` 分支（4024）之后，新增委托分支：
  ```js
  const detailTrigger = event.target.closest('[data-action="toggle-request-detail"]');
  if (detailTrigger && !detailTrigger.closest('#panelMain')) {
    toggleRequestDetail(detailTrigger.dataset.requestId);
    return;
  }
  ```
- [ ] 6. 显式清空场景（不破坏 `voteRequest` 内的 `renderRequests` 调用）：
  - [ ] 6.1 `requestSearch` 监听（3965）：改为 `document.getElementById('requestSearch').addEventListener('input', () => { resetExpandedRequest(); renderRequests(); });`
  - [ ] 6.2 `requestTabs` 点击（3970 处 `renderRequests();` 前）插入 `resetExpandedRequest();`
  - [ ] 6.3 `requestCategoryFilters` 点击（3977 处 `renderRequests();` 前）插入 `resetExpandedRequest();`
  - [ ] 6.4 数据重载：`renderAll()`（4064）开头（或 4074 `renderRequests()` 前）插入 `resetExpandedRequest();`
- [ ] 7. 验证：
  ```bash
  cd "C:\Users\Administrator\Desktop\SCUM用户网页"
  node --check frontend/js/main.js
  node scripts/test-request-detail.js
  node scripts/test-request-manage.js
  node scripts/test-home-structure.js
  node scripts/test-mobile-touch-targets.js
  ```
- [ ] 8. 本阶段预期：`node --check` 通过；`test-request-detail.js` 中 JS 相关断言全部通过（CSS 相关断言如 `.request-detail` 暗色类尚未存在可仍失败）；`test-request-manage.js` / `test-home-structure.js` / `test-mobile-touch-targets.js` 通过。

**Commands：**
```bash
cd "C:\Users\Administrator\Desktop\SCUM用户网页"
node --check frontend/js/main.js && node scripts/test-request-detail.js
```

**Expected：**
- `node --check` 通过，无语法错误。
- `test-request-detail.js` JS 断言通过、退出码 0（或仅余 CSS 类断言失败，不影响 JS 逻辑验收）。
- 原有建议/首页/触控测试全绿，无回归。

**Git 暂存边界：**
```bash
git add frontend/js/main.js
```

**Commit message：**
```
feat: add player request detail interactions
```

**Stop point：** 提交后立即停止，**不进入 Task 3**（不写 CSS）。

---

## 三、Task 3：实现详情样式与触控边界

**Files（只修改）：**
- `frontend/css/main.css`

**不修改：** `frontend/js/main.js`、任何测试文件。

**Interfaces（选择器，前后一致）：**
- `.request-detail`（详情区容器，复用 `.admin-note` 同款圆角/内边距/顶部细边框/柔和背景令牌）
- `.request-detail-inner`（Task 2 生成的内部包裹）
- `.request-detail-row`（单行：标签 + 值）
- `.request-detail-label`（标签）
- `.request-detail-value`（值，允许长文本换行）
- `.request-detail-images` / `.request-detail-img`（图片区，不溢出）
- 对应 `[data-theme="dark"]` 覆盖

**Steps：**
- [ ] 1. 创建带时间戳备份：`备份/main.css.YYYYMMDD-HHMMSS.bak`（仅备份，不提交）。
- [ ] 2. 在既有 `.admin-note` 规则附近（约 2690 行后）新增详情区基础样式（复用现有令牌，不新增 CSS 变量）：
  ```css
  .request-detail {
    margin-top: 12px;
    padding: 12px 14px;
    border-top: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface-soft, rgba(255,255,255,0.04));
  }
  .request-detail-inner { display: flex; flex-direction: column; gap: 8px; }
  .request-detail-row { display: flex; flex-direction: column; gap: 2px; }
  .request-detail-label { font-size: 12px; color: var(--text-500); }
  .request-detail-value { font-size: 14px; color: var(--text-200); white-space: pre-wrap; word-break: break-word; }
  .request-detail-images { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
  .request-detail-img { width: 88px; height: 88px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); }
  ```
  > 若 `--surface-soft` 不存在于项目令牌，改用 `rgba(255,255,255,0.04)` 常量，不引入新变量名。
- [ ] 3. 详情区与卡片正文有清晰分隔（已通过 `border-top` + `margin-top` 实现），不改动全站视觉。
- [ ] 4. “查看详情”按钮继续复用 `.mini-btn`（不新增按钮类），桌面端维持 `min-height:30px`，移动端/横屏已由既有 `44px` 规则覆盖。
- [ ] 5. 暗色主题覆盖（在 `[data-theme="dark"]` 区块，约 4561 行后补充）：
  ```css
  [data-theme="dark"] .request-detail { background: rgba(255,255,255,0.04); border-color: var(--border); }
  [data-theme="dark"] .request-detail-label { color: var(--text-500); }
  [data-theme="dark"] .request-detail-value { color: var(--text-200); }
  ```
- [ ] 6. 移动端（≤767px）集成测试已在 Task 1 覆盖，本任务仅确认无需额外尺寸：320/375/414 下 `.request-detail-value` 通过 `word-break` / `pre-wrap` 正常换行，`.request-detail-images` 用 `flex-wrap` 不溢出，`.vote-actions` 沿用现有 `flex-wrap`。
- [ ] 7. 横屏（`@media (max-height:450px) and (pointer:coarse)`）：`.request-detail-img` 固定 88px 不溢出；按钮高度由 `.mini-btn` 既有 44px 规则保证。
- [ ] 8. 桌面端不强制把所有 `.mini-btn` 放大到 44px，保持现有 `30px` 规格。
- [ ] 9. 验证：
  ```bash
  cd "C:\Users\Administrator\Desktop\SCUM用户网页"
  node scripts/test-request-detail.js
  node scripts/test-request-manage.js
  node scripts/test-mobile-touch-targets.js
  node scripts/test-home-structure.js
  node --check frontend/js/main.js
  git diff --check
  ```

**Commands：**
```bash
cd "C:\Users\Administrator\Desktop\SCUM用户网页"
git diff --check frontend/css/main.css
```

**Expected：**
- `test-request-detail.js` 全部通过（含 `.request-detail` 暗色类断言）。
- `test-request-manage.js` / `test-mobile-touch-targets.js` / `test-home-structure.js` 全绿。
- `node --check frontend/js/main.js` 通过（未改动 JS，仅作保险）。
- `git diff --check` 无空白错误。

**Git 暂存边界：**
```bash
git add frontend/css/main.css
```

**Commit message：**
```
style: add player request detail layout
```

**Stop point：** 提交后立即停止，**不构建预览**（不进入 Task 4）。

---

## 四、Task 4：构建预览与浏览器验收

**Files（原则上不修改功能代码；允许生成但不提交）：**
- `dist/erp14-server-showcase.preview.html`（构建产物）
- `验收截图/玩家建议详情/`（验收截图，不提交）
- 临时验收脚本（不提交）

**不修改：** `erp14-server-showcase.html`、`frontend/`、`backend/`、测试源文件。

**Steps：**
- [ ] 1. 记录生产页构建前 SHA256（重新计算，不使用常量）：
  ```bash
  cd "C:\Users\Administrator\Desktop\SCUM用户网页"
  node -e "const c=require('crypto'),fs=require('fs');console.log(c.createHash('sha256').update(fs.readFileSync('erp14-server-showcase.html')).digest('hex'))"
  ```
  记录输出值（构建后须与之完全一致）。
- [ ] 2. 执行构建预览：
  ```bash
  node scripts/build-frontend-preview.js
  ```
- [ ] 3. 执行预览构建测试：
  ```bash
  node scripts/test-build-frontend-preview.js
  ```
- [ ] 4. 执行所有专项与回归：
  ```bash
  node scripts/test-request-detail.js
  node scripts/test-request-manage.js
  node scripts/test-home-structure.js
  node scripts/test-mobile-touch-targets.js
  node scripts/test-activity-overflow.js
  node --check frontend/js/main.js
  ```
- [ ] 5. 启动 HTTP 服务打开 `dist/erp14-server-showcase.preview.html`（**不使用生产页作为验收目标**）：
  ```bash
  cd "C:\Users\Administrator\Desktop\SCUM用户网页"
  python -m http.server 52399 --bind 127.0.0.1
  # 浏览器访问 http://127.0.0.1:52399/dist/erp14-server-showcase.preview.html
  ```
- [ ] 6. 浏览器数据准备：
  - 优先使用预览页当前真实建议数据（来自 `config.requests`）。
  - 如真实数据无法覆盖 `pending`/`done`/`rejected` 与空字段场景，可在浏览器运行时通过控制台临时注入验收数据（`requests.push(...)` 或覆盖 `requests` 后调用 `renderRequests()`）。
  - 临时数据不得写入后端、数据库或项目源码；验收结束刷新或关闭页面即恢复。
- [ ] 7. 浏览器视口清单（7 类）：
  - 320×800
  - 375×812
  - 414×896
  - 667×375，`pointer: coarse`
  - 812×375，`pointer: coarse`
  - 896×414，`pointer: coarse`
  - 1440×900 桌面
- [ ] 8. 浏览器验收必须覆盖（29 项断言）：
  1. 默认全部收起。
  2. 按钮位于卡片底部操作区最左侧。
  3. 点击后当前卡片展开。
  4. 按钮文案变为“收起详情”。
  5. `aria-expanded` 正确（`true`）。
  6. `aria-controls` 正确指向 `request-detail-${id}`。
  7. 再次点击收起。
  8. 点击另一张时前一张收起。
  9. 状态筛选后清空（展开态重置）。
  10. 分类筛选后清空。
  11. 搜索变化后清空。
  12. `pending`/`planned` 管理员回复正确（标题“管理员回复”）。
  13. `done` 显示“完成说明”。
  14. `rejected` 显示“拒绝原因”。
  15. 管理员说明为空时无空区块和占位文案。
  16. `created_at` 缺失时无时间行。
  17. `images` 缺失时无空图片区。
  18. 长内容完整显示且不会破坏布局。
  19. 原有投票、否定、讨论操作仍存在并可点击。
  20. 320/375/414 无横向滚动。
  21. 横屏触控按钮高度 ≥44px。
  22. 桌面布局正常。
  23. 亮色主题可读。
  24. 暗色主题可读。
  25. 控制台 JavaScript 错误为 0。
  26. 页面异常错误（pageerror）为 0。
  27. 不出现 `undefined` / `null` 字样。
  28. 生产页 SHA256 前后一致。
  29. `check-frontend-sync` 的差异准确归因为“生产页暂未同步”。
- [ ] 9. 截图至少包含（不提交）：
  - 375px 默认收起
  - 375px 展开详情
  - 375px 已完成详情
  - 375px 已拒绝详情
  - 375px 暗色主题
  - 414px 展开详情
  - 812×375 横屏触控
  - 1440px 桌面展开详情
- [ ] 10. 记录构建后生产页 SHA256（重算），与步骤 1 记录值比对，必须一致。
- [ ] 11. 运行同步检查并记录预期差异：
  ```bash
  node scripts/check-frontend-sync.js
  ```
  确认差异仅限“frontend 已新增玩家建议详情功能，生产页暂未同步”，真实失败数为 0。
- [ ] 12. 如发现产品缺陷：停止验收，原样报告，**不自行修改功能代码**，等待总指挥下发返工提示词。
- [ ] 13. 浏览器验收全部通过后，**不创建功能提交**，等待文档收尾（Task 5）。

**Commands：**
```bash
cd "C:\Users\Administrator\Desktop\SCUM用户网页"
node scripts/build-frontend-preview.js
node scripts/test-build-frontend-preview.js
node scripts/check-frontend-sync.js
```

**Expected：**
- 构建成功，`dist/erp14-server-showcase.preview.html` 生成。
- `test-build-frontend-preview.js` 通过；所有专项/回归测试通过。
- 29 项浏览器断言全部通过；截图按要求生成（不提交）。
- 生产页 SHA256 前后一致；`check-frontend-sync.js` 真实失败为 0，差异准确归因。

**Git 暂存边界：** 本 Task **不提交任何文件**（`dist/`、截图目录、临时脚本均不提交）。

**Stop point：** 验收通过后停止，等待 Task 5 文档收尾（不进入 Task 5 直到总指挥确认）。

---

## 五、Task 5：文档收尾

**Files（只修改）：**
- `代码地图.md`
- `更新日志.md`

**不修改：** `frontend/`、测试、`erp14-server-showcase.html`、后端。

**Steps：**
- [ ] 1. 用 `rg` / `grep` 获取最终真实行号（不要凭记忆）：
  ```bash
  cd "C:\Users\Administrator\Desktop\SCUM用户网页"
  grep -n "let expandedRequestId" frontend/js/main.js
  grep -n "function getRequestAdminDetail" frontend/js/main.js
  grep -n "function buildRequestDetail" frontend/js/main.js
  grep -n "function resetExpandedRequest" frontend/js/main.js
  grep -n "function toggleRequestDetail" frontend/js/main.js
  grep -n "toggle-request-detail" frontend/js/main.js
  grep -n "resetExpandedRequest()" frontend/js/main.js
  grep -n ".request-detail" frontend/css/main.css
  ```
- [ ] 2. 在 `代码地图.md` 新增“玩家建议前台详情（v2026-07-15）”章节，记录：
  - `expandedRequestId` 变量位置与语义。
  - 管理员说明映射函数 `getRequestAdminDetail(item, status)` 行号与三标题规则。
  - 详情构建函数 `buildRequestDetail(item, requestId)` 行号。
  - `renderRequests` 详情逻辑（`detailBtn` / `detailRegion` / `isExpanded`）行号。
  - 详情按钮事件委托（`toggle-request-detail` 分支）行号。
  - 筛选/搜索清空逻辑（`requestSearch` / `requestTabs` / `requestCategoryFilters` / `renderAll` 四处 `resetExpandedRequest()`）行号。
  - `.request-detail` 系列样式在 `main.css` 的行号。
  - 移动端与横屏触控规则（复用 `.mini-btn` 44px）行号。
  - `scripts/test-request-detail.js` 说明（断言总数按实际填写）。
- [ ] 3. 在 `更新日志.md` 按“记录格式”新增一条，包含：
  - 功能范围（仅前台卡片内展开详情，不新增后端/API/弹窗/持久化）。
  - 真实字段限制（`created_at` 当前前台数据不存在，仅条件渲染预留）。
  - 空值不显示规则（管理员说明为空不渲染；`created_at` 缺失不渲染；`images` 空不渲染）。
  - 三种状态标题规则（`done`→完成说明、`rejected`→拒绝原因、`pending/planned`→管理员回复）。
  - 同时仅展开一张。
  - 筛选/搜索/数据重载清空 `expandedRequestId`。
  - 测试统计（按 Task 1 报告的实际断言总数与通过数填写，不得写虚假数量）。
  - 浏览器验收视口（7 类）与结论（29 项断言全部通过；如未实际执行则不得声称通过）。
  - 截图未提交（`验收截图/玩家建议详情/`，不进 Git）。
  - 生产页未同步（SHA256 前后一致，但 `frontend/` 已领先）。
  - 未部署。
  - `check-frontend-sync` 预期差异的准确归因（frontend 已新增详情功能，生产页暂未同步）。
- [ ] 4. 不写虚假测试数量；不写未实际执行的浏览器结论；不记录 `created_at` 当前可见；不声称生产页已同步。
- [ ] 5. 验证只改了这两个文档：
  ```bash
  cd "C:\Users\Administrator\Desktop\SCUM用户网页"
  git diff --check
  git status --short
  ```

**Commands：**
```bash
cd "C:\Users\Administrator\Desktop\SCUM用户网页"
git diff --check 代码地图.md 更新日志.md
```

**Expected：**
- `git status --short` 仅显示 `代码地图.md` 与 `更新日志.md` 改动。
- `git diff --check` 无空白错误。
- 文档内容与实际代码行号、测试数量、验收结论一致。

**Git 暂存边界：**
```bash
git add 代码地图.md 更新日志.md
```

**Commit message：**
```
docs: record player request details
```

**Stop point：** 提交后任务全部完成，停止。

---

## 六、32 项设计测试要求分配表

| 规格项 | 内容 | Task 1（测试） | Task 2（JS） | Task 3（CSS） | Task 4（验收） |
| --- | --- | --- | --- | --- | --- |
| 1 | 查看详情按钮存在 | ✔ | ✔ | — | ✔ |
| 2 | 按钮位于底部操作区最左 | ✔ | ✔ | — | ✔ |
| 3 | 默认不展开（hidden） | ✔ | ✔ | — | ✔ |
| 4 | 点击展开（移除 hidden） | ✔ | ✔ | — | ✔ |
| 5 | 文案变“收起详情” | ✔ | ✔ | — | ✔ |
| 6 | aria-expanded false→true | ✔ | ✔ | — | ✔ |
| 7 | aria-controls 关联 id | ✔ | ✔ | — | ✔ |
| 8 | 再次点击收起 | ✔ | ✔ | — | ✔ |
| 9 | 同时只展开一张 | ✔ | ✔ | — | ✔ |
| 10 | 点击另一张前一张收起 | ✔ | ✔ | — | ✔ |
| 11 | 状态筛选清空 | ✔ | ✔ | — | ✔ |
| 12 | 分类筛选清空 | ✔ | ✔ | — | ✔ |
| 13 | 搜索变化清空 | ✔ | ✔ | — | ✔ |
| 14 | 普通重绘保留展开 | ✔ | ✔ | — | ✔ |
| 15 | 重新筛选安全重置 | ✔ | ✔ | — | ✔ |
| 16 | 完整内容转义显示 | ✔ | ✔ | — | ✔ |
| 17 | created_at 仅当存在 | ✔ | ✔ | — | ✔ |
| 18 | pending/planned 管理员回复 | ✔ | ✔ | — | ✔ |
| 19 | done 完成说明 | ✔ | ✔ | — | ✔ |
| 20 | rejected 拒绝原因 | ✔ | ✔ | — | ✔ |
| 21 | 空管理员说明不渲染 | ✔ | ✔ | — | ✔ |
| 22 | 不显示 undefined/null | ✔ | ✔ | — | ✔ |
| 23 | 图片为空不渲染 | ✔ | ✔ | — | ✔ |
| 24 | 状态颜色复用现有类 | ✔ | — | ✔ | ✔ |
| 25 | 原投票/讨论不回归 | ✔ | ✔ | ✔ | ✔ |
| 26 | 320/375/414 无横向滚动 | ✔ | — | ✔ | ✔ |
| 27 | 横屏触控 ≥44px | ✔ | — | ✔ | ✔ |
| 28 | 查看详情按钮 ≥44px | ✔ | — | ✔ | ✔ |
| 29 | 亮/暗主题可读 | ✔ | — | ✔ | ✔ |
| 30 | 控制台无 JS 错误 | ✔ | — | — | ✔ |
| 31 | 无有效 ID 不渲染且列表不崩 | ✔ | ✔ | — | ✔ |
| 32 | 生产页暂未同步（归因） | ✔ | — | — | ✔ |

> 全部 32 项均映射到至少一个 Task；Task 1 以静态断言覆盖全部 32 项（红灯→绿灯），Task 4 以浏览器断言覆盖 29 项（30/31/32 中 31 为静态安全、32 为同步检查归因，30 为控制台零错误）。

---

## 七、计划自检（五）

1. **32 项测试要求是否全部映射？** 是，见第六节分配表，每项至少命中一个 Task。
2. **管理员字段规则是否与规格一致？** 是，`getRequestAdminDetail` 中 `done→完成说明(adminReply)`、`rejected→拒绝原因(rejectReason 优先，回退 adminReply)`、`pending/planned→管理员回复(adminReply)`，空值返回 `null` 不渲染，与规格第 7 节一致。
3. **是否错误加入 created_at 数据来源改造？** 否。仅做 `if (item.created_at)` 条件渲染，不新增字段、不改后端、不走 `/api/requests`。
4. **是否错误设计 index 降级？** 否。采用规格第 10.1 节“无有效 ID 时跳过按钮与详情区、列表不崩溃”，无 `index` 降级 key。
5. **是否错误要求同步生产页？** 否。全局约束第 3 条明确禁止改生产页；规格 32 / Task 4 明确“生产页暂未同步，check-frontend-sync 允许报差异并准确归因”。
6. **是否遗漏筛选、搜索、重载清空状态？** 否。Task 2 步骤 6.1-6.4 显式在四处调用 `resetExpandedRequest()`。
7. **是否遗漏普通重绘保留展开状态？** 否。Task 2 步骤 4 明确 `renderRequests()` 内部不写 `expandedRequestId = null`；`voteRequest` 的 `renderRequests` 调用保持展开。
8. **是否遗漏无有效 ID 的安全处理？** 否。Task 2 步骤 4.3/4.5/4.6 在 `!requestId` 时返回空串，列表继续渲染。
9. **文件路径、函数名、选择器是否前后一致？** 是。统一使用 `expandedRequestId`、`getRequestAdminDetail`、`buildRequestDetail`、`resetExpandedRequest`、`toggleRequestDetail`、`request-detail*` 选择器，全文一致。
10. **是否存在占位符或模糊指令？** 否。无 TBD/TODO/稍后实现/适当处理/类似 Task N/自行决定/视情况而定。所有步骤含具体代码骨架与命令。
11. **git diff --check 结果：** 本计划文件为纯新增，无尾随空白；Task 执行时各 Task 均要求 `git diff --check` 通过。

---

## 八、Git 边界（本计划文档自身）

只暂存并提交：
```
docs/superpowers/plans/2026-07-15-player-request-detail.md
```

提交信息：
```
docs: plan player request details
```

不得暂存或提交其他文件。

---

## 九、完成报告（执行者填写，非本文件范围）

本文件仅含计划。实际执行后的 21 项完成报告由执行者在最终回复中提供（实际工作目录、读取文件、计划路径、总行数、Task 数量与名称、各 Task 修改文件与提交信息、32 项分配、浏览器验收项数、视口清单、生产页同步边界、check-frontend-sync 归因、文档收尾边界、占位符检查、规格覆盖自检、git diff --check、git diff --cached --name-only、新提交号、确认只提交计划、确认未改功能/测试/生产页/后端/数据库、矛盾缺口说明）。
