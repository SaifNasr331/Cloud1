const test = require('node:test');
const assert = require('node:assert/strict');

const { startServer, stopServer } = require('./server');

test('api exposes issue endpoints', async () => {
  const server = await startServer(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const pageResponse = await fetch(`${baseUrl}/`);
    assert.equal(pageResponse.status, 200);
    assert.match(await pageResponse.text(), /Cloud Issue Tracker/);

    const apiResponse = await fetch(`${baseUrl}/api`);
    assert.equal(apiResponse.status, 200);

    const listResponse = await fetch(`${baseUrl}/api/issues`);
    assert.equal(listResponse.status, 200);

    const issues = await listResponse.json();
    assert.ok(Array.isArray(issues));
    assert.ok(issues.length >= 2);

    const createResponse = await fetch(`${baseUrl}/api/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Monitor flickering',
        description: 'Display intermittently flickers during meetings.',
        priority: 'High',
      }),
    });

    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();
    assert.equal(created.status, 'Open');

    const updateResponse = await fetch(`${baseUrl}/api/issues/${created.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Resolved' }),
    });

    assert.equal(updateResponse.status, 200);
    const updated = await updateResponse.json();
    assert.equal(updated.status, 'Resolved');
  } finally {
    await stopServer();
  }
});
