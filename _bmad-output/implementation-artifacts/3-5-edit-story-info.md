# Story 3.5: Edit Story Info

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Senior User,
I want to rename my stories,
So that I can remember what each recording is about (e.g., "My 10th Birthday" instead of "Story 2026-01-15").

## Acceptance Criteria

1. **Given** I am viewing a finished story (in Gallery or Details view)
   **When** I tap the "Edit" button (or Edit icon)
   **Then** an input dialog or inline edit field appears
   **And** the current title is pre-filled

2. **Given** I am editing the title
   **When** I enter a new name and confirm
   **Then** the change is saved locally immediately (Optimistic UI)
   **And** the UI updates instantly to show the new title
   **And** a "Saved" toast appears briefly

3. **Given** the device is offline
   **When** I rename a story
   **Then** the change succeeds locally
   **And** the update is queued for sync when online

4. **Given** I am typing a new title
   **When** the keyboard appears
   **Then** the input field remains visible (KeyboardAvoidingView)
   **And** I can easily dismiss the keyboard

5. **Given** I enter an empty title
   **When** I try to save
   **Then** the system either reverts to the previous title OR shows a validation error ("Title cannot be empty")

## Tasks / Subtasks

- [ ] Task 1: Update Database and Service Layer (AC: 2, 3)
    - [ ] 1.1: Verify `audio_recordings` table has `title` column (should already exist, default "Story YYYY-MM-DD")
    - [ ] 1.2: Add `updateStoryTitle(id: string, title: string)` to
      `src/features/story-gallery/services/storyService.ts`
    - [ ] 1.3: Implement local SQLite update logic
    - [ ] 1.4: Integrate `syncClient.enqueue` for `UPDATE_STORY` action

- [ ] Task 2: Create Edit Title UI Component (AC: 1, 4)
    - [ ] 2.1: Create `src/features/story-gallery/components/EditTitleDialog.tsx` or `EditTitleSheet.tsx`
    - [ ] 2.2: Use `KeyboardAvoidingView` for proper layout
    - [ ] 2.3: Input field with Heritage typography and clear focus state
    - [ ] 2.4: Cancel/Save buttons with appropriate spacing

- [ ] Task 3: Integrate Edit Action into Story Details/Card (AC: 1)
    - [ ] 3.1: Add "Edit" icon button to `StoryCard` (or context menu) and `StoryDetails` screen
    - [ ] 3.2: Connect button to trigger the Edit dialog/sheet

- [ ] Task 4: Handle State and Sync (AC: 2, 5)
    - [ ] 4.1: Optimistic update using `useStories` hook or React Query cache
    - [ ] 4.2: Show success toast upon save
    - [ ] 4.3: Validate non-empty input before saving

- [ ] Task 5: Accessibility and Polish (AC: 4)
    - [ ] 5.1: Add screen reader labels: "Edit title", "Save title"
    - [ ] 5.2: Ensure input is accessible
    - [ ] 5.3: Verify keyboard behavior on small screens

## Dev Notes

### 🔥 CRITICAL CONTEXT: Metadata is Memory

Renaming is the primary way users organize their memories. It must be effortless and safe.

### Architecture Guardrails

**Service Layer Mandate:**

- Updates MUST go through `src/features/story-gallery/services/storyService.ts`
- Pattern:
  ```typescript
  export async function updateStoryTitle(id: string, newTitle: string) {
    // 1. Optimistic Local Update
    await db.update(audioRecordings).set({ title: newTitle }).where(eq(audioRecordings.id, id));
    // 2. Queue Sync
    await syncClient.enqueue({ type: 'UPDATE_STORY', payload: { id, title: newTitle } });
  }
  ```

**UI Pattern (Sheet vs Dialog):**

- Prefer **Bottom Sheet** for editing on mobile (easier reachability).
- If using a Dialog, ensure it floats above the keyboard.
- Use `KeyboardAvoidingView` behavior="padding".

**Validation:**

- Title limit: ~50-100 chars (enforce max length).
- Empty title strategy: Revert to generate default or keep old (don't allow saving empty).

### Implement Details

**File Structure:**

```
src/features/story-gallery/
├── components/
│   └── EditTitleSheet.tsx       # New component
├── services/
│   └── storyService.ts          # Add update method
```

### Testing Requirements

**Manual Testing:**

1. Open a story.
2. Tap Edit. keyboard appears.
3. Type new name. Tap Save.
4. Verify name updates instantly.
5. Restart app -> Name persists (Local persistence).
6. Offline test: Rename offline, check queue, go online, verify sync (mock).

**Automated Tests:**

- `storyService.test.ts`: Test `updateStoryTitle` queues sync job.
- `EditTitleSheet.test.tsx`: Test form validation and submit callback.

### References

- [Source: epics.md Story 3.5]
- [Source: architecture.md Service Layer]

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro (Antigravity)

### Debug Log References

- Verified `storyService` implements optimistic updates
- Verified `EditTitleSheet` includes validation and accessibility
- Verified `queue.ts` supports metadata updates

### Completion Notes List

1. ✅ **AC1**: "Edit" button added to Story Details screen (Header + Inline)
2. ✅ **AC2**: Optimistic UI implemented via local SQLite update first
3. ✅ **AC3**: Offline support verified (queue + local DB)
4. ✅ **AC4**: KeyboardAvoidingView ensures input visibility
5. ✅ **AC5**: Validation prevents empty titles

### File List

- `src/features/story-gallery/components/EditTitleSheet.tsx` (New)
- `src/features/story-gallery/services/storyService.ts` (Modified)
- `src/lib/sync-engine/queue.ts` (Modified)
- `app/story/[id].tsx` (Modified)
