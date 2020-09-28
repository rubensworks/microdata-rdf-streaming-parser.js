import type { TransformCallback } from 'stream';
import { PassThrough, Transform } from 'stream';
import type { DomHandler } from 'domhandler';
import { Parser as HtmlParser } from 'htmlparser2';
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
  private readonly parser: HtmlParser;
  private readonly htmlParseListener?: IHtmlParseListener;

  public constructor(options?: IMicrodataRdfParserOptions) {
    super({ readableObjectMode: true });
    options = options || {};
    this.options = options;

    this.util = new Util(options.dataFactory, options.baseIRI);
    this.defaultGraph = options.defaultGraph || this.util.dataFactory.defaultGraph();
    this.htmlParseListener = options.htmlParseListener;

    this.parser = this.initializeParser(!!options.xmlMode);
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
    this.parser.write(chunk);
    callback();
  }

  public _flush(callback: TransformCallback): void {
    this.parser.end();
    callback();
  }

  public onTagOpen(name: string, attributes: {[s: string]: string}): void {
    // TODO
  }

  public onText(data: string): void {
    // TODO
  }

  public onTagClose(): void {
    // TODO
  }

  public onEnd(): void {
    // TODO
  }

  protected initializeParser(xmlMode: boolean): HtmlParser {
    return new HtmlParser(
      <DomHandler> <any> {
        onclosetag: () => {
          try {
            this.onTagClose();
            if (this.htmlParseListener) {
              this.htmlParseListener.onTagClose();
            }
          } catch (error: unknown) {
            this.emit('error', error);
          }
        },
        onend: () => {
          try {
            this.onEnd();
            if (this.htmlParseListener) {
              this.htmlParseListener.onEnd();
            }
          } catch (error: unknown) {
            this.emit('error', error);
          }
        },
        onopentag: (name: string, attributes: {[s: string]: string}) => {
          try {
            this.onTagOpen(name, attributes);
            if (this.htmlParseListener) {
              this.htmlParseListener.onTagOpen(name, attributes);
            }
          } catch (error: unknown) {
            this.emit('error', error);
          }
        },
        ontext: (data: string) => {
          try {
            this.onText(data);
            if (this.htmlParseListener) {
              this.htmlParseListener.onText(data);
            }
          } catch (error: unknown) {
            this.emit('error', error);
          }
        },
      },
      {
        decodeEntities: true,
        recognizeSelfClosing: true,
        xmlMode,
      },
    );
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
  /**
   * If the parser should assume strict X(HT)ML documents.
   */
  xmlMode?: boolean;
}
