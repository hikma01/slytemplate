import test from 'node:test';
import assert from 'node:assert/strict';
import { RendererAdapter } from '../src/renderer-adapter/index.js';
const version = { reference: 'test', version: '1.0.0' };
const tree = { document: { document_id: 'doc-1' }, pages: [], nodes: [], applied_template: version, applied_tokens: version, diagnostics: [] };
const measurements = { page_count: 1, page_bounds: [], content_bounds: null, slot_bounds: [], overflow_height: null, overflow_width: null, affected_regions: [], constraint_measurements: [] };
const artifact = { artifact_id: 'artifact-1', media_type: 'application/pdf', bytes: new Uint8Array([1, 2, 3]) };
const request = { tree, request_id: 'request-1', traceId: 'trace-1', contextId: 'context-1', lineage: [], presentationContractVersion: '1.0.0', templateId: 'template-1', templateVersion: '1.0.0', designPolicyVersion: version, tokenSetVersion: version, timeoutMs: 100 };
const backendSuccess = { artifact, measurements: { pageCount: 1, pageBounds: [], contentBounds: null, slotBounds: [], overflowHeight: null, overflowWidth: null, affectedRegions: [], constraintMeasurements: [] } };
class FakeSession {
    outcome;
    closed = false;
    constructor(outcome) {
        this.outcome = outcome;
    }
    render(_input) { return this.outcome; }
    async close() { this.closed = true; }
}
class FakeBackend {
    outcome;
    openFailure;
    session;
    constructor(outcome, openFailure = false) {
        this.outcome = outcome;
        this.openFailure = openFailure;
    }
    async open() { if (this.openFailure)
        throw new Error('unavailable'); this.session = new FakeSession(this.outcome); return this.session; }
}
const adapter = (backend) => new RendererAdapter(backend, { rendererId: 'fake-renderer', rendererVersion: '1.0.0' });
test('maps a valid backend result and propagates trace context and versions', async () => {
    const backend = new FakeBackend(Promise.resolve(backendSuccess));
    const result = await adapter(backend).render(request);
    assert.equal(result.request_id, 'request-1');
    assert.equal(result.traceId, 'trace-1');
    assert.equal(result.contextId, 'context-1');
    assert.deepEqual(result.lineage, []);
    assert.equal(result.rendererId, 'fake-renderer');
    assert.equal(result.artifact?.artifact_id, 'artifact-1');
    assert.equal(result.measurements?.page_count, 1);
    assert.equal(result.failure, null);
    assert.equal(backend.session?.closed, true);
});
test('normalizes raw measurements without exposing backend field names', async () => {
    const backend = new FakeBackend(Promise.resolve(backendSuccess));
    const result = await adapter(backend).render(request);
    assert.deepEqual(Object.keys(result.measurements ?? {}).sort(), ['affected_regions', 'constraint_measurements', 'content_bounds', 'overflow_height', 'overflow_width', 'page_bounds', 'page_count', 'slot_bounds']);
});
test('normalizes backend failures and sanitizes the message', async () => {
    const failure = { code: 'TARGET_CLOSED', stage: 'SERIALIZATION', retryable: true, message: '/private/path and secret' };
    const backend = new FakeBackend(Promise.reject(failure));
    const result = await adapter(backend).render(request);
    assert.deepEqual(result.failure, { code: 'BACKEND_FAILURE', stage: 'SERIALIZATION', retryable: true, message: 'Renderer backend failed during a governed operation' });
    assert.equal(backend.session?.closed, true);
});
test('normalizes backend unavailable', async () => {
    const result = await adapter(new FakeBackend(Promise.resolve(backendSuccess), true)).render(request);
    assert.equal(result.failure?.code, 'BACKEND_UNAVAILABLE');
    assert.equal(result.failure?.stage, 'OPEN');
});
test('bounds backend timeout and closes the session', async () => {
    const pending = new Promise(() => undefined);
    const backend = new FakeBackend(pending);
    const result = await adapter(backend).render({ ...request, timeoutMs: 5 });
    assert.equal(result.failure?.code, 'BACKEND_TIMEOUT');
    assert.equal(backend.session?.closed, true);
});
test('keeps the adapter backend interchangeable', async () => {
    const first = await adapter(new FakeBackend(Promise.resolve(backendSuccess))).render(request);
    const second = await adapter(new FakeBackend(Promise.resolve({ ...backendSuccess, artifact: null }))).render(request);
    assert.equal(first.measurements?.page_count, second.measurements?.page_count);
    assert.notEqual(first.artifact, second.artifact);
});
//# sourceMappingURL=renderer-adapter.test.js.map