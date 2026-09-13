import { type ImmutableVersionRef, type PresentationTree, type RenderRequest, type Slot, type TemplateContract } from '../contracts/index.js';
export interface CoreDesignInputs {
    readonly token_set: ImmutableVersionRef;
    readonly tokens: Readonly<Record<string, string | number | boolean>>;
    readonly design_policy: ImmutableVersionRef;
    readonly policies?: Readonly<Record<string, string | number | boolean>>;
}
export declare function composePresentationTree<TSlotMap extends Readonly<Record<string, Slot>>>(request: RenderRequest<TSlotMap>, template: TemplateContract, inputs: CoreDesignInputs): PresentationTree;
//# sourceMappingURL=index.d.ts.map