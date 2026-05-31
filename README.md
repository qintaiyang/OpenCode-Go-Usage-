# OpenCode Go Usage

**English** | [中文](README.zh-CN.md)

A lightweight desktop tray app that monitors your [OpenCode](https://opencode.ai) workspace usage — rolling, weekly, and monthly token quotas — without keeping a browser tab open.

Built with Electron, no official API required. v1.1.0

## Screenshot

```
┌───────────────────────────────────┐
│  OpenCode Go                      │
│  用量监控                  [在线] │
│                                   │
│  [ Main account            v] [密钥] │
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

## Features

- **Tray-based** — Runs in the system tray, no browser needed
- **Live usage data** — Rolling, weekly, monthly quota at a glance
- **Multi-account support** — Add and switch between multiple OpenCode accounts
- **Custom glass account menu** — iOS-style popover menu, no native `<select>`
- **API Key management** — List, copy, and manage API Keys in an overlay panel
- **Manual cookie login** — Sign in via your browser once, paste the auth cookie
- **Auto-hide to tray** — Close button minimizes to tray
- **Configurable workspace** — Switch between workspaces from the UI
- **Chinese i18n** — Full Chinese localization for all UI text
- **Lightweight** — ~60MB packaged, no background services

## Install

### Download

Download the latest installer from [Releases](https://github.com/qintaiyang/OpenCode-Go-Usage-/releases).

### Build from source

```bash
npm install
npm run build:win     # Windows NSIS installer
```

## Usage

### First-time setup

1. Launch the app. Click **Login**.
2. Click **Open OpenCode** — this opens `https://opencode.ai/workspace/<id>/go` in your browser.
3. Sign in with your account (Google OAuth).
4. Press F12 → **Application** tab → **Cookies** → `https://opencode.ai`.
5. Find the cookie named **auth**, copy its **Value** (starts with `Fe26.2**...`).
6. Paste the value into the app's login panel and click **Save Cookie**.

> Your workspace ID is auto-detected. If you need to switch workspaces, edit the Workspace ID field in the login panel and click **Save Account**.

### Multiple accounts

1. Click **New** in the footer to open a blank account editor.
2. Enter a name, workspace ID, and paste the auth cookie.
3. Click **Save Cookie** — a new account is created and becomes active.
4. Use the account menu button (left of status pill) to switch between accounts.

### API Keys

1. Click **Keys** button (right of account menu) to open the API Key overlay.
2. View masked keys in the list. Click **Copy** to copy a key to clipboard (main process, never exposed to renderer).
3. Create/Delete are disabled until the POST seroval encoding is verified.

### Daily use

- **Refresh** — Click the Refresh button or right-click the tray icon → Refresh Usage
- **Hide to tray** — Click × or close the window
- **Open config folder** — Click Config to find `config.json`

## Configuration

Configuration is stored at `%APPDATA%\opencode-go\config.json` (v1.1.0 multi-account format):

```json
{
  "activeAccountId": "acc_20260531_ab12cd34",
  "accounts": [
    {
      "id": "acc_20260531_ab12cd34",
      "name": "Main",
      "workspaceId": "wrk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "auth": "Fe26.2**...",
      "createdAt": "2026-05-31T00:00:00.000Z",
      "updatedAt": "2026-05-31T00:00:00.000Z"
    }
  ]
}
```

Legacy single-account config (`{ "auth": "...", "workspace_id": "..." }`) is auto-migrated on first launch.

You can also set environment variables:

```bash
set OPENCODE_AUTH=Fe26.2**...
set OPENCODE_WORKSPACE_ID=wrk_...
```

## CLI Tools

The `scripts/` directory contains standalone CLI tools (Node.js 18+):

```bash
# Fetch usage from command line
node scripts/fetch-usage-cli.js

# Pass auth as argument
node scripts/fetch-usage-cli.js "Fe26.2**..." [workspace-id]

# Verify runtime config and accounts
npm run check:accounts

# Verify runtime usage fetch
npm run check:usage:runtime

# List API Keys for active account
npm run check:api-keys
```

## How It Works

OpenCode uses a custom seroval-based API protocol over standard HTTP. The app:

1. Sends a `GET /_server` request with the function hash and seroval-encoded arguments
2. Parses the seroval response to extract usage summaries and details
3. Displays the data in the glass-morphism UI

No browser automation, no Puppeteer, no headless Chrome.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 42 |
| UI | HTML + CSS (iOS glassmorphism) |
| IPC | contextBridge + ipcRenderer |
| API | HTTP fetch (Node 18+ native) |
| Auth | Manual cookie paste (HttpOnly) |
| i18n | Built-in Chinese localization |

## Security

- Full auth cookies and API Keys are owned by the Electron main process
- Renderer only receives masked previews (`Fe26.2**...xxxx`, `sk-...xxxx`)
- API Key copy is a one-shot main-process clipboard action
- No full secrets are logged or persisted in the UI
- New account flow never allows deleting the active account

## License

MIT © 2026 qintaiyang
