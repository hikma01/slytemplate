export type SemVer = `${number}.${number}.${number}`;
export type SemVerRange = string;
export type ArtifactKind = 'CV';
export type SlotType = 'TEXT' | 'RICH_TEXT' | 'ITEM_LIST' | 'MEDIA' | 'GROUP';
export type FeedbackStatus =
  | 'RENDER_REQUESTED'
  | 'RENDERING'
  | 'FIT'
  | 'FIT_WITH_DENSITY_ADJUSTMENT'
  | 'OVERFLOW'
  | 'CONSTRAINT_VIOLATION'
  | 'RENDER_FAILED'
  | 'FIT_FAILED_UNRESOLVABLE';
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

export type Diagnostic =
  | OverflowDiagnostic
  | ConstraintViolationDiagnostic
  | RenderFailureDiagnostic
  | ReconciliationDiagnostic;

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

export class ContractValidationError extends Error {
  public readonly code: string;

  public constructor(code: string, message: string) {
    super(message);
    this.name = 'ContractValidationError';
    this.code = code;
  }
}

const semVerPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const bcp47Pattern = /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/;
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const fail = (code: string, message: string): never => { throw new ContractValidationError(code, message); };

export function assertSemVer(value: unknown, field = 'version'): asserts value is SemVer {
  if (typeof value !== 'string' || !semVerPattern.test(value)) fail('INVALID_VERSION', `${field} must be SemVer 2.0`);
}

function assertVersionRef(value: unknown, field: string): asserts value is ImmutableVersionRef {
  if (!isRecord(value) || !nonEmpty(value.reference)) fail('INVALID_VERSION_REF', `${field}.reference is required`);
  const record = value as Record<string, unknown>;
  assertSemVer(record.version, `${field}.version`);
}

function assertLineage(value: unknown, field: string): asserts value is readonly LineageEntry[] {
  if (!Array.isArray(value)) fail('INVALID_LINEAGE', `${field} must be an array`);
  const entries = value as unknown[];
  for (const [index, entry] of entries.entries()) {
    if (!isRecord(entry) || !nonEmpty(entry.source_id) || (entry.transform_id !== null && !nonEmpty(entry.transform_id))) {
      fail('INVALID_LINEAGE', `${field}[${index}] has invalid source or transform`);
    }
    assertVersionRef((entry as Record<string, unknown>).version, `${field}[${index}].version`);
  }
}

function assertSlot(value: unknown, field: string): asserts value is Slot {
  if (!isRecord(value) || !nonEmpty(value.id) || typeof value.type !== 'string' || typeof value.exists !== 'boolean' || !Array.isArray(value.items) || !Number.isInteger(value.count) || (value.count as number) < 0 || !nonEmpty(value.semantics)) {
    fail('INVALID_SLOT_PAYLOAD', `${field} is not a valid slot`);
  }
  const record = value as Record<string, unknown>;
  if (!['TEXT', 'RICH_TEXT', 'ITEM_LIST', 'MEDIA', 'GROUP'].includes(record.type as string)) fail('INVALID_SLOT_TYPE', `${field}.type is invalid`);
  if (record.type === 'ITEM_LIST' && record.count !== (record.items as unknown[]).length) fail('INVALID_SLOT_PAYLOAD', `${field}.count must match items length`);
  if (record.content === undefined) fail('INVALID_SLOT_PAYLOAD', `${field}.content must be present`);
}

export function validatePresentationDocument(value: unknown): asserts value is PresentationDocumentDTO {
  if (!isRecord(value) || !nonEmpty(value.document_id) || value.artifact_kind !== 'CV' || !nonEmpty(value.locale) || !isRecord(value.slots) || !('content_lineage' in value)) fail('INVALID_PRESENTATION_DOCUMENT', 'required PresentationDocumentDTO fields are missing');
  const record = value as Record<string, unknown>;
  assertSemVer(record.contract_version, 'contract_version');
  if (!bcp47Pattern.test(record.locale as string)) fail('INVALID_LOCALE', 'locale must be a BCP 47 tag');
  assertLineage(record.content_lineage, 'content_lineage');
  for (const [slotId, slot] of Object.entries(record.slots as Record<string, unknown>)) assertSlot(slot, `slots.${slotId}`);
  if (record.semantic_metadata !== undefined && !isRecord(record.semantic_metadata)) fail('INVALID_METADATA', 'semantic_metadata must be an object');
}

export function validateRenderRequest(value: unknown): asserts value is RenderRequest {
  if (!isRecord(value) || !nonEmpty(value.request_id) || !nonEmpty(value.traceId) || !nonEmpty(value.contextId) || !nonEmpty(value.template_id) || !isRecord(value.payload) || !isRecord(value.design_policy_version) || !isRecord(value.token_set_version) || !isRecord(value.token_overrides) || !isRecord(value.presentation_preferences) || !('renderer_configuration_ref' in value)) fail('INVALID_RENDER_REQUEST', 'required RenderRequest fields are missing');
  const record = value as Record<string, unknown>;
  assertLineage(record.lineage, 'lineage');
  assertSemVer(record.template_version, 'template_version');
  assertSemVer(record.presentation_contract_version, 'presentation_contract_version');
  validatePresentationDocument(record.payload);
  assertVersionRef(record.design_policy_version, 'design_policy_version');
  assertVersionRef(record.token_set_version, 'token_set_version');
  if (record.renderer_configuration_ref !== null) assertVersionRef(record.renderer_configuration_ref, 'renderer_configuration_ref');
}

export function validateTemplateContract(value: unknown): asserts value is TemplateContract {
  if (!isRecord(value) || !nonEmpty(value.template_id) || value.supported_artifact_kind !== 'CV' || value.unknown_slot_policy !== 'REJECT' || !Array.isArray(value.compatible_contract_versions) || !Array.isArray(value.required_slots) || !Array.isArray(value.optional_slots) || !Array.isArray(value.declared_capabilities) || !isRecord(value.slot_mapping) || !isRecord(value.token_schema) || !Array.isArray(value.policy_constraints) || !isRecord(value.presentation_tree_schema)) fail('INVALID_TEMPLATE_CONTRACT', 'required TemplateContract fields are missing');
  const record = value as Record<string, unknown>;
  assertSemVer(record.template_version, 'template_version');
  const ids = new Set<string>();
  for (const declaration of [...record.required_slots as unknown[], ...record.optional_slots as unknown[]]) {
    if (!isRecord(declaration) || !nonEmpty(declaration.slot_id) || typeof declaration.slot_type !== 'string' || typeof declaration.allow_empty !== 'boolean') fail('INVALID_SLOT_DECLARATION', 'slot declaration is invalid');
    const declarationRecord = declaration as Record<string, unknown>;
    if (ids.has(declarationRecord.slot_id as string)) fail('DUPLICATE_SLOT_DECLARATION', declarationRecord.slot_id as string);
    ids.add(declarationRecord.slot_id as string);
  }
}

function validateDiagnostic(value: unknown): asserts value is Diagnostic {
  if (!isRecord(value) || !nonEmpty(value.diagnostic_id) || !nonEmpty(value.message_code) || !nonEmpty(value.diagnostic_type) || !nonEmpty(value.severity)) fail('INVALID_DIAGNOSTIC', 'diagnostic envelope is invalid');
  const record = value as Record<string, unknown>;
  if (!['OVERFLOW', 'CONSTRAINT_VIOLATION', 'RENDER_FAILED', 'RECONCILIATION'].includes(record.diagnostic_type as string)) fail('INVALID_DIAGNOSTIC', 'diagnostic type is invalid');
}

export function validateRenderFeedback(value: unknown): asserts value is RenderFeedback {
  if (!isRecord(value) || !nonEmpty(value.request_id) || !nonEmpty(value.presentation_run_id) || !nonEmpty(value.traceId) || !nonEmpty(value.contextId) || !nonEmpty(value.templateId) || !nonEmpty(value.createdAt) || !Array.isArray(value.diagnostics) || !('rendererId' in value) || !('rendererVersion' in value)) fail('INVALID_RENDER_FEEDBACK', 'required RenderFeedback fields are missing');
  const record = value as Record<string, unknown>;
  assertLineage(record.lineage, 'lineage');
  assertSemVer(record.presentationContractVersion, 'presentationContractVersion');
  assertSemVer(record.templateVersion, 'templateVersion');
  assertVersionRef(record.designPolicyVersion, 'designPolicyVersion');
  assertVersionRef(record.tokenSetVersion, 'tokenSetVersion');
  if (record.rendererVersion !== null) assertSemVer(record.rendererVersion, 'rendererVersion');
  if (!Number.isInteger(record.attempt) || (record.attempt as number) < 1 || (record.attempt as number) > 3) fail('INVALID_ATTEMPT', 'attempt must be between 1 and 3');
  if (!['FIT', 'FIT_WITH_DENSITY_ADJUSTMENT', 'OVERFLOW', 'CONSTRAINT_VIOLATION', 'RENDER_FAILED', 'FIT_FAILED_UNRESOLVABLE', 'RENDER_REQUESTED', 'RENDERING'].includes(record.status as string)) fail('INVALID_FEEDBACK_STATUS', 'status is invalid');
  if (record.status === 'FIT' && (record.diagnostics as unknown[]).length !== 0) fail('INVALID_DIAGNOSTICS', 'FIT must have no diagnostics');
  if (['OVERFLOW', 'CONSTRAINT_VIOLATION', 'RENDER_FAILED', 'FIT_FAILED_UNRESOLVABLE'].includes(record.status as string) && (record.diagnostics as unknown[]).length === 0) fail('INVALID_DIAGNOSTICS', 'non-fit terminal status requires diagnostics');
  for (const diagnostic of record.diagnostics as unknown[]) validateDiagnostic(diagnostic);
  if ((record.rendererId === null) !== (record.rendererVersion === null)) fail('INVALID_RENDERER_REFERENCE', 'rendererId and rendererVersion nullability must match');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(record.createdAt as string)) fail('INVALID_TIMESTAMP', 'createdAt must be RFC3339 UTC');
}
