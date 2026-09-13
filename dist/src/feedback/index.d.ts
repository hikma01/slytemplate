import type { ImmutableVersionRef, LineageEntry, RenderFeedback } from '../contracts/index.js';
import type { RendererAdapterResult } from '../renderer-adapter/index.js';
export declare const INITIAL_RENDER_ATTEMPT = 1;
export declare const MAX_RECONCILIATION_ITERATIONS = 2;
export declare const MAX_TOTAL_RENDER_ATTEMPTS = 3;
export declare const MAX_PRESENTATION_SUPERSESSION_DEPTH = 3;
export interface FeedbackEvaluationContext {
    readonly presentationRunId: string;
    readonly attempt: number;
    readonly createdAt: string;
    readonly densityAdjustmentApplied?: boolean;
}
export interface InternalReconciliationContext {
    readonly presentationRunId: string;
    readonly attempt: number;
    readonly retryOfRequestId: string;
    readonly lineage: readonly LineageEntry[];
}
export interface UpstreamSupersessionContext {
    readonly requestId: string;
    readonly presentationId: string;
    readonly supersedesRequestId: string;
    readonly supersedesPresentationId: string | null;
    readonly depth: number;
    readonly lineage: readonly LineageEntry[];
}
export declare class FeedbackEvaluationError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
export declare function evaluateRenderFeedback(result: RendererAdapterResult, context: FeedbackEvaluationContext): RenderFeedback;
export declare function nextInternalReconciliation(current: RenderFeedback): InternalReconciliationContext | null;
export declare function unresolvedFittingFeedback(current: RenderFeedback): RenderFeedback;
export declare function createUpstreamSupersessionContext(requestId: string, presentationId: string, supersedesRequestId: string, supersedesPresentationId: string | null, depth: number, lineage: readonly LineageEntry[], version: ImmutableVersionRef): UpstreamSupersessionContext;
//# sourceMappingURL=index.d.ts.map