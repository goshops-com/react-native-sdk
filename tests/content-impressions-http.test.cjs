const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { test } = require('node:test');
const { loadSDK, storage, token } = require('./helpers/load-sdk.cjs');

const keys = ['app-popup', 'reco-app-cart-extras', 'app-dynamic-elements', 'app-reorder-banner'];

async function fixture(t, { rejectOnce = 0 } = {}) {
  const store = storage(), requests = [], impressions = new Map(), customers = new Map();
  let sessions = 0;
  const server = http.createServer(async (req, res) => {
    try {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = raw ? JSON.parse(raw) : {};
      const url = new URL(req.url, 'http://127.0.0.1');
      const claims = req.headers.authorization
        ? JSON.parse(Buffer.from(req.headers.authorization.split('.')[1], 'base64url'))
        : {};
      requests.push({ method: req.method, path: url.pathname, query: url.searchParams, body, claims });
      const send = (status, data) => {
        res.writeHead(status, { 'Content-Type': 'application/json', Connection: 'close' });
        res.end(JSON.stringify(data));
      };
      if (url.pathname === '/channel/init') {
        return send(200, { token: token(`S${++sessions}`), project: 'project-a' });
      }
      if (url.pathname === '/channel/login') {
        customers.set(claims.sessionId, body.customerId);
        return send(200, { success: true });
      }
      if (url.pathname.startsWith('/personal/content/')) {
        const key = url.pathname.split('/').at(-1);
        return send(200, { key, experienceId: `content-${key}`, targetId: 'target', variantId: 'variant',
          variantFound: true, impressionId: `page-${key}`, recoImpressionId: `reco-${key}` });
      }
      if (req.method === 'POST' && url.pathname === '/personal/impression') {
        if (rejectOnce) { const status = rejectOnce; rejectOnce = 0; return send(status, {}); }
        const impressionId = `${claims.sessionId}:${body.content}`;
        if (!impressions.has(impressionId)) impressions.set(impressionId, { ...body, impressionId,
          sessionId: claims.sessionId, customer: customers.get(claims.sessionId) });
        return send(200, { success: true, impressionId });
      }
      if (req.method === 'PATCH' && url.pathname.startsWith('/personal/impression/')) {
        const id = body.content ? `${claims.sessionId}:${body.content}`
          : decodeURIComponent(url.pathname.split('/').at(-1));
        const impression = impressions.get(id);
        if (impression) impression.status = 'clicked';
        return send(200, { success: true });
      }
      send(404, {});
    } catch (error) { res.writeHead(500); res.end(error.message); }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const baseURL = `http://127.0.0.1:${server.address().port}`;
  const { sdk } = await loadSDK({ store, baseURL });
  await sdk.init('BR-test', 'test-secret');
  await sdk.login('customer-a');
  return { sdk, store, baseURL, requests, impressions };
}

test('real HTTP: all four contents create once, retain IDs across reloads and click only on explicit actions', async (t) => {
  const f = await fixture(t);
  for (const key of keys) {
    const content = await f.sdk.getContent(key, { itemAttributes: '*', impressionStatus: 'pending' });
    // The legacy call uses a recommendation ID; it must not click the canonical content impression.
    await f.sdk.openImpression(content.recoImpressionId);
    const options = { content: content.experienceId, target: content.targetId, variantId: content.variantId };
    await Promise.all([f.sdk.createContentImpression(content.impressionId, options),
      f.sdk.createContentImpression('another-page', options)]);
    assert.equal(await f.sdk.getContentImpressionId(content.experienceId), `S1:${content.experienceId}`);
  }
  const creates = () => f.requests.filter(r => r.method === 'POST' && r.path === '/personal/impression');
  assert.equal(creates().length, 4);
  assert.equal(f.impressions.size, 4);
  assert.ok([...f.impressions.values()].every(i => i.status === 'opened' && i.customer === 'customer-a'));
  assert.ok(f.requests.filter(r => r.path.startsWith('/personal/content/'))
    .every(r => r.query.get('impressionStatus') === 'pending' && r.query.get('itemAttributes') === '*'));

  const { sdk: reloaded } = await loadSDK({ store: f.store, baseURL: f.baseURL });
  await reloaded.init('BR-test', 'test-secret');
  for (const key of keys) {
    assert.equal((await reloaded.createContentImpression('new-page', { content: `content-${key}` })).skipped, true);
  }
  assert.equal(creates().length, 4);
  assert.equal(f.requests.filter(r => r.path === '/channel/init').length, 1);
  const click = async (key) => reloaded.clickContentImpression(
    await reloaded.getContentImpressionId(`content-${key}`), { content: `content-${key}` });
  const ctr = () => [...f.impressions.values()].filter(i => i.status === 'clicked').length / f.impressions.size * 100;
  assert.equal(ctr(), 0);
  await click(keys[0]); await click(keys[1]); await click(keys[0]);
  assert.equal(ctr(), 50, 'repeated clicks do not inflate the number of clicked impressions');
  await click(keys[2]); await click(keys[3]);
  assert.equal(ctr(), 100);
  assert.ok(f.requests.some(r => r.method === 'PATCH' && r.path.includes('S1%3Acontent-')));
});

test('real HTTP: the original 401 renewal stores the canonical ID in the renewed session without changing init', async (t) => {
  const f = await fixture(t, { rejectOnce: 401 });
  const first = f.sdk.createContentImpression('page', { content: 'c', target: 't', variantId: 'v' });
  const second = f.sdk.createContentImpression('page-2', { content: 'c' });
  const reading = f.sdk.getContentImpressionId('c');
  assert.equal((await first).impressionId, 'S2:c');
  assert.equal((await second).impressionId, 'S2:c');
  assert.equal(await reading, 'S2:c');
  assert.equal(await f.store.getItem('content-impressions-v1:["project-a","S1","c"]'), null);
  assert.equal(await f.sdk.getContentImpressionId('c'), 'S2:c');
  assert.equal((await f.sdk.createContentImpression('page-3', { content: 'c' })).skipped, true);
  await f.sdk.clickContentImpression(await f.sdk.getContentImpressionId('c'), { content: 'c' });
  assert.equal(f.impressions.size, 1);
  assert.equal(f.impressions.get('S2:c').status, 'clicked');
  assert.equal(f.impressions.get('S2:c').customer, 'customer-a');
  assert.equal(f.requests.filter(r => r.method === 'POST' && r.path === '/personal/impression').length, 2);
});

test('real HTTP: an unsuccessful create can be retried without leaving a cached impression', async (t) => {
  const f = await fixture(t, { rejectOnce: 503 });
  await assert.rejects(f.sdk.createContentImpression('page', { content: 'c' }), /503/);
  assert.equal(await f.sdk.getContentImpressionId('c'), null);
  assert.equal((await f.sdk.createContentImpression('page', { content: 'c' })).impressionId, 'S1:c');
  assert.equal(f.impressions.size, 1);
});
