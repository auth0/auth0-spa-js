import {
  WorkerClearMessage,
  WorkerRefreshTokenMessage,
  WorkerRevokeTokenMessage
} from './worker.types';

/**
 * Sends a message to a Web Worker and returns a Promise that resolves with
 * the worker's response, or rejects if the worker replies with an error.
 *
 * Uses a {@link MessageChannel} so each call gets its own private reply port,
 * making concurrent calls safe without shared state.
 *
 * @param message - The typed message to send (`refresh` or `revoke`).
 * @param to      - The target {@link Worker} instance.
 * @returns A Promise that resolves with the worker's response payload.
 */
export const sendMessage = <T = any>(
  message:
    | WorkerRefreshTokenMessage
    | WorkerRevokeTokenMessage
    | WorkerClearMessage,
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
