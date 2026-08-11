# 篮球计分板 PWA

调用手机摄像头实时画面（背景）+ 比分浮层，用于篮球比赛现场计分。纯前端 PWA，可"添加到主屏幕"在 iPhone / Android 上像 App 一样使用。无后端、不上架。

## 功能
- 全屏调用后置摄像头（背景），无权限时自动降级为纯色背景
- 比分浮层：主队 / 客队 队名 + 实时比分 + 节数
- 交互：**点队名区域 +1**，**点比分 −1**（最低 0），**长按队名改名**，**点中间「节」下一节 / 长按上一节**
- 右上角 ⚙ 进入「编辑模式」：比分条 / 上传图片可**拖动位置、双指（或滚轮）缩放大小**
- 主队 / 客队颜色可自定义（区分两队服装）
- 所有设置 / 位置 / 大小自动本地保存
- 支持"添加到主屏幕"

## 用法（iPhone）
1. 用 **Safari** 打开部署后的网址（必须 HTTPS）
2. 点底部「分享」→「添加到主屏幕」
3. 桌面出现图标，点开即独立运行（无浏览器地址栏）

> ⚠️ 安装 PWA 必须用 **Safari**，iPhone 上的 Chrome 无法"添加到主屏幕"。
> ⚠️ 相机在"添加到主屏幕后的独立模式"可用，建议 **iOS 16.4+**。
> ⚠️ iOS 不强制横屏，请直接横持手机；布局已做横竖屏自适应。
> ⚠️ iOS 隐私机制可能约 7 天未打开时清空本地数据（影响"记住颜色/位置"）。

## 本机调试
```powershell
cd BasketballScoreboardPWA
python -m http.server 8000
# 浏览器打开 http://localhost:8000  （localhost 是安全上下文，可直接测相机）
```

## 部署到 Cloudflare Pages（免费）

### 方式 A：Dashboard 直接上传（最简单，无需安装）
1. 把本目录打包成 zip（或保留目录结构）
2. 登录 Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Upload assets**
3. 上传本目录，Framework preset 选 `None`，Build command 留空，Build output directory 填 `.`
4. 部署完成会得到一个 `*.pages.dev` 地址，用 iPhone Safari 打开 → 添加到主屏幕

### 方式 B：wrangler 命令行
```powershell
npm i -g wrangler
wrangler login            # 浏览器登录你的 Cloudflare 账号
wrangler pages deploy .   # 在本目录执行
```

### 方式 C：连 GitHub 自动部署
1. 把本目录推到 GitHub 仓库
2. Cloudflare Pages → 连接 Git 仓库 → 选该仓库 → Framework preset `None`，Build output directory `.`
3. 之后每次 git push 自动部署

## 文件结构
- `index.html` / `styles.css` / `app.js`：界面与逻辑
- `manifest.json` / `sw.js`：PWA 配置与离线缓存
- `icons/`：PWA 图标（由用户图片生成）
