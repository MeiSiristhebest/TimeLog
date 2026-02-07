# Story 3.4: Topic Discovery Card

Status: review

...

### File List

- src/features/recorder/components/QuestionCard.tsx
- src/features/recorder/components/QuestionCard.test.tsx
- src/features/recorder/hooks/useTopicDiscovery.ts
- src/features/recorder/hooks/useTopicDiscovery.test.ts
- src/features/recorder/hooks/useTTS.ts
- app/(tabs)/index.tsx
- app/(tabs)/topics.tsx

### Change Log

- Extended QuestionCard with discovery variant and primary "Record This" action (72dp).
- Implemented useTopicDiscovery hook for managing random question state.
- Enhanced useTTS to synchronize with initialQuestion from navigation params.
- Built Topics discovery screen with airy layout and navigation to Home tab.
- Added comprehensive unit tests for QuestionCard and useTopicDiscovery.

## Story

As a Senior User,
I want to flip through interesting questions one by one,
So that I can find inspiration for my next story without feeling overwhelmed by a long list.

## Acceptance Criteria

1. **Given** I am on the Topics tab
   **When** I view the suggestions
   **Then** I see one large Question Card at a time (One-Task flow)
   **And** the layout is airy and contemplative (Heritage Palette: Terracotta/Cream)

2. **Given** a Question Card is displayed
   **When** I tap "Next"
   **Then** a new random question from the local library is displayed with a smooth transition
   **And** the same question is not shown twice in a row

3. **Given** I find an interesting question
   **When** I tap "Record This"
   **Then** I am immediately taken to the Home (Recording) screen
   **And** that specific prompt is active and played via TTS automatically

4. **Given** the Topics screen
   **When** rendered for a storyteller
   **Then** it MUST NOT use horizontal swipes for navigation (UX Anti-pattern)
   **And** all interactive elements meet ≥48dp touch targets

5. **Given** a family-submitted question exists
   **When** it appears in the Topic Discovery card
   **Then** it is visually distinct with a "From [Family Name]" badge (Story 5.6 priority)

## Tasks / Subtasks

- [x] Task 1: Extend QuestionCard for Discovery Mode (AC: 1, 2, 5)
    - [x] 1.1: Add `variant: 'discovery' | 'recorder'` prop to `src/features/recorder/components/QuestionCard.tsx`
    - [x] 1.2: Implement Discovery layout: Large card, centered text, "Next" and "Record This" buttons
    - [x] 1.3: Ensure "Next" and "Record This" buttons are symmetric width and ≥48dp (72dp recommended for Record)
    - [x] 1.4: Maintain Heritage Palette compliance (Burnt Sienna #C26B4A for primary action)

- [x] Task 2: Implement Topic Discovery Logic (AC: 2)
    - [x] 2.1: Create `src/features/recorder/hooks/useTopicDiscovery.ts`
    - [x] 2.2: Use `getRandomQuestion()` from `topicQuestions.ts` to manage discovery state
    - [x] 2.3: Implement `nextTopic()` with "no-repeat" logic (already in data layer, but verify hook state)

- [x] Task 3: Implement Navigation to Recording (AC: 3)
    - [x] 3.1: Update `app/(tabs)/index.tsx` to accept a `topicId` parameter via `useLocalSearchParams`
    - [x] 3.2: If `topicId` is provided, initialize `useTTS` with the specific question
    - [x] 3.3: Ensure `handleStart` correctly references the selected topic for metadata

- [x] Task 4: Build Topics Tab Screen (AC: 1, 4)
    - [x] 4.1: Modify `app/(tabs)/topics.tsx` to use `useTopicDiscovery` hook
    - [x] 4.2: Render `QuestionCard` in discovery variant
    - [x] 4.3: Implement "Record This" navigation:
      `router.push({ pathname: '/', params: { topicId: currentQuestion.id } })`

- [x] Task 5: Accessibility and Animation (AC: 4)
    - [x] 5.1: Add Reanimated fade/slide transition between questions
    - [x] 5.2: Add screen reader labels for "Next Topic" and "Record This Story"
    - [x] 5.3: Verify contrast ratio (7:1) for all text on the card

## Dev Notes

### 🔥 CRITICAL CONTEXT: This story implements the "Discovery" pillar of the storytelling experience.

Unlike the Home screen which focuses on the _response_, this screen focuses on the _stimulus_. It MUST feel like a warm
invitation, not a technical menu.

### Architecture Guardrails

**Heritage Palette Compliance (UX Spec)**

- **Primary:** Burnt Sienna (`#C26B4A`) - Use for "Record This"
- **Surface:** Warm White (`#FFFAF5`) - Use for Card Background
- **OnSurface:** Charcoal (`#2C2C2C`) - Use for Text
- **Secondary:** Cream (`#FFF8E7`) - Use for "Next" button

**Touch Target Mandate**

- "Record This" button: **72dp** diameter or height (Matches Big Red Button trust anchor)
- "Next" button: **≥48dp** (Standard accessible target)
- Spacing: Airy, not dense (Base unit 16px)

**One-Task Flow (Cognitive HFE)**

- Do not show a list of topics. Show ONE card.
- "Tunnelling" strategy: User only decides "This one?" or "Next one?".

### Project Structure Notes

- **Feature-First:** Discovery components stay in `src/features/recorder/` as they share the topic question domain.
- **Route:** `app/(tabs)/topics.tsx` is the entry point.
- **Shared Types:** Uses `TopicQuestion` from `src/types/entities.ts`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Warm Accessibility]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#The Modern Metaphor]
- [Source: _bmad-output/planning-artifacts/architecture.md#Architecture Pillars: Minimal Interaction]

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro (Antigravity)

### Debug Log References

- All tests pass: `npm test -- QuestionCard useTopicDiscovery topicQuestions` (130 passed)
- Story was already implemented prior to this session

### Completion Notes List

1. ✅ **AC1**: Topics tab displays single large QuestionCard with Heritage palette
2. ✅ **AC2**: Next button shows random question without immediate repeats (Fisher-Yates via `getRandomQuestion`)
3. ✅ **AC3**: "Record This" navigates to `/` with `topicId` param, TTS auto-plays
4. ✅ **AC4**: No horizontal swipes (buttons only), 48dp+ touch targets verified
5. ✅ **AC5**: Family badge support implemented (isFromFamily, submittedBy fields)

### File List

- `src/features/recorder/components/QuestionCard.tsx` (discovery variant)
- `src/features/recorder/components/QuestionCard.test.tsx`
- `src/features/recorder/hooks/useTopicDiscovery.ts`
- `src/features/recorder/hooks/useTopicDiscovery.test.ts`
- `src/features/recorder/data/topicQuestions.ts` (15 questions)
- `src/features/recorder/data/topicQuestions.test.ts`
- `app/(tabs)/topics.tsx`
- `app/(tabs)/index.tsx` (accepts topicId param)
- `src/types/entities.ts` (TopicQuestion type)
