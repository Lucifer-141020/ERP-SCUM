const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const configPath = require.resolve('../config');

test('production refuses to start without JWT_SECRET', () => {
  const result = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(configPath)})`], {
    env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: '', ADMIN_PASSWORD: 'configured-admin-password' },
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /必须配置 JWT_SECRET/);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /configured-admin-password/);
});

test('production refuses to start without ADMIN_PASSWORD', () => {
  const result = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(configPath)})`], {
    env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: 'configured-jwt-secret', ADMIN_PASSWORD: '' },
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /必须配置 ADMIN_PASSWORD/);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /configured-jwt-secret/);
});
