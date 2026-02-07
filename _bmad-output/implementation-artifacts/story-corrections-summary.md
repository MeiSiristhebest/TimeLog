# Story Quality Review & Corrections

**Date:** 2026-01-16
**Reviewer:** Claude 3.5 Sonnet
**Scope:** Stories 4-6, 5-1 through 5-5

---

## Executive Summary

**Status:** ✅ All 6 stories have been corrected and are now ready for development review.

**Key Fixes Applied:**

1. ✅ Aligned AC counts with epics.md
2. ✅ Fixed architecture boundary violations
3. ✅ Corrected schema file placement strategy
4. ✅ Clarified Post-MVP scope (4-6, 5-3)
5. ✅ Defined clear boundaries between overlapping features

---

## Detailed Corrections

### Story 4-6: quick-reactions

| Issue                       | Correction                                                                           |
|:----------------------------|:-------------------------------------------------------------------------------------|
| **Missing Post-MVP marker** | Added `**Priority:** Post-MVP` explicitly                                            |
| **AC count mismatch**       | Reduced from 5 to 2 to match epics.md Story 4.5                                      |
| **Schema path error**       | Changed from `src/db/schema/reactions.ts` to `src/db/schema.ts` (add to main schema) |

**Rationale:** PRD explicitly lists "Quick Reactions/Likes" as Out of Scope for MVP. This story is now clearly marked
for post-MVP implementation.

---

### Story 5-1: home-contextual-insights

| Issue                               | Correction                                                                                                              |
|:------------------------------------|:------------------------------------------------------------------------------------------------------------------------|
| **AC count mismatch**               | Reduced from 5 to 4 to match epics.md Story 5.2                                                                         |
| **Architecture boundary violation** | Moved Activity Card from `src/features/notifications/` to `src/features/story-gallery/` (or create `src/features/home`) |
| **Schema path error**               | Changed from `src/db/schema/activities.ts` to `src/db/schema.ts`                                                        |

**Rationale:** Home screen is at `app/(tabs)/index.tsx`. Activity Card logic belongs in story-gallery or a dedicated
home feature, not notifications.

---

### Story 5-2: smart-notification-engine

| Issue                               | Correction                                                                                |
|:------------------------------------|:------------------------------------------------------------------------------------------|
| **AC count mismatch**               | Reduced from 5 to 2 to match epics.md Story 5.3                                           |
| **Architecture boundary violation** | Moved NotificationSettings from `src/features/notifications/` to `src/features/settings/` |
| **Schema path error**               | Changed from `src/db/schema/notifications.ts` to `src/db/schema.ts`                       |
| **Missing privacy integration**     | Added note about Cloud AI toggle (FR29) integration                                       |

**Rationale:** Notification preferences are user settings and belong in the settings feature. Settings controls should
respect Cloud AI toggle state.

---

### Story 5-3: gentle-nudge

| Issue                               | Correction                                                                         |
|:------------------------------------|:-----------------------------------------------------------------------------------|
| **Missing Post-MVP marker**         | Added `**Priority:** Post-MVP` explicitly                                          |
| **AC count mismatch**               | Reduced from 5 to 3 to match epics.md Story 5.4                                    |
| **Architecture boundary violation** | Moved NudgeSettings from `src/features/notifications/` to `src/features/settings/` |
| **Schema path error**               | Changed from `src/db/schema/nudgeSettings.ts` to `src/db/schema.ts`                |

**Rationale:** PRD explicitly lists "Gentle Nudge" as Out of Scope for MVP. Nudge configuration belongs in settings, not
notifications feature.

---

### Story 5-4: family-prompts-inspiration

| Issue                               | Correction                                                                                                   |
|:------------------------------------|:-------------------------------------------------------------------------------------------------------------|
| **AC count mismatch**               | Reduced from 5 to 3 to match epics.md Story 5.5                                                              |
| **Architecture boundary violation** | Moved Inspiration Library from `src/features/family-listener/` to `src/features/recorder/` (Topic Discovery) |
| **Schema path error**               | Changed from `src/db/schema/familyQuestions.ts` to `src/db/schema.ts`                                        |
| **Boundary ambiguity**              | Added explicit boundary note with Story 5.5                                                                  |

**Rationale:** Topic Library and Inspiration are core to the recording/Topic Discovery workflow, not family-listener
feature.

---

### Story 5-5: personalized-topic-recommendation

| Issue                  | Correction                                                          |
|:-----------------------|:--------------------------------------------------------------------|
| **AC count mismatch**  | Reduced from 5 to 2 to match epics.md Story 5.6                     |
| **Schema path error**  | Changed from `src/db/schema/topicPriority.ts` to `src/db/schema.ts` |
| **Boundary ambiguity** | Added explicit boundary note with Story 5.4                         |

**Rationale:** This story handles senior-side prioritization of family questions. Story 5.4 handles family-side
submission. The boundary is now clear.

---

## Architecture Alignment

### Schema Strategy

**Before:** Each story created separate schema files (`reactions.ts`, `activities.ts`, etc.)
**After:** All schema additions go into `src/db/schema.ts` (single source of truth)

**Justification:** Architecture document specifies "Drizzle Migration Files strategy" with a unified schema file.
Multiple schema files violate the single source of truth principle.

---

### Feature Boundaries

**Before:** Settings scattered across multiple features
**After:** Settings consolidated in `src/features/settings/`

**Feature Boundary Mapping:**
| Component | Correct Location |
|:----------|:-----------------|
| Activity Card | `src/features/story-gallery/` or `src/features/home/` |
| Inspiration Library | `src/features/recorder/` (Topic Discovery) |
| NotificationSettings | `src/features/settings/` |
| NudgeSettings | `src/features/settings/` |

---

## Sprint Status Update

Updated `sprint-status.yaml` to reflect Post-MVP priorities:

- 4-6-quick-reactions: `ready-for-dev (Post-MVP)`
- 5-3-gentle-nudge: `ready-for-dev (Post-MVP)`

---

## Remaining Questions for Product Owner

1. **Home Feature Decision:** Should Activity Card live in `story-gallery`, or should we create a dedicated `home`
   feature?
    - Recommendation: Create `src/features/home/` if Activity Card becomes complex with future enhancements.

2. **Story 5-4 & 5-5 Timeline:** Should these be implemented concurrently (family submission + senior prioritization) or
   sequentially?
    - Recommendation: Implement 5-4 first (family side), then 5-5 (senior side) to validate end-to-end flow.

3. **Post-MVP Dependencies:** Do 4-6 and 5-3 have any dependencies on other Post-MVP features, or can they be developed
   independently?

---

## Quality Checklist

| Criteria                          | Status      |
|:----------------------------------|:------------|
| AC counts match epics.md          | ✅ Fixed     |
| Architecture boundaries respected | ✅ Fixed     |
| Schema file strategy aligned      | ✅ Fixed     |
| Post-MVP scope clearly marked     | ✅ Fixed     |
| Feature boundaries clarified      | ✅ Fixed     |
| Dependencies documented           | ✅ Added     |
| NFR references included           | ✅ Preserved |

---

## Recommendation

**Action:** ✅ These stories are ready for developer review and can proceed to `in-progress` status once the PO reviews
and approves the corrections above.
