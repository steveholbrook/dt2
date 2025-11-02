const assert = require('assert');
const StateCore = require('../state-core.js');

(function testFocusStateLifecycle() {
  const state = {};
  const now = new Date('2024-01-01T00:00:00Z');
  const enable = StateCore.ensureFocusState(state, true, { now });
  assert.strictEqual(state.fullscreenMode, true, 'focus should enable fullscreenMode');
  assert.ok(state.fullscreenSince instanceof Date, 'focus should set fullscreenSince');
  assert.strictEqual(enable.changed, true, 'first enable should report change');

  const persistedSince = state.fullscreenSince;
  const secondEnable = StateCore.ensureFocusState(state, true, { now: new Date('2024-01-01T00:05:00Z') });
  assert.strictEqual(secondEnable.changed, false, 'second enable should be idempotent');
  assert.strictEqual(state.fullscreenSince, persistedSince, 'existing since timestamp should persist');

  const disable = StateCore.ensureFocusState(state, false, { now });
  assert.strictEqual(state.fullscreenMode, false, 'focus disable should clear fullscreenMode');
  assert.strictEqual(state.fullscreenSince, null, 'focus disable should clear fullscreenSince');
  assert.strictEqual(disable.changed, true, 'disable should register change');
})();

(function testDarkModeReducer() {
  const state = { darkMode: false };
  const enable = StateCore.ensureDarkMode(state, true);
  assert.strictEqual(state.darkMode, true, 'dark mode enable should set flag');
  assert.strictEqual(enable.changed, true, 'first enable should register change');
  const second = StateCore.ensureDarkMode(state, true);
  assert.strictEqual(second.changed, false, 'second enable should not count as change');
  const disable = StateCore.ensureDarkMode(state, false);
  assert.strictEqual(disable.changed, true, 'disable should register change');
})();

(function testMessagingReducer() {
  const state = { messagesOn: false };
  const enable = StateCore.ensureMessagingState(state, true);
  assert.strictEqual(state.messagesOn, true, 'messages enable should set flag');
  assert.strictEqual(enable.changed, true, 'first enable should count as change');
  const idempotent = StateCore.ensureMessagingState(state, true);
  assert.strictEqual(idempotent.changed, false, 'idempotent enable should not change');
  const disable = StateCore.ensureMessagingState(state, false);
  assert.strictEqual(state.messagesOn, false, 'messages disable should clear flag');
  assert.strictEqual(disable.changed, true, 'disable should register change');
})();

(function testStartDowntimeReducer() {
  const state = {};
  const now = new Date('2024-02-02T12:00:00Z');
  const result = StateCore.startDowntime(state, { now, durationHours: 12 });
  assert.strictEqual(state.downtimeStarted, true, 'downtime start should set started flag');
  assert.strictEqual(state.downtimePaused, false, 'downtime start should clear paused flag');
  assert.strictEqual(state.pauseStartTime, null, 'downtime start should clear pause start');
  assert.strictEqual(state.pausedDuration, 0, 'downtime start should reset paused duration');
  assert.strictEqual(state.downtimeDuration, 12, 'downtime duration should persist provided value');
  assert.ok(state.downtimeStartTime instanceof Date, 'downtime start should set start time');
  assert.strictEqual(state.downtimeStartTime.getTime(), now.getTime(), 'downtime start should use provided timestamp');
  assert.strictEqual(result.durationHours, 12, 'result should echo duration');
})();

console.log('✅ State core reducers passed');
