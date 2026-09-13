export class RendererAdapterError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = 'RendererAdapterError';
        this.code = code;
    }
}
function normalizeMeasurements(raw) {
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
function normalizedFailure(failure) {
    return {
        code: 'BACKEND_FAILURE',
        stage: failure.stage,
        retryable: failure.retryable,
        message: 'Renderer backend failed during a governed operation',
    };
}
function timeoutFailure() {
    return { code: 'BACKEND_TIMEOUT', stage: 'RENDER', retryable: true, message: 'Renderer backend exceeded the configured timeout' };
}
function unavailableFailure() {
    return { code: 'BACKEND_UNAVAILABLE', stage: 'OPEN', retryable: true, message: 'Renderer backend could not be opened' };
}
export class RendererAdapter {
    backend;
    configuration;
    constructor(backend, configuration) {
        this.backend = backend;
        this.configuration = configuration;
    }
    async render(request) {
        if (!Number.isInteger(request.timeoutMs) || request.timeoutMs <= 0)
            throw new RendererAdapterError('BACKEND_TIMEOUT', 'Renderer timeout must be a positive integer');
        let session;
        try {
            session = await this.backend.open();
        }
        catch {
            return this.result(request, null, null, unavailableFailure());
        }
        try {
            const outcome = await this.withTimeout(session.render({ tree: request.tree, request_id: request.request_id }), request.timeoutMs);
            return this.result(request, outcome.artifact, normalizeMeasurements(outcome.measurements), null);
        }
        catch (error) {
            if (error instanceof RendererAdapterError && error.code === 'BACKEND_TIMEOUT')
                return this.result(request, null, null, timeoutFailure());
            const failure = this.isBackendFailure(error) ? normalizedFailure(error) : { code: 'BACKEND_FAILURE', stage: 'RENDER', retryable: false, message: 'Renderer backend failed during a governed operation' };
            return this.result(request, null, null, failure);
        }
        finally {
            await session.close();
        }
    }
    async withTimeout(operation, timeoutMs) {
        let timeoutHandle;
        const timeout = new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => reject(new RendererAdapterError('BACKEND_TIMEOUT', 'Renderer operation timed out')), timeoutMs);
        });
        try {
            return await Promise.race([operation, timeout]);
        }
        finally {
            if (timeoutHandle !== undefined)
                clearTimeout(timeoutHandle);
        }
    }
    isBackendFailure(error) {
        return typeof error === 'object' && error !== null && 'code' in error && 'stage' in error && 'retryable' in error && 'message' in error;
    }
    result(request, artifact, measurements, failure) {
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
//# sourceMappingURL=index.js.map