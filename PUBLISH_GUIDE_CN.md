# Little Steps v1.2.3 · GitHub 发布指南

**目标仓库：** https://github.com/Yunmo0121/Little-Steps  
**游戏网址：** https://yunmo0121.github.io/Little-Steps/

> 这个文件夹包含可以发布的完整静态网站。**ZIP 不是网页文件**：必须先解压，再将里面的文件放到 GitHub 仓库根目录。

## 第一步：检查发布包

打开解压后的 `Little-Steps-v1.2.3-GitHub-Ready` 文件夹，确认里面有：

```text
index.html
app.js
styles.css
home.js
home.css
assets/
docs/
tests/
README.md
开始使用_中文.md
```

先双击 `index.html` 试玩：主菜单、Chapter 1、Little Garden Corner、**My Little Home → Outdoor / Indoor Loft** 都应正常显示。注意：当前版本是**纯白天场景预览**，还没有自由装修。

## 第二步：上传到现有 GitHub 仓库

**推荐使用 Git 工作副本**，可完整保留 `assets/` 和 `docs/` 目录。打开 Mac 终端：

```bash
cd ~/Desktop
git clone https://github.com/Yunmo0121/Little-Steps.git little-steps-release
```

接下来用 Finder：打开刚解压的发布包，**进入文件夹内部，选中全部内容**，复制到 `~/Desktop/little-steps-release` 文件夹中；提示同名文件时选择替换/合并。

⚠️ 注意：不要把整个 `Little-Steps-v1.2.3-GitHub-Ready` 文件夹放进仓库再套一层，也不要删除 `little-steps-release` 中的隐藏 `.git` 目录。我们只是复制发布文件，而不是把源码文件夹本身作为子目录上传。

回到终端：

```bash
cd ~/Desktop/little-steps-release
git status
git add -A
git commit -m "Release Little Steps Season One + Cozy Cottage v1.2.3"
git push origin main
```

如提示认证，请在 GitHub 授权窗口完成登录。如果 `git clone` 时提示目标文件夹已经存在，请先选择其他名称，不要覆盖旧仓库目录。`git status` 是核对操作是否正确的关键一步。

## 第三步：验证发布

1. 打开 [GitHub 仓库](https://github.com/Yunmo0121/Little-Steps)，确认 `index.html` 位于首页文件列表，图片存在于 `assets/` 目录，而不是全部散落在根目录。
2. 打开 **Actions**，查看最新 GitHub Pages 部署是否成功。
3. 如需确认 Pages 设置，进入 **Settings → Pages**，选择 `Deploy from a branch`，分支 `main`，目录 `/(root)`；如果旧设置已经如此，**不用更改**。
4. 打开 https://yunmo0121.github.io/Little-Steps/，按 `Command + Shift + R` 强制刷新，最好再用无痕窗口打开测试。
5. 测试 Logo、Kristie 插画、第一章、Cozy Cottage 的 Outdoor / Indoor Loft 按钮，以及中文 README 链接。

GitHub Pages 从 `main` 根目录发布静态网站，符合 GitHub 官方的 **Deploy from a branch** 模式。

## 第四步（可选）：创建 Release

等线上版本确认无误后，在仓库 **Releases → Draft a new release**：

- **Tag**：`v1.2.3`
- **Release title**：`Little Steps v1.2.3 — The Wondergarden Adventures + Cozy Cottage`
- **Description**：可复制 `RELEASE_NOTES_v1.2.3.md` 中的英文发布说明。

Release 适合记录版本里程碑，但不是朋友通过网址游玩所必需的。

## 常见注意事项

- GitHub Pages 和本地文件是**不同的网站来源**，不共用存档。
- **Start Adventure 会重置当前网站的冒险记录**，已有进度建议选 Continue。
- 目前不能在线保存到 GitHub 账号；存档只在各自浏览器本地。
- 如果只是发布文件但网页图片没显示，优先检查路径 `assets/...` 是否和仓库内实际目录一致。
- 发布的是 v1.2.3，不是 Season Two；World Map、海岛章节和自由装修目前仍是未来规划。
