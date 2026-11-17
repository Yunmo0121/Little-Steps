# Chapter 03 — Misty Reef · The Secret of the Mist

本章采用独立于 Lantern Bay 灯塔任务的故事目标：**探索未知海域、寻找古老的银色航海钟，以及找到一条安全穿过迷雾礁石区的路线**。

## 三页剧情

1. **A Bell in the Fog** — Kristie 听到远处银色航海钟的声音，却不知道声音来自哪里。*“I can hear it... but where is it coming from?”*
2. **The Hidden Passage** — 她尝试穿过礁石区，每前进一点，就能看清附近一小片海域。*“Maybe every wrong turn can teach me something.”*
3. **The Silver Bell** — Kristie 抵达花朵环绕的海湾，发现古老的银色航海钟与穿过礁石区的安全航线。*“I didn’t need to see the whole way. I just needed to keep exploring.”*

## 与游戏机制的对应

- 地图末端的原灯塔格现改为一个银色航海钟目标格（`K`）；地图尺寸、奖励数值以及 Q-Learning / SARSA 更新规则保持不变。
- 手动操作仍是附近的区域随行动被发现；比较不同 ε 值时，数据来自实际模拟训练，包含成功率、碰撞次数、平均奖励和地图发现比例。
- **教学范围说明：** 可视化雾区并不是完整 POMDP；tabular agent 目前仍以底层全状态进行学习。

## 其余章节

- **Chapter 04 — Windward Passage：** 进入海峡 → 遭遇风浪 → 穿越安全水道；学习随机状态转移。
- **Chapter 05 — Starharbor：** 三个航标 → 收集并返航 → 发现会自行翻页的神秘地图；为 Season 3 的云端魔法学院铺垫。

三章每章三页插画，合计九张；本次仅替换 Chapter 03 的三张，其余六张保留。
