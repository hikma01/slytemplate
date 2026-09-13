export type SemVer = `${number}.${number}.${number}`;
export type SemVerRange = string;
export type ArtifactKind = 'CV';
export type SlotType = 'TEXT' | 'RICH_TEXT' | 'ITEM_LIST' | 'MEDIA' | 'GROUP';
export type FeedbackStatus = 'RENDER_REQUESTED' | 'RENDERING' | 'FIT' | 'FIT_WITH_DENSITY_ADJUSTMENT' | 'OVERFLOW' | 'CONSTRAINT_VIOLATION' | 'RENDER_FAILED' | 'FIT_FAILED_UNRESOLVABLE';
export type DiagnosticType = 'OVERFLOW' | 'CONSTRAINT_VIOLATION' | 'RENDER_FAILED' | 'RECONCILIATION';
export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'FATAL';
export type SlotScope = 'SLOT' | 'SECTION' | 'DOCUMENT';
export type ReductionWeight = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
export interface ImmutableVersionRef {
    readonly reference: string;
    readonly version: SemVer;
}
export interface LineageEntry {
    readonly source_id: string;
    readonly transform_id: string | null;
    readonly version: ImmutableVersionRef;
}
export type MetadataScalar = string | number | boolean;
export type MetadataValue = MetadataScalar | readonly MetadataScalar[];
export type MetadataObject = Readonly<Record<string, MetadataValue>>;
export interface Slot<TContent = unknown> {
    readonly id: string;
    readonly type: SlotType;
    readonly exists: boolean;
    readonly items: readonly unknown[];
    readonly count: number;
    readonly content: TContent | null;
    readonly semantics: string;
}
export type SlotMap = Readonly<Record<string, Slot>>;
export interface PresentationDocumentDTO<TSlotMap extends SlotMap = SlotMap> {
    readonly document_id: string;
    readonly contract_version: SemVer;
    readonly artifact_kind: ArtifactKind;
    readonly locale: string;
    readonly slots: TSlotMap;
    readonly semantic_metadata?: MetadataObject;
    readonly content_lineage: readonly LineageEntry[];
}
export interface PresentationPreferences {
    readonly [key: string]: string | number | boolean;
}
export interface RenderRequest<TSlotMap extends SlotMap = SlotMap> {
    readonly request_id: string;
    readonly traceId: string;
    readonly contextId: string;
    readonly lineage: readonly LineageEntry[];
    readonly template_id: string;
    readonly template_version: SemVer;
    readonly payload: PresentationDocumentDTO<TSlotMap>;
    readonly presentation_contract_version: SemVer;
    readonly design_policy_version: ImmutableVersionRef;
    readonly token_set_version: ImmutableVersionRef;
    readonly token_overrides: Readonly<Record<string, string | number | boolean>>;
    readonly presentation_preferences: PresentationPreferences;
    readonly renderer_configuration_ref: ImmutableVersionRef | null;
}
export interface SlotDeclaration {
    readonly slot_id: string;
    readonly slot_type: SlotType;
    readonly allow_empty: boolean;
}
export interface TemplateContract {
    readonly template_id: string;
    readonly template_version: SemVer;
    readonly compatible_contract_versions: readonly SemVerRange[];
    readonly supported_artifact_kind: ArtifactKind;
    readonly required_slots: readonly SlotDeclaration[];
    readonly optional_slots: readonly SlotDeclaration[];
    readonly unknown_slot_policy: 'REJECT';
    readonly declared_capabilities: readonly string[];
    readonly slot_mapping: Readonly<Record<string, string>>;
    readonly token_schema: Readonly<Record<string, string>>;
    readonly policy_constraints: readonly string[];
    readonly presentation_tree_schema: Readonly<Record<string, unknown>>;
}
export interface Bounds {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}
export interface SlotBounds {
    readonly slot_id: string;
    readonly bounds: Bounds;
}
export interface ConstraintMeasurement {
    readonly constraint_id: string;
    readonly allowed_boundary: number;
    readonly measured_value: number;
}
export interface RenderMeasurements {
    readonly page_count: number;
    readonly page_bounds: readonly Bounds[];
    readonly content_bounds: Bounds | null;
    readonly slot_bounds: readonly SlotBounds[];
    readonly overflow_height: number | null;
    readonly overflow_width: number | null;
    readonly affected_regions: readonly string[];
    readonly constraint_measurements: readonly ConstraintMeasurement[];
}
export interface PresentationTree {
    readonly document: Readonly<Record<string, unknown>>;
    readonly pages: readonly Readonly<Record<string, unknown>>[];
    readonly nodes: readonly Readonly<Record<string, unknown>>[];
    readonly applied_template: ImmutableVersionRef;
    readonly applied_tokens: ImmutableVersionRef;
    readonly diagnostics: readonly Diagnostic[];
}
export interface RenderArtifact {
    readonly artifact_id: string;
    readonly media_type: 'application/pdf';
    readonly bytes: Uint8Array;
}
export interface DiagnosticBase {
    readonly diagnostic_id: string;
    readonly diagnostic_type: DiagnosticType;
    readonly severity: Severity;
    readonly message_code: string;
}
export interface OverflowDiagnostic extends DiagnosticBase {
    readonly diagnostic_type: 'OVERFLOW';
    readonly slot_id: string | null;
    readonly scope: SlotScope;
    readonly overflow_ratio: number;
    readonly overflow_height_ratio: number | null;
    readonly overflow_width_ratio: number | null;
    readonly suggested_reduction_weight: ReductionWeight;
    readonly constraint_ids: readonly string[];
}
export interface ConstraintViolationDiagnostic extends DiagnosticBase {
    readonly diagnostic_type: 'CONSTRAINT_VIOLATION';
    readonly constraint_id: string;
    readonly constraint_type: string;
    readonly target: string;
    readonly measured_value: string | number | boolean | null;
    readonly allowed_boundary: string | number | boolean | readonly string[];
}
export interface RenderFailureDiagnostic extends DiagnosticBase {
    readonly diagnostic_type: 'RENDER_FAILED';
    readonly failure_code: string;
    readonly renderer_stage: string;
    readonly retryable: boolean;
    readonly sanitized_message: string;
}
export interface ReconciliationDiagnostic extends DiagnosticBase {
    readonly diagnostic_type: 'RECONCILIATION';
    readonly reason: string;
}
export type Diagnostic = OverflowDiagnostic | ConstraintViolationDiagnostic | RenderFailureDiagnostic | ReconciliationDiagnostic;
export interface RenderFeedback {
    readonly request_id: string;
    readonly presentation_run_id: string;
    readonly traceId: string;
    readonly contextId: string;
    readonly lineage: readonly LineageEntry[];
    readonly status: FeedbackStatus;
    readonly presentationContractVersion: SemVer;
    readonly templateId: string;
    readonly templateVersion: SemVer;
    readonly designPolicyVersion: ImmutableVersionRef;
    readonly tokenSetVersion: ImmutableVersionRef;
    readonly rendererId: string | null;
    readonly rendererVersion: SemVer | null;
    readonly diagnostics: readonly Diagnostic[];
    readonly attempt: number;
    readonly createdAt: string;
}
export declare class ContractValidationError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
export declare function assertSemVer(value: unknown, field?: string): asserts value is SemVer;
export declare function validatePresentationDocument(value: unknown): asserts value is PresentationDocumentDTO;
export declare function validateRenderRequest(value: unknown): asserts value is RenderRequest;
export declare function validateTemplateContract(value: unknown): asserts value is TemplateContract;
export declare function validateRenderFeedback(value: unknown): asserts value is RenderFeedback;
//# sourceMappingURL=index.d.ts.map