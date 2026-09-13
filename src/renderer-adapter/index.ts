import type {
  Bounds,
  ConstraintMeasurement,
  ImmutableVersionRef,
  PresentationTree,
  RenderArtifact,
  RenderMeasurements,
  SemVer,
  SlotBounds,
} from '../contracts/index.js';

export interface RendererAdapterRequest {
  readonly tree: PresentationTree;
  readonly request_id: string;
  readonly traceId: string;
  readonly contextId: string;
  readonly lineage: PresentationTree['document']['lineage'];
  readonly presentationContractVersion: SemVer;
  readonly templateId: string;
  readonly templateVersion: SemVer;
  readonly designPolicyVersion: ImmutableVersionRef;
  readonly tokenSetVersion: ImmutableVersionRef;
  readonly timeoutMs: number;
}

export interface BackendRenderInput {
  readonly tree: PresentationTree;
  readonly request_id: string;
}

export interface RawRendererMeasurements {
  readonly pageCount: number;
  readonly pageBounds: readonly Bounds[];
  readonly contentBounds: Bounds | null;
  readonly slotBounds: readonly SlotBounds[];
  readonly overflowHeight: number | null;
  readonly overflowWidth: number | null;
  readonly affectedRegions: readonly string[];
  readonly constraintMeasurements: readonly ConstraintMeasurement[];
}

export interface BackendRenderSuccess {
  readonly artifact: RenderArtifact | null;
  readonly measurements: RawRendererMeasurements;
}

export interface BackendFailure {
  readonly code: string;
  readonly stage: string;
  readonly retryable: boolean;
  readonly message: string;
}

export interface RendererBackendSession {
  render(input: BackendRenderInput): Promise<BackendRenderSuccess>;
  close(): Promise<void>;
}

export interface RendererBackendPort {
  open(): Promise<RendererBackendSession>;
}

export interface NormalizedRendererFailure {
  readonly code: 'BACKEND_UNAVAILABLE' | 'BACKEND_TIMEOUT' | 'BACKEND_FAILURE';
  readonly stage: string;
  readonly retryable: boolean;
  readonly message: string;
}

export interface RendererAdapterResult {
  readonly request_id: string;
  readonly traceId: string;
  readonly contextId: string;
  readonly lineage: RendererAdapterRequest['lineage'];
  readonly presentationContractVersion: SemVer;
  readonly templateId: string;
  readonly templateVersion: SemVer;
  readonly designPolicyVersion: ImmutableVersionRef;
  readonly tokenSetVersion: ImmutableVersionRef;
  readonly rendererId: string;
  readonly rendererVersion: SemVer;
  readonly artifact: RenderArtifact | null;
  readonly measurements: RenderMeasurements | null;
  readonly failure: NormalizedRendererFailure | null;
}

export class RendererAdapterError extends Error {
  public readonly code: NormalizedRendererFailure['code'];

  public constructor(code: NormalizedRendererFailure['code'], message: string) {
    super(message);
    this.name = 'RendererAdapterError';
    this.code = code;
  }
}

export interface RendererAdapterConfiguration {
  readonly rendererId: string;
  readonly rendererVersion: SemVer;
}

function normalizeMeasurements(raw: RawRendererMeasurements): RenderMeasurements {
  return {
    page_count: raw.pageCount,
    page_bounds: raw.pageBounds,
    content_bounds: raw.contentBounds,
    slot_bounds: raw.slotBounds,
    overflow_height: raw.overflowHeight,
    overflow_width: raw.overflowWidth,
    affected_regions: raw.affectedRegions,
    constraint_measurements: raw.constraintMeasurements,
  };
}

function normalizedFailure(failure: BackendFailure): NormalizedRendererFailure {
  return {
    code: 'BACKEND_FAILURE',
    stage: failure.stage,
    retryable: failure.retryable,
    message: 'Renderer backend failed during a governed operation',
  };
}

function timeoutFailure(): NormalizedRendererFailure {
  return {code: 'BACKEND_TIMEOUT', stage: 'RENDER', retryable: true, message: 'Renderer backend exceeded the configured timeout'};
}

function unavailableFailure(): NormalizedRendererFailure {
  return {code: 'BACKEND_UNAVAILABLE', stage: 'OPEN', retryable: true, message: 'Renderer backend could not be opened'};
}

export class RendererAdapter {
  public constructor(private readonly backend: RendererBackendPort, private readonly configuration: RendererAdapterConfiguration) {}

  public async render(request: RendererAdapterRequest): Promise<RendererAdapterResult> {
    if (!Number.isInteger(request.timeoutMs) || request.timeoutMs <= 0) throw new RendererAdapterError('BACKEND_TIMEOUT', 'Renderer timeout must be a positive integer');
    let session: RendererBackendSession;
    try {
      session = await this.backend.open();
    } catch {
      return this.result(request, null, null, unavailableFailure());
    }
    try {
      const outcome = await this.withTimeout(session.render({tree: request.tree, request_id: request.request_id}), request.timeoutMs);
      return this.result(request, outcome.artifact, normalizeMeasurements(outcome.measurements), null);
    } catch (error: unknown) {
      if (error instanceof RendererAdapterError && error.code === 'BACKEND_TIMEOUT') return this.result(request, null, null, timeoutFailure());
      const failure = this.isBackendFailure(error) ? normalizedFailure(error) : {code: 'BACKEND_FAILURE' as const, stage: 'RENDER', retryable: false, message: 'Renderer backend failed during a governed operation'};
      return this.result(request, null, null, failure);
    } finally {
      await session.close();
    }
  }

  private async withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new RendererAdapterError('BACKEND_TIMEOUT', 'Renderer operation timed out')), timeoutMs);
    });
    try {
      return await Promise.race([operation, timeout]);
    } finally {
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    }
  }

  private isBackendFailure(error: unknown): error is BackendFailure {
    return typeof error === 'object' && error !== null && 'code' in error && 'stage' in error && 'retryable' in error && 'message' in error;
  }

  private result(request: RendererAdapterRequest, artifact: RenderArtifact | null, measurements: RenderMeasurements | null, failure: NormalizedRendererFailure | null): RendererAdapterResult {
    return {
      request_id: request.request_id,
      traceId: request.traceId,
      contextId: request.contextId,
      lineage: request.lineage,
      presentationContractVersion: request.presentationContractVersion,
      templateId: request.templateId,
      templateVersion: request.templateVersion,
      designPolicyVersion: request.designPolicyVersion,
      tokenSetVersion: request.tokenSetVersion,
      rendererId: this.configuration.rendererId,
      rendererVersion: this.configuration.rendererVersion,
      artifact,
      measurements,
      failure,
    };
  }
}
