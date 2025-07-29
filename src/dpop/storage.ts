import { type KeyPair } from './utils';

const VERSION = 1;
const NAME = 'auth0-spa-js';
const TABLES = {
  NONCE: 'nonce',
  KEYPAIR: 'keypair'
} as const;

const DEFAULT_OWNER = 'auth0';

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
  ): Promise<T | undefined> {
    const db = await this.getDbHandle();

    const txn = db.transaction(table, mode);
    const store = txn.objectStore(table);

    const request = requestFactory(store);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  protected buildKey(owner?: string): string {
    const finalOwner = owner
      ? `_${owner}` // prefix to avoid collisions
      : DEFAULT_OWNER;

    return `${this.clientId}::${finalOwner}`;
  }

  public setNonce(nonce: string, owner?: string): Promise<void> {
    return this.save(TABLES.NONCE, this.buildKey(owner), nonce);
  }

  public setKeyPair(keyPair: KeyPair): Promise<void> {
    return this.save(TABLES.KEYPAIR, this.buildKey(), keyPair);
  }

  protected async save(
    table: Table,
    key: IDBValidKey,
    obj: unknown
  ): Promise<void> {
    await this.executeDbRequest(table, 'readwrite', table =>
      table.put(obj, key)
    );
  }

  public findNonce(owner?: string): Promise<string | undefined> {
    return this.find(TABLES.NONCE, this.buildKey(owner));
  }

  public findKeyPair(): Promise<KeyPair | undefined> {
    return this.find(TABLES.KEYPAIR, this.buildKey());
  }

  protected find<T = unknown>(
    table: Table,
    key: IDBValidKey
  ): Promise<T | undefined> {
    return this.executeDbRequest(table, 'readonly', table => table.get(key));
  }

  protected async deleteBy(
    table: Table,
    predicate: (key: IDBValidKey) => boolean
  ): Promise<void> {
    const allKeys = await this.executeDbRequest(table, 'readonly', table =>
      table.getAllKeys()
    );

    allKeys
      ?.filter(predicate)
      .map(k =>
        this.executeDbRequest(table, 'readwrite', table => table.delete(k))
      );
  }

  protected async deleteByClientId(
    table: Table,
    clientId: string
  ): Promise<void> {
    return this.deleteBy(
      table,
      k => typeof k === 'string' && k.startsWith(`${clientId}::`)
    );
  }

  public async clearNonces(): Promise<void> {
    return this.deleteByClientId(TABLES.NONCE, this.clientId);
  }

  public async clearKeyPairs(): Promise<void> {
    return this.deleteByClientId(TABLES.KEYPAIR, this.clientId);
  }
}
