import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface ImageRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  width: number;
  height: number;
  sourceUrl?: string; // URL経由で取り込んだ画像の元URL（共有用）
  createdAt: number;
}

export interface ViewSettings {
  scale: number;
  x: number;
  y: number;
}

export interface CaseRecord {
  id: string;
  title: string;
  description?: string;
  order: number;
  beforeImageId?: string;
  afterImageId?: string;
  view: {
    before: ViewSettings;
    after: ViewSettings;
  };
  initialSliderPosition: number; // 初期スライダー位置（0-100%）
  animationType: 'none' | 'demo'; // アニメーション種別
  createdAt: number;
  updatedAt: number;
}

export interface AppConfig<T = unknown> {
  key: string;
  value: T;
}

interface HikakuDB extends DBSchema {
  images: {
    key: string;
    value: ImageRecord;
    indexes: { 'by-createdAt': number };
  };
  cases: {
    key: string;
    value: CaseRecord;
    indexes: { 'by-order': number };
  };
  app: {
    key: string;
    value: AppConfig;
  };
}

const DB_NAME = 'hikaku-editor';
const DB_VERSION = 2; // 初期位置・アニメ種別追加のため更新

let dbInstance: IDBPDatabase<HikakuDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<HikakuDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<HikakuDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // images store
      if (!db.objectStoreNames.contains('images')) {
        const imageStore = db.createObjectStore('images', { keyPath: 'id' });
        imageStore.createIndex('by-createdAt', 'createdAt');
      }

      // cases store
      if (!db.objectStoreNames.contains('cases')) {
        const caseStore = db.createObjectStore('cases', { keyPath: 'id' });
        caseStore.createIndex('by-order', 'order');
      }

      // app store
      if (!db.objectStoreNames.contains('app')) {
        db.createObjectStore('app', { keyPath: 'key' });
      }

      // マイグレーション: v1 -> v2（初期位置・アニメ種別追加）
      if (oldVersion < 2 && (newVersion ?? DB_VERSION) >= 2) {
        const caseStore = transaction.objectStore('cases');
        caseStore.openCursor().then(function migrateCursor(cursor) {
          if (!cursor) return;
          const record = cursor.value as unknown as Partial<CaseRecord>;

          const updated: CaseRecord = {
            id: record.id ?? cursor.primaryKey?.toString?.() ?? "",
            title: record.title ?? "",
            description: record.description,
            order: record.order ?? 0,
            beforeImageId: record.beforeImageId,
            afterImageId: record.afterImageId,
            view:
              record.view ?? {
                before: { scale: 100, x: 0, y: 0 },
                after: { scale: 100, x: 0, y: 0 },
              },
            initialSliderPosition: record.initialSliderPosition ?? 50,
            animationType:
              record.animationType ?? ((record.order ?? 0) === 0 ? 'demo' : 'none'),
            createdAt: record.createdAt ?? Date.now(),
            updatedAt: record.updatedAt ?? Date.now(),
          };

          cursor.update(updated).then(() => {
            return cursor.continue().then(migrateCursor);
          });
        });
      }
    },
  });

  return dbInstance;
}

// ========== Images ==========
export async function getAllImages(): Promise<ImageRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('images', 'by-createdAt');
}

export async function getImageById(id: string): Promise<ImageRecord | undefined> {
  const db = await getDB();
  return db.get('images', id);
}

export async function addImage(image: ImageRecord): Promise<void> {
  const db = await getDB();
  await db.add('images', image);
}

export async function deleteImage(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('images', id);
}

export async function getImagesUsedByCases(): Promise<Map<string, string[]>> {
  const db = await getDB();
  const cases = await db.getAll('cases');
  const usageMap = new Map<string, string[]>();

  cases.forEach((c) => {
    if (c.beforeImageId) {
      if (!usageMap.has(c.beforeImageId)) {
        usageMap.set(c.beforeImageId, []);
      }
      usageMap.get(c.beforeImageId)!.push(`${c.title} (Before)`);
    }
    if (c.afterImageId) {
      if (!usageMap.has(c.afterImageId)) {
        usageMap.set(c.afterImageId, []);
      }
      usageMap.get(c.afterImageId)!.push(`${c.title} (After)`);
    }
  });

  return usageMap;
}

// ========== Cases ==========
export async function getAllCases(): Promise<CaseRecord[]> {
  const db = await getDB();
  const cases = await db.getAllFromIndex('cases', 'by-order');
  return cases;
}

export async function getCaseById(id: string): Promise<CaseRecord | undefined> {
  const db = await getDB();
  return db.get('cases', id);
}

export async function addCase(caseRecord: CaseRecord): Promise<void> {
  const db = await getDB();
  await db.add('cases', caseRecord);
}

export async function updateCase(caseRecord: CaseRecord): Promise<void> {
  const db = await getDB();
  caseRecord.updatedAt = Date.now();
  await db.put('cases', caseRecord);
}

export async function deleteCase(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('cases', id);
}

export async function reorderCases(caseIds: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('cases', 'readwrite');
  
  for (let i = 0; i < caseIds.length; i++) {
    const caseRecord = await tx.store.get(caseIds[i]);
    if (caseRecord) {
      caseRecord.order = i;
      await tx.store.put(caseRecord);
    }
  }
  
  await tx.done;
}

// ========== App Config ==========
export async function getAppConfig<T = unknown>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const config = await db.get('app', key);
  return config?.value as T | undefined;
}

export async function setAppConfig<T = unknown>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('app', { key, value });
}

// ========== Utilities ==========
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['images', 'cases', 'app'], 'readwrite');
  
  await tx.objectStore('images').clear();
  await tx.objectStore('cases').clear();
  await tx.objectStore('app').clear();
  
  await tx.done;
}

export function createObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}

