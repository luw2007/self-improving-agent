# Learnings Log

## [LRN-20260131-001] best_practice

**Logged**: 2026-01-31T10:30:00Z
**Priority**: medium
**Status**: pending
**Area**: config

### Summary
Don't push to git remotes without confirming user has auth configured

### Details
Background processes attempted `git push` after committing changes to the self-improving-agent skill. This triggered a GitHub authentication prompt on the user's desktop, which they couldn't dismiss easily. The commit succeeded but push failed (exit code 1).

User indicated they'll set up GitHub auth later. Until then, commits should stay local.

### Suggested Action
Before any `git push`:
1. Check if remote requires auth: `git remote -v`
2. For GitHub remotes, verify auth: `gh auth status` or check for SSH key
3. If uncertain, ask user or skip push entirely

For now: **commit only, no push** until user confirms GitHub auth is configured.

### Metadata
- Source: user_feedback
- Related Files: N/A (applies to all git operations)
- Tags: git, github, authentication, background-tasks

---
