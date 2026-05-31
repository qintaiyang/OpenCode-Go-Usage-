# OpenCode Go Usage

**English** | [中文](README.zh-CN.md)

A lightweight desktop tray app that monitors your [OpenCode](https://opencode.ai) workspace usage — rolling, weekly, and monthly token quotas — without keeping a browser tab open.

Built with Electron, no official API required.

## Screenshot

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

## Features

- **Tray-based** — Runs in the system tray, no browser needed
- **Live usage data** — Rolling, weekly, monthly quota at a glance
- **Manual cookie login** — Sign in via your browser once, paste the auth cookie
- **Auto-hide to tray** — Close button minimizes to tray
- **Configurable workspace** — Switch between workspaces from the UI
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

> Your workspace ID is auto-detected. If you need to switch workspaces, edit the Workspace ID field in the login panel and click **Save Workspace**.

### Daily use

- **Refresh** — Click the Refresh button or right-click the tray icon → Refresh Usage
- **Hide to tray** — Click × or close the window
- **Open config folder** — Click Config to find `config.json` and log files

## Configuration

Configuration is stored at `%APPDATA%\opencode-go\config.json`:

```json
{
  "auth": "Fe26.2**...",
  "workspace_id": "wrk_..."
}
```

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

# Verify runtime config
npm run check:usage:runtime
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
| UI | HTML + CSS (glassmorphism) |
| IPC | contextBridge + ipcRenderer |
| API | HTTP fetch (Node 18+ native) |
| Auth | Manual cookie paste (HttpOnly) |

## License

MIT © 2026 qintaiyang
