const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadSDK } = require('./helpers/load-sdk.cjs');

// Fake of the modular API that @react-native-firebase/messaging exports from its root.
function messagingModule() {
  const calls = [];
  const instance = { name: 'messaging' };
  const record = (name, result) => (...args) => {
    calls.push([name, ...args]);
    return result;
  };
  return {
    calls,
    instance,
    module: {
      getMessaging: record('getMessaging', instance),
      registerDeviceForRemoteMessages: record('registerDeviceForRemoteMessages', Promise.resolve()),
      getToken: record('getToken', Promise.resolve('fcm-token')),
      onMessage: record('onMessage', 'unsubscribe-message'),
      onNotificationOpenedApp: record('onNotificationOpenedApp', 'unsubscribe-opened'),
      getInitialNotification: record('getInitialNotification', Promise.resolve({ data: { page: 'cart' } })),
    },
  };
}

async function sdkWith(requireImpl) {
  const requested = [];
  const { sdk } = await loadSDK({
    api: {},
    globals: {
      require(name) {
        requested.push(name);
        return requireImpl(name);
      },
    },
  });
  return { sdk, requested };
}

test('loads the package root, which exports the modular API in every supported version', async () => {
  const fake = messagingModule();
  const { sdk, requested } = await sdkWith(() => fake.module);

  assert.equal(sdk.getMessagingModule(), fake.module);
  assert.deepEqual(requested, ['@react-native-firebase/messaging']);
});

test('messaging helpers use the modular API with the messaging instance', async () => {
  const fake = messagingModule();
  const { sdk } = await sdkWith(() => fake.module);
  const callback = () => {};

  await sdk.initializeFirebase();
  assert.equal(await sdk.getFirebaseToken(), 'fcm-token');
  assert.equal(sdk.onMessage(callback), 'unsubscribe-message');
  assert.equal(sdk.onNotificationOpenedApp(callback), 'unsubscribe-opened');
  assert.deepEqual(await sdk.getInitialNotification(), { data: { page: 'cart' } });

  const used = fake.calls.filter(([name]) => name !== 'getMessaging');
  assert.deepEqual(
    used.map(([name]) => name),
    ['registerDeviceForRemoteMessages', 'getToken', 'onMessage', 'onNotificationOpenedApp', 'getInitialNotification']
  );
  assert.ok(used.every(([, messaging]) => messaging === fake.instance));
  assert.equal(fake.calls.find(([name]) => name === 'onMessage')[2], callback);
});

test('without @react-native-firebase/messaging the helpers degrade to no-ops', async () => {
  const { sdk } = await sdkWith((name) => {
    throw new Error(`Cannot find module '${name}'`);
  });

  assert.equal(sdk.getMessagingModule(), null);
  assert.equal(await sdk.initializeFirebase(), undefined);
  assert.equal(await sdk.getFirebaseToken(), undefined);
  assert.equal(typeof sdk.onMessage(() => {}), 'function');
  assert.equal(typeof sdk.onNotificationOpenedApp(() => {}), 'function');
  assert.equal(await sdk.getInitialNotification(), null);
});
