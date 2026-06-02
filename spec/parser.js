const { MicrodataRdfParser } = require("..");

module.exports = {
  parse: function (data, baseIRI, options) {
    return require('arrayify-stream').arrayifyStream(require('streamify-string')(data)
      .pipe(new MicrodataRdfParser(Object.assign({ baseIRI }, options))));
  },
};
