import assert from 'node:assert/strict';
import test from 'node:test';
import {bindCanonicalSlotsToSelectedTemplate, TemplateRegistry, selectTemplateManually} from '../src/downstream/index.js';
import {cvFoundationPackage} from '../src/templates/cv/index.js';

const lineage = [{source_id: 'test-source', transform_id: 'test-transform', version: {reference: 'test', version: '1.0.0' as const}}];

test('registers exactly one immutable V1 CV package and selects it manually', () => {
  const registry = new TemplateRegistry().register(cvFoundationPackage);
  assert.equal(registry.list().length, 1);
  const selected = selectTemplateManually(registry, 'cv-foundation-package', '1.0.0', 'qa-user', 'test-harness', '2026-09-20T00:00:00.000Z', lineage);
  assert.equal(selected.selectionMode, 'MANUAL');
  assert.equal(selected.packageVersion, '1.0.0');
  assert.equal(registry.lookup(selected.packageId, selected.packageVersion).availability, 'AVAILABLE');
  assert.equal(Object.isFrozen(registry.lookup(selected.packageId, selected.packageVersion)), true);
  assert.throws(() => registry.register(cvFoundationPackage), (error: unknown) => error instanceof Error && 'code' in error && error.code === 'DUPLICATE_TEMPLATE_PACKAGE');
});

test('binds CanonicalSlots without semantic reinterpretation', () => {
  const registry = new TemplateRegistry().register(cvFoundationPackage);
  const selected = selectTemplateManually(registry, cvFoundationPackage.packageId, cvFoundationPackage.packageVersion, 'qa-user', 'test-harness', '2026-09-20T00:00:00.000Z', lineage);
  const bound = bindCanonicalSlotsToSelectedTemplate(selected, cvFoundationPackage, [
    {slotId: 'experience', resolution: {status: 'EXACT_MATCH', canonicalId: 'professional.experience.role'}},
    {slotId: 'skills', resolution: {status: 'UNKNOWN', canonicalId: null, reason: 'no_exact_or_alias_match'}},
  ]);
  assert.equal(bound.packageId, cvFoundationPackage.packageId);
  assert.deepEqual(bound.slots[1], {slotId: 'skills', resolution: {status: 'UNKNOWN', canonicalId: null, reason: 'no_exact_or_alias_match'}});
  assert.throws(() => bindCanonicalSlotsToSelectedTemplate(selected, cvFoundationPackage, [{slotId: 'not-declared'}]), (error: unknown) => error instanceof Error && 'code' in error && error.code === 'CANONICAL_SLOT_NOT_DECLARED');
});
