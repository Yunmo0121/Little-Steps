# Season Two 第一章使用说明 · The First Voyage

本文件介绍 **Little Steps — The Enchanted Isles** 的Alpha 1.4 可玩强化学习实验。**当前开放 Chapter 01：Lantern Bay 和 Chapter 02：Tidal Island**；另外三座岛屿仍是未来计划。

## 如何进入游戏

打开 `index.html`，在主菜单选择 **Explore Season Two · The Enchanted Isles**，进入群岛 World Map。点击第一座岛屿 **Lantern Bay**，或点击 **Begin Chapter 01**，先进入三页绘本剧情。可以用 **Turn the page** 翻页、**← Back** 返回上一页、**Skip story** 跳过；结束后自动进入学习实验台。实验台顶部的 **Read the chapter story again** 可以随时重看。

本版依然保留 Season One 五章冒险及 Cozy Cottage；第二季训练数据与第一季存档彼此独立。

## 第一章绘本开场

剧情依次讲述 **A letter by the sea → Not every wave is gentle → Learning the way to Lantern Bay**，带出 Kristie 从家园出发、看见礁石与海流、通过重复尝试学习的故事。第一章的海域是**静态且确定性**的；潮汐和等待动作已经在第二章实现，详见 [Chapter 02 中文指南](TIDAL_ISLAND_LAB_CN.md)。

## 第一步：自己试着开船

点击 **Take the helm**，使用 **WASD**、方向键或屏幕上的四个方向按钮开船。目标是抵达灯塔，绕开礁石。

- 蓝色海面：成本 1。
- 浅水区：成本 2。
- 深色浪区：成本 4。
- 礁石：不可通过；撞上会得到负奖励。
- 海流 `→`：船进入后，若右侧安全，会自动向东推进一格。

手动挑战和 RL 训练是两件独立的事。亲自走路不会自动修改 Q 表。

## 第二步：真正训练 Kristie

选择 **Q-Learning** 或 **SARSA**，然后调整三个参数：

- **α（Learning rate）**：新经验影响 Q 值的程度。
- **γ（Discount factor）**：未来奖励的权重。
- **ε（Initial exploration）**：训练开始时随机探索的概率；之后逐步衰减。

点击 **Train 200 episodes** 或 **Train +800**。每个 episode 中，程序都会在同一地图上模拟船只行动、得到奖励并更新相应的 Q 值。训练不是预先录制的动画。

- **Learning record**：训练回合数、最近 50 回合成功率、最近 50 回合平均奖励，以及每 20 回合一组的训练成功率曲线。可以点击 **Success rate** 或 **Mean reward** 切换两种真实训练指标；后者的均值来自同批次 episode 的 reward 总和。
- **Show policy**：在已经更新过 Q 值的海格上显示当前贪心动作。
- **Follow learned route**：从起点沿目前学到的贪心策略尝试开到终点；若仍然绕圈，可以继续训练或调整参数。
- **Inside Kristie's decision**：点击任意格子查看那个状态下上下左右四个动作的 Q 值，并用横条比较动作价值；高亮代表当前最高估计值。
- **Exploration chance now**：在当前参数下，下一回合使用的 ε 探索率（按 episode 数衰减，最低 4.5%）。
- **Greedy evaluation**：不再随机探索，从起点贪心行驶的一次确定性检查，显示到达与否、步数和路线代价。它**不是**多回合评估的成功率。

## 第三步：理解算法对比

**BFS**：已知地图与海流的转换规则，找到动作数最少的路线。**Dijkstra**：同样已知地图，但目标是最小化地形成本。**Q-Learning / SARSA**：初始 Q 值都为 0，不提前交给 Kristie 一条完整路线，让她通过经验学习。

当前地图的参考数据是：

| 方法 | 动作数 | 地形成本 |
|---|---:|---:|
| BFS | 9 | 12 |
| Dijkstra | 9 | 9 |

**注意**：Q-Learning 的奖励函数不仅包含地形成本，还包含每步惩罚、终点奖励及未来奖励折扣。因此它学习的贪心路径不一定与 Dijkstra 最低成本路径相同；这不是算法坏了。

### 奖励函数（实际代码）

- 抵达终点：`+40`；
- 合法的非终点移动：`-0.15 - 0.35 × 地形成本`；
- 撞到礁石或地图边界：`-3.5`；
- 一回合最多 72 次动作。

### Q-Learning 更新

`Q(s,a) ← Q(s,a) + α [r + γ maxₐ′ Q(s′,a′) − Q(s,a)]`

SARSA 则根据在下一个状态中**实际选择**的动作更新：`r + γ Q(s′,a′)`，所以这两种算法的学习行为可能不同。

## 如何做可复现的小实验？

我们加入了 **Experiment seed**（默认 42）。在相同参数和初始状态下，同样的训练过程会得到相同结果。你可以先 Q-Learning 训练 200 + 800 次，再重置该模型、保持种子和参数不变重复训练 1000 次；它们应该产生相同的 Q 表。

**注意**：训练期间改变 α、γ、初始 ε 或采用不同批次中途改参数，不能算同一个实验。更换 seed 请先点击 **Clear training**；这个按钮只清除当前算法模型，不会清除第一季或另一个 RL 算法的数据。

## 保存、部署与排错

存档保存在当前浏览器的 `localStorage` 中，不会同步到不同设备或浏览器。需要时可在项目目录运行 `python3 -m http.server 8000`，然后打开 `http://localhost:8000/`。

Season Two 当前属于**本地开发预览**，还没有替换 GitHub Pages 上正式发布的 Season One V1.2.3。待验收后再发布。
