export class ContractValidationError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = 'ContractValidationError';
        this.code = code;
    }
}
const semVerPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const bcp47Pattern = /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/;
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const isRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const fail = (code, message) => { throw new ContractValidationError(code, message); };
export function assertSemVer(value, field = 'version') {
    if (typeof value !== 'string' || !semVerPattern.test(value))
        fail('INVALID_VERSION', `${field} must be SemVer 2.0`);
}
function assertVersionRef(value, field) {
    if (!isRecord(value) || !nonEmpty(value.reference))
        fail('INVALID_VERSION_REF', `${field}.reference is required`);
    const record = value;
    assertSemVer(record.version, `${field}.version`);
}
function assertLineage(value, field) {
    if (!Array.isArray(value))
        fail('INVALID_LINEAGE', `${field} must be an array`);
    const entries = value;
    for (const [index, entry] of entries.entries()) {
        if (!isRecord(entry) || !nonEmpty(entry.source_id) || (entry.transform_id !== null && !nonEmpty(entry.transform_id))) {
            fail('INVALID_LINEAGE', `${field}[${index}] has invalid source or transform`);
        }
        assertVersionRef(entry.version, `${field}[${index}].version`);
    }
}
function assertSlot(value, field) {
    if (!isRecord(value) || !nonEmpty(value.id) || typeof value.type !== 'string' || typeof value.exists !== 'boolean' || !Array.isArray(value.items) || !Number.isInteger(value.count) || value.count < 0 || !nonEmpty(value.semantics)) {
        fail('INVALID_SLOT_PAYLOAD', `${field} is not a valid slot`);
    }
    const record = value;
    if (!['TEXT', 'RICH_TEXT', 'ITEM_LIST', 'MEDIA', 'GROUP'].includes(record.type))
        fail('INVALID_SLOT_TYPE', `${field}.type is invalid`);
    if (record.type === 'ITEM_LIST' && record.count !== record.items.length)
        fail('INVALID_SLOT_PAYLOAD', `${field}.count must match items length`);
    if (record.content === undefined)
        fail('INVALID_SLOT_PAYLOAD', `${field}.content must be present`);
}
export function validatePresentationDocument(value) {
    if (!isRecord(value) || !nonEmpty(value.document_id) || value.artifact_kind !== 'CV' || !nonEmpty(value.locale) || !isRecord(value.slots) || !('content_lineage' in value))
        fail('INVALID_PRESENTATION_DOCUMENT', 'required PresentationDocumentDTO fields are missing');
    const record = value;
    assertSemVer(record.contract_version, 'contract_version');
    if (!bcp47Pattern.test(record.locale))
        fail('INVALID_LOCALE', 'locale must be a BCP 47 tag');
    assertLineage(record.content_lineage, 'content_lineage');
    for (const [slotId, slot] of Object.entries(record.slots))
        assertSlot(slot, `slots.${slotId}`);
    if (record.semantic_metadata !== undefined && !isRecord(record.semantic_metadata))
        fail('INVALID_METADATA', 'semantic_metadata must be an object');
}
export function validateRenderRequest(value) {
    if (!isRecord(value) || !nonEmpty(value.request_id) || !nonEmpty(value.traceId) || !nonEmpty(value.contextId) || !nonEmpty(value.template_id) || !isRecord(value.payload) || !isRecord(value.design_policy_version) || !isRecord(value.token_set_version) || !isRecord(value.token_overrides) || !isRecord(value.presentation_preferences) || !('renderer_configuration_ref' in value))
        fail('INVALID_RENDER_REQUEST', 'required RenderRequest fields are missing');
    const record = value;
    assertLineage(record.lineage, 'lineage');
    assertSemVer(record.template_version, 'template_version');
    assertSemVer(record.presentation_contract_version, 'presentation_contract_version');
    validatePresentationDocument(record.payload);
    assertVersionRef(record.design_policy_version, 'design_policy_version');
    assertVersionRef(record.token_set_version, 'token_set_version');
    if (record.renderer_configuration_ref !== null)
        assertVersionRef(record.renderer_configuration_ref, 'renderer_configuration_ref');
}
export function validateTemplateContract(value) {
    if (!isRecord(value) || !nonEmpty(value.template_id) || value.supported_artifact_kind !== 'CV' || value.unknown_slot_policy !== 'REJECT' || !Array.isArray(value.compatible_contract_versions) || !Array.isArray(value.required_slots) || !Array.isArray(value.optional_slots) || !Array.isArray(value.declared_capabilities) || !isRecord(value.slot_mapping) || !isRecord(value.token_schema) || !Array.isArray(value.policy_constraints) || !isRecord(value.presentation_tree_schema))
        fail('INVALID_TEMPLATE_CONTRACT', 'required TemplateContract fields are missing');
    const record = value;
    assertSemVer(record.template_version, 'template_version');
    const ids = new Set();
    for (const declaration of [...record.required_slots, ...record.optional_slots]) {
        if (!isRecord(declaration) || !nonEmpty(declaration.slot_id) || typeof declaration.slot_type !== 'string' || typeof declaration.allow_empty !== 'boolean')
            fail('INVALID_SLOT_DECLARATION', 'slot declaration is invalid');
        const declarationRecord = declaration;
        if (ids.has(declarationRecord.slot_id))
            fail('DUPLICATE_SLOT_DECLARATION', declarationRecord.slot_id);
        ids.add(declarationRecord.slot_id);
    }
}
function validateDiagnostic(value) {
    if (!isRecord(value) || !nonEmpty(value.diagnostic_id) || !nonEmpty(value.message_code) || !nonEmpty(value.diagnostic_type) || !nonEmpty(value.severity))
        fail('INVALID_DIAGNOSTIC', 'diagnostic envelope is invalid');
    const record = value;
    if (!['OVERFLOW', 'CONSTRAINT_VIOLATION', 'RENDER_FAILED', 'RECONCILIATION'].includes(record.diagnostic_type))
        fail('INVALID_DIAGNOSTIC', 'diagnostic type is invalid');
}
export function validateRenderFeedback(value) {
    if (!isRecord(value) || !nonEmpty(value.request_id) || !nonEmpty(value.presentation_run_id) || !nonEmpty(value.traceId) || !nonEmpty(value.contextId) || !nonEmpty(value.templateId) || !nonEmpty(value.createdAt) || !Array.isArray(value.diagnostics) || !('rendererId' in value) || !('rendererVersion' in value))
        fail('INVALID_RENDER_FEEDBACK', 'required RenderFeedback fields are missing');
    const record = value;
    assertLineage(record.lineage, 'lineage');
    assertSemVer(record.presentationContractVersion, 'presentationContractVersion');
    assertSemVer(record.templateVersion, 'templateVersion');
    assertVersionRef(record.designPolicyVersion, 'designPolicyVersion');
    assertVersionRef(record.tokenSetVersion, 'tokenSetVersion');
    if (record.rendererVersion !== null)
        assertSemVer(record.rendererVersion, 'rendererVersion');
    if (!Number.isInteger(record.attempt) || record.attempt < 1 || record.attempt > 3)
        fail('INVALID_ATTEMPT', 'attempt must be between 1 and 3');
    if (!['FIT', 'FIT_WITH_DENSITY_ADJUSTMENT', 'OVERFLOW', 'CONSTRAINT_VIOLATION', 'RENDER_FAILED', 'FIT_FAILED_UNRESOLVABLE', 'RENDER_REQUESTED', 'RENDERING'].includes(record.status))
        fail('INVALID_FEEDBACK_STATUS', 'status is invalid');
    if (record.status === 'FIT' && record.diagnostics.length !== 0)
        fail('INVALID_DIAGNOSTICS', 'FIT must have no diagnostics');
    if (['OVERFLOW', 'CONSTRAINT_VIOLATION', 'RENDER_FAILED', 'FIT_FAILED_UNRESOLVABLE'].includes(record.status) && record.diagnostics.length === 0)
        fail('INVALID_DIAGNOSTICS', 'non-fit terminal status requires diagnostics');
    for (const diagnostic of record.diagnostics)
        validateDiagnostic(diagnostic);
    if ((record.rendererId === null) !== (record.rendererVersion === null))
        fail('INVALID_RENDERER_REFERENCE', 'rendererId and rendererVersion nullability must match');
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(record.createdAt))
        fail('INVALID_TIMESTAMP', 'createdAt must be RFC3339 UTC');
}
//# sourceMappingURL=index.js.map