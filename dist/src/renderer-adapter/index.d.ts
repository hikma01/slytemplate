import type { Bounds, ConstraintMeasurement, ImmutableVersionRef, PresentationTree, RenderArtifact, RenderMeasurements, SemVer, SlotBounds } from '../contracts/index.js';
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
export declare class RendererAdapterError extends Error {
    readonly code: NormalizedRendererFailure['code'];
    constructor(code: NormalizedRendererFailure['code'], message: string);
}
export interface RendererAdapterConfiguration {
    readonly rendererId: string;
    readonly rendererVersion: SemVer;
}
export declare class RendererAdapter {
    private readonly backend;
    private readonly configuration;
    constructor(backend: RendererBackendPort, configuration: RendererAdapterConfiguration);
    render(request: RendererAdapterRequest): Promise<RendererAdapterResult>;
    private withTimeout;
    private isBackendFailure;
    private result;
}
//# sourceMappingURL=index.d.ts.map