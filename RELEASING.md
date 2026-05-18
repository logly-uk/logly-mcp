# Releasing

The version number stays in lockstep across four places:

- the npm package — `@logly-uk/mcp`
- the MCP registry entry — `io.github.logly-uk/logly-mcp`
- the MCPB bundle manifest — `manifest.json`
- the git tag — `vX.Y.Z`

## When NOT to bump the version

Repo housekeeping that doesn't change `index.js` — editing docs, the bundle
manifest, `.gitignore`, `server.json` metadata — does not change anything that
ships. Commit it plainly: **no version bump, no tag.** The published server is
unchanged, so the version must stay unchanged too. Bumping it would falsely
signal that the MCP server changed.

## When to bump

Any change to `index.js` (the server itself) — a new tool, a fix, a changed
description. Then run the full cycle below.

## Release cycle

1. Make the change in `index.js`.
2. Bump `version` in `package.json`.
3. Publish to npm:
   ```
   npm publish --access public
   ```
4. Set `version` in `manifest.json` to the same number.
5. In `server.json`, update **both** the top-level `version` and
   `packages[0].version`.
6. Rebuild the MCPB bundle (see below).
7. Publish to the MCP registry:
   ```
   mcp-publisher login github   # only if the token has expired
   mcp-publisher publish
   ```
8. Commit, tag, push:
   ```
   git add -A
   git commit -m "vX.Y.Z: <summary>"
   git tag vX.Y.Z
   git push --follow-tags
   ```
9. Create or update the GitHub release for the tag and attach `logly.mcpb`.

## Building the MCPB bundle

The bundle must be self-contained (manifest + server + `node_modules`), so build
it in a clean directory — never pack the repo directly (it would include
`.git`, `server.json`, etc.). Run from the repo root:

```
rm -rf /tmp/logly-mcpb && mkdir /tmp/logly-mcpb
cp manifest.json index.js package.json /tmp/logly-mcpb/
( cd /tmp/logly-mcpb && npm install --omit=dev )
npx @anthropic-ai/mcpb pack /tmp/logly-mcpb logly.mcpb
```

`logly.mcpb` is a build artifact — it is gitignored and never committed. It is
distributed only by attaching it to the GitHub release.

## Notes

- `manifest.json`, `server.json` and this file are **not** part of the npm
  package — `files` in `package.json` lists only `index.js` and `README.md`.
  They are repo/registry metadata.
- `mcp-publisher` is the CLI for the official MCP registry — install it from the
  releases of `github.com/modelcontextprotocol/registry`.
- The MCPB bundle is unsigned. Signing (`mcpb sign`) needs a certificate and is
  optional — Claude Desktop installs unsigned bundles.
- Claude Desktop (where the `.mcpb` one-click install applies) is Mac/Windows
  only; the bundle cannot be UX-tested on Linux. Verify structurally instead:
  `npx @anthropic-ai/mcpb unpack logly.mcpb /tmp/check && node /tmp/check/index.js`
  should print "Logly MCP server running on stdio".
