const Lock = jest.requireActual('browser-tabs-lock').default;

export const acquireLockSpy = jest.fn().mockResolvedValue(true);
export const releaseLockSpy = jest.fn();

export default class extends Lock {
  async acquireLock(...args) {
    const canProceed = await acquireLockSpy(...args);
    if (canProceed) {
      return super.acquireLock(...args);
    }
  }
  releaseLock(...args) {
    releaseLockSpy(...args);
    return super.releaseLock(...args);
  }
}
