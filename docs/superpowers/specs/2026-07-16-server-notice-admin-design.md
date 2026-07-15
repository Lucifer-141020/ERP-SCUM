# 服务器通知后台编辑设计规格

> 固定工作区：`C:\Users\Administrator\Desktop\SCUM用户网页`
> 阶段：Task 0 固化设计规格（仅文档，不写实施代码、不写测试）
> 关联方案：采用单条服务器通知配置，复用现有 config 保存链路

---

## 1. 背景

SCUM 游戏服务器官网前台右下角有一个常驻的「服务器通知」浮窗（`#noticeFloating`），用于向玩家传达维护、活动奖励、新手提醒、问题反馈等运营信息。目前这段通知是写死在 `frontend/index.html` 里的静态内容，管理员无法在后台修改，也无法开关、无法按行编辑、无法在改完内容后让已经关掉通知的玩家重新看到。

本规格只解决「管理员在后台编辑单条服务器通知，前台按列表展示，玩家本设备可折叠，管理员改完再次显示」这一明确目标。配置复用现有 `config` 表与现有公共/管理员配置接口，不新增数据库表、不新增接口、不使用生产页。

> 说明：本任务要求完整读取「Task 0 审计报告」，但当前工作区内不存在同名文件（现有 `docs/superpowers/specs/` 下的其他规格引用的是另一功能的「Task 1 现状审计」）。因此本规格的「当前真实结构」与「当前问题」均直接依据真实源码（`frontend/index.html`、`frontend/js/main.js`、`frontend/css/main.css`、`backend/server.js`、`backend/db/schema.sql`）编写，不引用任何不存在的审计报告。

---

## 2. 当前真实结构

### 2.1 前台通知 DOM（`frontend/index.html:258-278`）

```html
<div class="notice-floating" id="noticeFloating" aria-label="服务器通知">
  <button class="notice-floating-bubble" id="noticeBubble" type="button" aria-label="展开服务器通知" title="查看服务器通知">
    <span data-icon="bell"></span>
    <span class="notice-bubble-dot" aria-hidden="true"></span>
  </button>
  <div class="notice-floating-panel card" id="noticePanel">
    <div class="notice-floating-head">
      <strong>服务器通知</strong>
      <button class="notice-floating-close" id="noticeClose" type="button" aria-label="收起通知">×</button>
    </div>
    <div class="server-notice-card">
      <strong>服务器稳定开放 · 活动奖励按名单发放</strong>
      <ul class="server-notice-lines">
        <li><b>维护公告</b><span>当前赛季长期运营，维护和重启会提前在群内与网站同步通知。</span></li>
        <li><b>活动奖励</b><span>活动结束后按报名名单和实际参与情况统计，管理员统一发放奖励。</span></li>
        <li><b>新手提醒</b><span>入服前建议先查看服务器注意事项，避免误会和违规。</span></li>
        <li><b>问题反馈</b><span>BUG、规则建议和优化想法统一提交到玩家建议页，方便后台跟进。</span></li>
      </ul>
    </div>
  </div>
</div>
```

硬编码的 4 条内容（即「默认内容」的来源）：

1. 维护公告：当前赛季长期运营，维护和重启会提前在群内与网站同步通知。
2. 活动奖励：活动结束后按报名名单和实际参与情况统计，管理员统一发放奖励。
3. 新手提醒：入服前建议先查看服务器注意事项，避免误会和违规。
4. 问题反馈：BUG、规则建议和优化想法统一提交到玩家建议页，方便后台跟进。

### 2.2 前台交互（`frontend/js/main.js:3976` `setupNoticeFloating`）

- 使用旧布尔键 `erp14-notice-collapsed`：localStorage 存 `'1'` 表示折叠。
- 关闭按钮点击 → 加 `.collapsed` 类 + 写 `erp14-notice-collapsed='1'`。
- 气泡点击 → 移除 `.collapsed` 类 + 删 `erp14-notice-collapsed`。
- 折叠态由 CSS `.notice-floating.collapsed .notice-floating-panel { display:none }` 控制。

### 2.3 后台「首页内容」面板

- 导航入口：`frontend/index.html:216` 的 `data-panel="homeManage"`。
- 模板：`frontend/js/main.js:361` `homeManage: () => \`...\``，内含「首页主视觉 / 服务器注意事项 / 首页特色 / 首页数据卡」四个 `.card.pad` 区块。
- 保存绑定：`frontend/js/main.js:3913` 为 `saveHomeHero` / `saveHomeRules` / `saveHomeFeatures` / `saveHomeStats` 绑定点击事件。

### 2.4 配置加载链路（`frontend/js/main.js`）

- `applyPublicBackendConfig(config)`（:1662）：从 `config` 对象合并各模块；是未登录访客与登录管理员共用的唯一合并入口。
- `applyFullBackendConfig(config)`（:1706）：先调用 `applyPublicBackendConfig`，再合并敏感字段。
- `loadPublicBackendConfig()`（:1724）：访客并行拉取 `/api/config` 等，最终调用 `applyPublicBackendConfig(merged)`。
- `loadFullBackendConfig()`（:1956）：管理员登录后拉取 `/api/admin/config`，调用 `applyFullBackendConfig`。
- `saveBackendData()`（:979）：基于 `FIELD_MAP` 把 `serverInfo` 逐字段 `PUT /api/admin/config`，**不含** `server_notice`。

### 2.5 后端配置接口（`backend/server.js`）

- `ALLOWED_CONFIG_KEYS`（:865）：白名单，含 `site_title` 等 10 个键，**不包含** `server_notice`。
- `GET /api/config`（:656）：返回 `config` 表中除 `player_sessions`、`request_votes` 外的所有键；值按 `{value:...}` 兼容解析后直接作为 `config[key]`。新增 `server_notice` 后会自动出现在此接口。
- `GET /api/admin/config`（:871）：返回 `config` 表全部键；同样按 `{value:...}` 解析。新增 `server_notice` 后会自动出现。
- `PUT /api/admin/config`（:889）：校验 `key` 必须在 `ALLOWED_CONFIG_KEYS`，否则 400；通过则 `INSERT OR REPLACE` 存储，值原样存为 `{value: value}`。后端不解析通知内部结构。

### 2.6 数据库（`backend/db/schema.sql:27`）

`config` 表为 `key TEXT PRIMARY KEY, value TEXT, updated_at DATETIME`，以 JSON 存储任意配置值。新增 `server_notice` 仅需插入一条 `key` 记录，**不需要**改表结构、不需要迁移脚本。

### 2.7 转义工具（`frontend/js/main.js:770` `escapeHtml`、`frontend/js/main.js:780` `escapeAttr`）

两个函数均已存在，供动态内容安全渲染复用。

---

## 3. 当前问题

| 问题 | 现状 | 影响 |
| --- | --- | --- |
| 通知不可编辑 | 标题与 4 行内容写死在 `index.html` | 管理员改通知必须动源码，无法在后台完成 |
| 无法开关 | 没有 enabled 字段 | 临时不想展示通知时只能改代码 |
| 无法按行编辑 | 静态 `<li>` 含 `<b>标签</b><span>内容</span>` | 后台不能「一行一条」地维护 |
| 关闭后永不出现 | 旧键 `erp14-notice-collapsed` 与版本无关 | 管理员改完内容，已关闭的玩家仍看不到更新 |
| 无版本概念 | 没有 version | 无法判断「玩家关闭的是哪一版」 |
| 公共配置未覆盖默认 | 后端无 `server_notice` | 前端只能显示硬编码 4 行 |

---

## 4. 目标

1. 在后台「首页内容管理」增加「服务器通知」编辑区。
2. 支持启用/关闭通知（enabled 开关）。
3. 支持编辑通知标题（title）。
4. 支持多行通知内容（textarea 一行一条）。
5. 前台继续以列表形式展示。
6. 至少存在一条非空内容时才显示通知面板。
7. 玩家关闭后，本设备保持折叠。
8. 管理员修改并保存后生成新版本；新版本发布后，关闭过旧版本的玩家会重新看到通知。
9. version 由保存逻辑自动生成，管理员不可手填。
10. 动态标题与内容必须安全转义。
11. 复用现有 `config` 表、公共配置接口、管理员配置接口。

---

## 5. 非目标

以下明确**不**在本次范围内：

- 新增数据库表或数据库列。
- 新增任何后端路由或配置接口。
- 修改 `erp14-server-showcase.html` 生产页（本阶段）。
- 修改 `backend/db/schema.sql`。
- 跳转按钮或外部链接、富文本编辑。
- 多通知列表管理、复杂通知历史。
- 按时间自动发布、阅读统计或已读计数、账号级状态。
- 跨设备同步关闭状态。
- 国际化、大规模重构、复杂权限管理。

---

## 6. 已确认产品决定

1. 管理后台「首页内容管理」增加「服务器通知」编辑区。
2. 支持启用/关闭通知。
3. 支持编辑通知标题。
4. 支持多行通知内容。
5. 后台 textarea 每一行代表一条通知。
6. 前台继续显示为列表。
7. 空行保存时自动过滤。
8. 至少存在一条非空内容时才显示通知面板。
9. 暂不增加跳转按钮或外部链接。
10. 只允许一个服务器通知面板。
11. 玩家关闭后，本设备保持折叠。
12. 管理员修改并保存后生成新版本。
13. 新版本发布后，关闭过旧版本的玩家会重新看到通知。
14. version 由保存逻辑自动生成，不允许管理员手动填写。
15. 动态标题和内容必须安全转义。
16. 复用现有 config 表、公共配置接口和管理员配置接口。
17. 新配置键为 `server_notice`。
18. 不新增数据库表。
19. 不需要数据库迁移。
20. 不修改 `backend/db/schema.sql`。
21. 功能阶段只修改 `frontend/` 拆分源码、`backend/server.js` 和新增专项测试。
22. 生产页 `erp14-server-showcase.html` 暂不同步。
23. 不增加复杂通知历史、多通知列表、按时间自动发布、阅读统计或账号级状态。

---

## 7. 配置数据结构

新配置键：`server_notice`（存于 `config` 表，值经后端 `{value: ...}` 包装后存储）。

等价固化形式：

```json
{
  "enabled": true,
  "title": "服务器通知",
  "lines": [
    "通知内容一",
    "通知内容二"
  ],
  "version": "自动生成的版本标识"
}
```

### 字段规则

**enabled**

- 布尔值。
- `false` 时整个 `#noticeFloating` 隐藏。
- 缺失时兼容当前页面，默认 `true`。

**title**

- 字符串。
- 保存与使用前 `trim`。
- 空值回退「服务器通知」。
- 前台必须 `escapeHtml` 后渲染。

**lines**

- 字符串数组。
- 后台 textarea 按换行拆分。
- 每项 `trim`。
- 过滤空行（空字符串、纯空白行）。
- 非数组时安全回退默认内容或 `[]`。
- 每项前台必须 `escapeHtml`。
- 不允许把管理员输入作为 `innerHTML` 原样执行。

**version**

- 字符串。
- 每次管理员成功保存通知时由保存逻辑自动生成。
- 管理员界面不显示、不允许手工编辑。
- 可使用时间戳字符串或等价唯一版本标识（如 `String(Date.now())`）。
- 只有后端保存成功后才更新前端本地状态。
- 普通页面加载不得每次生成新版本。

---

## 8. 默认值与兼容规则

- 当前 `frontend/index.html` 中硬编码的 4 条通知作为前端默认值（见 §2.1）。
- 后端没有 `server_notice` 时，前台保持现有通知效果（即展示硬编码 4 行，标题「服务器通知」）。
- 后端返回合法 `server_notice` 后，动态配置覆盖默认值。
- `enabled=false` 时隐藏整个通知区域。
- `lines` 过滤后为空时隐藏整个通知区域。
- 后端异常（接口失败、解析失败、字段非法）时使用前端默认内容，不让页面报错、不白屏。
- 默认内容的 `lines` 使用硬编码的 4 条描述文本；`title` 为「服务器通知」；`enabled` 为 `true`；`version` 为空字符串（无版本，走旧键兼容，见 §13）。

---

## 9. 后台编辑交互

位置：`homeManage` 首页内容管理面板内，新增独立 `.card.pad` 区块「服务器通知」。

字段：

1. **启用服务器通知** — `checkbox`，`id="editNoticeEnabled"`。
2. **通知标题** — `text` 输入，`id="editNoticeTitle"`。
3. **通知内容** — `textarea`，`id="editNoticeLines"`，一行一条。
4. **保存服务器通知** — `button`，`id="saveServerNotice"`，`type="button"`。
5. **保存状态提示** — 稳定 `id="saveNoticeHint"`，用于成功/失败/进行中提示。

要求：

- textarea 一行一条，保存前过滤空行。
- 保存时自动生成 `version`。
- 使用真实等价保存链路：`fetch(backendUrl('/api/admin/config'), { method:'PUT', headers:{authorization, 'content-type':'application/json'}, body: JSON.stringify({ key:'server_notice', value }) })`。
- 保存成功后更新内存配置（`serverNotice`）并重新渲染通知（`renderServerNotice()`）。
- 保存失败时保留表单内容，不清除、不重置。
- 保存失败不得生成「已保存」假提示。
- 防止重复点击造成并发保存（保存中禁用按钮或加锁标志）。
- 不新增独立通知 API。
- 不新增数据库表。
- `label` 与 `input`/`textarea` 通过 `for`/`id` 关联；`checkbox` 可键盘操作；禁止只用 `placeholder` 代替 `label`。

---

## 10. 保存流程

1. 管理员在 `homeManage` 的「服务器通知」区块填写表单。
2. 点击 `saveServerNotice`：
   - 若处于保存中（锁标志为真），直接返回，忽略重复点击。
   - 读取 `editNoticeEnabled.checked` → `enabled`（布尔）。
   - 读取 `editNoticeTitle.value.trim()` → `title`（空则回退「服务器通知」）。
   - 读取 `editNoticeLines.value`，按 `\n` 拆分，逐项 `trim`，过滤空行 → `lines`（数组）。
   - 生成 `version = String(Date.now())`。
   - 组装 `value = { enabled, title, lines, version }`。
3. `PUT /api/admin/config`，`key:'server_notice'`，`value`。
4. **成功（2xx）**：
   - `serverNotice = normalizeServerNotice(value)`（与后端返回值一致，避免依赖回显）。
   - 重新 `renderServerNotice()`。
   - 在 `saveNoticeHint` 显示成功提示。
   - 解锁保存标志。
5. **失败（非 2xx / 网络异常 / 401）**：
   - 保留表单原内容，**不**更新内存 `serverNotice`、不生成版本。
   - 在 `saveNoticeHint` 显示失败原因（不含敏感信息）。
   - 解锁保存标志。
   - 若 401，走现有登出/重登录流程。

`version` 只在第 4 步成功后计入内存状态；普通加载、渲染、折叠操作均不生成新版本。

---

## 11. 公共加载流程

1. 访客 `loadPublicBackendConfig()` → `applyPublicBackendConfig(merged)`。
2. 管理员 `loadFullBackendConfig()` → `applyFullBackendConfig(configPayload)` → 内部调用 `applyPublicBackendConfig`。
3. 在 `applyPublicBackendConfig` 中新增（现有函数扩展）：

   ```js
   if (config.server_notice) {
     serverNotice = normalizeServerNotice(config.server_notice);
   }
   ```

4. 之后调用 `renderServerNotice()` 按当前 `serverNotice` 渲染前台面板。
5. 后端无 `server_notice` 时，`serverNotice` 保持前端默认值（见 §8），前台展示硬编码效果。
6. 后端异常时 `loadPublicBackendConfig` 的 `catch` 已吞掉错误，继续用默认内容渲染，页面不崩溃。

---

## 12. 前台渲染规则

`renderServerNotice()`（新增）职责：

1. 读取内存 `serverNotice`（已 `normalizeServerNotice`）。
2. 若 `enabled === false` → 给 `#noticeFloating` 加 `hidden` 属性（或等价 `.notice-hidden` 类），直接返回。
3. 若 `lines` 过滤后为空数组 → 同样隐藏 `#noticeFloating`，返回。
4. 否则：
   - `#noticeTitle`（动态标题节点）`textContent = title`（经 `escapeHtml` 后写入，禁止 `innerHTML`）。
   - `#noticeLines`（动态列表节点）清空后，对每条 `line` 创建 `<li>`，文本经 `escapeHtml` 后写入 `textContent`。
   - 依据版本化关闭状态（见 §13）决定初始折叠/展开。
5. 气泡 `#noticeBubble` 保留 `aria-expanded`，与 `#noticePanel` 通过 `aria-controls` 关联。

---

## 13. 本设备关闭状态

不得继续只使用旧布尔值 `erp14-notice-collapsed` 判断所有版本。

推荐方案（本规格采用）：

- localStorage 键：`erp14-notice-dismissed-version`
- 值：玩家最后关闭的通知 `version`（字符串）。

显示规则：

- `enabled === false` → 隐藏。
- `lines` 为空 → 隐藏。
- `dismissedVersion === currentVersion` → 默认折叠（加 `.collapsed`）。
- `dismissedVersion !== currentVersion` → 默认展开（不加 `.collapsed`）。
- 玩家点击关闭 → 写 `erp14-notice-dismissed-version = currentVersion`。
- 玩家点击气泡重新展开 → **删除** `erp14-notice-dismissed-version` 记录，使刷新后通知仍保持展开，直到玩家再次关闭。

### 旧键兼容（`erp14-notice-collapsed`）

- 若新通知没有有效 `version`（缺失或空字符串），继续读取旧键 `erp14-notice-collapsed` 保持现有行为（`'1'` = 折叠）。
- 若存在有效 `version`，以 `erp14-notice-dismissed-version` 为准。
- 不要求一次性删除旧键。
- 新逻辑不得因 localStorage 不可用而报错（所有读写包 `try/catch`）。

---

## 14. 新版本重新显示规则

- 管理员保存成功 → `version` 变为新时间戳（见 §10）。
- 玩家本设备 `erp14-notice-dismissed-version` 存的是旧 `version`。
- 下次加载：`dismissedVersion（旧） !== currentVersion（新）` → 默认展开。
- 因此关闭过旧版本的玩家会重新看到新版通知。
- 玩家再次点击关闭 → 写入新 `version`，之后保持折叠直到下一版。
- 点击气泡展开后删除关闭记录，刷新仍展开（§13）。

---

## 15. 内容安全与转义

- `title` 使用 `escapeHtml` 后写入 `textContent`（或先 `escapeHtml` 再赋值，禁止 `innerHTML` 直接拼原值）。
- `lines` 每一项使用 `escapeHtml` 后写入 `textContent`。
- 禁止直接拼接未经转义的管理员输入到 `innerHTML`。
- 链接和富文本不在本阶段范围。
- `version` 不作为 HTML 执行（仅用于 localStorage 比较，不插入 DOM）。
- localStorage 读写必须 `try/catch`。
- 不记录或输出敏感配置（如管理员令牌、接口密钥）。

---

## 16. 空值和异常处理

- `enabled` 缺失/非布尔 → 默认 `true`（兼容现有页面）。
- `title` 缺失/空白 → 默认「服务器通知」。
- `lines` 缺失/非数组 → 安全回退默认 4 行或 `[]`；若回退为 `[]` 且是动态配置，则隐藏面板（见 §12）。
- `version` 缺失 → 空字符串，走旧键兼容（§13）。
- 后端无 `server_notice` → 用前端默认内容（§8）。
- 后端返回结构非法（如 `lines` 不是数组、嵌套错误）→ `normalizeServerNotice` 兜底，不抛错。
- 接口失败 / 解析失败 → 不白屏，继续使用默认内容。
- localStorage 不可用（隐私模式、配额满）→ `try/catch` 吞错，通知仍按默认展开渲染，仅关闭状态不持久。

---

## 17. 函数职责

| 函数 | 状态 | 职责 |
| --- | --- | --- |
| `normalizeServerNotice(value)` | 计划新增 | 将任意后端值规范化为 `{enabled,title,lines,version}`；处理 enabled 类型回退、title trim 与默认值、lines trim 与过滤空行、非数组安全回退、version 规范化。 |
| `renderServerNotice()` | 计划新增 | 按当前 `serverNotice` 渲染前台面板：标题、列表、隐藏/折叠判定、aria 状态。 |
| `populateServerNoticeForm()` | 计划新增 | 把当前 `serverNotice` 填入后台表单（checkbox / title / lines textarea）。 |
| `saveServerNotice()` | 计划新增 | 读表单 → 生成 version → `PUT /api/admin/config` → 成功后更新内存与本地、重渲染；失败保留表单、提示错误、防重复点击。 |
| `setupNoticeFloating()` | 现有函数扩展 | 改为基于 `serverNotice` 状态 + 版本化关闭逻辑；保留事件绑定；旧键兼容（§13）。 |
| `applyPublicBackendConfig(config)` | 现有函数扩展 | 新增 `if (config.server_notice) serverNotice = normalizeServerNotice(config.server_notice)`，并调用 `renderServerNotice()`。 |
| `applyFullBackendConfig(config)` | 现有函数扩展 | 已调用 `applyPublicBackendConfig`，自动继承上述改动。 |
| `loadPublicBackendConfig()` | 现有函数扩展 | 已调用 `applyPublicBackendConfig`，自动继承。 |
| `loadFullBackendConfig()` | 现有函数扩展 | 已调用 `applyFullBackendConfig`，自动继承。 |
| `saveBackendData()` | 不改动 | `server_notice` 走独立 `saveServerNotice()`，不进 `FIELD_MAP`。 |

> 说明：`normalizeServerNotice`、`renderServerNotice`、`populateServerNoticeForm`、`saveServerNotice` 为计划新增；`setupNoticeFloating` 与四个 config 加载/合并函数为现有扩展，不假设它们当前已实现新逻辑。

---

## 18. DOM 与可访问性设计

### 前台（修改 `frontend/index.html` 通知区）

- 保留 `#noticeFloating`、`#noticeBubble`、`#noticePanel`、`#noticeClose`。
- 为动态标题增加稳定 `id="noticeTitle"`（加在现有 `<strong>` 上）。
- 为动态列表增加稳定 `id="noticeLines"`（加在现有 `<ul class="server-notice-lines">` 上）。
- `enabled=false` 时使用 `hidden` 属性或等价 `.notice-hidden` 类完全隐藏 `#noticeFloating`。
- 气泡按钮 `#noticeBubble` 保留 `aria-expanded`（折叠 `false` / 展开 `true`）。
- 面板 `#noticePanel` 与按钮 `#noticeBubble` 通过 `aria-controls` 互相关联。
- 关闭按钮 `#noticeClose` 具有明确 `aria-label`（如「收起通知」）。

### 后台（在 `homeManage` 模板新增区块）

- `label` 与 `input`/`textarea` 通过 `for`/`id` 关联。
- `checkbox` `#editNoticeEnabled` 可键盘操作（原生 checkbox 已支持）。
- 保存按钮 `id="saveServerNotice"` `type="button"`。
- 保存状态提示使用稳定 `id="saveNoticeHint"`。
- 禁止只用 `placeholder` 代替 `label`。

---

## 19. CSS 与移动端边界

- 复用现有 `.notice-floating` / `.notice-floating-panel` / `.notice-floating-bubble` / `.server-notice-lines` 等样式（`frontend/css/main.css:954` 起）。
- 新增 `.notice-hidden { display:none !important; }`（或统一用 `[hidden]`），用于 `enabled=false` / 空 `lines` 时整体隐藏。
- 现有 `.collapsed` 折叠机制保留，仅初始折叠判定改为版本化逻辑（§13）。
- 移动端（`max-width:680px`）已有 `position:static`、气泡隐藏、面板常显规则；版本化关闭逻辑在此断点同样生效（关闭仍写版本，刷新保持）。
- 后台表单复用 `.card.pad` / `label` / `textarea` / `.btn-primary` / `.submit-hint` 现有样式，不得在 320px 视口下溢出或遮挡保存按钮。
- 暗色模式沿用现有 `[data-theme="dark"]` 覆盖，无需新增配色。

---

## 20. 后端配置白名单

- `backend/server.js:865` 的 `ALLOWED_CONFIG_KEYS` 增加 `'server_notice'`。
- `GET /api/config`（:656）应通过现有配置机制返回 `server_notice`（无需改逻辑，自动包含）。
- `GET /api/admin/config`（:871）应返回 `server_notice`（无需改逻辑，自动包含）。
- `PUT /api/admin/config`（:889）允许保存 `server_notice`（仅靠白名单放行；值原样存储为 `{value: ...}`）。
- 后端不需要理解通知字段内部业务逻辑，只保存 JSON value。
- 不修改 `schema.sql`。
- 不新增路由。
- 不新增数据库列或表。

---

## 21. 文件修改边界

### 功能阶段允许修改

- `frontend/index.html`（通知区加 `id`、后台 `homeManage` 加「服务器通知」区块）
- `frontend/js/main.js`（新增 `normalizeServerNotice` / `renderServerNotice` / `populateServerNoticeForm` / `saveServerNotice`；扩展 `setupNoticeFloating` / `applyPublicBackendConfig` 等）
- `frontend/css/main.css`（新增 `.notice-hidden` 等少量样式）
- `backend/server.js`（仅 `ALLOWED_CONFIG_KEYS` 增加 `'server_notice'`）
- 新增服务器通知专项测试（如 `scripts/test-server-notice.js`）

### 最终文档阶段才允许

- `代码地图.md`
- `更新日志.md`

### 明确禁止

- `backend/db/schema.sql`
- `erp14-server-showcase.html`
- 新建数据表、新增数据库列
- 新 API、新路由
- 多通知历史、多通知列表管理
- 按时间自动发布、阅读统计或已读计数
- 玩家账号关联、跨设备状态
- 富文本、跳转按钮或外部链接
- 生产部署

---

## 22. 测试要求

测试必须分类，禁止全靠字符串匹配冒充行为验证。

### A. 结构测试（静态 DOM / 模板）

- 后台表单字段存在：`#editNoticeEnabled` / `#editNoticeTitle` / `#editNoticeLines` / `#saveServerNotice` / `#saveNoticeHint`。
- 前台动态标题节点 `#noticeTitle` 存在。
- 前台动态列表节点 `#noticeLines` 存在。
- `aria-controls` 关联存在（气泡 ↔ 面板）。
- `aria-expanded` 存在于气泡按钮。
- `label` 的 `for` 与 `input`/`textarea` 的 `id` 一一对应。

### B. JavaScript 沙箱行为测试（真实执行函数）

- `normalizeServerNotice` 合法数据（enabled/title/lines/version 原样保留）。
- `enabled` 类型回退（缺失/非布尔 → `true`）。
- `title` trim 与默认值（空白 → 「服务器通知」）。
- `lines` trim 和过滤空行。
- `lines` 非数组安全回退（对象/字符串/undefined → 默认或 `[]`）。
- `version` 规范化（缺失 → 空字符串）。
- 动态标题与列表转义（`escapeHtml` 后无注入）。
- `enabled=false` 隐藏。
- 空 `lines` 隐藏。
- 同版本关闭后默认折叠。
- 新版本重新展开。
- 点击关闭保存当前版本。
- 点击气泡删除关闭记录。
- localStorage 异常不崩溃。
- 后端无配置时使用当前默认内容。
- 保存成功才更新版本。
- 保存失败保留表单内容。
- 重复点击保护。

### C. 后端接口测试（真实启动或 mock 服务端）

- `ALLOWED_CONFIG_KEYS` 包含 `server_notice`。
- `PUT` 可保存 `server_notice`。
- `GET /api/config`（公共）可读取 `server_notice`。
- `GET /api/admin/config` 可读取 `server_notice`。
- 非白名单键仍被拒绝（400）。
- 不修改 `schema.sql`（grep 校验）。

### D. CSS 与浏览器验收（人工/浏览器，非字符串匹配）

见 §23。

> 静态结构测试不能冒充行为测试；localStorage 版本行为必须真实执行；保存成功和失败必须通过异步沙箱或真实接口验证；浏览器矩形、触控尺寸和溢出只能由浏览器验收。

---

## 23. 浏览器验收标准

视口（横屏以「宽×高」表示，coarse 为粗指针/触控）：

- 320×800
- 375×812
- 414×896
- 667×375 coarse
- 812×375 coarse
- 896×414 coarse
- 1440×900

主题：

- 亮色
- 暗色

交互与状态：

- 后台表单在 320px 不溢出、保存按钮可点。
- 通知面板在最小视口不溢出。
- 保存交互真实成功与失败均验证（成功刷新后出现新内容、失败保留表单且无误提示）。
- 新版本重新显示验证（关闭旧版 → 管理员保存新版 → 刷新重新展开）。
- `console.error` 计数为 0。
- `pageerror` 计数为 0。

---

## 24. 已知限制

- 关闭状态仅本设备（localStorage）生效，不跨设备、不跨浏览器。
- `version` 为前端生成的时间戳字符串，后端仅原样存储，不做语义校验。
- 公共 `/api/config` 会一并返回 `version` 字符串（仅作不透明标识，不含敏感信息），属预期。
- 旧键 `erp14-notice-collapsed` 不强制删除，仅在无有效 `version` 时作为兼容回退。
- 后台编辑不校验每行最大长度（遵循「简洁优先」，不做过度防御）。
- 生产页 `erp14-server-showcase.html` 本阶段不同步，前台拆分源码与生产的累计差异会在 `check-frontend-sync` 中体现（见 §25）。

---

## 25. 生产页同步边界

- 本阶段（Task 0 固化设计规格）只产出本规格文档，不修改 `erp14-server-showcase.html`。
- 功能阶段会先改 `frontend/` 拆分源码与 `backend/server.js`，再单独决定是否同步生产页。
- 在生产页未同步前，`check-frontend-sync` 会因拆分源码新增的 `server_notice` 相关节点/逻辑而显示非零差异，属于预期累计差异。
- 该累计差异必须如实记录：记录脚本退出码与真实失败数，不得把差异强行抹为零。
- 生产页同步属于独立的高风险操作，需单独确认后再执行，不在本规格范围内。

---

> 自检结论（提交前逐项核对）：
> 1. 全文不包含任何占位符或未决措辞（无待定标记、无后续待办类表述）。
> 2. 未虚构真实字段或路由（`server_notice` 为新增键、`/api/config` 与 `/api/admin/config` 为既有接口）。
> 3. 不要求修改 `schema.sql`。
> 4. 不要求新建 API。
> 5. 不包含跳转按钮或外部链接。
> 6. 不包含多通知列表管理。
> 7. 清楚区分默认内容（硬编码 4 行）与后端配置（`server_notice`）。
> 8. 清楚区分旧 `erp14-notice-collapsed` 键与新 `erp14-notice-dismissed-version` 键。
> 9. 明确 `version` 只在保存时生成。
> 10. 明确管理员修改后玩家重新看到。
> 11. 明确内容安全转义（`escapeHtml`）。
> 12. 测试分类真实可执行（A 结构 / B 沙箱行为 / C 后端 / D 浏览器）。
> 13. 生产页同步边界准确（未同步导致 `check-frontend-sync` 非零属于预期累计差异，但必须如实记录退出码和真实失败数）。
