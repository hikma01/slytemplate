import test from 'node:test';
import assert from 'node:assert/strict';
import {ContractValidationError, type RenderRequest, type TemplateContract} from '../src/contracts/index.js';
import {composePresentationTree, type CoreDesignInputs} from '../src/core/index.js';

const version = {reference: 'test', version: '1.0.0' as const};
const slot = (id: string, content: unknown = `${id}-content`) => ({id, type: 'TEXT' as const, exists: true, items: [], count: 0, content, semantics: id});
const request: RenderRequest = {request_id: 'req-1', traceId: 'trace-1', contextId: 'ctx-1', lineage: [{source_id: 'source-1', transform_id: 'projection-1', version}], template_id: 'cv-1', template_version: '1.0.0', payload: {document_id: 'doc-1', contract_version: '1.0.0', artifact_kind: 'CV', locale: 'fr-FR', slots: {summary: slot('summary'), optional: {...slot('optional'), exists: false, content: null}}, content_lineage: []}, presentation_contract_version: '1.0.0', design_policy_version: version, token_set_version: {reference: 'tokens', version: '1.0.0'}, token_overrides: {accent: 'blue'}, presentation_preferences: {}, renderer_configuration_ref: null};
const template: TemplateContract = {template_id: 'cv-1', template_version: '1.0.0', compatible_contract_versions: ['^1.0.0'], supported_artifact_kind: 'CV', required_slots: [{slot_id: 'summary', slot_type: 'TEXT', allow_empty: false}], optional_slots: [{slot_id: 'optional', slot_type: 'TEXT', allow_empty: true}], unknown_slot_policy: 'REJECT', declared_capabilities: [], slot_mapping: {summary: 'summary-region'}, token_schema: {accent: 'color'}, policy_constraints: ['readability'], presentation_tree_schema: {kind: 'presentation-tree'}};
const inputs: CoreDesignInputs = {token_set: {reference: 'tokens', version: '1.0.0'}, tokens: {accent: 'red'}, design_policy: {reference: 'policy', version: '1.0.0'}, policies: {density: 'standard'}};
const rejects = (fn: () => void, code: string) => assert.throws(fn, (error: unknown) => error instanceof ContractValidationError && error.code === code);

test('composes a deterministic backend-agnostic PresentationTree', () => {
  const first = composePresentationTree(request, template, inputs);
  const second = composePresentationTree(request, template, inputs);
  assert.deepEqual(first, second);
  assert.deepEqual(first.nodes.map((node) => node.slot_reference), ['summary']);
  assert.equal(first.nodes[0]?.content, 'summary-content');
  assert.equal(first.document.traceId, 'trace-1');
  assert.equal(first.document.contextId, 'ctx-1');
});

test('rejects a required slot that is absent', () => { const invalid = {...request, payload: {...request.payload, slots: {}}}; rejects(() => composePresentationTree(invalid, template, inputs), 'REQUIRED_SLOT_MISSING'); });
test('rejects an unknown slot', () => { const invalid = {...request, payload: {...request.payload, slots: {...request.payload.slots, extra: slot('extra')}}}; rejects(() => composePresentationTree(invalid, template, inputs), 'UNKNOWN_SLOT'); });
test('rejects an incompatible slot type', () => { const invalid = {...request, payload: {...request.payload, slots: {...request.payload.slots, summary: {...slot('summary'), type: 'GROUP' as const}}}}; rejects(() => composePresentationTree(invalid, template, inputs), 'INCOMPATIBLE_SLOT_TYPE'); });
test('rejects an undeclared token override', () => { const invalid = {...request, token_overrides: {unknown: true}}; rejects(() => composePresentationTree(invalid, template, inputs), 'UNKNOWN_TOKEN'); });
test('rejects a template contract version outside its range', () => { const invalid = {...request, presentation_contract_version: '2.0.0' as const}; rejects(() => composePresentationTree(invalid, template, inputs), 'INCOMPATIBLE_CONTRACT_VERSION'); });
test('preserves semantic content without rewriting or truncating it', () => { const content = {text: 'Do not rewrite', source: 'source-1'}; const input = {...request, payload: {...request.payload, slots: {...request.payload.slots, summary: {...slot('summary', content)}}}}; const tree = composePresentationTree(input, template, inputs); assert.deepEqual(tree.nodes[0]?.content, content); });
