import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { resolve } from 'relative-to-absolute-iri';
import type { IItemScope } from './IItemScope';
import type { IVocabRegistry } from './IVocabRegistry';

/**
 * A collection of utility functions.
 */
export class Util {
  public static readonly RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
  public static readonly XSD = 'http://www.w3.org/2001/XMLSchema#';
  public static readonly RDFA = 'http://www.w3.org/ns/rdfa#';

  private static readonly IRI_REGEX: RegExp = /^([A-Za-z][\d+-.A-Za-z]*|_):[^ "<>[\\\]`{|}]*$/u;

  public readonly dataFactory: RDF.DataFactory;
  public baseIRI: RDF.NamedNode;

  public constructor(dataFactory?: RDF.DataFactory, baseIRI?: string) {
    this.dataFactory = dataFactory || new DataFactory();
    this.baseIRI = this.dataFactory.namedNode(baseIRI || '');
  }

  /**
   * Check if the given IRI is valid.
   * @param {string} iri A potential IRI.
   * @return {boolean} If the given IRI is valid.
   */
  public static isValidIri(iri: string): boolean {
    return Util.IRI_REGEX.test(iri);
  }

  /**
   * Get the base IRI.
   * @param {string} baseIriValue A base IRI value.
   * @return A base IRI named node.
   */
  public getBaseIRI(baseIriValue: string): RDF.NamedNode {
    let href: string = baseIriValue;
    const fragmentIndex = href.indexOf('#');
    if (fragmentIndex >= 0) {
      href = href.slice(0, Math.max(0, fragmentIndex));
    }
    return this.dataFactory.namedNode(resolve(href, this.baseIRI.value));
  }

  /**
   * Create vocab terms for the given terms attribute.
   * @param {string} terms An attribute value.
   * @return {Term[]} The IRI terms.
   */
  public createVocabIris(terms: string, itemScope: IItemScope): RDF.NamedNode[] {
    return terms.split(/\s+/u)
      .map(property => this.createIri(property, itemScope, true));
  }

  /**
   * Create a named node for the given term, which can be relative to the current vocab, or document base as fallback.
   * @param {string} term A term string.
   * @param {IItemScope} itemScope The current item scope.
   * @param {boolean} useVocab If the current vocab value can be used.
   * @return {Term} An RDF term.
   */
  public createIri(iri: string, itemScope: IItemScope, useVocab: boolean): RDF.NamedNode {
    if (!Util.isValidIri(iri)) {
      iri = `${useVocab && itemScope.vocab || `${this.baseIRI.value}#`}${iri}`;
    }
    return this.dataFactory.namedNode(iri);
  }

  /**
   * Create a new literal node.
   * @param {string} literal The literal value.
   * @param {IActiveTag} activeTag The current active tag.
   * @return {Literal} A new literal node.
   */
  public createLiteral(literal: string, activeTag: IItemScope): RDF.Literal {
    return this.dataFactory.literal(literal);
  }

  /**
   * Determine the vocab IRI from a given type IRI.
   * @link https://w3c.github.io/microdata-rdf/#property-uri-generation
   * @param typeIri A type IRI.
   * @param vocabRegistry The active vocabulary registry.
   */
  public deriveVocab(typeIri: string, vocabRegistry: IVocabRegistry): string {
    let vocab: string | undefined;

    // First check if we find a prefix in the vocab registry
    for (const uriPrefix in vocabRegistry) {
      if (typeIri.startsWith(uriPrefix)) {
        vocab = uriPrefix;
        // Append fragment if prefix does not end with a slash
        if (!vocab.endsWith('/')) {
          vocab += '#';
        }
        break;
      }
    }
    // If no match was found, remove the last path segment from the URI
    if (!vocab) {
      const hashPos = typeIri.indexOf('#');
      if (hashPos > 0) {
        vocab = typeIri.slice(0, hashPos);
      } else {
        vocab = resolve('.', typeIri);
      }
    }
    return vocab;
  }
}
