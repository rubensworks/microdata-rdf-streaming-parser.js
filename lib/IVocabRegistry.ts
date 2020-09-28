/**
 * A vocabulary registry.
 * It associates URI prefixes with one or more key-value pairs to denote specific processor behaviour.
 * @link https://w3c.github.io/microdata-rdf/#vocabulary-registry
 * @link https://www.w3.org/ns/md
 */
export interface IVocabRegistry {
  [uriPrefix: string]: any;
}
