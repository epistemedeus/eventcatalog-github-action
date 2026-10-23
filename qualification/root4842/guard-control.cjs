const assert = require('node:assert/strict');
const net = require('node:net');
const http = require('node:http');

(async () => {
  assert.throws(() => net.connect(443, 'example.invalid'), { code: 'EACCES' });
  assert.throws(() => fetch('https://example.invalid/'), { code: 'EACCES' });
  const server = http.createServer((request, response) => response.end('synthetic-loopback'));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
    assert.equal(await response.text(), 'synthetic-loopback');
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  console.log('External socket/fetch refusal and real loopback control passed; process-local proof only.');
})().catch((error) => {
  console.error(error.code || error.name);
  process.exitCode = 1;
});
