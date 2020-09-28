import type { TransformCallback } from 'stream';
import { PassThrough, Transform } from 'stream';
import type { DomHandler } from 'domhandler';
import { Parser as HtmlParser } from 'htmlparser2';
import type * as RDF from 'rdf-js';
import type { IHtmlParseListener } from './IHtmlParseListener';
import type { IItemScope } from './IItemScope';
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

  private readonly itemScopeStack: (IItemScope | undefined)[] = [];

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
    // Determine the current item scope
    let itemScope: IItemScope | undefined;
    let changedItemScope = false;
    if ('itemscope' in attributes) {
      // Create a new item scope
      const subject: RDF.Quad_Subject = 'itemid' in attributes && Util.isValidIri(attributes.itemid) ?
        this.util.createIri(attributes.itemid) :
        this.util.dataFactory.blankNode();
      itemScope = { subject };
      changedItemScope = true;
    } else {
      // Determine the parent item scope
      let parentTagI: number = this.itemScopeStack.length - 1;
      while (parentTagI > 0 && !this.itemScopeStack[parentTagI]) {
        parentTagI--;
      }
      itemScope = this.itemScopeStack[parentTagI];
    }

    // If we have a valid item scope, process the current node
    if (itemScope) {
      // Handle item type
      if ('itemtype' in attributes) {
        for (const type of this.util.createVocabIris(attributes.itemtype)) {
          this.emitTriple(
            itemScope.subject,
            this.util.dataFactory.namedNode(`${Util.RDF}type`),
            type,
          );
        }
      }
    }

    // Push any changes to the item scope to the stack
    if (changedItemScope) {
      this.itemScopeStack.push(itemScope);
    } else {
      this.itemScopeStack.push();
    }
  }

  public onText(data: string): void {
    // TODO
  }

  public onTagClose(): void {
    // Remove the active tag from the stack
    this.itemScopeStack.pop();
  }

  public onEnd(): void {
    // TODO
  }

  /**
   * Emit the given triple to the stream.
   * @param {Term} subject A subject term.
   * @param {Term} predicate A predicate term.
   * @param {Term} object An object term.
   */
  protected emitTriple(subject: RDF.Quad_Subject, predicate: RDF.Quad_Predicate, object: RDF.Quad_Object): void {
    this.push(this.util.dataFactory.quad(subject, predicate, object, this.defaultGraph));
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
