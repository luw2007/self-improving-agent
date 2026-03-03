# PAHF（个性化 Agent 从人类反馈学习）协议

本文件把论文《Learning Personalized Agents from Human Feedback》（arXiv:2602.16173v1, 2026-02）中的 **PAHF** 框架，翻译成可在 OpenClaw 会话中直接执行的"运行协议 + 记忆格式"。

## 📚 参考资源

- **论文**: https://arxiv.org/abs/2602.16173v1 (2026-02)
- **官方实现**: https://github.com/facebookresearch/PAHF
- **整合分析（工作区可选）**: `outputs/reports/PAHF-integration-analysis.md`

## 🚧 实现状态

| 能力 | 状态 | 说明 |
|------|------|------|
| **协议文档** | ✅ 完成 | 本文件描述完整的 PAHF 流程 |
| **偏好模板** | ✅ 完成 | `assets/PREFERENCES.md` |
| **检查单** | ✅ 完成 | `assets/PAHF-CHECKLIST.md` |
| **记忆后端代码** | 🔄 规划中 | 参考官方 `memory/banks.py`，计划实现轻量级 Markdown 版本 |
| **反馈检测器** | 🔄 规划中 | 显著性 + 漂移检测，参考 `agents/embodied_agent.py:238-252` |
| **CLI 工具** | 📋 待实施 | `pahf` 命令行工具 |
| **Hook 集成** | 📋 待实施 | 自动触发偏好更新 |

如需实施路线图，见 `outputs/reports/PAHF-integration-analysis.md`（若你的工作区已生成该报告）。

## 目标

- 让 Agent 对"单个用户的偏好"持续对齐，并在偏好变化时快速纠错。
- 把偏好当作显式、可更新的外部记忆，而不是只靠模型隐式吸收。

## 三步闭环（每个任务都按此执行）

### 1）行动前：检索 + 只问必要的澄清

- 先检索偏好记忆：根据当前指令与上下文（环境、约束、历史）找 top-k 相关偏好。
- 仅当满足任一条件时提问澄清：
  - 指令含主观偏好/“最喜欢/适合我/按我的习惯”等表达
  - 可选项之间需要偏好才能区分
  - 记忆为空或不够具体，导致无法确定动作
- 澄清问题的要求：
  - 只问一个关键维度（一次问太多会让用户回答成本过高）
  - 让选项空间变小且可写入记忆（例如“你更喜欢 A 还是 B？”、“连接方式偏好？”）
- 收到澄清回答后：必须先把回答写回偏好记忆，再执行动作。

### 2）执行：用偏好“落地决策”

- 决策输入必须同时包含：
  - 用户当下指令
  - 当前可选项/环境事实
  - 检索出的偏好摘要
  - 若有：澄清问答（问句 + 用户回答）
- 若偏好与硬约束冲突：优先满足硬约束，并在输出里明确说明冲突点与备选。

### 3）行动后：仅在出错时触发“纠错写回”

- 仅当用户明确表示结果不对/不满意/偏好变了，才进入写回流程。
- 写回流程（detect → summarize → integrate）：
  1. Detect：这段反馈是否包含“可泛化的个性化信息”？
  2. Summarize：提炼成单条、可复用的偏好 note
  3. Integrate：与既有 note 做“合并更新”或“新增”

## 偏好记忆组织（推荐）

把偏好记忆单独存一份，避免和 daily log 混在一起。

- 推荐目录：`memory/preferences/`
- 推荐文件：`memory/preferences/<user_key>.md`
  - `<user_key>`：尽量稳定（用户名/邮箱前缀/平台 id），同一用户保持一致

模板见 [assets/PREFERENCES.md](assets/PREFERENCES.md)。

### 结构说明（与 OpenClaw 一致）

在 OpenClaw 中，建议把偏好记忆放在你的 `<workspace>/memory/preferences/` 下：

- `<workspace>`：OpenClaw workspace 目录（常见为 `~/.openclaw/workspace`，也可能是你的项目目录）
- 偏好文件：`<workspace>/memory/preferences/<user_key>.md`

这样做的好处是：偏好属于“用户相关的可更新记忆”，与 `.learnings/`（客观技术教训）分离，且会随 workspace 一起被索引/归档。

### 迁移

如果你之前把偏好写在这些位置，建议迁移到 `memory/preferences/`：

- `memory/YYYY-MM-DD.md`（日记中混写偏好）→ 迁移到 `memory/preferences/<user_key>.md`
- `.learnings/LEARNINGS.md`（把偏好当作客观事实记录）→ 迁移到偏好文件，并在 learnings 中保留链接或标记为 promoted

## 何时“新增” vs “覆盖/合并”

把每条偏好当作短 note。对一条新反馈 `new_note`：

- **合并/覆盖**：当新反馈表述的是“同一偏好维度”的更新或修订
  - 明确漂移信号：`now I prefer` / `used to like` / `no longer like` / `instead of` / `changed my mind`
  - 或与旧 note 在语义上高度相似（同一品类、同一维度）
- **新增**：当新反馈是补充新维度、或是条件偏好（“当我困的时候…”）

## 可直接复用的提示词片段

把下列提示词作为“内部判别器”，用于把自由文本反馈变成结构化偏好更新。

### Salience Detector（是否含个性化信息）

```
Human feedback: {feedback}
Does the feedback contain any personalized information?
Answer a single word: Yes or No.
```

### Preference Drift Detector（是否发生偏好切换）

```
Does this feedback indicate a CHANGE in a previously stated preference (used to prefer X, but now prefers Y)?
Look for:
- "but now..." / "now I prefer..."
- "used to like X, but..."
- "changed my mind about..."
- "instead of X, I prefer Y"
- "no longer like..."

If it is only adding new information or conditional preferences (e.g., "I like X when tired"), answer No.
Answer a single word: Yes or No.
```

### Memory Integration（合并生成单条不冗余摘要）

```
Please create a concise, integrated summary that combines:
Existing memory: {existing_memory}
New information: {new_information}

Provide a single coherent summary without redundancy.
```

## 与"自我改进日志"如何协同

- 偏好记忆：写入 `memory/preferences/<user_key>.md`
- 过程教训/错误复盘：写入 `.learnings/LEARNINGS.md` 或 `.learnings/ERRORS.md`
- 当发现"反复发生的偏好澄清/写回失败模式"：记录为 best_practice，并推广到工作区 `AGENTS.md`

---

## 🔧 在 OpenClaw 中的实际应用

### 手动执行 PAHF 流程（当前版本）

由于自动化工具尚在开发中，当前需要手动执行以下步骤：

#### Step 1: 检测用户反馈类型

当用户给出纠正性反馈时，先判断类型：

**技术纠正** → 学习日志
```markdown
用户："这个 API 参数应该是 'userId' 不是 'user_id'"
→ 记录到 .learnings/LEARNINGS.md（客观事实）
```

**偏好纠正** → 偏好记忆
```markdown
用户："我更喜欢用 Vue 而不是 React"
→ 记录到 memory/preferences/<user>.md（主观偏好）
```

#### Step 2: 提取并记录偏好

使用内置 LLM 生成偏好摘要：

**提示词模板**：
```
User feedback: "{用户原话}"
Extract the user's personal preference in one brief sentence.
Focus on what they prefer, not why or when.
```

**写入格式**（参考 assets/PREFERENCES.md）：
```markdown
### [PREF-20260303-001] area/dimension

**Updated**: 2026-03-03T15:30:00+08:00
**Status**: active
**Confidence**: high
**Type**: global

#### Preference
{LLM 生成的单句摘要}

#### Evidence
- From: post-action
- Quote: "{用户原话片段}"
```

#### Step 3: 检查是否需要合并更新

**漂移信号词**：
- "now I prefer..."
- "used to like... but..."
- "changed my mind about..."
- "instead of X, I prefer Y"
- "no longer like..."

**若检测到漂移**：
1. 搜索 `memory/preferences/<user>.md` 找相关的旧偏好
2. 更新旧偏好的 `Status` 为 `superseded`
3. 在新偏好中添加 `Supersedes: PREF-YYYYMMDD-XXX`
4. 或使用 LLM 合并两者生成整合摘要

#### Step 4: Pre-Action 检索（下次任务时）

在执行涉及主观判断的任务前：
1. 读取 `memory/preferences/<user>.md`
2. 识别相关偏好（手动或通过关键词匹配）
3. 将偏好摘要注入决策提示词

**示例**：
```
任务：为用户创建一个新的 React 组件

检索到的偏好：
- [PREF-20260303-001] Prefers functional components over class components
- [PREF-20260228-003] Prefers TypeScript with strict mode

决策提示词：
"Create a React component for {task}.
User preferences: Use functional components, TypeScript with strict mode."
```

### 未来自动化（开发中）

如需路线图，见 `outputs/reports/PAHF-integration-analysis.md`（若你的工作区已生成该报告）。

**Phase 1 (MVP)**: 
- `pahf feedback` 命令自动执行检测 → 提取 → 写入
- 基于文本的记忆检索（grep + 关键词）

**Phase 2 (自动化)**:
- LLM 驱动的显著性和漂移检测
- 自动记忆整合（查找相似 + 合并）
- OpenClaw hook 自动触发

**Phase 3 (高级)**:
- Embedding-based 语义检索（SQLite + OpenAI Embeddings）
- 查询扩展、关键词增强

---

## 🔍 调试与验证

### 检查偏好记忆

```bash
# 查看用户的所有偏好
cat memory/preferences/<user>.md

# 搜索特定领域的偏好
grep -A 10 "code_style" memory/preferences/<user>.md

# 统计活跃偏好数量
grep -c "Status\\*\\*: active" memory/preferences/<user>.md
```

### 验证 PAHF 流程执行

参考 [assets/PAHF-CHECKLIST.md](assets/PAHF-CHECKLIST.md)：

**每次任务开始**：
- [ ] 是否先检索该用户的偏好记忆（若存在）？
- [ ] 任务是否涉及主观偏好/个性化选择？
- [ ] 若有歧义：是否只问一个关键澄清问题？
- [ ] 澄清答案是否在执行前写入偏好记忆？

**任务结束**：
- [ ] 用户是否给出"不满意/不对/偏好变了"等纠错反馈？
- [ ] 若有：是否先做"显著性检测"（过滤无信息反馈）？
- [ ] 若有显著信息：是否将其提炼为单条可复用偏好 note？
- [ ] 新 note 是"新增"还是"覆盖/合并"，是否合理？

---

## 📚 深入学习

### 官方资源
- **PAHF GitHub**: https://github.com/facebookresearch/PAHF
- **论文**: https://arxiv.org/abs/2602.16173v1

### 关键源码文件（工作区可选）

如果你的工作区包含 `repos/PAHF`，可参考：
- `repos/PAHF/agents/base.py` - 反馈处理基类
- `repos/PAHF/memory/banks.py` - SQLite + FAISS 记忆后端
- `repos/PAHF/memory/utils.py` - 检索与增强工具
- `repos/PAHF/agents/embodied_agent.py` - 完整的 post-action feedback 实现（约 L238-L300）

### 本 Skill 文档
- [SKILL.md](SKILL.md) - 完整使用说明
- [assets/PREFERENCES.md](assets/PREFERENCES.md) - 偏好记忆模板
- [assets/PAHF-CHECKLIST.md](assets/PAHF-CHECKLIST.md) - 执行检查单
- `outputs/reports/PAHF-integration-analysis.md` - 详细的整合分析与实施计划（工作区可选）
