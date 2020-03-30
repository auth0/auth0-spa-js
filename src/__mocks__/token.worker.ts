const { createMessageHandler } = jest.requireActual('../token.worker');

export default class {
  private handler: any;
  addEventListener(type, cb) {
    this.handler = createMessageHandler(cb);
  }
  postMessage(message) {
    this.handler(message);
  }
}
