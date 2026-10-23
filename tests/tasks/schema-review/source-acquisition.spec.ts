import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as core from '@actions/core';
import * as ai from '../../../src/lib/ai';
import * as github from '../../../src/lib/github';
import { task } from '../../../src/tasks/schema-review';
import type { Context } from '@actions/github/lib/context';

const metadata = vi.hoisted(() => ({ read: vi.fn(async () => ({ id: 'event', name: 'Synthetic event', version: '1.0.0' })) }));
vi.mock('@eventcatalog/sdk', () => ({
  default: () => ({ getMessageBySchemaPath: metadata.read, getProducersAndConsumersForMessage: async () => ({ consumers: [] }) }),
}));
const context = {
  repo: { owner: 'owner', repo: 'repo' },
  payload: { pull_request: { number: 1, base: { sha: 'exact-base' }, head: { sha: 'exact-head' } } },
} as unknown as Context;
const filePath = 'events/Event/schema.json';
const second = 'events/Other/schema.json';
const secret = 'SECRET_SOURCE_FIXTURE';
const content = (text = '{"type":"object"}') => ({
  data: { type: 'file', encoding: 'base64', content: Buffer.from(text).toString('base64'), size: Buffer.byteLength(text) },
});
const httpError = (status: number) =>
  Object.assign(new Error(secret), { status, response: { headers: { authorization: secret }, data: secret } });
const adverse: [string, () => any][] = [
  ...[401, 403, 404, 503].map(
    (status) =>
      [
        `HTTP ${status}`,
        () => {
          throw httpError(status);
        },
      ] as [string, () => any]
  ),
  [
    'network',
    () => {
      throw new TypeError(secret);
    },
  ],
  [
    'timeout',
    () => {
      throw new DOMException(secret, 'TimeoutError');
    },
  ],
  ['directory', () => ({ data: [] })],
  ['no content', () => ({ data: { type: 'file', encoding: 'base64', size: 10 } })],
  ['unsupported encoding', () => ({ data: { type: 'file', encoding: 'none', content: '', size: 2000000 } })],
  ['truncated', () => ({ data: { ...content().data, size: 999 } })],
  ['malformed', () => ({ data: null })],
  ['bad base64', () => ({ data: { type: 'file', encoding: 'base64', content: '%%%bad', size: 3 } })],
  ['invalid UTF8', () => ({ data: { type: 'file', encoding: 'base64', content: '/w==', size: 1 } })],
];
let octokit: any;
let failed: any;
let provider: any;
let diagnostics: any[];
let threshold: string;
let score: number;
let changes: any[];

beforeEach(() => {
  changes = [{ filename: filePath, status: 'modified' }];
  threshold = '75';
  score = 100;
  metadata.read.mockClear();
  vi.spyOn(core, 'getInput').mockImplementation(
    (name) => ({ failure_threshold: threshold, provider: 'openai', model: 'gpt-5.6-terra' })[name] || ''
  );
  diagnostics = [
    vi.spyOn(core, 'error'),
    vi.spyOn(core, 'warning'),
    vi.spyOn(core, 'info'),
    vi.spyOn(console, 'error'),
    vi.spyOn(console, 'warn'),
    vi.spyOn(console, 'log'),
  ];
  diagnostics.forEach((spy) => spy.mockImplementation(() => {}));
  vi.spyOn(core, 'setOutput').mockImplementation(() => {});
  failed = vi.spyOn(core, 'setFailed').mockImplementation(() => {});
  provider = vi
    .spyOn(ai, 'sendPromptToModel')
    .mockImplementation(async () => ({
      score,
      executiveSummary: 'Synthetic result',
      schemaFormat: 'json',
      effectedConsumers: [],
    }));
  octokit = {
    rest: {
      pulls: { listFiles: vi.fn(async () => ({ data: changes })) },
      repos: { getContent: vi.fn(async () => content()) },
      issues: { listComments: vi.fn(async () => ({ data: [] })), createComment: vi.fn(async () => ({ data: { id: 1 } })) },
    },
  };
});
afterEach(() => vi.restoreAllMocks());
async function run() {
  await task({ octokit, context, catalogDirectory: '' });
  return octokit.rest.issues.createComment.mock.calls[0]?.[0].body as string;
}
function failAt(ref: string, response: () => any, target = filePath) {
  octokit.rest.repos.getContent.mockImplementation(async (request: any) =>
    request.ref === ref && request.path === target ? response() : content()
  );
}
function assertRefusal(body: string) {
  expect(failed).toHaveBeenCalled();
  expect(provider).not.toHaveBeenCalled();
  expect(body).toContain('Review failed');
  expect(body).not.toMatch(/Safe|\/100/);
  expect(JSON.stringify([body, ...diagnostics.map((spy) => spy.mock.calls), provider.mock.calls])).not.toContain(secret);
}

describe('source acquisition through the actual task with a score-100 negative control', () => {
  for (const ref of ['exact-base', 'exact-head']) {
    it.each(adverse)(`${ref} %s cannot become a scored review`, async (_name, response) => {
      failAt(ref, response);
      assertRefusal(await run());
    });
  }
  it('fails the action before comment publication even when publishing fails', async () => {
    failAt('exact-head', () => {
      throw httpError(403);
    });
    octokit.rest.issues.createComment.mockImplementation(async () => {
      expect(failed).toHaveBeenCalled();
      throw new Error('Synthetic comment failure');
    });
    await expect(run()).rejects.toThrow('Schema review comment publication failed');
    expect(provider).not.toHaveBeenCalled();
  });
  it('retains a successful sibling without covering source failure', async () => {
    changes.push({ filename: second, status: 'modified' });
    failAt('exact-head', () => {
      throw httpError(404);
    });
    const body = await run();
    expect(failed).toHaveBeenCalled();
    expect(provider).toHaveBeenCalledTimes(1);
    const failedSection = body.split('## [').find((section) => section.includes(encodeURIComponent(filePath)))!;
    expect(failedSection).toContain('Review failed');
    expect(failedSection).not.toMatch(/Safe|\/100/);
    expect(body).toContain('100/100');
    expect(JSON.stringify(provider.mock.calls)).not.toContain(secret);
  });
  it('reviews both exact revisions for a modified file', async () => {
    expect(await run()).toContain('100/100');
    expect(failed).not.toHaveBeenCalled();
    expect(octokit.rest.repos.getContent.mock.calls.map(([request]: any) => [request.path, request.ref])).toEqual([
      [filePath, 'exact-base'],
      [filePath, 'exact-head'],
    ]);
  });
  it('reviews an addition with explicit base absence and no base request', async () => {
    changes[0].status = 'added';
    failAt('exact-base', () => {
      throw httpError(404);
    });
    const body = await run();
    expect(body).toContain('100/100');
    expect(failed).not.toHaveBeenCalled();
    expect(octokit.rest.repos.getContent).toHaveBeenCalledTimes(1);
    expect(octokit.rest.repos.getContent.mock.calls[0][0]).toMatchObject({ path: filePath, ref: 'exact-head' });
    expect(provider.mock.calls[0][1]).toMatch(/added[\s\S]*absent/i);
  });
  it('reports removal as unsupported without a head catalog lookup or provider score', async () => {
    changes[0].status = 'removed';
    assertRefusal(await run());
    expect(octokit.rest.repos.getContent).not.toHaveBeenCalled();
    expect(metadata.read).not.toHaveBeenCalled();
    expect(provider).not.toHaveBeenCalled();
  });
  it.each([true, false])('binds previous path for a rename (changed bytes=%s)', async (changed) => {
    changes[0] = { filename: filePath, status: 'renamed', previous_filename: 'events/Old/schema.json' };
    octokit.rest.repos.getContent.mockImplementation(async ({ ref }: any) =>
      content(changed && ref === 'exact-head' ? '{"new":true}' : '{"old":true}')
    );
    expect(await run()).toContain('100/100');
    expect(failed).not.toHaveBeenCalled();
    expect(octokit.rest.repos.getContent.mock.calls.map(([request]: any) => [request.path, request.ref])).toEqual([
      ['events/Old/schema.json', 'exact-base'],
      [filePath, 'exact-head'],
    ]);
    expect(provider.mock.calls[0][1]).toContain('renamed');
  });
  it.each([{ status: 'renamed' }, { status: 'copied' }, {}])('refuses ambiguous/unsupported change %j', async (change) => {
    changes[0] = { filename: filePath, ...change };
    assertRefusal(await run());
    expect(octokit.rest.repos.getContent).not.toHaveBeenCalled();
  });
  it.each(['exact-base', 'exact-head'])('distinguishes an empty file at %s and refuses an unreviewable schema', async (ref) => {
    failAt(ref, () => content(''));
    assertRefusal(await run());
  });
  it('does not ban legitimate schema text resembling the old sentinel', async () => {
    const text = 'Could not retrieve content (Error: these are legitimate file bytes)';
    octokit.rest.repos.getContent.mockResolvedValue(content(text));
    expect(await run()).toContain('100/100');
    expect(provider.mock.calls[0][1]).toContain(text);
  });
  it('preserves score zero and recovers in a later healthy task', async () => {
    failAt('exact-head', () => {
      throw httpError(401);
    });
    assertRefusal(await run());
    failed.mockClear();
    octokit.rest.issues.createComment.mockClear();
    octokit.rest.repos.getContent.mockResolvedValue(content());
    score = 0;
    const body = await run();
    expect(body).toContain('0/100');
    expect(body).toContain('Danger');
    expect(failed).toHaveBeenCalledWith('Schema review failed with a score of 0');
    failed.mockClear();
    octokit.rest.issues.createComment.mockClear();
    threshold = '0';
    expect(await run()).toContain('0/100');
    expect(failed).not.toHaveBeenCalled();
  });
});

describe('shared fetch contract', () => {
  it('returns exact file bytes including a real empty file', async () => {
    octokit.rest.repos.getContent.mockResolvedValue(content(''));
    expect(await github.getFileContentAtRef(octokit, context, filePath, 'exact-base')).toBe('');
  });
  it('throws a safe typed error retaining original status and cause', async () => {
    const original = httpError(404);
    octokit.rest.repos.getContent.mockRejectedValue(original);
    const error = await github.getFileContentAtRef(octokit, context, filePath, 'exact-base').catch((error) => error);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('SchemaSourceError');
    expect(error.status).toBe(404);
    expect(error.cause).toBe(original);
    expect(error.message).toContain('404');
    expect(JSON.stringify(error)).not.toContain(secret);
  });
});
