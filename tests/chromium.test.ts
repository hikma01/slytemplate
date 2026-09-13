import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import type {PresentationTree} from '../src/contracts/index.js';
import {RendererAdapter} from '../src/renderer-adapter/index.js';
import {ChromiumBackend} from '../src/renderer-adapter/chromium/index.js';

const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const version = {reference: 'test', version: '1.0.0' as const};
const tree: PresentationTree = {document: {document_id: 'chromium-doc'}, pages: [], nodes: [{slot_reference: 'identity', visual_role: 'identity', content: 'Zoë Łucas — 李明'}], applied_template: version, applied_tokens: version, diagnostics: []};
const request = {tree, request_id: 'chromium-request', traceId: 'trace-chromium', contextId: 'context-chromium', lineage: [], presentationContractVersion: '1.0.0' as const, templateId: 'cv-foundation-01', templateVersion: '1.0.0' as const, designPolicyVersion: version, tokenSetVersion: version, timeoutMs: 15000};

test('renders a real PDF through Chromium and reports measurements', {skip: !existsSync(executablePath)}, async () => {
  const backend = new ChromiumBackend({executablePath, rendererId: 'chromium-headless', rendererVersion: '152.0.0', locale: 'en-US', timezoneId: 'UTC', deviceScaleFactor: 1, width: 794, height: 1123, timeoutMs: 15000});
  const result = await new RendererAdapter(backend, {rendererId: 'chromium-headless', rendererVersion: '152.0.0'}).render(request);
  assert.equal(result.failure, null);
  assert.equal(result.artifact?.media_type, 'application/pdf');
  assert.equal(String.fromCharCode(...(result.artifact?.bytes.slice(0, 4) ?? [])), '%PDF');
  assert.equal(result.measurements?.page_count, 1);
  assert.equal(result.measurements?.slot_bounds[0]?.slot_id, 'identity');
});

test('produces functionally equivalent repeated Chromium measurements', {skip: !existsSync(executablePath)}, async () => {
  const configuration = {executablePath, rendererId: 'chromium-headless', rendererVersion: '152.0.0' as const, locale: 'en-US', timezoneId: 'UTC', deviceScaleFactor: 1, width: 794, height: 1123, timeoutMs: 15000};
  const first = await new RendererAdapter(new ChromiumBackend(configuration), {rendererId: 'chromium-headless', rendererVersion: '152.0.0'}).render(request);
  const second = await new RendererAdapter(new ChromiumBackend(configuration), {rendererId: 'chromium-headless', rendererVersion: '152.0.0'}).render(request);
  assert.equal(first.failure, null);
  assert.equal(second.failure, null);
  assert.deepEqual(first.measurements, second.measurements);
});
