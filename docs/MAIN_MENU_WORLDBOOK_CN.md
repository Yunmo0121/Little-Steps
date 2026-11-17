# Little Steps — 主菜单与 World Book 更新说明

这是从 Season Two Alpha 1.5.3（Silver Bell）直接升级而来的可运行版本，而不是单独的网页 mockup。

## 本次调整

- **Main Menu：**采用粉奶油色系，独立于任何一季。使用可交互按钮而不是将文字嵌进图片。
- **Start / Continue Journey：**首次开始进入 Season One 第一章；已有进度的用户继续之前保存的章节，不会重置存档。
- **World Book：**集中展示 The Wondergarden、The Enchanted Isles 和计划中的 The Spellbound Atlas。可点击前两个，第三个是不可点击的未来预告。
- **Cozy Cottage：**保留直接入口，室内阁楼、室外花园及保存布局功能不变。
- **Robot Diary：**保留现有故事成长记录。
- **Collection：**新增实际计算的 Season One 成就页面，使用原有 XP、星星、幸运草和章节完成数据（没有模拟数据）。
- **季节返回路径：**Season One 的 Chapters 与 Season Two 的主入口均可返回 World Book。

## 打开方法

1. 将 ZIP 解压到 Mac 上的任意目录。
2. 打开其中的 `index.html`。不要单独移动 HTML；同目录的 JS、CSS 和 assets 也需要保留。
3. 在主菜单点击 World Book，可以进入 Season One / Two；Season Three 目前仅展示剧情预告。
4. 游戏进度仍保存在当前浏览器的 localStorage，本更新没有改动原有的存档 key。

## 代码说明

- `index.html`：主菜单、World Book、Collection 的真实 HTML 结构。
- `main-menu.css`：新主菜单和 World Book 的响应式样式。
- `app.js`：页面切换、World Book 进度同步、Collection 真实数据、Start/Continue 自动判断。
- `assets/menu-kristie-pink.webp`：从用户选定的绘本主菜单概念图裁切的纯插画部分，不含按钮与标题文字。

## 后续季节

Season 3 — The Spellbound Atlas 保留故事：Kristie 在 Season Two 最后一章 Starharbor 捡到会自己翻页的地图，翻开后看到一座云层上的魔法学院；未来的漂浮花园、魔法图书馆、传送门、神秘观测台会在该季独立展开。魔法季尚未实现，界面不会误标为可玩。
