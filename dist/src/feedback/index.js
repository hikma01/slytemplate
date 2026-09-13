export const INITIAL_RENDER_ATTEMPT = 1;
export const MAX_RECONCILIATION_ITERATIONS = 2;
export const MAX_TOTAL_RENDER_ATTEMPTS = 3;
export const MAX_PRESENTATION_SUPERSESSION_DEPTH = 3;
export class FeedbackEvaluationError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = 'FeedbackEvaluationError';
        this.code = code;
    }
}
function diagnosticBase(diagnosticId, diagnosticType, severity, messageCode) {
    return { diagnostic_id: diagnosticId, diagnostic_type: diagnosticType, severity, message_code: messageCode };
}
function overflowDiagnostics(measurements) {
    const diagnostics = [];
    if ((measurements.overflow_height ?? 0) > 0 || (measurements.overflow_width ?? 0) > 0) {
        const affected = measurements.affected_regions;
        diagnostics.push({
            ...diagnosticBase('overflow-document', 'OVERFLOW', 'ERROR', 'RENDER_OVERFLOW'),
            slot_id: affected.length === 1 ? affected[0] : null,
            scope: affected.length === 1 ? 'SLOT' : 'DOCUMENT',
            overflow_ratio: 1,
            overflow_height_ratio: measurements.overflow_height === null ? null : measurements.overflow_height > 0 ? 1 : 0,
            overflow_width_ratio: measurements.overflow_width === null ? null : measurements.overflow_width > 0 ? 1 : 0,
            suggested_reduction_weight: affected.length > 0 ? 'MEDIUM' : 'LOW',
            constraint_ids: measurements.constraint_measurements.map((measurement) => measurement.constraint_id),
        });
    }
    return diagnostics;
}
function constraintDiagnostics(measurements) {
    return measurements.constraint_measurements.filter((measurement) => measurement.measured_value > measurement.allowed_boundary).map((measurement) => ({
        ...diagnosticBase(`constraint-${measurement.constraint_id}`, 'CONSTRAINT_VIOLATION', 'ERROR', 'CONSTRAINT_EXCEEDED'),
        constraint_id: measurement.constraint_id,
        constraint_type: 'MEASURED_BOUNDARY',
        target: measurement.constraint_id,
        measured_value: measurement.measured_value,
        allowed_boundary: measurement.allowed_boundary,
    }));
}
function failureDiagnostic(result) {
    return {
        ...diagnosticBase('render-failure', 'RENDER_FAILED', 'ERROR', 'RENDER_BACKEND_FAILURE'),
        failure_code: result.failure?.code ?? 'BACKEND_FAILURE',
        renderer_stage: result.failure?.stage ?? 'RENDER',
        retryable: result.failure?.retryable ?? false,
        sanitized_message: result.failure?.message ?? 'Renderer backend failed during a governed operation',
    };
}
function reconciliationDiagnostic(messageCode) {
    return { ...diagnosticBase('reconciliation-bound', 'RECONCILIATION', 'ERROR', messageCode), reason: messageCode };
}
export function evaluateRenderFeedback(result, context) {
    if (!Number.isInteger(context.attempt) || context.attempt < 1 || context.attempt > MAX_TOTAL_RENDER_ATTEMPTS)
        throw new FeedbackEvaluationError('INVALID_ATTEMPT', 'attempt must be between 1 and 3');
    let status;
    let diagnostics = [];
    if (result.failure !== null || result.artifact === null || result.measurements === null) {
        status = 'RENDER_FAILED';
        diagnostics = [failureDiagnostic(result)];
    }
    else {
        const constraints = constraintDiagnostics(result.measurements);
        const overflows = overflowDiagnostics(result.measurements);
        diagnostics = constraints.length > 0 ? constraints : overflows;
        if (constraints.length > 0)
            status = 'CONSTRAINT_VIOLATION';
        else if (overflows.length > 0)
            status = 'OVERFLOW';
        else
            status = context.densityAdjustmentApplied ? 'FIT_WITH_DENSITY_ADJUSTMENT' : 'FIT';
    }
    const lineage = result.lineage;
    return {
        request_id: result.request_id,
        presentation_run_id: context.presentationRunId,
        traceId: result.traceId,
        contextId: result.contextId,
        lineage,
        status,
        presentationContractVersion: result.presentationContractVersion,
        templateId: result.templateId,
        templateVersion: result.templateVersion,
        designPolicyVersion: result.designPolicyVersion,
        tokenSetVersion: result.tokenSetVersion,
        rendererId: result.rendererId,
        rendererVersion: result.rendererVersion,
        diagnostics,
        attempt: context.attempt,
        createdAt: context.createdAt,
    };
}
export function nextInternalReconciliation(current) {
    if (current.status !== 'OVERFLOW' || current.attempt >= MAX_TOTAL_RENDER_ATTEMPTS)
        return null;
    return {
        presentationRunId: current.presentation_run_id,
        attempt: current.attempt + 1,
        retryOfRequestId: current.request_id,
        lineage: [...current.lineage, { source_id: current.request_id, transform_id: 'retry_of_request_id', version: current.designPolicyVersion }],
    };
}
export function unresolvedFittingFeedback(current) {
    return { ...current, status: 'FIT_FAILED_UNRESOLVABLE', diagnostics: [reconciliationDiagnostic('RECONCILIATION_BOUND_EXCEEDED')], attempt: current.attempt };
}
export function createUpstreamSupersessionContext(requestId, presentationId, supersedesRequestId, supersedesPresentationId, depth, lineage, version) {
    if (depth < 0 || depth > MAX_PRESENTATION_SUPERSESSION_DEPTH)
        throw new FeedbackEvaluationError('SUPERSESSION_DEPTH_EXCEEDED', 'presentation supersession depth exceeds the global bound');
    if (!requestId || requestId === supersedesRequestId)
        throw new FeedbackEvaluationError('INVALID_SUPERSESSION', 'superseding request must have a new request id');
    return { requestId, presentationId, supersedesRequestId, supersedesPresentationId, depth, lineage: [...lineage, { source_id: supersedesRequestId, transform_id: 'supersedes_request_id', version }] };
}
//# sourceMappingURL=index.js.map