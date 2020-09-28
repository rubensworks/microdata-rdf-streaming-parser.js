import type * as RDF from 'rdf-js';
import type { IItemScope } from '../IItemScope';
import type { Util } from '../Util';
import type { IItemPropertyHandler } from './IItemPropertyHandler';

/**
 * An item property with the 'content' attribute.
 */
export class ItemPropertyHandlerContent implements IItemPropertyHandler {
  public canHandle(tagName: string, attributes: { [p: string]: string }): boolean {
    return 'content' in attributes;
  }

  public getObject(attributes: { [p: string]: string }, util: Util, itemScope: IItemScope): RDF.Quad_Object {
    return util.createLiteral(attributes.content, itemScope);
  }
}
