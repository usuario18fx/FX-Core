# FX Core × Nod — read-only local pilot

**Status: isolated pilot / not an autonomous FX-to-Nod control API.**

This creates a small **MCP server** in the FX-Core repository that **Nod can connect to**. Nod's documented direction is **Nod → external MCP tools**, not a public API for FX Core to command Nod. There is no reverse bridge or automatic execution hidden in this pilot.

## Capabilities

- One MCP tool: `fx_read_public_page`.
- Read-only GET of **only** three public pages, chosen by ID:
  - `nod_docs` → Nod's MCP integration documentation.
  - `fxcity` → public FXCity home page.
  - `fx_core_repo` → FX-Core's public GitHub page (if accessible).
- Returns a short page title and text excerpt, with a notice that website contents are **untrusted data**, not instructions.
- Separate local process, independent of FX Voice, the existing FX gateway, FXCity and any private accounts.
- Authenticated with a local 32+ character bearer token. Port binds only to `127.0.0.1`, not your network.
- **No arbitrary URLs, logins, browser sessions, writes, file or shell access, uploads, deployments, or account actions.**

Nod itself can browse public websites in its own isolated browser if you ask it to. This pilot's MCP tool does a fixed public HTTP page read, not desktop-control automation.

## Requirements

- Node.js 24+ to run the pilot. No npm dependencies required for the bridge.
- Nod desktop when connecting it to the bridge. Nod currently documents **Windows 11 x64** for desktop setup; local assistant also needs WSL 2, virtualization and disk space. If using Windows 10, **do not assume the Nod installer is supported**. The bridge can still run without Nod.
- Official documentation: https://nod.n8n.io/docs/connect/mcp-api-cli/ and https://nod.n8n.io/docs/get-started/install-desktop/

## Running the local bridge (PowerShell)

From your FX-Core checkout:

```powershell
cd C:\Projects\FX-Core\FX
# Run with the new Git branch, or bring the pilot in after review:
git fetch origin feature/fx-core-nod-readonly-mcp-pilot-20261125
git switch feature/fx-core-nod-readonly-mcp-pilot-20261125

# Random 64-hex secret. Keep it private. Do not commit it.
$bytes = New-Object byte[] 32
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
$env:FX_NOD_MCP_TOKEN = [BitConverter]::ToString($bytes).Replace("-", "").ToLowerInvariant()
Remove-Variable bytes

node nod-pilot/server.mjs
```

This command starts the bridge at `http://127.0.0.1:4321/mcp`, bound to loopback only. Keep that terminal open while testing.

To open Nod's connection dialog: **Apps → Connect MCP**. Enter the URL manually and choose **access token**. The access token is the value stored in `FX_NOD_MCP_TOKEN` in your PowerShell session. Never paste it into chat or a commit.

**Important:** Nod's computer use and external AI provider setup remain separate choices; they are not enabled by this MCP bridge.

## Test request in Nod

Ask Nod:

> Use the connected FX Core read-only tool to inspect the public Nod MCP documentation. Report the page title and summarize the connection instructions. Do not sign in, submit forms, change anything or access private files.

Nod should select `fx_read_public_page` with `pageId=nod_docs`, then return a short public page excerpt.

## Self-test (without Nod)

```powershell
node --test nod-pilot/server.test.mjs
```

The tests check authentication, MCP initialization, the one-tool allowlist, browser-origin rejection and refusal of arbitrary URLs/write requests. The tests never contact a live website and never mutate local data.

## Security boundaries

The MCP tool's read-only hint is **not** the security boundary; the server enforces the exact page-ID allowlist. All external page contents must be treated as untrusted. The bridge never handles credentials, cookies, filesystem data or private tabs. It refuses redirects and blocks non-HTML/plaintext responses. The local listener should not be opened to the internet.

If broader FX-to-Nod orchestration is wanted, first obtain an officially documented authenticated task submission interface or add an explicitly permissioned protocol with end-to-end tests. **Do not call Nod's internal undocumented endpoints.**
