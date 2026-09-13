import type { RendererBackendPort, RendererBackendSession } from '../index.js';
export interface ChromiumBackendConfiguration {
    readonly executablePath: string;
    readonly rendererId: string;
    readonly rendererVersion: `${number}.${number}.${number}`;
    readonly locale: string;
    readonly timezoneId: string;
    readonly deviceScaleFactor: number;
    readonly width: number;
    readonly height: number;
    readonly timeoutMs: number;
}
export declare class ChromiumBackend implements RendererBackendPort {
    private readonly configuration;
    constructor(configuration: ChromiumBackendConfiguration);
    open(): Promise<RendererBackendSession>;
}
//# sourceMappingURL=index.d.ts.map