const JSDOMEnvironment = require('jest-environment-jsdom').default;
const util = require('util');

/**
 * Custom Jest Environment based on JSDOMEnvironment to support TextEncoder and TextDecoder.
 *
 * ref: https://github.com/jsdom/jsdom/issues/2524
 */
class CustomJSDOMEnvironment extends JSDOMEnvironment {
  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    await super.setup();
    this.global.TextEncoder = util.TextEncoder;
    this.global.TextDecoder = util.TextDecoder;
  }
}

module.exports = CustomJSDOMEnvironment;
