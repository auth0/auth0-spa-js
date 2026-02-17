import {
  WorkerRefreshTokenMessage,
  WorkerRevokeTokenMessage
} from './worker.types';

export const sendMessage = <T = any>(
  message: WorkerRefreshTokenMessage | WorkerRevokeTokenMessage,
  to: Worker
): Promise<T> =>
  new Promise<T>(function (resolve, reject) {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = function (event) {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data);
      }
      messageChannel.port1.close();
    };

    to.postMessage(message, [messageChannel.port2]);
  });
