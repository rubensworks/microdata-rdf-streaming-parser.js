/**
 * An HTML parser event.
 */
export type BufferedTagEvent = {
  type: 'close';
} | {
  type: 'open';
  name: string;
  attributes: {[s: string]: string};
} | {
  type: 'text';
  data: string;
};
