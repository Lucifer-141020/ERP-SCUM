const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', '..', 'erp14-server-showcase.html');

function loadResolver() {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const match = html.match(/function getDefaultApiBaseUrl\(\) \{[\s\S]*?\n    \}/);
  assert.ok(match, 'getDefaultApiBaseUrl function should exist in frontend script');

  const context = { window: { location: {} } };
  vm.createContext(context);
  vm.runInContext(`${match[0]}; window.__resolveApiBaseUrl = getDefaultApiBaseUrl;`, context);

  return (location) => {
    context.window.location = location;
    return context.window.__resolveApiBaseUrl();
  };
}

test('frontend uses local backend during local development', () => {
  const resolveApiBaseUrl = loadResolver();

  assert.equal(
    resolveApiBaseUrl({ protocol: 'http:', hostname: '127.0.0.1', origin: 'http://127.0.0.1:52395' }),
    'http://127.0.0.1:3000'
  );
  assert.equal(
    resolveApiBaseUrl({ protocol: 'http:', hostname: 'localhost', origin: 'http://localhost:52395' }),
    'http://127.0.0.1:3000'
  );
});

test('frontend uses current origin when deployed on a public domain', () => {
  const resolveApiBaseUrl = loadResolver();

  assert.equal(
    resolveApiBaseUrl({ protocol: 'https:', hostname: 'erp14.example.com', origin: 'https://erp14.example.com' }),
    'https://erp14.example.com'
  );
});
