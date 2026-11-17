# Little Steps v2.0.0 — GitHub 发布指南（Mac）

**仓库：** https://github.com/Yunmo0121/Little-Steps  
**网站：** https://yunmo0121.github.io/Little-Steps/

> 这里是完整的静态站点，包含 Season One、Cozy Cottage 和 Season Two 五章。请先解压 ZIP，再上传**解压后文件夹内的内容**到仓库根目录。不要只上传 ZIP，也不要额外嵌套一层目录。

## 先检查

解压后打开 `index.html`。检查主菜单、World Book、Cozy Cottage、Season Two 的五个岛屿及故事、RL 按钮，以及新绘本图片与迷宫图标是否能显示。

已有浏览器存档时不要随意点击重新开始的选项。发布后的 GitHub Pages 站点和本地 `file://` 不共享进度。

## 建议：在原有 Git 工作副本中发布

如果之前已经在桌面创建过 `little-steps-release` 并且里面有 `.git`，可以直接使用。否则从 GitHub 克隆一个新的工作副本：

```bash
cd ~/Desktop
git clone https://github.com/Yunmo0121/Little-Steps.git little-steps-release
```

把本次 ZIP 解压到桌面后，**先确认文件夹实际名称**。下面的命令假设它叫 `Little-Steps-v2.0.0-Season-Two-Release`，并且和 `little-steps-release` 同级：

```bash
cd ~/Desktop/little-steps-release
# 建议先确保你在正确的仓库里
git remote -v
git status

# 同步新版文件，不会删掉或覆盖 .git 目录
rsync -av --exclude '.git/' \
  ~/Desktop/Little-Steps-v2.0.0-Season-Two-Release/ \
  ./

git status
```

如果 `git status` 没有显示文件变化，检查你是否复制了正确的文件夹。确认后：

```bash
git add -A
git commit -m "Release Little Steps v2.0.0: complete Season Two"
git push origin main
```

上面的 `rsync` **不会自动删除旧文件**，这是为了保护已有仓库内容。如果 GitHub 上还留着过时文件，请之后再有针对性地清理，不要直接删除 `.git`。

## 验证线上网站

- 打开仓库，确认根目录有 `index.html`、`README.md`、`开始使用_中文.md`，并保留 `assets/`、`tests/`、`docs/` 等文件夹。
- 在 GitHub **Actions** 确认 Pages 部署成功。
- 进入 **Settings → Pages** 核对发布源：如果原本是 `Deploy from a branch`、`main`、`/(root)`，无需修改。
- 打开 https://yunmo0121.github.io/Little-Steps/，强制刷新 `Command + Shift + R`，最好再用无痕窗口检查主菜单、海岛地图和图片。
- 使用线上网址走一遍 Lantern Bay 和 Tidal Island 的操作，再检查三至五章故事与训练按钮。

## 创建 GitHub Release（建议）

在仓库右侧 **Releases → Draft a new release**：

- **Tag:** `v2.0.0`
- **Title:** `Little Steps v2.0.0 — Season Two: The Enchanted Isles`
- **Description:** 复制 [`RELEASE_NOTES_v2.0.0.md`](RELEASE_NOTES_v2.0.0.md) 的内容。

Release 负责记录版本里程碑；GitHub Pages 的在线游玩由 `main` 分支的部署决定，两者不同。

## 安全提醒

如果 GitHub 要求登录，请使用官方授权流程，不要把 Access Token 发给聊天助手。若 `git push` 被拒绝，先阅读错误，不要直接运行强制推送。过去在 `file://` 存的进度不会自动同步到线上网址。
