/*
  Purpose of this file is to set up DOM so Mocha can test front-end code
  entirely within Node. This is required by Mocha CLI command.
*/
let path = require("path");

// Point to right tsconfig
require("ts-node").register({
  project: path.join(__dirname, "tsconfig.test.json")
});

// Create a DOM for React and other libs to play with
function createDOM() {
  // if DOM alredy exists, we don't need to do anything
  if (typeof document !== 'undefined') {
    return;
  }

  const baseDOM =
    '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
    '<body></body></html>';

  const JSDOM = require('jsdom').JSDOM;
  const jsdom = new JSDOM(baseDOM);
  const window = jsdom.window;

  function copyProps(src, target) {
  const props = Object.getOwnPropertyNames(src)
      .filter(prop => typeof target[prop] === 'undefined')
      .map(prop => Object.getOwnPropertyDescriptor(src, prop));
    Object.defineProperties(target, props);
  }

  global.window = window;
  global.document = window.document;
  global.navigator = {
    userAgent: 'node.js',
  };
  copyProps(window, global);
}

module.exports = createDOM();
