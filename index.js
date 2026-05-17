#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = process.env.LOGLY_API_BASE || "https://app.logly.uk";

async function loglyApi(path, params) {
  const key = process.env.LOGLY_API_KEY;
  if (!key) {
    throw new Error(
      "LOGLY_API_KEY is not set. Create one in Logly → Settings → API keys."
    );
  }
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Logly API ${res.status} on ${path}: ${text.slice(0, 300)}`);
  }
  return text;
}

// Common date filter: explicit from/to wins, otherwise a days window (default 30).
function range({ days, from, to }) {
  if (from || to) return { from, to };
  return { days: days ?? 30 };
}

const server = new McpServer({ name: "logly", version: "1.0.0" });

function tool(name, description, shape, fn) {
  server.tool(name, description, shape, async (args) => {
    try {
      return { content: [{ type: "text", text: await fn(args || {}) }] };
    } catch (e) {
      return { content: [{ type: "text", text: "Error: " + e.message }], isError: true };
    }
  });
}

const siteArg = z.string().describe("Logly site ID (slug). Call logly_list_sites to discover it.");
const daysArg = z.number().int().positive().optional()
  .describe("Days to look back: 7, 30 or 90. Defaults to 30. Ignored when 'from'/'to' are set.");
const fromArg = z.string().optional().describe("Range start, YYYY-MM-DD. Use together with 'to'.");
const toArg = z.string().optional().describe("Range end, YYYY-MM-DD. Use together with 'from'.");

tool(
  "logly_list_sites",
  "List every website in the authenticated Logly account with its site ID. Start here to find the site ID the other tools need.",
  {},
  () => loglyApi("/api/sites")
);

tool(
  "logly_stats",
  "Traffic totals for a site — pageviews, sessions, visitors, bounce rate, average duration — plus a daily series and a comparison against the previous period.",
  { site: siteArg, days: daysArg, from: fromArg, to: toArg },
  ({ site, days, from, to }) =>
    loglyApi(`/api/sites/${encodeURIComponent(site)}/stats`, range({ days, from, to }))
);

tool(
  "logly_breakdown",
  "Top pages, top referrers, top countries and device/browser split for a site over the given period.",
  { site: siteArg, days: daysArg, from: fromArg, to: toArg },
  ({ site, days, from, to }) =>
    loglyApi(`/api/sites/${encodeURIComponent(site)}/breakdown`, range({ days, from, to }))
);

tool(
  "logly_realtime",
  "Visitors currently active on a site (real-time, the last few minutes).",
  { site: siteArg },
  ({ site }) => loglyApi(`/api/sites/${encodeURIComponent(site)}/active`)
);

tool(
  "logly_events",
  "Custom event counts for a site (events sent via logly('event', ...)) over the given period.",
  { site: siteArg, days: daysArg, from: fromArg, to: toArg },
  ({ site, days, from, to }) =>
    loglyApi(`/api/sites/${encodeURIComponent(site)}/events`, range({ days, from, to }))
);

tool(
  "logly_funnels",
  "List the conversion funnels defined for a site, with their IDs and step sequences.",
  { site: siteArg },
  ({ site }) => loglyApi(`/api/sites/${encodeURIComponent(site)}/funnels`)
);

tool(
  "logly_funnel_results",
  "Completion counts and drop-off per step for one conversion funnel.",
  { funnel_id: z.string().describe("Funnel ID, from logly_funnels."), days: daysArg },
  ({ funnel_id, days }) =>
    loglyApi(`/api/funnels/${encodeURIComponent(funnel_id)}/results`, { days: days ?? 30 })
);

tool(
  "logly_install_snippet",
  "Return the Logly tracking snippet for a site — the single <script> tag to add to the site's <head>. Works offline, no API call.",
  { site: siteArg },
  ({ site }) =>
    JSON.stringify(
      {
        site,
        snippet: `<script src="https://logly.uk/p.js?s=${site}" data-site="${site}" async></script>`,
        instructions:
          "Add this tag inside the <head> of every page. It is a single cookie-free tag — no other setup needed.",
      },
      null,
      2
    )
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Logly MCP server running on stdio");
