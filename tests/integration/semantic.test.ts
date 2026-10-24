import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCandidateSlots, canonicalSlotsFromProjection} from '../../src/integration/semantic/index.js';
import {cvFoundationTemplate} from '../../src/templates/cv/index.js';
import {cvFoundationPackage} from '../../src/templates/cv/index.js';
import {bindCanonicalSlotsToSelectedTemplate, TemplateRegistry, selectTemplateManually} from '../../src/downstream/index.js';

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

test('binds CandidateSlots and CanonicalSlots to an explicit selected package', () => {
  const candidate = buildCandidateSlots(cvFoundationTemplate, {experience: 'Role'}, {lineage: [{source_id: 'template-test', transform_id: 'candidate-slots', version: {reference: 'test', version: '1.0.0'}}]});
  const canonical = canonicalSlotsFromProjection({contract: 'SemanticTransverseRuntimeProjection', contractVersion: '1.0.0', status: 'CONNECTED', registry: {schema: 'semantic_transverse', version: '1.0.16', sourceOfTruth: true}, candidateSlots: {count: 1, resolutions: [{slotId: candidate.slots[0]?.slotId, resolution: {status: 'EXACT_MATCH', canonicalId: 'professional.experience.role'}}]}});
  const registry = new TemplateRegistry().register(cvFoundationPackage);
  const selected = selectTemplateManually(registry, cvFoundationPackage.packageId, cvFoundationPackage.packageVersion, 'integration-test', 'semantic-replay', '2026-09-20T00:00:00.000Z', candidate.slots[0]?.lineage ?? []);
  const bound = bindCanonicalSlotsToSelectedTemplate(selected, cvFoundationPackage, canonical, candidate.slots[0]?.lineage ?? []);
  assert.equal(bound.templateId, cvFoundationTemplate.template_id);
  assert.equal((bound.slots[0]?.resolution as {canonicalId: string}).canonicalId, 'professional.experience.role');
});
