import {
  ContractValidationError,
  type ImmutableVersionRef,
  type LineageEntry,
  type SemVer,
  type TemplateContract,
  assertSemVer,
  validateTemplateContract,
} from '../contracts/index.js';

export type TemplateAvailability = 'AVAILABLE' | 'UNAVAILABLE';

export interface TemplatePackage {
  readonly contract: 'TemplatePackage';
  readonly contractVersion: SemVer;
  readonly packageId: string;
  readonly packageVersion: SemVer;
  readonly artifactType: 'CV';
  readonly templateContract: TemplateContract;
  readonly templateContractRef: ImmutableVersionRef;
  readonly compatibility: readonly string[];
  readonly availability: TemplateAvailability;
  readonly payloadReference: string;
  readonly lineage: readonly LineageEntry[];
  readonly provenance: Readonly<Record<string, string>>;
}

export interface SelectedTemplate {
  readonly contract: 'SelectedTemplate';
  readonly contractVersion: SemVer;
  readonly packageId: string;
  readonly packageVersion: SemVer;
  readonly selectionMode: 'MANUAL';
  readonly actor: string;
  readonly source: string;
  readonly selectedAt: string;
  readonly lineage: readonly LineageEntry[];
}

export interface BoundCanonicalSlots {
  readonly contract: 'BoundCanonicalSlots';
  readonly contractVersion: SemVer;
  readonly packageId: string;
  readonly packageVersion: SemVer;
  readonly templateId: string;
  readonly templateVersion: SemVer;
  readonly slots: readonly Readonly<Record<string, unknown>>[];
  readonly lineage: readonly LineageEntry[];
}

const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const fail = (code: string, message: string): never => { throw new ContractValidationError(code, message); };
function freezeDeep<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child);
  return Object.freeze(value);
}

function validateLineage(lineage: readonly LineageEntry[], field: string): void {
  if (!Array.isArray(lineage)) fail('INVALID_LINEAGE', `${field} must be an array`);
  for (const [index, entry] of lineage.entries()) {
    if (!nonEmpty(entry.source_id) || (entry.transform_id !== null && !nonEmpty(entry.transform_id))) fail('INVALID_LINEAGE', `${field}[${index}] is invalid`);
    assertSemVer(entry.version.version, `${field}[${index}].version`);
  }
}

export function validateTemplatePackage(value: TemplatePackage): void {
  if (value.contract !== 'TemplatePackage' || value.contractVersion !== '1.0.0' || !nonEmpty(value.packageId) || value.artifactType !== 'CV' || !nonEmpty(value.payloadReference) || !nonEmpty(value.templateContractRef.reference) || value.availability === undefined || !Array.isArray(value.compatibility) || !Array.isArray(value.lineage) || !value.provenance) {
    fail('INVALID_TEMPLATE_PACKAGE', 'TemplatePackage envelope is invalid');
  }
  assertSemVer(value.packageVersion, 'packageVersion');
  assertSemVer(value.templateContractRef.version, 'templateContractRef.version');
  validateTemplateContract(value.templateContract);
  if (value.templateContractRef.reference !== value.templateContract.template_id || value.templateContractRef.version !== value.templateContract.template_version) fail('TEMPLATE_CONTRACT_REFERENCE_MISMATCH', 'templateContractRef must match templateContract');
  if (!['AVAILABLE', 'UNAVAILABLE'].includes(value.availability)) fail('INVALID_TEMPLATE_AVAILABILITY', 'availability is invalid');
  validateLineage(value.lineage, 'lineage');
}

export class TemplateRegistry {
  private readonly packages: readonly TemplatePackage[];

  public constructor(packages: readonly TemplatePackage[] = []) {
    const ids = new Set<string>();
    for (const templatePackage of packages) {
      validateTemplatePackage(templatePackage);
      const key = `${templatePackage.packageId}@${templatePackage.packageVersion}`;
      if (ids.has(key)) fail('DUPLICATE_TEMPLATE_PACKAGE', key);
      ids.add(key);
    }
    this.packages = Object.freeze(packages.map((templatePackage) => freezeDeep(templatePackage)));
  }

  public register(templatePackage: TemplatePackage): TemplateRegistry {
    validateTemplatePackage(templatePackage);
    if (this.packages.some((entry) => entry.packageId === templatePackage.packageId && entry.packageVersion === templatePackage.packageVersion)) fail('DUPLICATE_TEMPLATE_PACKAGE', `${templatePackage.packageId}@${templatePackage.packageVersion}`);
    return new TemplateRegistry([...this.packages, templatePackage]);
  }

  public lookup(packageId: string, packageVersion: SemVer): TemplatePackage {
    const found = this.packages.find((entry) => entry.packageId === packageId && entry.packageVersion === packageVersion);
    if (found === undefined) return fail('TEMPLATE_PACKAGE_NOT_FOUND', `${packageId}@${packageVersion}`);
    if (found.availability !== 'AVAILABLE') fail('TEMPLATE_PACKAGE_UNAVAILABLE', `${packageId}@${packageVersion}`);
    return found;
  }

  public list(): readonly TemplatePackage[] {
    return this.packages.slice();
  }
}

export function selectTemplateManually(
  registry: TemplateRegistry,
  packageId: string,
  packageVersion: SemVer,
  actor: string,
  source: string,
  selectedAt: string,
  lineage: readonly LineageEntry[],
): SelectedTemplate {
  const templatePackage = registry.lookup(packageId, packageVersion);
  if (!nonEmpty(actor) || !nonEmpty(source) || !nonEmpty(selectedAt)) fail('INVALID_MANUAL_SELECTION', 'actor, source and selectedAt are required');
  validateLineage(lineage, 'lineage');
  return {contract: 'SelectedTemplate', contractVersion: '1.0.0', packageId: templatePackage.packageId, packageVersion: templatePackage.packageVersion, selectionMode: 'MANUAL', actor, source, selectedAt, lineage: lineage.slice()};
}

export function bindCanonicalSlotsToSelectedTemplate(
  selectedTemplate: SelectedTemplate,
  templatePackage: TemplatePackage,
  canonicalSlots: readonly Readonly<Record<string, unknown>>[],
  lineage: readonly LineageEntry[] = selectedTemplate.lineage,
): BoundCanonicalSlots {
  validateTemplatePackage(templatePackage);
  if (selectedTemplate.packageId !== templatePackage.packageId || selectedTemplate.packageVersion !== templatePackage.packageVersion) fail('SELECTED_TEMPLATE_PACKAGE_MISMATCH', 'selected template does not reference the supplied package');
  const declarations = new Set([...templatePackage.templateContract.required_slots, ...templatePackage.templateContract.optional_slots].map((declaration) => declaration.slot_id));
  for (const [index, slot] of canonicalSlots.entries()) {
    const slotId = slot.slotId;
    if (typeof slotId !== 'string' || !declarations.has(slotId)) fail('CANONICAL_SLOT_NOT_DECLARED', `canonical slot ${String(slotId ?? index)} is not declared by the package`);
  }
  validateLineage(lineage, 'lineage');
  return {contract: 'BoundCanonicalSlots', contractVersion: '1.0.0', packageId: templatePackage.packageId, packageVersion: templatePackage.packageVersion, templateId: templatePackage.templateContract.template_id, templateVersion: templatePackage.templateContract.template_version, slots: canonicalSlots.map((slot) => ({...slot})), lineage: lineage.slice()};
}
