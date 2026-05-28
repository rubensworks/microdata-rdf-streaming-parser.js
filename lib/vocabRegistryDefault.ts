import type { IVocabRegistry } from './IVocabRegistry';

const vocabRegistryDefault: IVocabRegistry = {};

vocabRegistryDefault['http://schema.org/'] = {
  properties: {
    additionalType: { subPropertyOf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' },
  },
};
vocabRegistryDefault['http://microformats.org/profile/hcard'] = {};

export default vocabRegistryDefault;
