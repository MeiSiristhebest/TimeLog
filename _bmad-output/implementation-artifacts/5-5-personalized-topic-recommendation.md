# Story 5.5: Personalized Topic Recommendation

Status: review

## Story

As a Senior User,
I want to see questions my family asked me first,
So that I can prioritize answering what they are curious about.

## Acceptance Criteria

1. **Given** there are pending questions from family
   **When** I switch to the "New Topic" tab or shuffle topics
   **Then** questions submitted by family appear with higher priority than random library questions
   **And** they are visually distinct (e.g., "Asked by Alice")

2. **Given** I am viewing a family-submitted question
   **When** I record a story answering it
   **Then** the question is marked as "answered"
   **And** the family member receives a notification that their question was answered

## Tasks / Subtasks

- [ ] Task 1: Priority scoring algorithm (AC: 1)
  - [ ] 1.1: Create `getTopicPriority(topic)` function
  - [ ] 1.2: Assign higher score to family questions
  - [ ] 1.3: Sort topics by priority score

- [ ] Task 2: Visual distinction UI (AC: 1)
  - [ ] 2.1: Update QuestionCard component
  - [ ] 2.2: Add "Asked by [Name]" badge
  - [ ] 2.3: Use distinct color (Primary) for family questions

- [ ] Task 3: Mark as answered (AC: 2)
  - [ ] 3.1: Link recording to family_question_id
  - [ ] 3.2: Update `answered_at` timestamp
  - [ ] 3.3: Trigger notification to family member

- [ ] Task 4: Integration with Topic Discovery (AC: 1)
  - [ ] 4.1: Update Story 3.4 shuffle logic
  - [ ] 4.2: Fetch family questions first
  - [ ] 4.3: Fallback to library questions if no family questions

- [ ] Task 5: Testing (AC: 1, 2)
  - [ ] 5.1: Test family questions appear first
  - [ ] 5.2: Test visual distinction
  - [ ] 5.3: Test answered notification

## Dev Notes

### Architecture Guardrails

**Priority Scoring Algorithm:**

```typescript
// src/features/recorder/services/topicService.ts
interface Topic {
  id: string;
  text: string;
  source: 'family' | 'library';
  familyMemberName?: string;
  familyQuestionId?: string;
}

export function getTopicPriority(topic: Topic): number {
  if (topic.source === 'family') {
    return 100; // Highest priority
  }
  return 50; // Library questions
}

export async function getRecommendedTopics(userId: string): Promise<Topic[]> {
  // 1. Fetch family questions
  const { data: familyQuestions } = await supabase
    .from('family_questions')
    .select(`
      id,
      question_text,
      profiles!family_user_id(name)
    `)
    .eq('senior_user_id', userId)
    .is('answered_at', null)
    .order('created_at', { ascending: false });

  // 2. Load library questions
  const libraryQuestions = await loadInspirationLibrary();

  // 3. Combine and sort by priority
  const allTopics: Topic[] = [
    ...(familyQuestions || []).map(q => ({
      id: q.id,
      text: q.question_text,
      source: 'family' as const,
      familyMemberName: q.profiles.name,
      familyQuestionId: q.id,
    })),
    ...libraryQuestions.map(q => ({
      id: q.id,
      text: q.text,
      source: 'library' as const,
    })),
  ];

  return allTopics.sort((a, b) =>
    getTopicPriority(b) - getTopicPriority(a)
  );
}
```

**Visual Distinction:**

```tsx
// src/features/recorder/components/QuestionCard.tsx
export function QuestionCard({ topic }: { topic: Topic }) {
  return (
    <View className="bg-surface rounded-2xl p-6 border border-outline">
      {topic.source === 'family' && (
        <View className="flex-row items-center mb-2">
          <Text className="text-sm text-primary font-semibold">
            👨‍👩‍👧 Asked by {topic.familyMemberName}
          </Text>
        </View>
      )}
      <Text className="text-2xl text-onSurface">{topic.text}</Text>
    </View>
  );
}
```

**Mark as Answered:**

```typescript
// When recording completes
export async function markQuestionAsAnswered(
  familyQuestionId: string,
  recordingId: string
) {
  await supabase
    .from('family_questions')
    .update({
      answered_at: new Date().toISOString(),
      recording_id: recordingId,
    })
    .eq('id', familyQuestionId);

  // Trigger notification to family member
  await createActivityEvent({
    type: 'question_answered',
    family_question_id: familyQuestionId,
  });
}
```

### UX Patterns

**Family Question Badge:**

- Color: Primary (#C26B4A)
- Icon: 👨‍👩‍👧 family emoji
- Text: "Asked by [Name]"
- Position: Top of question card

**Priority Display:**

- Family questions always shown first
- Library questions shuffled randomly
- Clear visual separation

### Boundary with Story 5.4

**Story 5.4:** Family submission flow
**Story 5.5 (This Story):** Senior prioritization and answering

Integration point: `family_questions` table

### Testing Requirements

- Test family questions appear first in shuffle
- Test "Asked by" badge displays correctly
- Test marking as answered updates database
- Test family member receives notification

### References

- [Source: epics.md#Story 5.6]
- [Source: Story 5.4#Family Question Schema]
- [Source: Story 3.4#Topic Discovery]

## Dev Agent Record

### Agent Model Used

<!-- To be filled -->

### File List

<!-- To be filled -->
