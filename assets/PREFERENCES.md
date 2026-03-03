# 用户偏好记忆（模板）

将每个用户的偏好固定保存在 `memory/preferences/<user_key>.md`，便于检索与持续更新。

## 元信息

- **User-Key**: <稳定的用户标识>
- **Last-Updated**: <ISO-8601>
- **Scope**: personal_preferences

## 偏好条目

每条偏好建议保持“短、可复用、可覆盖”。当偏好发生变化时，用新条目覆盖旧条目，并在条目内说明“是否漂移/替代关系”。

```markdown
### [PREF-YYYYMMDD-XXX] <领域>/<维度>

**Updated**: 2026-03-03T10:00:00+08:00
**Status**: active | superseded
**Confidence**: high | medium | low
**Type**: global | conditional

#### Preference
<一句话偏好描述，尽量可直接用于决策>

#### Conditions (optional)
- <触发条件/上下文，例如“困的时候” “早上” “预算<1000”>

#### Evidence (optional)
- From: pre-action | post-action
- Quote: "<用户原话片段>"

#### Supersedes (optional)
- PREF-YYYYMMDD-ABC
```

## 当前可用摘要（给模型注入用）

把最关键的 5-10 条“仍 active 的偏好”在这里汇总，便于一次性注入上下文。

- <偏好 1>
- <偏好 2>
