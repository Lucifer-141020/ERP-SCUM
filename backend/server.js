const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');

const DEFAULT_CONFIG = {
  serverName: 'ERP14 SCUM',
  announcement: ''
};

function sendJson(response, status, data) {
  const body = JSON.stringify(data);
  response.writeHead(status, {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body)
  });
  response.end(body);
}

function sendBuffer(response, status, contentType, data) {
  response.writeHead(status, {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'content-type': contentType,
    'content-length': data.length
  });
  response.end(data);
}

function readBody(request, limitBytes = 5 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error('REQUEST_TOO_LARGE'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

async function readJsonBody(request, limitBytes = 1024 * 1024) {
  const body = await readBody(request, limitBytes);
  if (body.length === 0) return {};
  return JSON.parse(body.toString('utf8'));
}

async function ensureDirs(rootDir) {
  await fs.mkdir(path.join(rootDir, 'data'), { recursive: true });
  await fs.mkdir(path.join(rootDir, 'uploads'), { recursive: true });
}

async function readConfig(configPath) {
  try {
    const text = await fs.readFile(configPath, 'utf8');
    return JSON.parse(text);
  } catch (error) {
    if (error.code === 'ENOENT') return DEFAULT_CONFIG;
    throw error;
  }
}

async function writeConfig(configPath, data) {
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(data, null, 2), 'utf8');
}

function hasAdminToken(request, adminToken) {
  const header = request.headers.authorization || '';
  return header === `Bearer ${adminToken}`;
}

function getUploadExtension(fileName, contentType) {
  const ext = path.extname(fileName || '').toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) return ext;

  const byType = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif'
  };
  return byType[contentType] || '';
}

function parseMultipartUpload(body, contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!match) throw new Error('MISSING_BOUNDARY');

  const boundary = Buffer.from(`--${match[1] || match[2]}`);
  const start = body.indexOf(boundary);
  if (start === -1) throw new Error('MISSING_FILE');

  const headerStart = start + boundary.length + 2;
  const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), headerStart);
  if (headerEnd === -1) throw new Error('BAD_MULTIPART');

  const headersText = body.subarray(headerStart, headerEnd).toString('utf8');
  const nameMatch = /name="file"/i.exec(headersText);
  const fileNameMatch = /filename="([^"]+)"/i.exec(headersText);
  const typeMatch = /content-type:\s*([^\r\n]+)/i.exec(headersText);
  if (!nameMatch || !fileNameMatch) throw new Error('MISSING_FILE');

  const dataStart = headerEnd + 4;
  const nextBoundary = body.indexOf(Buffer.from(`\r\n--${match[1] || match[2]}`), dataStart);
  if (nextBoundary === -1) throw new Error('BAD_MULTIPART');

  return {
    fileName: path.basename(fileNameMatch[1]),
    contentType: typeMatch ? typeMatch[1].trim().toLowerCase() : 'application/octet-stream',
    data: body.subarray(dataStart, nextBoundary)
  };
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return types[ext] || 'application/octet-stream';
}

function createApp(options = {}) {
  const rootDir = options.rootDir || __dirname;
  const adminPassword = options.adminPassword || process.env.ADMIN_PASSWORD || 'admin123456';
  const adminToken = options.adminToken || process.env.ADMIN_TOKEN || crypto.randomBytes(24).toString('hex');
  const configPath = path.join(rootDir, 'data', 'site-config.json');
  const uploadsDir = path.join(rootDir, 'uploads');

  return http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');

    try {
      if (request.method === 'OPTIONS') {
        response.writeHead(204, {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
          'access-control-allow-headers': 'content-type,authorization'
        });
        response.end();
        return;
      }

      await ensureDirs(rootDir);

      if (request.method === 'POST' && url.pathname === '/api/admin/login') {
        const body = await readJsonBody(request);
        if (body.password !== adminPassword) {
          sendJson(response, 401, { ok: false, error: '密码错误' });
          return;
        }
        sendJson(response, 200, { ok: true, token: adminToken });
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/site-config') {
        sendJson(response, 200, await readConfig(configPath));
        return;
      }

      if (request.method === 'PUT' && url.pathname === '/api/admin/site-config') {
        if (!hasAdminToken(request, adminToken)) {
          sendJson(response, 401, { ok: false, error: '未登录' });
          return;
        }
        const body = await readJsonBody(request, 25 * 1024 * 1024);
        await writeConfig(configPath, body);
        sendJson(response, 200, { ok: true });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/admin/upload') {
        if (!hasAdminToken(request, adminToken)) {
          sendJson(response, 401, { ok: false, error: '未登录' });
          return;
        }
        const body = await readBody(request);
        const upload = parseMultipartUpload(body, request.headers['content-type']);
        const ext = getUploadExtension(upload.fileName, upload.contentType);
        if (!ext) {
          sendJson(response, 400, { ok: false, error: '只支持图片文件' });
          return;
        }

        const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
        const filePath = path.join(uploadsDir, safeName);
        await fs.writeFile(filePath, upload.data);
        sendJson(response, 200, { ok: true, url: `/uploads/${safeName}` });
        return;
      }

      if (request.method === 'GET' && url.pathname.startsWith('/uploads/')) {
        const fileName = path.basename(decodeURIComponent(url.pathname.slice('/uploads/'.length)));
        const filePath = path.join(uploadsDir, fileName);
        const data = await fs.readFile(filePath);
        sendBuffer(response, 200, getContentType(filePath), data);
        return;
      }

      sendJson(response, 404, { ok: false, error: '接口不存在' });
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(response, 400, { ok: false, error: 'JSON 格式错误' });
        return;
      }
      if (error.code === 'ENOENT') {
        sendJson(response, 404, { ok: false, error: '文件不存在' });
        return;
      }
      if (error.message === 'REQUEST_TOO_LARGE') {
        sendJson(response, 413, { ok: false, error: '文件太大' });
        return;
      }
      sendJson(response, 500, { ok: false, error: '服务器错误' });
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, () => {
    console.log(`SCUM backend running at http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp };
