#!/usr/bin/env node
/* eslint-disable no-console */
import { MicrodataRdfParser } from '..';

if (process.argv.length > 3) {
  console.error('Usage: MicrodataRdfParser-perf.js [file] < input.html');
  process.exit(1);
}

const fileName = process.argv[2];
const baseIRI = fileName ? new URL(fileName, `file://${process.cwd()}/`).href : undefined;
const options = baseIRI ? { baseIRI } : {};

const TEST = baseIRI ? `- Parsing stream ${baseIRI}` : '- Parsing stream';
console.time(TEST);

let count = 0;
process.stdin
  .pipe(new MicrodataRdfParser(options))
  .on('data', () => {
    // Console.log(JSON.stringify(require('rdf-string').quadToStringQuad(data))); // TODO
    count++;
  })
  .on('error', (error) => {
    console.error(error);
    process.exit(1);
  })
  .on('end', () => {
    console.timeEnd(TEST);
    console.log(`* Quads parsed: ${count}`);
    console.log(`* Memory usage: ${Math.round(process.memoryUsage().rss / 1_024 / 1_024)}MB`);
  });
/* eslint-enable no-console */
