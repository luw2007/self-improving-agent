# Self-Improving Agent Skill

让 AI 代码助手从错误和用户反馈中持续学习，实现知识积累与个性化对齐。

## 🌟 核心能力

### 1. 学习日志系统
自动记录错误、纠正和洞察，构建可追溯的知识库：
- **错误日志** (`.learnings/ERRORS.md`) - 命令失败、异常、集成问题
- **学习日志** (`.learnings/LEARNINGS.md`) - 纠正、知识缺口、最佳实践
- **功能请求** (`.learnings/FEATURE_REQUESTS.md`) - 用户需求追踪

### 2. PAHF 偏好学习（基于 Meta 论文）
通过三步反馈闭环实现个性化对齐：
- **Pre-Action**: 检索偏好 → 必要时澄清 → 写入记忆
- **Execution**: 基于偏好做决策
- **Post-Action**: 检测反馈 → 提取偏好 → 合并更新

详见 [PAHF.md](PAHF.md)。如需整合分析报告，见 `outputs/reports/PAHF-integration-analysis.md`。

## 🚀 快速开始

### 安装（OpenClaw）

```bash
clawhub install self-improving-agent
```

默认情况下，ClawHub 会将 Skill 安装到你当前目录下的 `./skills/self-improving-agent`（OpenClaw 会在下次会话把它当作 `<workspace>/skills` 自动加载）。因此推荐在你的 OpenClaw workspace 目录中执行该命令（常见为 `~/.openclaw/workspace`，也可能是你的项目目录）。

或手动安装（两种都可用）：
```bash
# 方案 A：安装到 OpenClaw 的全局 skills 目录（跨 workspace 共享）
git clone https://github.com/peterskoett/self-improving-agent.git ~/.openclaw/skills/self-improving-agent

# 方案 B：安装到某个 workspace 的本地 skills 目录（推荐，便于项目隔离）
git clone https://github.com/peterskoett/self-improving-agent.git <workspace>/skills/self-improving-agent
```

### 初始化

```bash
mkdir -p <workspace>/.learnings
mkdir -p <workspace>/memory/preferences

cp <skill-dir>/assets/LEARNINGS.md <workspace>/.learnings/
cp <skill-dir>/assets/ERRORS.md <workspace>/.learnings/
cp <skill-dir>/assets/FEATURE_REQUESTS.md <workspace>/.learnings/
```

其中：
- `<workspace>`：你的 OpenClaw workspace 目录（常见为 `~/.openclaw/workspace`，也可能是你当前项目目录）
- `<skill-dir>`：`<workspace>/skills/self-improving-agent`（ClawHub 安装默认位置）或 `~/.openclaw/skills/self-improving-agent`（全局安装）

### 基本使用

#### 场景 1: 记录技术错误
```markdown
当命令失败或遇到异常时，立即记录到 `.learnings/ERRORS.md`：

## [ERR-20260303-001] npm_install_failed

**Logged**: 2026-03-03T10:00:00Z
**Priority**: high
**Status**: pending
**Area**: infra

### Summary
npm install fails with ENOENT error

### Error
```
npm ERR! enoent ENOENT: no such file or directory, open '/path/package.json'
```

### Context
- Command: `npm install`
- Expected: Install dependencies
- Actual: File not found error

### Suggested Fix
Check if in correct directory, or use `pnpm` instead

### Metadata
- Reproducible: yes
- Related Files: package.json
```

#### 场景 2: 学习用户偏好（PAHF 协议）
```markdown
当用户表达个人偏好时，记录到 `memory/preferences/<user>.md`：

### [PREF-20260303-001] code_style/quotes

**Updated**: 2026-03-03T10:30:00+08:00
**Status**: active
**Confidence**: high
**Type**: global

#### Preference
使用单引号而非双引号表示字符串

#### Evidence
- From: post-action
- Quote: "Actually, I prefer single quotes for strings"
```

#### 场景 3: 推广到项目记忆
```markdown
当学习具有广泛适用性时，推广到 `CLAUDE.md` 或 `AGENTS.md`：

# CLAUDE.md 新增内容
## Build & Dependencies
- Package manager: pnpm (not npm) - use `pnpm install`
```

## 📖 使用指南

### 何时使用学习日志 vs 偏好记忆

| 类型 | 使用学习日志 | 使用偏好记忆 |
|------|------------|------------|
| **示例** | "这个 API 不支持该参数" | "我喜欢早上 9 点开会" |
| **性质** | 客观事实、技术错误 | 主观偏好、个人风格 |
| **适用范围** | 所有用户/所有项目 | 特定用户 |
| **推广目标** | CLAUDE.md, AGENTS.md | 不推广，保持个人化 |
| **变更频率** | 较低（知识稳定） | 较高（偏好可变） |

**快速判断**：如果换个用户答案可能不同 → 用偏好记忆；否则用学习日志。

### PAHF 三步闭环详解

```
┌─────────────────────────────────────────────────┐
│  每个任务都执行以下流程：                          │
├─────────────────────────────────────────────────┤
│  1. Pre-Action (行动前)                          │
│     - 检索相关偏好（top-5）                       │
│     - 若指令含主观性 → 生成澄清问题               │
│     - 获取回答 → 写入记忆                         │
├─────────────────────────────────────────────────┤
│  2. Execution (执行)                             │
│     - 输入: 指令 + 环境 + 偏好 + 澄清             │
│     - 输出: 决策                                 │
├─────────────────────────────────────────────────┤
│  3. Post-Action (行动后)                         │
│     - 仅当用户表达不满/纠正时触发                 │
│     - 显著性检测 → 偏好提取 → 漂移检测            │
│     - 合并更新 or 新增                           │
└─────────────────────────────────────────────────┘
```

详见 [PAHF.md 完整协议](PAHF.md)。

## 🔧 工具链（规划中）

### CLI 命令（未来版本）

```bash
pahf feedback "user feedback text" --user <user_key>
pahf search "query" --user <user_key>
pahf list --user <user_key>
pahf stats
```

### Python API（未来版本）

```python
from self_improving_agent.feedback import detect_salience, detect_drift
from self_improving_agent.memory import MarkdownMemoryBank

bank = MarkdownMemoryBank("memory/preferences/alice.md")
if detect_salience(feedback, llm_client):
    summary = summarize_preference(feedback, "alice", llm_client)
    bank.integrate(summary, llm_client)
```

当前版本需手动执行 PAHF 协议步骤。自动化工具正在开发中。

## 🧭 结构说明

这份仓库既可以作为“源码仓库”存在，也可以作为“OpenClaw 可加载的 Skill 目录”被安装到 workspace。实际运行时，建议用下面的三类目录来理解：

- **Skill 安装目录**：`<workspace>/skills/self-improving-agent`（ClawHub 默认）或 `~/.openclaw/skills/self-improving-agent`（全局）
- **学习日志目录**：`<workspace>/.learnings/`（ERRORS / LEARNINGS / FEATURE_REQUESTS）
- **偏好记忆目录（PAHF）**：`<workspace>/memory/preferences/`（每个用户一个 `<user_key>.md`）

## 📂 文件结构

```
self-improving-agent/
├── SKILL.md                  # 主文档（使用说明）
├── PAHF.md                   # PAHF 协议详细说明
├── README.md                 # 本文件（快速开始）
├── assets/                   # 模板文件
│   ├── LEARNINGS.md
│   ├── ERRORS.md
│   ├── FEATURE_REQUESTS.md
│   ├── PREFERENCES.md        # 偏好记忆模板
│   └── PAHF-CHECKLIST.md     # 执行检查单
├── hooks/                    # OpenClaw hook 集成
├── references/               # 参考文档
└── scripts/                  # Shell 工具脚本
```

## 🎓 示例场景

### 示例 1: 代码风格偏好

**用户反馈**：  
> "我更喜欢用函数式组件而不是类组件"

**Agent 行动**：
1. 检测显著性：✅ 包含个性化信息
2. 检测漂移：✅ 表达偏好变更（"更喜欢 X 而不是 Y"）
3. 提取偏好：`Prefers functional components over class components in React`
4. 查找相似记忆：找到 `[PREF-20260301-001] react/component_style`
5. 合并更新：覆盖旧偏好，标记为 `superseded`

**下次行动**：
- 生成 React 组件时，自动使用函数式组件
- 若必须用类组件（如生命周期需求），明确说明原因

### 示例 2: 工具链偏好

**用户反馈**：  
> "这个项目用 pnpm，别用 npm"

**Agent 行动**：
1. 检测显著性：✅ 包含个性化信息
2. 检测漂移：❌ 首次提及（新增）
3. 提取偏好：`Project uses pnpm for package management, not npm`
4. 写入：`memory/preferences/luwei.md` 新增条目

**推广判断**：
- 这是项目级约束，不是个人偏好
- 应推广到 `CLAUDE.md`（项目事实）而非停留在偏好记忆

### 示例 3: 沟通风格偏好

**用户反馈**：  
> "回复简洁点，不要那么啰嗦"

**Agent 行动**：
1. 检测显著性：✅ 包含个性化信息
2. 提取偏好：`Prefers concise responses without verbose explanations`
3. 写入：`memory/preferences/luwei.md`
4. 后续会话：自动加载此偏好 → 调整输出风格

## 🔗 相关链接

- **完整文档**: [SKILL.md](SKILL.md)
- **PAHF 协议**: [PAHF.md](PAHF.md)
- **整合分析**: `outputs/reports/PAHF-integration-analysis.md`
- **官方实现**: [facebookresearch/PAHF](https://github.com/facebookresearch/PAHF)
- **本地源码（工作区）**: `repos/PAHF`

## 🔁 迁移

### 从旧文档路径（`skills/self-improvement/...`）迁移

如果你曾按旧版本说明在 hook / 配置里写了 `./skills/self-improvement/...`，需要把路径改为：

- `./skills/self-improving-agent/scripts/activator.sh`
- `./skills/self-improving-agent/scripts/error-detector.sh`
- `./skills/self-improving-agent/scripts/extract-skill.sh`

### 从 `clawdhub` 迁移到 `clawhub`

`clawdhub` 可能作为旧别名出现。为与 OpenClaw 文档一致，统一使用：

```bash
clawhub install self-improving-agent
```

### 从全局安装迁移到 workspace 安装（可选）

如果你过去将 Skill 放在 `~/.openclaw/skills/self-improving-agent`，现在想切换到 workspace 隔离：

1. 在目标 `<workspace>` 下执行 `clawhub install self-improving-agent`（会写入 `<workspace>/skills/...`）
2. 保留 `~/.openclaw/skills/...` 或删除（确保你的 OpenClaw `skills.load` 顺序不会同时加载两份同名 Skill）

## 📝 版本历史

- **v1.1.0** (2026-03-03) - 完成 PAHF 项目调研与整合分析
- **v1.0.0** - 初始版本（学习日志系统 + PAHF 协议文档）

## 🤝 贡献

基于以下项目：
- [pskoett/pskoett-ai-skills](https://github.com/pskoett/pskoett-ai-skills) - 原始 self-improvement skill
- [facebookresearch/PAHF](https://github.com/facebookresearch/PAHF) - PAHF 框架实现

---

**快速开始**: 阅读 [SKILL.md](SKILL.md) → 创建 `.learnings/` 目录 → 开始记录！
