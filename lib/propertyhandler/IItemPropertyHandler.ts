import type * as RDF from 'rdf-js';
import type { IItemScope } from '../IItemScope';
import type { Util } from '../Util';

/**
 * Interface for handling special types of item properties.
 */
export interface IItemPropertyHandler {
  canHandle: (tagName: string, attributes: {[s: string]: string}) => boolean;
  getObject: (attributes: {[s: string]: string}, util: Util, itemScope: IItemScope) => RDF.Quad_Object;
}
