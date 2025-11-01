const assert = require('assert');

class MockSession {
  constructor() {
    this.controllerUid = null;
    this.controllerName = null;
    this.controlRequest = null;
    this.downtimeActive = false;
    this.resetCount = 0;
  }

  claimHost(uid, name) {
    if (!uid) throw new Error('uid required');
    if (this.controllerUid && this.downtimeActive && this.controllerUid !== uid) {
      return false;
    }
    this.controllerUid = uid;
    this.controllerName = name || null;
    return true;
  }

  startDowntime(uid) {
    if (uid !== this.controllerUid) {
      throw new Error('Only controller can start downtime');
    }
    this.downtimeActive = true;
  }

  requestControl(uid, name) {
    if (this.controlRequest && this.controlRequest.uid !== uid) {
      return false;
    }
    this.controlRequest = {
      uid,
      name: name || null,
      requestedAt: Date.now()
    };
    return true;
  }

  approveRequest(hostUid) {
    if (hostUid !== this.controllerUid) {
      throw new Error('Only current host can approve');
    }
    if (!this.controlRequest) {
      return false;
    }
    const next = this.controlRequest;
    this.controllerUid = next.uid;
    this.controllerName = next.name || null;
    this.controlRequest = null;
    this.downtimeActive = false;
    return true;
  }

  reset() {
    this.controllerUid = null;
    this.controllerName = null;
    this.controlRequest = null;
    this.downtimeActive = false;
    this.resetCount += 1;
  }
}

(function testInitialHostClaim() {
  const session = new MockSession();
  assert.strictEqual(session.claimHost('host-1', 'Alice'), true, 'first host should claim control');
  session.startDowntime('host-1');
  assert.strictEqual(session.claimHost('host-2', 'Bob'), false, 'second host cannot claim during active downtime');
  assert.strictEqual(session.controllerUid, 'host-1');
})();

(function testControlRequestFlow() {
  const session = new MockSession();
  session.claimHost('host-1', 'Alice');
  session.startDowntime('host-1');
  assert.strictEqual(session.requestControl('viewer-1', 'Eve'), true, 'viewer request should register');
  assert.deepStrictEqual(session.controlRequest.uid, 'viewer-1');
  session.downtimeActive = false;
  assert.strictEqual(session.approveRequest('host-1'), true, 'host can approve request');
  assert.strictEqual(session.controllerUid, 'viewer-1');
  assert.strictEqual(session.controlRequest, null);
})();

(function testResetClears() {
  const session = new MockSession();
  session.claimHost('host-1', 'Alice');
  session.requestControl('viewer-2', 'Mallory');
  session.reset();
  assert.strictEqual(session.controllerUid, null);
  assert.strictEqual(session.controlRequest, null);
  assert.strictEqual(session.resetCount, 1);
})();

console.log('✅ Mock host/viewer tests passed');
