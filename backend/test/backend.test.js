const assert = require('node:assert/strict');
const { once } = require('node:events');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { createApp } = require('../server');

async function startTestServer() {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scum-backend-'));
  const server = createApp({
    rootDir,
    adminPassword: 'test-password',
    adminToken: 'test-token'
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    rootDir,
    baseUrl,
    async close() {
      server.close();
      await once(server, 'close');
      await fs.rm(rootDir, { recursive: true, force: true });
    }
  };
}

async function readJson(response) {
  return response.json();
}

test('admin can login with the configured password', async () => {
  const app = await startTestServer();

  try {
    const response = await fetch(`${app.baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'test-password' })
    });
    const body = await readJson(response);

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.token, 'test-token');
  } finally {
    await app.close();
  }
});

test('site config can be saved by admin and read back publicly', async () => {
  const app = await startTestServer();

  try {
    const saveResponse = await fetch(`${app.baseUrl}/api/admin/site-config`, {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer test-token',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        serverName: 'ERP14 SCUM',
        announcement: '今晚开放新活动'
      })
    });
    const saveBody = await readJson(saveResponse);

    assert.equal(saveResponse.status, 200);
    assert.equal(saveBody.ok, true);

    const readResponse = await fetch(`${app.baseUrl}/api/site-config`);
    const readBody = await readJson(readResponse);

    assert.equal(readResponse.status, 200);
    assert.equal(readBody.serverName, 'ERP14 SCUM');
    assert.equal(readBody.announcement, '今晚开放新活动');
  } finally {
    await app.close();
  }
});

test('admin can upload an image and open it from uploads url', async () => {
  const app = await startTestServer();
  const boundary = '----scum-test-boundary';
  const imageBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="file"; filename="banner.png"\r\n'),
    Buffer.from('Content-Type: image/png\r\n\r\n'),
    imageBytes,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  try {
    const uploadResponse = await fetch(`${app.baseUrl}/api/admin/upload`, {
      method: 'POST',
      headers: {
        'authorization': 'Bearer test-token',
        'content-type': `multipart/form-data; boundary=${boundary}`
      },
      body
    });
    const uploadBody = await readJson(uploadResponse);

    assert.equal(uploadResponse.status, 200);
    assert.equal(uploadBody.ok, true);
    assert.match(uploadBody.url, /^\/uploads\/.+\.png$/);

    const imageResponse = await fetch(`${app.baseUrl}${uploadBody.url}`);
    const downloaded = Buffer.from(await imageResponse.arrayBuffer());

    assert.equal(imageResponse.status, 200);
    assert.deepEqual(downloaded, imageBytes);
  } finally {
    await app.close();
  }
});

test('admin endpoints reject missing token', async () => {
  const app = await startTestServer();

  try {
    const response = await fetch(`${app.baseUrl}/api/admin/site-config`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ serverName: 'ERP14 SCUM' })
    });
    const body = await readJson(response);

    assert.equal(response.status, 401);
    assert.equal(body.ok, false);
  } finally {
    await app.close();
  }
});

test('api responses allow browser requests from the local frontend', async () => {
  const app = await startTestServer();

  try {
    const response = await fetch(`${app.baseUrl}/api/site-config`, {
      headers: { origin: 'http://127.0.0.1:52395' }
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), '*');
    assert.match(response.headers.get('access-control-allow-headers'), /authorization/i);
  } finally {
    await app.close();
  }
});

test('admin can save a large site config during first browser sync', async () => {
  const app = await startTestServer();
  const largeText = 'x'.repeat(2 * 1024 * 1024);

  try {
    const response = await fetch(`${app.baseUrl}/api/admin/site-config`, {
      method: 'PUT',
      headers: {
        'authorization': 'Bearer test-token',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        serverInfo: { title: 'ERP14 SCUM' },
        imageLibrary: [{ src: largeText, name: 'large migrated image' }]
      })
    });
    const body = await readJson(response);

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
  } finally {
    await app.close();
  }
});
