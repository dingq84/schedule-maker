// Singleton Pattern
class ClientDatabase {
  private static instance: ClientDatabase | undefined
  private _isDirty: boolean = false

  constructor(
    public databaseName: string,
    public version: number,
    public tableName: string,
  ) {
    // If ClientDatabase.instance exist, no new instance will be initialized,
    // because only one instance of database cas exist at a time.
    if (ClientDatabase.instance) {
      return ClientDatabase.instance
    }

    ClientDatabase.instance = this
  }

  get isDirty() {
    return this._isDirty
  }

  resetIsDirty() {
    this._isDirty = false
  }

  static deleteDatabase() {
    return new Promise((resolve, reject) => {
      const req = window.indexedDB.deleteDatabase('supportDatabase')
      req.onsuccess = () => {
        resolve('success')
      }
      req.onerror = () => {
        reject(new Error("Couldn't delete database"))
      }
      req.onblocked = () => {
        reject(
          new Error(
            "Couldn't delete database due to the operation being blocked",
          ),
        )
      }
    })
  }

  close(db: IDBDatabase) {
    db.close()
    ClientDatabase.instance = undefined
  }

  async openDatabase({
    keyPath = 'id',
    callback,
  }: // eslint-disable-next-line no-undef
  Pick<IDBObjectStoreParameters, 'keyPath'> & {
    callback?: Function
  } = {}): Promise<IDBDatabase> {
    let indexedDB: null | IDBFactory = null
    if (window.indexedDB) {
      indexedDB = window.indexedDB
    } else {
      // For testing database
      // ;({ default: indexedDB } = await import('fake-indexeddb'))
    }
    return new Promise((resolve, reject) => {
      const open = indexedDB!.open(this.databaseName, this.version)

      open.onerror = (event) => {
        return reject(event)
      }

      open.onsuccess = () => {
        return resolve(open.result)
      }

      open.onupgradeneeded = (e) => {
        // If the database does not exist or
        // the version of the database is not equal to the current version,
        // this function will be executed.
        const db: IDBDatabase = (e.target as any).result

        db.onerror = (event) => {
          return reject(event)
        }
        const objectStore = db.createObjectStore(this.tableName, {
          keyPath,
        })

        callback && callback(objectStore)

        if (!db.objectStoreNames.contains('timestamp')) {
          const timeStampObjectStore = db.createObjectStore('timestamp', {
            keyPath: 'key',
          })
          timeStampObjectStore.createIndex('time', 'time', { unique: false })
        }
      }
    })
  }

  getAllIndex(db: IDBDatabase) {
    const tx = db.transaction(this.tableName, 'readonly')
    const store = tx.objectStore(this.tableName)
    return new Promise((resolve, reject) => {
      tx.onerror = () => {
        return reject(
          new Error(`Transaction not opened due to error: ${tx.error}`),
        )
      }

      tx.oncomplete = () => {
        return resolve(store.indexNames)
      }
    })
  }

  updateTimestamp(
    db: IDBDatabase,
    data: { key: string; time: number },
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('timestamp', 'readwrite')

      tx.onerror = () => {
        return reject(
          new Error(`Transaction not opened due to error: ${tx.error}`),
        )
      }

      const store = tx.objectStore('timestamp')
      const request = store.put(data)

      request.onsuccess = () => {
        return resolve('success')
      }

      request.onerror = () => {
        return reject(
          new Error(
            `There has been an error with retrieving your data: ${request.error}`,
          ),
        )
      }
    })
  }

  getTimestamp(
    db: IDBDatabase,
    query?: IDBKeyRange | null | undefined,
  ): Promise<{ key: string; time: number }[]> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('timestamp', 'readonly')

      tx.onerror = () => {
        // If transaction has error, it will be rollback.
        return reject(
          new Error(`Transaction not opened due to error: ${tx.error}`),
        )
      }

      const store = tx.objectStore('timestamp')
      const index = store.index('time')
      const request = index.getAll(query)

      request.onsuccess = () => {
        return resolve(request.result || '')
      }

      request.onerror = () => {
        return reject(
          new Error(
            `There has been an error with retrieving your data: ${request.error}`,
          ),
        )
      }
    })
  }

  addData<T extends unknown>(
    db: IDBDatabase,
    data: T | T[],
    originalStore?: IDBObjectStore,
  ) {
    return new Promise((resolve, reject) => {
      let store = originalStore
      if (store === undefined) {
        const tx = db.transaction(this.tableName, 'readwrite')
        store = tx.objectStore(this.tableName)

        tx.onerror = () => {
          return reject(
            new Error(`Transaction not opened due to error: ${tx.error}`),
          )
        }
      }

      let request: IDBRequest | null = null
      if (Array.isArray(data)) {
        data.forEach((item) => (request = store!.add(item)))
      } else {
        request = store.add(data)
      }

      request!.onerror = () => {
        return reject(
          new Error(
            `There has been an error with adding your data: ${request!.error}`,
          ),
        )
      }

      request!.onsuccess = () => {
        this._isDirty = true
        return resolve('success')
      }
    })
  }

  deleteData(
    db: IDBDatabase,
    // eslint-disable-next-line no-undef
    data: IDBValidKey | IDBValidKey[],
    table: string = this.tableName,
    originalStore?: IDBObjectStore,
  ) {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line no-undef
      let dataList: IDBValidKey[] = []
      if (Array.isArray(data)) {
        dataList = data
      } else {
        dataList.push(data)
      }

      let store = originalStore
      if (store === undefined) {
        const tx = db.transaction(table, 'readwrite')
        store = tx.objectStore(table)

        tx.onerror = () => {
          return reject(
            new Error(`Transaction not opened due to error: ${tx.error}`),
          )
        }
      }

      const getDataPromises = dataList.map((item) =>
        this.getData(db, item, store),
      )

      Promise.all(getDataPromises)
        .then(() => {
          let request: null | IDBRequest = null
          dataList.forEach((data) => (request = store!.delete(data)))

          request!.onerror = () => {
            return reject(
              new Error(
                `There has been an error with adding your data: ${
                  request!.error
                }`,
              ),
            )
          }

          request!.onsuccess = () => {
            this._isDirty = true
            return resolve('success')
          }
        })
        .catch((event) => reject(event))
    })
  }

  deleteDataByIndex(db: IDBDatabase, key: string, query: IDBKeyRange) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.tableName, 'readwrite')

      tx.onerror = () => {
        return reject(
          new Error(`Transaction not opened due to error: ${tx.error}`),
        )
      }

      const store = tx.objectStore(this.tableName)
      const index = store.index(key)
      const cursors = index.openKeyCursor(query)

      cursors.onsuccess = () => {
        this._isDirty = true
        const cursor = cursors.result
        if (cursor) {
          store.delete(cursor.primaryKey)
          cursor.continue()
        } else {
          return resolve('success')
        }
      }

      cursors.onerror = () => {
        return reject(
          new Error(
            `There has been an error with remove your data: ${cursors.error}`,
          ),
        )
      }
    })
  }

  updateData(
    db: IDBDatabase,
    data: any | any[],
    originalStore?: IDBObjectStore,
  ) {
    return new Promise((resolve, reject) => {
      let dataList: any[] = []
      if (Array.isArray(data)) {
        dataList = data
      } else {
        dataList.push(data)
      }

      let store = originalStore

      if (store === undefined) {
        const tx = db.transaction(this.tableName, 'readwrite')
        store = tx.objectStore(this.tableName)

        tx.onerror = () => {
          return reject(
            new Error(`Transaction not opened due to error: ${tx.error}`),
          )
        }
      }

      const getDataPromises = dataList.map((item) =>
        this.getData(db, item.id, store),
      )
      Promise.all(getDataPromises)
        .then(() => {
          let request: null | IDBRequest = null
          dataList.forEach((item) => {
            request = store!.put(item)
          })

          request!.onerror = () => {
            return reject(
              new Error(
                `There has been an error with adding your data: ${
                  request!.error
                }`,
              ),
            )
          }

          request!.onsuccess = () => {
            this._isDirty = true
            return resolve('success')
          }
        })
        .catch((event) => {
          return reject(event)
        })
    })
  }

  getData<T extends unknown>(
    db: IDBDatabase,
    // eslint-disable-next-line no-undef
    key: IDBValidKey,
    originalStore?: IDBObjectStore,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let store = originalStore
      if (store === undefined) {
        const tx = db.transaction(this.tableName, 'readonly')
        store = tx.objectStore(this.tableName)

        tx.onerror = () => {
          return reject(
            new Error(`Transaction not opened due to error: ${tx.error}`),
          )
        }
      }

      const request = store.get(key)

      request.onsuccess = () => {
        const { result } = request
        if (result === undefined) {
          // if key does not exist, the transaction will be continued,
          // so we need to shut down
          store!.transaction.abort()
          return reject(new Error('it is not found'))
        } else {
          return resolve(result)
        }
      }

      request.onerror = () => {
        return reject(
          new Error(
            `There has been an error with retrieving your data: ${request.error}`,
          ),
        )
      }
    })
  }

  getDataByKey<T extends unknown>(
    db: IDBDatabase,
    query?: string,
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.tableName, 'readonly')

      tx.onerror = () => {
        return reject(
          new Error(`Transaction not opened due to error: ${tx.error}`),
        )
      }

      const store = tx.objectStore(this.tableName)
      const request = store.getAll(query)

      request.onsuccess = () => {
        return resolve(request.result)
      }

      request.onerror = () => {
        return reject(
          new Error(
            `There has been an error with retrieving your data: ${request.error}`,
          ),
        )
      }
    })
  }

  getDataByIndex<T extends unknown>(
    db: IDBDatabase,
    indexName: string,
    query?: string,
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.tableName, 'readwrite')

      tx.onerror = () => {
        return reject(
          new Error(`Transaction not opened due to error: ${tx.error}`),
        )
      }

      const store = tx.objectStore(this.tableName)

      try {
        const index = store.index(indexName)
        const request = index.getAll(query)

        request.onsuccess = (): any => {
          return resolve(request.result)
        }

        request.onerror = () => {
          return reject(
            new Error(
              `There has been an error with retrieving your data: ${request.error}`,
            ),
          )
        }
      } catch (event) {
        return reject(
          new Error(`There has been an error with open your index: ${event}`),
        )
      }
    })
  }

  clearAllData(db: IDBDatabase): Promise<string> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.tableName, 'readwrite')

      // Transaction not opened due to error
      tx.onerror = () => {
        return reject(
          new Error(`Transaction not opened due to error: ${tx.error}`),
        )
      }

      const store = tx.objectStore(this.tableName)
      const request = store.clear()

      request.onerror = () => {
        return reject(
          new Error(
            `There has been an error with retrieving your data: ${request.error}`,
          ),
        )
      }

      request.onsuccess = () => {
        this._isDirty = true
        return resolve('success')
      }
    })
  }
}

export default ClientDatabase
