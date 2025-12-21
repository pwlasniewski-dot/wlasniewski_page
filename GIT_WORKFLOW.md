# 🔄 GIT & GITHUB WORKFLOW
## Best Practices for wlasniewski.pl Development

---

## 📌 GOLDEN RULES

```
Rule 1: main branch is SACRED
└─ Only merge after code review + tests pass
└─ Never commit directly to main
└─ Always create a branch first

Rule 2: One feature = One branch
└─ Branch names are descriptive
└─ Branch contains only related changes
└─ Merge when feature is 100% done

Rule 3: Code review is MANDATORY
└─ At least 1 reviewer per PR
└─ All comments must be resolved
└─ Approver must test locally

Rule 4: Never force push
└─ Force push = instant ban
└─ It destroys history
└─ It makes recovery impossible
```

---

## 🌳 BRANCH NAMING CONVENTION

```
GOOD BRANCH NAMES:
├─ feat/add-admin-login
├─ fix/homepage-layout-bug
├─ chore/update-dependencies
├─ refactor/optimize-api-queries
└─ docs/update-readme

BAD BRANCH NAMES:
├─ my-changes
├─ fix-stuff
├─ wip-something
├─ temp123
└─ feature (too generic)

PATTERN:
<type>/<short-description-with-dashes>

Types:
- feat/    → New feature
- fix/     → Bug fix
- refactor/→ Code improvement (no feature change)
- chore/   → Dependencies, config, maintenance
- docs/    → Documentation only
- test/    → Tests only
```

---

## 📋 GIT WORKFLOW (Step by Step)

### Starting a New Feature

```bash
# 1. Update local main branch
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feat/new-feature-name

# 3. Make changes, commit frequently
git add .
git commit -m "feat: describe what you did"

# 4. Push to GitHub
git push origin feat/new-feature-name

# 5. Create Pull Request on GitHub
# → Go to GitHub.com/your-repo
# → Click "Create Pull Request"
# → Fill title and description
# → Assign reviewer
# → Click "Create"

# 6. Wait for review and tests to pass
```

### During Code Review

```bash
# If reviewer asked for changes:

# 1. Make updates to your branch
git add .
git commit -m "chore: address review comments"

# 2. Push updates
git push origin feat/new-feature-name

# 3. GitHub will update the PR automatically
# → No new PR needed

# Repeat until reviewer approves ✅
```

### Merging to Main

```bash
# 1. Get approval from reviewer
# 2. Ensure all CI checks pass (automated tests)
# 3. Click "Squash and merge" button

# Why squash?
# → Keeps history clean
# → One commit = One feature
# → Easier to revert if needed

# 4. Delete branch (GitHub will suggest)
git branch -d feat/new-feature-name

# 5. Pull latest main
git checkout main
git pull origin main
```

---

## 💬 COMMIT MESSAGE BEST PRACTICES

### Format

```
<type>: <subject>

<body (optional)>

Fixes #issue-number (optional)
```

### Example Good Commits

```bash
# Feature
git commit -m "feat: add user authentication to admin panel"

# Bug fix
git commit -m "fix: resolve homepage image not loading on mobile"

# Migration
git commit -m "chore: add database migration for user roles"

# Refactor
git commit -m "refactor: extract form validation to separate component"

# Documentation
git commit -m "docs: update installation instructions"
```

### Example Bad Commits

```bash
# Too vague
git commit -m "update stuff"

# Too long
git commit -m "I fixed the thing that was broken and also changed some other stuff"

# Not specific enough
git commit -m "fix bug"

# No context
git commit -m "changes"
```

### Commit Message Template

```
=== NEW FEATURE ===
feat: <short description>
- What functionality was added
- Why it was needed
- How it works

=== BUG FIX ===
fix: <short description>
Fixes: #issue-number
- What was broken
- How it was fixed
- Testing verification

=== REFACTOR ===
refactor: <short description>
- What changed
- Why it was refactored
- Performance impact (if any)
```

---

## 🔍 CODE REVIEW CHECKLIST (For Reviewers)

```
□ Does it solve the problem?
  → Test locally, run the feature
  
□ Is code quality good?
  → Read code for logic errors
  → Check for code duplication
  → Verify error handling
  
□ Are there tests?
  → New features should have tests
  → Bug fixes should include test
  
□ Is documentation updated?
  → README if needed
  → Inline comments for complex logic
  → PROJECT_HISTORIA.md for schema changes
  
□ No database safety issues?
  → Check for destructive operations
  → Verify migrations are safe
  → Ensure backwards compatibility
  
□ Performance impact?
  → New queries optimized?
  → No N+1 problems?
  → Bundle size reasonable?

□ Security implications?
  → Input validation present?
  → No credentials in code?
  → SQL injection prevention?

DECISION:
  ✅ Approve & Merge
  ❌ Request changes
  ⏳ Need more info
```

---

## ❌ THINGS THAT WILL GET YOUR PR REJECTED

```
AUTOMATIC REJECT:
├─ Changes to schema.prisma without migration
├─ Commit directly to main
├─ Force push detected
├─ No description in PR
├─ Database destructive operation (db push, reset)
├─ Credentials or secrets in code
├─ Breaking changes without discussion
└─ No tests for critical changes

LIKELY REJECT:
├─ More than 500 lines changed
├─ Unrelated changes mixed in
├─ No mention of issue being fixed
├─ Code style doesn't match project
├─ Console.log statements left in
└─ TODO comments without context
```

---

## 🚨 EMERGENCY: Fix Critical Bug in Production

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Fix the bug
# ... edit files ...
git add .
git commit -m "hotfix: fix critical production issue"

# 3. Create PR (mark as [URGENT])
git push origin hotfix/critical-bug

# 4. Request immediate review
# → Ping reviewer on Slack/Teams
# → Explain severity

# 5. Fast-track merge
# → Expedited review
# → Merge ASAP (or use main branch direct if agreed)

# 6. Update PROJECT_HISTORIA.md
# → Document the incident
# → Explain the fix
```

---

## 📊 PULL REQUEST TEMPLATE

```markdown
# Description
Brief description of what this PR does.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Fixes #123 (if applicable)

## Changes Made
- What changed
- Why it changed
- How to test it

## Testing Done
- [ ] Tested locally
- [ ] npm run build passes
- [ ] All tests pass
- [ ] Manual verification completed

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows style guidelines
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tested on staging environment
- [ ] DATABASE: No breaking schema changes

## Notes for Reviewers
Any additional context or things to pay special attention to.
```

---

## 🔄 HANDLING MERGE CONFLICTS

```bash
# If main branch has changes while you're working:

# 1. Update local main
git fetch origin
git checkout main
git pull origin main

# 2. Rebase your branch on latest main
git checkout your-branch
git rebase main

# 3. If conflicts appear:
# → Open files with conflicts
# → Resolve manually (look for <<<, ===, >>>)
# → Keep the code you want
# → Remove conflict markers

# 4. Continue rebase
git add .
git rebase --continue

# 5. Force push your branch (OK because it's your branch)
git push origin your-branch --force-with-lease

# 6. PR will update automatically
```

---

## 🎯 SPECIFIC WORKFLOWS

### Adding a New Database Table

```bash
# 1. Create branch
git checkout -b feat/add-customer-table

# 2. Edit schema.prisma
# → Add new model
# → Define fields
# → Add relationships

# 3. Create migration
npx prisma migrate dev --name "add_customer_table"

# 4. Test locally
npm run dev
npx prisma studio

# 5. Commit migration
git add prisma/
git commit -m "feat: add customer table to database"

# 6. Push and create PR
git push origin feat/add-customer-table

# PR should include:
# - Description of why new table needed
# - Explanation of table structure
# - Rollback plan if needed
# - Test results
```

### Fixing a Critical Bug

```bash
# 1. Create branch from main
git checkout main
git pull origin main
git checkout -b fix/critical-bug

# 2. Identify and fix the bug
# → Add test that reproduces bug
# → Implement fix
# → Verify test passes

# 3. Commit
git commit -m "fix: [description of bug]"

# 4. PR should include:
# - How to reproduce the bug
# - Why the fix works
# - Test coverage
# - Any side effects

# 5. Fast-track review
# → Mark as urgent
# → Explain business impact
# → Request expedited merge
```

### Refactoring Code

```bash
# 1. Create branch
git checkout -b refactor/improve-api-performance

# 2. Make changes
# → Only refactor, no feature changes
# → Ensure tests still pass
# → Measure performance improvement

# 3. Commit with context
git commit -m "refactor: optimize database queries"

# 4. PR should include:
# - Why refactoring was needed
# - Performance metrics (before/after)
# - How it was tested
# - Backwards compatibility confirmed
```

---

## 🚫 GIT CRIMES (Things That Will Get You In Trouble)

```
CRIME LEVEL 1 (Instant Ban):
├─ Force push to main: git push --force
├─ Delete main branch
├─ Commit secrets to repo
└─ Merge without tests

CRIME LEVEL 2 (Serious Issues):
├─ Multiple unrelated changes in one PR
├─ Commit to main directly
├─ Ignore code review feedback
├─ Merge failed CI checks
└─ No tests for new features

CRIME LEVEL 3 (Please Don't Do This):
├─ 1000+ line commits
├─ No meaningful commit messages
├─ Broken builds in main
├─ Merge conflicts left unresolved
└─ Old branches never deleted
```

---

## 📖 HELPFUL GIT COMMANDS

```bash
# View current branch
git branch -a

# View commit history
git log --oneline -10

# See what changed
git diff feat/my-branch main

# Stash current changes (save for later)
git stash

# Get stashed changes back
git stash pop

# See who changed what line
git blame filename.ts

# Revert a commit (safe way)
git revert <commit-hash>

# Cherry-pick a commit from another branch
git cherry-pick <commit-hash>

# Clean up old branches
git branch -d old-branch-name

# Reset to specific commit (dangerous!)
git reset --hard <commit-hash>

# Undo last commit (but keep changes)
git reset HEAD~1
```

---

## 🎓 LEARNING RESOURCES

```
Interactive Git Tutorial:
https://learngitbranching.js.org/

Git Documentation:
https://git-scm.com/doc

GitHub Docs:
https://docs.github.com

Commit Message Best Practices:
https://www.conventionalcommits.org/
```

---

## 🤝 TEAM COMMUNICATION

**When reviewing code:**
```
✅ GOOD: "This query could be optimized by adding an index on the user_id field. See PR #123 for similar optimization."

❌ BAD: "This is bad code."

✅ GOOD: "I love this approach! Have you considered caching this result?"

❌ BAD: "Why did you do it this way?"
```

**When asking for changes:**
```
✅ GOOD: "Could you add unit tests for this function? Here's a reference: [link]"

❌ BAD: "Add tests."

✅ GOOD: "I have a suggestion: using the builder pattern here would make it more testable."

❌ BAD: "Wrong approach."
```

---

## 📍 BRANCHING STRATEGY (Visual)

```
main (production-ready)
  ↑
  ├← [PR Reviewed] Squash Merge ← feat/cool-feature (ready for merge)
  ├← [PR Reviewed] Squash Merge ← fix/login-bug
  └← [PR Reviewed] Squash Merge ← chore/update-deps

Each PR contains:
  ✅ Code review approved
  ✅ Tests passing
  ✅ CI checks green
  ✅ No conflicts with main
  ✅ Documentation updated
```

---

## 🎯 FINAL CHECKLIST BEFORE PUSHING

```
Before you git push:
□ Code runs locally (npm run dev)
□ No console errors
□ Tests pass (if applicable)
□ Linting passes (npm run lint)
□ Build succeeds (npm run build)
□ Commit messages are clear
□ No sensitive data in code
□ No console.log/debugger statements
□ Related issue number in description
□ Screenshot/video for UI changes

Then push confidently! 🚀
```

---

**Remember**: Good Git practices = Good code quality = Happy team = Successful project! 🎉

**Last Updated**: 21 grudnia 2025  
**Status**: ✅ Active Workflow  
**Questions**: See DEVELOPMENT_GUIDELINES.md or ask the team
