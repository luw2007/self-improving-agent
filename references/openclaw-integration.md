# OpenClaw Integration

Complete setup and usage guide for integrating the self-improving-agent skill with OpenClaw.

## Overview

OpenClaw uses workspace-based prompt injection combined with event-driven hooks. Context is injected from workspace files at session start, and hooks can trigger on lifecycle events.

为与 OpenClaw 的实际运行行为一致，本文使用两个占位符：

- `<workspace>`：你的 OpenClaw workspace 目录（常见为 `~/.openclaw/workspace`，也可能是你运行 OpenClaw 的项目目录）
- `<skill-dir>`：`<workspace>/skills/self-improving-agent`（ClawHub 默认安装位置）或 `~/.openclaw/skills/self-improving-agent`（全局安装）

## Workspace Structure

```
~/.openclaw/                      
├── workspace/                   # Working directory
│   ├── AGENTS.md               # Multi-agent coordination patterns
│   ├── SOUL.md                 # Behavioral guidelines and personality
│   ├── TOOLS.md                # Tool capabilities and gotchas
│   ├── MEMORY.md               # Long-term memory (main session only)
│   └── memory/                 # Daily memory files
│       └── YYYY-MM-DD.md
├── skills/                      # Installed skills
│   └── <skill-name>/
│       └── SKILL.md
└── hooks/                       # Custom hooks
    └── <hook-name>/
        ├── HOOK.md
        └── handler.ts
```

## Quick Setup

### 1. Install the Skill

```bash
clawhub install self-improving-agent
```

默认情况下，ClawHub 会安装到当前目录下的 `./skills/self-improving-agent`。因此建议在你的 `<workspace>` 目录中执行上述命令。

或手动安装（两种都可用）：

```bash
# 方案 A：全局安装（跨 workspace 共享）
git clone https://github.com/peterskoett/self-improving-agent.git ~/.openclaw/skills/self-improving-agent

# 方案 B：workspace 本地安装（推荐，便于项目隔离）
git clone https://github.com/peterskoett/self-improving-agent.git <workspace>/skills/self-improving-agent
```

### 2. Install the Hook (Optional)

Copy the hook to OpenClaw's hooks directory:

```bash
cp -r hooks/openclaw ~/.openclaw/hooks/self-improvement
```

Enable the hook:

```bash
openclaw hooks enable self-improvement
```

### 3. Create Learning Files

在你的 `<workspace>` 目录下创建 `.learnings/`（推荐）：

```bash
mkdir -p <workspace>/.learnings
```

## Injected Prompt Files

### AGENTS.md

Purpose: Multi-agent workflows and delegation patterns.

```markdown
# Agent Coordination

## Delegation Rules
- Use explore agent for open-ended codebase questions
- Spawn sub-agents for long-running tasks
- Use sessions_send for cross-session communication

## Session Handoff
When delegating to another session:
1. Provide full context in the handoff message
2. Include relevant file paths
3. Specify expected output format
```

### SOUL.md

Purpose: Behavioral guidelines and communication style.

```markdown
# Behavioral Guidelines

## Communication Style
- Be direct and concise
- Avoid unnecessary caveats and disclaimers
- Use technical language appropriate to context

## Error Handling
- Admit mistakes promptly
- Provide corrected information immediately
- Log significant errors to learnings
```

### TOOLS.md

Purpose: Tool capabilities, integration gotchas, local configuration.

```markdown
# Tool Knowledge

## Self-Improvement Skill
Log learnings to `.learnings/` for continuous improvement.

## Local Tools
- Document tool-specific gotchas here
- Note authentication requirements
- Track integration quirks
```

## Learning Workflow

### Capturing Learnings

1. **In-session**: Log to `.learnings/` as usual
2. **Cross-session**: Promote to workspace files

## PAHF 个性化工作流（推荐）

为每个用户维护一份“可更新的偏好记忆”，用于行动前检索与行动后纠错写回。

### 偏好记忆目录

在 OpenClaw workspace 中创建：

```bash
mkdir -p ~/.openclaw/workspace/memory/preferences
```

每个用户一个文件：

```
~/.openclaw/workspace/memory/preferences/<user_key>.md
```

模板参考：`<skill-dir>/assets/PREFERENCES.md`

### 会话内执行规则

- 行动前：先检索偏好；若歧义且记忆不足，只问一个关键澄清问题；把回答先写入偏好记忆，再执行
- 行动后：仅在用户明确纠错时写回；先做“显著性检测”，再进行“新增/覆盖合并”

完整协议见：`<skill-dir>/PAHF.md`

## 迁移

### 从 `clawdhub` 迁移到 `clawhub`

为与 OpenClaw 文档一致，统一使用：

```bash
clawhub install self-improving-agent
```

### 从旧路径 `skills/self-improvement/...` 迁移

如果你在任何配置中引用了旧路径（例如 `./skills/self-improvement/scripts/activator.sh`），请替换为：

- `./skills/self-improving-agent/scripts/activator.sh`
- `./skills/self-improving-agent/scripts/error-detector.sh`
- `./skills/self-improving-agent/scripts/extract-skill.sh`

### Promotion Decision Tree

```
Is the learning project-specific?
├── Yes → Keep in .learnings/
└── No → Is it behavioral/style-related?
    ├── Yes → Promote to SOUL.md
    └── No → Is it tool-related?
        ├── Yes → Promote to TOOLS.md
        └── No → Promote to AGENTS.md (workflow)
```

### Promotion Format Examples

**From learning:**
> Git push to GitHub fails without auth configured - triggers desktop prompt

**To TOOLS.md:**
```markdown
## Git
- Don't push without confirming auth is configured
- Use `gh auth status` to check GitHub CLI auth
```

## Inter-Agent Communication

OpenClaw provides tools for cross-session communication:

### sessions_list

View active and recent sessions:
```
sessions_list(activeMinutes=30, messageLimit=3)
```

### sessions_history

Read transcript from another session:
```
sessions_history(sessionKey="session-id", limit=50)
```

### sessions_send

Send message to another session:
```
sessions_send(sessionKey="session-id", message="Learning: API requires X-Custom-Header")
```

### sessions_spawn

Spawn a background sub-agent:
```
sessions_spawn(task="Research X and report back", label="research")
```

## Available Hook Events

| Event | When It Fires |
|-------|---------------|
| `agent:bootstrap` | Before workspace files inject |
| `command:new` | When `/new` command issued |
| `command:reset` | When `/reset` command issued |
| `command:stop` | When `/stop` command issued |
| `gateway:startup` | When gateway starts |

## Detection Triggers

### Standard Triggers
- User corrections ("No, that's wrong...")
- Command failures (non-zero exit codes)
- API errors
- Knowledge gaps

### OpenClaw-Specific Triggers

| Trigger | Action |
|---------|--------|
| Tool call error | Log to TOOLS.md with tool name |
| Session handoff confusion | Log to AGENTS.md with delegation pattern |
| Model behavior surprise | Log to SOUL.md with expected vs actual |
| Skill issue | Log to .learnings/ or report upstream |

## Verification

Check hook is registered:

```bash
openclaw hooks list
```

Check skill is loaded:

```bash
openclaw status
```

## Troubleshooting

### Hook not firing

1. Ensure hooks enabled in config
2. Restart gateway after config changes
3. Check gateway logs for errors

### Learnings not persisting

1. Verify `.learnings/` directory exists
2. Check file permissions
3. Ensure workspace path is configured correctly

### Skill not loading

1. Check skill is in skills directory
2. Verify SKILL.md has correct frontmatter
3. Run `openclaw status` to see loaded skills
