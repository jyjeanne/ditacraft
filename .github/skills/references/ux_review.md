# UX Review Heuristics

## Focus areas
- Primary user journeys
- Clarity of actions and outcomes
- Validation and recovery flows
- Empty, loading, and error states
- Accessibility and inclusive interaction design
- Progressive disclosure and cognitive load
- Mobile and responsive behavior
- Internationalization and localization readiness

## Common risks
- Users cannot tell whether an action succeeded
- Errors do not explain what happened or how to recover
- Long-running actions lack progress or completion feedback
- Critical paths depend on inaccessible interaction patterns
- Terminology changes across screens or workflows
- Forms require information the user does not have at that point
- Destructive actions lack confirmation or undo
- No consideration for low-bandwidth or offline scenarios

## Review questions
- What does the user see at each state transition?
- How does the design behave when data is missing or delayed?
- Which flows are high stakes or irreversible?
- Are destructive or irreversible actions guarded by confirmation or undo?
- Is the design usable with assistive technologies (screen readers, keyboard only)?
- How does the interface adapt to different screen sizes and input methods?
- Are error messages actionable and context-specific?
- What is the experience for first-time users vs returning users?
