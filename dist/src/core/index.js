import { ContractValidationError, validateRenderRequest, validateTemplateContract, } from '../contracts/index.js';
const semVerPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const fail = (code, message) => { throw new ContractValidationError(code, message); };
function parseVersion(value) {
    if (!semVerPattern.test(value))
        fail('INVALID_VERSION', `invalid version ${value}`);
    const components = value.split('.').map(Number);
    return [components[0], components[1], components[2]];
}
function isCompatible(version, ranges) {
    const actual = parseVersion(version);
    return ranges.some((range) => {
        const normalized = range.trim();
        if (semVerPattern.test(normalized))
            return normalized === version;
        const operator = normalized[0];
        const candidate = operator === '^' || operator === '~' ? normalized.slice(1) : normalized;
        if (!semVerPattern.test(candidate))
            return false;
        const expected = parseVersion(candidate);
        if (operator === '^')
            return actual[0] === expected[0] && actual[1] >= expected[1];
        if (operator === '~')
            return actual[0] === expected[0] && actual[1] === expected[1] && actual[2] >= expected[2];
        return false;
    });
}
function declarations(template) {
    return [...template.required_slots, ...template.optional_slots];
}
function assertDesignInputs(inputs) {
    if (!nonEmpty(inputs.token_set.reference) || !semVerPattern.test(inputs.token_set.version))
        fail('INVALID_DESIGN_INPUTS', 'token_set must be a versioned reference');
    if (!nonEmpty(inputs.design_policy.reference) || !semVerPattern.test(inputs.design_policy.version))
        fail('INVALID_DESIGN_INPUTS', 'design_policy must be a versioned reference');
    for (const key of Object.keys(inputs.tokens))
        if (!nonEmpty(key))
            fail('INVALID_TOKEN', 'token names must be non-empty');
    for (const key of Object.keys(inputs.policies ?? {}))
        if (!nonEmpty(key))
            fail('INVALID_POLICY', 'policy names must be non-empty');
}
function resolveTokens(request, template, inputs) {
    const knownTokens = new Set(Object.keys(template.token_schema));
    const resolved = {};
    for (const [key, value] of Object.entries(inputs.tokens)) {
        if (!knownTokens.has(key))
            fail('UNKNOWN_TOKEN', `token ${key} is not declared by the template`);
        resolved[key] = value;
    }
    for (const [key, value] of Object.entries(request.token_overrides)) {
        if (!knownTokens.has(key))
            fail('UNKNOWN_TOKEN', `token override ${key} is not declared by the template`);
        resolved[key] = value;
    }
    return resolved;
}
function slotFor(request, declaration) {
    return request.payload.slots[declaration.slot_id];
}
function validateSlotForDeclaration(request, declaration, required) {
    const slot = slotFor(request, declaration);
    if (slot === undefined || !slot.exists) {
        if (required)
            fail('REQUIRED_SLOT_MISSING', `required slot ${declaration.slot_id} is missing`);
        return undefined;
    }
    if (slot.type !== declaration.slot_type)
        fail('INCOMPATIBLE_SLOT_TYPE', `slot ${declaration.slot_id} has type ${slot.type}, expected ${declaration.slot_type}`);
    if (!declaration.allow_empty && ((slot.type === 'ITEM_LIST' && slot.items.length === 0) || (slot.type !== 'ITEM_LIST' && slot.content === null))) {
        fail('EMPTY_COLLECTION', `slot ${declaration.slot_id} cannot be empty`);
    }
    return slot;
}
function assertKnownSlots(request, template) {
    const known = new Set(declarations(template).map((declaration) => declaration.slot_id));
    for (const slotId of Object.keys(request.payload.slots))
        if (!known.has(slotId))
            fail('UNKNOWN_SLOT', `slot ${slotId} is not declared by the template`);
}
export function composePresentationTree(request, template, inputs) {
    validateRenderRequest(request);
    validateTemplateContract(template);
    assertDesignInputs(inputs);
    if (request.template_id !== template.template_id)
        fail('TEMPLATE_MISMATCH', 'request template does not match the supplied contract');
    if (!isCompatible(request.presentation_contract_version, template.compatible_contract_versions))
        fail('INCOMPATIBLE_CONTRACT_VERSION', 'template does not support the presentation contract version');
    assertKnownSlots(request, template);
    const resolvedTokens = resolveTokens(request, template, inputs);
    const nodes = [];
    for (const declaration of template.required_slots) {
        const slot = validateSlotForDeclaration(request, declaration, true);
        if (slot !== undefined)
            nodes.push({ slot_reference: declaration.slot_id, visual_role: template.slot_mapping[declaration.slot_id] ?? declaration.slot_id, slot_type: slot.type, content: slot.content, items: slot.items, semantics: slot.semantics });
    }
    for (const declaration of template.optional_slots) {
        const slot = validateSlotForDeclaration(request, declaration, false);
        if (slot !== undefined)
            nodes.push({ slot_reference: declaration.slot_id, visual_role: template.slot_mapping[declaration.slot_id] ?? declaration.slot_id, slot_type: slot.type, content: slot.content, items: slot.items, semantics: slot.semantics });
    }
    return {
        document: {
            document_id: request.payload.document_id,
            artifact_kind: request.payload.artifact_kind,
            locale: request.payload.locale,
            contract_version: request.payload.contract_version,
            request_id: request.request_id,
            traceId: request.traceId,
            contextId: request.contextId,
            lineage: request.lineage,
            policies: inputs.policies ?? {},
            policy_constraints: template.policy_constraints,
            tokens: resolvedTokens,
        },
        pages: [],
        nodes,
        applied_template: { reference: template.template_id, version: template.template_version },
        applied_tokens: inputs.token_set,
        diagnostics: [],
    };
}
//# sourceMappingURL=index.js.map