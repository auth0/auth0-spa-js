import { type KeyPair } from './utils';

const VERSION = 1;
const NAME = 'auth0-spa-js';
const TABLES = {
  NONCE: 'nonce',
  KEYPAIR: 'keypair'
} as const;

type Table = (typeof TABLES)[keyof typeof TABLES];

export class DpopStorage {
  protected readonly clientId: string;
  protected dbHandle: IDBDatabase | undefined;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  protected getVersion(): number {
    return VERSION;
  }

  protected createDbHandle(): Promise<IDBDatabase> {
    const req = window.indexedDB.open(NAME, this.getVersion());

    return new Promise((resolve, reject) => {
      req.onupgradeneeded = () =>
        Object.values(TABLES).forEach(t => req.result.createObjectStore(t));

      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });
  }

  protected async getDbHandle(): Promise<IDBDatabase> {
    if (!this.dbHandle) {
      this.dbHandle = await this.createDbHandle();
    }

    return this.dbHandle;
  }

  protected async executeDbRequest<T = unknown>(
    table: string,
    mode: IDBTransactionMode,
    requestFactory: (table: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    const db = await this.getDbHandle();

    const txn = db.transaction(table, mode);
    const store = txn.objectStore(table);

    const request = requestFactory(store);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public setNonce(nonce: string): Promise<void> {
    return this.save(TABLES.NONCE, this.clientId, nonce);
  }

  public setKeyPair(keyPair: KeyPair): Promise<void> {
    return this.save(TABLES.KEYPAIR, this.clientId, keyPair);
  }

  protected async save(table: Table, key: string, obj: unknown): Promise<void> {
    await this.executeDbRequest(table, 'readwrite', table =>
      table.put(obj, key)
    );
  }

  public findNonce(): Promise<string | undefined> {
    return this.find(TABLES.NONCE, this.clientId);
  }

  public findKeyPair(): Promise<KeyPair | undefined> {
    return this.find(TABLES.KEYPAIR, this.clientId);
  }

  protected find<T = unknown>(
    table: Table,
    key: string
  ): Promise<T | undefined> {
    return this.executeDbRequest(table, 'readonly', table => table.get(key));
  }

  public clearNonces(): Promise<void> {
    return this.clear(TABLES.NONCE, this.clientId);
  }

  public clearKeyPairs(): Promise<void> {
    return this.clear(TABLES.KEYPAIR, this.clientId);
  }

  protected clear(table: Table, key: string): Promise<void> {
    return this.executeDbRequest<undefined>(table, 'readwrite', table =>
      table.delete(key)
    );
  }
}
