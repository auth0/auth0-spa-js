export const acquireLockMock = jest.fn();
export const releaseLockMock = jest.fn();

export default class FakeLock {
  acquireLock = acquireLockMock;
  releaseLock = releaseLockMock;
}
