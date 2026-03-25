const { messageRouter } = jest.requireActual('../token.worker');

export default class {
  postMessage(data, ports) {
    messageRouter({
      data,
      ports: ports || []
    });
  }
}
