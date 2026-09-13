export const cvFoundationTemplate = {
    template_id: 'cv-foundation-01',
    template_version: '1.0.0',
    compatible_contract_versions: ['^1.0.0'],
    supported_artifact_kind: 'CV',
    required_slots: [
        { slot_id: 'identity', slot_type: 'GROUP', allow_empty: false },
        { slot_id: 'experience', slot_type: 'ITEM_LIST', allow_empty: false },
        { slot_id: 'skills', slot_type: 'ITEM_LIST', allow_empty: false },
    ],
    optional_slots: [
        { slot_id: 'summary', slot_type: 'RICH_TEXT', allow_empty: true },
        { slot_id: 'education', slot_type: 'ITEM_LIST', allow_empty: true },
        { slot_id: 'certifications', slot_type: 'ITEM_LIST', allow_empty: true },
        { slot_id: 'languages', slot_type: 'ITEM_LIST', allow_empty: true },
    ],
    unknown_slot_policy: 'REJECT',
    declared_capabilities: ['cv-foundation-layout'],
    slot_mapping: {
        identity: 'identity',
        summary: 'summary',
        experience: 'experience',
        skills: 'skills',
        education: 'education',
        certifications: 'certifications',
        languages: 'languages',
    },
    token_schema: {
        accent: 'presentation-color-token',
        heading: 'presentation-typography-token',
        spacing: 'presentation-spacing-token',
    },
    policy_constraints: ['cv-readable-density', 'cv-declared-slot-order'],
    presentation_tree_schema: {
        schema_id: 'cv-foundation-tree',
        schema_version: '1.0.0',
        ordering: ['identity', 'summary', 'experience', 'skills', 'education', 'certifications', 'languages'],
    },
};
export const cvFoundationDesignInputs = {
    token_set: { reference: 'cv-foundation-tokens', version: '1.0.0' },
    tokens: {
        accent: 'slate',
        heading: 'compact-heading',
        spacing: 'standard',
    },
    design_policy: { reference: 'cv-foundation-policies', version: '1.0.0' },
    policies: {
        density: 'readable',
        preserve_declared_slot_order: true,
    },
};
//# sourceMappingURL=foundation.js.map