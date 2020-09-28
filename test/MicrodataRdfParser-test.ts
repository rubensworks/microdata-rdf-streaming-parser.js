import { PassThrough } from 'stream';
import { DataFactory } from 'rdf-data-factory';
import 'jest-rdf';
import type * as RDF from 'rdf-js';
import type { IHtmlParseListener } from '../lib/IHtmlParseListener';
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

    describe('should error', () => {
      it('when an error is thrown in onTagClose', async() => {
        parser.onTagClose = () => {
          throw new Error('Dummy error');
        };
        await expect(parse(parser, `<html>
<head></head>
<body>
    <h2 property="http://purl.org/dc/terms/title">The Trouble with Bob</h2>
</body>
</html>`)).rejects.toThrow(new Error('Dummy error'));
      });

      it('when an error is thrown in onTagOpen', async() => {
        parser.onTagOpen = () => {
          throw new Error('Dummy error');
        };
        await expect(parse(parser, `<html>
<head></head>
<body>
    <h2 property="http://purl.org/dc/terms/title">The Trouble with Bob</h2>
</body>
</html>`)).rejects.toThrow(new Error('Dummy error'));
      });

      it('when an error is thrown in onText', async() => {
        parser.onText = () => {
          throw new Error('Dummy error');
        };
        await expect(parse(parser, `<html>
<head></head>
<body>
    <h2 property="http://purl.org/dc/terms/title">The Trouble with Bob</h2>
</body>
</html>`)).rejects.toThrow(new Error('Dummy error'));
      });

      it('when an error is thrown in onEnd', async() => {
        parser.onEnd = () => {
          throw new Error('Dummy error');
        };
        await expect(parse(parser, `<html>
<head></head>
<body>
    <h2 property="http://purl.org/dc/terms/title">The Trouble with Bob</h2>
</body>
</html>`)).rejects.toThrow(new Error('Dummy error'));
      });
    });

    describe('should parse', () => {
      it('an empty document', async() => {
        expect(await parse(parser, ``))
          .toBeRdfIsomorphic([]);
      });

      it('a document without item scopes', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span>
        <span itemprop="http://example.org/prop1">abc</span>
        <span itemprop="http://example.org/prop2">def</span>
        <span itemprop="http://example.org/prop3">ghi</span>
    </span>
</body>
</html>`))
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

      it('an itemscope with itemprop', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span itemscope><span itemprop="http://example.org/prop">abc</span></span>
</body>
</html>`))
          .toBeRdfIsomorphic([
            quad('_:b0', 'http://example.org/prop', '"abc"'),
          ]);
      });

      it('an itemscope with itemprop without value', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span itemscope><span itemprop="http://example.org/prop"></span></span>
</body>
</html>`))
          .toBeRdfIsomorphic([
            quad('_:b0', 'http://example.org/prop', '""'),
          ]);
      });

      it('an itemscope with space-separated itemprops', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span itemscope><span itemprop="http://example.org/prop1 http://example.org/prop2">abc</span></span>
</body>
</html>`))
          .toBeRdfIsomorphic([
            quad('_:b0', 'http://example.org/prop1', '"abc"'),
            quad('_:b0', 'http://example.org/prop2', '"abc"'),
          ]);
      });

      it('an itemscope with itemprop with relative URL', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span itemscope itemtype="http://example.org/Type"><span itemprop="prop">abc</span></span>
</body>
</html>`))
          .toBeRdfIsomorphic([
            quad('_:b0', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://example.org/Type'),
            quad('_:b0', 'http://example.org/prop', '"abc"'),
          ]);
      });

      it('an itemscope with itemprop with relative URL without vocab', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span itemscope><span itemprop="prop">abc</span></span>
</body>
</html>`))
          .toBeRdfIsomorphic([]);
      });

      it('an itemscope with itemprop with relative URL and itemid', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span itemscope itemtype="http://example.org/Type" itemid="http://example.org/id"><span itemprop="prop">abc</span></span>
</body>
</html>`))
          .toBeRdfIsomorphic([
            quad('http://example.org/id', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://example.org/Type'),
            quad('http://example.org/id', 'http://example.org/prop', '"abc"'),
          ]);
      });

      it('an itemscope with itemprop and newlines surrounding the prop tag', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span itemscope>
        <span itemprop="http://example.org/prop">abc</span>
    </span>
</body>
</html>`))
          .toBeRdfIsomorphic([
            quad('_:b0', 'http://example.org/prop', '"abc"'),
          ]);
      });

      it('an itemscope with multiple itemprops', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span itemscope>
        <span itemprop="http://example.org/prop1">abc</span>
        <span itemprop="http://example.org/prop2">def</span>
        <span itemprop="http://example.org/prop3">ghi</span>
    </span>
</body>
</html>`))
          .toBeRdfIsomorphic([
            quad('_:b0', 'http://example.org/prop1', '"abc"'),
            quad('_:b0', 'http://example.org/prop2', '"def"'),
            quad('_:b0', 'http://example.org/prop3', '"ghi"'),
          ]);
      });

      it('an itemscope with itemprop with relative URL for hcard', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span itemscope itemtype="http://microformats.org/profile/hcard"><span itemprop="prop">abc</span></span>
</body>
</html>`))
          .toBeRdfIsomorphic([
            quad('_:b0', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://microformats.org/profile/hcard'),
            quad('_:b0', 'http://microformats.org/profile/hcard#prop', '"abc"'),
          ]);
      });
    });
  });

  describe('a default instance with an HTML listener', () => {
    let parser: MicrodataRdfParser;
    let htmlParseListener: IHtmlParseListener;

    beforeEach(() => {
      htmlParseListener = {
        onEnd: jest.fn(),
        onTagClose: jest.fn(),
        onTagOpen: jest.fn(),
        onText: jest.fn(),
      };
      parser = new MicrodataRdfParser({ baseIRI: 'http://example.org/', htmlParseListener });
    });

    describe('should parse', () => {
      it('and call the HTML listener', async() => {
        expect(await parse(parser, `<html>
<head></head>
<body>
    <span itemscope>
        <span itemprop="http://example.org/prop1">abc</span>
        <span itemprop="http://example.org/prop2">def</span>
        <span itemprop="http://example.org/prop3">ghi</span>
    </span>
</body>
</html>`))
          .toBeRdfIsomorphic([
            quad('_:b0', 'http://example.org/prop1', '"abc"'),
            quad('_:b0', 'http://example.org/prop2', '"def"'),
            quad('_:b0', 'http://example.org/prop3', '"ghi"'),
          ]);
        expect(htmlParseListener.onTagOpen).toHaveBeenCalledTimes(7);
        expect(htmlParseListener.onTagOpen).toHaveBeenNthCalledWith(1, 'html', {});
        expect(htmlParseListener.onTagOpen).toHaveBeenNthCalledWith(2, 'head', {});
        expect(htmlParseListener.onTagOpen).toHaveBeenNthCalledWith(3, 'body', {});
        expect(htmlParseListener.onTagOpen).toHaveBeenNthCalledWith(4, 'span', {
          itemscope: '',
        });
        expect(htmlParseListener.onTagOpen).toHaveBeenNthCalledWith(5, 'span', {
          itemprop: 'http://example.org/prop1',
        });
        expect(htmlParseListener.onTagOpen).toHaveBeenNthCalledWith(6, 'span', {
          itemprop: 'http://example.org/prop2',
        });
        expect(htmlParseListener.onTagOpen).toHaveBeenNthCalledWith(7, 'span', {
          itemprop: 'http://example.org/prop3',
        });

        expect(htmlParseListener.onTagClose).toHaveBeenCalledTimes(7);

        expect(htmlParseListener.onText).toHaveBeenCalledTimes(12);
        expect(htmlParseListener.onText).toHaveBeenNthCalledWith(1, '\n');
        expect(htmlParseListener.onText).toHaveBeenNthCalledWith(2, '\n');
        expect(htmlParseListener.onText).toHaveBeenNthCalledWith(3, '\n    ');
        expect(htmlParseListener.onText).toHaveBeenNthCalledWith(4, '\n        ');
        expect(htmlParseListener.onText).toHaveBeenNthCalledWith(5, 'abc');
        expect(htmlParseListener.onText).toHaveBeenNthCalledWith(6, '\n        ');
        expect(htmlParseListener.onText).toHaveBeenNthCalledWith(7, 'def');
        expect(htmlParseListener.onText).toHaveBeenNthCalledWith(8, '\n        ');
        expect(htmlParseListener.onText).toHaveBeenNthCalledWith(9, 'ghi');
        expect(htmlParseListener.onText).toHaveBeenNthCalledWith(10, '\n    ');
        expect(htmlParseListener.onText).toHaveBeenNthCalledWith(11, '\n');
        expect(htmlParseListener.onText).toHaveBeenNthCalledWith(12, '\n');

        expect(htmlParseListener.onEnd).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('#import', () => {
    let parser: MicrodataRdfParser;

    beforeAll(() => {
      parser = new MicrodataRdfParser({ baseIRI: 'http://example.org/' });
    });

    it('should parse a stream', async() => {
      const stream = streamifyString(`<html>
<head></head>
<body>
    <span itemscope itemtype="http://example.org/Type"></span>
</body>
</html>`);
      expect(await arrayifyStream(parser.import(stream))).toBeRdfIsomorphic([
        quad('_:b0', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://example.org/Type'),
      ]);
    });

    it('should parse another stream', async() => {
      const stream = streamifyString(`<html>
<head></head>
<body>
    <span itemscope itemtype="http://example.org/Type"></span>
</body>
</html>`);
      expect(await arrayifyStream(parser.import(stream))).toBeRdfIsomorphic([
        quad('_:b0', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'http://example.org/Type'),
      ]);
    });

    it('should forward error events', async() => {
      const stream = new PassThrough();
      stream._read = () => stream.emit('error', new Error('my error'));
      await expect(arrayifyStream(parser.import(stream))).rejects.toThrow(new Error('my error'));
    });
  });
});

function parse(parser: MicrodataRdfParser, input: string): Promise<RDF.Quad[]> {
  return arrayifyStream(streamifyString(input).pipe(parser));
}
