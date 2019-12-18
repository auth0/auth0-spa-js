class ProcessLocking {
    static instance: undefined | ProcessLocking;
    private locked: Map<string, (() => void)[]> = new Map<string, (() => void)[]>();


    static getInstance() {
        if (ProcessLocking.instance === undefined) {
            ProcessLocking.instance = new ProcessLocking();
        }
        return ProcessLocking.instance;
    }

    private addToLocked = (key: string, toAdd?: () => void) => {
        let callbacks = this.locked.get(key);
        if (callbacks === undefined) {
            if (toAdd === undefined) {
                this.locked.set(key, []);
            } else {
                this.locked.set(key, [toAdd]);
            }
        } else {
            if (toAdd !== undefined) {
                callbacks.unshift(toAdd);
                this.locked.set(key, callbacks);
            }
        }
    }

    isLocked = (key: string): boolean => {
        return this.locked.has(key);
    }

    lock = (key: string): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            if (this.isLocked(key)) {
                this.addToLocked(key, resolve);
            } else {
                this.addToLocked(key);
                resolve();
            }
        });
    }

    unlock = (key: string) => {
        let callbacks = this.locked.get(key);
        if (callbacks === undefined || callbacks.length === 0) {
            this.locked.delete(key);
            return;
        }
        let toCall = callbacks.pop();
        this.locked.set(key, callbacks);
        if (toCall !== undefined) {
            setTimeout(toCall, 0);
        }
    }
}

export default function getLock(): ProcessLocking {
    return ProcessLocking.getInstance();
}