export type SyncSoundCueHandlers = {
  playOnlineCue: () => void | Promise<void>;
  playOfflineCue: () => void | Promise<void>;
};

let handlers: SyncSoundCueHandlers | null = null;

export function registerSyncSoundCues(next: SyncSoundCueHandlers | null): void {
  handlers = next;
}

export function playOnlineSyncCue(): void {
  const cue = handlers?.playOnlineCue;
  if (cue) {
    void cue();
  }
}

export function playOfflineSyncCue(): void {
  const cue = handlers?.playOfflineCue;
  if (cue) {
    void cue();
  }
}
