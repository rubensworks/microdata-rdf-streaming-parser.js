import { DataFactory } from 'rdf-data-factory';
import 'jest-rdf';
import type * as RDF from 'rdf-js';
import { MicrodataRdfParser } from '../lib/MicrodataRdfParser';
const arrayifyStream = require('arrayify-stream');
const quad = require('rdf-quad');
const streamifyString = require('streamify-string');

const DF = new DataFactory();

describe('MicrodataRdfParser', () => {
  it('should be constructable without args', () => {
    const instance = new MicrodataRdfParser();
    expect(instance).toBeInstanceOf(MicrodataRdfParser);
    expect((<any>instance).util.dataFactory).toBeInstanceOf(DataFactory);
    expect((<any>instance).util.baseIRI).toEqualRdfTerm(DF.namedNode(''));
    expect((<any>instance).defaultGraph).toBe(DF.defaultGraph());
  });

  it('should be constructable with empty args', () => {
    const instance = new MicrodataRdfParser({});
    expect(instance).toBeInstanceOf(MicrodataRdfParser);
    expect((<any>instance).util.dataFactory).toBeInstanceOf(DataFactory);
    expect((<any>instance).util.baseIRI).toEqualRdfTerm(DF.namedNode(''));
    expect((<any>instance).defaultGraph).toBe(DF.defaultGraph());
  });

  it('should be constructable with args with a custom data factory', () => {
    const dataFactory: any = { defaultGraph: () => 'abc', namedNode: () => DF.namedNode('abc') };
    const instance = new MicrodataRdfParser({ dataFactory });
    expect(instance).toBeInstanceOf(MicrodataRdfParser);
    expect((<any>instance).util.dataFactory).toBe(dataFactory);
    expect((<any>instance).util.baseIRI).toEqualRdfTerm(DF.namedNode('abc'));
    expect((<any>instance).defaultGraph).toBe('abc');
  });

  it('should be constructable with args with a custom base IRI', () => {
    const instance = new MicrodataRdfParser({ baseIRI: 'myBaseIRI' });
    expect(instance).toBeInstanceOf(MicrodataRdfParser);
    expect((<any>instance).util.dataFactory).toBeInstanceOf(DataFactory);
    expect((<any>instance).util.baseIRI).toEqualRdfTerm(DF.namedNode('myBaseIRI'));
    expect((<any>instance).defaultGraph).toBe(DF.defaultGraph());
  });

  it('should be constructable with args with a custom default graph', () => {
    const defaultGraph = DF.namedNode('abc');
    const instance = new MicrodataRdfParser({ defaultGraph });
    expect(instance).toBeInstanceOf(MicrodataRdfParser);
    expect((<any>instance).util.dataFactory).toBeInstanceOf(DataFactory);
    expect((<any>instance).util.baseIRI).toEqualRdfTerm(DF.namedNode(''));
    expect((<any>instance).defaultGraph).toBe(defaultGraph);
  });

  it('should be constructable with args with a custom data factory, base IRI and default graph', () => {
    const dataFactory: any = { defaultGraph: () => 'abc', namedNode: () => DF.namedNode('abc') };
    const defaultGraph = DF.namedNode('abc');
    const instance = new MicrodataRdfParser({ dataFactory, baseIRI: 'myBaseIRI', defaultGraph });
    expect(instance).toBeInstanceOf(MicrodataRdfParser);
    expect((<any>instance).util.dataFactory).toBe(dataFactory);
    expect((<any>instance).util.baseIRI).toEqualRdfTerm(DF.namedNode('abc'));
    expect((<any>instance).defaultGraph).toBe(defaultGraph);
  });

  describe('a default instance', () => {
    let parser: MicrodataRdfParser;

    beforeEach(() => {
      parser = new MicrodataRdfParser({ baseIRI: 'http://example.org/' });
    });

    describe('should parse', () => {
      it('an empty document', async() => {
        expect(await parse(parser, ``))
          .toBeRdfIsomorphic([]);
      });

      it('an itemscope with itemtype', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span itemscope itemtype="http://example.org/Type"></span>
</body>
</html>`))
          .toBeRdfIsomorphic([
            quad('_:b0', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://example.org/Type'),
          ]);
      });

      it('an itemscope with itemtype and itemid', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span
    itemscope
    itemtype="http://example.org/Type"
    itemid="http://example.org/id"></span>
</body>
</html>`))
          .toBeRdfIsomorphic([
            quad('http://example.org/id', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://example.org/Type'),
          ]);
      });

      it('an itemscope with itemtype containing multiple spaced values', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span itemscope itemtype="http://example.org/Type1 http://example.org/Type2"></span>
</body>
</html>`))
          .toBeRdfIsomorphic([
            quad('_:b0', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://example.org/Type1'),
            quad('_:b0', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://example.org/Type2'),
          ]);
      });

      it('an itemscope with itemtype containing multiple tabbed values', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span itemscope itemtype="http://example.org/Type1\thttp://example.org/Type2"></span>
</body>
</html>`))
          .toBeRdfIsomorphic([
            quad('_:b0', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://example.org/Type1'),
            quad('_:b0', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://example.org/Type2'),
          ]);
      });

      it('an itemscope with itemtype containing multiple newlined values', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span itemscope itemtype="http://example.org/Type1
    http://example.org/Type2"></span>
</body>
</html>`))
          .toBeRdfIsomorphic([
            quad('_:b0', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://example.org/Type1'),
            quad('_:b0', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://example.org/Type2'),
          ]);
      });
    });
  });

  describe('#import', () => {
    let parser;

    beforeAll(() => {
      parser = new MicrodataRdfParser({ baseIRI: 'http://example.org/' });
    });

    // TODO
  });
});

function parse(parser: MicrodataRdfParser, input: string): Promise<RDF.Quad[]> {
  return arrayifyStream(streamifyString(input).pipe(parser));
}
