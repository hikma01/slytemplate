import type {ImmutableVersionRef, LineageEntry, SemVer, TemplateContract} from '../../contracts/index.js';

export interface CandidateSlot {
  readonly slotId: string;
  readonly label: string;
  readonly context: Readonly<Record<string, string>>;
  readonly lineage: readonly LineageEntry[];
  readonly evidence: readonly Readonly<Record<string, string>>[];
}

export interface CandidateSlots {
  readonly contract: 'CandidateSlots';
  readonly contractVersion: SemVer;
  readonly templateId: string;
  readonly templateVersion: SemVer;
  readonly slots: readonly CandidateSlot[];
}

export interface SemanticResolutionProjection {
  readonly contract: string;
  readonly contractVersion: SemVer;
  readonly status: string;
  readonly registry: {readonly schema: string; readonly version: SemVer; readonly sourceOfTruth: boolean};
  readonly candidateSlots?: {readonly count: number; readonly resolutions: readonly Readonly<Record<string, unknown>>[]};
  readonly bindings?: readonly Readonly<Record<string, unknown>>[];
  readonly [key: string]: unknown;
}

export interface SemanticTransportOptions {
  readonly endpoint: string;
  readonly serviceToken: string;
  readonly signal?: AbortSignal;
}

/**
 * Template Factory boundary. Semantic labels are supplied by the factory's
 * governed slot mapping; this adapter never derives meaning from layout IDs.
 */
export function buildCandidateSlots(
  template: TemplateContract,
  semanticLabels: Readonly<Record<string, string>>,
  {lineage = [], evidence = []}: {readonly lineage?: readonly LineageEntry[]; readonly evidence?: readonly Readonly<Record<string, string>>[]} = {},
): CandidateSlots {
  const declarations = [...template.required_slots, ...template.optional_slots];
  const slots = declarations.flatMap((declaration) => {
    const label = semanticLabels[declaration.slot_id];
    if (!label) return [];
    return [{
      slotId: declaration.slot_id,
      label,
      context: {domain: 'PROFESSIONAL', templateId: template.template_id, slotType: declaration.slot_type},
      lineage,
      evidence,
    }];
  });
  return {contract: 'CandidateSlots', contractVersion: '1.0.0', templateId: template.template_id, templateVersion: template.template_version, slots};
}

/** Sends CandidateSlots through the product runtime boundary. */
export async function resolveCandidateSlots(
  candidateSlots: CandidateSlots,
  options: SemanticTransportOptions,
  candidateMetadata: Readonly<Record<string, unknown>> = {contract: 'CandidateMetadata', contractVersion: '1.0.0', elements: []},
): Promise<SemanticResolutionProjection> {
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {'content-type': 'application/json', authorization: `Bearer ${options.serviceToken}`},
    body: JSON.stringify({candidateMetadata, candidateSlots: candidateSlots.slots}),
  };
  if (options.signal) requestInit.signal = options.signal;
  const response = await fetch(options.endpoint, requestInit);
  const body = await response.json() as SemanticResolutionProjection & {readonly error?: string};
  if (!response.ok) throw new Error(body.error || `SEMANTIC_RESOLUTION_FAILED_${response.status}`);
  return body;
}

/** Returns the canonical slot view without hiding UNKNOWN/CONFLICT states. */
export function canonicalSlotsFromProjection(projection: SemanticResolutionProjection): readonly Readonly<Record<string, unknown>>[] {
  return projection.candidateSlots?.resolutions ?? [];
}

export type {ImmutableVersionRef};
