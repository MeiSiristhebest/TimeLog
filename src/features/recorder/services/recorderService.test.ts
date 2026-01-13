import { startRecordingStream, ensureSufficientDisk } from './recorderService';
import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';

// Mocks are handled in jest-setup.js, but we can override specific implementations here
describe('recorderService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('ensureSufficientDisk', () => {
        it('should pass if free space is > 500MB', async () => {
            (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(600 * 1024 * 1024);
            const free = await ensureSufficientDisk();
            expect(free).toBeGreaterThan(500 * 1024 * 1024);
        });

        it('should throw if free space is < 500MB', async () => {
            (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(100 * 1024 * 1024);
            await expect(ensureSufficientDisk()).rejects.toThrow('Please clear some space');
        });
    });

    describe('startRecordingStream', () => {
        it('should initialize recording and return handle', async () => {
            // Setup successful mocks
            (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
            (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
            (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(1024 * 1024 * 1024);

            const handle = await startRecordingStream();

            expect(handle).toHaveProperty('metadata');
            expect(handle).toHaveProperty('stop');
            expect(Audio.setAudioModeAsync).toHaveBeenCalled();
            expect(Audio.Recording).toHaveBeenCalled();

            // Verify metadata structure
            expect(handle.metadata).toHaveProperty('id');
            expect(handle.metadata.filePath).toContain('file:///test/doc-dir/recordings/rec_');
        });
    });
});
