# OpenCode Go Usage — 使用量桌面监控

[English](README.md) | **中文**

轻量级桌面托盘应用，实时监控 [OpenCode](https://opencode.ai) 工作区的使用量——滚动配额、周配额、月配额——无需保持浏览器标签页打开。

基于 Electron 构建，无需官方 API。

## 截图

```
┌─────────────────────────────────┐
│  OpenCode Go                    │
│  Usage Monitor          [Live]  │
│                                 │
│  ┌─────────────────────────────┐│
│  │  Rolling Remaining          ││
│  │  89%                        ││
│  │  Used 11%    Reset 42m     ││
│  │  ████████████░░░░░░░░░░░░  ││
│  └─────────────────────────────┘│
│  ┌────────────┐ ┌────────────┐  │
│  │ Weekly     │ │ Monthly    │  │
│  │ 8% left    │ │ 12% left   │  │
│  │ Used 92%   │ │ Used 88%   │  │
│  └────────────┘ └────────────┘  │
│                                 │
│  deepseek-v4-flash  │ 50 record │
│  CNY 1.46          │ 4.8M cache│
│                                 │
│  [Refresh]  [Login]  [Config]  │
└─────────────────────────────────┘
```

## 功能

- **托盘运行** — 驻留系统托盘，无需浏览器常开
- **实时用量** — 滚动/周/月配额一目了然
- **手动 Cookie 登录** — 浏览器登录一次，粘贴 auth cookie 即可
- **隐藏到托盘** — 关闭按钮最小化到托盘
- **多工作区支持** — 可在 UI 中切换工作区
- **轻量** — 打包后约 60MB，无后台服务

## 安装

### 下载安装包

从 [Releases](https://github.com/qintaiyang/OpenCode-Go-Usage-/releases) 下载最新安装包。

### 从源码构建

```bash
npm install
npm run build:win     # Windows NSIS 安装包
```

## 使用方法

### 首次设置

1. 启动应用，点击 **Login**。
2. 点击 **Open OpenCode**——浏览器会打开 `https://opencode.ai/workspace/<id>/go`。
3. 使用你的账号登录（Google OAuth）。
4. 按 F12 → **Application** 标签 → **Cookies** → `https://opencode.ai`。
5. 找到名为 **auth** 的 cookie，复制其 **Value**（以 `Fe26.2**...` 开头）。
6. 粘贴到应用的登录面板，点击 **Save Cookie**。

> 工作区 ID 会自动填入。如需切换工作区，在登录面板中修改 Workspace ID 字段后点击 **Save Workspace**。

### 日常使用

- **刷新** — 点击 Refresh 按钮，或右键托盘图标 → Refresh Usage
- **隐藏到托盘** — 点击 × 或关闭窗口
- **打开配置文件夹** — 点击 Config 查看 `config.json`

## 配置文件

配置文件位于 `%APPDATA%\opencode-go\config.json`：

```json
{
  "auth": "Fe26.2**...",
  "workspace_id": "wrk_..."
}
```

也支持环境变量：

```bash
set OPENCODE_AUTH=Fe26.2**...
set OPENCODE_WORKSPACE_ID=wrk_...
```

## CLI 工具

`scripts/` 目录包含独立运行的 CLI 工具（需 Node.js 18+）：

```bash
# 获取使用量
node scripts/fetch-usage-cli.js

# 命令行传递 cookie
node scripts/fetch-usage-cli.js "Fe26.2**..." [workspace-id]

# 验证运行时配置
npm run check:usage:runtime
```

## 工作原理

OpenCode 使用基于 seroval 的自定义 API 协议。应用：

1. 发送 `GET /_server` 请求，携带函数 hash 和 seroval 编码的参数
2. 解析 seroval 响应，提取使用量摘要和明细
3. 在毛玻璃 UI 中展示数据

无需浏览器自动化、无 Puppeteer、无无头浏览器。

## 技术栈

| 层 | 技术 |
|-------|-----------|
| 桌面框架 | Electron 42 |
| UI | HTML + CSS (毛玻璃风格) |
| IPC | contextBridge + ipcRenderer |
| API | HTTP fetch (Node 18+ 原生) |
| 认证 | 手动 Cookie 粘贴 (HttpOnly) |

## 许可证

MIT © 2026 qintaiyang
