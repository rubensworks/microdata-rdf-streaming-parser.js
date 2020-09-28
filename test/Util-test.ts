import { DataFactory } from 'rdf-data-factory';
import 'jest-rdf';
import { Util } from '../lib/Util';

const DF = new DataFactory();

describe('Util', () => {
  it('should be constructable with undefined dataFactory and undefined baseIRI', () => {
    const instance = new Util(undefined, undefined);
    expect(instance).toBeInstanceOf(Util);
    expect((<any> instance).dataFactory).toBeInstanceOf(DataFactory);
    expect((<any> instance).baseIRI).toEqualRdfTerm(DF.namedNode(''));
  });

  it('should be constructable with non-null dataFactory and non-null baseIRI', () => {
    const dataFactory: any = { defaultGraph: () => 'abc', namedNode: () => DF.namedNode('abc') };
    const instance = new Util(dataFactory, 'abc');
    expect(instance).toBeInstanceOf(Util);
    expect((<any> instance).dataFactory).toBe(dataFactory);
    expect((<any> instance).baseIRI).toEqualRdfTerm(DF.namedNode('abc'));
  });

  describe('#isValidIri', () => {
    it('should be false for a plain string', async() => {
      expect(Util.isValidIri('string')).toBe(false);
    });

    it('should be true for an IRI', async() => {
      expect(Util.isValidIri('ex:abc')).toBe(true);
    });

    it('should be true for a URL', async() => {
      expect(Util.isValidIri('http://example.org/')).toBe(true);
    });
  });

  describe('a default instance', () => {
    let util: Util;

    beforeEach(() => {
      util = new Util(undefined, 'http://example.org/');
    });

    describe('#getBaseIRI', () => {
      it('should return the baseIRI without hash', async() => {
        expect(util.getBaseIRI('http://base.org/'))
          .toEqualRdfTerm(DF.namedNode('http://base.org/'));
      });

      it('should return the baseIRI with hash', async() => {
        expect(util.getBaseIRI('http://base.org/#hash'))
          .toEqualRdfTerm(DF.namedNode('http://base.org/'));
      });

      it('should return a relative baseIRI', async() => {
        util.baseIRI = DF.namedNode('http://example.org/');
        expect(util.getBaseIRI('abc'))
          .toEqualRdfTerm(DF.namedNode('http://example.org/abc'));
      });
    });

    describe('#deriveVocab', () => {
      it('should remove the hash for an empty registry', async() => {
        expect(util.deriveVocab('http://ex.org/a/b/c#xyz', {}))
          .toEqual('http://ex.org/a/b/c');
      });

      it('should remove the last path segment for an empty registry', async() => {
        expect(util.deriveVocab('http://ex.org/a/b/c', {}))
          .toEqual('http://ex.org/a/b/');
        expect(util.deriveVocab('http://ex.org/a/b/c/', {}))
          .toEqual('http://ex.org/a/b/c/');
      });

      it('should reuse prefixes ending in a slash', async() => {
        expect(util.deriveVocab('http://ex.org/a/b/c#xyz', {
          'http://ex.org/': {},
        })).toEqual('http://ex.org/');
      });

      it('should reuse prefixes not ending in a slash, and append a fragment', async() => {
        expect(util.deriveVocab('http://ex.org/value/b/c#xyz', {
          'http://ex.org/value': {},
        })).toEqual('http://ex.org/value#');
      });
    });
  });
});
