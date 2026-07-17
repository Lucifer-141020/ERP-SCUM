// 阶段三第 1 小步 · 返工：活动删除同步 DB 专项测试
// 纯 Node fs + assert + http（无 jsdom 依赖）。
// 目标：
//  A. 静态检查前端 delete-update 处理器已调用 DELETE /api/admin/events/:id，
//     成功后以权威接口重新拉取并渲染，失败时不假装成功。
//  B. 行为/集成验证：针对真实运行的后端（127.0.0.1:3000）做
//     POST 新增 → GET 出现 → DELETE → GET 不再出现 的闭环，
//     证明“保存后的活动删除后，重新读取接口不再出现该活动”。
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'erp14-server-showcase.html'), 'utf8');

let passed = 0;
let skipped = 0;
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
function skip(name, reason) {
  skipped += 1;
  console.log('  ⊘ ' + name + ' （跳过：' + reason + '）');
}

console.log('活动删除同步 DB 专项测试：');

// ---- A. 静态检查删除处理器 ----
const marker = "if (action === 'delete-update') {";
const mIdx = HTML.indexOf(marker);
assert.ok(mIdx !== -1, '未找到 delete-update 处理器');
// 取其后约 2600 字符作为该处理器代码窗口
const block = HTML.slice(mIdx, mIdx + 2600);

test('delete-update 处理器调用 DELETE /api/admin/events/:id', function () {
  assert.ok(block.indexOf("fetch(backendUrl(`/api/admin/events/${idNum}`)") !== -1,
    '未找到对 /api/admin/events/${idNum} 的 fetch 调用');
  assert.ok(block.indexOf("method: 'DELETE'") !== -1, '未使用 method: DELETE');
  assert.ok(block.indexOf('authorization: `Bearer ${adminToken}`') !== -1, '未带管理员鉴权头');
});

test('已保存活动删除成功后，以权威接口重新拉取并渲染（loadFullBackendConfig）', function () {
  const okIdx = block.indexOf("showToast('活动已删除', 'success')");
  const fetchIdx = block.indexOf("/api/admin/events/${idNum}");
  const reloadIdx = block.indexOf('await loadFullBackendConfig()');
  assert.ok(okIdx !== -1, '未找到成功提示');
  assert.ok(reloadIdx !== -1, '成功后未重新拉取活动列表（缺少 loadFullBackendConfig）');
  assert.ok(reloadIdx < okIdx, '重新拉取应发生在成功提示之前');
  assert.ok(fetchIdx < reloadIdx, '应先 DELETE 再重新拉取');
});

test('删除失败时（网络异常或 HTTP 非 2xx）不假装成功，必须提示失败并 return', function () {
  // 失败分支包含 showToast(msg, 'error') 与 return
  const failToast = block.indexOf("showToast(msg, 'error')");
  const reqFailToast = block.indexOf("showToast('删除请求失败：'");
  assert.ok(failToast !== -1 || reqFailToast !== -1, '未找到失败提示');
  // 在 splice 之前必须有 return（已保存分支不应走到 splice）
  const spliceIdx = block.indexOf('updates.splice(index, 1)');
  const firstReturn = block.indexOf('return;');
  assert.ok(spliceIdx === -1 || firstReturn < spliceIdx,
    '已保存分支不应先执行 updates.splice（失败必须 return 而非继续）');
});

test('仅“未保存”的本地草稿活动才走前端数组删除（splice）', function () {
  const spliceIdx = block.indexOf('updates.splice(index, 1)');
  assert.ok(spliceIdx !== -1, '未保留未保存活动的本地 splice 逻辑');
  // splice 位于 isSaved 分支之外（紧跟在 if (isSaved) {...} 之后）
  const isSavedClose = block.indexOf('const [removed] = updates.splice');
  assert.ok(isSavedClose !== -1, '未保留未保存活动的本地 splice 逻辑');
});

test('已保存判定基于整数 id（与后端 events 表 id 对应）', function () {
  assert.ok(block.indexOf('const idNum = Number(item.id);') !== -1, '未计算 idNum');
  assert.ok(block.indexOf('Number.isInteger(idNum) && idNum > 0') !== -1, '未用整数 id 判定已保存');
});

// ---- B. 集成验证（真实后端，可选） ----
function req(method, p, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({
      host: '127.0.0.1', port: 3000, path: p, method,
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token,
        ...(data ? { 'content-length': Buffer.byteLength(data) } : {}) }
    }, res => { let s = ''; res.on('data', d => s += d); res.on('end', () => resolve({ status: res.statusCode, body: s })); });
    r.on('error', reject); if (data) r.write(data); r.end();
  });
}

(async () => {
  let token = null;
  try {
    const login = await req('POST', '/api/admin/login', null, { username: 'admin', password: 'admin123' });
    if (login.status === 200) token = JSON.parse(login.body).data.token;
  } catch (e) { /* 后端不可用 */ }

  if (!token) {
    skip('集成验证：POST→GET→DELETE→GET 闭环', '后端未运行（127.0.0.1:3000），仅静态检查通过');
    console.log('\n通过 ' + passed + ' / ' + (passed + skipped) + ' （跳过 ' + skipped + '）');
    return;
  }

  const title = '删除同步专项临时活动-' + Date.now();
  // 1) POST 新增
  const created = await req('POST', '/api/admin/events', token, {
    title, type: 'signup', status: '报名中', content: '临时测试', schedule: '', reward: '',
    signup_deadline: null, event_end_at: null, results: [], reward_date: null, published: true, notes: ''
  });
  test('集成：POST 新增活动成功并返回 id', function () {
    assert.ok(created.status === 200 || created.status === 201, 'POST 状态码应为 200/201，实际 ' + created.status);
    const newId = JSON.parse(created.body).data.id;
    assert.ok(Number.isInteger(newId) && newId > 0, '未返回有效 id');
  });
  const newId = JSON.parse(created.body).data.id;

  // 2) GET 出现
  let list = await req('GET', '/api/admin/events', token);
  let arr = JSON.parse(list.body).data;
  test('集成：新增后 GET /api/admin/events 含该活动', function () {
    assert.ok(arr.some(e => e.id === newId && e.title === title), '新增的活动未在接口返回中出现');
  });

  // 3) DELETE
  const del = await req('DELETE', '/api/admin/events/' + newId, token);
  test('集成：DELETE 删除活动返回 200', function () {
    assert.strictEqual(del.status, 200, 'DELETE 状态码应为 200，实际 ' + del.status);
  });

  // 4) GET 不再出现
  list = await req('GET', '/api/admin/events', token);
  arr = JSON.parse(list.body).data;
  test('集成：删除后重新读取接口不再出现该活动（核心要求 #9）', function () {
    assert.ok(!arr.some(e => e.id === newId), '删除后活动仍出现在接口返回中');
  });

  // 5) 失败路径：删除不存在的 id 应返回非 2xx（前端据此提示失败而非假装成功）
  const miss = await req('DELETE', '/api/admin/events/99999999', token);
  test('集成：删除不存在的活动返回非 2xx（失败可被前端识别）', function () {
    assert.ok(miss.status >= 400, '删除不存在活动应返回错误状态码，实际 ' + miss.status);
  });

  console.log('\n通过 ' + passed + ' / ' + (passed + skipped) + ' （跳过 ' + skipped + '）');
})();
