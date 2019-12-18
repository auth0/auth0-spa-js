export default class Lock {
    acquireLock: (lockKey: string, timeout?: number) => Promise<boolean>
    releaseLock: (lockKey: string) => void
}