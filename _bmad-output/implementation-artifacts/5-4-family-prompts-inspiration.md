# Story 5.4: Family Prompts & Inspiration

Status: review

## Story

As a Family User,
I want to ask my parent specific questions, sometimes using suggested ideas,
So that I can learn about parts of their life I don't know yet.

## Acceptance Criteria

1. **Given** I am in the "Ask" section
   **When** I browse the "Inspiration Library"
   **Then** I can select a pre-written question (e.g., "What was your first job like?")
   **And** I see categories like "Childhood", "Career", "Family"

2. **Given** I select a question from the library
   **When** I tap "Edit" or "Send Custom"
   **Then** I can modify the question text before sending
   **And** I can write a completely custom question

3. **Given** I submit a question
   **When** the submission completes
   **Then** it is added to the senior's Topic list with a "From Family" tag
   **And** the senior sees it prioritized in their Topic Discovery

## Tasks / Subtasks

- [ ] Task 1: Create Inspiration Library data (AC: 1)
  - [ ] 1.1: Define JSON structure for question library
  - [ ] 1.2: Populate with 50+ questions across categories
  - [ ] 1.3: Store in `assets/inspiration-library.json`

- [ ] Task 2: Family question submission (AC: 2, 3)
  - [ ] 2.1: Create `family_questions` table in Supabase
  - [ ] 2.2: Implement `submitQuestion(text, seniorUserId)` function
  - [ ] 2.3: Add "From Family" metadata

- [ ] Task 3: Inspiration Library UI (AC: 1, 2)
  - [ ] 3.1: Create `app/(tabs)/family/ask-question.tsx` screen
  - [ ] 3.2: Display categories with question cards
  - [ ] 3.3: Add edit/send buttons

- [ ] Task 4: Integration with Topic Discovery (AC: 3)
  - [ ] 4.1: Update Story 3.4 Topic Discovery to show family questions
  - [ ] 4.2: Add "From [Name]" tag UI
  - [ ] 4.3: Prioritize family questions in shuffle logic

- [ ] Task 5: Testing (AC: 1-3)
  - [ ] 5.1: Test library browsing
  - [ ] 5.2: Test question submission
  - [ ] 5.3: Test senior sees family question

## Dev Notes

### Architecture Guardrails

**Inspiration Library Structure:**

```json
// assets/inspiration-library.json
{
  "categories": [
    {
      "id": "childhood",
      "name": "Childhood Memories",
      "questions": [
        "What was your favorite game as a child?",
        "Tell me about your first day of school",
        "What did you want to be when you grew up?"
      ]
    },
    {
      "id": "career",
      "name": "Career & Work",
      "questions": [
        "What was your first job like?",
        "Tell me about a challenging project you completed",
        "Who was your most memorable colleague?"
      ]
    }
  ]
}
```

**Family Question Schema:**

```sql
CREATE TABLE family_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_user_id UUID NOT NULL REFERENCES auth.users(id),
  family_user_id UUID NOT NULL REFERENCES auth.users(id),
  question_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);
```

**Question Submission Service:**

```typescript
// src/features/family-listener/services/questionService.ts
export async function submitQuestion(
  questionText: string,
  seniorUserId: string,
  familyUserId: string
) {
  const { data, error } = await supabase
    .from('family_questions')
    .insert({
      senior_user_id: seniorUserId,
      family_user_id: familyUserId,
      question_text: questionText,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### UX Patterns

**Inspiration Library UI:**

- Card-based layout (similar to Story 3.4)
- Categories as tabs or sections
- "Use This" and "Edit First" buttons

**Family Question Tag:**

- Visual: Small badge "From Alice" in Primary color
- Position: Top-right of question card
- Icon: 👨‍👩‍👧 family emoji

### Boundary with Story 5.5

**Story 5.4 (This Story):** Family-side submission
**Story 5.5:** Senior-side prioritization

Clear separation: This story handles the "Ask" flow, Story 5.5 handles the "Answer" priority.

### Testing Requirements

- Test library loads with categories
- Test question editing
- Test submission creates database record
- Test senior sees "From Family" tag

### References

- [Source: epics.md#Story 5.5]
- [Source: Story 3.4#Topic Discovery]

## Dev Agent Record

### Agent Model Used

<!-- To be filled -->

### File List

<!-- To be filled -->
