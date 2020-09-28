import { PassThrough, Transform, TransformCallback } from 'stream';
import type * as RDF from 'rdf-js';
import type { IHtmlParseListener } from './IHtmlParseListener';
import { Util } from './Util';
import EventEmitter = NodeJS.EventEmitter;

/**
 * A stream transformer that parses Microdata (text) streams to an {@link RDF.Stream}.
 */
export class MicrodataRdfParser extends Transform implements RDF.Sink<EventEmitter, RDF.Stream> {
  private readonly options: IMicrodataRdfParserOptions;
  private readonly util: Util;
  private readonly defaultGraph?: RDF.Quad_Graph;
  private readonly htmlParseListener?: IHtmlParseListener;

  public constructor(options?: IMicrodataRdfParserOptions) {
    super({ readableObjectMode: true });
    options = options || {};
    this.options = options;

    this.util = new Util(options.dataFactory, options.baseIRI);
    this.defaultGraph = options.defaultGraph || this.util.dataFactory.defaultGraph();
    this.htmlParseListener = options.htmlParseListener;
  }

  /**
   * Parses the given text stream into a quad stream.
   * @param {NodeJS.EventEmitter} stream A text stream.
   * @return {RDF.Stream} A quad stream.
   */
  public import(stream: EventEmitter): RDF.Stream {
    const output = new PassThrough({ readableObjectMode: true });
    stream.on('error', (error: Error) => parsed.emit('error', error));
    stream.on('data', (data: RDF.Quad) => output.push(data));
    stream.on('end', () => output.push(null));
    const parsed = output.pipe(new MicrodataRdfParser(this.options));
    return parsed;
  }

  public _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    // TODO
    callback();
  }
}

export interface IMicrodataRdfParserOptions {
  /**
   * A custom RDFJS DataFactory to construct terms and triples.
   */
  dataFactory?: RDF.DataFactory;
  /**
   * An initital default base IRI.
   */
  baseIRI?: string;
  /**
   * The default graph for constructing quads.
   */
  defaultGraph?: RDF.Quad_Graph;
  /**
   * An optional listener for the internal HTML parse events.
   */
  htmlParseListener?: IHtmlParseListener;
}
