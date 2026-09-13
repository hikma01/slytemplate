import test from 'node:test';
import assert from 'node:assert/strict';
import { ContractValidationError } from '../../src/contracts/index.js';
import { composePresentationTree } from '../../src/core/index.js';
import { cvFoundationDesignInputs, cvFoundationTemplate } from '../../src/templates/cv/index.js';
const version = { reference: 'source', version: '1.0.0' };
const group = (id, content = { label: id }) => ({ id, type: 'GROUP', exists: true, items: [], count: 0, content, semantics: id });
const list = (id, content = [`${id}-item`]) => ({ id, type: 'ITEM_LIST', exists: true, items: content, count: content.length, content, semantics: id });
const richText = (id, content = `${id}-content`) => ({ id, type: 'RICH_TEXT', exists: true, items: [], count: 0, content, semantics: id });
const request = (slots) => ({
    request_id: 'cv-request-1',
    traceId: 'trace-cv-1',
    contextId: 'context-cv-1',
    lineage: [{ source_id: 'source-cv-1', transform_id: 'projection-cv-1', version }],
    template_id: 'cv-foundation-01',
    template_version: '1.0.0',
    payload: { document_id: 'cv-document-1', contract_version: '1.0.0', artifact_kind: 'CV', locale: 'fr-FR', slots, content_lineage: [] },
    presentation_contract_version: '1.0.0',
    design_policy_version: cvFoundationDesignInputs.design_policy,
    token_set_version: cvFoundationDesignInputs.token_set,
    token_overrides: {},
    presentation_preferences: {},
    renderer_configuration_ref: null,
});
const validSlots = () => ({ identity: group('identity'), experience: list('experience'), skills: list('skills'), summary: richText('summary') });
const rejects = (fn, code) => assert.throws(fn, (error) => error instanceof ContractValidationError && error.code === code);
test('composes a valid CV foundation template', () => {
    const tree = composePresentationTree(request(validSlots()), cvFoundationTemplate, cvFoundationDesignInputs);
    assert.deepEqual(tree.nodes.map((node) => node.slot_reference), ['identity', 'experience', 'skills', 'summary']);
    assert.equal(tree.nodes[0]?.visual_role, 'identity');
    assert.deepEqual(tree.document.tokens, cvFoundationDesignInputs.tokens);
    assert.deepEqual(tree.document.policies, cvFoundationDesignInputs.policies);
});
test('accepts an absent optional slot', () => {
    const { summary: _summary, ...slots } = validSlots();
    assert.doesNotThrow(() => composePresentationTree(request(slots), cvFoundationTemplate, cvFoundationDesignInputs));
});
test('rejects a missing required CV slot', () => {
    const { experience: _experience, ...slots } = validSlots();
    rejects(() => composePresentationTree(request(slots), cvFoundationTemplate, cvFoundationDesignInputs), 'REQUIRED_SLOT_MISSING');
});
test('rejects an unknown CV slot', () => rejects(() => composePresentationTree(request({ ...validSlots(), private_score: richText('private_score') }), cvFoundationTemplate, cvFoundationDesignInputs), 'UNKNOWN_SLOT'));
test('rejects an incompatible CV slot type', () => rejects(() => composePresentationTree(request({ ...validSlots(), identity: richText('identity') }), cvFoundationTemplate, cvFoundationDesignInputs), 'INCOMPATIBLE_SLOT_TYPE'));
test('preserves CV content and composes deterministically', () => {
    const original = { name: 'Ada Martin', role: 'Product Designer' };
    const slots = { ...validSlots(), identity: group('identity', original) };
    const first = composePresentationTree(request(slots), cvFoundationTemplate, cvFoundationDesignInputs);
    const second = composePresentationTree(request(slots), cvFoundationTemplate, cvFoundationDesignInputs);
    assert.deepEqual(first, second);
    assert.deepEqual(first.nodes[0]?.content, original);
});
test('does not import or reference SlyCV business logic', () => {
    assert.equal(Object.keys(cvFoundationTemplate).includes('scoring'), false);
    assert.equal(Object.keys(cvFoundationTemplate).includes('selection'), false);
    assert.equal(Object.keys(cvFoundationTemplate).includes('rewrite'), false);
});
//# sourceMappingURL=cv.test.js.map