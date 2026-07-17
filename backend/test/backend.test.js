const assert = require('node:assert/strict');
const { after, test } = require('node:test');
const { once } = require('node:events');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const rootDir = path.join(os.tmpdir(), `scum-backend-${Date.now()}-${Math.random().toString(36).slice(2)}`);
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'test-password';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ERP14_DB_PATH = path.join(rootDir, 'data', 'erp14.db');
process.env.ERP14_UPLOADS_DIR = path.join(rootDir, 'uploads');

const { app, waitForDb } = require('../server');

after(async () => {
  await fs.rm(rootDir, { recursive: true, force: true });
});

async function startTestServer() {
  await waitForDb();
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close() {
      server.close();
      await once(server, 'close');
    }
  };
}

async function readJson(response) {
  return response.json();
}

async function login(baseUrl) {
  const response = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'test-password' })
  });
  const body = await readJson(response);
  assert.equal(response.status, 200);
  assert.equal(body.code, 200);
  assert.ok(body.data.token);
  return body.data.token;
}

test('admin can login with configured credentials', async () => {
  const server = await startTestServer();
  try {
    await login(server.baseUrl);
  } finally {
    await server.close();
  }
});

test('admin config endpoint rejects missing token', async () => {
  const server = await startTestServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/admin/config`);
    const body = await readJson(response);

    assert.equal(response.status, 401);
    assert.equal(body.code, 401);
  } finally {
    await server.close();
  }
});

test('admin can update allowed config and public config can read it', async () => {
  const server = await startTestServer();
  try {
    const token = await login(server.baseUrl);
    const saveResponse = await fetch(`${server.baseUrl}/api/admin/config`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ key: 'site_title', value: 'ERP14 SCUM 测试服' })
    });
    const saveBody = await readJson(saveResponse);

    assert.equal(saveResponse.status, 200);
    assert.equal(saveBody.code, 200);

    const readResponse = await fetch(`${server.baseUrl}/api/config`);
    const readBody = await readJson(readResponse);

    assert.equal(readResponse.status, 200);
    assert.equal(readBody.data.site_title, 'ERP14 SCUM 测试服');
  } finally {
    await server.close();
  }
});

test('authenticated image upload can be opened from uploads url', async () => {
  const server = await startTestServer();
  const boundary = '----scum-test-boundary';
  const imageBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
  const uploadBody = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="file"; filename="banner.png"\r\n'),
    Buffer.from('Content-Type: image/png\r\n\r\n'),
    imageBytes,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  try {
    const token = await login(server.baseUrl);
    const response = await fetch(`${server.baseUrl}/api/images/upload`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': `multipart/form-data; boundary=${boundary}`
      },
      body: uploadBody
    });
    const body = await readJson(response);

    assert.equal(response.status, 201);
    assert.equal(body.code, 200);
    assert.match(body.data.url, /^\/uploads\/images\/\d{4}\/\d{2}\/\d{2}\/.+\.png$/);

    const imageResponse = await fetch(`${server.baseUrl}${body.data.url}`);
    const downloaded = Buffer.from(await imageResponse.arrayBuffer());

    assert.equal(imageResponse.status, 200);
    assert.deepEqual(downloaded, imageBytes);
  } finally {
    await server.close();
  }
});

test('api responses allow browser requests from the local frontend', async () => {
  const server = await startTestServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/config`, {
      method: 'OPTIONS',
      headers: {
        origin: 'http://127.0.0.1:52395',
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'authorization,content-type'
      }
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), '*');
    assert.match(response.headers.get('access-control-allow-headers'), /authorization/i);
  } finally {
    await server.close();
  }
});