const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', '..', 'erp14-server-showcase.html');

function loadAdminGuard(initialToken = '') {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const match = html.match(/function isAdminLoginPanel\(name\) \{[\s\S]*?function redirectToAdminLogin\(\) \{[\s\S]*?\n    \}/);
  assert.ok(match, 'admin guard functions should exist in frontend script');

  const context = {
    adminToken: initialToken,
    window: {},
    showToast() {},
    renderPanel() {}
  };
  vm.createContext(context);
  vm.runInContext(`${match[0]}; window.__canRenderAdminPanel = canRenderAdminPanel;`, context);

  return (name) => context.window.__canRenderAdminPanel(name);
}

test('frontend only allows the admin login panel before authentication', () => {
  const canRenderAdminPanel = loadAdminGuard('');

  assert.equal(canRenderAdminPanel('adminLogin'), true);
  assert.equal(canRenderAdminPanel('overview'), false);
  assert.equal(canRenderAdminPanel('homeManage'), false);
  assert.equal(canRenderAdminPanel('requestManage'), false);
  assert.equal(canRenderAdminPanel('backupManage'), false);
});

test('frontend allows admin panels after authentication token exists', () => {
  const canRenderAdminPanel = loadAdminGuard('test-token');

  assert.equal(canRenderAdminPanel('adminLogin'), true);
  assert.equal(canRenderAdminPanel('overview'), true);
  assert.equal(canRenderAdminPanel('homeManage'), true);
  assert.equal(canRenderAdminPanel('requestManage'), true);
  assert.equal(canRenderAdminPanel('backupManage'), true);
});