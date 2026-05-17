# Logly MCP server

Query your [Logly](https://logly.uk) web analytics from Claude, Cursor, or any
[Model Context Protocol](https://modelcontextprotocol.io) client.

Logly is privacy-first web analytics — under 1 KB, cookie-free, GDPR compliant by
design. This server exposes your analytics over MCP so an AI assistant can answer
questions like *"how did traffic change this week?"* or *"where is my signup
funnel losing people?"* — and even hand you the install snippet for a new site.

## Requirements

- Node.js 18 or newer
- A Logly account and an API key — create one in **Settings → API keys** in your
  [Logly dashboard](https://app.logly.uk). The key looks like `logly_a1b2c3...`
  and is shown only once.

## Setup

The server runs via `npx` — no install step needed.

### Claude Desktop

Edit `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "logly": {
      "command": "npx",
      "args": ["-y", "@logly-uk/mcp"],
      "env": { "LOGLY_API_KEY": "logly_your_key_here" }
    }
  }
}
```

Restart Claude Desktop.

### Claude Code

```bash
claude mcp add logly -e LOGLY_API_KEY=logly_your_key_here -- npx -y @logly-uk/mcp
```

### Cursor

Add to `.cursor/mcp.json` in your project (or the global one):

```json
{
  "mcpServers": {
    "logly": {
      "command": "npx",
      "args": ["-y", "@logly-uk/mcp"],
      "env": { "LOGLY_API_KEY": "logly_your_key_here" }
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `logly_list_sites` | List every site in your account with its site ID — start here. |
| `logly_stats` | Pageviews, sessions, visitors, bounce rate, avg duration, daily series, previous-period comparison. |
| `logly_breakdown` | Top pages, referrers, countries and device/browser split. |
| `logly_realtime` | Visitors active right now. |
| `logly_events` | Custom event counts. |
| `logly_funnels` | List a site's conversion funnels and their steps. |
| `logly_funnel_results` | Completion counts and drop-off per funnel step. |
| `logly_install_snippet` | The `<script>` tag to add Logly to a site's `<head>`. |

### Date filters

Stats tools accept a `days` window (7, 30 or 90 — defaults to 30) or an explicit
`from` / `to` pair (`YYYY-MM-DD`). If both are given, `from`/`to` wins.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `LOGLY_API_KEY` | yes | Your Logly API key. |
| `LOGLY_API_BASE` | no | Override the API base URL (default `https://app.logly.uk`). |

## Links

- Logly — <https://logly.uk>
- MCP server page — <https://logly.uk/mcp/>
- Public API reference — <https://logly.uk/docs>

MIT licensed.
