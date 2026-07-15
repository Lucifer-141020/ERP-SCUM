# Player Request Detail Implementation Plan

> **状态：已废弃 / 已被玩家建议卡片简化方案替代**
>
> **废弃说明**
> - 原 Task 1–5 的"详情展开"路线已终止。
> - **不得继续依据此计划恢复 `expandedRequestId`、`buildRequestDetail`、`toggleRequestDetail` 或 `request-detail` DOM。**
> - **最终实际完成路线：**
>   1. 重新定义简化测试；
>   2. 删除详情展开 JavaScript；
>   3. 修复按钮换行和字体；
>   4. 强化后台图片大图提示；
>   5. 构建预览与浏览器验收。
> - 当前实现以更新日志最新记录和代码地图当前定位为准。
>
> 历史正文保留作为决策过程记录，不再代表当前实施方案。

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
   - `scripts/check-frontend-sync.js`（不得修改来迁就本功能）
4. **功能阶段预计修改**：`frontend/js/main.js`、`frontend/css/main.css`。
5. **测试阶段新增**：`scripts/test-request-detail.js`（支持 `--group=js` / `--group=css` / `--group=all`）。
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
| `scripts/test-activity-signup-ux.js` | 全文 | **真实沙箱测试范本**：`extractFunction` + `new Function` 提取并真实执行函数 |

> 说明：`.mini-btn` 在手机端（≤767px）与横屏粗指针下已是 `min-height:44px`，因此“查看详情”按钮复用 `.mini-btn` 即满足 ≥44px 触控高度，无需额外样式（与设计规格第 13 节一致）。

### 生产页 SHA256 基准

- 已知基准（来自 `更新日志.md` / `代码地图.md`）：`4b18022b8c98ccb2d4112a8fc6d78e9947843401bb8cdabc6abfc1e127e9010a`
- 该基准为历史记录值。**执行阶段（Task 4）必须以运行时刻重新计算为准**，不可直接信任此常量。重新计算命令见 Task 4。

---

## 一、Task 1：增加玩家建议详情红灯测试（三层测试 + 分组运行）

**Files（只修改）：**
- `scripts/test-request-detail.js`（新建）

**Interfaces：**
- 纯 Node `fs` + `assert`，风格参照 `scripts/test-activity-signup-ux.js`：用 `extractFunction` 从 `frontend/js/main.js` 提取纯函数后，在 `new Function` 沙箱中**真实执行**。
- 同时读取 `frontend/js/main.js` 与 `frontend/css/main.css` 做结构断言。
- 支持命令行分组：`--group=js` / `--group=css` / `--group=all`（默认 `all`）。
- `test(group, name, fn)` 登记用例；运行器只执行匹配分组的用例；任一失败置 `process.exitCode = 1`，**不得在任何位置强制将其改回 0**。

**测试三层（对应设计规格 32 项要求）：**

- **A. JS 结构静态测试（group=js）**：检查 `main.js` 中按钮/属性/状态变量的存在性（A.1–A.7）。
- **B. JavaScript 行为测试（group=js）**：在沙箱中**真实执行** `getRequestAdminDetail` / `buildRequestDetail` / `toggleRequestDetail` / `resetExpandedRequest` / `renderRequests`，验证展开、互斥、清空、字段映射、转义、空值、无有效 ID 安全等（B.1–B.24）。**不得使用以下方式代替真实执行**：只检查函数名存在 / 只检查中文文案存在 / 只检查 if 分支字符串存在 / 只检查 `expandedRequestId === requestId` 字符串存在。
- **C. CSS 结构静态测试（group=css）**：检查 `main.css` 中 `.request-detail` 相关样式、暗色覆盖、触控 44px、换行与不溢出（C.1–C.7）。
- **浏览器实际验收（29 项）**：**不在本测试文件**，属于 Task 4。控制台错误、真实布局、真实触控矩形等必须由浏览器验收覆盖，不得在本文件冒充静态通过。

**Steps：**
- [ ] 1. 创建 `scripts/test-request-detail.js`，头部注释说明：纯 Node、读取 `frontend/js/main.js` 与 `frontend/css/main.css`、支持 `--group` 分组、三层测试覆盖 32 项要求。
- [ ] 2. 实现分组解析：`const GROUP = (process.argv.find(a => a.startsWith('--group=')) || '--group=all').slice(8);` 仅允许 `js|css|all`，非法值 `process.exit(1)`。
- [ ] 3. 实现 `extractFunction(src, name)`（与 `test-activity-signup-ux.js` 一致：尊重字符串内括号、保留 `async`）。
- [ ] 4. 实现 `test(group, name, fn)`：按 `group` 登记到 `jsTests` 或 `cssTests`；运行器在末尾执行匹配分组，打印 `  ✓ / ✗`，失败 `process.exitCode = 1`；最后按分组打印 `通过 X / 总计 Y`，不得把失败改成提示。
- [ ] 5. **JS 结构测试 A.1–A.7**（断言 `main.js` 字符串/结构）：
  - [ ] A.1 `main.js` 含 `let expandedRequestId`（或 `var expandedRequestId`）声明。
  - [ ] A.2 `main.js` 含 `data-action="toggle-request-detail"`。
  - [ ] A.3 `main.js` 含 `data-request-id=`（详情按钮写入请求 ID）。
  - [ ] A.4 `main.js` 含 `aria-expanded=`。
  - [ ] A.5 `main.js` 含 `aria-controls=`。
  - [ ] A.6 `main.js` 含 `id="request-detail-`（稳定详情区 id 结构）。
  - [ ] A.7 `main.js` 含 `查看详情` 与 `收起详情` 文案。
- [ ] 6. **CSS 结构测试 C.1–C.7**（断言 `main.css` 字符串/结构）：
  - [ ] C.1 `main.css` 含 `.request-detail` 选择器。
  - [ ] C.2 `.request-detail` 含清晰分隔（`border-top` 或 `margin-top` 且非 0）。
  - [ ] C.3 `main.css` 含 `[data-theme="dark"] .request-detail` 暗色覆盖。
  - [ ] C.4 手机端 `@media (max-width:767px)` 内 `.mini-btn` 含 `min-height:44px`（详情按钮复用）。
  - [ ] C.5 横屏 `@media (max-height:450px) and (pointer:coarse)` 内 `.mini-btn` 含 `min-height:44px`。
  - [ ] C.6 `.request-detail-value` 含 `word-break` 或 `white-space:pre-wrap`（长文本换行）。
  - [ ] C.7 `.request-detail-images` 与 `.request-detail-img` 选择器存在（图片不溢出基础）。
- [ ] 7. **行为沙箱 `buildRequestSandbox(seed)`**（真实执行核心）：
  ```js
  function buildRequestSandbox(seed) {
    const helpers = [
      extractFunction(MAIN_JS, 'getRequestId'),
      extractFunction(MAIN_JS, 'escapeHtml'),
      extractFunction(MAIN_JS, 'escapeAttr'),
      extractFunction(MAIN_JS, 'normalizeRequestStatus'),
      extractFunction(MAIN_JS, 'requestLabel'),
      extractFunction(MAIN_JS, 'requestCategoryLabel'),
      extractFunction(MAIN_JS, 'getRequestAdminDetail'),
      extractFunction(MAIN_JS, 'buildRequestDetail'),
      extractFunction(MAIN_JS, 'resetExpandedRequest'),
      extractFunction(MAIN_JS, 'toggleRequestDetail'),
      extractFunction(MAIN_JS, 'renderRequests')
    ].join('\n');
    const wrapper = `
      let requests = ${JSON.stringify(seed.requests)};
      let requestVotes = ${JSON.stringify(seed.requestVotes || {})};
      let expandedRequestId = null;
      const captured = { requestGrid: '' };
      // renderRequests 实际引用的辅助函数提供 no-op mock（按真实源码补齐列表）
      const getPlayerVote = () => ({ agree: 0, disagree: 0 });
      const applyIcons = () => {};
      const loadRequestImages = () => {};
      const document = {
        getElementById: (id) => {
          if (id === 'requestGrid') {
            const b = { _html: '' };
            Object.defineProperty(b, 'innerHTML', { get(){return this._html;}, set(v){this._html=v; captured.requestGrid=v;} });
            return b;
          }
          return { innerHTML:'', value:'', textContent:'', classList:{add(){},remove(){}}, setAttribute(){}, addEventListener(){} };
        },
        querySelectorAll: () => []
      };
      ${helpers}
      return {
        get expandedRequestId(){ return expandedRequestId; },
        get grid(){ return captured.requestGrid; },
        render: () => { renderRequests(); return captured.requestGrid; },
        toggle: (id) => toggleRequestDetail(id),
        reset: () => resetExpandedRequest(),
        adminDetail: (item, status) => getRequestAdminDetail(item, status),
        build: (item, id) => buildRequestDetail(item, id)
      };
    `;
    return new Function('Date','Math','JSON','console', wrapper)(Date, Math, JSON, console);
  }
  ```
  > 注：`renderRequests` 可能引用其它辅助函数（如 `getPlayerVote`、`applyIcons`、`loadRequestImages` 等），沙箱须为其提供 no-op mock；实现 Task 1 红灯测试时按真实源码补齐 mock 列表，确保绿灯阶段能真实跑通渲染逻辑。
- [ ] 8. **行为测试 B.1–B.24**（全部在沙箱中真实执行，红色阶段因函数不存在而失败）：
  - [ ] B.1 沙箱初始化后 `api.expandedRequestId === null`（默认全收起）。
  - [ ] B.2 `api.toggle('X')` 后 `api.expandedRequestId === 'X'`，且 `api.grid` 含 `id="request-detail-X"` 且**不含**该区 `hidden`。
  - [ ] B.3 再 `api.toggle('X')` 后 `api.expandedRequestId === null`，且 `api.grid` 该区含 `hidden`。
  - [ ] B.4 `api.toggle('X')` 后 `api.toggle('Y')` 后 `api.expandedRequestId === 'Y'`，且 X 区含 `hidden`。
  - [ ] B.5 同时仅一张：`api.toggle('X'); api.toggle('Y')` 后，`api.grid` 中不含 `hidden` 的 `request-detail` 区恰好 1 个。
  - [ ] B.6 状态筛选清空：展开 `api.toggle('X')` 后真实执行 `api.reset()`，断言 `api.expandedRequestId === null`；并源码扫描 `requestTabs` 点击处理区（约 3966-3972 行）含 `resetExpandedRequest()` 调用（接线保证，作为真实执行机制的补充）。
  - [ ] B.7 分类筛选清空：同 B.6 机制，扫描 `requestCategoryFilters` 处理区（约 3973-3979 行）。
  - [ ] B.8 搜索变化清空：同 B.6 机制，扫描 `requestSearch` 监听区（约 3965 行）。
  - [ ] B.9 数据重载清空：同 B.6 机制，扫描 `renderAll()` 处理区（约 4064-4080 行）。
  - [ ] B.10 普通重绘保留：`api.toggle('X')` 展开后直接调用 `api.render()`（模拟投票后重绘），断言 `api.expandedRequestId` 仍为 `'X'` 且 X 区仍无 `hidden`。
  - [ ] B.11 `api.adminDetail({status:'done',adminReply:'已修复'},'done')` 返回 `{label:'完成说明',value:'已修复'}`。
  - [ ] B.12 `api.adminDetail({status:'pending',adminReply:'收到'},'pending')` 与 `planned` 返回 `{label:'管理员回复',value:'收到'}`。
  - [ ] B.13 `api.adminDetail({status:'rejected',rejectReason:'不符合'},'rejected')` 返回 `{label:'拒绝原因',value:'不符合'}`。
  - [ ] B.14 `api.adminDetail({status:'rejected',rejectReason:'',adminReply:'仍可参加'},'rejected')` 返回 `{label:'拒绝原因',value:'仍可参加'}`（回退真实 `adminReply`）。
  - [ ] B.15 全部空值场景均返回 `null`：`{status:'done',adminReply:''}`、`{status:'rejected',rejectReason:'',adminReply:''}`、`{status:'pending',adminReply:''}`。
  - [ ] B.16 `api.build({text:'内容',created_at:undefined,user:'A',category:'BUG',status:'pending'}, 'id1')` 输出**不含**「提交时间」行（无 `created_at`）。
  - [ ] B.17 `api.build({text:'内容',images:undefined},'id2')` 与 `images:[]` 均**不含**图片区（`request-detail-images`）。
  - [ ] B.18 无有效 ID 安全：seed 中某 item 使 `getRequestId` 返回空（注入缺 id 且无法生成的项），断言 `api.render()` 不抛错，且其它卡片正常出现在 `api.grid`。
  - [ ] B.19 `api.render()` 结果字符串中**不含** `undefined` 与 `null` 字面量。
  - [ ] B.20 转义：seed `text` 含 `<script>` 时，`api.grid` 中该内容被转义（出现 `&lt;script&gt;` 或不出现原始 `<script>` 标签）。
  - [ ] B.21 属性转义：`data-request-id` 与图片 `src` 经 `escapeAttr`（注入含 `"` 的 id 验证转义）。
  - [ ] B.22 渲染文案：`done` 项输出含「完成说明」；`pending` 项含「管理员回复」；`rejected` 项含「拒绝原因」。
  - [ ] B.23 管理员说明为 `null` 时 `api.build(...)` 输出不含「完成说明/拒绝原因/管理员回复」区块（对应 item 无说明）。
  - [ ] B.24 原有操作结构：`api.render()` 输出含 `data-action="vote-request"` 与「讨论」按钮。
- [ ] 9. 红灯阶段运行回归（不修改任何文件）：
  ```bash
  cd "C:\Users\Administrator\Desktop\SCUM用户网页"
  node scripts/test-request-detail.js --group=js
  node scripts/test-request-detail.js --group=css
  node scripts/test-request-detail.js --group=all
  echo "--- 回归 ---"
  node scripts/test-request-manage.js
  node scripts/test-home-structure.js
  node scripts/test-mobile-touch-targets.js
  node --check frontend/js/main.js
  ```

**Expected（红灯）：**
- `--group=js`：退出码**非零**。`getRequestAdminDetail` / `buildRequestDetail` / `resetExpandedRequest` / `toggleRequestDetail` 尚未实现，`extractFunction` 抛错导致 B 全失败；A.1–A.7 所需结构（`expandedRequestId` 声明、`data-action="toggle-request-detail"` 等）在 `main.js` 尚不存在，A 全失败。
- `--group=css`：退出码**非零**。`.request-detail` 等样式尚不存在，C 全失败。
- `--group=all`：退出码**非零**。
- 回归脚本全部通过：`test-request-manage.js` / `test-home-structure.js` / `test-mobile-touch-targets.js` 通过；`node --check frontend/js/main.js` 语法通过。
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
  - [ ] 4.1 在 `.map(({ item, index }) => {` 内部，用 `const requestId = getRequestId(item, index);` 取得稳定 ID。
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
- [ ] 7. 验证（见下方 Expected）：
  ```bash
  cd "C:\Users\Administrator\Desktop\SCUM用户网页"
  node --check frontend/js/main.js
  node scripts/test-request-detail.js --group=js
  node scripts/test-request-detail.js --group=css
  node scripts/test-request-detail.js --group=all
  node scripts/test-request-manage.js
  node scripts/test-home-structure.js
  node scripts/test-mobile-touch-targets.js
  ```

**Expected（验证结果，修正）：**
1. `node --check frontend/js/main.js` → 退出码 **0**，无语法错误。
2. `node scripts/test-request-detail.js --group=js` → **全部通过，退出码 0**（A 结构 + B 行为均转绿）。
3. `node scripts/test-request-detail.js --group=css` → **预期仍失败**（CSS 尚未实现），退出码非零。
4. `node scripts/test-request-detail.js --group=all` → **因 CSS 未实现，预期仍为非零**。
5. 原有建议/首页/触控回归测试（test-request-manage / test-home-structure / test-mobile-touch-targets）通过。
6. **只要 `--group=js` 仍失败，就不得提交 Task 2。**
7. **不得写“整个专项测试通过”** —— CSS 分组尚未通过，仅可宣告“JS 分组通过”。

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
- [ ] 6. 移动端（≤767px）：320/375/414 下 `.request-detail-value` 通过 `word-break` / `pre-wrap` 正常换行，`.request-detail-images` 用 `flex-wrap` 不溢出，`.vote-actions` 沿用现有 `flex-wrap`。
- [ ] 7. 横屏（`@media (max-height:450px) and (pointer:coarse)`）：`.request-detail-img` 固定 88px 不溢出；按钮高度由 `.mini-btn` 既有 44px 规则保证。
- [ ] 8. 桌面端不强制把所有 `.mini-btn` 放大到 44px，保持现有 `30px` 规格。
- [ ] 9. 验证（见下方 Expected）：
  ```bash
  cd "C:\Users\Administrator\Desktop\SCUM用户网页"
  node scripts/test-request-detail.js --group=js
  node scripts/test-request-detail.js --group=css
  node scripts/test-request-detail.js --group=all
  node scripts/test-request-manage.js
  node scripts/test-mobile-touch-targets.js
  node scripts/test-home-structure.js
  node --check frontend/js/main.js
  git diff --check
  ```

**Expected（验证结果，修正）：**
1. `--group=js`：**全部通过，退出码 0**。
2. `--group=css`：**全部通过，退出码 0**（C 结构全绿）。
3. `--group=all`：**全部通过，退出码 0**（JS + CSS 均绿）。
4. 三组退出码**均为 0**。
5. 原有回归测试（test-request-manage / test-mobile-touch-targets / test-home-structure）通过。
6. `git diff --check` 无新增空白错误。
7. **只有满足以上全部条件才允许提交 CSS。**

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

**不修改：** `erp14-server-showcase.html`、`frontend/`、`backend/`、测试源文件、`scripts/check-frontend-sync.js`。

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
  node scripts/test-request-detail.js --group=all
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
  21. 横屏触控按钮高度 ≥44px（真实测量矩形）。
  22. 桌面布局正常。
  23. 亮色主题可读。
  24. 暗色主题可读。
  25. 控制台 JavaScript 错误为 0。
  26. 页面异常错误（pageerror）为 0。
  27. 不出现 `undefined` / `null` 字样（真实渲染）。
  28. 生产页 SHA256 前后一致。
  29. `check-frontend-sync` 的差异准确归因为“生产页暂未同步”（见步骤 11）。
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
- [ ] 11. **运行同步检查并如实记录（修正后规则）**：
  ```bash
  node scripts/check-frontend-sync.js
  ```
  - 完整记录：通过数、预期提示数、真实失败数、退出码、每条失败名称、每条差异的具体文件和原因。
  - 若失败**仅由本功能造成**（如 `frontend/js/main.js` 比生产页新增详情逻辑、`frontend/css/main.css` 比生产页新增详情样式、生产页按边界暂未同步），则准确归因为：「`frontend/` 已新增玩家建议详情功能，生产页按本阶段边界暂未同步。」——该差异在本阶段**可接受，但必须如实保留非零退出码和真实失败数**，不得改为 0。
  - 若出现**与本功能无关的新失败**：Task 4 停止验收，不自行修改，报告总指挥。
  - **不得修改 `check-frontend-sync.js` 来迁就本功能；不得同步生产页来消除差异；不得把真实失败改名为“预期提示”来使统计归零。**
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
- `test-build-frontend-preview.js` 通过；所有专项/回归测试通过（`--group=all` 退出码 0）。
- 29 项浏览器断言全部通过；截图按要求生成（不提交）。
- 生产页 SHA256 前后一致。
- `check-frontend-sync.js` **真实失败数不为零（属预期差异）**，准确归因于「`frontend/` 已新增玩家建议详情功能，生产页按本阶段边界暂未同步」；不视为功能缺陷。

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
  - `scripts/test-request-detail.js` 说明（断言总数按实际填写；分组 `--group=js/css/all`）。
- [ ] 3. 在 `更新日志.md` 按“记录格式”新增一条，包含：
  - 功能范围（仅前台卡片内展开详情，不新增后端/API/弹窗/持久化）。
  - 真实字段限制（`created_at` 当前前台数据不存在，仅条件渲染预留）。
  - 空值不显示规则（管理员说明为空不渲染；`created_at` 缺失不渲染；`images` 空不渲染）。
  - 三种状态标题规则（`done`→完成说明、`rejected`→拒绝原因、`pending/planned`→管理员回复）。
  - 同时仅展开一张。
  - 筛选/搜索/数据重载清空 `expandedRequestId`。
  - 测试统计（按 Task 1 报告的实际断言总数与通过数填写，不得写虚假数量；分别列出 JS / CSS / ALL 分组结果）。
  - 浏览器验收视口（7 类）与结论（29 项断言全部通过；如未实际执行则不得声称通过）。
  - 截图未提交（`验收截图/玩家建议详情/`，不进 Git）。
  - 生产页未同步（SHA256 前后一致，但 `frontend/` 已领先）。
  - 未部署。
  - `check-frontend-sync` 预期差异的准确归因与**真实失败数**（frontend 已新增详情功能，生产页暂未同步；差异可接受但非零退出码如实保留）。
- [ ] 4. 不写虚假测试数量；不写未实际执行的浏览器结论；不记录 `created_at` 当前可见；不声称生产页已同步；不把真实同步失败改写为“预期提示”。
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

## 六、32 项设计测试要求分配表（按测试类型分类）

> 每项标明**测试类型**，不再宣称 Task 1 用静态断言一次性覆盖全部要求。浏览器验收（控制台/布局/真实触控矩形）明确不在 Task 1 静态通过；无有效 ID 不崩溃、展开互斥、筛选清空属于 JavaScript 行为测试；生产页同步边界属于 Task 4 构建/同步检查。

| 规格项 | 内容 | 测试类型 | 覆盖 Task |
| --- | --- | --- | --- |
| 1 | 查看详情按钮存在 | 结构静态测试(JS) | Task 1(A.2) / Task 4 |
| 2 | 按钮位于底部操作区最左 | 结构静态测试(JS) + 浏览器实际验收 | Task 1(A.2) / Task 4 |
| 3 | 默认不展开（hidden） | JavaScript 沙箱行为测试 | Task 1(B.2/B.3) / Task 4 |
| 4 | 点击展开（移除 hidden） | JavaScript 沙箱行为测试 | Task 1(B.2) / Task 4 |
| 5 | 文案变“收起详情” | JavaScript 沙箱行为测试 | Task 1(B.2/B.3) / Task 4 |
| 6 | aria-expanded false→true | JavaScript 沙箱行为测试 | Task 1(B.2) / Task 4 |
| 7 | aria-controls 关联 id | JavaScript 沙箱行为测试 | Task 1(B.2) / Task 4 |
| 8 | 再次点击收起 | JavaScript 沙箱行为测试 | Task 1(B.3) / Task 4 |
| 9 | 同时只展开一张 | JavaScript 沙箱行为测试 | Task 1(B.4/B.5) / Task 4 |
| 10 | 点击另一张前一张收起 | JavaScript 沙箱行为测试 | Task 1(B.4) / Task 4 |
| 11 | 状态筛选清空 | JavaScript 沙箱行为测试 | Task 1(B.6) / Task 4 |
| 12 | 分类筛选清空 | JavaScript 沙箱行为测试 | Task 1(B.7) / Task 4 |
| 13 | 搜索变化清空 | JavaScript 沙箱行为测试 | Task 1(B.8) / Task 4 |
| 14 | 普通重绘保留展开 | JavaScript 沙箱行为测试 | Task 1(B.10) / Task 4 |
| 15 | 重新筛选安全重置 | JavaScript 沙箱行为测试 | Task 1(B.6-B.9) / Task 4 |
| 16 | 完整内容转义显示 | JavaScript 沙箱行为测试 | Task 1(B.20) / Task 4 |
| 17 | created_at 仅当存在 | JavaScript 沙箱行为测试 | Task 1(B.16) / Task 4 |
| 18 | pending/planned 管理员回复 | JavaScript 沙箱行为测试 | Task 1(B.12/B.22) |
| 19 | done 完成说明 | JavaScript 沙箱行为测试 | Task 1(B.11/B.22) |
| 20 | rejected 拒绝原因 | JavaScript 沙箱行为测试 | Task 1(B.13/B.14/B.22) |
| 21 | 空管理员说明不渲染 | JavaScript 沙箱行为测试 | Task 1(B.15/B.23) |
| 22 | 不显示 undefined/null | JavaScript 沙箱行为测试 + 浏览器实际验收 | Task 1(B.19) / Task 4 |
| 23 | 图片为空不渲染 | JavaScript 沙箱行为测试 | Task 1(B.17) |
| 24 | 状态颜色复用现有类 | CSS 结构测试 | Task 1(C.1/C.3) / Task 4 |
| 25 | 原投票/讨论不回归 | 结构静态测试(JS) + 浏览器实际验收 | Task 1(B.24) / Task 4 |
| 26 | 320/375/414 无横向滚动 | 浏览器实际验收 | Task 4 |
| 27 | 横屏触控 ≥44px | 浏览器实际验收 | Task 4 |
| 28 | 查看详情按钮 ≥44px | CSS 结构测试 + 浏览器实际验收 | Task 1(C.4/C.5) / Task 4 |
| 29 | 亮/暗主题可读 | CSS 结构测试 + 浏览器实际验收 | Task 1(C.3) / Task 4 |
| 30 | 控制台无 JS 错误 | 浏览器实际验收 | Task 4 |
| 31 | 无有效 ID 不渲染且列表不崩 | JavaScript 沙箱行为测试 | Task 1(B.18) / Task 4 |
| 32 | 生产页暂未同步（归因） | 构建/同步检查 | Task 4(步骤 11) |

> 全部 32 项均映射到至少一种测试类型；行为类（3–23、31）以 Task 1 的 B 组**真实执行**覆盖，结构类（1/2/24/25/28/29）以 A/C 组静态检查覆盖，浏览器类（26/27/30 及交互可视化项）以 Task 4 实际验收覆盖，同步类（32）以 Task 4 构建/同步检查覆盖。Task 1 不再声称以静态断言覆盖全部 32 项。

---

## 七、计划自检（修正后）

1. **32 项测试要求是否全部按测试类型覆盖？** 是，见第六节分配表，每项均有明确测试类型（结构静态/JS 行为/CSS 结构/浏览器验收/构建同步），不再声称 Task 1 静态覆盖全部。
2. **管理员字段规则是否与规格一致？** 是，`getRequestAdminDetail` 中 `done→完成说明(adminReply)`、`rejected→拒绝原因(rejectReason 优先，回退 adminReply)`、`pending/planned→管理员回复(adminReply)`，空值返回 `null` 不渲染，与规格第 7 节一致。
3. **是否错误加入 created_at 数据来源改造？** 否。仅 `if (item.created_at)` 条件渲染，不新增字段、不改后端、不走 `/api/requests`。
4. **是否错误设计 index 降级？** 否。采用规格第 10.1 节“无有效 ID 时跳过按钮与详情区、列表不崩溃”，无 `index` 降级 key。
5. **是否错误要求同步生产页？** 否。全局约束第 3 条明确禁止改生产页；规格 32 / Task 4 明确“生产页暂未同步，check-frontend-sync 允许报差异并准确归因”。
6. **是否遗漏筛选、搜索、重载清空状态？** 否。Task 2 步骤 6.1-6.4 显式在四处调用 `resetExpandedRequest()`；Task 1 以 B.6-B.9 真实执行 + 接线扫描验证。
7. **是否遗漏普通重绘保留展开状态？** 否。Task 2 步骤 4 明确 `renderRequests()` 内部不写 `expandedRequestId = null`；Task 1 B.10 真实执行验证。
8. **是否遗漏无有效 ID 的安全处理？** 否。Task 2 步骤 4.3/4.5/4.6 在 `!requestId` 时返回空串；Task 1 B.18 真实执行验证不崩。
9. **文件路径、函数名、选择器是否前后一致？** 是。统一使用 `expandedRequestId`、`getRequestAdminDetail`、`buildRequestDetail`、`resetExpandedRequest`、`toggleRequestDetail`、`request-detail*` 选择器，全文一致。
10. **是否存在占位符或模糊指令？** 否。无 TBD/TODO/稍后实现/适当处理/类似 Task N/自行决定/视情况而定。所有步骤含具体代码骨架与命令。
11. **rg 错误文案清理（执行后核对）：** 计划正文（Task 描述、验证预期、分配表）不得出现以下错误要求的变体；核对时按语义搜索并确认已无对应内容：
    - 不得宣称 Task 1 用静态断言一次性覆盖全部 32 项要求（原错误：静态断言覆盖全部项）。
    - 不得要求同步检查的真实失败数归零（原错误：同步失败数为零）。
    - 不得写允许样式尚未实现却仍宣称验收通过的放宽表述（原错误：样式未实现仍可失败不影响逻辑）。
    - 不得写允许 JS 分组通过即算整体通过的模糊标准（原错误：仅 JS 通过即整体通过）。
12. **rg 正确规则核对（执行后核对，应存在）：**
    - `--group=js`、`--group=css`、`--group=all`
    - `JavaScript 行为测试`
    - `真实执行`
    - `退出码非零`
    - `记录真实失败数`
    - `生产页按本阶段边界暂未同步`
13. **git diff --check 结果：** 本计划文件为纯新增/改写，无尾随空白；Task 执行时各 Task 均要求 `git diff --check` 通过。

---

## 八、Git 边界（本计划文档自身）

只暂存并提交：
```
docs/superpowers/plans/2026-07-15-player-request-detail.md
```

提交信息：
```
docs: correct player request detail plan
```

不得暂存或提交其他文件（含 `备份/` 下的备份副本）。

---

## 九、完成报告（执行者填写，非本文件范围）

本文件仅含计划。实际执行后的 22 项完成报告由执行者在最终回复中提供（实际工作目录、备份路径、结构/行为/CSS 测试数量、浏览器验收数量、三种分组命令、Task 1/2/3 三组预期、check-frontend-sync 统计规则、确认不再要求同步检查的真实失败数归零、32 项分配表重分类、rg 错误文案清理、rg 正确规则核对、git diff --check、git diff 5eb6554 --stat、git diff --cached --name-only、新提交号、确认只提交计划、确认未改功能/测试/生产页/后端/数据库、矛盾缺口说明）。
