const JSDOMEnvironment = require('jest-environment-jsdom');
const util = require('util');

class CustomEnvironment extends JSDOMEnvironment {
  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    await super.setup();
    this.global.TextEncoder = util.TextEncoder;
    this.global.TextDecoder = util.TextDecoder;
  }
}

module.exports = CustomEnvironment;
