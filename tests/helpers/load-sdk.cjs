const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');

function token(sessionId = 'session-a', project = 'project-a', iat = 1) {
  return `header.${Buffer.from(JSON.stringify({ project, sessionId, iat })).toString('base64url')}.signature`;
}

function storage(initial = {}) {
  const items = new Map(Object.entries(initial));
  return {
    items,
    async getItem(key) { return items.get(key) ?? null; },
    async setItem(key, value) { items.set(key, value); },
    async removeItem(key) { items.delete(key); },
  };
}

async function loadSDK({ api, baseURL, store = storage({ 'goPersonalToken-v2': token() }) } = {}) {
  const context = vm.createContext({ console, URLSearchParams, fetch, FormData });
  const modules = new Map();
  const mocks = {
    '@react-native-async-storage/async-storage': { default: store },
    'react-native-get-random-values': {},
    uuid: { v4: randomUUID },
    'react-native': { Platform: { OS: 'ios' }, PermissionsAndroid: {} },
    './ui/showSurveyModal': { showSurveyModal(options) { options.onClose(); } },
    './utils/searchUtils': require('../../src/utils/searchUtils'),
  };
  if (api) {
    mocks['./ApiService'] = { default: api };
  } else {
    const axios = require('axios');
    if (!baseURL || new URL(baseURL).hostname !== '127.0.0.1') throw new Error('HTTP tests require a loopback server');
    mocks.axios = { default: { create: config => axios.create({ ...config, baseURL, proxy: false }) } };
  }

  async function load(file) {
    if (modules.has(file)) return modules.get(file);
    const module = new vm.SourceTextModule(await fs.readFile(file, 'utf8'), { context, identifier: file });
    modules.set(file, module);
    await module.link(async (specifier, parent) => {
      if (Object.hasOwn(mocks, specifier)) {
        const exports = mocks[specifier];
        return new vm.SyntheticModule(Object.keys(exports), function () {
          for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
        }, { context });
      }
      const target = path.resolve(path.dirname(parent.identifier), specifier);
      return load(path.extname(target) ? target : `${target}.js`);
    });
    return module;
  }

  const module = await load(path.resolve(__dirname, '../../src/SDK.js'));
  await module.evaluate();
  return { sdk: module.namespace.default, store, api: api || modules.get(path.resolve(__dirname, '../../src/ApiService.js')).namespace.default };
}

module.exports = { loadSDK, storage, token };
