import type { HookHandler } from 'openclaw/hooks';

const SELF_IMPROVEMENT_REMINDER_CONTENT = `## Self-Improvement Reminder

After completing tasks, evaluate if any learnings should be captured:

**Log when:**
- User corrects you → \`.learnings/LEARNINGS.md\`
- Command/operation fails → \`.learnings/ERRORS.md\`
- User wants missing capability → \`.learnings/FEATURE_REQUESTS.md\`
- You discover your knowledge was wrong → \`.learnings/LEARNINGS.md\`
- You find a better approach → \`.learnings/LEARNINGS.md\`

**Promote when pattern is proven:**
- Behavioral patterns → \`SOUL.md\`
- Workflow improvements → \`AGENTS.md\`
- Tool gotchas → \`TOOLS.md\`

Keep entries simple: date, title, what happened, what to do differently.`;

const PAHF_REMINDER_CONTENT = `## PAHF Reminder (Personalized Agents from Human Feedback)

Run each user-facing task as a three-step loop:

1) Pre-action: retrieve preference memory; if ambiguous, ask ONE clarifying question, then write the answer to memory before acting.
2) Act: ground the decision in instruction + environment facts + retrieved preferences (+ clarification answer if asked).
3) Post-action: only when the user corrects you, extract a reusable preference note and update memory (add vs merge/override).

Recommended workspace path for preferences:
- \`memory/preferences/<user_key>.md\`

Templates:
- \`~/.openclaw/skills/self-improving-agent/assets/PREFERENCES.md\`
- \`~/.openclaw/skills/self-improving-agent/assets/PAHF-CHECKLIST.md\`

Protocol:
- \`~/.openclaw/skills/self-improving-agent/PAHF.md\``;

const handler: HookHandler = async (event) => {
  if (!event || typeof event !== 'object') {
    return;
  }

  if (event.type !== 'agent' || event.action !== 'bootstrap') {
    return;
  }

  if (!event.context || typeof event.context !== 'object') {
    return;
  }

  const sessionKey = event.sessionKey || '';
  if (sessionKey.includes(':subagent:')) {
    return;
  }

  if (Array.isArray(event.context.bootstrapFiles)) {
    event.context.bootstrapFiles.push({
      path: 'SELF_IMPROVEMENT_REMINDER.md',
      content: SELF_IMPROVEMENT_REMINDER_CONTENT,
      virtual: true,
    });
    event.context.bootstrapFiles.push({
      path: 'PAHF_REMINDER.md',
      content: PAHF_REMINDER_CONTENT,
      virtual: true,
    });
  }
};

export default handler;
