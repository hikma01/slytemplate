import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCandidateSlots, canonicalSlotsFromProjection} from '../../src/integration/semantic/index.js';
import {cvFoundationTemplate} from '../../src/templates/cv/index.js';

test('Template Factory emits explicit CandidateSlots without semantic inference', () => {
  const candidate = buildCandidateSlots(cvFoundationTemplate, {experience: 'Role'}, {
    lineage: [{source_id: 'template:cv-foundation-01', transform_id: 'candidate-slot-adapter', version: {reference: 'slytemplate', version: '1.0.0'}}],
    evidence: [{source: 'template-contract', templateId: cvFoundationTemplate.template_id}],
  });
  assert.equal(candidate.contract, 'CandidateSlots');
  assert.equal(candidate.slots.length, 1);
  assert.equal(candidate.slots[0]?.label, 'Role');
  assert.equal(candidate.slots[0]?.context.domain, 'PROFESSIONAL');
});

test('canonical slot projection preserves unresolved states', () => {
  const slots = canonicalSlotsFromProjection({contract: 'SemanticTransverseRuntimeProjection', contractVersion: '1.0.0', status: 'CONNECTED', registry: {schema: 'semantic_transverse', version: '1.0.0', sourceOfTruth: true}, candidateSlots: {count: 1, resolutions: [{slotId: 'skills', resolution: {status: 'UNKNOWN'}}]}});
  assert.equal(slots[0]?.slotId, 'skills');
  assert.equal((slots[0]?.resolution as {status: string}).status, 'UNKNOWN');
});
