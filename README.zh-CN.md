# OpenCode Go Usage — 使用量桌面监控

[English](README.md) | **中文**

轻量级桌面托盘应用，实时监控 [OpenCode](https://opencode.ai) 工作区的使用量——滚动配额、周配额、月配额——无需保持浏览器标签页打开。

基于 Electron 构建，无需官方 API。v1.1.0

## 截图

```
┌───────────────────────────────────┐
│  OpenCode Go                      │
│  用量监控                  [在线] │
│                                   │
│  [ 主账户                 v] [密钥] │
│                                   │
│  ┌──────────────────────────────┐ │
│  │ 滚动剩余                     │ │
│  │  100%                        │ │
│  │  已用 0%    重置 5h          │ │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│  └──────────────────────────────┘ │
│  ┌────────────┐ ┌───────────────┐ │
│  │ 每周       │ │ 每月          │ │
│  │ N/A        │ │ 8% 剩余       │ │
│  └────────────┘ └───────────────┘ │
│                                   │
│  deepseek-v4-flash │ 50 条记录    │
│  CNY 1.46          │ 4.8M 缓存   │
│                                   │
│  [刷新] [登录] [新建] [配置]      │
└───────────────────────────────────┘
```

## 功能

- **托盘运行** — 驻留系统托盘，无需浏览器常开
- **实时用量** — 滚动/周/月配额一目了然
- **多账户支持** — 添加和切换多个 OpenCode 账户
- **自定义玻璃账户菜单** — iOS 风格弹出菜单，无原生 `<select>`
- **API 密钥管理** — 在浮层中列出/复制 API 密钥
- **手动 Cookie 登录** — 浏览器登录一次，粘贴 auth cookie 即可
- **隐藏到托盘** — 关闭按钮最小化到托盘
- **多工作区支持** — 可在 UI 中切换工作区
- **全界面中文** — 完整中文适配，包含所有标签和提示
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

1. 启动应用，点击 **登录**。
2. 点击 **打开 OpenCode**——浏览器会打开 `https://opencode.ai/workspace/<id>/go`。
3. 使用你的账号登录（Google OAuth）。
4. 按 F12 → **Application** 标签 → **Cookies** → `https://opencode.ai`。
5. 找到名为 **auth** 的 cookie，复制其 **Value**（以 `Fe26.2**...` 开头）。
6. 粘贴到应用的登录面板，点击 **保存 Cookie**。

> 工作区 ID 会自动填入。如需切换工作区，在登录面板中修改后点击 **保存账户**。

### 多账户管理

1. 点击底部 **新建** 按钮打开空白编辑器。
2. 输入账户名称、工作区 ID，并粘贴 auth cookie。
3. 点击 **保存 Cookie**——新账户即创建完成并切换为当前账户。
4. 点击状态栏左侧的账户菜单按钮切换不同账户。

### API 密钥管理

1. 点击 **密钥** 按钮（账户菜单右侧）打开 API 密钥浮层。
2. 列表中显示掩码后的密钥。点击 **复制** 将完整密钥复制到剪贴板（由主进程处理，不暴露给渲染进程）。
3. 创建/删除功能暂未启用，待 POST seroval 编码验证后开放。

### 日常使用

- **刷新** — 点击刷新按钮，或右键托盘图标 → 刷新用量
- **隐藏到托盘** — 点击 × 或关闭窗口
- **打开配置文件夹** — 点击配置查看 `config.json`

## 配置文件

配置文件位于 `%APPDATA%\opencode-go\config.json`（v1.1.0 多账户格式）：

```json
{
  "activeAccountId": "acc_20260531_ab12cd34",
  "accounts": [
    {
      "id": "acc_20260531_ab12cd34",
      "name": "主账户",
      "workspaceId": "wrk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "auth": "Fe26.2**...",
      "createdAt": "2026-05-31T00:00:00.000Z",
      "updatedAt": "2026-05-31T00:00:00.000Z"
    }
  ]
}
```

旧版单账户配置（`{ "auth": "...", "workspace_id": "..." }`）首次启动时会自动迁移。

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

# 验证运行时配置和账户
npm run check:accounts

# 验证运行时用量获取
npm run check:usage:runtime

# 列出当前账户的 API 密钥
npm run check:api-keys
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
| UI | HTML + CSS (iOS 毛玻璃风格) |
| IPC | contextBridge + ipcRenderer |
| API | HTTP fetch (Node 18+ 原生) |
| 认证 | 手动 Cookie 粘贴 (HttpOnly) |
| 国际化 | 内置中文适配 |

## 安全机制

- 完整 auth cookie 和 API Key 由 Electron 主进程持有
- 渲染进程仅接收掩码预览（`Fe26.2**...xxxx`、`sk-...xxxx`）
- API Key 复制由主进程一次性写入剪贴板
- 完整密钥不记录日志、不持久化到 UI
- 新建账户模式下 Delete 按钮自动隐藏，防止误删活跃账户

## 许可证

MIT © 2026 qintaiyang
