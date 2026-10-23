// Run the unmodified ncc action entrypoint with synthetic inputs and local boundaries.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const https = require('node:https');
const net = require('node:net');
const { syncBuiltinESMExports } = require('node:module');
const { once } = require('node:events');

const [bundle, scenario] = process.argv.slice(2);
const repository = path.resolve(__dirname, '../..');
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'root4410-a-dist-'));
fs.cpSync(path.join(repository, 'tests/tasks/eventcatalog'), workspace, { recursive: true });
const secondDirectory = path.join(workspace, 'events/SecondEvent');
fs.cpSync(path.join(workspace, 'events/InventoryAdjusted'), secondDirectory, { recursive: true });
const secondDefinition = path.join(secondDirectory, 'index.mdx');
fs.writeFileSync(
  secondDefinition,
  fs
    .readFileSync(secondDefinition, 'utf8')
    .replaceAll('InventoryAdjusted', 'SecondEvent')
    .replaceAll('Inventory adjusted', 'Second event')
);
const serviceDirectory = path.join(workspace, 'services/SyntheticService');
fs.mkdirSync(serviceDirectory, { recursive: true });
fs.writeFileSync(
  path.join(serviceDirectory, 'index.mdx'),
  '---\nid: SyntheticService\nname: Synthetic service\nversion: 1.0.0\n---\nSynthetic fixture.'
);
const eventPath = path.join(workspace, 'event.json');
fs.writeFileSync(
  eventPath,
  JSON.stringify({
    pull_request: { number: 1, base: { sha: 'base' }, head: { sha: 'head' } },
    repository: { owner: { login: 'owner' }, name: 'repo' },
  })
);
process.chdir(workspace);
Object.assign(process.env, {
  GITHUB_EVENT_NAME: 'pull_request',
  GITHUB_REPOSITORY: 'owner/repo',
  GITHUB_EVENT_PATH: eventPath,
  INPUT_GITHUB_TOKEN: 'synthetic-github',
  INPUT_TASK: 'schema_review',
  INPUT_CATALOG_DIRECTORY: '',
  INPUT_LICENSE_KEY: scenario === 'missing-license' ? '' : 'synthetic-license',
  INPUT_API_KEY: 'sk-synthetic-private',
  INPUT_PROVIDER: 'openai',
  INPUT_MODEL: scenario === 'luna' ? 'gpt-5.6-luna' : scenario === 'legacy' ? 'o4-mini' : '',
  INPUT_FAILURE_THRESHOLD: scenario === 'zero-threshold' ? '0' : '75',
});
const record = {
  scenario,
  node: process.version,
  comments: [],
  requests: [],
  licenseCalls: 0,
  githubCalls: [],
  unexpectedNetwork: [],
  stdout: '',
  stderr: '',
};
const originalStdout = process.stdout.write.bind(process.stdout);
process.stdout.write = (text, ...args) => {
  record.stdout += String(text).replace(/^::add-mask::.*$/gm, '::add-mask::[redacted]');
  return true;
};
process.stderr.write = (text, ...args) => {
  record.stderr += String(text);
  return true;
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
const schemaFile = 'events/InventoryAdjusted/schema.json';
const otherFile = 'events/SecondEvent/schema.json';
const goodReview = (score) => ({
  executiveSummary: 'Synthetic schema review',
  score,
  schemaFormat: 'json',
  effectedConsumers: [],
});
const responseFor = (body, value) => {
  const content = value === null ? null : typeof value === 'string' ? value : JSON.stringify(value);
  const message =
    body.tools && content !== null
      ? {
          role: 'assistant',
          content: null,
          tool_calls: [{ id: 'test', type: 'function', function: { name: 'json', arguments: content } }],
        }
      : { role: 'assistant', content };
  return json({
    id: 'synthetic',
    created: 1,
    model: body.model,
    choices: [{ index: 0, message, finish_reason: body.tools ? 'tool_calls' : 'stop' }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  });
};
globalThis.fetch = async (url, init = {}) => {
  const target = new URL(String(url));
  const body = init.body ? JSON.parse(init.body) : undefined;
  if (target.hostname === 'api.github.com') {
    record.githubCalls.push({ path: target.pathname, method: init.method || 'GET' });
    if (target.pathname.endsWith('/files'))
      return json([{ filename: schemaFile, status: 'modified' }, ...(scenario === 'mixed' ? [{ filename: otherFile, status: 'modified' }] : [])]);
    if (target.pathname.includes('/contents/'))
      return json({ type: 'file', size: Buffer.byteLength('{"synthetic-private-schema":true}'), content: Buffer.from('{"synthetic-private-schema":true}').toString('base64'), encoding: 'base64' });
    if (target.pathname.endsWith('/comments') && (!init.method || init.method === 'GET'))
      return json(
        scenario === 'recovery' ? [{ id: 123, body: '<!-- eventcatalog-schema-review-comment -->\nReview failed' }] : []
      );
    if (
      (target.pathname.endsWith('/comments') && init.method === 'POST') ||
      (target.pathname.endsWith('/comments/123') && init.method === 'PATCH')
    ) {
      record.comments.push({ method: init.method, body: body.body });
      return json({ id: 123 });
    }
    throw new Error('Unexpected synthetic GitHub route');
  }
  if (target.hostname === 'api.openai.com' && target.pathname === '/v1/chat/completions') {
    record.requests.push({ url: String(url), body });
    if (scenario === 'sdk-rejection')
      return json(
        { error: { message: 'private request sk-synthetic-private', type: 'invalid_request_error', param: 'temperature' } },
        400
      );
    if (scenario === 'authentication')
      return json(
        { error: { message: 'private request sk-synthetic-private', type: 'invalid_request_error', code: 'invalid_api_key' } },
        401
      );
    if (scenario === 'timeout') throw new DOMException('private request sk-synthetic-private', 'TimeoutError');
    if (scenario === 'network') throw new TypeError('private request sk-synthetic-private');
    if (scenario === 'invalid-json') return responseFor(body, 'private request sk-synthetic-private');
    if (scenario === 'invalid-schema') return responseFor(body, { ...goodReview(85), score: 101 });
    if (scenario === 'missing' || (scenario === 'mixed' && record.requests.length === 2)) return responseFor(body, null);
    // Contract emulator: reproduce the issue author's two distinct rejections
    // locally. It is not evidence of live model access or semantic quality.
    if (['gpt-5.6-terra', 'gpt-5.6-luna'].includes(body.model)) {
      if (body.tools || body.response_format?.type !== 'json_schema')
        return json(
          { error: { message: 'Synthetic unsupported tool request', type: 'invalid_request_error', param: 'reasoning_effort' } },
          400
        );
      if (body.temperature !== 1)
        return json(
          { error: { message: 'Synthetic unsupported temperature', type: 'invalid_request_error', param: 'temperature' } },
          400
        );
    }
    const score =
      scenario === 'zero' || scenario === 'zero-threshold' ? 0 : scenario === 'below' ? 74 : scenario === 'exact' ? 75 : 85;
    return responseFor(body, goodReview(score));
  }
  record.unexpectedNetwork.push(target.origin + target.pathname);
  throw new Error('External network is disabled by qualification');
};

(async () => {
  // node-fetch in the unchanged license gate uses https.request rather than
  // global fetch. Redirect that single known route to a local response server.
  const server = http.createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    if (request.url === '/license') {
      record.licenseCalls++;
      response.writeHead(scenario === 'invalid-license' ? 401 : 200, { 'content-type': 'application/json', connection: 'close' });
      response.end(JSON.stringify({ plugin: '@eventcatalog/eventcatalog-scale', state: 'active', is_trial: true }));
    } else {
      const reply = await globalThis.fetch('https://api.github.com' + request.url, {
        method: request.method,
        body: body || undefined,
      });
      response.writeHead(reply.status, { 'content-type': 'application/json', connection: 'close' });
      response.end(await reply.text());
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  // @actions/github uses its bundled undici fetch, so its supported API-base
  // setting points at the local GitHub emulator rather than global fetch.
  process.env.GITHUB_API_URL = `http://127.0.0.1:${server.address().port}`;
  const originalHttpRequest = http.request;
  const deny = (target) => {
    record.unexpectedNetwork.push(String(target));
    throw new Error('External network is disabled by qualification');
  };
  https.request = (input, options, callback) => {
    const target =
      typeof input === 'string' || input instanceof URL ? new URL(input) : new URL(`https://${input.hostname}${input.path}`);
    if (target.hostname !== 'api.eventcatalog.cloud' || target.pathname !== '/functions/v1/license') return deny(target.origin);
    return originalHttpRequest(
      {
        hostname: '127.0.0.1',
        port: server.address().port,
        path: '/license',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      },
      typeof options === 'function' ? options : callback
    );
  };
  https.get = (options) => deny(options.hostname);
  http.request = (options) => deny(options.hostname);
  http.get = (options) => deny(options.hostname);
  const originalConnect = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function (...args) {
    const normalized = Array.isArray(args[0]) ? args[0] : args;
    const options =
      typeof normalized[0] === 'object'
        ? normalized[0]
        : { port: normalized[0], host: typeof normalized[1] === 'string' ? normalized[1] : 'localhost' };
    const host = options.host || options.hostname || 'localhost';
    if (!['127.0.0.1', '::1', 'localhost'].includes(host) || Number(options.port) !== server.address().port) return deny(host);
    return originalConnect.apply(this, args);
  };
  syncBuiltinESMExports();
  const timeout = setTimeout(() => {
    record.harnessError = 'Action did not reach its terminal output in 15 seconds';
    process.exitCode = 2;
    finish();
  }, 15000);
  let finished = false;
  const poll = setInterval(() => {
    if (
      record.unexpectedNetwork.length ||
      record.stdout.includes('name=comment-url') ||
      (['missing-license', 'invalid-license'].includes(scenario) && record.stdout.includes('::error::Invalid license key'))
    )
      finish();
  }, 10);
  function finish() {
    if (finished) return;
    finished = true;
    clearInterval(poll);
    clearTimeout(timeout);
    server.close();
    record.exitCode = process.exitCode || 0;
    fs.rmSync(workspace, { recursive: true, force: true });
    originalStdout(JSON.stringify(record) + '\n');
  }
  try {
    require(path.resolve(bundle));
  } catch (error) {
    record.harnessError = error.message;
    process.exitCode = 2;
    finish();
  }
})().catch((error) => {
  originalStdout(JSON.stringify({ harnessError: error.message }) + '\n');
  process.exitCode = 2;
});
