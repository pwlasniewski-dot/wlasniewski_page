---
description: Build and Deploy Protocol (Strict Documentation)
---

# Build and Deploy Protocol

This workflow MUST be followed for every production build. The user requires that documentation be updated manually by the AI (reading context/reasoning) BEFORE the build is executed.

## 1. Update Project History
- Read `PROJECT_HISTORIA.md`.
- Append a new entry for the current session/changes.
- **IMPORTANT**: Insert at the **TOP** of the "Log Zmian" section (Sort: Newest First).
- Include: Date, Summary of Changes, Key Decisions, and any "Why" reasoning.

## 2. Update Functional Specification
- Read `FUNCTIONAL_SPECIFICATION.md`.
- Update relevant sections if new features or logic were added.

## 3. Update Architecture
- Read `ARCHITECTURE.md`.
- Update if there were changes to data flow, components, or system design.

## 4. Update Walkthrough & Task
- Update `walkthrough.md` with verification steps.
- Update `task.md` status.

## 5. Execute Build
- Only AFTER steps 1-4 are complete.
- Run: `npm run build`
- If successful, proceed to `git push` or other deployment steps.

// turbo
5. Verify Build Success
