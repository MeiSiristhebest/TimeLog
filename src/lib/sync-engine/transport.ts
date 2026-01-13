// Transport layer for sync engine
// Handles actual network requests to Supabase/Storage

export class SyncTransport {
    async uploadFile(filePath: string, bucket: string, path: string): Promise<string> {
        // TODO: Implement file upload
        return '';
    }

    async syncMetadata(table: string, data: any): Promise<void> {
        // TODO: Implement metadata sync
    }
}
