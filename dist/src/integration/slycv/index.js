import { composePresentationTree } from '../../core/index.js';
import { evaluateRenderFeedback } from '../../feedback/index.js';
import { ChromiumBackend } from '../../renderer-adapter/chromium/index.js';
import { RendererAdapter } from '../../renderer-adapter/index.js';
import { cvFoundationDesignInputs, cvFoundationTemplate } from '../../templates/cv/index.js';
const slot = (id, type, content, items, semantics) => ({ id, type, exists: true, items, count: items.length, content, semantics });
export function adaptSlyCvProducerInput(input) {
    const slots = {
        identity: slot('identity', 'GROUP', input.identity, [], 'producer-supplied identity presentation data'),
        experience: slot('experience', 'ITEM_LIST', null, input.experience, 'producer-supplied experience entries'),
        skills: slot('skills', 'ITEM_LIST', null, input.skills, 'producer-supplied skills'),
    };
    if (input.summary !== undefined)
        slots.summary = slot('summary', 'RICH_TEXT', input.summary, [], 'producer-supplied summary');
    if (input.education !== undefined)
        slots.education = slot('education', 'ITEM_LIST', null, input.education, 'producer-supplied education entries');
    if (input.certifications !== undefined)
        slots.certifications = slot('certifications', 'ITEM_LIST', null, input.certifications, 'producer-supplied certification entries');
    if (input.languages !== undefined)
        slots.languages = slot('languages', 'ITEM_LIST', null, input.languages, 'producer-supplied language entries');
    return {
        document_id: input.documentId,
        contract_version: '1.0.0',
        artifact_kind: 'CV',
        locale: input.locale,
        slots,
        semantic_metadata: { source: 'SlyCV', source_version: input.sourceVersion.version },
        content_lineage: input.lineage,
    };
}
function requestFor(document, input, requestId) {
    return {
        request_id: requestId,
        traceId: `trace-${requestId}`,
        contextId: `context-${input.documentId}`,
        lineage: input.lineage,
        template_id: cvFoundationTemplate.template_id,
        template_version: cvFoundationTemplate.template_version,
        payload: document,
        presentation_contract_version: '1.0.0',
        design_policy_version: cvFoundationDesignInputs.design_policy,
        token_set_version: cvFoundationDesignInputs.token_set,
        token_overrides: {},
        presentation_preferences: {},
        renderer_configuration_ref: { reference: 'chromium-headless-v1', version: '1.0.0' },
    };
}
function feedbackResultForFixture(result, input) {
    if (result.measurements === null)
        return result;
    if (input.constraintFixture) {
        const identity = result.measurements.slot_bounds.find((slotBounds) => slotBounds.slot_id === 'identity');
        const measuredValue = identity?.bounds.height ?? 0;
        return { ...result, measurements: { ...result.measurements, constraint_measurements: [{ constraint_id: 'identity-max-height', allowed_boundary: 100, measured_value: measuredValue }] } };
    }
    return { ...result, measurements: { ...result.measurements, constraint_measurements: [] } };
}
export async function renderSlyCvEndToEnd(input, chromiumConfiguration, requestId = `render-${input.documentId}`) {
    const document = adaptSlyCvProducerInput(input);
    const request = requestFor(document, input, requestId);
    const tree = composePresentationTree(request, cvFoundationTemplate, cvFoundationDesignInputs);
    const backend = new ChromiumBackend(chromiumConfiguration);
    const adapter = new RendererAdapter(backend, { rendererId: chromiumConfiguration.rendererId, rendererVersion: chromiumConfiguration.rendererVersion });
    const rawRender = await adapter.render({
        tree,
        request_id: request.request_id,
        traceId: request.traceId,
        contextId: request.contextId,
        lineage: request.lineage,
        presentationContractVersion: request.presentation_contract_version,
        templateId: request.template_id,
        templateVersion: request.template_version,
        designPolicyVersion: request.design_policy_version,
        tokenSetVersion: request.token_set_version,
        timeoutMs: chromiumConfiguration.timeoutMs,
    });
    const render = feedbackResultForFixture(rawRender, input);
    const context = { presentationRunId: `run-${input.documentId}`, attempt: 1, createdAt: '2026-09-09T00:00:00.000Z' };
    return { input, document, request, tree, render, feedback: evaluateRenderFeedback(render, context) };
}
export function createCvFixture(id) {
    const definitions = {
        CV_SHORT: { name: 'Ada Martin', title: 'Product Designer', summary: 'Design systems, accessible interfaces and clear product narratives.', experienceCount: 2, skillCount: 6, educationCount: 1, paragraphs: 1 },
        CV_STANDARD: { name: 'Thomas Bernard', title: 'Software Architect', summary: 'Platform architecture, resilient services and pragmatic technical leadership.', experienceCount: 5, skillCount: 12, educationCount: 2, paragraphs: 3 },
        CV_DENSE: { name: 'Nadia Dupont', title: 'Programme Director', summary: 'Complex programme delivery across regulated environments and distributed teams.', experienceCount: 8, skillCount: 24, educationCount: 4, paragraphs: 5 },
        CV_OVERFLOW: { name: 'Victor Morel', title: 'Transformation Lead', summary: 'A deliberately extreme content volume used to verify bounded overflow diagnostics.', experienceCount: 18, skillCount: 48, educationCount: 8, paragraphs: 10 },
        CV_UNICODE: { name: 'Zoë Łucas — 李明', title: 'Ingénieur données / Data Engineer', summary: 'Éléments accentués, ligatures, emoji contrôlé et caractères non latins : à mesurer sans substitution silencieuse.', experienceCount: 3, skillCount: 10, educationCount: 2, paragraphs: 2, unicode: true },
        CV_CONSTRAINT_VIOLATION: { name: 'Samir Petit', title: 'Consultant conformité', summary: 'Fixture designed to exercise a measurable content-area constraint.', experienceCount: 6, skillCount: 16, educationCount: 2, paragraphs: 4, constraint: true },
    };
    const definition = definitions[id];
    if (definition === undefined)
        throw new Error(`Unknown CV fixture ${id}`);
    const experience = Array.from({ length: definition.experienceCount }, (_, index) => ({ role: `${definition.title} ${index + 1}`, employer: `Organisation ${index + 1}`, description: Array.from({ length: definition.paragraphs }, (_, paragraph) => `Preserved delivery detail ${index + 1}.${paragraph + 1}${definition.unicode ? ' — qualité, données, 李明' : ''}`).join(' ') }));
    const identity = definition.constraint ? { name: definition.name, title: definition.title, details: 'Conformité, audit et gouvernance opérationnelle. '.repeat(5) } : { name: definition.name, title: definition.title };
    const fixture = { documentId: `fixture-${id.toLowerCase()}`, locale: definition.unicode ? 'fr-FR' : 'en-US', sourceVersion: { reference: 'slycv-fixture', version: '1.0.0' }, lineage: [{ source_id: `slycv-${id.toLowerCase()}`, transform_id: 'producer-adapter', version: { reference: 'slycv-producer-contract', version: '1.0.0' } }], identity, summary: definition.summary, experience, skills: Array.from({ length: definition.skillCount }, (_, index) => `Skill ${index + 1}`), education: Array.from({ length: definition.educationCount }, (_, index) => ({ institution: `School ${index + 1}`, qualification: 'Qualification' })) };
    if (definition.constraint)
        return { ...fixture, constraintFixture: true };
    return fixture;
}
//# sourceMappingURL=index.js.map