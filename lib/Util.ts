import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { resolve } from 'relative-to-absolute-iri';

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
  public createVocabIris(terms: string): RDF.NamedNode[] {
    return terms.split(/\s+/u)
      .map(property => this.createIri(property));
  }

  public createIri(iri: string): RDF.NamedNode {
    return this.dataFactory.namedNode(iri);
  }
}
