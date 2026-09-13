import { composePresentationTree } from '../../core/index.js';
import { type ChromiumBackendConfiguration } from '../../renderer-adapter/chromium/index.js';
import { type RendererAdapterResult } from '../../renderer-adapter/index.js';
import type { ImmutableVersionRef, LineageEntry, PresentationDocumentDTO, RenderFeedback, RenderRequest } from '../../contracts/index.js';
export interface SlyCvProducerInput {
    readonly documentId: string;
    readonly locale: string;
    readonly sourceVersion: ImmutableVersionRef;
    readonly lineage: readonly LineageEntry[];
    readonly identity: Readonly<Record<string, unknown>>;
    readonly summary?: string;
    readonly experience: readonly Readonly<Record<string, unknown>>[];
    readonly skills: readonly string[];
    readonly education?: readonly Readonly<Record<string, unknown>>[];
    readonly certifications?: readonly Readonly<Record<string, unknown>>[];
    readonly languages?: readonly Readonly<Record<string, unknown>>[];
    readonly constraintFixture?: boolean;
}
export interface CvEndToEndResult {
    readonly input: SlyCvProducerInput;
    readonly document: PresentationDocumentDTO;
    readonly request: RenderRequest;
    readonly tree: ReturnType<typeof composePresentationTree>;
    readonly render: RendererAdapterResult;
    readonly feedback: RenderFeedback;
}
export declare function adaptSlyCvProducerInput(input: SlyCvProducerInput): PresentationDocumentDTO;
export declare function renderSlyCvEndToEnd(input: SlyCvProducerInput, chromiumConfiguration: ChromiumBackendConfiguration, requestId?: string): Promise<CvEndToEndResult>;
export declare function createCvFixture(id: string): SlyCvProducerInput;
//# sourceMappingURL=index.d.ts.map