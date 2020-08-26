const Lock = jest.requireActual('browser-tabs-lock').default;

export const acquireLockSpy = jest.fn();
export const releaseLockSpy = jest.fn();

export default class extends Lock {
  acquireLock(...args) {
    acquireLockSpy(...args);
    return super.acquireLock(...args);
  }
  releaseLock(...args) {
    releaseLockSpy(...args);
    return super.releaseLock(...args);
  }
}
