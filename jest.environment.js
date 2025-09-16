const JSDOMEnvironment = require('jest-environment-jsdom').default;
const util = require('util');

/**
 * Custom Jest Environment based on JSDOMEnvironment to support advanced features.
 *
 * ref: https://github.com/jsdom/jsdom/issues/2524
 * ref: https://github.com/jsdom/jsdom/issues/3363
 */
class CustomJSDOMEnvironment extends JSDOMEnvironment {
  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    await super.setup();
    this.global.TextEncoder = util.TextEncoder;
    this.global.TextDecoder = util.TextDecoder;
    this.global.structuredClone = structuredClone;
  }
}

module.exports = CustomJSDOMEnvironment;
