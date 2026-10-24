import type {LineageEntry} from '../../contracts/index.js';
import type {TemplatePackage} from '../../downstream/index.js';
import {cvFoundationTemplate} from './foundation.js';

const packageLineage: readonly LineageEntry[] = [{source_id: 'slytemplate-cv-foundation-package', transform_id: 'template-package-definition', version: {reference: 'slytemplate-package-contract', version: '1.0.0'}}];

export const cvFoundationPackage: TemplatePackage = {
  contract: 'TemplatePackage',
  contractVersion: '1.0.0',
  packageId: 'cv-foundation-package',
  packageVersion: '1.0.0',
  artifactType: 'CV',
  templateContract: cvFoundationTemplate,
  templateContractRef: {reference: cvFoundationTemplate.template_id, version: cvFoundationTemplate.template_version},
  compatibility: ['PresentationDocumentDTO@1.0.0', 'CanonicalSlots@1.0.0'],
  availability: 'AVAILABLE',
  payloadReference: 'slytemplate://templates/cv-foundation-01/1.0.0',
  lineage: packageLineage,
  provenance: {owner: 'SlyTemplate', source: 'ratified-cv-foundation-template', authority: 'SlyTemplate V1 preparation contract'},
};
