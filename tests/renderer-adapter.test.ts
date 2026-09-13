import test from 'node:test';
import assert from 'node:assert/strict';
import type {RenderArtifact, RenderMeasurements, PresentationTree} from '../src/contracts/index.js';
import {RendererAdapter, type BackendFailure, type BackendRenderInput, type BackendRenderSuccess, type RendererBackendPort, type RendererBackendSession} from '../src/renderer-adapter/index.js';

const version = {reference: 'test', version: '1.0.0' as const};
const tree: PresentationTree = {document: {document_id: 'doc-1'}, pages: [], nodes: [], applied_template: version, applied_tokens: version, diagnostics: []};
const measurements: RenderMeasurements = {page_count: 1, page_bounds: [], content_bounds: null, slot_bounds: [], overflow_height: null, overflow_width: null, affected_regions: [], constraint_measurements: []};
const artifact: RenderArtifact = {artifact_id: 'artifact-1', media_type: 'application/pdf', bytes: new Uint8Array([1, 2, 3])};
const request = {tree, request_id: 'request-1', traceId: 'trace-1', contextId: 'context-1', lineage: [], presentationContractVersion: '1.0.0' as const, templateId: 'template-1', templateVersion: '1.0.0' as const, designPolicyVersion: version, tokenSetVersion: version, timeoutMs: 100};
const backendSuccess: BackendRenderSuccess = {artifact, measurements: {pageCount: 1, pageBounds: [], contentBounds: null, slotBounds: [], overflowHeight: null, overflowWidth: null, affectedRegions: [], constraintMeasurements: []}};

class FakeSession implements RendererBackendSession {
  public closed = false;
  public constructor(private readonly outcome: Promise<BackendRenderSuccess>) {}
  public render(_input: BackendRenderInput): Promise<BackendRenderSuccess> { return this.outcome; }
  public async close(): Promise<void> { this.closed = true; }
}

class FakeBackend implements RendererBackendPort {
  public session: FakeSession | undefined;
  public constructor(private readonly outcome: Promise<BackendRenderSuccess>, private readonly openFailure = false) {}
  public async open(): Promise<RendererBackendSession> { if (this.openFailure) throw new Error('unavailable'); this.session = new FakeSession(this.outcome); return this.session; }
}

const adapter = (backend: RendererBackendPort) => new RendererAdapter(backend, {rendererId: 'fake-renderer', rendererVersion: '1.0.0'});

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
  const failure: BackendFailure = {code: 'TARGET_CLOSED', stage: 'SERIALIZATION', retryable: true, message: '/private/path and secret'};
  const backend = new FakeBackend(Promise.reject(failure));
  const result = await adapter(backend).render(request);
  assert.deepEqual(result.failure, {code: 'BACKEND_FAILURE', stage: 'SERIALIZATION', retryable: true, message: 'Renderer backend failed during a governed operation'});
  assert.equal(backend.session?.closed, true);
});

test('normalizes backend unavailable', async () => {
  const result = await adapter(new FakeBackend(Promise.resolve(backendSuccess), true)).render(request);
  assert.equal(result.failure?.code, 'BACKEND_UNAVAILABLE');
  assert.equal(result.failure?.stage, 'OPEN');
});

test('bounds backend timeout and closes the session', async () => {
  const pending = new Promise<typeof backendSuccess>(() => undefined);
  const backend = new FakeBackend(pending);
  const result = await adapter(backend).render({...request, timeoutMs: 5});
  assert.equal(result.failure?.code, 'BACKEND_TIMEOUT');
  assert.equal(backend.session?.closed, true);
});

test('keeps the adapter backend interchangeable', async () => {
  const first = await adapter(new FakeBackend(Promise.resolve(backendSuccess))).render(request);
  const second = await adapter(new FakeBackend(Promise.resolve({...backendSuccess, artifact: null}))).render(request);
  assert.equal(first.measurements?.page_count, second.measurements?.page_count);
  assert.notEqual(first.artifact, second.artifact);
});
