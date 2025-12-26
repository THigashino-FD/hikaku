import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface ImageRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob | ArrayBuffer; // WebKitでの不具合回避のためArrayBufferを許容
  width: number;
  height: number;
  sourceUrl?: string; // URL経由で取り込んだ画像の元URL（共有用）
  createdAt: number;
}

// 公開APIで使用する型（blobは必ずBlobとして返される）
export type ImageRecordWithBlob = Omit<ImageRecord, 'blob'> & { blob: Blob };

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
const DB_VERSION = 4; // 既存データベースのバージョンに合わせて更新

let dbInstance: IDBPDatabase<HikakuDB> | null = null;

// WebKitでのIndexedDBの問題を回避するため、キャッシュを無効化する関数
function isWebKit(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('webkit') && !ua.includes('chrome');
}

// WebKit環境では、データベース接続を強制的に再作成する
export function resetDBInstance(): void {
  if (isWebKit()) {
    dbInstance = null;
  }
}

export async function getDB(): Promise<IDBPDatabase<HikakuDB>> {
  // WebKit環境では、キャッシュされたインスタンスを使用しない（問題回避のため）
  if (dbInstance && !isWebKit()) {
    return dbInstance;
  }
  
  // WebKit環境では、既存のインスタンスをクリア
  if (isWebKit() && dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  
  // WebKitでのIndexedDBの準備を確認
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    try {
      // IndexedDBが利用可能か確認（プライベートブラウジングモードのチェック）
      const testDB = indexedDB.open('__test_db__');
      testDB.onerror = () => {
        indexedDB.deleteDatabase('__test_db__');
      };
      testDB.onsuccess = () => {
        indexedDB.deleteDatabase('__test_db__');
      };
    } catch {
      // IndexedDBが利用できない場合
      throw new Error('このブラウザではIndexedDBが利用できません');
    }
  }
  
  try {
    // WebKitでのタイミング問題を回避するため、少し待機
    if (isWebKit()) {
      await new Promise(resolve => setTimeout(resolve, 100));
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
  } catch (error) {
    throw error;
  }
}

// ========== Images ==========
export async function getAllImages(): Promise<ImageRecordWithBlob[]> {
  const db = await getDB();
  const images = await db.getAllFromIndex('images', 'by-createdAt');
  
  // ArrayBufferをBlobに戻す
  return images.map(img => ({
    ...img,
    blob: img.blob instanceof ArrayBuffer ? new Blob([img.blob], { type: img.type }) : img.blob
  }));
}

export async function getImageById(id: string): Promise<ImageRecordWithBlob | undefined> {
  const db = await getDB();
  const img = await db.get('images', id);
  if (!img) return undefined;
  
  // ArrayBufferをBlobに戻す
  return {
    ...img,
    blob: img.blob instanceof ArrayBuffer ? new Blob([img.blob], { type: img.type }) : img.blob
  };
}

export async function addImage(image: ImageRecord): Promise<void> {
  const db = await getDB();
  
  // WebKitでの不具合回避のため、BlobをArrayBufferに変換
  if (image.blob instanceof Blob && isWebKit()) {
    const arrayBuffer = await image.blob.arrayBuffer();
    image.blob = arrayBuffer;
  }
  
  const tx = db.transaction('images', 'readwrite');
  await tx.store.add(image);
  await tx.done; // WebKitでのトランザクション完了を明示的に待つ
}

export async function deleteImage(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('images', 'readwrite');
  await tx.store.delete(id);
  await tx.done; // WebKitでのトランザクション完了を明示的に待つ
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
  const tx = db.transaction('cases', 'readwrite');
  await tx.store.add(caseRecord);
  await tx.done; // WebKitでのトランザクション完了を明示的に待つ
}

export async function updateCase(caseRecord: CaseRecord): Promise<void> {
  const db = await getDB();
  caseRecord.updatedAt = Date.now();
  const tx = db.transaction('cases', 'readwrite');
  await tx.store.put(caseRecord);
  await tx.done; // WebKitでのトランザクション完了を明示的に待つ
}

export async function deleteCase(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('cases', 'readwrite');
  await tx.store.delete(id);
  await tx.done; // WebKitでのトランザクション完了を明示的に待つ
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
  const tx = db.transaction('app', 'readwrite');
  await tx.store.put({ key, value });
  await tx.done; // WebKitでのトランザクション完了を明示的に待つ
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

