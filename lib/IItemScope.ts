import type * as RDF from 'rdf-js';

/**
 * Data holder for the Microdata state in XML tags.
 */
export interface IItemScope {
  subject: RDF.NamedNode | RDF.BlankNode;
  vocab?: string;
  language?: string;
  predicates?: RDF.NamedNode[];
  objects?: RDF.Term[][];
  text?: string[];
}
