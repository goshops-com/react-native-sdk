const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadSDK, storage, token } = require('./helpers/load-sdk.cjs');

const plain = (value) => JSON.parse(JSON.stringify(value));

async function fixture() {
  const calls = [];
  const api = {};
  for (const method of ['post', 'patch', 'get']) {
    api[method] = async (url, body) => {
      calls.push({ method, url, body });
      return { data: { success: true, impressionId: 'canonical-id' } };
    };
  }
  return { ...await loadSDK({ api }), calls };
}

test('invalid ids are no-ops, even before initialization', async () => {
  const { sdk } = await loadSDK({ api: {}, store: storage() });
  for (const id of [undefined, null, '', '  ', 1, {}]) {
    assert.equal(await sdk.createContentImpression(id, { content: 'c' }), undefined);
    assert.equal(await sdk.clickContentImpression(id, { content: 'c' }), undefined);
  }
});

test('create omits undefined fields, defaults to opened and stores the canonical id', async () => {
  const { sdk, calls } = await fixture();
  assert.equal((await sdk.createContentImpression('page-id', { content: 'c' })).impressionId, 'canonical-id');
  assert.deepEqual(plain(calls), [{ method: 'post', url: '/personal/impression', body: { impressionId: 'page-id', content: 'c', status: 'opened' } }]);
  assert.equal(await sdk.getContentImpressionId('c'), 'canonical-id');
  assert.deepEqual(plain(await sdk.createContentImpression('another-page-id', { content: 'c', variantId: 'another-variant' })), { success: true, impressionId: 'canonical-id', skipped: true });
  assert.equal(calls.length, 1);
});

test('forwards all supported fields and preserves explicit empty status and null values', async () => {
  const { sdk, calls } = await fixture();
  const options = { content: 'c', target: 't', variantId: 'v', status: '', tags: ['qa'], date: '2026-11-06T00:00:00Z' };
  await sdk.createContentImpression('id', options);
  assert.deepEqual(plain(calls[0].body), { impressionId: 'id', ...options });
  await sdk.clickContentImpression('canonical-id', { content: 'c', tags: null, status: 'ignored' });
  assert.deepEqual(plain(calls[1]), { method: 'patch', url: '/personal/impression/canonical-id', body: { content: 'c', tags: null } });
  await sdk.clickContentImpression('id');
  assert.deepEqual(plain(calls[2].body), {});
});

test('falls back to variant/id keys for JavaScript callers; no id response keeps the supplied id', async () => {
  const api = { post: async () => ({ data: { success: true } }) };
  const { sdk } = await loadSDK({ api });
  await sdk.createContentImpression('id', { variantId: 'v' });
  assert.equal(await sdk.getContentImpressionId('v'), 'id');
  await sdk.createContentImpression('fallback-id');
  assert.equal(await sdk.getContentImpressionId('fallback-id'), 'fallback-id');
});

test('deduplicates simultaneous creates and returns the server id to waiting readers', async () => {
  const { sdk, api, calls } = await fixture();
  let finish;
  let started;
  const ready = new Promise((resolve) => { started = resolve; });
  api.post = async () => { calls.push('post'); started(); return new Promise((resolve) => { finish = resolve; }); };
  const first = sdk.createContentImpression('first', { content: 'c' });
  await ready;
  const second = sdk.createContentImpression('second', { content: 'c' });
  const stored = sdk.getContentImpressionId('c');
  finish({ data: { success: true, impressionId: 'server-id' } });
  assert.equal((await first).impressionId, 'server-id');
  assert.equal((await second).skipped, true);
  assert.equal((await second).impressionId, 'server-id');
  assert.equal(await stored, 'server-id');
  assert.equal(calls.length, 1);
});

test('failed creates can be retried; failed clicks reject', async () => {
  const { sdk, api } = await fixture();
  api.post = async () => { throw new Error('503'); };
  await assert.rejects(sdk.createContentImpression('id', { content: 'c' }), /503/);
  assert.equal(await sdk.getContentImpressionId('c'), null);
  api.post = async () => ({ data: { success: true, impressionId: 'retry' } });
  assert.equal((await sdk.createContentImpression('id', { content: 'c' })).impressionId, 'retry');
  api.patch = async () => { throw new Error('500'); };
  await assert.rejects(sdk.clickContentImpression('retry'), /500/);
});

test('storage survives SDK reload and token renewal, but is isolated by backend session and project', async () => {
  const { sdk, store, api, calls } = await fixture();
  await sdk.createContentImpression('id', { content: 'c' });
  await store.setItem('goPersonalToken-v2', token('session-a', 'project-a', 2));
  const reloaded = (await loadSDK({ api, store })).sdk;
  assert.equal((await reloaded.createContentImpression('new-id', { content: 'c' })).skipped, true);
  assert.equal(calls.length, 1);
  for (const next of [token('session-b'), token('session-b', 'project-b')]) {
    await store.setItem('goPersonalToken-v2', next);
    assert.equal(await sdk.getContentImpressionId('c'), null);
    assert.equal((await sdk.createContentImpression('id', { content: 'c' })).skipped, undefined);
  }
  assert.equal(calls.length, 3);
  await store.removeItem('goPersonalToken-v2');
  await assert.rejects(sdk.createContentImpression('id', { content: 'c' }), /Initialize/);
});

test('different contents and special property names do not collide', async () => {
  const { sdk, calls } = await fixture();
  await Promise.all(['a', 'b', '__proto__'].map((content) => sdk.createContentImpression('id', { content })));
  assert.equal(calls.length, 3);
  for (const key of ['a', 'b', '__proto__']) assert.equal(await sdk.getContentImpressionId(key), 'canonical-id');
  assert.equal(await sdk.getContentImpressionId('missing'), null);
});

test('a rejected create response is not cached and can be retried', async () => {
  const { sdk, api } = await fixture();
  api.post = async () => ({ data: { success: false } });
  assert.equal((await sdk.createContentImpression('page', { content: 'c' })).success, false);
  assert.equal(await sdk.getContentImpressionId('c'), null);
  api.post = async () => ({ data: { success: true, impressionId: 'session-a:c' } });
  await sdk.createContentImpression('page', { content: 'c' });
  assert.equal(await sdk.getContentImpressionId('c'), 'session-a:c');
});

test('a response cannot move an impression into a different project selected during the request', async () => {
  const { sdk, store, api } = await fixture();
  api.post = async () => {
    await store.setItem('goPersonalToken-v2', token('session-b', 'project-b'));
    return { data: { success: true, impressionId: 'session-a:c' } };
  };
  await sdk.createContentImpression('page', { content: 'c' });
  assert.equal(await sdk.getContentImpressionId('c'), null);
  await store.setItem('goPersonalToken-v2', token('session-a', 'project-a'));
  assert.equal(await sdk.getContentImpressionId('c'), 'session-a:c');
});

test('getContent keeps the original defaults only when options are omitted or undefined', async () => {
  const { sdk, calls } = await fixture();
  await sdk.getContent('c');
  await sdk.getContent('c', undefined);
  for (const call of calls) {
    assert.deepEqual(plain(call), {
      method: 'post',
      url: '/personal/content/c?itemAttributes=*&impressionStatus=opened',
      body: {},
    });
  }
});

test('getContent preserves replacement semantics for empty and partial options', async () => {
  const { sdk, calls } = await fixture();
  for (const options of [{}, { debug: false }, { body: { a: 1 }, context: { page: 'cart' } }]) {
    await sdk.getContent('c', options);
    const call = calls.at(-1);
    assert.equal(call.method, 'post');
    assert.equal(call.url, '/personal/content/c');
    assert.deepEqual(plain(call.body), options.context ? { a: 1, context: { page: 'cart' } } : {});
  }
});

test('getContent preserves explicit item fields and empty/pending impression status', async () => {
  const { sdk, calls } = await fixture();
  for (const status of ['', 'pending']) {
    await sdk.getContent('c', { impressionStatus: status });
    let query = new URL(calls.at(-1).url, 'https://test').searchParams;
    assert.equal(query.has('itemAttributes'), false);
    assert.equal(query.get('impressionStatus'), status);

    await sdk.getContent('c', { itemAttributes: '*', impressionStatus: status });
    query = new URL(calls.at(-1).url, 'https://test').searchParams;
    assert.equal(query.get('itemAttributes'), '*');
    assert.equal(query.get('impressionStatus'), status);
  }
  await sdk.getContent('c', { itemAttributes: 'id,name' });
  const query = new URL(calls.at(-1).url, 'https://test').searchParams;
  assert.equal(query.get('itemAttributes'), 'id,name');
  assert.equal(query.has('impressionStatus'), false);
});

test('getContent keeps cached requests on the existing public endpoint', async () => {
  const { sdk, calls, store } = await fixture();
  await store.setItem('project-v2', 'project-a');
  await sdk.getContent('c', { cache: 1 });
  assert.deepEqual(plain(calls), [{ method: 'get', url: '/public/cached-content/project-a/c' }]);
});

test('getNPS does not add getContent defaults to its options', async () => {
  const { sdk, calls } = await fixture();
  assert.equal(await sdk.getNPS(), null);
  assert.equal(await sdk.getNPS({ debug: false }), null);
  for (const call of calls) {
    assert.deepEqual(plain(call), { method: 'post', url: '/personal/content/nps', body: {} });
  }
});

test('openImpression keeps its existing endpoint, payload and return value', async () => {
  const { sdk, calls } = await fixture();
  assert.equal(await sdk.openImpression('reco-id'), undefined);
  assert.deepEqual(plain(calls), [{ method: 'patch', url: '/personal/impression/reco-id', body: { status: 'opened' } }]);
});

test('openImpression preserves the original ID and personal route with debug options', async () => {
  const { sdk, calls } = await fixture();
  assert.equal(await sdk.openImpression('session:content', { debug: false }), undefined);
  assert.deepEqual(plain(calls), [{ method: 'patch', url: '/personal/impression/session:content', body: { status: 'opened' } }]);
});
