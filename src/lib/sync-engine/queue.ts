// Queue manager for offline-first sync
// Responsible for persisting mutations/uploads when offline and replaying them when online.

export type SyncItem = {
  id: string;
  type: 'upload_recording' | 'update_metadata' | 'create_profile';
  payload: any;
  createdAt: number;
  retryCount: number;
};

export class SyncQueue {
  async enqueue(item: Omit<SyncItem, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
    // TODO: Implement queue persistence (SQLite/MMKV)
  }

  async peek(): Promise<SyncItem | null> {
    // TODO: Get next item
    return null;
  }

  async dequeue(id: string): Promise<void> {
    // TODO: Remove item
  }
}
